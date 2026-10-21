
export const TIPOS_RESIDUO = ["Orgânico", "Pó/Varredura", "Embalagens plásticas", "Embalagens papel/papelão", "Efluente líquido", "Efluente industrial", "Água de lavagem", "Óleo lubrificante", "Resíduo químico", "Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção", "Outro"];

export const TRATAMENTO_EFLUENTE = [
  { value: "fossa_septica", label: "Fossa Séptica" },
  { value: "ete_propria", label: "ETE Própria" },
  { value: "rede_publica", label: "Rede Pública de Esgoto" },
  { value: "lagoa_estabilizacao", label: "Lagoa de Estabilização" },
  { value: "filtro_biologico", label: "Filtro Biológico" },
  { value: "sem_tratamento", label: "Sem Tratamento (irregular)" },
  { value: "outro", label: "Outro" },
];

export const CLASSIFICACOES = [
  { value: "classe_I", label: "Classe I — Perigoso" },
  { value: "classe_II_A", label: "Classe II-A — Não Inerte" },
  { value: "classe_II_B", label: "Classe II-B — Inerte" },
];

export const MOTIVOS_DESCARTE = [
  { value: "vencido", label: "Produto Vencido" },
  { value: "rejeitado_recebimento", label: "Rejeitado no Recebimento" },
  { value: "reprovado_analise", label: "Reprovado em Análise" },
  { value: "contaminado", label: "Contaminação / Avaria" },
  { value: "sobra_producao", label: "Sobra de Produção (s/ aproveitamento)" },
  { value: "recall", label: "Recolhimento / Recall" },
  { value: "outro", label: "Outro" },
];
