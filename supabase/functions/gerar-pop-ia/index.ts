import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getAiResponse } from "../_shared/ai-helper.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth: exigir usuário autenticado
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const supabaseAuth = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claimsData, error: claimsErr } = await supabaseAuth.auth.getClaims(authHeader.replace("Bearer ", ""));
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { codigo_pop, nome_pop, especies, capacidade, equipamentos, observacoes } = await req.json();

    if (!codigo_pop || !nome_pop) {
      return new Response(JSON.stringify({ error: "Código e nome do POP são obrigatórios" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Você é um consultor sênior em BPF para fábricas de ração animal, especialista em IN 04/2007, IN 15/2009, Portaria SDA 798/2023 e Decreto 12.031/2024.

Gere um rascunho COMPLETO de POP (Procedimento Operacional Padrão) personalizado para a fábrica, seguindo a estrutura padrão do MAPA.

CRITICAL: Os "Adendos do Cliente / RT" fornecidos no input têm prioridade absoluta sobre modelos genéricos. Se o usuário especificar um equipamento ou fluxo local, incorpore-o como a verdade operacional principal no procedimento.

Personalize o conteúdo de acordo com:
- Espécies-alvo (aves, suínos, bovinos, aquicultura, equinos, pets)
- Capacidade da fábrica (pequena <50t/dia, média 50-200t, grande >200t)
- Equipamentos disponíveis
- Adendos e Observações específicas (Prioridade Máxima)`;

    const userPrompt = `Gere o POP completo:

**Código:** ${codigo_pop}
**Nome:** ${nome_pop}
**Espécies-alvo:** ${especies || "não especificado"}
**Capacidade:** ${capacidade || "não especificado"}
**Equipamentos:** ${equipamentos || "padrão"}
**Observações/Adendos:** ${observacoes || "nenhuma"}`;

    const response = await getAiResponse({
      messages: [{ role: "user", content: userPrompt }],
      systemPrompt,
      tools: [
        {
          type: "function",
          function: {
            name: "gerar_pop",
            description: "Retorna um POP completo estruturado",
            parameters: {
              type: "object",
              properties: {
                objetivo: { type: "string" },
                campo_aplicacao: { type: "string" },
                documentos_referencia: { type: "array", items: { type: "string" } },
                definicoes: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { termo: { type: "string" }, definicao: { type: "string" } },
                    required: ["termo", "definicao"],
                  },
                },
                procedimentos: { type: "array", items: { type: "string" } },
                monitoramento: {
                  type: "object",
                  properties: {
                    controle: { type: "string" },
                    frequencia: { type: "string" },
                    registro: { type: "string" },
                    responsavel: { type: "string" },
                  },
                  required: ["controle", "frequencia", "registro", "responsavel"],
                },
                verificacao: {
                  type: "object",
                  properties: {
                    controle: { type: "string" },
                    frequencia: { type: "string" },
                    registro: { type: "string" },
                    responsavel: { type: "string" },
                  },
                  required: ["controle", "frequencia", "registro", "responsavel"],
                },
                acoes_corretivas: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: { nao_conformidade: { type: "string" }, acao: { type: "string" } },
                    required: ["nao_conformidade", "acao"],
                  },
                },
                tempo_retencao: { type: "string" },
              },
              required: [
                "objetivo",
                "campo_aplicacao",
                "documentos_referencia",
                "definicoes",
                "procedimentos",
                "monitoramento",
                "verificacao",
                "acoes_corretivas",
                "tempo_retencao",
              ],
            },
          },
        },
      ],
      toolChoice: { type: "function", function: { name: "gerar_pop" } },
    });

    if (!response.ok) {
      const t = await response.text();
      console.error("AI service error:", response.status, t);
      throw new Error("AI service error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error("No tool call in response");
    const result = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("gerar-pop-ia error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
