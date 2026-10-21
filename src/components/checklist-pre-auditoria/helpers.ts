import {
  AlertTriangle,
  ClipboardCheck,
  Droplets,
  FileText,
  GraduationCap,
  Search,
  Wrench,
} from "lucide-react";
import { CheckItem, ChecklistMetrics } from "./types";
import { normalizarPopCodigo, POPS_CODIGOS } from "@/lib/popCodigo";

export { normalizarPopCodigo };

type RowWithEmpresa = { empresa_id?: string | null };

export function filterByEmpresa<T extends RowWithEmpresa>(rows: T[], empresaId?: string) {
  if (!empresaId) return rows;
  return rows.filter((row) => !row.empresa_id || row.empresa_id === empresaId);
}

interface BuildChecklistItemsParams {
  hoje: Date;
  differenceInDays: (dateLeft: Date, dateRight: Date) => number;
  parseISO: (value: string) => Date;
  docs: Array<{ proxima_revisao?: string | null; validade_revisao?: string | null }>;
  pops: Array<{ mes?: number | null; ano?: number | null; pop_codigo?: string | null }>;
  calibracoes: Array<{ proxima_calibracao?: string | null }>;
  treinamentos: Array<{ validade?: string | null }>;
  checklistData: Array<unknown>;
  ncs: Array<{ status?: string | null }>;
  rastreabilidade: Array<unknown>;
  higiene: Array<unknown>;
  simulacoes: Array<{ data?: string | null }>;
}

export function buildChecklistItems({
  hoje,
  differenceInDays,
  parseISO,
  docs,
  pops,
  calibracoes,
  treinamentos,
  checklistData,
  ncs,
  rastreabilidade,
  higiene,
  simulacoes,
}: BuildChecklistItemsParams): CheckItem[] {
  const docsVencidos = docs.filter((d) => {
    const ref = d.proxima_revisao || d.validade_revisao;
    return ref && differenceInDays(parseISO(ref), hoje) < 0;
  });

  const mesAtual = hoje.getMonth() + 1;
  const anoAtual = hoje.getFullYear();
  const planilhasMesAtual = pops.filter((p) => p.mes === mesAtual && p.ano === anoAtual);
  const popsPreenchidos = new Set(
    planilhasMesAtual.map((p) => normalizarPopCodigo(p.pop_codigo)),
  );
  const popsFaltantes = POPS_CODIGOS.filter((codigo) => !popsPreenchidos.has(codigo));

  const calibVencidas = calibracoes.filter(
    (c) => c.proxima_calibracao && differenceInDays(parseISO(c.proxima_calibracao), hoje) < 0,
  );

  const treinVencidos = treinamentos.filter(
    (t) => t.validade && differenceInDays(parseISO(t.validade), hoje) < 0,
  );

  const ncsAbertas = ncs.filter((nc) => nc.status === "aberta" || nc.status === "em_andamento").length;

  // Última simulação de recall (exigência anual — Decreto 12.031/2024)
  const datasSimulacao = simulacoes
    .map((s) => s.data)
    .filter((d): d is string => !!d)
    .sort()
    .reverse();
  const ultimaSimulacao = datasSimulacao[0] || null;
  const diasDesdeSimulacao = ultimaSimulacao ? differenceInDays(hoje, parseISO(ultimaSimulacao)) : null;

  return [
    {
      area: "Documentos",
      item: "POPs e documentos com revisão em dia",
      status: docsVencidos.length === 0 ? "ok" : "critico",
      detalhe:
        docsVencidos.length === 0
          ? "Todos os documentos estão atualizados"
          : `${docsVencidos.length} documento(s) com revisão vencida`,
      link: "/documentos",
      icon: FileText,
    },
    {
      area: "Planilhas POP",
      item: "Planilhas de POPs preenchidas neste mês",
      status: popsFaltantes.length === 0 ? "ok" : popsFaltantes.length <= 3 ? "alerta" : "critico",
      detalhe:
        popsFaltantes.length === 0
          ? "Todos os 10 POPs preenchidos"
          : `${popsFaltantes.length} POP(s) sem planilha: ${popsFaltantes.join(", ")}`,
      link: "/planilhas-pop",
      icon: ClipboardCheck,
    },
    {
      area: "Calibração",
      item: "Equipamentos com calibração em dia",
      status: calibVencidas.length === 0 ? "ok" : "critico",
      detalhe:
        calibVencidas.length === 0
          ? `${calibracoes.length} equipamento(s) calibrados`
          : `${calibVencidas.length} equipamento(s) com calibração vencida`,
      link: "/manutencao",
      icon: Wrench,
    },
    {
      area: "Treinamentos",
      item: "Treinamentos dos colaboradores em dia",
      status: treinVencidos.length === 0 ? "ok" : treinVencidos.length <= 2 ? "alerta" : "critico",
      detalhe:
        treinVencidos.length === 0
          ? "Todos os treinamentos estão válidos"
          : `${treinVencidos.length} treinamento(s) vencido(s)`,
      link: "/treinamentos",
      icon: GraduationCap,
    },
    {
      area: "Não Conformidades",
      item: "Não conformidades com tratativa",
      status: ncsAbertas === 0 ? "ok" : ncsAbertas <= 2 ? "alerta" : "critico",
      detalhe:
        ncsAbertas === 0
          ? "Nenhuma NC aberta"
          : `${ncsAbertas} NC(s) em aberto aguardando tratativa`,
      link: "/nao-conformidades",
      icon: AlertTriangle,
    },
    {
      area: "Auditoria",
      item: "Pelo menos uma auditoria BPF realizada",
      status: checklistData.length > 0 ? "ok" : "critico",
      detalhe:
        checklistData.length > 0
          ? `${checklistData.length} item(ns) de checklist registrados`
          : "Nenhuma auditoria BPF realizada",
      link: "/auditoria",
      icon: ClipboardCheck,
    },
    {
      area: "Rastreabilidade",
      item: "Registros de rastreabilidade cadastrados",
      status: rastreabilidade.length > 0 ? "ok" : "alerta",
      detalhe:
        rastreabilidade.length > 0
          ? "Rastreabilidade ativa"
          : "Nenhum registro de rastreabilidade encontrado",
      link: "/rastreabilidade",
      icon: Search,
    },
    {
      area: "Higiene",
      item: "Cronograma de higienização cadastrado",
      status: higiene.length > 0 ? "ok" : "alerta",
      detalhe:
        higiene.length > 0
          ? `${higiene.length} cronograma(s) ativos`
          : "Nenhum cronograma de higiene cadastrado",
      link: "/higiene",
      icon: Droplets,
    },
    {
      area: "Recall",
      item: "Simulação de recall realizada nos últimos 12 meses",
      status:
        diasDesdeSimulacao === null ? "critico" : diasDesdeSimulacao > 365 ? "critico" : "ok",
      detalhe:
        diasDesdeSimulacao === null
          ? "Nenhuma simulação de recall registrada"
          : diasDesdeSimulacao > 365
            ? `Última simulação em ${parseISO(ultimaSimulacao!).toLocaleDateString("pt-BR")} — há mais de 12 meses`
            : `Última simulação em ${parseISO(ultimaSimulacao!).toLocaleDateString("pt-BR")}`,
      link: "/simulacao-recall",
      icon: AlertTriangle,
    },
  ];
}

export function getChecklistMetrics(items: CheckItem[]): ChecklistMetrics {
  const total = items.length;
  const oks = items.filter((item) => item.status === "ok").length;
  const alertas = items.filter((item) => item.status === "alerta").length;
  const criticos = items.filter((item) => item.status === "critico").length;

  return {
    total,
    oks,
    alertas,
    criticos,
    pct: total > 0 ? Math.round((oks / total) * 100) : 0,
  };
}