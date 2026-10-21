-- 1) mapa_estabelecimentos: base pública do SIPEAGRO -> SELECT liberado
DROP POLICY IF EXISTS "Admins can view MAPA establishments"
  ON public.mapa_estabelecimentos;
CREATE POLICY "Authenticated view MAPA establishments"
  ON public.mapa_estabelecimentos
  FOR SELECT TO authenticated
  USING (true);

-- 2) Bloqueio real de escalação de papel (policy de RLS não enxerga OLD)
CREATE OR REPLACE FUNCTION public.bloquear_troca_papel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  IF NEW.papel IS DISTINCT FROM OLD.papel
     AND coalesce(auth.role(), '') = 'authenticated' THEN
    RAISE EXCEPTION
      'Alteração de papel não permitida por usuário autenticado (de % para %)',
      OLD.papel, NEW.papel
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_bloquear_troca_papel ON public.empresa_membros;
CREATE TRIGGER trg_bloquear_troca_papel
  BEFORE UPDATE OF papel ON public.empresa_membros
  FOR EACH ROW
  EXECUTE FUNCTION public.bloquear_troca_papel();