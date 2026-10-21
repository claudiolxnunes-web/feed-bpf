import { describe, expect, it } from "vitest";
import { citar, NORMAS, type CodigoNorma, type NormaLegal } from "./baseLegal";

describe("Catálogo central de normas", () => {
  it("contém exatamente as 23 normas solicitadas com identificação e link oficial", () => {
    expect(Object.keys(NORMAS)).toHaveLength(23);
    for (const [codigo, norma] of Object.entries(NORMAS)) {
      expect(norma.codigo).toBe(codigo);
      expect(norma.titulo.length).toBeGreaterThan(0);
      expect(norma.orgao.length).toBeGreaterThan(0);
      expect(["vigente", "revogada", "parcial"]).toContain(norma.situacao);
      const url = new URL(norma.link_oficial);
      expect(url.protocol).toBe("https:");
      expect(url.hostname.endsWith(".gov.br")).toBe(true);
    }
  });

  it("marca a IN 4/2007 como parcial e identifica os dispositivos revogados", () => {
    expect(NORMAS["IN 4/2007"].situacao).toBe("parcial");
    expect(NORMAS["IN 4/2007"].substituida_por).toBe("IN 27/2020");
    expect(NORMAS["IN 4/2007"].observacao).toBe("Itens 10.1 a 10.3 e Anexo II revogados pela IN 27/2020.");
  });

  it.each([
    ["Decreto 6.296/2007", "Decreto 12.031/2024"],
    ["IN 65/2006", "Portaria SDA 798/2023"],
    ["RDC ANVISA 52/2009", "RDC ANVISA 622/2022"],
    ["Portaria SDA 651/2022", "Portaria SDA 1.180/2024"],
  ] as const)("mantém %s revogada com a substituta %s", (codigo, substituta) => {
    expect(NORMAS[codigo].situacao).toBe("revogada");
    expect(NORMAS[codigo].substituida_por).toBe(substituta);
  });

  it("toda substituta corresponde a uma norma cadastrada não revogada", () => {
    for (const norma of Object.values(NORMAS) as readonly NormaLegal[]) {
      if (!norma.substituida_por) continue;
      expect(Object.prototype.hasOwnProperty.call(NORMAS, norma.substituida_por)).toBe(true);
      expect(NORMAS[norma.substituida_por as CodigoNorma].situacao).not.toBe("revogada");
    }
  });
});

describe("citar", () => {
  it("usa o código cadastrado sem acrescentar dispositivo", () => {
    expect(citar("Portaria SDA 798/2023")).toBe("Portaria SDA 798/2023");
  });
  it("anexa somente o dispositivo informado e remove espaços externos", () => {
    expect(citar("Decreto 12.031/2024", " art. 40 ")).toBe("Decreto 12.031/2024, art. 40");
  });
  it("não emite pontuação solta para dispositivo vazio", () => {
    expect(citar("IN 4/2007", "  ")).toBe("IN 4/2007");
  });
  it("não troca silenciosamente uma norma histórica pela substituta", () => {
    expect(citar("IN 65/2006")).toBe("IN 65/2006");
  });
  it("rejeita códigos desconhecidos recebidos em tempo de execução", () => {
    expect(() => citar("IN inexistente" as CodigoNorma)).toThrow("Norma não cadastrada");
  });
});