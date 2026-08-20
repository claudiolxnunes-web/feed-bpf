-- ============================================================================
-- modelos_bpf — modelos digitais das Instruções de Trabalho
--
-- Guarda o formulário preenchível de cada IT por empresa: objetivo, base legal
-- e o conteúdo estruturado (EPIs, passo a passo, critérios de aceitação e as
-- seções de campos tipados) em `conteudo` jsonb.
--
-- Tabela NOVA: nenhum dado existente é tocado, nenhuma coluna de outra tabela
-- é alterada, nenhuma policy pré-existente é modificada.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.modelos_bpf (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id  uuid NOT NULL,
  user_id     uuid NOT NULL,
  it_codigo   text NOT NULL,
  pop_codigo  text,
  titulo      text NOT NULL,
  -- Mesmo CHECK de arquivos_bpf.frequencia. Os valores são MAIÚSCULOS: foi
  -- assim que a constraint da outra tabela foi criada, e divergir aqui faria
  -- o mesmo valor ser aceito numa tabela e recusado na outra.
  frequencia  text CONSTRAINT modelos_bpf_frequencia_check CHECK (
                frequencia IS NULL OR frequencia = ANY (ARRAY[
                  'DIARIA', 'SEMANAL', 'QUINZENAL', 'MENSAL',
                  'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'EVENTUAL'
                ])
              ),
  objetivo    text,
  base_legal  text,
  conteudo    jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT modelos_bpf_empresa_it_unico UNIQUE (empresa_id, it_codigo)
);

CREATE INDEX IF NOT EXISTS idx_modelos_bpf_empresa
  ON public.modelos_bpf (empresa_id, pop_codigo, it_codigo);

CREATE INDEX IF NOT EXISTS idx_modelos_bpf_user
  ON public.modelos_bpf (user_id);

-- ---------------------------------------------------------------------------
-- RLS — policy espelhando a de public.arquivos_bpf
--
-- A expressão abaixo foi copiada do estado REAL do banco (pg_policies), não do
-- histórico de migrations: a policy de arquivos_bpf foi alterada fora do
-- versionamento e os arquivos deste diretório mostram uma versão mais antiga,
-- restrita a `auth.uid() = user_id`. Espelhar o arquivo antigo tiraria o
-- acesso dos membros da empresa.
-- ---------------------------------------------------------------------------

ALTER TABLE public.modelos_bpf ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acesso por dono ou membro empresa" ON public.modelos_bpf;
CREATE POLICY "Acesso por dono ou membro empresa" ON public.modelos_bpf
  FOR ALL TO authenticated
  USING (
    auth.uid() = user_id
    OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid()))
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid()))
  );

-- ---------------------------------------------------------------------------
-- updated_at
-- Reaproveita a função já usada por outras tabelas do projeto.
-- ---------------------------------------------------------------------------

DROP TRIGGER IF EXISTS set_modelos_bpf_updated_at ON public.modelos_bpf;
CREATE TRIGGER set_modelos_bpf_updated_at
  BEFORE UPDATE ON public.modelos_bpf
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
