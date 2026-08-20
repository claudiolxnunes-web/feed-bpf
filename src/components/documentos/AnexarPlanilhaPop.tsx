import { useEffect, useState } from "react";
import { Paperclip, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import {
  TIPOS_DOC,
  type TipoDoc,
  nomeDisplay,
  nomeArquivoFinal,
  formatNumero,
} from "@/utils/nomenclaturaDoc";
import { SeletorItFrequencia } from "@/components/SeletorItFrequencia";
import { uploadArquivoBpf } from "@/lib/bpfStorage";

interface Props {
  popCodigo: string;         // ex: "POP-07"
  popNome?: string;          // ex: "Controle de Pragas"
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "sm" | "default" | "lg";
  label?: string;
}

/**
 * Botão reutilizável de anexação de documentos vinculados ao POP do módulo.
 * Padrão de nomenclatura: POP-01_PL-001_08-07-2026.pdf
 * Pasta no storage: bpf/{empresa|user}/POP-01/PL/...
 */
export function AnexarPlanilhaPop({
  popCodigo,
  popNome,
  variant = "outline",
  size = "sm",
  label = "Anexar planilha preenchida",
}: Props) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [open, setOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoDoc>("PL");
  const [numero, setNumero] = useState<string>("001");
  const [dataRef, setDataRef] = useState<string>(new Date().toISOString().split("T")[0]);
  const [descricao, setDescricao] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [itCodigo, setItCodigo] = useState("");
  const [frequencia, setFrequencia] = useState("");

  // Sugere próximo número disponível ao abrir ou trocar tipo
  const sugerirProximoNumero = async () => {
    if (!user) return;
    try {
      let q = supabase
        .from("arquivos_bpf")
        .select("numero_doc")
        .eq("pop_codigo", popCodigo)
        .eq("tipo_doc", tipo)
        .order("numero_doc", { ascending: false })
        .limit(1);
      if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
      else q = q.eq("user_id", user.id);
      const { data } = await q;
      const max = (data?.[0] as any)?.numero_doc ?? 0;
      setNumero(formatNumero(max + 1));
    } catch {
      setNumero("001");
    }
  };

  useEffect(() => {
    if (open) sugerirProximoNumero();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, tipo]);

  const reset = () => {
    setTipo("PL"); setNumero("001"); setDataRef(new Date().toISOString().split("T")[0]);
    setDescricao(""); setFile(null);
    setItCodigo(""); setFrequencia("");
  };

  const tipoLabel = TIPOS_DOC.find((t) => t.value === tipo)?.label || tipo;
  const prefixo = empresaAtiva?.prefixo_doc || "";
  const preview = nomeDisplay(popCodigo, tipo, numero, dataRef, prefixo);
  const arquivoFinal = file ? nomeArquivoFinal(popCodigo, tipo, numero, dataRef, file.name, prefixo) : "";

  const handleUpload = async () => {
    if (!user || !file || !numero.trim() || !dataRef) {
      toast.error("Preencha tipo, número, data e selecione um arquivo");
      return;
    }
    setSaving(true);
    try {
      const scopeId = empresaAtiva?.id || user.id;
      const titulo = nomeDisplay(popCodigo, tipo, numero, dataRef, prefixo);
      const numeroInt = parseInt(numero, 10) || 0;

      const resultado = await uploadArquivoBpf({
        file,
        meta: {
          empresaId: scopeId,
          popCodigo,
          itCodigo: itCodigo || null,
          frequencia: frequencia || null,
          dataRef,
        },
        registro: {
          user_id: user.id,
          empresa_id: empresaAtiva?.id || null,
          titulo,
          categoria: tipo.toLowerCase(),
          descricao: descricao || null,
          arquivo_nome: arquivoFinal,
          pop_codigo: popCodigo,
          tipo_doc: tipo,
          numero_doc: numeroInt,
          data_ref: dataRef,
          nome_padronizado: arquivoFinal.replace(/\.[^.]+$/, ""),
        },
      });

      if (!resultado.ok) {
        toast.error(
          resultado.revertido
            ? `Erro ao salvar registro: ${resultado.erro}. O upload foi desfeito.`
            : `Erro no upload: ${resultado.erro}`,
        );
      } else {
        toast.success(`Anexado: ${titulo}`);
        setOpen(false);
        reset();
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size}>
          <Paperclip className="w-4 h-4 mr-2" />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Anexar documento
            <Badge className="font-mono">{popCodigo}</Badge>
          </DialogTitle>
          {popNome && <p className="text-xs text-muted-foreground">{popNome}</p>}
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo *</Label>
              <Select value={tipo} onValueChange={(v) => setTipo(v as TipoDoc)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_DOC.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Número *</Label>
              <Input
                value={numero}
                onChange={(e) => setNumero(e.target.value.replace(/\D/g, "").slice(0, 4))}
                onBlur={() => setNumero((n) => formatNumero(n))}
                placeholder="001"
                inputMode="numeric"
              />
            </div>
          </div>
          <div>
            <Label>Data de referência *</Label>
            <Input type="date" value={dataRef} onChange={(e) => setDataRef(e.target.value)} />
          </div>
          <SeletorItFrequencia
            popCodigo={popCodigo}
            itCodigo={itCodigo}
            onItChange={setItCodigo}
            frequencia={frequencia}
            onFrequenciaChange={setFrequencia}
          />
          <div>
            <Label>Descrição (opcional)</Label>
            <Textarea
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              rows={2}
              placeholder="Observações, período de referência, etc."
            />
          </div>
          <div>
            <Label>Arquivo * (PDF, imagem, Excel)</Label>
            <Input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </div>

          <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
            <div className="text-muted-foreground">Nome que aparecerá no acervo:</div>
            <div className="font-mono font-medium text-foreground">{preview}</div>
            {arquivoFinal && (
              <>
                <div className="text-muted-foreground pt-1">Arquivo salvo como:</div>
                <div className="font-mono text-[11px] break-all text-foreground">{arquivoFinal}</div>
              </>
            )}
            <div className="text-muted-foreground pt-1">
              Vinculado a <strong>{popCodigo}</strong> · Tipo <strong>{tipoLabel}</strong>
            </div>
          </div>

          <Button className="w-full" onClick={handleUpload} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Anexar ao {popCodigo}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default AnexarPlanilhaPop;
