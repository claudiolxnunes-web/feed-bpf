import { TRIAGEM_ITENS } from "@/components/treinamentos/constants";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  GraduationCap,
  Plus,
  AlertCircle,
  FileWarning,
  HeartPulse,
  ShieldCheck,
  ClipboardCheck,
  Download,
  FileText,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { corrigirViaNC } from "@/utils/correcaoNC";
import PageHeader from "@/components/PageHeader";
import * as XLSX from "xlsx";

// ── Triagem diária POP-03 items ──

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function Treinamentos() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const qc = useQueryClient();

  // ── Treinamento form ──
  const [openTreino, setOpenTreino] = useState(false);
  const [treinoForm, setTreinoForm] = useState({
    funcionario: "",
    treinamento: "",
    data: new Date().toISOString().split("T")[0],
    instrutor: "",
    validade: "",
  });

  // ── ASO form ──
  const [openAso, setOpenAso] = useState(false);
  const [asoForm, setAsoForm] = useState({
    funcionario: "",
    data: new Date().toISOString().split("T")[0],
    validade: "",
    tipo_exame: "periodico",
    medico: "",
    crm: "",
    apto: true,
    restricoes: "",
  });

  // ── Triagem form ──
  const [openTriagem, setOpenTriagem] = useState(false);
  const [triagemForm, setTriagemForm] = useState({
    funcionario: "",
    data: new Date().toISOString().split("T")[0],
    setor: "",
    responsavel: "",
  });
  const [triagemChecks, setTriagemChecks] = useState<Record<number, boolean | null>>({});

  // ── Queries ──
  const { data: treinamentos = [] } = useQuery({
    queryKey: ["treinamentos", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("treinamentos")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("data", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaAtiva?.id,
  });

  const { data: checklist_asos = [] } = useQuery({
    queryKey: ["saude_manipuladores", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("saude_manipuladores" as any)
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("data_exame", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!empresaAtiva?.id,
  });

  const { data: triagens = [] } = useQuery({
    queryKey: ["triagens_higiene", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("execucao_pops")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .eq("codigo_pop", "TRIAGEM-POP03")
        .order("data_execucao", { ascending: false })
        .limit(100);
      if (error) throw error;
      return data;
    },
    enabled: !!empresaAtiva?.id,
  });

  // ── Mutations ──
  const addTreino = useMutation({
    mutationFn: async () => {
      if (!user || !empresaAtiva?.id) throw new Error("Selecione uma empresa antes de registrar o treinamento.");
      const { error } = await supabase.from("treinamentos").insert({
        ...treinoForm,
        validade: treinoForm.validade || null,
        user_id: user.id,
        empresa_id: empresaAtiva.id,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["treinamentos"] });
      toast.success("Treinamento registrado");
      setOpenTreino(false);
      setTreinoForm({
        funcionario: "",
        treinamento: "",
        data: new Date().toISOString().split("T")[0],
        instrutor: "",
        validade: "",
      });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const addAso = useMutation({
    mutationFn: async () => {
      if (!user || !empresaAtiva?.id) throw new Error("Selecione uma empresa antes de registrar o ASO.");
      const { error } = await supabase.from("saude_manipuladores" as any).insert({
        user_id: user.id,
        empresa_id: empresaAtiva.id,
        funcionario: asoForm.funcionario,
        tipo_exame: asoForm.tipo_exame,
        data_exame: asoForm.data,
        data_validade: asoForm.validade || null,
        medico: asoForm.medico,
        crm: asoForm.crm,
        apto: asoForm.apto,
        restricoes: asoForm.restricoes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["saude_manipuladores"] });
      toast.success("ASO registrado");
      setOpenAso(false);
      setAsoForm({
        funcionario: "",
        data: new Date().toISOString().split("T")[0],
        validade: "",
        tipo_exame: "periodico",
        medico: "",
        crm: "",
        apto: true,
        restricoes: "",
      });
    },
    onError: () => toast.error("Erro ao salvar ASO"),
  });

  const navigate = useNavigate();

  const isAsoVencido = (val: string | null) => (val ? new Date(val) < new Date() : false);
  const isAsoProximo = (val: string | null) => {
    if (!val) return false;
    const d = new Date(val);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 60;
  };

  const addTriagem = useMutation({
    mutationFn: async () => {
      if (!user || !empresaAtiva?.id) throw new Error("Selecione uma empresa antes de registrar a triagem.");
      const checks = TRIAGEM_ITENS.map((item, i) => {
        const v = triagemChecks[i];
        return `${v === true ? "✅" : v === false ? "❌" : "⬜"} ${item}`;
      }).join("\n");
      const naoConformes = TRIAGEM_ITENS.filter((_, i) => triagemChecks[i] === false).length;
      const obs = `[TRIAGEM DIÁRIA POP-03 — IN 04/2007]\nColaborador: ${triagemForm.funcionario}\nSetor: ${triagemForm.setor}\n${checks}\n${naoConformes > 0 ? `⚠️ ${naoConformes} item(ns) não conforme(s)` : "✅ Todos conformes"}`;
      const { error } = await supabase.from("execucao_pops").insert({
        user_id: user.id,
        empresa_id: empresaAtiva.id,
        codigo_pop: "TRIAGEM-POP03",
        nome_pop: "Triagem Diária Higiene e Saúde",
        executor: triagemForm.responsavel,
        setor: triagemForm.setor,
        status: naoConformes > 0 ? "nao_conforme" : "concluido",
        observacoes: obs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["triagens_higiene"] });
      toast.success("Triagem registrada");
      setOpenTriagem(false);
      setTriagemForm({ funcionario: "", data: new Date().toISOString().split("T")[0], setor: "", responsavel: "" });
      setTriagemChecks({});
    },
    onError: () => toast.error("Erro ao salvar triagem"),
  });

  const isVencido = (val: string | null) => (val ? new Date(val) < new Date() : false);
  const isProximo = (val: string | null) => {
    if (!val) return false;
    const d = new Date(val);
    const diff = (d.getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return diff > 0 && diff <= 90;
  };

  const exportCsv = () => {
    let csv = "Tipo,Funcionário,Treinamento/Item,Data,Validade,Status,Observações\n";
    for (const t of treinamentos) {
      const status = isVencido(t.validade) ? "Vencido" : isProximo(t.validade) ? "Próximo" : "Válido";
      csv +=
        [
          escapeCsv("Treinamento"),
          escapeCsv(t.funcionario),
          escapeCsv(t.treinamento),
          t.data,
          t.validade || "",
          status,
          "",
        ]
          .map(escapeCsv)
          .join(",") + "\n";
    }
    for (const a of checklist_asos) {
      csv +=
        [
          escapeCsv("ASO"),
          escapeCsv(a.item),
          "",
          a.auditoria_data || "",
          "",
          a.conforme ? "Apto" : "Inapto",
          escapeCsv(a.observacao),
        ].join(",") + "\n";
    }
    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `POP03_treinamentos_aso_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado!");
  };

  const vencidos = treinamentos.filter((t: any) => isVencido(t.validade)).length;
  const asosVencidos = checklist_asos.filter((a: any) => isAsoVencido(a.data_validade)).length;
  const asosProximos = checklist_asos.filter((a: any) => isAsoProximo(a.data_validade)).length;
  const asosInaptos = checklist_asos.filter((a: any) => a.apto === false).length;

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="POP 03 — Higiene e Saúde Pessoal"
        description="Capacitação, ASOs, Saúde e triagem diária de higiene pessoal"
        orientacaoModuloId="treinamentos"
        assuntoBaseLegal="bpf_geral"
      />

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display">{treinamentos.length}</p>
            <p className="text-xs text-muted-foreground">Treinamentos</p>
          </CardContent>
        </Card>
        <Card className={vencidos > 0 ? "border-destructive/30" : ""}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold font-display ${vencidos > 0 ? "text-destructive" : ""}`}>{vencidos}</p>
            <p className="text-xs text-muted-foreground">Treinos Vencidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display">{checklist_asos.length}</p>
            <p className="text-xs text-muted-foreground">ASOs</p>
          </CardContent>
        </Card>
        <Card className={asosVencidos > 0 ? "border-destructive/30" : ""}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold font-display ${asosVencidos > 0 ? "text-destructive" : ""}`}>
              {asosVencidos}
            </p>
            <p className="text-xs text-muted-foreground">ASOs Vencidos</p>
          </CardContent>
        </Card>
        <Card className={asosProximos > 0 ? "border-yellow-500/30" : ""}>
          <CardContent className="pt-4 text-center">
            <p className={`text-2xl font-bold font-display ${asosProximos > 0 ? "text-yellow-600" : ""}`}>
              {asosProximos}
            </p>
            <p className="text-xs text-muted-foreground">ASOs Próx. Vencer</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-primary">{triagens.length}</p>
            <p className="text-xs text-muted-foreground">Triagens</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="treinamentos">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto h-auto p-1 flex">
          <TabsTrigger value="treinamentos">
            <GraduationCap className="w-4 h-4 mr-1" />
            Treinamentos
          </TabsTrigger>
          <TabsTrigger value="eficacia">
            <ShieldCheck className="w-4 h-4 mr-1" />
            Avaliação Eficácia
          </TabsTrigger>
          <TabsTrigger value="aso">
            <HeartPulse className="w-4 h-4 mr-1" />
            ASO / Saúde
          </TabsTrigger>
          <TabsTrigger value="triagem">
            <ClipboardCheck className="w-4 h-4 mr-1" />
            Triagem Diária
          </TabsTrigger>
          <TabsTrigger value="modelos">
            <FileText className="w-4 h-4 mr-1" />
            Modelos
          </TabsTrigger>
        </TabsList>

        {/* ── TREINAMENTOS ── */}
        <TabsContent value="treinamentos" className="space-y-4">
          <div className="flex justify-between">
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-1" />
              Exportar
            </Button>
            <Dialog open={openTreino} onOpenChange={setOpenTreino}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Novo Treinamento
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Registrar Treinamento</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Funcionário *</Label>
                    <Input
                      value={treinoForm.funcionario}
                      onChange={(e) => setTreinoForm((p) => ({ ...p, funcionario: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Treinamento *</Label>
                    <Input
                      value={treinoForm.treinamento}
                      onChange={(e) => setTreinoForm((p) => ({ ...p, treinamento: e.target.value }))}
                      placeholder="Ex: BPF e Higiene Pessoal"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={treinoForm.data}
                        onChange={(e) => setTreinoForm((p) => ({ ...p, data: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Validade</Label>
                      <Input
                        type="date"
                        value={treinoForm.validade}
                        onChange={(e) => setTreinoForm((p) => ({ ...p, validade: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Instrutor</Label>
                    <Input
                      value={treinoForm.instrutor}
                      onChange={(e) => setTreinoForm((p) => ({ ...p, instrutor: e.target.value }))}
                    />
                  </div>
                  <Button
                    onClick={() => addTreino.mutate()}
                    disabled={!treinoForm.funcionario || !treinoForm.treinamento}
                  >
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {treinamentos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum treinamento registrado</p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead>Treinamento</TableHead>
                      <TableHead>Data</TableHead>
                      <TableHead>Instrutor</TableHead>
                      <TableHead>Validade</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {treinamentos.map((t: any) => (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.funcionario}</TableCell>
                        <TableCell>{t.treinamento}</TableCell>
                        <TableCell className="whitespace-nowrap">{t.data}</TableCell>
                        <TableCell>{t.instrutor}</TableCell>
                        <TableCell className="whitespace-nowrap">{t.validade || "—"}</TableCell>
                        <TableCell>
                          {isVencido(t.validade) ? (
                            <Badge className="bg-destructive text-destructive-foreground gap-1">
                              <AlertCircle className="w-3 h-3" />
                              Vencido
                            </Badge>
                          ) : isProximo(t.validade) ? (
                            <Badge className="bg-yellow-500/20 text-yellow-700 dark:text-yellow-300">Próximo</Badge>
                          ) : (
                            <Badge className="bg-primary/20 text-primary">Válido</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 text-xs"
                            title="Registros não são excluídos — correção via Não Conformidade"
                            onClick={() =>
                              corrigirViaNC(navigate, {
                                tabela: "treinamentos",
                                registroId: t.id,
                                descricao: `Treinamento — ${t.funcionario} — ${t.treinamento} — data: ${t.data}`,
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
              </div>

              {/* Mobile View */}
              <div className="md:hidden space-y-3">
                {treinamentos.map((t: any) => (
                  <Card key={t.id} className="border shadow-sm">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold truncate max-w-[200px]">{t.funcionario}</p>
                          <p className="text-xs text-muted-foreground">{t.treinamento}</p>
                        </div>
                        {isVencido(t.validade) ? (
                          <Badge variant="destructive" className="text-[10px]">
                            Vencido
                          </Badge>
                        ) : isProximo(t.validade) ? (
                          <Badge variant="secondary" className="bg-yellow-500/15 text-yellow-700 text-[10px]">
                            Próximo
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-primary/10 text-primary text-[10px]">
                            Válido
                          </Badge>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t">
                        <div>
                          <p className="font-bold uppercase text-muted-foreground">Data</p>
                          <p>{t.data}</p>
                        </div>
                        <div>
                          <p className="font-bold uppercase text-muted-foreground">Validade</p>
                          <p>{t.validade || "—"}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            corrigirViaNC(navigate, {
                              tabela: "treinamentos",
                              registroId: t.id,
                              descricao: `Treinamento — ${t.funcionario} — ${t.treinamento} — data: ${t.data}`,
                            })
                          }
                        >
                          <FileWarning className="h-4 w-4 text-primary" /> Corrigir via NC
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </Card>
          )}
        </TabsContent>

        {/* ── AVALIAÇÃO DE EFICÁCIA ── */}
        <TabsContent value="eficacia" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ShieldCheck className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Avaliação de Eficácia Pós-Treinamento </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Após cada treinamento, avalie se o conhecimento foi assimilado (30–90 dias). Treinamentos sem
                    avaliação são sinalizados.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {treinamentos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Registre treinamentos primeiro para avaliar a eficácia</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Treinamento</TableHead>
                    <TableHead>Data Treino</TableHead>
                    <TableHead>Prazo Avaliação</TableHead>
                    <TableHead>Status Eficácia</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {treinamentos.map((t: any) => {
                    const dataTreino = new Date(t.data);
                    const prazo90 = new Date(dataTreino);
                    prazo90.setDate(prazo90.getDate() + 90);
                    const hoje = new Date();
                    const dentroPrazo = hoje <= prazo90 && hoje >= dataTreino;
                    const expirado = hoje > prazo90;
                    const temAvaliacao = t.instrutor?.includes("[EFICÁCIA:");
                    return (
                      <TableRow key={t.id}>
                        <TableCell className="font-medium">{t.funcionario}</TableCell>
                        <TableCell>{t.treinamento}</TableCell>
                        <TableCell className="whitespace-nowrap">{t.data}</TableCell>
                        <TableCell className="whitespace-nowrap">{prazo90.toISOString().split("T")[0]}</TableCell>
                        <TableCell>
                          {temAvaliacao ? (
                            <Badge className="bg-primary/20 text-primary">Avaliado ✓</Badge>
                          ) : expirado ? (
                            <Badge className="bg-destructive text-destructive-foreground">Prazo expirado</Badge>
                          ) : dentroPrazo ? (
                            <Badge className="bg-yellow-500/20 text-yellow-700">Pendente</Badge>
                          ) : (
                            <Badge variant="outline">Aguardando prazo</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </Card>
          )}

          <Card className="border-accent/20">
            <CardContent className="pt-4">
              <p className="text-xs text-muted-foreground">
                <strong>Como avaliar:</strong> Ao editar um treinamento, inclua no campo Instrutor a marcação
                <code className="bg-muted px-1 rounded">[EFICÁCIA: Aprovado]</code> ou{" "}
                <code className="bg-muted px-1 rounded">[EFICÁCIA: Reprovado]</code>. Treinamentos reprovados devem ser
                reciclados.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── ASO / SAÚDE OCUPACIONAL ── */}
        <TabsContent value="aso" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openAso} onOpenChange={setOpenAso}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Registrar ASO
                </Button>
              </DialogTrigger>
              <DialogContent className="max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Atestado de Saúde Ocupacional</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div>
                    <Label>Funcionário *</Label>
                    <Input
                      value={asoForm.funcionario}
                      onChange={(e) => setAsoForm((p) => ({ ...p, funcionario: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Tipo de Exame</Label>
                    <Select
                      value={asoForm.tipo_exame}
                      onValueChange={(v) => setAsoForm((p) => ({ ...p, tipo_exame: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admissional">Admissional</SelectItem>
                        <SelectItem value="periodico">Periódico</SelectItem>
                        <SelectItem value="retorno">Retorno ao Trabalho</SelectItem>
                        <SelectItem value="mudanca_funcao">Mudança de Função</SelectItem>
                        <SelectItem value="demissional">Demissional</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Data do Exame</Label>
                      <Input
                        type="date"
                        value={asoForm.data}
                        onChange={(e) => setAsoForm((p) => ({ ...p, data: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Validade</Label>
                      <Input
                        type="date"
                        value={asoForm.validade}
                        onChange={(e) => setAsoForm((p) => ({ ...p, validade: e.target.value }))}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Médico</Label>
                      <Input
                        value={asoForm.medico}
                        onChange={(e) => setAsoForm((p) => ({ ...p, medico: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>CRM</Label>
                      <Input value={asoForm.crm} onChange={(e) => setAsoForm((p) => ({ ...p, crm: e.target.value }))} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Label>Resultado:</Label>
                    <Button
                      size="sm"
                      variant={asoForm.apto ? "default" : "outline"}
                      onClick={() => setAsoForm((p) => ({ ...p, apto: true }))}
                    >
                      <ShieldCheck className="w-4 h-4 mr-1" />
                      Apto
                    </Button>
                    <Button
                      size="sm"
                      variant={!asoForm.apto ? "destructive" : "outline"}
                      onClick={() => setAsoForm((p) => ({ ...p, apto: false }))}
                    >
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Inapto
                    </Button>
                  </div>
                  {!asoForm.apto && (
                    <div>
                      <Label>Restrições</Label>
                      <Textarea
                        value={asoForm.restricoes}
                        onChange={(e) => setAsoForm((p) => ({ ...p, restricoes: e.target.value }))}
                        placeholder="Descreva as restrições..."
                      />
                    </div>
                  )}
                  <Button onClick={() => addAso.mutate()} disabled={!asoForm.funcionario}>
                    Salvar ASO
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-primary/20 bg-primary/5 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <HeartPulse className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Saúde Ocupacional — POP-03 / PCMSO</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Controle de ASOs (PCMSO) e exigências. Todos os colaboradores que manipulam produtos devem possuir
                    ASO válido. <strong>ASOs com validade de 1 ano são alertados automaticamente.</strong>
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Alerts for expiring ASOs */}
          {(asosVencidos > 0 || asosProximos > 0) && (
            <Card className="border-destructive/30 bg-destructive/5 mb-4">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-6 h-6 text-destructive mt-0.5" />
                  <div>
                    <h4 className="font-display font-semibold text-sm text-destructive">⚠️ Alertas de ASO</h4>
                    {asosVencidos > 0 && (
                      <p className="text-xs text-destructive mt-1">
                        🔴 {asosVencidos} ASO(s) VENCIDO(s) — Colaborador(es) não pode(m) atuar até renovação!
                      </p>
                    )}
                    {asosProximos > 0 && (
                      <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                        🟡 {asosProximos} ASO(s) vencendo em até 60 dias — Agende renovação!
                      </p>
                    )}
                    <div className="mt-2 space-y-1">
                      {checklist_asos
                        .filter((a: any) => isAsoVencido(a.data_validade))
                        .map((a: any) => (
                          <div key={a.id} className="text-xs text-destructive">
                            ❌ {a.funcionario} — venceu em {a.data_validade}
                          </div>
                        ))}
                      {checklist_asos
                        .filter((a: any) => isAsoProximo(a.data_validade))
                        .map((a: any) => (
                          <div key={a.id} className="text-xs text-yellow-700 dark:text-yellow-300">
                            ⚠️ {a.funcionario} — vence em {a.data_validade}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {checklist_asos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <HeartPulse className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum ASO registrado</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Data Exame</TableHead>
                    <TableHead>Validade</TableHead>
                    <TableHead>Médico/CRM</TableHead>
                    <TableHead>Resultado</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {checklist_asos.map((a: any) => (
                    <TableRow
                      key={a.id}
                      className={
                        isAsoVencido(a.data_validade)
                          ? "bg-destructive/5"
                          : isAsoProximo(a.data_validade)
                            ? "bg-yellow-500/5"
                            : ""
                      }
                    >
                      <TableCell className="font-medium">{a.funcionario}</TableCell>
                      <TableCell className="text-xs capitalize">{a.tipo_exame?.replace(/_/g, " ")}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{a.data_exame}</TableCell>
                      <TableCell className="whitespace-nowrap text-xs">{a.data_validade || "—"}</TableCell>
                      <TableCell className="text-xs">{a.medico ? `${a.medico} (${a.crm})` : "—"}</TableCell>
                      <TableCell>
                        {a.apto ? (
                          <Badge className="bg-primary/20 text-primary">Apto</Badge>
                        ) : (
                          <Badge className="bg-destructive text-destructive-foreground">Inapto</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {isAsoVencido(a.data_validade) ? (
                          <Badge className="bg-destructive text-destructive-foreground gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Vencido
                          </Badge>
                        ) : isAsoProximo(a.data_validade) ? (
                          <Badge className="bg-yellow-500/20 text-yellow-700">Próximo</Badge>
                        ) : (
                          <Badge className="bg-primary/20 text-primary">Válido</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            corrigirViaNC(navigate, {
                              tabela: "saude_manipuladores",
                              registroId: a.id,
                              descricao: `ASO — ${a.funcionario || a.nome} — validade: ${a.validade}`,
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
            </Card>
          )}
        </TabsContent>

        {/* ── TRIAGEM DIÁRIA ── */}
        <TabsContent value="triagem" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={openTriagem} onOpenChange={setOpenTriagem}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Nova Triagem
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Triagem Diária — Higiene e Saúde (POP-02)</DialogTitle>
                </DialogHeader>
                <div className="grid gap-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Colaborador *</Label>
                      <Input
                        value={triagemForm.funcionario}
                        onChange={(e) => setTriagemForm((p) => ({ ...p, funcionario: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Setor</Label>
                      <Input
                        value={triagemForm.setor}
                        onChange={(e) => setTriagemForm((p) => ({ ...p, setor: e.target.value }))}
                        placeholder="Ex: Produção"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Data</Label>
                      <Input
                        type="date"
                        value={triagemForm.data}
                        onChange={(e) => setTriagemForm((p) => ({ ...p, data: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Responsável pela triagem</Label>
                      <Input
                        value={triagemForm.responsavel}
                        onChange={(e) => setTriagemForm((p) => ({ ...p, responsavel: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5 space-y-2">
                    <p className="text-xs font-semibold text-primary">📋 Checklist de Higiene Pessoal — POP 03</p>
                    <p className="text-xs text-muted-foreground">Marque ✅ (Conforme) ou ❌ (Não Conforme):</p>
                    <div className="space-y-1.5">
                      {TRIAGEM_ITENS.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-1.5 rounded bg-background border text-xs">
                          <div className="flex gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setTriagemChecks((p) => ({ ...p, [idx]: p[idx] === true ? null : true }))}
                              className={`w-7 h-7 rounded text-xs font-bold border ${triagemChecks[idx] === true ? "bg-primary text-primary-foreground border-primary" : "bg-background border-border hover:bg-muted"}`}
                            >
                              ✅
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setTriagemChecks((p) => ({ ...p, [idx]: p[idx] === false ? null : false }))
                              }
                              className={`w-7 h-7 rounded text-xs font-bold border ${triagemChecks[idx] === false ? "bg-destructive text-destructive-foreground border-destructive" : "bg-background border-border hover:bg-muted"}`}
                            >
                              ❌
                            </button>
                          </div>
                          <span className="flex-1">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <Button
                    onClick={() => addTriagem.mutate()}
                    disabled={!triagemForm.funcionario || !triagemForm.responsavel}
                  >
                    Registrar Triagem
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <Card className="border-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10 mb-4">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ClipboardCheck className="w-6 h-6 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Triagem Diária de Higiene e Saúde — POP 03</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação obrigatória antes do início da jornada. Colaboradores com sintomas ou itens não
                    conformes devem ser afastados da área de produção.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {triagens.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhuma triagem registrada</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Executor</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="max-w-[300px]">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {triagens.map((t: any) => (
                    <TableRow key={t.id}>
                      <TableCell className="whitespace-nowrap">{t.data_execucao}</TableCell>
                      <TableCell className="font-medium">{t.executor}</TableCell>
                      <TableCell>{t.setor}</TableCell>
                      <TableCell>
                        {t.status === "concluido" ? (
                          <Badge className="bg-primary/20 text-primary">Conforme</Badge>
                        ) : (
                          <Badge className="bg-destructive text-destructive-foreground">NC</Badge>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[300px] text-xs whitespace-pre-line truncate">
                        {(t.observacoes || "").slice(0, 120)}
                        {(t.observacoes?.length || 0) > 120 ? "…" : ""}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── MODELOS / TEMPLATES ── */}
        <TabsContent value="modelos" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <FileText className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">Modelos de Documentos — Educação Sanitária BPF</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Templates prontos para impressão. Clique para baixar o modelo em Excel.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Cronograma de Treinamentos */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">📅 Cronograma de Treinamentos Anual</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Programa anual de treinamentos BPF com calendário mensal (dias 1–31) para marcação das datas de
                  capacitação.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const wb = XLSX.utils.book_new();
                    const mesesNomes = [
                      "JANEIRO",
                      "FEVEREIRO",
                      "MARÇO",
                      "ABRIL",
                      "MAIO",
                      "JUNHO",
                      "JULHO",
                      "AGOSTO",
                      "SETEMBRO",
                      "OUTUBRO",
                      "NOVEMBRO",
                      "DEZEMBRO",
                    ];
                    const header = ["MESES / TREINAMENTOS BPF", ...Array.from({ length: 31 }, (_, i) => String(i + 1))];
                    const rows = [
                      ["POP 03 — PROGRAMA DE TREINAMENTOS — " + new Date().getFullYear()],
                      [],
                      ["", "DIAS", ...Array.from({ length: 30 }, () => "")],
                      header,
                    ];
                    mesesNomes.forEach((m) => rows.push([m, ...Array(31).fill("")]));
                    rows.push([]);
                    rows.push(["Observações: Os treinamentos de integração são realizados conforme Manual BPF."]);
                    const ws = XLSX.utils.aoa_to_sheet(rows);
                    ws["!cols"] = [{ wch: 40 }, ...Array(31).fill({ wch: 4 })];
                    XLSX.utils.book_append_sheet(wb, ws, "Cronograma");
                    XLSX.writeFile(wb, `POP03_Cronograma_Treinamentos_${new Date().getFullYear()}.xlsx`);
                    toast.success("Cronograma de treinamentos gerado!");
                  }}
                >
                  <Download className="w-4 h-4 mr-1" /> Baixar Template
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Presença */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">📝 Lista de Presença — Treinamentos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Educação Sanitária BPF — Lista de presença com campos para data, assunto, palestrante, nome, função e
                  assinatura.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const wb = XLSX.utils.book_new();
                    const rows = [
                      ["POP 03 — EDUCAÇÃO SANITÁRIA BPF"],
                      ["LISTA DE PRESENÇA EM TREINAMENTOS MINISTRADOS"],
                      [],
                      ["Data:", "", "", "Duração:"],
                      ["Assunto:"],
                      ["Material utilizado:"],
                      ["Palestrante:"],
                      [],
                      ["NOME", "FUNÇÃO", "ASSINATURA"],
                      ...Array(20).fill(["", "", ""]),
                      [],
                      ["Palestrante: ___________________________"],
                      ["Responsável Técnico: ___________________________"],
                      ["Responsável Empresa: ___________________________"],
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(rows);
                    ws["!cols"] = [{ wch: 35 }, { wch: 20 }, { wch: 30 }];
                    XLSX.utils.book_append_sheet(wb, ws, "Lista de Presença");
                    XLSX.writeFile(wb, "POP03_Lista_Presenca_Treinamento.xlsx");
                    toast.success("Lista de presença gerada!");
                  }}
                >
                  <Download className="w-4 h-4 mr-1" /> Baixar Template
                </Button>
              </CardContent>
            </Card>

            {/* Lista de Balanças */}
            <Card className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">⚖️ Lista de Balanças — POP 06</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Relação de balanças e instrumentos de pesagem com marca, capacidade e identificação para controle de
                  calibração.
                </p>
                <Button
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    const wb = XLSX.utils.book_new();
                    const rows = [
                      ["LISTA DE BALANÇAS — POP 06"],
                      [],
                      ["Nº", "DESCRIÇÃO DO EQUIPAMENTO", "MARCA", "CAPACIDADE", "IDENTIFICAÇÃO", "LOCALIZAÇÃO"],
                      [
                        "1",
                        "Balança com célula digital para MP em sacos",
                        "Ramuza",
                        "300 kg",
                        "BALANÇA 01",
                        "Pesagem MP",
                      ],
                      [
                        "2",
                        "Balança caçamba com célula digital para MP a granel, rosca de descarga motor 2 CV",
                        "Digitron",
                        "2.000 kg",
                        "BALANÇA 02",
                        "Pesagem MP",
                      ],
                      ["3", "Balança com célula digital para MP em sacos", "Ramuza", "300 kg", "BALANÇA 03", "Ensaque"],
                      ["4", "Balança com célula digital para MP em sacos", "Ramuza", "300 kg", "BALANÇA 04", "Ensaque"],
                      ...Array(10).fill(["", "", "", "", "", ""]),
                    ];
                    const ws = XLSX.utils.aoa_to_sheet(rows);
                    ws["!cols"] = [{ wch: 5 }, { wch: 55 }, { wch: 15 }, { wch: 15 }, { wch: 18 }, { wch: 18 }];
                    XLSX.utils.book_append_sheet(wb, ws, "Balanças");
                    XLSX.writeFile(wb, "Lista_Balancas_POP06.xlsx");
                    toast.success("Lista de balanças gerada!");
                  }}
                >
                  <Download className="w-4 h-4 mr-1" /> Baixar Template
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
