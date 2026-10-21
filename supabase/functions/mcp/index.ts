// @ts-nocheck — bundle JS gerado; os tipos são checados em src/lib/mcp pelo tsc.
// GERADO por scripts/build-mcp-function.mjs a partir de src/lib/mcp — não editar.
// Para mudar o MCP, edite src/lib/mcp e rode `npm run build:mcp`.
// src/lib/mcp/handler.ts
import { WebStandardStreamableHTTPServerTransport } from "npm:@modelcontextprotocol/sdk@1.28.0/server/webStandardStreamableHttp.js";
import { createRemoteJWKSet } from "npm:jose@6.2.13";

// src/lib/mcp/auth.ts
import { decodeProtectedHeader, jwtVerify } from "npm:jose@6.2.13";
var ACCEPTED_TYPS = ["at+jwt", "jwt"];
async function verifyAccessToken(token, opts) {
  const typ = decodeProtectedHeader(token).typ;
  if (typ !== void 0 && !ACCEPTED_TYPS.includes(typ.toLowerCase())) {
    throw new Error("Tipo de token n\xE3o aceito");
  }
  const { payload } = await jwtVerify(token, opts.keySet, {
    issuer: opts.issuer,
    audience: "authenticated"
  });
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId) throw new Error("Token sem sub");
  const clientId = [payload.client_id, payload.azp].find((v) => typeof v === "string" && v.length > 0);
  if (!clientId) throw new Error("OAuth client claim is required");
  const scopes = typeof payload.scope === "string" ? payload.scope.split(" ").filter(Boolean) : [];
  return { userId, clientId, scopes, claims: payload };
}

// src/lib/mcp/context.ts
var ToolError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "ToolError";
  }
};
function defineTool(tool) {
  return tool;
}

// src/lib/mcp/supabase.ts
import { createClient } from "npm:@supabase/supabase-js@2.104.0";
function runtimeEnv(name) {
  const runtime = globalThis;
  return runtime.Deno?.env?.get?.(name) ?? runtime.process?.env?.[name];
}
function configuredEnv(names) {
  for (const name of names) {
    const value = runtimeEnv(name)?.trim();
    if (value) return value;
  }
}
function projectUrl() {
  const url = configuredEnv(["SUPABASE_URL", "VITE_SUPABASE_URL"]);
  if (!url) throw new Error("Missing project URL");
  return url;
}
function publishableKey() {
  const direct = configuredEnv(["SUPABASE_PUBLISHABLE_KEY", "VITE_SUPABASE_PUBLISHABLE_KEY"]);
  if (direct) return direct;
  const keyset = runtimeEnv("SUPABASE_PUBLISHABLE_KEYS");
  if (keyset) {
    try {
      const parsed = JSON.parse(keyset);
      if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
        const keys = parsed;
        const key = [keys.default, ...Object.values(keys)].find(
          (v) => typeof v === "string" && v.trim().startsWith("sb_publishable_")
        )?.trim();
        if (key) return key;
      }
    } catch {
    }
  }
  const legacy = configuredEnv(["SUPABASE_ANON_KEY", "VITE_SUPABASE_ANON_KEY"]);
  if (legacy) return legacy;
  throw new Error("Missing publishable key");
}
function supabaseForUser(ctx) {
  const token = ctx.getToken();
  if (!token || !ctx.isAuthenticated() || !ctx.getUserId()) throw new ToolError("Autentica\xE7\xE3o OAuth necess\xE1ria.");
  return createClient(projectUrl(), publishableKey(), {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false }
  });
}

// src/lib/mcp/tools/list-companies.ts
var list_companies_default = defineTool({
  name: "listar_empresas",
  title: "Listar empresas",
  description: "Lista at\xE9 100 empresas vis\xEDveis para a conta conectada, com identificadores para consultas posteriores.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const client = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Autentica\xE7\xE3o necess\xE1ria.");
    const { data: members, error: memberError } = await client.from("empresa_membros").select("empresa_id").eq("user_id", userId).eq("ativo", true).limit(100).abortSignal(ctx.signal);
    if (memberError) throw new ToolError("N\xE3o foi poss\xEDvel consultar os v\xEDnculos da conta.");
    const ids = (members ?? []).map((m) => m.empresa_id);
    const query = client.from("empresas").select("id,nome,cnpj");
    const { data, error } = await (ids.length ? query.or(`user_id.eq.${userId},id.in.(${ids.join(",")})`) : query.eq("user_id", userId)).order("nome").limit(100).abortSignal(ctx.signal);
    if (error) throw new ToolError("N\xE3o foi poss\xEDvel consultar as empresas.");
    const empresas = (data ?? []).map(({ id, nome, cnpj }) => ({ id, nome, cnpj }));
    return { content: [{ type: "text", text: empresas.length ? JSON.stringify(empresas) : "Nenhuma empresa dispon\xEDvel." }], structuredContent: { empresas } };
  }
});

// src/lib/mcp/tools/list-recalls.ts
import { z } from "npm:zod@3.25.76";

// src/lib/mcp/access.ts
async function licensedCompany(ctx, empresaId) {
  const client = supabaseForUser(ctx);
  const userId = ctx.getUserId();
  if (!userId) throw new ToolError("Autentica\xE7\xE3o necess\xE1ria.");
  const { data: permitted, error } = await client.rpc("pode_usar_empresa", {
    _empresa_id: empresaId,
    _user_id: userId
  }).abortSignal(ctx.signal);
  if (error || !permitted) throw new ToolError("Empresa indispon\xEDvel para esta conta.");
  const { data: licenses, error: licenseError } = await client.from("licencas").select("status,data_expiracao,liberado_admin").eq("produto", "feedbpf").or(`empresa_id.eq.${empresaId},and(user_id.eq.${userId},empresa_id.is.null)`).order("created_at", { ascending: false }).limit(50).abortSignal(ctx.signal);
  if (licenseError || !licenses?.some((l) => l.liberado_admin || l.status === "ativa" && new Date(l.data_expiracao).getTime() >= Date.now())) {
    throw new ToolError("\xC9 necess\xE1ria uma licen\xE7a ativa do Feed_BPF para consultar esta empresa.");
  }
  return client;
}

// src/lib/mcp/tools/list-recalls.ts
var list_recalls_default = defineTool({
  name: "listar_simulacoes_recall",
  title: "Consultar simula\xE7\xF5es de recall",
  description: "Consulta simula\xE7\xF5es recentes de recall de uma empresa autorizada com licen\xE7a ativa, sem modificar registros.",
  inputSchema: {
    empresa_id: z.string().uuid().describe("Identificador da empresa retornado por listar_empresas."),
    limite: z.number().int().min(1).max(50).default(20).describe("Quantidade m\xE1xima de simula\xE7\xF5es, entre 1 e 50.")
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ empresa_id, limite }, ctx) => {
    const client = await licensedCompany(ctx, empresa_id);
    const { data, error } = await client.from("simulacoes_recall").select("id,data,lote,produto,status,tempo_total_min").eq("empresa_id", empresa_id).order("data", { ascending: false }).limit(limite).abortSignal(ctx.signal);
    if (error) throw new ToolError("N\xE3o foi poss\xEDvel consultar as simula\xE7\xF5es de recall.");
    const simulacoes = (data ?? []).map(({ id, data: data2, lote, produto, status, tempo_total_min }) => ({ id, data: data2, lote, produto, status, tempo_total_min }));
    return { content: [{ type: "text", text: simulacoes.length ? JSON.stringify(simulacoes) : "Nenhuma simula\xE7\xE3o nesta empresa." }], structuredContent: { simulacoes } };
  }
});

// src/lib/mcp/index.ts
var mcpServerInfo = { name: "feed-bpf-pro", title: "Feed_BPF_Pro", version: "0.1.0" };
var mcpInstructions = "Consultas de leitura do Feed_BPF. Liste empresas antes de consultar simula\xE7\xF5es de recall. As consultas respeitam a conta conectada, a empresa escolhida e as permiss\xF5es existentes. N\xE3o h\xE1 ferramentas de altera\xE7\xE3o, exclus\xE3o, pagamento ou envio.";
var mcpTools = [list_companies_default, list_recalls_default];

// src/lib/mcp/server.ts
import { McpServer } from "npm:@modelcontextprotocol/sdk@1.28.0/server/mcp.js";
function contextFrom(extra) {
  const token = extra.authInfo?.token;
  const userId = typeof extra.authInfo?.extra?.userId === "string" ? extra.authInfo.extra.userId : void 0;
  return {
    getToken: () => token,
    getUserId: () => userId,
    isAuthenticated: () => !!token && !!userId,
    signal: extra.signal
  };
}
function createMcpServer() {
  const server = new McpServer(mcpServerInfo, { instructions: mcpInstructions });
  for (const tool of mcpTools) {
    server.registerTool(
      tool.name,
      { title: tool.title, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      async (args, extra) => {
        try {
          return await tool.handler(args, contextFrom(extra));
        } catch (error) {
          const text = error instanceof ToolError ? error.message : "Erro interno ao executar a ferramenta.";
          if (!(error instanceof ToolError)) console.error("mcp tool error", tool.name, error);
          return { isError: true, content: [{ type: "text", text }] };
        }
      }
    );
  }
  return server;
}

// src/lib/mcp/handler.ts
var METADATA_PATH = "/.well-known/oauth-protected-resource";
var CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id, x-client-info, apikey",
  "Access-Control-Expose-Headers": "WWW-Authenticate, MCP-Protocol-Version, Mcp-Session-Id"
};
function withCors(res) {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}
function json(body, status = 200, extra = {}) {
  return withCors(new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra }
  }));
}
function createMcpHandler(opts) {
  const base = opts.supabaseUrl.replace(/\/+$/, "");
  const issuer = `${base}/auth/v1`;
  const resource = `${base}/functions/v1/${opts.functionName ?? "mcp"}`;
  const metadataUrl = `${resource}${METADATA_PATH}`;
  const keySet = opts.keySet ?? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));
  const challenge = (error, description) => {
    const params = [`realm="mcp"`, `resource_metadata="${metadataUrl}"`];
    if (error) params.push(`error="${error}"`);
    if (description) params.push(`error_description="${description.replace(/["\\]/g, "")}"`);
    return json({ error: "unauthorized" }, 401, { "WWW-Authenticate": `Bearer ${params.join(", ")}` });
  };
  return async (req) => {
    if (req.method === "OPTIONS") return withCors(new Response(null, { status: 204 }));
    const pathname = new URL(req.url).pathname.replace(/\/+$/, "");
    if (pathname.endsWith(METADATA_PATH)) {
      return json({
        resource,
        authorization_servers: [issuer],
        bearer_methods_supported: ["header"],
        resource_name: mcpServerInfo.title
      });
    }
    const match = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
    if (!match) return challenge();
    let verified;
    try {
      verified = await verifyAccessToken(match[1].trim(), { issuer, keySet });
    } catch (error) {
      return challenge("invalid_token", error instanceof Error ? error.message : "Token inv\xE1lido");
    }
    const server = createMcpServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: void 0,
      enableJsonResponse: true
    });
    await server.connect(transport);
    try {
      const res = await transport.handleRequest(req, {
        authInfo: {
          token: match[1].trim(),
          clientId: verified.clientId,
          scopes: verified.scopes,
          extra: { userId: verified.userId }
        }
      });
      return withCors(res);
    } finally {
      void server.close();
    }
  };
}

// mcp-entry.ts
Deno.serve(createMcpHandler({ supabaseUrl: Deno.env.get("SUPABASE_URL"), functionName: "mcp" }));
