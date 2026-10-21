import { getBaseLegal } from "@/config/baseLegal";

/**
 * Regras de carry-over, flushing e validação de limpeza (alimentos medicados).
 * A citação vem sempre de baseLegal.ts; aqui só se anexa o dispositivo.
 */
const norma = getBaseLegal("alimentos_medicados").citacao;

/** Cita um dispositivo da norma de alimentos medicados (ex.: "art. 29"). */
export const citar798 = (dispositivo: string): string => `${norma}, ${dispositivo}`;

export const LIMITE_CARRY_OVER_PERCENT = 2.5;
export const REPETICOES_EXIGIDAS = 3;
export const CV_MAXIMO_HOMOGENEIDADE = 10;
export const VERIFICACAO_NAO_ALVO_MESES = 12;
export const RETENCAO_REGISTROS_ANOS = 2;

export const REGRAS_CARRY_OVER = [
  { titulo: "Limite de arraste", texto: `Validação aprovada quando o produto fabricado logo depois tem até ${LIMITE_CARRY_OVER_PERCENT.toLocaleString("pt-BR")}% da concentração do princípio ativo do produto anterior.`, citacao: citar798("art. 29") },
  { titulo: "Repetições", texto: `${REPETICOES_EXIGIDAS} repetições da sequência-piloto, todas conformes.`, citacao: citar798("art. 29, §1º") },
  { titulo: "Ponto de coleta", texto: "Amostra coletada no último ponto compartilhado da linha.", citacao: citar798("art. 28, IV") },
  { titulo: "Sequenciamento", texto: "Plano de sequenciamento validado ou limpeza validada, definidos a partir da matriz de sensibilidade.", citacao: citar798("art. 25, II") },
  { titulo: "Produto não-alvo", texto: `Verificação do produto não-alvo no mínimo a cada ${VERIFICACAO_NAO_ALVO_MESES} meses.`, citacao: citar798("art. 25, V, b") },
  { titulo: "Homogeneidade", texto: `CV até ${CV_MAXIMO_HOMOGENEIDADE}% no método de concentração.`, citacao: citar798("art. 26") },
  { titulo: "Registros", texto: `Registros guardados por ${RETENCAO_REGISTROS_ANOS} anos.`, citacao: norma },
] as const;

export interface RepeticaoCarryOver {
  readonly repeticao: number;
  readonly conforme: boolean;
}

export type StatusValidacaoCarryOver = "aprovada" | "reprovada" | "em_andamento";

/** Aprovada só com as repetições 1, 2 e 3 registradas e todas conformes; qualquer não conforme reprova. */
export function avaliarValidacaoCarryOver(reps: readonly RepeticaoCarryOver[]): StatusValidacaoCarryOver {
  if (reps.some((r) => !r.conforme)) return "reprovada";
  const feitas = new Set(reps.filter((r) => r.conforme).map((r) => r.repeticao));
  for (let i = 1; i <= REPETICOES_EXIGIDAS; i++) if (!feitas.has(i)) return "em_andamento";
  return "aprovada";
}

/** Resultado (% da concentração do princípio ativo) dentro do limite de 2,5%. */
export function resultadoDentroDoLimite(percentual: number, limite = LIMITE_CARRY_OVER_PERCENT): boolean {
  return Number.isFinite(percentual) && percentual >= 0 && percentual <= limite;
}

/** Lê "Repetição: N" gravado no texto do registro de carry-over. */
export function lerRepeticao(observacoes: string | null | undefined): number | null {
  const m = /Repetição:\s*(\d)/.exec(observacoes ?? "");
  return m ? Number(m[1]) : null;
}
