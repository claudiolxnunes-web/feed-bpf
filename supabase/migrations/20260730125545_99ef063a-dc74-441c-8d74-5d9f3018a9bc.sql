CREATE UNIQUE INDEX IF NOT EXISTS licencas_ativa_unica_idx
  ON public.licencas (user_id, produto, COALESCE(empresa_id, '00000000-0000-0000-0000-000000000000'::uuid))
  WHERE status = 'ativa';

CREATE INDEX IF NOT EXISTS licencas_user_status_idx
  ON public.licencas (user_id, status);

CREATE INDEX IF NOT EXISTS licencas_empresa_status_idx
  ON public.licencas (empresa_id, status);