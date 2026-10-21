CREATE OR REPLACE FUNCTION public.bloquear_registro_assinado()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_status text;
BEGIN
  -- Rotinas administrativas (backup/restauração) não são bloqueadas
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  BEGIN
    v_status := to_jsonb(OLD) ->> 'status';
  EXCEPTION WHEN others THEN
    v_status := NULL;
  END;

  IF v_status IS NOT NULL AND lower(v_status) IN
     ('liberado','concluido','concluído','arquivado','assinado','expedido','finalizado','vigente','obsoleto') THEN
    RAISE EXCEPTION 'Registro assinado/liberado é imutável (exigência MAPA - Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
  END IF;

  IF (to_jsonb(OLD) ? 'hash_integridade') AND (to_jsonb(OLD) ->> 'hash_integridade') IS NOT NULL THEN
    RAISE EXCEPTION 'Registro com selo de integridade é imutável (exigência MAPA). Abra uma Não Conformidade para correções.';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloqueio_assinado ON public.recebimento_mp;
CREATE TRIGGER trg_bloqueio_assinado BEFORE UPDATE OR DELETE ON public.recebimento_mp
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado();

DROP TRIGGER IF EXISTS trg_bloqueio_assinado ON public.expedicoes;
CREATE TRIGGER trg_bloqueio_assinado BEFORE UPDATE OR DELETE ON public.expedicoes
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado();

DROP TRIGGER IF EXISTS trg_bloqueio_assinado ON public.execucao_pops;
CREATE TRIGGER trg_bloqueio_assinado BEFORE UPDATE OR DELETE ON public.execucao_pops
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado();

DROP TRIGGER IF EXISTS trg_bloqueio_assinado ON public.pop_planilhas;
CREATE TRIGGER trg_bloqueio_assinado BEFORE UPDATE OR DELETE ON public.pop_planilhas
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado();

DROP TRIGGER IF EXISTS trg_bloqueio_assinado ON public.registros_customizados;
CREATE TRIGGER trg_bloqueio_assinado BEFORE UPDATE OR DELETE ON public.registros_customizados
FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado();