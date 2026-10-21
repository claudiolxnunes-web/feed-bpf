-- A) Lista membros com e-mail; só admin ativo da empresa
CREATE OR REPLACE FUNCTION public.listar_membros_empresa(_empresa_id uuid)
RETURNS TABLE(id uuid, user_id uuid, nome text, email text, papel public.papel_empresa, ativo boolean, created_at timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.tem_papel_empresa(_empresa_id, auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Apenas administradores' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
  SELECT m.id, m.user_id, coalesce(m.nome, p.nome), u.email::text, m.papel, m.ativo, m.created_at
  FROM public.empresa_membros m
  LEFT JOIN public.profiles p ON p.user_id = m.user_id
  LEFT JOIN auth.users u ON u.id = m.user_id
  WHERE m.empresa_id = _empresa_id
  ORDER BY m.created_at;
END $$;

-- B) Aceita convite: código válido, não expirado, mesmo e-mail do usuário logado
CREATE OR REPLACE FUNCTION public.aceitar_convite_empresa(_token text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_uid uuid := auth.uid(); v_email text; c public.convites_empresa;
BEGIN
  IF v_uid IS NULL THEN RETURN jsonb_build_object('ok',false,'error','Não autenticado'); END IF;
  SELECT lower(email) INTO v_email FROM auth.users WHERE id = v_uid;
  SELECT * INTO c FROM public.convites_empresa
   WHERE token_hash = encode(extensions.digest(_token,'sha256'),'hex') FOR UPDATE;
  IF NOT FOUND OR c.aceito_em IS NOT NULL OR c.expira_em < now() THEN
    RETURN jsonb_build_object('ok',false,'error','Convite inválido, usado ou expirado'); END IF;
  IF lower(c.email) <> v_email THEN
    RETURN jsonb_build_object('ok',false,'error','Convite pertence a outro e-mail'); END IF;
  INSERT INTO public.empresa_membros(empresa_id,user_id,papel,nome,ativo,convidado_por)
  VALUES (c.empresa_id,v_uid,c.papel,c.nome,true,c.convidado_por)
  ON CONFLICT (empresa_id,user_id) DO NOTHING;
  IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'error','Usuário já vinculado a esta empresa'); END IF;
  UPDATE public.convites_empresa SET aceito_em = now(), aceito_por = v_uid WHERE id = c.id;
  RETURN jsonb_build_object('ok',true,'empresa_id',c.empresa_id,'papel',c.papel);
END $$;

-- C) Troca de papel só pela função; protege o dono e o próprio usuário
CREATE OR REPLACE FUNCTION public.alterar_papel_membro(_membro_id uuid, _papel public.papel_empresa)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE m public.empresa_membros;
BEGIN
  SELECT * INTO m FROM public.empresa_membros WHERE id = _membro_id FOR UPDATE;
  IF NOT FOUND OR NOT public.tem_papel_empresa(m.empresa_id, auth.uid(), 'admin') THEN
    RETURN jsonb_build_object('ok',false,'error','Sem permissão'); END IF;
  IF m.user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.empresas e WHERE e.id = m.empresa_id AND e.user_id = m.user_id) THEN
    RETURN jsonb_build_object('ok',false,'error','Não é permitido alterar o próprio papel ou o do dono'); END IF;
  PERFORM set_config('app.troca_papel_autorizada','on',true);
  UPDATE public.empresa_membros SET papel = _papel WHERE id = _membro_id;
  RETURN jsonb_build_object('ok',true);
END $$;

CREATE OR REPLACE FUNCTION public.bloquear_troca_papel()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.papel IS DISTINCT FROM OLD.papel
     AND coalesce(auth.role(),'') = 'authenticated'
     AND coalesce(current_setting('app.troca_papel_autorizada', true),'') <> 'on' THEN
    RAISE EXCEPTION 'Alteração de papel não permitida por usuário autenticado (de % para %)', OLD.papel, NEW.papel USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END $$;

REVOKE ALL ON FUNCTION public.listar_membros_empresa(uuid), public.aceitar_convite_empresa(text), public.alterar_papel_membro(uuid, public.papel_empresa) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.listar_membros_empresa(uuid), public.aceitar_convite_empresa(text), public.alterar_papel_membro(uuid, public.papel_empresa) TO authenticated;