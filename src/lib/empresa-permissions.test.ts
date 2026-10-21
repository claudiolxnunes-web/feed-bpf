import { describe, expect, it } from "vitest";
import { permissoesEmpresa, rotaOperacional, acaoConsulta } from "./empresa-permissions";

describe("Permissões por empresa", () => {
  it("dono continua editando e gerenciando equipe", () => { expect(permissoesEmpresa(true, "visualizador")).toEqual({ podeEditar: true, podeGerenciarEquipe: true, isVisualizador: false }); });
  it("admin continua editando e gerenciando equipe", () => { expect(permissoesEmpresa(false, "admin")).toEqual({ podeEditar: true, podeGerenciarEquipe: true, isVisualizador: false }); });
  it.each(["rt", "operador"] as const)("%s continua editando, sem gerenciar equipe", (papel) => { expect(permissoesEmpresa(false, papel)).toEqual({ podeEditar: true, podeGerenciarEquipe: false, isVisualizador: false }); });
  it("visualizador não edita nem gerencia equipe", () => { expect(permissoesEmpresa(false, "visualizador")).toEqual({ podeEditar: false, podeGerenciarEquipe: false, isVisualizador: true }); });
  it("papel desconhecido não recebe permissão", () => { expect(permissoesEmpresa(false, null).podeEditar).toBe(false); });
  it("operações incluem PCP e Tablet", () => { expect(rotaOperacional("/pcp")).toBe(true); expect(rotaOperacional("/modo-tablet")).toBe(true); });
  it.each(["/relatorios", "/relatorio-producao", "/manual", "/geracao-manual-bpf", "/legislacao"])("%s fica livre", (path) => { expect(rotaOperacional(path)).toBe(false); });
  it("exportações permanecem permitidas e gravações bloqueadas", () => { expect(acaoConsulta("Exportar PDF", "lucide-download")).toBe(true); expect(acaoConsulta("", "lucide-pencil")).toBe(false); expect(acaoConsulta("Registrar batida", "")).toBe(false); });
});