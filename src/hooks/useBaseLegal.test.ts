import { describe, it, expect, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
vi.mock("@/hooks/useEmpresa", () => ({ useEmpresa: () => ({ empresaAtiva: null }) }));
import { mesclarBaseLegal } from "./useBaseLegal";
import { getBaseLegal } from "@/config/baseLegal";

const reserva = getBaseLegal("decreto_base");
const global = { titulo: "DECRETO 12031", codigo: "DEC 12031", arquivo_url: "https://x/g.pdf", empresa_id: null };
const daEmpresa = { titulo: "Decreto empresa", codigo: null, arquivo_url: "https://x/e.pdf", empresa_id: "emp-1" };

describe("mesclarBaseLegal", () => {
  it("sem linha no banco devolve a reserva sem documento", () => {
    expect(mesclarBaseLegal(reserva, [], "emp-1")).toEqual({ ...reserva, documento: null });
  });
  it("a linha da empresa vence a global", () => {
    expect(mesclarBaseLegal(reserva, [global, daEmpresa], "emp-1").documento?.arquivoUrl).toBe("https://x/e.pdf");
  });
  it("sem linha da empresa usa a global", () => {
    expect(mesclarBaseLegal(reserva, [global], "emp-1").documento?.arquivoUrl).toBe("https://x/g.pdf");
  });
  it("citação, artigo e observação vêm sempre da reserva, nunca do título do banco", () => {
    const r = mesclarBaseLegal(reserva, [global], null);
    expect(r.norma).toBe(reserva.norma);
    expect(r.citacao).toBe(reserva.citacao);
    expect(r.observacao).toBe(reserva.observacao);
    expect(r.norma).not.toBe("DECRETO 12031");
  });
});
