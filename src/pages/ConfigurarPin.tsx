import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { sha256 } from "@/utils/carimboHash";
import PageHeader from "@/components/PageHeader";

export default function ConfigurarPin() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [pin, setPin] = useState("");
  const [pinConfirma, setPinConfirma] = useState("");
  const [saving, setSaving] = useState(false);
  const [jaExiste, setJaExiste] = useState(false);

  useEffect(() => {
    if (!empresaAtiva?.id) return;
    supabase
      .from("empresa_pin")
      .select("id")
      .eq("empresa_id", empresaAtiva.id)
      .maybeSingle()
      .then(({ data }) => setJaExiste(!!data));
  }, [empresaAtiva?.id]);

  const salvar = async () => {
    if (!user || !empresaAtiva?.id) {
      toast({ title: "Selecione uma empresa", variant: "destructive" });
      return;
    }
    if (pin.length < 4 || pin.length > 10) {
      toast({ title: "PIN deve ter entre 4 e 10 dígitos", variant: "destructive" });
      return;
    }
    if (pin !== pinConfirma) {
      toast({ title: "PINs não conferem", variant: "destructive" });
      return;
    }

    setSaving(true);
    const pin_hash = await sha256(`${empresaAtiva.id}:${pin}`);

    const { error } = await supabase
      .from("empresa_pin")
      .upsert(
        { empresa_id: empresaAtiva.id, user_id: user.id, pin_hash },
        { onConflict: "empresa_id" }
      );

    setSaving(false);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "✅ PIN configurado",
      description: "Compartilhe o PIN apenas com operadores autorizados.",
    });
    setPin("");
    setPinConfirma("");
    setJaExiste(true);
  };

  return (
    <div className="container mx-auto max-w-2xl py-6">
      <PageHeader
        title="Configurar PIN da Empresa"
        description="PIN único usado pelos operadores no Modo Chão de Fábrica para registrar execuções com selo antifraude."
        icon={Lock}
      />

      <Link to="/modo-tablet">
        <Button variant="ghost" size="sm" className="mb-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Chão de Fábrica
        </Button>
      </Link>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-sm flex gap-2">
            <ShieldCheck className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Como funciona</p>
              <p className="text-muted-foreground mt-1">
                Defina um PIN de 4 a 10 dígitos. Os operadores digitam <strong>nome + este PIN</strong> ao registrar
 cada execução de POP/IT. O sistema gera selo SHA-256 imutável.
 </p>
            </div>
          </div>

          {jaExiste && (
            <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm">
              ⚠️ Já existe um PIN ativo para esta empresa. Definir um novo PIN substituirá o anterior.
            </div>
          )}

          <div>
            <Label className="text-base">Novo PIN (4 a 10 dígitos) *</Label>
            <Input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 10))}
              type="password"
              inputMode="numeric"
              className="text-lg h-12 mt-1 tracking-widest"
              placeholder="••••"
            />
          </div>

          <div>
            <Label className="text-base">Confirmar PIN *</Label>
            <Input
              value={pinConfirma}
              onChange={(e) => setPinConfirma(e.target.value.replace(/\D/g, "").slice(0, 10))}
              type="password"
              inputMode="numeric"
              className="text-lg h-12 mt-1 tracking-widest"
              placeholder="••••"
            />
          </div>

          <Button
            onClick={salvar}
            disabled={saving || !pin || !pinConfirma}
            className="w-full h-12"
            size="lg"
          >
            {saving ? "Salvando..." : jaExiste ? "Substituir PIN" : "Salvar PIN"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
