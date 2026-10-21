import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAiResponse } from "../_shared/ai-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const bodyText = await req.text();
    const bodyJson = JSON.parse(bodyText);
    const { action, termo, categoria } = bodyJson;

    let systemPrompt = "";
    let userPrompt = "";

    if (action === "buscar_atualizacoes") {
      systemPrompt = `Você é um especialista em legislação brasileira EXCLUSIVAMENTE da área de ALIMENTAÇÃO ANIMAL (nutrição animal, fabricação de rações, suplementos, premix, núcleos e ingredientes para alimentação animal). Seu foco é SOMENTE nas normas do MAPA (Ministério da Agricultura e Pecuária). NÃO inclua legislação sobre alimentação humana.
      IMPORTANTE: Responda SEMPRE em formato JSON válido com a estrutura: {"alertas": [{"titulo": "", "resumo": "", "fonte": "", "tipo": "atualizacao|nova_norma|revogacao|alerta", "relevancia": "alta|media|baixa", "data_aproximada": "YYYY-MM-DD"}], "resumo_geral": ""}`;
      userPrompt = `Gere um relatório atualizado e rigoroso sobre a legislação brasileira de ALIMENTAÇÃO ANIMAL do MAPA (referente a 2024-2026). Foque em normas que impactam fábricas de ração (BPF, rotulagem, aditivos, registro de estabelecimentos). Liste de 4 a 8 alertas reais ou atualizações recentes. Responda APENAS com o JSON, sem markdown.`;
    } else if (action === "resumo_sistema") {
      systemPrompt = `Você é um consultor especialista em BPF para fábricas de ração animal. Analise a conformidade técnica. Responda SEMPRE em formato JSON com a estrutura: {"modulos_implementados": [{"modulo": "", "descricao": "", "status": "conforme|atencao"}], "resumo_executivo": "", "recomendacoes": [""]}`;
      userPrompt = `O sistema FeedBPF implementa módulos de Cadastro, Qualificação, Documentos e Auditoria. Avalie a conformidade com a IN 04/2007 e Decreto 12.031/2024. Responda APENAS com JSON.`;
    } else if (action === "pesquisar_legislacao") {
      const termoBusca = termo || "alimentação animal";
      const categoriaBusca = categoria || "todas";
      systemPrompt = `Você é um especialista em legislação de ALIMENTAÇÃO ANIMAL do MAPA. Responda em JSON com a estrutura: {"resultados": [{"titulo": "", "codigo": "", "tipo": "", "orgao": "MAPA", "data_publicacao": "", "resumo": "", "status": "vigente|revogada", "link_referencia": ""}], "resumo_pesquisa": ""}`;
      userPrompt = `Pesquise no acervo do MAPA sobre: "${termoBusca}", Categoria "${categoriaBusca}". Liste resultados relevantes para fábricas de ração. Responda APENAS com o JSON.`;
    } else {
      throw new Error("Ação inválida");
    }

    const response = await getAiResponse({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI service error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      // Limpeza mais robusta de blocos de código markdown
      const cleaned = content.replace(/```json\n?|```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);

      // Normalização para garantir que alertas seja um array
      if (action === "buscar_atualizacoes" && !Array.isArray(parsed.alertas)) {
        parsed.alertas = [];
      }
      if (action === "pesquisar_legislacao" && !Array.isArray(parsed.resultados)) {
        parsed.resultados = [];
      }
    } catch (parseError) {
      console.error("Erro ao parsear JSON da IA:", parseError, content);
      // Fallback para evitar erro de crash no frontend
      if (action === "buscar_atualizacoes") parsed = { alertas: [], resumo_geral: "Erro ao processar resposta da IA." };
      else if (action === "pesquisar_legislacao") parsed = { resultados: [], resumo_pesquisa: "Erro ao processar resultados." };
      else parsed = { error: "Formato de resposta inválido" };
    }

    return new Response(JSON.stringify({ success: true, data: parsed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });


  } catch (e) {
    console.error("legislacao-ai error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});