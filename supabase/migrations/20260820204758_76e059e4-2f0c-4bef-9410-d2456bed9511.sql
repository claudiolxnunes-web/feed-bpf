-- 1. Identificar e corrigir funções que ainda permitem execução por anon/public
REVOKE EXECUTE ON FUNCTION public.criar_auditor_token(uuid, text, text, integer, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_licenca_consultor_ativa(text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.get_licenca_consultor_ativa(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.validar_limite_membros() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.fn_atualizar_saldo_mp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.can_access_crm(uuid) FROM PUBLIC, anon, authenticated;

-- 2. Corrigir funções que não devem ser chamadas por usuários autenticados (apenas service_role/triggers)
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_license() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_empresa_membro_admin() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_empresa_license() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_nc_via_whatsapp() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_error_via_whatsapp() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_registro_assinado() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_lead_to_pipeline() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.processar_referral_novo_user() FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_credit_referral() FROM authenticated;

-- 3. Garantir search_path em TODAS as funções SECURITY DEFINER (mesmo as que já tinham, para garantir conformidade)
DO $$
DECLARE
    f record;
BEGIN
    FOR f IN SELECT n.nspname, p.proname, pg_get_function_identity_arguments(p.oid) as args
             FROM pg_proc p
             JOIN pg_namespace n ON p.pronamespace = n.oid
             WHERE n.nspname = 'public' AND p.prosecdef = true
    LOOP
        EXECUTE 'ALTER FUNCTION ' || quote_ident(f.nspname) || '.' || quote_ident(f.proname) || '(' || f.args || ') SET search_path = public';
    END LOOP;
END $$;

-- 4. Garantir acesso ao service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
