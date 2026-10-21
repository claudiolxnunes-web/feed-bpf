DO $$
DECLARE
    f record;
BEGIN
    FOR f IN SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
             FROM pg_proc p
             JOIN pg_namespace n ON p.pronamespace = n.oid
             WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        -- Revogar de PUBLIC (que inclui anon e authenticated por padrão no Postgres se não for alterado)
        EXECUTE 'REVOKE ALL ON FUNCTION ' || quote_ident(f.nspname) || '.' || quote_ident(f.proname) || '(' || f.args || ') FROM PUBLIC';
        EXECUTE 'REVOKE ALL ON FUNCTION ' || quote_ident(f.nspname) || '.' || quote_ident(f.proname) || '(' || f.args || ') FROM anon';
        
        -- Opcional: Se for uma função interna (ex: triggers), revogar também de authenticated
        IF f.proname IN ('handle_new_user', 'handle_new_user_license', 'handle_new_empresa_membro_admin', 'handle_new_empresa_license', 'process_audit_log', 'notify_nc_via_whatsapp', 'notify_error_via_whatsapp', 'bloquear_registro_assinado', 'sync_lead_to_pipeline', 'processar_referral_novo_user', 'auto_credit_referral', 'email_queue_wake', 'email_queue_dispatch', 'enqueue_email', 'read_email_batch', 'delete_email', 'move_to_dlq') THEN
            EXECUTE 'REVOKE ALL ON FUNCTION ' || quote_ident(f.nspname) || '.' || quote_ident(f.proname) || '(' || f.args || ') FROM authenticated';
        END IF;
    END LOOP;
END $$;

-- Agora, re-conceder acesso apenas onde é estritamente necessário para o frontend funcionar
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.tem_papel_empresa(uuid, uuid, papel_empresa) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_papel_empresa(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_membro_empresa(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pode_usar_empresa(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_limite_membros_empresa(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_codigo_referral(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validar_auditor_token(text) TO authenticated;

-- Funções de criação/versão (usuário autenticado precisa chamar)
GRANT EXECUTE ON FUNCTION public.criar_nova_versao_pop(uuid, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.aprovar_documento_pop(uuid, text, text, text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.criar_convite_empresa(uuid, text, text, papel_empresa, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.vincular_empresa_licenca_consultor(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.desvincular_empresa_licenca_consultor(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.criar_auditor_token(uuid, text, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_licenca_consultor_ativa(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_licenca_consultor_ativa(uuid, text) TO authenticated;

-- Garantir acesso total ao service_role
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;
