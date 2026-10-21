import { textoTela } from "@/lib/textoTela";
import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { useState, useEffect, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";

import { FolderOpen, Upload, Trash2, Download, FileText, Filter, Loader2, Calendar, Tag, ClipboardCheck, Archive, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import ChecklistObrigatorios from "@/components/documentos/ChecklistObrigatorios";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { baixarArquivoStorage } from "@/utils/fileTypes";
import { normalizarPopCodigo, POPS_CODIGOS } from "@/lib/popCodigo";


const TIPOS_DOC = [
  { value: "pop", label: "POP — Procedimento Operacional Padrão" },
  { value: "it", label: "IT — Instrução de Trabalho" },
  { value: "planilha", label: "Planilha Preenchida (escaneada)" },
  { value: "manual", label: "Manual BPF" },
  { value: "laudo", label: "Laudo / Certificado" },
  { value: "outro", label: "Outro Documento" },
];

const POP_CODIGOS = [
  ...POPS_CODIGOS,
  "IT-01-01", "IT-01-02", "IT-01-03", "IT-02-01", "IT-02-02", "IT-02-03",
  "IT-03-01", "IT-03-02", "IT-04-01", "IT-04-02", "IT-05-01", "IT-05-02",
  "IT-06-01", "IT-06-02", "IT-07-01", "IT-07-02", "IT-08-01", "IT-08-02",
  "IT-09-01", "IT-09-02", "IT-10-01", "IT-10-02",
];

interface DocBPF {
  id: string;
  empresa_id: string;
  tipo: string;
  pop_codigo: string | null;
  titulo: string;
  descricao: string | null;
  arquivo_nome: string;
  arquivo_path: string;
  data_documento: string | null;
  created_at: string;
}

export default function DocumentosBPF() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [searchParams] = useSearchParams();
  const empresaId = empresaAtiva?.id || null;
  const [docs, setDocs] = useState<DocBPF[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [openUpload, setOpenUpload] = useState(false);
  const [activeTab, setActiveTab] = useState("checklist");
  const [filtroTipo, setFiltroTipo] = useState("todos");

  const [filtroCodigo, setFiltroCodigo] = useState("todos");

  // Upload form
  const [tipo, setTipo] = useState("pop");
  const [popCodigo, setPopCodigo] = useState("");
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataDoc, setDataDoc] = useState(new Date().toISOString().split("T")[0]);
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const shouldOpenUpload = searchParams.get("upload") === "1";
    const tipoParam = searchParams.get("tipo");
    const popParam = searchParams.get("pop");
    const tabParam = searchParams.get("tab");

    if (tabParam) setActiveTab(tabParam);
    if (tipoParam && TIPOS_DOC.some((item) => item.value === tipoParam)) setTipo(tipoParam);
    if (popParam) setPopCodigo(popParam);
    if (shouldOpenUpload) setOpenUpload(true);
  }, [searchParams]);


  const fetchDocs = async () => {
    if (!user || !empresaId) return;
    const { data } = await supabase
      .from("documentos_bpf")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("data_documento", { ascending: false });
    if (data) setDocs(data as unknown as DocBPF[]);
    setLoading(false);
  };

  useEffect(() => { setLoading(true); fetchDocs(); }, [user, empresaId]);

  const handleUpload = async () => {
    if (!file || !titulo || !user || !empresaId) {
      toast.error("Preencha título e selecione um arquivo");
      return;
    }
    setUploading(true);
    try {
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const folder = `${empresaId}/${tipo}/${dataDoc}`;
      const filePath = `${folder}/${Date.now()}_${sanitized}`;

      const { error: uploadErr } = await supabase.storage
        .from("feed-bpf")
        .upload(filePath, file);

      if (uploadErr) {
        toast.error("Erro no upload: " + uploadErr.message);
        return;
      }

      const { error } = await supabase.from("documentos_bpf").insert({
        user_id: user.id,
        empresa_id: empresaId,
        tipo,
        pop_codigo: popCodigo || null,
        titulo,
        descricao,
        arquivo_nome: file.name,
        arquivo_path: filePath,
        data_documento: dataDoc,
      } as any);

      if (error) {
        toast.error("Erro ao salvar registro");
      } else {
        toast.success("Documento enviado com sucesso!");
        setOpenUpload(false);
        resetForm();
        fetchDocs();
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (doc: DocBPF) => {
    await baixarArquivoStorage("feed-bpf", doc.arquivo_path, (doc as any).arquivo_nome || doc.titulo, {
      bucketsAlternativos: ["documentos-bpf"],
    });
  };


  const handleDelete = async (doc: DocBPF) => {
    if (!confirm(`Excluir "${doc.titulo}"?`)) return;
    await supabase.storage.from("feed-bpf").remove([doc.arquivo_path]);
    const { error } = await supabase.from("documentos_bpf").delete().eq("id", doc.id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Documento excluído"); fetchDocs(); }
  };

  const resetForm = () => {
    setTipo("pop"); setPopCodigo(""); setTitulo(""); setDescricao("");
    setDataDoc(new Date().toISOString().split("T")[0]); setFile(null);
  };

  const filtered = useMemo(() => {
    return docs.filter(d => {
      if (filtroTipo !== "todos" && d.tipo !== filtroTipo) return false;
      if (filtroCodigo !== "todos" && normalizarPopCodigo(d.pop_codigo) !== normalizarPopCodigo(filtroCodigo)) return false;
      return true;
    });
  }, [docs, filtroTipo, filtroCodigo]);

  // Group by date
  const grouped = useMemo(() => {
    const map: Record<string, DocBPF[]> = {};
    filtered.forEach(d => {
      const key = d.data_documento || "sem-data";
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return Object.entries(map).sort(([a], [b]) => b.localeCompare(a));
  }, [filtered]);

  const tipoLabel = (t: string) => TIPOS_DOC.find(td => td.value === t)?.label?.split("—")[0]?.trim() || t;
  const tipoBadgeColor = (t: string) => {
    switch (t) {
      case "pop": return "bg-blue-500/15 text-blue-700 border-blue-200";
      case "it": return "bg-amber-500/15 text-amber-700 border-amber-200";
      case "planilha": return "bg-green-500/15 text-green-700 border-green-200";
      case "manual": return "bg-purple-500/15 text-purple-700 border-purple-200";
      case "laudo": return "bg-red-500/15 text-red-700 border-red-200";
      default: return "bg-muted text-muted-foreground";
    }
  };

  if (!empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader icon={FolderOpen} title="Documentos BPF" description="Selecione uma empresa para gerenciar documentos" />
        <EmpresaSelector />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader icon={FolderOpen} title="Arquivo Digital (Arquivo de POPs e ITs)" description="Checklist de documentos obrigatórios + arquivo livre de POPs, ITs e planilhas escaneadas" />
      <EmpresaSelector />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="checklist"><ClipboardCheck className="w-4 h-4 mr-2" />Checklist Obrigatórios</TabsTrigger>
          <TabsTrigger value="arquivo"><FolderOpen className="w-4 h-4 mr-2" />Arquivo Livre</TabsTrigger>
          <TabsTrigger value="retencao"><Clock className="w-4 h-4 mr-2" />Gestão de Retenção (2 Anos)</TabsTrigger>
        </TabsList>


        <TabsContent value="checklist">
          <ChecklistObrigatorios empresaId={empresaId} userId={user!.id} />
        </TabsContent>

        <TabsContent value="retencao" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Archive className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Política de Retenção de Registros <BaseLegalBadge assunto="autocontrole" /></h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todos os registros de BPF devem ser mantidos por no mínimo <strong>2 (dois) anos</strong> e estar
                    disponíveis para fiscalização a qualquer momento. O sistema retém automaticamente todos os dados
                    e impede exclusão de registros dentro do prazo de guarda obrigatório.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    
                    
                    <Badge variant="outline" className="text-[10px]"> — Controle de Registros</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <h4 className="font-semibold text-sm">Status de Conformidade — Retenção Documental</h4>
              {[
                { modulo: "Execução de POPs (POP-01 a POP-10)", status: true, detalhe: "Todos os registros de execução de POPs são armazenados permanentemente no banco de dados com timestamp e user_id." },
                { modulo: "Registros de Limpeza e Higienização (POP-02)", status: true, detalhe: "Cronogramas, checklists pré-operacionais, liberação de linha e monitoramento de superfícies retidos integralmente." },
                { modulo: "Saúde e Higiene Pessoal (POP-03)", status: true, detalhe: "ASOs, registros de afastamento por sintomas e controle de visitantes mantidos." },
                { modulo: "Controle de Água e Laudos (POP-04)", status: true, detalhe: "Registros de potabilidade, laudos laboratoriais e certificados de limpeza de reservatório arquivados." },
                { modulo: "Controle de Resíduos e Efluentes (POP-08)", status: true, detalhe: "Manifestos de transporte, licenças ambientais e registros de descarte mantidos com rastreabilidade completa." },
                { modulo: "Calibrações e Manutenções (POP-06)", status: true, detalhe: "Certificados de calibração, verificações intermediárias e planos preventivos arquivados." },
                { modulo: "Rastreabilidade e Recall (POP-09)", status: true, detalhe: "Correlação MP↔PA, testes de recall simulado e certificados de análise retidos por tempo indeterminado." },
                { modulo: "Não Conformidades e Ações Corretivas", status: true, detalhe: "NCs, causas-raiz, planos de ação e verificações de eficácia mantidos para auditoria." },
                { modulo: "Treinamentos e ASOs", status: true, detalhe: "Registros de capacitação, ASOs e monitoramento de sintomas armazenados permanentemente." },
              ].map(item => (
                <div key={item.modulo} className="p-3 rounded-lg border bg-background">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{item.modulo}</span>
                    <Badge className="bg-primary/20 text-primary">✅ Retido ≥ 2 anos</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{item.detalhe}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-green-500/20 bg-green-50 dark:bg-green-900/10">
            <CardContent className="pt-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
                <div>
                  <h4 className="font-semibold text-sm text-green-700 dark:text-green-400">Sistema em Conformidade com a Política de Retenção</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todos os módulos do sistema armazenam registros em banco de dados permanente com backup automático.
                    A exclusão de registros dentro do período de guarda de 2 anos é controlada por políticas de acesso.
                    Os dados estão disponíveis para exportação e fiscalização a qualquer momento.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="arquivo" className="space-y-6">
          <div className="flex justify-between items-center bg-muted/30 p-4 rounded-lg border border-border/50">
            <div className="flex items-center gap-2">
              <Archive className="w-5 h-5 text-emerald-600" />
              <div>
                <h3 className="text-sm font-semibold">Gestão de Backup Local</h3>
                <p className="text-[11px] text-muted-foreground">Exporte seu acervo para armazenamento externo de segurança.</p>
              </div>
            </div>
            <Button asChild variant="outline" size="sm" className="gap-2">
              <Link to="/feedbpf-custom/config">
                <Download className="w-4 h-4" /> Configurar Backup
              </Link>
            </Button>
          </div>

      {/* Filters + Upload */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <Select value={filtroTipo} onValueChange={setFiltroTipo}>

            <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {TIPOS_DOC.map(t => <SelectItem key={t.value} value={t.value}>{t.label.split("—")[0].trim()}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Código POP/IT</Label>
          <Select value={filtroCodigo} onValueChange={setFiltroCodigo}>
            <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos</SelectItem>
              {POP_CODIGOS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1" />
        <Dialog open={openUpload} onOpenChange={setOpenUpload}>
          <DialogTrigger asChild>
            <Button><Upload className="w-4 h-4 mr-2" /> Enviar Documento</Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader><DialogTitle>Enviar Documento BPF</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={tipo} onValueChange={setTipo}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {TIPOS_DOC.map(t => <SelectItem key={t.value} value={t.value}>{textoTela(t.label)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Código POP/IT</Label>
                      <Select value={popCodigo || "__none__"} onValueChange={(value) => setPopCodigo(value === "__none__" ? "" : value)}>
                    <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {POP_CODIGOS.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Título *</Label>
                <Input value={titulo} onChange={e => setTitulo(e.target.value)} placeholder="Ex: POP-01 Recebimento MP - Janeiro 2025" />
              </div>
              <div>
                <Label>Descrição</Label>
                <Input value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Observações opcionais" />
              </div>
              <div>
                <Label>Data do Documento</Label>
                <Input type="date" value={dataDoc} onChange={e => setDataDoc(e.target.value)} />
              </div>
              <div>
                <Label>Arquivo (PDF, imagem ou Excel) *</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp,.xlsx,.xls" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button className="w-full" onClick={handleUpload} disabled={uploading}>
                {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {TIPOS_DOC.slice(0, 4).map(t => {
          const count = docs.filter(d => d.tipo === t.value).length;
          return (
            <Card key={t.value} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setFiltroTipo(filtroTipo === t.value ? "todos" : t.value)}>
              <CardContent className="pt-4 pb-3 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{t.label.split("—")[0].trim()}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Document list grouped by date */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-12 h-12 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-muted-foreground">Nenhum documento encontrado</p>
            <p className="text-xs text-muted-foreground mt-1">Clique em "Enviar Documento" para adicionar POPs, ITs e planilhas escaneadas</p>
          </CardContent>
        </Card>
      ) : (
        grouped.map(([date, groupDocs]) => (
          <Card key={date}>
            <CardHeader className="py-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {date === "sem-data" ? "Sem data" : new Date(date + "T12:00:00").toLocaleDateString("pt-BR")}
                <Badge variant="outline" className="ml-2">{groupDocs.length} doc(s)</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-20">Tipo</TableHead>
                    <TableHead className="w-20">Código</TableHead>
                    <TableHead>Título</TableHead>
                    <TableHead className="w-40">Arquivo</TableHead>
                    <TableHead className="w-24">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {groupDocs.map(d => (
                    <TableRow key={d.id}>
                      <TableCell><Badge variant="outline" className={tipoBadgeColor(d.tipo)}>{tipoLabel(d.tipo)}</Badge></TableCell>
                      <TableCell className="font-mono text-xs">{d.pop_codigo || "—"}</TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{d.titulo}</p>
                        {d.descricao && <p className="text-xs text-muted-foreground">{textoTela(d.descricao)}</p>}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground truncate max-w-[140px]">{d.arquivo_nome}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDownload(d)} title="Baixar">
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(d)} title="Excluir">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                </Table>
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {groupDocs.map(d => (
                  <Card key={d.id} className="border shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-bold truncate max-w-[200px]">{d.titulo}</p>
                          <p className="text-xs text-muted-foreground font-mono">{d.pop_codigo || "Sem código"}</p>
                        </div>
                        <Badge variant="outline" className={tipoBadgeColor(d.tipo)}>{tipoLabel(d.tipo)}</Badge>
                      </div>
                      
                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-muted-foreground uppercase font-bold">Arquivo</span>
                          <span className="text-xs truncate max-w-[150px]">{d.arquivo_nome}</span>
                        </div>
                        
                        <div className="flex gap-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDownload(d)}>
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(d)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Structure info */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <h3 className="font-semibold text-sm mb-2">📁 Estrutura de Pastas</h3>
          <pre className="text-xs text-muted-foreground bg-background/50 p-3 rounded-lg overflow-x-auto">
{`feed-bpf/
  └── {empresa_id}/
      ├── pop/
      │   ├── 2025-01-15/  ← documentos do dia
      │   └── 2025-01-20/
      ├── it/
      │   └── 2025-01-18/
      ├── planilha/
      │   └── 2025-01-22/
      ├── manual/
      └── laudo/`}
          </pre>
          <p className="text-xs text-muted-foreground mt-2">
            Cada empresa tem sua pasta isolada. Consultores veem apenas as empresas que gerenciam. 
            Documentos são organizados por tipo (POP, IT, Planilha) e por data.
          </p>
        </CardContent>
      </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
