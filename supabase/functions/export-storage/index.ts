// Edge Function: export-storage
// Lista todos os buckets e gera URLs assinadas para download em massa.
//
// Segurança:
// - Token APENAS via header `x-export-token` (nunca query string: vaza em logs/Referer).
// - CORS restrito à origem definida em STORAGE_EXPORT_ORIGIN (sem a variável, CORS é negado).
// - Comparação do token em tempo constante (evita timing attacks).
// - Auditoria: toda chamada autorizada e todo 401 são logados com IP e timestamp.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const SIGNED_URL_TTL = 60 * 60; // 1 hora
const LIST_PAGE_SIZE = 1000;

/** Origem permitida; se ausente, o CORS é negado explicitamente. */
function allowedOrigin(): string | null {
  const origin = Deno.env.get("STORAGE_EXPORT_ORIGIN");
  return origin && origin.trim() !== "" ? origin.trim() : null;
}

function buildCorsHeaders(): Record<string, string> {
  const origin = allowedOrigin();
  const base: Record<string, string> = {
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, x-export-token",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    Vary: "Origin",
  };
  // Sem STORAGE_EXPORT_ORIGIN configurada, nenhuma origem é liberada.
  if (origin) base["Access-Control-Allow-Origin"] = origin;
  return base;
}

/** Comparação de tempo constante entre duas strings. */
function timingSafeEqual(a: string, b: string): boolean {
  const enc = new TextEncoder();
  const ab = enc.encode(a);
  const bb = enc.encode(b);
  // Comprimentos diferentes ainda percorrem o mesmo laço.
  const len = Math.max(ab.length, bb.length);
  let diff = ab.length ^ bb.length;
  for (let i = 0; i < len; i++) {
    diff |= (ab[i] ?? 0) ^ (bb[i] ?? 0);
  }
  return diff === 0;
}

function clientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

function audit(
  outcome: "authorized" | "denied",
  req: Request,
  detail?: string,
) {
  const entry = {
    fn: "export-storage",
    outcome,
    ip: clientIp(req),
    origin: req.headers.get("origin") ?? null,
    user_agent: req.headers.get("user-agent") ?? null,
    method: req.method,
    timestamp: new Date().toISOString(),
    detail: detail ?? null,
  };
  if (outcome === "authorized") {
    console.log("[export-storage][AUDIT]", JSON.stringify(entry));
  } else {
    console.warn("[export-storage][AUDIT]", JSON.stringify(entry));
  }
}

async function listBucketRecursive(
  supabase: ReturnType<typeof createClient>,
  bucket: string,
  prefix = "",
): Promise<string[]> {
  const files: string[] = [];
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, {
      limit: LIST_PAGE_SIZE,
      offset,
      sortBy: { column: "name", order: "asc" },
    });
    if (error) throw new Error(`list ${bucket}/${prefix}: ${error.message}`);
    if (!data || data.length === 0) break;

    for (const item of data) {
      // Folder = item sem metadata (id null)
      if (item.id === null) {
        const sub = prefix ? `${prefix}/${item.name}` : item.name;
        const nested = await listBucketRecursive(supabase, bucket, sub);
        files.push(...nested);
      } else {
        files.push(prefix ? `${prefix}/${item.name}` : item.name);
      }
    }
    if (data.length < LIST_PAGE_SIZE) break;
    offset += LIST_PAGE_SIZE;
  }
  return files;
}

Deno.serve(async (req) => {
  const corsHeaders = buildCorsHeaders();
  const jsonHeaders = { ...corsHeaders, "Content-Type": "application/json" };

  if (req.method === "OPTIONS") {
    if (!allowedOrigin()) {
      audit("denied", req, "CORS negado: STORAGE_EXPORT_ORIGIN não configurada");
      return new Response("cors_denied", { status: 403, headers: corsHeaders });
    }
    return new Response("ok", { headers: corsHeaders });
  }

  const expected = Deno.env.get("STORAGE_EXPORT_TOKEN");
  // Token exclusivamente via header — query string é proibida por vazar em logs.
  const provided = req.headers.get("x-export-token");

  const authorized =
    !!expected && !!provided && timingSafeEqual(provided, expected);

  if (!authorized) {
    audit(
      "denied",
      req,
      !expected
        ? "STORAGE_EXPORT_TOKEN ausente no ambiente"
        : provided
        ? "token inválido"
        : "header x-export-token ausente",
    );
    return new Response(JSON.stringify({ error: "unauthorized" }), {
      status: 401,
      headers: jsonHeaders,
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    const url = new URL(req.url);
    const onlyBucket = url.searchParams.get("bucket");

    audit("authorized", req, onlyBucket ? `bucket=${onlyBucket}` : "todos os buckets");

    const { data: buckets, error: bErr } =
      await supabase.storage.listBuckets();
    if (bErr) throw bErr;

    const result: Record<
      string,
      { count: number; files: { path: string; url: string }[] }
    > = {};

    const targets = onlyBucket
      ? buckets.filter((b) => b.name === onlyBucket)
      : buckets;

    for (const b of targets) {
      const paths = await listBucketRecursive(supabase, b.name);
      const signed: { path: string; url: string }[] = [];

      // createSignedUrls aceita até 100 por chamada
      for (let i = 0; i < paths.length; i += 100) {
        const chunk = paths.slice(i, i + 100);
        const { data, error } = await supabase.storage
          .from(b.name)
          .createSignedUrls(chunk, SIGNED_URL_TTL);
        if (error) throw error;
        for (const s of data ?? []) {
          if (s.signedUrl && s.path) {
            signed.push({ path: s.path, url: s.signedUrl });
          }
        }
      }

      result[b.name] = { count: signed.length, files: signed };
    }

    return new Response(
      JSON.stringify({ ok: true, generated_at: new Date().toISOString(), buckets: result }),
      { headers: jsonHeaders },
    );
  } catch (e) {
    console.error("export-storage error", e);
    return new Response(
      JSON.stringify({ error: String((e as Error).message ?? e) }),
      { status: 500, headers: jsonHeaders },
    );
  }
});
