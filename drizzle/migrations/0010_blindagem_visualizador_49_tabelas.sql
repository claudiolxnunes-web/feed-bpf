DO $migration_blindagem_visualizador$
DECLARE
  tabelas constant text[] := ARRAY[
    'analises_laboratorio', 'arquivos_bpf', 'auditorias_bpf',
    'batida_lotes', 'batidas_producao', 'calibracoes', 'checklist_items',
    'controle_pragas', 'controle_residuos', 'controle_substancias',
    'controle_visitantes', 'cronogramas_higiene', 'documento_versoes',
    'documentos', 'documentos_bpf', 'execucao_pops', 'expedicao_itens',
    'expedicoes', 'formula_ingredientes', 'formula_itens', 'formulas',
    'fornecedores', 'legislacao_alertas', 'manuais_bpf', 'manutencoes',
    'matriz_risco', 'matriz_sensibilidade', 'modelos_empresa',
    'nao_conformidades', 'normas_legislacao', 'ordens_producao',
    'planejamento_anual', 'pop_planilha_itens', 'pop_planilhas',
    'producao', 'produtos', 'programas_sanitarios', 'rastreabilidade',
    'recebimento_mp', 'receitas_medicados', 'registros_customizados',
    'registros_limpeza', 'relatorios', 'rotulos', 'saude_manipuladores',
    'simulacoes_recall', 'testes_rastreabilidade', 'treinamentos',
    'validacao_limpeza_linha'
  ];
  tabela text;
BEGIN
  -- 1. Validação de segurança: garantir que as 49 tabelas existam e possuam as policies
  IF cardinality(tabelas) <> 49 THEN
    RAISE EXCEPTION 'Escopo inválido: esperadas 49 tabelas, recebidas %', cardinality(tabelas);
  END IF;

  FOREACH tabela IN ARRAY tabelas LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = tabela
        AND p.policyname = 'Escrita por papeis de edicao'
        AND p.cmd = 'INSERT'
    ) THEN
      RAISE EXCEPTION 'Policy "Escrita por papeis de edicao" ausente em public.%', tabela;
    END IF;
  END LOOP;

  -- 2. Remoção de políticas residuais do tipo ALL que contornariam a blindagem
  DROP POLICY IF EXISTS "Membros da empresa gerenciam modelos" ON public.modelos_empresa;
  DROP POLICY IF EXISTS "Membros da empresa gerenciam registros customizados" ON public.registros_customizados;

  -- 3. Aplicação das novas políticas blindadas em todas as 49 tabelas
  FOREACH tabela IN ARRAY tabelas LOOP
    -- Drop das políticas anteriores de escrita/edição/exclusão
    EXECUTE format('DROP POLICY IF EXISTS "Escrita por papeis de edicao" ON public.%I', tabela);
    EXECUTE format('DROP POLICY IF EXISTS "Atualizacao por papeis de edicao" ON public.%I', tabela);
    EXECUTE format('DROP POLICY IF EXISTS "Exclusao por papeis de edicao" ON public.%I', tabela);

    -- INSERT: Requer pode_editar_empresa se pertencer a uma empresa
    EXECUTE format(
      'CREATE POLICY "Escrita por papeis de edicao" ON public.%I
       FOR INSERT TO authenticated
       WITH CHECK (
         ((empresa_id IS NOT NULL) AND public.pode_editar_empresa(empresa_id, auth.uid()))
         OR
         ((empresa_id IS NULL) AND (user_id = auth.uid()))
       )',
      tabela
    );

    -- UPDATE: Requer pode_editar_empresa se pertencer a uma empresa (no USING e no WITH CHECK)
    EXECUTE format(
      'CREATE POLICY "Atualizacao por papeis de edicao" ON public.%I
       FOR UPDATE TO authenticated
       USING (
         ((empresa_id IS NOT NULL) AND public.pode_editar_empresa(empresa_id, auth.uid()))
         OR
         ((empresa_id IS NULL) AND (user_id = auth.uid()))
       )
       WITH CHECK (
         ((empresa_id IS NOT NULL) AND public.pode_editar_empresa(empresa_id, auth.uid()))
         OR
         ((empresa_id IS NULL) AND (user_id = auth.uid()))
       )',
      tabela
    );

    -- DELETE: Requer pode_editar_empresa se pertencer a uma empresa
    EXECUTE format(
      'CREATE POLICY "Exclusao por papeis de edicao" ON public.%I
       FOR DELETE TO authenticated
       USING (
         ((empresa_id IS NOT NULL) AND public.pode_editar_empresa(empresa_id, auth.uid()))
         OR
         ((empresa_id IS NULL) AND (user_id = auth.uid()))
       )',
      tabela
    );
  END LOOP;
END
$migration_blindagem_visualizador$;