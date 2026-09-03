do $$
declare
  r record;
  t text;
  alvos text[] := array[
    -- Bloco A: hoje isoladas por usuario, sem clausula de empresa
    'batida_lotes','batidas_producao','checklist_items','controle_pragas',
    'controle_residuos','controle_substancias','controle_visitantes',
    'formula_itens','legislacao_alertas','manutencoes','matriz_sensibilidade',
    'planejamento_anual','pop_planilha_itens','pop_planilhas','producao',
    'produtos','registros_limpeza','relatorios','rotulos','saude_manipuladores',
    'testes_rastreabilidade','treinamentos','validacao_limpeza_linha',
    -- Bloco B: policy certa, expressao divergente da producao
    'arquivos_bpf','cronogramas_higiene','documentos_bpf','execucao_pops',
    'expedicao_itens','expedicoes','formula_ingredientes','formulas',
    'fornecedores','manuais_bpf','matriz_risco','nao_conformidades',
    'ordens_producao','rastreabilidade','recebimento_mp'
  ];
begin
  foreach t in array alvos loop
    if exists (select 1 from information_schema.tables
               where table_schema='public' and table_name=t) then
      for r in select policyname from pg_policies
               where schemaname='public' and tablename=t loop
        execute format('drop policy if exists %I on public.%I', r.policyname, t);
      end loop;

      execute format($f$
        create policy "Acesso por dono ou membro empresa"
          on public.%I for all to authenticated
          using (auth.uid() = user_id
                 or (empresa_id is not null and is_membro_empresa(empresa_id, auth.uid())))
          with check (auth.uid() = user_id
                 and (empresa_id is null or pode_usar_empresa(empresa_id, auth.uid())))
      $f$, t);
    end if;
  end loop;
end $$;
