# Delta Lovable Cloud × VPS1 — Feed_BPF

Comparação entre o banco de **produção** (Lovable Cloud, ref `uyrcxfypdzasdminxizq`,
onde estão as 3 fábricas clientes) e o **ambiente próprio** (`xgvapaebustyotrwnzqa`,
servido pelo `/opt/feed-bpf` em `bpfsuite.bpfconsult.com.br`).

- Diff executado em **02/09/2026**.
- Documento **reconstruído em 03/09/2026**: o texto original da sessão de diff não
  foi salvo em disco nem no Knowledge do WorkDev. Ver "Procedência" no fim.
- Fonte de verdade em caso de divergência: **a versão Lovable**, onde estão os
  clientes — exceto onde este documento registra o contrário e explica por quê.

---

## 1. Escopo e método

O diff cobriu seis dimensões: tabelas, colunas, funções, triggers, políticas de RLS
e contagens de linhas. O schema estava **96% igual**. As divergências reais não
estavam na estrutura, e sim em **RLS, triggers de integridade e duas funções**.

Ficaram **fora** do diff, e continuam pendentes: índices, constraints
(PK/FK/UNIQUE/CHECK), defaults de coluna, enums, buckets de storage e suas policies,
grants de execução, views e extensões. Ver seção 6.

---

## 2. Baseline do `xgvapaebustyotrwnzqa` (colhida ao vivo em 03/09/2026)

| Dimensão | Valor |
|---|---|
| Tabelas em `public` | 107 |
| Tabelas sem RLS | **0** |
| Policies | 213 |
| Colunas | 1.544 |
| Constraints | 315 |
| Índices | 303 |
| Triggers não-internos | 152 |
| Funções em `public` | 38 |
| Enums | 2 |
| Views | 0 |
| Extensões | 8 |
| Buckets de storage | 6 |
| Objetos em storage | 80 |

Dos 152 triggers: 77 de auditoria, 27 de bloqueio de registro assinado, 48 outros.

---

## 3. Migrações aplicadas em 02/09/2026

Três migrações, aplicadas **apenas no `xgvapaebustyotrwnzqa`**. Versionadas em
`supabase/migrations/` com os nomes exatos do histórico remoto, para que
`supabase db push` não tente reaplicá-las.

### 3.1 `20260902221833_paridade_producao_01_estrutura`

- Cria `public.execucao_its` (a tabela existia em produção e faltava aqui).
- Habilita RLS e cria a policy `Acesso por dono ou membro empresa` usando
  `is_membro_empresa` / `pode_usar_empresa`. **Deliberadamente diferente da
  produção**: a policy de lá tem vazamento (seção 5).
- Instala `trg_audit_execucao_its` (`process_audit_log`).
- Acrescenta `metadata jsonb` e `versao integer default 1` em `arquivos_bpf`.

### 3.2 `20260902221915_paridade_producao_02_funcoes_triggers`

- Recria `bloquear_registro_assinado()` — bloqueia UPDATE/DELETE em registro cujo
  `status`/`status_verificacao` esteja em estado terminal (`liberado`, `concluido`,
  `arquivado`, `assinado`, `expedido`, `finalizado`, `vigente`, `obsoleto`,
  `aprovado`) ou que tenha `hash_integridade`. Base declarada: Decreto 12.031/2024.
- Recria `normalize_licenca_produto()` e seu trigger em `licencas`.
- Instala `trg_bloquear_registro_assinado` (BEFORE UPDATE OR DELETE) nas 27 tabelas
  de registro operacional.

**Ponto de atenção:** a função retorna cedo, sem checar status nem hash, quando o
papel é `service_role`. É o que permite backup/restore funcionar — e é o escape
tratado na seção 7.

### 3.3 `20260902222112_paridade_producao_03_rls_padrao`

Padroniza a RLS em 38 tabelas, em dois blocos:

- **Bloco A** (23 tabelas) — estavam isoladas só por usuário, sem cláusula de
  empresa.
- **Bloco B** (15 tabelas) — tinham a policy certa, mas com expressão divergente da
  produção.

Em cada uma, remove as policies existentes e cria a policy padrão única.

### 3.4 Resultado verificado

- `execucao_its` criada.
- 27 triggers de imutabilidade instalados.
- RLS padronizada em 38 tabelas.
- Divergências de RLS: **de 49 para 12**.

---

## 4. Divergências de RLS remanescentes (12)

Onze tabelas têm regra própria dos dois lados e exigem decisão caso a caso — não
devem ser padronizadas no automático:

`agrogestao_metas`, `audit_log`, `documento_aprovacoes`, `empresas`, `equipamentos`,
`licencas`, `mapa_estabelecimentos`, `mapa_importacoes`, `modelos_empresa`,
`normas_legislacao`, `registros_customizados`.

Critério de fechamento: cada uma vira convergência ou vira divergência **documentada
e intencional**. Nenhuma fica sem decisão explícita.

---

## 5. Vazamento de RLS em `execucao_its` na PRODUÇÃO

**Severidade: crítica. Ainda aberto.**

As policies de produção usam um `UNION` cujo segundo ramo devolve a própria
`empresa_id` da linha avaliada, com `user_roles` servindo apenas como teste de
existência. Efeito prático: **qualquer usuário com linha em `user_roles` lê e insere
execuções de IT de qualquer empresa.**

Correção: substituir pelo padrão `is_membro_empresa` (que já está escrito e
versionado na migração 3.1) e adicionar trigger de auditoria.

**Parada obrigatória antes de trocar a policy:** conferir
`count(*) filter (where user_id is null)` em `execucao_its`.

Executar pelo agente do Lovable — nenhum agente do WorkDev alcança aquele banco.

---

## 6. Dimensões não cobertas pelo diff

Faltam comparar: índices, constraints, defaults de coluna, enums, buckets de storage
e suas policies, grants de execução, views e extensões.

A baseline do lado VPS1 está na seção 2. Do lado da produção, rodar
`baseline/QUERIES_PRODUCAO.sql` (7 consultas de leitura) no SQL editor do Lovable e
comparar. Diferenças viram item de backlog ou ficam documentadas como aceitas.

---

## 7. Escape de `service_role` no restore

`bloquear_registro_assinado()` libera `service_role`, e é isso que faz o
`backup-manager` funcionar. Mas o restore grava `restore_backup` no `audit_log` e o
upsert passa por cima do bloqueio: **um restore seletivo reescreve registro liberado
sem Não Conformidade.**

Diante de auditoria do MAPA isso é caminho aberto, porque contraria a regra de
projeto: registro salvo é imutável e a correção é feita por fora, com justificativa.

Decisão pendente: restore seletivo exige NC vinculada, ou fica restrito a recuperação
de desastre?

---

## 8. Exportação de Storage — `export-storage`

Ferramenta de saída de arquivos do plano de migração. A produção roda em Lovable
Cloud, onde senha do banco e service role key não são acessíveis e `pg_dump` não é
oferecido; arquivos saem integralmente por esta função, dados relacionais só por
CSV/JSON.

Único consumidor: o script CLI `download-storage.mjs`, execução manual. Não é chamada
pelo frontend, por outra edge function nem por rotina agendada.

**Hardening concluído e validado em 03/09/2026:**

1. Token aceito **exclusivamente** pelo header `x-export-token`. A leitura de
   `?token=` foi removida do código.
2. CORS fechado. `STORAGE_EXPORT_ORIGIN` **não cadastrado, por decisão** — sendo o
   consumo server-to-server, nenhuma origem deve ser liberada. A resposta não emite
   `access-control-allow-origin`; `Vary: Origin` presente.
3. Comparação do token em tempo constante (comprimento no `diff` inicial, XOR byte a
   byte, sem short-circuit).
4. Log de auditoria estruturado (`[export-storage][AUDIT]`) com IP, origem,
   user-agent, método, timestamp e motivo — para chamadas autorizadas e negadas.
5. `STORAGE_EXPORT_TOKEN_ALT`, resíduo de uma rotação anterior nunca concluída,
   removido do código e do cadastro de secrets.
6. `download-storage.mjs` passou a ler o token da variável de ambiente
   `STORAGE_EXPORT_TOKEN`.
7. `STORAGE_EXPORT_TOKEN` rotacionado; custódia do valor com o responsável, definido
   pelo formulário de secrets — nunca pelo chat do agente.

**Validação por observação direta contra produção:**

| Teste | Resultado | Conclusão |
|---|---|---|
| Header com token válido | 200 | Caminho feliz operante |
| Query string com token **válido** | 401, log diz "header ausente" | A função não lê `?token=` |
| Token anterior à rotação | 401 | A substituição revoga de fato |
| Log de chamada autorizada | `outcome:"authorized"` com IP e timestamp | Auditoria cobre sucesso, não só falha |

**Notas de processo:**

- A rotação anterior ficou incompleta por falta do teste de revogação — foi o que
  originou o `_ALT`. O teste do valor antigo passa a ser obrigatório em toda rotação.
- Teste de rejeição com token **inválido** não prova nada: retorna 401 por token
  errado, indistinguível de qualquer outra causa. Só o teste com token **válido** no
  canal proibido é conclusivo.
- **Esse teste conclusivo queima o token**, pois grava o valor na URL do log de
  borda. Validar com token descartável e só depois cadastrar o definitivo.
- Pendência menor: o registro de evento negado não traz o campo `timestamp` no JSON
  (o horário existe apenas na linha do log).

---

## 9. Pendências

| # | Pendência | Local | Prioridade |
|---|---|---|---|
| 1 | Vazamento de RLS de `execucao_its` | Produção | crítica |
| 2 | Backfill de `licencas.produto` (8 linhas fora do padrão) | VPS1 | média |
| 3 | Criar `modelos_bpf` em produção (22 ITs base) | Produção | média |
| 4 | Destino de `execucao_pops.it_codigo / modelo_id / valores` | VPS1 | média |
| 5 | Decidir as 11 tabelas com RLS própria | VPS1 | média |
| 6 | Fechar o diagnóstico nas dimensões não cobertas | Produção | alta |
| 7 | Reteste de isolamento entre empresas (14 fluxos críticos) | VPS1 | alta |
| 8 | Decidir a regra do restore seletivo | VPS1 | média |
| 9 | Carga SIPEAGRO em produção (5.705 estabelecimentos) | Produção | baixa |

Todas registradas no backlog do WorkDev, projeto `bpf-suite`, sprint v2.4, sob a task
`Paridade de banco Feed_BPF: VPS1 x produção Lovable`.

Regra de despacho: agente recebe plano apenas para trabalho executável no VPS1 que
**não seja decisão de arquitetura**. Nenhum agente do WorkDev alcança o banco de
produção.

---

## 10. Procedência

Este documento foi reconstruído em 03/09/2026. O que vem de cada fonte:

- **Verificado ao vivo nesta data:** a baseline da seção 2 e o conteúdo integral das
  três migrações da seção 3, lidos do histórico `supabase_migrations.schema_migrations`
  do `xgvapaebustyotrwnzqa`.
- **Verificado por teste direto:** toda a seção 8.
- **Herdado da sessão de diff de 02/09/2026, não recomputado:** a contagem de
  divergências de RLS (49 → 12), a descrição da policy vazada em produção (seção 5) e
  a lista das 11 tabelas da seção 4. Refazer esses números exige acesso ao banco de
  produção.
- **Não recuperado:** o texto original da sessão de diff, que não foi salvo em disco
  nem no Knowledge do WorkDev.
