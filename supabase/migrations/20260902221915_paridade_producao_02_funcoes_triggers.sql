create or replace function public.bloquear_registro_assinado()
 returns trigger
 language plpgsql
 security definer
 set search_path to 'public'
as $function$
DECLARE
  v_status text;
BEGIN
  IF current_setting('role', true) = 'service_role'
     OR current_setting('request.jwt.claim.role', true) = 'service_role' THEN
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
  END IF;

  BEGIN
    v_status := to_jsonb(OLD) ->> 'status';
  EXCEPTION WHEN others THEN
    v_status := NULL;
  END;

  IF v_status IS NULL THEN
    BEGIN
      v_status := to_jsonb(OLD) ->> 'status_verificacao';
    EXCEPTION WHEN others THEN
      v_status := NULL;
    END;
  END IF;

  IF v_status IS NOT NULL AND lower(v_status) IN
     ('liberado','concluido','concluído','arquivado','assinado','expedido',
      'finalizado','vigente','obsoleto','aprovado') THEN
    RAISE EXCEPTION 'Registro assinado/liberado é imutável (exigência MAPA - Decreto 12.031/2024). Abra uma Não Conformidade para correções.';
  END IF;

  IF (to_jsonb(OLD) ? 'hash_integridade') AND (to_jsonb(OLD) ->> 'hash_integridade') IS NOT NULL THEN
    RAISE EXCEPTION 'Registro com selo de integridade é imutável (exigência MAPA). Abra uma Não Conformidade para correções.';
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$function$;

create or replace function public.normalize_licenca_produto()
 returns trigger
 language plpgsql
 set search_path to 'public'
as $function$
BEGIN
  IF NEW.produto IS NOT NULL THEN
    NEW.produto := lower(regexp_replace(NEW.produto, '[^a-zA-Z0-9]', '', 'g'));
  END IF;
  RETURN NEW;
END;
$function$;

drop trigger if exists trg_normalize_licenca_produto on public.licencas;
create trigger trg_normalize_licenca_produto
  before insert or update of produto on public.licencas
  for each row execute function public.normalize_licenca_produto();

do $$
declare
  t text;
  alvos text[] := array[
    'amostras_retencao','analises_laboratorio','batida_lotes','batidas_producao',
    'calibracoes','controle_pragas','controle_residuos','controle_substancias',
    'controle_visitantes','execucao_pops','expedicao_itens','expedicoes',
    'manutencoes','monitoramento_pcc','nao_conformidades','ordens_producao',
    'pac_monitoramento','pop_planilhas','producao','rastreabilidade',
    'recebimento_mp','registros_customizados','registros_limpeza',
    'saude_manipuladores','testes_rastreabilidade','treinamentos',
    'validacao_limpeza_linha'
  ];
begin
  foreach t in array alvos loop
    if exists (select 1 from information_schema.tables
               where table_schema='public' and table_name=t) then
      execute format('drop trigger if exists trg_bloquear_registro_assinado on public.%I', t);
      execute format('drop trigger if exists trg_bloqueio_assinado on public.%I', t);
      execute format(
        'create trigger trg_bloquear_registro_assinado
           before delete or update on public.%I
           for each row execute function public.bloquear_registro_assinado()', t);
    end if;
  end loop;
end $$;
