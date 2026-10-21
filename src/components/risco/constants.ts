
export const DEFAULT_PRODUCTS = [
  "EQUINOS",
  "FARELÃO",
  "OVINOS E CAPRINOS",
  "BOVINOS S. URÉIA/C.IONÓFORO",
  "BOVINOS C.URÉIA /COM IONÓFORO",
  "PROTEINADO SEM URÉIA/COM IONÓFORO",
  "PROTEINADO COM URÉIA/COM IONÓFORO",
  "SAL MINERAL",
  "SAL MINERAL C. URÉIA",
  "SAL MINERAL C.URÉIA /IONÓFORO",
  "AVES DE CORTE",
  "AVES DE POSTURA",
  "SUÍNOS",
];

export const DEFAULT_SENSITIVITY: Record<string, Record<string, boolean>> = {
  "EQUINOS": {},
  "FARELÃO": {},
  "OVINOS E CAPRINOS": { "EQUINOS": true, "FARELÃO": true },
  "BOVINOS S. URÉIA/C.IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "BOVINOS C.URÉIA /COM IONÓFORO": true, "SAL MINERAL": true },
  "BOVINOS C.URÉIA /COM IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "OVINOS E CAPRINOS": true, "BOVINOS C.URÉIA /COM IONÓFORO": true, "PROTEINADO SEM URÉIA/COM IONÓFORO": true, "SAL MINERAL": true, "AVES DE CORTE": true, "AVES DE POSTURA": true, "SUÍNOS": true },
  "PROTEINADO SEM URÉIA/COM IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "BOVINOS C.URÉIA /COM IONÓFORO": true, "SAL MINERAL": true },
  "PROTEINADO COM URÉIA/COM IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "OVINOS E CAPRINOS": true, "BOVINOS S. URÉIA/C.IONÓFORO": true, "SAL MINERAL": true, "AVES DE CORTE": true, "AVES DE POSTURA": true, "SUÍNOS": true },
  "SAL MINERAL": { "OVINOS E CAPRINOS": true },
  "SAL MINERAL C. URÉIA": { "EQUINOS": true, "FARELÃO": true, "OVINOS E CAPRINOS": true, "BOVINOS S. URÉIA/C.IONÓFORO": true, "PROTEINADO SEM URÉIA/COM IONÓFORO": true, "SAL MINERAL": true, "AVES DE CORTE": true, "AVES DE POSTURA": true, "SUÍNOS": true },
  "SAL MINERAL C.URÉIA /IONÓFORO": { "EQUINOS": true, "FARELÃO": true, "OVINOS E CAPRINOS": true, "BOVINOS S. URÉIA/C.IONÓFORO": true, "PROTEINADO SEM URÉIA/COM IONÓFORO": true, "SAL MINERAL": true, "AVES DE CORTE": true, "AVES DE POSTURA": true, "SUÍNOS": true },
  "AVES DE CORTE": { "EQUINOS": true, "FARELÃO": true },
  "AVES DE POSTURA": { "EQUINOS": true, "FARELÃO": true },
  "SUÍNOS": { "EQUINOS": true, "FARELÃO": true },
};

export const ETAPAS_COMUNS = [
  "Recebimento de matérias-primas",
  "Armazenamento de MP",
  "Moagem / Pré-moagem",
  "Dosagem e Pesagem",
  "Mistura",
  "Peletização / Extrusão",
  "Resfriamento",
  "Ensaque / Embalagem",
  "Armazenamento de Produto Acabado",
  "Expedição / Transporte",
  "Limpeza de Linha (Flushing)",
  "Água de Processo",
  "Manutenção de Equipamentos",
];

export const PERIGOS_SUGERIDOS: Record<string, Array<{ perigo: string; tipo: string; prob: string; sev: string; medida: string }>> = {
  "Recebimento de matérias-primas": [
    { perigo: "Micotoxinas (aflatoxinas, fumonisinas) em milho, farelo de soja", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Certificado de análise do fornecedor + amostragem/análise laboratorial periódica" },
    { perigo: "Salmonella spp. em farelos e farinhas de origem animal", tipo: "Biológico", prob: "Alta", sev: "Alta", medida: "Qualificação de fornecedor + análise microbiológica + certificado sanitário" },
    { perigo: "Resíduos de pesticidas/agrotóxicos em grãos", tipo: "Químico", prob: "Baixa", sev: "Alta", medida: "Certificado do fornecedor + monitoramento conforme IN 13/2004" },
    { perigo: "Material estranho (pedras, madeira, plástico)", tipo: "Físico", prob: "Média", sev: "Média", medida: "Inspeção visual no recebimento + peneiras na descarga" },
    { perigo: "MP fora de especificação (umidade, rancidez, cor anormal)", tipo: "Químico", prob: "Média", sev: "Média", medida: "Checklist de recebimento (odor, cor, umidade, temperatura)" },
    { perigo: "Dioxinas em gorduras/óleos reciclados", tipo: "Químico", prob: "Baixa", sev: "Alta", medida: "Uso apenas de fornecedores com certificação + laudo de dioxinas" },
  ],
  "Armazenamento de MP": [
    { perigo: "Contaminação cruzada entre ureia e ingredientes sem ureia", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Segregação física + sinalização + área exclusiva para ureia" },
    { perigo: "Desenvolvimento de fungos por umidade elevada", tipo: "Biológico", prob: "Média", sev: "Média", medida: "Controle de temperatura e umidade + FIFO + ventilação" },
    { perigo: "Contaminação por pragas (roedores, insetos)", tipo: "Biológico", prob: "Média", sev: "Média", medida: "Programa de controle integrado de pragas + estrados/paletes" },
    { perigo: "Contaminação cruzada entre ionóforos e produtos para equinos", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Armazenamento segregado + identificação visual + procedimento operacional" },
  ],
  "Moagem / Pré-moagem": [
    { perigo: "Fragmentos metálicos por desgaste de martelos/peneiras", tipo: "Físico", prob: "Média", sev: "Média", medida: "Ímãs de proteção + peneiras + manutenção preventiva dos moinhos" },
    { perigo: "Poeira excessiva gerando risco de explosão", tipo: "Físico", prob: "Baixa", sev: "Alta", medida: "Sistema de exaustão + aterramento + manutenção preventiva" },
    { perigo: "Granulometria inadequada comprometendo mistura", tipo: "Físico", prob: "Média", sev: "Média", medida: "Controle periódico de granulometria + troca de peneiras" },
  ],
  "Dosagem e Pesagem": [
    { perigo: "Dosagem incorreta de ureia (risco de intoxicação)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Dupla conferência de pesagem + formulação impressa + treinamento" },
    { perigo: "Erro na dosagem de premix/medicamento veterinário", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Balança calibrada + conferência de lote e quantidade + registro" },
    { perigo: "Dosagem incorreta de ionóforos (monensina, salinomicina, lasalocida)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Procedimento específico + dupla conferência + balanças aferidas" },
    { perigo: "Troca/inversão de matéria-prima (ex: calcário por ureia)", tipo: "Químico", prob: "Baixa", sev: "Alta", medida: "Identificação clara de cada silo/recipiente + conferência visual" },
  ],
  "Mistura": [
    { perigo: "Contaminação cruzada com monensina em ração sem monensina (risco para equinos)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Matriz de sensibilidade + sequenciamento + validação de limpeza" },
    { perigo: "Mistura não homogênea (sub/sobre dosagem no saco)", tipo: "Químico", prob: "Média", sev: "Média", medida: "Tempo de mistura padronizado + teste de homogeneidade (CV<10%)" },
    { perigo: "Carry-over de aditivos medicamentosos entre bateladas", tipo: "Químico", prob: "Alta", sev: "Alta", medida: "Flushing entre produções sensíveis + análise de carry-over" },
    { perigo: "Resíduos de limpeza química no misturador", tipo: "Químico", prob: "Baixa", sev: "Média", medida: "Enxágue adequado + validação de limpeza + registro" },
  ],
  "Peletização / Extrusão": [
    { perigo: "Temperatura insuficiente para eliminação de Salmonella", tipo: "Biológico", prob: "Média", sev: "Alta", medida: "Monitoramento de temperatura (>80°C) + registro contínuo" },
    { perigo: "Fragmentos metálicos da matriz/rolos", tipo: "Físico", prob: "Baixa", sev: "Média", medida: "Inspeção periódica da matriz + detector de metais pós-peletização" },
  ],
  "Resfriamento": [
    { perigo: "Recontaminação microbiológica por ar contaminado", tipo: "Biológico", prob: "Baixa", sev: "Média", medida: "Filtros no resfriador + manutenção + análise microbiológica periódica" },
    { perigo: "Umidade residual elevada favorecendo fungos", tipo: "Biológico", prob: "Média", sev: "Média", medida: "Controle de temperatura de saída (<5°C acima da ambiente) + umidade" },
  ],
  "Ensaque / Embalagem": [
    { perigo: "Embalagem danificada permitindo contaminação", tipo: "Físico", prob: "Baixa", sev: "Média", medida: "Inspeção visual + teste de integridade + armazenamento correto de embalagens" },
    { perigo: "Erro na rotulagem (produto, lote, validade)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Conferência de rótulo vs. ordem de produção + dupla verificação" },
    { perigo: "Fragmento de costura/grampo na embalagem", tipo: "Físico", prob: "Baixa", sev: "Média", medida: "Manutenção da costureira + inspeção visual" },
  ],
  "Armazenamento de Produto Acabado": [
    { perigo: "Deterioração por umidade/temperatura inadequada", tipo: "Biológico", prob: "Baixa", sev: "Média", medida: "Controle de temperatura e umidade do armazém + FIFO" },
    { perigo: "Mistura de lotes / produtos diferentes", tipo: "Físico", prob: "Baixa", sev: "Média", medida: "Identificação clara + áreas demarcadas + rastreabilidade" },
  ],
  "Expedição / Transporte": [
    { perigo: "Contaminação cruzada no veículo de transporte", tipo: "Químico", prob: "Média", sev: "Média", medida: "Inspeção do veículo + registro de cargas anteriores + limpeza" },
    { perigo: "Exposição ao sol/chuva durante carga", tipo: "Físico", prob: "Baixa", sev: "Baixa", medida: "Doca coberta + lona adequada" },
  ],
  "Limpeza de Linha (Flushing)": [
    { perigo: "Flushing insuficiente (carry-over acima do aceitável)", tipo: "Químico", prob: "Média", sev: "Alta", medida: "Quantidade de flushing validada + análise periódica de carry-over" },
    { perigo: "Destino inadequado do material de flushing", tipo: "Químico", prob: "Baixa", sev: "Média", medida: "Procedimento definido para destino do flushing + registro" },
  ],
  "Água de Processo": [
    { perigo: "Água fora dos padrões de potabilidade", tipo: "Biológico", prob: "Baixa", sev: "Média", medida: "Análise periódica de potabilidade + cloração + registro" },
    { perigo: "Contaminação por metais pesados na água", tipo: "Químico", prob: "Baixa", sev: "Média", medida: "Análise anual de metais pesados + tratamento" },
  ],
  "Manutenção de Equipamentos": [
    { perigo: "Lubrificantes contaminando o produto", tipo: "Químico", prob: "Baixa", sev: "Média", medida: "Uso de lubrificantes food-grade + manutenção preventiva + registro" },
    { perigo: "Peças soltas/parafusos caindo no produto", tipo: "Físico", prob: "Baixa", sev: "Alta", medida: "Check-list pós-manutenção + detector de metais + ímãs" },
  ],
};

export interface Pergunta {
  id: string;
  categoria: string;
  texto: string;
  peso: number; // 1-5
  resposta: "sim" | "nao" | "parcial" | "na" | "";
  observacao: string;
}

export const CATEGORIAS = [
  "Infraestrutura e Instalações",
  "Higiene e Sanitização",
  "Controle de Matérias-Primas",
  "Processo Produtivo",
  "Controle de Pragas",
  "Treinamento de Pessoal",
  "Rastreabilidade",
  "Equipamentos e Manutenção",
  "Documentação e Registros",
  "Programa de Autocontrole (PAC)",
];

export const PERGUNTAS_PADRAO: Omit<Pergunta, "id">[] = [
  // Infraestrutura
  { categoria: "Infraestrutura e Instalações", texto: "As instalações possuem piso lavável, sem rachaduras ou buracos?", peso: 4, resposta: "", observacao: "" },
  { categoria: "Infraestrutura e Instalações", texto: "O layout permite fluxo unidirecional (sem cruzamento de fluxos)?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Infraestrutura e Instalações", texto: "Há barreiras adequadas contra entrada de pragas (telas, cortinas)?", peso: 4, resposta: "", observacao: "" },
  { categoria: "Infraestrutura e Instalações", texto: "A iluminação é adequada e as luminárias possuem proteção?", peso: 3, resposta: "", observacao: "" },
  // Higiene
  { categoria: "Higiene e Sanitização", texto: "Existe cronograma de limpeza implementado e registrado?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Higiene e Sanitização", texto: "Os produtos de limpeza são aprovados para uso na indústria alimentícia?", peso: 4, resposta: "", observacao: "" },
  { categoria: "Higiene e Sanitização", texto: "Há validação de limpeza de linha entre produtos sensíveis?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Higiene e Sanitização", texto: "Os colaboradores seguem as BPF de higiene pessoal?", peso: 4, resposta: "", observacao: "" },
  // Matérias-primas
  { categoria: "Controle de Matérias-Primas", texto: "Todos os fornecedores são qualificados e possuem registro no MAPA?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Controle de Matérias-Primas", texto: "As matérias-primas são inspecionadas no recebimento (odor, umidade, insetos)?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Controle de Matérias-Primas", texto: "Existe controle de substâncias proibidas/indesejáveis conforme IN 15?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Controle de Matérias-Primas", texto: "As matérias-primas são armazenadas de forma segregada e identificada?", peso: 4, resposta: "", observacao: "" },
  // Processo
  { categoria: "Processo Produtivo", texto: "O sequenciamento de produção segue a matriz de sensibilidade?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Processo Produtivo", texto: "Os tempos de mistura são controlados e registrados?", peso: 4, resposta: "", observacao: "" },
  { categoria: "Processo Produtivo", texto: "Existe controle de contaminação cruzada entre produtos com e sem medicamentos?", peso: 5, resposta: "", observacao: "" },
  // Pragas
  { categoria: "Controle de Pragas", texto: "Existe contrato com empresa especializada de controle de pragas?", peso: 4, resposta: "", observacao: "" },
  { categoria: "Controle de Pragas", texto: "Os mapas de iscas e armadilhas estão atualizados?", peso: 3, resposta: "", observacao: "" },
  // Treinamento
  { categoria: "Treinamento de Pessoal", texto: "Todos os colaboradores possuem treinamento em BPF válido?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Treinamento de Pessoal", texto: "Há programa de capacitação contínua com cronograma definido?", peso: 4, resposta: "", observacao: "" },
  // Rastreabilidade
  { categoria: "Rastreabilidade", texto: "É possível rastrear o produto desde a matéria-prima até o cliente final?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Rastreabilidade", texto: "Existe procedimento de recall testado e documentado?", peso: 5, resposta: "", observacao: "" },
  // Equipamentos
  { categoria: "Equipamentos e Manutenção", texto: "As balanças estão calibradas e com certificados válidos?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Equipamentos e Manutenção", texto: "Existe programa de manutenção preventiva implementado?", peso: 4, resposta: "", observacao: "" },
  // Documentação
  { categoria: "Documentação e Registros", texto: "Todos os POPs estão atualizados, assinados e disponíveis nos setores?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Documentação e Registros", texto: "Os registros de produção e controle de qualidade estão completos?", peso: 4, resposta: "", observacao: "" },
  // PAC
  { categoria: "Programa de Autocontrole (PAC)", texto: "A empresa possui programa de autocontrole documentado e implementado?", peso: 5, resposta: "", observacao: "" },
  { categoria: "Programa de Autocontrole (PAC)", texto: "As auditorias internas são realizadas conforme cronograma?", peso: 4, resposta: "", observacao: "" },
];
