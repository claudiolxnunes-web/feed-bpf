# Plano de Implementação: Melhorias de UX e Conformidade MAPA

Este plano foca em estender as travas de imutabilidade, melhorar a experiência do usuário (UX) no módulo de PCC e implementar a lógica de alertas de revisão anual no dashboard conforme exigências do MAPA (IN 04/2007 e Decreto 12.031/2024).

## 1. Monitoramento PCC: UX e Conformidade
*   **Auto-save (Draft Persistence)**: Implementar `useSessionDraft` para persistir o formulário de PCC.
*   **Edição/Exclusão Auditada**: Adicionar botões de ação e diálogos de confirmação.
*   **Imutabilidade (Locking)**: Bloquear edição/exclusão de registros com status diferente de 'bloqueado' (ex: 'aprovado').
*   **Status Visual**: Adicionar badges de status e ícones de cadeado para registros imutáveis.
*   **Histórico e Log**: Integrar `registrarAuditLog`.

## 2. Botão "Abrir NC" para Registros Bloqueados
*   **Nova Funcionalidade**: Adicionar um botão "Abrir NC" em registros que já estão bloqueados.
*   **Fluxo**: Ao clicar, abrir o formulário de Não Conformidade pré-preenchido com os dados do registro original (etapa, descrição do erro, data).
*   **Justificativa**: Conforme o MAPA, correções em registros assinados devem ser feitas via abertura de NC, nunca por edição direta.

## 3. Alertas de Revisão Anual (Dashboard)
*   **Cálculo de Periodicidade**: Validar a lógica de cálculo de validade (365 dias) baseada na `data_aprovacao` ou `updated_at` dos POPs.
*   **Dashboard Widget**: Atualizar `DashboardPopStatus.tsx` para refletir as faixas de alerta:
    *   **No Prazo** (Verde)
    *   **Vencendo em 30 dias** (Amarelo)
    *   **Vencido** (Vermelho)
*   **Ações Prioritárias**: Garantir que POPs vencidos ou prestes a vencer apareçam na lista de ações urgentes do dashboard.

## Detalhes Técnicos
*   **Tabelas Afetadas**: `monitoramento_pcc`, `arquivos_bpf`, `nao_conformidades`.
*   **Segurança**: O gatilho `bloquear_registro_assinado` no banco já protege contra alterações maliciosas; a UI apenas refletirá esse bloqueio.
*   **Hooks**: Uso de `useSessionDraft` e `useEmpresa`.
*   **Utilitários**: Uso de `isRegistroImutavelError` e `mensagemErroRegistro`.
