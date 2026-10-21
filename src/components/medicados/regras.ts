/** Regras de receitas e programas sanitários de alimentos medicados (puras, testáveis). */

export const VALIDADE_RECEITA_DIAS = 10;
export const REVISAO_PROGRAMA_MESES = 6;

const toDate = (iso: string): Date => new Date(`${iso}T00:00:00`);
const toIso = (d: Date): string => d.toISOString().slice(0, 10);

/** Validade padrão: data de emissão + 10 dias. */
export function validadePadraoReceita(dataEmissao: string): string {
  const d = toDate(dataEmissao);
  d.setDate(d.getDate() + VALIDADE_RECEITA_DIAS);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export interface ReceitaMin { status: string; data_emissao: string; validade: string }
export interface ProgramaMin { status: string; data_ultima_revisao: string }

/** Receita válida: vigente e hoje entre emissão e validade (inclusive). */
export function receitaValida(r: ReceitaMin | null | undefined, hoje: string = toIso(new Date())): boolean {
  return !!r && r.status === "vigente" && r.data_emissao <= hoje && hoje <= r.validade;
}

/** Revisão vencida: última revisão há mais de 6 meses. */
export function revisaoVencida(dataUltimaRevisao: string, hoje: string = toIso(new Date())): boolean {
  const limite = toDate(hoje);
  limite.setMonth(limite.getMonth() - REVISAO_PROGRAMA_MESES);
  return toDate(dataUltimaRevisao) < limite;
}

/** Programa vigente: ativo e revisado nos últimos 6 meses. */
export function programaVigente(p: ProgramaMin | null | undefined, hoje?: string): boolean {
  return !!p && p.status === "ativo" && !revisaoVencida(p.data_ultima_revisao, hoje);
}

/** Ordem medicada só pode ser liberada com receita válida ou programa vigente. */
export function podeLiberarOrdemMedicada(
  medicada: boolean,
  receita: ReceitaMin | null | undefined,
  programa: ProgramaMin | null | undefined,
  hoje?: string,
): boolean {
  if (!medicada) return true;
  return receitaValida(receita, hoje) || programaVigente(programa, hoje);
}
