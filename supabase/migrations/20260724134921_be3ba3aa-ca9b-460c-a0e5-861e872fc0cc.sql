DROP POLICY IF EXISTS "Users can view own empresa licenses" ON public.licencas;

CREATE POLICY "Users can view own and member company licenses"
ON public.licencas
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id
  OR EXISTS (
    SELECT 1
    FROM public.empresas e
    WHERE e.id = licencas.empresa_id
      AND e.user_id = auth.uid()
  )
  OR EXISTS (
    SELECT 1
    FROM public.empresa_membros em
    WHERE em.empresa_id = licencas.empresa_id
      AND em.user_id = auth.uid()
      AND em.ativo = true
  )
);