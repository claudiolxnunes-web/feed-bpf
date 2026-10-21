-- 1) Estender a trava de imutabilidade aos demais registros legais
DO $$
DECLARE
  t text;
  tabelas text[] := ARRAY[
    'producao','batidas_producao','batida_lotes','registros_limpeza','validacao_limpeza_linha',
    'saude_manipuladores','controle_pragas','controle_residuos','controle_substancias',
    'controle_visitantes','analises_laboratorio','calibracoes','manutencoes','rastreabilidade',
    'testes_rastreabilidade','ordens_producao','expedicao_itens','amostras_retencao',
    'pac_monitoramento','nao_conformidades','treinamentos'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_bloquear_registro_assinado ON public.%I', t);
    EXECUTE format(
      'CREATE TRIGGER trg_bloquear_registro_assinado BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado()', t);
  END LOOP;
END $$;

-- 2) Trilha de auditoria: capturar autor mesmo em execuções automáticas
CREATE OR REPLACE FUNCTION public.process_audit_log()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID;
    v_empresa_id UUID;
    v_rec JSONB;
BEGIN
    v_rec := CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE to_jsonb(NEW) END;

    v_user_id := auth.uid();

    -- Fallbacks quando a ação vem de rotinas internas (edge functions / service_role)
    IF v_user_id IS NULL THEN
        BEGIN
            v_user_id := COALESCE(
                nullif(current_setting('request.jwt.claim.sub', true), '')::uuid,
                (v_rec ->> 'updated_by')::uuid,
                (v_rec ->> 'created_by')::uuid,
                (v_rec ->> 'user_id')::uuid
            );
        EXCEPTION WHEN OTHERS THEN
            v_user_id := NULL;
        END;
    END IF;

    BEGIN
        v_empresa_id := (v_rec ->> 'empresa_id')::uuid;
    EXCEPTION WHEN OTHERS THEN
        v_empresa_id := NULL;
    END;

    IF v_empresa_id IS NULL AND v_user_id IS NOT NULL THEN
        SELECT empresa_id INTO v_empresa_id
        FROM public.empresa_membros WHERE user_id = v_user_id LIMIT 1;
    END IF;

    INSERT INTO public.audit_log (
        acao, tabela, registro_id, dados_anteriores, dados_novos, user_id, empresa_id
    ) VALUES (
        TG_OP,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE to_jsonb(OLD) END,
        CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE to_jsonb(NEW) END,
        v_user_id,
        v_empresa_id
    );
    RETURN NULL;
END;
$$;

-- 3) Consulta da trilha de auditoria pelos membros da empresa
DROP POLICY IF EXISTS "Membros da empresa veem a trilha da empresa" ON public.audit_log;
CREATE POLICY "Membros da empresa veem a trilha da empresa" ON public.audit_log
AS PERMISSIVE FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid()))
);