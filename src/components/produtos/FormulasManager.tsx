import { useState, useEffect } from "react";
import { Plus, Loader2, Trash2, FileText, Copy, CheckCircle2, Factory } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

interface Produto {
  id: string;
  nome: string;
}

interface Formula {
  id: string;
  produto_id: string | null;
  produto_nome: string;
  codigo: string;
  versao: string;
  data_versao: string;
  status: string;
  observacoes: string | null;
}

interface Ingrediente {
  id: string;
  formula_id: string;
  materia_prima: string;
  quantidade_kg: number;
  ordem: number;
}

interface Props {
  /** Se passado, restringe a fórmulas deste produto (modo aba dentro do produto) */
  produtoIdFixo?: string;
  produtoNomeFixo?: string;
}

function formatDateBR(iso: string) {
  const [y, m, d] = iso.split("-");
  return `${d}${m}${y}`;
}

function gerarCodigo(produtoNome: string, versao: string, dataVersao: string) {
  return `${produtoNome.trim()} - v${versao.padStart(2, "0")}-${formatDateBR(dataVersao)}`;
}

export default function FormulasManager({ produtoIdFixo, produtoNomeFixo }: Props) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [formulas, setFormulas] = useState<Formula[]>([]);
  const [ingredientes, setIngredientes] = useState<Ingrediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Dialog nova fórmula
  const [open, setOpen] = useState(false);
  const [produtoId, setProdutoId] = useState(produtoIdFixo || "");
  const [produtoNome, setProdutoNome] = useState(produtoNomeFixo || "");
  const [versao, setVersao] = useState("01");
  const [dataVersao, setDataVersao] = useState(new Date().toISOString().split("T")[0]);
  const [obs, setObs] = useState("");
  const [medicada, setMedicada] = useState(false);

  // Dialog ingredientes
  const [ingOpen, setIngOpen] = useState(false);
  const [editFormula, setEditFormula] = useState<Formula | null>(null);
  const [novoMP, setNovoMP] = useState("");
  const [novoQtd, setNovoQtd] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    const [pRes, fRes, iRes] = await Promise.all([
      supabase.from("produtos").select("id, nome").order("nome"),
      (() => {
        let q = supabase.from("formulas" as any).select("*").order("data_versao", { ascending: false });
        if (produtoIdFixo) q = q.eq("produto_id", produtoIdFixo);
        if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
        return q;
      })(),
      (() => {
        let q = supabase.from("formula_ingredientes" as any).select("*").order("ordem");
        if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
        return q;
      })(),
    ]);
    if (pRes.data) setProdutos(pRes.data);
    if (fRes.data) setFormulas(fRes.data as unknown as Formula[]);
    if (iRes.data) setIngredientes(iRes.data as unknown as Ingrediente[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, empresaAtiva, produtoIdFixo]);

  const proximaVersao = (prodId: string) => {
    const existentes = formulas.filter(f => f.produto_id === prodId);
    if (existentes.length === 0) return "01";
    const max = Math.max(...existentes.map(f => parseInt(f.versao) || 0));
    return String(max + 1).padStart(2, "0");
  };

  const handleProdutoChange = (id: string) => {
    setProdutoId(id);
    const p = produtos.find(x => x.id === id);
    setProdutoNome(p?.nome || "");
    setVersao(proximaVersao(id));
  };

  const handleCreate = async () => {
    if (!user || !produtoNome) { toast.error("Selecione o produto"); return; }
    setSaving(true);
    const codigo = gerarCodigo(produtoNome, versao, dataVersao);
    const { error } = await supabase.from("formulas" as any).insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      produto_id: produtoId || null,
      produto_nome: produtoNome,
      codigo,
      versao,
      data_versao: dataVersao,
      status: "ativa",
      observacoes: obs,
      medicada,
    } as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`Fórmula criada: ${codigo}`);
      setOpen(false);
      setObs("");
      setMedicada(false);
      if (!produtoIdFixo) { setProdutoId(""); setProdutoNome(""); }
      setVersao("01");
      fetchData();
    }
    setSaving(false);
  };

  const handleDuplicar = async (f: Formula) => {
    if (!user) return;
    const novaVersao = proximaVersao(f.produto_id || "");
    const novaData = new Date().toISOString().split("T")[0];
    const novoCodigo = gerarCodigo(f.produto_nome, novaVersao, novaData);
    const { data: nova, error } = await supabase.from("formulas" as any).insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      produto_id: f.produto_id,
      produto_nome: f.produto_nome,
      codigo: novoCodigo,
      versao: novaVersao,
      data_versao: novaData,
      status: "ativa",
      observacoes: `Duplicada de: ${f.codigo}`,
      medicada: (f as any).medicada ?? false,
    } as any).select().single();
    if (error || !nova) { toast.error("Erro ao duplicar"); return; }

    const ings = ingredientes.filter(i => i.formula_id === f.id);
    if (ings.length > 0) {
      await supabase.from("formula_ingredientes" as any).insert(
        ings.map(i => ({
          user_id: user.id,
          empresa_id: empresaAtiva?.id || null,
          formula_id: (nova as any).id,
          materia_prima: i.materia_prima,
          quantidade_kg: i.quantidade_kg,
          ordem: i.ordem,
        })) as any
      );
    }
    toast.success("Nova versão criada!");
    fetchData();
  };

  const handleAtivar = async (f: Formula) => {
    // Marca todas do mesmo produto como obsoleta, exceto esta
    await supabase.from("formulas" as any)
      .update({ status: "obsoleta" } as any)
      .eq("produto_id", f.produto_id);
    await supabase.from("formulas" as any)
      .update({ status: "ativa" } as any)
      .eq("id", f.id);
    toast.success("Fórmula ativada!");
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta fórmula e todos seus ingredientes?")) return;
    const { error } = await supabase.from("formulas" as any).delete().eq("id", id);
    if (error) toast.error("Erro");
    else { toast.success("Excluída"); fetchData(); }
  };

  const handleAddIng = async () => {
    if (!user || !editFormula || !novoMP || !novoQtd) return;
    const ord = ingredientes.filter(i => i.formula_id === editFormula.id).length;
    const { error } = await supabase.from("formula_ingredientes" as any).insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      formula_id: editFormula.id,
      materia_prima: novoMP,
      quantidade_kg: parseFloat(novoQtd) || 0,
      ordem: ord,
    } as any);
    if (error) toast.error("Erro");
    else {
      setNovoMP(""); setNovoQtd("");
      fetchData();
    }
  };

  const handleDelIng = async (id: string) => {
    await supabase.from("formula_ingredientes" as any).delete().eq("id", id);
    fetchData();
  };

  const ingredientesDaFormula = (fid: string) => ingredientes.filter(i => i.formula_id === fid);
  const totalKg = (fid: string) => ingredientesDaFormula(fid).reduce((s, i) => s + Number(i.quantidade_kg), 0);

  const handleEnviarProducao = async (f: Formula) => {
    if (!user) return;
    setSaving(true);
    
    // 1. Criar a Ordem de Produção
    const numeroOrdem = `OP-${new Date().getTime().toString().slice(-6)}`;
    const { data: ordem, error: oError } = await supabase.from("ordens_producao").insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      numero_ordem: numeroOrdem,
      produto: f.produto_nome,
      formula_id: f.id,
      formula_nome: f.codigo,
      data_programada: new Date().toISOString().split("T")[0],
      status: "programada",
      prioridade: "normal",
      tipo_ordem: "normal"
    } as any).select().single();

    if (oError || !ordem) {
      toast.error("Erro ao gerar ordem de produção");
      setSaving(false);
      return;
    }

    // 2. Copiar ingredientes para formula_itens (que o PCP usa)
    const formulaIngredientes = ingredientes.filter(i => i.formula_id === f.id);
    if (formulaIngredientes.length > 0) {
      const { error: iError } = await supabase.from("formula_itens").insert(
        formulaIngredientes.map(i => ({
          user_id: user.id,
          empresa_id: empresaAtiva?.id || null,
          ordem_id: (ordem as any).id,
          materia_prima: i.materia_prima,
          quantidade_formula: String(i.quantidade_kg),
          unidade: "kg"
        })) as any
      );
      
      if (iError) {
        toast.warning("Ordem gerada, mas erro ao copiar ingredientes.");
      }
    }

    toast.success(`Ordem de Produção ${numeroOrdem} gerada com sucesso!`);
    setSaving(false);
    
    // Opcional: Redirecionar para o PCP
    window.location.href = "/pcp";
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display flex items-center gap-2">
            <FileText className="w-5 h-5" /> Fórmulas {produtoNomeFixo ? `— ${produtoNomeFixo}` : ""}
          </CardTitle>
          <Button size="sm" onClick={() => {
            setOpen(true);
            if (produtoIdFixo) setVersao(proximaVersao(produtoIdFixo));
          }}>
            <Plus className="w-4 h-4 mr-1" /> Nova Fórmula / Versão
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {formulas.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma fórmula cadastrada. Clique em "Nova Fórmula" para criar.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Código</TableHead>
                  {!produtoIdFixo && <TableHead>Produto</TableHead>}
                  <TableHead>Versão</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Ingredientes</TableHead>
                  <TableHead>Total (kg)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {formulas.map(f => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs">{f.codigo}</TableCell>
                    {!produtoIdFixo && <TableCell>{f.produto_nome}</TableCell>}
                    <TableCell className="font-semibold">v{f.versao}</TableCell>
                    <TableCell>{new Date(f.data_versao + "T00:00").toLocaleDateString("pt-BR")}</TableCell>
                    <TableCell>{ingredientesDaFormula(f.id).length}</TableCell>
                    <TableCell>{totalKg(f.id).toFixed(2)}</TableCell>
                    <TableCell>
                      <Badge variant={f.status === "ativa" ? "default" : "secondary"}>
                        {f.status === "ativa" ? "Ativa" : "Obsoleta"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-1 justify-end">
                        <Button variant="ghost" size="sm" onClick={() => { setEditFormula(f); setIngOpen(true); }}>
                          Ingredientes
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Enviar para Produção" onClick={() => handleEnviarProducao(f)}>
                          <Factory className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Duplicar como nova versão" onClick={() => handleDuplicar(f)}>
                          <Copy className="w-4 h-4" />
                        </Button>
                        {f.status !== "ativa" && (
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" title="Tornar ativa" onClick={() => handleAtivar(f)}>
                            <CheckCircle2 className="w-4 h-4" />
                          </Button>
                        )}
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(f.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Dialog Nova Fórmula */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nova Fórmula / Versão</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {!produtoIdFixo && (
              <div>
                <Label>Produto *</Label>
                <Select value={produtoId} onValueChange={handleProdutoChange}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    {produtos.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Versão</Label>
                <Input value={versao} onChange={e => setVersao(e.target.value)} placeholder="01" />
              </div>
              <div>
                <Label>Data da versão</Label>
                <Input type="date" value={dataVersao} onChange={e => setDataVersao(e.target.value)} />
              </div>
            </div>
            <div className="p-2 rounded bg-muted/40 text-xs font-mono break-all">
              {produtoNome ? gerarCodigo(produtoNome, versao, dataVersao) : "Selecione um produto"}
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} />
              <label className="flex items-center gap-2 mt-2 text-sm"><input type="checkbox" className="h-4 w-4" checked={medicada} onChange={e => setMedicada(e.target.checked)} /> Fórmula medicada (contém medicamento)</label>
            </div>
            <Button onClick={handleCreate} className="w-full" disabled={saving || !produtoNome}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Criar Fórmula
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Ingredientes */}
      <Dialog open={ingOpen} onOpenChange={setIngOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ingredientes — {editFormula?.codigo}</DialogTitle>
          </DialogHeader>
          {editFormula && (
            <div className="space-y-3">
              <div className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-7">
                  <Label>Matéria-prima</Label>
                  <Input value={novoMP} onChange={e => setNovoMP(e.target.value)} placeholder="Ex: Milho moído" />
                </div>
                <div className="col-span-3">
                  <Label>Quantidade (kg)</Label>
                  <Input type="number" step="0.001" value={novoQtd} onChange={e => setNovoQtd(e.target.value)} placeholder="0.000" />
                </div>
                <div className="col-span-2">
                  <Button onClick={handleAddIng} className="w-full" disabled={!novoMP || !novoQtd}>
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Matéria-prima</TableHead>
                    <TableHead className="text-right">kg</TableHead>
                    <TableHead className="text-right">%</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ingredientesDaFormula(editFormula.id).map((i, idx) => {
                    const tot = totalKg(editFormula.id);
                    const perc = tot > 0 ? (Number(i.quantidade_kg) / tot * 100) : 0;
                    return (
                      <TableRow key={i.id}>
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>{i.materia_prima}</TableCell>
                        <TableCell className="text-right">{Number(i.quantidade_kg).toFixed(3)}</TableCell>
                        <TableCell className="text-right">{perc.toFixed(2)}%</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelIng(i.id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  <TableRow className="font-bold bg-muted/40">
                    <TableCell colSpan={2}>TOTAL</TableCell>
                    <TableCell className="text-right">{totalKg(editFormula.id).toFixed(3)}</TableCell>
                    <TableCell className="text-right">100%</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
