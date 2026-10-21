import * as XLSX from "xlsx";
import { DESVIOS_CBAA_2017 } from "@/config/desviosAnaliticos";

// Helper to create a styled worksheet with proper column widths and formatting
function createSheet(
  data: (string | number | boolean | null)[][],
  colWidths: number[],
  merges: XLSX.Range[] = [],
): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(data);
  ws["!cols"] = colWidths.map((w) => ({ wch: w }));
  if (merges.length > 0) {
    ws["!merges"] = merges;
  }
  // Set print area
  ws["!printarea"] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: data.length - 1, c: colWidths.length - 1 } });

  // Set basic page setup for better printing
  ws["!margins"] = { left: 0.5, right: 0.5, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 };

  return ws;
}

function downloadWorkbook(wb: XLSX.WorkBook, filename: string) {
  XLSX.writeFile(wb, `${filename}.xlsx`, { bookType: "xlsx" });
}

// ─── POP 1: Fornecedores ───
export function gerarPL_POP_1() {
  const wb = XLSX.utils.book_new();

  // 1.1 Qualificação de Fornecedores
  const qual = [
    ["", "PLANILHA 1.1 — QUALIFICAÇÃO DE FORNECEDORES"],
    ["", "Empresa:", "________________________", "", "Responsável:", "________________________"],
    [""],
    [
      "Nº",
      "Fornecedor",
      "CNPJ",
      "Registro MAPA/SIPEAGRO",
      "Produtos Fornecidos",
      "Ficha Técnica",
      "Cert. Análise",
      "Alvará",
      "Registro Produto",
      "Nota Avaliação (0-10)",
      "Status",
      "Próx. Avaliação",
      "Observações",
    ],
    ...Array.from({ length: 20 }, (_, i) => [i + 1, "", "", "", "", "☐", "☐", "☐", "☐", "", "", "", ""]),
    [""],
    ["", "Critérios: ≥8 Aprovado | 6-7 Aprovado com restrição | <6 Reprovado"],
    ["", "Assinatura RT:", "________________________", "CRMV:", "____________", "Data:", "__/__/__"],
  ];
  const ws1 = createSheet(
    qual,
    [5, 25, 18, 22, 25, 12, 12, 10, 14, 14, 12, 14, 20],
    [{ s: { r: 0, c: 1 }, e: { r: 0, c: 12 } }],
  );
  XLSX.utils.book_append_sheet(wb, ws1, "1.1 Qualificação");

  // 1.2 Recebimento de MP
  const receb = [
    ["", "PLANILHA 1.2 — RECEBIMENTO DE MATÉRIA-PRIMA"],
    ["", "Empresa:", "________________________", "", "Mês/Ano:", "____/____"],
    [""],
    [
      "Data",
      "Fornecedor",
      "Matéria-Prima",
      "Lote",
      "Quantidade",
      "Unid.",
      "Validade",
      "Odor",
      "Insetos",
      "Umidade (%)",
      "Temp. (°C)",
      "Cert. Análise",
      "Aprovado",
      "Responsável",
      "Obs.",
    ],
    ...Array.from({ length: 30 }, () => [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "☐N ☐A",
      "☐Aus ☐Pres",
      "",
      "",
      "☐",
      "☐S ☐N",
      "",
      "",
    ]),
    [""],
    [
      "",
      "Assinatura Executor:",
      "________________________",
      "Assinatura Supervisor:",
      "________________________",
      "Data:",
      "__/__/__",
    ],
  ];
  const ws2 = createSheet(
    receb,
    [10, 20, 20, 12, 10, 6, 10, 10, 12, 10, 10, 12, 10, 15, 15],
    [{ s: { r: 0, c: 1 }, e: { r: 0, c: 14 } }],
  );
  XLSX.utils.book_append_sheet(wb, ws2, "1.2 Recebimento MP");

  // 1.3 Recebimento de Embalagens
  const emb = [
    ["", "PLANILHA 1.3 — RECEBIMENTO DE EMBALAGENS"],
    ["", "Empresa:", "________________________", "", "Mês/Ano:", "____/____"],
    [""],
    [
      "Data",
      "Fornecedor",
      "Tipo Embalagem",
      "Lote",
      "Quantidade",
      "Integridade",
      "Limpeza",
      "Aprovado",
      "Responsável",
      "Obs.",
    ],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "☐C ☐NC", "☐C ☐NC", "☐S ☐N", "", ""]),
  ];
  const ws3 = createSheet(emb, [10, 20, 18, 12, 10, 12, 12, 10, 15, 20], [{ s: { r: 0, c: 1 }, e: { r: 0, c: 9 } }]);
  XLSX.utils.book_append_sheet(wb, ws3, "1.3 Embalagens");

  downloadWorkbook(wb, "PL_POP_1_Fornecedores");
}

// ─── POP 2: Limpeza ───
export function gerarPL_POP_2() {
  const wb = XLSX.utils.book_new();

  // 2.1 Limpeza Diária
  const diaria = [
    ["PLANILHA 2.1 — REGISTRO DE LIMPEZA DIÁRIA"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    [
      "Data",
      "Área/Equipamento",
      "Tipo Limpeza",
      "Produto Utilizado",
      "Concentração",
      "Hora Início",
      "Hora Fim",
      "Conforme",
      "Executor",
      "Verificado por",
      "Obs.",
    ],
    ...Array.from({ length: 31 }, () => ["", "", "☐Seca ☐Úmida", "", "", "", "", "☐C ☐NC", "", "", ""]),
    [""],
    ["Assinatura RT:", "", "CRMV:", "", "Data:", ""],
  ];
  const ws1 = createSheet(diaria, [10, 22, 16, 18, 12, 10, 10, 10, 15, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, "2.1 Limpeza Diária");

  // 2.2 Limpeza Semanal
  const semanal = [
    ["PLANILHA 2.2 — REGISTRO DE LIMPEZA SEMANAL"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Semana", "Área", "Equipamento", "Procedimento", "Produto", "Concentração", "Conforme", "Executor", "Obs."],
    ...Array.from({ length: 8 }, (_, i) => [`Sem ${i + 1}`, "", "", "", "", "", "☐C ☐NC", "", ""]),
  ];
  const ws2 = createSheet(semanal, [10, 20, 20, 25, 18, 12, 10, 15, 20]);
  XLSX.utils.book_append_sheet(wb, ws2, "2.2 Limpeza Semanal");

  // 2.3 Limpeza Mensal
  const mensal = [
    ["PLANILHA 2.3 — REGISTRO DE LIMPEZA MENSAL / PROGRAMADA"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    ["Mês", "Área/Equipamento", "Procedimento", "Produto", "Conforme", "Executor", "Data Execução", "Obs."],
    ...["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m) => [
      m,
      "",
      "",
      "",
      "☐C ☐NC",
      "",
      "",
      "",
    ]),
  ];
  const ws3 = createSheet(mensal, [8, 22, 25, 18, 10, 15, 14, 20]);
  XLSX.utils.book_append_sheet(wb, ws3, "2.3 Limpeza Mensal");

  // 2.4 Limpeza de Veículos
  const veiculos = [
    ["PLANILHA 2.4 — LIMPEZA DE VEÍCULOS DE TRANSPORTE"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Placa", "Tipo Veículo", "Carga Anterior", "Limpo", "Odor", "Pragas", "Aprovado", "Responsável", "Obs."],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "☐S ☐N", "☐N ☐A", "☐Aus ☐Pres", "☐S ☐N", "", ""]),
  ];
  const ws4 = createSheet(veiculos, [10, 12, 15, 20, 10, 10, 12, 10, 15, 20]);
  XLSX.utils.book_append_sheet(wb, ws4, "2.4 Veículos");

  downloadWorkbook(wb, "PL_POP_2_Limpeza");
}

// ─── POP 3: Higiene Pessoal ───
export function gerarPL_POP_3() {
  const wb = XLSX.utils.book_new();

  const higiene = [
    ["PLANILHA 3.1 — HIGIENE E SAÚDE PESSOAL (TREINAMENTOS)"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    [
      "Data",
      "Colaborador",
      "Uniforme Limpo",
      "Sem Adornos",
      "Unhas Cortadas",
      "Barba Feita",
      "Mãos Lavadas",
      "EPI Completo",
      "Sem Sintomas",
      "Conforme",
      "Verificado por",
      "Obs.",
    ],
    ...Array.from({ length: 25 }, () => ["", "", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐C ☐NC", "", ""]),
    [""],
    ["CONTROLE DE ASOs"],
    ["Colaborador", "Cargo", "Admissão", "Último ASO", "Tipo Exame", "Apto", "Próximo ASO", "Obs."],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "", "☐S ☐N", "", ""]),
    [""],
    ["CONTROLE DE VISITANTES"],
    [
      "Data",
      "Nome Visitante",
      "Empresa",
      "Documento",
      "Motivo",
      "EPI Fornecido",
      "Orientação Bio",
      "Entrada",
      "Saída",
      "Acompanhante",
    ],
    ...Array.from({ length: 10 }, () => ["", "", "", "", "", "☐", "☐", "", "", ""]),
    [""],
    ["Assinatura RT:", "", "CRMV:", "", "Data:", ""],
  ];
  const ws = createSheet(higiene, [10, 18, 12, 12, 12, 10, 12, 12, 12, 10, 14, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "3.1 Higiene Pessoal");

  downloadWorkbook(wb, "PL_POP_3_Higiene_Saude_Pessoal");
}

// ─── POP 4: Água ───
export function gerarPL_POP_4() {
  const wb = XLSX.utils.book_new();

  const cloro = [
    ["PLANILHA 4.1 — CONTROLE DIÁRIO DE CLORO RESIDUAL E pH"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    ["Data", "Ponto de Coleta", "Hora", "Cloro Residual (mg/L)", "pH", "Conforme", "Ação Corretiva", "Responsável"],
    ...Array.from({ length: 31 }, () => ["", "", "", "", "", "☐C ☐NC", "", ""]),
    [""],
    ["Referência: Cloro residual livre 0,2 a 2,0 mg/L | pH 6,0 a 9,5 (Portaria GM/MS 888/2021)"],
    ["Assinatura RT:", "", "CRMV:", "", "Data:", ""],
  ];
  const ws1 = createSheet(cloro, [10, 20, 8, 18, 8, 10, 20, 15]);
  XLSX.utils.book_append_sheet(wb, ws1, "4.1 Cloro pH");

  const reservatorio = [
    ["PLANILHA 4.2 — HIGIENIZAÇÃO DE RESERVATÓRIO DE ÁGUA"],
    ["Empresa:", "", "", "Data:", ""],
    [""],
    ["Nº", "Item de Verificação", "Conforme", "Observação"],
    [1, "Reservatório esvaziado completamente", "☐C ☐NC", ""],
    [2, "Paredes e fundo escovados", "☐C ☐NC", ""],
    [3, "Resíduos removidos", "☐C ☐NC", ""],
    [4, "Enxágue realizado", "☐C ☐NC", ""],
    [5, "Solução clorada aplicada (200 ppm)", "☐C ☐NC", ""],
    [6, "Tempo de contato respeitado (30 min)", "☐C ☐NC", ""],
    [7, "Enxágue final realizado", "☐C ☐NC", ""],
    [8, "Tampa/cobertura em boas condições", "☐C ☐NC", ""],
    [9, "Vedação sem rachaduras", "☐C ☐NC", ""],
    [10, "Tela de proteção anti-insetos", "☐C ☐NC", ""],
    [11, "Ausência de infiltrações", "☐C ☐NC", ""],
    [12, "Identificação do reservatório", "☐C ☐NC", ""],
    [13, "Registro fotográfico antes", "☐C ☐NC", ""],
    [14, "Registro fotográfico depois", "☐C ☐NC", ""],
    [15, "Cloro residual pós-higienização medido", "☐C ☐NC", ""],
    [16, "Reservatório reabastecido", "☐C ☐NC", ""],
    [""],
    ["Executor:", "", "Supervisor:", ""],
    ["Assinatura RT:", "", "CRMV:", ""],
  ];
  const ws2 = createSheet(reservatorio, [5, 40, 10, 25]);
  XLSX.utils.book_append_sheet(wb, ws2, "4.2 Reservatório");

  const laudos = [
    ["PLANILHA 4.3 — LAUDOS LABORATORIAIS DE ÁGUA"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    ["Data Coleta", "Ponto", "Laboratório", "Nº Laudo", "Parâmetro", "Resultado", "Limite", "Conforme", "Obs."],
    ...Array.from({ length: 12 }, () => ["", "", "", "", "", "", "", "☐C ☐NC", ""]),
    [""],
    ["Frequência mínima: semestral (microbiológica) e anual (completa)"],
  ];
  const ws3 = createSheet(laudos, [12, 15, 20, 12, 18, 12, 12, 10, 20]);
  XLSX.utils.book_append_sheet(wb, ws3, "4.3 Laudos");

  downloadWorkbook(wb, "PL_POP_4_Agua");
}

// ─── POP 5: Contaminação Cruzada ───
export function gerarPL_POP_5() {
  const wb = XLSX.utils.book_new();

  const cc = [
    ["PLANILHA 5.1 — PREVENÇÃO DE CONTAMINAÇÃO CRUZADA"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    [
      "Data",
      "Produto Anterior",
      "Produto Seguinte",
      "Flushing Realizado",
      "Kg Flushing",
      "Destino Flushing",
      "Limpeza Conforme",
      "Teste Carry-Over",
      "Resultado",
      "Responsável",
      "Obs.",
    ],
    ...Array.from({ length: 20 }, () => ["", "", "", "☐S ☐N", "", "", "☐C ☐NC", "☐S ☐N/A", "", "", ""]),
    [""],
    ["Referência: IN nº 15/2009 — Contaminação Cruzada por Medicamentos"],
  ];
  const ws1 = createSheet(cc, [10, 18, 18, 14, 10, 15, 14, 14, 12, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, "5.1 Contaminação Cruzada");

  const monitor = [
    ["PLANILHA 5.2 — MONITORAMENTO DE LIMPEZA DE LINHA"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    [
      "Data",
      "Linha/Equipamento",
      "Tipo Limpeza",
      "Tempo (min)",
      "Inspeção Visual",
      "Swab Realizado",
      "Resultado",
      "Aprovado",
      "Executor",
      "Obs.",
    ],
    ...Array.from({ length: 15 }, () => ["", "", "☐Seca ☐Úmida", "", "☐C ☐NC", "☐S ☐N", "", "☐S ☐N", "", ""]),
  ];
  const ws2 = createSheet(monitor, [10, 20, 16, 10, 14, 14, 12, 10, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws2, "5.2 Monitoramento Limpeza");

  downloadWorkbook(wb, "PL_POP_5_Contaminacao_Cruzada");
}

// ─── POP 6: Manutenção/Calibração ───
export function gerarPL_POP_6() {
  const wb = XLSX.utils.book_new();

  const crono = [
    ["PLANILHA 6.1 — CRONOGRAMA DE MANUTENÇÃO PREVENTIVA"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    [
      "Equipamento",
      "Código",
      "Frequência",
      "Jan",
      "Fev",
      "Mar",
      "Abr",
      "Mai",
      "Jun",
      "Jul",
      "Ago",
      "Set",
      "Out",
      "Nov",
      "Dez",
      "Responsável",
    ],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]),
    [""],
    ["Legenda: P = Programada | R = Realizada | A = Adiada"],
  ];
  const ws1 = createSheet(crono, [20, 10, 12, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 5, 15]);
  XLSX.utils.book_append_sheet(wb, ws1, "6.1 Cronograma Manutenção");

  const calib = [
    ["PLANILHA 6.2 — REGISTRO DE CALIBRAÇÃO DE EQUIPAMENTOS"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    [
      "Equipamento",
      "Código",
      "Tipo",
      "Localização",
      "Data Calibração",
      "Próxima Calibração",
      "Nº Certificado",
      "Empresa Calibradora",
      "Resultado",
      "Conforme",
      "Responsável",
    ],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "", "", "", "", "", "☐C ☐NC", ""]),
  ];
  const ws2 = createSheet(calib, [18, 10, 12, 15, 14, 16, 14, 18, 12, 10, 15]);
  XLSX.utils.book_append_sheet(wb, ws2, "6.2 Calibração");

  const os = [
    ["PLANILHA 6.3 — ORDENS DE SERVIÇO DE MANUTENÇÃO"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    [
      "Nº OS",
      "Data Abertura",
      "Equipamento",
      "Tipo",
      "Descrição",
      "Peças Trocadas",
      "Custo (R$)",
      "Data Conclusão",
      "Status",
      "Responsável",
    ],
    ...Array.from({ length: 20 }, () => ["", "", "", "☐Prev ☐Corr", "", "", "", "", "", ""]),
  ];
  const ws3 = createSheet(os, [8, 14, 18, 14, 25, 18, 12, 14, 12, 15]);
  XLSX.utils.book_append_sheet(wb, ws3, "6.3 Ordens Serviço");

  const equipamentos = [
    ["PLANILHA 6.4 — LISTA DE EQUIPAMENTOS"],
    ["Empresa:", "", "", "Data:", ""],
    [""],
    [
      "Nº",
      "Equipamento",
      "Código/Tag",
      "Fabricante",
      "Modelo",
      "Nº Série",
      "Localização",
      "Data Aquisição",
      "Status",
      "Obs.",
    ],
    ...Array.from({ length: 25 }, (_, i) => [i + 1, "", "", "", "", "", "", "", "", ""]),
  ];
  const ws4 = createSheet(equipamentos, [5, 22, 12, 15, 15, 15, 15, 14, 10, 18]);
  XLSX.utils.book_append_sheet(wb, ws4, "6.4 Equipamentos");

  downloadWorkbook(wb, "PL_POP_6_Manutencao_Calibracao");
}

// ─── POP 7: Pragas ───
export function gerarPL_POP_7() {
  const wb = XLSX.utils.book_new();

  const semanal = [
    ["PLANILHA 7.1 — MONITORAMENTO SEMANAL DE PRAGAS"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    [
      "Data",
      "Local/Área",
      "Tipo Dispositivo",
      "Nº Dispositivo",
      "Praga Encontrada",
      "Quantidade",
      "Ação Tomada",
      "Responsável",
      "Obs.",
    ],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "", "", "", ""]),
    [""],
    ["Legenda: R = Roedor | I = Inseto Rasteiro | V = Inseto Voador | A = Ave"],
  ];
  const ws1 = createSheet(semanal, [10, 18, 16, 14, 16, 10, 20, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, "7.1 Monitoramento Semanal");

  const mensal = [
    ["PLANILHA 7.2 — CONTROLE MENSAL DE PRAGAS"],
    ["Empresa:", "", "", "Ano:", ""],
    [""],
    [
      "Mês",
      "Empresa Controladora",
      "Técnico",
      "Produtos Utilizados",
      "Registro ANVISA",
      "Áreas Tratadas",
      "Pragas Alvo",
      "Próxima Aplicação",
      "Obs.",
    ],
    ...["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"].map((m) => [
      m,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
  ];
  const ws2 = createSheet(mensal, [8, 20, 15, 20, 14, 18, 15, 16, 18]);
  XLSX.utils.book_append_sheet(wb, ws2, "7.2 Controle Mensal");

  // 7.3 — Observação Diária de Pragas (formulário físico para chão de fábrica)
  // Para fixar nas áreas (produção, recebimento, depósito MP, expedição, silos)
  const observacao = [
    ["PLANILHA 7.3 — OBSERVAÇÃO DIÁRIA DE PRAGAS (chão de fábrica)"],
    ["Empresa:", "", "", "Mês/Ano:", "", "Área/Setor:", ""],
    [""],
    [
      "Instruções: Marcar 'X' na coluna correspondente sempre que houver evidência (visual, fezes, ninhos, dejetos, vestígios). Comunicar imediatamente o RT.",
    ],
    [""],
    [
      "Data",
      "Hora",
      "Roedores",
      "Aves/Pássaros",
      "Insetos Voadores",
      "Insetos Rasteiros",
      "Outros",
      "Local exato/observação",
      "Ação imediata",
      "Responsável (nome + assinatura)",
    ],
    ...Array.from({ length: 31 }, (_, i) => [i + 1, "", "☐", "☐", "☐", "☐", "☐", "", "", ""]),
    [""],
    ["Legenda: ☐ = sem evidência | X = presença detectada"],
    ["Tipos de evidência: visual / fezes / pegadas / ninhos / penas / asas / restos / dejetos / odor"],
    [""],
    [
      "Encaminhamento: registros de presença detectada DEVEM gerar registro no módulo POP-07 (Pragas) e Não Conformidade quando aplicável.",
    ],
    [""],
    ["Verificado por (RT):", "", "CRMV:", "", "Data:", ""],
  ];
  const ws3 = createSheet(observacao, [6, 8, 11, 14, 16, 16, 10, 28, 22, 24]);
  XLSX.utils.book_append_sheet(wb, ws3, "7.3 Observação Diária");

  downloadWorkbook(wb, "PL_POP_7_Pragas");
}

// ─── POP 8: Resíduos ───
export function gerarPL_POP_8() {
  const wb = XLSX.utils.book_new();

  const residuos = [
    ["PLANILHA 8.1 — CONTROLE DE RESÍDUOS E EFLUENTES"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    [
      "Data",
      "Tipo Resíduo",
      "Classificação",
      "Origem",
      "Quantidade",
      "Unid.",
      "Destino Final",
      "Empresa Coletora",
      "Nº Manifesto",
      "Licença Ambiental",
      "Responsável",
      "Obs.",
    ],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "", "", "", "", "", "", ""]),
    [""],
    ["Classificação: I (Perigoso) | IIA (Não Inerte) | IIB (Inerte)"],
    ["Assinatura RT:", "", "CRMV:", "", "Data:", ""],
  ];
  const ws = createSheet(residuos, [10, 18, 14, 15, 10, 6, 18, 18, 14, 14, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "8.1 Resíduos");

  downloadWorkbook(wb, "PL_POP_8_Residuos");
}

// ─── POP 9: Rastreabilidade ───
export function gerarPL_POP_9() {
  const wb = XLSX.utils.book_new();

  const rastreio = [
    ["PLANILHA 9.1 — RASTREABILIDADE DE LOTES"],
    ["Empresa:", "", "", "Mês/Ano:", ""],
    [""],
    [
      "Produto",
      "Lote Produto",
      "Data Fabricação",
      "Matéria-Prima",
      "Lote MP",
      "Fornecedor",
      "Cliente Destino",
      "NF Venda",
      "Data Venda",
      "Quantidade",
      "Espécie Destino",
      "Obs.",
    ],
    ...Array.from({ length: 25 }, () => ["", "", "", "", "", "", "", "", "", "", "", ""]),
  ];
  const ws1 = createSheet(rastreio, [18, 14, 14, 18, 12, 18, 18, 12, 12, 10, 14, 18]);
  XLSX.utils.book_append_sheet(wb, ws1, "9.1 Rastreabilidade");

  const recall = [
    ["PLANILHA 9.2 — REGISTRO DE RECALL / RECOLHIMENTO"],
    ["Empresa:", "", "", "Data:", ""],
    [""],
    [
      "Nº Recall",
      "Data Início",
      "Motivo",
      "Produto",
      "Lotes Afetados",
      "Qtd. Distribuída",
      "Clientes Notificados",
      "Qtd. Recolhida",
      "Destino",
      "Status",
      "Data Encerramento",
      "Responsável",
    ],
    ...Array.from({ length: 5 }, () => ["", "", "", "", "", "", "", "", "", "", "", ""]),
    [""],
    ["Referência: Decreto 12.031/2024 — Procedimento de Recolhimento"],
  ];
  const ws2 = createSheet(recall, [10, 14, 22, 18, 18, 14, 18, 14, 15, 12, 16, 15]);
  XLSX.utils.book_append_sheet(wb, ws2, "9.2 Recall");

  downloadWorkbook(wb, "PL_POP_9_Rastreabilidade");
}

// ─── POP 10: PAC (Programa de Autocontrole) ───
export function gerarPL_POP_10() {
  const wb = XLSX.utils.book_new();

  // 10.1 Checklist de Autocontrole
  const checklist = [
    ["", "PLANILHA 10.1 — CHECKLIST DE AUTOCONTROLE (PAC)"],
    ["", "Empresa:", "________________________", "", "Mês/Ano:", "____/____"],
    [""],
    ["Nº", "ITEM DE VERIFICAÇÃO / POP", "S", "N", "N/A", "OBSERVAÇÃO / AÇÃO CORRETIVA"],
    ["1", "POP 01 — Qualificação de Fornecedores e Matérias-Primas", "☐", "☐", "☐", ""],
    ["2", "POP 02 — Higiene e Sanitização de Instalações/Equipamentos", "☐", "☐", "☐", ""],
    ["3", "POP 03 — Higiene e Saúde Pessoal / Treinamentos", "☐", "☐", "☐", ""],
    ["4", "POP 04 — Potabilidade da Água", "☐", "☐", "☐", ""],
    ["5", "POP 05 — Controle da Produção / Contaminação Cruzada", "☐", "☐", "☐", ""],
    ["6", "POP 06 — Manutenção e Calibração", "☐", "☐", "☐", ""],
    ["7", "POP 07 — Controle Integrado de Pragas", "☐", "☐", "☐", ""],
    ["8", "POP 08 — Controle de Resíduos e Efluentes", "☐", "☐", "☐", ""],
    ["9", "POP 09 — Rastreabilidade e Recolhimento (Recall)", "☐", "☐", "☐", ""],
    ["10", "Manual de BPF atualizado e disponível", "☐", "☐", "☐", ""],
    ["11", "Registros de todos os POPs completos e assinados", "☐", "☐", "☐", ""],
    ["12", "Não Conformidades anteriores foram tratadas?", "☐", "☐", "☐", ""],
    [""],
    ["Parecer do RT:", ""],
    [""],
    ["Assinatura RT:", "________________________", "Data:", "__/__/__"],
  ];
  const ws1 = createSheet(checklist, [5, 50, 4, 4, 4, 30], [{ s: { r: 0, c: 1 }, e: { r: 0, c: 5 } }]);
  XLSX.utils.book_append_sheet(wb, ws1, "10.1 Checklist PAC");

  // 10.2 Auditoria Interna
  const auditoria = [
    ["", "PLANILHA 10.2 — REGISTRO DE AUDITORIA INTERNA"],
    ["", "Data:", "__/__/__", "Auditor:", "________________________"],
    [""],
    ["SETOR / POP AUDITADO", "NÃO CONFORMIDADE (DESCRIÇÃO)", "GRAV.", "AÇÃO CORRETIVA", "PRAZO", "RESP.", "STATUS"],
    ...Array.from({ length: 15 }, () => ["", "", "☐L ☐M ☐G", "", "", "", "☐A ☐F"]),
    [""],
    ["Gravidade: L (Leve) | M (Moderada) | G (Grave)"],
    ["Status: A (Aberta) | F (Fechada)"],
  ];
  const ws2 = createSheet(auditoria, [25, 30, 10, 25, 12, 15, 10], [{ s: { r: 0, c: 1 }, e: { r: 0, c: 6 } }]);
  XLSX.utils.book_append_sheet(wb, ws2, "10.2 Auditoria Interna");

  // 10.3 Indicadores
  const indicadores = [
    ["", "PLANILHA 10.3 — INDICADORES DE DESEMPENHO DO PAC"],
    ["", "Ano:", "______"],
    [""],
    ["INDICADOR", "UNID.", "JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"],
    ["% Conformidade POPs", "%", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["Nº Não Conformidades", "un.", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["Nº Reclamações SAC", "un.", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["% Treinamentos Realiz.", "%", "", "", "", "", "", "", "", "", "", "", "", ""],
    ["Aproveitamento Produção", "%", "", "", "", "", "", "", "", "", "", "", "", ""],
    [""],
    ["Meta Estabelecida:", ""],
    ["Obs:", ""],
  ];
  const ws3 = createSheet(
    indicadores,
    [25, 8, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    [{ s: { r: 0, c: 1 }, e: { r: 0, c: 13 } }],
  );
  XLSX.utils.book_append_sheet(wb, ws3, "10.3 Indicadores PAC");

  downloadWorkbook(wb, "PL_POP_10_PAC");
}

// ─── Formulários individuais ───
export function gerarFormRecebimentoMP() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["FORMULÁRIO — RECEBIMENTO DE MATÉRIA-PRIMA"],
    ["Empresa:", "", "", "Data:", ""],
    [""],
    [
      "Nº",
      "Data",
      "Fornecedor",
      "Matéria-Prima",
      "Lote",
      "Quantidade",
      "Unid.",
      "Validade",
      "Odor",
      "Insetos",
      "Umidade (%)",
      "Temperatura (°C)",
      "Cert. Análise Nº",
      "Aprovado",
      "Contraprova Retida",
      "Local Contraprova",
      "Responsável",
      "Obs.",
    ],
    ...Array.from({ length: 30 }, (_, i) => [
      i + 1,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "☐N ☐A",
      "☐Aus ☐Pres",
      "",
      "",
      "",
      "☐S ☐N",
      "☐S ☐N",
      "",
      "",
      "",
    ]),
  ];
  const ws = createSheet(data, [5, 10, 18, 18, 10, 10, 6, 10, 10, 12, 10, 12, 14, 10, 14, 14, 15, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Recebimento MP");
  downloadWorkbook(wb, "Form_Recebimento_MP");
}

export function gerarFormOrdemProducao() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["ORDEM DE PRODUÇÃO"],
    ["Empresa:", "", "Nº Ordem:", "", "Data:", ""],
    ["Produto:", "", "Fórmula:", "", "Lote:", ""],
    ["Quantidade Programada:", "", "Unidade:", "", "Nº Batidas:", ""],
    [""],
    ["FÓRMULA / COMPOSIÇÃO"],
    ["Nº", "Matéria-Prima", "Lote MP", "Fornecedor", "% Inclusão", "Quantidade (kg)", "Conferido"],
    ...Array.from({ length: 15 }, (_, i) => [i + 1, "", "", "", "", "", "☐"]),
    ["", "", "", "", "TOTAL:", "", ""],
    [""],
    ["REGISTRO DE BATIDAS"],
    ["Batida Nº", "Hora Início", "Hora Fim", "Tempo Mistura (min)", "Temperatura (°C)", "Operador", "Status", "Obs."],
    ...Array.from({ length: 10 }, (_, i) => [i + 1, "", "", "", "", "", "", ""]),
    [""],
    ["Assinatura Operador:", "", "Assinatura Supervisor:", "", "Assinatura RT:", ""],
  ];
  const ws = createSheet(data, [8, 18, 12, 15, 12, 14, 10]);
  XLSX.utils.book_append_sheet(wb, ws, "Ordem Produção");
  downloadWorkbook(wb, "Form_Ordem_Producao");
}

export function gerarFormValidacaoLimpeza() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["VALIDAÇÃO DE LIMPEZA DE LINHA / FLUSHING"],
    ["Empresa:", "", "Data:", "", "Linha:", ""],
    [""],
    [
      "Nº",
      "Produto Anterior",
      "Medicamento/Aditivo",
      "Produto Seguinte",
      "Sensível?",
      "Flushing Kg",
      "Destino Flushing",
      "Inspeção Visual",
      "Swab/Teste",
      "Resultado",
      "Aprovado",
      "Responsável",
    ],
    ...Array.from({ length: 15 }, (_, i) => [i + 1, "", "", "", "☐S ☐N", "", "", "☐C ☐NC", "☐S ☐N/A", "", "☐S ☐N", ""]),
    [""],
    ["Referência: IN nº 15/2009 — Prevenção de Contaminação Cruzada por Medicamentos"],
  ];
  const ws = createSheet(data, [5, 18, 18, 18, 10, 12, 15, 14, 12, 12, 10, 15]);
  XLSX.utils.book_append_sheet(wb, ws, "Validação Limpeza");
  downloadWorkbook(wb, "Form_Validacao_Limpeza");
}

export function gerarFormMatrizSensibilidade() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["MATRIZ DE SENSIBILIDADE — SEQUENCIAMENTO DE PRODUÇÃO"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    [
      "Produto Anterior ↓ / Produto Seguinte →",
      "Prod A",
      "Prod B",
      "Prod C",
      "Prod D",
      "Prod E",
      "Prod F",
      "Prod G",
      "Prod H",
    ],
    ...["Prod A", "Prod B", "Prod C", "Prod D", "Prod E", "Prod F", "Prod G", "Prod H"].map((p) => [
      p,
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ]),
    [""],
    ["Legenda: 0 = Sem restrição | 1 = Requer flushing | 2 = Requer limpeza completa | X = Proibido sequenciar"],
    ["Referência: IN nº 15/2009"],
  ];
  const ws = createSheet(data, [35, 10, 10, 10, 10, 10, 10, 10, 10]);
  XLSX.utils.book_append_sheet(wb, ws, "Matriz Sensibilidade");
  downloadWorkbook(wb, "Form_Matriz_Sensibilidade");
}

export function gerarFormSubstancias() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DE SUBSTÂNCIAS INDESEJÁVEIS E PROIBIDAS"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    [
      "Data Análise",
      "Matéria-Prima",
      "Lote",
      "Fornecedor",
      "Substância",
      "Tipo",
      "Método Análise",
      "Resultado",
      "Unidade",
      "Limite Máximo",
      "Conforme",
      "Ref. Normativa",
      "Obs.",
    ],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "☐Proib ☐Indesej", "", "", "", "", "☐C ☐NC", "", ""]),
  ];
  const ws = createSheet(data, [12, 18, 10, 18, 18, 16, 15, 10, 8, 12, 10, 14, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Substâncias");
  downloadWorkbook(wb, "Form_Substancias");
}

export function gerarFormAnalisesLab() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["REGISTRO DE ANÁLISES LABORATORIAIS"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    [
      "Data Análise",
      "Produto",
      "Lote",
      "Tipo Análise",
      "Parâmetro",
      "Método",
      "Resultado",
      "Unidade",
      "Limite Ref.",
      "Conforme",
      "Laboratório",
      "Nº Laudo",
      "Data Resultado",
      "Obs.",
    ],
    ...Array.from({ length: 20 }, () => [
      "",
      "",
      "",
      "☐FQ ☐Micro ☐Bromatol",
      "",
      "",
      "",
      "",
      "",
      "☐C ☐NC",
      "",
      "",
      "",
      "",
    ]),
  ];
  const ws = createSheet(data, [12, 18, 10, 20, 15, 12, 10, 8, 10, 10, 18, 12, 12, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Análises Lab");
  downloadWorkbook(wb, "Form_Analises_Lab");
}

export function gerarFormReclamacoes() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["REGISTRO DE RECLAMAÇÕES DE QUALIDADE / SAC"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    [
      "Nº Reclamação",
      "Data",
      "Cliente",
      "Contato",
      "Produto",
      "Lote",
      "NF",
      "Tipo",
      "Descrição Problema",
      "Causa Raiz",
      "Ação Imediata",
      "Ação Corretiva",
      "Responsável",
      "Prazo",
      "Status",
    ],
    ...Array.from({ length: 15 }, () => ["", "", "", "", "", "", "", "", "", "", "", "", "", "", ""]),
  ];
  const ws = createSheet(data, [14, 10, 18, 15, 18, 10, 10, 15, 25, 20, 20, 20, 15, 12, 10]);
  XLSX.utils.book_append_sheet(wb, ws, "Reclamações SAC");
  downloadWorkbook(wb, "Form_Reclamacoes");
}

export function gerarFormSaudeManipuladores() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DE SAÚDE DE MANIPULADORES"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    ["Nº", "Colaborador", "Cargo", "Data Admissão", "Último ASO", "Tipo Exame", "Apto", "Próximo ASO", "Observações"],
    ...Array.from({ length: 25 }, (_, i) => [i + 1, "", "", "", "", "", "☐S ☐N", "", ""]),
    [""],
    ["MONITORAMENTO DIÁRIO DE SAÚDE"],
    ["Data", "Colaborador", "Sem Sintomas", "Uniforme OK", "Sem Ferimentos", "Adornos", "Conforme", "Verificador"],
    ...Array.from({ length: 20 }, () => ["", "", "☐", "☐", "☐", "☐Sem", "☐C ☐NC", ""]),
  ];
  const ws = createSheet(data, [5, 22, 15, 14, 14, 14, 10, 14, 20]);
  XLSX.utils.book_append_sheet(wb, ws, "Saúde Manipuladores");
  downloadWorkbook(wb, "Form_Saude_Manipuladores");
}

export function gerarFormVisitantes() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DE VISITANTES"],
    ["Empresa:", "", "Mês/Ano:", ""],
    [""],
    [
      "Data",
      "Nome Visitante",
      "Documento",
      "Empresa",
      "Motivo",
      "Áreas Visitadas",
      "EPI Fornecido",
      "Orientação Biosseguridade",
      "Hora Entrada",
      "Hora Saída",
      "Acompanhante",
      "Obs.",
    ],
    ...Array.from({ length: 20 }, () => ["", "", "", "", "", "", "☐S ☐N", "☐S ☐N", "", "", "", ""]),
    [""],
    ["Assinatura RT:", "", "Data:", ""],
  ];
  const ws = createSheet(data, [10, 22, 14, 18, 18, 18, 14, 20, 12, 12, 18, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Visitantes");
  downloadWorkbook(wb, "Form_Visitantes");
}

export function gerarFormCloroDiario() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DIÁRIO DE CLORO RESIDUAL E pH"],
    ["Empresa:", "", "Mês/Ano:", ""],
    [""],
    [
      "Dia",
      "Ponto 1 - Cloro",
      "Ponto 1 - pH",
      "Ponto 2 - Cloro",
      "Ponto 2 - pH",
      "Ponto 3 - Cloro",
      "Ponto 3 - pH",
      "Conforme",
      "Ação Corretiva",
      "Responsável",
    ],
    ...Array.from({ length: 31 }, (_, i) => [i + 1, "", "", "", "", "", "", "☐C ☐NC", "", ""]),
    [""],
    ["Padrão: Cloro 0,2–2,0 mg/L | pH 6,0–9,5 | Portaria GM/MS 888/2021"],
  ];
  const ws = createSheet(data, [5, 14, 12, 14, 12, 14, 12, 10, 20, 15]);
  XLSX.utils.book_append_sheet(wb, ws, "Cloro Diário");
  downloadWorkbook(wb, "Form_Cloro_Diario");
}

export function gerarFormHigienizacaoReservatorio() {
  return gerarPL_POP_4(); // Reuses POP 4 which already includes the reservoir checklist
}

export function gerarFormControleASO() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["CONTROLE DE ATESTADOS DE SAÚDE OCUPACIONAL (ASO)"],
    ["Empresa:", "", "Ano:", ""],
    [""],
    [
      "Nº",
      "Colaborador",
      "Cargo/Setor",
      "Data Admissão",
      "Tipo Exame",
      "Data ASO",
      "Médico",
      "CRM",
      "Resultado",
      "Restrições",
      "Próximo ASO",
      "Status",
    ],
    ...Array.from({ length: 30 }, (_, i) => [i + 1, "", "", "", "", "", "", "", "☐Apto ☐Inapto", "", "", ""]),
    [""],
    ["Tipos: Admissional | Periódico | Retorno | Mudança Função | Demissional"],
  ];
  const ws = createSheet(data, [5, 22, 15, 14, 14, 12, 18, 10, 14, 15, 14, 10]);
  XLSX.utils.book_append_sheet(wb, ws, "Controle ASO");
  downloadWorkbook(wb, "Form_Controle_ASO");
}

export function gerarFormMonitoramentoSaude() {
  const wb = XLSX.utils.book_new();
  const data = [
    ["MONITORAMENTO DIÁRIO DE SAÚDE DOS MANIPULADORES"],
    ["Empresa:", "", "Mês/Ano:", ""],
    [""],
    [
      "Data",
      "Colaborador",
      "Sem Febre",
      "Sem Diarreia",
      "Sem Vômito",
      "Sem Lesões",
      "Sem Secreções",
      "Uniforme Limpo",
      "Sem Adornos",
      "Unhas Cortadas",
      "Barba Feita",
      "EPI OK",
      "Conforme",
      "Verificador",
      "Obs.",
    ],
    ...Array.from({ length: 25 }, () => ["", "", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐", "☐C ☐NC", "", ""]),
  ];
  const ws = createSheet(data, [10, 20, 8, 10, 10, 10, 10, 12, 10, 10, 10, 8, 10, 14, 15]);
  XLSX.utils.book_append_sheet(wb, ws, "Monitoramento Saúde");
  downloadWorkbook(wb, "Form_Monitoramento_Saude");
}

// ─── Checklist Registro de Fábrica de Rações (MAPA) ───
export function gerarChecklistRegistroFabrica() {
  const wb = XLSX.utils.book_new();

  const sections: { titulo: string; itens: string[] }[] = [
    {
      titulo: "1. DOCUMENTAÇÃO LEGAL DA EMPRESA",
      itens: [
        "CNPJ ativo",
        "Contrato social atualizado",
        "Inscrição estadual",
        "Alvará de funcionamento",
        "Licença ambiental (quando aplicável)",
        "Memorial descritivo da atividade",
      ],
    },
    {
      titulo: "2. RESPONSÁVEL TÉCNICO (RT)",
      itens: [
        "RT habilitado (médico veterinário, zootecnista ou engenheiro agrônomo)",
        "Registro no conselho (CRMV/CREA)",
        "ART ativa",
        "Contrato com a empresa",
      ],
    },
    {
      titulo: "3. INSTALAÇÕES",
      itens: [
        "Layout da fábrica (fluxo unidirecional)",
        "Área separada para recebimento de matérias-primas",
        "Área separada para armazenamento",
        "Área separada para produção",
        "Área separada para expedição",
        "Piso impermeável e lavável",
        "Ventilação adequada",
        "Iluminação suficiente",
        "Controle de acesso",
      ],
    },
    {
      titulo: "4. CONTROLE DE PRAGAS",
      itens: [
        "Programa de controle de pragas documentado",
        "Empresa terceirizada ou controle próprio",
        "Registros de aplicação",
        "Mapa de iscas",
      ],
    },
    {
      titulo: "5. MATÉRIAS-PRIMAS",
      itens: [
        "Cadastro de fornecedores",
        "Controle de recebimento",
        "Inspeção na chegada",
        "Armazenamento adequado",
        "Identificação por lote",
      ],
    },
    {
      titulo: "6. PROCESSO PRODUTIVO",
      itens: [
        "Fluxograma de produção",
        "Procedimentos operacionais (POPs)",
        "Controle de pesagem",
        "Sequenciamento de produção",
        "Controle de contaminação cruzada",
      ],
    },
    {
      titulo: "7. CONTROLE DE QUALIDADE",
      itens: [
        "Plano de amostragem",
        "Análises laboratoriais (interno ou terceirizado)",
        "Controle de produto acabado",
        "Registros de resultados",
      ],
    },
    {
      titulo: "8. RASTREABILIDADE",
      itens: [
        "Identificação de lotes",
        "Registro de produção por lote",
        "Controle de destino (clientes)",
        "Sistema de recall definido",
      ],
    },
    {
      titulo: "9. PRODUTO E ROTULAGEM",
      itens: [
        "Registro ou dispensa de registro do produto",
        "Rótulos conforme MAPA",
        "Garantias nutricionais",
        "Espécie/destinação",
        "Modo de uso",
        "Responsável técnico no rótulo",
      ],
    },
    {
      titulo: "10. HIGIENE E SANITIZAÇÃO",
      itens: ["Programa de limpeza", "POP de higienização", "Registros de limpeza", "Controle de água (potabilidade)"],
    },
    {
      titulo: "11. TREINAMENTO DE FUNCIONÁRIOS",
      itens: ["Treinamento em BPF", "Registros de capacitação", "Procedimentos operacionais conhecidos pela equipe"],
    },
    {
      titulo: "12. MANUAL DE BPF (OBRIGATÓRIO)",
      itens: ["Manual documentado", "POPs incluídos", "Controle de versões", "Assinado pelo RT"],
    },
    {
      titulo: "13. REGISTROS OBRIGATÓRIOS",
      itens: [
        "Produção por lote",
        "Controle de matéria-prima",
        "Não conformidades",
        "Ações corretivas",
        "Reclamações de clientes",
      ],
    },
    {
      titulo: "14. REGISTRO NO MAPA (SIPEAGRO)",
      itens: [
        "Cadastro no sistema",
        "Solicitação de registro do estabelecimento",
        "Anexos enviados",
        "Acompanhamento do processo",
      ],
    },
  ];

  const data: (string | null)[][] = [
    ["CHECKLIST — REGISTRO DE FÁBRICA DE RAÇÕES (MAPA)"],
    ["Empresa:", "", "", "Data:", ""],
    ["Responsável pela verificação:", "", "", "CRMV/CREA:", ""],
    [""],
    ["Nº", "ÁREA / ITEM", "CONFORME", "NÃO CONFORME", "N/A", "OBSERVAÇÕES"],
  ];

  let num = 1;
  for (const section of sections) {
    data.push([section.titulo, "", "", "", "", ""]);
    for (const item of section.itens) {
      data.push([String(num), item, "☐", "☐", "☐", ""]);
      num++;
    }
    data.push(["", "", "", "", "", ""]);
  }

  data.push(["RESULTADO GERAL"]);
  data.push(["Total de itens conformes:", "", "", "Total não conformes:", "", ""]);
  data.push(["Percentual de conformidade:", "", "", "", "", ""]);
  data.push([""]);
  data.push(["Parecer:", ""]);
  data.push([""]);
  data.push(["Assinatura do Responsável Técnico:", "", "", "Data:", ""]);
  data.push(["Nome:", "", "", "CRMV/CREA:", ""]);

  const ws = createSheet(data, [6, 50, 12, 14, 8, 30]);
  XLSX.utils.book_append_sheet(wb, ws, "Checklist Registro");
  downloadWorkbook(wb, "Checklist_Registro_Fabrica_Racoes_MAPA");
}

// Map arquivo key → generator function
export const TEMPLATE_GENERATORS: Record<string, () => void> = {
  PL_POP_1: gerarPL_POP_1,
  PL_POP_2: gerarPL_POP_2,
  PL_POP_3: gerarPL_POP_3,
  PL_POP_4: gerarPL_POP_4,
  PL_POP_5: gerarPL_POP_5,
  PL_POP_6: gerarPL_POP_6,
  PL_POP_7: gerarPL_POP_7,
  PL_POP_8: gerarPL_POP_8,
  PL_POP_9: gerarPL_POP_9,
  PL_POP_10: gerarPL_POP_10,
  Form_Recebimento_MP: gerarFormRecebimentoMP,

  Form_Ordem_Producao: gerarFormOrdemProducao,
  Form_Validacao_Limpeza: gerarFormValidacaoLimpeza,
  Form_Matriz_Sensibilidade: gerarFormMatrizSensibilidade,
  Form_Substancias: gerarFormSubstancias,
  Form_Analises_Lab: gerarFormAnalisesLab,
  Form_Reclamacoes: gerarFormReclamacoes,
  Form_Saude_Manipuladores: gerarFormSaudeManipuladores,
  Form_Visitantes: gerarFormVisitantes,
  Form_Cloro_Diario: gerarFormCloroDiario,
  Form_Higienizacao_Reservatorio: gerarFormHigienizacaoReservatorio,
  Form_Controle_ASO: gerarFormControleASO,
  Form_Monitoramento_Saude: gerarFormMonitoramentoSaude,
  Checklist_Registro_Fabrica: gerarChecklistRegistroFabrica,
  Ficha_Tecnica_Produto: gerarFichaTecnicaProduto,
  Modelo_Rotulo: gerarModeloRotulo,
  Form_Expedicao_Simples: gerarFormExpedicaoSimples,
  Form_Expedicao_Completa: gerarFormExpedicaoCompleta,
  Tabela_Desvios_Analiticos_CBAA: gerarTabelaDesviosAnaliticos,
};

// ─── Tabela de Desvios Analíticos CBAA 2017 ───
export function gerarTabelaDesviosAnaliticos() {
  const wb = XLSX.utils.book_new();

  const cabecalho: (string | number)[][] = [
    ["TABELA DE DESVIOS ANALÍTICOS — CBAA 2017"],
    ["Fonte: Compêndio Brasileiro de Alimentação Animal (Sindirações) — DESVIOS ANALÍTICOS E INCERTEZA NAS MEDIÇÕES"],
    [
      "Estudos interlaboratoriais MAPA + privados (1987-2007). Vitaminas A e E: Diretiva CE 45/2000 (15% repetibilidade).",
    ],
    ["Aplicar a tolerância ANTES de classificar um resultado como NÃO CONFORME do rótulo."],
    [""],
    ["COMO USAR:"],
    ["1) Localize o parâmetro analisado e a unidade do laudo."],
    ["2) Verifique se o resultado obtido (X) está dentro do intervalo de validação."],
    ["3) Calcule o CV(%) — fixo ou pela fórmula a/X + b."],
    ["4) Tolerância absoluta = (CV/100) × X. Faixa aceitável = X ± Tolerância."],
    ["5) Se o valor declarado no rótulo cair dentro da faixa, NÃO há não conformidade analítica."],
    [""],
    [
      "Parâmetro",
      "Aliases (sinônimos)",
      "Unidade",
      "Intervalo Mín",
      "Intervalo Máx",
      "Tipo Fórmula",
      "CV fixo (%)",
      "Coef. a",
      "Coef. b",
      "Fórmula CV(%)",
      "Observação",
    ],
  ];

  const linhas = DESVIOS_CBAA_2017.map((d) => {
    const isFixo = d.formula.tipo === "fixo";
    const cvFixo = isFixo ? (d.formula as { cv_pct: number }).cv_pct : "";
    const a = !isFixo ? (d.formula as { a: number; b: number }).a : "";
    const b = !isFixo ? (d.formula as { a: number; b: number }).b : "";
    const formulaStr = isFixo ? `CV = ${cvFixo}% (constante)` : `CV = ${a}/X + (${b})`;
    return [
      d.nome,
      d.aliases.join(", "),
      d.unidade,
      d.intervalo[0],
      d.intervalo[1],
      d.formula.tipo,
      cvFixo,
      a,
      b,
      formulaStr,
      d.obs || "",
    ];
  });

  const exemplo = [
    [""],
    ["EXEMPLO PRÁTICO:"],
    ["Proteína Bruta declarada no rótulo: 200 g/kg (mín). Resultado laboratorial: 188 g/kg."],
    ["Fórmula: CV(%) = 209/188 + 1 = 2,11%. Tolerância = 2,11% × 188 = 3,97 g/kg."],
    ["Faixa aceitável: 184,03 — 191,97 g/kg. Como 188 está acima de 184, ESTÁ DENTRO da tolerância."],
    [""],
    ["Assinatura RT:", "", "", "CRMV:", "", "Data:", ""],
  ];

  const dados = [...cabecalho, ...linhas, ...exemplo];
  const ws = createSheet(dados, [32, 36, 12, 12, 12, 12, 10, 10, 10, 28, 30]);
  XLSX.utils.book_append_sheet(wb, ws, "Desvios CBAA 2017");
  downloadWorkbook(wb, "Tabela_Desvios_Analiticos_CBAA_2017");
}

// ─── Ficha Técnica de Produto ───
export function gerarFichaTecnicaProduto() {
  const wb = XLSX.utils.book_new();
  const data: (string | number | null)[][] = [
    ["FICHA TÉCNICA DE PRODUTO — NUTRIÇÃO ANIMAL"],
    ["Empresa:", "", "", "CNPJ:", ""],
    ["Responsável Técnico:", "", "", "CRMV:", ""],
    ["Data de Emissão:", "", "", "Revisão:", "01"],
    [""],
    ["1. IDENTIFICAÇÃO DO PRODUTO"],
    ["Nome Comercial:", ""],
    ["Marca:", ""],
    ["Classificação:", "(Ração / Suplemento / Sal Mineral / Premix / Núcleo)"],
    ["Registro MAPA:", ""],
    ["Espécie Alvo:", ""],
    ["Categoria Animal:", "(Ex: Bovinos de corte - Engorda)"],
    ["Forma Física:", "(Farelada / Peletizada / Extrusada / Líquida)"],
    [""],
    ["2. COMPOSIÇÃO BÁSICA"],
    ["Ingrediente", "Percentual (%)", "Função"],
    ...Array.from({ length: 12 }, () => ["", "", ""]),
    [""],
    ["3. NÍVEIS DE GARANTIA (por kg do produto)"],
    ["Parâmetro", "Valor", "Unidade", "Mín/Máx"],
    ["Umidade", "", "%", "Máx"],
    ["Proteína Bruta", "", "%", "Mín"],
    ["Extrato Etéreo", "", "%", "Mín"],
    ["Fibra Bruta", "", "%", "Máx"],
    ["Matéria Mineral (Cinzas)", "", "%", "Máx"],
    ["Cálcio (Ca)", "", "g/kg", "Mín-Máx"],
    ["Fósforo (P)", "", "g/kg", "Mín"],
    ["Sódio (Na)", "", "mg/kg", "Mín"],
    [""],
    ["Aditivos (por kg):", ""],
    ["Aditivo", "Valor", "Unidade"],
    ...Array.from({ length: 6 }, () => ["", "", ""]),
    [""],
    ["4. APRESENTAÇÃO E EMBALAGEM"],
    ["Peso Líquido:", "", "Unidade:", ""],
    ["Tipo de Embalagem:", ""],
    [""],
    ["5. ARMAZENAMENTO"],
    ["Condições:", ""],
    ["Validade:", "", "meses a partir da fabricação"],
    [""],
    ["6. MODO DE USO / INDICAÇÕES"],
    ["Espécie / Categoria", "Quantidade Diária", "Modo de Fornecimento"],
    ...Array.from({ length: 4 }, () => ["", "", ""]),
    [""],
    ["7. PRECAUÇÕES"],
    [""],
    [""],
    ["8. INFORMAÇÕES REGULATÓRIAS"],
    ["Conforme IN 22/2009, IN 13/2004 e Decreto 12.031/2024"],
    [""],
    ["Assinatura RT:", "", "", "CRMV:", ""],
    ["Data:", ""],
  ];
  const ws = createSheet(data, [30, 20, 15, 15, 15]);
  XLSX.utils.book_append_sheet(wb, ws, "Ficha Técnica");
  downloadWorkbook(wb, "Ficha_Tecnica_Produto");
}

// ─── Modelo de Rótulo ───
export function gerarModeloRotulo() {
  const wb = XLSX.utils.book_new();
  const data: (string | number | null)[][] = [
    ["MODELO DE RÓTULO — NUTRIÇÃO ANIMAL (IN 22/2009)"],
    [""],
    ["DADOS OBRIGATÓRIOS DO RÓTULO"],
    [""],
    ["Campo", "Conteúdo", "Referência Legal"],
    ["Nome/Marca Comercial", "", "IN 22/2009 Art. 5°"],
    ["Classificação", "(Ração / Suplemento / Sal / Premix)", "IN 30/2009"],
    ["Espécie Animal Destinada", "", "IN 22/2009"],
    ["Categoria/Fase", "(Ex: Bovinos de corte - Engorda)", "IN 22/2009"],
    ["Peso Líquido", "", "IN 22/2009"],
    ["Composição Básica", "(Listar ingredientes em ordem decrescente)", "IN 22/2009 Art. 7°"],
    ["Registro no MAPA", "", "IN 22/2009"],
    [""],
    ["NÍVEIS DE GARANTIA (obrigatórios no rótulo)"],
    ["Parâmetro", "Valor", "Unidade", "Mín/Máx"],
    ["Umidade", "", "%", "Máx"],
    ["Proteína Bruta (PB)", "", "%", "Mín"],
    ["Extrato Etéreo (EE)", "", "%", "Mín"],
    ["Fibra Bruta (FB)", "", "%", "Máx"],
    ["Matéria Mineral (MM)", "", "%", "Máx"],
    ["Cálcio (Ca)", "", "g/kg", "Mín-Máx"],
    ["Fósforo (P)", "", "g/kg", "Mín"],
    [""],
    ["Enriquecimento / Aditivos por kg:"],
    ["Aditivo", "Valor", "Unidade"],
    ...Array.from({ length: 6 }, () => ["", "", ""]),
    [""],
    ["INFORMAÇÕES COMPLEMENTARES"],
    ["Campo", "Conteúdo"],
    ["Indicações de Uso", ""],
    ["Modo de Uso / Fornecimento", ""],
    ["Precauções", ""],
    ["Armazenamento", ""],
    ["Validade", ""],
    ["N° do Lote / Data de Fabricação", "(preenchido na produção)"],
    [""],
    ["DADOS DO FABRICANTE"],
    ["Razão Social:", ""],
    ["CNPJ:", ""],
    ["Endereço:", ""],
    ["Registro MAPA/SIF/DIPOA:", ""],
    ["Responsável Técnico:", "", "CRMV:", ""],
    ["SAC / Telefone:", ""],
    [""],
    ["FRASES OBRIGATÓRIAS (IN 22/2009)"],
    ['"REGISTRO NO MINISTÉRIO DA AGRICULTURA E PECUÁRIA"'],
    ['"PRODUTO DE USO EXCLUSIVO NA ALIMENTAÇÃO ANIMAL"'],
    ['"PROIBIDO O USO NA ALIMENTAÇÃO HUMANA"'],
    ['"CONSULTE O MÉDICO VETERINÁRIO"'],
    [""],
    ["REFERÊNCIA — Valores de garantia para bovinos (IN 12/2004)"],
    ["Tipo Produto", "PB Mín (%)", "EE Mín (%)", "FB Máx (%)", "MM Máx (%)", "Ca g/kg", "P g/kg", "Na mg/kg"],
    ["Ração Engorda", "12-18", "2,5", "15", "12", "6-18", "4", "1.300"],
    ["Ração Cria/Recria", "14-20", "2,5", "18", "12", "6-18", "4", "1.300"],
    ["Ração Leite", "16-22", "2,5", "18", "12", "6-20", "4", "1.300"],
    ["Sal Mineral", "—", "—", "—", "—", "80-190", "40-90", "—"],
    ["Sal Proteinado", "20-45", "—", "—", "—", "40-120", "20-60", "—"],
    ["Supl. Mineral c/ Ureia", "—", "—", "—", "—", "80-190", "40-90", "—"],
    [""],
    ["Observações: Valores de referência conforme IN 12/2004. Ajustar conforme formulação específica."],
  ];
  const ws = createSheet(data, [32, 20, 15, 12, 12, 12, 12, 12]);
  XLSX.utils.book_append_sheet(wb, ws, "Modelo Rótulo");
  downloadWorkbook(wb, "Modelo_Rotulo_IN22_2009");
}

// ─── PL POP 9.2 — Expedição (Lista Simples) — modelo padrão para fábricas que registram manual ───
export function gerarFormExpedicaoSimples() {
  const wb = XLSX.utils.book_new();
  const data: (string | number | null)[][] = [
    ["PL POP 9.2 — REGISTRO DE EXPEDIÇÃO (LISTA SIMPLES)"],
    [
      "Lista resumida — dados detalhados de cliente/transporte ficam no cadastro. Arquivar por no mínimo 2 anos (IN 04/2007 MAPA).",
    ],
    [""],
    ["Empresa:", "", "", "Mês/Ano:", "", "Folha nº:", ""],
    [""],
    ["Data", "Nº NF / Pedido", "Cliente", "Lote", "Produto", "Qtd", "Un.", "Responsável"],
    ...Array.from({ length: 30 }, () => ["", "", "", "", "", "", "", ""]),
    [""],
    ["Em caso de RECALL: localizar o lote nesta lista e identificar todos os clientes que receberam."],
    [""],
    ["Responsável pela Expedição:", "", "", "Responsável Técnico (RT):", "", "CRMV:", ""],
    ["Data:", ""],
  ];
  const ws = createSheet(data, [12, 14, 32, 14, 30, 9, 7, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Expedição");
  downloadWorkbook(wb, "PL_POP_9.2_Expedicao_Lista_Simples");
}

// ─── Registro Detalhado de Expedição por NF (modelo completo opcional) ───
export function gerarFormExpedicaoCompleta() {
  const wb = XLSX.utils.book_new();
  const data: (string | number | null)[][] = [
    ["REGISTRO DE EXPEDIÇÃO E FATURAMENTO — RASTREABILIDADE DE PRODUTO ACABADO"],
    ["Conforme IN 04/2007 MAPA e Decreto 12.031/2024 — Retenção mínima: 2 anos"],
    [""],
    ["1. IDENTIFICAÇÃO DA EMPRESA"],
    ["Razão Social:", "", "", "CNPJ:", "", "Reg. MAPA/SIPEAGRO:", ""],
    ["Endereço:", "", "", "", "", "Data Emissão:", ""],
    [""],
    ["2. DADOS DA NOTA FISCAL"],
    ["Nº NF:", "", "Série:", "", "Data Emissão NF:", "", "Data Saída:", "", "Valor Total (R$):", ""],
    ["Chave de Acesso (44 dígitos):", ""],
    [""],
    ["3. CLIENTE / DESTINATÁRIO"],
    ["Razão Social:", "", "", "CNPJ:", "", "Insc. Estadual:", ""],
    ["Endereço:", "", "", "Cidade:", "", "UF:", ""],
    ["Telefone:", "", "", "E-mail:", ""],
    [""],
    ["4. TRANSPORTE"],
    ["Transportadora:", "", "", "CNPJ Transp.:", "", "Placa:", ""],
    ["Motorista:", "", "", "CPF Motorista:", "", "UF Veículo:", ""],
    [""],
    ["5. PRODUTOS EXPEDIDOS — LOTES (RASTREABILIDADE)"],
    [
      "Item",
      "Código",
      "Lote",
      "Produto",
      "Qtd",
      "Un.",
      "Sacos",
      "Vlr Unit. (R$)",
      "Vlr Total (R$)",
      "Data Fabric.",
      "Validade",
      "Observações",
    ],
    ...Array.from({ length: 12 }, (_, i) => [i + 1, "", "", "", "", "", "", "", "", "", "", ""]),
    ["", "", "", "", "", "", "", "TOTAL GERAL (R$):", "", "", "", ""],
    [""],
    ["6. OBSERVAÇÕES GERAIS"],
    [""],
    [""],
    [""],
    [""],
    ["7. ASSINATURAS"],
    ["Responsável pela Expedição:", "", "Conferente / Operador:", "", "Responsável Técnico (RT):", "", "CRMV:", ""],
    ["Motorista:", "", "", "Cliente / Destinatário (Recebimento):", ""],
    ["Data:", ""],
    [""],
    ["ARQUIVAR ESTE REGISTRO POR NO MÍNIMO 2 ANOS — Documento essencial para rastreabilidade e simulação de recall."],
  ];
  const ws = createSheet(data, [5, 12, 12, 26, 8, 7, 8, 12, 14, 12, 12, 18]);
  XLSX.utils.book_append_sheet(wb, ws, "Expedição NF");
  downloadWorkbook(wb, "Registro_Expedicao_Completa_por_NF");
}

// ─── MAPA: Mapa de Expedição (Romaneio de Saída) ───
export function gerarMapaExpedicaoMAPA(dados: any[], empresa: any) {
  const wb = XLSX.utils.book_new();

  const header = [
    ["", "MAPA DE EXPEDIÇÃO E RASTREABILIDADE DE PRODUTO ACABADO"],
    [
      "",
      `Empresa: ${empresa?.nome || "________________________"}`,
      "",
      "",
      `Período: ${new Date().toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}`,
    ],
    [""],
    [
      "Data",
      "NF",
      "Cliente",
      "Cidade/UF",
      "Produto",
      "Lote",
      "Quantidade",
      "Unid.",
      "Sacos",
      "Transportadora",
      "Motorista",
      "Placa",
    ],
  ];

  const dataRows = dados.map((e) => [
    e.data_saida || e.data_emissao || "",
    e.numero_nf || "",
    e.cliente_nome || "",
    `${e.cliente_cidade || ""}/${e.cliente_uf || ""}`,
    e.itens?.[0]?.produto || "Ver detalhes",
    e.itens?.[0]?.lote_produto || "NÃO INFORMADO",
    e.itens?.[0]?.quantidade || 0,
    e.itens?.[0]?.unidade || "kg",
    e.itens?.[0]?.quantidade_sacos || "—",
    e.transportadora_nome || "",
    e.motorista_nome || "",
    e.veiculo_placa || "",
  ]);

  const footer = [
    [""],
    ["Total de Registros:", dados.length, "", "", "", "", "Gerado em:", new Date().toLocaleDateString("pt-BR")],
    [""],
    ["", "Assinatura RT:", "________________________", "", "Assinatura Expedição:", "________________________"],
  ];

  const allData = [...header, ...dataRows, ...footer];
  const ws = createSheet(
    allData,
    [12, 10, 25, 18, 25, 14, 12, 8, 8, 20, 18, 12],
    [{ s: { r: 0, c: 1 }, e: { r: 0, c: 11 } }],
  );

  XLSX.utils.book_append_sheet(wb, ws, "Mapa Expedição");
  downloadWorkbook(wb, "Mapa_Expedicao_MAPA");
}

// ─── Exportador Dinâmico para Dados de Planilhas (Digital) ───
export function exportPopDataToExcel(
  pop: { codigo: string; nome: string },
  periodicidade: { label: string; key: string; periodos: string[]; areas: { area: string }[] },
  mes: number,
  ano: number,
  rows: any[],
) {
  const wb = XLSX.utils.book_new();
  const MESES = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];

  const header = [
    ["", `REGISTRO DIGITAL — ${pop.codigo} - ${pop.nome}`],
    ["", `Periodicidade: ${periodicidade.label}`, "", "", `Mês/Ano: ${MESES[mes - 1]}/${ano}`],
    [""],
    ["Período", ...periodicidade.areas.map((a) => a.area), "Responsável", "Função"],
  ];

  const dataRows = periodicidade.periodos.map((p) => {
    const cells = periodicidade.areas.map((a) => {
      const item = rows.find((r) => r.periodo_label === p && r.area === a.area);
      if (!item || item.conforme === null) return "-";
      return item.conforme ? "C" : "NC";
    });
    const firstRowItem = rows.find((r) => r.periodo_label === p);
    const resp = firstRowItem?.responsavel || "";
    const func = firstRowItem?.funcao || "";
    return [p, ...cells, resp, func];
  });

  const footer = [
    [""],
    ["", "Este registro foi gerado digitalmente pelo sistema Feed_BPF."],
    ["", "Data da Exportação:", new Date().toLocaleDateString("pt-BR")],
  ];

  const allData = [...header, ...dataRows, ...footer];

  // Calculate column widths
  const colWidths = [15, ...periodicidade.areas.map(() => 15), 20, 20];

  const ws = createSheet(allData, colWidths, [{ s: { r: 0, c: 1 }, e: { r: 0, c: periodicidade.areas.length + 2 } }]);

  XLSX.utils.book_append_sheet(wb, ws, "Registro");
  downloadWorkbook(wb, `${pop.codigo}_${periodicidade.key}_${MESES[mes - 1]}_${ano}`);
}
