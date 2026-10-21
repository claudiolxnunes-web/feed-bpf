import { beforeAll, describe, expect, it, vi } from "vitest";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT, type JWTVerifyGetKey } from "jose";

const state = vi.hoisted(() => ({ permitted: false, rows: [] as unknown[] }));
vi.mock("./supabase", () => ({ supabaseForUser: () => {
  const chain = {
    select: () => chain, eq: () => chain, or: () => chain, order: () => chain, limit: () => chain,
    abortSignal: async () => ({ data: state.rows, error: null }),
  };
  return { rpc: () => ({ abortSignal: async () => ({ data: state.permitted, error: null }) }), from: () => chain };
} }));

import { createMcpHandler } from "./handler";

const BASE = "https://example-ref.supabase.co";
const ISSUER = `${BASE}/auth/v1`;
let privateKey: CryptoKey;
let keySet: JWTVerifyGetKey;

beforeAll(async () => {
  const pair = await generateKeyPair("ES256");
  privateKey = pair.privateKey;
  const jwk = { ...(await exportJWK(pair.publicKey)), kid: "k1", alg: "ES256" };
  keySet = createLocalJWKSet({ keys: [jwk] });
});

async function token(claims: Record<string, unknown> = {}) {
  return new SignJWT({ client_id: "client-1", ...claims })
    .setProtectedHeader({ alg: "ES256", kid: "k1", typ: "JWT" })
    .setIssuer(ISSUER).setAudience("authenticated").setSubject("user-1")
    .setIssuedAt().setExpirationTime("5m").sign(privateKey);
}

function rpc(method: string, params: unknown, bearer?: string) {
  return new Request(`${BASE}/functions/v1/mcp`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
}

describe("MCP HTTP handler", () => {
  const handler = () => createMcpHandler({ supabaseUrl: BASE, keySet });

  it("serves protected resource metadata", async () => {
    const res = await handler()(new Request(`${BASE}/mcp/.well-known/oauth-protected-resource`));
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ resource: `${BASE}/functions/v1/mcp`, authorization_servers: [ISSUER] });
  });

  it("challenges requests without a bearer token", async () => {
    const res = await handler()(rpc("tools/list", {}));
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain(`resource_metadata="${BASE}/functions/v1/mcp/.well-known/oauth-protected-resource"`);
  });

  it("rejects tokens without an OAuth client claim", async () => {
    const res = await handler()(rpc("tools/list", {}, await token({ client_id: undefined })));
    expect(res.status).toBe(401);
    expect(res.headers.get("WWW-Authenticate")).toContain('error="invalid_token"');
  });

  it("rejects tokens from another issuer", async () => {
    const bad = await new SignJWT({ client_id: "c" }).setProtectedHeader({ alg: "ES256", kid: "k1" })
      .setIssuer("https://other.example/auth/v1").setAudience("authenticated").setSubject("u")
      .setExpirationTime("5m").sign(privateKey);
    expect((await handler()(rpc("tools/list", {}, bad))).status).toBe(401);
  });

  it("lists the read-only tools for a valid token", async () => {
    const res = await handler()(rpc("tools/list", {}, await token()));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.result.tools.map((t: { name: string }) => t.name)).toEqual(["listar_empresas", "listar_simulacoes_recall"]);
    expect(body.result.tools.every((t: { annotations?: { readOnlyHint?: boolean } }) => t.annotations?.readOnlyHint)).toBe(true);
  });

  it("keeps the company boundary when calling a tool", async () => {
    state.permitted = false;
    const res = await handler()(rpc("tools/call", {
      name: "listar_simulacoes_recall",
      arguments: { empresa_id: "3f2b9c10-1111-2222-3333-444455556666" },
    }, await token()));
    const body = await res.json();
    expect(body.result.isError).toBe(true);
    expect(body.result.content[0].text).toContain("Empresa indisponível");
  });

  it("returns structured results for an allowed call", async () => {
    state.rows = [{ id: "e1", nome: "Fábrica", cnpj: "00" }];
    const res = await handler()(rpc("tools/call", { name: "listar_empresas", arguments: {} }, await token()));
    const body = await res.json();
    expect(body.result.isError).toBeFalsy();
    expect(body.result.structuredContent).toEqual({ empresas: [{ id: "e1", nome: "Fábrica", cnpj: "00" }] });
  });
});
