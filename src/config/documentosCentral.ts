import { INSTRUCOES_TRABALHO } from "./instrucoesTrabalho";

/**
 * Mapeamento de quais módulos devem ser preenchidos obrigatoriamente
 * para cada POP, evitando duplicidade de dados.
 */
export const POP_TO_MODULOS: Record<string, string[]> = {
  "POP-01": ["recebimento"],
  "POP-02": ["higiene"],
  "POP-03": ["saude-pessoal"],
  "POP-04": ["potabilidade-agua"],
  "POP-05": ["pcp"],
  "POP-06": ["manutencao"],
  "POP-07": ["pragas"],
  "POP-08": ["residuos"],
  "POP-09": ["rastreabilidade"],
  "POP-10": ["auditoria"]
};

/**
 * Retorna as ITs vinculadas a um determinado POP
 */
export const getItsPorPop = (popCodigo: string) => {
  return INSTRUCOES_TRABALHO.filter(it => it.popCodigo === popCodigo);
};
