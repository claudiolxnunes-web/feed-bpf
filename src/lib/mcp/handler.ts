import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { createRemoteJWKSet, type JWTVerifyGetKey } from "jose";
import { verifyAccessToken } from "./auth";
import { mcpServerInfo } from "./index";
import { createMcpServer } from "./server";

const METADATA_PATH = "/.well-known/oauth-protected-resource";

const CORS_HEADERS: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, accept, mcp-protocol-version, mcp-session-id, last-event-id, x-client-info, apikey",
  "Access-Control-Expose-Headers": "WWW-Authenticate, MCP-Protocol-Version, Mcp-Session-Id",
};

function withCors(res: Response): Response {
  const headers = new Headers(res.headers);
  for (const [k, v] of Object.entries(CORS_HEADERS)) headers.set(k, v);
  return new Response(res.body, { status: res.status, statusText: res.statusText, headers });
}

function json(body: unknown, status = 200, extra: Record<string, string> = {}): Response {
  return withCors(new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...extra },
  }));
}

export interface McpHandlerOptions {
  /** URL pública do projeto, ex.: https://<ref>.supabase.co */
  supabaseUrl: string;
  functionName?: string;
  /** Injeção para testes; em produção usa o JWKS do Supabase Auth. */
  keySet?: JWTVerifyGetKey;
}

/**
 * Handler Web-Standard da Edge Function `mcp`:
 *   - `.../.well-known/oauth-protected-resource` -> metadados RFC 9728
 *   - demais caminhos -> MCP Streamable HTTP, exigindo Bearer OAuth válido
 */
export function createMcpHandler(opts: McpHandlerOptions): (req: Request) => Promise<Response> {
  const base = opts.supabaseUrl.replace(/\/+$/, "");
  const issuer = `${base}/auth/v1`;
  const resource = `${base}/functions/v1/${opts.functionName ?? "mcp"}`;
  const metadataUrl = `${resource}${METADATA_PATH}`;
  const keySet = opts.keySet ?? createRemoteJWKSet(new URL(`${issuer}/.well-known/jwks.json`));

  const challenge = (error?: string, description?: string) => {
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
        resource_name: mcpServerInfo.title,
      });
    }

    const match = /^Bearer\s+(.+)$/i.exec(req.headers.get("Authorization") ?? "");
    if (!match) return challenge();

    let verified;
    try {
      verified = await verifyAccessToken(match[1].trim(), { issuer, keySet });
    } catch (error) {
      return challenge("invalid_token", error instanceof Error ? error.message : "Token inválido");
    }

    const server = createMcpServer();
    const transport = new WebStandardStreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
      enableJsonResponse: true,
    });
    await server.connect(transport);
    try {
      const res = await transport.handleRequest(req, {
        authInfo: {
          token: match[1].trim(),
          clientId: verified.clientId,
          scopes: verified.scopes,
          extra: { userId: verified.userId },
        },
      });
      return withCors(res);
    } finally {
      // Stateless: nada a manter entre requisições.
      void server.close();
    }
  };
}
