DROP POLICY IF EXISTS "Membros veem módulos da empresa" ON public.empresa_modulos_custom;
CREATE POLICY "Membros veem módulos da empresa" ON public.empresa_modulos_custom
FOR SELECT TO authenticated
USING (pode_usar_empresa(empresa_id, auth.uid()));

DROP POLICY IF EXISTS "Membros gerenciam módulos da empresa" ON public.empresa_modulos_custom;
CREATE POLICY "Membros gerenciam módulos da empresa" ON public.empresa_modulos_custom
FOR ALL TO authenticated
USING (pode_usar_empresa(empresa_id, auth.uid()))
WITH CHECK (pode_usar_empresa(empresa_id, auth.uid()));