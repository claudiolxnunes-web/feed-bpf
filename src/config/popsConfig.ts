export interface PopAreaConfig {
  area: string;
}

export interface PopPeriodicidade {
  key: string;
  label: string;
  periodos: string[]; // labels dos períodos (dias, semanas, etc.)
  areas: PopAreaConfig[];
  /**
   * Quando preenchido, indica que o lançamento operacional desta planilha
   * é feito em outro módulo (evita duplicidade). A aba do POP exibe apenas
   * um aviso com link para o módulo correspondente.
   */
  modulo_origem?: { rota: string; label: string };
}

export interface PopConfig {
  codigo: string;
  nome: string;
  descricao: string;
  periodicidades: PopPeriodicidade[];
  anexos?: string[];
  /**
   * Módulos onde os registros operacionais deste POP são efetivamente lançados.
   * Exibido na aba do POP como referência de "lançamento único".
   */
  modulos_vinculados?: { rota: string; label: string; descricao: string }[];
  /**
   * Planilhas em branco para impressão (registro manual em campo).
   * Cada item referencia uma função exportada de utils/excelTemplates.
   */
  planilhas_impressao?: { label: string; descricao: string; arquivo: string }[];
}

function diasDoMes(): string[] {
  return Array.from({ length: 31 }, (_, i) => String(i + 1));
}

function semanas(): string[] {
  return ["1ª", "2ª", "3ª", "4ª", "5ª"];
}

function quinzenas(): string[] {
  return ["1ª Quinzena", "2ª Quinzena"];
}

function meses(): string[] {
  return ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
}

export const POPS_CONFIG: PopConfig[] = [
  {
    codigo: "POP-01",
    nome: "Qualificação de Fornecedores",
    descricao: "Procedimentos para qualificação de fornecedores, especificação e controle de matérias-primas e embalagens conforme IN 04/2007.",
    modulos_vinculados: [
      { rota: "/fornecedores", label: "Fornecedores", descricao: "Cadastro e qualificação (PL POP 1.1)" },
      { rota: "/recebimento", label: "Recebimento MP", descricao: "Lançamento único de recebimento de MP, lotes, laudos e umidade (PL POP 1.2 / 1.3 / 1.5)" },
    ],
    periodicidades: [
      {
        key: "controle_entrada_embalagens",
        label: "PL POP 1.4 — Entrada de Embalagens",
        periodos: diasDoMes(),
        areas: [
          { area: "Data" },
          { area: "Tipo de embalagem" },
          { area: "Fornecedor" },
          { area: "Nota Fiscal" },
          { area: "Quantidade" },
          { area: "Inspeção visual" },
          { area: "C/NC" },
          { area: "Responsável" },
        ],
      },
      {
        key: "recebimento_embalagens",
        label: "PL POP 1.6 — Recebimento de Embalagens",
        periodos: ["Ocorrência"],
        areas: [
          { area: "Fornecedor (Nome)" },
          { area: "Data" },
          { area: "Nota Fiscal / Quantidade" },
          { area: "Lote" },
          { area: "Placa do Veículo" },
          { area: "Condições Higiênicas (C/NC)" },
          { area: "Condições Físicas (C/NC)" },
          { area: "Forração (C/NC)" },
          { area: "Ausência de Odores / Prod. Químicos (C/NC)" },
          { area: "Tipos de Embalagens — Capacidade" },
          { area: "Tipos de Embalagens — Tipo" },
          { area: "Tipos de Embalagens — Quantidade" },
          { area: "Nº Amostras Coletadas" },
          { area: "Empilhamento (C/NC)" },
          { area: "Higiene (C/NC)" },
          { area: "Impressão (C/NC)" },
          { area: "Tamanho (C/NC)" },
          { area: "Integridade (C/NC)" },
          { area: "Não Conformidade" },
          { area: "Ação Corretiva" },
          { area: "Medida Preventiva" },
          { area: "Aprovado / Reprovado / Aprovado c/ Restrição (RNC)" },
        ],
      },
      {
        key: "lotes_internos",
        label: "PL POP 1.7 — Controle de Lotes Internos MP/Embalagens",
        periodos: ["Anual"],
        areas: [
          { area: "Milho em Grãos (Lotes 1–110)" },
          { area: "Soja (Lotes 1–110)" },
          { area: "Quirera (Lotes 1–110)" },
          { area: "Sal (Lotes 1–110)" },
          { area: "Embalagens (Lotes 1–110)" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Lista de Fornecedores – PL POP 1.1 (módulo /fornecedores)",
      "ANEXO 2: Recebimento de MP – PL POP 1.2 (módulo /recebimento)",
      "ANEXO 3: Controle de entrada de MP – PL POP 1.3 (módulo /recebimento)",
      "ANEXO 4: Controle de entrada de embalagens – PL POP 1.4",
      "ANEXO 5: Medição da umidade dos silos – PL POP 1.5 (módulo /recebimento)",
      "ANEXO 6: Recebimento de Embalagens – PL POP 1.6",
      "ANEXO 7: Controle dos lotes internos – PL POP 1.7",
      "ANEXO 8: Controle de expurgo – PL POP 1.8 (módulo /pragas)",
    ],
  },
  {
    codigo: "POP-02",
    nome: "Limpeza de Instalações, Equipamentos e Utensílios",
    descricao: "Procedimentos de limpeza e higienização de todas as instalações, áreas, equipamentos e utensílios da fábrica conforme IN 04/2007 e IN 15/2009 (Nota: A higiene humana reside no POP 03).",
    modulos_vinculados: [
      { rota: "/higiene", label: "Higiene / Sanitização", descricao: "Cronogramas e checklists de limpeza pesada/concorrente" },
    ],
    periodicidades: [
      {
        key: "diario",
        label: "PL POP 2.1 — Registro de Limpeza Diária",
        periodos: diasDoMes(),
        areas: [
          { area: "Escritório e anexos" },
          { area: "Vestiário / Banheiros (produção)" },
          { area: "Área de produção (piso)" },
          { area: "Área de recepção de grãos (piso)" },
        ],
      },
      {
        key: "semanal",
        label: "PL POP 2.2 — Registro de Limpeza Semanal",
        periodos: semanas(),
        areas: [
          { area: "Área de Pesagem e Misturas (Equipamentos)" },
          { area: "Área de Pesagem e Mistura (Utensílios: Conchas, Bombonas, Balanças)" },
          { area: "Área de Ensaque (Silos e balanças — farelada)" },
          { area: "Área de Ensaque (Paletes)" },
          { area: "Área Externa (Pátio)" },
        ],
      },
      {
        key: "mensal",
        label: "PL POP 2.3 — Registro de Limpeza Mensal",
        periodos: meses(),
        areas: [
          { area: "Área de Recepção de Grãos" },
          { area: "Área de Pesagem e Misturas (MP)" },
          { area: "Área de Estocagem de Insumos" },
          { area: "Área de Embalagens" },
          { area: "Área de Expedição" },
        ],
      },
      {
        key: "veiculos",
        label: "PL POP 2.4 — Registro de Limpeza Veículos (Quinzenal)",
        periodos: quinzenas(),
        areas: [
          { area: "Caminhão Entrega" },
          { area: "Limpeza Empilhadeira" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Registro de Limpeza Diária – PL POP 2.1",
      "ANEXO 2: Registro de Limpeza Semanal – PL POP 2.2",
      "ANEXO 3: Registro de Limpeza Mensal – PL POP 2.3",
      "ANEXO 4: Registro de Limpeza Veículos Quinzenal – PL POP 2.4",
    ],
  },
  {
    codigo: "POP-03",
    nome: "Higiene e Saúde Pessoal (Treinamentos)",
    descricao: "Procedimentos de higiene pessoal, saúde dos colaboradores, uso de EPIs e comportamento nas áreas de produção conforme IN 04/2007.",
    modulos_vinculados: [
      { rota: "/saude-pessoal", label: "Saúde Pessoal", descricao: "Lançamento único de ASO, exames, EPIs e treinamentos de higiene" },
      { rota: "/visitantes", label: "Controle de Visitantes", descricao: "Orientação de biosseguridade e EPI de visitantes" },
    ],
    periodicidades: [
      {
        key: "inspecao_higiene_mensal",
        label: "PL POP 3.1 — Higiene, Saúde e Treinamento do Pessoal",
        periodos: meses(),
        areas: [
          { area: "Uniformes limpos e completos" },
          { area: "Uso correto de EPIs (touca, bota, máscara)" },
          { area: "Unhas curtas e sem esmalte" },
          { area: "Cabelos contidos / barba aparada" },
          { area: "Ausência de adornos (relógios, anéis, brincos)" },
          { area: "Lavagem de mãos antes do trabalho" },
          { area: "ASO em dia (validade)" },
          { area: "Ausência de ferimentos expostos" },
          { area: "Comportamento adequado nas áreas (sem comer/fumar)" },
          { area: "Treinamento de higiene em dia" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Registro de Higiene e Saúde do Pessoal – PL POP 3.1",
      "ANEXO 2: ASO, exames e EPIs (módulo /saude-pessoal)",
    ],
  },
  {
    codigo: "POP-04",
    nome: "Potabilidade da Água",
    descricao: "Procedimentos de controle da potabilidade da água e higienização dos reservatórios conforme IN 04/2007 e Portaria de Potabilidade.",
    modulos_vinculados: [
      { rota: "/potabilidade-agua", label: "Potabilidade da Água", descricao: "Lançamento único de cloro, pH, turbidez, laudos e higienização de reservatórios" },
    ],
    periodicidades: [
      {
        key: "cloro_diario",
        label: "PL POP 4.1a — Cloro Residual Livre / pH (Diário — poço/captação própria)",
        periodos: diasDoMes(),
        areas: [
          { area: "Ponto 1 — Reservatório (mg/L)" },
          { area: "Ponto 2 — Torneira Produção (mg/L)" },
          { area: "Ponto 3 — Torneira Vestiário (mg/L)" },
          { area: "pH" },
          { area: "Turbidez (UT)" },
          { area: "Responsável" },
        ],
      },
      {
        key: "cloro_semanal",
        label: "PL POP 4.1b — Cloro Residual Livre / pH (Semanal — água da concessionária)",
        periodos: semanas(),
        areas: [
          { area: "Ponto 1 — Reservatório (mg/L)" },
          { area: "Ponto 2 — Torneira Produção (mg/L)" },
          { area: "Ponto 3 — Torneira Vestiário (mg/L)" },
          { area: "pH" },
          { area: "Turbidez (UT)" },
          { area: "Responsável" },
        ],
      },
      {
        key: "higienizacao_reservatorio",
        label: "PL POP 4.2 — Higienização de Reservatório (Semestral)",
        periodos: ["1º Semestre", "2º Semestre"],
        areas: [
          { area: "Data da limpeza" },
          { area: "Esvaziamento total" },
          { area: "Remoção de sedimentos" },
          { area: "Desinfecção com hipoclorito" },
          { area: "Enxágue final" },
          { area: "Empresa executora" },
          { area: "Responsável técnico" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Controle de Cloro Residual e pH – PL POP 4.1",
      "ANEXO 2: Higienização do Reservatório – PL POP 4.2",
      "ANEXO 3: Laudo de Potabilidade (módulo /potabilidade-agua)",
    ],
  },
  {
    codigo: "POP-05",
    nome: "Controle da Produção e Prevenção da Contaminação Cruzada",
    descricao: "Procedimentos para prevenção da contaminação cruzada no fluxo produtivo, sequenciamento, flushing, armazenamento e identificação de matérias-primas conforme IN 04/2007.",
    modulos_vinculados: [
      { rota: "/pcp", label: "PCP / Sequenciamento", descricao: "Ordens de produção, fórmula versionada, batidas e flushing (Ficha Digital)" },
    ],
    periodicidades: [
      {
        key: "semanal",
        label: "PL POP 5.1 — Checklist de Prevenção da Contaminação Cruzada",
        periodos: semanas(),
        areas: [
          { area: "Sequência de produção conforme matriz" },
          { area: "Limpeza entre lotes / flushing realizado" },
          { area: "Separação de ingredientes (com/sem medicamento)" },
          { area: "Identificação correta de MPs (granel)" },
          { area: "Identificação correta de MPs (ensacadas)" },
          { area: "Armazenamento segregado" },
          { area: "Fluxo de pessoal adequado" },
          { area: "Ventilação / exaustão" },
          { area: "Embalagens íntegras e fechadas" },
          { area: "Produto acabado identificado corretamente" },
        ],
      },
      {
        key: "mensal_monitoramento",
        label: "PL POP 5.2 — Monitoramento de Limpeza do Sistema",
        periodos: meses(),
        areas: [
          { area: "Swab de superfície — equipamentos" },
          { area: "Teste água de enxágue — misturador" },
          { area: "Inspeção visual pós-limpeza — produção" },
          { area: "Registro de produtos químicos utilizados" },
          { area: "Verificação de concentração de soluções" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Checklist de Prevenção da Contaminação Cruzada – PL POP 5.1",
      "ANEXO 2: Monitoramento de Limpeza do Sistema – PL POP 5.2",
    ],
  },
  {
    codigo: "POP-06",
    nome: "Manutenção e Calibração de Equipamentos e Instrumentos",
    descricao: "Procedimentos de manutenção preventiva e calibração dos equipamentos e instrumentos de medição conforme IN 04/2007 e IN 15/2009.",
    modulos_vinculados: [
      { rota: "/manutencao", label: "Manutenção / Calibração", descricao: "Lançamento único de OS, manutenção preventiva, corretiva e calibração de instrumentos" },
    ],
    periodicidades: [
      {
        key: "lista_equipamentos",
        label: "PL POP 6.4 — Lista de Equipamentos e Instrumentos (Cadastro)",
        periodos: ["Registro"],
        areas: [
          { area: "Nº" },
          { area: "Equipamento (Descrição)" },
          { area: "Nº Controle" },
          { area: "Identificação" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Cronograma de Manutenção Preventiva – PL POP 6.1 (módulo /manutencao)",
      "ANEXO 2: Calibração de Instrumentos – PL POP 6.2 (módulo /manutencao)",
      "ANEXO 3: Ordem de Serviço de Manutenção – PL POP 6.3 (módulo /manutencao)",
      "ANEXO 4: Lista de Equipamentos e Instrumentos – PL POP 6.4",
    ],
  },
  {
    codigo: "POP-07",
    nome: "Controle Integrado de Pragas",
    descricao: "Procedimentos de manejo integrado de pragas (medidas preventivas, corretivas e de eliminação) conforme IN 04/2007.",
    modulos_vinculados: [
      { rota: "/pragas", label: "Controle de Pragas", descricao: "Lançamento único de monitoramento, aplicações, mapa de iscas e laudos" },
    ],
    periodicidades: [
      {
        key: "inspecao_iscas_mensal",
        label: "PL POP 7.4 — Inspeção Mensal de Iscas e Armadilhas (por Ponto)",
        periodos: meses(),
        areas: [
          { area: "Ponto 01 — Status (Íntegra/Consumida/Avariada)" },
          { area: "Ponto 02 — Status" },
          { area: "Ponto 03 — Status" },
          { area: "Ponto 04 — Status" },
          { area: "Ponto 05 — Status" },
          { area: "Ponto 06 — Status" },
          { area: "Ponto 07 — Status" },
          { area: "Ponto 08 — Status" },
          { area: "Ponto 09 — Status" },
          { area: "Ponto 10 — Status" },
          { area: "Substituições realizadas" },
          { area: "Responsável" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Planilha de Monitoramento Semanal de Pragas – PL POP 7.1 (módulo /pragas)",
      "ANEXO 2: Registro de Aplicações Mensais – PL POP 7.2 (módulo /pragas)",
      "ANEXO 3: Mapa de Iscas (módulo /pragas)",
      "ANEXO 4: Observação Diária de Pragas – PL POP 7.3 (formulário físico afixado em produção, recebimento, depósito MP, expedição e silos; também disponível no Modo Tablet)",
    ],
  },
  {
    codigo: "POP-08",
    nome: "Controle de Resíduos e Efluentes",
    descricao: "Procedimentos de coleta, segregação, transporte e destinação de resíduos sólidos e efluentes conforme Decreto 12.031/2024.",
    modulos_vinculados: [
      { rota: "/residuos", label: "Resíduos / Efluentes", descricao: "Lançamento único de coleta, classificação, manifesto e destino" },
    ],
    periodicidades: [
      {
        key: "geracao_residuos_mensal",
        label: "PL POP 8.2 — Geração Mensal de Resíduos (kg) por Classe",
        periodos: meses(),
        areas: [
          { area: "Classe I — Perigosos (kg)" },
          { area: "Classe IIA — Não Inertes (kg)" },
          { area: "Classe IIB — Inertes (kg)" },
          { area: "Recicláveis — Papel/Papelão (kg)" },
          { area: "Recicláveis — Plástico (kg)" },
          { area: "Recicláveis — Metal (kg)" },
          { area: "Orgânicos (kg)" },
          { area: "Efluentes Líquidos (m³)" },
          { area: "Destino / Transportador" },
          { area: "Manifesto / MTR Nº" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Controle de Resíduos – PL POP 8.1 (módulo /residuos)",
    ],
  },
  {
    codigo: "POP-09",
    nome: "Programa de Rastreabilidade e Recolhimento (Recall)",
    descricao: "Procedimentos de rastreabilidade de produtos, controle de não conformidades e programa de recolhimento (recall) conforme IN 04/2007.",
    modulos_vinculados: [
      { rota: "/pcp", label: "PCP / Sequenciamento", descricao: "Ordem de produção e fórmula com lotes de MP (PL POP 9.1 / 9.3 — Ficha Digital)" },
      { rota: "/rastreabilidade", label: "Rastreabilidade", descricao: "Expedição por cliente/produto e árvore de rastreio (PL POP 9.2)" },
      { rota: "/simulacao-recall", label: "Simulação de Recall", descricao: "Recall de produtos (PL POP 9.4)" },
      { rota: "/nao-conformidades", label: "Não Conformidades", descricao: "Controle de RNC (PL POP 9.5)" },
    ],
    periodicidades: [
      {
        key: "reclamacoes_clientes",
        label: "PL POP 9.6 — Registro de Reclamações de Clientes/Produtos",
        periodos: ["Ocorrência"],
        areas: [
          { area: "Data" },
          { area: "Cliente" },
          { area: "Itens / Produtos" },
          { area: "Nº do Lote e NF" },
          { area: "Prazo de Validade" },
          { area: "Motivo da Reclamação" },
          { area: "Responsável" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Ordem diária de Produção – PL POP 9.1 (módulo /pcp)",
      "ANEXO 2: Expedição por cliente e produto – PL POP 9.2 (módulo /rastreabilidade ou modelo manual 'PL POP 9.2 — Expedição Lista Simples' na Biblioteca de Modelos)",
      "ANEXO 3: Fórmula e Inclusão de MP – PL POP 9.3 (módulo /pcp)",
      "ANEXO 4: Produtos Recolhidos (Recall) – PL POP 9.4 (módulo /simulacao-recall)",
      "ANEXO 5: Controle de RNC – PL POP 9.5 (módulo /nao-conformidades)",
      "ANEXO 6: Registro de Reclamações de Clientes – PL POP 9.6",
    ],
    planilhas_impressao: [
      {
        label: "PL POP 9.2 — Expedição (Lista Simples)",
        descricao: "Modelo manual em branco — data, NF, cliente, produto, lote e quantidade. Imprimir e arquivar 2 anos.",
        arquivo: "Form_Expedicao_Simples",
      },
      {
        label: "PL POP 9.2 — Expedição Completa por NF",
        descricao: "Modelo detalhado por nota fiscal — cliente, transporte, motorista, lotes e assinaturas.",
        arquivo: "Form_Expedicao_Completa",
      },
    ],
  },
  {
    codigo: "POP-10",
    nome: "PAC — Programa de Autocontrole",
    descricao: "Programa de Autocontrole que integra todos os POPs e estabelece os procedimentos de verificação, auditoria interna e melhoria contínua do sistema de BPF.",
    periodicidades: [
      {
        key: "checklist_autocontrole",
        label: "PL POP 10.1 — Checklist de Autocontrole (Verificação Geral)",
        periodos: meses(),
        areas: [
          { area: "POP 01 — Qualificação de Fornecedores" },
          { area: "POP 02 — Limpeza de Instalações" },
          { area: "POP 03 — Higiene e Saúde Pessoal" },
          { area: "POP 04 — Potabilidade da Água" },
          { area: "POP 05 — Prevenção Contaminação Cruzada" },
          { area: "POP 06 — Manutenção e Calibração" },
          { area: "POP 07 — Controle de Pragas" },
          { area: "POP 08 — Controle de Resíduos" },
          { area: "POP 09 — Rastreabilidade e Recall" },
          { area: "Manual BPF atualizado" },
          { area: "Treinamentos em dia" },
          { area: "Registros completos e assinados" },
        ],
      },
      {
        key: "auditoria_interna",
        label: "PL POP 10.2 — Auditoria Interna",
        periodos: ["Ocorrência"],
        areas: [
          { area: "Data da Auditoria" },
          { area: "Auditor Interno" },
          { area: "Escopo (POPs auditados)" },
          { area: "Não Conformidades Encontradas" },
          { area: "Ações Corretivas Definidas" },
          { area: "Prazo para Correção" },
          { area: "Responsável" },
          { area: "Status (Aberta/Fechada)" },
          { area: "Verificação de Eficácia" },
          { area: "Observações" },
        ],
      },
      {
        key: "indicadores_desempenho",
        label: "PL POP 10.3 — Indicadores de Desempenho do PAC",
        periodos: meses(),
        areas: [
          { area: "% Conformidade de POPs" },
          { area: "Nº de Não Conformidades abertas" },
          { area: "Nº de Não Conformidades fechadas" },
          { area: "Nº de Reclamações de Clientes" },
          { area: "Treinamentos realizados vs. programados" },
          { area: "Manutenções realizadas vs. programadas" },
          { area: "Calibrações em dia" },
          { area: "Resultado de auditorias internas" },
        ],
      },
    ],
    anexos: [
      "ANEXO 1: Checklist de Autocontrole – PL POP 10.1",
      "ANEXO 2: Auditoria Interna – PL POP 10.2",
      "ANEXO 3: Indicadores de Desempenho – PL POP 10.3",
    ],
    planilhas_impressao: [
      {
        label: "PL POP 10 — PAC (Programa de Autocontrole)",
        descricao: "Modelos em branco de checklist de autocontrole, auditoria interna e indicadores para registro manual.",
        arquivo: "PL_POP_10",
      },
    ],
  },
];

