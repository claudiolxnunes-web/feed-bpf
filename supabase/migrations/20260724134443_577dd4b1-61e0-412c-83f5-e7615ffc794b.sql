DROP POLICY IF EXISTS "Bloquear mutacoes diretas por authenticated" ON public.licencas;
DROP POLICY IF EXISTS "Bloquear insert direto por authenticated" ON public.licencas;
DROP POLICY IF EXISTS "Bloquear update direto por authenticated" ON public.licencas;
DROP POLICY IF EXISTS "Bloquear delete direto por authenticated" ON public.licencas;

CREATE POLICY "Bloquear insert direto por authenticated"
ON public.licencas
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "Bloquear update direto por authenticated"
ON public.licencas
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "Bloquear delete direto por authenticated"
ON public.licencas
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (false);