import { useState, useEffect, useMemo } from "react";
import { PlayCircle, Plus, CheckCircle2, Clock, AlertTriangle, Loader2, ExternalLink, Filter, CalendarIcon, Bell, ShieldCheck } from "lucide-react";
import { format, parseISO, isAfter, isBefore, differenceInDays } from "date-fns";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import PageHeader from "@/components/PageHeader";
import { PreencherItDialog } from "@/components/documentos/PreencherItDialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

interface DocRow {
  id: string;
  codigo: string;
  nome: string;
  versao: string | null;
  status: string | null;
}

interface ExecRow {
  id: string;
  codigo_pop: string;
  nome_pop: string;
  data_execucao: string;
  executor: string;
  setor: string | null;
  status: string | null;
  observacoes: string | null;
  documento_id: string | null;
  verificado_por: string | null;
  data_verificacao: string | null;
  status_verificacao: string | null;
}

interface ArquivoRow {
  id: string;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  documento_ref_id: string | null;
}

const statusConfig: Record<string, { label: string; className: string; icon: React.ElementType }> = {
  pendente: { label: "Pendente", className: "bg-muted text-muted-foreground", icon: Clock },
  em_execucao: { label: "Em execução", className: "bg-info/20 text-info", icon: PlayCircle },
  concluido: { label: "Concluído", className: "bg-primary/20 text-primary", icon: CheckCircle2 },
  nao_conforme: { label: "Não conforme", className: "bg-destructive/20 text-destructive", icon: AlertTriangle },
};

const POP02_TRIAGEM_ITENS = ["Colaborador sem sintomas", "Uniforme limpo", "Uso de EPIs", "Mãos higienizadas", "Ausência de adornos", "Unhas curtas", "Barba aparada", "Ausência de ferimentos", "Sem perfume", "ASO válido", "Exames em dia", "Capacitação válida"];
const POP03_LIMPEZA_ITENS = ["Pisos limpos", "Paredes limpas", "Equipamentos limpos", "Misturador sem resíduos", "Esteiras limpas", "Utensílios lavados", "Ralos limpos", "Lixeiras identificadas", "Luminárias protegidas", "Registro de produtos", "FISPQ disponível", "Concentração verificada", "Tempo respeitado", "Cronograma afixado", "Silos inspecionados"];
const POP04_AGUA_ITENS = ["Cloro residual (0,2-2,0mg/L)", "pH (6,0-9,5)", "Turbidez (≤ 5 NTU)", "Ausência de odor", "Reservatório com tampa", "Laudo laboratorial mensal", "Certificado de limpeza", "Ponto de coleta identificado", "Laudo microbiológico", "Registro de tratamento"];
const POP05_HIGIENE_PESSOAL_ITENS = ["Colaborador sem sintomas", "ASO válido", "Exame admissional/periódico em dia", "Exame retorno realizado", "Uniforme limpo", "Uso de EPIs", "Ausência de adornos", "Unhas curtas/sem esmalte", "Barba aparada", "Ausência de ferimentos", "Sem perfume/maquiagem", "Mãos lavadas", "BPF orientado", "Capacitação válida", "Triagem diária preenchida", "Apto médico"];
const POP09_VEICULO_ITENS = ["Carroceria limpa", "Ausência de odor", "Lona em bom estado", "Ausência de pragas", "Sem carga proibida", "Lacre íntegro", "DANFE completa", "Temperatura adequada"];

const POPS_PERIODICIDADE: Record<string, number> = {
  "POP-01": 30, "POP-02": 7, "POP-03": 30, "POP-04": 30, "POP-05": 7, "POP-06": 7, "POP-07": 30, "POP-08": 90, "POP-09": 30, "POP-10": 30,
};

export default function ExecucaoPops() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [execucoes, setExecucoes] = useState<ExecRow[]>([]);
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [filtroStatus, setFiltroStatus] = useState("todos");
  const [dataInicio, setDataInicio] = useState<Date | undefined>(undefined);
  const [dataFim, setDataFim] = useState<Date | undefined>(undefined);
  const [filtroPop, setFiltroPop] = useState("todos");

  const [docSelecionado, setDocSelecionado] = useState("");
  const [executor, setExecutor] = useState("");
  const [setor, setSetor] = useState("");
  const [statusExec, setStatusExec] = useState("concluido");
  const [obs, setObs] = useState("");
  const [checklistTriagem, setChecklistTriagem] = useState<Record<number, boolean | null>>({});
  
  // Custom fields
  const [asoNumero, setAsoNumero] = useState("");
  const [asoValidade, setAsoValidade] = useState("");
  const [asoTipo, setAsoTipo] = useState("periodico");
  const [produtoQuimico, setProdutoQuimico] = useState("");
  const [concentracaoQuimico, setConcentracaoQuimico] = useState("");
  const [tempoContato, setTempoContato] = useState("");
  const [laudoNumero, setLaudoNumero] = useState("");
  const [laudoLaboratorio, setLaudoLaboratorio] = useState("");
  const [laudoData, setLaudoData] = useState("");

  const fetchData = async () => {
    if (!user) return;
    const [execRes, docsRes, arqRes] = await Promise.all([
      (() => { let q = supabase.from("execucao_pops").select("*").order("data_execucao", { ascending: false }); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
      (() => { let q = supabase.from("documentos").select("*").order("codigo"); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
      (() => { let q = supabase.from("arquivos_bpf").select("id, arquivo_url, arquivo_nome, documento_ref_id"); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
    ]);
    if (execRes.data) setExecucoes(execRes.data as unknown as ExecRow[]);
    if (docsRes.data) setDocs(docsRes.data);
    if (arqRes.data) setArquivos(arqRes.data as unknown as ArquivoRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user]);

  const selectedDoc = docs.find(d => d.id === docSelecionado);
  const isPOP02 = selectedDoc?.codigo?.includes("POP-02");
  const isPOP03 = selectedDoc?.codigo?.includes("POP-03");
  const isPOP04 = selectedDoc?.codigo?.includes("POP-04");
  const isPOP05 = selectedDoc?.codigo?.includes("POP-05");
  const isPOP09 = selectedDoc?.codigo?.includes("POP-09");
  const activeChecklist = isPOP02 ? POP02_TRIAGEM_ITENS : isPOP03 ? POP03_LIMPEZA_ITENS : isPOP04 ? POP04_AGUA_ITENS : isPOP05 ? POP05_HIGIENE_PESSOAL_ITENS : isPOP09 ? POP09_VEICULO_ITENS : null;

  const handleAdd = async () => {
    if (!selectedDoc || !executor || !user) return;
    setSaving(true);
    let obsCompleta = obs;
    if (activeChecklist) {
      const checkItems = activeChecklist.map((item, i) => `${checklistTriagem[i] === true ? "✅" : checklistTriagem[i] === false ? "❌" : "⬜"} ${item}`).join("\n");
      const extraInfo = [];
      if (asoNumero) extraInfo.push(`ASO: ${asoNumero} (${asoTipo}) - Val: ${asoValidade}`);
      if (produtoQuimico) extraInfo.push(`Produto: ${produtoQuimico} (Conc: ${concentracaoQuimico}, Tempo: ${tempoContato})`);
      if (laudoNumero) extraInfo.push(`Laudo: ${laudoNumero} (Lab: ${laudoLaboratorio}, Data: ${laudoData})`);
      
      obsCompleta = `${obsCompleta}\n\nChecklist:\n${checkItems}${extraInfo.length > 0 ? '\n\nInformações Extra:\n' + extraInfo.join('\n') : ''}`;
    }
    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      codigo_pop: selectedDoc.codigo,
      nome_pop: selectedDoc.nome,
      executor,
      setor,
      status: statusExec,
      observacoes: obsCompleta,
      documento_id: selectedDoc.id,
    });
    if (error) toast.error("Erro ao salvar execução");
    else {
      toast.success("Execução registrada!");
      setOpen(false);
      setDocSelecionado(""); setExecutor(""); setSetor(""); setObs(""); setStatusExec("concluido");
      setChecklistTriagem({}); setAsoNumero(""); setAsoValidade(""); setProdutoQuimico(""); setLaudoNumero("");
      fetchData();
    }
    setSaving(false);
  };

  const handleVerificar = async (id: string) => {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('nome').eq('user_id', user.id).single();
    const verificador = profile?.nome || user.email;
    
    const { error } = await supabase.from("execucao_pops").update({
      verificado_por: verificador,
      data_verificacao: new Date().toISOString(),
      status_verificacao: 'aprovado'
    } as any).eq('id', id);

    if (error) toast.error("Erro ao verificar");
    else {
      toast.success("Registro verificado pelo supervisor!");
      fetchData();
    }
  };

  const filteredExecucoes = useMemo(() => {
    return execucoes.filter(e => {
      if (filtroStatus !== "todos" && e.status !== filtroStatus) return false;
      if (filtroPop !== "todos" && e.codigo_pop !== filtroPop) return false;
      if (dataInicio && isBefore(parseISO(e.data_execucao), dataInicio)) return false;
      if (dataFim) {
        const endOfDay = new Date(dataFim);
        endOfDay.setHours(23, 59, 59);
        if (isAfter(parseISO(e.data_execucao), endOfDay)) return false;
      }
      return true;
    });
  }, [execucoes, filtroStatus, dataInicio, dataFim, filtroPop]);

  const uniquePops = [...new Set(execucoes.map(e => e.codigo_pop))];

  return (
    <>
      <PageHeader icon={PlayCircle} title="Execução de ITs e POPs" description="Diário de bordo digital — comprova ao MAPA que os POPs são executados" />
      
      <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Registros de Execução</CardTitle>
              <PreencherItDialog onSalvo={fetchData} />
              <Dialog open={open} onOpenChange={setOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Registrar Nova</Button></DialogTrigger>
                  <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                      <DialogHeader><DialogTitle>Registrar Execução de POP/IT</DialogTitle></DialogHeader>
                      <div className="space-y-6 pt-4">
                          <div className="space-y-2">
                              <Label>Documento (POP/IT)</Label>
                              <Select value={docSelecionado} onValueChange={setDocSelecionado}>
                                  <SelectTrigger><SelectValue placeholder="Selecione o documento" /></SelectTrigger>
                                  <SelectContent>
                                      {docs.map(d => <SelectItem key={d.id} value={d.id}>{d.codigo} — {d.nome}</SelectItem>)}
                                  </SelectContent>
                              </Select>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2"><Label>Executor</Label><Input value={executor} onChange={e => setExecutor(e.target.value)} placeholder="Quem executou?" /></div>
                              <div className="space-y-2"><Label>Setor</Label><Input value={setor} onChange={e => setSetor(e.target.value)} placeholder="Setor/Área" /></div>
                          </div>

                          {activeChecklist && (
                              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 space-y-4">
                                  <p className="text-xs font-bold uppercase tracking-wider text-primary">Checklist de Verificação</p>
                                  <div className="grid grid-cols-1 gap-2">
                                      {activeChecklist.map((item, idx) => (
                                          <div key={idx} className="flex items-center justify-between p-2 rounded bg-background border text-xs">
                                              <span>{item}</span>
                                              <div className="flex gap-1">
                                                  <Button 
                                                    size="icon" 
                                                    className={cn("w-7 h-7", checklistTriagem[idx] === true ? "bg-green-500 hover:bg-green-600" : "bg-muted text-muted-foreground")}
                                                    onClick={() => setChecklistTriagem(p => ({...p, [idx]: p[idx] === true ? null : true}))}
                                                  >✓</Button>
                                                  <Button 
                                                    size="icon" 
                                                    className={cn("w-7 h-7", checklistTriagem[idx] === false ? "bg-destructive hover:bg-destructive/90" : "bg-muted text-muted-foreground")}
                                                    onClick={() => setChecklistTriagem(p => ({...p, [idx]: p[idx] === false ? null : false}))}
                                                  >✗</Button>
                                              </div>
                                          </div>
                                      ))}
                                  </div>

                                  {(isPOP02 || isPOP05) && (
                                      <div className="space-y-3 pt-4 border-t">
                                          <p className="text-xs font-bold text-emerald-600">Registro de ASO / Exames</p>
                                          <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-1"><Label className="text-[10px]">Nº ASO</Label><Input value={asoNumero} onChange={e => setAsoNumero(e.target.value)} className="h-8 text-xs" /></div>
                                              <div className="space-y-1"><Label className="text-[10px]">Validade</Label><Input type="date" value={asoValidade} onChange={e => setAsoValidade(e.target.value)} className="h-8 text-xs" /></div>
                                          </div>
                                      </div>
                                  )}

                                  {isPOP03 && (
                                      <div className="space-y-3 pt-4 border-t">
                                          <p className="text-xs font-bold text-amber-600">Sanitizantes Utilizados</p>
                                          <div className="grid grid-cols-2 gap-3">
                                              <div className="space-y-1"><Label className="text-[10px]">Produto</Label><Input value={produtoQuimico} onChange={e => setProdutoQuimico(e.target.value)} className="h-8 text-xs" /></div>
                                              <div className="space-y-1"><Label className="text-[10px]">Concentração</Label><Input value={concentracaoQuimico} onChange={e => setConcentracaoQuimico(e.target.value)} className="h-8 text-xs" /></div>
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}

                          <div className="space-y-2"><Label>Observações Adicionais</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} className="min-h-[100px]" /></div>
                          
                          <Button onClick={handleAdd} className="w-full" disabled={saving || !docSelecionado || !executor}>
                              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : "Salvar Registro de Execução"}
                          </Button>
                      </div>
                  </DialogContent>
              </Dialog>
          </CardHeader>
          <CardContent className="overflow-x-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className="w-[120px]">Data</TableHead>
                          <TableHead>POP/IT</TableHead>
                          <TableHead>Executor</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Verificação (Supervisor)</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredExecucoes.map(e => (
                          <TableRow key={e.id}>
                              <TableCell className="text-xs font-mono">{format(parseISO(e.data_execucao), "dd/MM/yy")}</TableCell>
                              <TableCell>
                                  <p className="font-bold text-xs">{e.codigo_pop}</p>
                                  <p className="text-[10px] text-muted-foreground line-clamp-1">{e.nome_pop}</p>
                              </TableCell>
                              <TableCell className="text-xs">{e.executor}</TableCell>
                              <TableCell>
                                  <Badge variant="outline" className={cn("text-[10px]", statusConfig[e.status || "concluido"].className)}>
                                      {statusConfig[e.status || "concluido"].label}
                                  </Badge>
                              </TableCell>
                              <TableCell>
                                {e.status_verificacao === 'aprovado' ? (
                                  <Badge variant="outline" className="text-emerald-600 border-emerald-600 gap-1 text-[10px] bg-emerald-50">
                                    <CheckCircle2 className="w-3 h-3" /> {e.verificado_por}
                                  </Badge>
                                ) : (
                                  <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2 text-amber-600 hover:text-amber-700 hover:bg-amber-50" onClick={() => handleVerificar(e.id)}>
                                    <ShieldCheck className="w-3 h-3" /> Verificar
                                  </Button>
                                )}
                              </TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
          </CardContent>
      </Card>
    </>
  );
}
