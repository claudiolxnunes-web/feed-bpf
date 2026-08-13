
export async function getAiResponse({
  messages,
  systemPrompt,
  tools,
  toolChoice,
  model = "openai/gpt-4o",
}: {
  messages: any[];
  systemPrompt?: string;
  tools?: any[];
  toolChoice?: any;
  model?: string;
}) {
  const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");

  const fullMessages = systemPrompt 
    ? [{ role: "system", content: systemPrompt }, ...messages]
    : messages;

  // 1. Prioridade: OpenAI (BYOK)
  if (OPENAI_API_KEY) {
    console.log("Usando OpenAI (BYOK)");
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model.includes("/") ? model : "openai/gpt-4o",
        messages: fullMessages,
        tools,
        tool_choice: toolChoice,
      }),
    });
    if (resp.ok) return resp;
    console.error("Erro na OpenAI API:", await resp.text());
  }

  // 2. Segunda opção: Gemini (BYOK)
  if (GEMINI_API_KEY) {
    console.log("Usando Gemini (BYOK)");
    // Nota: O endpoint do Gemini pode variar dependendo da versão, aqui usamos o compatível com OpenAI se disponível ou o nativo.
    // Para simplificar e garantir funcionamento, usamos o gateway do Google AI Studio se possível ou o formato OpenAI-compatible.
    const resp = await fetch(`https://generativelanguage.googleapis.com/v1beta/openai/chat/completions`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: fullMessages,
        tools,
        tool_choice: toolChoice,
      }),
    });
    if (resp.ok) return resp;
    console.error("Erro na Gemini API:", await resp.text());
  }

  throw new Error("Nenhuma chave de API de IA configurada.");
}
