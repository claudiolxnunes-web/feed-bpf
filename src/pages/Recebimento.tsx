import { useState, useEffect } from "react";
import { Package, Plus, CheckCircle2, Loader2, Search, FileText, Download, Truck, AlertTriangle, ShieldAlert, FlaskConical, Printer, Camera } from "lucide-react";

import FileUploadComponent from "@/components/FileUpload";
import { registrarAuditLog } from "@/utils/auditLog";
import { gerarHashIntegridade, adicionarRodapeIntegridade } from "@/utils/integridade";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
  status: 'bloqueado' | 'liberado' | 'esgotado';
  saldo: number | null;
}

export default function Recebimento() {
  const { user, roles } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<RecebimentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [open, setOpen] = useState(false);

  const [busca, setBusca] = useState("");

  const [fornecedor, setFornecedor] = useState("");
  const [materiaPrima, setMateriaPrima] = useState("");
  const [lote, setLote] = useState("");
  const [odor, setOdor] = useState("normal");
  const [umidade, setUmidade] = useState("");
  const [insetos, setInsetos] = useState("ausente");
  const [temperatura, setTemperatura] = useState("");
  const [quantidade, setQuantidade] = useState("");
  const [unidade, setUnidade] = useState("kg");
  const [validade, setValidade] = useState("");
  const [aprovado, setAprovado] = useState(true);
  const [certNumero, setCertNumero] = useState("");
  const [certUrl, setCertUrl] = useState("");
  const [certValido, setCertValido] = useState<boolean | null>(null);
  const [numNF, setNumNF] = useState("");
  const [nfUrl, setNfUrl] = useState("");
  const [laudoUrl, setLaudoUrl] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [armazenamentoInadequado, setArmazenamentoInadequado] = useState(false);

  const [liberarDialogOpen, setLiberarDialogOpen] = useState(false);
  const [selectedLoteId, setSelectedLoteId] = useState<string | null>(null);
  const [justificativa, setJustificativa] = useState("");

  const isAdmin = roles.includes("admin");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase
        .from("recebimento_mp")
        .select("*")
        .order("data", { ascending: false });
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
      formData.append('file', file);
      
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: formData,
      });

      if (error) throw error;

      if (data) {
        setFornecedor(data.fornecedor_nome || data.cliente_nome || fornecedor);
        setMateriaPrima(data.materia_prima || materiaPrima);
        setLote(data.lote || lote);
        setNumNF(data.numero_nf || numNF);
        setQuantidade(data.quantidade?.toString() || quantidade);
        if (data.unidade) setUnidade(data.unidade);
        setObservacoes(data.observacoes || observacoes);
        
        toast.success("Documento processado por IA com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro OCR:", err);
      toast.error("Erro ao processar imagem. Verifique a iluminação.");
    } finally {
      setIsScanning(false);
    }
  };

  const handleAdd = async () => {

    if (!fornecedor || !materiaPrima || !user) return;
    setSaving(true);
    
    const { data: newBatch, error } = await supabase.from("recebimento_mp").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      fornecedor, materia_prima: materiaPrima, lote: lote || null,
      quantidade: quantidade || null, unidade: unidade || null,
      aprovado,
      odor, umidade, insetos, temperatura,
      certificado_analise_numero: certNumero || null,
      certificado_analise_url: certUrl || null,
      numero_nota_fiscal: numNF || null,
      nota_fiscal_url: nfUrl || null,
      laudo_url: laudoUrl || null,
      observacoes: observacoes || null,
      armazenamento_inadequado: armazenamentoInadequado,
      status: 'bloqueado'
    } as any).select().single();

    if (!error && !aprovado) {
      await supabase.from("nao_conformidades").insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        data: new Date().toISOString().split("T")[0],
        setor: "Recebimento de MP",
        descricao: `NC no recebimento da MP ${materiaPrima} (Lote: ${lote || "—"}): ${observacoes}`,
        status: "pendente"
      } as any);
    }


    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      await registrarAuditLog({
        userId: user.id,
        empresaId: empresaAtiva?.id,
        tabela: "recebimento_mp",
        registroId: newBatch.id,
        acao: "criar",
        dadosNovos: newBatch
      });

      toast.success("Recebimento registrado!");
      setOpen(false);
      fetchData();
    }
    setSaving(false);
  };

  const handleLiberarLote = async () => {
    if (!selectedLoteId || !user) return;
    if (!isAdmin) {
      toast.error("Apenas administradores podem liberar lotes manualmente.");
      return;
    }
    if (!justificativa.trim()) {
      toast.error("Informe uma justificativa para a liberação.");
      return;
    }

    setSaving(true);
    const item = items.find(i => i.id === selectedLoteId);
    
    const { error } = await supabase.from("recebimento_mp").update({ 
      status: 'liberado',
      observacoes: (item?.observacoes || "") + "\n\n[Liberação Manual] Justificativa: " + justificativa
    }).eq("id", selectedLoteId);

    if (error) {
      toast.error("Erro: " + error.message);
    } else {
      await registrarAuditLog({
        userId: user.id,
        empresaId: empresaAtiva?.id,
        tabela: "recebimento_mp",
        registroId: selectedLoteId,
        acao: "editar",
        dadosAnteriores: item,
        dadosNovos: { status: 'liberado', justificativa_liberacao: justificativa }
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

  return (
    <>
      <PageHeader icon={Package} title="Recebimento de Matérias-Primas" description="Controle de qualidade e FIFO" />
      <div className="flex justify-end mb-3"><AnexarPlanilhaPop popCodigo="POP-01" popNome="Recebimento de Matérias-Primas" /></div>
      <div className="flex justify-between items-center mb-4">
        <Input placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} className="max-w-xs" />
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="mr-2" /> Novo</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Receber MP</DialogTitle></DialogHeader>
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
                  <Input placeholder="Ex: Fornecedor Ltda" value={fornecedor} onChange={e => setFornecedor(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Matéria-Prima</Label>
                  <Input placeholder="Ex: Milho Moído" value={materiaPrima} onChange={e => setMateriaPrima(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Lote Fornecedor</Label>
                  <Input placeholder="Lote" value={lote} onChange={e => setLote(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Nota Fiscal (Nº)</Label>
                  <Input placeholder="Nº NF-e" value={numNF} onChange={e => setNumNF(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <div className="flex gap-2">
                    <Input placeholder="Qtd" value={quantidade} onChange={e => setQuantidade(e.target.value)} />
                    <Select value={unidade} onValueChange={setUnidade}>
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
                  <Input placeholder="Ex: 25" value={temperatura} onChange={e => setTemperatura(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 border p-3 rounded-lg bg-gray-50">
                <div className="space-y-2">
                  <Label>Odor</Label>
                  <Select value={odor} onValueChange={setOdor}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="alterado">Alterado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Umidade</Label>
                  <Input placeholder="Ex: 12%" value={umidade} onChange={e => setUmidade(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Insetos</Label>
                  <Select value={insetos} onValueChange={setInsetos}>
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
                <Input placeholder="Nº do Certificado" value={certNumero} onChange={e => setCertNumero(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label>Upload da Nota Fiscal</Label>
                  <FileUploadComponent 
                    bucket="documentos_bpf" 
                    onUploadComplete={(url) => setNfUrl(url)} 
                    label="Clique para subir a NF"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Upload do Laudo/Certificado</Label>
                  <FileUploadComponent 
                    bucket="documentos_bpf" 
                    onUploadComplete={(url) => setCertUrl(url)} 
                    label="Clique para subir o Laudo"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="aprovado" checked={aprovado} onCheckedChange={setAprovado} />
                <Label htmlFor="aprovado">Aprovado no Recebimento</Label>
              </div>

              <div className="flex items-center space-x-2 border-l-4 border-orange-500 pl-3 bg-orange-50 dark:bg-orange-950/20 p-2 rounded">
                <Switch id="armaz-inad" checked={armazenamentoInadequado} onCheckedChange={setArmazenamentoInadequado} />
                <Label htmlFor="armaz-inad" className="text-sm">
                  ⚠️ MP armazenada em <strong>local inadequado</strong> pelo fornecedor/transporte (gera alerta MAPA)
                </Label>
              </div>

              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} />
              </div>

              <Button onClick={handleAdd} disabled={saving} className="w-full">
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Registrar Recebimento
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Data</TableHead>
            <TableHead>MP</TableHead>
            <TableHead>Lote</TableHead>
            <TableHead>Saldo</TableHead>
            <TableHead>Status (FIFO)</TableHead>
            <TableHead>Documentos</TableHead>
            <TableHead>Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map(item => (
            <TableRow key={item.id} className={item.status === 'liberado' ? "bg-primary/5" : ""}>
              <TableCell>{item.data}</TableCell>
              <TableCell>{item.materia_prima}</TableCell>
              <TableCell>{item.lote}</TableCell>
              <TableCell className="font-bold">{item.saldo || 0} {item.unidade}</TableCell>
              <TableCell>
                <Badge className={item.status === 'liberado' ? "bg-green-500" : "bg-yellow-500"}>
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
                  <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => {
                    printElement(`print-rec-${item.id}`);
                  }} title="Imprimir Ficha de Recebimento">
                    <Printer className="h-4 w-4 text-gray-500" />
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
                {item.status === 'bloqueado' && (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setSelectedLoteId(item.id);
                      setLiberarDialogOpen(true);
                    }}
                    disabled={!isAdmin}
                    title={!isAdmin ? "Apenas administradores podem liberar lotes" : ""}
                  >
                    <ShieldAlert className="w-4 h-4 mr-1 text-red-500" />
                    Liberar
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={liberarDialogOpen} onOpenChange={setLiberarDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liberação Manual de Lote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <AlertTriangle className="h-5 w-5 text-yellow-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    A liberação manual exige uma justificativa clara que será registrada para fins de auditoria.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Justificativa da Liberação (Ex: Correção de estoque, ajuste de FIFO)</Label>
              <Textarea 
                placeholder="Descreva o motivo da liberação manual..."
                value={justificativa}
                onChange={e => setJustificativa(e.target.value)}
                className="min-h-[100px]"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setLiberarDialogOpen(false)}>Cancelar</Button>
              <Button 
                onClick={handleLiberarLote} 
                disabled={saving || !justificativa.trim()}
                variant="destructive"
              >
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirmar Liberação
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}