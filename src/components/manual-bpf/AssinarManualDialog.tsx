import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, KeyRound, Lock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type PapelAssinatura = "rt" | "legal";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  manualId: string;
  manualTitulo: string;
  versao: number;
  papel: PapelAssinatura;
  empresaId: string | null;
  /** texto completo do manual — entra no hash da assinatura */
  conteudo: string;
  onSuccess: () => void;
}

async function sha256Hex(text: string): Promise<string> {
  const buf = new TextEncoder().encode(text);
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const labels: Record<PapelAssinatura, { titulo: string; nomeLabel: string; extraLabel?: string }> = {
  rt: { titulo: "Assinatura do Responsável Técnico", nomeLabel: "Nome completo do RT", extraLabel: "CRMV" },
  legal: { titulo: "Assinatura do Responsável Legal", nomeLabel: "Nome completo do Responsável Legal" },
};

export function AssinarManualDialog({
  open,
  onOpenChange,
  manualId,
  manualTitulo,
  versao,
  papel,
  empresaId,
  conteudo,
  onSuccess,
}: Props) {
  const { user } = useAuth();
  const cfg = labels[papel];
  const [nome, setNome] = useState("");
  const [crmv, setCrmv] = useState("");
  const [pin, setPin] = useState("");
  const [senha, setSenha] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setNome("");
    setCrmv("");
    setPin("");
    setSenha("");
  };

  const handleAssinar = async () => {
    if (!user?.email) {
      toast.error("Sessão inválida");
      return;
    }
    if (!nome.trim()) {
      toast.error("Informe o nome completo");
      return;
    }
    if (papel === "rt" && !crmv.trim()) {
      toast.error("Informe o CRMV");
      return;
    }
    if (pin.length < 4) {
      toast.error("PIN inválido");
      return;
    }
    if (senha.length < 6) {
      toast.error("Senha de login inválida");
      return;
    }

    setSaving(true);
    try {
      // 1) Reautentica usuário com a senha (garante que é o titular logado)
      const { error: authErr } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: senha,
      });
      if (authErr) {
        toast.error("Senha de login incorreta");
        setSaving(false);
        return;
      }

      // 2) Valida PIN da empresa
      if (empresaId) {
        const pinHash = await sha256Hex(pin);
        const { data: pinRow } = await supabase
          .from("empresa_pin")
          .select("pin_hash")
          .eq("empresa_id", empresaId)
          .maybeSingle();
        if (!pinRow) {
          toast.error("PIN da empresa não configurado. Acesse /configurar-pin.");
          setSaving(false);
          return;
        }
        if (pinRow.pin_hash !== pinHash) {
          toast.error("PIN da empresa incorreto");
          setSaving(false);
          return;
        }
      }

      // 3) Gera hash da assinatura (pin + conteúdo + papel + timestamp)
      const ts = new Date().toISOString();
      const hashAssinatura = await sha256Hex(`${papel}|${nome}|${crmv}|${user.id}|${conteudo}|${ts}`);

      // 4) Lê estado atual do manual para definir status final
      const { data: atual, error: getErr } = await supabase
        .from("manuais_bpf")
        .select("status, resp_legal_assinado_em, resp_tecnico_assinado_em")
        .eq("id", manualId)
        .maybeSingle();
      if (getErr || !atual) throw getErr || new Error("Manual não encontrado");

      const update: any = {};
      if (papel === "rt") {
        update.resp_tecnico_nome = nome;
        update.resp_tecnico_crmv = crmv;
        update.resp_tecnico_hash = hashAssinatura;
        update.resp_tecnico_assinado_em = ts;
        update.resp_tecnico_user_id = user.id;
      } else {
        update.resp_legal_nome = nome;
        update.resp_legal_hash = hashAssinatura;
        update.resp_legal_assinado_em = ts;
        update.resp_legal_user_id = user.id;
      }

      const temRT = papel === "rt" || !!atual.resp_tecnico_assinado_em;
      const temLegal = papel === "legal" || !!atual.resp_legal_assinado_em;
      if (temRT && temLegal) update.status = "vigente";
      else if (temRT) update.status = "aguardando_legal";
      else update.status = "aguardando_rt";

      const { error: upErr } = await supabase.from("manuais_bpf").update(update).eq("id", manualId);
      if (upErr) throw upErr;

      toast.success(
        update.status === "vigente"
          ? "Manual assinado por ambos os responsáveis e marcado como VIGENTE!"
          : "Assinatura registrada. Aguardando segunda assinatura.",
      );
      reset();
      onOpenChange(false);
      onSuccess();
    } catch (err: any) {
      toast.error("Erro ao assinar: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) reset();
        onOpenChange(v);
      }}
    >
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {cfg.titulo}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{manualTitulo}</span> — versão {versao}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription className="text-xs">
            Esta assinatura será registrada com SHA-256, identificação do responsável, data/hora e ID do usuário logado.
            O manual só se torna <strong>vigente</strong> após as duas assinaturas (RT + Resp. Legal).
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <Label>{cfg.nomeLabel} *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome completo" />
          </div>

          {papel === "rt" && (
            <div>
              <Label>{cfg.extraLabel} *</Label>
              <Input value={crmv} onChange={(e) => setCrmv(e.target.value)} placeholder="Ex: CRMV-SP 12345" />
            </div>
          )}

          <div>
            <Label className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" /> PIN da empresa *
            </Label>
            <Input
              type="password"
              inputMode="numeric"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="••••"
              autoComplete="off"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <Lock className="w-3.5 h-3.5" /> Senha da sua conta *
            </Label>
            <Input
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="Senha de login"
              autoComplete="current-password"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Reautenticação obrigatória para confirmar a identidade do signatário.
            </p>
          </div>

          <Button onClick={handleAssinar} disabled={saving} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar e Assinar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
