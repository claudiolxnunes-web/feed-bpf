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

  -- Verifica coluna 'status'
  BEGIN
    v_status := to_jsonb(OLD) ->> 'status';
  EXCEPTION WHEN others THEN
    v_status := NULL;
  END;

  -- Se não achou 'status', tenta 'status_verificacao'
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

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;