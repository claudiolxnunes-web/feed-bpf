// ============================================================================
// Execução preenchida de uma Instrução de Trabalho
//
// O modelo em branco vive em `modelos_bpf`. O preenchimento vive em
// `execucao_pops` — a mesma tabela onde toda execução de POP já é registrada,
// com carimbo SHA-256 e fluxo de verificação por supervisor. Os valores dos
// campos vão na coluna `valores` (jsonb), chaveados por "{secao}.{campo}".
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import {
  type ModeloIt,
  type ValoresModelo,
  type SecaoModelo,
  camposObrigatoriosVazios,
} from "@/lib/importadorIts";

export interface ModeloItPersistido extends ModeloIt {
  id: string;
}

/**
 * Carrega o modelo da IT gravado para a empresa.
 *
 * Devolve null quando a empresa ainda não importou os modelos — o chamador
 * deve tratar isso como "importe primeiro", não como erro.
 */
export async function carregarModeloIt(
  empresaId: string,
  itCodigo: string,
): Promise<ModeloItPersistido | null> {
  const { data, error } = await supabase
    .from("modelos_bpf")
    .select("id, it_codigo, pop_codigo, titulo, frequencia, objetivo, base_legal, conteudo")
    .eq("empresa_id", empresaId)
    .eq("it_codigo", itCodigo)
    .maybeSingle();

  if (error || !data) return null;

  const conteudo = (data.conteudo || {}) as {
    epis?: string[];
    passoAPasso?: string[];
    criteriosAceitacao?: string[];
    secoes?: SecaoModelo[];
  };

  return {
    id: data.id,
    codigo: data.it_codigo,
    titulo: data.titulo,
    pop: data.pop_codigo || "",
    frequencia: (data.frequencia || "EVENTUAL") as ModeloIt["frequencia"],
    objetivo: data.objetivo || "",
    baseLegal: data.base_legal || undefined,
    epis: conteudo.epis ?? [],
    passoAPasso: conteudo.passoAPasso ?? [],
    criteriosAceitacao: conteudo.criteriosAceitacao ?? [],
    secoes: conteudo.secoes ?? [],
  };
}

/** Lista as ITs que a empresa já tem modelo, para montar o seletor. */
export async function listarModelosDaEmpresa(
  empresaId: string,
): Promise<{ id: string; it_codigo: string; pop_codigo: string | null; titulo: string }[]> {
  const { data, error } = await supabase
    .from("modelos_bpf")
    .select("id, it_codigo, pop_codigo, titulo")
    .eq("empresa_id", empresaId)
    .order("it_codigo");

  if (error || !data) return [];
  return data;
}

export interface SalvarExecucaoParams {
  modelo: ModeloItPersistido;
  valores: ValoresModelo;
  empresaId: string | null;
  userId: string;
  /** Nome de quem executou. Vai para a coluna `executor` (NOT NULL). */
  executor: string;
  setor?: string;
  observacoes?: string;
  /** `concluido` por padrão; `rascunho` permite salvar incompleto. */
  status?: "concluido" | "rascunho";
}

export interface SalvarExecucaoResultado {
  ok: boolean;
  id?: string;
  erro?: string;
  /** Campos obrigatórios ainda vazios, quando o salvamento foi barrado. */
  pendentes?: { chave: string; secao: string; rotulo: string }[];
}

/**
 * Grava a execução preenchida.
 *
 * Em `concluido`, os campos obrigatórios são validados ANTES de tocar o banco:
 * um registro de BPF incompleto marcado como concluído é pior que nenhum
 * registro, porque passa a impressão de conformidade numa auditoria.
 * Em `rascunho`, a validação é dispensada de propósito.
 */
export async function salvarExecucaoIt({
  modelo,
  valores,
  empresaId,
  userId,
  executor,
  setor,
  observacoes,
  status = "concluido",
}: SalvarExecucaoParams): Promise<SalvarExecucaoResultado> {
  if (status === "concluido") {
    const pendentes = camposObrigatoriosVazios(modelo, valores);
    if (pendentes.length > 0) {
      return { ok: false, pendentes, erro: "Campos obrigatórios não preenchidos" };
    }
  }

  const dataExecucao =
    (typeof valores["identificacao.data_execucao"] === "string" &&
      valores["identificacao.data_execucao"]) ||
    new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("execucao_pops")
    .insert({
      user_id: userId,
      empresa_id: empresaId,
      codigo_pop: modelo.pop,
      nome_pop: modelo.titulo,
      it_codigo: modelo.codigo,
      modelo_id: modelo.id,
      data_execucao: dataExecucao,
      executor,
      setor: setor || null,
      status,
      observacoes: observacoes || null,
      valores: valores as unknown as Json,
    })
    .select("id")
    .single();

  if (error) return { ok: false, erro: error.message };
  return { ok: true, id: data.id };
}
