## Saída do Lovable e merge do lovable/main

**Data:** 21/10/2026 | **Projeto:** Feed_BPF (`xgvapaebustyotrwnzqa`) | **Commit:** `5f1d82ee`


### Em uma frase
A `main` do Feed_BPF recebeu tudo o que o Lovable tinha de novo e ficou sem nenhuma dependência do Lovable em e-mail, WhatsApp e MCP. Os testes passam todos, e o webhook de bounce/spam do Resend já roda em produção.

### Resultados do dia
- **3 PRs mesclados na `main`** (agora em `5f1d82ee`):
  - **PR #4**: merge do `lovable/main`.
  - **PR #5**: correção dos 2 testes que já falhavam (vitest 120/120).
  - **PR #6**: remoção das dependências do Lovable.
- **Produção (Supabase `xgvapaebustyotrwnzqa`, bpf-suite)**: `handle-email-events` publicado e webhook do Resend cadastrado para `email.bounced` e `email.complained`. Teste: sem assinatura retorna 401, com assinatura retorna 200.
- **`gh` CLI autenticado** como `claudiolxnunes-web`. A partir de agora os PRs podem ser abertos pelo terminal.

### Linha do tempo
1. **Paridade das Edge Functions**, na branch `feat/paridade-functions-lovable`. As melhorias do Lovable foram portadas sem trazer as dependências dele:
   - `paddle-webhook` e `auditor-portal`;
   - `campanha-worker`, `crm-send-email`, `marketing-bulk-send` e os prompts;
   - núcleo da base legal.
2. **Merge do repositório Lovable** (`create-with-voice`), na branch `feat/merge-lovable-main`:
   - 30 conflitos resolvidos.
   - **Risco evitado:** o merge apagaria sem avisar a fila de e-mail (Resend) e o WhatsApp (Evolution). Os dois foram restaurados.
   - **Ficou a nossa versão:** `exportPop` (docx real), upload com rollback, validação SIPEAGRO, `backup-manager` e checkout por flag.
   - **Ficou a versão do Lovable:** mapa POP → módulo, Recebimento com edição, PlanilhasPop e backup de arquivos.
   - **Perda conhecida:** o versionamento automático no `AnexarPlanilhaPop` e a coluna "Frequência" em Documentos. Dá para reaplicar depois.
3. **PR #4 aberto e mesclado** com merge commit, para que o próximo sync com o Lovable não volte a dar conflito.
4. **PR #5**: correção de `RotulosBPFPage.test.tsx` e `vitest.config.ts`, sem mexer no código das telas.
5. **PR #6**: saída do Lovable.
   - E-mail volta para a fila + Resend.
   - `evolution-send` só com Evolution.
   - MCP com handler e autenticação próprios.
   - Removidos `handle-email-suppression` e `preview-transactional-email`.
6. **Deploy em produção** de `handle-email-events` e cadastro do secret `RESEND_WEBHOOK_SECRET`.

### Decisões
- **Paddle:** está bloqueado pela plataforma. O `paddle.ts` não foi alterado, e o checkout continua desligado (`PADDLE_CHECKOUT_ENABLED=false`, botão "Em breve" que leva ao WhatsApp).
- **WhatsApp:** só pela Evolution, com 2 instâncias nos celulares do Cláudio.
- **Hook de e-mail de login:** não foi ativado. O Auth envia os e-mails sozinho e funciona.
- **Deploy:** publicar uma função por vez, com confirmação antes de cada uma.

### Riscos e pendências
- A maior parte das Edge Functions em produção ainda foi publicada a partir do backup do Lovable (`/opt/backups/lovable-repos/create-with-voice`), e não da `main`.
- `/opt/feed-bpf` na VPS1 está desatualizado (`9cb5b1c`).
- Republicar da `main` muda o comportamento:
  - `notify-new-lead`, `cadencia-worker` e `whatsapp-monitor` deixam a fila e passam a enviar direto;
  - `evolution-send` difere 105 linhas da produção.
- O modo automático bloqueou a CLI do Supabase na VPS. O conector `deploy_edge_function` funcionou.

### Próximos passos (22/10)
1. Conferir o 1º bounce real em `email_send_log` / `suppressed_emails`.
2. Atualizar `/opt/feed-bpf` na VPS1. Antes, olhar `supabase/.temp` e o doc não versionado.
3. Definir uma fonte única de deploy e republicar da `main`, uma função por vez. Testar `evolution-send` com os 2 celulares.
4. Apagar `handle-email-suppression` e `preview-transactional-email` em produção.
5. `mcp`: publicar só se o MCP for usado (exige o servidor OAuth do Supabase Auth ligado).
6. Opcional: `auth-email-hook`, com segredo e testes numa conta de teste.
7. Limpeza: tirar `lovable-tagger` e `@lovable.dev/vite-plugin-*` do `package.json` e os comentários antigos que citam o "Lovable AI Gateway".

### Links
- PRs: [#4](https://github.com/claudiolxnunes-web/feed-bpf/pull/4) · [#5](https://github.com/claudiolxnunes-web/feed-bpf/pull/5) · [#6](https://github.com/claudiolxnunes-web/feed-bpf/pull/6)
- Repositório Lovable: https://github.com/ClaudioXavier-creator/create-with-voice
