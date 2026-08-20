-- ============================================================================
-- execucao_pops: preenchimento estruturado das Instruções de Trabalho
--
-- A tabela já é o registro oficial de execução (tem it_codigo, executor,
-- verificado_por/status_verificacao e carimbo SHA-256 em
-- execucao_pop_carimbos). Faltava apenas ONDE guardar os valores dos campos
-- do formulário da IT — hoje a IT é gravada dentro de `observacoes` como
-- texto livre, o que não é consultável nem auditável campo a campo.
--
-- Optou-se por estender esta tabela em vez de criar uma tabela paralela de
-- registros: duas tabelas de execução partiriam a trilha de auditoria, e é
-- justamente a trilha única que o fiscal do MAPA precisa encontrar.
--
-- Aditivo e seguro: as duas colunas têm default, nenhuma coluna existente é
-- alterada, nenhuma policy é tocada.
-- ============================================================================

ALTER TABLE public.execucao_pops
  ADD COLUMN IF NOT EXISTS valores jsonb NOT NULL DEFAULT '{}'::jsonb;

-- Modelo que originou o preenchimento. ON DELETE SET NULL: apagar um modelo
-- não pode apagar o registro da execução que já aconteceu.
ALTER TABLE public.execucao_pops
  ADD COLUMN IF NOT EXISTS modelo_id uuid
  REFERENCES public.modelos_bpf(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_execucao_pops_it
  ON public.execucao_pops (empresa_id, it_codigo, data_execucao);

COMMENT ON COLUMN public.execucao_pops.valores IS
  'Valores preenchidos do formulário da IT, chaveados por "{secao}.{campo}" conforme modelos_bpf.conteudo.secoes';
COMMENT ON COLUMN public.execucao_pops.modelo_id IS
  'Modelo de IT (modelos_bpf) que gerou este preenchimento';
