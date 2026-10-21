import { describe, expect, it } from "vitest";
import { ASSUNTOS_BASE_LEGAL, BASE_LEGAL, getBaseLegal } from "./baseLegal";

describe("Referências autorizadas por assunto", () => {
  it("usa IN 04/2007 para BPF", () => {
    expect(getBaseLegal("bpf_geral").norma).toBe("IN 04/2007");
  });
  it("usa art. 40 e inclui o decreto complementar para autocontrole", () => {
    expect(getBaseLegal("autocontrole").artigo).toBe("art. 40");
    expect(BASE_LEGAL.autocontrole.slugs).toContain("decreto-12126-2024");
    expect(BASE_LEGAL.autocontrole.slugs).toContain("lei-14515-2022");
  });
  it("mantém o prazo mensal autorizado e sua fonte", () => {
    const base = getBaseLegal("relatorio_producao_mensal");
    expect(base.artigo).toBe("art. 39, III");
    expect(base.observacao).toBe("Envio até o 10º dia do mês seguinte (Ofício-Circular 51/2023/CGI/DIPOA/SDA/MAPA).");
  });
  it("usa arts. 41 e 44 para rastreabilidade", () => {
    expect(getBaseLegal("rastreabilidade").artigo).toBe("arts. 41 e 44");
  });
  it("usa IN 17/2020 para registro", () => {
    expect(getBaseLegal("registro_estabelecimento").norma).toBe("IN 17/2020");
  });
  it("mantém todas as alterações autorizadas de rotulagem", () => {
    expect(getBaseLegal("rotulagem").citacao).toBe("IN 22/2009 (alterada pelas INs 30/2009, 66/2009, 42/2010, 39/2014 e 47/2020)");
  });
  it("distingue contraprova fiscal sem prazo geral de retenção", () => {
    const base = getBaseLegal("contraprova_fiscal");
    expect(base.artigo).toBe("art. 70");
    expect(base.observacao).toBe("Contraprova da análise fiscal; não há prazo geral de retenção de amostra pelo fabricante.");
  });
  it("não atribui prazo normativo à amostra de arquivo", () => {
    expect(getBaseLegal("amostra_arquivo").observacao).toBe("Sem prazo fixado em norma.");
    expect(getBaseLegal("amostra_arquivo").artigo).toBe("art. 40");
  });
  it("usa arts. 39 e 44 para recall", () => {
    expect(getBaseLegal("recolhimento_recall").artigo).toBe("arts. 39 e 44");
  });
  it("usa Portaria SDA 798/2023 para alimentos medicados", () => {
    expect(getBaseLegal("alimentos_medicados").norma).toBe("Portaria SDA 798/2023");
  });
  it("usa Portaria SDA 1.180/2024 para PNEEB", () => {
    expect(getBaseLegal("pneeb").norma).toBe("Portaria SDA 1.180/2024");
  });
  it("usa RDC ANVISA 622/2022 para pragas", () => {
    expect(getBaseLegal("controle_pragas").norma).toBe("RDC ANVISA 622/2022");
  });
  it("mantém lista por substância e não classifica ractopamina como proibida", () => {
    const base = getBaseLegal("substancias_proibidas");
    expect(base.citacao).toBe("Lista oficial de substâncias proibidas do MAPA; norma por substância (ex.: IN 9/2003, IN 17/2004, IN 26/2009, IN 14/2012, IN 45/2016, IN 1/2020)");
    expect(base.observacao).toBe("Não classificar ractopamina como proibida.");
  });
  it("mantém o decreto vigente e identifica a revogação apenas na observação", () => {
    expect(getBaseLegal("decreto_base").norma).toBe("Decreto 12.031/2024");
    expect(getBaseLegal("decreto_base").observacao).toBe("Revogou o Decreto 6.296/2007.");
  });
  it("exportação retorna apenas os quatro campos e a lista de assuntos fecha com a base", () => {
    expect(Object.keys(getBaseLegal("rotulagem"))).toEqual(["norma", "artigo", "citacao", "observacao"]);
    expect(Object.keys(BASE_LEGAL)).toHaveLength(14);
    expect(ASSUNTOS_BASE_LEGAL).toHaveLength(14);
  });
});