ALTER TABLE public.empresas
  ADD COLUMN fabrica_medicamentos boolean NOT NULL DEFAULT false,
  ADD COLUMN data_autorizacao_medicamentos date NULL,
  ADD COLUMN arquivo_autorizacao_medicamentos text NULL;

ALTER TABLE public.formulas ADD COLUMN medicada boolean NOT NULL DEFAULT false;

CREATE TABLE public.receitas_medicados (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  numero text NOT NULL,
  data_emissao date NOT NULL,
  validade date NOT NULL,
  medico_veterinario text NOT NULL,
  crmv text NOT NULL,
  cliente text NOT NULL,
  especie text NOT NULL,
  principio_ativo text NOT NULL,
  dose text NOT NULL,
  finalidade text NOT NULL CHECK (finalidade IN ('tratamento','metafilaxia')),
  arquivo text NULL,
  status text NOT NULL DEFAULT 'vigente' CHECK (status IN ('rascunho','vigente','cancelada')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (validade >= data_emissao)
);
CREATE INDEX idx_receitas_medicados_empresa ON public.receitas_medicados(empresa_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.receitas_medicados TO authenticated;
GRANT ALL ON public.receitas_medicados TO service_role;
ALTER TABLE public.receitas_medicados ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.receita_validade_padrao() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.validade IS NULL THEN NEW.validade := NEW.data_emissao + 10; END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_receita_validade BEFORE INSERT ON public.receitas_medicados
  FOR EACH ROW EXECUTE FUNCTION public.receita_validade_padrao();

CREATE TABLE public.programas_sanitarios (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id uuid NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  nome text NOT NULL,
  cliente text NOT NULL,
  especie text NOT NULL,
  principio_ativo text NOT NULL,
  dose text NULL,
  medico_veterinario text NOT NULL,
  crmv text NOT NULL,
  data_inicio date NOT NULL,
  data_ultima_revisao date NOT NULL,
  arquivo text NULL,
  status text NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo','encerrado')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_programas_sanitarios_empresa ON public.programas_sanitarios(empresa_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.programas_sanitarios TO authenticated;
GRANT ALL ON public.programas_sanitarios TO service_role;
ALTER TABLE public.programas_sanitarios ENABLE ROW LEVEL SECURITY;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['receitas_medicados','programas_sanitarios'] LOOP
    EXECUTE format('CREATE POLICY "Leitura por dono ou membro empresa" ON public.%I FOR SELECT TO authenticated USING ((user_id = auth.uid()) OR ((empresa_id IS NOT NULL) AND public.pode_usar_empresa(empresa_id, auth.uid())))', t);
    EXECUTE format('CREATE POLICY "Escrita por papeis de edicao" ON public.%I FOR INSERT TO authenticated WITH CHECK ((user_id = auth.uid()) OR ((empresa_id IS NOT NULL) AND public.pode_editar_empresa(empresa_id, auth.uid())))', t);
    EXECUTE format('CREATE POLICY "Atualizacao por papeis de edicao" ON public.%I FOR UPDATE TO authenticated USING ((user_id = auth.uid()) OR ((empresa_id IS NOT NULL) AND public.pode_editar_empresa(empresa_id, auth.uid()))) WITH CHECK ((user_id = auth.uid()) OR ((empresa_id IS NOT NULL) AND public.pode_editar_empresa(empresa_id, auth.uid())))', t);
    EXECUTE format('CREATE POLICY "Exclusao por papeis de edicao" ON public.%I FOR DELETE TO authenticated USING ((user_id = auth.uid()) OR ((empresa_id IS NOT NULL) AND public.pode_editar_empresa(empresa_id, auth.uid())))', t);
    EXECUTE format('CREATE TRIGGER trg_audit_%s AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.process_audit_log()', t, t);
    EXECUTE format('CREATE TRIGGER trg_bloqueio_assinado BEFORE UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.bloquear_registro_assinado()', t);
    EXECUTE format('CREATE TRIGGER trg_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column()', t);
  END LOOP;
END $$;

ALTER TABLE public.ordens_producao
  ADD COLUMN medicada boolean NOT NULL DEFAULT false,
  ADD COLUMN receita_medicado_id uuid NULL REFERENCES public.receitas_medicados(id),
  ADD COLUMN programa_sanitario_id uuid NULL REFERENCES public.programas_sanitarios(id);
CREATE INDEX idx_ordens_receita ON public.ordens_producao(receita_medicado_id);
CREATE INDEX idx_ordens_programa ON public.ordens_producao(programa_sanitario_id);

CREATE OR REPLACE FUNCTION public.validar_liberacao_ordem_medicada() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE ok boolean := false;
BEGIN
  IF NEW.medicada AND NEW.status = 'em_producao'
     AND OLD.status IS DISTINCT FROM 'em_producao' THEN
    IF NEW.receita_medicado_id IS NOT NULL THEN
      SELECT EXISTS (SELECT 1 FROM receitas_medicados r
        WHERE r.id = NEW.receita_medicado_id AND r.status = 'vigente'
          AND r.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
          AND current_date BETWEEN r.data_emissao AND r.validade) INTO ok;
    END IF;
    IF NOT ok AND NEW.programa_sanitario_id IS NOT NULL THEN
      SELECT EXISTS (SELECT 1 FROM programas_sanitarios p
        WHERE p.id = NEW.programa_sanitario_id AND p.status = 'ativo'
          AND p.empresa_id IS NOT DISTINCT FROM NEW.empresa_id
          AND p.data_ultima_revisao >= current_date - interval '6 months') INTO ok;
    END IF;
    IF NOT ok THEN
      RAISE EXCEPTION 'Ordem com fórmula medicada exige receita válida ou programa sanitário vigente.';
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER trg_validar_ordem_medicada BEFORE UPDATE ON public.ordens_producao
  FOR EACH ROW EXECUTE FUNCTION public.validar_liberacao_ordem_medicada();

COMMENT ON TABLE public.receituarios_medicamentos IS 'DEPRECATED: substituída por receitas_medicados';