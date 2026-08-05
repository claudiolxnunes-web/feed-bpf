
DROP POLICY IF EXISTS "Isolamento por empresa - agrogestao_metas" ON public.agrogestao_metas;

CREATE POLICY "Metas: leitura por membros da empresa"
ON public.agrogestao_metas FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM empresa_membros em
    WHERE em.empresa_id = agrogestao_metas.empresa_id
      AND em.user_id = auth.uid() AND em.ativo = true)
  OR gerente_id = auth.uid()
);

CREATE POLICY "Metas: insert por admin da empresa"
ON public.agrogestao_metas FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM empresa_membros em
    WHERE em.empresa_id = agrogestao_metas.empresa_id
      AND em.user_id = auth.uid() AND em.ativo = true
      AND em.papel = 'admin'::papel_empresa)
  AND (gerente_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Metas: update por admin da empresa"
ON public.agrogestao_metas FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM empresa_membros em
    WHERE em.empresa_id = agrogestao_metas.empresa_id
      AND em.user_id = auth.uid() AND em.ativo = true
      AND em.papel = 'admin'::papel_empresa)
)
WITH CHECK (
  EXISTS (SELECT 1 FROM empresa_membros em
    WHERE em.empresa_id = agrogestao_metas.empresa_id
      AND em.user_id = auth.uid() AND em.ativo = true
      AND em.papel = 'admin'::papel_empresa)
  AND (gerente_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role))
);

CREATE POLICY "Metas: delete por admin da empresa"
ON public.agrogestao_metas FOR DELETE TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM empresa_membros em
    WHERE em.empresa_id = agrogestao_metas.empresa_id
      AND em.user_id = auth.uid() AND em.ativo = true
      AND em.papel = 'admin'::papel_empresa)
);

DROP POLICY IF EXISTS "Authenticated users can view MAPA establishments" ON public.mapa_estabelecimentos;
CREATE POLICY "Admins can view MAPA establishments"
ON public.mapa_estabelecimentos FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Authenticated users can view MAPA imports" ON public.mapa_importacoes;
CREATE POLICY "Admins can view MAPA imports"
ON public.mapa_importacoes FOR SELECT TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));
