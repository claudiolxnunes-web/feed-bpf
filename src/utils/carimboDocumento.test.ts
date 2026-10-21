import { describe, it, expect, vi, afterEach } from "vitest";
import { gerarCarimbo, inserirCarimbo, CARIMBO_PLACEHOLDER, SELO_INDISPONIVEL } from "./carimboDocumento";

vi.mock("sonner", () => ({ toast: { warning: vi.fn() } }));

const meta = { documentoTipo: "Teste", documentoId: "1", empresa: "E", usuario: "u@x" };

describe("selo de integridade", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("hash completo SHA-256 (64 hex) e 16 caracteres no rodapé", async () => {
    const c = await gerarCarimbo({ ...meta, conteudo: "dados" });
    expect(c.hashCompleto).toMatch(/^[0-9a-f]{64}$/);
    expect(c.hashCurto).toHaveLength(16);
    expect(c.selo).toBe(`INTEGRIDADE: ${c.hashCompleto!.slice(0, 16).toUpperCase()}`);
  });

  it("conteúdo diferente gera hash diferente", async () => {
    vi.useFakeTimers().setSystemTime(new Date("2026-10-18T12:00:00Z"));
    const a = await gerarCarimbo({ ...meta, conteudo: "lote A" });
    const b = await gerarCarimbo({ ...meta, conteudo: "lote B" });
    vi.useRealTimers();
    expect(a.hashCompleto).not.toBe(b.hashCompleto);
  });

  it("sem crypto.subtle não emite selo (sem fallback)", async () => {
    vi.stubGlobal("crypto", {});
    const c = await gerarCarimbo({ ...meta, conteudo: "x" });
    expect(c.hashCompleto).toBeNull();
    expect(c.selo).toBe(SELO_INDISPONIVEL);
  });

  it("inserirCarimbo grava o hash completo no rodapé e remove o marcador", async () => {
    const { html, carimbo } = await inserirCarimbo(`<p>doc</p>${CARIMBO_PLACEHOLDER}`, meta);
    expect(html).not.toContain(CARIMBO_PLACEHOLDER);
    expect(html).toContain(`data-sha256="${carimbo.hashCompleto}"`);
  });
});
