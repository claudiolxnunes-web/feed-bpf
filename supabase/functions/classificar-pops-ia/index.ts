import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { getAiResponse } from "../_shared/ai-helper.ts";

interface ReqBody {
  arquivos: { id: string; nome: string }[];
  pops_disponiveis: { codigo: string; nome: string }[];
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");

    const { arquivos, pops_disponiveis }: ReqBody = await req.json();
    if (!Array.isArray(arquivos) || arquivos.length === 0) {
      return new Response(JSON.stringify({ error: "arquivos vazio" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const listaPops = pops_disponiveis.map(p => `${p.codigo} = ${p.nome}`).join("\n");
    const listaArquivos = arquivos.map(a => `- id:${a.id} | nome:${a.nome}`).join("\n");

    const systemPrompt = `Você é um especialista em BPF (Boas Práticas de Fabricação) de fábricas de ração animal, seguindo a IN 04/2007 e o Decreto 12.031/2024 do MAPA.
Sua tarefa: analisar nomes de arquivos e classificar cada um no POP obrigatório correspondente.

POPs disponíveis para esta empresa (SÓ pode usar códigos desta lista):
${listaPops}

Regras:
- Retorne apenas JSON puro, sem markdown.
- Formato: {"sugestoes":[{"id":"i-1","pop":"POP-02","confianca":"alta|media|baixa","motivo":"texto curto"}]}
- Se não conseguir classificar com segurança, use pop:"" e confianca:"baixa".
- Nunca invente códigos fora da lista acima.`;

    const userPrompt = `Classifique os seguintes arquivos:\n${listaArquivos}`;

    const resp = await getAiResponse({
      systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
      model: "google/gemini-2.5-flash",
      responseFormat: { type: "json_object" },
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error("Gateway erro:", resp.status, txt);
      return new Response(JSON.stringify({ error: `Gateway ${resp.status}`, details: txt }), {
        status: resp.status === 429 || resp.status === 402 ? resp.status : 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const raw = data?.choices?.[0]?.message?.content || "{}";
    let parsed: any = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { sugestoes: [] }; }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("classificar-pops-ia erro:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
