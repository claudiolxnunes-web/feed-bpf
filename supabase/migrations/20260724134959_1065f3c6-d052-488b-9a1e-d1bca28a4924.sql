CREATE POLICY "Active members can view their companies"
ON public.empresas
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.empresa_membros em
    WHERE em.empresa_id = empresas.id
      AND em.user_id = auth.uid()
      AND em.ativo = true
  )
);