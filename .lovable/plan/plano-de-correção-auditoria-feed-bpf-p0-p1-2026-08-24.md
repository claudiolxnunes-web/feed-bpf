# Plano de Correção — Auditoria Feed_BPF (P0 → P1)

Correção dos bloqueadores levantados na auditoria somente-leitura (blocos 1 a 5). Execução em 4 etapas, da mais crítica para a menos. Sistema em produção: cada etapa é isolada e reversível.

## Etapa 1 — Segurança da plataforma (P0)

- Remover a função `migrate-helper` (expõe service_role e URL do banco com chave fixa versionada) e sua entrada em `supabase/config.toml`.
- Passar a verificar a assinatura do webhook do Paddle antes de criar ou atualizar licenças; requisição sem assinatura válida é rejeitada com 401.
- Agendar o disparo diário da função de alertas de vencimento (hoje ela existe mas nunca roda), autenticada pelo segredo já previsto na função.
- Proteger a rota `/admin-access` com login, como as demais rotas administrativas.
- Remover funções órfãs sem chamador nem agendamento: `paddle-gateway-test`, `send-whatsapp`, `whatsapp-webhook` (duplicatas da integração Evolution em uso).

## Etapa 2 — Isolamento por empresa (P0)

- Reescrever as regras de acesso das 32 tabelas que hoje isolam por criador do registro para isolar por empresa, usando o padrão já existente no projeto (vínculo de membro ativo da empresa). Isso corrige o caso em que o RT não enxerga o que o operador lançou.
- Corrigir as telas que consultam sem escopo de empresa:
  - relatório anual (13 consultas) e a busca da empresa que hoje pega uma empresa qualquer;
  - relatório de produção;
  - higiene/sanitização (registros de limpeza, ASOs e contadores);
  - documentos e checklist de pré-auditoria.
- Revisar a regra de acesso da tabela de campanhas, hoje sem escopo de empresa nem de usuário.

## Etapa 3 — Integridade e trilha de auditoria (P0)

- Estender a trava de imutabilidade de registro assinado às demais tabelas de registro legal (produção, limpeza, análises, pragas, saúde, calibração, manutenção, resíduos, substâncias, NCs, ordens de produção, documentos, manuais). Onde faltar campo de situação — caso de produção —, criar o campo com o fluxo rascunho/liberado.
- Registrar o autor na trilha de auditoria também quando a escrita vem de função de servidor ou rotina agendada, e passar a gravar o IP/origem.
- Criar regra que permita ao administrador e ao RT da empresa lerem a trilha da própria fábrica, mantendo o bloqueio de alteração e exclusão (somente inclusão).
- Ativar auditoria nas tabelas hoje sem ela: monitoramento de PCC, amostras de retenção e execução de ITs.
- Padronizar o selo SHA-256 nas tabelas de registro crítico (hoje presente em uma única tabela).

## Etapa 4 — Conformidade do conteúdo (P0/P1)

- Corrigir os checklists trocados na execução de POPs: triagem de pessoal passa para POP 03, limpeza de ambiente para POP 02, checklist de veículo para POP 02 (PL 2.4) e remoção da duplicata sob POP 05, que passa a usar o checklist de contaminação cruzada.
- Migrar as chaves antigas de módulo do Feed_BPF Custom para a numeração oficial, atualizando os registros já gravados.
- Corrigir os dois links quebrados do menu do Feed_BPF Custom e apontar o item PAC para a tela de Autocontrole.
- Ajustar o título da tela de Armazenamento e Transporte para coincidir com o grupo em que ela aparece no menu.

## Detalhes técnicos

- Arquivos principais: `supabase/functions/migrate-helper/` (remoção), `supabase/functions/paddle-webhook/index.ts`, `supabase/config.toml`, `src/App.tsx`, `src/pages/Relatorios.tsx:205-215`, `src/pages/RelatorioProducao.tsx:114`, `src/pages/HigieneSanitizacao.tsx:371,415,441`, `src/pages/Documentos.tsx:184`, `src/pages/ChecklistPreAuditoria.tsx:35`, `src/pages/ExecucaoPops.tsx:59-63,117-122`, `src/components/layout/FeedBpfCustomSidebar.tsx:81-90`, `src/pages/ArmazenamentoTransporte.tsx:341-342`.
- Banco: novas policies por empresa reutilizando `is_membro_empresa`/`pode_usar_empresa`; extensão dos gatilhos `bloquear_registro_assinado` e `process_audit_log`; ajuste de `process_audit_log` para capturar autor em contexto de service_role; cron diário para `alertas-vencimento`.
- Migração de dados: conversão das chaves `pop-01-agua`, `pop-04-mp`, `pop-05-armazenamento`, `pop-09-transporte` em `empresa_modulos_custom`.
- Cada etapa termina com verificação: leitura das policies aplicadas, teste de gravação como membro não-criador e conferência de que registros já liberados permanecem imutáveis.

## Riscos

- Trocar o isolamento de criador para empresa pode ocultar registros antigos com `empresa_id` nulo: antes de aplicar, os registros órfãos são vinculados à empresa do criador.
- Ativar imutabilidade em tabelas já em uso pode bloquear correções em andamento: a trava só vale para registros marcados como liberados/assinados.
