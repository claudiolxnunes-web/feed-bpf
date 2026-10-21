/**
 * Registros oficiais assinados/liberados são imutáveis (Decreto 12.031/2024, IN 04/2007).
 * O bloqueio é aplicado no banco por gatilho; aqui traduzimos o erro para o usuário.
 */

const MARCADORES = ["imutável", "imutavel", "exigência MAPA", "exigencia MAPA"];

/** Indica se o erro veio da trava de integridade do banco. */
export function isRegistroImutavelError(error: unknown): boolean {
  const msg = (error as { message?: string } | null)?.message ?? "";
  return MARCADORES.some((m) => msg.toLowerCase().includes(m.toLowerCase()));
}

/** Mensagem pronta para toast, com fallback para o erro original. */
export function mensagemErroRegistro(error: unknown, fallback = "Erro ao processar registro"): string {
  if (isRegistroImutavelError(error)) {
    return "Registro assinado/liberado é imutável (exigência MAPA). Abra uma Não Conformidade para correções.";
  }
  return (error as { message?: string } | null)?.message || fallback;
}
