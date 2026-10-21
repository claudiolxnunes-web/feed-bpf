import { PONTOS_COLETA, PARAMETROS_ANALISE, CHECKLIST_RESERVATORIO } from "@/components/agua/constants";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { corrigirViaNC } from "@/utils/correcaoNC";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Droplet, CheckCircle2, AlertTriangle, FileWarning, FileText, Beaker, Container, Download, ShieldCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { AnexarPlanilhaPop } from "@/components/documentos/AnexarPlanilhaPop";







export default function PotabilidadeAgua() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);
  const [openLimpeza, setOpenLimpeza] = useState(false);
  const [tab, setTab] = useState("monitoramento");

  // Form states - Monitoramento
  const [pontoColeta, setPontoColeta] = useState(PONTOS_COLETA[0]);
  const [dataColeta, setDataColeta] = useState(new Date().toISOString().split("T")[0]);
  const [parametro, setParametro] = useState(PARAMETROS_ANALISE[0].param);
  const [resultado, setResultado] = useState("");
  const [conforme, setConforme] = useState(true);
  const [responsavel, setResponsavel] = useState("");
  const [laudoNumero, setLaudoNumero] = useState("");
  const [laboratorio, setLaboratorio] = useState("");
  const [obs, setObs] = useState("");

  // Form states - Limpeza Reservatório
  const [limpDataExec, setLimpDataExec] = useState(new Date().toISOString().split("T")[0]);
  const [limpReservatorio, setLimpReservatorio] = useState("Caixa d'Água Principal");
  const [limpEmpresa, setLimpEmpresa] = useState("");
  const [limpResponsavel, setLimpResponsavel] = useState("");
  const [limpObs, setLimpObs] = useState("");
  const [limpChecklist, setLimpChecklist] = useState<Record<number, boolean>>({});

  // Query - análises de água (reusing analises_laboratorio with tipo_analise = 'potabilidade_agua')
  const { data: analises = [] } = useQuery({
    queryKey: ["potabilidade-agua", empresaAtiva?.id],
    queryFn: async () => {
      const q = supabase
        .from("analises_laboratorio")
        .select("*")
        .eq("tipo_analise", "potabilidade_agua")
        .order("data_analise", { ascending: false });
      if (empresaAtiva?.id) q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  // Query - limpezas de reservatório (reusing registros_limpeza with tipo_limpeza = 'reservatorio')
  const { data: limpezas = [] } = useQuery({
    queryKey: ["limpeza-reservatorio", empresaAtiva?.id],
    queryFn: async () => {
      const q = supabase
        .from("registros_limpeza")
        .select("*")
        .eq("tipo_limpeza", "reservatorio")
        .order("data_execucao", { ascending: false });
      if (empresaAtiva?.id) q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const handleVerificar = async (tabela: string, id: string) => {
    if (!user) return;
    const { data: profile } = await supabase.from('profiles').select('nome').eq('user_id', user.id).single();
    const verificador = profile?.nome || user.email;
    
    const { error } = await (supabase.from(tabela as any) as any).update({
      verificado_por: verificador,
      data_verificacao: new Date().toISOString(),
      status_verificacao: 'aprovado'
    }).eq('id', id);

    if (error) toast.error("Erro ao verificar");
    else {
      toast.success("Registro verificado!");
      queryClient.invalidateQueries();
    }
  };

  const addAnalise = useMutation({
    mutationFn: async () => {
      const paramInfo = PARAMETROS_ANALISE.find(p => p.param === parametro);
      
      if (!conforme && !obs) {
        toast.error("Ação corretiva (Observações) é obrigatória para itens não conformes!");
        throw new Error("Ação corretiva obrigatória");
      }

      const { data: record, error } = await supabase.from("analises_laboratorio").insert({
        user_id: user!.id,
        empresa_id: empresaAtiva?.id || null,
        tipo_analise: "potabilidade_agua",
        produto: pontoColeta,
        data_analise: dataColeta,
        parametro,
        resultado,
        unidade: paramInfo?.unidade || "",
        limite_referencia: paramInfo?.limite || "",
        conforme,
        laboratorio,
        laudo_numero: laudoNumero,
        observacoes: obs,
        status: conforme ? "conforme" : "nao_conforme",
      }).select().single();

      if (error) throw error;

      // Automatic NC Flow
      if (!conforme) {
        await supabase.from("nao_conformidades").insert({
          user_id: user!.id,
          empresa_id: empresaAtiva?.id || null,
          data: dataColeta,
          setor: "Qualidade / Água",
          descricao: `NC na análise de potabilidade (${parametro}): ${obs}`,
          status: "pendente"
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["potabilidade-agua"] });
      toast.success("Registro de potabilidade salvo!");
      setOpenDialog(false);
      setResultado("");
      setObs("");
      setLaudoNumero("");
    },
    onError: (err: any) => {
      if (err.message !== "Ação corretiva obrigatória") toast.error("Erro ao salvar registro");
    },
  });

  const addLimpeza = useMutation({
    mutationFn: async () => {
      const itensOk = Object.values(limpChecklist).filter(Boolean).length;
      const conformeLimpeza = itensOk === CHECKLIST_RESERVATORIO.length;

      if (!conformeLimpeza && !limpObs) {
        toast.error("Ação corretiva (Observações) é obrigatória para checklists incompletos!");
        throw new Error("Ação corretiva obrigatória");
      }

      const { data: record, error } = await supabase.from("registros_limpeza").insert({
        user_id: user!.id,
        empresa_id: empresaAtiva?.id || null,
        tipo_limpeza: "reservatorio",
        data_execucao: limpDataExec,
        executor: limpResponsavel || limpEmpresa,
        conforme: conformeLimpeza,
        observacoes: `Reservatório: ${limpReservatorio} | Empresa: ${limpEmpresa} | Checklist: ${itensOk}/${CHECKLIST_RESERVATORIO.length} | ${limpObs}`,
      }).select().single();

      if (error) throw error;

      // Automatic NC Flow
      if (!conformeLimpeza) {
        await supabase.from("nao_conformidades").insert({
          user_id: user!.id,
          empresa_id: empresaAtiva?.id || null,
          data: limpDataExec,
          setor: "Higiene / Reservatório",
          descricao: `NC na limpeza do reservatório ${limpReservatorio}: ${limpObs}`,
          status: "pendente"
        } as any);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["limpeza-reservatorio"] });
      toast.success("Limpeza de reservatório registrada!");
      setOpenLimpeza(false);
      setLimpChecklist({});
      setLimpObs("");
    },
    onError: (err: any) => {
      if (err.message !== "Ação corretiva obrigatória") toast.error("Erro ao salvar limpeza");
    },
  });

  const navigate = useNavigate();

  const conformes = analises.filter(a => a.conforme).length;
  const naoConformes = analises.filter(a => a.conforme === false).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="POP 04 - Potabilidade da Água"
        description="Controle de potabilidade da água e higienização de reservatórios"
        orientacaoModuloId="potabilidade-agua"
       assuntoBaseLegal="bpf_geral" />
      <div className="flex justify-end mb-3"><AnexarPlanilhaPop popCodigo="POP-04" popNome="Potabilidade da Água" /></div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <Droplet className="mx-auto h-6 w-6 text-blue-500 mb-1" />
          <p className="text-2xl font-bold">{analises.length}</p>
          <p className="text-xs text-muted-foreground">Análises Registradas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <CheckCircle2 className="mx-auto h-6 w-6 text-green-500 mb-1" />
          <p className="text-2xl font-bold text-green-600">{conformes}</p>
          <p className="text-xs text-muted-foreground">Conformes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-red-500 mb-1" />
          <p className="text-2xl font-bold text-red-600">{naoConformes}</p>
          <p className="text-xs text-muted-foreground">Não Conformes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Container className="mx-auto h-6 w-6 text-primary mb-1" />
          <p className="text-2xl font-bold">{limpezas.length}</p>
          <p className="text-xs text-muted-foreground">Limpezas Reservatório</p>
        </CardContent></Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="monitoramento"><Beaker className="w-4 h-4 mr-1" /> Monitoramento</TabsTrigger>
          <TabsTrigger value="reservatorio"><Container className="w-4 h-4 mr-1" /> Limpeza Reservatório</TabsTrigger>
          <TabsTrigger value="parametros"><FileText className="w-4 h-4 mr-1" /> Parâmetros Legais</TabsTrigger>
        </TabsList>

        {/* ── ABA MONITORAMENTO ── */}
        <TabsContent value="monitoramento" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-1" /> Nova Análise</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Registro de Análise — Potabilidade</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Ponto de Coleta</Label>
                    <Select value={pontoColeta} onValueChange={setPontoColeta}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{PONTOS_COLETA.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data da Coleta</Label><Input type="date" value={dataColeta} onChange={e => setDataColeta(e.target.value)} /></div>
                    <div>
                      <Label>Parâmetro</Label>
                      <Select value={parametro} onValueChange={setParametro}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>{PARAMETROS_ANALISE.map(p => <SelectItem key={p.param} value={p.param}>{p.param}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Resultado</Label>
                      <Input value={resultado} onChange={e => setResultado(e.target.value)} placeholder={PARAMETROS_ANALISE.find(p => p.param === parametro)?.limite || ""} />
                    </div>
                    <div className="flex items-end gap-2">
                      <Label>Conforme?</Label>
                      <Switch checked={conforme} onCheckedChange={setConforme} />
                      <Badge variant={conforme ? "default" : "destructive"}>{conforme ? "Sim" : "Não"}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Laboratório</Label><Input value={laboratorio} onChange={e => setLaboratorio(e.target.value)} /></div>
                    <div><Label>Nº Laudo</Label><Input value={laudoNumero} onChange={e => setLaudoNumero(e.target.value)} /></div>
                  </div>
                  <div><Label>Responsável</Label><Input value={responsavel} onChange={e => setResponsavel(e.target.value)} /></div>
                  <div><Label>Observações</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} /></div>
                  <Button onClick={() => addAnalise.mutate()} disabled={!resultado}>Salvar Análise</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Histórico de Análises</CardTitle></CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Ponto</TableHead>
                      <TableHead>Parâmetro</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Limite</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verificação</TableHead>
                      <TableHead>Laudo</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {analises.length === 0 && (
                      <TableRow><TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhuma análise registrada</TableCell></TableRow>
                    )}
                    {analises.map(a => (
                      <TableRow key={a.id}>
                        <TableCell className="whitespace-nowrap">{a.data_analise}</TableCell>
                        <TableCell className="text-xs">{a.produto}</TableCell>
                        <TableCell>{a.parametro}</TableCell>
                        <TableCell className="font-mono">{a.resultado} {a.unidade}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.limite_referencia}</TableCell>
                        <TableCell>
                          <Badge variant={a.conforme ? "default" : "destructive"} className="text-xs">
                            {a.conforme ? "Conforme" : "NC"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {a.status_verificacao === 'aprovado' ? (
                            <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                              <CheckCircle2 className="w-3 h-3" /> {a.verificado_por}
                            </Badge>
                          ) : (
                            <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={() => handleVerificar('analises_laboratorio', a.id)}>
                              <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                            </Button>
                          )}
                        </TableCell>
                        <TableCell className="text-xs">{a.laudo_numero || "—"}</TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="gap-1 text-xs" title="Registros não são excluídos — correção via Não Conformidade" onClick={() => corrigirViaNC(navigate, { tabela: "analises_laboratorio", registroId: a.id, descricao: `Análise de água — parâmetro: ${a.parametro} — resultado: ${a.resultado} — data: ${a.data_analise}` })}><FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC</Button>
                        </TableCell>
                      </TableRow>
                    ))}

                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA LIMPEZA RESERVATÓRIO ── */}
        <TabsContent value="reservatorio" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openLimpeza} onOpenChange={setOpenLimpeza}>
              <DialogTrigger asChild>
                <Button><Plus className="w-4 h-4 mr-1" /> Registrar Limpeza</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Limpeza de Reservatório — Semestral</DialogTitle></DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Data Execução</Label><Input type="date" value={limpDataExec} onChange={e => setLimpDataExec(e.target.value)} /></div>
                    <div><Label>Reservatório</Label><Input value={limpReservatorio} onChange={e => setLimpReservatorio(e.target.value)} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label>Empresa Executora</Label><Input value={limpEmpresa} onChange={e => setLimpEmpresa(e.target.value)} /></div>
                    <div><Label>Responsável</Label><Input value={limpResponsavel} onChange={e => setLimpResponsavel(e.target.value)} /></div>
                  </div>

                  <div className="border rounded-lg p-3 space-y-2">
                    <p className="font-medium text-sm">Checklist de Inspeção ({Object.values(limpChecklist).filter(Boolean).length}/{CHECKLIST_RESERVATORIO.length})</p>
                    {CHECKLIST_RESERVATORIO.map((item, i) => (
                      <label key={i} className="flex items-start gap-2 text-sm cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!limpChecklist[i]}
                          onChange={e => setLimpChecklist(p => ({ ...p, [i]: e.target.checked }))}
                          className="mt-0.5"
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>

                  <div><Label>Observações</Label><Textarea value={limpObs} onChange={e => setLimpObs(e.target.value)} rows={2} /></div>
                  <Button onClick={() => addLimpeza.mutate()}>Salvar Limpeza</Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base">Histórico de Limpezas de Reservatório</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Executor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead></TableHead>
                  </TableRow>

                </TableHeader>
                <TableBody>
                  {limpezas.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma limpeza registrada</TableCell></TableRow>
                  )}
                  {limpezas.map(l => (
                    <TableRow key={l.id}>
                      <TableCell>{l.data_execucao}</TableCell>
                      <TableCell>{l.executor}</TableCell>
                      <TableCell><Badge variant={l.conforme ? "default" : "destructive"}>{l.conforme ? "Conforme" : "NC"}</Badge></TableCell>
                      <TableCell>
                        {l.status_verificacao === 'aprovado' ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> {l.verificado_por}
                          </Badge>
                        ) : (
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] gap-1 px-2" onClick={() => handleVerificar('registros_limpeza', l.id)}>
                            <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-xs max-w-xs truncate">{l.observacoes}</TableCell>

                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" title="Registros não são excluídos — correção via Não Conformidade" onClick={() => corrigirViaNC(navigate, { tabela: "registros_limpeza", registroId: l.id, descricao: `Limpeza de reservatório — data: ${l.data_execucao} — executor: ${l.executor || "—"}` })}><FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ABA PARÂMETROS LEGAIS ── */}
        <TabsContent value="parametros">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="w-5 h-5" /> Parâmetros de Referência </CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Parâmetro</TableHead>
                    <TableHead>Unidade</TableHead>
                    <TableHead>Limite / VMP</TableHead>
                    <TableHead>Referência</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {PARAMETROS_ANALISE.map(p => (
                    <TableRow key={p.param}>
                      <TableCell className="font-medium">{p.param}</TableCell>
                      <TableCell>{p.unidade}</TableCell>
                      <TableCell className="font-mono">{p.limite}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">Parâmetros de controle</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 p-3 bg-muted rounded-lg text-sm space-y-1">
                <p className="font-medium">📋 Frequências recomendadas:</p>
                <ul className="list-disc pl-5 text-muted-foreground space-y-0.5">
                  <li><strong>Cloro Residual e pH</strong>: diário (pontos de uso)</li>
                  <li><strong>Análise microbiológica</strong>: mensal (todos os pontos)</li>
                  <li><strong>Análise físico-química completa</strong>: semestral</li>
                  <li><strong>Limpeza de reservatórios</strong>: semestral (com certificado da empresa executora)</li>
                  <li><strong>Mapa de pontos de coleta</strong>: atualizar anualmente ou após alterações na rede</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
