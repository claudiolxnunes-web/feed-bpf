ALTER TABLE public.normas_legislacao
  ADD COLUMN situacao text NOT NULL DEFAULT 'ativa',
  ADD COLUMN arquivada_em date NULL,
  ADD COLUMN motivo_arquivamento text NULL;

ALTER TABLE public.normas_legislacao
  ADD CONSTRAINT normas_legislacao_situacao_chk
  CHECK (situacao IN ('ativa','arquivada'));

ALTER TABLE public.normas_legislacao
  ADD CONSTRAINT normas_legislacao_arquivada_sem_slug_chk
  CHECK (situacao = 'ativa' OR slug IS NULL);

ALTER TABLE public.normas_legislacao
  ADD CONSTRAINT normas_legislacao_motivo_arquivamento_chk
  CHECK (situacao = 'ativa' OR (motivo_arquivamento IS NOT NULL AND btrim(motivo_arquivamento) <> ''));