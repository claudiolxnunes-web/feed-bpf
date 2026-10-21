DO $$
DECLARE
  t text;
  p record;
  tabelas text[] := ARRAY[
    'arquivos_bpf','batida_lotes','batidas_producao','checklist_items','controle_pragas',
    'controle_residuos','controle_substancias','controle_visitantes','cronogramas_higiene',
    'documentos_bpf','execucao_pops','expedicao_itens','expedicoes','formula_ingredientes',
    'formula_itens','formulas','fornecedores','legislacao_alertas','manuais_bpf','manutencoes',
    'matriz_risco','matriz_sensibilidade','modelos_empresa','nao_conformidades','normas_legislacao',
    'ordens_producao','planejamento_anual','pop_planilha_itens','pop_planilhas','producao',
    'produtos','rastreabilidade','recebimento_mp','registros_customizados','registros_limpeza',
    'relatorios','rotulos','saude_manipuladores','testes_rastreabilidade','treinamentos',
    'validacao_limpeza_linha'
  ];
BEGIN
  FOREACH t IN ARRAY tabelas LOOP
    -- Remove apenas as policies antigas restritas ao criador do registro
    FOR p IN
      SELECT policyname FROM pg_policies
      WHERE schemaname = 'public' AND tablename = t
        AND coalesce(qual, with_check) LIKE '%auth.uid()%'
        AND coalesce(qual, '') NOT LIKE '%is_membro_empresa%'
        AND coalesce(qual, '') NOT LIKE '%pode_usar_empresa%'
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;

    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "Acesso por dono ou membro empresa" ON public.%I', t);

    EXECUTE format($f$
      CREATE POLICY "Acesso por dono ou membro empresa" ON public.%I
      AS PERMISSIVE FOR ALL TO authenticated
      USING (
        auth.uid() = user_id
        OR (empresa_id IS NOT NULL AND public.is_membro_empresa(empresa_id, auth.uid()))
      )
      WITH CHECK (
        auth.uid() = user_id
        AND (empresa_id IS NULL OR public.pode_usar_empresa(empresa_id, auth.uid()))
      )
    $f$, t);

    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;

-- Normas/legislações globais (sem empresa) permanecem visíveis para qualquer usuário logado
DROP POLICY IF EXISTS "Normas globais visiveis a todos" ON public.normas_legislacao;
CREATE POLICY "Normas globais visiveis a todos" ON public.normas_legislacao
AS PERMISSIVE FOR SELECT TO authenticated
USING (empresa_id IS NULL);