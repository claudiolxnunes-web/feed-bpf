import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolContext } from "@lovable.dev/mcp-js";

const state = vi.hoisted(() => ({ permitted: true, licenses: [] as { status: string; data_expiracao: string; liberado_admin: boolean }[] }));
vi.mock("./supabase", () => ({ supabaseForUser: () => ({
  rpc: () => ({ abortSignal: async () => ({ data: state.permitted, error: null }) }),
  from: () => {
    const chain = {
      select: () => chain, eq: () => chain, or: () => chain, order: () => chain, limit: () => chain,
      abortSignal: async () => ({ data: state.licenses, error: null }),
    };
    return chain;
  },
}) }));
import { licensedCompany } from "./access";
const ctx = { getUserId: () => "verified-user", signal: new AbortController().signal } as unknown as ToolContext;

describe("MCP company and license boundaries", () => {
  beforeEach(() => { state.permitted = true; state.licenses = []; });
  it("rejects a company without caller membership", async () => {
    state.permitted = false;
    await expect(licensedCompany(ctx, "company")).rejects.toThrow("Empresa indisponível");
  });
  it("rejects an unlicensed company", async () => {
    await expect(licensedCompany(ctx, "company")).rejects.toThrow("licença ativa");
  });
  it("rejects an expired license", async () => {
    state.licenses = [{ status: "ativa", data_expiracao: "2000-01-01", liberado_admin: false }];
    await expect(licensedCompany(ctx, "company")).rejects.toThrow("licença ativa");
  });
  it("accepts an active unexpired license", async () => {
    state.licenses = [{ status: "ativa", data_expiracao: "2099-01-01", liberado_admin: false }];
    await expect(licensedCompany(ctx, "company")).resolves.toBeDefined();
  });
});