import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Layers, Plus, Trash2, FileSignature, Loader2, Pencil, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { POPS_CUSTOM, type CampoModelo, type CampoTipo } from "@/config/feedBpfCustomConfig";
import { toast } from "sonner";
import { importarTemplateManualBPF } from "@/utils/importarTemplateManual";
import { Book } from "lucide-react";

interface Modelo {
  id: string;
  nome: string;
  descricao: string | null;
  pop_codigo: string | null;
  campos: CampoModelo[];
  ativo: boolean;
  created_at: string;
}

const TIPOS: { v: CampoTipo; l: string }[] = [
  { v: "texto", l: "Texto curto" },
  { v: "textarea", l: "Texto longo" },
  { v: "numero", l: "Número" },
  { v: "data", l: "Data" },
  { v: "checkbox", l: "Sim/Não" },
  { v: "select", l: "Lista de opções" },
];

export default function MeusModelos() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const empresaId = empresaAtiva?.id;
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editando, setEditando] = useState<Modelo | null>(null);
  const [novoOpen, setNovoOpen] = useState(false);

  const carregar = async () => {
    if (!empresaId) return;
    setLoading(true);
    const { data } = await supabase
      .from("modelos_empresa" as any)
      .select("*")
      .eq("empresa_id", empresaId)
      .order("created_at", { ascending: false });
    setModelos((data as any as Modelo[]) || []);
    setLoading(false);
  };

  useEffect(() => { carregar(); }, [empresaId]);

  const excluir = async (m: Modelo) => {
    if (!confirm(`Excluir modelo "${m.nome}"?`)) return;
    const { error } = await supabase.from("modelos_empresa" as any).delete().eq("id", m.id);
    if (error) return toast.error("Erro ao excluir (talvez existam registros usando este modelo)");
    toast.success("Modelo excluído");
    carregar();
  };

  if (!empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Layers} title="Meus Modelos" description="Selecione uma empresa" />
        <EmpresaSelector />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={Layers} title="Meus Modelos" description="Formulários digitais construídos a partir dos SEUS modelos" />

      <div className="flex flex-wrap gap-2">
        <Dialog open={novoOpen} onOpenChange={setNovoOpen}>
          <DialogTrigger asChild>
            <Button className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" /> Novo modelo
            </Button>
          </DialogTrigger>
          <ModeloEditor 
            open={novoOpen} 
            onClose={() => { setNovoOpen(false); carregar(); }} 
            empresaId={empresaId} 
            userId={user!.id} 
            modelo={null} 
          />
        </Dialog>

        <Button 
          variant="outline" 
          className="border-emerald-600 text-emerald-700 hover:bg-emerald-50"
          onClick={async () => {
            const res = await importarTemplateManualBPF(empresaId, user!.id);
            if (res.success) {
              toast.success("Manual e ITs importados com sucesso!");
              carregar();
            } else {
              toast.error("Erro ao importar template.");
            }
          }}
        >
          <Book className="w-4 h-4 mr-2" /> Importar Manual BPF
        </Button>
      </div>

      {editando && (
        <Dialog open={!!editando} onOpenChange={(o) => !o && setEditando(null)}>
          <ModeloEditor open={!!editando} onClose={() => { setEditando(null); carregar(); }} empresaId={empresaId} userId={user!.id} modelo={editando} />
        </Dialog>
      )}

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : modelos.length === 0 ? (
        <Card><CardContent className="p-12 text-center space-y-3">
          <Layers className="w-10 h-10 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhum modelo cadastrado ainda.</p>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">Crie seu primeiro modelo digital a partir de uma planilha que sua fábrica já usa. Depois, gere registros digitais preenchidos com um clique.</p>
        </CardContent></Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {modelos.map(m => (
            <Card key={m.id} className="hover:shadow-md transition">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="min-w-0">
                    <h3 className="font-bold truncate">{m.nome}</h3>
                    {m.pop_codigo && <Badge variant="outline" className="mt-1 text-[10px]">{m.pop_codigo}</Badge>}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditando(m)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => excluir(m)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </div>
                </div>
                {m.descricao && <p className="text-xs text-muted-foreground line-clamp-2">{m.descricao}</p>}
                <p className="text-xs"><span className="font-semibold text-emerald-700">{m.campos?.length || 0}</span> campo(s)</p>
                <Button asChild size="sm" className="w-full bg-emerald-600 hover:bg-emerald-700">
                  <Link to={`/feedbpf-custom/registros/novo?modelo=${m.id}`}>
                    <FileSignature className="w-4 h-4 mr-1" /> Novo registro
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeloEditor({ open, onClose, empresaId, userId, modelo }: {
  open: boolean; onClose: () => void; empresaId: string; userId: string; modelo: Modelo | null;
}) {
  const [nome, setNome] = useState(modelo?.nome || "");
  const [descricao, setDescricao] = useState(modelo?.descricao || "");
  const [popCodigo, setPopCodigo] = useState(modelo?.pop_codigo || "");
  const [campos, setCampos] = useState<CampoModelo[]>(modelo?.campos || []);
  const [salvando, setSalvando] = useState(false);

  const addCampo = () => {
    setCampos([...campos, { id: `c-${Date.now()}`, nome: "", tipo: "texto", obrigatorio: false }]);
  };
  const alterarCampo = (i: number, patch: Partial<CampoModelo>) => {
    setCampos(campos.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  };
  const removerCampo = (i: number) => setCampos(campos.filter((_, idx) => idx !== i));

  const salvar = async () => {
    if (!nome.trim()) return toast.error("Nome do modelo é obrigatório");
    if (campos.length === 0) return toast.error("Adicione pelo menos um campo");
    if (campos.some(c => !c.nome.trim())) return toast.error("Todos os campos precisam de um nome");

    setSalvando(true);
    try {
      const payload = {
        user_id: userId,
        empresa_id: empresaId,
        nome: nome.trim(),
        descricao: descricao.trim() || null,
        pop_codigo: popCodigo || null,
        campos: campos as any,
        ativo: true,
      };
      const q = modelo
        ? supabase.from("modelos_empresa" as any).update(payload).eq("id", modelo.id)
        : supabase.from("modelos_empresa" as any).insert(payload);
      const { error } = await q;
      if (error) throw error;
      toast.success(modelo ? "Modelo atualizado" : "Modelo criado");
      onClose();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
      <DialogHeader><DialogTitle>{modelo ? "Editar modelo" : "Novo modelo digital"}</DialogTitle></DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Nome do modelo *</Label>
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Planilha de Higiene Diária" />
          </div>
          <div>
            <Label>POP vinculado</Label>
            <Select value={popCodigo || "__none__"} onValueChange={v => setPopCodigo(v === "__none__" ? "" : v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">Nenhum</SelectItem>
                {POPS_CUSTOM.map(p => <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} — {p.nome}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div>
          <Label>Descrição</Label>
          <Textarea value={descricao} onChange={e => setDescricao(e.target.value)} rows={2} placeholder="Explique quando este modelo é usado" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Campos do formulário</Label>
            <Button size="sm" variant="outline" onClick={addCampo}><Plus className="w-4 h-4 mr-1" /> Adicionar campo</Button>
          </div>
          {campos.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6 border border-dashed rounded-lg">Nenhum campo. Clique em "Adicionar campo".</p>
          ) : (
            <div className="space-y-2">
              {campos.map((c, i) => (
                <div key={c.id} className="p-3 border rounded-lg space-y-2 bg-muted/30">
                  <div className="grid grid-cols-1 sm:grid-cols-[1fr,140px,auto] gap-2">
                    <Input placeholder="Nome do campo" value={c.nome} onChange={e => alterarCampo(i, { nome: e.target.value })} />
                    <Select value={c.tipo} onValueChange={v => alterarCampo(i, { tipo: v as CampoTipo })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TIPOS.map(t => <SelectItem key={t.v} value={t.v}>{t.l}</SelectItem>)}</SelectContent>
                    </Select>
                    <div className="flex items-center gap-2">
                      <Switch checked={c.obrigatorio} onCheckedChange={v => alterarCampo(i, { obrigatorio: v })} />
                      <span className="text-xs text-muted-foreground">Obrig.</span>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => removerCampo(i)}><X className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  {c.tipo === "select" && (
                    <Input placeholder="Opções separadas por vírgula (Ex: Conforme, Não conforme, N/A)" value={c.opcoes?.join(", ") || ""} onChange={e => alterarCampo(i, { opcoes: e.target.value.split(",").map(x => x.trim()).filter(Boolean) })} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-2 justify-end pt-2 border-t">
          <Button variant="outline" onClick={onClose} disabled={salvando}>Cancelar</Button>
          <Button onClick={salvar} disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700">
            {salvando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
            Salvar modelo
          </Button>
        </div>
      </div>
    </DialogContent>
  );
}
