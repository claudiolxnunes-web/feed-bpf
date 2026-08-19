// ============================================================================
// Modelos digitais das Instruções de Trabalho
//
// Os modelos NÃO são conteúdo novo: são derivados de `INSTRUCOES_TRABALHO`
// (src/config/instrucoesTrabalho.ts), que já carrega o conteúdo técnico
// oficial — objetivo, EPIs, passo a passo e critérios de aceitação. Duplicar
// esse texto aqui criaria duas fontes divergentes do mesmo procedimento.
//
// O que este módulo acrescenta é a camada de PREENCHIMENTO: seções com campos
// tipados que o operador preenche na fábrica, já com `valorPadrao` sugerido e
// editável.
// ============================================================================

import { supabase } from "@/integrations/supabase/client";
import type { Json } from "@/integrations/supabase/types";
import { INSTRUCOES_TRABALHO, type InstrucaoTrabalho } from "@/config/instrucoesTrabalho";
import { inferirFrequencia, type Frequencia } from "@/lib/bpfStorage";

export type TipoCampo =
  | "texto"
  | "texto_longo"
  | "numero"
  | "data"
  | "hora"
  | "checkbox"
  | "selecao"
  | "assinatura";

export interface CampoModelo {
  id: string;
  rotulo: string;
  tipo: TipoCampo;
  /** Texto/valor sugerido, já preenchido e editável pelo operador. */
  valorPadrao?: string | number | boolean;
  obrigatorio?: boolean;
  /** Only para tipo `selecao`. */
  opcoes?: string[];
  /** Unidade exibida ao lado do campo (kg, °C, %, ...). */
  unidade?: string;
  ajuda?: string;
}

export interface SecaoModelo {
  id: string;
  titulo: string;
  descricao?: string;
  campos: CampoModelo[];
}

export interface ModeloIt {
  codigo: string;
  titulo: string;
  pop: string;
  frequencia: Frequencia;
  objetivo: string;
  epis: string[];
  passoAPasso: string[];
  criteriosAceitacao: string[];
  baseLegal?: string;
  secoes: SecaoModelo[];
}

// ---------------------------------------------------------------------------
// Construção dos modelos a partir das ITs oficiais
// ---------------------------------------------------------------------------

/**
 * Seções padrão de um registro de IT. Todo registro de BPF precisa responder
 * quem executou, quando, o que foi verificado e quem conferiu — é isso que o
 * auditor do MAPA procura. As três seções abaixo cobrem esse mínimo; o passo a
 * passo específico da IT vira checkbox na seção de execução.
 */
function montarSecoes(it: InstrucaoTrabalho): SecaoModelo[] {
  const identificacao: SecaoModelo = {
    id: "identificacao",
    titulo: "Identificação",
    campos: [
      {
        id: "data_execucao",
        rotulo: "Data da execução",
        tipo: "data",
        obrigatorio: true,
      },
      {
        id: "hora_inicio",
        rotulo: "Hora de início",
        tipo: "hora",
      },
      {
        id: "responsavel",
        rotulo: "Responsável pela execução",
        tipo: "texto",
        obrigatorio: true,
      },
      {
        id: "setor",
        rotulo: "Setor / Área",
        tipo: "texto",
      },
      ...(it.epis.length > 0
        ? [
            {
              id: "epis_conferidos",
              rotulo: `EPIs conferidos antes de iniciar (${it.epis.join(", ")})`,
              tipo: "checkbox" as TipoCampo,
              valorPadrao: false,
              obrigatorio: true,
              ajuda: "Confirme que os EPIs previstos na IT estão em uso e em bom estado.",
            },
          ]
        : []),
    ],
  };

  const execucao: SecaoModelo = {
    id: "execucao",
    titulo: "Execução — passo a passo",
    descricao:
      "Marque cada passo à medida que for concluído. O texto de cada passo vem da IT oficial.",
    campos: it.passos.map((passo, i) => ({
      id: `passo_${String(i + 1).padStart(2, "0")}`,
      rotulo: passo,
      tipo: "checkbox" as TipoCampo,
      valorPadrao: false,
    })),
  };

  const conclusao: SecaoModelo = {
    id: "conclusao",
    titulo: "Conclusão e conformidade",
    campos: [
      {
        id: "criterios_atendidos",
        rotulo: "Todos os critérios de aceitação foram atendidos",
        tipo: "checkbox",
        valorPadrao: false,
        obrigatorio: true,
        ajuda: it.criteriosAceitacao.join(" | "),
      },
      {
        id: "resultado",
        rotulo: "Resultado",
        tipo: "selecao",
        opcoes: ["Conforme", "Não conforme", "Conforme com ressalva"],
        valorPadrao: "Conforme",
        obrigatorio: true,
      },
      {
        id: "observacoes",
        rotulo: "Observações / Não conformidades",
        tipo: "texto_longo",
        ajuda:
          "Descreva qualquer desvio observado. Resultado 'Não conforme' exige registro da ação tomada.",
      },
      {
        id: "hora_fim",
        rotulo: "Hora de término",
        tipo: "hora",
      },
      {
        id: "assinatura_executante",
        rotulo: "Assinatura do executante",
        tipo: "assinatura",
        obrigatorio: true,
      },
      {
        id: "assinatura_conferente",
        rotulo: "Assinatura do conferente / responsável técnico",
        tipo: "assinatura",
      },
    ],
  };

  return [identificacao, execucao, conclusao];
}

/** Modelos derivados das 22 ITs oficiais do projeto. */
export const MODELOS_IT: ModeloIt[] = INSTRUCOES_TRABALHO.map((it) => ({
  codigo: it.id,
  titulo: it.titulo,
  pop: it.popCodigo,
  frequencia: inferirFrequencia(it.frequencia),
  objetivo: it.objetivo,
  epis: it.epis,
  passoAPasso: it.passos,
  criteriosAceitacao: it.criteriosAceitacao,
  secoes: montarSecoes(it),
}));

export function modeloPorCodigo(codigo: string): ModeloIt | undefined {
  return MODELOS_IT.find((m) => m.codigo === codigo);
}

export function modelosPorPop(popCodigo: string): ModeloIt[] {
  return MODELOS_IT.filter((m) => m.pop === popCodigo);
}

// ---------------------------------------------------------------------------
// Auxiliares de preenchimento
// ---------------------------------------------------------------------------

export type ValoresModelo = Record<string, string | number | boolean>;

/**
 * Monta o objeto de valores iniciais a partir dos `valorPadrao` do modelo.
 * Campo sem `valorPadrao` entra com o vazio do seu tipo — nunca `undefined`,
 * para o formulário nascer controlado e não alternar entre controlado e não
 * controlado no meio da digitação.
 */
export function valoresIniciais(modelo: ModeloIt): ValoresModelo {
  const valores: ValoresModelo = {};
  for (const secao of modelo.secoes) {
    for (const campo of secao.campos) {
      const chave = `${secao.id}.${campo.id}`;
      if (campo.valorPadrao !== undefined) {
        valores[chave] = campo.valorPadrao;
      } else {
        valores[chave] = campo.tipo === "checkbox" ? false : campo.tipo === "numero" ? "" : "";
      }
    }
  }
  return valores;
}

export interface CampoPendente {
  chave: string;
  secao: string;
  rotulo: string;
}

/** Lista os campos obrigatórios que ainda estão vazios (ou desmarcados). */
export function camposObrigatoriosVazios(
  modelo: ModeloIt,
  valores: ValoresModelo,
): CampoPendente[] {
  const pendentes: CampoPendente[] = [];
  for (const secao of modelo.secoes) {
    for (const campo of secao.campos) {
      if (!campo.obrigatorio) continue;
      const chave = `${secao.id}.${campo.id}`;
      const valor = valores[chave];
      const vazio =
        campo.tipo === "checkbox"
          ? valor !== true
          : valor === undefined || valor === null || String(valor).trim() === "";
      if (vazio) {
        pendentes.push({ chave, secao: secao.titulo, rotulo: campo.rotulo });
      }
    }
  }
  return pendentes;
}

// ---------------------------------------------------------------------------
// Importador idempotente
// ---------------------------------------------------------------------------

export interface RelatorioImportacao {
  criados: string[];
  ignorados: string[];
  falhas: { codigo: string; erro: string }[];
}

export interface ImportarParams {
  empresaId: string;
  userId: string;
  /** Restringe a importação a estes códigos de IT. Vazio = todos. */
  codigos?: string[];
}

/**
 * Importa os modelos de IT para `modelos_bpf`.
 *
 * Idempotente: descobre o que já existe para a empresa em UMA consulta,
 * ignora o que já está lá e insere só o que falta. Rodar duas vezes seguidas
 * não duplica — a UNIQUE (empresa_id, it_codigo) é a garantia final, mas a
 * checagem prévia evita gastar o insert e transformar a segunda execução em
 * uma lista de erros de constraint.
 */
export async function importarModelosIt({
  empresaId,
  userId,
  codigos,
}: ImportarParams): Promise<RelatorioImportacao> {
  const relatorio: RelatorioImportacao = { criados: [], ignorados: [], falhas: [] };

  const alvo = codigos?.length
    ? MODELOS_IT.filter((m) => codigos.includes(m.codigo))
    : MODELOS_IT;

  if (alvo.length === 0) return relatorio;

  // Uma consulta só para todo o conjunto existente.
  const { data: existentes, error: erroConsulta } = await supabase
    .from("modelos_bpf")
    .select("it_codigo")
    .eq("empresa_id", empresaId);

  if (erroConsulta) {
    return {
      criados: [],
      ignorados: [],
      falhas: alvo.map((m) => ({ codigo: m.codigo, erro: erroConsulta.message })),
    };
  }

  const jaExiste = new Set<string>(
    ((existentes as { it_codigo: string }[] | null) || []).map((r) => r.it_codigo),
  );

  const novos = alvo.filter((m) => {
    if (jaExiste.has(m.codigo)) {
      relatorio.ignorados.push(m.codigo);
      return false;
    }
    return true;
  });

  if (novos.length === 0) return relatorio;

  const linhas = novos.map((m) => ({
    empresa_id: empresaId,
    user_id: userId,
    it_codigo: m.codigo,
    pop_codigo: m.pop,
    titulo: m.titulo,
    frequencia: m.frequencia,
    objetivo: m.objetivo,
    base_legal: m.baseLegal ?? null,
    // Cast só no valor jsonb: `Json` exige index signature, que uma interface
    // TS não tem, então SecaoModelo[] não casa estruturalmente mesmo sendo
    // serializável. O resto da linha continua checado pelos tipos gerados.
    conteudo: {
      epis: m.epis,
      passoAPasso: m.passoAPasso,
      criteriosAceitacao: m.criteriosAceitacao,
      secoes: m.secoes,
    } as unknown as Json,
  }));

  const { data: inseridos, error } = await supabase
    .from("modelos_bpf")
    .insert(linhas)
    .select("it_codigo");

  if (error) {
    // Insere em lote; se o lote falhar, reporta por código para o operador
    // saber exatamente o que não entrou.
    relatorio.falhas.push(...novos.map((m) => ({ codigo: m.codigo, erro: error.message })));
    return relatorio;
  }

  relatorio.criados.push(
    ...(((inseridos as { it_codigo: string }[] | null) || []).map((r) => r.it_codigo)),
  );

  return relatorio;
}
