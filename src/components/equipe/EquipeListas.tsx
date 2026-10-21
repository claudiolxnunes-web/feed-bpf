import { UserMinus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PapelSelect, PAPEIS } from "./PapelSelect";
import type { Database } from "@/integrations/supabase/types";
import type { PapelEmpresa } from "@/lib/empresa-permissions";

type Membro = Database["public"]["Functions"]["listar_membros_empresa"]["Returns"][number];
type Convite = Pick<Database["public"]["Tables"]["convites_empresa"]["Row"], "id" | "email" | "papel" | "expira_em">;
export function EquipeListas({ membros, convites, donoId, userId, pending, onRole, onDeactivate, onCancel }: {
  membros: Membro[]; convites: Convite[]; donoId: string; userId?: string; pending: boolean;
  onRole: (id: string, papel: PapelEmpresa) => void; onDeactivate: (id: string) => void; onCancel: (id: string) => void;
}) {
  return <div className="space-y-8">
    <section className="space-y-3"><h2 className="font-display text-lg font-semibold">Membros <span className="text-muted-foreground">({membros.length})</span></h2>
      {!membros.length && <p className="text-muted-foreground">Nenhum membro encontrado.</p>}
      <ul className="divide-y divide-border">{membros.map((membro) => {
        const protegido = membro.user_id === donoId || membro.user_id === userId;
        return <li key={membro.id} className="grid items-center gap-3 py-4 sm:grid-cols-[1fr_240px_auto]">
          <div className="min-w-0"><p className="font-medium break-words">{membro.nome || membro.email || "Membro"}{membro.user_id === donoId && <Badge variant="outline" className="ml-2">Dono</Badge>}</p><p className="break-all text-sm text-muted-foreground">{membro.email}</p><Badge variant={membro.ativo ? "secondary" : "outline"} className="mt-2">{membro.ativo ? "Ativo" : "Inativo"}</Badge></div>
          <PapelSelect value={membro.papel} disabled={pending || protegido} label={`Papel de ${membro.nome || membro.email}`} onChange={(papel) => onRole(membro.id, papel)} />
          <Button variant="outline" size="icon" disabled={pending || protegido || !membro.ativo} title="Desativar membro" aria-label={`Desativar ${membro.nome || membro.email}`} onClick={() => onDeactivate(membro.id)}><UserMinus aria-hidden="true" /></Button>
        </li>;
      })}</ul>
    </section>
    <section className="space-y-3"><h2 className="font-display text-lg font-semibold">Convites pendentes <span className="text-muted-foreground">({convites.length})</span></h2>
      {!convites.length && <p className="text-muted-foreground">Nenhum convite pendente.</p>}
      <ul className="divide-y divide-border">{convites.map((convite) => <li key={convite.id} className="flex items-center justify-between gap-3 py-4">
        <div className="min-w-0"><p className="font-medium break-all">{convite.email}</p><p className="text-sm text-muted-foreground">{PAPEIS[convite.papel]} · Válido até {new Date(convite.expira_em).toLocaleDateString("pt-BR")}</p></div>
        <Button variant="outline" size="icon" disabled={pending} title="Cancelar convite" aria-label={`Cancelar convite para ${convite.email}`} onClick={() => onCancel(convite.id)}><X aria-hidden="true" /></Button>
      </li>)}</ul>
    </section>
  </div>;
}