import { useState, useEffect } from "react";
import { Package, Plus, Loader2, FileText, AlertTriangle, ShieldAlert, FlaskConical, Printer, Camera, Pencil, Trash2, CheckCircle2, Lock as LockIcon } from "lucide-react";

import FileUploadComponent from "@/components/FileUpload";
import { registrarAuditLog } from "@/utils/auditLog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import PageHeader from "@/components/PageHeader";
import { AnexarPlanilhaPop } from "@/components/documentos/AnexarPlanilhaPop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useSessionDraft } from "@/hooks/useSessionDraft";
import { toast } from "sonner";
import { printElement } from "@/utils/printUtils";

interface RecebimentoRow {
  id: string;
  data: string;
  fornecedor: string;
  materia_prima: string;
  lote: string | null;
  odor: string | null;
  umidade: string | null;
  insetos: string | null;
  aprovado: boolean | null;
  certificado_analise_numero: string | null;
  certificado_analise_url: string | null;
  certificado_analise_valido: boolean | null;
  numero_nota_fiscal: string | null;
  nota_fiscal_url: string | null;
  laudo_url: string | null;
  validade: string | null;
  quantidade: string | null;
  unidade: string | null;
  temperatura: string | null;
  observacoes: string | null;
  armazenamento_inadequado?: boolean | null;
  status: "bloqueado" | "liberado" | "esgotado";
  saldo: number | null;
}

interface FormState {
  fornecedor: string;
  materiaPrima: string;
  lote: string;
  odor: string;
  umidade: string;
  insetos: string;
  temperatura: string;
  quantidade: string;
  unidade: string;
  aprovado: boolean;
  certNumero: string;
  certUrl: string;
  numNF: string;
  nfUrl: string;
  laudoUrl: string;
  observacoes: string;
  armazenamentoInadequado: boolean;
}

const FORM_INICIAL: FormState = {
  fornecedor: "", materiaPrima: "", lote: "", odor: "normal", umidade: "",
  insetos: "ausente", temperatura: "", quantidade: "", unidade: "kg",
  aprovado: true, certNumero: "", certUrl: "", numNF: "", nfUrl: "",
  laudoUrl: "", observacoes: "", armazenamentoInadequado: false,
};

export default function Recebimento() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<RecebimentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);

  const [busca, setBusca] = useState("");

  // Auto-save: o rascunho sobrevive à navegação entre páginas (sessionStorage)
  const [form, setForm, clearDraft] = useSessionDraft<FormState>("recebimento_mp", FORM_INICIAL);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const [liberarDialogOpen, setLiberarDialogOpen] = useState(false);
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from("recebimento_mp").select("*").order("data", { ascending: false });
      if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      setItems((data as any) || []);
    } catch (err) {
      console.error("[Recebimento] fetchData", err);
      toast.error("Erro ao carregar recebimentos de matéria-prima");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user, empresaAtiva]);

  const handlePhotoUpload = async (file: File) => {
    try {
      setIsScanning(true);
      const formData = new FormData();
      formData.append("file", file);
      const { data, error } = await supabase.functions.invoke("process-document", { body: formData });
      if (error) throw error;
      if (data) {
        setForm(prev => ({
          ...prev,
          fornecedor: data.fornecedor_nome || data.cliente_nome || prev.fornecedor,
          materiaPrima: data.materia_prima || prev.materiaPrima,
          lote: data.lote || prev.lote,
          numNF: data.numero_nf || prev.numNF,
          quantidade: data.quantidade?.toString() || prev.quantidade,
          unidade: data.unidade || prev.unidade,
          observacoes: data.observacoes || prev.observacoes,
        }));
        toast.success("Documento processado por IA com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro OCR:", err);
      toast.error("Erro ao processar imagem. Verifique a iluminação.");
    } finally {
      setIsScanning(false);
    }
  };

  const abrirNovo = () => {
    setEditId(null);
    setOpen(true);
  };

  /**
   * Registro liberado = assinado digitalmente (trilha de auditoria fechada).
   * MAPA / Decreto 12.031/2024: registro concluído não pode ser alterado nem excluído.
   */
  const registroBloqueado = (item: RecebimentoRow) => item.status !== "bloqueado";

  const abrirEdicao = (item: RecebimentoRow) => {
    if (registroBloqueado(item)) {
      toast.error("Registro liberado/assinado não pode ser editado (exigência MAPA). Registre uma Não Conformidade para correções.");
      return;
    }
    setEditId(item.id);
    setForm({
      fornecedor: item.fornecedor || "",
      materiaPrima: item.materia_prima || "",
      lote: item.lote || "",
      odor: item.odor || "normal",
      umidade: item.umidade || "",
      insetos: item.insetos || "ausente",
      temperatura: item.temperatura || "",
      quantidade: item.quantidade || "",
      unidade: item.unidade || "kg",
      aprovado: item.aprovado ?? true,
      certNumero: item.certificado_analise_numero || "",
      certUrl: item.certificado_analise_url || "",
      numNF: item.numero_nota_fiscal || "",
      nfUrl: item.nota_fiscal_url || "",
      laudoUrl: item.laudo_url || "",
      observacoes: item.observacoes || "",
      armazenamentoInadequado: !!item.armazenamento_inadequado,
    });
    setOpen(true);
  };

  const payload = () => ({
    fornecedor: form.fornecedor,
    materia_prima: form.materiaPrima,
    lote: form.lote || null,
    quantidade: form.quantidade || null,
    unidade: form.unidade || null,
    aprovado: form.aprovado,
    odor: form.odor,
    umidade: form.umidade,
    insetos: form.insetos,
    temperatura: form.temperatura,
    certificado_analise_numero: form.certNumero || null,
    certificado_analise_url: form.certUrl || null,
    numero_nota_fiscal: form.numNF || null,
    nota_fiscal_url: form.nfUrl || null,
    laudo_url: form.laudoUrl || null,
    observacoes: form.observacoes || null,
    armazenamento_inadequado: form.armazenamentoInadequado,
  });

  const handleSalvar = async () => {
    if (!form.fornecedor || !form.materiaPrima || !user) {
      toast.error("Informe fornecedor e matéria-prima.");
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        const anterior = items.find(i => i.id === editId);
        const { error } = await supabase.from("recebimento_mp").update(payload() as any).eq("id", editId);
        if (error) throw error;
        await registrarAuditLog({
          userId: user.id, empresaId: empresaAtiva?.id, tabela: "recebimento_mp",
          registroId: editId, acao: "editar", dadosAnteriores: anterior, dadosNovos: payload(),
        });
        toast.success("Recebimento atualizado!");
      } else {
        const { data: newBatch, error } = await supabase
          .from("recebimento_mp")
          .insert({
            user_id: user.id,
            empresa_id: empresaAtiva?.id || null,
            ...payload(),
            status: "bloqueado",
          } as any)
          .select()
          .single();
        if (error) throw error;

        if (!form.aprovado) {
          await supabase.from("nao_conformidades").insert({
            user_id: user.id,
            empresa_id: empresaAtiva?.id || null,
            data: new Date().toISOString().split("T")[0],
            setor: "Recebimento de MP",
            descricao: `NC no recebimento da MP ${form.materiaPrima} (Lote: ${form.lote || "—"}): ${form.observacoes}`,
            status: "pendente",
          } as any);
        }

        await registrarAuditLog({
          userId: user.id, empresaId: empresaAtiva?.id, tabela: "recebimento_mp",
          registroId: newBatch.id, acao: "criar", dadosNovos: newBatch,
        });
        toast.success("Recebimento registrado! Use o botão “Liberar” para disponibilizar o lote.");
      }
      clearDraft();
      setForm(FORM_INICIAL);
      setEditId(null);
      setOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (!excluirId || !user) return;
    const anterior = items.find(i => i.id === excluirId);
    if (anterior && registroBloqueado(anterior)) {
      toast.error("Registro liberado/assinado não pode ser excluído (exigência MAPA).");
      setExcluirId(null);
      return;
    }
    const { error } = await supabase.from("recebimento_mp").delete().eq("id", excluirId);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
    } else {
      await registrarAuditLog({
        userId: user.id, empresaId: empresaAtiva?.id, tabela: "recebimento_mp",
        registroId: excluirId, acao: "excluir", dadosAnteriores: anterior,
      });
      toast.success("Registro excluído e lançado na auditoria.");
      fetchData();
    }
    setExcluirId(null);
  };

  const handleLiberarLote = async () => {
    if (!selectedLoteId || !user) return;
    setSaving(true);
    const item = items.find(i => i.id === selectedLoteId);
    const obs = justificativa.trim()
      ? (item?.observacoes || "") + "\n\n[Liberação] " + justificativa.trim()
      : item?.observacoes || null;

    const { error } = await supabase
      .from("recebimento_mp")
      .update({ status: "liberado", observacoes: obs })
      .eq("id", selectedLoteId);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      await registrarAuditLog({
        userId: user.id, empresaId: empresaAtiva?.id, tabela: "recebimento_mp",
        registroId: selectedLoteId, acao: "editar", dadosAnteriores: item,
        dadosNovos: { status: "liberado", justificativa_liberacao: justificativa },
      });
      toast.success("Lote liberado e registrado na auditoria!");
      setLiberarDialogOpen(false);
      setJustificativa("");
      setSelectedLoteId(null);
      fetchData();
    }
    setSaving(false);
  };

  const filtered = items.filter(r =>
    [r.fornecedor, r.materia_prima, r.lote].some(v => v?.toLowerCase().includes(busca.toLowerCase()))
  );

  const rascunhoAtivo = !editId && JSON.stringify(form) !== JSON.stringify(FORM_INICIAL);

  return (
    <>
      <PageHeader icon={Package} title="POP 01 - Recebimento de Matérias-Primas" description="Controle de qualidade e FIFO"  assuntoBaseLegal="bpf_geral" />
      <div className="flex justify-end mb-3"><AnexarPlanilhaPop popCodigo="POP-01" popNome="Recebimento de Matérias-Primas" /></div>
      <div className="flex justify-between items-center mb-4">
        <Input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs" />
        <Button onClick={abrirNovo}><Plus className="mr-2" /> Novo</Button>
      </div>

      {rascunhoAtivo && (
        <div className="mb-4 flex items-center justify-between rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
          <span>Existe um rascunho de recebimento não salvo.</span>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { clearDraft(); setForm(FORM_INICIAL); }}>Descartar</Button>
            <Button size="sm" onClick={abrirNovo}>Continuar preenchimento</Button>
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setEditId(null); }}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Recebimento" : "Receber MP"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 pt-2">
            <Tabs defaultValue="manual" className="mb-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="manual">Manual</TabsTrigger>
                <TabsTrigger value="foto" className="flex items-center gap-1">
                  <Camera className="h-3 w-3" /> Captura por IA
                </TabsTrigger>
              </TabsList>
              <TabsContent value="foto" className="pt-2">
                <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-primary/20 rounded-lg bg-primary/5">
                  <Camera className="h-8 w-8 text-primary/40 mb-2" />
                  <p className="text-xs font-medium text-center">Tire foto do Romaneio ou NF de Recebimento</p>
                  <p className="text-[10px] text-muted-foreground mb-3">Ideal para documentos manuscritos</p>
                  <Input type="file" accept="image/*" capture="environment"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
                    className="hidden" id="photo-upload-rec" />
                  <Button asChild disabled={isScanning} size="sm" variant="outline">
                    <label htmlFor="photo-upload-rec" className="cursor-pointer">
                      {isScanning ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando...</>
                      ) : (
                        <><Camera className="h-4 w-4 mr-2" /> Capturar Documento</>
                      )}
                    </label>
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="manual" />
            </Tabs>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fornecedor</Label>
                <Input placeholder="Ex: Fornecedor Ltda" value={form.fornecedor} onChange={e => set("fornecedor", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Matéria-Prima</Label>
                <Input placeholder="Ex: Milho Moído" value={form.materiaPrima} onChange={e => set("materiaPrima", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Lote Fornecedor</Label>
                <Input placeholder="Lote" value={form.lote} onChange={e => set("lote", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Nota Fiscal (Nº)</Label>
                <Input placeholder="Nº NF-e" value={form.numNF} onChange={e => set("numNF", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade</Label>
                <div className="flex gap-2">
                  <Input placeholder="Qtd" value={form.quantidade} onChange={e => set("quantidade", e.target.value)} />
                  <Select value={form.unidade} onValueChange={v => set("unidade", v)}>
                    <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="un">un</SelectItem>
                      <SelectItem value="t">t</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Temperatura (ºC)</Label>
                <Input placeholder="Ex: 25" value={form.temperatura} onChange={e => set("temperatura", e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 border p-3 rounded-lg bg-muted/40">
              <div className="space-y-2">
                <Label>Odor</Label>
                <Select value={form.odor} onValueChange={v => set("odor", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="alterado">Alterado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Umidade</Label>
                <Input placeholder="Ex: 12%" value={form.umidade} onChange={e => set("umidade", e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Insetos</Label>
                <Select value={form.insetos} onValueChange={v => set("insetos", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ausente">Ausente</SelectItem>
                    <SelectItem value="presente">Presente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Certificado de Análise / Laudo (Nº)</Label>
              <Input placeholder="Nº do Certificado" value={form.certNumero} onChange={e => set("certNumero", e.target.value)} />
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label>Upload da Nota Fiscal</Label>
                <FileUploadComponent bucket="documentos-bpf" onUploadComplete={(url) => set("nfUrl", url)} label="Clique para subir a NF" />
              </div>
              <div className="space-y-2">
                <Label>Upload do Laudo/Certificado</Label>
                <FileUploadComponent bucket="documentos-bpf" onUploadComplete={(url) => set("certUrl", url)} label="Clique para subir o Laudo" />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch id="aprovado" checked={form.aprovado} onCheckedChange={v => set("aprovado", v)} />
              <Label htmlFor="aprovado">Aprovado no Recebimento</Label>
            </div>

            <div className="flex items-center space-x-2 border-l-4 border-orange-500 pl-3 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
              <Switch id="armaz-inad" checked={form.armazenamentoInadequado} onCheckedChange={v => set("armazenamentoInadequado", v)} />
              <Label htmlFor="armaz-inad" className="text-sm">
                ⚠️ MP armazenada em <strong>local inadequado</strong> pelo fornecedor/transporte (gera alerta MAPA)
              </Label>
            </div>

            <div className="space-y-2">
              <Label>Observações</Label>
              <Textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} />
            </div>

            <div className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-2 border-t bg-background px-6 py-3">
            <Button onClick={handleSalvar} disabled={saving} className="w-full">
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {editId ? "Salvar Alterações" : "Registrar Recebimento"}
            </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>MP</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Status (FIFO)</TableHead>
            <TableHead>Documentos</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow><TableCell colSpan={7} className="text-center py-8"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></TableCell></TableRow>
          ) : filtered.map(item => (
            <TableRow key={item.id} className={item.status === "liberado" ? "bg-primary/5" : ""}>
              <TableCell>{item.data}</TableCell>
              <TableCell>{item.materia_prima}</TableCell>
              <TableCell>{item.lote}</TableCell>
              <TableCell className="font-bold">{item.saldo || 0} {item.unidade}</TableCell>
              <TableCell>
                <Badge className={item.status === "liberado" ? "bg-green-500" : "bg-yellow-500"}>
                  {item.status}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  {item.nota_fiscal_url && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(item.nota_fiscal_url!, "_blank")} title="Nota Fiscal">
                      <FileText className="h-4 w-4 text-blue-500" />
                    </Button>
                  )}
                  {item.certificado_analise_url && (
                    <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => window.open(item.certificado_analise_url!, "_blank")} title="Laudo/Certificado">
                      <FlaskConical className="h-4 w-4 text-purple-500" />
                    </Button>
                  )}
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => printElement(`print-rec-${item.id}`)} title="Imprimir Ficha de Recebimento">
                    <Printer className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
                {/* Hidden print template */}
                <div id={`print-rec-${item.id}`} className="hidden print:block p-8 space-y-6">
                  <div className="text-center border-b pb-4">
                    <h1 className="text-2xl font-bold">FICHA DE RECEBIMENTO DE MATÉRIA-PRIMA (POP-01)</h1>
                    <p className="text-sm">Controle de Qualidade e Boas Práticas de Fabricação</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <p><strong>Data:</strong> {item.data}</p>
                    <p><strong>Fornecedor:</strong> {item.fornecedor}</p>
                    <p><strong>Matéria-Prima:</strong> {item.materia_prima}</p>
                    <p><strong>Lote:</strong> {item.lote}</p>
                    <p><strong>Nota Fiscal:</strong> {item.numero_nota_fiscal || "—"}</p>
                    <p><strong>Quantidade:</strong> {item.quantidade} {item.unidade}</p>
                  </div>
                  <div className="border p-4 rounded-md space-y-2">
                    <h3 className="font-bold border-b pb-1">Análise Sensorial e Qualidade</h3>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <p>Odor: {item.odor}</p>
                      <p>Umidade: {item.umidade || "—"}</p>
                      <p>Presença de Insetos: {item.insetos}</p>
                      <p>Temperatura: {item.temperatura ? `${item.temperatura} ºC` : "—"}</p>
                      <p>Certificado de Análise: {item.certificado_analise_numero || "—"}</p>
                      <p>Aprovado: {item.aprovado ? "SIM" : "NÃO"}</p>
                    </div>
                  </div>
                  <div className="pt-8">
                    <p>Observações: {item.observacoes || "Nenhuma"}</p>
                  </div>
                  <div className="pt-20 flex justify-between px-10">
                    <div className="text-center border-t w-64 pt-2">Assinatura do Responsável</div>
                    <div className="text-center border-t w-64 pt-2">Assinatura do Transportador</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex justify-end gap-1">
                  {item.status === "bloqueado" && (
                    <Button
                      size="sm"
                      onClick={() => { setSelectedLoteId(item.id); setLiberarDialogOpen(true); }}
                      title="Liberar matéria-prima para uso"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      Liberar
                    </Button>
                  )}
                  {registroBloqueado(item) ? (
                    <Badge variant="outline" className="gap-1 text-[10px] text-muted-foreground">
                      <LockIcon className="h-3 w-3" /> Assinado — imutável
                    </Badge>
                  ) : (
                    <>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => abrirEdicao(item)} title="Editar registro">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setExcluirId(item.id)} title="Excluir registro">
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={liberarDialogOpen} onOpenChange={setLiberarDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Liberação da Matéria-Prima</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="flex gap-3 rounded-md border-l-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-yellow-500" />
              <p className="text-sm text-muted-foreground">
                A liberação equivale à assinatura digital do registro: após confirmar, o lançamento fica
                <strong> imutável</strong> (sem edição ou exclusão), xigência do MAPA. Correções posteriores
                só por Não Conformidade. A justificativa é opcional, mas recomendada quando houver quebra de FIFO.
              </p>
            </div>

            <div className="space-y-2">
              <Label>Justificativa (opcional)</Label>
              <Textarea
                placeholder="Ex: laudo aprovado, correção de estoque, ajuste de FIFO..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                className="min-h-[90px]"
              />
            </div>

            <div className="flex justify-end gap-2 sticky bottom-0 z-10 -mx-6 -mb-6 mt-2 border-t bg-background px-6 py-3">
              <Button variant="outline" onClick={() => setLiberarDialogOpen(false)}>Cancelar</Button>
              <Button onClick={handleLiberarLote} disabled={saving}>
                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ShieldAlert className="mr-2 h-4 w-4" />}
                Confirmar Liberação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluirId} onOpenChange={(v) => !v && setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir este recebimento?</AlertDialogTitle>
            <AlertDialogDescription>
              A exclusão é definitiva, mas fica registrada na trilha de auditoria (audit log) com os dados anteriores.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
