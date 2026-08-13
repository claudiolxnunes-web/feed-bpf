// Copiloto IA Comercial - analisa lead e sugere próximas ações
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { getAiResponse } from "../_shared/ai-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { lead_id, lead_origem, force_refresh } = await req.json();
    if (!lead_id) {
      return new Response(JSON.stringify({ error: "lead_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Cache: retorna se existe e < 6h e não é force_refresh
    if (!force_refresh) {
      const { data: cached } = await supabase
        .from("ai_lead_insights")
        .select("*")
        .eq("lead_id", lead_id)
        .maybeSingle();
      if (cached && new Date(cached.updated_at) > new Date(Date.now() - 6 * 3600_000)) {
        return new Response(JSON.stringify({ ok: true, insight: cached, cached: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Busca dados do lead
    const table = lead_origem === "site" ? "leads_contato" : "leads";
    const { data: lead } = await supabase.from(table).select("*").eq("id", lead_id).maybeSingle();
    if (!lead) {
      return new Response(JSON.stringify({ error: "Lead não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Busca histórico de interações
    const { data: pipeline } = await supabase
      .from("crm_pipeline")
      .select("etapa, valor_estimado, observacoes, created_at")
      .eq("lead_id", lead_id)
      .maybeSingle();

    const { data: interacoes } = await supabase
      .from("crm_interacoes")
      .select("tipo, descricao, created_at")
      .eq("lead_id", lead_id)
      .order("created_at", { ascending: false })
      .limit(10);

    // Monta prompt
    const contexto = {
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      produto: lead.produto_interesse || lead.programa,
      mensagem: lead.mensagem,
      etapa_atual: pipeline?.etapa || "novo",
      valor_estimado: pipeline?.valor_estimado,
      dias_desde_criacao: Math.floor((Date.now() - new Date(lead.created_at).getTime()) / 86400_000),
      interacoes_recentes: interacoes?.map((i) => `${i.tipo}: ${i.descricao}`).slice(0, 5) || [],
    };

    const systemPrompt = `Você é um SDR sênior especialista em SaaS B2B para agronegócio (BPF, MAPA, compliance).
Analise o lead e retorne EXCLUSIVAMENTE um JSON válido com esta estrutura:
{
  "temperatura": "frio" | "morno" | "quente" | "muito_quente",
  "score": 0-100,
  "resumo": "1-2 frases sobre o lead",
  "proxima_acao": "ação concreta e imediata (ex: 'Ligar hoje às 14h', 'Enviar case X')",
  "sinais_compra": ["sinal 1", "sinal 2"],
  "rascunho_whatsapp": "mensagem curta e personalizada (máx 300 chars)",
  "rascunho_email": "assunto: XXX\\n\\ncorpo do email personalizado"
}
Não inclua markdown, apenas JSON puro.`;

    const userPrompt = `Lead:\n${JSON.stringify(contexto, null, 2)}`;

    const aiRes = await getAiResponse({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      model: "google/gemini-2.5-flash",
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      return new Response(JSON.stringify({ error: "AI falhou", details: errText }), {
        status: aiRes.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiData = await aiRes.json();
    let content = aiData.choices?.[0]?.message?.content || "{}";
    content = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    let parsed: any;
    try {
      parsed = JSON.parse(content);
    } catch {
      parsed = { resumo: content, proxima_acao: "Revisar manualmente", temperatura: "morno", score: 50 };
    }

    // Upsert no cache
    const insightRow = {
      lead_id,
      lead_origem: lead_origem || "produto",
      temperatura: parsed.temperatura || "morno",
      score: parsed.score || 50,
      resumo: parsed.resumo,
      proxima_acao: parsed.proxima_acao,
      sinais_compra: parsed.sinais_compra || [],
      rascunho_whatsapp: parsed.rascunho_whatsapp,
      rascunho_email: parsed.rascunho_email,
      gerado_por: "gemini-2.5-flash",
      updated_at: new Date().toISOString(),
    };

    const { data: saved } = await supabase
      .from("ai_lead_insights")
      .upsert(insightRow, { onConflict: "lead_id" })
      .select()
      .single();

    return new Response(JSON.stringify({ ok: true, insight: saved, cached: false }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
