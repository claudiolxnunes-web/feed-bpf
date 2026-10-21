DROP POLICY IF EXISTS "Users can view their own company IT executions" ON public.execucao_its;
DROP POLICY IF EXISTS "Users can insert IT executions for their company" ON public.execucao_its;

CREATE POLICY "execucao_its_select" ON public.execucao_its
FOR SELECT TO authenticated
USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())));

CREATE POLICY "execucao_its_insert" ON public.execucao_its
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id AND (empresa_id IS NULL OR public.pode_usar_empresa(empresa_id, auth.uid())));