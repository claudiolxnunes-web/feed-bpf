# Equipe e acesso somente leitura
- [x] Aplicar somente o SQL aprovado em migração única, com comparação de e-mail sem distinção de caixa.
- [x] Conferir funções, permissões e trigger por leitura; implementar Equipe, aceite e menu restrito.
- [x] Implementar hook e bloqueio de ações nas operações, preservando consultas e exportações.
- [x] Testes e build OK; Equipe, criação/cópia/cancelamento de convite real e convite inválido conferidos sem alterar membros. Bloqueio visual conferido com respostas simuladas, pois não há visualizador ativo.
- [ ] Conferir aceite válido e operações com visualizador real: depende de uma conta convidada disponível; nenhum membro foi alterado para testes.

# Fase 2 — Fonte única de legislação ligada ao banco

## Base legal do PAC
- [x] Complementar Autocontrole, Manual BPF e Matriz de Risco com os fundamentos do PAC e distinguir 9 POPs de BPF do POP 10, sem alterar regras.
- [x] Build OK e 31 testes passando; textos conferidos nas duas telas com sessão real e no conteúdo usado pelo manual. Sem salvar dados ou publicar; documento final exportado não conferido.

## Correção de dispositivos e contraprova
- [x] Corrigir somente citações de rastreabilidade e orientação de contraprova; manter campos editáveis, valores, cálculos e registros.
- [x] Build OK e 33 testes passando; orientação e campos editáveis conferidos com sessão real em Produção e Rastreabilidade, sem salvar. Alterações apenas textuais; não publicado.

## Substituição de fundamentos desatualizados
- [x] Substituir apenas citações restantes nos arquivos solicitados, preservando notas históricas e regras operacionais.
- [x] Build OK e 33 testes passando; botão PNEEB conferido com sessão real em Rastreabilidade. Mudanças: Rastreabilidade.tsx, orientacoesConfig.ts e roadmap.md; sem banco ou publicação.

## Catálogo central de normas
- [x] Completar NORMAS com 23 normas e citar, preservando os 14 assuntos existentes; telas, banco e funções inalterados.
- [x] Confirmar build automático OK e 37 testes passando; arquivos: baseLegal.ts, normas.test.ts, AGENTS.md e roadmap.md. Sem publicação.

- [x] Migração aprovada e aplicada: coluna `slug` (NULL) em normas_legislacao + índice único parcial (empresa_id, slug); 49 registros intactos, RLS inalterado.
- [x] Hook useBaseLegal (TanStack Query, cache 24 h) com merge banco + reserva; BaseLegalBadge passa a usar o hook; getBaseLegal segue síncrona para PDFs.
- [x] Campo opcional "Assunto (slug)" em Legislacao.tsx, visível só para admin da empresa; build OK, 17 testes passaram. Sem publicação.

# Integrações de agentes

- [x] Adicionar MCP protegido com leituras por empresa e consentimento OAuth, sem ampliar permissões.
- [x] Adicionar leitura na tela de empresas; catálogo gerado, 14 testes passaram, build OK; retorno login/cadastro e solicitação inválida conferidos com conta real.
- [x] Solicitar republicação após validar o catálogo; não publicar automaticamente.
- [ ] Verificar conexão externa, aprovação e cancelamento reais após republicação (depende da publicação autorizada pelo usuário e de solicitação válida de um agente).

# Fase 1C — Limpeza dos resíduos nas telas

- [x] Corrigir somente frases incompletas, parênteses e pontuação nas telas; preservar normas removidas, limites, códigos internos, documentos, Manual, dados e layout.
- [x] Confirmar build, conferir textos em oito telas autenticadas e listar 30 correções antes/depois; 18 testes de regressão passaram. Sem publicação.

# Fase 1B — Citações nas telas

- [x] Criar botão único de base legal e neutralizar citações na apresentação, preservando documentos e dados.
- [x] Conferir telas, popover, build e listar referências preservadas (12 telas autenticadas; botão/link conferidos; 21 testes focados passaram; previews documentais e referências retornadas pela IA preservadas).

Sem banco, Edge Functions ou publicação.

# Fase 1 — Fonte única de legislação

- [x] Criar base legal tipada e hook com reserva síncrona (14 assuntos).
- [x] Substituir citações dos assuntos autorizados nos arquivos indicados, preservando outras normas e lógica (ControleSubstancias sem mudança: apenas normas fora da lista).
- [x] Rodar testes existentes, verificar build e listar arquivos e citações fora do escopo (22 testes unitários passaram; 3 testes antigos de rótulos falharam; suíte E2E bloqueada por Chromium incompatível; verificação com sessão real passou em rotulagem, relatório mensal e fornecedores).

Sem banco, Edge Functions ou publicação.

# Revisão dos textos de identificação e integridade

- [x] Corrigir as alegações nos nove arquivos solicitados, sem mudar campos, registros ou hashes (34 substituições).
- [x] Listar cada texto antes/depois, conferir o conteúdo imprimível do PDF e confirmar build (build OK; relatório com sessão ativa, sem erros; hashes idênticos); não publicar.

---

# Normalização dos códigos de POP (DocumentosBPF)

- [x] Mover `normalizarPopCodigo()` para util compartilhado e reaproveitar no checklist e em DocumentosBPF.
- [x] Trocar a lista `POP_CODIGOS` de `POP-001…POP-010` para `POP-01…POP-10` e normalizar o filtro por código.
- [x] Confirmar build, tipos e teste; listar arquivos alterados (build OK, tsgo limpo, 3 testes).

Não alterar banco, registros salvos nem publicar.

---

# Unificação das listas dos POPs

- [x] Identificar listas fixas locais e eventuais diferenças, preservando o conteúdo das telas.
- [x] Centralizar listas nos arquivos de constantes de cada módulo e remover cópias/imports sem uso.
- [x] Verificar preservação do conteúdo, conferir build e listar os arquivos alterados (32 declarações idênticas; build OK; formulários de Pragas e Resíduos abertos sem erros).

Não alterar banco, registros, regras de negócio nem publicar.