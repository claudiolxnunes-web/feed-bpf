import { describe, expect, it } from "vitest";
import { textoTela } from "./textoTela";

describe("textoTela — somente apresentação", () => {
  it("remove citações da apresentação sem modificar o dado original", () => {
    const dado = "Rastreabilidade (Decreto 12.031/2024, art. 41)";
    expect(textoTela(dado)).toBe("Rastreabilidade");
    expect(dado).toBe("Rastreabilidade (Decreto 12.031/2024, art. 41)");
  });
  it("preserva limites operacionais e códigos de POP", () => {
    expect(textoTela("POP-02 — cloro de 0,2 a 2 mg/L")).toBe("POP-02 — cloro de 0,2 a 2 mg/L");
  });
});