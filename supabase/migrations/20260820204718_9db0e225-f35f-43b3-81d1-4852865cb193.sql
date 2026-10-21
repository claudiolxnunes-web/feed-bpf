-- Correção de Segurança: Vulnerabilidades SECURITY DEFINER
ALTER FUNCTION public.handle_new_empresa_license() SET search_path = public;
ALTER FUNCTION public.notify_error_via_whatsapp() SET search_path = public;
ALTER FUNCTION public.email_queue_wake() SET search_path = public;
ALTER FUNCTION public.email_queue_dispatch() SET search_path = public;

-- Revogar EXECUTE público para funções críticas e internas
REVOKE EXECUTE ON FUNCTION public.handle_new_empresa_license() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_error_via_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_wake() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.email_queue_dispatch() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user_license() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_empresa_membro_admin() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.sync_lead_to_pipeline() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.processar_referral_novo_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.auto_credit_referral() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_nc_via_whatsapp() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.bloquear_registro_assinado() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.process_audit_log() FROM PUBLIC, anon, authenticated;

-- Business Logic: Remover acesso anon onde não é necessário
REVOKE EXECUTE ON FUNCTION public.aprovar_documento_pop(uuid, text, text, text, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.criar_nova_versao_pop(uuid, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.validar_auditor_token(text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.criar_auditor_token(uuid, text, text, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.criar_convite_empresa(uuid, text, text, papel_empresa, integer) FROM anon;

-- Garantir acesso ao service_role
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO service_role;
