import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { FileSignature, Loader2, Save, ChevronLeft, ShieldCheck, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { gerarHashIntegridade } from "@/utils/integridade";
import { type CampoModelo } from "@/config/feedBpfCustomConfig";
import { toast } from "sonner";

interface Registro {
  id: string;
  titulo: string;
  responsavel: string | null;
  data_execucao: string;
  status: string;
  modelo_id: string;
  pop_codigo: string | null;
  hash_integridade: string | null;
  created_at: string;
  modelos_empresa?: { nome: string } | null;
}

interface Modelo {
  id: string;
  nome: string;
  pop_codigo: string | null;
  campos: CampoModelo[];
}

export default function RegistrosDigitais() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [params] = useSearchParams();
  const empresaId = empresaAtiva?.id;
  const modeloIdParam = params.get("modelo");
  const isNovo = window.location.pathname.endsWith("/novo");

  if (isNovo) return <NovoRegistro modeloId={modeloIdParam} />;
  return <ListaRegistros />;
}

function ListaRegistros() {
  const { empresaAtiva } = useEmpresa();
  const empresaId = empresaAtiva?.id;
  const [registros, setRegistros] = useState<Registro[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("registros_customizados" as any)
        .select("*, modelos_empresa(nome)")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      setRegistros((data as any as Registro[]) || []);
      setLoading(false);
    })();
  }, [empresaId]);

  if (!empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader icon={FileSignature} title="Registros Digitais" description="Selecione uma empresa" />
        <EmpresaSelector />
      </div>
    );
  }

  const cor = (s: string) =>
    s === "vigente" ? "bg-emerald-500/15 text-emerald-700 border-emerald-200"
    : s === "obsoleto" ? "bg-muted text-muted-foreground"
    : "bg-amber-500/15 text-amber-700 border-amber-200";

  return (
    <div className="space-y-6">
      <PageHeader icon={FileSignature} title="Registros Digitais" description="Registros preenchidos a partir dos seus modelos" />

      <div className="flex gap-2">
        <Button asChild variant="outline"><Link to="/feedbpf-custom/modelos">Ver meus modelos</Link></Button>
      </div>

      {loading ? (
        <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
      ) : registros.length === 0 ? (
        <Card><CardContent className="p-12 text-center space-y-3">
          <FileSignature className="w-10 h-10 mx-auto text-muted-foreground/30" />
          <p className="text-muted-foreground">Nenhum registro digital ainda.</p>
          <Button asChild variant="link" className="text-emerald-600"><Link to="/feedbpf-custom/modelos">Criar registro a partir de um modelo →</Link></Button>
        </CardContent></Card>
      ) : (
        <Card><CardContent className="p-0">
          <div className="divide-y">
            {registros.map(r => (
              <div key={r.id} className="p-3 flex items-center gap-3 hover:bg-muted/30">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{r.titulo}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {r.modelos_empresa?.nome || "modelo excluído"} · {new Date(r.data_execucao + "T12:00").toLocaleDateString("pt-BR")} · {r.responsavel || "sem responsável"}
                  </p>
                </div>
                {r.pop_codigo && <Badge variant="outline" className="text-[10px]">{r.pop_codigo}</Badge>}
                <Badge variant="outline" className={cor(r.status)}>{r.status}</Badge>
                {r.hash_integridade && (
                  <div title={r.hash_integridade} className="hidden sm:flex items-center gap-1 text-[10px] font-mono text-muted-foreground">
                    <ShieldCheck className="w-3 h-3 text-emerald-600" /> {r.hash_integridade.slice(0, 8)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent></Card>
      )}
    </div>
  );
}

function NovoRegistro({ modeloId }: { modeloId: string | null }) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const navigate = useNavigate();
  const empresaId = empresaAtiva?.id;

  const [modelo, setModelo] = useState<Modelo | null>(null);
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [selectedId, setSelectedId] = useState<string>(modeloId || "");
  const [titulo, setTitulo] = useState("");
  const [responsavel, setResponsavel] = useState("");
  const [dataExec, setDataExec] = useState(new Date().toISOString().split("T")[0]);
  const [dados, setDados] = useState<Record<string, any>>({});
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    if (!empresaId) return;
    (async () => {
      const { data } = await supabase
        .from("modelos_empresa" as any)
        .select("id,nome,pop_codigo,campos")
        .eq("empresa_id", empresaId)
        .eq("ativo", true);
      setModelos((data as any as Modelo[]) || []);
    })();
  }, [empresaId]);

  useEffect(() => {
    if (!selectedId) return setModelo(null);
    const found = modelos.find(m => m.id === selectedId);
    if (found) {
      setModelo(found);
      if (!titulo) setTitulo(found.nome + " — " + new Date().toLocaleDateString("pt-BR"));
      
      // Pre-popular valores padrão dos campos
      const initialValues: Record<string, any> = {};
      found.campos.forEach(campo => {
        if ((campo as any).valorPadrao !== undefined) {
          initialValues[campo.id] = (campo as any).valorPadrao;
        }
      });
      setDados(initialValues);
    }
  }, [selectedId, modelos]);

  const salvar = async (status: "rascunho" | "vigente") => {
    if (!empresaId || !user || !modelo) return toast.error("Selecione um modelo");
    if (!titulo.trim()) return toast.error("Título obrigatório");

    for (const c of modelo.campos) {
      if (c.obrigatorio && (dados[c.id] === undefined || dados[c.id] === "" || dados[c.id] === null)) {
        return toast.error(`Campo obrigatório: ${c.nome}`);
      }
    }

    setSalvando(true);
    try {
      const conteudo = JSON.stringify({ modelo: modelo.nome, titulo, responsavel, dataExec, dados });
      const hash = await gerarHashIntegridade(conteudo);

      const { error } = await supabase.from("registros_customizados" as any).insert({
        user_id: user.id,
        empresa_id: empresaId,
        modelo_id: modelo.id,
        pop_codigo: modelo.pop_codigo,
        titulo: titulo.trim(),
        responsavel: responsavel.trim() || null,
        data_execucao: dataExec,
        dados: dados as any,
        status,
        hash_integridade: hash,
      });
      if (error) throw error;
      toast.success(status === "vigente" ? "Registro salvo e assinado" : "Rascunho salvo");
      navigate("/feedbpf-custom/registros");
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSalvando(false);
    }
  };

  if (!empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader icon={FileSignature} title="Novo Registro" description="Selecione uma empresa" />
        <EmpresaSelector />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center gap-2">
        <Button asChild size="sm" variant="ghost"><Link to="/feedbpf-custom/registros"><ChevronLeft className="w-4 h-4 mr-1" /> Voltar</Link></Button>
      </div>
      <PageHeader icon={FileSignature} title="Novo Registro Digital" description="Preencha o formulário do seu modelo" />

      <Card>
        <CardContent className="p-6 space-y-4">
          <div>
            <Label>Modelo *</Label>
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger><SelectValue placeholder="Escolha o modelo" /></SelectTrigger>
              <SelectContent>
                {modelos.length === 0 && <div className="p-2 text-xs text-muted-foreground">Nenhum modelo. <Link to="/feedbpf-custom/modelos" className="text-emerald-600 underline">Criar agora</Link></div>}
                {modelos.map(m => <SelectItem key={m.id} value={m.id}>{m.nome} {m.pop_codigo && `(${m.pop_codigo})`}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {modelo && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <Label>Título *</Label>
                  <Input value={titulo} onChange={e => setTitulo(e.target.value)} />
                </div>
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={dataExec} onChange={e => setDataExec(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Responsável</Label>
                <Input value={responsavel} onChange={e => setResponsavel(e.target.value)} placeholder="Nome de quem preencheu" />
              </div>

              <div className="border-t pt-4 space-y-3">
                <p className="text-sm font-semibold text-emerald-700">Campos do modelo:</p>
                {modelo.campos.map(c => (
                  <div key={c.id}>
                    <Label>{c.nome} {c.obrigatorio && <span className="text-destructive">*</span>}</Label>
                    <CampoInput campo={c} value={dados[c.id] !== undefined ? dados[c.id] : c.valorPadrao} onChange={(v) => setDados({ ...dados, [c.id]: v })} />
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 justify-end pt-4 border-t">
                <Button variant="outline" onClick={() => salvar("rascunho")} disabled={salvando}>
                  {salvando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />} Salvar rascunho
                </Button>
                <Button onClick={() => salvar("vigente")} disabled={salvando} className="bg-emerald-600 hover:bg-emerald-700">
                  {salvando ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <ShieldCheck className="w-4 h-4 mr-1" />}
                  Salvar como vigente (com hash)
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function CampoInput({ campo, value, onChange }: { campo: CampoModelo; value: any; onChange: (v: any) => void }) {
  switch (campo.tipo) {
    case "textarea": return <Textarea value={value || ""} onChange={e => onChange(e.target.value)} rows={3} />;
    case "numero": return <Input type="number" value={value ?? ""} onChange={e => onChange(e.target.value)} />;
    case "data": return <Input type="date" value={value || ""} onChange={e => onChange(e.target.value)} />;
    case "checkbox": return <div className="flex items-center gap-2 pt-2"><Checkbox checked={!!value} onCheckedChange={(v) => onChange(!!v)} /><span className="text-sm">Sim</span></div>;
    case "select": return (
      <Select value={value || ""} onValueChange={onChange}>
        <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
        <SelectContent>{(campo.opcoes || []).map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
      </Select>
    );
    default: return <Input value={value || ""} onChange={e => onChange(e.target.value)} />;
  }
}
