import { useState } from "react";
import { z } from "zod";
import { Copy, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PapelSelect } from "./PapelSelect";
import { copiarLink, linkConvite } from "@/lib/equipe";
import type { PapelEmpresa } from "@/lib/empresa-permissions";

export function ConviteForm({ pending, onInvite }: {
  pending: boolean; onInvite: (email: string, papel: PapelEmpresa) => Promise<{ token?: string }>;
}) {
  const [email, setEmail] = useState("");
  const [papel, setPapel] = useState<PapelEmpresa>("operador");
  const [link, setLink] = useState("");
  return <section className="space-y-4 border-b border-border pb-6">
    <h2 className="font-display text-lg font-semibold">Convidar pessoa</h2>
    <form className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]" onSubmit={async (event) => {
      event.preventDefault();
      const parsed = z.string().trim().email("Informe um e-mail válido.").safeParse(email);
      if (!parsed.success) { toast.error(parsed.error.issues[0]?.message); return; }
      try {
        setLink("");
        const result = await onInvite(parsed.data, papel);
        if (!result.token) throw new Error("O convite não retornou um link.");
        setLink(linkConvite(result.token));
        setEmail(""); toast.success("Convite criado.");
      } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível criar o convite."); }
    }}>
      <div className="space-y-2"><Label htmlFor="convite-email">E-mail</Label><Input id="convite-email" type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} disabled={pending} /></div>
      <div className="space-y-2"><Label>Papel</Label><PapelSelect value={papel} onChange={setPapel} disabled={pending} label="Papel do convite" /></div>
      <Button className="self-end" type="submit" disabled={pending}><UserPlus aria-hidden="true" />{pending ? "Aguarde…" : "Criar convite"}</Button>
    </form>
    {link && <div className="space-y-2">
      <Label htmlFor="convite-link">Link do convite</Label>
      <div className="flex flex-wrap gap-2"><Input id="convite-link" readOnly value={link} className="min-w-0 flex-1" /><Button variant="outline" onClick={async () => {
        try { await copiarLink(link); toast.success("Link copiado."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível copiar."); }
      }}><Copy aria-hidden="true" />Copiar link</Button></div>
      <p className="text-sm text-muted-foreground">Envie este link à pessoa convidada. Ela deve entrar com o e-mail informado. Válido por 7 dias.</p>
    </div>}
  </section>;
}