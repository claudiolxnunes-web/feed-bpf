import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { ETAPAS_RECALL } from "@/components/recall/constants";
import type { RecallStep } from "@/components/recall/constants";
import { useState, useEffect, useRef, useCallback } from "react";
import { Timer, Play, Square, RotateCcw, AlertTriangle, CheckCircle2, ClipboardList, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";





export default function SimulacaoRecall() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();

  const [emExecucao, setEmExecucao] = useState(false);
  const [tempoTotal, setTempoTotal] = useState(0); // seconds
  const [etapas, setEtapas] = useState<RecallStep[]>(
    ETAPAS_RECALL.map(e => ({ ...e, concluido: false }))
  );
  const [produtoSimulado, setProdutoSimulado] = useState("");
  const [loteSimulado, setLoteSimulado] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [finalizado, setFinalizado] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const iniciar = () => {
    if (!produtoSimulado || !loteSimulado) {
      toast({ title: "Preencha o produto e lote simulado", variant: "destructive" });
      return;
    }
    setEmExecucao(true);
    setFinalizado(false);
    setTempoTotal(0);
    setEtapas(ETAPAS_RECALL.map(e => ({ ...e, concluido: false })));
    timerRef.current = setInterval(() => setTempoTotal(t => t + 1), 1000);
  };

  const parar = () => {
    setEmExecucao(false);
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const resetar = () => {
    parar();
    setTempoTotal(0);
    setEtapas(ETAPAS_RECALL.map(e => ({ ...e, concluido: false })));
    setFinalizado(false);
    setObservacoes("");
  };

  const marcarEtapa = (id: string, concluido: boolean) => {
    setEtapas(prev => prev.map(e =>
      e.id === id ? {
        ...e,
        concluido,
        horaFim: concluido ? new Date().toLocaleTimeString("pt-BR") : undefined,
        horaInicio: !e.horaInicio && concluido ? new Date().toLocaleTimeString("pt-BR") : e.horaInicio,
      } : e
    ));
  };

  const concluidas = etapas.filter(e => e.concluido).length;
  const pctConcluido = Math.round((concluidas / etapas.length) * 100);

  const finalizarExercicio = async () => {
    parar();
    setFinalizado(true);

    if (!user) return;

    // Grava na tabela própria de simulações (não infla os indicadores de NC)
    const { error } = await supabase.from("simulacoes_recall" as any).insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      data: new Date().toISOString().slice(0, 10),
      produto: produtoSimulado,
      lote: loteSimulado,
      tempo_total_min: Math.round(tempoTotal / 60),
      etapas: etapas.map(e => ({
        id: e.id,
        label: e.label,
        concluido: e.concluido,
        horaInicio: e.horaInicio || null,
        horaFim: e.horaFim || null,
      })),
      observacoes: observacoes || null,
      responsavel: user.email || "",
      status: "concluida",
    });

    if (error) {
      toast({ title: "Erro ao salvar simulação", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Simulação de Recall registrada!", description: "O exercício foi salvo no registro de simulações para fins de auditoria." });
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  return (
    <>
      <PageHeader icon={Timer} title="POP 09 - Simulação de Recall" description="Exercício anual de recolhimento de produtos — POP 09"
        orientacaoModuloId="simulacao-recall"  assuntoBaseLegal="recolhimento_recall" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Painel lateral */}
        <div className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Configuração</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label>Produto simulado</Label>
                <Input value={produtoSimulado} onChange={e => setProdutoSimulado(e.target.value)} placeholder="Ex: Ração Premium Bovinos" disabled={emExecucao} />
              </div>
              <div>
                <Label>Lote simulado</Label>
                <Input value={loteSimulado} onChange={e => setLoteSimulado(e.target.value)} placeholder="Ex: L2026-001" disabled={emExecucao} />
              </div>
              <div className="flex gap-2">
                {!emExecucao && !finalizado && (
                  <Button onClick={iniciar} className="flex-1"><Play className="w-4 h-4 mr-1" /> Iniciar</Button>
                )}
                {emExecucao && (
                  <Button onClick={parar} variant="destructive" className="flex-1"><Square className="w-4 h-4 mr-1" /> Pausar</Button>
                )}
                <Button onClick={resetar} variant="outline" size="icon"><RotateCcw className="w-4 h-4" /></Button>
              </div>
            </CardContent>
          </Card>

          {/* Timer */}
          <Card className={emExecucao ? "border-primary" : ""}>
            <CardContent className="pt-6 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Tempo Total</p>
              <p className={`text-4xl font-mono font-bold ${emExecucao ? "text-primary animate-pulse" : "text-foreground"}`}>
                {formatTime(tempoTotal)}
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <Badge variant={pctConcluido === 100 ? "default" : "secondary"}>
                  {concluidas}/{etapas.length} etapas
                </Badge>
                {tempoTotal > 0 && tempoTotal <= 7200 && <Badge className="bg-emerald-500">Dentro do prazo</Badge>}
                {tempoTotal > 7200 && <Badge variant="destructive">Acima de 2h</Badge>}
              </div>
            </CardContent>
          </Card>

          {finalizado && (
            <Card className="border-emerald-500 bg-emerald-50/30 dark:bg-emerald-950/10">
              <CardContent className="pt-6 text-center">
                <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
                <p className="font-semibold text-emerald-700 dark:text-emerald-400">Exercício Finalizado!</p>
                <p className="text-xs text-muted-foreground mt-1">Registro salvo para auditoria</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Etapas */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display font-semibold flex items-center gap-2">
              <ClipboardList className="w-5 h-5" />
              Etapas do Exercício de Recall
            </h3>
            {emExecucao && concluidas === etapas.length && (
              <Button onClick={finalizarExercicio} size="sm">
                <Save className="w-4 h-4 mr-1" /> Finalizar e Registrar
              </Button>
            )}
          </div>

          {etapas.map((etapa, i) => (
            <Card key={etapa.id} className={`transition-all ${etapa.concluido ? "border-emerald-300 bg-emerald-50/20 dark:bg-emerald-950/10" : ""}`}>
              <CardContent className="flex items-start gap-3 py-3">
                <div className="mt-0.5">
                  <Checkbox
                    checked={etapa.concluido}
                    onCheckedChange={(checked) => marcarEtapa(etapa.id, !!checked)}
                    disabled={!emExecucao || finalizado}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`font-medium text-sm ${etapa.concluido ? "line-through text-muted-foreground" : ""}`}>
                    {i + 1}. {etapa.label}
                  </p>
                  <p className="text-xs text-muted-foreground">{etapa.descricao}</p>
                  {etapa.horaFim && <p className="text-xs text-emerald-600 mt-0.5">✓ Concluído às {etapa.horaFim}</p>}
                </div>
              </CardContent>
            </Card>
          ))}

          {(emExecucao || finalizado) && (
            <Card className="mt-4">
              <CardHeader><CardTitle className="text-sm">Observações do Exercício</CardTitle></CardHeader>
              <CardContent>
                <Textarea
                  value={observacoes}
                  onChange={e => setObservacoes(e.target.value)}
                  placeholder="Registre dificuldades, pontos de melhoria, tempos de resposta por etapa..."
                  rows={4}
                  disabled={finalizado}
                />
              </CardContent>
            </Card>
          )}

          {/* Orientações */}
          <Card className="bg-muted/30 mt-4">
            <CardContent className="py-4">
              <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-yellow-500" />  Orientações <BaseLegalBadge assunto="recolhimento_recall" /></h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• O exercício de recall deve ser realizado <strong>pelo menos 1 vez ao ano</strong></li>
                <li>• O tempo ideal de resposta é de até <strong>2 horas</strong> para completar todas as etapas</li>
                <li>• O RT deve participar e assinar o relatório final</li>
                <li>• Mantenha este registro arquivado por no mínimo <strong>2 anos</strong> para auditoria</li>
                <li>• A rastreabilidade reversa e direta devem ser demonstráveis em até <strong>4 horas</strong></li>
                <li>• Registros insuficientes podem gerar autuação</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
