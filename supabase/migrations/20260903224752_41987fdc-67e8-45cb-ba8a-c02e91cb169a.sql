-- ============================================================
-- Correção dos warnings de segurança do scan supabase_lov
-- ============================================================

-- 1) monitoramento_pcc: trocar role public por authenticated
DROP POLICY IF EXISTS "Empresa members can view PCC monitoring" ON public.monitoramento_pcc;
DROP POLICY IF EXISTS "Empresa members can insert PCC monitoring" ON public.monitoramento_pcc;
DROP POLICY IF EXISTS "Empresa members can update PCC monitoring" ON public.monitoramento_pcc;
DROP POLICY IF EXISTS "Empresa members can delete PCC monitoring" ON public.monitoramento_pcc;

CREATE POLICY "Empresa members can view PCC monitoring" ON public.monitoramento_pcc
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can insert PCC monitoring" ON public.monitoramento_pcc
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND ((empresa_id IS NULL) OR public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can update PCC monitoring" ON public.monitoramento_pcc
  FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can delete PCC monitoring" ON public.monitoramento_pcc
  FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

-- 2) pac_monitoramento: trocar role public por authenticated
DROP POLICY IF EXISTS "Empresa members can view PAC monitoring" ON public.pac_monitoramento;
DROP POLICY IF EXISTS "Empresa members can insert PAC monitoring" ON public.pac_monitoramento;
DROP POLICY IF EXISTS "Empresa members can update PAC monitoring" ON public.pac_monitoramento;
DROP POLICY IF EXISTS "Empresa members can delete PAC monitoring" ON public.pac_monitoramento;

CREATE POLICY "Empresa members can view PAC monitoring" ON public.pac_monitoramento
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can insert PAC monitoring" ON public.pac_monitoramento
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND ((empresa_id IS NULL) OR public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can update PAC monitoring" ON public.pac_monitoramento
  FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can delete PAC monitoring" ON public.pac_monitoramento
  FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

-- 3) fornecedor_auditorias: trocar role public por authenticated
DROP POLICY IF EXISTS "Empresa members can view supplier audits" ON public.fornecedor_auditorias;
DROP POLICY IF EXISTS "Empresa members can insert supplier audits" ON public.fornecedor_auditorias;
DROP POLICY IF EXISTS "Empresa members can update supplier audits" ON public.fornecedor_auditorias;
DROP POLICY IF EXISTS "Empresa members can delete supplier audits" ON public.fornecedor_auditorias;

CREATE POLICY "Empresa members can view supplier audits" ON public.fornecedor_auditorias
  FOR SELECT TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can insert supplier audits" ON public.fornecedor_auditorias
  FOR INSERT TO authenticated
  WITH CHECK ((auth.uid() = user_id) AND ((empresa_id IS NULL) OR public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can update supplier audits" ON public.fornecedor_auditorias
  FOR UPDATE TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

CREATE POLICY "Empresa members can delete supplier audits" ON public.fornecedor_auditorias
  FOR DELETE TO authenticated
  USING ((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())));

-- 4) whatsapp_mensagens: apenas a policy de SELECT estava em public
DROP POLICY IF EXISTS "Membros da empresa veem mensagens" ON public.whatsapp_mensagens;

CREATE POLICY "Membros da empresa veem mensagens" ON public.whatsapp_mensagens
  FOR SELECT TO authenticated
  USING ((empresa_id IS NOT NULL) AND (EXISTS (
    SELECT 1 FROM public.empresa_membros em
    WHERE em.empresa_id = whatsapp_mensagens.empresa_id
      AND em.user_id = auth.uid()
      AND em.ativo = true
  )));

-- 5) empresa_membros: endurecer INSERT para proibir auto-escalação para admin via authenticated
DROP POLICY IF EXISTS "Admin insere membros" ON public.empresa_membros;

CREATE POLICY "Admin insere membros" ON public.empresa_membros
  FOR INSERT TO authenticated
  WITH CHECK (
    public.tem_papel_empresa(empresa_id, auth.uid(), 'admin'::public.papel_empresa)
    AND (convidado_por IS NULL OR convidado_por = auth.uid())
    AND papel <> 'admin'::public.papel_empresa
  );

-- 6) mapa_estabelecimentos: mantido admin-only (diretório regulatório MAPA, acesso intencionalmente restrito)
-- Nenhuma alteração necessária; decisão documentada.
