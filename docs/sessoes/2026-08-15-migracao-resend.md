## Migração process-email-queue: Lovable → Resend

**Data:** 15/08/2026 | **Projeto:** Feed_BPF (`xgvapaebustyotrwnzqa`) | **Commit:** `f33314d`

### Problema
Item de backlog classificado como crítico dizia que cadastro e recuperação de senha dependiam da fila `process-email-queue`, que só rodava por invocação manual. **A premissa era falsa.**

### O que a investigação revelou
Não era um cron ausente, era uma cadeia de peças faltando:

1. **`npm:@lovable.dev/email-js` é pacote privado** — `deno check` não resolve. A função abortava na linha 1, permanentemente quebrada. Recriar `LOVABLE_API_KEY` não resolveria.
2. **`pg_cron`, `pg_net` e `pgmq` não estavam habilitadas** no projeto.
3. **Nenhuma das 4 filas pgmq existia** — o schema `pgmq` não veio no dump de origem (`-n public -n auth -n storage`). As RPCs sobreviveram porque moram em `public`.
4. **Causa-raiz:** a migration `20260427132427_email_infra.sql` cria as filas com `EXCEPTION WHEN OTHERS THEN NULL`, engolindo "schema pgmq não existe" e reportando sucesso.

### Correção da premissa
`email_send_log` contém apenas `new-lead-notification`. Cadastro e recuperação de senha saem pelo **SMTP nativo do Auth**, não por esta fila. O item foi reclassificado de crítico para medium.

### O que foi feito
- `create extension pgmq` + 4 filas (`auth_emails`, `transactional_emails`, e as duas DLQ)
- `_shared/resend.ts` com `sendResendEmail()` mantendo a assinatura de `sendLovableEmail` — linha 252 do `index.ts` intocada
- Remetente `nao-responda@bpfconsult.com.br` (domínio já verificado no Resend há 3 meses)
- `unsubscribe_token` → header `List-Unsubscribe`
- `RESEND_API_KEY` nos Edge Functions Secrets; `service_role_key` no Vault para o cron
- Cron `*/5` reagendado (jobid 2)

### Validação
| Verificação | Resultado |
|---|---|
| `net._http_response` | 200 às 22:00 |
| `email_send_log` | `sent` às 22:00:04 |
| Progressão | 401 → 500 → 200 |

### Achado transversal
`EXCEPTION WHEN OTHERS` presente em **16 migrations de 6 projetos**: feed-bpf (5/144), create-with-voice (5/142), audits-bpf (2/50), agro-rc (1/106), agrogestao (1/53), soil-to-client (1/106). Zero em bpf-solutions-suite, friendly-flame-igniter, rapid-ai-ally. Cada uma pode ter falhado em silêncio. **Auditoria pendente** — método: comparar o que a migration declara criar com o que `information_schema` e `pg_extension` mostram.

### Correções ao levantamento inicial
- **Funções de IA já estavam migradas.** `analisar-acervo-custom` e `analisar-laudo-ia` apontam para OpenRouter com fallback Gemini. O que o `grep -rn "lovable"` pegou foi comentário obsoleto, não código. Reclassificado para Low/apagar comentário.
- **WhatsApp já funcionou.** 11/06: 1 `sent`, 1 `bounced`. O bounce colocou `61996757585@c.us` na lista de supressão; os 5 `suppressed` seguintes são consequência. Não é feature incompleta.

### Dependências Lovable remanescentes
| Prioridade | Item |
|---|---|
| High | `handle-email-suppression` — `npm:@lovable.dev/webhooks-js` (privado, mesmo problema) |
| High | `_shared/paddle.ts` — roteia por `connector-gateway.lovable.dev`; bloqueia faturamento direto |
| Medium | `new-lead-notification` com número WhatsApp em `recipient_email` |
| Low | Comentários obsoletos de AI Gateway |
| Low | `preview-transactional-email` — confirmar código morto |

### Notas operacionais
- **Evolution API é infraestrutura própria** (migrada do Twilio). E-mails do Lovable sobre "WhatsApp desconectado" referem-se ao ambiente deles — falso positivo.
- **Repos GitHub desconectados do Lovable** há tempos: sem acesso, sem commit, sem push.
- Revert órfão limpo em `/opt/feed-bpf` (`.git/REVERT_HEAD` sem alvo). Working tree limpo.
- **Alerta pendente:** deploy pode estar saindo de `/opt/backups/lovable-repos/create-with-voice` em vez de `/opt/feed-bpf` — verificar.

### Lição
`grep` em comentário não é evidência. A verificação tem que ser no código, e o estado real do banco vale mais que o registro de migrations.

**Backlog Feed_BPF:** 27 itens, 20 abertos — 7 high, 5 medium, 8 low. **Zero críticos.**
