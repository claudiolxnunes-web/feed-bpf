-- Preserve the lightweight account/organization scaffold that was created
-- before the full Feed BPF schema was migrated. The application schema uses
-- incompatible profiles/user_roles definitions, so both models must coexist.
DO $$
BEGIN
  IF to_regclass('public.profiles') IS NOT NULL
     AND EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'email'
     )
     AND NOT EXISTS (
       SELECT 1 FROM information_schema.columns
       WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'user_id'
     ) THEN
    ALTER TABLE public.profiles RENAME TO platform_profiles;
  END IF;

  IF to_regclass('public.user_roles') IS NOT NULL
     AND EXISTS (
       SELECT 1
       FROM pg_type t
       JOIN pg_enum e ON e.enumtypid = t.oid
       JOIN pg_namespace n ON n.oid = t.typnamespace
       WHERE n.nspname = 'public' AND t.typname = 'app_role' AND e.enumlabel = 'superadmin'
     ) THEN
    ALTER TABLE public.user_roles RENAME TO platform_user_roles;
    ALTER TYPE public.app_role RENAME TO platform_app_role;
  END IF;

  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'handle_new_user'
      AND pg_get_function_identity_arguments(p.oid) = ''
  ) THEN
    ALTER FUNCTION public.handle_new_user() RENAME TO platform_handle_new_user;
  END IF;

END
$$;
