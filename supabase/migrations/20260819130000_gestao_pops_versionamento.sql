-- Adicionar coluna de versão em arquivos_bpf
ALTER TABLE public.arquivos_bpf ADD COLUMN IF NOT EXISTS versao INTEGER DEFAULT 1;
COMMENT ON COLUMN public.arquivos_bpf.versao IS 'Versão do documento para histórico e auditoria';

-- Adicionar configurações de preenchimento e limites em empresas
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS config_modos_preenchimento JSONB DEFAULT '{}';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS limite_pontos_digitais INTEGER DEFAULT 60;
COMMENT ON COLUMN public.empresas.config_modos_preenchimento IS 'Mapeamento de POP -> modo (digital ou upload) escolhido pelo RT';
COMMENT ON COLUMN public.empresas.limite_pontos_digitais IS 'Capacidade total de pontos digitais para o plano intermediário';

-- Grant permissions
GRANT UPDATE(config_modos_preenchimento) ON public.empresas TO authenticated;
