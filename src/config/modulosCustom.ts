// Catálogo de módulos ativáveis no Feed_BPF Custom.
// Cliente escolhe quais deixar visíveis na sidebar/rotas.

export interface ModuloCustom {
  codigo: string;
  nome: string;
  descricao: string;
  grupo: "cadastros" | "pops" | "operacional" | "compliance";
  padrao_ativo: boolean;
}

export const MODULOS_CUSTOM: ModuloCustom[] = [
  // Cadastros base (equivalente ao Feed_BPF original)
  { codigo: "produtos",       nome: "Cadastro de Produtos", descricao: "Produtos, fórmulas e níveis de garantia", grupo: "cadastros", padrao_ativo: true },
  { codigo: "formulas",       nome: "Fórmulas",             descricao: "Composição das formulações",              grupo: "cadastros", padrao_ativo: true },
  { codigo: "rotulos",        nome: "Rótulos e RTPI",       descricao: "Rótulos MAPA e RTPI",                     grupo: "cadastros", padrao_ativo: true },
  { codigo: "fornecedores",   nome: "Fornecedores",         descricao: "Qualificação SIPEAGRO",                   grupo: "cadastros", padrao_ativo: true },

  // POPs (IN 04/2007)
  { codigo: "pop-01-recebimento",  nome: "POP 01 — Recebimento",       descricao: "Recepção e controle de insumos", grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-01-armazenamento",nome: "POP 01 — Armazenamento",     descricao: "Estoque e PEPS/FEFO",            grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-02-higiene",      nome: "POP 02 — Higiene",           descricao: "Sanitização de superfícies",    grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-02-transporte",   nome: "POP 02 — Higiene do Transporte", descricao: "Inspeção e limpeza de veículos", grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-03-saude",        nome: "POP 03 — Saúde e Visitantes",descricao: "ASO, biossegurança",            grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-04-agua",         nome: "POP 04 — Água",              descricao: "Potabilidade e reservatórios",  grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-05-producao",     nome: "POP 05 — Produção",          descricao: "Processo e contaminação cruzada", grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-06-manutencao",   nome: "POP 06 — Manutenção",        descricao: "Preventiva e calibração",       grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-07-pragas",       nome: "POP 07 — Pragas",            descricao: "MIP e expurgo",                 grupo: "pops", padrao_ativo: false },
  { codigo: "pop-08-residuos",     nome: "POP 08 — Resíduos",          descricao: "PGRS e efluentes",              grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-09-rastreabilidade", nome: "POP 09 — Rastreabilidade", descricao: "Rastreabilidade e recolhimento", grupo: "pops", padrao_ativo: true  },
  { codigo: "pop-10-pac",          nome: "POP 10 — PAC",               descricao: "Análise de perigos e HACCP",    grupo: "pops", padrao_ativo: true  },

  // Operacional
  { codigo: "pcp",              nome: "PCP e Produção",       descricao: "Ordens, batidas, sequenciamento", grupo: "operacional", padrao_ativo: true  },
  { codigo: "expedicao",        nome: "Expedição",            descricao: "Mapa e lotes de expedição",       grupo: "operacional", padrao_ativo: true  },
  { codigo: "rastreabilidade",  nome: "Rastreabilidade",      descricao: "Árvore, recall, testes",          grupo: "operacional", padrao_ativo: true  },
  { codigo: "tablet",           nome: "Modo Tablet (chão)",   descricao: "UI para fábrica",                 grupo: "operacional", padrao_ativo: false },

  // Compliance
  { codigo: "nao-conformidades", nome: "Não Conformidades", descricao: "Registro e plano de ação",   grupo: "compliance", padrao_ativo: true  },
  { codigo: "matriz-risco",      nome: "Matriz de Risco",   descricao: "HACCP interativa",           grupo: "compliance", padrao_ativo: true  },
  { codigo: "auditoria",         nome: "Auditoria",         descricao: "Portal auditor e trilha",    grupo: "compliance", padrao_ativo: true  },
  { codigo: "tf-autocontroles",  nome: "TF Autocontroles",  descricao: "Simulador MAPA",             grupo: "compliance", padrao_ativo: false },
  { codigo: "treinamentos",      nome: "Treinamentos",      descricao: "Registro de capacitações",   grupo: "compliance", padrao_ativo: true  },
];

export const GRUPOS_LABEL: Record<ModuloCustom["grupo"], string> = {
  cadastros:   "Cadastros base",
  pops:        "POPs (IN 04/2007)",
  operacional: "Operação",
  compliance:  "Compliance e Auditoria",
};
