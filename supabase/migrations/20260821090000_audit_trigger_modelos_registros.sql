-- Trilha de auditoria (Decreto 12.031/2024): ativa o gatilho padrao de auditoria
-- em `modelos_empresa` e `registros_customizados`.
--
-- Contexto: a migracao 20260513143047 aplicou `trg_audit_<tabela>` em todas as
-- tabelas de negocio existentes naquela data, via loop. As duas tabelas abaixo
-- foram criadas depois (20260708035815) e por isso ficaram de fora da cobertura.
--
-- Idempotente: o DROP ... IF EXISTS antes do CREATE segue o mesmo padrao da
-- migracao original, entao reaplicar nao gera erro nem duplica o gatilho.

DO $$
DECLARE
    t TEXT;
BEGIN
    FOREACH t IN ARRAY ARRAY['modelos_empresa', 'registros_customizados']
    LOOP
        -- So age se a tabela existir, para a migracao nao quebrar em bases
        -- que ainda nao receberam 20260708035815.
        IF EXISTS (
            SELECT 1
            FROM information_schema.tables
            WHERE table_schema = 'public'
              AND table_type = 'BASE TABLE'
              AND table_name = t
        ) THEN
            EXECUTE format('DROP TRIGGER IF EXISTS trg_audit_%I ON public.%I', t, t);
            EXECUTE format(
                'CREATE TRIGGER trg_audit_%I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log()',
                t, t
            );
            RAISE NOTICE 'Auditoria ativada em public.%', t;
        ELSE
            RAISE NOTICE 'Tabela public.% nao encontrada, gatilho de auditoria ignorado', t;
        END IF;
    END LOOP;
END
$$;
