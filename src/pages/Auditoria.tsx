import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ClipboardCheck,
  CheckCircle2,
  XCircle,
  Link2,
  FileText,
  Plus,
  Loader2,
  Lock,
  History,
  AlertTriangle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import { CHECKLIST_PADRAO } from "@/store/feedbpf-store";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface AuditoriaRow {
  id: string;
  empresa_id: string | null;
  user_id: string;
  data_auditoria: string;
  auditor: string;
  escopo: string | null;
  status: "em_andamento" | "concluido";
  observacoes: string | null;
  created_at: string;
}

interface RespostaRow {
  id: string;
  item: string;
  conforme: boolean | null;
  observacao: string | null;
}

export default function Auditoria() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const navigate = useNavigate();

  const [auditorias, setAuditorias] = useState<AuditoriaRow[]>([]);
  const [ativa, setAtiva] = useState<AuditoriaRow | null>(null);
  const [respostas, setRespostas] = useState<Record<string, RespostaRow>>({});
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState<string | null>(null);

  // Nova auditoria (dialog)
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaData, setNovaData] = useState(new Date().toISOString().split("T")[0]);
  const [novoAuditor, setNovoAuditor] = useState("");
  const [novoEscopo, setNovoEscopo] = useState("");
  const [novasObs, setNovasObs] = useState("");
  const [criando, setCriando] = useState(false);

  const concluida = ativa?.status === "concluido";

  const fetchAuditorias = async () => {
    if (!user) return;
    let q = supabase.from("auditorias_bpf").select("*").order("data_auditoria", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await q;
    if (error) toast.error("Erro ao carregar auditorias: " + error.message);
    setAuditorias((data ?? []) as AuditoriaRow[]);
    setLoading(false);
  };

  const fetchRespostas = async (auditoriaId: string) => {
    const { data, error } = await supabase
      .from("checklist_items")
      .select("id, item, conforme, observacao")
      .eq("auditoria_id", auditoriaId);
    if (error) {
      toast.error("Erro ao carregar respostas: " + error.message);
      return;
    }
    const map: Record<string, RespostaRow> = {};
    (data ?? []).forEach((r) => {
      const base = CHECKLIST_PADRAO.find((c) => c.item === r.item);
      if (base) map[base.id] = r as RespostaRow;
    });
    setRespostas(map);
  };

  useEffect(() => {
    fetchAuditorias();
  }, [user, empresaAtiva]);

  useEffect(() => {
    if (ativa) fetchRespostas(ativa.id);
    else setRespostas({});
  }, [ativa?.id]);

  const criarAuditoria = async () => {
    if (!user || !novoAuditor.trim()) return;
    setCriando(true);
    const { data, error } = await supabase
      .from("auditorias_bpf")
      .insert({
        user_id: user.id,
        empresa_id: empresaAtiva?.id ?? null,
        data_auditoria: novaData,
        auditor: novoAuditor.trim(),
        escopo: novoEscopo.trim() || null,
        observacoes: novasObs.trim() || null,
      })
      .select()
      .single();
    setCriando(false);
    if (error) {
      toast.error("Erro ao criar auditoria: " + error.message);
      return;
    }
    toast.success("Auditoria criada. Responda o checklist abaixo.");
    setNovaOpen(false);
    setNovoAuditor("");
    setNovoEscopo("");
    setNovasObs("");
    await fetchAuditorias();
    setAtiva(data as AuditoriaRow);
  };

  const salvarResposta = async (itemId: string, patch: { conforme?: boolean | null; observacao?: string }) => {
    if (!user || !ativa || concluida) return;
    const base = CHECKLIST_PADRAO.find((c) => c.id === itemId);
    if (!base) return;
    const atual = respostas[itemId];
    const conforme = patch.conforme !== undefined ? patch.conforme : (atual?.conforme ?? null);
    const observacao = patch.observacao !== undefined ? patch.observacao : (atual?.observacao ?? "");

    // Atualização otimista
    setRespostas((prev) => ({
      ...prev,
      [itemId]: {
        id: atual?.id ?? "",
        item: base.item,
        conforme,
        observacao,
      },
    }));
    setSalvando(itemId);

    if (atual?.id) {
      const { error } = await supabase.from("checklist_items").update({ conforme, observacao }).eq("id", atual.id);
      if (error) toast.error("Erro ao salvar resposta: " + error.message);
    } else {
      const { data, error } = await supabase
        .from("checklist_items")
        .insert({
          user_id: user.id,
          empresa_id: empresaAtiva?.id ?? null,
          auditoria_id: ativa.id,
          auditoria_data: ativa.data_auditoria,
          area: base.area,
          item: base.item,
          conforme,
          observacao,
        })
        .select("id, item, conforme, observacao")
        .single();
      if (error) {
        toast.error("Erro ao salvar resposta: " + error.message);
      } else if (data) {
        setRespostas((prev) => ({ ...prev, [itemId]: data as RespostaRow }));
      }
    }
    setSalvando(null);
  };

  const toggleItem = (itemId: string, value: boolean) => {
    const atual = respostas[itemId];
    const novo = atual?.conforme === value ? null : value;
    salvarResposta(itemId, { conforme: novo });
  };

  const concluirAuditoria = async () => {
    if (!ativa) return;
    const { error } = await supabase.from("auditorias_bpf").update({ status: "concluido" }).eq("id", ativa.id);
    if (error) {
      toast.error("Erro ao concluir auditoria: " + error.message);
      return;
    }
    toast.success("Auditoria concluída e travada.");
    setAtiva({ ...ativa, status: "concluido" });
    fetchAuditorias();
  };

  const abrirNC = (itemId: string) => {
    const base = CHECKLIST_PADRAO.find((c) => c.id === itemId);
    const resp = respostas[itemId];
    if (!base) return;
    navigate("/nao-conformidades", {
      state: {
        prefillNC: {
          descricao: `[Auditoria BPF ${ativa?.data_auditoria}] ${base.area} — ${base.item}${resp?.observacao ? `\nObservação da auditoria: ${resp.observacao}` : ""}`,
        },
      },
    });
  };

  const totais = useMemo(() => {
    const total = CHECKLIST_PADRAO.length;
    const conformes = CHECKLIST_PADRAO.filter((c) => respostas[c.id]?.conforme === true).length;
    const naoConformes = CHECKLIST_PADRAO.filter((c) => respostas[c.id]?.conforme === false).length;
    const pendentes = total - conformes - naoConformes;
    return { total, conformes, naoConformes, pendentes, pct: total > 0 ? Math.round((conformes / total) * 100) : 0 };
  }, [respostas]);

  const areas = [...new Set(CHECKLIST_PADRAO.map((i) => i.area))];
  const itensNC = CHECKLIST_PADRAO.filter((c) => respostas[c.id]?.conforme === false);

  return (
    <>
      <PageHeader
        icon={ClipboardCheck}
        title="Auditoria BPF"
        description="Checklist de auditoria e categorização de risco"
        orientacaoModuloId="auditoria"
        assuntoBaseLegal="autocontrole"
      />

      <div className="mb-4 flex flex-wrap gap-2">
        <Badge variant="outline" className="text-xs border-primary/40 text-primary">
          <FileText className="w-3 h-3 mr-1" />
          {totais.total} itens de verificação
        </Badge>
        <Badge variant="outline" className="text-xs border-destructive/40 text-destructive">
          Inclui categorização de risco
        </Badge>
      </div>

      {/* Barra de ações */}
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Dialog open={novaOpen} onOpenChange={setNovaOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" /> Nova auditoria
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="font-display">Nova Auditoria BPF</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-1">
                <Label>Data da auditoria *</Label>
                <Input type="date" value={novaData} onChange={(e) => setNovaData(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label>Auditor responsável *</Label>
                <Input
                  value={novoAuditor}
                  onChange={(e) => setNovoAuditor(e.target.value)}
                  placeholder="Nome completo do auditor"
                />
              </div>
              <div className="space-y-1">
                <Label>Escopo</Label>
                <Input
                  value={novoEscopo}
                  onChange={(e) => setNovoEscopo(e.target.value)}
                  placeholder="Ex.: Auditoria interna anual — planta completa"
                />
              </div>
              <div className="space-y-1">
                <Label>Observações</Label>
                <Textarea
                  value={novasObs}
                  onChange={(e) => setNovasObs(e.target.value)}
                  placeholder="Observações gerais (opcional)"
                />
              </div>
              <Button onClick={criarAuditoria} disabled={criando || !novoAuditor.trim()} className="w-full">
                {criando && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Criar auditoria
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {ativa && !concluida && (
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2 border-primary/40 text-primary">
                <Lock className="w-4 h-4" /> Concluir auditoria
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Concluir auditoria?</AlertDialogTitle>
                <AlertDialogDescription>
                  Após concluir, as respostas ficam travadas e não poderão ser editadas ou excluídas. Correções
                  posteriores devem ser feitas via Não Conformidade.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Voltar</AlertDialogCancel>
                <AlertDialogAction onClick={concluirAuditoria}>Concluir e travar</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        )}

        {ativa && concluida && (
          <Badge className="bg-primary text-primary-foreground gap-1">
            <Lock className="w-3 h-3" /> Auditoria concluída — registro travado
          </Badge>
        )}
      </div>

      {/* Histórico de auditorias */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="font-display text-sm md:text-base flex items-center gap-2">
            <History className="w-4 h-4" /> Auditorias anteriores
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-4">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : auditorias.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Nenhuma auditoria registrada. Clique em "Nova auditoria" para começar.
            </p>
          ) : (
            <div className="space-y-2">
              {auditorias.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setAtiva(a)}
                  className={cn(
                    "w-full flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 p-3 rounded-lg border text-left transition-colors",
                    ativa?.id === a.id ? "border-primary bg-primary/5" : "border-border hover:bg-muted/50",
                  )}
                >
                  <span className="text-sm font-medium">
                    {new Date(a.data_auditoria + "T00:00:00").toLocaleDateString("pt-BR")}
                  </span>
                  <span className="text-sm text-muted-foreground flex-1">
                    {a.auditor}
                    {a.escopo ? ` — ${a.escopo}` : ""}
                  </span>
                  <Badge variant={a.status === "concluido" ? "default" : "outline"} className="text-xs w-fit">
                    {a.status === "concluido" ? "Concluída" : "Em andamento"}
                  </Badge>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {!ativa ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground text-sm">
            Selecione uma auditoria na lista acima ou crie uma nova para responder o checklist.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Resumo */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-display text-primary">{totais.pct}%</p>
                <p className="text-xs text-muted-foreground">Conformidade</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-display text-green-600">{totais.conformes}</p>
                <p className="text-xs text-muted-foreground">Conformes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-display text-destructive">{totais.naoConformes}</p>
                <p className="text-xs text-muted-foreground">Não conformes</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-display text-muted-foreground">{totais.pendentes}</p>
                <p className="text-xs text-muted-foreground">Pendentes</p>
              </CardContent>
            </Card>
          </div>

          <Progress value={totais.pct} className="h-3 mb-6" />

          {/* Oferta de NC para itens não conformes */}
          {itensNC.length > 0 && (
            <Card className="mb-6 border-destructive/30">
              <CardHeader>
                <CardTitle className="font-display text-sm md:text-base flex items-center gap-2 text-destructive">
                  <AlertTriangle className="w-4 h-4" /> Itens não conformes ({itensNC.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {itensNC.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border border-destructive/20 bg-destructive/5"
                  >
                    <p className="text-sm flex-1">{item.item}</p>
                    <Button size="sm" variant="outline" className="gap-1 w-fit" onClick={() => abrirNC(item.id)}>
                      <Plus className="w-3 h-3" /> Abrir Não Conformidade
                    </Button>
                  </div>
                ))}
                <p className="text-xs text-muted-foreground">
                  O botão abre a tela de Não Conformidades já preenchida — o registro só é criado se você salvar lá.
                </p>
              </CardContent>
            </Card>
          )}

          {/* Checklist por área/tema do decreto */}
          {areas.map((area) => (
            <Card key={area} className="mb-4">
              <CardHeader>
                <CardTitle className="font-display text-sm md:text-base">{area}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {CHECKLIST_PADRAO.filter((i) => i.area === area).map((item) => {
                  const resp = respostas[item.id];
                  const conforme = resp?.conforme ?? null;
                  return (
                    <div
                      key={item.id}
                      className={cn(
                        "flex flex-col sm:flex-row sm:items-center gap-2 p-3 rounded-lg border",
                        conforme === false
                          ? "border-destructive/30 bg-destructive/5"
                          : conforme === true
                            ? "border-primary/30 bg-primary/5"
                            : "border-border",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium flex items-center gap-2">
                          {item.item}
                          {salvando === item.id && <Loader2 className="w-3 h-3 animate-spin text-muted-foreground" />}
                        </p>
                        {item.popVinculado && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="inline-flex items-center gap-1 text-xs text-primary mt-1 cursor-help">
                                <Link2 className="w-3 h-3" />
                                {item.popVinculado}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>POP vinculado: {item.popVinculado}</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Button
                          size="sm"
                          variant={conforme === true ? "default" : "outline"}
                          disabled={concluida}
                          onClick={() => toggleItem(item.id, true)}
                          className="gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" /> C
                        </Button>
                        <Button
                          size="sm"
                          variant={conforme === false ? "destructive" : "outline"}
                          disabled={concluida}
                          onClick={() => toggleItem(item.id, false)}
                          className="gap-1"
                        >
                          <XCircle className="w-4 h-4" /> NC
                        </Button>
                        <Input
                          placeholder="Observação"
                          value={resp?.observacao ?? ""}
                          disabled={concluida}
                          onChange={(e) =>
                            setRespostas((prev) => ({
                              ...prev,
                              [item.id]: { id: resp?.id ?? "", item: item.item, conforme, observacao: e.target.value },
                            }))
                          }
                          onBlur={(e) => salvarResposta(item.id, { observacao: e.target.value })}
                          className="w-32 md:w-40 text-xs"
                        />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </>
      )}
    </>
  );
}
