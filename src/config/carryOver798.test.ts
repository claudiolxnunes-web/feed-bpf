import { describe, it, expect } from "vitest";
import { avaliarValidacaoCarryOver, resultadoDentroDoLimite, lerRepeticao, LIMITE_CARRY_OVER_PERCENT, citar798 } from "./carryOver798";

describe("carry-over Portaria SDA 798/2023", () => {
  it("limite padrão é 2,5%", () => expect(LIMITE_CARRY_OVER_PERCENT).toBe(2.5));
  it("2,5% é conforme e 2,6% não", () => {
    expect(resultadoDentroDoLimite(2.5)).toBe(true);
    expect(resultadoDentroDoLimite(2.6)).toBe(false);
  });
  it("aprovada só com as 3 repetições conformes", () => {
    expect(avaliarValidacaoCarryOver([{ repeticao: 1, conforme: true }, { repeticao: 2, conforme: true }])).toBe("em_andamento");
    expect(avaliarValidacaoCarryOver([1, 2, 3].map((r) => ({ repeticao: r, conforme: true })))).toBe("aprovada");
  });
  it("uma repetição não conforme reprova", () => {
    expect(avaliarValidacaoCarryOver([{ repeticao: 1, conforme: true }, { repeticao: 2, conforme: false }, { repeticao: 3, conforme: true }])).toBe("reprovada");
  });
  it("lê a repetição do texto do registro", () => {
    expect(lerRepeticao("Data: x\nRepetição: 2 de 3")).toBe(2);
    expect(lerRepeticao("registro antigo")).toBeNull();
  });
  it("citação vem da base legal", () => expect(citar798("art. 29")).toBe("Portaria SDA 798/2023, art. 29"));
});
