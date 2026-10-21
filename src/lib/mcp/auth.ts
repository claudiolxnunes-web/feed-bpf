import { decodeProtectedHeader, jwtVerify, type JWTPayload, type JWTVerifyGetKey } from "jose";

const ACCEPTED_TYPS = ["at+jwt", "jwt"];

export interface VerifiedToken {
  userId: string;
  clientId: string;
  scopes: string[];
  claims: JWTPayload;
}

/**
 * Verifica um access token emitido pelo OAuth server do Supabase Auth:
 * assinatura (JWKS do projeto), issuer, audiência "authenticated", sub e a
 * claim de cliente OAuth (client_id/azp) — tokens de sessão comum do app, sem
 * cliente OAuth, não acessam o MCP.
 */
export async function verifyAccessToken(
  token: string,
  opts: { issuer: string; keySet: JWTVerifyGetKey },
): Promise<VerifiedToken> {
  const typ = decodeProtectedHeader(token).typ;
  if (typ !== undefined && !ACCEPTED_TYPS.includes(typ.toLowerCase())) {
    throw new Error("Tipo de token não aceito");
  }
  const { payload } = await jwtVerify(token, opts.keySet, {
    issuer: opts.issuer,
    audience: "authenticated",
  });
  const userId = typeof payload.sub === "string" ? payload.sub : "";
  if (!userId) throw new Error("Token sem sub");
  const clientId = [payload.client_id, payload.azp].find((v): v is string => typeof v === "string" && v.length > 0);
  if (!clientId) throw new Error("OAuth client claim is required");
  const scopes = typeof payload.scope === "string" ? payload.scope.split(" ").filter(Boolean) : [];
  return { userId, clientId, scopes, claims: payload };
}
