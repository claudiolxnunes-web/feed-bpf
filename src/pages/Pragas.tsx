import { TIPOS_PRAGA, ACOES, TIPOS_PRODUTO_EXPURGO, METODOS_EXPURGO } from "@/components/pragas/constants";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { corrigirViaNC } from "@/utils/correcaoNC";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Bug, Plus, FileWarning, Flame, AlertTriangle, ShieldCheck, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { MapaIscasSection, ProdutosQuimicosSection } from "@/components/mapa-evolucao/MapaEvolucaoSections";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import { AnexarPlanilhaPop } from "@/components/documentos/AnexarPlanilhaPop";

// Expurgo: tipos de produto e métodos

export default function Pragas() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const qc = useQueryClient();
  const [openPraga, setOpenPraga] = useState(false);
  const [openExpurgo, setOpenExpurgo] = useState(false);

  // --- Controle de Pragas form ---
  const [pragaForm, setPragaForm] = useState({
    local: "",
    tipo_praga: "Roedores",
    acao: "Inspeção rotineira",
    responsavel: "",
    data: new Date().toISOString().split("T")[0],
  });

  // --- Controle de Expurgo form ---
  const [expurgoForm, setExpurgoForm] = useState({
    local: "",
    tipo_produto: "Matéria-prima (grãos)",
    metodo: "Fosfina (PH₃)",
    produto_comercial: "",
    dosagem: "",
    tempo_exposicao_horas: "",
    data_inicio: new Date().toISOString().split("T")[0],
    data_fim: "",
    responsavel_tecnico: "",
    empresa_aplicadora: "",
    art_numero: "",
    temperatura_ambiente: "",
    lote_produto: "",
    vedacao_ok: true,
    placas_sinalizacao: true,
    epi_adequado: true,
    resultado_conforme: true,
    observacoes: "",
  });

  // --- Queries ---
  const { data: pragas = [] } = useQuery({
    queryKey: ["controle_pragas"],
    queryFn: async () => {
      const { data, error } = await supabase.from("controle_pragas").select("*").order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // Expurgo usa a mesma tabela controle_pragas com tipo_praga = 'Expurgo'
  // Mas para não misturar, vamos filtrar
  const registrosPragas = pragas.filter((p: any) => p.tipo_praga !== "Expurgo");
  const registrosExpurgo = pragas.filter((p: any) => p.tipo_praga === "Expurgo");

  const handleVerificar = async (id: string) => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("nome").eq("user_id", user.id).single();
    const verificador = profile?.nome || user.email;

    const { error } = await (supabase.from("controle_pragas" as any) as any)
      .update({
        verificado_por: verificador,
        data_verificacao: new Date().toISOString(),
        status_verificacao: "aprovado",
      })
      .eq("id", id);

    if (error) toast.error("Erro ao verificar");
    else {
      toast.success("Registro verificado!");
      qc.invalidateQueries({ queryKey: ["controle_pragas"] });
    }
  };

  // --- Mutations ---
  const addPraga = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("controle_pragas")
        .insert({ ...pragaForm, user_id: user!.id, empresa_id: empresaAtiva?.id || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controle_pragas"] });
      toast.success("Registro de praga salvo");
      setOpenPraga(false);
      setPragaForm({
        local: "",
        tipo_praga: "Roedores",
        acao: "Inspeção rotineira",
        responsavel: "",
        data: new Date().toISOString().split("T")[0],
      });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const addExpurgo = useMutation({
    mutationFn: async () => {
      if (!expurgoForm.resultado_conforme && !expurgoForm.observacoes) {
        toast.error("Ação corretiva (Observações) é obrigatória para expurgos não conformes!");
        throw new Error("Ação corretiva obrigatória");
      }

      // Salva como tipo_praga=Expurgo, dados extras no campo acao (JSON stringified)
      const extras = {
        tipo_produto: expurgoForm.tipo_produto,
        metodo: expurgoForm.metodo,
        produto_comercial: expurgoForm.produto_comercial,
        dosagem: expurgoForm.dosagem,
        tempo_exposicao_horas: expurgoForm.tempo_exposicao_horas,
        data_fim: expurgoForm.data_fim,
        empresa_aplicadora: expurgoForm.empresa_aplicadora,
        art_numero: expurgoForm.art_numero,
        temperatura_ambiente: expurgoForm.temperatura_ambiente,
        lote_produto: expurgoForm.lote_produto,
        vedacao_ok: expurgoForm.vedacao_ok,
        placas_sinalizacao: expurgoForm.placas_sinalizacao,
        epi_adequado: expurgoForm.epi_adequado,
        resultado_conforme: expurgoForm.resultado_conforme,
      };
      const { data: record, error } = await supabase
        .from("controle_pragas")
        .insert({
          local: expurgoForm.local,
          tipo_praga: "Expurgo",
          acao: JSON.stringify(extras),
          responsavel: expurgoForm.responsavel_tecnico,
          data: expurgoForm.data_inicio,
          user_id: user!.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Automatic NC Flow
      if (!expurgoForm.resultado_conforme) {
        await supabase.from("nao_conformidades").insert({
          user_id: user!.id,
          empresa_id: empresaAtiva?.id || null,
          data: expurgoForm.data_inicio,
          setor: "Manejo de Pragas / Expurgo",
          descricao: `NC identificada no expurgo (${expurgoForm.local}): ${expurgoForm.observacoes}`,
          status: "pendente",
        } as any);
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controle_pragas"] });
      toast.success("Registro de expurgo salvo");
      setOpenExpurgo(false);
    },
    onError: (err: any) => {
      if (err.message !== "Ação corretiva obrigatória") toast.error("Erro ao salvar expurgo");
    },
  });

  const navigate = useNavigate();

  const parseExpurgoExtras = (acao: string) => {
    try {
      return JSON.parse(acao);
    } catch {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Bug}
        title="POP 07 - Controle de Pragas"
        description="Monitoramento integrado de pragas e registros de expurgo"
        orientacaoModuloId="pragas"
        assuntoBaseLegal="controle_pragas"
      />
      <div className="flex justify-end mb-3">
        <AnexarPlanilhaPop popCodigo="POP-07" popNome="Controle Integrado de Pragas" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{registrosPragas.length}</p>
            <p className="text-sm text-muted-foreground">Registros Pragas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-orange-600">{registrosExpurgo.length}</p>
            <p className="text-sm text-muted-foreground">Expurgos Realizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">
              {
                registrosExpurgo.filter((e: any) => {
                  const x = parseExpurgoExtras(e.acao);
                  return x?.resultado_conforme;
                }).length
              }
            </p>
            <p className="text-sm text-muted-foreground">Expurgos Conformes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-destructive">
              {
                registrosExpurgo.filter((e: any) => {
                  const x = parseExpurgoExtras(e.acao);
                  return x && !x.resultado_conforme;
                }).length
              }
            </p>
            <p className="text-sm text-muted-foreground">Não Conformes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="pragas">
        <TabsList>
          <TabsTrigger value="pragas">
            <Bug className="w-4 h-4 mr-1" /> Controle de Pragas
          </TabsTrigger>
          <TabsTrigger value="expurgo">
            <Flame className="w-4 h-4 mr-1" /> Planilha Controle de Expurgo
          </TabsTrigger>
        </TabsList>

        {/* === ABA PRAGAS === */}
        <TabsContent value="pragas">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Registros de Pragas</CardTitle>
              <Dialog open={openPraga} onOpenChange={setOpenPraga}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Novo Registro
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar Ocorrência de Praga</DialogTitle>
                  </DialogHeader>
                  <div className="grid gap-3">
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={pragaForm.data}
                        onChange={(e) => setPragaForm((p) => ({ ...p, data: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Local</Label>
                      <Input
                        value={pragaForm.local}
                        onChange={(e) => setPragaForm((p) => ({ ...p, local: e.target.value }))}
                        placeholder="Ex: Depósito MP, Silo 3"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Praga</Label>
                      <Select
                        value={pragaForm.tipo_praga}
                        onValueChange={(v) => setPragaForm((p) => ({ ...p, tipo_praga: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PRAGA.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Ação Realizada</Label>
                      <Select value={pragaForm.acao} onValueChange={(v) => setPragaForm((p) => ({ ...p, acao: v }))}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ACOES.map((a) => (
                            <SelectItem key={a} value={a}>
                              {a}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Responsável</Label>
                      <Input
                        value={pragaForm.responsavel}
                        onChange={(e) => setPragaForm((p) => ({ ...p, responsavel: e.target.value }))}
                        placeholder="Nome ou empresa"
                      />
                    </div>
                    <Button onClick={() => addPraga.mutate()} disabled={!pragaForm.local}>
                      Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Local</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Responsável</TableHead>
                    <TableHead>Verificação</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {registrosPragas.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Nenhum registro
                      </TableCell>
                    </TableRow>
                  )}
                  {registrosPragas.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data}</TableCell>
                      <TableCell>{r.local}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{r.tipo_praga}</Badge>
                      </TableCell>
                      <TableCell>{r.acao}</TableCell>
                      <TableCell>{r.responsavel}</TableCell>
                      <TableCell>
                        {r.status_verificacao === "aprovado" ? (
                          <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                            <CheckCircle2 className="w-3 h-3" /> {r.verificado_por}
                          </Badge>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 text-[10px] gap-1 px-2"
                            onClick={() => handleVerificar(r.id)}
                          >
                            <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            corrigirViaNC(navigate, {
                              tabela: "controle_pragas",
                              registroId: r.id,
                              descricao: `Controle de pragas — local: ${r.local} — praga: ${r.tipo_praga} — ação: ${r.acao}`,
                            })
                          }
                        >
                          <FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* === ABA EXPURGO === */}
        <TabsContent value="expurgo">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display flex items-center gap-2">
                <Flame className="w-5 h-5" /> Planilha de Controle de Expurgo
              </CardTitle>
              <Dialog open={openExpurgo} onOpenChange={setOpenExpurgo}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Registrar Expurgo
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registro de Operação de Expurgo</DialogTitle>
                  </DialogHeader>
                  <p className="text-xs text-muted-foreground mb-2">
                    — POP 07. Registrar todas as operações de expurgo/fumigação realizadas.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Data Início</Label>
                      <Input
                        type="date"
                        value={expurgoForm.data_inicio}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, data_inicio: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Data Fim</Label>
                      <Input
                        type="date"
                        value={expurgoForm.data_fim}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, data_fim: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Local / Silo / Armazém</Label>
                      <Input
                        value={expurgoForm.local}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, local: e.target.value }))}
                        placeholder="Ex: Silo 2, Armazém MP"
                      />
                    </div>
                    <div>
                      <Label>Tipo de Produto</Label>
                      <Select
                        value={expurgoForm.tipo_produto}
                        onValueChange={(v) => setExpurgoForm((f) => ({ ...f, tipo_produto: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIPOS_PRODUTO_EXPURGO.map((t) => (
                            <SelectItem key={t} value={t}>
                              {t}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Lote do Produto</Label>
                      <Input
                        value={expurgoForm.lote_produto}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, lote_produto: e.target.value }))}
                        placeholder="Lote da MP ou PA"
                      />
                    </div>
                    <div>
                      <Label>Método / Princípio Ativo</Label>
                      <Select
                        value={expurgoForm.metodo}
                        onValueChange={(v) => setExpurgoForm((f) => ({ ...f, metodo: v }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {METODOS_EXPURGO.map((m) => (
                            <SelectItem key={m} value={m}>
                              {m}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Produto Comercial</Label>
                      <Input
                        value={expurgoForm.produto_comercial}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, produto_comercial: e.target.value }))}
                        placeholder="Nome comercial do produto"
                      />
                    </div>
                    <div>
                      <Label>Dosagem</Label>
                      <Input
                        value={expurgoForm.dosagem}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, dosagem: e.target.value }))}
                        placeholder="Ex: 3 pastilhas/ton"
                      />
                    </div>
                    <div>
                      <Label>Tempo Exposição (h)</Label>
                      <Input
                        type="number"
                        value={expurgoForm.tempo_exposicao_horas}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, tempo_exposicao_horas: e.target.value }))}
                        placeholder="72"
                      />
                    </div>
                    <div>
                      <Label>Temperatura Ambiente (°C)</Label>
                      <Input
                        value={expurgoForm.temperatura_ambiente}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, temperatura_ambiente: e.target.value }))}
                        placeholder="25"
                      />
                    </div>
                    <div>
                      <Label>Empresa Aplicadora</Label>
                      <Input
                        value={expurgoForm.empresa_aplicadora}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, empresa_aplicadora: e.target.value }))}
                        placeholder="Razão social"
                      />
                    </div>
                    <div>
                      <Label>Nº ART / Licença</Label>
                      <Input
                        value={expurgoForm.art_numero}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, art_numero: e.target.value }))}
                        placeholder="ART do responsável"
                      />
                    </div>
                    <div className="col-span-2">
                      <Label>Responsável Técnico</Label>
                      <Input
                        value={expurgoForm.responsavel_tecnico}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, responsavel_tecnico: e.target.value }))}
                        placeholder="Nome do RT"
                      />
                    </div>

                    <div className="col-span-1 sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
                      <h4 className="col-span-2 font-semibold text-sm">Checklist de Segurança</h4>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={expurgoForm.vedacao_ok}
                          onCheckedChange={(c) => setExpurgoForm((f) => ({ ...f, vedacao_ok: !!c }))}
                        />
                        Vedação adequada do local
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={expurgoForm.placas_sinalizacao}
                          onCheckedChange={(c) => setExpurgoForm((f) => ({ ...f, placas_sinalizacao: !!c }))}
                        />
                        Placas de sinalização instaladas
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={expurgoForm.epi_adequado}
                          onCheckedChange={(c) => setExpurgoForm((f) => ({ ...f, epi_adequado: !!c }))}
                        />
                        EPI adequado utilizado
                      </label>
                      <label className="flex items-center gap-2 text-sm">
                        <Checkbox
                          checked={expurgoForm.resultado_conforme}
                          onCheckedChange={(c) => setExpurgoForm((f) => ({ ...f, resultado_conforme: !!c }))}
                        />
                        Resultado conforme (sem infestação residual)
                      </label>
                    </div>

                    <div className="col-span-2">
                      <Label>Observações</Label>
                      <Textarea
                        value={expurgoForm.observacoes}
                        onChange={(e) => setExpurgoForm((f) => ({ ...f, observacoes: e.target.value }))}
                        rows={2}
                      />
                    </div>
                    <div className="col-span-2">
                      <Button className="w-full" onClick={() => addExpurgo.mutate()} disabled={!expurgoForm.local}>
                        Salvar Registro de Expurgo
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="overflow-x-auto">
              {registrosExpurgo.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Flame className="w-10 h-10 mx-auto mb-2 opacity-30" />
                  <p>Nenhum registro de expurgo. Clique em "Registrar Expurgo" para adicionar.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data Início</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Tipo Produto</TableHead>
                      <TableHead>Método</TableHead>
                      <TableHead>Dosagem</TableHead>
                      <TableHead>Tempo (h)</TableHead>
                      <TableHead>Empresa</TableHead>
                      <TableHead>Resultado</TableHead>
                      <TableHead>Segurança</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {registrosExpurgo.map((r: any) => {
                      const x = parseExpurgoExtras(r.acao);
                      return (
                        <TableRow key={r.id}>
                          <TableCell className="whitespace-nowrap">{r.data}</TableCell>
                          <TableCell>{r.local}</TableCell>
                          <TableCell>{x?.tipo_produto || "—"}</TableCell>
                          <TableCell>{x?.metodo || "—"}</TableCell>
                          <TableCell>{x?.dosagem || "—"}</TableCell>
                          <TableCell>{x?.tempo_exposicao_horas || "—"}</TableCell>
                          <TableCell className="text-xs">{x?.empresa_aplicadora || "—"}</TableCell>
                          <TableCell>
                            <Badge variant={x?.resultado_conforme ? "default" : "destructive"}>
                              {x?.resultado_conforme ? "Conforme" : "NC"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {x?.vedacao_ok && (
                                <Badge variant="outline" className="text-[10px] px-1">
                                  Vedação
                                </Badge>
                              )}
                              {x?.placas_sinalizacao && (
                                <Badge variant="outline" className="text-[10px] px-1">
                                  Sinaliz.
                                </Badge>
                              )}
                              {x?.epi_adequado && (
                                <Badge variant="outline" className="text-[10px] px-1">
                                  EPI
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="gap-1 text-xs"
                              title="Registros não são excluídos — correção via Não Conformidade"
                              onClick={() =>
                                corrigirViaNC(navigate, {
                                  tabela: "controle_pragas",
                                  registroId: r.id,
                                  descricao: `Expurgo — local: ${r.local} — data: ${r.data}`,
                                })
                              }
                            >
                              <FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}

              {/* Alertas de segurança */}
              {registrosExpurgo.some((r: any) => {
                const x = parseExpurgoExtras(r.acao);
                return x && (!x.vedacao_ok || !x.placas_sinalizacao || !x.epi_adequado);
              }) && (
                <Card className="mt-4 border-yellow-400 bg-yellow-50 dark:bg-yellow-900/10">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-yellow-600" />
                      <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                        Atenção: Há registros de expurgo com itens de segurança não atendidos.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Evolução MAPA: Mapa de Iscas + Cadastro de Produtos Químicos */}
      <div className="mt-6 space-y-4">
        <MapaIscasSection />
        <ProdutosQuimicosSection />
      </div>
    </div>
  );
}
