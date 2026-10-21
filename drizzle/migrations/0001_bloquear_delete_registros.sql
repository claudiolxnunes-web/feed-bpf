CREATE OR REPLACE FUNCTION public.bloquear_registro_assinado()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_status text;
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Registros não podem ser excluídos (Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
  END IF;

  BEGIN
    v_status := to_jsonb(OLD) ->> 'status';
  EXCEPTION WHEN others THEN
    v_status := NULL;
  END;

  IF v_status IS NULL THEN
    BEGIN
      v_status := to_jsonb(OLD) ->> 'status_verificacao';
    EXCEPTION WHEN others THEN
      v_status := NULL;
    END;
  END IF;

  IF v_status IS NOT NULL AND lower(v_status) IN
     ('liberado','concluido','concluído','arquivado','assinado','expedido','finalizado','vigente','obsoleto','aprovado') THEN
    RAISE EXCEPTION 'Registro assinado/liberado é imutável (exigência MAPA - Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
  END IF;

  IF (to_jsonb(OLD) ? 'hash_integridade') AND (to_jsonb(OLD) ->> 'hash_integridade') IS NOT NULL THEN
    RAISE EXCEPTION 'Registro com selo de integridade é imutável (exigência MAPA). Abra uma Não Conformidade para correções.';
  END IF;

  RETURN NEW;
END;
$function$;

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

  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'Registros não podem ser excluídos (Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
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

  IF OLD.auditoria_id IS NOT NULL THEN
    SELECT status INTO v_status FROM public.auditorias_bpf WHERE id = OLD.auditoria_id;
    IF v_status = 'concluido' THEN
      RAISE EXCEPTION 'Auditoria concluída é imutável (Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
    END IF;
  END IF;

  IF NEW.auditoria_id IS NOT NULL
     AND NEW.auditoria_id IS DISTINCT FROM OLD.auditoria_id THEN
    SELECT status INTO v_status FROM public.auditorias_bpf WHERE id = NEW.auditoria_id;
    IF v_status = 'concluido' THEN
      RAISE EXCEPTION 'Auditoria concluída é imutável (Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;