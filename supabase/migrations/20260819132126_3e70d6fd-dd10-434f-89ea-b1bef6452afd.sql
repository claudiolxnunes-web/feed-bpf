ALTER TABLE public.arquivos_bpf ADD COLUMN IF NOT EXISTS versao INTEGER DEFAULT 1;
ALTER TABLE public.arquivos_bpf ADD COLUMN IF NOT EXISTS metadata JSONB;
COMMENT ON COLUMN public.arquivos_bpf.versao IS 'Versão do documento (incrementada automaticamente)';
COMMENT ON COLUMN public.arquivos_bpf.metadata IS 'Dados estruturados do documento (ex: rascunho IA)';