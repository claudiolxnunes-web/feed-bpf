-- Avoid ambiguity between the preserved organization scaffold role helper and
-- the Feed BPF role helper introduced by the next migration.
DO $$
BEGIN
  IF to_regtype('public.platform_app_role') IS NOT NULL
     AND to_regprocedure('public.has_role(uuid,public.platform_app_role)') IS NOT NULL THEN
    ALTER FUNCTION public.has_role(uuid, public.platform_app_role)
      RENAME TO platform_has_role;
  END IF;
END
$$;
