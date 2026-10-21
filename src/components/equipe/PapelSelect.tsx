import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PapelEmpresa } from "@/lib/empresa-permissions";

export const PAPEIS: Record<PapelEmpresa, string> = {
  admin: "Admin", rt: "RT", operador: "Operador", visualizador: "Visualizador (somente leitura)",
};
export function PapelSelect({ value, onChange, disabled, label = "Papel" }: {
  value: PapelEmpresa; onChange: (value: PapelEmpresa) => void; disabled?: boolean; label?: string;
}) {
  return <Select value={value} onValueChange={(next) => {
    if (next === "admin" || next === "rt" || next === "operador" || next === "visualizador") onChange(next);
  }} disabled={disabled}>
    <SelectTrigger aria-label={label} className="w-full min-w-0"><SelectValue /></SelectTrigger>
    <SelectContent>{Object.entries(PAPEIS).map(([key, title]) => <SelectItem key={key} value={key}>{title}</SelectItem>)}</SelectContent>
  </Select>;
}