-- Adiciona colunas para organização hierárquica de arquivos
ALTER TABLE public.arquivos_bpf 
ADD COLUMN IF NOT EXISTS it_codigo TEXT,
ADD COLUMN IF NOT EXISTS frequencia TEXT;

-- Garante permissões (essencial para PostgREST)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.arquivos_bpf TO authenticated;
GRANT ALL ON public.arquivos_bpf TO service_role;

-- Comentário para documentação
COMMENT ON COLUMN public.arquivos_bpf.it_codigo IS 'Código da Instrução de Trabalho vinculada (ex: IT-01-01)';
COMMENT ON COLUMN public.arquivos_bpf.frequencia IS 'Frequência do registro (DIARIA, SEMANAL, MENSAL, etc)';