ALTER TYPE public.papel_empresa ADD VALUE IF NOT EXISTS 'visualizador';

CREATE OR REPLACE FUNCTION public.pode_editar_empresa(_empresa_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.empresas e WHERE e.id = _empresa_id AND e.user_id = _user_id
  ) OR EXISTS (
    SELECT 1 FROM public.empresa_membros em
    WHERE em.empresa_id = _empresa_id AND em.user_id = _user_id
      AND em.ativo = true AND em.papel IN ('admin','rt','operador')
  );
$$;

DROP POLICY "Acesso por dono ou membro empresa" ON public.simulacoes_recall;

CREATE POLICY "Leitura por dono ou membro empresa"
ON public.simulacoes_recall FOR SELECT TO authenticated
USING (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Escrita por papeis de edicao"
ON public.simulacoes_recall FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_editar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Atualizacao por papeis de edicao"
ON public.simulacoes_recall FOR UPDATE TO authenticated
USING (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_editar_empresa(empresa_id, auth.uid())))
WITH CHECK (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_editar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Exclusao por papeis de edicao"
ON public.simulacoes_recall FOR DELETE TO authenticated
USING (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_editar_empresa(empresa_id, auth.uid())));