
-- Função para atualizar timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1. PROFILES (perfil completo do usuário)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  nome TEXT NOT NULL DEFAULT '',
  cargo TEXT DEFAULT '',
  telefone TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Trigger para criar perfil automaticamente no signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, nome)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'nome', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created_feed_bpf
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. EMPRESAS
CREATE TABLE public.empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  cnpj TEXT DEFAULT '',
  endereco TEXT DEFAULT '',
  responsavel_tecnico TEXT DEFAULT '',
  crmv TEXT DEFAULT '',
  tipo_producao TEXT[] DEFAULT '{}',
  capacidade TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own empresas" ON public.empresas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_empresas_updated_at BEFORE UPDATE ON public.empresas FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. DOCUMENTOS / POPs
CREATE TABLE public.documentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  codigo TEXT NOT NULL,
  nome TEXT NOT NULL,
  versao TEXT DEFAULT '01',
  data_revisao DATE DEFAULT CURRENT_DATE,
  responsavel TEXT DEFAULT '',
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'em_revisao', 'obsoleto')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.documentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own documentos" ON public.documentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_documentos_updated_at BEFORE UPDATE ON public.documentos FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. CHECKLIST AUDITORIA BPF
CREATE TABLE public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  auditoria_data DATE DEFAULT CURRENT_DATE,
  area TEXT NOT NULL,
  item TEXT NOT NULL,
  conforme BOOLEAN,
  observacao TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own checklist" ON public.checklist_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 5. NÃO CONFORMIDADES
CREATE TABLE public.nao_conformidades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  setor TEXT NOT NULL,
  descricao TEXT NOT NULL,
  causa TEXT DEFAULT '',
  acao_corretiva TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  prazo DATE,
  status TEXT DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'fechada')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.nao_conformidades ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own NCs" ON public.nao_conformidades FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_ncs_updated_at BEFORE UPDATE ON public.nao_conformidades FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 6. RECEBIMENTO DE MATÉRIAS-PRIMAS
CREATE TABLE public.recebimento_mp (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  fornecedor TEXT NOT NULL,
  materia_prima TEXT NOT NULL,
  lote TEXT DEFAULT '',
  odor TEXT DEFAULT 'normal' CHECK (odor IN ('normal', 'anormal')),
  umidade TEXT DEFAULT '',
  insetos TEXT DEFAULT 'ausente' CHECK (insetos IN ('ausente', 'presente')),
  aprovado BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.recebimento_mp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own recebimento" ON public.recebimento_mp FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 7. PRODUÇÃO
CREATE TABLE public.producao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  produto TEXT NOT NULL,
  lote TEXT DEFAULT '',
  operador TEXT DEFAULT '',
  tempo_mistura TEXT DEFAULT '',
  quantidade TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.producao ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own producao" ON public.producao FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 8. RASTREABILIDADE
CREATE TABLE public.rastreabilidade (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  produto TEXT NOT NULL,
  lote_produto TEXT DEFAULT '',
  materia_prima TEXT NOT NULL,
  lote_mp TEXT DEFAULT '',
  fornecedor TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.rastreabilidade ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own rastreabilidade" ON public.rastreabilidade FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 9. CONTROLE DE PRAGAS
CREATE TABLE public.controle_pragas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  local TEXT NOT NULL,
  tipo_praga TEXT NOT NULL,
  acao TEXT DEFAULT '',
  responsavel TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.controle_pragas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own pragas" ON public.controle_pragas FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 10. TREINAMENTOS
CREATE TABLE public.treinamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  funcionario TEXT NOT NULL,
  treinamento TEXT NOT NULL,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  instrutor TEXT DEFAULT '',
  validade DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.treinamentos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own treinamentos" ON public.treinamentos FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
