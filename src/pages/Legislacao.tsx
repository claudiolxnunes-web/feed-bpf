import { useState, useEffect, useRef } from "react";
import { Scale, Sparkles, Loader2, RefreshCw, Bell, BookOpen, CheckCircle2, AlertTriangle, Info, Eye, Search, Upload, FileText, Trash2, ExternalLink, Plus, X, FolderOpen, Globe, Filter, Save, ShieldAlert, Ban } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

// ──── Types ────

interface Alerta {
  titulo: string;
  resumo: string;
  fonte: string;
  tipo: string;
  relevancia: string;
  data_aproximada: string;
}

interface ResumoSistema {
  // Opcional de proposito: a resposta da IA nem sempre traz este campo.
  // Declarar como obrigatorio nao impede a ausencia em tempo de execucao.
  modulos_implementados?: { modulo: string; descricao: string; status: string }[];
  resumo_executivo: string;
  recomendacoes: string[];
}

interface AlertaDB {
  id: string;
  titulo: string;
  resumo: string;
  fonte: string | null;
  tipo: string | null;
  relevancia: string | null;
  data_publicacao: string | null;
  lido: boolean | null;
  created_at: string;
}

interface NormaDB {
  id: string;
  titulo: string;
  codigo: string | null;
  tipo: string | null;
  orgao: string | null;
  data_publicacao: string | null;
  resumo: string | null;
  arquivo_nome: string | null;
  arquivo_url: string | null;
  tags: string[] | null;
  created_at: string;
}

const tipoConfig: Record<string, { label: string; icon: typeof Bell; className: string }> = {
  atualizacao: { label: "Atualização", icon: RefreshCw, className: "bg-blue-500/20 text-blue-700" },
  nova_norma: { label: "Nova Norma", icon: BookOpen, className: "bg-primary/20 text-primary" },
  revogacao: { label: "Revogação", icon: AlertTriangle, className: "bg-destructive/20 text-destructive" },
  alerta: { label: "Alerta", icon: Bell, className: "bg-yellow-500/20 text-yellow-700" },
};

const relevanciaConfig: Record<string, { label: string; className: string }> = {
  alta: { label: "Alta", className: "bg-destructive/20 text-destructive" },
  media: { label: "Média", className: "bg-yellow-500/20 text-yellow-700" },
  baixa: { label: "Baixa", className: "bg-muted text-muted-foreground" },
};

const TIPO_NORMA_OPTIONS = [
  { value: "instrucao_normativa", label: "Instrução Normativa" },
  { value: "decreto", label: "Decreto" },
  { value: "lei", label: "Lei" },
  { value: "portaria", label: "Portaria" },
  { value: "resolucao", label: "Resolução" },
  { value: "nota_tecnica", label: "Nota Técnica" },
  { value: "outro", label: "Outro" },
];

const ORGAO_OPTIONS = ["MAPA", "ANVISA", "IBAMA", "MMA", "Presidência", "Outro"];

// ──── Main Component ────

export default function Legislacao() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();

  // Alertas state
  const [loading, setLoading] = useState(false);
  const [loadingResumo, setLoadingResumo] = useState(false);
  const [alertas, setAlertas] = useState<AlertaDB[]>([]);
  const [alertasIA, setAlertasIA] = useState<Alerta[]>([]);
  const [resumoGeral, setResumoGeral] = useState("");
  const [resumoSistema, setResumoSistema] = useState<ResumoSistema | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [selectedAlerta, setSelectedAlerta] = useState<AlertaDB | Alerta | null>(null);
  const [fetchingDB, setFetchingDB] = useState(true);

  // Normas state
  const [normas, setNormas] = useState<NormaDB[]>([]);
  const [normasLoading, setNormasLoading] = useState(true);
  const [normaSearch, setNormaSearch] = useState("");
  const [normaDialogOpen, setNormaDialogOpen] = useState(false);
  const [savingNorma, setSavingNorma] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const quickUploadRef = useRef<HTMLInputElement>(null);
  const [quickUploading, setQuickUploading] = useState(false);

  // Pesquisa SISLEGIS state
  const [pesquisaTermo, setPesquisaTermo] = useState("");
  const [pesquisaCategoria, setPesquisaCategoria] = useState("todas");
  const [pesquisaLoading, setPesquisaLoading] = useState(false);
  const [pesquisaResultados, setPesquisaResultados] = useState<any[]>([]);
  const [pesquisaResumo, setPesquisaResumo] = useState("");

  const [normaForm, setNormaForm] = useState({
    titulo: "",
    codigo: "",
    tipo: "instrucao_normativa",
    orgao: "MAPA",
    data_publicacao: "",
    resumo: "",
    arquivo_nome: "",
    arquivo_url: "",
    tags: "" as string,
  });

  // ──── Alertas logic ────

  const fetchAlertas = async () => {
    if (!user) return;
    let q = supabase
      .from("legislacao_alertas")
      .select("*")
      .order("created_at", { ascending: false });
    // Normas sem empresa formam a base comum (legislacao federal, igual para
    // todas as fabricas). Normas com empresa sao especificas do cliente.
    // Filtrar apenas por empresa esconderia a base comum.
    if (empresaAtiva) {
      q = q.or(`empresa_id.is.null,empresa_id.eq.${empresaAtiva.id}`);
    }
    const { data } = await q;
    if (data) setAlertas(data as unknown as AlertaDB[]);
    setFetchingDB(false);
  };

  useEffect(() => { fetchAlertas(); fetchNormas(); }, [user, empresaAtiva]);

  const buscarAtualizacoes = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("legislacao-ai", {
        body: { action: "buscar_atualizacoes" },
      });
      if (error) { toast.error("Erro ao buscar atualizações: " + error.message); setLoading(false); return; }
      if (data?.error) { toast.error(data.error); setLoading(false); return; }

      const result = data?.data;
      if (result?.alertas) {
        setAlertasIA(result.alertas);
        setResumoGeral(result.resumo_geral || "");
        const records = result.alertas.map((a: Alerta) => ({
          user_id: user.id,
          empresa_id: empresaAtiva?.id || null,
          titulo: a.titulo,
          resumo: a.resumo,
          fonte: a.fonte || "",
          tipo: a.tipo || "atualizacao",
          relevancia: a.relevancia || "media",
          data_publicacao: a.data_aproximada || new Date().toISOString().split("T")[0],
        }));
        await supabase.from("legislacao_alertas").insert(records as any);
        fetchAlertas();
        toast.success(`${result.alertas.length} alertas encontrados e salvos!`);
      } else {
        toast.warning("Nenhum alerta retornado pela IA.");
      }
    } catch (err) {
      toast.error("Erro ao conectar com a IA");
      console.error(err);
    }
    setLoading(false);
  };

  const buscarResumoSistema = async () => {
    setLoadingResumo(true);
    try {
      const { data, error } = await supabase.functions.invoke("legislacao-ai", {
        body: { action: "resumo_sistema" },
      });
      if (error) { toast.error("Erro ao gerar resumo: " + error.message); setLoadingResumo(false); return; }
      if (data?.error) { toast.error(data.error); setLoadingResumo(false); return; }
      const result = data?.data;
      if (result) { setResumoSistema(result as ResumoSistema); toast.success("Resumo do sistema gerado!"); }
    } catch (err) { toast.error("Erro ao conectar com a IA"); console.error(err); }
    setLoadingResumo(false);
  };

  const marcarLido = async (id: string) => {
    await supabase.from("legislacao_alertas").update({ lido: true } as any).eq("id", id);
    fetchAlertas();
  };

  // ──── Normas logic ────

  const fetchNormas = async () => {
    if (!user) return;
    setNormasLoading(true);
    let q = supabase
      .from("normas_legislacao")
      .select("*")
      .order("created_at", { ascending: false });
    // Normas sem empresa formam a base comum (legislacao federal, igual para
    // todas as fabricas). Normas com empresa sao especificas do cliente.
    // Filtrar apenas por empresa esconderia a base comum.
    if (empresaAtiva) {
      q = q.or(`empresa_id.is.null,empresa_id.eq.${empresaAtiva.id}`);
    }
    const { data } = await q;
    if (data) setNormas(data as unknown as NormaDB[]);
    setNormasLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingFile(true);

    const empresaSegment = empresaAtiva ? `${empresaAtiva.id}/` : "";
    const path = `${user.id}/${empresaSegment}${Date.now()}_${file.name}`;

    const { error } = await supabase.storage.from("normas_legislacao").upload(path, file);
    if (error) {
      toast.error("Erro ao enviar arquivo: " + error.message);
      setUploadingFile(false);
      return;
    }

    const { data: urlData } = supabase.storage.from("normas_legislacao").getPublicUrl(path);

    setNormaForm(prev => ({
      ...prev,
      arquivo_nome: file.name,
      arquivo_url: urlData.publicUrl,
    }));
    toast.success("Arquivo enviado!");
    setUploadingFile(false);
  };

  const handleSaveNorma = async () => {
    if (!user || !normaForm.titulo.trim()) {
      toast.error("Título é obrigatório.");
      return;
    }
    setSavingNorma(true);

    const payload = {
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      titulo: normaForm.titulo,
      codigo: normaForm.codigo,
      tipo: normaForm.tipo,
      orgao: normaForm.orgao,
      data_publicacao: normaForm.data_publicacao || null,
      resumo: normaForm.resumo,
      arquivo_nome: normaForm.arquivo_nome,
      arquivo_url: normaForm.arquivo_url,
      tags: normaForm.tags ? normaForm.tags.split(",").map(t => t.trim()).filter(Boolean) : [],
    };

    const { error } = await supabase.from("normas_legislacao").insert(payload as any);
    if (error) { toast.error("Erro: " + error.message); }
    else {
      toast.success("Norma salva com sucesso!");
      setNormaDialogOpen(false);
      resetNormaForm();
      fetchNormas();
    }
    setSavingNorma(false);
  };

  const handleDeleteNorma = async (id: string) => {
    const { error } = await supabase.from("normas_legislacao").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir: " + error.message);
    else { toast.success("Norma excluída."); fetchNormas(); }
  };

  const resetNormaForm = () => {
    setNormaForm({ titulo: "", codigo: "", tipo: "instrucao_normativa", orgao: "MAPA", data_publicacao: "", resumo: "", arquivo_nome: "", arquivo_url: "", tags: "" });
  };

  const handleQuickUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0 || !user) return;
    setQuickUploading(true);
    let successCount = 0;

    for (const file of Array.from(files)) {
      const safeName = file.name
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "_");
      const empresaSegment = empresaAtiva ? `${empresaAtiva.id}/` : "";
      const path = `${user.id}/${empresaSegment}${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from("normas_legislacao").upload(path, file);
      if (uploadError) {
        toast.error(`Erro ao enviar "${file.name}": ${uploadError.message}`);
        continue;
      }
      const { data: urlData } = supabase.storage.from("normas_legislacao").getPublicUrl(path);
      const titulo = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");
      const ext = file.name.split(".").pop()?.toLowerCase() || "";
      const tipo = ext === "pdf" ? "instrucao_normativa" : "outro";

      const { error: insertError } = await supabase.from("normas_legislacao").insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        titulo,
        codigo: "",
        tipo,
        orgao: "MAPA",
        arquivo_nome: file.name,
        arquivo_url: urlData.publicUrl,
        tags: [],
      } as any);

      if (insertError) {
        toast.error(`Erro ao salvar "${file.name}": ${insertError.message}`);
      } else {
        successCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount} arquivo(s) importado(s) com sucesso!`);
      fetchNormas();
    }
    setQuickUploading(false);
    if (quickUploadRef.current) quickUploadRef.current.value = "";
  };

  const filteredNormas = normas.filter(n => {
    if (!normaSearch) return true;
    const q = normaSearch.toLowerCase();
    return (
      n.titulo.toLowerCase().includes(q) ||
      (n.codigo || "").toLowerCase().includes(q) ||
      (n.orgao || "").toLowerCase().includes(q) ||
      (n.resumo || "").toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q))
    );
  });

  const pesquisarLegislacao = async () => {
    if (!user) return;
    setPesquisaLoading(true);
    setPesquisaResultados([]);
    setPesquisaResumo("");
    try {
      const { data, error } = await supabase.functions.invoke("legislacao-ai", {
        body: { action: "pesquisar_legislacao", termo: pesquisaTermo || "alimentação animal", categoria: pesquisaCategoria },
      });
      if (error) { toast.error("Erro na pesquisa: " + error.message); setPesquisaLoading(false); return; }
      if (data?.error) { toast.error(data.error); setPesquisaLoading(false); return; }
      const result = data?.data;
      if (result?.resultados) {
        setPesquisaResultados(result.resultados);
        setPesquisaResumo(result.resumo_pesquisa || "");
        toast.success(`${result.resultados.length} resultado(s) encontrado(s)`);
      } else {
        toast.warning("Nenhum resultado encontrado.");
      }
    } catch (err) {
      toast.error("Erro ao conectar com a IA");
      console.error(err);
    }
    setPesquisaLoading(false);
  };

  const salvarResultadoComoNorma = async (resultado: any) => {
    if (!user) return;
    const { error } = await supabase.from("normas_legislacao").insert({
      user_id: user.id,
      titulo: resultado.titulo,
      codigo: resultado.codigo || "",
      tipo: resultado.tipo === "consulta_publica" ? "outro" : (resultado.tipo || "instrucao_normativa"),
      orgao: resultado.orgao || "MAPA",
      data_publicacao: resultado.data_publicacao || null,
      resumo: resultado.resumo + (resultado.impacto_bpf ? `\n\nImpacto BPF: ${resultado.impacto_bpf}` : ""),
      arquivo_url: resultado.link_referencia || "",
      arquivo_nome: resultado.link_referencia ? "Link SISLEGIS" : "",
      tags: [resultado.categoria || "pesquisa", "sislegis"],
    } as any);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else { toast.success("Norma salva na biblioteca!"); fetchNormas(); }
  };

  const categoriaLabel = (cat: string) => {
    const map: Record<string, string> = { nova: "Nova", alteracao: "Alteração", consulta_publica: "Consulta Pública" };
    return map[cat] || cat;
  };

  const statusLabel = (s: string) => {
    const map: Record<string, { label: string; cls: string }> = {
      vigente: { label: "Vigente", cls: "bg-primary/20 text-primary" },
      revogada: { label: "Revogada", cls: "bg-destructive/20 text-destructive" },
      em_consulta: { label: "Em Consulta", cls: "bg-yellow-500/20 text-yellow-700" },
      aprovada: { label: "Aprovada", cls: "bg-primary/20 text-primary" },
    };
    return map[s] || { label: s, cls: "bg-muted text-muted-foreground" };
  };
  const tipoNormaLabel = (tipo: string) => TIPO_NORMA_OPTIONS.find(t => t.value === tipo)?.label || tipo;

  const naoLidos = alertas.filter(a => !a.lido).length;

  return (
    <>
      <PageHeader
        icon={Scale}
        title="Legislação & IA"
        description="Atualizações legislativas, biblioteca de normas e análise com IA"
        orientacaoModuloId="legislacao"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{alertas.length}</p>
          <p className="text-xs text-muted-foreground">Total alertas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{naoLidos}</p>
          <p className="text-xs text-muted-foreground">Não lidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{normas.length}</p>
          <p className="text-xs text-muted-foreground">Normas salvas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-info">{resumoSistema?.modulos_implementados?.length ?? "—"}</p>
          <p className="text-xs text-muted-foreground">Módulos analisados</p>
        </CardContent></Card>
      </div>

      <Tabs defaultValue="normas" className="space-y-4">
        <TabsList>
          <TabsTrigger value="normas">
            <BookOpen className="w-4 h-4 mr-1" />
            Biblioteca de Normas
          </TabsTrigger>
          <TabsTrigger value="alertas">
            <Bell className="w-4 h-4 mr-1" />
            Alertas
            {naoLidos > 0 && <Badge className="ml-2 bg-destructive text-destructive-foreground text-xs">{naoLidos}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="pesquisa">
            <Globe className="w-4 h-4 mr-1" />
            Pesquisa SISLEGIS
          </TabsTrigger>
          <TabsTrigger value="resumo">
            <Sparkles className="w-4 h-4 mr-1" />
            Resumo IA
          </TabsTrigger>
          <TabsTrigger value="rotulagem">
            <FileText className="w-4 h-4 mr-1" />
            IN 17/2017
          </TabsTrigger>
          <TabsTrigger value="substancias">
            <ShieldAlert className="w-4 h-4 mr-1" />
            Substâncias Proibidas
          </TabsTrigger>
        </TabsList>

        {/* ──── Tab: Biblioteca de Normas ──── */}
        <TabsContent value="normas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-3">
              <CardTitle className="font-display flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                Biblioteca de Normas e Legislações
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                <input
                  ref={quickUploadRef}
                  type="file"
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.txt,.csv"
                  multiple
                  className="hidden"
                  onChange={handleQuickUpload}
                />
                <Button variant="outline" onClick={() => quickUploadRef.current?.click()} disabled={quickUploading}>
                  {quickUploading ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <FolderOpen className="w-4 h-4 mr-1" />}
                  {quickUploading ? "Importando..." : "Importar do Dispositivo"}
                </Button>
                <Button onClick={() => { resetNormaForm(); setNormaDialogOpen(true); }}>
                  <Plus className="w-4 h-4 mr-1" /> Adicionar Norma
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {/* Search bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar normas por título, código, órgão ou tags..."
                  value={normaSearch}
                  onChange={(e) => setNormaSearch(e.target.value)}
                  className="pl-9"
                />
              </div>

              {normasLoading ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : filteredNormas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>{normaSearch ? "Nenhuma norma encontrada para esta pesquisa." : "Nenhuma norma cadastrada ainda."}</p>
                  <p className="text-sm mt-1">Clique em "Adicionar Norma" para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Código</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Órgão</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Arquivo</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNormas.map((norma) => (
                      <TableRow key={norma.id}>
                        <TableCell className="font-mono text-xs font-medium">{norma.codigo || "—"}</TableCell>
                        <TableCell className="max-w-xs">
                          <p className="font-medium text-sm truncate">{norma.titulo}</p>
                          {norma.tags && norma.tags.length > 0 && (
                            <div className="flex gap-1 mt-1 flex-wrap">
                              {norma.tags.map((tag, i) => (
                                <Badge key={i} variant="outline" className="text-[10px]">{tag}</Badge>
                              ))}
                            </div>
                          )}
                        </TableCell>
                        <TableCell><Badge variant="secondary" className="text-xs">{tipoNormaLabel(norma.tipo || "")}</Badge></TableCell>
                        <TableCell className="text-xs">{norma.orgao}</TableCell>
                        <TableCell className="text-xs">{norma.data_publicacao || "—"}</TableCell>
                        <TableCell>
                          {norma.arquivo_url ? (
                            <a href={norma.arquivo_url} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="sm">
                                <FileText className="w-4 h-4 mr-1" />
                                <span className="text-xs truncate max-w-[80px]">{norma.arquivo_nome || "Abrir"}</span>
                              </Button>
                            </a>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {norma.resumo && (
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAlerta({ titulo: norma.titulo, resumo: norma.resumo || "", fonte: norma.orgao || "", tipo: "nova_norma", relevancia: "media", data_aproximada: norma.data_publicacao || "" }); setDetailOpen(true); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={() => handleDeleteNorma(norma.id)}>
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
        </TabsContent>

        {/* ──── Tab: Alertas ──── */}
        <TabsContent value="alertas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Scale className="w-5 h-5 text-primary" />
                Atualizações da Legislação
              </CardTitle>
              <Button onClick={buscarAtualizacoes} disabled={loading} className="bg-primary hover:bg-primary/90">
                {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loading ? "Consultando IA..." : "Buscar Atualizações com IA"}
              </Button>
            </CardHeader>
            <CardContent>
              {resumoGeral && (
                <div className="mb-4 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-primary mb-1">Panorama Regulatório</p>
                      <p className="text-sm text-muted-foreground">{resumoGeral}</p>
                    </div>
                  </div>
                </div>
              )}

              {fetchingDB ? (
                <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : alertas.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Scale className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Nenhum alerta legislativo ainda.</p>
                  <p className="text-sm mt-1">Clique em "Buscar Atualizações com IA" para começar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Status</TableHead>
                      <TableHead>Título</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Relevância</TableHead>
                      <TableHead>Fonte</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {alertas.map((alerta) => {
                      const tipo = tipoConfig[alerta.tipo || "atualizacao"] || tipoConfig.atualizacao;
                      const rel = relevanciaConfig[alerta.relevancia || "media"] || relevanciaConfig.media;
                      return (
                        <TableRow key={alerta.id} className={!alerta.lido ? "bg-primary/5" : ""}>
                          <TableCell>
                            {alerta.lido
                              ? <CheckCircle2 className="w-4 h-4 text-primary" />
                              : <div className="w-3 h-3 rounded-full bg-destructive animate-pulse" />}
                          </TableCell>
                          <TableCell className="font-medium max-w-xs truncate">{alerta.titulo}</TableCell>
                          <TableCell><Badge className={tipo.className}>{tipo.label}</Badge></TableCell>
                          <TableCell><Badge className={rel.className}>{rel.label}</Badge></TableCell>
                          <TableCell className="text-xs text-muted-foreground">{alerta.fonte}</TableCell>
                          <TableCell className="text-xs">{alerta.data_publicacao}</TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" onClick={() => { setSelectedAlerta(alerta); setDetailOpen(true); }}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              {!alerta.lido && (
                                <Button variant="ghost" size="sm" onClick={() => marcarLido(alerta.id)}>
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── Tab: Pesquisa SISLEGIS ──── */}
        <TabsContent value="pesquisa">
          <Card>
            <CardHeader>
              <CardTitle className="font-display flex items-center gap-2">
                <Globe className="w-5 h-5 text-primary" />
                Pesquisa de Legislação — SISLEGIS / MAPA
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Pesquise normas, alterações e consultas públicas na área de alimentação animal.
                Referência: <a href="https://sistemasweb.agricultura.gov.br/sislegis/loginAction.do?method=exibirTela" target="_blank" rel="noopener noreferrer" className="text-primary underline">SISLEGIS/MAPA</a>
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search form */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Ex: aditivos, rotulagem, BPF, medicamentos veterinários..."
                    value={pesquisaTermo}
                    onChange={(e) => setPesquisaTermo(e.target.value)}
                    className="pl-9"
                    onKeyDown={(e) => e.key === "Enter" && pesquisarLegislacao()}
                  />
                </div>
                <Select value={pesquisaCategoria} onValueChange={setPesquisaCategoria}>
                  <SelectTrigger className="w-full sm:w-[200px]">
                    <Filter className="w-4 h-4 mr-1" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todas">Todas as categorias</SelectItem>
                    <SelectItem value="novas">Normas Novas</SelectItem>
                    <SelectItem value="alteracoes">Alterações</SelectItem>
                    <SelectItem value="consultas_publicas">Consultas Públicas</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={pesquisarLegislacao} disabled={pesquisaLoading} className="bg-primary hover:bg-primary/90">
                  {pesquisaLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Search className="w-4 h-4 mr-2" />}
                  {pesquisaLoading ? "Pesquisando..." : "Pesquisar"}
                </Button>
              </div>

              {/* Resumo da pesquisa */}
              {pesquisaResumo && (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-start gap-2">
                    <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium text-sm text-primary mb-1">Resumo da Pesquisa</p>
                      <p className="text-sm text-muted-foreground">{pesquisaResumo}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Resultados */}
              {pesquisaLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Consultando base legislativa do MAPA...</p>
                </div>
              ) : pesquisaResultados.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Globe className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Pesquise normas, alterações e consultas públicas.</p>
                  <p className="text-sm mt-1">Digite um termo ou selecione uma categoria e clique em "Pesquisar".</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pesquisaResultados.map((r, i) => {
                    const st = statusLabel(r.status || "vigente");
                    return (
                      <div key={i} className="p-4 rounded-lg border bg-card hover:shadow-sm transition-shadow">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              {r.codigo && <span className="font-mono text-xs font-bold text-primary">{r.codigo}</span>}
                              <Badge variant="secondary" className="text-[10px]">{categoriaLabel(r.categoria)}</Badge>
                              <Badge className={`text-[10px] ${st.cls}`}>{st.label}</Badge>
                            </div>
                            <h4 className="font-medium text-sm leading-snug">{r.titulo}</h4>
                            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.resumo}</p>
                            {r.impacto_bpf && (
                              <p className="text-xs mt-1"><span className="font-medium text-primary">Impacto BPF:</span> <span className="text-muted-foreground">{r.impacto_bpf}</span></p>
                            )}
                            <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                              {r.orgao && <span>{r.orgao}</span>}
                              {r.data_publicacao && <span>{r.data_publicacao}</span>}
                            </div>
                          </div>
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button variant="outline" size="sm" onClick={() => salvarResultadoComoNorma(r)} title="Salvar na biblioteca">
                              <Save className="w-4 h-4" />
                            </Button>
                            {r.link_referencia && (
                              <a href={r.link_referencia} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="sm" title="Abrir link externo">
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resumo">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Resumo do Sistema — Análise IA
              </CardTitle>
              <Button onClick={buscarResumoSistema} disabled={loadingResumo} className="bg-primary hover:bg-primary/90">
                {loadingResumo ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
                {loadingResumo ? "Analisando..." : "Gerar Resumo com IA"}
              </Button>
            </CardHeader>
            <CardContent>
              {!resumoSistema ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Clique em "Gerar Resumo com IA" para analisar o sistema.</p>
                  <p className="text-sm mt-1">A IA irá avaliar os módulos implementados e gerar recomendações.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <h3 className="font-display font-semibold mb-2 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-primary" /> Resumo Executivo
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{resumoSistema.resumo_executivo}</p>
                  </div>
                  <div>
                    <h3 className="font-display font-semibold mb-3">Módulos Implementados</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      {resumoSistema.modulos_implementados?.map((m, i) => (
                        <div key={i} className="p-3 rounded-lg border bg-card">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium text-sm">{m.modulo}</span>
                            <Badge className={m.status === "completo" ? "bg-primary/20 text-primary" : "bg-yellow-500/20 text-yellow-700"}>
                              {m.status === "completo" ? "Completo" : "Parcial"}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{m.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  {resumoSistema.recomendacoes?.length > 0 && (
                    <div>
                      <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" /> Recomendações
                      </h3>
                      <ul className="space-y-2">
                        {resumoSistema.recomendacoes.map((r, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm">
                            <span className="w-5 h-5 rounded-full bg-yellow-500/20 text-yellow-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                            <span className="text-muted-foreground">{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── Tab: IN 17/2017 — Rotulagem e Níveis de Garantia ──── */}
        <TabsContent value="rotulagem" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-primary mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-display font-semibold text-sm">IN 17/2017 — Rotulagem e Níveis de Garantia para Fabricantes</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    A Instrução Normativa nº 17/2017 do MAPA estabelece as diretrizes de rotulagem para produtos destinados à alimentação animal,
                    complementando a IN 22/2009 e IN 12/2004 com requisitos específicos para fabricantes.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader><CardTitle className="font-display text-sm">📋 Requisitos de Rotulagem (IN 17/2017)</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  "Nome comercial do produto em destaque",
                  "Classificação (ração, suplemento, premix, núcleo, aditivo)",
                  "Espécie e categoria animal de destino",
                  "Composição básica com ingredientes em ordem decrescente",
                  "Níveis de garantia com unidades padronizadas (g/kg, mg/kg, UI/kg)",
                  "Indicações de uso e modo de emprego",
                  "Precauções e restrições de uso",
                  "Condições de armazenamento",
                  "Prazo de validade e identificação do lote",
                  "Registro no MAPA e número SIPEAGRO",
                  "Dados do fabricante: razão social, CNPJ e endereço",
                  "Identificação do Responsável Técnico e CRMV",
                  "Canal SAC (telefone, e-mail ou site)",
                  "Eventuais substitutivos (quando aplicável)",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display text-sm">📊 Níveis de Garantia — Diretrizes</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {[
                  "Declarar parâmetros mínimos e máximos conforme registro",
                  "Utilizar unidades do Sistema Internacional (g/kg, mg/kg, UI/kg)",
                  "Indicar \"(Mín.)\" ou \"(Máx.)\" conforme aplicável",
                  "Umidade máxima sempre declarada para produtos secos",
                  "Proteína bruta, extrato etéreo e matéria fibrosa obrigatórios",
                  "Matéria mineral (cinzas) quando aplicável ao tipo de produto",
                  "Cálcio e fósforo obrigatórios em suplementos minerais",
                  "Vitaminas em UI/kg para A, D, E; mg/kg para demais",
                  "Microminerais em mg/kg (Cu, Zn, Mn, Se, I, Co, Fe)",
                  "NNP (equivalente proteico) quando presente na formulação",
                  "Valores devem ser consistentes com o laudo de análise",
                  "Tolerâncias analíticas conforme IN 12/2004",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                    <span>{item}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="font-display text-sm">⚠️ Proibições e Alertas (IN 17/2017)</CardTitle></CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h5 className="font-semibold text-destructive">Proibido no Rótulo:</h5>
                  {[
                    "Alegações terapêuticas ou medicinais não autorizadas",
                    "Informações falsas, enganosas ou que induzam a erro",
                    "Comparação depreciativa com produtos concorrentes",
                    "Imagens que não correspondam ao produto real",
                    "Omissão de ingredientes de origem animal (IN 15/2009)",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-2">
                  <h5 className="font-semibold text-primary">Obrigatório para Medicamentosas:</h5>
                  {[
                    "Declarar princípio ativo e dosagem no rótulo",
                    "Período de carência claramente informado",
                    "Frase: \"VENDA SOB PRESCRIÇÃO DE MÉDICO VETERINÁRIO\"",
                    "Identificação do medicamento veterinário utilizado",
                    "Espécie e fase de produção obrigatórias",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/30">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Referência cruzada:</strong> As diretrizes de rotulagem da IN 17/2017 estão integradas ao módulo de
                <strong> Produtos → Editor de Rótulos</strong>, que automatiza a conformidade com campos obrigatórios, níveis de garantia
                e geração de etiquetas ZPL. A tabela de valores de referência de consumo segue a IN 12/2004.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ──── Tab: Substâncias Proibidas / Restritas ──── */}
        <TabsContent value="substancias">
          <div className="space-y-6">
            <Card className="border-destructive/30 bg-destructive/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-display font-semibold text-sm">Mapeamento de Substâncias Proibidas e com Limite de Uso</h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Referência normativa: Decreto 12.031/2024, IN 15/2009, IN 13/2004, IN 65/2006, IN 14/2012.
                      Lista atualizada conforme publicações do MAPA/SDA.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><Ban className="w-5 h-5 text-destructive" /> Substâncias PROIBIDAS em Alimentação Animal</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Substância / Grupo</TableHead><TableHead>Norma</TableHead><TableHead>Espécies</TableHead><TableHead>Observação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {[
                      { substancia: "Proteínas e gorduras de ruminantes", norma: "IN 08/2004, IN 15/2009", especies: "Ruminantes", obs: "Prevenção de EEB (Encefalopatia Espongiforme Bovina)" },
                      { substancia: "Cloranfenicol", norma: "IN 09/2003", especies: "Todas", obs: "Proibido como aditivo ou promotor de crescimento" },
                      { substancia: "Nitrofuranos e seus derivados", norma: "IN 09/2003", especies: "Todas", obs: "Proibido — resíduo cancerígeno" },
                      { substancia: "Dietilestilbestrol (DES)", norma: "Portaria 51/1991", especies: "Todas", obs: "Hormônio proibido como promotor" },
                      { substancia: "Clenbuterol", norma: "IN 17/2004", especies: "Todas", obs: "Beta-agonista proibido como promotor de crescimento" },
                      { substancia: "Olaquindox", norma: "IN 11/2004", especies: "Todas", obs: "Proibido como promotor de crescimento (desde 2005)" },
                      { substancia: "Carbadox", norma: "IN 35/2005", especies: "Todas", obs: "Proibido — potencial cancerígeno" },
                      { substancia: "Avoparcina", norma: "Portaria 448/1998", especies: "Todas", obs: "Proibido como promotor — resistência a vancomicina" },
                      { substancia: "Espiramicina e Eritromicina", norma: "IN 14/2012", especies: "Aves e Suínos", obs: "Proibidos como aditivos melhoradores de desempenho" },
                      { substancia: "Colistina (uso como promotor)", norma: "IN 45/2016", especies: "Todas", obs: "Proibida como aditivo zootécnico (último recurso humano)" },
                      { substancia: "Tilosina e Lincomicina (promotor)", norma: "IN 01/2020", especies: "Todas", obs: "Proibidos como aditivos melhoradores de desempenho" },
                      { substancia: "Bacitracina de Zinco (promotor)", norma: "IN 01/2020", especies: "Todas", obs: "Proibida como aditivo melhorador de desempenho" },
                      { substancia: "Virginiamicina (promotor)", norma: "IN 01/2020", especies: "Todas", obs: "Proibida como aditivo melhorador de desempenho" },
                    ].map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{s.substancia}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-mono">{s.norma}</Badge></TableCell>
                        <TableCell className="text-xs">{s.especies}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[250px]">{s.obs}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5 text-yellow-600" /> Substâncias com LIMITE DE USO (Monitoramento obrigatório)</CardTitle></CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow><TableHead>Substância</TableHead><TableHead>Limite</TableHead><TableHead>Norma</TableHead><TableHead>Espécies</TableHead><TableHead>Ação BPF</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {[
                      { substancia: "Ionóforos (Monensina, Salinomicina, Lasalocida)", limite: "Carry-over < 1%", norma: "IN 15/2009", especies: "Bovinos, Aves", acao: "Sequenciamento + flushing obrigatório" },
                      { substancia: "Medicamentos veterinários em ração", limite: "Carry-over < 3%", norma: "IN 15/2009", especies: "Todas", acao: "Limpeza de linha + teste de arraste" },
                      { substancia: "Aflatoxina B1 (Micotoxina)", limite: "≤ 20 ppb (μg/kg)", norma: "RDC 07/2011", especies: "Bovinos leiteiros, Suínos jovens", acao: "Análise de recebimento + contraprova" },
                      { substancia: "Aflatoxinas totais", limite: "≤ 50 ppb (μg/kg)", norma: "IN 13/2004, RDC 07/2011", especies: "Todas (ração animal geral)", acao: "Monitoramento de MP (milho, amendoim, algodão)" },
                      { substancia: "Deoxinivalenol (DON)", limite: "≤ 5.000 ppb", norma: "RDC 07/2011", especies: "Suínos (mais sensíveis)", acao: "Controle de recebimento de trigo/milho" },
                      { substancia: "Fumonisinas (FB1 + FB2)", limite: "≤ 5.000 ppb", norma: "RDC 07/2011", especies: "Equinos (leucoencefalomalácia)", acao: "Análise de milho e subprodutos" },
                      { substancia: "Zearalenona", limite: "≤ 1.000 ppb", norma: "Referência internacional", especies: "Suínos reprodução", acao: "Monitoramento de milho e subprodutos" },
                      { substancia: "Cobre (CuSO₄)", limite: "≤ 250 mg/kg (suínos), ≤ 35 mg/kg (ovinos)", norma: "IN 13/2004", especies: "Suínos, Ovinos", acao: "Controle na formulação — tóxico para ovinos" },
                      { substancia: "Zinco (ZnO)", limite: "≤ 2.500 mg/kg (suínos desmame, 14 dias)", norma: "Prática regulatória", especies: "Suínos", acao: "Uso terapêutico temporário — registrar duração" },
                      { substancia: "Selênio", limite: "≤ 0,3 mg/kg na dieta final", norma: "IN 13/2004", especies: "Todas", acao: "Controle de dosagem — margem tóxica estreita" },
                      { substancia: "Ureia (NNP)", limite: "Máx. 30% eq. proteico", norma: "Prática regulatória", especies: "Ruminantes exclusivo", acao: "PROIBIDO para monogástricos — controle de formulação" },
                    ].map((s, i) => (
                      <TableRow key={i}>
                        <TableCell className="font-medium text-sm">{s.substancia}</TableCell>
                        <TableCell className="font-mono text-xs">{s.limite}</TableCell>
                        <TableCell><Badge variant="outline" className="text-[10px] font-mono">{s.norma}</Badge></TableCell>
                        <TableCell className="text-xs">{s.especies}</TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px]">{s.acao}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="font-display text-sm flex items-center gap-2"><Info className="w-5 h-5 text-primary" /> Aditivos com Restrição por Espécie</CardTitle></CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-destructive">Proibidos para Ruminantes:</h5>
                    {[
                      "Proteínas e gorduras de mamíferos (Prevenção EEB)",
                      "Farinha de carne e ossos de ruminantes",
                      "Cama de aviário como ingrediente",
                      "Resíduos de alimentação humana com proteína animal",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <Ban className="w-4 h-4 text-destructive mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    <h5 className="text-sm font-semibold text-primary">Ionóforos — Restrições Críticas:</h5>
                    {[
                      "Monensina: TÓXICO para equinos (dose letal ≈ 2-3 mg/kg PV)",
                      "Salinomicina: NÃO usar com tiamulina (interação letal)",
                      "Lasalocida: Cuidado com mistura com outros ionóforos",
                      "Narasina: Tóxico para perus e coelhos",
                      "Sequenciamento: Nunca produzir ração equina após ionóforos sem flushing",
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <p className="text-xs text-muted-foreground">
                  <strong>⚡ Integração com o sistema:</strong> Estas listas de substâncias proibidas e com limite de uso estão integradas aos módulos de
                  <strong> Controle de Substâncias</strong>, <strong>PCP (Sequenciamento e Carry-over)</strong>, <strong>Validação de Limpeza de Linha</strong> e
                  <strong> Rastreabilidade</strong>. O sistema alerta automaticamente ao registrar ingredientes de origem animal e monitora os limites de carry-over
                  conforme IN 15/2009. Mantenha esta lista atualizada conforme novas publicações do MAPA/SDA.
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

      </Tabs>

      {/* ──── Detail Dialog (shared) ──── */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{(selectedAlerta as any)?.titulo}</DialogTitle>
          </DialogHeader>
          {selectedAlerta && (
            <div className="space-y-4">
              <div className="flex gap-2 flex-wrap">
                {(selectedAlerta as any).tipo && (
                  <Badge className={tipoConfig[(selectedAlerta as any).tipo]?.className || ""}>
                    {tipoConfig[(selectedAlerta as any).tipo]?.label || (selectedAlerta as any).tipo}
                  </Badge>
                )}
                {(selectedAlerta as any).relevancia && (
                  <Badge className={relevanciaConfig[(selectedAlerta as any).relevancia]?.className || ""}>
                    {relevanciaConfig[(selectedAlerta as any).relevancia]?.label || (selectedAlerta as any).relevancia}
                  </Badge>
                )}
              </div>
              <p className="text-sm leading-relaxed">{(selectedAlerta as any).resumo}</p>
              {(selectedAlerta as any).fonte && (
                <p className="text-xs text-muted-foreground"><strong>Fonte:</strong> {(selectedAlerta as any).fonte}</p>
              )}
              {((selectedAlerta as any).data_publicacao || (selectedAlerta as any).data_aproximada) && (
                <p className="text-xs text-muted-foreground"><strong>Data:</strong> {(selectedAlerta as any).data_publicacao || (selectedAlerta as any).data_aproximada}</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ──── Add Norma Dialog ──── */}
      <Dialog open={normaDialogOpen} onOpenChange={setNormaDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">Adicionar Norma / Legislação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Código</Label>
                <Input placeholder="Ex: IN 12/2004" value={normaForm.codigo} onChange={(e) => setNormaForm(prev => ({ ...prev, codigo: e.target.value }))} />
              </div>
              <div>
                <Label className="text-xs">Data de Publicação</Label>
                <Input type="date" value={normaForm.data_publicacao} onChange={(e) => setNormaForm(prev => ({ ...prev, data_publicacao: e.target.value }))} />
              </div>
            </div>

            <div>
              <Label className="text-xs">Título *</Label>
              <Input placeholder="Ex: Instrução Normativa nº 12 – Suplementos para Bovinos" value={normaForm.titulo} onChange={(e) => setNormaForm(prev => ({ ...prev, titulo: e.target.value }))} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Tipo</Label>
                <Select value={normaForm.tipo} onValueChange={(v) => setNormaForm(prev => ({ ...prev, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPO_NORMA_OPTIONS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Órgão</Label>
                <Select value={normaForm.orgao} onValueChange={(v) => setNormaForm(prev => ({ ...prev, orgao: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ORGAO_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label className="text-xs">Resumo / Ementa</Label>
              <Textarea
                placeholder="Breve descrição do conteúdo da norma..."
                value={normaForm.resumo}
                onChange={(e) => setNormaForm(prev => ({ ...prev, resumo: e.target.value }))}
                rows={3}
              />
            </div>

            <div>
              <Label className="text-xs">Tags (separadas por vírgula)</Label>
              <Input placeholder="Ex: bovinos, suplemento, sal mineral, IN 12" value={normaForm.tags} onChange={(e) => setNormaForm(prev => ({ ...prev, tags: e.target.value }))} />
            </div>

            {/* File upload */}
            <div>
              <Label className="text-xs">Arquivo (PDF, DOCX, etc.)</Label>
              <input ref={fileInputRef} type="file" accept=".pdf,.doc,.docx,.xls,.xlsx,.txt" className="hidden" onChange={handleFileUpload} />
              <div className="flex gap-2 items-center mt-1">
                <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploadingFile}>
                  {uploadingFile ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Upload className="w-4 h-4 mr-1" />}
                  {uploadingFile ? "Enviando..." : "Enviar do Computador"}
                </Button>
                {normaForm.arquivo_nome && (
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <FileText className="w-3 h-3" />
                    <span className="truncate max-w-[150px]">{normaForm.arquivo_nome}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setNormaForm(prev => ({ ...prev, arquivo_nome: "", arquivo_url: "" }))}>
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* URL alternativa */}
            {!normaForm.arquivo_nome && (
              <div>
                <Label className="text-xs">Ou informe uma URL externa</Label>
                <Input placeholder="https://www.gov.br/..." value={normaForm.arquivo_url} onChange={(e) => setNormaForm(prev => ({ ...prev, arquivo_url: e.target.value, arquivo_nome: e.target.value ? "Link externo" : "" }))} />
              </div>
            )}

            <Button onClick={handleSaveNorma} disabled={savingNorma} className="w-full">
              {savingNorma ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Plus className="w-4 h-4 mr-1" />}
              Salvar Norma
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
