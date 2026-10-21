
CREATE TABLE IF NOT EXISTS public.execucao_its (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    empresa_id uuid REFERENCES public.empresas(id) ON DELETE CASCADE,
    it_codigo text NOT NULL,
    pop_codigo text NOT NULL,
    data_execucao timestamptz DEFAULT now(),
    responsavel_nome text,
    observacoes text,
    created_at timestamptz DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.execucao_its TO authenticated;
GRANT ALL ON public.execucao_its TO service_role;

ALTER TABLE public.execucao_its ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own company IT executions"
ON public.execucao_its
FOR SELECT
TO authenticated
USING (empresa_id IN (
    SELECT id FROM public.empresas WHERE user_id = auth.uid()
    UNION
    SELECT e_id FROM (
        SELECT empresa_id as e_id FROM public.user_roles WHERE user_id = auth.uid()
    ) sub
));

CREATE POLICY "Users can insert IT executions for their company"
ON public.execucao_its
FOR INSERT
TO authenticated
WITH CHECK (empresa_id IN (
    SELECT id FROM public.empresas WHERE user_id = auth.uid()
    UNION
    SELECT e_id FROM (
        SELECT empresa_id as e_id FROM public.user_roles WHERE user_id = auth.uid()
    ) sub
));
