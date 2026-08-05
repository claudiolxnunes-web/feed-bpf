
-- 1) Normaliza produtos existentes na tabela de licenças
UPDATE public.licencas
SET produto = lower(regexp_replace(produto, '[^a-zA-Z0-9]', '', 'g'))
WHERE produto IS NOT NULL
  AND produto <> lower(regexp_replace(produto, '[^a-zA-Z0-9]', '', 'g'));

-- 2) Função de normalização automática
CREATE OR REPLACE FUNCTION public.normalize_licenca_produto()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.produto IS NOT NULL THEN
    NEW.produto := lower(regexp_replace(NEW.produto, '[^a-zA-Z0-9]', '', 'g'));
  END IF;
  RETURN NEW;
END;
$$;

-- 3) Trigger BEFORE INSERT/UPDATE
DROP TRIGGER IF EXISTS trg_normalize_licenca_produto ON public.licencas;
CREATE TRIGGER trg_normalize_licenca_produto
BEFORE INSERT OR UPDATE OF produto ON public.licencas
FOR EACH ROW
EXECUTE FUNCTION public.normalize_licenca_produto();
