// ============================================================================
// Diálogo de preenchimento de uma IT
//
// Fluxo: escolher a IT → o formulário do modelo é carregado de `modelos_bpf`
// já com os valores sugeridos → operador preenche → grava em `execucao_pops`.
// ============================================================================

import { useEffect, useState } from "react";
import { ClipboardCheck, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { FormularioIt } from "@/components/documentos/FormularioIt";
import { valoresIniciais, type ValoresModelo } from "@/lib/importadorIts";
import {
  carregarModeloIt,
  listarModelosDaEmpresa,
  salvarExecucaoIt,
  type ModeloItPersistido,
} from "@/lib/registrosIt";

interface Props {
  onSalvo?: () => void;
}

export function PreencherItDialog({ onSalvo }: Props) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();

  const [open, setOpen] = useState(false);
  const [lista, setLista] = useState<
    { id: string; it_codigo: string; pop_codigo: string | null; titulo: string }[]
  >([]);
  const [itCodigo, setItCodigo] = useState("");
  const [modelo, setModelo] = useState<ModeloItPersistido | null>(null);
  const [valores, setValores] = useState<ValoresModelo>({});
  const [pendentes, setPendentes] = useState<string[]>([]);
  const [executor, setExecutor] = useState("");
  const [setor, setSetor] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!open || !empresaAtiva) return;
    listarModelosDaEmpresa(empresaAtiva.id).then(setLista);
  }, [open, empresaAtiva]);

  const escolherIt = async (codigo: string) => {
    setItCodigo(codigo);
    setPendentes([]);
    if (!empresaAtiva) return;
    setCarregando(true);
    const m = await carregarModeloIt(empresaAtiva.id, codigo);
    setModelo(m);
    // Nasce com os valores sugeridos do modelo, editáveis.
    setValores(m ? valoresIniciais(m) : {});
    setCarregando(false);
  };

  const limpar = () => {
    setItCodigo(""); setModelo(null); setValores({}); setPendentes([]);
    setExecutor(""); setSetor(""); setObservacoes("");
  };

  const salvar = async (status: "concluido" | "rascunho") => {
    if (!modelo || !user) return;
    if (!executor.trim()) {
      toast.error("Informe quem executou.");
      return;
    }
    setSalvando(true);
    const r = await salvarExecucaoIt({
      modelo,
      valores,
      empresaId: empresaAtiva?.id || null,
      userId: user.id,
      executor: executor.trim(),
      setor,
      observacoes,
      status,
    });
    setSalvando(false);

    if (!r.ok) {
      if (r.pendentes?.length) {
        setPendentes(r.pendentes.map((p) => p.chave));
        toast.error(
          `Faltam ${r.pendentes.length} campo(s) obrigatório(s). O primeiro: ${r.pendentes[0].rotulo}`,
        );
      } else {
        toast.error(`Erro ao salvar: ${r.erro}`);
      }
      return;
    }

    toast.success(
      status === "concluido" ? "Execução registrada!" : "Rascunho salvo.",
    );
    setOpen(false);
    limpar();
    onSalvo?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) limpar();
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <ClipboardCheck className="w-4 h-4 mr-1" /> Preencher IT
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Preencher Instrução de Trabalho</DialogTitle>
        </DialogHeader>

        {!empresaAtiva ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            Selecione uma empresa ativa para preencher uma IT.
          </p>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Instrução de Trabalho</Label>
              <Select value={itCodigo} onValueChange={escolherIt}>
                <SelectTrigger className="h-12">
                  <SelectValue placeholder="Selecione a IT a executar" />
                </SelectTrigger>
                <SelectContent>
                  {lista.map((m) => (
                    <SelectItem key={m.id} value={m.it_codigo} className="h-12">
                      <span className="font-mono text-xs mr-2">{m.it_codigo}</span>
                      {m.titulo}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {lista.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Nenhum modelo importado para esta empresa. Use "Importar modelos de IT"
                  na tela de Documentos.
                </p>
              )}
            </div>

            {carregando && (
              <div className="flex justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              </div>
            )}

            {modelo && !carregando && (
              <>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Executado por <span className="text-destructive">*</span></Label>
                    <Input
                      className="h-12"
                      value={executor}
                      onChange={(e) => setExecutor(e.target.value)}
                      placeholder="Nome do operador"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Setor</Label>
                    <Input
                      className="h-12"
                      value={setor}
                      onChange={(e) => setSetor(e.target.value)}
                      placeholder="Ex: Moagem"
                    />
                  </div>
                </div>

                <FormularioIt
                  modelo={modelo}
                  valores={valores}
                  onChange={setValores}
                  pendentes={pendentes}
                  disabled={salvando}
                />

                <div className="space-y-1.5">
                  <Label>Observações gerais</Label>
                  <Textarea
                    rows={2}
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    className="flex-1 h-12"
                    disabled={salvando}
                    onClick={() => salvar("concluido")}
                  >
                    {salvando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Registrar execução
                  </Button>
                  <Button
                    variant="outline"
                    className="h-12"
                    disabled={salvando}
                    onClick={() => salvar("rascunho")}
                  >
                    Salvar rascunho
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Rascunho não valida campos obrigatórios. "Registrar execução" só grava
                  com tudo preenchido — registro incompleto marcado como concluído passa
                  falsa impressão de conformidade em auditoria.
                </p>
              </>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default PreencherItDialog;
