
export const CHECKLIST_VEICULO: { area: string; itens: string[] }[] = [
  { area: "Condições Gerais do Veículo", itens: [
    "Carroceria limpa e livre de resíduos de cargas anteriores",
    "Lona/cobertura em bom estado (sem furos ou rasgos)",
    "Piso da carroceria íntegro e sem frestas",
    "Ausência de pragas, roedores ou vestígios de infestação",
    "Odor adequado — sem cheiros estranhos ou contaminantes",
    "Veículo exclusivo para transporte de alimentos para animais (verificar)",
  ]},
  { area: "Documentação do Veículo", itens: [
    "Nota fiscal de transporte conferida",
    "Placa e dados do veículo conferidos com a documentação",
    "Motorista identificado (CNH e credencial de acesso)",
    "Certificado de desinfecção do veículo válido",
    "Registro de cargas anteriores disponível (rastreabilidade)",
  ]},
  { area: "Condições de Carga / Descarga", itens: [
    "Embalagens íntegras (sem rasgos, furos ou umidade)",
    "Empilhamento correto conforme limite de peso",
    "Paletes em bom estado e sem contaminação",
    "Produto separado de substâncias incompatíveis",
    "Identificação/rótulo visível em todas as embalagens",
  ]},
  { area: "Proteção contra Contaminação Cruzada", itens: [
    "Não transporta simultaneamente rações medicadas e não-medicadas",
    "Granel: verificação de resíduo de produto anterior",
    "Compartimentos limpos e secos",
    "Ausência de produtos químicos, combustíveis ou agrotóxicos no mesmo compartimento",
  ]},
  { area: "Conformidade IN 15/2009", itens: [
    "Veículo não transportou ruminantes ou seus derivados (quando aplicável BSE)",
    "Registro de flushing do compartimento (transporte a granel medicado)",
    "Certificado de análise da carga disponível (quando exigido)",
    "Temperatura de transporte verificada (produtos sensíveis)",
  ]},
];

export const CHECKLIST_DEPOSITO: { area: string; itens: string[] }[] = [
  { area: "Estrutura Física", itens: [
    "Piso em bom estado, sem rachaduras ou buracos",
    "Paredes limpas e sem infiltrações",
    "Cobertura íntegra (sem goteiras ou frestas)",
    "Iluminação adequada e funcional",
    "Ventilação natural ou mecânica funcionando",
    "Portas e janelas com proteção contra pragas (telas)",
  ]},
  { area: "Organização e Estocagem", itens: [
    "Paletes a no mínimo 10 cm do piso",
    "Distância mínima de 50 cm das paredes",
    "Empilhamento dentro do limite máximo permitido",
    "Produtos identificados com lote e validade",
    "Separação entre matéria-prima e produto acabado",
    "Área de quarentena identificada e isolada",
    "Sistema FIFO/FEFO (primeiro a vencer, primeiro a sair) aplicado",
  ]},
  { area: "Controle Ambiental", itens: [
    "Temperatura do depósito verificada e registrada",
    "Umidade relativa do depósito verificada e registrada",
    "Sem formação de condensação nas paredes/teto",
    "Sem presença de mofo ou fungos visíveis",
    "Produtos sensíveis à temperatura armazenados adequadamente",
  ]},
  { area: "Segurança e Prevenção", itens: [
    "Extintores de incêndio dentro da validade e acessíveis",
    "Sinalizações de segurança visíveis",
    "Área de produtos químicos separada do estoque de alimentos",
    "Produtos devolvidos/rejeitados em área segregada e identificada",
  ]},
];
