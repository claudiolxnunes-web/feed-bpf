
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

export const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  aprovado: { label: "Aprovado", color: "bg-primary text-primary-foreground", icon: CheckCircle2 },
  aprovado_com_restricoes: { label: "Aprovado c/ Restrições", color: "bg-yellow-600/20 text-yellow-700", icon: CheckCircle2 },
  pendente: { label: "Pendente", color: "bg-accent text-accent-foreground", icon: Clock },
  reprovado: { label: "Reprovado", color: "bg-destructive text-destructive-foreground", icon: AlertCircle },
  em_avaliacao: { label: "Em Avaliação", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
};

export const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];
