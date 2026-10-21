import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { getBaseLegal } from "@/config/baseLegal";
import { toast } from "sonner";
import { podeLiberarOrdemMedicada, receitaValida, programaVigente } from "./regras";

export interface VinculoMedicadoOrdemProps {
  ordemId: string;
  empresaId: string | null;
  receitaId: string | null;
  programaId: string | null;
  onChange: () => void;
}

const NENHUM = "__nenhum__";

/** Vincula receita válida ou programa sanitário vigente a uma ordem medicada. */
export function VinculoMedicadoOrdem({ ordemId, empresaId, receitaId, programaId, onChange }: VinculoMedicadoOrdemProps) {
  const [receitas, setReceitas] = useState<any[]>([]);
  const [programas, setProgramas] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      let r = supabase.from("receitas_medicados").select("id, numero, cliente, status, data_emissao, validade");
      let p = supabase.from("programas_sanitarios").select("id, nome, cliente, status, data_ultima_revisao");
      if (empresaId) { r = r.eq("empresa_id", empresaId); p = p.eq("empresa_id", empresaId); }
      const [rr, pp] = await Promise.all([r, p]);
      setReceitas(rr.data ?? []);
      setProgramas(pp.data ?? []);
    })();
  }, [empresaId]);

  const receita = receitas.find((x) => x.id === receitaId);
  const programa = programas.find((x) => x.id === programaId);
  const ok = podeLiberarOrdemMedicada(true, receita, programa);

  const salvar = async (campo: "receita_medicado_id" | "programa_sanitario_id", v: string) => {
    const valor = v === NENHUM ? null : v;
    const payload = campo === "receita_medicado_id" ? { receita_medicado_id: valor } : { programa_sanitario_id: valor };
    const { error } = await supabase.from("ordens_producao").update(payload).eq("id", ordemId);
    if (error) toast.error("Erro: " + error.message); else onChange();
  };

  return (
    <div className={`p-3 rounded-lg border text-xs space-y-2 ${ok ? "border-primary/30 bg-primary/5" : "border-destructive/40 bg-destructive/10"}`} onClick={(e) => e.stopPropagation()}>
      <p className="font-semibold flex items-center gap-1">
        {ok ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <AlertTriangle className="w-4 h-4 text-destructive" />}
        Fórmula medicada — {getBaseLegal("alimentos_medicados").citacao}
      </p>
      {!ok && <p role="alert" className="text-destructive">Vincule uma receita válida ou um programa sanitário vigente. Sem isso a ordem não pode ser liberada para produção.</p>}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
        <Select value={receitaId ?? NENHUM} onValueChange={(v) => salvar("receita_medicado_id", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Receita" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NENHUM}>Sem receita</SelectItem>
            {receitas.map((r) => <SelectItem key={r.id} value={r.id} disabled={!receitaValida(r)}>Receita {r.numero} — {r.cliente}{receitaValida(r) ? "" : " (vencida)"}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={programaId ?? NENHUM} onValueChange={(v) => salvar("programa_sanitario_id", v)}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Programa sanitário" /></SelectTrigger>
          <SelectContent>
            <SelectItem value={NENHUM}>Sem programa</SelectItem>
            {programas.map((p) => <SelectItem key={p.id} value={p.id} disabled={!programaVigente(p)}>{p.nome} — {p.cliente}{programaVigente(p) ? "" : " (revisão vencida)"}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
