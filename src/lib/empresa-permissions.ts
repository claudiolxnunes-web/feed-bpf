export type PapelEmpresa = "admin" | "rt" | "operador" | "visualizador";

export function permissoesEmpresa(dono: boolean, papel: PapelEmpresa | null) {
  return {
    podeEditar: dono || papel === "admin" || papel === "rt" || papel === "operador",
    podeGerenciarEquipe: dono || papel === "admin",
    isVisualizador: !dono && papel === "visualizador",
  };
}

export const ROTAS_OPERACIONAIS = [
  "/cadastro", "/fornecedores", "/recebimento", "/armazenamento-transporte",
  "/higiene", "/validacao-limpeza", "/saude-pessoal", "/treinamentos", "/visitantes",
  "/potabilidade-agua", "/monitoramento-pcc", "/pcp", "/producao", "/expedicao",
  "/produtos", "/formulas", "/status-lotes", "/analises", "/substancias",
  "/manutencao", "/pragas", "/residuos", "/rastreabilidade", "/simulacao-recall",
  "/autocontrole", "/matriz-risco", "/documentos", "/documentos-bpf", "/planilhas-pop",
  "/execucao-pops", "/auditoria", "/nao-conformidades", "/checklist-pre-auditoria",
  "/planejamento-anual", "/qualidade-total", "/modo-tablet", "/configurar-pin",
] as const;

export function rotaOperacional(path: string) {
  return ROTAS_OPERACIONAIS.some((rota) => path === rota || path.startsWith(`${rota}/`));
}

/** Queries, navigation and local exports never write company records. */
export function acaoConsulta(texto: string, icones: string) {
  const textoNormalizado = texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  if (/salvar|excluir|deletar|remover|editar|criar|novo|nova|registrar|adicionar|aprovar|assinar|arquivar|importar|anexar|enviar|liberar|finalizar|concluir|iniciar|bloquear|desativar|cancelar (ordem|convite|registro|expedicao|producao)/.test(textoNormalizado)) return false;
  if (/lucide-(trash|pencil|square-pen|edit|save|plus|upload|check-check)/.test(icones)) return false;
  return /export|baixar|download|imprimir|pdf|excel|copiar|visualizar|ver |abrir|detalhes|consultar|buscar|filtrar|pesquisar|voltar|fechar|cancelar|limpar|anterior|proxim|recarregar|atualizar lista|expandir|recolher|base legal|orientacao|informac/.test(textoNormalizado)
    || /lucide-(eye|download|printer|copy|search|chevron|arrow|x(?:\s|$)|maximize|minimize|info|scale|ellipsis)/.test(icones);
}