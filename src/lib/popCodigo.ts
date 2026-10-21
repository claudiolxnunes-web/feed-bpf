/**
 * Códigos de POP e utilitário de normalização compartilhado.
 *
 * O banco grava `pop_codigo` no formato de 2 dígitos ("POP-01" … "POP-10"),
 * mas parte da interface ainda usa a variante de 3 dígitos ("POP-001").
 * `normalizarPopCodigo()` trata as duas redações como o mesmo POP, sem
 * alterar nenhum registro já salvo.
 */

/** Lista canônica dos 10 POPs oficiais (IN 04/2007), no formato gravado no banco. */
export const POPS_CODIGOS = [
  "POP-01",
  "POP-02",
  "POP-03",
  "POP-04",
  "POP-05",
  "POP-06",
  "POP-07",
  "POP-08",
  "POP-09",
  "POP-10",
];

/** Normaliza "POP-001" e "POP-01" para o mesmo código canônico ("POP-01"). */
export function normalizarPopCodigo(codigo?: string | null): string {
  const m = /^POP-0*(\d{1,2})$/i.exec((codigo || "").trim());
  if (!m) return (codigo || "").trim();
  return `POP-${m[1].padStart(2, "0")}`;
}
