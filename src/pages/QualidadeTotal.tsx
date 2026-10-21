import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { useState, useEffect } from "react";
import {
  ClipboardList,
  Plus,
  Search,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Package,
  CheckCircle2,
  Clock,
  Trash2,
  Edit,
  ShieldCheck,
  Calendar,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { format, addMonths, isBefore, differenceInDays } from "date-fns";

interface Reclamacao {
  id: string;
  numero_reclamacao: string;
  data_reclamacao: string;
  cliente: string;
  contato_cliente: string | null;
  produto: string;
  lote: string | null;
  nota_fiscal: string | null;
  data_compra: string | null;
  quantidade_reclamada: string | null;
  tipo_reclamacao: string;
  descricao_problema: string;
  evidencias: string | null;
  causa_raiz: string | null;
  analise_tecnica: string | null;
  responsavel_analise: string | null;
  data_analise: string | null;
  acao_imediata: string | null;
  acao_corretiva: string | null;
  acao_preventiva: string | null;
  prazo_resolucao: string | null;
  responsavel_resolucao: string | null;
  requer_recolhimento: boolean;
  motivo_recolhimento: string | null;
  lotes_afetados: string | null;
  quantidade_recolhida: string | null;
  data_inicio_recolhimento: string | null;
  data_fim_recolhimento: string | null;
  destino_produto_recolhido: string | null;
  status_recolhimento: string | null;
  conclusao: string | null;
  cliente_notificado: boolean;
  data_resposta_cliente: string | null;
  satisfacao_cliente: string | null;
  status: string;
  pop_referencia: string | null;
  observacoes: string | null;
}

const emptyForm = {
  numero_reclamacao: "",
  data_reclamacao: format(new Date(), "yyyy-MM-dd"),
  cliente: "",
  contato_cliente: "",
  produto: "",
  lote: "",
  nota_fiscal: "",
  data_compra: "",
  quantidade_reclamada: "",
  tipo_reclamacao: "qualidade_produto",
  descricao_problema: "",
  evidencias: "",
  causa_raiz: "",
  analise_tecnica: "",
  responsavel_analise: "",
  data_analise: "",
  acao_imediata: "",
  acao_corretiva: "",
  acao_preventiva: "",
  prazo_resolucao: "",
  responsavel_resolucao: "",
  requer_recolhimento: false,
  motivo_recolhimento: "",
  lotes_afetados: "",
  quantidade_recolhida: "",
  data_inicio_recolhimento: "",
  data_fim_recolhimento: "",
  destino_produto_recolhido: "",
  status_recolhimento: "",
  conclusao: "",
  cliente_notificado: false,
  data_resposta_cliente: "",
  satisfacao_cliente: "",
  status: "aberta",
  pop_referencia: "POP-008",
  observacoes: "",
};

const statusColors: Record<string, string> = {
  aberta: "bg-red-100 text-red-800",
  em_analise: "bg-yellow-100 text-yellow-800",
  em_resolucao: "bg-blue-100 text-blue-800",
  resolvida: "bg-green-100 text-green-800",
  encerrada: "bg-muted text-muted-foreground",
};

const tipoLabels: Record<string, string> = {
  qualidade_produto: "Qualidade do Produto",
  servico: "Serviço",
  entrega: "Entrega",
  embalagem: "Embalagem",
  rotulagem: "Rotulagem",
  outros: "Outros",
};

export default function QualidadeTotal() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [reclamacoes, setReclamacoes] = useState<Reclamacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("todos");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [activeTab, setActiveTab] = useState("identificacao");
  const [mainTab, setMainTab] = useState("reclamacoes");

  // Contraprova state
  const [contraprovasReceb, setContraprovasReceb] = useState<any[]>([]);
  const [contraprovasProd, setContraprovasProd] = useState<any[]>([]);

  useEffect(() => {
    if (user) {
      fetchData();
      fetchContraprovas();
    }
  }, [user]);

  async function fetchData() {
    const { data, error } = await supabase
      .from("reclamacoes_qualidade")
      .select("*")
      .order("data_reclamacao", { ascending: false });
    if (!error && data) setReclamacoes(data as any);
    setLoading(false);
  }

  async function fetchContraprovas() {
    const [recebRes, prodRes] = await Promise.all([
      supabase.from("recebimento_mp").select("*").eq("contraprova_retida", true).order("data", { ascending: false }),
      supabase.from("producao").select("*").eq("contraprova_retida", true).order("data", { ascending: false }),
    ]);
    if (recebRes.data) setContraprovasReceb(recebRes.data);
    if (prodRes.data) setContraprovasProd(prodRes.data);
  }

  function openNew() {
    const nextNum = `REC-${String(reclamacoes.length + 1).padStart(4, "0")}`;
    setForm({ ...emptyForm, numero_reclamacao: nextNum });
    setEditingId(null);
    setActiveTab("identificacao");
    setDialogOpen(true);
  }

  function openEdit(r: Reclamacao) {
    setForm({
      numero_reclamacao: r.numero_reclamacao,
      data_reclamacao: r.data_reclamacao,
      cliente: r.cliente,
      contato_cliente: r.contato_cliente || "",
      produto: r.produto,
      lote: r.lote || "",
      nota_fiscal: r.nota_fiscal || "",
      data_compra: r.data_compra || "",
      quantidade_reclamada: r.quantidade_reclamada || "",
      tipo_reclamacao: r.tipo_reclamacao,
      descricao_problema: r.descricao_problema,
      evidencias: r.evidencias || "",
      causa_raiz: r.causa_raiz || "",
      analise_tecnica: r.analise_tecnica || "",
      responsavel_analise: r.responsavel_analise || "",
      data_analise: r.data_analise || "",
      acao_imediata: r.acao_imediata || "",
      acao_corretiva: r.acao_corretiva || "",
      acao_preventiva: r.acao_preventiva || "",
      prazo_resolucao: r.prazo_resolucao || "",
      responsavel_resolucao: r.responsavel_resolucao || "",
      requer_recolhimento: r.requer_recolhimento,
      motivo_recolhimento: r.motivo_recolhimento || "",
      lotes_afetados: r.lotes_afetados || "",
      quantidade_recolhida: r.quantidade_recolhida || "",
      data_inicio_recolhimento: r.data_inicio_recolhimento || "",
      data_fim_recolhimento: r.data_fim_recolhimento || "",
      destino_produto_recolhido: r.destino_produto_recolhido || "",
      status_recolhimento: r.status_recolhimento || "",
      conclusao: r.conclusao || "",
      cliente_notificado: r.cliente_notificado,
      data_resposta_cliente: r.data_resposta_cliente || "",
      satisfacao_cliente: r.satisfacao_cliente || "",
      status: r.status,
      pop_referencia: r.pop_referencia || "POP-008",
      observacoes: r.observacoes || "",
    });
    setEditingId(r.id);
    setActiveTab("identificacao");
    setDialogOpen(true);
  }

  async function handleSave() {
    if (!form.cliente || !form.produto || !form.descricao_problema) {
      toast.error("Preencha os campos obrigatórios: Cliente, Produto e Descrição.");
      return;
    }

    const payload: any = {
      ...form,
      user_id: user!.id,
      contato_cliente: form.contato_cliente || null,
      lote: form.lote || null,
      nota_fiscal: form.nota_fiscal || null,
      data_compra: form.data_compra || null,
      quantidade_reclamada: form.quantidade_reclamada || null,
      evidencias: form.evidencias || null,
      causa_raiz: form.causa_raiz || null,
      analise_tecnica: form.analise_tecnica || null,
      responsavel_analise: form.responsavel_analise || null,
      data_analise: form.data_analise || null,
      acao_imediata: form.acao_imediata || null,
      acao_corretiva: form.acao_corretiva || null,
      acao_preventiva: form.acao_preventiva || null,
      prazo_resolucao: form.prazo_resolucao || null,
      responsavel_resolucao: form.responsavel_resolucao || null,
      motivo_recolhimento: form.motivo_recolhimento || null,
      lotes_afetados: form.lotes_afetados || null,
      quantidade_recolhida: form.quantidade_recolhida || null,
      data_inicio_recolhimento: form.data_inicio_recolhimento || null,
      data_fim_recolhimento: form.data_fim_recolhimento || null,
      destino_produto_recolhido: form.destino_produto_recolhido || null,
      status_recolhimento: form.status_recolhimento || null,
      conclusao: form.conclusao || null,
      data_resposta_cliente: form.data_resposta_cliente || null,
      satisfacao_cliente: form.satisfacao_cliente || null,
      observacoes: form.observacoes || null,
      updated_at: new Date().toISOString(),
    };

    let error;
    if (editingId) {
      ({ error } = await supabase.from("reclamacoes_qualidade").update(payload).eq("id", editingId));
    } else {
      ({ error } = await supabase.from("reclamacoes_qualidade").insert(payload));
    }

    if (error) {
      toast.error("Erro ao salvar: " + error.message);
    } else {
      toast.success(editingId ? "Reclamação atualizada!" : "Reclamação registrada!");
      setDialogOpen(false);
      fetchData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Excluir esta reclamação?")) return;
    const { error } = await supabase.from("reclamacoes_qualidade").delete().eq("id", id);
    if (!error) {
      toast.success("Excluída!");
      fetchData();
    }
  }

  const filtered = reclamacoes.filter((r) => {
    const matchSearch =
      r.cliente.toLowerCase().includes(search.toLowerCase()) ||
      r.produto.toLowerCase().includes(search.toLowerCase()) ||
      r.numero_reclamacao.toLowerCase().includes(search.toLowerCase()) ||
      r.descricao_problema.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "todos" || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const counts = {
    total: reclamacoes.length,
    abertas: reclamacoes.filter((r) => r.status === "aberta").length,
    emAnalise: reclamacoes.filter((r) => r.status === "em_analise").length,
    resolvidas: reclamacoes.filter((r) => r.status === "resolvida" || r.status === "encerrada").length,
    comRecolhimento: reclamacoes.filter((r) => r.requer_recolhimento).length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={ClipboardList}
        title="Qualidade Total – Relatório Técnico"
        description="Reclamações, contraprovas, análise técnica e recolhimento de produtos"
       assuntoBaseLegal="bpf_geral" />

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="reclamacoes">
            <ClipboardList className="w-4 h-4 mr-1" />
            Reclamações
          </TabsTrigger>
          <TabsTrigger value="contraprova">
            <ShieldCheck className="w-4 h-4 mr-1" />
            Contraprova
          </TabsTrigger>
        </TabsList>

        <TabsContent value="reclamacoes" className="space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { label: "Total", value: counts.total, icon: ClipboardList, color: "text-foreground" },
              { label: "Abertas", value: counts.abertas, icon: AlertTriangle, color: "text-red-600" },
              { label: "Em Análise", value: counts.emAnalise, icon: Clock, color: "text-yellow-600" },
              { label: "Resolvidas", value: counts.resolvidas, icon: CheckCircle2, color: "text-green-600" },
              { label: "C/ Recolhimento", value: counts.comRecolhimento, icon: Package, color: "text-blue-600" },
            ].map((kpi) => (
              <Card key={kpi.label}>
                <CardContent className="flex items-center gap-3 p-4">
                  <kpi.icon className={`h-5 w-5 shrink-0 ${kpi.color}`} />
                  <div>
                    <p className={`text-2xl font-bold ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Toolbar */}
          <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por cliente, produto, nº..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os status</SelectItem>
                <SelectItem value="aberta">Aberta</SelectItem>
                <SelectItem value="em_analise">Em Análise</SelectItem>
                <SelectItem value="em_resolucao">Em Resolução</SelectItem>
                <SelectItem value="resolvida">Resolvida</SelectItem>
                <SelectItem value="encerrada">Encerrada</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={openNew} className="bg-primary">
              <Plus className="h-4 w-4 mr-2" /> Nova Reclamação
            </Button>
          </div>

          {/* Listing */}
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtered.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mb-3 opacity-30" />
                <p>Nenhuma reclamação registrada.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {filtered.map((r) => (
                <Card key={r.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <button
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="shrink-0">
                          <Badge className={statusColors[r.status] || ""}>{r.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-sm truncate">
                            {r.numero_reclamacao} — {r.cliente}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {r.produto} {r.lote ? `| Lote: ${r.lote}` : ""} |{" "}
                            {tipoLabels[r.tipo_reclamacao] || r.tipo_reclamacao}
                          </p>
                        </div>
                        <div className="hidden md:flex items-center gap-3 shrink-0">
                          {r.requer_recolhimento && (
                            <Badge variant="destructive" className="text-xs">
                              <Package className="h-3 w-3 mr-1" />
                              Recolhimento
                            </Badge>
                          )}
                          <span className="text-xs text-muted-foreground">{r.data_reclamacao}</span>
                        </div>
                      </div>
                      {expandedId === r.id ? (
                        <ChevronUp className="h-4 w-4 shrink-0" />
                      ) : (
                        <ChevronDown className="h-4 w-4 shrink-0" />
                      )}
                    </button>

                    {expandedId === r.id && (
                      <div className="border-t px-4 pb-4 pt-3 space-y-4 bg-muted/10">
                        <div className="grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="font-medium mb-1">Descrição do Problema</p>
                            <p className="text-muted-foreground">{r.descricao_problema}</p>
                          </div>
                          {r.causa_raiz && (
                            <div>
                              <p className="font-medium mb-1">Causa Raiz</p>
                              <p className="text-muted-foreground">{r.causa_raiz}</p>
                            </div>
                          )}
                          {r.analise_tecnica && (
                            <div>
                              <p className="font-medium mb-1">Análise Técnica</p>
                              <p className="text-muted-foreground">{r.analise_tecnica}</p>
                            </div>
                          )}
                          {r.acao_corretiva && (
                            <div>
                              <p className="font-medium mb-1">Ação Corretiva</p>
                              <p className="text-muted-foreground">{r.acao_corretiva}</p>
                            </div>
                          )}
                          {r.acao_preventiva && (
                            <div>
                              <p className="font-medium mb-1">Ação Preventiva</p>
                              <p className="text-muted-foreground">{r.acao_preventiva}</p>
                            </div>
                          )}
                          {r.requer_recolhimento && (
                            <div className="md:col-span-2 bg-destructive/5 p-3 rounded-lg border border-destructive/20">
                              <p className="font-medium mb-1 text-destructive flex items-center gap-1">
                                <Package className="h-4 w-4" /> Recolhimento de Produto
                              </p>
                              <div className="grid md:grid-cols-2 gap-2 text-muted-foreground">
                                {r.motivo_recolhimento && <p>Motivo: {r.motivo_recolhimento}</p>}
                                {r.lotes_afetados && <p>Lotes afetados: {r.lotes_afetados}</p>}
                                {r.quantidade_recolhida && <p>Qtd recolhida: {r.quantidade_recolhida}</p>}
                                {r.destino_produto_recolhido && <p>Destino: {r.destino_produto_recolhido}</p>}
                                {r.status_recolhimento && <p>Status: {r.status_recolhimento}</p>}
                              </div>
                            </div>
                          )}
                          {r.conclusao && (
                            <div className="md:col-span-2">
                              <p className="font-medium mb-1">Conclusão</p>
                              <p className="text-muted-foreground">{r.conclusao}</p>
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" onClick={() => openEdit(r)}>
                            <Edit className="h-3 w-3 mr-1" />
                            Editar
                          </Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(r.id)}>
                            <Trash2 className="h-3 w-3 mr-1" />
                            Excluir
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Form Dialog */}
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingId ? "Editar Reclamação" : "Nova Reclamação"} — {form.numero_reclamacao}
                </DialogTitle>
              </DialogHeader>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="identificacao" className="text-xs">
                    Identificação
                  </TabsTrigger>
                  <TabsTrigger value="analise" className="text-xs">
                    Análise
                  </TabsTrigger>
                  <TabsTrigger value="resolucao" className="text-xs">
                    Resolução
                  </TabsTrigger>
                  <TabsTrigger value="recolhimento" className="text-xs">
                    Recolhimento
                  </TabsTrigger>
                  <TabsTrigger value="conclusao" className="text-xs">
                    Conclusão
                  </TabsTrigger>
                </TabsList>

                {/* Tab 1: Identificação */}
                <TabsContent value="identificacao" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Nº Reclamação *</Label>
                      <Input
                        value={form.numero_reclamacao}
                        onChange={(e) => setForm({ ...form, numero_reclamacao: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Data *</Label>
                      <Input
                        type="date"
                        value={form.data_reclamacao}
                        onChange={(e) => setForm({ ...form, data_reclamacao: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Cliente *</Label>
                      <Input value={form.cliente} onChange={(e) => setForm({ ...form, cliente: e.target.value })} />
                    </div>
                    <div>
                      <Label>Contato do Cliente</Label>
                      <Input
                        value={form.contato_cliente}
                        onChange={(e) => setForm({ ...form, contato_cliente: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Produto Reclamado *</Label>
                      <Input value={form.produto} onChange={(e) => setForm({ ...form, produto: e.target.value })} />
                    </div>
                    <div>
                      <Label>Lote</Label>
                      <Input value={form.lote} onChange={(e) => setForm({ ...form, lote: e.target.value })} />
                    </div>
                    <div>
                      <Label>Nota Fiscal</Label>
                      <Input
                        value={form.nota_fiscal}
                        onChange={(e) => setForm({ ...form, nota_fiscal: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Data de Compra</Label>
                      <Input
                        type="date"
                        value={form.data_compra}
                        onChange={(e) => setForm({ ...form, data_compra: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Quantidade Reclamada</Label>
                      <Input
                        value={form.quantidade_reclamada}
                        onChange={(e) => setForm({ ...form, quantidade_reclamada: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Tipo de Reclamação</Label>
                      <Select
                        value={form.tipo_reclamacao}
                        onValueChange={(v) => setForm({ ...form, tipo_reclamacao: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(tipoLabels).map(([k, v]) => (
                            <SelectItem key={k} value={k}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Descrição do Problema *</Label>
                    <Textarea
                      rows={3}
                      value={form.descricao_problema}
                      onChange={(e) => setForm({ ...form, descricao_problema: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Evidências (fotos, amostras, etc.)</Label>
                    <Textarea
                      rows={2}
                      value={form.evidencias}
                      onChange={(e) => setForm({ ...form, evidencias: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="aberta">Aberta</SelectItem>
                        <SelectItem value="em_analise">Em Análise</SelectItem>
                        <SelectItem value="em_resolucao">Em Resolução</SelectItem>
                        <SelectItem value="resolvida">Resolvida</SelectItem>
                        <SelectItem value="encerrada">Encerrada</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                {/* Tab 2: Análise Técnica */}
                <TabsContent value="analise" className="space-y-4 mt-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Responsável pela Análise</Label>
                      <Input
                        value={form.responsavel_analise}
                        onChange={(e) => setForm({ ...form, responsavel_analise: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Data da Análise</Label>
                      <Input
                        type="date"
                        value={form.data_analise}
                        onChange={(e) => setForm({ ...form, data_analise: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Causa Raiz</Label>
                    <Textarea
                      rows={3}
                      value={form.causa_raiz}
                      onChange={(e) => setForm({ ...form, causa_raiz: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Análise Técnica</Label>
                    <Textarea
                      rows={4}
                      value={form.analise_tecnica}
                      onChange={(e) => setForm({ ...form, analise_tecnica: e.target.value })}
                    />
                  </div>
                </TabsContent>

                {/* Tab 3: Plano de Resolução */}
                <TabsContent value="resolucao" className="space-y-4 mt-4">
                  <div>
                    <Label>Ação Imediata (contenção)</Label>
                    <Textarea
                      rows={2}
                      value={form.acao_imediata}
                      onChange={(e) => setForm({ ...form, acao_imediata: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Ação Corretiva</Label>
                    <Textarea
                      rows={3}
                      value={form.acao_corretiva}
                      onChange={(e) => setForm({ ...form, acao_corretiva: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Ação Preventiva</Label>
                    <Textarea
                      rows={3}
                      value={form.acao_preventiva}
                      onChange={(e) => setForm({ ...form, acao_preventiva: e.target.value })}
                    />
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Prazo de Resolução</Label>
                      <Input
                        type="date"
                        value={form.prazo_resolucao}
                        onChange={(e) => setForm({ ...form, prazo_resolucao: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Responsável pela Resolução</Label>
                      <Input
                        value={form.responsavel_resolucao}
                        onChange={(e) => setForm({ ...form, responsavel_resolucao: e.target.value })}
                      />
                    </div>
                  </div>
                </TabsContent>

                {/* Tab 4: Recolhimento */}
                <TabsContent value="recolhimento" className="space-y-4 mt-4">
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Switch
                      checked={form.requer_recolhimento}
                      onCheckedChange={(v) => setForm({ ...form, requer_recolhimento: v })}
                    />
                    <Label className="text-sm font-medium">Requer Recolhimento de Produto (Recall)</Label>
                  </div>
                  {form.requer_recolhimento && (
                    <div className="space-y-4 p-4 border border-destructive/20 rounded-lg bg-destructive/5">
                      <div>
                        <Label>Motivo do Recolhimento</Label>
                        <Textarea
                          rows={2}
                          value={form.motivo_recolhimento}
                          onChange={(e) => setForm({ ...form, motivo_recolhimento: e.target.value })}
                        />
                      </div>
                      <div className="grid md:grid-cols-2 gap-4">
                        <div>
                          <Label>Lotes Afetados</Label>
                          <Input
                            value={form.lotes_afetados}
                            onChange={(e) => setForm({ ...form, lotes_afetados: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Quantidade Recolhida</Label>
                          <Input
                            value={form.quantidade_recolhida}
                            onChange={(e) => setForm({ ...form, quantidade_recolhida: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Data Início Recolhimento</Label>
                          <Input
                            type="date"
                            value={form.data_inicio_recolhimento}
                            onChange={(e) => setForm({ ...form, data_inicio_recolhimento: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Data Fim Recolhimento</Label>
                          <Input
                            type="date"
                            value={form.data_fim_recolhimento}
                            onChange={(e) => setForm({ ...form, data_fim_recolhimento: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Destino do Produto Recolhido</Label>
                          <Input
                            value={form.destino_produto_recolhido}
                            onChange={(e) => setForm({ ...form, destino_produto_recolhido: e.target.value })}
                          />
                        </div>
                        <div>
                          <Label>Status do Recolhimento</Label>
                          <Select
                            value={form.status_recolhimento}
                            onValueChange={(v) => setForm({ ...form, status_recolhimento: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="iniciado">Iniciado</SelectItem>
                              <SelectItem value="em_andamento">Em Andamento</SelectItem>
                              <SelectItem value="concluido">Concluído</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>

                {/* Tab 5: Conclusão */}
                <TabsContent value="conclusao" className="space-y-4 mt-4">
                  <div>
                    <Label>Conclusão do Relatório</Label>
                    <Textarea
                      rows={4}
                      value={form.conclusao}
                      onChange={(e) => setForm({ ...form, conclusao: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={form.cliente_notificado}
                      onCheckedChange={(v) => setForm({ ...form, cliente_notificado: v })}
                    />
                    <Label>Cliente foi notificado da resolução</Label>
                  </div>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label>Data Resposta ao Cliente</Label>
                      <Input
                        type="date"
                        value={form.data_resposta_cliente}
                        onChange={(e) => setForm({ ...form, data_resposta_cliente: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Satisfação do Cliente</Label>
                      <Select
                        value={form.satisfacao_cliente}
                        onValueChange={(v) => setForm({ ...form, satisfacao_cliente: v })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="satisfeito">Satisfeito</SelectItem>
                          <SelectItem value="parcialmente">Parcialmente Satisfeito</SelectItem>
                          <SelectItem value="insatisfeito">Insatisfeito</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Referência POP</Label>
                    <Input
                      value={form.pop_referencia}
                      onChange={(e) => setForm({ ...form, pop_referencia: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      rows={2}
                      value={form.observacoes}
                      onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <Separator />
              <div className="flex justify-end gap-3">
                <Button variant="outline" onClick={() => setDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar Relatório</Button>
              </div>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── CONTRAPROVA — baseLegal: bpf_geral ── */}
        <TabsContent value="contraprova" className="space-y-6">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">
                    Amostras de Contraprova (Retenção) <BaseLegalBadge assunto="amostra_arquivo" /></h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controle de amostras de retenção com validade de 6 meses. Registros do Recebimento de MP e Produção
                    com contraprova retida. Essencial para defesa em fiscalizações no autocontrole.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* KPIs Contraprova */}
          {(() => {
            const hoje = new Date();
            const totalReceb = contraprovasReceb.length;
            const totalProd = contraprovasProd.length;
            const vencidasReceb = contraprovasReceb.filter(
              (r) => r.contraprova_validade && isBefore(new Date(r.contraprova_validade), hoje),
            ).length;
            const vencidasProd = contraprovasProd.filter(
              (r) => r.contraprova_validade && isBefore(new Date(r.contraprova_validade), hoje),
            ).length;
            const aVencerReceb = contraprovasReceb.filter((r) => {
              if (!r.contraprova_validade) return false;
              const valDate = new Date(r.contraprova_validade);
              return !isBefore(valDate, hoje) && differenceInDays(valDate, hoje) <= 30;
            }).length;
            const aVencerProd = contraprovasProd.filter((r) => {
              if (!r.contraprova_validade) return false;
              const valDate = new Date(r.contraprova_validade);
              return !isBefore(valDate, hoje) && differenceInDays(valDate, hoje) <= 30;
            }).length;

            return (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-primary">{totalReceb}</p>
                    <p className="text-xs text-muted-foreground">Contraprovas MP</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-primary">{totalProd}</p>
                    <p className="text-xs text-muted-foreground">Contraprovas PA</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{aVencerReceb + aVencerProd}</p>
                    <p className="text-xs text-muted-foreground">A vencer (30 dias)</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-4 text-center">
                    <p className="text-2xl font-bold text-destructive">{vencidasReceb + vencidasProd}</p>
                    <p className="text-xs text-muted-foreground">Vencidas</p>
                  </CardContent>
                </Card>
              </div>
            );
          })()}

          {/* Contraprovas MP */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <Package className="w-4 h-4" /> Contraprovas — Recebimento de Matéria-Prima
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contraprovasReceb.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Nenhuma contraprova de MP registrada. Registre no módulo de Recebimento.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Matéria-Prima</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Fornecedor</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contraprovasReceb.map((r: any) => {
                      const hoje = new Date();
                      const valDate = r.contraprova_validade ? new Date(r.contraprova_validade) : null;
                      const vencida = valDate && isBefore(valDate, hoje);
                      const aVencer = valDate && !vencida && differenceInDays(valDate, hoje) <= 30;
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{r.data}</TableCell>
                          <TableCell className="font-medium">{r.materia_prima}</TableCell>
                          <TableCell className="font-mono text-xs">{r.lote || "—"}</TableCell>
                          <TableCell className="text-xs">{r.fornecedor}</TableCell>
                          <TableCell>{r.contraprova_quantidade || "—"}</TableCell>
                          <TableCell>{r.contraprova_local || "—"}</TableCell>
                          <TableCell>{r.contraprova_validade || "—"}</TableCell>
                          <TableCell>
                            {vencida ? (
                              <Badge variant="destructive" className="text-[10px]">
                                Vencida
                              </Badge>
                            ) : aVencer ? (
                              <Badge className="bg-yellow-500/20 text-yellow-700 text-[10px]">A vencer</Badge>
                            ) : (
                              <Badge className="bg-primary/20 text-primary text-[10px]">Válida</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Contraprovas PA */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-display flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Contraprovas — Produto Acabado
              </CardTitle>
            </CardHeader>
            <CardContent>
              {contraprovasProd.length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">
                  Nenhuma contraprova de PA registrada. Registre no módulo de Produção.
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Produto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Quantidade</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contraprovasProd.map((r: any) => {
                      const hoje = new Date();
                      const valDate = r.contraprova_validade ? new Date(r.contraprova_validade) : null;
                      const vencida = valDate && isBefore(valDate, hoje);
                      const aVencer = valDate && !vencida && differenceInDays(valDate, hoje) <= 30;
                      return (
                        <TableRow key={r.id}>
                          <TableCell>{r.data}</TableCell>
                          <TableCell className="font-medium">{r.produto}</TableCell>
                          <TableCell className="font-mono text-xs">{r.lote || "—"}</TableCell>
                          <TableCell>{r.contraprova_quantidade || "—"}</TableCell>
                          <TableCell>{r.contraprova_local || "—"}</TableCell>
                          <TableCell>{r.contraprova_validade || "—"}</TableCell>
                          <TableCell>
                            {vencida ? (
                              <Badge variant="destructive" className="text-[10px]">
                                Vencida
                              </Badge>
                            ) : aVencer ? (
                              <Badge className="bg-yellow-500/20 text-yellow-700 text-[10px]">A vencer</Badge>
                            ) : (
                              <Badge className="bg-primary/20 text-primary text-[10px]">Válida</Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          <Card className="border-muted">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-muted-foreground mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">Regra de Validade — 6 meses (padrão de mercado)</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    As amostras de contraprova (testemunha) devem ser retidas pelo prazo mínimo de 6 meses ou pelo prazo
                    de validade do produto, o que for maior. As amostras vencidas devem ser descartadas conforme POP-08
                    (Controle de Resíduos).
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
