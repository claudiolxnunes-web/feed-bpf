# Correção de RLS da tabela execucao_its

## Verificação prévia (feita)

- `execucao_its` tem **0 linhas** no total — portanto **0 linhas com `user_id` nulo** e 0 com `empresa_id` nulo. A troca de policies não afeta nenhum registro existente.
- Policies atuais confirmadas: a subconsulta do UNION seleciona `execucao_its.empresa_id` (a própria linha) filtrando apenas por `user_roles.user_id = auth.uid()`, ou seja, qualquer usuário com registro em `user_roles` enxerga e insere dados de qualquer empresa.

## O que será feito

Uma migração que remove as duas policies atuais e cria o padrão usado nas demais tabelas:

- Leitura/uso: dono do registro ou membro da empresa.
- Gravação: apenas o próprio usuário, e somente em empresa que ele pode usar.

## Detalhes técnicos

```sql
DROP POLICY "Users can view their own company IT executions" ON public.execucao_its;
DROP POLICY "Users can insert IT executions for their company" ON public.execucao_its;

CREATE POLICY "execucao_its_select" ON public.execucao_its
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())));

CREATE POLICY "execucao_its_insert" ON public.execucao_its
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND (empresa_id IS NULL OR public.pode_usar_empresa(empresa_id, auth.uid())));
```

Nada será publicado; apenas a migração é preparada para sua aprovação.
