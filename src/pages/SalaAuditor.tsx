import { useState, useEffect, useMemo } from "react";
import { Search, Shield, CheckCircle2, XCircle, AlertTriangle, FileText, ExternalLink, Download, Filter, Loader2, Printer, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import PageHeader from "@/components/PageHeader";
import { useChecklistItems, CHECKLIST_PADRAO } from "@/store/feedbpf-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import GerarLinkAuditor from "@/components/auditor/GerarLinkAuditor";
import { useEmpresa } from "@/hooks/useEmpresa";

interface ModuleStatus {
  label: string;
  path: string;
  count: number;
  description: string;
}

const INSPECTION_MODULES: { key: string; label: string; path: string; table: string; description: string }[] = [
  { key: "documentos", label: "Documentos / POPs", path: "/documentos", table: "documentos", description: "Manual BPF, POPs atualizados (-IV, 42)" },
  { key: "execucao_pops", label: "Execução ITs/POPs", path: "/execucao-pops", table: "execucao_pops", description: "Registros de execução dos 9 POPs" },
  { key: "recebimento_mp", label: "Recebimento MP", path: "/recebimento", table: "recebimento_mp", description: "Controle de recepção com procedência (-XIII)" },
  { key: "producao", label: "Produção", path: "/producao", table: "producao", description: "Registros de fabricação (-XIII)" },
  { key: "rastreabilidade", label: "Rastreabilidade", path: "/rastreabilidade", table: "rastreabilidade", description: "Rastreabilidade MP → Produto Final" },
  { key: "nao_conformidades", label: "Não Conformidades", path: "/nao-conformidades", table: "nao_conformidades", description: "Desvios e ações corretivas (-III)" },
  { key: "treinamentos", label: "Treinamentos", path: "/treinamentos", table: "treinamentos", description: "Capacitação da equipe (-XIV)" },
  { key: "controle_pragas", label: "Controle de Pragas", path: "/pragas", table: "controle_pragas", description: "Programa MIP (POP-002)" },
  { key: "cronogramas_higiene", label: "Higiene / Sanitização", path: "/higiene", table: "cronogramas_higiene", description: "PPHO e cronogramas" },
  { key: "calibracoes", label: "Calibrações", path: "/manutencao", table: "calibracoes", description: "Calibração de equipamentos" },
  { key: "analises_laboratorio", label: "Análises Laboratoriais", path: "/analises", table: "analises_laboratorio", description: "Controle laboratorial" },
  { key: "controle_residuos", label: "Resíduos / Efluentes", path: "/residuos", table: "controle_residuos", description: "Manejo de resíduos – POP-05" },
  { key: "validacao_limpeza_linha", label: "Validação Limpeza", path: "/validacao-limpeza", table: "validacao_limpeza_linha", description: "Contaminação cruzada (-XII)" },
  { key: "fornecedores", label: "Fornecedores", path: "/fornecedores", table: "fornecedores", description: "Qualificação de fornecedores (-XIII)" },
  { key: "produtos", label: "Produtos / Rótulos", path: "/produtos", table: "produtos", description: "Rotulagem" },
];

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function SalaAuditor() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useChecklistItems();
  const [search, setSearch] = useState("");
  const [areaFilter, setAreaFilter] = useState("todas");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [validityFilter, setValidityFilter] = useState("todos");
  const [moduleCounts, setModuleCounts] = useState<Record<string, number>>({});
  const [loadingCounts, setLoadingCounts] = useState(true);
  const [expiredDocs, setExpiredDocs] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoadingCounts(true);

      // Documentos com revisao/validade vencida, para marcar itens do checklist
      const hoje = new Date().toISOString().split("T")[0];
      const { data: docs } = await supabase
        .from("documentos")
        .select("codigo, proxima_revisao, validade_revisao")
        .or(`proxima_revisao.lte.${hoje},validade_revisao.lte.${hoje}`);

      if (docs) {
        setExpiredDocs(new Set(docs.map(d => d.codigo)));
      }

      const counts: Record<string, number> = {};
      const promises = INSPECTION_MODULES.map(async (mod) => {
        const { count, error } = await supabase
          .from(mod.table as any)
          .select("*", { count: "exact", head: true });
        counts[mod.key] = error ? 0 : (count || 0);
      });
      await Promise.all(promises);
      setModuleCounts(counts);
      setLoadingCounts(false);
    };
    fetchData();
  }, [user, empresaAtiva]);

  const areas = useMemo(() => [...new Set(items.map(i => i.area))], [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = search === "" ||
        item.item.toLowerCase().includes(search.toLowerCase()) ||
        item.area.toLowerCase().includes(search.toLowerCase()) ||
        (item.popVinculado || "").toLowerCase().includes(search.toLowerCase());
      
      const matchesArea = areaFilter === "todas" || item.area === areaFilter;
      
      const matchesStatus = statusFilter === "todos" ||
        (statusFilter === "conforme" && item.conforme === true) ||
        (statusFilter === "nao_conforme" && item.conforme === false) ||
        (statusFilter === "pendente" && item.conforme === null);
      const isExpired = item.popVinculado ? expiredDocs.has(item.popVinculado) : false;
      const matchesValidity = validityFilter === "todos" ||
        (validityFilter === "vigentes" && !isExpired) ||
        (validityFilter === "vencidos" && isExpired);

      return matchesSearch && matchesArea && matchesStatus && matchesValidity;
    });
  }, [items, search, areaFilter, statusFilter, validityFilter, expiredDocs]);

  const total = items.length;
  const conformes = items.filter(i => i.conforme === true).length;
  const naoConformes = items.filter(i => i.conforme === false).length;
  const pendentes = items.filter(i => i.conforme === null).length;
  const pct = total > 0 ? Math.round((conformes / total) * 100) : 0;

  const toggleItem = (id: string, value: boolean) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, conforme: item.conforme === value ? null : value } : item));
  };

  const updateObs = (id: string, obs: string) => {
    setItems(prev => prev.map(item => item.id === id ? { ...item, observacao: obs } : item));
  };

  const exportChecklist = () => {
    const now = new Date().toISOString().slice(0, 10);
    let csv = "Área,Item de Verificação,Status,POP Vinculado,Observação\n";
    for (const item of items) {
      const status = item.conforme === true ? "Conforme" : item.conforme === false ? "Não Conforme" : "Pendente";
      csv += [item.area, item.item, status, item.popVinculado || "", item.observacao].map(escapeCsv).join(",") + "\n";
    }
    csv += `\n"Resumo: ${conformes} conformes, ${naoConformes} não conformes, ${pendentes} pendentes — ${pct}% conformidade"\n`;
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `checklist_auditoria_decreto12031_${now}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Checklist exportado!");
  };

  return (
    <>
      <PageHeader icon={Shield} title="Sala do Auditor" description="Acesso centralizado a todos os itens de fiscalização"
        orientacaoModuloId="sala-auditor"  assuntoBaseLegal="autocontrole" />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{total}</p>
          <p className="text-xs text-muted-foreground">Itens Total</p>
        </CardContent></Card>
        <Card className="border-primary/30"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{pct}%</p>
          <p className="text-xs text-muted-foreground">Conformidade</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-success">{conformes}</p>
          <p className="text-xs text-muted-foreground">Conformes</p>
        </CardContent></Card>
        <Card className="border-destructive/30"><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{naoConformes}</p>
          <p className="text-xs text-muted-foreground">Não Conformes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{pendentes}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
      </div>

      <Progress value={pct} className="h-3 mb-6" />

      <Tabs defaultValue="acesso_externo" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="acesso_externo">🔗 Acesso do Auditor</TabsTrigger>
          <TabsTrigger value="checklist">📋 Checklist </TabsTrigger>
          <TabsTrigger value="modulos">📂 Módulos do Sistema</TabsTrigger>
          <TabsTrigger value="audit">🔍 Auditoria de Lotes</TabsTrigger>
        </TabsList>

        <TabsContent value="acesso_externo">
          <GerarLinkAuditor />
        </TabsContent>

        {/* TAB: Checklist */}
        <TabsContent value="checklist" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <CardTitle className="font-display text-base">Verificação de Conformidade</CardTitle>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => window.print()} className="hidden sm:flex">
                  <Printer className="w-4 h-4 mr-1" /> Imprimir Relatório
                </Button>
                <Button size="sm" variant="outline" onClick={exportChecklist}>
                  <Download className="w-4 h-4 mr-1" /> Exportar Checklist
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search and Filters */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar itens, áreas ou POPs..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={areaFilter} onValueChange={setAreaFilter}>
                  <SelectTrigger className="w-full md:w-64">
                    <Filter className="w-4 h-4 mr-1" />
                    <SelectValue placeholder="Área" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as áreas</SelectItem>
                    {areas.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos</SelectItem>
                    <SelectItem value="conforme">✅ Conformes</SelectItem>
                    <SelectItem value="nao_conforme">❌ Não Conformes</SelectItem>
                    <SelectItem value="pendente">⏳ Pendentes</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={validityFilter} onValueChange={setValidityFilter}>
                  <SelectTrigger className="w-full md:w-48">
                    <ShieldCheck className="w-4 h-4 mr-1" />
                    <SelectValue placeholder="Validade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos (Vigência)</SelectItem>
                    <SelectItem value="vigentes">✅ Apenas Vigentes</SelectItem>
                    <SelectItem value="vencidos">⚠️ Vencidos/Perto</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <p className="text-xs text-muted-foreground">{filteredItems.length} itens encontrados</p>

              {/* Grouped items */}
              {areas.filter(a => areaFilter === "todas" || a === areaFilter).map(area => {
                const areaItems = filteredItems.filter(i => i.area === area);
                if (areaItems.length === 0) return null;
                return (
                  <div key={area} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted/50 px-4 py-2 font-medium text-sm">{area}</div>
                    <div className="divide-y">
                      {areaItems.map(item => (
                        <div key={item.id} className={cn(
                          "flex flex-col sm:flex-row sm:items-center gap-2 p-3",
                          item.conforme === false ? "bg-destructive/5" :
                          item.conforme === true ? "bg-primary/5" : ""
                        )}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm">{item.item}</p>
                            {item.popVinculado && (
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-primary font-medium">{item.popVinculado}</span>
                                {expiredDocs.has(item.popVinculado) && (
                                  <Badge variant="destructive" className="text-[9px] h-4 py-0">VENCIDO/REVISÃO</Badge>
                                )}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <Button size="sm" variant={item.conforme === true ? "default" : "outline"} onClick={() => toggleItem(item.id, true)} className="gap-1 h-8">
                              <CheckCircle2 className="w-3 h-3" /> C
                            </Button>
                            <Button size="sm" variant={item.conforme === false ? "destructive" : "outline"} onClick={() => toggleItem(item.id, false)} className="gap-1 h-8">
                              <XCircle className="w-3 h-3" /> NC
                            </Button>
                            <Input placeholder="Obs." value={item.observacao} onChange={e => updateObs(item.id, e.target.value)} className="w-28 md:w-36 text-xs h-8" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Módulos */}
        <TabsContent value="modulos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base">Acesso Rápido aos Módulos de Fiscalização</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Cada módulo abaixo contém registros auditáveis. Clique para acessar diretamente os dados.
              </p>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {INSPECTION_MODULES.map(mod => (
                  <Link key={mod.key} to={mod.path} className="group">
                    <Card className="h-full transition-colors hover:border-primary/50 hover:bg-primary/5">
                      <CardContent className="pt-4">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-medium text-sm group-hover:text-primary transition-colors">{mod.label}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{mod.description}</p>
                          </div>
                          <div className="text-right ml-2">
                            <Badge variant={moduleCounts[mod.key] > 0 ? "default" : "secondary"} className="text-xs">
                              {loadingCounts ? "..." : moduleCounts[mod.key] || 0}
                            </Badge>
                            <ExternalLink className="w-3 h-3 text-muted-foreground mt-1 ml-auto" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="audit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-base text-red-600">Histórico de Auditoria (Lotes e Consumo)</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditHistoryTable />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}

function AuditHistoryTable() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchLogs = async () => {
      const { data, error } = await supabase
        .from("audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(200);
      
      if (!error) setLogs(data);
      setLoading(false);
    };
    fetchLogs();
  }, []);

  const filtered = logs.filter(log => {
    const searchLower = search.toLowerCase();
    const matchesSearch = 
      log.tabela.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.dados_novos || {}).toLowerCase().includes(searchLower) ||
      JSON.stringify(log.dados_anteriores || {}).toLowerCase().includes(searchLower);
    return matchesSearch;
  });

  if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input 
          placeholder="Pesquisar no histórico (Lote, MP, Erro...)" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
          className="pl-10"
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data/Hora</TableHead>
              <TableHead>Tabela</TableHead>
              <TableHead>Ação</TableHead>
              <TableHead>Detalhes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map(log => {
              const dados = log.dados_novos || {};
              const isError = dados.erro || dados.status === 'bloqueado';
              
              return (
                <TableRow key={log.id} className={isError ? "bg-red-50" : ""}>
                  <TableCell className="text-xs whitespace-nowrap">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </TableCell>
                  <TableCell className="text-xs font-mono">{log.tabela}</TableCell>
                  <TableCell>
                    <Badge variant={log.acao === 'criar' ? 'default' : 'outline'}>{log.acao}</Badge>
                  </TableCell>
                  <TableCell className="text-xs max-w-md truncate">
                    {dados.erro ? (
                      <span className="text-red-600 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {dados.erro}: {dados.lote || dados.lote_mp}
                      </span>
                    ) : (
                      <span>
                        {dados.status === 'liberado' ? "Lote Liberado: " : ""}
                        {dados.materia_prima || dados.produto} - Lote: {dados.lote || dados.lote_mp}
                        {dados.quantidade_kg ? ` (${dados.quantidade_kg}kg)` : ""}
                        {dados.justificativa_liberacao ? ` - Just: ${dados.justificativa_liberacao}` : ""}
                      </span>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
