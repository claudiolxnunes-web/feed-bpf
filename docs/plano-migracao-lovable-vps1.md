# Plano de Migração — Feed_BPF: Lovable Cloud → VPS1

**Projeto:** feed-bpf
**Status:** rascunho para validação
**Data:** 2026-08-25
**Contexto:** 3 clientes de fábrica em produção no Lovable Cloud; VPS1 é ambiente de construção sem clientes.

---

## 1. Mapa de ambientes

| Ref Supabase | Ambiente | Acesso |
|---|---|---|
| `uyrcxfypdzasdminxizq` | **Lovable Cloud** — produção, dados das 3 fábricas | Painel + REST/anon apenas. Sem senha de banco, sem service role, sem `pg_dump` |
| `xgvapaebustyotrwnzqa` | **VPS1** — `/opt/feed-bpf`, `bpfsuite.bpfconsult.com.br` | Total (dono) |
| `ufqqskukhzgakmwrsumq` | **Nutri Agro Labels** — gerador de rótulos | Total (dono) — *não pertence a este projeto* |

Origem = Lovable Cloud. Destino = VPS1. Os dois bancos são independentes: nada aplicado no VPS1 até hoje tocou os dados dos clientes.

---

## 2. Correção urgente antes de qualquer coisa

O `supabase/config.toml` do `/opt/feed-bpf` tem `project_id = "ufqqskukhzgakmwrsumq"` — **o ref do Nutri Agro Labels**, não um ref órfão. Qualquer comando do Supabase CLI rodado sem `--project-ref` explícito age sobre o gerador de rótulos. Migration, reset ou deploy de function nesse estado atinge um produto vivo e sem relação com o Feed_BPF.

```
sed -i 's/ufqqskukhzgakmwrsumq/xgvapaebustyotrwnzqa/' /opt/feed-bpf/supabase/config.toml
```

Manter a disciplina do `--project-ref` mesmo depois da correção, como segunda barreira.

---

## 3. Restrições duras (o que a origem não entrega)

| Ativo | Sai? | Via |
|---|---|---|
| Arquivos de Storage | **Sim, integral** | `export-storage` + `download-storage.mjs` |
| Módulo Custom (`documentos_bpf`, `modelos_empresa`, `registros_customizados`) | **Sim** | `backup-manager` (JSON, restore por upsert) |
| Demais tabelas relacionais | Sim, parcial | CSV por tabela/consulta sob demanda + Export data do painel |
| Schema (DDL, RLS, triggers, functions) | **Não** | Reconstruir a partir das migrations do repo |
| `auth.users` (contas, UUIDs, hashes de senha) | **Não** | Ver seção 4 |
| Secrets / env do Lovable Cloud | Não | Recriar no destino |

Consequência: não existe restauração fiel. A migração é uma **reconstrução com remapeamento de identidade**.

---

## 4. O bloqueio central: identidade

Nenhuma via de export entrega `auth.users`. As policies de RLS dependem de `auth.uid()`, e toda tabela operacional carrega `user_id` / `empresa_id`. Importar dados sem resolver isso produz um banco cheio e invisível: os registros chegam, mas nenhum usuário enxerga nada.

**Duas UUIDs com tratamentos diferentes:**

- **`empresa_id` — preservar idêntico, obrigatoriamente.** O caminho de Storage é `bpf/{empresa_id}/{POP}/{tipo}/{IT}/{frequencia}/{arquivo}`. Se o UUID da empresa mudar, todo o acervo baixado deixa de casar com os metadados. Isso não é negociável.
- **`user_id` — remapear.** Recriar os usuários no destino e traduzir as referências.

**Ponte disponível:** a tabela `profiles` (schema `public`) é exportável e contém o vínculo `id` ↔ email ↔ empresa. Ela é a fonte para reconstruir as contas — `auth.users` em si não é necessário, desde que `profiles` saia completo.

**Procedimento:**

1. Exportar `profiles` (e `companies`) da origem.
2. Criar tabela auxiliar `migracao_usuarios (email, uuid_origem, uuid_destino, criado_em)` no destino.
3. Recriar cada conta via Admin API do **seu** projeto (service role disponível). Se a API aceitar `id` explícito, usar o `uuid_origem` e o remapeamento vira identidade; se não aceitar, gravar o `uuid_destino` retornado.
4. Reescrever `user_id` em todos os CSVs pelo `join` com `migracao_usuarios` antes do import.
5. Senhas não migram — todos os usuários fazem redefinição no primeiro acesso.

**Item de comunicação:** as 3 fábricas precisam ser avisadas da redefinição de senha antes do corte, não depois.

---

## 5. Reconciliação de schema

O VPS1 já divergiu da origem e hoje é **superconjunto**: colunas `it_codigo` / `frequencia` em `arquivos_bpf`, camada `vigencia.ts` com `sem_registro`, policy de `storage.objects`, `audit_log` imutável, biblioteca das 22 ITs, base SIPEAGRO.

Implicação: o import não é "espelho" — é carga de dados de um schema antigo para um schema novo. Antes de exportar qualquer tabela, levantar para cada uma:

- colunas que existem na origem e não no destino (descartar ou mapear);
- colunas NOT NULL no destino que não existem na origem (definir default de migração);
- CHECKs novos que os dados antigos podem violar (ex.: `frequencia` em UPPERCASE).

Pendências de schema a fechar **antes** do import, não depois:

- conflito de bucket `documentos_bpf` (underscore) vs `documentos-bpf` (hífen) — decidir o canônico e consolidar;
- branch `fix/auditoria-backup-restore` (autoria no audit log + triggers em `modelos_empresa` e `registros_customizados`) — confirmar se está no remoto;
- reconciliação do `nomenclaturaDoc.ts` mergeado com a branch `feat/biblioteca-its-storage-hierarquico`;
- limpeza dos 20 registros de teste da empresa BPF_Consult.

---

## 6. Ordem de execução

**Fase 0 — Preparação (sem tocar em produção)**
1. Corrigir `config.toml`.
2. Fechar as pendências de schema da seção 5.
3. Escrever e testar os scripts de import contra dados sintéticos no VPS1.
4. Definir a janela de congelamento com as 3 fábricas.

**Fase 1 — Ensaio completo (dados reais, destino descartável)**
5. Export de Storage integral (atenção ao TTL de 1h das signed URLs — se o volume for grande, paginar o download).
6. Export de `companies`, `profiles`, e CSV de todas as tabelas operacionais.
7. `backup-manager` para as 3 tabelas do módulo Custom.
8. Rodar o import inteiro num projeto de teste e medir: tempo total, taxa de erro, tamanho do Storage.
9. **Critério de passagem:** contagem por tabela bate; hashes SHA-256 dos `registros_customizados` conferem; contagem de arquivos bate com o manifesto; um usuário de cada empresa consegue logar e ver os próprios dados.

**Fase 2 — Corte**
10. Congelar escrita na origem (aviso + janela curta).
11. Export delta (só o que mudou desde a Fase 1).
12. Import no destino, na ordem de FK: `companies` → usuários/`profiles` → cadastros (`fornecedores`, `produtos`, `formulas`) → registros operacionais → `audit_log` por último.
13. Validação repetida do critério da Fase 1, agora em produção.
14. Redirecionar acesso para `bpfsuite.bpfconsult.com.br`.

**Fase 3 — Pós-corte**
15. Manter o Lovable Cloud ativo em modo leitura por período definido (sugestão: 30 dias) antes de cancelar.
16. Guardar o export bruto da Fase 2 fora dos dois ambientes.

---

## 7. Riscos abertos

**`export-storage` com `verify_jwt = false`.** A função varre todos os buckets e devolve signed URL de tudo, protegida apenas pelo secret `STORAGE_EXPORT_TOKEN`. Ela contorna RLS e o isolamento entre empresas: um único token baixa o acervo das três fábricas. Rotacionar após cada uso trata o sintoma. O tratamento adequado é mantê-la desabilitada fora das janelas de export ou exigir JWT de service role. Para um produto de conformidade MAPA, isso é achado de auditoria de cliente.

**Cadeia de custódia do `audit_log`.** A tabela é imutável por policy (INSERT + SELECT). Importar nela exige service role no destino — disponível, mas o efeito é que o log migrado passa a ter data de inserção diferente da data do evento. Definir se isso é aceitável para efeito de auditoria MAPA, e registrar a decisão.

**Hash dos registros customizados.** `registros_customizados` carrega SHA-256. A validação pós-import precisa recalcular e comparar, não só contar linhas.

**Assinaturas e licenças.** Paddle e o mecanismo de licença (que checa `data_expiracao` por data) estão amarrados à instância de origem. Decidir como a cobrança e as licenças atravessam o corte — item ainda sem dono.

**Volume desconhecido.** Nenhum número de linhas ou GB de Storage foi levantado. A Fase 1 existe para produzir esses números antes de comprometer uma janela.

---

## 8. Decisões pendentes

| # | Decisão | Bloqueia |
|---|---|---|
| D1 | Bucket canônico: `documentos_bpf` ou `documentos-bpf` | Fase 0 |
| D2 | Aceitar `audit_log` com data de inserção remapeada? | Fase 2 |
| D3 | Duração da janela de congelamento | Fase 2 |
| D4 | Destino de Paddle e licenças | Fase 2 |
| D5 | Prazo de retenção do Lovable Cloud pós-corte | Fase 3 |

---

## Ingestão no WorkDev

Sugestão de quebra:

- **ADR** — a decisão de arquitetura ("migrar por reconstrução com remapeamento de identidade, não por restauração"), salva de dentro da rota do projeto (`/projects/feed-bpf`), não pela `/engineering` global.
- **Knowledge** — seções 1, 3 e 4 como entradas `category: 'decisao'`, com tags em string separada por vírgula.
- **Backlog** — seções 6 e 8 viram itens; D1–D5 entram como bloqueadores.

Vale registrar a seção 7 separadamente: os dois primeiros itens são achados de segurança e conformidade, com valor independente do desfecho da migração.
