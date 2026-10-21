
export const EQUIPAMENTOS_CRITICOS = [
  { nome: "Moinho de Martelos", codigo: "MM", pecas: ["Martelos", "Peneiras", "Rolamentos", "Correias"] },
  { nome: "Misturador Horizontal", codigo: "MH", pecas: ["Pás/Ribbons", "Rolamentos", "Retentores", "Correias", "Porta de descarga"] },
  { nome: "Misturador Vertical", codigo: "MV", pecas: ["Rosca helicoidal", "Rolamentos", "Retentores"] },
  { nome: "Peletizadora", codigo: "PL", pecas: ["Matriz", "Rolos", "Rolamentos", "Facas de corte", "Correias"] },
  { nome: "Extrusora", codigo: "EX", pecas: ["Rosca", "Camisas", "Matriz", "Facas", "Rolamentos"] },
  { nome: "Ensacadeira", codigo: "EN", pecas: ["Bicos dosadores", "Esteira", "Seladora", "Correias"] },
  { nome: "Transportador Helicoidal", codigo: "TH", pecas: ["Helicoide", "Rolamentos", "Mancais"] },
  { nome: "Elevador de Canecas", codigo: "EC", pecas: ["Canecas", "Correia/Corrente", "Rolamentos", "Tambor"] },
  { nome: "Dosador/Balança", codigo: "DB", pecas: ["Célula de carga", "Comportas", "Atuadores"] },
  { nome: "Secador/Resfriador", codigo: "SR", pecas: ["Telas", "Ventiladores", "Rolamentos", "Correias"] },
];

export const TIPOS = [
  { value: "preventiva", label: "Preventiva" },
  { value: "corretiva", label: "Corretiva" },
  { value: "preditiva", label: "Preditiva" },
];

export const STATUS_LIST = [
  { value: "programada", label: "Programada" },
  { value: "em_execucao", label: "Em Execução" },
  { value: "concluida", label: "Concluída" },
  { value: "atrasada", label: "Atrasada" },
];
