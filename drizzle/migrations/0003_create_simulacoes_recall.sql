CREATE TABLE public.simulacoes_recall (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  empresa_id UUID REFERENCES public.empresas(id) ON DELETE CASCADE,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  produto TEXT NOT NULL,
  lote TEXT NOT NULL,
  tempo_total_min INTEGER,
  etapas JSONB NOT NULL DEFAULT '[]'::jsonb,
  observacoes TEXT,
  responsavel TEXT,
  rt TEXT,
  status TEXT NOT NULL DEFAULT 'concluida'
    CHECK (status IN ('em_andamento', 'concluida')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.simulacoes_recall TO authenticated;
GRANT ALL ON public.simulacoes_recall TO service_role;

ALTER TABLE public.simulacoes_recall ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acesso por dono ou membro empresa"
ON public.simulacoes_recall
FOR ALL TO authenticated
USING (
  user_id = auth.uid()
  OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid()))
)
WITH CHECK (
  user_id = auth.uid()
  OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid()))
);

CREATE TRIGGER trg_audit_simulacoes_recall
AFTER INSERT OR UPDATE OR DELETE ON public.simulacoes_recall
FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();

CREATE TRIGGER trg_bloquear_simulacoes_recall
BEFORE UPDATE OR DELETE ON public.simulacoes_recall
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado();

CREATE TRIGGER trg_simulacoes_recall_updated_at
BEFORE UPDATE ON public.simulacoes_recall
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();