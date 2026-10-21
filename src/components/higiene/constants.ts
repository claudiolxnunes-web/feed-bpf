
export const AREAS = ["Recepção de MP", "Mistura", "Ensaque", "Expedição", "Almoxarifado", "Laboratório", "Banheiros", "Refeitório", "Área Externa",
  "Silo 01", "Silo 02", "Silo 03", "Silo 04", "Silo 05", "Misturador", "Moinho", "Peletizadora", "Extrusora", "Transportador / Elevador"];

export const FREQUENCIAS = [
  { value: "diario", label: "Diário" },
  { value: "semanal", label: "Semanal" },
  { value: "quinzenal", label: "Quinzenal" },
  { value: "mensal", label: "Mensal" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
];

export const PONTOS_AGUA = [
  "Ponto 1 — Entrada / Poço",
  "Ponto 2 — Área de Produção",
  "Ponto 3 — Bebedouro / Refeitório",
  "Ponto 4 — Lavagem de equipamentos",
];

export const CHECKLIST_PRE_OP = [
  { area: "Pisos e Ralos", itens: ["Piso limpo e seco", "Ralos desobstruídos", "Ausência de acúmulo de resíduos"] },
  { area: "Paredes e Tetos", itens: ["Sem manchas ou mofos", "Pinturas íntegras", "Sem teias de aranha"] },
  { area: "Equipamentos de Produção", itens: ["Misturador limpo internamente", "Moinho sem resíduo de MP anterior", "Elevadores/transportadores limpos", "Peletizadora/Extrusora sem obstrução"] },
  { area: "Silos", itens: ["Silo limpo conforme cronograma", "Sem formação de crostas internas", "Bocal de carga/descarga limpo"] },
  { area: "Balanças e Dosadores", itens: ["Superfície de pesagem limpa", "Sem resíduo de produto anterior", "Balança com calibração vigente (ver POP 06)"] },
  { area: "Utensílios e EPI", itens: ["Pás e vassouras limpas", "EPIs disponíveis e limpos", "Coletores de amostra higienizados"] },
  { area: "Instalações de Apoio", itens: ["Banheiros limpos e abastecidos", "Lavatórios com sabonete e papel", "Lixeiras com tampa e identificadas"] },
];

export const CHECKLIST_LIBERACAO_LINHA = [
  { area: "Misturador", itens: [
    "Interior do misturador limpo (sem resíduo do produto anterior)",
    "Porta de descarga sem acúmulo de material",
    "Roscas transportadoras limpas",
    "Inspeção visual satisfatória — ausência de crostas",
    "Registro de flushing/vassoura realizado (se aplicável)",
  ]},
  { area: "Silos e Moegas", itens: [
    "Silos de dosagem vazios ou limpos",
    "Moegas sem resíduo de lote anterior",
    "Bocais de carga/descarga sem obstrução",
    "Ausência de contaminação cruzada visível",
  ]},
  { area: "Dosadores e Balanças", itens: [
    "Dosadores limpos (micro-ingredientes)",
    "Balanças de pesagem zeradas e limpas",
    "Sem resíduo de pré-misturas medicamentosas",
    "Recipientes de pesagem higienizados",
  ]},
  { area: "Ensaque e Expedição", itens: [
    "Boca de ensaque limpa",
    "Costuradeira/seladora sem resíduo",
    "Paletes limpos e identificados",
    "Área de expedição sem produto do lote anterior",
  ]},
  { area: "Documentação", itens: [
    "Ordem de produção anterior encerrada",
    "Rótulos do lote anterior recolhidos",
    "Nova ordem de produção disponível",
    "Identificação do novo produto/lote afixada",
  ]},
  { area: "Medicamentos / Carry-over", itens: [
    "Produto anterior continha medicamento? (verificar)",
    "Flushing ou limpeza validada realizada conforme plano de sequenciamento",
    "Destino do material de flushing registrado",
    "Carry-over até 2,5% da concentração do princípio ativo no produto seguinte",
    "Amostra coletada no último ponto compartilhado da linha",
  ]},
];

export const CHECKLIST_SILOS_TRANSPORT = [
  { area: "Silos de Matéria-Prima", itens: [
    "Silo vazio antes da troca de ingrediente",
    "Limpeza interna realizada (raspagem/aspiração)",
    "Ausência de crostas ou material aderido nas paredes",
    "Bocal de carga e descarga limpos",
    "Registro de limpeza do silo atualizado",
    "Vedação da tampa e escotilha íntegras",
  ]},
  { area: "Silos de Produto Acabado", itens: [
    "Silo completamente vazio antes do novo lote",
    "Inspeção visual — sem resíduo de lote anterior",
    "Limpeza registrada conforme cronograma",
    "Ausência de contaminação por medicamentos/aditivos",
  ]},
  { area: "Transportadores e Elevadores", itens: [
    "Rosca transportadora limpa e inspecionada",
    "Elevador de canecas sem acúmulo de material",
    "Calhas e tubulações sem obstrução",
    "Redler/corrente transportadora limpo",
    "Pontos de conexão entre equipamentos verificados",
    "Registro de flushing do transportador (se aplicável)",
  ]},
  { area: "Prevenção de Arraste", itens: [
    "Verificação de resíduo de medicamento no silo/transportador",
    "Flushing com inerte realizado após produto medicado",
    "Volume de flushing ≥ 50% da capacidade do equipamento",
    "Destino do material de flushing registrado (resíduo/reprocesso)",
    "Tempo de espera respeitado antes do próximo produto (se aplicável)",
    "Carry-over até 2,5% da concentração do princípio ativo (3 repetições da sequência-piloto)",
    "Produto não-alvo verificado no mínimo a cada 12 meses",
  ]},
  { area: "Documentação e Rastreabilidade", itens: [
    "Cronograma de limpeza de silos atualizado",
    "Frequência de limpeza conforme classificação do ingrediente",
    "Registro de sequência silo → produto mantido para rastreabilidade",
    "Laudos de análise de arraste arquivados (quando aplicável)",
  ]},
];

export const CHECKLIST_SUPERFICIES = [
  { area: "Superfícies de Contato Direto", itens: [
    "Misturador — parede interna",
    "Rosca transportadora — hélice e calha",
    "Dosadores — funil e comportas",
    "Peneiras e classificadores",
    "Boca de ensaque — funil e cone",
  ]},
  { area: "Superfícies de Contato Indireto", itens: [
    "Piso da área de produção",
    "Paredes da área de produção (até 2m)",
    "Estruturas metálicas / passarelas",
    "Portas e cortinas de PVC",
    "Painéis elétricos (parte externa)",
  ]},
  { area: "Utensílios e Ferramentas", itens: [
    "Pás e conchas de dosagem",
    "Bombonas e baldes de pesagem",
    "Vassouras e rodos (área de produção)",
    "Coletores de amostra",
    "Facas de corte de embalagens",
  ]},
  { area: "Método de Verificação", itens: [
    "Inspeção visual realizada",
    "Swab de superfície coletado (se programado)",
    "Teste de água de enxágue (se aplicável)",
    "Bioluminescência ATP (se disponível)",
    "Resultado registrado e conforme",
  ]},
];

export const CHECKLIST_HIGIENE_PESSOAL = [
  { area: "Uniformes e EPIs", itens: [
    "Uniforme limpo e em bom estado de conservação",
    "Calçados fechados e limpos (botas ou sapatos de segurança)",
    "Uso de touca/gorro cobrindo todo o cabelo",
    "Uso de máscara descartável (quando aplicável)",
    "Luvas descartáveis (manipulação de premix/micro-ingredientes)",
    "Protetor auricular disponível e em uso (áreas de ruído)",
    "Óculos de proteção em áreas de risco (moagem, dosagem)",
  ]},
  { area: "Higiene Pessoal", itens: [
    "Mãos limpas e unhas curtas/sem esmalte",
    "Lavagem das mãos realizada antes de iniciar atividades",
    "Ausência de barba (ou uso de protetor de barba)",
    "Ausência de adornos (anéis, brincos, relógio, pulseiras)",
    "Ausência de maquiagem/perfumes/cosméticos fortes",
    "Cabelos totalmente cobertos pela touca",
  ]},
  { area: "Saúde do Trabalhador", itens: [
    "ASO (Atestado de Saúde Ocupacional) dentro da validade",
    "Exame admissional/periódico em dia",
    "Ausência de lesões cutâneas expostas (feridas, abscessos)",
    "Ausência de sintomas de doença infectocontagiosa",
    "Colaborador apto para a função (sem restrições médicas)",
  ]},
  { area: "Comportamento e Boas Práticas", itens: [
    "Proibido comer, beber ou fumar na área de produção",
    "Proibido guardar alimentos nos armários da produção",
    "Proibido uso de celular na área produtiva",
    "Lavagem de mãos após uso do banheiro verificada",
    "Treinamento de BPF/Higiene atualizado (anual mínimo)",
  ]},
];

export const CHECKLIST_RESERVATORIO = [
  { area: "Preparação", itens: [
    "Reservatório completamente esvaziado",
    "Registro fotográfico do estado antes da limpeza",
    "Equipamentos de limpeza preparados e higienizados",
    "EPI do executor conferido (luvas, botas, máscara)",
  ]},
  { area: "Execução da Limpeza", itens: [
    "Remoção mecânica de sedimentos e incrustações",
    "Lavagem com água sob pressão das paredes e fundo",
    "Aplicação de solução clorada (200 ppm) em toda superfície",
    "Tempo de contato da solução desinfetante respeitado (≥ 30 min)",
    "Enxágue completo com água potável",
    "Drenagem total da água de enxágue",
  ]},
  { area: "Pós-Limpeza", itens: [
    "Inspeção visual final — ausência de resíduos e biofilme",
    "Vedação e tampas reinstaladas corretamente",
    "Reservatório reabastecido com água potável",
    "Dosagem de cloro ajustada após reabastecimento",
    "Registro fotográfico do estado após a limpeza",
    "Certificado de limpeza emitido e arquivado",
  ]},
];

export const CHECKLIST_AGUA = [
  { area: "Reservatórios", itens: [
    "Reservatório com tampa e vedação adequada",
    "Ausência de trincas, rachaduras ou infiltrações",
    "Limpeza semestral realizada e registrada",
    "Certificado de limpeza do reservatório em dia",
    "Ausência de algas, sedimentos ou corpos estranhos",
  ]},
  { area: "Pontos de Coleta", itens: [
    "Torneiras e registros em bom estado",
    "Sem vazamentos nos pontos de uso",
    "Identificação dos pontos de coleta conforme planta",
    "Proteção contra refluxo instalada",
  ]},
  { area: "Tratamento", itens: [
    "Sistema de cloração funcionando",
    "Dosagem de cloro verificada (0,2–2,0 mg/L)",
    "Filtros limpos e com manutenção em dia",
    "Registro de troca de filtros atualizado",
  ]},
  { area: "Laudos e Documentação", itens: [
    "Laudo laboratorial mensal em dia",
    "Análise microbiológica semestral realizada",
    "Resultados de coliformes totais e E. coli conformes",
    "Laudos arquivados e disponíveis para fiscalização",
    "Outorga de uso da água (se poço artesiano) válida",
  ]},
];

export const SINTOMAS_DIARIOS = [
  "Febre ou calafrios", "Tosse persistente", "Diarreia ou vômito", "Dor de garganta",
  "Lesões cutâneas (feridas, abscessos)", "Secreção ocular ou nasal", "Icterícia (pele/olhos amarelados)",
  "Dor abdominal intensa", "Infecção de ouvido", "Outros sintomas infectocontagiosos"
];

export const TIPOS_VALIDACAO = [
  { value: "visual", label: "Inspeção Visual" },
  { value: "swab", label: "Swab / Teste de Superfície" },
  { value: "laboratorial", label: "Análise Laboratorial" },
  { value: "rinse", label: "Água de Enxágue" },
  { value: "homogeneidade", label: "Teste de Homogeneidade (CV até 10%)" },
  { value: "carryover", label: "Teste de Carry-Over / Arraste" },
  { value: "tempo_mistura", label: "Validação Tempo de Mistura" },
  { value: "flushing", label: "Flushing / Limpeza de Linha" },
];
