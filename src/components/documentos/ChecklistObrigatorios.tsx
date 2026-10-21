import { textoTela } from "@/lib/textoTela";
import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { useState, useEffect, useMemo } from "react";
import { CheckCircle2, AlertTriangle, XCircle, Upload, Download, Trash2, Loader2, FileText, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DOCUMENTOS_OBRIGATORIOS, CATEGORIAS_OBRIGATORIOS, DocObrigatorio } from "@/config/documentosObrigatorios";

interface DocBPF {
  id: string;
  tipo: string;
  pop_codigo: string | null;
  titulo: string;
  arquivo_nome: string;
  arquivo_path: string;
  data_documento: string | null;
  descricao: string | null;
}

interface Props {
  empresaId: string;
  userId: string;
}

export default function ChecklistObrigatorios({ empresaId, userId }: Props) {
  const [docs, setDocs] = useState<DocBPF[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState("");
  const [uploading, setUploading] = useState(false);
  const [openUpload, setOpenUpload] = useState<DocObrigatorio | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dataDoc, setDataDoc] = useState(new Date().toISOString().split("T")[0]);

  const fetch = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("documentos_bpf")
      .select("*")
      .eq("empresa_id", empresaId)
      .eq("tipo", "obrigatorio")
      .order("data_documento", { ascending: false });
    if (data) setDocs(data as unknown as DocBPF[]);
    setLoading(false);
  };

  useEffect(() => { fetch(); }, [empresaId]);

  const docsPorObrigatorio = useMemo(() => {
    const map: Record<string, DocBPF[]> = {};
    docs.forEach(d => {
      const key = d.pop_codigo || "";
      if (!map[key]) map[key] = [];
      map[key].push(d);
    });
    return map;
  }, [docs]);

  const getStatus = (item: DocObrigatorio): { status: "ok" | "vencendo" | "ausente" | "vencido"; ultimoDoc?: DocBPF } => {
    const arquivos = docsPorObrigatorio[item.codigo] || [];
    if (arquivos.length === 0) return { status: "ausente" };
    const ultimoDoc = arquivos[0];
    if (!item.validadeMeses || !ultimoDoc.data_documento) return { status: "ok", ultimoDoc };
    const data = new Date(ultimoDoc.data_documento);
    const venc = new Date(data);
    venc.setMonth(venc.getMonth() + item.validadeMeses);
    const hoje = new Date();
    const diasParaVenc = Math.ceil((venc.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    if (diasParaVenc < 0) return { status: "vencido", ultimoDoc };
    if (diasParaVenc <= 30) return { status: "vencendo", ultimoDoc };
    return { status: "ok", ultimoDoc };
  };

  const filtrados = useMemo(() => {
    if (!busca) return DOCUMENTOS_OBRIGATORIOS;
    const q = busca.toLowerCase();
    return DOCUMENTOS_OBRIGATORIOS.filter(d =>
      d.titulo.toLowerCase().includes(q) ||
      d.codigo.toLowerCase().includes(q) ||
      d.descricao.toLowerCase().includes(q) ||
      d.fonteLegal.toLowerCase().includes(q)
    );
  }, [busca]);

  const porCategoria = useMemo(() => {
    const map: Record<string, DocObrigatorio[]> = {};
    filtrados.forEach(d => {
      if (!map[d.categoria]) map[d.categoria] = [];
      map[d.categoria].push(d);
    });
    return map;
  }, [filtrados]);

  const stats = useMemo(() => {
    const total = DOCUMENTOS_OBRIGATORIOS.length;
    let ok = 0, vencendo = 0, ausente = 0, vencido = 0;
    DOCUMENTOS_OBRIGATORIOS.forEach(d => {
      const s = getStatus(d).status;
      if (s === "ok") ok++;
      else if (s === "vencendo") vencendo++;
      else if (s === "vencido") vencido++;
      else ausente++;
    });
    return { total, ok, vencendo, ausente, vencido, pct: Math.round((ok / total) * 100) };
  }, [docs]);

  const handleUpload = async () => {
    if (!file || !openUpload) return;
    setUploading(true);
    try {
      const sanitized = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      // Endereço fixo de busca: feed-bpf/{empresaId}/obrigatorios/{pasta}/{timestamp}_{file}
      const folder = `${empresaId}/obrigatorios/${openUpload.pasta}`;
      const filePath = `${folder}/${Date.now()}_${sanitized}`;

      const { error: uploadErr } = await supabase.storage.from("feed-bpf").upload(filePath, file);
      if (uploadErr) { toast.error("Erro no upload: " + uploadErr.message); return; }

      const { error } = await supabase.from("documentos_bpf").insert({
        user_id: userId,
        empresa_id: empresaId,
        tipo: "obrigatorio",
        pop_codigo: openUpload.codigo,
        titulo: openUpload.titulo,
        descricao: openUpload.descricao,
        arquivo_nome: file.name,
        arquivo_path: filePath,
        data_documento: dataDoc,
      } as any);

      if (error) toast.error("Erro ao salvar registro");
      else {
        toast.success("Documento arquivado!");
        setOpenUpload(null); setFile(null);
        setDataDoc(new Date().toISOString().split("T")[0]);
        fetch();
      }
    } finally { setUploading(false); }
  };

  const handleDownload = async (doc: DocBPF) => {
    const { data, error } = await supabase.storage.from("feed-bpf").createSignedUrl(doc.arquivo_path, 300);
    if (error || !data?.signedUrl) { toast.error("Erro ao gerar link"); return; }
    window.open(data.signedUrl, "_blank");
  };

  const handleDelete = async (doc: DocBPF) => {
    if (!confirm(`Excluir "${doc.arquivo_nome}"?`)) return;
    await supabase.storage.from("feed-bpf").remove([doc.arquivo_path]);
    const { error } = await supabase.from("documentos_bpf").delete().eq("id", doc.id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Excluído"); fetch(); }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "ok": return <Badge className="bg-green-500/15 text-green-700 border-green-200 border"><CheckCircle2 className="w-3 h-3 mr-1" />Conforme</Badge>;
      case "vencendo": return <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 border"><AlertTriangle className="w-3 h-3 mr-1" />Vence em ≤30d</Badge>;
      case "vencido": return <Badge className="bg-red-500/15 text-red-700 border-red-200 border"><XCircle className="w-3 h-3 mr-1" />Vencido</Badge>;
      default: return <Badge variant="outline" className="text-muted-foreground"><XCircle className="w-3 h-3 mr-1" />Ausente</Badge>;
    }
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-sm text-muted-foreground">Conformidade documental</p>
              <p className="text-3xl font-bold">{stats.pct}%</p>
            </div>
            <div className="flex gap-3 text-sm flex-wrap">
              <div className="text-center"><p className="text-2xl font-bold text-green-600">{stats.ok}</p><p className="text-xs text-muted-foreground">Conformes</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-amber-600">{stats.vencendo}</p><p className="text-xs text-muted-foreground">Vencendo</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-red-600">{stats.vencido}</p><p className="text-xs text-muted-foreground">Vencidos</p></div>
              <div className="text-center"><p className="text-2xl font-bold text-muted-foreground">{stats.ausente}</p><p className="text-xs text-muted-foreground">Ausentes</p></div>
            </div>
          </div>
          <Progress value={stats.pct} className="h-2" />
        </CardContent>
      </Card>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Buscar por nome, código ou base legal..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-9" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        Object.entries(porCategoria).map(([cat, items]) => {
          const meta = CATEGORIAS_OBRIGATORIOS[cat as DocObrigatorio["categoria"]];
          return (
            <Card key={cat}>
              <CardHeader className="py-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge className={meta.cor + " border"}>{meta.label}</Badge>
                  <span className="text-muted-foreground font-normal">({items.length})</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 space-y-2">
                {items.map(item => {
                  const { status, ultimoDoc } = getStatus(item);
                  const arquivos = docsPorObrigatorio[item.codigo] || [];
                  return (
                    <div key={item.id} className="border rounded-lg p-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-mono text-xs text-muted-foreground">{item.codigo}</span>
                            <span className="font-medium text-sm">{textoTela(item.titulo)}</span>
                            {item.obrigatorio && <Badge variant="outline" className="text-[10px]">Obrigatório</Badge>}
                            {statusBadge(status)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">{textoTela(item.descricao)}</p>
                          <p className="text-[11px] text-muted-foreground mt-1">
                            <FileText className="w-3 h-3 inline mr-1" />
                            <span className="font-mono">/obrigatorios/{item.pasta}</span>
                            <BaseLegalBadge assunto={item.categoria === "registro_empresa" ? "registro_estabelecimento" : item.categoria === "controles_oficiais" ? "autocontrole" : "bpf_geral"} />
                            {item.validadeMeses && ` · Validade: ${item.validadeMeses}m`}
                          </p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => setOpenUpload(item)}>
                          <Upload className="w-3 h-3 mr-1" /> Arquivar
                        </Button>
                      </div>

                      {arquivos.length > 0 && (
                        <div className="mt-2 pl-2 border-l-2 border-primary/30 space-y-1">
                          {arquivos.map(doc => (
                            <div key={doc.id} className="flex items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <FileText className="w-3 h-3 text-muted-foreground shrink-0" />
                                <span className="truncate">{doc.arquivo_nome}</span>
                                <span className="text-muted-foreground shrink-0">
                                  {doc.data_documento && new Date(doc.data_documento + "T12:00:00").toLocaleDateString("pt-BR")}
                                </span>
                              </div>
                              <div className="flex gap-1 shrink-0">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleDownload(doc)}>
                                  <Download className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(doc)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Upload dialog */}
      <Dialog open={!!openUpload} onOpenChange={(o) => !o && setOpenUpload(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Arquivar documento</DialogTitle></DialogHeader>
          {openUpload && (
            <div className="space-y-3">
              <div className="bg-muted/50 p-3 rounded text-sm">
                <p className="font-medium">{openUpload.codigo} — {openUpload.titulo}</p>
                <p className="text-xs text-muted-foreground mt-1 font-mono">📁 /obrigatorios/{openUpload.pasta}</p>
              </div>
              <div>
                <Label>Data do documento</Label>
                <Input type="date" value={dataDoc} onChange={e => setDataDoc(e.target.value)} />
              </div>
              <div>
                <Label>Arquivo (PDF, imagem)</Label>
                <Input type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
              <Button className="w-full" onClick={handleUpload} disabled={uploading || !file}>
                {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Enviar e arquivar
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
