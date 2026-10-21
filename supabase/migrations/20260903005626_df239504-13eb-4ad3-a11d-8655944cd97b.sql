DROP TRIGGER IF EXISTS trg_audit_execucao_its ON public.execucao_its;

CREATE TRIGGER trg_audit_execucao_its
  AFTER INSERT OR UPDATE OR DELETE ON public.execucao_its
  FOR EACH ROW EXECUTE FUNCTION public.process_audit_log();