-- Paridade de RLS: VPS1 (xgvapaebustyotrwnzqa) <- produção Lovable (fonte de verdade)
-- Gerado em 17/out/2026 a partir do diff de pg_policies (70 diferenças).
-- Mantidas de propósito só na VPS1: heartbeat."anon select heartbeat" e modelos_bpf (tabela não existe na produção).

-- 1) Policies que existem só na VPS1 (22)
drop policy if exists "Isolamento por empresa - agrogestao_metas" on public.agrogestao_metas;
drop policy if exists campanhas_delete on public.campanhas;
drop policy if exists campanhas_insert on public.campanhas;
drop policy if exists campanhas_select on public.campanhas;
drop policy if exists campanhas_update on public.campanhas;
drop policy if exists "Membros da empresa podem ver aprovacoes" on public.documento_aprovacoes;
drop policy if exists equipamentos_delete on public.equipamentos;
drop policy if exists equipamentos_insert on public.equipamentos;
drop policy if exists equipamentos_select on public.equipamentos;
drop policy if exists equipamentos_update on public.equipamentos;
drop policy if exists "Acesso por dono ou membro empresa" on public.execucao_its;
drop policy if exists "Bloquear mutacoes diretas por authenticated" on public.licencas;
drop policy if exists "Bloquear update direto" on public.licencas;
drop policy if exists "Users can view own empresa licenses" on public.licencas;
drop policy if exists "Authenticated users can view MAPA establishments" on public.mapa_estabelecimentos;
drop policy if exists "Authenticated users can view MAPA imports" on public.mapa_importacoes;
drop policy if exists "Normas visiveis para todos autenticados" on public.normas_legislacao;
drop policy if exists "Users manage own normas" on public.normas_legislacao;
drop policy if exists wa_msg_delete on public.whatsapp_mensagens;
drop policy if exists wa_msg_insert on public.whatsapp_mensagens;
drop policy if exists wa_msg_select on public.whatsapp_mensagens;
drop policy if exists wa_msg_update on public.whatsapp_mensagens;

-- 2) Policies com o mesmo nome e definição diferente (15) — recriadas abaixo
drop policy if exists "Admin insere membros" on public.empresa_membros;
drop policy if exists "Membros gerenciam módulos da empresa" on public.empresa_modulos_custom;
drop policy if exists "Membros veem módulos da empresa" on public.empresa_modulos_custom;
drop policy if exists "Empresa members can delete supplier audits" on public.fornecedor_auditorias;
drop policy if exists "Empresa members can insert supplier audits" on public.fornecedor_auditorias;
drop policy if exists "Empresa members can update supplier audits" on public.fornecedor_auditorias;
drop policy if exists "Empresa members can view supplier audits" on public.fornecedor_auditorias;
drop policy if exists "Empresa members can delete PCC monitoring" on public.monitoramento_pcc;
drop policy if exists "Empresa members can insert PCC monitoring" on public.monitoramento_pcc;
drop policy if exists "Empresa members can update PCC monitoring" on public.monitoramento_pcc;
drop policy if exists "Empresa members can view PCC monitoring" on public.monitoramento_pcc;
drop policy if exists "Empresa members can delete PAC monitoring" on public.pac_monitoramento;
drop policy if exists "Empresa members can insert PAC monitoring" on public.pac_monitoramento;
drop policy if exists "Empresa members can update PAC monitoring" on public.pac_monitoramento;
drop policy if exists "Empresa members can view PAC monitoring" on public.pac_monitoramento;

-- 3) Definições da produção (46)
create policy "Metas: delete por admin da empresa" on public.agrogestao_metas as PERMISSIVE for DELETE to authenticated using ((has_role(auth.uid(), 'admin'::app_role) OR (EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = agrogestao_metas.empresa_id) AND (em.user_id = auth.uid()) AND (em.ativo = true) AND (em.papel = 'admin'::papel_empresa))))));
create policy "Metas: insert por admin da empresa" on public.agrogestao_metas as PERMISSIVE for INSERT to authenticated with check (((EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = agrogestao_metas.empresa_id) AND (em.user_id = auth.uid()) AND (em.ativo = true) AND (em.papel = 'admin'::papel_empresa)))) AND ((gerente_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
create policy "Metas: leitura por membros da empresa" on public.agrogestao_metas as PERMISSIVE for SELECT to authenticated using (((EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = agrogestao_metas.empresa_id) AND (em.user_id = auth.uid()) AND (em.ativo = true)))) OR (gerente_id = auth.uid())));
create policy "Metas: update por admin da empresa" on public.agrogestao_metas as PERMISSIVE for UPDATE to authenticated using ((EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = agrogestao_metas.empresa_id) AND (em.user_id = auth.uid()) AND (em.ativo = true) AND (em.papel = 'admin'::papel_empresa))))) with check (((EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = agrogestao_metas.empresa_id) AND (em.user_id = auth.uid()) AND (em.ativo = true) AND (em.papel = 'admin'::papel_empresa)))) AND ((gerente_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role))));
create policy "Membros da empresa veem a trilha da empresa" on public.audit_log as PERMISSIVE for SELECT to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND is_membro_empresa(empresa_id, auth.uid()))));
create policy "Admins criam campanhas" on public.campanhas as PERMISSIVE for INSERT to authenticated with check (has_role(auth.uid(), 'admin'::app_role));
create policy "Admins editam campanhas" on public.campanhas as PERMISSIVE for UPDATE to authenticated using (has_role(auth.uid(), 'admin'::app_role)) with check (has_role(auth.uid(), 'admin'::app_role));
create policy "Admins excluem campanhas" on public.campanhas as PERMISSIVE for DELETE to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "Admins veem campanhas" on public.campanhas as PERMISSIVE for SELECT to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "Admins da empresa podem ver aprovacoes" on public.documento_aprovacoes as PERMISSIVE for SELECT to authenticated using (((empresa_id IS NOT NULL) AND tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa)));
create policy "Admin insere membros" on public.empresa_membros as PERMISSIVE for INSERT to authenticated with check ((tem_papel_empresa(empresa_id, auth.uid(), 'admin'::papel_empresa) AND ((convidado_por IS NULL) OR (convidado_por = auth.uid())) AND (papel <> 'admin'::papel_empresa)));
create policy "Membros gerenciam módulos da empresa" on public.empresa_modulos_custom as PERMISSIVE for ALL to authenticated using (pode_usar_empresa(empresa_id, auth.uid())) with check (pode_usar_empresa(empresa_id, auth.uid()));
create policy "Membros veem módulos da empresa" on public.empresa_modulos_custom as PERMISSIVE for SELECT to authenticated using (pode_usar_empresa(empresa_id, auth.uid()));
create policy "Active members can view their companies" on public.empresas as PERMISSIVE for SELECT to authenticated using ((EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = empresas.id) AND (em.user_id = auth.uid()) AND (em.ativo = true)))));
create policy "Users can delete their company's equipment" on public.equipamentos as PERMISSIVE for DELETE to authenticated using ((empresa_id IN ( SELECT empresa_membros.empresa_id FROM empresa_membros WHERE ((empresa_membros.user_id = auth.uid()) AND (empresa_membros.ativo = true)))));
create policy "Users can insert equipment for their company" on public.equipamentos as PERMISSIVE for INSERT to authenticated with check ((empresa_id IN ( SELECT empresa_membros.empresa_id FROM empresa_membros WHERE ((empresa_membros.user_id = auth.uid()) AND (empresa_membros.ativo = true)))));
create policy "Users can update their company's equipment" on public.equipamentos as PERMISSIVE for UPDATE to authenticated using ((empresa_id IN ( SELECT empresa_membros.empresa_id FROM empresa_membros WHERE ((empresa_membros.user_id = auth.uid()) AND (empresa_membros.ativo = true))))) with check ((empresa_id IN ( SELECT empresa_membros.empresa_id FROM empresa_membros WHERE ((empresa_membros.user_id = auth.uid()) AND (empresa_membros.ativo = true)))));
create policy "Users can view their company's equipment" on public.equipamentos as PERMISSIVE for SELECT to authenticated using ((empresa_id IN ( SELECT empresa_membros.empresa_id FROM empresa_membros WHERE ((empresa_membros.user_id = auth.uid()) AND (empresa_membros.ativo = true)))));
create policy execucao_its_insert on public.execucao_its as PERMISSIVE for INSERT to authenticated with check (((auth.uid() = user_id) AND ((empresa_id IS NULL) OR pode_usar_empresa(empresa_id, auth.uid()))));
create policy execucao_its_select on public.execucao_its as PERMISSIVE for SELECT to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND is_membro_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can delete supplier audits" on public.fornecedor_auditorias as PERMISSIVE for DELETE to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can insert supplier audits" on public.fornecedor_auditorias as PERMISSIVE for INSERT to authenticated with check (((auth.uid() = user_id) AND ((empresa_id IS NULL) OR pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can update supplier audits" on public.fornecedor_auditorias as PERMISSIVE for UPDATE to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can view supplier audits" on public.fornecedor_auditorias as PERMISSIVE for SELECT to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Bloquear delete direto por authenticated" on public.licencas as RESTRICTIVE for DELETE to authenticated using (false);
create policy "Bloquear insert direto por authenticated" on public.licencas as RESTRICTIVE for INSERT to authenticated with check (false);
create policy "Bloquear update direto por authenticated" on public.licencas as RESTRICTIVE for UPDATE to authenticated using (false) with check (false);
create policy "Users can view own and member company licenses" on public.licencas as PERMISSIVE for SELECT to authenticated using (((auth.uid() = user_id) OR (EXISTS ( SELECT 1 FROM empresas e WHERE ((e.id = licencas.empresa_id) AND (e.user_id = auth.uid())))) OR (EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = licencas.empresa_id) AND (em.user_id = auth.uid()) AND (em.ativo = true))))));
create policy "Authenticated view MAPA establishments" on public.mapa_estabelecimentos as PERMISSIVE for SELECT to authenticated using (true);
create policy "Admins can view MAPA imports" on public.mapa_importacoes as PERMISSIVE for SELECT to authenticated using (has_role(auth.uid(), 'admin'::app_role));
create policy "Acesso por dono ou membro empresa" on public.modelos_empresa as PERMISSIVE for ALL to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND is_membro_empresa(empresa_id, auth.uid())))) with check (((auth.uid() = user_id) AND ((empresa_id IS NULL) OR pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can delete PCC monitoring" on public.monitoramento_pcc as PERMISSIVE for DELETE to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can insert PCC monitoring" on public.monitoramento_pcc as PERMISSIVE for INSERT to authenticated with check (((auth.uid() = user_id) AND ((empresa_id IS NULL) OR pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can update PCC monitoring" on public.monitoramento_pcc as PERMISSIVE for UPDATE to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can view PCC monitoring" on public.monitoramento_pcc as PERMISSIVE for SELECT to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Acesso por dono ou membro empresa" on public.normas_legislacao as PERMISSIVE for ALL to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND is_membro_empresa(empresa_id, auth.uid())))) with check (((auth.uid() = user_id) AND ((empresa_id IS NULL) OR pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Normas globais visiveis a todos" on public.normas_legislacao as PERMISSIVE for SELECT to authenticated using ((empresa_id IS NULL));
create policy "Empresa members can delete PAC monitoring" on public.pac_monitoramento as PERMISSIVE for DELETE to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can insert PAC monitoring" on public.pac_monitoramento as PERMISSIVE for INSERT to authenticated with check (((auth.uid() = user_id) AND ((empresa_id IS NULL) OR pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can update PAC monitoring" on public.pac_monitoramento as PERMISSIVE for UPDATE to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Empresa members can view PAC monitoring" on public.pac_monitoramento as PERMISSIVE for SELECT to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Acesso por dono ou membro empresa" on public.registros_customizados as PERMISSIVE for ALL to authenticated using (((auth.uid() = user_id) OR ((empresa_id IS NOT NULL) AND is_membro_empresa(empresa_id, auth.uid())))) with check (((auth.uid() = user_id) AND ((empresa_id IS NULL) OR pode_usar_empresa(empresa_id, auth.uid()))));
create policy "Membros da empresa apagam mensagens" on public.whatsapp_mensagens as PERMISSIVE for DELETE to authenticated using ((EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = whatsapp_mensagens.empresa_id) AND (em.user_id = auth.uid())))));
create policy "Membros da empresa atualizam mensagens" on public.whatsapp_mensagens as PERMISSIVE for UPDATE to authenticated using ((EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = whatsapp_mensagens.empresa_id) AND (em.user_id = auth.uid())))));
create policy "Membros da empresa inserem mensagens" on public.whatsapp_mensagens as PERMISSIVE for INSERT to authenticated with check ((EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = whatsapp_mensagens.empresa_id) AND (em.user_id = auth.uid())))));
create policy "Membros da empresa veem mensagens" on public.whatsapp_mensagens as PERMISSIVE for SELECT to authenticated using (((empresa_id IS NOT NULL) AND (EXISTS ( SELECT 1 FROM empresa_membros em WHERE ((em.empresa_id = whatsapp_mensagens.empresa_id) AND (em.user_id = auth.uid()) AND (em.ativo = true))))));
