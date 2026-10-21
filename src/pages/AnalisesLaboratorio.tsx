import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { corrigirViaNC } from "@/utils/correcaoNC";
import { FlaskConical, Plus, Loader2, CheckCircle2, XCircle, Clock, Search, FileWarning, Eye } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import AnaliseLaudoIA from "@/components/laboratorio/AnaliseLaudoIA";
import { Sparkles } from "lucide-react";
import { calcularTolerancia } from "@/config/desviosAnaliticos";

interface AnaliseRow {
  id: string;
  tipo_analise: string;
  produto: string;
  lote: string | null;
  data_analise: string | null;
  data_resultado: string | null;
  laboratorio: string | null;
  metodo: string | null;
  parametro: string | null;
  resultado: string | null;
  unidade: string | null;
  limite_referencia: string | null;
  conforme: boolean | null;
  laudo_numero: string | null;
  laudo_url: string | null;
  observacoes: string | null;
  status: string | null;
  created_at: string;
}

const TIPO_ANALISE = [
  { value: "fisico_quimica", label: "Físico-Química" },
  { value: "micotoxinas", label: "Micotoxinas" },
  { value: "antibioticos", label: "Antibióticos" },
  { value: "microbiologia", label: "Microbiologia" },
  { value: "homogeneidade", label: "Homogeneidade" },
];

const PARAMETROS_POR_TIPO: Record<string, string[]> = {
  fisico_quimica: ["Umidade", "Proteína Bruta", "Extrato Etéreo", "Fibra Bruta", "Matéria Mineral", "Cálcio", "Fósforo", "FDA", "NDT", "pH", "Acidez", "Atividade de Água", "Outro"],
  micotoxinas: ["Aflatoxina B1", "Aflatoxinas Totais", "Zearalenona", "Fumonisina B1+B2", "Deoxinivalenol (DON)", "Ocratoxina A", "T-2 Toxina", "Outro"],
  antibioticos: ["Clortetraciclina", "Oxitetraciclina", "Monensina Sódica", "Salinomicina", "Virginiamicina", "Tilosina", "Sulfas", "Outro"],
  microbiologia: ["Salmonella spp.", "Coliformes Totais", "Coliformes Fecais", "E. coli", "Enterobactérias", "Bolores e Leveduras", "Contagem Total de Mesófilos", "Clostridium perfringens", "Outro"],
  homogeneidade: ["CV% (Coeficiente de Variação)", "Marcador Mineral (Mn, Fe, Cr)", "Microtracers®", "Corante", "Outro"],
};

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  pendente: { label: "Pendente", className: "bg-yellow-500/20 text-yellow-700" },
  em_analise: { label: "Em Análise", className: "bg-blue-500/20 text-blue-700" },
  concluido: { label: "Concluído", className: "bg-primary/20 text-primary" },
};

export default function AnalisesLaboratorio() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [analises, setAnalises] = useState<AnaliseRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAnalise, setSelectedAnalise] = useState<AnaliseRow | null>(null);

  // Form
  const [form, setForm] = useState({
    tipo_analise: "fisico_quimica",
    produto: "",
    lote: "",
    data_analise: new Date().toISOString().split("T")[0],
    data_resultado: "",
    laboratorio: "",
    metodo: "",
    parametro: "",
    resultado: "",
    unidade: "",
    limite_referencia: "",
    conforme: null as boolean | null,
    laudo_numero: "",
    observacoes: "",
    status: "pendente",
  });

  const fetchData = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("analises_laboratorio")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setAnalises(data as unknown as AnaliseRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const resetForm = () => {
    setForm({
      tipo_analise: "fisico_quimica", produto: "", lote: "",
      data_analise: new Date().toISOString().split("T")[0], data_resultado: "",
      laboratorio: "", metodo: "", parametro: "", resultado: "",
      unidade: "", limite_referencia: "", conforme: null, laudo_numero: "", observacoes: "", status: "pendente",
    });
  };

  const handleSave = async () => {
    if (!user || !form.produto || !form.parametro) {
      toast.error("Produto e parâmetro são obrigatórios.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("analises_laboratorio").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      ...form,
      data_analise: form.data_analise || null,
      data_resultado: form.data_resultado || null,
    } as any);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Análise registrada!");
      setDialogOpen(false);
      resetForm();
      fetchData();
    }
    setSaving(false);
  };

  const navigate = useNavigate();

  const filtered = analises.filter(a => {
    if (!busca) return true;
    const q = busca.toLowerCase();
    return [a.produto, a.lote, a.parametro, a.laboratorio, a.resultado, a.laudo_numero]
      .some(v => (v || "").toLowerCase().includes(q));
  });

  const tipoLabel = (t: string) => TIPO_ANALISE.find(x => x.value === t)?.label || t;

  const conformes = analises.filter(a => a.conforme === true).length;
  const naoConformes = analises.filter(a => a.conforme === false).length;
  const pendentes = analises.filter(a => a.status === "pendente").length;

  const updateForm = (field: string, value: any) => setForm(prev => ({ ...prev, [field]: value }));

  return (
    <>
      <PageHeader
        icon={FlaskConical}
        title="Análises Laboratoriais"
        description="Físico-química, micotoxinas, antibióticos, microbiologia e homogeneidade"
        orientacaoModuloId="analises"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{analises.length}</p>
          <p className="text-xs text-muted-foreground">Total análises</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{conformes}</p>
          <p className="text-xs text-muted-foreground">Conformes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{naoConformes}</p>
          <p className="text-xs text-muted-foreground">Não Conformes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-yellow-600">{pendentes}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="font-display">Registro de Análises</CardTitle>
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Buscar por produto, lote, parâmetro, laboratório..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
            </div>
          </div>
          <Button onClick={() => { resetForm(); setDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-1" /> Nova Análise
          </Button>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Tabs defaultValue="todos">
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todos ({filtered.length})</TabsTrigger>
                {TIPO_ANALISE.map(t => {
                  const count = filtered.filter(a => a.tipo_analise === t.value).length;
                  return <TabsTrigger key={t.value} value={t.value}>{t.label} ({count})</TabsTrigger>;
                })}
              </TabsList>

              {["todos", ...TIPO_ANALISE.map(t => t.value)].map(tab => {
                const data = tab === "todos" ? filtered : filtered.filter(a => a.tipo_analise === tab);
                return (
                  <TabsContent key={tab} value={tab} className="overflow-x-auto">
                    {data.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <FlaskConical className="w-12 h-12 mx-auto mb-3 opacity-30" />
                        <p>Nenhuma análise registrada{tab !== "todos" ? ` para ${tipoLabel(tab)}` : ""}.</p>
                      </div>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Tipo</TableHead>
                            <TableHead>Produto / Lote</TableHead>
                            <TableHead>Parâmetro</TableHead>
                            <TableHead>Resultado</TableHead>
                            <TableHead>Limite Ref.</TableHead>
                            <TableHead>Conforme</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Data</TableHead>
                            <TableHead>Ações</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.map(a => {
                            const st = STATUS_CONFIG[a.status || "pendente"] || STATUS_CONFIG.pendente;
                            return (
                              <TableRow key={a.id} className={a.conforme === false ? "bg-destructive/5" : ""}>
                                <TableCell><Badge variant="secondary" className="text-xs">{tipoLabel(a.tipo_analise)}</Badge></TableCell>
                                <TableCell>
                                  <p className="font-medium text-sm">{a.produto}</p>
                                  <span className="font-mono text-xs text-muted-foreground">{a.lote || "—"}</span>
                                </TableCell>
                                <TableCell className="text-sm">{a.parametro}</TableCell>
                                <TableCell className="font-mono text-sm">{a.resultado || "—"} {a.unidade || ""}</TableCell>
                                <TableCell className="text-xs text-muted-foreground">
                                  <div>{a.limite_referencia || "—"}</div>
                                  {(() => {
                                    const valor = parseFloat((a.resultado || "").replace(",", "."));
                                    if (!a.parametro || isNaN(valor)) return null;
                                    const tol = calcularTolerancia(a.parametro, a.unidade || undefined, valor);
                                    if (!tol) return null;
                                    const fmt = (n: number) => n.toLocaleString("pt-BR", { maximumFractionDigits: 2 });
                                    return (
                                      <div
                                        className="mt-1 text-[10px] text-primary/80"
                                        title={`CBAA 2017 — ${tol.desvio.nome} | CV ${tol.cv_pct.toFixed(1)}%${tol.desvio.obs ? " (" + tol.desvio.obs + ")" : ""}`}
                                      >
                                        Tol. CBAA: {fmt(tol.faixa_min)}–{fmt(tol.faixa_max)} {a.unidade}
                                        {tol.fora_intervalo_validacao && <span className="text-yellow-600"> ⚠</span>}
                                      </div>
                                    );
                                  })()}
                                </TableCell>
                                <TableCell>
                                  {a.conforme === true && <CheckCircle2 className="w-4 h-4 text-primary" />}
                                  {a.conforme === false && <XCircle className="w-4 h-4 text-destructive" />}
                                  {a.conforme === null && <Clock className="w-4 h-4 text-muted-foreground" />}
                                </TableCell>
                                <TableCell><Badge className={st.className}>{st.label}</Badge></TableCell>
                                <TableCell className="text-xs">{a.data_analise || "—"}</TableCell>
                                <TableCell>
                                  <div className="flex gap-1">
                                    <AnaliseLaudoIA
                                      analise={a}
                                      onNCCriada={fetchData}
                                      trigger={
                                        <Button variant="ghost" size="sm" title="Analisar com IA">
                                          <Sparkles className="w-4 h-4 text-primary" />
                                        </Button>
                                      }
                                    />
                                    <Button variant="ghost" size="sm" onClick={() => { setSelectedAnalise(a); setDetailOpen(true); }}>
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                     <Button variant="ghost" size="sm" className="gap-1 text-xs" title="Registros não são excluídos — correção via Não Conformidade" onClick={() => corrigirViaNC(navigate, { tabela: "analises_laboratorio", registroId: a.id, descricao: `Análise: ${a.tipo_analise} — ${a.produto}${a.lote ? ` — lote ${a.lote}` : ""}` })}>
                                      <FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Add Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display flex items-center gap-2"><FlaskConical className="w-5 h-5 text-primary" /> Nova Análise Laboratorial</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo de Análise *</Label>
                <Select value={form.tipo_analise} onValueChange={v => { updateForm("tipo_analise", v); updateForm("parametro", ""); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_ANALISE.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Status</Label>
                <Select value={form.status} onValueChange={v => updateForm("status", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pendente">Pendente</SelectItem>
                    <SelectItem value="em_analise">Em Análise</SelectItem>
                    <SelectItem value="concluido">Concluído</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label className="text-xs">Produto *</Label><Input value={form.produto} onChange={e => updateForm("produto", e.target.value)} placeholder="Ex: Ração Bovino Engorda" /></div>
              <div><Label className="text-xs">Lote</Label><Input value={form.lote} onChange={e => updateForm("lote", e.target.value)} placeholder="Ex: RBE-0320-01" /></div>
            </div>

            <div>
              <Label className="text-xs">Parâmetro Analisado *</Label>
              <Select value={form.parametro} onValueChange={v => updateForm("parametro", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione o parâmetro" /></SelectTrigger>
                <SelectContent>
                  {(PARAMETROS_POR_TIPO[form.tipo_analise] || []).map(p => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div><Label className="text-xs">Resultado</Label><Input value={form.resultado} onChange={e => updateForm("resultado", e.target.value)} placeholder="Ex: 12,5" /></div>
              <div><Label className="text-xs">Unidade</Label><Input value={form.unidade} onChange={e => updateForm("unidade", e.target.value)} placeholder="Ex: %, ppb, UFC/g" /></div>
              <div><Label className="text-xs">Limite Referência</Label><Input value={form.limite_referencia} onChange={e => updateForm("limite_referencia", e.target.value)} placeholder="Ex: ≤ 20 ppb" /></div>
            </div>

            <div className="flex items-center gap-3">
              <Label className="text-xs">Resultado conforme?</Label>
              <div className="flex gap-3">
                <Button variant={form.conforme === true ? "default" : "outline"} size="sm" onClick={() => updateForm("conforme", true)}>
                  <CheckCircle2 className="w-4 h-4 mr-1" /> Conforme
                </Button>
                <Button variant={form.conforme === false ? "destructive" : "outline"} size="sm" onClick={() => updateForm("conforme", false)}>
                  <XCircle className="w-4 h-4 mr-1" /> Não Conforme
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Data da Análise</Label><Input type="date" value={form.data_analise} onChange={e => updateForm("data_analise", e.target.value)} /></div>
              <div><Label className="text-xs">Data do Resultado</Label><Input type="date" value={form.data_resultado} onChange={e => updateForm("data_resultado", e.target.value)} /></div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs">Laboratório</Label><Input value={form.laboratorio} onChange={e => updateForm("laboratorio", e.target.value)} placeholder="Ex: Lab X Ltda" /></div>
              <div><Label className="text-xs">Método</Label><Input value={form.metodo} onChange={e => updateForm("metodo", e.target.value)} placeholder="Ex: HPLC, ELISA" /></div>
            </div>

            <div><Label className="text-xs">Nº do Laudo</Label><Input value={form.laudo_numero} onChange={e => updateForm("laudo_numero", e.target.value)} placeholder="Ex: LAU-2026-0123" /></div>

            <div><Label className="text-xs">Observações</Label><Textarea value={form.observacoes} onChange={e => updateForm("observacoes", e.target.value)} rows={2} /></div>

            <Button onClick={handleSave} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
              Salvar Análise
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">Detalhes da Análise</DialogTitle></DialogHeader>
          {selectedAnalise && (
            <div className="space-y-3 text-sm">
              <div className="flex gap-2">
                <Badge variant="secondary">{tipoLabel(selectedAnalise.tipo_analise)}</Badge>
                <Badge className={STATUS_CONFIG[selectedAnalise.status || "pendente"]?.className}>
                  {STATUS_CONFIG[selectedAnalise.status || "pendente"]?.label}
                </Badge>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <p><strong>Produto:</strong> {selectedAnalise.produto}</p>
                <p><strong>Lote:</strong> {selectedAnalise.lote || "—"}</p>
                <p><strong>Parâmetro:</strong> {selectedAnalise.parametro}</p>
                <p><strong>Resultado:</strong> {selectedAnalise.resultado} {selectedAnalise.unidade}</p>
                <p><strong>Limite Ref.:</strong> {selectedAnalise.limite_referencia || "—"}</p>
                <p><strong>Conforme:</strong> {selectedAnalise.conforme === true ? "✅ Sim" : selectedAnalise.conforme === false ? "❌ Não" : "Pendente"}</p>
                <p><strong>Laboratório:</strong> {selectedAnalise.laboratorio || "—"}</p>
                <p><strong>Método:</strong> {selectedAnalise.metodo || "—"}</p>
                <p><strong>Laudo:</strong> {selectedAnalise.laudo_numero || "—"}</p>
                <p><strong>Data Análise:</strong> {selectedAnalise.data_analise || "—"}</p>
                <p><strong>Data Resultado:</strong> {selectedAnalise.data_resultado || "—"}</p>
              </div>
              {selectedAnalise.observacoes && (
                <div className="p-2 bg-muted/50 rounded text-xs"><strong>Observações:</strong> {selectedAnalise.observacoes}</div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
