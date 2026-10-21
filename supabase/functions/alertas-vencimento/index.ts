import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Restrict to internal/cron callers: require service-role or matching CRON_SECRET header.
    const authHeader = req.headers.get("Authorization") ?? "";
    const cronSecret = req.headers.get("x-cron-secret") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const expectedCron = Deno.env.get("CRON_SECRET") ?? "";
    const isServiceRole = authHeader === `Bearer ${serviceKey}`;
    const isCron = expectedCron.length > 0 && cronSecret === expectedCron;
    if (!isServiceRole && !isCron) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, serviceKey);

    const hoje = new Date();
    const em30dias = new Date(hoje.getTime() + 30 * 86400000).toISOString().split("T")[0];
    const hojeStr = hoje.toISOString().split("T")[0];

    // Cache de empresa por usuario (evita 1 query por documento vencido)
    const empresaCache: Record<string, string> = {};
    const getEmpresaId = async (userId: string) => {
      if (empresaCache[userId]) return empresaCache[userId];
      const { data } = await supabase
        .from("empresas")
        .select("id")
        .eq("user_id", userId)
        .limit(1)
        .maybeSingle();
      if (data) {
        empresaCache[userId] = data.id;
        return data.id;
      }
      return null;
    };

    // 1. Calibrações vencidas ou próximas de vencer
    const { data: calibracoes } = await supabase
      .from("calibracoes")
      .select("equipamento, codigo, proxima_calibracao, user_id")
      .lte("proxima_calibracao", em30dias)
      .not("proxima_calibracao", "is", null);

    // 2. Documentos com revisão vencida ou próxima
    const { data: documentos } = await supabase
      .from("documentos")
      .select("codigo, nome, proxima_revisao, validade_revisao, user_id, empresa_id")
      .or(`proxima_revisao.lte.${em30dias},validade_revisao.lte.${hojeStr}`);

    // 3. Treinamentos (using planejamento_anual as proxy for scheduled training)
    const { data: planejamento } = await supabase
      .from("planejamento_anual")
      .select("atividade, proxima_execucao, categoria, user_id")
      .eq("categoria", "treinamento")
      .lte("proxima_execucao", em30dias)
      .not("proxima_execucao", "is", null);

    // Group alerts by user
    const alertasPorUsuario: Record<string, { calibracoes: any[]; documentos: any[]; treinamentos: any[] }> = {};

    const addAlert = (userId: string, tipo: string, item: any) => {
      if (!alertasPorUsuario[userId]) alertasPorUsuario[userId] = { calibracoes: [], documentos: [], treinamentos: [] };
      (alertasPorUsuario[userId] as any)[tipo].push(item);
    };

    calibracoes?.forEach((c) => addAlert(c.user_id, "calibracoes", c));
    documentos?.forEach((d) => addAlert(d.user_id, "documentos", d));
    planejamento?.forEach((p) => addAlert(p.user_id, "treinamentos", p));

    const totalAlertas = Object.values(alertasPorUsuario).reduce(
      (acc, u) => acc + u.calibracoes.length + u.documentos.length + u.treinamentos.length,
      0,
    );

    // Store alerts summary for dashboard consumption
    for (const [userId, alertas] of Object.entries(alertasPorUsuario)) {
      const resumo = [];
      if (alertas.calibracoes.length > 0) {
        resumo.push(`${alertas.calibracoes.length} calibração(ões) vencida(s) ou próxima(s) de vencer`);
      }
      if (alertas.documentos.length > 0) {
        resumo.push(`${alertas.documentos.length} documento(s) com revisão pendente`);
      }
      if (alertas.treinamentos.length > 0) {
        resumo.push(`${alertas.treinamentos.length} treinamento(s) programado(s)`);
      }

      // Notificacao WhatsApp do resumo de vencimentos (via evolution-connect)
      if (resumo.length > 0) {
        const { data: config } = await supabase
          .from("whatsapp_config")
          .select("id, empresa_id")
          .eq("user_id", userId)
          .maybeSingle();

        if (config) {
          try {
            const msg = `*⚠️ Alerta de Vencimento FeedBPF*\n\nOlá! Identificamos pendências que requerem sua atenção:\n\n${resumo.map(m => `• ${m}`).join("\n")}\n\nPor favor, acesse o painel para regularizar.`;

            await fetch(`${Deno.env.get("SUPABASE_URL")}/functions/v1/evolution-connect`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${serviceKey}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                empresa_id: config.empresa_id,
                action: "send",
                message: msg,
              }),
            });
            console.log(`WhatsApp enviado para usuário ${userId}`);
          } catch (e) {
            console.error(`Erro ao enviar WhatsApp para ${userId}:`, e.message);
          }
        }
      }

      // Create legislacao_alertas entries for dashboard visibility
      for (const msg of resumo) {
        await supabase.from("legislacao_alertas").insert({
          user_id: userId,
          titulo: `⚠️ Alerta de Vencimento`,
          resumo: msg,
          tipo: "vencimento",
          relevancia: "alta",
          fonte: "Sistema FeedBPF",
        });
      }

      // Auto-gerar Não Conformidade para documentos vencidos ou prestes a vencer.
      // Uma NC por documento (sem duplicar) e na empresa do próprio documento.
      const docsVencidos = alertas.documentos.filter(
        (d) =>
          (d.proxima_revisao && d.proxima_revisao <= hojeStr) || (d.validade_revisao && d.validade_revisao <= hojeStr),
      );

      for (const doc of docsVencidos) {
        const docEmpresaId = doc.empresa_id ?? (await getEmpresaId(userId));
        if (!docEmpresaId) continue;

        const descricao = `[AUTO] Documento ${doc.codigo} - ${doc.nome} está com a revisão/validade vencida.`;

        // Evita duplicar: só cria se não houver NC aberta para o mesmo documento nesta empresa
        const { data: ncExistente } = await supabase
          .from("nao_conformidades")
          .select("id")
          .eq("empresa_id", docEmpresaId)
          .eq("descricao", descricao)
          .not("status", "in", "(fechada,encerrada,concluida,cancelada)")
          .limit(1)
          .maybeSingle();
        if (ncExistente) continue;

        await supabase.from("nao_conformidades").insert({
          user_id: userId,
          empresa_id: docEmpresaId,
          data: hojeStr,
          setor: "Administrativo/Qualidade",
          descricao,
          causa: "Vencimento do prazo de revisão anual obrigatória.",
          acao_corretiva: "Revisar o documento, atualizar versão e salvar no sistema.",
          responsavel: "RT / Responsável pela Qualidade",
          prazo: em30dias,
          status: "aberta",
        });
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        usuarios_alertados: Object.keys(alertasPorUsuario).length,
        total_alertas: totalAlertas,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
