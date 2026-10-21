export const POPS_CUSTOM = [
  { 
    codigo: "POP-01", 
    nome: "Recebimento e Armazenamento",
    descricao: "Procedimentos para qualificação de fornecedores, recepção de insumos e boas práticas de estocagem (PEPS/FIFO)."
  },
  { 
    codigo: "POP-02", 
    nome: "Limpeza de Instalações, Equipamentos e Utensílios",
    descricao: "Controle de limpeza de instalações e equipamentos, sanitização de áreas críticas e cronogramas de higienização conforme IN 04/2007 e IN 15/2009 (Nota: A higiene humana reside no POP 03)."
  },
  { 
    codigo: "POP-03", 
    nome: "Higiene e Saúde Pessoal",
    descricao: "Gestão da saúde ocupacional, exames médicos (ASO), higiene pessoal, capacitação e comportamento nas áreas de produção conforme IN 04/2007."
  },
  { 
    codigo: "POP-04", 
    nome: "Potabilidade da Água",
    descricao: "Monitoramento da qualidade da água, níveis de cloro residual, limpeza semestral de reservatórios e análises laboratoriais físico-químicas e microbiológicas."
  },
  { 
    codigo: "POP-05", 
    nome: "Controle da Produção",
    descricao: "Controle das etapas de fabricação, moagem, dosagem e mistura, incluindo o sequenciamento de produção e flushing para mitigar o carry-over de medicamentos."
  },
  { 
    codigo: "POP-06", 
    nome: "Manutenção e Calibração",
    descricao: "Manutenção preventiva e corretiva de equipamentos críticos, além da calibração periódica de balanças e medidores para garantir a precisão dos processos."
  },
  { 
    codigo: "POP-07", 
    nome: "Controle de Pragas",
    descricao: "Programa de manejo integrado de pragas, monitoramento de iscas e armadilhas, e controle de vetores e roedores nas áreas internas e externas."
  },
  { 
    codigo: "POP-08", 
    nome: "Resíduos e Efluentes",
    descricao: "Gerenciamento de resíduos sólidos e efluentes líquidos, classificação de descartes e atendimento às normas ambientais vigentes."
  },
  { 
    codigo: "POP-09", 
    nome: "Rastreabilidade e Recolhimento (Recall)",
    descricao: "Procedimentos de rastreabilidade de produtos, controle de não conformidades, expedição e programa de recolhimento (recall) conforme IN 04/2007."
  },
  { 
    codigo: "POP-10", 
    nome: "PAC — Programa de Autocontrole",
    descricao: "Sistema de monitoramento, verificação e ações corretivas para garantir que todos os processos operacionais estejam sob controle e em conformidade técnica."
  },
];

/**
 * Mapeia cada POP do importador → códigos de módulos em MODULOS_CUSTOM.
 * Um POP é considerado "aceito pela empresa" se pelo menos um módulo mapeado estiver ativo.
 */
export const POP_TO_MODULOS: Record<string, string[]> = {
  "POP-01": ["pop-01-recebimento", "pop-01-armazenamento", "fornecedores"],
  "POP-02": ["pop-02-higiene", "pop-02-transporte"],
  "POP-03": ["pop-03-saude", "treinamentos", "visitantes"],
  "POP-04": ["pop-04-agua"],
  "POP-05": ["pop-05-producao", "pcp"],
  "POP-06": ["pop-06-manutencao"],
  "POP-07": ["pop-07-pragas"],
  "POP-08": ["pop-08-residuos"],
  "POP-09": ["pop-09-rastreabilidade", "rastreabilidade"],
  "POP-10": ["pop-10-pac", "matriz-risco"],
};

export const CUSTOM_STORAGE_PREFIX = "custom";

/**
 * Sugere um POP a partir do nome do arquivo por regex simples.
 */
export function sugerirPopPorNome(nomeArquivo: string): string | null {
  const nome = nomeArquivo.toLowerCase();
  const regras: Array<[RegExp, string]> = [
    [/receb|materia[- ]?prima|mp\b|fornecedor|armazen|estoc|deposit/, "POP-01"],
    [/sanitiz|limpez|desinfec|transport|veicul/, "POP-02"],
    [/saud|aso|manipulador|epi\b|treinamento|visitante/, "POP-03"],
    [/agua|potab|cloro|reservat/, "POP-04"],
    [/produc|pcp|batida|formul|mistur|expedic/, "POP-05"],
    [/manutenc|calibr|equipam/, "POP-06"],
    [/praga|isca|armadilha|dedetiz|roedor/, "POP-07"],
    [/residu|efluent|lixo|descart/, "POP-08"],
    [/rastre|recall|recolh/, "POP-09"],
    [/pac\b|autocontrol|haccp|appcc/, "POP-10"],
  ];
  for (const [re, pop] of regras) if (re.test(nome)) return pop;
  return null;
}

export type CampoTipo = "texto" | "numero" | "data" | "checkbox" | "textarea" | "select";

export interface CampoModelo {
  id: string;
  nome: string;
  tipo: CampoTipo;
  obrigatorio: boolean;
  opcoes?: string[]; // usado quando tipo = select
  valorPadrao?: string;
}
