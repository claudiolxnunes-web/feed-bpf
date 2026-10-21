# Endurecer policies de `empresa_modulos_custom` + resultado do scan

## Resultado do scan de segurança (04/09/2026 20:31 UTC)

4 warnings, nenhum crítico:

1. **`empresa_modulos_custom` com policies no role `public`** (novo, procedente) — será corrigido por esta migração.
2. Funções `SECURITY DEFINER` executáveis por usuários autenticados — já ignorado por você anteriormente (intencional: `has_role`, `is_membro_empresa`, etc.).
3. `empresa_membros` auto-insert com papel elevado — já ignorado; a policy INSERT atual já proíbe `papel = 'admin'` e exige admin existente.
4. `convites_empresa` sem SELECT para autenticados — já ignorado; desenho intencional (aceite via edge function service_role).

## Estado atual verificado no banco

- `monitoramento_pcc`, `pac_monitoramento`, `fornecedor_auditorias`, `whatsapp_mensagens`: policies já estão `TO authenticated` — nada a fazer.
- `empresa_membros`: INSERT já endurecido (proíbe auto-insert como admin) — nada a fazer.
- `empresa_modulos_custom`: 2 policies ainda em `{public}` — único ponto pendente.

## O que será feito (somente isto)

Uma migração que recria as 2 policies de `empresa_modulos_custom` com `TO authenticated`, preservando exatamente as condições atuais (`pode_usar_empresa(empresa_id, auth.uid())`):

```sql
DROP POLICY IF EXISTS "Membros veem módulos da empresa" ON public.empresa_modulos_custom;
CREATE POLICY "Membros veem módulos da empresa" ON public.empresa_modulos_custom
FOR SELECT TO authenticated
USING (pode_usar_empresa(empresa_id, auth.uid()));

DROP POLICY IF EXISTS "Membros gerenciam módulos da empresa" ON public.empresa_modulos_custom;
CREATE POLICY "Membros gerenciam módulos da empresa" ON public.empresa_modulos_custom
FOR ALL TO authenticated
USING (pode_usar_empresa(empresa_id, auth.uid()))
WITH CHECK (pode_usar_empresa(empresa_id, auth.uid()));
```

## Após aplicar

- Rodar o scan de segurança novamente e trazer o resultado (esperado: restarem apenas os 3 warnings já ignorados).

## Fora de escopo

- Nenhuma alteração de código-fonte.
- Nenhuma publicação.

## Riscos

- Nenhum comportamento muda para usuários logados; a função `pode_usar_empresa` já retorna falso para anônimos. A troca apenas remove a superfície de ataque do role público.
