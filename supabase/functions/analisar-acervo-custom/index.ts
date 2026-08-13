import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface DocInput {
  nome: string;
  descricao: string;
  criticidade: string;
}
interface PopInput {
  codigo: string;
  nome: string;
  documentos: DocInput[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { empresa_id, obrigatorios } = await req.json() as { empresa_id: string; obrigatorios: PopInput[] };
    if (!empresa_id) throw new Error("empresa_id obrigatório");

    const authHeader = req.headers.get("Authorization") || "";
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    // 1. Coleta o acervo (respeita RLS do usuário)
    const { data: docs, error: docsErr } = await supabase
      .from("documentos_bpf")
      .select("titulo, tipo, pop_codigo, arquivo_nome, data_documento")
      .eq("empresa_id", empresa_id);
    if (docsErr) throw docsErr;

    const { data: modelos } = await supabase
      .from("modelos_empresa")
      .select("nome, pop_codigo")
      .eq("empresa_id", empresa_id)
      .eq("ativo", true);

    const acervoResumo = (docs || []).map(d => ({
      titulo: d.titulo,
      arquivo: d.arquivo_nome,
      pop: d.pop_codigo || "sem-pop",
      data: d.data_documento,
    }));

    const modelosResumo = (modelos || []).map(m => ({ nome: m.nome, pop: m.pop_codigo || "sem-pop" }));

    // 2. Monta o prompt para o Lovable AI Gateway
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY ausente");

    const systemPrompt = `Você é um auditor BPF (Boas Práticas de Fabricação) especialista em nutrição animal, IN MAPA 04/2007 e Decreto 12.031/2024.
Sua tarefa: analisar o ACERVO DOCUMENTAL de uma fábrica e apontar o que está OK, o que FALTA e o que precisa de ATENÇÃO.
Baseie-se estritamente na lista de documentos obrigatórios fornecida.
Responda SEMPRE em JSON válido no formato exato abaixo, sem markdown, sem texto adicional.`;

    const userPrompt = `LISTA DE DOCUMENTOS OBRIGATÓRIOS POR POP:
${JSON.stringify(obrigatorios, null, 2)}

ACERVO ATUAL DA EMPRESA (${acervoResumo.length} arquivos importados):
${JSON.stringify(acervoResumo, null, 2)}

MODELOS DIGITAIS JÁ CRIADOS (${modelosResumo.length}):
${JSON.stringify(modelosResumo, null, 2)}

Analise correspondência por similaridade semântica de nome/título — não exija match exato.
Retorne JSON:
{
  "resumo_geral": { "score_conformidade": 0-100, "total_obrigatorios_essenciais": N, "atendidos_essenciais": N, "parecer": "string curta com diagnóstico" },
  "por_pop": [
    {
      "codigo": "POP-XX",
      "nome": "...",
      "score": 0-100,
      "atendidos": ["nome do obrigatório coberto"],
      "faltando": ["nome do obrigatório sem cobertura"],
      "observacao": "1 frase — o que priorizar"
    }
  ],
  "recomendacoes_prioritarias": ["ação 1", "ação 2", "ação 3"]
}`;

    const aiResp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (aiResp.status === 429) {
      return new Response(JSON.stringify({ error: "Limite de uso da IA atingido. Tente em alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (aiResp.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA insuficientes. Contate o admin." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    if (!aiResp.ok) {
      const errTxt = await aiResp.text();
      throw new Error(`AI gateway error ${aiResp.status}: ${errTxt.slice(0, 300)}`);
    }

    const aiJson = await aiResp.json();
    const content = aiJson.choices?.[0]?.message?.content;
    if (!content) throw new Error("Resposta vazia da IA");

    let analise: unknown;
    try { analise = JSON.parse(content); }
    catch { throw new Error("IA retornou JSON inválido"); }

    return new Response(JSON.stringify({
      analise,
      stats: { total_documentos: acervoResumo.length, total_modelos: modelosResumo.length },
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    const msg = err instanceof Error ? err.message : "Erro desconhecido";
    console.error("[analisar-acervo-custom]", msg);
    return new Response(JSON.stringify({ error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
