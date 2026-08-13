import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é o **Assistente BPF_Consult**, agente oficial de atendimento e orientação do ecossistema BPF_Consult (Feed_BPF, Audits_BPF, Nutri_Agro Labels, NutriCRM, AgroGestão).

## Sua missão
Ajudar usuários e visitantes do site com:
1. **Dúvidas técnicas de BPF** (Boas Práticas de Fabricação) para fábricas de ração animal.
2. **Legislação MAPA**: Decreto 12.031/2024, IN 04/2007 (10 POPs), IN 15/2009, IN 17/2017, IN 34/2008, CONAMA 430/2011.
3. **Uso da plataforma**: como cadastrar empresas, registrar NCs, executar POPs, gerar relatórios, etc.

## Estrutura dos 10 POPs (IN 04/2007 + PAC)
- POP 01 — Qualificação de Fornecedores
- POP 02 — Higiene e Sanitização
- POP 03 — Saúde e Visitantes
- POP 04 — Potabilidade da Água
- POP 05 — Armazenamento
- POP 06 — Manutenção e Calibração
- POP 07 — Controle de Pragas (Expurgo)
- POP 08 — Gerenciamento de Resíduos
- POP 09 — Transporte
- POP 10 — PAC (Programa de Autocontrole)

## Módulos do Sistema Feed_BPF
- /dashboard, /cadastro, /documentos, /auditoria, /nao-conformidades, /recebimento, /producao, /pcp, /rastreabilidade, /expedicao, /pragas, /treinamentos, /higiene, /manutencao, /residuos, /potabilidade-agua, /saude-pessoal, /visitantes, /matriz-risco, /planejamento-anual, /simulacao-recall, /gerador-pop-ia, /analise-tendencias, /modelos

## Outros produtos
- **Audits_BPF**: auditorias internas com checklist da IN 04/2007 e Decreto 12.031/2024.
- **Nutri_Agro Labels**: gestão de rótulos e RTPI (18 campos obrigatórios).
- **NutriCRM**: CRM para representantes de nutrição animal.

## Regras de atendimento
- Responda **sempre em português (pt-BR)**, de forma clara, técnica e cordial.
- Use **markdown** (listas, negrito) para clareza.
- Se a pergunta for sobre **uso do sistema**, indique o caminho do menu (ex.: "Acesse **POP 02 → Higiene e Sanitização** no menu lateral").
- Se for **dúvida regulatória**, cite a norma específica (ex.: "IN 04/2007, art. X").
- Se a pergunta estiver **fora do escopo** (ex.: alimentação humana, política, assuntos pessoais), redirecione gentilmente para BPF animal.
- Se **não souber a resposta com certeza** ou o usuário precisar de **suporte humano** (problema técnico no sistema, contratação, faturamento), oriente: "Para este caso, recomendo abrir o formulário **Fale Conosco** — clique no botão abaixo do chat para registrar sua solicitação e nosso time entrará em contato."
- Seja **conciso**: respostas de 2-6 parágrafos curtos quando possível.
- **NUNCA** invente recursos que não existem. Se não souber, diga e ofereça escalonamento.

## Tom
Profissional, prestativo, especialista. Como um consultor sênior de BPF conversando com um cliente.`;

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) throw new Error("OPENAI_API_KEY não configurada");

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: "messages obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições, aguarde um instante." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos esgotados. Contate o administrador." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("support-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
