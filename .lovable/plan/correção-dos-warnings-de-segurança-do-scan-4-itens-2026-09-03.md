# Correção dos warnings de segurança do scan (4 itens)

## Contexto

O scan de segurança mais recente reportou 4 warnings no scanner `supabase_lov`. Nenhum é crítico, mas todos devem ser neutralizados para manter o padrão do projeto: RLS estrito, policies no role `authenticated`, e sem risco de auto-escalação de privilégio.

## O que será feito

### 1. Trocar role `public` por `authenticated` em 4 policies

Tabelas afetadas:
- `monitoramento_pcc`
- `pac_monitoramento`
- `fornecedor_auditorias`
- `whatsapp_mensagens`

Ação: recriar as policies existentes com `TO authenticated`, preservando as condições atuais. Isso elimina ambiguidade e impede exposição acidental futura.

### 2. Verificar e endurecer `empresa_membros` contra auto-insert de admin

Ação: revisar a função `tem_papel_empresa()` e as policies `INSERT`/`UPDATE`/`DELETE` de `empresa_membros`. Garantir que:
- Nenhum usuário possa inserir seu próprio primeiro vínculo com `papel = 'admin'`.
- O bootstrap de primeira membership só ocorra via fluxo de convite (`convites_empresa`) ou `service_role`.
- Se necessário, adicionar `WITH CHECK` que proíbe `papel = 'admin'` em inserts do role `authenticated`.

### 3. Decidir e documentar o acesso a `mapa_estabelecimentos`

A tabela é um diretório público regulatório (dados MAPA). Opções:
- **A)** Manter admin-only (status quo, não é vulnerabilidade).
- **B)** Abrir `SELECT` para `authenticated` se o app precisar consultar esse diretório em rotas protegidas.

Ação: implementar a opção escolhida e deixar a justificativa documentada na migração.

## Entregáveis

- Uma migração SQL com todas as alterações acima.
- Nenhuma publicação será feita sem ordem explícita.
- Nenhum teste de edge function será re-executado (o token já foi validado).

## Riscos

- Trocar `public` por `authenticated` não muda o comportamento para usuários logados, mas evita vazamento caso a condição `auth.uid()` seja removida no futuro.
- Endurecer `empresa_membros` pode afetar o fluxo de primeiro usuário/owner de empresa; será validado sem quebrar o onboarding.
