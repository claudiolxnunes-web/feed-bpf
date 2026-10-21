import { describe, expect, it } from "vitest";
import { POPS_CODIGOS, normalizarPopCodigo } from "./popCodigo";

describe("normalizarPopCodigo", () => {
  it("trata a variante de 3 dígitos e a de 2 dígitos como o mesmo POP", () => {
    expect(normalizarPopCodigo("POP-001")).toBe("POP-01");
    expect(normalizarPopCodigo("POP-01")).toBe("POP-01");
    expect(normalizarPopCodigo("POP-008")).toBe("POP-08");
    expect(normalizarPopCodigo("POP-08")).toBe("POP-08");
    expect(normalizarPopCodigo("POP-010")).toBe("POP-10");
  });

  it("mantém códigos de IT e valores fora do padrão POP", () => {
    expect(normalizarPopCodigo("IT-01-01")).toBe("IT-01-01");
    expect(normalizarPopCodigo("POP-001 Recebimento MP")).toBe("POP-001 Recebimento MP");
    expect(normalizarPopCodigo(null)).toBe("");
    expect(normalizarPopCodigo(undefined)).toBe("");
  });

  it("lista os 10 POPs no formato gravado no banco (POP-01 a POP-10)", () => {
    expect(POPS_CODIGOS).toHaveLength(10);
    expect(POPS_CODIGOS[0]).toBe("POP-01");
    expect(POPS_CODIGOS[9]).toBe("POP-10");
    expect(POPS_CODIGOS.some((c) => /^POP-\d{3}$/.test(c))).toBe(false);
  });
});
