import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, paddle-signature",
};

/**
 * Verificação da assinatura do Paddle (Paddle Billing).
 * Header: `Paddle-Signature: ts=<unix>;h1=<hmac_sha256_hex>`
 * Payload assinado: `<ts>:<raw body>` com HMAC-SHA256 usando o webhook secret.
 * Docs: https://developer.paddle.com/webhooks/signature-verification
 */
async function hmacHex(secret: string, payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

const MAX_SKEW_SECONDS = 5 * 60;

async function verifyPaddleSignature(
  signatureHeader: string | null,
  rawBody: string,
): Promise<{ ok: boolean; reason?: string }> {
  if (!signatureHeader) return { ok: false, reason: "missing_signature" };

  let ts = "";
  let h1 = "";
  for (const part of signatureHeader.split(";")) {
    const [k, v] = part.split("=");
    if (k?.trim() === "ts") ts = v?.trim() ?? "";
    if (k?.trim() === "h1") h1 = v?.trim() ?? "";
  }
  if (!ts || !h1) return { ok: false, reason: "malformed_signature" };

  // Proteção contra replay
  const tsNumber = Number(ts);
  if (!Number.isFinite(tsNumber)) return { ok: false, reason: "invalid_timestamp" };
  const skew = Math.abs(Math.floor(Date.now() / 1000) - tsNumber);
  if (skew > MAX_SKEW_SECONDS) return { ok: false, reason: "timestamp_out_of_range" };

  const secrets = [
    Deno.env.get("PAYMENTS_LIVE_WEBHOOK_SECRET"),
    Deno.env.get("PAYMENTS_SANDBOX_WEBHOOK_SECRET"),
  ].filter((s): s is string => !!s && s.length > 0);

  if (secrets.length === 0) return { ok: false, reason: "no_webhook_secret_configured" };

  const payload = `${ts}:${rawBody}`;
  for (const secret of secrets) {
    const expected = await hmacHex(secret, payload);
    if (timingSafeEqual(expected, h1)) return { ok: true };
  }
  return { ok: false, reason: "signature_mismatch" };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // 1) Lê o corpo bruto (obrigatório: a assinatura cobre o texto exato recebido)
    const rawBody = await req.text();

    // 2) Verifica a assinatura ANTES de qualquer escrita no banco
    const verification = await verifyPaddleSignature(req.headers.get("paddle-signature"), rawBody);
    if (!verification.ok) {
      console.error("Paddle webhook rejeitado:", verification.reason);
      return new Response(JSON.stringify({ error: "Unauthorized", reason: verification.reason }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceKey);

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const eventType = body.event_type;
    const data = body.data ?? {};
    console.log("Paddle Webhook verificado:", eventType);

    if (
      eventType === "transaction.completed" ||
      eventType === "subscription.created" ||
      eventType === "subscription.updated"
    ) {
      const customData = data.custom_data || {};
      const userId = customData.user_id;
      const empresaId = customData.empresa_id;
      const produto = customData.produto;
      const plano = customData.plano;
      const nivel = customData.nivel || customData.tipo; // Suporta ambos os nomes de campo

      if (!userId || !produto) {
        console.error("Webhook missing custom_data fields:", { userId, produto, empresaId });
        return new Response(JSON.stringify({ error: "Missing metadata" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Calcular data de expiração
      const now = new Date();
      const expDate = new Date(now);
      if (plano === "mensal") expDate.setMonth(expDate.getMonth() + 1);
      else if (plano === "semestral") expDate.setMonth(expDate.getMonth() + 6);
      else if (plano === "anual") expDate.setFullYear(expDate.getFullYear() + 1);
      else expDate.setMonth(expDate.getMonth() + 1); // Default 1 mês

      // Update or insert license
      const { data: existing } = await adminClient
        .from("licencas")
        .select("id")
        .eq("user_id", userId)
        .eq("produto", produto)
        .eq("empresa_id", empresaId || null)
        .maybeSingle();

      const licenseData = {
        user_id: userId,
        empresa_id: empresaId || null,
        produto: produto,
        plano: plano,
        nivel: nivel,
        status: "ativa",
        data_inicio: now.toISOString().split("T")[0],
        data_expiracao: expDate.toISOString().split("T")[0],
        updated_at: new Date().toISOString(),
        // Guardar IDs do Paddle para referência futura
        stripe_subscription_id: data.subscription_id || null, // Reutilizando coluna por enquanto
        stripe_customer_id: data.customer_id || null,
      };

      if (existing) {
        await adminClient.from("licencas").update(licenseData).eq("id", existing.id);
      } else {
        await adminClient.from("licencas").insert({
          ...licenseData,
          chave_licenca: `PAD-${crypto.randomUUID().replace(/-/g, "").slice(0, 16).toUpperCase()}`,
        });
      }

      console.log(`License updated/created for user ${userId}, product ${produto}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Webhook Error:", (error as Error).message);
    return new Response(JSON.stringify({ error: (error as Error).message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
