import { describe, it, expect } from "vitest";
import { validadePadraoReceita, receitaValida, programaVigente, podeLiberarOrdemMedicada } from "./regras";

const hoje = "2026-10-18";

describe("medicados", () => {
  it("validade padrão = emissão + 10 dias", () => expect(validadePadraoReceita("2026-10-25")).toBe("2026-11-04"));
  it("receita vencida não é válida", () => {
    expect(receitaValida({ status: "vigente", data_emissao: "2026-10-01", validade: "2026-10-11" }, hoje)).toBe(false);
    expect(receitaValida({ status: "vigente", data_emissao: "2026-10-10", validade: "2026-10-20" }, hoje)).toBe(true);
  });
  it("programa com revisão acima de 6 meses não é vigente", () => {
    expect(programaVigente({ status: "ativo", data_ultima_revisao: "2026-04-17" }, hoje)).toBe(false);
    expect(programaVigente({ status: "ativo", data_ultima_revisao: "2026-04-18" }, hoje)).toBe(true);
  });
  it("ordem não medicada libera sem vínculo; medicada exige vínculo válido", () => {
    expect(podeLiberarOrdemMedicada(false, null, null, hoje)).toBe(true);
    expect(podeLiberarOrdemMedicada(true, null, null, hoje)).toBe(false);
    expect(podeLiberarOrdemMedicada(true, null, { status: "ativo", data_ultima_revisao: "2026-09-01" }, hoje)).toBe(true);
  });
});
