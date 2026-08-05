import { useState, useEffect } from "react";
import { TemposMisturaSection } from "@/components/mapa-evolucao/MapaEvolucaoSections";
import { ClipboardList, Plus, Loader2, ChevronDown, ChevronUp, Clock, CheckCircle2, AlertTriangle, Factory, FlaskConical, ArrowRightLeft, ShieldAlert, TestTube, Shield, Droplets, FileText, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { AnexarPlanilhaPop } from "@/components/documentos/AnexarPlanilhaPop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import FichaProducaoDigital from "@/components/pcp/FichaProducaoDigital";
import PlanejamentoDoDia from "@/components/pcp/PlanejamentoDoDia";
import SequenciamentoPlanilha from "@/components/pcp/SequenciamentoPlanilha";
import { printElement } from "@/utils/printUtils";
import { toast } from "sonner";

interface OrdemProd {
  id: string;
  numero_ordem: string;
  data_programada: string;
  produto: string;
  formula_nome: string;
  lote_produto: string | null;
  quantidade_programada: string | null;
  unidade: string | null;
  numero_batidas: number | null;
  peso_por_batida: string | null;
  prioridade: string | null;
  status: string | null;
  observacoes: string | null;
  tipo_ordem: string;
  ordem_origem_id: string | null;
  motivo_retrabalho: string | null;
  quantidade_sobra: string | null;
  destino_sobra: string | null;
}

interface FormulaItem {
  id: string;
  ordem_id: string;
  materia_prima: string;
  lote_mp: string | null;
  fornecedor: string | null;
  quantidade_formula: string | null;
  unidade: string | null;
  percentual: string | null;
}

interface Batida {
  id: string;
  ordem_id: string;
  numero_batida: number;
  operador: string | null;
  hora_inicio: string | null;
  hora_fim: string | null;
  tempo_mistura_minutos: number | null;
  temperatura: string | null;
  status: string | null;
  observacoes: string | null;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  programada: { label: "Programada", className: "bg-muted text-muted-foreground" },
  em_producao: { label: "Em Produção", className: "bg-info/20 text-info" },
  concluida: { label: "Concluída", className: "bg-primary/20 text-primary" },
  cancelada: { label: "Cancelada", className: "bg-destructive/20 text-destructive" },
};

const prioridadeConfig: Record<string, { label: string; className: string }> = {
  baixa: { label: "Baixa", className: "bg-muted text-muted-foreground" },
  normal: { label: "Normal", className: "bg-primary/20 text-primary" },
  alta: { label: "Alta", className: "bg-yellow-500/20 text-yellow-700" },
  urgente: { label: "Urgente", className: "bg-destructive/20 text-destructive" },
};

export default function PCP() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [ordens, setOrdens] = useState<OrdemProd[]>([]);
  const [formulaItens, setFormulaItens] = useState<FormulaItem[]>([]);
  const [batidas, setBatidas] = useState<Batida[]>([]);
  const [matrizSensibilidade, setMatrizSensibilidade] = useState<any[]>([]);
  const [formulasDisponiveis, setFormulasDisponiveis] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedOrdem, setExpandedOrdem] = useState<string | null>(null);

  // Ordem form
  const [ordemOpen, setOrdemOpen] = useState(false);
  const [numOrdem, setNumOrdem] = useState("");
  const [produto, setProduto] = useState("");
  const [formulaId, setFormulaId] = useState<string>("");
  const [formulaNome, setFormulaNome] = useState("");
  const [lotePA, setLotePA] = useState("");
  const [qtdProgramada, setQtdProgramada] = useState("");
  const [numBatidas, setNumBatidas] = useState("1");
  const [pesoBatida, setPesoBatida] = useState("");
  const [prioridade, setPrioridade] = useState("normal");
  const [obsOrdem, setObsOrdem] = useState("");
  const [tipoOrdem, setTipoOrdem] = useState("normal");
  const [ordemOrigemId, setOrdemOrigemId] = useState("");
  const [motivoRetrabalho, setMotivoRetrabalho] = useState("");
  const [qtdSobra, setQtdSobra] = useState("");
  const [destinoSobra, setDestinoSobra] = useState("");
  const [tempoMisturaPadrao, setTempoMisturaPadrao] = useState("3");
  const [tipoEmbalagem, setTipoEmbalagem] = useState("Sacos 25kg");
  const [localArmazenamento, setLocalArmazenamento] = useState("Depósito de PA");
  const [ingredientesFormulaSelecionada, setIngredientesFormulaSelecionada] = useState<any[]>([]);


  // Formula item form
  const [itemOpen, setItemOpen] = useState(false);
  const [itemOrdemId, setItemOrdemId] = useState("");
  const [itemMP, setItemMP] = useState("");
  const [itemLoteMP, setItemLoteMP] = useState("");
  const [itemFornecedor, setItemFornecedor] = useState("");
  const [itemQtd, setItemQtd] = useState("");
  const [itemPerc, setItemPerc] = useState("");

  // Batida form
  const [batidaOpen, setBatidaOpen] = useState(false);
  const [batidaOrdemId, setBatidaOrdemId] = useState("");
  const [batidaNum, setBatidaNum] = useState("1");
  const [batidaOperador, setBatidaOperador] = useState("");
  const [batidaInicio, setBatidaInicio] = useState("");
  const [batidaFim, setBatidaFim] = useState("");
  const [batidaTempoMin, setBatidaTempoMin] = useState("");
  const [batidaTemp, setBatidaTemp] = useState("");
  const [batidaObs, setBatidaObs] = useState("");

  // Limpeza entre lotes
  const [limpezaConfirmada, setLimpezaConfirmada] = useState(false);
  const [limpezaTipo, setLimpezaTipo] = useState("vassouragem");
  const [limpezaResponsavel, setLimpezaResponsavel] = useState("");
  const [limpezaHora, setLimpezaHora] = useState("");

  // Carry-over test
  const [carryoverOpen, setCarryoverOpen] = useState(false);
  const [coOrdemId, setCoOrdemId] = useState("");
  const [coData, setCoData] = useState(new Date().toISOString().split("T")[0]);
  const [coResponsavel, setCoResponsavel] = useState("");
  const [coMetodo, setCoMetodo] = useState("visual");
  const [coProdAnterior, setCoProdAnterior] = useState("");
  const [coProdSeguinte, setCoProdSeguinte] = useState("");
  const [coSubstancia, setCoSubstancia] = useState("");
  const [coLimite, setCoLimite] = useState("");
  const [coResultado, setCoResultado] = useState("");
  const [coUnidade, setCoUnidade] = useState("ppm");
  const [coConforme, setCoConforme] = useState(true);
  const [coObs, setCoObs] = useState("");
  const [carryoverRecords, setCarryoverRecords] = useState<any[]>([]);
  const [flushRecords, setFlushRecords] = useState<any[]>([]);

  // Flush order state
  const [flushOpen, setFlushOpen] = useState(false);
  const [flushOrdemId, setFlushOrdemId] = useState("");
  const [flushData, setFlushData] = useState(new Date().toISOString().split("T")[0]);
  const [flushResp, setFlushResp] = useState("");
  const [flushTipo, setFlushTipo] = useState("flushing");
  const [flushMaterialInerte, setFlushMaterialInerte] = useState("");
  const [flushVolume, setFlushVolume] = useState("");
  const [flushDestino, setFlushDestino] = useState("");
  const [flushProdAnterior, setFlushProdAnterior] = useState("");
  const [flushProdSeguinte, setFlushProdSeguinte] = useState("");
  const [flushObs, setFlushObs] = useState("");
  // Checklist de Validação de Limpeza de Linha
  const [flushChecklist, setFlushChecklist] = useState<Record<string, boolean>>({});
  const [flushHoraInicio, setFlushHoraInicio] = useState("");
  const [flushHoraFim, setFlushHoraFim] = useState("");
  const [flushTemperaturaAgua, setFlushTemperaturaAgua] = useState("");
  const [flushInspecaoVisual, setFlushInspecaoVisual] = useState("aprovado");
  const [flushEquipVerificado, setFlushEquipVerificado] = useState<string[]>([]);

  useEffect(() => {
    const batidas = parseInt(numBatidas) || 0;
    const peso = parseFloat(pesoBatida) || 0;
    if (batidas > 0 && peso > 0) {
      const total = (batidas * peso).toFixed(2);
      setQtdProgramada(String(total));
    }
  }, [numBatidas, pesoBatida]);

  const handleFormulaChange = async (v: string) => {
    setFormulaId(v);
    const f = formulasDisponiveis.find((x: any) => x.id === v);
    if (f) {
      setFormulaNome(f.codigo);
      if (!produto) setProduto(f.produto_nome);
      if (f.status !== 'ativa') {
        toast.warning("Atenção: Esta fórmula não está marcada como ATIVA.");
      }
      
      const { data, error } = await supabase
        .from("formula_ingredientes" as any)
        .select("*")
        .eq("formula_id", v)
        .order("ordem");
      
      if (error) {
        toast.error("Erro ao carregar ingredientes da fórmula");
      } else {
        setIngredientesFormulaSelecionada(data || []);
        if (!data || data.length === 0) {
          toast.warning("Esta fórmula não possui ingredientes cadastrados.");
        }
      }
    }
  };

  const fetchData = async () => {

    if (!user) return;
    setLoading(true);
    try {
      const [ordensRes, itensRes, batidasRes, matrizRes, coRes, flushRes, formRes] = await Promise.all([
        (() => { let q = supabase.from("ordens_producao").select("*").order("data_programada", { ascending: false }); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
        (() => { let q = supabase.from("formula_itens").select("*").order("created_at"); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
        (() => { let q = supabase.from("batidas_producao").select("*").order("numero_batida"); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
        (() => { let q = supabase.from("matriz_sensibilidade").select("*").order("produto_anterior"); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
        supabase.from("execucao_pops").select("*").eq("codigo_pop", "POP-CARRYOVER").order("data_execucao", { ascending: false }).limit(100),
        supabase.from("execucao_pops").select("*").eq("codigo_pop", "POP-FLUSH").order("data_execucao", { ascending: false }).limit(100),
        (() => { let q = supabase.from("formulas" as any).select("*").order("status").order("data_versao", { ascending: false }); if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id); return q; })(),
      ]);
      if (ordensRes.data) setOrdens(ordensRes.data as unknown as OrdemProd[]);
      if (itensRes.data) setFormulaItens(itensRes.data as unknown as FormulaItem[]);
      if (batidasRes.data) setBatidas(batidasRes.data as unknown as Batida[]);
      if (matrizRes.data) setMatrizSensibilidade(matrizRes.data);
      if (coRes.data) setCarryoverRecords(coRes.data);
      if (flushRes.data) setFlushRecords(flushRes.data);
      if (formRes.data) setFormulasDisponiveis(formRes.data as any[]);
    } catch (err) {
      console.error("[PCP] fetchData", err);
      toast.error("Erro ao carregar dados do PCP");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [user]);

  const handleAddOrdem = async () => {
    if (!numOrdem || !produto || !user) return;
    
    if (tipoOrdem === 'normal' && !formulaId) {
      toast.error("Selecione uma fórmula para ordens normais.");
      return;
    }

    if (formulaId && ingredientesFormulaSelecionada.length === 0) {
      toast.error("A fórmula selecionada não possui ingredientes.");
      return;
    }

    setSaving(true);
    const { data: newOrdem, error } = await supabase.from("ordens_producao").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      numero_ordem: numOrdem,
      produto,
      formula_id: formulaId || null,
      formula_nome: formulaNome,
      lote_produto: lotePA,
      quantidade_programada: qtdProgramada,
      numero_batidas: parseInt(numBatidas) || 1,
      peso_por_batida: pesoBatida,
      prioridade,
      observacoes: obsOrdem,
      tipo_ordem: tipoOrdem,
      ordem_origem_id: ordemOrigemId || null,
      motivo_retrabalho: motivoRetrabalho || null,
      quantidade_sobra: qtdSobra || null,
      destino_sobra: destinoSobra || null,
      tempo_mistura_padrao_minutos: parseInt(tempoMisturaPadrao) || 3,
      tipo_embalagem: tipoEmbalagem,
      local_armazenamento: localArmazenamento,
      status: "programada"
    } as any).select().single();

    if (error) {
      toast.error("Erro ao salvar ordem: " + error.message);
    } else {
      if (formulaId && ingredientesFormulaSelecionada.length > 0) {
        const totalKgFormula = ingredientesFormulaSelecionada.reduce((acc, curr) => acc + (parseFloat(curr.quantidade_kg) || 0), 0);
        const totalProgramado = parseFloat(qtdProgramada) || 0;

        const itemsToInsert = ingredientesFormulaSelecionada.map(ing => {
          const percentage = totalKgFormula > 0 ? (parseFloat(ing.quantidade_kg) / totalKgFormula) : 0;
          const qtdCalculada = (totalProgramado * percentage).toFixed(3);
          
          return {
            user_id: user.id,
            empresa_id: empresaAtiva?.id || null,
            ordem_id: (newOrdem as any).id,
            materia_prima: ing.materia_prima,
            quantidade_formula: qtdCalculada,
            percentual: (percentage * 100).toFixed(2),
            unidade: "kg"
          };
        });

        const { error: itemsError } = await supabase.from("formula_itens").insert(itemsToInsert as any);
        if (itemsError) {
          toast.warning("Ordem criada, mas erro ao inserir ingredientes: " + itemsError.message);
        }
      }

      toast.success("Ordem criada com parâmetros de BPF!");
      setOrdemOpen(false);
      setNumOrdem(""); setProduto(""); setFormulaId(""); setFormulaNome(""); setLotePA(""); setQtdProgramada("");
      setNumBatidas("1"); setPesoBatida(""); setPrioridade("normal"); setObsOrdem("");
      setTipoOrdem("normal"); setOrdemOrigemId(""); setMotivoRetrabalho(""); setQtdSobra(""); setDestinoSobra("");
      setTempoMisturaPadrao("3"); setTipoEmbalagem("Sacos 25kg"); setLocalArmazenamento("Depósito de PA");
      setIngredientesFormulaSelecionada([]);
      fetchData();
    }
    setSaving(false);
  };


  const handleAddItem = async () => {
    if (!itemMP || !itemOrdemId || !user) return;
    setSaving(true);
    const { error } = await supabase.from("formula_itens").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      ordem_id: itemOrdemId,
      materia_prima: itemMP,
      lote_mp: itemLoteMP,
      fornecedor: itemFornecedor,
      quantidade_formula: itemQtd,
      percentual: itemPerc,
    } as any);
    if (error) toast.error("Erro ao salvar ingrediente");
    else {
      toast.success("Ingrediente adicionado!");
      setItemOpen(false);
      setItemMP(""); setItemLoteMP(""); setItemFornecedor(""); setItemQtd(""); setItemPerc("");
      fetchData();
    }
    setSaving(false);
  };

  const handleAddBatida = async () => {
    if (!batidaOrdemId || !user) return;
    if (!limpezaConfirmada) {
      toast.error("⚠️ É obrigatório confirmar a limpeza entre lotes antes de registrar a batida (IN 15/2009).");
      return;
    }
    setSaving(true);
    const limpezaInfo = `[LIMPEZA ENTRE LOTES] Tipo: ${limpezaTipo === "vassouragem" ? "Vassouragem" : limpezaTipo === "flushing" ? "Flushing" : "Lavagem completa"} | Resp: ${limpezaResponsavel} | Hora: ${limpezaHora}`;
    const obsCompleta = batidaObs ? `${limpezaInfo}\n${batidaObs}` : limpezaInfo;
    const { error } = await supabase.from("batidas_producao").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      ordem_id: batidaOrdemId,
      numero_batida: parseInt(batidaNum) || 1,
      operador: batidaOperador,
      hora_inicio: batidaInicio || null,
      hora_fim: batidaFim || null,
      tempo_mistura_minutos: batidaTempoMin ? parseInt(batidaTempoMin) : null,
      temperatura: batidaTemp,
      status: "concluida",
      observacoes: obsCompleta,
    } as any);
    if (error) toast.error("Erro ao salvar batida");
    else {
      toast.success("Batida registrada com verificação de limpeza!");
      setBatidaOpen(false);
      setBatidaNum("1"); setBatidaOperador(""); setBatidaInicio(""); setBatidaFim("");
      setBatidaTempoMin(""); setBatidaTemp(""); setBatidaObs("");
      setLimpezaConfirmada(false); setLimpezaTipo("vassouragem"); setLimpezaResponsavel(""); setLimpezaHora("");
      fetchData();
    }
    setSaving(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!user) return;
    const { error } = await supabase.from("ordens_producao").update({ status: newStatus } as any).eq("id", id);
    if (error) { toast.error("Erro ao atualizar"); return; }

    // Auto-create rastreabilidade records when order is concluded
    if (newStatus === "concluida") {
      const ordem = ordens.find(o => o.id === id);
      const itens = formulaItens.filter(i => i.ordem_id === id);
      if (ordem && itens.length > 0) {
        const records = itens.map(item => ({
          user_id: user.id, empresa_id: empresaAtiva?.id || null,
          produto: ordem.produto,
          lote_produto: ordem.lote_produto || "",
          materia_prima: item.materia_prima,
          lote_mp: item.lote_mp || "",
          fornecedor: item.fornecedor || "",
        }));
        const { error: rastError } = await supabase.from("rastreabilidade").insert(records as any);
        if (rastError) {
          toast.warning("Ordem concluída, mas erro ao vincular rastreabilidade: " + rastError.message);
        } else {
          toast.success(`Ordem concluída! ${records.length} vínculo(s) de rastreabilidade criados automaticamente.`);
          fetchData();
          return;
        }
      }
    }
    toast.success("Status atualizado!");
    fetchData();
  };

  const openAddItem = (ordemId: string) => { setItemOrdemId(ordemId); setItemOpen(true); };
  const openAddBatida = (ordemId: string) => {
    const existing = batidas.filter(b => b.ordem_id === ordemId);
    setBatidaOrdemId(ordemId);
    setBatidaNum(String(existing.length + 1));
    setBatidaOpen(true);
  };

  const programadas = ordens.filter(o => o.status === "programada").length;
  const emProducao = ordens.filter(o => o.status === "em_producao").length;
  const concluidas = ordens.filter(o => o.status === "concluida").length;

  const openCarryoverTest = (ordemId: string) => {
    const ordem = ordens.find(o => o.id === ordemId);
    setCoOrdemId(ordemId);
    setCoProdSeguinte(ordem?.produto || "");
    // find the previous order
    const sorted = [...ordens].sort((a, b) => a.data_programada.localeCompare(b.data_programada));
    const idx = sorted.findIndex(o => o.id === ordemId);
    if (idx > 0) setCoProdAnterior(sorted[idx - 1].produto);
    setCarryoverOpen(true);
  };

  const handleAddCarryover = async () => {
    if (!user || !coResponsavel) return;
    setSaving(true);
    const ordem = ordens.find(o => o.id === coOrdemId);
    const obs = [
      `[TESTE DE CARRY-OVER — IN 15/2009 / Decreto 12.031/2024]`,
      `Data: ${coData} | Responsável: ${coResponsavel}`,
      `Método: ${coMetodo === "visual" ? "Inspeção Visual" : coMetodo === "swab" ? "Swab de Superfície" : coMetodo === "flushing_analise" ? "Análise do Flushing" : "Análise Laboratorial"}`,
      `Produto anterior: ${coProdAnterior || "—"}`,
      `Produto seguinte: ${coProdSeguinte || "—"}`,
      coSubstancia ? `Substância monitorada: ${coSubstancia}` : "",
      coLimite ? `Limite aceitável: ${coLimite} ${coUnidade}` : "",
      coResultado ? `Resultado encontrado: ${coResultado} ${coUnidade}` : "",
      `Conforme: ${coConforme ? "SIM ✅" : "NÃO ❌"}`,
      coObs ? `Obs: ${coObs}` : "",
      `[ASSINATURA DIGITAL: ${coResponsavel} — ${new Date().toLocaleString("pt-BR")} — MP 2.200-2/2001]`,
    ].filter(Boolean).join("\n");

    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      codigo_pop: "POP-CARRYOVER",
      nome_pop: "Teste de Carry-over",
      executor: coResponsavel,
      setor: ordem?.numero_ordem || "PCP",
      status: coConforme ? "concluido" : "nao_conforme",
      observacoes: obs,
      data_execucao: coData,
      checklist_auditoria_ref: coOrdemId,
    });
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Teste de carry-over registrado!");
      setCarryoverOpen(false);
      setCoResponsavel(""); setCoMetodo("visual"); setCoProdAnterior(""); setCoProdSeguinte("");
      setCoSubstancia(""); setCoLimite(""); setCoResultado(""); setCoUnidade("ppm"); setCoConforme(true); setCoObs("");
      fetchData();
    }
    setSaving(false);
  };

  if (loading) return (
    <>
      <PageHeader icon={ClipboardList} title="PCP — Ordens de Produção" description="Planejamento e controle de produção com fórmulas, batidas e rastreabilidade de lotes"
        orientacaoModuloId="pcp" />
      <div className="flex justify-end mb-3"><AnexarPlanilhaPop popCodigo="POP-05" popNome="PCP / Produção" /></div>
      <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-muted-foreground" /></div>
    </>
  );

  return (
    <>
      <PageHeader icon={ClipboardList} title="PCP — Ordens de Produção" description="Planejamento e controle de produção com fórmulas, batidas e rastreabilidade de lotes" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{ordens.length}</p>
          <p className="text-xs text-muted-foreground">Total ordens</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{programadas}</p>
          <p className="text-xs text-muted-foreground">Programadas</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-info">{emProducao}</p>
          <p className="text-xs text-muted-foreground">Em produção</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{concluidas}</p>
          <p className="text-xs text-muted-foreground">Concluídas</p>
        </CardContent></Card>
      </div>

      {/* ── PLANEJAMENTO DO DIA — PRODUÇÃO GERAL + SEQUENCIAMENTO AUTOMÁTICO ── */}
      <PlanejamentoDoDia
        ordens={ordens.map((o) => ({
          id: o.id,
          numero_ordem: o.numero_ordem,
          produto: o.produto,
          prioridade: o.prioridade,
          status: o.status,
          data_programada: o.data_programada,
          formula_nome: o.formula_nome,
          quantidade_programada: o.quantidade_programada,
        }))}
        matriz={matrizSensibilidade as any}
        onAplicado={fetchData}
      />

      {/* ── PLANILHA DE SEQUENCIAMENTO COMPLETA ── */}
      <SequenciamentoPlanilha
        ordens={ordens as any}
        matriz={matrizSensibilidade as any}
      />

      {/* ── SEQUENCIAMENTO DE PRODUÇÃO — PREVENÇÃO CONTAMINAÇÃO CRUZADA (visão geral) ── */}
      <Card className="mb-6 border-yellow-500/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-yellow-600" />
              Sequenciamento de Produção — Prevenção de Contaminação Cruzada
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              IN 15/2009 — Sequência baseada na Matriz de Sensibilidade. Flushing/lavagem obrigatórios entre produtos com restrição.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant="outline" className="text-[10px] border-yellow-500 text-yellow-700">Vassouragem: sem restrição</Badge>
              <Badge variant="outline" className="text-[10px] border-orange-500 text-orange-700">Flushing: contaminação cruzada</Badge>
              <Badge variant="outline" className="text-[10px] border-destructive text-destructive">Lavagem: origem animal → ruminantes</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {(() => {
            // Get today's and future programmed orders
            const programadas = ordens.filter(o => o.status === "programada" || o.status === "em_producao");
            if (programadas.length < 2 && matrizSensibilidade.length === 0) {
              return (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Cadastre ordens de produção e configure a Matriz de Sensibilidade para visualizar o sequenciamento.
                </p>
              );
            }

            // Check consecutive orders for flushing requirements
            const sequencia: { ordem: OrdemProd; anterior?: OrdemProd; requerFlushing: boolean; tipoLimpeza: string }[] = [];
            const sortedOrdens = [...programadas].sort((a, b) => {
              const seqA = (a as any).sequencia_producao || 0;
              const seqB = (b as any).sequencia_producao || 0;
              if (seqA !== seqB) return seqA - seqB;
              return a.data_programada.localeCompare(b.data_programada);
            });

            sortedOrdens.forEach((ordem, idx) => {
              const anterior = idx > 0 ? sortedOrdens[idx - 1] : undefined;
              let requerFlushing = false;
              let tipoLimpeza = "Vassouragem";

              if (anterior) {
                const match = matrizSensibilidade.find(
                  (m: any) => m.produto_anterior.toLowerCase() === anterior.produto.toLowerCase() &&
                              m.produto_seguinte.toLowerCase() === ordem.produto.toLowerCase()
                );
                if (match) {
                  requerFlushing = match.requer_flushing;
                  tipoLimpeza = requerFlushing ? "Flushing / Lavagem" : "Vassouragem";
                }
              }

              sequencia.push({ ordem, anterior, requerFlushing, tipoLimpeza });
            });

            return (
              <div className="space-y-2">
                <p className="text-[10px] text-muted-foreground mb-2">
                  💡 Defina a sequência para minimizar limpezas entre lotes. Produtos medicados devem ser produzidos por último no dia (IN 04/2007).
                </p>
                {sequencia.map(({ ordem, anterior, requerFlushing, tipoLimpeza }, i) => (
                  <div key={ordem.id} className={`flex items-center gap-3 p-3 rounded-lg border ${requerFlushing ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10" : "border-border"}`}>
                    <div className="flex flex-col items-center gap-1">
                      <div className="text-xs font-bold text-muted-foreground w-6 text-center">{i + 1}</div>
                      <Input
                        className="w-12 h-6 text-center text-xs p-0"
                        type="number"
                        defaultValue={(ordem as any).sequencia_producao || i + 1}
                        onBlur={async (e) => {
                          const val = parseInt(e.target.value) || 0;
                          await supabase.from("ordens_producao").update({ sequencia_producao: val } as any).eq("id", ordem.id);
                          fetchData();
                        }}
                        title="Ordem de sequência"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold">{ordem.numero_ordem}</span>
                        <span className="font-medium text-sm truncate">{ordem.produto}</span>
                        <Badge variant="outline" className="text-[10px]">{ordem.data_programada}</Badge>
                      </div>
                      {anterior && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Após: {anterior.produto} ({anterior.numero_ordem})
                        </p>
                      )}
                    </div>
                    {requerFlushing ? (
                      <div className="flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-yellow-600" />
                        <Badge className="bg-yellow-500/20 text-yellow-700 text-[10px]">{tipoLimpeza}</Badge>
                      </div>
                    ) : anterior ? (
                      <Badge variant="outline" className="text-[10px]">{tipoLimpeza}</Badge>
                    ) : null}
                  </div>
                ))}
                {matrizSensibilidade.length > 0 && (
                  <p className="text-[10px] text-muted-foreground mt-2">
                    {matrizSensibilidade.filter((m: any) => m.requer_flushing).length} combinação(ões) na Matriz de Sensibilidade requerem flushing/lavagem.
                  </p>
                )}

                {/* Procedimentos de Flushing — IN 15/2009 */}
                <div className="mt-4 p-3 rounded-lg border bg-muted/30">
                  <p className="text-xs font-semibold mb-2">📋 Procedimentos de Flushing — IN 15/2009</p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                    <div className="p-2 rounded border bg-background">
                      <p className="font-semibold text-muted-foreground mb-1">Vassouragem</p>
                      <p className="text-muted-foreground">Limpeza mecânica seca. Aceitável entre produtos sem restrição de ingredientes.</p>
                    </div>
                    <div className="p-2 rounded border border-orange-300 bg-orange-50 dark:bg-orange-900/10">
                      <p className="font-semibold text-orange-700 mb-1">Flushing</p>
                      <p className="text-muted-foreground">Passagem de produto inerte (milho/farelo) pela linha. Obrigatório quando Matriz de Sensibilidade indica. Volume: ≥ 50% capacidade do misturador.</p>
                    </div>
                    <div className="p-2 rounded border border-destructive bg-destructive/5">
                      <p className="font-semibold text-destructive mb-1">Lavagem Completa</p>
                      <p className="text-muted-foreground">Desmontagem + lavagem com água + secagem. Obrigatória para transição com ingredientes de origem animal → ruminantes (Prevenção EEB).</p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Ordens de Produção</CardTitle>
          <Dialog open={ordemOpen} onOpenChange={setOrdemOpen}>
            <DialogTrigger asChild>
              <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Nova Ordem</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>Nova Ordem de Produção</DialogTitle></DialogHeader>
              <div className="space-y-3 max-h-[65vh] overflow-y-auto pr-2">
                {/* Tipo de Ordem */}
                <div>
                  <Label>Tipo de Ordem (IN 17/2017)</Label>
                  <Select value={tipoOrdem} onValueChange={setTipoOrdem}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="retrabalho">Retrabalho</SelectItem>
                      <SelectItem value="sobra">Sobra de Produção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {tipoOrdem !== "normal" && (
                  <div className="p-3 rounded-lg border border-yellow-500/30 bg-yellow-500/5 space-y-3">
                    <p className="text-xs font-semibold text-yellow-700">
                      {tipoOrdem === "retrabalho" ? "⚠️ Ordem de Retrabalho — Rastreabilidade preservada" : "⚠️ Sobra de Produção — Rastreabilidade preservada"}
                    </p>
                    <div>
                      <Label>Ordem de Origem</Label>
                      <Select value={ordemOrigemId} onValueChange={setOrdemOrigemId}>
                        <SelectTrigger><SelectValue placeholder="Selecione a ordem original" /></SelectTrigger>
                        <SelectContent>
                          {ordens.filter(o => o.status === "concluida").map(o => (
                            <SelectItem key={o.id} value={o.id}>{o.numero_ordem} — {o.produto}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {tipoOrdem === "retrabalho" && (
                      <div><Label>Motivo do Retrabalho</Label><Input value={motivoRetrabalho} onChange={e => setMotivoRetrabalho(e.target.value)} placeholder="Ex: Fora de especificação" /></div>
                    )}
                    {tipoOrdem === "sobra" && (
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Quantidade da Sobra</Label><Input value={qtdSobra} onChange={e => setQtdSobra(e.target.value)} placeholder="Ex: 200 kg" /></div>
                        <div><Label>Destino da Sobra</Label><Input value={destinoSobra} onChange={e => setDestinoSobra(e.target.value)} placeholder="Ex: Incorporar à OP-005" /></div>
                      </div>
                    )}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nº Ordem</Label>
                    <Input value={numOrdem} onChange={e => setNumOrdem(e.target.value)} placeholder="OP-001" />
                  </div>
                  <div>
                    <Label>Prioridade</Label>
                    <Select value={prioridade} onValueChange={setPrioridade}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="baixa">Baixa</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="alta">Alta</SelectItem>
                        <SelectItem value="urgente">Urgente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label>Produto</Label>
                  <Input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: Ração Bovinos Confinamento 22%" />
                </div>
                <div>
                  <Label>Fórmula Oficial (versionada)</Label>
                  <Select value={formulaId} onValueChange={handleFormulaChange}>

                    <SelectTrigger><SelectValue placeholder="Selecione a fórmula ativa" /></SelectTrigger>
                    <SelectContent>
                      {formulasDisponiveis.length === 0 && (
                        <div className="px-3 py-2 text-xs text-muted-foreground">Nenhuma fórmula cadastrada. Cadastre em "Fórmulas (versionadas)".</div>
                      )}
                      {formulasDisponiveis.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>
                          {f.status === "ativa" ? "✅ " : "📦 "}{f.codigo}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {formulaId && (
                    <p className="text-[10px] text-muted-foreground mt-1 font-mono">Código fixado na OP: {formulaNome}</p>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Lote do PA (Automático)</Label>
                    <Input value={lotePA} onChange={e => setLotePA(e.target.value)} placeholder="PROD-YYYYMMDD-001" />
                  </div>
                  <div>
                    <Label>Tempo Mistura Alvo (min)</Label>
                    <Input type="number" value={tempoMisturaPadrao} onChange={e => setTempoMisturaPadrao(e.target.value)} placeholder="3" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Tipo de Ensaque</Label>
                    <Select value={tipoEmbalagem} onValueChange={setTipoEmbalagem}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Sacos 25kg">Sacos 25kg</SelectItem>
                        <SelectItem value="Sacos 40kg">Sacos 40kg</SelectItem>
                        <SelectItem value="Big Bag 1000kg">Big Bag 1000kg</SelectItem>
                        <SelectItem value="Big Bag 500kg">Big Bag 500kg</SelectItem>
                        <SelectItem value="Granel">Granel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Local Armazenamento</Label>
                    <Input value={localArmazenamento} onChange={e => setLocalArmazenamento(e.target.value)} placeholder="Depósito de PA" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>Nº de Batidas</Label>
                    <Input type="number" value={numBatidas} onChange={e => setNumBatidas(e.target.value)} />
                  </div>
                  <div>
                    <Label>Peso por Batida (kg)</Label>
                    <Input value={pesoBatida} onChange={e => setPesoBatida(e.target.value)} />
                  </div>
                </div>
                <div className="p-2 rounded bg-muted/30">
                  <p className="text-xs text-muted-foreground">Total Programado: <strong>{qtdProgramada} kg</strong></p>
                </div>
                <div>
                  <Label>Observações</Label>
                  <Textarea value={obsOrdem} onChange={e => setObsOrdem(e.target.value)} placeholder="Observações..." />
                </div>
                <Button onClick={handleAddOrdem} className="w-full" disabled={saving || !numOrdem || !produto}>
                  {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Criar Ordem
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {ordens.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma ordem de produção registrada</p>
          ) : (
            <div className="space-y-3">
              {ordens.map((o) => {
                const st = statusConfig[o.status || "programada"];
                const pr = prioridadeConfig[o.prioridade || "normal"];
                const itens = formulaItens.filter(i => i.ordem_id === o.id);
                const bats = batidas.filter(b => b.ordem_id === o.id);
                const isExpanded = expandedOrdem === o.id;

                return (
                  <div key={o.id} className="border rounded-lg overflow-hidden">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                      onClick={() => setExpandedOrdem(isExpanded ? null : o.id)}
                    >
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div>
                          <p className="font-mono text-sm font-bold">{o.numero_ordem}</p>
                          <p className="text-xs text-muted-foreground">{o.data_programada}</p>
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="font-medium text-sm truncate">{o.produto}</p>
                          <p className="text-xs text-muted-foreground truncate">{o.formula_nome} {o.lote_produto && `• Lote: ${o.lote_produto}`}</p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {o.tipo_ordem === "retrabalho" && <Badge className="bg-yellow-500/20 text-yellow-700">Retrabalho</Badge>}
                          {o.tipo_ordem === "sobra" && <Badge className="bg-blue-500/20 text-blue-700">Sobra</Badge>}
                          <Badge className={pr.className}>{pr.label}</Badge>
                          <Badge className={st.className}>{st.label}</Badge>
                          <span className="text-xs text-muted-foreground">{itens.length} ing. • {bats.length}/{o.numero_batidas} bat.</span>
                        </div>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 ml-2 shrink-0" /> : <ChevronDown className="w-4 h-4 ml-2 shrink-0" />}
                    </div>

                    {isExpanded && (
                      <div className="border-t p-4 bg-muted/10">
                        <Tabs defaultValue="formula" className="space-y-3">
                          <div className="flex items-center justify-between">
                            <TabsList>
                              <TabsTrigger value="formula"><FlaskConical className="w-3 h-3 mr-1" /> Fórmula ({itens.length})</TabsTrigger>
                              <TabsTrigger value="batidas"><Factory className="w-3 h-3 mr-1" /> Batidas ({bats.length})</TabsTrigger>
                              <TabsTrigger value="flush"><Droplets className="w-3 h-3 mr-1" /> Flush/Limpeza</TabsTrigger>
                              <TabsTrigger value="carryover"><TestTube className="w-3 h-3 mr-1" /> Carry-over</TabsTrigger>
                            </TabsList>
                            <div className="flex gap-2">
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="h-8 text-xs gap-1 border-primary/50 hover:bg-primary/5"
                                onClick={() => {
                                  // Find the specific component logic for PDF generation
                                  // We can trigger it by mounting the component hidden or using a shared function
                                  // For now, let's open the dialog which is safer as it loads data correctly
                                  document.getElementById(`open-ficha-${o.id}`)?.click();
                                }}
                              >
                                <Printer className="w-3 h-3" /> Imprimir Ficha
                              </Button>
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button id={`open-ficha-${o.id}`} size="sm" variant="default" className="h-8 text-xs gap-1">
                                    <FileText className="w-3 h-3" /> Ficha Digital
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                                  <DialogHeader>
                                    <DialogTitle>Ficha Digital de Produção — {o.numero_ordem}</DialogTitle>
                                  </DialogHeader>
                                  <FichaProducaoDigital ordemId={o.id} />
                                </DialogContent>
                              </Dialog>
                              <Select value={o.status || "programada"} onValueChange={(v) => handleUpdateStatus(o.id, v)}>
                                <SelectTrigger className="w-36 h-8 text-xs"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="programada">Programada</SelectItem>
                                  <SelectItem value="em_producao">Em Produção</SelectItem>
                                  <SelectItem value="concluida">Concluída</SelectItem>
                                  <SelectItem value="cancelada">Cancelada</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <TabsContent value="formula">
                            <div className="space-y-2">
                              {itens.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Matéria-Prima</TableHead>
                                      <TableHead>Lote MP</TableHead>
                                      <TableHead>Fornecedor</TableHead>
                                      <TableHead>Qtd (kg)</TableHead>
                                      <TableHead>%</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {itens.map(item => (
                                      <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.materia_prima}</TableCell>
                                        <TableCell className="font-mono text-xs">{item.lote_mp}</TableCell>
                                        <TableCell className="text-xs">{item.fornecedor}</TableCell>
                                        <TableCell>{item.quantidade_formula}</TableCell>
                                        <TableCell>{item.percentual}%</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-3">Nenhum ingrediente cadastrado</p>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openAddItem(o.id)}>
                                <Plus className="w-3 h-3 mr-1" /> Adicionar Ingrediente
                              </Button>
                            </div>
                          </TabsContent>

                          <TabsContent value="batidas">
                            <div className="space-y-2">
                              {bats.length > 0 ? (
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Batida</TableHead>
                                      <TableHead>Operador</TableHead>
                                      <TableHead>Início</TableHead>
                                      <TableHead>Fim</TableHead>
                                      <TableHead>Tempo (min)</TableHead>
                                      <TableHead>Temp.</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Obs.</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {bats.map(b => (
                                      <TableRow key={b.id}>
                                        <TableCell className="font-bold">#{b.numero_batida}</TableCell>
                                        <TableCell>{b.operador}</TableCell>
                                        <TableCell className="font-mono text-xs">{b.hora_inicio || "—"}</TableCell>
                                        <TableCell className="font-mono text-xs">{b.hora_fim || "—"}</TableCell>
                                        <TableCell>{b.tempo_mistura_minutos ?? "—"}</TableCell>
                                        <TableCell>{b.temperatura || "—"}</TableCell>
                                        <TableCell>
                                          <Badge className={b.status === "concluida" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}>
                                            {b.status === "concluida" ? "Concluída" : "Pendente"}
                                          </Badge>
                                        </TableCell>
                                        <TableCell className="text-xs max-w-[120px] truncate">{b.observacoes}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              ) : (
                                <p className="text-xs text-muted-foreground text-center py-3">Nenhuma batida registrada</p>
                              )}
                              <Button size="sm" variant="outline" onClick={() => openAddBatida(o.id)}>
                                <Plus className="w-3 h-3 mr-1" /> Registrar Batida
                              </Button>
                            </div>
                          </TabsContent>

                          {/* ── FLUSH / LIMPEZA TAB ── */}
                          <TabsContent value="flush">
                            <div className="space-y-3">
                              <div className="p-3 rounded-lg border border-blue-500/20 bg-blue-50 dark:bg-blue-900/10">
                                <p className="text-xs font-semibold text-blue-700 flex items-center gap-1"><Droplets className="w-4 h-4" /> Ordem de Limpeza (Flush) — IN 15/2009</p>
                                <p className="text-[10px] text-muted-foreground mt-1">Registro obrigatório de limpeza entre batidas de fórmulas diferentes para prevenir contaminação cruzada.</p>
                              </div>
                              {(() => {
                                const ordemFlush = flushRecords.filter((f: any) => f.checklist_auditoria_ref === o.id);
                                return ordemFlush.length > 0 ? (
                                  <Table>
                                    <TableHeader><TableRow>
                                      <TableHead>Data</TableHead><TableHead>Executor</TableHead><TableHead>Status</TableHead><TableHead>Detalhes</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                      {ordemFlush.map((f: any) => (
                                        <TableRow key={f.id}>
                                          <TableCell>{f.data_execucao}</TableCell>
                                          <TableCell>{f.executor}</TableCell>
                                          <TableCell>{f.status === "concluido" ? <Badge className="bg-primary/20 text-primary text-[10px]">OK</Badge> : <Badge variant="destructive" className="text-[10px]">NC</Badge>}</TableCell>
                                          <TableCell className="text-xs max-w-[300px] whitespace-pre-line">{f.observacoes}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : <p className="text-xs text-muted-foreground text-center py-3">Nenhuma ordem de flush registrada para esta OP.</p>;
                              })()}
                              <Button size="sm" onClick={() => {
                                setFlushOrdemId(o.id);
                                setFlushProdSeguinte(o.produto);
                                const sorted = [...ordens].sort((a, b) => a.data_programada.localeCompare(b.data_programada));
                                const idx = sorted.findIndex(x => x.id === o.id);
                                if (idx > 0) setFlushProdAnterior(sorted[idx - 1].produto);
                                setFlushOpen(true);
                              }}>
                                <Plus className="w-3 h-3 mr-1" /> Registrar Flush/Limpeza
                              </Button>
                            </div>
                          </TabsContent>

                          {/* ── CARRY-OVER TAB ── */}
                          <TabsContent value="carryover">
                            <div className="space-y-3">
                              <div className="p-3 rounded-lg border border-orange-500/20 bg-orange-50 dark:bg-orange-900/10">
                                <div className="flex items-start gap-2">
                                  <TestTube className="w-5 h-5 text-orange-600 mt-0.5" />
                                  <div>
                                    <p className="text-xs font-semibold">Teste de Carry-over — IN 15/2009 | Decreto 12.031/2024</p>
                                    <p className="text-[10px] text-muted-foreground mt-1">
                                      Limite de arraste: Ionóforos {"<"} 1% da dose terapêutica • Medicados {"<"} 3% da dose terapêutica •
                                      Micotoxinas {"<"} limite da legislação vigente. Teste obrigatório após flushing.
                                    </p>
                                  </div>
                                </div>
                              </div>

                              {/* Limites de referência IN 15/2009 */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                 <div className="p-2 rounded border bg-background text-center">
                                   <p className="text-xs font-bold text-orange-700">Ionóforos</p>
                                   <p className="text-lg font-bold text-orange-600">{"<"} 1%</p>
                                   <p className="text-[10px] text-muted-foreground">da dose terapêutica</p>
                                   <p className="text-[9px] text-muted-foreground mt-1">Monensina, Salinomicina, Lasalocida</p>
                                 </div>
                                 <div className="p-2 rounded border bg-background text-center">
                                   <p className="text-xs font-bold text-destructive">Medicados</p>
                                   <p className="text-lg font-bold text-destructive">{"<"} 3%</p>
                                   <p className="text-[10px] text-muted-foreground">da dose terapêutica</p>
                                   <p className="text-[9px] text-muted-foreground mt-1">Antibióticos, Coccidiostáticos, Promotores</p>
                                 </div>
                                 <div className="p-2 rounded border bg-background text-center">
                                   <p className="text-xs font-bold text-yellow-700">Micotoxinas</p>
                                   <p className="text-lg font-bold text-yellow-600">Limite legal</p>
                                   <p className="text-[10px] text-muted-foreground">Aflatoxina: ≤ 20 ppb</p>
                                   <p className="text-[9px] text-muted-foreground mt-1">DON, Fumonisina, Zearalenona</p>
                                 </div>
                                 <div className="p-2 rounded border-2 border-green-600/40 bg-green-50 dark:bg-green-900/10 text-center">
                                   <p className="text-xs font-bold text-green-700">Ractopamina</p>
                                   <p className="text-lg font-bold text-green-700">ND</p>
                                   <p className="text-[10px] text-muted-foreground">Não Detectado</p>
                                   <p className="text-[9px] text-green-600 mt-1">Programa Ractopamina Free</p>
                                 </div>
                               </div>

                              {/* Testes de carry-over desta ordem */}
                              {(() => {
                                const testsOrdem = carryoverRecords.filter((r: any) => r.checklist_auditoria_ref === o.id);
                                return testsOrdem.length > 0 ? (
                                  <Table>
                                    <TableHeader><TableRow>
                                      <TableHead>Data</TableHead>
                                      <TableHead>Responsável</TableHead>
                                      <TableHead>Método</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead className="max-w-[200px]">Detalhes</TableHead>
                                    </TableRow></TableHeader>
                                    <TableBody>
                                      {testsOrdem.map((r: any) => (
                                        <TableRow key={r.id}>
                                          <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                                          <TableCell>{r.executor}</TableCell>
                                          <TableCell className="text-xs">{
                                            r.observacoes?.includes("Visual") ? "Inspeção Visual" :
                                            r.observacoes?.includes("Swab") ? "Swab" :
                                            r.observacoes?.includes("Flushing") ? "Análise Flushing" : "Laboratorial"
                                          }</TableCell>
                                          <TableCell>
                                            {r.status === "concluido" ?
                                              <Badge className="bg-primary/20 text-primary">Conforme</Badge> :
                                              <Badge variant="destructive">NC</Badge>
                                            }
                                          </TableCell>
                                          <TableCell className="text-xs max-w-[200px] truncate">{(r.observacoes || "").slice(0, 100)}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                ) : (
                                  <p className="text-xs text-muted-foreground text-center py-3">Nenhum teste de carry-over registrado para esta ordem</p>
                                );
                              })()}

                              <Button size="sm" variant="outline" onClick={() => openCarryoverTest(o.id)}>
                                <TestTube className="w-3 h-3 mr-1" /> Registrar Teste de Carry-over
                              </Button>
                            </div>
                          </TabsContent>
                        </Tabs>

                        {o.observacoes && (
                          <div className="mt-3 p-2 rounded bg-muted/50 text-xs text-muted-foreground">
                            <strong>Obs:</strong> {o.observacoes}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog: Adicionar Ingrediente */}
      <Dialog open={itemOpen} onOpenChange={setItemOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Adicionar Ingrediente à Fórmula</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Matéria-Prima</Label>
              <Input value={itemMP} onChange={e => setItemMP(e.target.value)} placeholder="Ex: Milho grão" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Lote da MP</Label>
                <Input value={itemLoteMP} onChange={e => setItemLoteMP(e.target.value)} placeholder="Ex: LMP-2026-045" />
              </div>
              <div>
                <Label>Fornecedor</Label>
                <Input value={itemFornecedor} onChange={e => setItemFornecedor(e.target.value)} placeholder="Nome do fornecedor" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Quantidade (kg)</Label>
                <Input value={itemQtd} onChange={e => setItemQtd(e.target.value)} placeholder="Ex: 500" />
              </div>
              <div>
                <Label>Percentual (%)</Label>
                <Input value={itemPerc} onChange={e => setItemPerc(e.target.value)} placeholder="Ex: 25" />
              </div>
            </div>
            <Button onClick={handleAddItem} className="w-full" disabled={saving || !itemMP}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Registrar Batida */}
      <Dialog open={batidaOpen} onOpenChange={setBatidaOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Batida de Produção</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {/* Limpeza entre lotes - OBRIGATÓRIO */}
            {(() => {
              const ordem = ordens.find(o => o.id === batidaOrdemId);
              const itensOrdem = formulaItens.filter(i => i.ordem_id === batidaOrdemId);
              const contemRestricao = itensOrdem.some(i =>
                ["farinha de carne", "farinha de osso", "farinha de sangue", "sebo", "gordura animal", "farinha de penas"]
                  .some(r => i.materia_prima.toLowerCase().includes(r))
              );
              const produtoRuminante = ordem?.produto?.toLowerCase().includes("bovin") || ordem?.produto?.toLowerCase().includes("ruminante");
              const alertaEEB = contemRestricao && produtoRuminante;

              return (
                <div className={`p-3 rounded-lg border-2 ${limpezaConfirmada ? "border-green-500 bg-green-50 dark:bg-green-900/10" : alertaEEB ? "border-destructive bg-destructive/5" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10"}`}>
                  <p className="text-xs font-semibold mb-2 flex items-center gap-1">
                    <AlertTriangle className={`w-4 h-4 ${alertaEEB ? "text-destructive" : "text-yellow-600"}`} />
                    Verificação de Limpeza entre Lotes — IN 15/2009 / Decreto 12.031/2024
                  </p>
                  {alertaEEB && (
                    <div className="p-2 rounded bg-destructive/10 border border-destructive/30 mb-3">
                      <p className="text-xs text-destructive font-bold">⚠️ ALERTA EEB: Esta ordem contém ingredientes de origem animal com destino a ruminantes!</p>
                      <p className="text-[10px] text-destructive/80">Obrigatório flushing ou lavagem completa da linha. Vassouragem NÃO é suficiente (IN 15/2009).</p>
                    </div>
                  )}
                  {contemRestricao && !produtoRuminante && (
                    <div className="p-2 rounded bg-yellow-500/10 border border-yellow-500/30 mb-3">
                      <p className="text-xs text-yellow-700 font-semibold">🛡️ Ingrediente com restrição de uso detectado na fórmula.</p>
                      <p className="text-[10px] text-muted-foreground">Recomenda-se flushing entre batidas para prevenir contaminação cruzada.</p>
                    </div>
                  )}
                  {/* Alerta Ractopamina Free */}
                  <div className="p-2 rounded bg-green-50 dark:bg-green-900/10 border border-green-500/30 mb-3">
                    <p className="text-xs text-green-700 font-semibold flex items-center gap-1">🛡️ Programa Ractopamina Free</p>
                    <p className="text-[10px] text-muted-foreground">
                      Confirme que nenhum ingrediente desta fórmula contém Ractopamina. 
                      Flushing obrigatório caso a linha tenha processado produto com ractopamina anteriormente.
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Obrigatório confirmar a limpeza da linha antes de iniciar nova batida para prevenir contaminação cruzada.</p>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    <div>
                      <Label className="text-xs">Tipo de Limpeza</Label>
                      <Select value={limpezaTipo} onValueChange={setLimpezaTipo}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="vassouragem" disabled={alertaEEB}>Vassouragem {alertaEEB ? "(insuficiente)" : ""}</SelectItem>
                          <SelectItem value="flushing">Flushing</SelectItem>
                          <SelectItem value="lavagem_completa">Lavagem Completa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Responsável</Label>
                      <Input className="h-8 text-xs" value={limpezaResponsavel} onChange={e => setLimpezaResponsavel(e.target.value)} placeholder="Nome" />
                    </div>
                    <div>
                      <Label className="text-xs">Hora</Label>
                      <Input className="h-8 text-xs" type="time" value={limpezaHora} onChange={e => setLimpezaHora(e.target.value)} />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input type="checkbox" checked={limpezaConfirmada} onChange={e => setLimpezaConfirmada(e.target.checked)} className="h-4 w-4" />
                    <Label className="text-xs font-semibold">Confirmo que a limpeza entre lotes foi realizada</Label>
                    {limpezaConfirmada && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                  </div>
                </div>
              );
            })()}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Nº da Batida</Label>
                <Input type="number" value={batidaNum} onChange={e => setBatidaNum(e.target.value)} min="1" />
              </div>
              <div>
                <Label>Operador</Label>
                <Input value={batidaOperador} onChange={e => setBatidaOperador(e.target.value)} placeholder="Nome do operador" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Hora Início</Label>
                <Input type="time" value={batidaInicio} onChange={e => setBatidaInicio(e.target.value)} />
              </div>
              <div>
                <Label>Hora Fim</Label>
                <Input type="time" value={batidaFim} onChange={e => setBatidaFim(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Tempo Mistura (min)</Label>
                <Input type="number" value={batidaTempoMin} onChange={e => setBatidaTempoMin(e.target.value)} placeholder="Ex: 5" />
              </div>
              <div>
                <Label>Temperatura (°C)</Label>
                <Input value={batidaTemp} onChange={e => setBatidaTemp(e.target.value)} placeholder="Ex: 25" />
              </div>
            </div>
            <div>
              <Label>Observações</Label>
              <Textarea value={batidaObs} onChange={e => setBatidaObs(e.target.value)} placeholder="Anotações da batida..." />
            </div>
            <Button onClick={handleAddBatida} className="w-full" disabled={saving || !limpezaConfirmada}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {!limpezaConfirmada ? "⚠️ Confirme a limpeza para prosseguir" : "Registrar Batida"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Teste de Carry-over */}
      <Dialog open={carryoverOpen} onOpenChange={setCarryoverOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Registrar Teste de Carry-over — IN 15/2009</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="p-3 rounded-lg border border-orange-500/20 bg-orange-50 dark:bg-orange-900/10">
              <p className="text-xs font-semibold flex items-center gap-1"><Shield className="w-4 h-4 text-orange-600" /> Limites de Arraste (IN 15/2009)</p>
              <div className="grid grid-cols-3 gap-2 mt-2 text-[10px]">
                <div className="text-center"><span className="font-bold text-orange-700">Ionóforos</span><br/>{"<"} 1% dose terapêutica</div>
                <div className="text-center"><span className="font-bold text-destructive">Medicados</span><br/>{"<"} 3% dose terapêutica</div>
                <div className="text-center"><span className="font-bold text-yellow-700">Micotoxinas</span><br/>Aflatoxina ≤ 20 ppb</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={coData} onChange={e => setCoData(e.target.value)} /></div>
              <div><Label>Responsável *</Label><Input value={coResponsavel} onChange={e => setCoResponsavel(e.target.value)} placeholder="Nome" /></div>
            </div>
            <div>
              <Label>Método de Análise</Label>
              <Select value={coMetodo} onValueChange={setCoMetodo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="visual">Inspeção Visual</SelectItem>
                  <SelectItem value="swab">Swab de Superfície</SelectItem>
                  <SelectItem value="flushing_analise">Análise do Material de Flushing</SelectItem>
                  <SelectItem value="laboratorial">Análise Laboratorial (HPLC/LC-MS)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Produto Anterior</Label><Input value={coProdAnterior} onChange={e => setCoProdAnterior(e.target.value)} placeholder="Produto da OP anterior" /></div>
              <div><Label>Produto Seguinte</Label><Input value={coProdSeguinte} onChange={e => setCoProdSeguinte(e.target.value)} placeholder="Produto desta OP" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Substância Monitorada</Label><Input value={coSubstancia} onChange={e => setCoSubstancia(e.target.value)} placeholder="Ex: Monensina" /></div>
              <div><Label>Limite Aceitável</Label><Input value={coLimite} onChange={e => setCoLimite(e.target.value)} placeholder="Ex: 1.0" /></div>
              <div><Label>Resultado</Label><Input value={coResultado} onChange={e => setCoResultado(e.target.value)} placeholder="Ex: 0.3" /></div>
            </div>
            <div>
              <Label>Unidade</Label>
              <Select value={coUnidade} onValueChange={setCoUnidade}>
                <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ppm">ppm</SelectItem>
                  <SelectItem value="ppb">ppb</SelectItem>
                  <SelectItem value="mg/kg">mg/kg</SelectItem>
                  <SelectItem value="%">%</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <input type="checkbox" checked={coConforme} onChange={e => setCoConforme(e.target.checked)} className="h-4 w-4" />
              <div>
                <Label className="text-sm font-semibold">Resultado Conforme</Label>
                <p className="text-[10px] text-muted-foreground">Resíduo dentro dos limites aceitáveis da IN 15/2009</p>
              </div>
              {coConforme ? <CheckCircle2 className="w-5 h-5 text-green-600 ml-auto" /> : <AlertTriangle className="w-5 h-5 text-destructive ml-auto" />}
            </div>
            <div><Label>Observações</Label><Textarea value={coObs} onChange={e => setCoObs(e.target.value)} placeholder="Detalhes do teste, volumes de flushing utilizados, etc." /></div>
            <Button onClick={handleAddCarryover} className="w-full" disabled={saving || !coResponsavel}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Registrar Teste de Carry-over
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      {/* ── FLUSH ORDER DIALOG — VALIDAÇÃO DE LIMPEZA DE LINHA ── */}
      <Dialog open={flushOpen} onOpenChange={setFlushOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Droplets className="w-5 h-5 text-blue-600" /> Validação de Limpeza de Linha — IN 15/2009</DialogTitle></DialogHeader>
          <div className="space-y-3 pr-2">
            {/* Informações Básicas */}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Data</Label><Input type="date" value={flushData} onChange={e => setFlushData(e.target.value)} /></div>
              <div><Label>Responsável *</Label><Input value={flushResp} onChange={e => setFlushResp(e.target.value)} placeholder="Nome do executor" /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Hora Início</Label><Input type="time" value={flushHoraInicio} onChange={e => setFlushHoraInicio(e.target.value)} /></div>
              <div><Label>Hora Fim</Label><Input type="time" value={flushHoraFim} onChange={e => setFlushHoraFim(e.target.value)} /></div>
            </div>
            <div>
              <Label>Tipo de Limpeza</Label>
              <Select value={flushTipo} onValueChange={setFlushTipo}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="vassouragem">Vassouragem (limpeza seca)</SelectItem>
                  <SelectItem value="flushing">Flushing (material inerte)</SelectItem>
                  <SelectItem value="lavagem">Lavagem completa (água + detergente)</SelectItem>
                  <SelectItem value="sanitizacao">Sanitização (lavagem + sanitizante)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(flushTipo === "flushing") && (
              <div className="grid grid-cols-3 gap-3">
                <div><Label>Material Inerte</Label><Input value={flushMaterialInerte} onChange={e => setFlushMaterialInerte(e.target.value)} placeholder="Ex: Milho moído" /></div>
                <div><Label>Volume (kg)</Label><Input value={flushVolume} onChange={e => setFlushVolume(e.target.value)} placeholder="≥ 50% capacidade" /></div>
                <div><Label>Destino do Flush</Label><Input value={flushDestino} onChange={e => setFlushDestino(e.target.value)} placeholder="Ex: Descarte" /></div>
              </div>
            )}
            {(flushTipo === "lavagem" || flushTipo === "sanitizacao") && (
              <div>
                <Label>Temperatura da Água (°C)</Label>
                <Input value={flushTemperaturaAgua} onChange={e => setFlushTemperaturaAgua(e.target.value)} placeholder="Ex: 60" />
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Produto Anterior</Label><Input value={flushProdAnterior} onChange={e => setFlushProdAnterior(e.target.value)} /></div>
              <div><Label>Produto Seguinte</Label><Input value={flushProdSeguinte} onChange={e => setFlushProdSeguinte(e.target.value)} /></div>
            </div>

            {/* ── CHECKLIST DE VALIDAÇÃO — IN 15/2009 ── */}
            <div className="p-3 rounded-lg border-2 border-blue-500/30 bg-blue-50 dark:bg-blue-900/10 space-y-2">
              <p className="text-xs font-bold text-blue-700 dark:text-blue-400 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Checklist de Validação de Limpeza — IN 15/2009
              </p>
              <p className="text-[10px] text-muted-foreground">Todos os itens devem ser verificados antes da liberação da linha.</p>
              {[
                { id: "residuo_visivel", label: "Ausência de resíduo visível na linha de produção (misturador, rosca, elevador)" },
                { id: "silo_inspecao", label: "Inspeção dos silos de dosagem: sem acúmulo de produto anterior" },
                { id: "transportador_limpo", label: "Transportadores e roscas sem fim: limpos e sem obstruções" },
                { id: "peneira_limpa", label: "Peneiras e grelhas: sem acúmulo de material" },
                { id: "peletizadora_limpa", label: "Peletizadora/extrusora: sem resíduos da batelada anterior (se aplicável)" },
                { id: "balanca_zerada", label: "Balança de dosagem zerada e calibrada" },
                { id: "produto_anterior_retirado", label: "Todo produto anterior foi retirado e destinado corretamente" },
                { id: "etiquetas_identificadas", label: "Etiquetas e identificações do produto anterior removidas" },
                { id: "area_externa_limpa", label: "Área externa ao misturador: limpa e organizada" },
                { id: "documentacao_anterior", label: "Documentação da batida anterior foi encerrada e arquivada" },
              ].map(item => (
                <div key={item.id} className="flex items-start gap-2 p-1.5 rounded hover:bg-background/50">
                  <input
                    type="checkbox"
                    checked={flushChecklist[item.id] || false}
                    onChange={e => setFlushChecklist(prev => ({ ...prev, [item.id]: e.target.checked }))}
                    className="h-4 w-4 mt-0.5"
                  />
                  <Label className="text-xs leading-tight cursor-pointer">{item.label}</Label>
                </div>
              ))}
            </div>

            {/* Equipamentos Verificados */}
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <p className="text-xs font-semibold">Equipamentos Verificados</p>
              <div className="grid grid-cols-2 gap-1">
                {["Misturador", "Rosca transportadora", "Elevador de canecas", "Silo de dosagem", "Moinho", "Peletizadora", "Resfriador", "Ensacadeira"].map(eq => (
                  <div key={eq} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={flushEquipVerificado.includes(eq)}
                      onChange={e => {
                        if (e.target.checked) setFlushEquipVerificado(prev => [...prev, eq]);
                        else setFlushEquipVerificado(prev => prev.filter(x => x !== eq));
                      }}
                      className="h-3 w-3"
                    />
                    <span className="text-xs">{eq}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Inspeção Visual */}
            <div>
              <Label>Resultado da Inspeção Visual</Label>
              <Select value={flushInspecaoVisual} onValueChange={setFlushInspecaoVisual}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovado">✅ Aprovado — Linha liberada para produção</SelectItem>
                  <SelectItem value="aprovado_restricao">⚠️ Aprovado com restrição</SelectItem>
                  <SelectItem value="reprovado">❌ Reprovado — Requer nova limpeza</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div><Label>Observações</Label><Textarea value={flushObs} onChange={e => setFlushObs(e.target.value)} placeholder="Detalhes adicionais, não conformidades encontradas..." /></div>

            {/* Resumo de validação */}
            {(() => {
              const checkCount = Object.values(flushChecklist).filter(Boolean).length;
              const totalCheck = 10;
              const allChecked = checkCount === totalCheck;
              const aprovado = flushInspecaoVisual === "aprovado" || flushInspecaoVisual === "aprovado_restricao";
              return (
                <div className={`p-3 rounded-lg border-2 ${allChecked && aprovado ? "border-green-500 bg-green-50 dark:bg-green-900/10" : "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10"}`}>
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold">{allChecked && aprovado ? "✅ Validação completa — Linha liberada" : `⚠️ Validação pendente (${checkCount}/${totalCheck} itens)`}</p>
                    {flushEquipVerificado.length > 0 && <Badge variant="outline" className="text-[10px]">{flushEquipVerificado.length} equip. verificados</Badge>}
                  </div>
                </div>
              );
            })()}

            <Button className="w-full" disabled={saving || !flushResp || flushInspecaoVisual === "reprovado"} onClick={async () => {
              if (!user) return;
              setSaving(true);
              const checkCount = Object.values(flushChecklist).filter(Boolean).length;
              const checkedItems = Object.entries(flushChecklist).filter(([, v]) => v).map(([k]) => k);
              const obs = [
                `[VALIDAÇÃO DE LIMPEZA DE LINHA — IN 15/2009]`,
                `Data: ${flushData} | Início: ${flushHoraInicio || "—"} | Fim: ${flushHoraFim || "—"}`,
                `Responsável: ${flushResp}`,
                `Tipo: ${flushTipo === "vassouragem" ? "Vassouragem" : flushTipo === "flushing" ? "Flushing" : flushTipo === "lavagem" ? "Lavagem completa" : "Sanitização"}`,
                flushTipo === "flushing" ? `Material inerte: ${flushMaterialInerte || "—"} | Volume: ${flushVolume || "—"} kg | Destino: ${flushDestino || "—"}` : "",
                (flushTipo === "lavagem" || flushTipo === "sanitizacao") && flushTemperaturaAgua ? `Temperatura da água: ${flushTemperaturaAgua}°C` : "",
                `Produto anterior: ${flushProdAnterior || "—"} → Produto seguinte: ${flushProdSeguinte || "—"}`,
                `Checklist: ${checkCount}/10 itens conformes`,
                `Itens verificados: ${checkedItems.join(", ")}`,
                `Equipamentos: ${flushEquipVerificado.join(", ") || "—"}`,
                `Inspeção visual: ${flushInspecaoVisual === "aprovado" ? "APROVADO" : flushInspecaoVisual === "aprovado_restricao" ? "APROVADO COM RESTRIÇÃO" : "REPROVADO"}`,
                flushObs ? `Obs: ${flushObs}` : "",
              ].filter(Boolean).join("\n");
              const { error } = await supabase.from("execucao_pops").insert({
                user_id: user.id, empresa_id: empresaAtiva?.id || null,
                codigo_pop: "POP-FLUSH",
                nome_pop: "Validação de Limpeza de Linha (Flush)",
                executor: flushResp,
                setor: flushProdAnterior && flushProdSeguinte ? `${flushProdAnterior} → ${flushProdSeguinte}` : "PCP",
                status: flushInspecaoVisual === "aprovado" ? "concluido" : "nao_conforme",
                observacoes: obs,
                data_execucao: flushData,
                checklist_auditoria_ref: flushOrdemId,
              });
              if (error) toast.error("Erro: " + error.message);
              else {
                toast.success("Validação de limpeza de linha registrada!");
                setFlushOpen(false);
                setFlushResp(""); setFlushTipo("flushing"); setFlushMaterialInerte(""); setFlushVolume("");
                setFlushDestino(""); setFlushProdAnterior(""); setFlushProdSeguinte(""); setFlushObs("");
                setFlushChecklist({}); setFlushHoraInicio(""); setFlushHoraFim(""); setFlushTemperaturaAgua("");
                setFlushInspecaoVisual("aprovado"); setFlushEquipVerificado([]);
                fetchData();
              }
              setSaving(false);
            }}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {flushInspecaoVisual === "reprovado" ? "❌ Linha reprovada — refazer limpeza" : "Registrar Validação de Limpeza"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <div className="mt-6"><TemposMisturaSection /></div>
    </>
  );
}
