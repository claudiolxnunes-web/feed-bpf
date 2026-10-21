import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, Plus, Loader2, Bell, Clock, ChevronDown, ChevronUp, ClipboardList, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

const SETORES = [
  "Recebimento", "Armazenamento", "Moagem", "Mistura",
  "Peletização", "Ensacamento", "Expedição", "Laboratório",
  "Área externa", "Manutenção"
];

const statusColors: Record<string, string> = {
  aberta: "bg-destructive text-destructive-foreground",
  em_andamento: "bg-yellow-500/20 text-yellow-700",
  fechada: "bg-primary text-primary-foreground",
};

const statusLabels: Record<string, string> = {
  aberta: "Aberta",
  em_andamento: "Em andamento",
  fechada: "Fechada",
};

interface NCRow {
  id: string;
  data: string;
  setor: string;
  descricao: string;
  causa: string | null;
  acao_corretiva: string | null;
  acao_preventiva: string | null;
  verificacao_eficacia: string | null;
  data_verificacao: string | null;
  responsavel: string | null;
  prazo: string | null;
  status: string | null;
  created_at: string;
}

export default function NaoConformidades() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [ncs, setNcs] = useState<NCRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [generatingEditAI, setGeneratingEditAI] = useState(false);

  // Edit form
  const [editCausa, setEditCausa] = useState("");
  const [editAcao, setEditAcao] = useState("");
  const [editAcaoPreventiva, setEditAcaoPreventiva] = useState("");
  const [editVerificacao, setEditVerificacao] = useState("");
  const [editDataVerificacao, setEditDataVerificacao] = useState("");
  const [editResponsavel, setEditResponsavel] = useState("");
  const [editPrazo, setEditPrazo] = useState("");

  // New NC form (controlled)
  const [formData, setFormData] = useState(new Date().toISOString().split("T")[0]);
  const [formSetor, setFormSetor] = useState("");
  const [formDescricao, setFormDescricao] = useState("");
  const [formCausa, setFormCausa] = useState("");
  const [formAcao, setFormAcao] = useState("");
  const [formAcaoPreventiva, setFormAcaoPreventiva] = useState("");
  const [formResponsavel, setFormResponsavel] = useState("");
  const [formPrazo, setFormPrazo] = useState("");

  const fetchData = async () => {
    if (!user) return;
    let q = supabase
      .from("nao_conformidades")
      .select("*")
      .order("data", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    if (data) setNcs(data as unknown as NCRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, empresaAtiva]);

  // Pré-preenchimento vindo de outras telas (ex.: Auditoria BPF)
  const location = useLocation();
  useEffect(() => {
    const prefill = (location.state as { prefillNC?: { descricao?: string; setor?: string } } | null)?.prefillNC;
    if (prefill) {
      if (prefill.descricao) setFormDescricao(prefill.descricao);
      if (prefill.setor) setFormSetor(prefill.setor);
      setOpen(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const resetForm = () => {
    setFormData(new Date().toISOString().split("T")[0]);
    setFormSetor(""); setFormDescricao(""); setFormCausa("");
    setFormAcao(""); setFormAcaoPreventiva(""); setFormResponsavel(""); setFormPrazo("");
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || !formSetor || !formDescricao) return;
    setSaving(true);
    const { error } = await supabase.from("nao_conformidades").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      data: formData,
      setor: formSetor,
      descricao: formDescricao,
      causa: formCausa,
      acao_corretiva: formAcao,
      acao_preventiva: formAcaoPreventiva,
      responsavel: formResponsavel,
      prazo: formPrazo || null,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("NC registrada com plano de ação!"); setOpen(false); resetForm(); fetchData(); }
    setSaving(false);
  };

  const gerarPlanoIA = async () => {
    if (!formDescricao || !formSetor) {
      toast.error("Preencha o setor e a descrição da NC antes de gerar o plano.");
      return;
    }
    setGeneratingAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("nc-plano-acao", {
        body: { descricao: formDescricao, setor: formSetor },
      });
      if (error) { toast.error("Erro ao gerar plano: " + error.message); setGeneratingAI(false); return; }
      if (data?.error) { toast.error(data.error); setGeneratingAI(false); return; }
      const result = data?.data;
      if (result) {
        setFormCausa(result.causa || "");
        setFormAcao(result.acao_corretiva || "");
        setFormResponsavel(result.responsavel_sugerido || "");
        if (result.prazo_dias) {
          const prazoDate = new Date();
          prazoDate.setDate(prazoDate.getDate() + result.prazo_dias);
          setFormPrazo(prazoDate.toISOString().split("T")[0]);
        }
        toast.success("Plano de ação gerado pela IA! Revise e ajuste se necessário.");
      }
    } catch { toast.error("Erro ao conectar com IA"); }
    setGeneratingAI(false);
  };

  const gerarPlanoEditIA = async (ncDescricao: string, ncSetor: string) => {
    setGeneratingEditAI(true);
    try {
      const { data, error } = await supabase.functions.invoke("nc-plano-acao", {
        body: { descricao: ncDescricao, setor: ncSetor },
      });
      if (error) { toast.error("Erro ao gerar plano: " + error.message); setGeneratingEditAI(false); return; }
      if (data?.error) { toast.error(data.error); setGeneratingEditAI(false); return; }
      const result = data?.data;
      if (result) {
        setEditCausa(result.causa || "");
        setEditAcao(result.acao_corretiva || "");
        setEditResponsavel(result.responsavel_sugerido || "");
        if (result.prazo_dias) {
          const prazoDate = new Date();
          prazoDate.setDate(prazoDate.getDate() + result.prazo_dias);
          setEditPrazo(prazoDate.toISOString().split("T")[0]);
        }
        toast.success("Plano de ação gerado pela IA!");
      }
    } catch { toast.error("Erro ao conectar com IA"); }
    setGeneratingEditAI(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase.from("nao_conformidades").update({ status: newStatus } as any).eq("id", id);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Status atualizado!"); fetchData(); }
  };

  const handleEditPlano = async () => {
    if (!editId) return;
    setSaving(true);
    const { error } = await supabase.from("nao_conformidades").update({
      causa: editCausa,
      acao_corretiva: editAcao,
      acao_preventiva: editAcaoPreventiva,
      verificacao_eficacia: editVerificacao,
      data_verificacao: editDataVerificacao || null,
      responsavel: editResponsavel,
      prazo: editPrazo || null,
    } as any).eq("id", editId);
    if (error) toast.error("Erro ao atualizar");
    else { toast.success("Plano de ação atualizado!"); setEditOpen(false); setEditId(null); fetchData(); }
    setSaving(false);
  };

  const openEditPlano = (nc: NCRow) => {
    setEditId(nc.id);
    setEditCausa(nc.causa || "");
    setEditAcao(nc.acao_corretiva || "");
    setEditAcaoPreventiva(nc.acao_preventiva || "");
    setEditVerificacao(nc.verificacao_eficacia || "");
    setEditDataVerificacao(nc.data_verificacao || "");
    setEditResponsavel(nc.responsavel || "");
    setEditPrazo(nc.prazo || "");
    setEditOpen(true);
  };

  const today = new Date().toISOString().split("T")[0];
  const vencidas = ncs.filter(nc => nc.prazo && nc.prazo < today && nc.status !== "fechada");
  const abertas = ncs.filter(nc => nc.status === "aberta");
  const emAndamento = ncs.filter(nc => nc.status === "em_andamento");
  const fechadas = ncs.filter(nc => nc.status === "fechada");
  const semPlano = ncs.filter(nc => !nc.acao_corretiva && nc.status !== "fechada");

  return (
    <>
      <PageHeader icon={AlertTriangle} title="POP 09 - Não Conformidades" description="Registro, plano de ação corretiva e gestão de prazos"
        orientacaoModuloId="nao-conformidades"  assuntoBaseLegal="autocontrole" />

      {/* Alertas de prazo vencido */}
      {vencidas.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-5 h-5 text-destructive animate-pulse" />
              <h3 className="font-display font-semibold text-sm text-destructive">
                ⚠️ {vencidas.length} NC(s) com prazo vencido!
              </h3>
            </div>
            <div className="space-y-2">
              {vencidas.map(nc => (
                <div key={nc.id} className="flex items-center justify-between p-2 rounded bg-background border border-destructive/20">
                  <div>
                    <span className="font-medium text-sm">{nc.descricao.slice(0, 60)}</span>
                    <div className="flex gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">{nc.setor}</span>
                      <span className="text-xs text-destructive font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" /> Prazo: {nc.prazo}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button size="sm" variant="outline" className="text-xs" onClick={() => openEditPlano(nc)}>
                      <ClipboardList className="w-3 h-3 mr-1" /> Plano de Ação
                    </Button>
                    <Button size="sm" className="text-xs" onClick={() => handleUpdateStatus(nc.id, "fechada")}>
                      Fechar
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alerta: NCs sem plano de ação */}
      {semPlano.length > 0 && (
        <Card className="border-accent/30 bg-accent/5 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-2">
              <ClipboardList className="w-5 h-5 text-accent" />
              <h3 className="font-display font-semibold text-sm text-accent">
                {semPlano.length} NC(s) sem plano de ação corretiva definido
              </h3>
            </div>
            <p className="text-xs text-muted-foreground">Clique em "Plano de Ação" na tabela para associar causa, ação corretiva, responsável e prazo.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{ncs.length}</p>
          <p className="text-xs text-muted-foreground">Total NCs</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{abertas.length}</p>
          <p className="text-xs text-muted-foreground">Abertas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{emAndamento.length}</p>
          <p className="text-xs text-muted-foreground">Em Andamento</p>
        </CardContent></Card>
        <Card className={vencidas.length > 0 ? "border-destructive/50" : ""}><CardContent className="pt-4 text-center">
          <p className={`text-2xl font-bold font-display ${vencidas.length > 0 ? "text-destructive" : "text-muted-foreground"}`}>{vencidas.length}</p>
          <p className="text-xs text-muted-foreground">Prazo Vencido</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{fechadas.length}</p>
          <p className="text-xs text-muted-foreground">Fechadas</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Registros de Não Conformidade</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova NC</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="font-display">Nova Não Conformidade + Plano de Ação</DialogTitle></DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                {/* Identificação da NC */}
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <p className="text-xs font-semibold text-destructive mb-2">① Identificação da NC</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Data</Label><Input type="date" required value={formData} onChange={e => setFormData(e.target.value)} /></div>
                    <div className="space-y-1">
                      <Label>Setor</Label>
                      <Select value={formSetor} onValueChange={setFormSetor} required>
                        <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                        <SelectContent>{SETORES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1 mt-3"><Label>Descrição da Não Conformidade *</Label><Textarea value={formDescricao} onChange={e => setFormDescricao(e.target.value)} required placeholder="Descreva detalhadamente o problema encontrado..." /></div>
                </div>

                {/* Gerar Plano com IA */}
                <Button type="button" variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10" onClick={gerarPlanoIA} disabled={generatingAI || !formDescricao || !formSetor}>
                  {generatingAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {generatingAI ? "Gerando plano de ação com IA..." : "⚡ Gerar Plano de Ação Automaticamente com IA"}
                </Button>

                {/* Plano de Ação Corretiva */}
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <p className="text-xs font-semibold text-primary mb-2">② Plano de Ação Corretiva</p>
                  <div className="space-y-3">
                    <div className="space-y-1"><Label>Causa Raiz / Causa Provável *</Label><Textarea value={formCausa} onChange={e => setFormCausa(e.target.value)} required placeholder="Identifique a causa raiz do problema (5 Porquês, Ishikawa...)" /></div>
                    <div className="space-y-1"><Label>Ação Corretiva *</Label><Textarea value={formAcao} onChange={e => setFormAcao(e.target.value)} required placeholder="Descreva a ação corretiva a ser implementada..." /></div>
                    <div className="space-y-1"><Label>Ação Preventiva</Label><Textarea value={formAcaoPreventiva} onChange={e => setFormAcaoPreventiva(e.target.value)} placeholder="Descreva a ação preventiva para evitar reincidência..." /></div>
                  </div>
                </div>

                {/* Responsabilidade e Prazo */}
                <div className="p-3 rounded-lg bg-muted/50 border">
                  <p className="text-xs font-semibold mb-2">③ Responsabilidade e Prazo</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="space-y-1"><Label>Responsável *</Label><Input value={formResponsavel} onChange={e => setFormResponsavel(e.target.value)} required placeholder="Nome do responsável" /></div>
                    <div className="space-y-1"><Label>Prazo para Conclusão *</Label><Input type="date" value={formPrazo} onChange={e => setFormPrazo(e.target.value)} required /></div>
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={saving}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar NC + Plano de Ação
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-2 sm:p-6 overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Tabs defaultValue="todas">
              <TabsList className="mb-4 w-full justify-start overflow-x-auto h-auto p-1 flex">
                <TabsTrigger value="todas">Todas ({ncs.length})</TabsTrigger>
                <TabsTrigger value="abertas">Abertas ({abertas.length})</TabsTrigger>
                <TabsTrigger value="andamento">Em andamento ({emAndamento.length})</TabsTrigger>
                <TabsTrigger value="fechadas">Fechadas ({fechadas.length})</TabsTrigger>
              </TabsList>
              {[
                { key: "todas", data: ncs },
                { key: "abertas", data: abertas },
                { key: "andamento", data: emAndamento },
                { key: "fechadas", data: fechadas },
              ].map(tab => (
                <TabsContent key={tab.key} value={tab.key}>
                  {tab.data.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">Nenhuma NC encontrada</p>
                  ) : (
                    <div className="space-y-4">
                      {/* Desktop Table View */}
                      <div className="hidden md:block overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-8"></TableHead>
                              <TableHead>Data</TableHead>
                              <TableHead>Setor</TableHead>
                              <TableHead>Descrição</TableHead>
                              <TableHead>Ação Corretiva</TableHead>
                              <TableHead>Responsável</TableHead>
                              <TableHead>Prazo</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead></TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {tab.data.map((nc) => {
                              const isVencida = nc.prazo && nc.prazo < today && nc.status !== "fechada";
                              const isExpanded = expandedId === nc.id;
                              const temPlano = !!nc.acao_corretiva;
                              return (
                                <React.Fragment key={nc.id}>
                                  <TableRow className={`${isVencida ? "bg-destructive/5" : ""} cursor-pointer`} onClick={() => setExpandedId(isExpanded ? null : nc.id)}>
                                    <TableCell className="px-2">
                                      {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                                    </TableCell>
                                    <TableCell className="whitespace-nowrap">{nc.data}</TableCell>
                                    <TableCell>{nc.setor}</TableCell>
                                    <TableCell className="max-w-[180px] truncate">{nc.descricao}</TableCell>
                                    <TableCell className="max-w-[180px]">
                                      {temPlano ? (
                                        <span className="text-sm text-foreground truncate block">{nc.acao_corretiva!.slice(0, 50)}{nc.acao_corretiva!.length > 50 ? "..." : ""}</span>
                                      ) : (
                                        <Badge variant="outline" className="text-destructive border-destructive/50 text-[10px]">Sem plano</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell>{nc.responsavel || "—"}</TableCell>
                                    <TableCell className="whitespace-nowrap">
                                      <span className={isVencida ? "text-destructive font-semibold" : ""}>{nc.prazo || "—"}</span>
                                      {isVencida && <Badge variant="destructive" className="ml-1 text-[10px]">Vencida</Badge>}
                                    </TableCell>
                                    <TableCell><Badge className={statusColors[nc.status || "aberta"]}>{statusLabels[nc.status || "aberta"]}</Badge></TableCell>
                                    <TableCell onClick={e => e.stopPropagation()}>
                                      <div className="flex gap-1">
                                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => openEditPlano(nc)}>
                                          <ClipboardList className="w-3 h-3 mr-1" /> Plano
                                        </Button>
                                        {nc.status !== "fechada" && (
                                          <Select onValueChange={(v) => handleUpdateStatus(nc.id, v)}>
                                            <SelectTrigger className="w-[80px] h-7 text-xs"><SelectValue placeholder="Ação" /></SelectTrigger>
                                            <SelectContent>
                                              {nc.status !== "em_andamento" && <SelectItem value="em_andamento">Iniciar</SelectItem>}
                                              <SelectItem value="fechada">Fechar</SelectItem>
                                            </SelectContent>
                                          </Select>
                                        )}
                                      </div>
                                    </TableCell>
                                  </TableRow>
                                  {isExpanded && (
                                    <TableRow key={`${nc.id}-detail`} className="bg-muted/30 hover:bg-muted/30">
                                      <TableCell colSpan={9} className="p-4">
                                        <div className="grid md:grid-cols-2 gap-4">
                                          <div className="space-y-3">
                                            <div>
                                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Descrição Completa</p>
                                              <p className="text-sm">{nc.descricao}</p>
                                            </div>
                                            <div>
                                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Causa Raiz</p>
                                              <p className="text-sm">{nc.causa || <span className="text-muted-foreground italic">Não informada</span>}</p>
                                            </div>
                                          </div>
                                          <div className="space-y-3">
                                            <div className={`p-3 rounded-lg ${temPlano ? "bg-primary/5 border border-primary/20" : "bg-destructive/5 border border-destructive/20"}`}>
                                              <p className={`text-xs font-semibold uppercase tracking-wider mb-1 ${temPlano ? "text-primary" : "text-destructive"}`}>
                                                Plano de Ação Corretiva
                                              </p>
                                              {temPlano ? (
                                                <div className="space-y-2">
                                                  <p className="text-sm"><strong>Corretiva:</strong> {nc.acao_corretiva}</p>
                                                  {nc.acao_preventiva && <p className="text-sm text-muted-foreground"><strong>Preventiva:</strong> {nc.acao_preventiva}</p>}
                                                  {nc.verificacao_eficacia && (
                                                    <div className="mt-2 p-2 bg-background rounded border border-primary/20">
                                                      <p className="text-[10px] font-bold text-primary uppercase">Eficácia Verificada em {nc.data_verificacao}</p>
                                                      <p className="text-xs italic">{nc.verificacao_eficacia}</p>
                                                    </div>
                                                  )}
                                                </div>
                                              ) : (
                                                <div className="text-center py-2">
                                                  <p className="text-sm text-muted-foreground mb-2">Nenhum plano de ação definido</p>
                                                  <Button size="sm" variant="outline" onClick={() => openEditPlano(nc)}>
                                                    <ClipboardList className="w-3 h-3 mr-1" /> Definir Plano de Ação
                                                  </Button>
                                                </div>
                                              )}
                                            </div>
                                            <div className="flex gap-4 text-xs text-muted-foreground">
                                              <span><strong>Responsável:</strong> {nc.responsavel || "—"}</span>
                                              <span><strong>Prazo:</strong> <span className={isVencida ? "text-destructive font-semibold" : ""}>{nc.prazo || "—"}</span></span>
                                            </div>
                                          </div>
                                        </div>
                                      </TableCell>
                                    </TableRow>
                                  )}
                                </React.Fragment>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </div>

                      {/* Mobile Card View */}
                      <div className="md:hidden space-y-4">
                        {tab.data.map((nc) => {
                          const isExpanded = expandedId === nc.id;
                          const temPlano = !!nc.acao_corretiva;
                          const isVencida = nc.prazo && nc.prazo < today && nc.status !== "fechada";
                          
                          return (
                            <Card key={nc.id} className="border shadow-sm">
                              <CardContent className="p-4 space-y-3">
                                <div className="flex justify-between items-start">
                                  <div className="space-y-1">
                                    <p className="text-xs font-mono text-muted-foreground">{new Date(nc.data + "T12:00:00").toLocaleDateString("pt-BR")}</p>
                                    <p className="text-sm font-bold">{nc.setor}</p>
                                  </div>
                                  <Badge className={statusColors[nc.status || "aberta"]}>{statusLabels[nc.status || "aberta"]}</Badge>
                                </div>
                                
                                <p className="text-sm line-clamp-2">{nc.descricao}</p>
                                
                                <div className="flex justify-between items-center gap-2 pt-2 border-t">
                                  <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => setExpandedId(isExpanded ? null : nc.id)}>
                                    {isExpanded ? <ChevronUp className="w-3 h-3 mr-1" /> : <ChevronDown className="w-3 h-3 mr-1" />}
                                    {isExpanded ? "Menos" : "Detalhes"}
                                  </Button>
                                  
                                  <div className="flex gap-1">
                                    <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => openEditPlano(nc)}>
                                      Plano
                                    </Button>
                                    {nc.status !== "fechada" && (
                                      <Button size="sm" className="h-8 text-xs" onClick={() => handleUpdateStatus(nc.id, "fechada")}>
                                        Fechar
                                      </Button>
                                    )}
                                  </div>
                                </div>

                                {isExpanded && (
                                  <div className="pt-3 space-y-3 animate-in fade-in slide-in-from-top-1">
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Descrição</p>
                                      <p className="text-xs">{nc.descricao}</p>
                                    </div>
                                    <div className="space-y-1">
                                      <p className="text-[10px] font-bold uppercase text-muted-foreground">Causa Raiz</p>
                                      <p className="text-xs">{nc.causa || "Não informada"}</p>
                                    </div>
                                    <div className={`p-2 rounded border ${temPlano ? "bg-primary/5 border-primary/20" : "bg-destructive/5 border-destructive/20"}`}>
                                      <p className="text-[10px] font-bold uppercase mb-1">Ação Corretiva</p>
                                      <p className="text-xs">{nc.acao_corretiva || "Pendente"}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2 text-[10px]">
                                      <div>
                                        <p className="font-bold uppercase text-muted-foreground">Responsável</p>
                                        <p>{nc.responsavel || "—"}</p>
                                      </div>
                                      <div>
                                        <p className="font-bold uppercase text-muted-foreground">Prazo</p>
                                        <p className={isVencida ? "text-destructive font-bold" : ""}>{nc.prazo || "—"}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Editar Plano de Ação */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <ClipboardList className="w-5 h-5 text-primary" /> Plano de Ação Corretiva
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {editId && (() => {
              const nc = ncs.find(n => n.id === editId);
              return nc ? (
                <Button type="button" variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10" onClick={() => gerarPlanoEditIA(nc.descricao, nc.setor)} disabled={generatingEditAI}>
                  {generatingEditAI ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                  {generatingEditAI ? "Gerando..." : "⚡ Gerar Plano com IA"}
                </Button>
              ) : null;
            })()}
            <div className="space-y-1">
              <Label>Causa Raiz / Causa Provável</Label>
              <Textarea value={editCausa} onChange={e => setEditCausa(e.target.value)} placeholder="Identifique a causa raiz (5 Porquês, Ishikawa...)" />
            </div>
            <div className="space-y-1">
              <Label>Ação Corretiva *</Label>
              <Textarea value={editAcao} onChange={e => setEditAcao(e.target.value)} placeholder="Descreva a ação corretiva a ser implementada..." />
            </div>
            <div className="space-y-1">
              <Label>Ação Preventiva</Label>
              <Textarea value={editAcaoPreventiva} onChange={e => setEditAcaoPreventiva(e.target.value)} placeholder="Ação para evitar reincidência..." />
            </div>
            <div className="p-3 bg-primary/5 rounded border border-primary/20 space-y-2">
              <p className="text-xs font-bold text-primary uppercase">Eficácia (CAPA)</p>
              <div className="space-y-1">
                <Label className="text-[10px]">Verificação de Eficácia</Label>
                <Textarea value={editVerificacao} onChange={e => setEditVerificacao(e.target.value)} placeholder="Descreva como a eficácia foi verificada..." className="h-20" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px]">Data da Verificação</Label>
                <Input type="date" value={editDataVerificacao} onChange={e => setEditDataVerificacao(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Responsável</Label>
                <Input value={editResponsavel} onChange={e => setEditResponsavel(e.target.value)} placeholder="Nome" />
              </div>
              <div className="space-y-1">
                <Label>Prazo</Label>
                <Input type="date" value={editPrazo} onChange={e => setEditPrazo(e.target.value)} />
              </div>
            </div>
            <Button onClick={handleEditPlano} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar Plano de Ação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
