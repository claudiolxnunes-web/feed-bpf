ALTER TABLE public.validacao_limpeza_linha
  ADD COLUMN repeticao smallint NULL
  CHECK (repeticao IS NULL OR repeticao BETWEEN 1 AND 3);
COMMENT ON COLUMN public.validacao_limpeza_linha.repeticao
  IS 'Repetição da sequência-piloto (1 a 3) para teste de carry-over';