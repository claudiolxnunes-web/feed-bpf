GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresas TO authenticated;
GRANT ALL ON public.empresas TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.empresa_membros TO authenticated;
GRANT ALL ON public.empresa_membros TO service_role;

GRANT SELECT ON public.licencas TO authenticated;
GRANT ALL ON public.licencas TO service_role;

GRANT SELECT ON public.licenca_empresas TO authenticated;
GRANT ALL ON public.licenca_empresas TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.convites_empresa TO authenticated;
GRANT ALL ON public.convites_empresa TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.onboarding_progresso TO authenticated;
GRANT ALL ON public.onboarding_progresso TO service_role;