import type { NavigateFunction } from "react-router-dom";

/**
 * Abre a tela de Não Conformidades pré-preenchida para corrigir um registro.
 * Registros salvos não são excluídos (Decreto 12.031/2024) — a correção é via NC.
 * A NC só é criada se o usuário salvar na tela de destino.
 */
export function corrigirViaNC(
  navigate: NavigateFunction,
  params: { tabela: string; registroId: string; descricao: string }
) {
  navigate("/nao-conformidades", {
    state: {
      prefillNC: {
        descricao: `[Correção de registro — ${params.tabela} #${params.registroId}] ${params.descricao}`,
      },
    },
  });
}
