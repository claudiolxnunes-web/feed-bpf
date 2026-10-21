
export const statusConfig: Record<string, { label: string; className: string }> = {
  programada: { label: "Programada", className: "bg-muted text-muted-foreground" },
  em_producao: { label: "Em Produção", className: "bg-info/20 text-info" },
  concluida: { label: "Concluída", className: "bg-primary/20 text-primary" },
  cancelada: { label: "Cancelada", className: "bg-destructive/20 text-destructive" },
};

export const prioridadeConfig: Record<string, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-primary/20 text-primary" },
  alta: { label: "Alta", className: "bg-yellow-500/20 text-yellow-700" },
  urgente: { label: "Urgente", className: "bg-destructive/20 text-destructive" },
};
