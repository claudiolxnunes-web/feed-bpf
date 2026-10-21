import { getBaseLegal } from "@/config/baseLegal";
/**
 * Documentos obrigatórios por POP conforme:
 * - baseLegal: bpf_geral (POPs de BPF para fábricas de alimentos para animais)
 * - baseLegal: autocontrole (autocontrole e rastreabilidade)
 * - IN 15/2009 (validação de limpeza)
 * - baseLegal: substancias_proibidas (substâncias controladas)
 *
 * Estrutura usada tanto no tutorial (checklist visual) quanto pela IA
 * de análise do acervo (contexto do prompt).
 */

export interface DocObrigatorio {
  nome: string;
  descricao: string;
  criticidade: "essencial" | "importante" | "recomendado";
}

export interface PopObrigatorios {
  codigo: string;
  nome: string;
  documentos: DocObrigatorio[];
}

export const DOCS_OBRIGATORIOS_POP: PopObrigatorios[] = [
  {
    codigo: "POP-01",
    nome: "Recebimento e Armazenamento",
    documentos: [
      { nome: "Procedimento escrito de recebimento e estocagem", descricao: "POP redigido, assinado, com data e responsável.", criticidade: "essencial" },
      { nome: "Registro de recebimento por lote", descricao: "Fornecedor, nota fiscal, lote, quantidade, laudo, temperatura.", criticidade: "essencial" },
      { nome: "Qualificação de fornecedores (SIPEAGRO)", descricao: "Cadastro do fornecedor, registro MAPA ou declaração de isento.", criticidade: "essencial" },
      { nome: "Laudos de análise da MP", descricao: "Laudo do fornecedor ou análise interna (micotoxinas, contaminantes).", criticidade: "importante" },
      { nome: "Registro de temperatura no armazenamento", descricao: "Termohigrômetro, planilha diária.", criticidade: "importante" },
      { nome: "Amostras de retenção", descricao: "Registro de coleta e prazo de guarda (mínimo 30 dias após validade).", criticidade: "importante" },
    ],
  },
  {
    codigo: "POP-02",
    nome: "Limpeza de Instalações, Equipamentos e Utensílios",
    documentos: [
      { nome: "POP de higienização por área", descricao: "Um procedimento por área crítica (moagem, mistura, expedição etc.).", criticidade: "essencial" },
      { nome: "Cronograma de limpeza", descricao: "Frequência (diária/semanal/mensal), área, responsável.", criticidade: "essencial" },
      { nome: "Registro de execução da limpeza", descricao: "Checklist assinado por turno/data.", criticidade: "essencial" },
      { nome: "Checklist de veículo (pré-carregamento)", descricao: "Limpeza, integridade, ausência de EEB.", criticidade: "essencial" },
      { nome: "Validação de limpeza (IN 15/2009)", descricao: "Ensaio de carry-over para princípios ativos críticos.", criticidade: "importante" },
      { nome: "Liberação de linha", descricao: "Checklist de 23 itens antes de iniciar produção.", criticidade: "importante" },
    ],
  },
  {
    codigo: "POP-03",
    nome: "Higiene e Saúde Pessoal (Treinamentos)",
    documentos: [
      { nome: "POP de saúde e higiene pessoal", descricao: "Regras de EPI, uniforme, higiene das mãos.", criticidade: "essencial" },
      { nome: "ASO — Atestado de Saúde Ocupacional", descricao: "Um por manipulador, dentro da validade (NR-07).", criticidade: "essencial" },
      { nome: "Registro de treinamento em BPF", descricao: "Lista de presença, conteúdo, avaliação.", criticidade: "essencial" },
      { nome: "Declaração de biossegurança de visitantes", descricao: "Termo assinado por cada visitante que entra na área produtiva.", criticidade: "importante" },
    ],
  },
  {
    codigo: "POP-04",
    nome: "Potabilidade da Água",
    documentos: [
      { nome: "POP de controle da água", descricao: "Fonte, tratamento, pontos de amostragem.", criticidade: "essencial" },
      { nome: "Análise físico-química", descricao: "Semestral no mínimo (cloro, pH, dureza, coliformes).", criticidade: "essencial" },
      { nome: "Análise microbiológica", descricao: "Coliformes totais e termotolerantes.", criticidade: "essencial" },
      { nome: "Registro de limpeza do reservatório", descricao: "Semestral, com foto/documentação.", criticidade: "importante" },
      { nome: "Monitoramento diário de cloro residual", descricao: "Planilha com valores medidos.", criticidade: "importante" },
    ],
  },
  {
    codigo: "POP-05",
    nome: "Controle da Produção",
    documentos: [
      { nome: "POP de produção por linha", descricao: "Sequência de batidas, tempos, dosagens.", criticidade: "essencial" },
      { nome: "Fórmulas versionadas", descricao: "Ficha técnica assinada, controle de versões.", criticidade: "essencial" },
      { nome: "Ordem de produção", descricao: "Lote produzido, MP consumida, responsáveis.", criticidade: "essencial" },
      { nome: "Registro de pesagem", descricao: "Pesos reais x teóricos, tolerância.", criticidade: "importante" },
      { nome: "Segregação de fórmulas críticas", descricao: "Ionóforos, ureia, ractopamina — linhas ou flush obrigatório.", criticidade: "essencial" },
    ],
  },
  {
    codigo: "POP-06",
    nome: "Manutenção e Calibração",
    documentos: [
      { nome: "POP de manutenção preventiva", descricao: "Cronograma por equipamento crítico.", criticidade: "essencial" },
      { nome: "Ordem de serviço (OS) preventiva", descricao: "Data, técnico, peças trocadas.", criticidade: "essencial" },
      { nome: "OS corretiva", descricao: "Causa da falha, ação, tempo de parada.", criticidade: "importante" },
      { nome: "Certificados de calibração", descricao: "Balanças, termômetros, misturadores — dentro da validade.", criticidade: "essencial" },
      { nome: "Registro de aferição interna", descricao: "Entre calibrações oficiais.", criticidade: "recomendado" },
    ],
  },
  {
    codigo: "POP-07",
    nome: "Controle Integrado de Pragas",
    documentos: [
      { nome: "POP de controle de pragas", descricao: "Cronograma, mapa de iscas e armadilhas.", criticidade: "essencial" },
      { nome: "Contrato com empresa dedetizadora (se terceirizado)", descricao: "Cadastro na vigilância sanitária.", criticidade: "essencial" },
      { nome: "Registro de aplicação/monitoramento", descricao: "Data, produto, princípio ativo, área.", criticidade: "essencial" },
      { nome: "FISPQ dos princípios ativos", descricao: "Ficha de segurança de cada raticida/inseticida.", criticidade: "importante" },
      { nome: "Checklist de segurança pós-aplicação", descricao: "Tempo de reentrada, isolamento de área.", criticidade: "importante" },
    ],
  },
  {
    codigo: "POP-08",
    nome: "Resíduos e Efluentes",
    documentos: [
      { nome: "POP de gestão de resíduos (PGRS)", descricao: "Segregação, armazenamento, destinação.", criticidade: "essencial" },
      { nome: "Registro de coleta/destinação", descricao: "MTR (manifesto), empresa transportadora.", criticidade: "essencial" },
      { nome: "Análise de efluentes (CONAMA 430/2011)", descricao: "Parâmetros exigidos pela licença ambiental.", criticidade: "importante" },
      { nome: "Licença ambiental vigente", descricao: "Órgão estadual, dentro da validade.", criticidade: "essencial" },
    ],
  },
  {
    codigo: "POP-09",
    nome: "Rastreabilidade e Recolhimento (Recall)",
    documentos: [
      { nome: "Procedimento de rastreabilidade e recall", descricao: "Fluxo de recolhimento, contatos de emergência e árvore de rastreio.", criticidade: "essencial" },
      { nome: "Simulação anual de recall", descricao: "Exercício prático registrado com tempo de resposta e eficácia.", criticidade: "importante" },
      { nome: "Registro de não conformidades (RNC)", descricao: "Tratamento de desvios, causas e ações corretivas.", criticidade: "essencial" },
      { nome: "Relatório de rastreabilidade (In/Out)", descricao: "Lotes de MP vinculados a Lotes de PA e Clientes.", criticidade: "essencial" },
    ],
  },
  {
    codigo: "POP-10",
    nome: "PAC — Programa de Autocontrole",
    documentos: [
      { nome: "Manual BPF assinado e datado", descricao: "Documento-mestre com todos os POPs referenciados.", criticidade: "essencial" },
      { nome: "Matriz de risco (APPCC/HACCP)", descricao: "PCCs identificados, limites críticos, monitoramento.", criticidade: "essencial" },
      { nome: `Relatório de autocontrole (${getBaseLegal("autocontrole").citacao})`, descricao: "9 seções, geração anual.", criticidade: "essencial" },
      { nome: "Plano de recall documentado", descricao: "Simulação anual registrada.", criticidade: "importante" },
      { nome: "Registro de treinamento da equipe em BPF", descricao: "Anual, com avaliação.", criticidade: "essencial" },
      { nome: "Auditoria interna anual", descricao: `Checklist ${getBaseLegal("autocontrole").citacao} + plano de ação.`, criticidade: "essencial" },
    ],
  },
];

export function contarObrigatoriosEssenciais(): number {
  return DOCS_OBRIGATORIOS_POP.reduce(
    (acc, p) => acc + p.documentos.filter(d => d.criticidade === "essencial").length,
    0
  );
}
