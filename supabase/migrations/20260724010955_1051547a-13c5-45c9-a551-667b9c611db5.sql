
-- 1) documento_aprovacoes: restrict company-wide view to admins
DROP POLICY IF EXISTS "Membros da empresa podem ver aprovacoes" ON public.documento_aprovacoes;
CREATE POLICY "Admins da empresa podem ver aprovacoes"
  ON public.documento_aprovacoes
  FOR SELECT
  TO authenticated
  USING (
    empresa_id IS NOT NULL
    AND public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa)
  );

-- 2) equipamentos: rescope policies from public -> authenticated
DROP POLICY IF EXISTS "Users can view their company's equipment" ON public.equipamentos;
DROP POLICY IF EXISTS "Users can insert equipment for their company" ON public.equipamentos;
DROP POLICY IF EXISTS "Users can update their company's equipment" ON public.equipamentos;
DROP POLICY IF EXISTS "Users can delete their company's equipment" ON public.equipamentos;

CREATE POLICY "Users can view their company's equipment"
  ON public.equipamentos FOR SELECT TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true));

CREATE POLICY "Users can insert equipment for their company"
  ON public.equipamentos FOR INSERT TO authenticated
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true));

CREATE POLICY "Users can update their company's equipment"
  ON public.equipamentos FOR UPDATE TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true))
  WITH CHECK (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true));

CREATE POLICY "Users can delete their company's equipment"
  ON public.equipamentos FOR DELETE TO authenticated
  USING (empresa_id IN (SELECT empresa_id FROM public.empresa_membros WHERE user_id = auth.uid() AND ativo = true));
