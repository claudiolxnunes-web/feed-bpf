-- Adiciona coluna slug (opcional) para vincular uma norma a um assunto da fonte única.
-- Nenhum dos 49 registros existentes é alterado: todos ficam com slug NULL.
ALTER TABLE public.normas_legislacao
  ADD COLUMN slug text;

-- Índice único parcial: garante no máximo uma norma por assunto dentro de cada empresa,
-- sem impedir múltiplas linhas com slug NULL (biblioteca continua livre).
CREATE UNIQUE INDEX normas_legislacao_empresa_slug_key
  ON public.normas_legislacao (empresa_id, slug)
  WHERE slug IS NOT NULL;

COMMENT ON COLUMN public.normas_legislacao.slug IS
  'Assunto da fonte única de legislação (baseLegal.ts). Opcional; NULL = norma apenas da biblioteca.';