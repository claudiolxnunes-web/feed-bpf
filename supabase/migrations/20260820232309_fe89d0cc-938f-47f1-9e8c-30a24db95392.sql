DROP TRIGGER IF EXISTS trg_bloqueio_assinado ON public.monitoramento_pcc;
CREATE TRIGGER trg_bloqueio_assinado BEFORE UPDATE OR DELETE ON public.monitoramento_pcc
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado();