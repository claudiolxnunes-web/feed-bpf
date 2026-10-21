
export interface RecallStep {
  id: string;
  label: string;
  descricao: string;
  concluido: boolean;
  horaInicio?: string;
  horaFim?: string;
}

export const ETAPAS_RECALL: Omit<RecallStep, "concluido" | "horaInicio" | "horaFim">[] = [
  { id: "1", label: "Identificação do Problema", descricao: "Detectar o lote/produto com problema e registrar a não conformidade" },
  { id: "2", label: "Comunicação Interna", descricao: "Notificar RT, gerência e equipe de qualidade sobre o recall" },
  { id: "3", label: "Rastreabilidade Reversa", descricao: "Identificar todos os lotes afetados, matérias-primas e fornecedores envolvidos" },
  { id: "4", label: "Rastreabilidade Direta", descricao: "Localizar os clientes/destinos que receberam o produto afetado" },
  { id: "5", label: "Notificação ao MAPA/SIF", descricao: "Comunicar oficialmente ao órgão competente (simulado)" },
  { id: "6", label: "Notificação aos Clientes", descricao: "Entrar em contato com todos os destinatários do produto" },
  { id: "7", label: "Recolhimento Físico", descricao: "Iniciar a logística reversa para recuperação dos produtos" },
  { id: "8", label: "Segregação e Destinação", descricao: "Segregar produtos recolhidos e definir destino (destruição, reprocesso, etc.)" },
  { id: "9", label: "Registro e Relatório", descricao: "Documentar todo o exercício e gerar relatório final com tempos" },
  { id: "10", label: "Ação Corretiva", descricao: "Definir ações para evitar recorrência e atualizar procedimentos" },
];
