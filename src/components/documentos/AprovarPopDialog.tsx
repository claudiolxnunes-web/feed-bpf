import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { WorkflowStatus } from "./WorkflowBadge";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  documentoId: string;
  documentoNome: string;
  versao: string;
  novoStatus: Exclude<WorkflowStatus, "rascunho">;
  onSuccess: () => void;
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const labelStatus: Record<Props["novoStatus"], string> = {
  em_revisao: "Enviar para Revisão",
  vigente: "Aprovar como Vigente",
  obsoleto: "Marcar como Obsoleto",
};

export function AprovarPopDialog({
  open,
  onOpenChange,
  documentoId,
  documentoNome,
  versao,
  novoStatus,
  onSuccess,
}: Props) {
  const [pin, setPin] = useState("");
  const [nomeRT, setNomeRT] = useState("");
  const [motivo, setMotivo] = useState("");
  const [saving, setSaving] = useState(false);

  const handleAprovar = async () => {
    if (!nomeRT.trim()) {
      toast.error("Informe o nome do Responsável Técnico");
      return;
    }
    if (pin.length < 4) {
      toast.error("PIN inválido");
      return;
    }

    setSaving(true);
    try {
      const pinHash = await sha256(pin);
      const { data, error } = await (supabase.rpc as any)("aprovar_documento_pop", {
        _documento_id: documentoId,
        _pin_hash: pinHash,
        _aprovador_nome: nomeRT,
        _novo_status: novoStatus,
        _motivo: motivo || null,
        _ip: null,
        _user_agent: navigator.userAgent.slice(0, 200),
      });

      if (error) throw error;
      const result = data as { ok: boolean; error?: string; hash?: string };
      if (!result.ok) {
        toast.error(result.error || "Falha na aprovação");
        return;
      }

      toast.success(`Documento ${novoStatus === "vigente" ? "aprovado" : "atualizado"}!`, {
        description: `Hash: ${result.hash?.slice(0, 16)}...`,
      });
      setPin("");
      setNomeRT("");
      setMotivo("");
      onOpenChange(false);
      onSuccess();
    } catch (e: any) {
      toast.error(e.message || "Erro ao aprovar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            {labelStatus[novoStatus]}
          </DialogTitle>
          <DialogDescription>
            <span className="font-medium">{documentoNome}</span> — versão {versao}
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertDescription className="text-xs">
            Esta ação será registrada com assinatura digital SHA-256, identificação do RT, data/hora e IP.
            {novoStatus === "vigente" && " A versão anterior será automaticamente marcada como obsoleta."}
          </AlertDescription>
        </Alert>

        <div className="space-y-3">
          <div>
            <Label>Nome do Responsável Técnico *</Label>
            <Input
              value={nomeRT}
              onChange={(e) => setNomeRT(e.target.value)}
              placeholder="Ex: Dr. João Silva — CRMV-SP 12345"
            />
          </div>

          <div>
            <Label className="flex items-center gap-1">
              <KeyRound className="w-3.5 h-3.5" /> PIN da Empresa *
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
            <p className="text-xs text-muted-foreground mt-1">Configure em /configurar-pin se ainda não tiver.</p>
          </div>

          <div>
            <Label>{novoStatus === "obsoleto" ? "Motivo da obsolescência" : "Motivo / Justificativa"}</Label>
            <Textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={2}
              placeholder="Ex: Atualização para conformidade com"
            />
          </div>

          <Button onClick={handleAprovar} disabled={saving || !pin || !nomeRT} className="w-full">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Confirmar e Assinar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
