CREATE TABLE public.auditorias_bpf (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  data_auditoria DATE NOT NULL DEFAULT CURRENT_DATE,
  auditor TEXT NOT NULL,
  escopo TEXT,
  status TEXT NOT NULL DEFAULT 'em_andamento'
    CHECK (status IN ('em_andamento','concluido')),
  observacoes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.auditorias_bpf TO authenticated;
GRANT ALL ON public.auditorias_bpf TO service_role;

ALTER TABLE public.auditorias_bpf ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por dono ou membro empresa" ON public.auditorias_bpf
FOR ALL TO authenticated
USING (auth.uid() = user_id OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid())))
WITH CHECK (auth.uid() = user_id AND (empresa_id IS NULL OR public.pode_usar_empresa(empresa_id, auth.uid())));

ALTER TABLE public.checklist_items
  ADD COLUMN auditoria_id UUID REFERENCES public.auditorias_bpf(id) ON DELETE SET NULL;

CREATE INDEX idx_checklist_items_auditoria ON public.checklist_items(auditoria_id);

CREATE OR REPLACE FUNCTION public.bloquear_item_auditoria_concluida()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_status text;
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.auditoria_id IS NOT NULL THEN
      SELECT status INTO v_status FROM public.auditorias_bpf WHERE id = NEW.auditoria_id;
      IF v_status = 'concluido' THEN
        RAISE EXCEPTION 'Auditoria concluída é imutável (Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
      END IF;
    END IF;
    RETURN NEW;
  END IF;

  -- UPDATE/DELETE: bloqueia se a auditoria de origem estiver concluída
  IF OLD.auditoria_id IS NOT NULL THEN
    SELECT status INTO v_status FROM public.auditorias_bpf WHERE id = OLD.auditoria_id;
    IF v_status = 'concluido' THEN
      RAISE EXCEPTION 'Auditoria concluída é imutável (Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
    END IF;
  END IF;

  -- UPDATE: bloqueia também a troca para uma auditoria concluída
  IF TG_OP = 'UPDATE' AND NEW.auditoria_id IS NOT NULL
     AND NEW.auditoria_id IS DISTINCT FROM OLD.auditoria_id THEN
    SELECT status INTO v_status FROM public.auditorias_bpf WHERE id = NEW.auditoria_id;
    IF v_status = 'concluido' THEN
      RAISE EXCEPTION 'Auditoria concluída é imutável (Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

CREATE TRIGGER trg_bloquear_registro_assinado
BEFORE INSERT OR UPDATE OR DELETE ON public.checklist_items
FOR EACH ROW EXECUTE FUNCTION public.bloquear_item_auditoria_concluida();

CREATE TRIGGER trg_bloquear_registro_assinado
BEFORE UPDATE OR DELETE ON public.auditorias_bpf
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado();

CREATE TRIGGER trg_audit_auditorias_bpf
AFTER INSERT OR UPDATE OR DELETE ON public.auditorias_bpf
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();