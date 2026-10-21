DO $migration$
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
    'producao', 'produtos', 'rastreabilidade', 'recebimento_mp',
    'registros_customizados', 'registros_limpeza', 'relatorios',
    'rotulos', 'saude_manipuladores', 'testes_rastreabilidade',
    'treinamentos', 'validacao_limpeza_linha'
  ];
  destinos constant text[] := ARRAY[
    'Leitura por dono ou membro empresa',
    'Escrita por papeis de edicao',
    'Atualizacao por papeis de edicao',
    'Exclusao por papeis de edicao'
  ];
  tabela text;
BEGIN
  IF cardinality(tabelas) <> 46 THEN
    RAISE EXCEPTION 'Escopo invalido: esperadas 46 tabelas';
  END IF;

  -- Validar todo o escopo antes de alterar qualquer policy.
  FOREACH tabela IN ARRAY tabelas LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = tabela
        AND p.policyname = 'Acesso por dono ou membro empresa'
        AND p.cmd = 'ALL'
    ) THEN
      RAISE EXCEPTION 'Policy antiga ALL ausente em public.%', tabela;
    END IF;
    IF EXISTS (
      SELECT 1 FROM pg_policies p
      WHERE p.schemaname = 'public' AND p.tablename = tabela
        AND p.policyname = ANY(destinos)
    ) THEN
      RAISE EXCEPTION 'Policy de destino ja existe em public.%', tabela;
    END IF;
  END LOOP;

  FOREACH tabela IN ARRAY tabelas LOOP
    EXECUTE format(
      'DROP POLICY "Acesso por dono ou membro empresa" ON public.%I', tabela
    );
    EXECUTE format(
      'CREATE POLICY "Leitura por dono ou membro empresa" ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_usar_empresa(empresa_id, auth.uid())))',
      tabela
    );
    EXECUTE format(
      'CREATE POLICY "Escrita por papeis de edicao" ON public.%I FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_editar_empresa(empresa_id, auth.uid())))',
      tabela
    );
    EXECUTE format(
      'CREATE POLICY "Atualizacao por papeis de edicao" ON public.%I FOR UPDATE TO authenticated USING (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_editar_empresa(empresa_id, auth.uid()))) WITH CHECK (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_editar_empresa(empresa_id, auth.uid())))',
      tabela
    );
    EXECUTE format(
      'CREATE POLICY "Exclusao por papeis de edicao" ON public.%I FOR DELETE TO authenticated USING (user_id = auth.uid() OR (empresa_id IS NOT NULL AND public.pode_editar_empresa(empresa_id, auth.uid())))',
      tabela
    );
  END LOOP;
END
$migration$;