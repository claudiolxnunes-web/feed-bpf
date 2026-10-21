import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import {
  Plus, Trash2, AlertTriangle, Clock, CheckCircle, Bell, CalendarDays,
  TrendingUp, BarChart3, Filter, ChevronDown, ChevronUp, Eye,
  FlaskConical, GraduationCap, Droplets, Shield, Bug, ClipboardCheck, Beaker, Pill, MoreHorizontal
} from "lucide-react";
import { differenceInDays, format, parseISO, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";

interface PlanItem {
  id: string;
  user_id: string;
  categoria: string;
  atividade: string;
  descricao: string;
  frequencia: string;
  quantidade_prevista: number;
  mes_inicio: number;
  proxima_execucao: string | null;
  ultima_execucao: string | null;
  responsavel: string;
  observacoes: string;
  status: string;
}

const CATEGORIAS = [
  { value: "fisico_quimica", label: "Análise Físico-Química (Kjeldahl/NIRs)", icon: FlaskConical, color: "from-blue-500 to-cyan-400" },
  { value: "homogeneidade", label: "Teste de Homogeneidade", icon: Beaker, color: "from-indigo-500 to-purple-400" },
  { value: "microbiologia", label: "Pesquisa Microbiológica", icon: Bug, color: "from-rose-500 to-pink-400" },
  { value: "antibioticos", label: "Pesquisa de Antibióticos", icon: Pill, color: "from-amber-500 to-orange-400" },
  { value: "treinamento_integracao", label: "Treinamento de Integração", icon: GraduationCap, color: "from-emerald-500 to-green-400" },
  { value: "treinamento_rotina", label: "Treinamento de Rotina / POPs", icon: ClipboardCheck, color: "from-teal-500 to-emerald-400" },
  { value: "limpeza_caixa_dagua", label: "Limpeza de Caixa D'Água", icon: Droplets, color: "from-sky-500 to-blue-400" },
  { value: "calibracao", label: "Calibração de Equipamentos", icon: BarChart3, color: "from-violet-500 to-purple-400" },
  { value: "controle_pragas", label: "Controle de Pragas", icon: Shield, color: "from-lime-600 to-green-500" },
  { value: "auditoria_interna", label: "Auditoria Interna", icon: ClipboardCheck, color: "from-slate-600 to-gray-500" },
  { value: "outro", label: "Outro", icon: MoreHorizontal, color: "from-gray-500 to-slate-400" },
];

const FREQUENCIAS = [
  { value: "mensal", label: "Mensal" },
  { value: "bimestral", label: "Bimestral" },
  { value: "trimestral", label: "Trimestral" },
  { value: "semestral", label: "Semestral" },
  { value: "anual", label: "Anual" },
  { value: "sob_demanda", label: "Sob Demanda" },
];

const TEMPLATES: Omit<PlanItem, "id" | "user_id">[] = [
  { categoria: "fisico_quimica", atividade: "Análise Físico-Química – Kjeldahl/NIRs", descricao: "Análise de proteína bruta, umidade, cinzas, fibra, EE.", frequencia: "mensal", quantidade_prevista: 2, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "homogeneidade", atividade: "Teste de Homogeneidade de Mistura", descricao: "Coleta em 10 pontos do misturador para CV% ≤ 10%.", frequencia: "semestral", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "microbiologia", atividade: "Pesquisa Microbiológica", descricao: "Salmonella spp., Enterobactérias.", frequencia: "semestral", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "antibioticos", atividade: "Pesquisa de Antibióticos / Resíduos", descricao: "Monitoramento de resíduos em produtos acabados.", frequencia: "anual", quantidade_prevista: 1, mes_inicio: 6, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "treinamento_integracao", atividade: "Treinamento de Integração", descricao: "Treinamento inicial de novos colaboradores em BPF.", frequencia: "sob_demanda", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "Sempre que houver admissão", status: "ativo" },
  { categoria: "treinamento_rotina", atividade: "Treinamento de Rotina – Produção e POPs", descricao: "Reciclagem periódica em procedimentos e POPs obrigatórios.", frequencia: "trimestral", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
  { categoria: "limpeza_caixa_dagua", atividade: "Limpeza e Higienização de Caixa D'Água", descricao: "Limpeza, desinfecção e análise microbiológica da água.", frequencia: "semestral", quantidade_prevista: 1, mes_inicio: 1, proxima_execucao: null, ultima_execucao: null, responsavel: "", observacoes: "", status: "ativo" },
];

type StatusType = "vencida" | "proxima" | "emdia" | "semdata";

function getStatusInfo(proximaExecucao: string | null): { label: string; type: StatusType; days: number | null; icon: React.ElementType } {
  if (!proximaExecucao) return { label: "Sem data", type: "semdata", days: null, icon: Clock };
  const days = differenceInDays(parseISO(proximaExecucao), new Date());
  if (days < 0) return { label: `Vencida há ${Math.abs(days)}d`, type: "vencida", days, icon: AlertTriangle };
  if (days <= 30) return { label: `Em ${days} dias`, type: "proxima", days, icon: Bell };
  return { label: `Em ${days} dias`, type: "emdia", days, icon: CheckCircle };
}

function getCatInfo(val: string) {
  return CATEGORIAS.find(c => c.value === val) || CATEGORIAS[CATEGORIAS.length - 1];
}
function getFreqLabel(val: string) {
  return FREQUENCIAS.find(f => f.value === val)?.label || val;
}

// Circular progress ring
function ProgressRing({ value, size = 56, stroke = 5, color }: { value: number; size?: number; stroke?: number; color: string }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(value, 100) / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={color}
        strokeWidth={stroke} strokeDasharray={circumference} strokeDashoffset={offset}
        strokeLinecap="round" className="transition-all duration-700 ease-out"
      />
    </svg>
  );
}

export default function PlanejamentoAnual() {
  const { session } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<PlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"cards" | "timeline">("cards");

  const [form, setForm] = useState({
    categoria: "fisico_quimica",
    atividade: "",
    descricao: "",
    frequencia: "mensal",
    quantidade_prevista: 1,
    proxima_execucao: "",
    responsavel: "",
    observacoes: "",
  });

  const fetchItems = async () => {
    if (!session?.user?.id) return;
    let q = supabase
      .from("planejamento_anual")
      .select("*")
      .eq("user_id", session.user.id)
      .order("proxima_execucao", { ascending: true, nullsFirst: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await q;
    if (!error && data) setItems(data as unknown as PlanItem[]);
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [session, empresaAtiva]);

  const handleAdd = async () => {
    if (!session?.user?.id || !form.atividade) { toast.error("Preencha a atividade"); return; }
    const { error } = await supabase.from("planejamento_anual").insert({
      user_id: session.user.id,
      empresa_id: empresaAtiva?.id || null,
      categoria: form.categoria,
      atividade: form.atividade,
      descricao: form.descricao,
      frequencia: form.frequencia,
      quantidade_prevista: form.quantidade_prevista,
      proxima_execucao: form.proxima_execucao || null,
      responsavel: form.responsavel,
      observacoes: form.observacoes,
    } as any);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Atividade adicionada!");
    setForm({ categoria: "fisico_quimica", atividade: "", descricao: "", frequencia: "mensal", quantidade_prevista: 1, proxima_execucao: "", responsavel: "", observacoes: "" });
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("planejamento_anual").delete().eq("id", id);
    toast.success("Removido");
    fetchItems();
  };

  const handleLoadTemplates = async () => {
    if (!session?.user?.id) return;
    const year = new Date().getFullYear();
    const inserts = TEMPLATES.map(t => {
      const freqMonths: Record<string, number> = { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12, sob_demanda: 12 };
      const months = freqMonths[t.frequencia] || 12;
      const proxDate = new Date(year, t.mes_inicio - 1, 15);
      if (proxDate < new Date()) proxDate.setMonth(proxDate.getMonth() + months);
      return { ...t, user_id: session.user.id, empresa_id: empresaAtiva?.id || null, proxima_execucao: format(proxDate, "yyyy-MM-dd") };
    });
    const { error } = await supabase.from("planejamento_anual").insert(inserts as any);
    if (error) { toast.error("Erro ao carregar modelos"); return; }
    toast.success("Modelos carregados com sucesso!");
    fetchItems();
  };

  const handleMarkDone = async (item: PlanItem) => {
    const freqMonths: Record<string, number> = { mensal: 1, bimestral: 2, trimestral: 3, semestral: 6, anual: 12, sob_demanda: 0 };
    const months = freqMonths[item.frequencia] || 0;
    const today = format(new Date(), "yyyy-MM-dd");
    const nextDate = months > 0 ? format(addMonths(new Date(), months), "yyyy-MM-dd") : null;
    await supabase.from("planejamento_anual").update({
      ultima_execucao: today,
      proxima_execucao: nextDate,
    } as any).eq("id", item.id);
    toast.success("✅ Execução registrada! Próxima data atualizada.");
    fetchItems();
  };

  const filtered = useMemo(() => {
    if (activeTab === "todos") return items;
    if (activeTab === "vencidas") return items.filter(i => i.proxima_execucao && differenceInDays(parseISO(i.proxima_execucao), new Date()) < 0);
    if (activeTab === "proximas") return items.filter(i => i.proxima_execucao && differenceInDays(parseISO(i.proxima_execucao), new Date()) >= 0 && differenceInDays(parseISO(i.proxima_execucao), new Date()) <= 30);
    return items.filter(i => i.categoria === activeTab);
  }, [items, activeTab]);

  const vencidasCount = items.filter(i => i.proxima_execucao && differenceInDays(parseISO(i.proxima_execucao), new Date()) < 0).length;
  const proximasCount = items.filter(i => i.proxima_execucao && differenceInDays(parseISO(i.proxima_execucao), new Date()) >= 0 && differenceInDays(parseISO(i.proxima_execucao), new Date()) <= 30).length;
  const emDiaCount = items.length - vencidasCount - proximasCount;
  const compliancePercent = items.length > 0 ? Math.round((emDiaCount / items.length) * 100) : 100;

  // Group by month for timeline
  const monthGroups = useMemo(() => {
    const groups: Record<string, PlanItem[]> = {};
    filtered.forEach(item => {
      const key = item.proxima_execucao
        ? format(parseISO(item.proxima_execucao), "yyyy-MM")
        : "sem-data";
      if (!groups[key]) groups[key] = [];
      groups[key].push(item);
    });
    return Object.entries(groups).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const statusColorMap: Record<StatusType, string> = {
    vencida: "hsl(0, 72%, 51%)",
    proxima: "hsl(38, 92%, 50%)",
    emdia: "hsl(145, 63%, 42%)",
    semdata: "hsl(150, 10%, 45%)",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Planejamento Anual de Atividades"
        description="Cronograma de análises, treinamentos e atividades obrigatórias com alertas inteligentes"
        orientacaoModuloId="planejamento-anual"
      />

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Ring */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="relative flex items-center justify-center">
              <ProgressRing value={compliancePercent} color="hsl(var(--primary))" />
              <span className="absolute text-sm font-bold text-primary">{compliancePercent}%</span>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Conformidade</p>
              <p className="text-lg font-bold text-foreground">{emDiaCount}/{items.length}</p>
            </div>
          </CardContent>
        </Card>

        {/* Overdue */}
        <Card className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${vencidasCount > 0 ? "border-destructive/50 shadow-destructive/10" : ""}`}>
          <div className={`absolute inset-0 ${vencidasCount > 0 ? "bg-gradient-to-br from-destructive/5 to-destructive/10" : ""} opacity-0 group-hover:opacity-100 transition-opacity`} />
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`p-3 rounded-xl ${vencidasCount > 0 ? "bg-destructive/10" : "bg-muted"} transition-colors`}>
              <AlertTriangle className={`h-6 w-6 ${vencidasCount > 0 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Vencidas</p>
              <p className="text-2xl font-bold text-foreground">{vencidasCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* Upcoming */}
        <Card className={`relative overflow-hidden group hover:shadow-lg transition-all duration-300 ${proximasCount > 0 ? "border-accent/50" : ""}`}>
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className={`p-3 rounded-xl ${proximasCount > 0 ? "bg-accent/10" : "bg-muted"} transition-colors`}>
              <Bell className={`h-6 w-6 ${proximasCount > 0 ? "text-accent" : "text-muted-foreground"}`} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Próximas</p>
              <p className="text-2xl font-bold text-foreground">{proximasCount}</p>
            </div>
          </CardContent>
        </Card>

        {/* On Track */}
        <Card className="relative overflow-hidden group hover:shadow-lg transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardContent className="flex items-center gap-4 p-5">
            <div className="p-3 rounded-xl bg-primary/10 transition-colors">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Em Dia</p>
              <p className="text-2xl font-bold text-foreground">{emDiaCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shadow-md hover:shadow-lg transition-shadow">
              <Plus className="h-4 w-4" /> Nova Atividade
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-primary" />
                Adicionar Atividade
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 pt-2">
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Categoria</Label>
                <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(c => {
                      const Icon = c.icon;
                      return (
                        <SelectItem key={c.value} value={c.value}>
                          <span className="flex items-center gap-2"><Icon className="h-4 w-4" /> {c.label}</span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Atividade *</Label>
                <Input value={form.atividade} onChange={e => setForm({ ...form, atividade: e.target.value })} placeholder="Nome da atividade" />
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Textarea value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} rows={2} placeholder="Detalhes..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Frequência</Label>
                  <Select value={form.frequencia} onValueChange={v => setForm({ ...form, frequencia: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{FREQUENCIAS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Qtd. Prevista</Label>
                  <Input type="number" min={1} value={form.quantidade_prevista} onChange={e => setForm({ ...form, quantidade_prevista: parseInt(e.target.value) || 1 })} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Próxima Execução</Label>
                  <Input type="date" value={form.proxima_execucao} onChange={e => setForm({ ...form, proxima_execucao: e.target.value })} />
                </div>
                <div>
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground">Responsável</Label>
                  <Input value={form.responsavel} onChange={e => setForm({ ...form, responsavel: e.target.value })} placeholder="Nome" />
                </div>
              </div>
              <div>
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Observações</Label>
                <Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} rows={2} />
              </div>
              <Button onClick={handleAdd} className="w-full gap-2">
                <CheckCircle className="h-4 w-4" /> Salvar Atividade
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {items.length === 0 && (
          <Button variant="outline" onClick={handleLoadTemplates} className="gap-2">
            <CalendarDays className="h-4 w-4" /> Carregar Modelo Padrão
          </Button>
        )}

        <div className="ml-auto flex items-center gap-2">
          <Button
            variant={viewMode === "cards" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("cards")}
            className="gap-1"
          >
            <BarChart3 className="h-3.5 w-3.5" /> Cards
          </Button>
          <Button
            variant={viewMode === "timeline" ? "default" : "outline"}
            size="sm"
            onClick={() => setViewMode("timeline")}
            className="gap-1"
          >
            <CalendarDays className="h-3.5 w-3.5" /> Timeline
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="flex-wrap h-auto bg-muted/50 p-1">
          <TabsTrigger value="todos" className="gap-1.5 data-[state=active]:shadow-sm">
            Todos <Badge variant="secondary" className="ml-1 text-xs h-5">{items.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="vencidas" className="gap-1.5 data-[state=active]:shadow-sm">
            <AlertTriangle className="h-3.5 w-3.5" /> Vencidas
            {vencidasCount > 0 && <Badge variant="destructive" className="ml-1 text-xs h-5">{vencidasCount}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="proximas" className="gap-1.5 data-[state=active]:shadow-sm">
            <Bell className="h-3.5 w-3.5" /> Próximas
            {proximasCount > 0 && <Badge className="ml-1 text-xs h-5 bg-accent text-accent-foreground">{proximasCount}</Badge>}
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-4">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <div className="h-10 w-10 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
              <p className="text-muted-foreground text-sm">Carregando atividades...</p>
            </div>
          ) : filtered.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="p-4 rounded-full bg-muted">
                  <CalendarDays className="h-10 w-10 text-muted-foreground" />
                </div>
                <div className="text-center">
                  <p className="font-semibold text-foreground">Nenhuma atividade encontrada</p>
                  <p className="text-sm text-muted-foreground mt-1">Clique em "Carregar Modelo Padrão" para iniciar seu planejamento</p>
                </div>
              </CardContent>
            </Card>
          ) : viewMode === "cards" ? (
            /* Card Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              <TooltipProvider>
                {filtered.map((item, idx) => {
                  const st = getStatusInfo(item.proxima_execucao);
                  const cat = getCatInfo(item.categoria);
                  const CatIcon = cat.icon;
                  const StIcon = st.icon;
                  const isExpanded = expandedId === item.id;

                  return (
                    <Card
                      key={item.id}
                      className={`group relative overflow-hidden transition-all duration-300 hover:shadow-lg cursor-pointer ${
                        st.type === "vencida" ? "border-destructive/40 shadow-sm shadow-destructive/5" :
                        st.type === "proxima" ? "border-accent/40 shadow-sm shadow-accent/5" : "hover:border-primary/30"
                      }`}
                      style={{ animationDelay: `${idx * 50}ms` }}
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                    >
                      {/* Top gradient accent */}
                      <div className={`h-1 w-full bg-gradient-to-r ${cat.color}`} />

                      <CardHeader className="pb-2 pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg bg-gradient-to-br ${cat.color} text-white shadow-sm`}>
                              <CatIcon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <CardTitle className="text-sm font-semibold leading-tight line-clamp-2">
                                {item.atividade}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground mt-0.5">{cat.label}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-2">
                            <Badge
                              variant="outline"
                              className={`text-[10px] gap-1 px-2 py-0.5 ${
                                st.type === "vencida" ? "border-destructive/50 text-destructive bg-destructive/5" :
                                st.type === "proxima" ? "border-accent/50 text-accent bg-accent/5" :
                                st.type === "emdia" ? "border-primary/50 text-primary bg-primary/5" :
                                "border-muted text-muted-foreground"
                              }`}
                            >
                              <StIcon className="h-3 w-3" />
                              {st.label}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>

                      <CardContent className="pt-0 pb-3">
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {getFreqLabel(item.frequencia)}
                          </span>
                          {item.responsavel && (
                            <span className="truncate max-w-[120px]">👤 {item.responsavel}</span>
                          )}
                        </div>

                        {/* Date line */}
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-border/50">
                          <div className="text-xs">
                            <span className="text-muted-foreground">Próxima: </span>
                            <span className="font-medium text-foreground">
                              {item.proxima_execucao ? format(parseISO(item.proxima_execucao), "dd MMM yyyy", { locale: ptBR }) : "—"}
                            </span>
                          </div>
                          {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="mt-3 pt-3 border-t border-border/50 space-y-3 animate-fade-in">
                            {item.descricao && (
                              <p className="text-xs text-muted-foreground leading-relaxed">{item.descricao}</p>
                            )}
                            <div className="grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-muted-foreground">Última execução:</span>
                                <p className="font-medium">{item.ultima_execucao ? format(parseISO(item.ultima_execucao), "dd/MM/yyyy") : "—"}</p>
                              </div>
                              <div>
                                <span className="text-muted-foreground">Qtd. prevista:</span>
                                <p className="font-medium">{item.quantidade_prevista}x</p>
                              </div>
                            </div>
                            {item.observacoes && (
                              <p className="text-xs italic text-muted-foreground bg-muted/50 rounded-md p-2">💡 {item.observacoes}</p>
                            )}
                            <div className="flex gap-2 pt-1">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex-1 gap-1.5 text-xs hover:bg-primary/10 hover:text-primary hover:border-primary/30"
                                    onClick={(e) => { e.stopPropagation(); handleMarkDone(item); }}
                                  >
                                    <CheckCircle className="h-3.5 w-3.5" /> Registrar Execução
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Marca como executada e calcula próxima data</TooltipContent>
                              </Tooltip>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-xs hover:bg-destructive/10 hover:text-destructive"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id); }}
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Remover atividade</TooltipContent>
                              </Tooltip>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </TooltipProvider>
            </div>
          ) : (
            /* Timeline View */
            <div className="relative space-y-6">
              {monthGroups.map(([monthKey, groupItems]) => {
                const monthLabel = monthKey === "sem-data"
                  ? "Sem Data Definida"
                  : format(parseISO(`${monthKey}-01`), "MMMM yyyy", { locale: ptBR });

                return (
                  <div key={monthKey} className="relative">
                    {/* Month Header */}
                    <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm py-2 mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-3 w-3 rounded-full bg-primary shadow-sm shadow-primary/30" />
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-primary capitalize">{monthLabel}</h3>
                        <div className="flex-1 h-px bg-border" />
                        <Badge variant="secondary" className="text-xs">{groupItems.length} atividade{groupItems.length > 1 ? "s" : ""}</Badge>
                      </div>
                    </div>

                    {/* Items in this month */}
                    <div className="ml-[22px] border-l-2 border-border pl-6 space-y-3">
                      <TooltipProvider>
                        {groupItems.map(item => {
                          const st = getStatusInfo(item.proxima_execucao);
                          const cat = getCatInfo(item.categoria);
                          const CatIcon = cat.icon;

                          return (
                            <div key={item.id} className="relative group">
                              {/* Timeline dot */}
                              <div className={`absolute -left-[31px] top-4 h-2.5 w-2.5 rounded-full border-2 border-background ${
                                st.type === "vencida" ? "bg-destructive" :
                                st.type === "proxima" ? "bg-accent" : "bg-primary"
                              }`} />

                              <Card className="transition-all hover:shadow-md">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                      <div className={`p-1.5 rounded-lg bg-gradient-to-br ${cat.color} text-white`}>
                                        <CatIcon className="h-3.5 w-3.5" />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-sm font-medium truncate">{item.atividade}</p>
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                          <span>{getFreqLabel(item.frequencia)}</span>
                                          {item.proxima_execucao && (
                                            <>
                                              <span>•</span>
                                              <span>{format(parseISO(item.proxima_execucao), "dd MMM", { locale: ptBR })}</span>
                                            </>
                                          )}
                                          {item.responsavel && (
                                            <>
                                              <span>•</span>
                                              <span>👤 {item.responsavel}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                      <Badge
                                        variant="outline"
                                        className={`text-[10px] ${
                                          st.type === "vencida" ? "border-destructive/50 text-destructive" :
                                          st.type === "proxima" ? "border-accent/50 text-accent" :
                                          "border-primary/50 text-primary"
                                        }`}
                                      >
                                        {st.label}
                                      </Badge>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-primary/10" onClick={() => handleMarkDone(item)}>
                                            <CheckCircle className="h-4 w-4 text-primary" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Registrar execução</TooltipContent>
                                      </Tooltip>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                                            <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
                                          </Button>
                                        </TooltipTrigger>
                                        <TooltipContent>Remover</TooltipContent>
                                      </Tooltip>
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            </div>
                          );
                        })}
                      </TooltipProvider>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
