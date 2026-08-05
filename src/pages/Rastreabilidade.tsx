import { useState, useEffect, useRef, useMemo } from "react";
import { AmostrasRetencaoSection } from "@/components/mapa-evolucao/MapaEvolucaoSections";
import { Search, Plus, Loader2, Package, AlertTriangle, Truck, ShieldAlert, Timer, Play, Square, RotateCcw, ArrowUpDown, CheckCircle2, XCircle, Save, Download, FlaskConical, Bell, BarChart3, GitBranch, ChevronRight, AlertCircle, Printer, History, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import { AnexarPlanilhaPop } from "@/components/documentos/AnexarPlanilhaPop";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { printElement } from "@/utils/printUtils";


interface RastreabilidadeRow {
  id: string;
  produto: string;
  lote_produto: string | null;
  materia_prima: string;
  lote_mp: string | null;
  fornecedor: string | null;
  cliente_destino: string | null;
  local_entrega: string | null;
  data_venda: string | null;
  nota_fiscal: string | null;
  quantidade_vendida: string | null;
  recall_ativo: boolean | null;
  recall_motivo: string | null;
  recall_data: string | null;
  recall_status: string | null;
}

interface TesteResult {
  lote: string;
  produto: string;
  montante: { 
    materia_prima: string; 
    lote_mp: string; 
    fornecedor: string; 
    nota_fiscal?: string | null;
    nota_fiscal_url?: string | null;
    laudo_url?: string | null;
  }[];
  jusante: { cliente: string; local: string; nf: string; data_venda: string }[];
  tempoSegundos: number;
}

export default function Rastreabilidade() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [registros, setRegistros] = useState<RastreabilidadeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busca, setBusca] = useState("");
  const [open, setOpen] = useState(false);
  const [recallOpen, setRecallOpen] = useState(false);
  const [contraprovaColetada, setContraprovaColetada] = useState(false);
  const [contraprovaLocal, setContraprovaLocal] = useState("");
  const [contraprovaValidade, setContraprovaValidade] = useState("");
  const [vendaOpen, setVendaOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Form fields
  const [produto, setProduto] = useState("");
  const [loteProduto, setLoteProduto] = useState("");
  const [materiaPrima, setMateriaPrima] = useState("");
  const [loteMP, setLoteMP] = useState("");
  const [fornecedor, setFornecedor] = useState("");
  const [clienteDestino, setClienteDestino] = useState("");
  const [localEntrega, setLocalEntrega] = useState("");
  const [dataVenda, setDataVenda] = useState("");
  const [notaFiscal, setNotaFiscal] = useState("");
  const [quantidadeVendida, setQuantidadeVendida] = useState("");
  const [especieDestino, setEspecieDestino] = useState("");
  const [contemOrigemAnimal, setContemOrigemAnimal] = useState(false);
  const [tipoOrigemAnimal, setTipoOrigemAnimal] = useState("");
  const [sifDipoa, setSifDipoa] = useState("");
  const [recallMotivo, setRecallMotivo] = useState("");
  const [recallData, setRecallData] = useState("");
  const [recallStatus, setRecallStatus] = useState("iniciado");

  // Recall Simulado
  const [simOpen, setSimOpen] = useState(false);
  const [simRunning, setSimRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [simStep, setSimStep] = useState(0);
  const [simResults, setSimResults] = useState<{ step: string; time: number; ok: boolean }[]>([]);
  const simInterval = useRef<NodeJS.Timeout | null>(null);

  // Venda fields
  const [vendaCliente, setVendaCliente] = useState("");
  const [vendaLocal, setVendaLocal] = useState("");
  const [vendaData, setVendaData] = useState("");
  const [vendaNF, setVendaNF] = useState("");
  const [vendaQtd, setVendaQtd] = useState("");

  // Teste de Rastreabilidade
  const [testeOpen, setTesteOpen] = useState(false);
  const [testeLote, setTesteLote] = useState("");
  const [testeRunning, setTesteRunning] = useState(false);
  const [testeTime, setTesteTime] = useState(0);
  const [certData, setCertData] = useState<any>(null);
  const certRef = useRef<HTMLDivElement>(null);
  const mapaRef = useRef<HTMLDivElement>(null);

  const [testeResult, setTesteResult] = useState<TesteResult | null>(null);
  const [testeSaving, setTesteSaving] = useState(false);
  const [testeObs, setTesteObs] = useState("");
  const [testesHistorico, setTestesHistorico] = useState<any[]>([]);
  const testeInterval = useRef<NodeJS.Timeout | null>(null);

  // Process validation fields
  const [tempoMistura, setTempoMistura] = useState("");
  const [testeHomogeneidade, setTesteHomogeneidade] = useState("");

  // ──── MELHORIA 1: Dados do Recebimento e PCP ────
  const [recebimentos, setRecebimentos] = useState<any[]>([]);
  const [ordensProducao, setOrdensProducao] = useState<any[]>([]);

  // ──── MELHORIA 3: Árvore Visual ────
  const [arvoreOpen, setArvoreOpen] = useState(false);
  const [arvoreLote, setArvoreLote] = useState("");

  // Lab analyses
  const [analisesLab, setAnalisesLab] = useState<any[]>([]);

  // ──── MELHORIA 4: Contraprovas vencidas ────
  const [contraprovosRecebimento, setContraprovosRecebimento] = useState<any[]>([]);
  const [contraprovosProducao, setContraprovosProducao] = useState<any[]>([]);

  // ──── NOVOS: Rastreabilidade reversa por cliente + Certificado por lote ────
  const [clienteReversoOpen, setClienteReversoOpen] = useState(false);
  const [clienteReversoSelecionado, setClienteReversoSelecionado] = useState("");
  const [clienteReversoDias, setClienteReversoDias] = useState("180");
  const [certLoteOpen, setCertLoteOpen] = useState(false);
  const [certLote, setCertLote] = useState("");

  const resetForm = () => {
    setProduto(""); setLoteProduto(""); setMateriaPrima(""); setLoteMP("");
    setFornecedor(""); setClienteDestino(""); setLocalEntrega("");
    setDataVenda(""); setNotaFiscal(""); setQuantidadeVendida("");
    setEspecieDestino(""); setContemOrigemAnimal(false); setTipoOrigemAnimal("");
    setTempoMistura(""); setTesteHomogeneidade("");
    setContraprovaColetada(false); setContraprovaLocal(""); setContraprovaValidade("");
    setSifDipoa("");
  };

  const handlePrintMapa = () => {
    if (!testeResult) return;
    printElement("mapa-rastreabilidade-print", {
      title: `Mapa_Rastreabilidade_${testeResult.lote}`,
      landscape: true
    });
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from("rastreabilidade").select("*").order("created_at", { ascending: false });
      if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      setRegistros((data as unknown as RastreabilidadeRow[]) || []);
    } catch (err) {
      console.error("[Rastreabilidade] fetchData", err);
      toast.error("Erro ao carregar dados de rastreabilidade");
      setRegistros([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalisesLab = async () => {
    if (!user) return;
    let q = supabase.from("analises_laboratorio").select("*").order("data_analise", { ascending: false }).limit(200);
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    if (data) setAnalisesLab(data);
  };

  const fetchTestesHistorico = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("testes_rastreabilidade")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setTestesHistorico(data);
  };

  const fetchRecebimentos = async () => {
    if (!user) return;
    let q = supabase.from("recebimento_mp").select("*").order("data", { ascending: false }).limit(500);
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    if (data) setRecebimentos(data);
  };

  const fetchOrdensProducao = async () => {
    if (!user) return;
    let q = supabase.from("ordens_producao").select("*").order("data_programada", { ascending: false }).limit(500);
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    if (data) setOrdensProducao(data);
  };

  // MELHORIA 4: Fetch contraprovas
  const fetchContraprovas = async () => {
    if (!user) return;
    const { data: recData } = await supabase
      .from("recebimento_mp")
      .select("*")
      .eq("contraprova_retida", true)
      .limit(500);
    if (recData) setContraprovosRecebimento(recData);

    const { data: prodData } = await supabase
      .from("producao")
      .select("*")
      .eq("contraprova_retida", true)
      .limit(500);
    if (prodData) setContraprovosProducao(prodData);
  };

  useEffect(() => {
    fetchData();
    fetchTestesHistorico();
    fetchAnalisesLab();
    fetchRecebimentos();
    fetchOrdensProducao();
    fetchContraprovas();
  }, [user, empresaAtiva]);

  // ──── MELHORIA 4: Cálculo de contraprovas vencidas ────
  const contraprovosVencidas = useMemo(() => {
    const hoje = new Date();
    const vencidas: { tipo: string; produto: string; lote: string; local: string; validade: string }[] = [];

    contraprovosRecebimento.forEach((r: any) => {
      if (r.contraprova_validade) {
        const val = new Date(r.contraprova_validade);
        if (val <= hoje) {
          vencidas.push({
            tipo: "Recebimento MP",
            produto: r.materia_prima,
            lote: r.lote || "—",
            local: r.contraprova_local || "—",
            validade: r.contraprova_validade,
          });
        }
      }
    });

    contraprovosProducao.forEach((p: any) => {
      if (p.contraprova_validade) {
        const val = new Date(p.contraprova_validade);
        if (val <= hoje) {
          vencidas.push({
            tipo: "Produção PA",
            produto: p.produto,
            lote: p.lote || "—",
            local: p.contraprova_local || "—",
            validade: p.contraprova_validade,
          });
        }
      }
    });

    return vencidas;
  }, [contraprovosRecebimento, contraprovosProducao]);

  const contraprovosProximasVencer = useMemo(() => {
    const hoje = new Date();
    const limite = new Date();
    limite.setDate(limite.getDate() + 30);
    const proximas: { tipo: string; produto: string; lote: string; local: string; validade: string; diasRestantes: number }[] = [];

    const checkItem = (item: any, tipo: string, produtoField: string) => {
      if (item.contraprova_validade) {
        const val = new Date(item.contraprova_validade);
        if (val > hoje && val <= limite) {
          const dias = Math.ceil((val.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
          proximas.push({
            tipo,
            produto: item[produtoField],
            lote: item.lote || "—",
            local: item.contraprova_local || "—",
            validade: item.contraprova_validade,
            diasRestantes: dias,
          });
        }
      }
    };

    contraprovosRecebimento.forEach((r: any) => checkItem(r, "Recebimento MP", "materia_prima"));
    contraprovosProducao.forEach((p: any) => checkItem(p, "Produção PA", "produto"));

    return proximas.sort((a, b) => a.diasRestantes - b.diasRestantes);
  }, [contraprovosRecebimento, contraprovosProducao]);

  // ──── MELHORIA 5: Dashboard de Cobertura ────
  const cobertura = useMemo(() => {
    const lotesPA = Array.from(new Set(registros.map(r => r.lote_produto).filter(Boolean)));
    const total = lotesPA.length;
    if (total === 0) return { total: 0, completos: 0, parciais: 0, semDestino: 0, pctCompleto: 0 };

    let completos = 0;
    let parciais = 0;
    let semDestino = 0;

    lotesPA.forEach(lote => {
      const recs = registros.filter(r => r.lote_produto === lote);
      const temMP = recs.some(r => r.materia_prima && r.lote_mp);
      const temVenda = recs.some(r => r.cliente_destino);
      if (temMP && temVenda) completos++;
      else if (temMP) semDestino++;
      else parciais++;
    });

    return { total, completos, parciais, semDestino, pctCompleto: Math.round((completos / total) * 100) };
  }, [registros]);

  // ──── MELHORIA 1: Listas únicas de Recebimento e PCP ────
  const recebimentoOptions = useMemo(() => {
    const unique = new Map<string, { mp: string; lote: string; fornecedor: string }>();
    recebimentos.forEach((r: any) => {
      const key = `${r.materia_prima}|${r.lote || ""}`;
      if (!unique.has(key)) {
        unique.set(key, { mp: r.materia_prima, lote: r.lote || "", fornecedor: r.fornecedor || "" });
      }
    });
    return Array.from(unique.values());
  }, [recebimentos]);

  const ordensOptions = useMemo(() => {
    return ordensProducao.map((o: any) => ({
      produto: o.produto,
      lote: o.lote_produto || "",
      numero: o.numero_ordem,
    }));
  }, [ordensProducao]);

  // ──── Teste de Rastreabilidade ────
  const startTesteRastreabilidade = () => {
    if (!testeLote.trim()) { toast.error("Informe o lote para testar."); return; }
    setTesteRunning(true);
    setTesteTime(0);
    setTesteResult(null);
    testeInterval.current = setInterval(() => setTesteTime(t => t + 1), 1000);

    const lote = testeLote.trim();
    const lotRecords = registros.filter(r => r.lote_produto === lote);

    if (lotRecords.length === 0) {
      clearInterval(testeInterval.current!);
      setTesteRunning(false);
      toast.error(`Lote "${lote}" não encontrado na rastreabilidade.`);
      return;
    }

    const produtoNome = lotRecords[0].produto;
    const montante = lotRecords.map(r => {
      // Tentar encontrar o recebimento correspondente para pegar a NF e Laudo
      const rec = recebimentos.find(rc => rc.materia_prima === r.materia_prima && rc.lote === r.lote_mp);
      return {
        materia_prima: r.materia_prima,
        lote_mp: r.lote_mp || "—",
        fornecedor: r.fornecedor || "—",
        nota_fiscal: rec?.numero_nota_fiscal || null,
        nota_fiscal_url: rec?.nota_fiscal_url || null,
        laudo_url: rec?.certificado_analise_url || null, // Usamos o certificado_analise_url como laudo principal
      };
    });
    const jusante = lotRecords
      .filter(r => r.cliente_destino)
      .map(r => ({
        cliente: r.cliente_destino || "—",
        local: r.local_entrega || "—",
        nf: r.nota_fiscal || "—",
        data_venda: r.data_venda || "—",
      }));

    const uniqueMontante = montante.filter((m, i, arr) =>
      arr.findIndex(x => x.materia_prima === m.materia_prima && x.lote_mp === m.lote_mp) === i
    );
    const uniqueJusante = jusante.filter((j, i, arr) =>
      arr.findIndex(x => x.cliente === j.cliente && x.nf === j.nf) === i
    );

    setTimeout(() => {
      if (testeInterval.current) clearInterval(testeInterval.current);
      setTesteRunning(false);
      const elapsed = 2;
      setTesteTime(elapsed);
      setTesteResult({ lote, produto: produtoNome, montante: uniqueMontante, jusante: uniqueJusante, tempoSegundos: elapsed });
      setCertData({ 
        lote, 
        produto: produtoNome, 
        montante: uniqueMontante, 
        jusante: uniqueJusante, 
        data_teste: new Date().toLocaleDateString('pt-BR') 
      });
      toast.success(`Rastreabilidade completa do lote ${lote} em ${elapsed}s!`);
    }, 2000);
  };

  const salvarTesteResultado = async () => {
    if (!user || !testeResult) return;
    setTesteSaving(true);
    const { error } = await supabase.from("testes_rastreabilidade").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      lote_testado: testeResult.lote,
      produto: testeResult.produto,
      direcao: "completo",
      tempo_segundos: testeResult.tempoSegundos,
      montante_encontrado: testeResult.montante.length > 0,
      jusante_encontrado: testeResult.jusante.length > 0,
      materias_primas_rastreadas: testeResult.montante.length,
      destinos_rastreados: testeResult.jusante.length,
      resultado: testeResult.montante.length > 0 && testeResult.jusante.length > 0 ? "aprovado" : "parcial",
      observacoes: testeObs,
      detalhes_json: { montante: testeResult.montante, jusante: testeResult.jusante },
    } as any);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Resultado do teste salvo!"); fetchTestesHistorico(); }
    setTesteSaving(false);
  };

  const handleAdd = async () => {
    if (!produto || !materiaPrima || !user) return;
    setSaving(true);
    const { error } = await supabase.from("rastreabilidade").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
      produto,
      lote_produto: loteProduto,
      materia_prima: materiaPrima,
      lote_mp: loteMP,
      fornecedor,
      cliente_destino: clienteDestino,
      local_entrega: localEntrega,
      data_venda: dataVenda || null,
      nota_fiscal: notaFiscal,
      quantidade_vendida: quantidadeVendida,
      especie_destino: especieDestino || null,
      contem_origem_animal: contemOrigemAnimal,
      tipo_origem_animal: tipoOrigemAnimal || null,
      sif_dipoa: sifDipoa || null,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Registro salvo!"); setOpen(false); resetForm(); fetchData(); }
    setSaving(false);
  };

  const handleRecall = async () => {
    if (!selectedId || !recallMotivo) return;
    setSaving(true);
    const { error } = await supabase.from("rastreabilidade").update({
      recall_ativo: true,
      recall_motivo: recallMotivo,
      recall_data: recallData || new Date().toISOString().split("T")[0],
      recall_status: recallStatus,
    } as any).eq("id", selectedId);
    if (error) toast.error("Erro ao registrar recall");
    else { toast.success("Recall registrado!"); setRecallOpen(false); setRecallMotivo(""); setRecallData(""); setRecallStatus("iniciado"); setSelectedId(null); fetchData(); }
    setSaving(false);
  };

  const handleVenda = async () => {
    if (!selectedId || !vendaCliente) return;
    setSaving(true);
    const selectedRec = registros.find(r => r.id === selectedId);
    const lotePA = selectedRec?.lote_produto;
    let query = supabase.from("rastreabilidade").update({
      cliente_destino: vendaCliente, local_entrega: vendaLocal, data_venda: vendaData || null, nota_fiscal: vendaNF, quantidade_vendida: vendaQtd,
    } as any);
    if (lotePA) query = query.eq("lote_produto", lotePA);
    else query = query.eq("id", selectedId);
    const { error } = await query;
    if (error) toast.error("Erro ao registrar venda");
    else { toast.success(lotePA ? `Venda registrada para todo o lote ${lotePA}!` : "Venda registrada!"); setVendaOpen(false); setVendaCliente(""); setVendaLocal(""); setVendaData(""); setVendaNF(""); setVendaQtd(""); setSelectedId(null); fetchData(); }
    setSaving(false);
  };

  const openVenda = (id: string) => {
    const rec = registros.find(r => r.id === id);
    setSelectedId(id);
    setVendaCliente(rec?.cliente_destino || "");
    setVendaLocal(rec?.local_entrega || "");
    setVendaData(rec?.data_venda || "");
    setVendaNF(rec?.nota_fiscal || "");
    setVendaQtd(rec?.quantidade_vendida || "");
    setVendaOpen(true);
  };

  const filtered = registros.filter((d) =>
    [d.produto, d.lote_produto, d.materia_prima, d.lote_mp, d.fornecedor, d.cliente_destino, d.nota_fiscal]
      .some((v) => v?.toLowerCase().includes(busca.toLowerCase()))
  );

  const uniquePA = new Set(registros.map(r => r.lote_produto).filter(Boolean));
  const comVenda = registros.filter(r => r.cliente_destino);
  const semVenda = registros.filter(r => !r.cliente_destino);
  const comRecall = registros.filter(r => r.recall_ativo);

  const RECALL_SIM_STEPS = [
    "1. Identificar lote afetado",
    "2. Localizar destino/cliente",
    "3. Verificar quantidade distribuída",
    "4. Contatar clientes/distribuidores",
    "5. Registrar recall no sistema",
  ];

  const startSimulation = () => { setSimRunning(true); setSimTime(0); setSimStep(0); setSimResults([]); simInterval.current = setInterval(() => setSimTime(t => t + 1), 1000); };
  const advanceStep = () => {
    const currentStep = simStep;
    setSimResults(prev => [...prev, { step: RECALL_SIM_STEPS[currentStep], time: simTime, ok: true }]);
    if (currentStep + 1 >= RECALL_SIM_STEPS.length) { setSimRunning(false); if (simInterval.current) clearInterval(simInterval.current); toast.success(`Simulação concluída em ${formatTime(simTime)}!`); }
    else setSimStep(currentStep + 1);
  };
  const stopSimulation = () => { setSimRunning(false); if (simInterval.current) clearInterval(simInterval.current); };
  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

  const exportHistoricoCSV = () => {
    const headers = ["Produto", "Lote PA", "Espécie Destino", "Origem Animal", "Matéria-Prima", "Lote MP", "Fornecedor", "Cliente/Destino", "Local Entrega", "Data Venda", "Nota Fiscal", "Qtd Vendida", "Recall Ativo", "Recall Motivo", "Recall Status"];
    const rows = registros.map(r => [
      r.produto, r.lote_produto || "", (r as any).especie_destino || "", (r as any).contem_origem_animal ? "Sim" : "Não",
      r.materia_prima, r.lote_mp || "", r.fornecedor || "",
      r.cliente_destino || "", r.local_entrega || "", r.data_venda || "", r.nota_fiscal || "",
      r.quantidade_vendida || "", r.recall_ativo ? "Sim" : "Não", r.recall_motivo || "", r.recall_status || "",
    ]);
    const csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rastreabilidade_historico_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Histórico exportado para CSV!");
  };

  // Helper: parse "1.234,56 kg" / "1234.56" → number
  const parseKg = (v: any): number => {
    if (v === null || v === undefined) return 0;
    if (typeof v === "number") return v;
    const s = String(v).replace(/\./g, "").replace(",", ".").replace(/[^\d.-]/g, "");
    const n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  };
  const fmtKg = (n: number) => n.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const exportBalancoMassa = async () => {
    const lotes = new Map<string, { produto: string; materias: { mp: string; lote: string; fornecedor: string; qtd: string; kg: number }[]; vendas: { cliente: string; qtd: string; nf: string; data: string; kg: number }[] }>();
    registros.forEach(r => {
      const lote = r.lote_produto || "SEM_LOTE";
      if (!lotes.has(lote)) lotes.set(lote, { produto: r.produto, materias: [], vendas: [] });
      const entry = lotes.get(lote)!;
      if (!entry.materias.some(m => m.mp === r.materia_prima && m.lote === (r.lote_mp || "")))
        entry.materias.push({ mp: r.materia_prima, lote: r.lote_mp || "", fornecedor: r.fornecedor || "", qtd: "", kg: 0 });
      if (r.cliente_destino && !entry.vendas.some(v => v.cliente === r.cliente_destino && v.nf === (r.nota_fiscal || "")))
        entry.vendas.push({ cliente: r.cliente_destino || "", qtd: r.quantidade_vendida || "", nf: r.nota_fiscal || "", data: r.data_venda || "", kg: parseKg(r.quantidade_vendida) });
    });

    // Buscar consumo real de MP via batida_lotes + produção PA via ordens_producao/producao
    const lotesPA = Array.from(lotes.keys()).filter(l => l !== "SEM_LOTE");
    let batidaData: any[] = [];
    let ordensData: any[] = [];
    let producaoData: any[] = [];
    if (lotesPA.length > 0) {
      const { data: ord } = await supabase.from("ordens_producao").select("id, lote_produto, quantidade_programada").in("lote_produto", lotesPA);
      ordensData = ord || [];
      const ordemIds = ordensData.map((o: any) => o.id);
      if (ordemIds.length > 0) {
        const { data: bat } = await supabase.from("batida_lotes").select("ordem_id, materia_prima, lote_mp, quantidade_kg").in("ordem_id", ordemIds);
        batidaData = bat || [];
      }
      const { data: prod } = await supabase.from("producao").select("lote, produto, quantidade").in("lote", lotesPA);
      producaoData = prod || [];
    }

    const lines: string[] = [
      "BALANÇO DE MASSA QUANTITATIVO — RASTREABILIDADE",
      `Data de Geração: ${new Date().toLocaleDateString("pt-BR")}`,
      `Decreto 12.031/2024 — Fiscalização baseada em risco`,
      "",
      "LOTE PA;PRODUTO;MATÉRIA-PRIMA;LOTE MP;FORNECEDOR;KG MP;CLIENTE DESTINO;QTD VENDIDA;KG EXPEDIDO;NF;DATA VENDA",
    ];
    let totEntrada = 0, totProduzido = 0, totSaida = 0;
    const sumario: { lote: string; produto: string; entradaMP: number; produzido: number; expedido: number; saldo: number; rendimento: number; alerta: string }[] = [];

    lotes.forEach((data, lote) => {
      // Soma kg MP por (mp+lote_mp) via batida_lotes
      const ordensDoLote = ordensData.filter((o: any) => o.lote_produto === lote);
      const ordemIds = ordensDoLote.map((o: any) => o.id);
      const batidasDoLote = batidaData.filter((b: any) => ordemIds.includes(b.ordem_id));
      data.materias.forEach(m => {
        m.kg = batidasDoLote
          .filter((b: any) => b.materia_prima === m.mp && (b.lote_mp || "") === m.lote)
          .reduce((s: number, b: any) => s + (Number(b.quantidade_kg) || 0), 0);
      });

      const entradaMP = data.materias.reduce((s, m) => s + m.kg, 0);
      const programado = ordensDoLote.reduce((s: number, o: any) => s + parseKg(o.quantidade_programada), 0);
      const produzidoReal = producaoData.filter((p: any) => p.lote === lote).reduce((s: number, p: any) => s + parseKg(p.quantidade), 0);
      const produzido = produzidoReal > 0 ? produzidoReal : programado;
      const expedido = data.vendas.reduce((s, v) => s + v.kg, 0);
      const saldo = produzido - expedido;
      const rendimento = entradaMP > 0 ? (produzido / entradaMP) * 100 : 0;
      let alerta = "";
      if (expedido > produzido && produzido > 0) alerta = "⚠ EXPEDIDO > PRODUZIDO";
      else if (produzido > 0 && entradaMP > 0 && Math.abs(produzido - entradaMP) / entradaMP > 0.05) alerta = "⚠ DIVERGÊNCIA MP×PA >5%";

      totEntrada += entradaMP; totProduzido += produzido; totSaida += expedido;
      sumario.push({ lote, produto: data.produto, entradaMP, produzido, expedido, saldo, rendimento, alerta });

      const maxRows = Math.max(data.materias.length, data.vendas.length, 1);
      for (let i = 0; i < maxRows; i++) {
        const mp = data.materias[i]; const venda = data.vendas[i];
        lines.push([
          i === 0 ? lote : "",
          i === 0 ? data.produto : "",
          mp?.mp || "", mp?.lote || "", mp?.fornecedor || "",
          mp ? fmtKg(mp.kg) : "",
          venda?.cliente || "", venda?.qtd || "", venda ? fmtKg(venda.kg) : "",
          venda?.nf || "", venda?.data || ""
        ].join(";"));
      }
      lines.push("");
    });

    lines.push("");
    lines.push("══════ SUMÁRIO QUANTITATIVO POR LOTE ══════");
    lines.push("LOTE PA;PRODUTO;ENTRADA MP (kg);PRODUZIDO PA (kg);EXPEDIDO (kg);SALDO ESTOQUE (kg);RENDIMENTO %;ALERTA");
    sumario.forEach(s => {
      lines.push([s.lote, s.produto, fmtKg(s.entradaMP), fmtKg(s.produzido), fmtKg(s.expedido), fmtKg(s.saldo), s.rendimento.toFixed(1) + "%", s.alerta].join(";"));
    });
    lines.push("");
    lines.push(`TOTAIS;;${fmtKg(totEntrada)};${fmtKg(totProduzido)};${fmtKg(totSaida)};${fmtKg(totProduzido - totSaida)};${totEntrada > 0 ? ((totProduzido / totEntrada) * 100).toFixed(1) + "%" : "—"};`);
    lines.push("", `Total de lotes: ${lotes.size}`, `Total de vínculos MP: ${registros.length}`, `Total de destinos: ${registros.filter(r => r.cliente_destino).length}`);
    lines.push("", "Alertas:", `• Lotes com Expedido > Produzido: ${sumario.filter(s => s.alerta.includes("EXPEDIDO")).length}`, `• Lotes com divergência MP×PA: ${sumario.filter(s => s.alerta.includes("DIVERGÊNCIA")).length}`);

    const csv = lines.join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `balanco_massa_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Balanço de massa quantitativo exportado!");
    if (user) {
      const dataGeracao = new Date().toISOString().split("T")[0];
      await supabase.from("relatorios").insert({ user_id: user.id, empresa_id: empresaAtiva?.id || null, titulo: `Balanço de Massa Quantitativo — ${dataGeracao}`, tipo: "digital", modulo: "rastreabilidade", descricao: `Balanço quantitativo com ${lotes.size} lotes. Entrada: ${fmtKg(totEntrada)} kg | Produzido: ${fmtKg(totProduzido)} kg | Expedido: ${fmtKg(totSaida)} kg. Decreto 12.031/2024 Art. 18.`, data_geracao: dataGeracao, status: "ativo" });
      toast.info("Relatório salvo no módulo Relatórios (Decreto 12.031/2024)");
    }
  };

  // ──── NOVO 1: Rastreabilidade Reversa por Cliente (states no topo) ────

  const clientesUnicos = useMemo(() => {
    const set = new Set<string>();
    registros.forEach(r => { if (r.cliente_destino) set.add(r.cliente_destino); });
    return Array.from(set).sort();
  }, [registros]);

  const lotesPorCliente = useMemo(() => {
    if (!clienteReversoSelecionado) return [];
    const dias = parseInt(clienteReversoDias) || 180;
    const limite = new Date();
    limite.setDate(limite.getDate() - dias);
    const recs = registros.filter(r => {
      if (r.cliente_destino !== clienteReversoSelecionado) return false;
      if (!r.data_venda) return true;
      return new Date(r.data_venda) >= limite;
    });
    // Agrupar por lote PA
    const map = new Map<string, { produto: string; lote: string; nfs: Set<string>; datas: string[]; qtdTotal: number; recall: boolean }>();
    recs.forEach(r => {
      const key = `${r.produto}|${r.lote_produto || "—"}`;
      if (!map.has(key)) map.set(key, { produto: r.produto, lote: r.lote_produto || "—", nfs: new Set(), datas: [], qtdTotal: 0, recall: false });
      const e = map.get(key)!;
      if (r.nota_fiscal) e.nfs.add(r.nota_fiscal);
      if (r.data_venda) e.datas.push(r.data_venda);
      e.qtdTotal += parseKg(r.quantidade_vendida);
      if (r.recall_ativo) e.recall = true;
    });
    return Array.from(map.values()).sort((a, b) => (b.datas[0] || "").localeCompare(a.datas[0] || ""));
  }, [registros, clienteReversoSelecionado, clienteReversoDias]);

  const exportClienteReversoCSV = () => {
    if (!clienteReversoSelecionado || lotesPorCliente.length === 0) {
      toast.error("Selecione um cliente com registros");
      return;
    }
    const lines = [
      `RASTREABILIDADE REVERSA — Cliente: ${clienteReversoSelecionado}`,
      `Período: últimos ${clienteReversoDias} dias | Geração: ${new Date().toLocaleDateString("pt-BR")}`,
      "",
      "PRODUTO;LOTE PA;NOTAS FISCAIS;DATAS VENDA;QTD TOTAL (kg);RECALL"
    ];
    lotesPorCliente.forEach(l => {
      lines.push([l.produto, l.lote, Array.from(l.nfs).join(" | "), l.datas.join(" | "), fmtKg(l.qtdTotal), l.recall ? "SIM" : "Não"].join(";"));
    });
    lines.push("", `Total de lotes entregues: ${lotesPorCliente.length}`, `Lotes em recall: ${lotesPorCliente.filter(l => l.recall).length}`);
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `rastreabilidade_cliente_${clienteReversoSelecionado.replace(/[^a-z0-9]/gi, "_")}_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    toast.success("Rastreabilidade reversa exportada!");
  };

  // ──── NOVO 2: Certificado de Rastreabilidade do Lote (states no topo) ────

  const lotesPADisponiveis = useMemo(() => {
    return Array.from(new Set(registros.map(r => r.lote_produto).filter(Boolean))) as string[];
  }, [registros]);

  const gerarCertificadoLote = async () => {
    if (!certLote) { toast.error("Selecione um lote"); return; }
    const recs = registros.filter(r => r.lote_produto === certLote);
    if (recs.length === 0) { toast.error("Lote sem registros"); return; }
    const produto = recs[0].produto;

    // MPs únicas
    const mpsArr = Array.from(new Map(recs.map(r => [`${r.materia_prima}|${r.lote_mp || ""}`, { mp: r.materia_prima, lote: r.lote_mp || "—", fornecedor: r.fornecedor || "—" }])).values());
    
    // Destinos únicos
    const destinosArr = Array.from(new Map(recs.filter(r => r.cliente_destino).map(r => [`${r.cliente_destino}|${r.nota_fiscal || ""}`, { cliente: r.cliente_destino!, nf: r.nota_fiscal || "—", data: r.data_venda || "—", qtd: r.quantidade_vendida || "—", local: r.local_entrega || "—" }])).values());

    // Buscar contraprova e dados de produção do lote
    const { data: prodInfo } = await supabase.from("producao").select("*").eq("lote", certLote).maybeSingle();

    const esc = (s: unknown) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
    const empresaNome = esc(empresaAtiva?.nome || "BPF DIGITAL");
    const rt = esc(empresaAtiva?.responsavel_tecnico || "—");
    const crmv = esc(empresaAtiva?.crmv || "—");
    const dataEmissao = new Date().toLocaleString("pt-BR");

    const htmlContent = `
      <div class="p-8 bg-white text-black min-h-screen" style="font-family: 'Inter', sans-serif;">
        <div class="border-[1.5pt] border-emerald-800 p-6 mb-6">
          <div class="text-center border-b-[1.5pt] border-emerald-800 pb-4 mb-6">
            <h1 class="text-2xl font-bold text-emerald-800 uppercase tracking-tight">Certificado de Rastreabilidade</h1>
            <h2 class="text-lg font-semibold text-gray-600 mt-1">${empresaNome}</h2>
            <div class="inline-block px-4 py-1 bg-emerald-800 text-white text-[10px] font-bold rounded mt-2 uppercase">
              Decreto 12.031/2024 — Art. 18 | IN 04/2007
            </div>
          </div>

          <div class="grid grid-cols-1 gap-6">
            <div class="border border-gray-200 p-4 rounded-lg bg-gray-50/50 print-force-bg">
              <h3 class="text-emerald-800 font-bold border-b border-gray-300 pb-2 mb-3 text-sm">📦 Identificação do Lote</h3>
              <div class="grid grid-cols-2 gap-y-2 text-xs">
                <div><span class="font-bold text-gray-500">PRODUTO:</span> ${esc(produto)}</div>
                <div><span class="font-bold text-gray-500">LOTE PA:</span> <span class="text-emerald-700 font-bold">${esc(certLote)}</span></div>
                <div><span class="font-bold text-gray-500">DATA FABRICAÇÃO:</span> ${prodInfo?.data ? new Date(prodInfo.data).toLocaleDateString("pt-BR") : "—"}</div>
                <div><span class="font-bold text-gray-500">QTD PRODUZIDA:</span> ${esc(prodInfo?.quantidade || "—")}</div>
                <div><span class="font-bold text-gray-500">OPERADOR:</span> ${esc(prodInfo?.operador || "—")}</div>
                <div><span class="font-bold text-gray-500">TEMPO MISTURA:</span> ${esc(prodInfo?.tempo_mistura || "—")}</div>
              </div>
            </div>

            <div class="border border-gray-200 p-4 rounded-lg">
              <h3 class="text-emerald-800 font-bold border-b border-gray-300 pb-2 mb-3 text-sm">🌾 Composição (Montante)</h3>
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-emerald-50 print-force-bg">
                    <th class="border border-gray-300 p-2 text-left text-emerald-800">Matéria-Prima</th>
                    <th class="border border-gray-300 p-2 text-left text-emerald-800">Lote MP</th>
                    <th class="border border-gray-300 p-2 text-left text-emerald-800">Fornecedor</th>
                  </tr>
                </thead>
                <tbody>
                  ${mpsArr.map(m => `
                    <tr>
                      <td class="border border-gray-300 p-2 font-medium">${esc(m.mp)}</td>
                      <td class="border border-gray-300 p-2">${esc(m.lote)}</td>
                      <td class="border border-gray-300 p-2">${esc(m.fornecedor)}</td>
                    </tr>
                  `).join("") || "<tr><td colspan='3' class='p-4 text-center text-gray-400 italic'>Sem registros</td></tr>"}
                </tbody>
              </table>
            </div>

            <div class="border border-gray-200 p-4 rounded-lg">
              <h3 class="text-emerald-800 font-bold border-b border-gray-300 pb-2 mb-3 text-sm">🚚 Destinos (Jusante)</h3>
              <table class="w-full text-xs">
                <thead>
                  <tr class="bg-emerald-50 print-force-bg">
                    <th class="border border-gray-300 p-2 text-left text-emerald-800">Cliente</th>
                    <th class="border border-gray-300 p-2 text-left text-emerald-800">NF</th>
                    <th class="border border-gray-300 p-2 text-left text-emerald-800">Data</th>
                    <th class="border border-gray-300 p-2 text-left text-emerald-800">Qtd</th>
                    <th class="border border-gray-300 p-2 text-left text-emerald-800">Local Entrega</th>
                  </tr>
                </thead>
                <tbody>
                  ${destinosArr.map(d => `
                    <tr>
                      <td class="border border-gray-300 p-2 font-medium">${esc(d.cliente)}</td>
                      <td class="border border-gray-300 p-2">${esc(d.nf)}</td>
                      <td class="border border-gray-300 p-2">${d.data !== "—" ? new Date(d.data).toLocaleDateString("pt-BR") : "—"}</td>
                      <td class="border border-gray-300 p-2">${esc(d.qtd)}</td>
                      <td class="border border-gray-300 p-2">${esc(d.local)}</td>
                    </tr>
                  `).join("") || "<tr><td colspan='5' class='p-4 text-center text-gray-400 italic'>Lote ainda não expedido</td></tr>"}
                </tbody>
              </table>
            </div>

            <div class="border border-gray-200 p-4 rounded-lg bg-emerald-50/20 print-force-bg">
              <h3 class="text-emerald-800 font-bold border-b border-gray-300 pb-2 mb-3 text-sm">🧪 Contraprova Retida</h3>
              <div class="grid grid-cols-4 gap-4 text-xs">
                <div><span class="font-bold text-gray-500">COLETADA:</span> ${prodInfo?.contraprova_retida ? "Sim" : "Não"}</div>
                <div><span class="font-bold text-gray-500">LOCAL:</span> ${esc(prodInfo?.contraprova_local || "—")}</div>
                <div><span class="font-bold text-gray-500">QUANTIDADE:</span> ${esc(prodInfo?.contraprova_quantidade || "—")}</div>
                <div><span class="font-bold text-gray-500">VALIDADE:</span> ${prodInfo?.contraprova_validade ? new Date(prodInfo.contraprova_validade).toLocaleDateString("pt-BR") : "—"}</div>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-12 mt-12 px-6">
            <div class="border-t border-black pt-2 text-center text-xs">
              <div class="font-bold uppercase">${rt}</div>
              <div class="text-[10px] text-gray-600">Responsável Técnico — CRMV ${crmv}</div>
            </div>
            <div class="border-t border-black pt-2 text-center text-xs">
              <div class="font-bold uppercase italic text-gray-300">ASSINATURA DO CLIENTE</div>
              <div class="text-[10px] text-gray-600">Cliente / Auditor</div>
            </div>
          </div>

          <div class="mt-10 pt-4 border-t border-gray-200 text-center text-[9px] text-gray-500 italic space-y-1">
            <p>Documento emitido em ${dataEmissao} pelo sistema BPF Digital.</p>
            <p>Conformidade: Decreto 12.031/2024 (Art. 18) • IN 04/2007 (MAPA) • Rastreabilidade bidirecional comprovada eletronicamente.</p>
          </div>
        </div>
      </div>
    `;

    const printWin = window.open("", "_blank");
    if (!printWin) { toast.error("Habilite popups"); return; }
    
    // Get all current styles
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(style => style.outerHTML)
      .join('\n');

    printWin.document.write(`
      <html>
        <head>
          <title>Certificado Rastreabilidade - ${esc(certLote)}</title>
          ${styles}
          <style>
            @media print { @page { size: A4; margin: 10mm; } body { padding: 0; } }
            body { background: #f3f4f6; padding: 20px; }
          </style>
        </head>
        <body>${htmlContent}</body>
        <script>
          window.onload = () => { setTimeout(() => { window.print(); window.onfocus = () => window.close(); }, 500); };
        </script>
      </html>
    `);
    printWin.document.close();

    if (user) {
      await supabase.from("relatorios").insert({ 
        user_id: user.id, 
        empresa_id: empresaAtiva?.id || null, 
        titulo: `Certificado de Rastreabilidade — Lote ${certLote}`, 
        tipo: "digital", 
        modulo: "rastreabilidade", 
        descricao: `Certificado formal do lote ${certLote} (${produto}). Decreto 12.031/2024 Art. 18.`, 
        data_geracao: new Date().toISOString().split("T")[0], 
        status: "ativo" 
      });
    }
    toast.success("Certificado gerado!");
    setCertLoteOpen(false);
  };


  // ──── MELHORIA 1: Preencher formulário a partir do Recebimento ────
  const preencherDeRecebimento = (mp: string, lote: string, forn: string) => {
    setMateriaPrima(mp);
    setLoteMP(lote);
    setFornecedor(forn);
    toast.success("Dados do recebimento preenchidos automaticamente!");
  };

  // ──── MELHORIA 1: Preencher formulário a partir de Ordem de Produção ────
  const preencherDeOrdem = (prod: string, lote: string) => {
    setProduto(prod);
    setLoteProduto(lote);
    toast.success("Dados da ordem de produção preenchidos!");
  };

  // ──── MELHORIA 3: Dados da árvore visual ────
  const arvoreData = useMemo(() => {
    if (!arvoreLote) return null;
    const recs = registros.filter(r => r.lote_produto === arvoreLote);
    if (recs.length === 0) return null;

    const produtoNome = recs[0].produto;
    const mps = recs
      .map(r => {
        // Buscar certificado de análise do recebimento correspondente
        const recebimento = recebimentos.find((rec: any) =>
          rec.materia_prima === r.materia_prima && rec.lote === (r.lote_mp || "")
        );
        return {
          mp: r.materia_prima,
          lote: r.lote_mp || "—",
          fornecedor: r.fornecedor || "—",
          certificado_numero: recebimento?.certificado_analise_numero || null,
          certificado_valido: recebimento?.certificado_analise_valido ?? null,
        };
      })
      .filter((m, i, arr) => arr.findIndex(x => x.mp === m.mp && x.lote === m.lote) === i);
    const clientes = recs
      .filter(r => r.cliente_destino)
      .map(r => ({ cliente: r.cliente_destino!, local: r.local_entrega || "—", nf: r.nota_fiscal || "—" }))
      .filter((c, i, arr) => arr.findIndex(x => x.cliente === c.cliente && x.nf === c.nf) === i);

    // Buscar análises vinculadas
    const analises = analisesLab.filter(a => a.lote === arvoreLote);

    return { produto: produtoNome, lote: arvoreLote, mps, clientes, analises };
  }, [arvoreLote, registros, analisesLab, recebimentos]);

  return (
    <>
      <PageHeader icon={History} title="POP 09 - Programa de Rastreabilidade e Recolhimento (Recall)" description="Rastreabilidade de produtos, controle de RNC e programa de recolhimento — IN 04/2007" 
        orientacaoModuloId="rastreabilidade" />
      <div className="flex justify-end mb-3"><AnexarPlanilhaPop popCodigo="POP-09" popNome="Rastreabilidade e Recall" /></div>

      {/* ══════════ MELHORIA 5: DASHBOARD DE COBERTURA ══════════ */}
      <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" /> Dashboard de Cobertura — Rastreabilidade
          </CardTitle>
          <p className="text-xs text-muted-foreground">Percentual de lotes com rastreabilidade completa (montante + jusante)</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
            <div className="text-center p-3 rounded-lg bg-background border">
              <p className="text-2xl font-bold font-display">{cobertura.total}</p>
              <p className="text-[10px] text-muted-foreground">Total Lotes PA</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-2xl font-bold font-display text-primary">{cobertura.completos}</p>
              <p className="text-[10px] text-muted-foreground">Completos (MP+Venda)</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
              <p className="text-2xl font-bold font-display text-yellow-700">{cobertura.semDestino}</p>
              <p className="text-[10px] text-muted-foreground">Sem destino/venda</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-muted/30 border">
              <p className="text-2xl font-bold font-display">{cobertura.parciais}</p>
              <p className="text-[10px] text-muted-foreground">Parciais</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-background border">
              <p className={`text-2xl font-bold font-display ${cobertura.pctCompleto >= 80 ? "text-primary" : cobertura.pctCompleto >= 50 ? "text-yellow-600" : "text-destructive"}`}>{cobertura.pctCompleto}%</p>
              <p className="text-[10px] text-muted-foreground">Cobertura Total</p>
            </div>
          </div>
          <Progress value={cobertura.pctCompleto} className="h-3" />
          <p className="text-[10px] text-muted-foreground mt-2 text-center">
            {cobertura.pctCompleto >= 80 ? "✅ Excelente cobertura! Pronto para auditoria." :
             cobertura.pctCompleto >= 50 ? "⚠️ Cobertura moderada. Complete os destinos/vendas dos lotes pendentes." :
             cobertura.total === 0 ? "Cadastre registros de rastreabilidade para acompanhar a cobertura." :
             "🔴 Cobertura baixa. Priorize o registro de vendas e vínculos MP para os lotes existentes."}
          </p>
        </CardContent>
      </Card>

      {/* ══════════ SEGREGAÇÃO POR ESPÉCIE — IN 34/2008 / IN 15/2009 ══════════ */}
      <Card className="mb-6 border-orange-500/20">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-600" /> Segregação por Espécie — IN 34/2008 / IN 15/2009
          </CardTitle>
          <p className="text-xs text-muted-foreground">Controle de restrições de subprodutos de origem animal por espécie destino, prevenção de EEB e contaminação cruzada.</p>
        </CardHeader>
        <CardContent>
          {(() => {
            const porEspecie = new Map<string, { total: number; comOrigemAnimal: number; alertas: string[]; lotes: Set<string> }>();
            registros.forEach(r => {
              const esp = (r as any).especie_destino || "não_informada";
              if (!porEspecie.has(esp)) porEspecie.set(esp, { total: 0, comOrigemAnimal: 0, alertas: [], lotes: new Set() });
              const entry = porEspecie.get(esp)!;
              entry.total++;
              if (r.lote_produto) entry.lotes.add(r.lote_produto);
              if ((r as any).contem_origem_animal) {
                entry.comOrigemAnimal++;
                const tipo = (r as any).tipo_origem_animal || "";
                if (esp === "bovinos" && ["farinha_carne_ossos", "farinha_sangue", "sebo_gordura"].includes(tipo)) {
                  const alerta = `⛔ PROIBIDO: ${tipo.replace(/_/g, " ")} para bovinos (IN 34/2008 - Prevenção EEB)`;
                  if (!entry.alertas.includes(alerta)) entry.alertas.push(alerta);
                }
                if (esp === "bovinos" && tipo === "farinha_penas") {
                  const alerta = "⚠️ Farinha de penas para bovinos: verificar conformidade e flushing obrigatório";
                  if (!entry.alertas.includes(alerta)) entry.alertas.push(alerta);
                }
                if (esp === "equinos" && ["farinha_carne_ossos", "farinha_sangue"].includes(tipo)) {
                  const alerta = `⚠️ ${tipo.replace(/_/g, " ")} para equinos: verificar restrição IN 34/2008`;
                  if (!entry.alertas.includes(alerta)) entry.alertas.push(alerta);
                }
                if ((esp === "caprinos_ovinos") && ["farinha_carne_ossos", "farinha_sangue"].includes(tipo)) {
                  const alerta = `⛔ PROIBIDO: ${tipo.replace(/_/g, " ")} para caprinos/ovinos (ruminantes — IN 34/2008)`;
                  if (!entry.alertas.includes(alerta)) entry.alertas.push(alerta);
                }
              }
            });

            const especieLabels: Record<string, string> = {
              bovinos: "🐄 Bovinos", suinos: "🐖 Suínos", aves: "🐔 Aves", equinos: "🐴 Equinos",
              caprinos_ovinos: "🐑 Caprinos/Ovinos", peixes: "🐟 Peixes", pets: "🐕 Pets", multiespecie: "📦 Multiespécie", não_informada: "❓ Não informada",
            };

            const totalAlertas = Array.from(porEspecie.values()).reduce((sum, e) => sum + e.alertas.length, 0);

            // Check cross-contamination risk: same lot used for multiple species with different restrictions
            const crossContamAlerts: string[] = [];
            const lotesUsados = new Map<string, Set<string>>();
            registros.forEach(r => {
              if (r.lote_produto && (r as any).especie_destino) {
                if (!lotesUsados.has(r.lote_produto)) lotesUsados.set(r.lote_produto, new Set());
                lotesUsados.get(r.lote_produto)!.add((r as any).especie_destino);
              }
            });
            lotesUsados.forEach((especies, lote) => {
              if (especies.size > 1 && (especies.has("bovinos") || especies.has("caprinos_ovinos"))) {
                crossContamAlerts.push(`Lote ${lote}: usado para ${Array.from(especies).join(", ")} — risco de contaminação cruzada entre ruminantes e não-ruminantes`);
              }
            });

            if (porEspecie.size === 0 || (porEspecie.size === 1 && porEspecie.has("não_informada"))) {
              return (
                <div className="text-center py-4 text-muted-foreground text-xs">
                  <p>Informe a espécie destino nos registros para ativar o controle de segregação.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center p-2 rounded-lg bg-muted/30 border">
                    <p className="text-lg font-bold font-display">{porEspecie.size}</p>
                    <p className="text-[10px] text-muted-foreground">Espécies atendidas</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-orange-500/5 border border-orange-500/20">
                    <p className="text-lg font-bold font-display text-orange-700">
                      {Array.from(porEspecie.values()).reduce((sum, e) => sum + e.comOrigemAnimal, 0)}
                    </p>
                    <p className="text-[10px] text-muted-foreground">Com origem animal</p>
                  </div>
                  <div className={`text-center p-2 rounded-lg border ${totalAlertas > 0 ? "bg-destructive/5 border-destructive/20" : "bg-primary/5 border-primary/20"}`}>
                    <p className={`text-lg font-bold font-display ${totalAlertas > 0 ? "text-destructive" : "text-primary"}`}>{totalAlertas}</p>
                    <p className="text-[10px] text-muted-foreground">Alertas de restrição</p>
                  </div>
                </div>

                {/* Cross-contamination alerts */}
                {crossContamAlerts.length > 0 && (
                  <div className="p-3 rounded-lg border-2 border-destructive bg-destructive/5 space-y-1">
                    <p className="text-xs font-bold text-destructive flex items-center gap-1"><AlertTriangle className="w-4 h-4" /> Risco de Contaminação Cruzada entre Espécies</p>
                    {crossContamAlerts.map((a, i) => <p key={i} className="text-xs text-destructive/80">{a}</p>)}
                  </div>
                )}

                {/* Species breakdown */}
                <div className="space-y-2">
                  {Array.from(porEspecie.entries())
                    .sort((a, b) => b[1].alertas.length - a[1].alertas.length || b[1].total - a[1].total)
                    .map(([esp, data]) => (
                    <div key={esp} className={`p-3 rounded-lg border ${data.alertas.length > 0 ? "border-destructive/30 bg-destructive/5" : "bg-background"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold">{especieLabels[esp] || esp}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[10px]">{data.total} reg. / {data.lotes.size} lotes</Badge>
                          {data.comOrigemAnimal > 0 && (
                            <Badge className="bg-orange-500/20 text-orange-700 text-[10px]">{data.comOrigemAnimal} c/ origem animal</Badge>
                          )}
                        </div>
                      </div>
                      {data.alertas.map((alerta, i) => (
                        <p key={i} className="text-xs text-destructive font-medium mt-1">{alerta}</p>
                      ))}
                    </div>
                  ))}
                </div>

                <div className="p-3 rounded-lg border bg-muted/30 text-xs space-y-1">
                  <p className="font-semibold">📋 Referências — Segregação por Espécie</p>
                  <p className="text-muted-foreground">• <strong>IN 34/2008:</strong> Proíbe proteína e gordura de mamíferos na alimentação de ruminantes (prevenção EEB/BSE).</p>
                  <p className="text-muted-foreground">• <strong>IN 15/2009, Art. 16:</strong> Fábricas com múltiplas espécies devem segregar linhas ou documentar flushing entre lotes.</p>
                  <p className="text-muted-foreground">• <strong>Decreto 12.031/2024:</strong> Fiscalização prioriza estabelecimentos com múltiplas espécies e uso de subprodutos animais.</p>
                </div>
              </div>
            );
          })()}
        </CardContent>
      </Card>

      {/* ══════════ MELHORIA 4: ALERTAS DE CONTRAPROVA VENCIDA ══════════ */}
      {(contraprovosVencidas.length > 0 || contraprovosProximasVencer.length > 0) && (
        <Card className="mb-6 border-destructive/30 bg-destructive/5">
          <CardHeader className="pb-2">
            <CardTitle className="font-display text-sm flex items-center gap-2 text-destructive">
              <Bell className="w-5 h-5" /> Alertas de Contraprova — Amostras de Retenção
            </CardTitle>
          </CardHeader>
          <CardContent>
            {contraprovosVencidas.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-destructive mb-2 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {contraprovosVencidas.length} amostra(s) VENCIDA(S) — descarte conforme procedimento
                </p>
                <div className="space-y-1">
                  {contraprovosVencidas.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-background border text-xs">
                      <div>
                        <Badge variant="outline" className="text-[10px] mr-2">{c.tipo}</Badge>
                        <span className="font-medium">{c.produto}</span>
                        <span className="text-muted-foreground ml-2">Lote: {c.lote}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{c.local}</span>
                        <Badge variant="destructive" className="text-[10px]">Vencida: {new Date(c.validade).toLocaleDateString("pt-BR")}</Badge>
                      </div>
                    </div>
                  ))}
                  {contraprovosVencidas.length > 5 && <p className="text-xs text-muted-foreground">+{contraprovosVencidas.length - 5} vencidas</p>}
                </div>
              </div>
            )}
            {contraprovosProximasVencer.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-yellow-700 mb-2 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> {contraprovosProximasVencer.length} amostra(s) próxima(s) do vencimento (≤ 30 dias)
                </p>
                <div className="space-y-1">
                  {contraprovosProximasVencer.slice(0, 5).map((c, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-background border text-xs">
                      <div>
                        <Badge variant="outline" className="text-[10px] mr-2">{c.tipo}</Badge>
                        <span className="font-medium">{c.produto}</span>
                        <span className="text-muted-foreground ml-2">Lote: {c.lote}</span>
                      </div>
                      <Badge className="bg-yellow-500/20 text-yellow-700 text-[10px]">{c.diasRestantes} dias restantes</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{registros.length}</p>
          <p className="text-xs text-muted-foreground">Vínculos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><Package className="w-5 h-5 text-primary" /></div>
          <p className="text-2xl font-bold font-display text-primary">{uniquePA.size}</p>
          <p className="text-xs text-muted-foreground">Lotes PA</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><Truck className="w-5 h-5 text-accent" /></div>
          <p className="text-2xl font-bold font-display text-accent">{comVenda.length}</p>
          <p className="text-xs text-muted-foreground">Com venda/entrega</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <div className="flex justify-center mb-1"><AlertTriangle className="w-5 h-5 text-destructive" /></div>
          <p className="text-2xl font-bold font-display text-destructive">{comRecall.length}</p>
          <p className="text-xs text-muted-foreground">Em recall</p>
        </CardContent></Card>
      </div>

      {/* ══════════ SEGREGAÇÃO DIGITAL — QUARENTENA E LOTES RETIDOS ══════════ */}
      <Card className="mb-6 border-yellow-500/30 bg-yellow-50/30 dark:bg-yellow-900/5">
        <CardHeader className="pb-2">
          <CardTitle className="font-display text-sm flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <ShieldAlert className="w-5 h-5" /> Segregação Digital — Quarentena e Lotes Retidos
          </CardTitle>
          <p className="text-xs text-muted-foreground">Controle de lotes em quarentena, retidos ou aguardando análise conforme IN 15/2009 e Decreto 12.031/2024.</p>
        </CardHeader>
        <CardContent>
          {(() => {
            const lotesQuarentena = registros.filter(r =>
              r.recall_status === "quarentena" || r.recall_status === "retido" || r.recall_status === "aguardando_analise"
            );
            const lotesUnicos = Array.from(new Set(lotesQuarentena.map(r => r.lote_produto).filter(Boolean)));

            if (lotesUnicos.length === 0) {
              return (
                <div className="text-center py-4 text-xs text-muted-foreground">
                  <p>Nenhum lote em quarentena ou retido. Use a tabela de registros para marcar lotes.</p>
                  <p className="mt-1">Opções: <strong>Quarentena</strong> | <strong>Retido</strong> | <strong>Aguardando Análise</strong></p>
                </div>
              );
            }

            return (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-3 mb-3">
                  <div className="text-center p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300">
                    <p className="text-xl font-bold text-yellow-700">{lotesQuarentena.filter(r => r.recall_status === "quarentena").length}</p>
                    <p className="text-[10px] text-muted-foreground">Em Quarentena</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-orange-100 dark:bg-orange-900/20 border border-orange-300">
                    <p className="text-xl font-bold text-orange-700">{lotesQuarentena.filter(r => r.recall_status === "retido").length}</p>
                    <p className="text-[10px] text-muted-foreground">Retidos</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 border border-blue-300">
                    <p className="text-xl font-bold text-blue-700">{lotesQuarentena.filter(r => r.recall_status === "aguardando_analise").length}</p>
                    <p className="text-[10px] text-muted-foreground">Aguard. Análise</p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produto</TableHead>
                      <TableHead>Lote</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {lotesUnicos.map(lote => {
                      const rec = lotesQuarentena.find(r => r.lote_produto === lote)!;
                      return (
                        <TableRow key={lote}>
                          <TableCell>{rec.produto}</TableCell>
                          <TableCell className="font-mono">{lote}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              rec.recall_status === "quarentena" ? "border-yellow-500 text-yellow-700" :
                              rec.recall_status === "retido" ? "border-orange-500 text-orange-700" :
                              "border-blue-500 text-blue-700"
                            }>
                              {rec.recall_status === "quarentena" ? "🔒 Quarentena" :
                               rec.recall_status === "retido" ? "⛔ Retido" : "🔬 Aguard. Análise"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button size="sm" variant="outline" className="text-xs h-7" onClick={async () => {
                              const { error } = await supabase.from("rastreabilidade").update({ recall_status: "liberado" } as any).eq("lote_produto", lote);
                              if (error) toast.error("Erro ao liberar");
                              else { toast.success(`Lote ${lote} liberado!`); fetchData(); }
                            }}>
                              ✅ Liberar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })()}
          <div className="mt-3 p-2 rounded bg-muted/30 text-[10px] text-muted-foreground space-y-1">
            <p><strong>📋 Para segregar um lote:</strong> Na tabela de registros, use o botão de <em>Recall</em> e selecione o status "Quarentena", "Retido" ou "Aguardando Análise".</p>
            <p><strong>IN 15/2009, Art. 12:</strong> Produtos não conformes devem ser segregados e identificados até decisão final (reprocesso, descarte ou recall).</p>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6 border-accent/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-accent" /> Árvore Visual de Rastreabilidade
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Diagrama visual: Fornecedor → MP → Produção → PA → Cliente</p>
          </div>
          <Dialog open={arvoreOpen} onOpenChange={setArvoreOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <GitBranch className="w-4 h-4 mr-1" /> Visualizar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-accent" /> Árvore de Rastreabilidade do Lote</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Selecione o Lote PA</Label>
                  <Select value={arvoreLote} onValueChange={setArvoreLote}>
                    <SelectTrigger><SelectValue placeholder="Selecione um lote" /></SelectTrigger>
                    <SelectContent>
                      {Array.from(uniquePA).map(lote => (
                        <SelectItem key={lote!} value={lote!}>{lote}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {arvoreData && (
                  <div className="space-y-4">
                    {/* Header do lote */}
                    <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
                      <p className="font-display font-bold text-lg text-primary">{arvoreData.produto}</p>
                      <Badge className="font-mono mt-1 bg-primary/20 text-primary">{arvoreData.lote}</Badge>
                    </div>

                    {/* Fluxo Visual */}
                    <div className="relative">
                      {/* MONTANTE - Fornecedores e MPs */}
                      <div className="mb-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">← Montante (Fornecedores → MPs)</p>
                        <div className="space-y-2">
                          {arvoreData.mps.map((mp, i) => (
                            <div key={i} className="flex flex-col md:flex-row items-center gap-2">
                              <div className="flex-shrink-0 p-2 rounded bg-muted/50 border text-xs text-center min-w-[120px]">
                                <p className="font-medium">{mp.fornecedor}</p>
                                <p className="text-[10px] text-muted-foreground">Fornecedor</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 rotate-90 md:rotate-0" />
                              <div className="flex-shrink-0 p-2 rounded bg-accent/10 border border-accent/20 text-xs text-center min-w-[140px]">
                                <p className="font-medium">{mp.mp}</p>
                                <Badge variant="outline" className="font-mono text-[10px] mt-1">{mp.lote}</Badge>
                                {mp.certificado_numero && (
                                  <div className="mt-1">
                                    <Badge className={`text-[10px] ${mp.certificado_valido ? "bg-primary/20 text-primary" : mp.certificado_valido === false ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"}`}>
                                      📄 CA: {mp.certificado_numero} {mp.certificado_valido ? "✓" : mp.certificado_valido === false ? "✗" : ""}
                                    </Badge>
                                  </div>
                                )}
                                {!mp.certificado_numero && (
                                  <p className="text-[10px] text-yellow-600 mt-1">⚠ Sem CA</p>
                                )}
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 rotate-90 md:rotate-0" />
                              <div className="flex-1 h-px bg-accent/30" />
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* CENTRO - Produção */}
                      <div className="my-4 flex justify-center">
                        <div className="p-4 rounded-lg bg-primary/10 border-2 border-primary/30 text-center min-w-[200px]">
                          <p className="text-xs text-muted-foreground uppercase">Produção</p>
                          <p className="font-display font-bold text-lg">{arvoreData.produto}</p>
                          <Badge className="font-mono bg-primary/20 text-primary">{arvoreData.lote}</Badge>
                          {arvoreData.analises.length > 0 && (
                            <div className="mt-2">
                              <Badge className={arvoreData.analises.every((a: any) => a.conforme) ? "bg-primary/20 text-primary text-[10px]" : "bg-destructive/20 text-destructive text-[10px]"}>
                                <FlaskConical className="w-3 h-3 mr-1" />
                                {arvoreData.analises.filter((a: any) => a.conforme).length}/{arvoreData.analises.length} análises OK
                              </Badge>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* JUSANTE - Clientes */}
                      <div className="mt-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">→ Jusante (PA → Clientes)</p>
                        {arvoreData.clientes.length > 0 ? (
                          <div className="space-y-2">
                            {arvoreData.clientes.map((c, i) => (
                              <div key={i} className="flex flex-col md:flex-row items-center gap-2">
                                <div className="flex-1 h-px bg-primary/30" />
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 rotate-90 md:rotate-0" />
                                <div className="flex-shrink-0 p-2 rounded bg-muted/50 border text-xs min-w-[120px] w-full md:w-auto text-center md:text-left">
                                  <p className="font-medium">{c.cliente}</p>
                                  <p className="text-[10px] text-muted-foreground">{c.local}</p>
                                </div>
                                <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 rotate-90 md:rotate-0" />
                                <div className="flex-shrink-0 p-2 rounded bg-primary/5 border border-primary/10 text-xs">
                                  <p className="font-mono">{c.nf}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-muted-foreground text-xs">
                            <Truck className="w-6 h-6 mx-auto mb-1 opacity-30" />
                            Nenhum destino/venda registrado
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!arvoreData && arvoreLote && (
                  <p className="text-sm text-muted-foreground text-center py-6">Nenhum registro encontrado para este lote.</p>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Recall Simulado */}
      <Card className="mb-6 border-accent/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Timer className="w-5 h-5 text-accent" /> Recall Simulado — Teste de Tempo de Resposta
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Simule um recall para validar o tempo de resposta da equipe (POP-09)</p>
          </div>
          <Dialog open={simOpen} onOpenChange={setSimOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground">
                <Play className="w-4 h-4 mr-1" /> Iniciar Simulação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><Timer className="w-5 h-5 text-accent" /> Simulação de Recall</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div className="text-center p-4 rounded-lg bg-muted/50">
                  <p className="text-4xl font-mono font-bold text-foreground">{formatTime(simTime)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Tempo decorrido</p>
                </div>
                {!simRunning && simResults.length === 0 && (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">Etapas da simulação:</p>
                    {RECALL_SIM_STEPS.map((s, i) => (<div key={i} className="text-xs p-2 rounded bg-muted/30 border">{s}</div>))}
                    <Button onClick={startSimulation} className="w-full bg-accent text-accent-foreground hover:bg-accent/90"><Play className="w-4 h-4 mr-1" /> Iniciar Cronômetro</Button>
                  </div>
                )}
                {simRunning && (
                  <div className="space-y-3">
                    <Progress value={(simStep / RECALL_SIM_STEPS.length) * 100} className="h-2" />
                    <div className="p-3 rounded-lg bg-accent/10 border border-accent/30 text-center">
                      <p className="text-sm font-semibold">{RECALL_SIM_STEPS[simStep]}</p>
                      <p className="text-xs text-muted-foreground mt-1">Etapa {simStep + 1} de {RECALL_SIM_STEPS.length}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={advanceStep} className="flex-1 bg-primary text-primary-foreground">✓ Concluir Etapa</Button>
                      <Button onClick={stopSimulation} variant="destructive" size="icon"><Square className="w-4 h-4" /></Button>
                    </div>
                  </div>
                )}
                {!simRunning && simResults.length > 0 && (
                  <div className="space-y-3">
                    <div className={`p-3 rounded-lg text-center ${simResults.length === RECALL_SIM_STEPS.length ? "bg-primary/10 border border-primary/30" : "bg-destructive/10 border border-destructive/30"}`}>
                      <p className="font-display font-bold text-lg">{simResults.length === RECALL_SIM_STEPS.length ? "✅ Simulação Concluída" : "⚠️ Simulação Interrompida"}</p>
                      <p className="text-2xl font-mono font-bold mt-1">{formatTime(simTime)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {simTime <= 120 ? "Excelente! Dentro do tempo ideal (≤ 2 min)" : simTime <= 300 ? "Bom resultado (≤ 5 min)" : "Atenção: tempo acima do recomendado"}
                      </p>
                    </div>
                    <div className="space-y-1">
                      {simResults.map((r, i) => (
                        <div key={i} className="text-xs flex items-center justify-between p-1.5 rounded bg-muted/30">
                          <span>{r.step}</span><span className="font-mono text-muted-foreground">{formatTime(r.time)}</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => { setSimResults([]); setSimTime(0); setSimStep(0); }} variant="outline" className="w-full"><RotateCcw className="w-4 h-4 mr-1" /> Nova Simulação</Button>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {/* Teste de Rastreabilidade Completa */}
      <Card className="mb-6 border-primary/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <ArrowUpDown className="w-5 h-5 text-primary" /> Teste de Rastreabilidade — Montante e Jusante
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Rastreie um lote completo (MP → PA → Cliente) e registre o resultado</p>
          </div>
          <Dialog open={testeOpen} onOpenChange={setTesteOpen}>
            <DialogTrigger asChild>
              <Button size="sm" variant="outline" className="border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                <ArrowUpDown className="w-4 h-4 mr-1" /> Testar Lote
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader><DialogTitle className="flex items-center gap-2"><ArrowUpDown className="w-5 h-5 text-primary" /> Teste de Rastreabilidade Completa</DialogTitle></DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Lote do Produto Acabado (PA)</Label>
                  <div className="flex gap-2 mt-1">
                    <Select value={testeLote} onValueChange={setTesteLote}>
                      <SelectTrigger><SelectValue placeholder="Selecione um lote" /></SelectTrigger>
                      <SelectContent>
                        {Array.from(new Set(registros.map(r => r.lote_produto).filter(Boolean))).map(lote => (
                          <SelectItem key={lote!} value={lote!}>{lote}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button onClick={startTesteRastreabilidade} disabled={testeRunning || !testeLote}>
                      {testeRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
                {testeRunning && (
                  <div className="text-center p-4 rounded-lg bg-primary/5 border border-primary/20">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary mb-2" />
                    <p className="text-2xl font-mono font-bold">{formatTime(testeTime)}</p>
                    <p className="text-xs text-muted-foreground">Rastreando montante e jusante...</p>
                  </div>
                )}
                {testeResult && (
                  <div className="space-y-4">
                    <div className={`p-3 rounded-lg text-center ${testeResult.montante.length > 0 && testeResult.jusante.length > 0 ? "bg-primary/10 border border-primary/30" : "bg-yellow-500/10 border border-yellow-500/30"}`}>
                      <p className="font-display font-bold text-lg">{testeResult.montante.length > 0 && testeResult.jusante.length > 0 ? "✅ Rastreabilidade Completa" : "⚠️ Rastreabilidade Parcial"}</p>
                      <p className="text-sm text-muted-foreground mt-1">Lote <strong>{testeResult.lote}</strong> — {testeResult.produto}</p>
                      <p className="text-2xl font-mono font-bold mt-2">{formatTime(testeResult.tempoSegundos)}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                      <p className="text-xs font-bold flex items-center gap-1 mb-2"><CheckCircle2 className="w-3 h-3 text-primary" /> MONTANTE (← Matérias-Primas) — {testeResult.montante.length} encontradas</p>
                      {testeResult.montante.length > 0 ? (
                        <Table className="border rounded-md">
                          <TableHeader className="bg-muted/50">
                            <TableRow>
                              <TableHead className="py-1 text-[10px] h-8">MP</TableHead>
                              <TableHead className="py-1 text-[10px] h-8">Lote</TableHead>
                              <TableHead className="py-1 text-[10px] h-8">Fornecedor</TableHead>
                              <TableHead className="py-1 text-[10px] h-8">NF / Laudo</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {testeResult.montante.map((m, i) => (
                              <TableRow key={i}>
                                <TableCell className="py-1 text-xs">{m.materia_prima}</TableCell>
                                <TableCell className="py-1 text-xs font-mono">{m.lote_mp}</TableCell>
                                <TableCell className="py-1 text-xs">{m.fornecedor}</TableCell>
                                <TableCell className="py-1 text-xs">
                                  <div className="flex gap-1">
                                    {m.nota_fiscal_url ? (
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => window.open(m.nota_fiscal_url!, "_blank")} title={`NF: ${m.nota_fiscal || 'Ver'}`}>
                                        <FileText className="h-3 w-3 text-blue-500" />
                                      </Button>
                                    ) : <span className="text-[9px] text-muted-foreground">S/ NF</span>}
                                    {m.laudo_url ? (
                                      <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => window.open(m.laudo_url!, "_blank")} title="Ver Laudo">
                                        <FlaskConical className="h-3 w-3 text-purple-500" />
                                      </Button>
                                    ) : <span className="text-[9px] text-muted-foreground">S/ L</span>}
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Nenhuma matéria-prima vinculada.</p>
                      )}
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs font-bold flex items-center gap-1 mb-2">
                        {testeResult.jusante.length > 0 ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <XCircle className="w-3 h-3 text-destructive" />}
                        JUSANTE (→ Clientes/Destinos) — {testeResult.jusante.length} encontrados
                      </p>
                      {testeResult.jusante.length > 0 ? (
                        <Table><TableHeader><TableRow><TableHead className="py-1 text-xs">Cliente</TableHead><TableHead className="py-1 text-xs">Local</TableHead><TableHead className="py-1 text-xs">NF</TableHead><TableHead className="py-1 text-xs">Data Venda</TableHead></TableRow></TableHeader>
                          <TableBody>{testeResult.jusante.map((j, i) => (<TableRow key={i}><TableCell className="py-1 text-xs">{j.cliente}</TableCell><TableCell className="py-1 text-xs">{j.local}</TableCell><TableCell className="py-1 text-xs font-mono">{j.nf}</TableCell><TableCell className="py-1 text-xs">{j.data_venda}</TableCell></TableRow>))}</TableBody>
                        </Table>
                      ) : <p className="text-xs text-muted-foreground">Nenhum destino/venda registrado para este lote</p>}
                    </div>
                    <div><Label className="text-xs">Observações do teste</Label><Textarea value={testeObs} onChange={e => setTesteObs(e.target.value)} rows={2} placeholder="Avaliação do teste..." /></div>
                    <Button onClick={salvarTesteResultado} className="w-full" disabled={testeSaving}>
                      {testeSaving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Salvar Resultado do Teste
                    </Button>
                    <Button onClick={handlePrintMapa} className="w-full" variant="outline" disabled={!testeResult}>
                      <Printer className="w-4 h-4 mr-1" /> Imprimir Mapa de Rastreabilidade (Planilha 9.1)
                    </Button>
                  </div>
                )}
                {testesHistorico.length > 0 && !testeResult && (
                  <div>
                    <p className="text-xs font-bold mb-2">Histórico de Testes</p>
                    <div className="space-y-1">
                      {testesHistorico.map((t: any) => (
                        <div key={t.id} className="flex items-center justify-between p-2 rounded bg-muted/30 border text-xs">
                          <div><span className="font-medium">{t.produto}</span><Badge variant="outline" className="ml-2 font-mono text-[10px]">{t.lote_testado}</Badge></div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono">{formatTime(t.tempo_segundos)}</span>
                            <Badge className={t.resultado === "aprovado" ? "bg-primary/20 text-primary" : "bg-yellow-500/20 text-yellow-700"}>{t.resultado === "aprovado" ? "Completo" : "Parcial"}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
      </Card>

      {comRecall.length > 0 && (
        <Card className="border-destructive/30 bg-destructive/5 mb-6">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 mb-3"><ShieldAlert className="w-5 h-5 text-destructive" /><h3 className="font-display font-semibold text-sm text-destructive">Produtos em Recall</h3></div>
            <div className="space-y-2">
              {comRecall.map(r => (
                <div key={r.id} className="flex items-center justify-between p-2 rounded bg-background border">
                  <div>
                    <span className="font-medium text-sm">{r.produto}</span>
                    <span className="text-xs text-muted-foreground ml-2">Lote: {r.lote_produto}</span>
                    <span className="text-xs text-muted-foreground ml-2">→ {r.cliente_destino || "N/I"}</span>
                  </div>
                  <Badge variant="destructive" className="text-xs">{r.recall_status === "iniciado" ? "Iniciado" : r.recall_status === "em_andamento" ? "Em andamento" : "Concluído"}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Balanço de Massa */}
      <Card className="mb-6 border-primary/20">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <Package className="w-5 h-5 text-primary" /> Balanço de Massa — Conciliação de Estoque (IN 17/2017 | Decreto 12.031/2024)
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">Conciliação Entrada (MP) vs Saída (Venda/Entrega) por lote de PA</p>
          </div>
          <Button size="sm" variant="outline" onClick={exportBalancoMassa} disabled={registros.length === 0}>
            <Download className="w-4 h-4 mr-1" /> Exportar CSV
          </Button>
        </CardHeader>
        <CardContent>
          {(() => {
            const lotes = new Map<string, { produto: string; materias: string[]; clientes: string[]; qtdVendida: number }>();
            registros.forEach(r => {
              const lote = r.lote_produto || "SEM_LOTE";
              if (!lotes.has(lote)) lotes.set(lote, { produto: r.produto, materias: [], clientes: [], qtdVendida: 0 });
              const entry = lotes.get(lote)!;
              const mpLabel = `${r.materia_prima} (${r.lote_mp || "s/lote"})`;
              if (!entry.materias.includes(mpLabel)) entry.materias.push(mpLabel);
              if (r.cliente_destino && !entry.clientes.includes(r.cliente_destino)) entry.clientes.push(r.cliente_destino);
              if (r.quantidade_vendida) entry.qtdVendida += parseFloat(r.quantidade_vendida.replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
            });
            const lotesCompletos = Array.from(lotes.values()).filter(l => l.materias.length > 0 && l.clientes.length > 0).length;
            const lotesSemSaida = Array.from(lotes.values()).filter(l => l.materias.length > 0 && l.clientes.length === 0).length;
            return (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-muted/30 border"><p className="text-lg font-bold font-display">{lotes.size}</p><p className="text-[10px] text-muted-foreground">Total de lotes</p></div>
                  <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/20"><p className="text-lg font-bold font-display text-primary">{lotesCompletos}</p><p className="text-[10px] text-muted-foreground">Conciliados (E/S)</p></div>
                  <div className="text-center p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20"><p className="text-lg font-bold font-display text-yellow-700">{lotesSemSaida}</p><p className="text-[10px] text-muted-foreground">Sem saída registrada</p></div>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Lote PA</TableHead><TableHead>Produto</TableHead><TableHead>Entradas (MP)</TableHead><TableHead>Saídas (Clientes)</TableHead><TableHead>Qtd Vendida</TableHead><TableHead>Conciliação</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {Array.from(lotes.entries()).slice(0, 20).map(([lote, data]) => {
                      const conciliado = data.clientes.length > 0 && data.materias.length > 0;
                      const parcial = data.materias.length > 0 && data.clientes.length === 0;
                      return (
                        <TableRow key={lote}>
                          <TableCell className="font-mono text-xs font-bold">{lote}</TableCell>
                          <TableCell className="font-medium text-sm">{data.produto}</TableCell>
                          <TableCell className="text-xs max-w-[200px]">
                            {data.materias.slice(0, 3).map((mp, i) => <div key={i} className="truncate">{mp}</div>)}
                            {data.materias.length > 3 && <span className="text-muted-foreground">+{data.materias.length - 3}</span>}
                          </TableCell>
                          <TableCell className="text-xs max-w-[150px]">
                            {data.clientes.length > 0 ? data.clientes.slice(0, 2).map((c, i) => <div key={i} className="truncate">{c}</div>) : <span className="text-muted-foreground">—</span>}
                          </TableCell>
                          <TableCell className="font-mono text-xs">{data.qtdVendida > 0 ? data.qtdVendida.toLocaleString("pt-BR") : "—"}</TableCell>
                          <TableCell>
                            {conciliado ? <Badge className="bg-primary/20 text-primary text-[10px]">✅ Conciliado</Badge> :
                             parcial ? <Badge className="bg-yellow-500/20 text-yellow-700 text-[10px]">⚠️ Sem saída</Badge> :
                             <Badge variant="outline" className="text-[10px]">Parcial</Badge>}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
                {lotes.size > 20 && <p className="text-xs text-muted-foreground text-center mt-2">Mostrando 20 de {lotes.size} lotes.</p>}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Correlação Lote PA ↔ Certificado de Análise da MP — Decreto 12.031/2024 */}
      <Card className="mb-6 border-primary/20">
        <CardHeader>
          <CardTitle className="font-display text-sm flex items-center gap-2">
            📄 Correlação Lote PA ↔ Certificado de Análise MP — Decreto 12.031/2024
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Vinculação imediata entre o lote do Produto Acabado e o certificado de análise da Matéria-Prima recebida, para auditorias baseadas em risco.
          </p>
        </CardHeader>
        <CardContent>
          {(() => {
            const correlacoes: { lotePA: string; produto: string; mp: string; loteMP: string; fornecedor: string; certNumero: string | null; certValido: boolean | null }[] = [];
            registros.forEach(r => {
              const rec = recebimentos.find((rb: any) => rb.materia_prima === r.materia_prima && rb.lote === (r.lote_mp || ""));
              correlacoes.push({
                lotePA: r.lote_produto || "—",
                produto: r.produto,
                mp: r.materia_prima,
                loteMP: r.lote_mp || "—",
                fornecedor: r.fornecedor || "—",
                certNumero: rec?.certificado_analise_numero || null,
                certValido: rec?.certificado_analise_valido ?? null,
              });
            });
            // Deduplicate
            const unique = correlacoes.filter((c, i, arr) =>
              arr.findIndex(x => x.lotePA === c.lotePA && x.mp === c.mp && x.loteMP === c.loteMP) === i
            );
            const comCert = unique.filter(c => c.certNumero);
            const semCert = unique.filter(c => !c.certNumero);

            if (unique.length === 0) return (
              <div className="text-center py-6 text-muted-foreground">
                <p className="text-sm">Nenhuma correlação disponível.</p>
                <p className="text-xs mt-1">Cadastre registros de rastreabilidade e recebimento de MP com certificados.</p>
              </div>
            );

            return (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-lg font-bold font-display text-primary">{comCert.length}</p>
                    <p className="text-[10px] text-muted-foreground">Com Certificado</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-yellow-500/5 border border-yellow-500/20">
                    <p className="text-lg font-bold font-display text-yellow-700">{semCert.length}</p>
                    <p className="text-[10px] text-muted-foreground">Sem Certificado</p>
                  </div>
                  <div className="text-center p-2 rounded-lg bg-muted/30 border">
                    <p className="text-lg font-bold font-display">{unique.length > 0 ? Math.round((comCert.length / unique.length) * 100) : 0}%</p>
                    <p className="text-[10px] text-muted-foreground">Cobertura CA</p>
                  </div>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lote PA</TableHead><TableHead>Produto</TableHead><TableHead>MP</TableHead><TableHead>Lote MP</TableHead><TableHead>Fornecedor</TableHead><TableHead>Certificado Análise</TableHead><TableHead>Válido</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {unique.slice(0, 20).map((c, i) => (
                      <TableRow key={i} className={!c.certNumero ? "bg-yellow-500/5" : ""}>
                        <TableCell className="font-mono text-xs font-bold">{c.lotePA}</TableCell>
                        <TableCell className="text-sm">{c.produto}</TableCell>
                        <TableCell className="text-sm">{c.mp}</TableCell>
                        <TableCell className="font-mono text-xs">{c.loteMP}</TableCell>
                        <TableCell className="text-xs">{c.fornecedor}</TableCell>
                        <TableCell className="font-mono text-xs">{c.certNumero || <span className="text-yellow-600">⚠ Ausente</span>}</TableCell>
                        <TableCell>
                          {c.certValido === true ? <Badge className="bg-primary/20 text-primary text-[10px]">✓ Válido</Badge> :
                           c.certValido === false ? <Badge variant="destructive" className="text-[10px]">✗ Inválido</Badge> :
                           c.certNumero ? <Badge variant="outline" className="text-[10px]">N/A</Badge> :
                           <span className="text-xs text-muted-foreground">—</span>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {unique.length > 20 && <p className="text-xs text-muted-foreground text-center mt-2">Mostrando 20 de {unique.length} correlações.</p>}
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Análises Laboratoriais */}
      <Card className="mb-6 border-accent/20">
        <CardHeader>
          <CardTitle className="font-display text-sm flex items-center gap-2"><FlaskConical className="w-5 h-5 text-accent" /> Análises Laboratoriais Vinculadas ao Lote — IN 17/2017</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">Conformidade do controle de qualidade: análises de PA vinculadas por lote.</p>
        </CardHeader>
        <CardContent>
          {(() => {
            const lotesPA = Array.from(new Set(registros.map(r => r.lote_produto).filter(Boolean)));
            const analisesVinculadas = analisesLab.filter(a => lotesPA.some(l => a.lote === l || a.produto?.toLowerCase().includes(registros.find(r => r.lote_produto === l)?.produto?.toLowerCase() || "__")));
            if (analisesVinculadas.length === 0) return (
              <div className="text-center py-6 text-muted-foreground"><FlaskConical className="w-10 h-10 mx-auto mb-2 opacity-30" /><p className="text-sm">Nenhuma análise vinculada.</p><p className="text-xs mt-1">Cadastre análises usando o mesmo lote do PA.</p></div>
            );
            const conformes = analisesVinculadas.filter(a => a.conforme === true).length;
            const ncs = analisesVinculadas.filter(a => a.conforme === false).length;
            const pendentes = analisesVinculadas.filter(a => a.conforme === null).length;
            return (
              <>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="text-center p-2 rounded-lg bg-primary/5 border border-primary/20"><p className="text-lg font-bold font-display text-primary">{conformes}</p><p className="text-[10px] text-muted-foreground">Conformes</p></div>
                  <div className="text-center p-2 rounded-lg bg-destructive/5 border border-destructive/20"><p className="text-lg font-bold font-display text-destructive">{ncs}</p><p className="text-[10px] text-muted-foreground">Não Conformes</p></div>
                  <div className="text-center p-2 rounded-lg bg-muted/30 border"><p className="text-lg font-bold font-display">{pendentes}</p><p className="text-[10px] text-muted-foreground">Pendentes</p></div>
                </div>
                <Table>
                  <TableHeader><TableRow><TableHead>Produto</TableHead><TableHead>Lote</TableHead><TableHead>Tipo</TableHead><TableHead>Parâmetro</TableHead><TableHead>Resultado</TableHead><TableHead>Limite</TableHead><TableHead>Conforme</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {analisesVinculadas.slice(0, 15).map((a: any) => (
                      <TableRow key={a.id}>
                        <TableCell className="font-medium text-sm">{a.produto}</TableCell>
                        <TableCell className="font-mono text-xs">{a.lote || "—"}</TableCell>
                        <TableCell className="text-xs">{a.tipo_analise?.replace(/_/g, " ")}</TableCell>
                        <TableCell className="text-xs">{a.parametro || "—"}</TableCell>
                        <TableCell className="font-mono text-xs">{a.resultado || "—"} {a.unidade || ""}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{a.limite_referencia || "—"}</TableCell>
                        <TableCell>{a.conforme === true ? <Badge className="bg-primary/20 text-primary text-[10px]">OK</Badge> : a.conforme === false ? <Badge variant="destructive" className="text-[10px]">NC</Badge> : <Badge variant="outline" className="text-[10px]">Pendente</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </>
            );
          })()}
        </CardContent>
      </Card>

      {/* Tabela Principal de Rastreabilidade */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="font-display">Rastreabilidade Completa</CardTitle>
            <Input placeholder="Buscar por produto, lote, MP, fornecedor, cliente, NF..." value={busca} onChange={(e) => setBusca(e.target.value)} className="mt-2" />
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={exportBalancoMassa} disabled={registros.length === 0}><Download className="w-4 h-4 mr-1" /> Balanço Quantitativo</Button>
            <Button size="sm" variant="outline" onClick={() => setClienteReversoOpen(true)} disabled={clientesUnicos.length === 0}><GitBranch className="w-4 h-4 mr-1" /> Por Cliente</Button>
            <Button size="sm" variant="outline" onClick={() => setCertLoteOpen(true)} disabled={lotesPADisponiveis.length === 0}><Package className="w-4 h-4 mr-1" /> Certificado do Lote</Button>
            <Button size="sm" variant="outline" onClick={exportHistoricoCSV} disabled={registros.length === 0}><Download className="w-4 h-4 mr-1" /> Histórico CSV</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button></DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Registro de Rastreabilidade</DialogTitle></DialogHeader>
                <div className="space-y-4">

                  {/* ══════════ MELHORIA 1: VINCULAÇÃO AUTOMÁTICA COM RECEBIMENTO ══════════ */}
                  {recebimentoOptions.length > 0 && (
                    <div className="p-3 rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-900/20">
                      <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">⚡ Preencher a partir do Recebimento de MP</p>
                      <Select onValueChange={(val) => {
                        const opt = recebimentoOptions[parseInt(val)];
                        if (opt) preencherDeRecebimento(opt.mp, opt.lote, opt.fornecedor);
                      }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione um recebimento..." /></SelectTrigger>
                        <SelectContent>
                          {recebimentoOptions.slice(0, 50).map((r, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              {r.mp} — Lote: {r.lote || "s/lote"} — {r.fornecedor}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* ══════════ MELHORIA 2: VINCULAÇÃO AUTOMÁTICA COM PCP ══════════ */}
                  {ordensOptions.length > 0 && (
                    <div className="p-3 rounded-lg border border-purple-400 bg-purple-50 dark:bg-purple-900/20">
                      <p className="text-xs font-semibold text-purple-700 dark:text-purple-400 mb-2">⚡ Preencher PA a partir de Ordem de Produção</p>
                      <Select onValueChange={(val) => {
                        const opt = ordensOptions[parseInt(val)];
                        if (opt) preencherDeOrdem(opt.produto, opt.lote);
                      }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Selecione uma ordem..." /></SelectTrigger>
                        <SelectContent>
                          {ordensOptions.slice(0, 50).map((o, i) => (
                            <SelectItem key={i} value={i.toString()}>
                              OP {o.numero} — {o.produto} — Lote: {o.lote || "s/lote"}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* MP Section */}
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-xs font-semibold text-accent mb-2">① Matéria-Prima (MP)</p>
                    <div className="space-y-3">
                      <div><Label>Matéria-Prima *</Label><Input value={materiaPrima} onChange={e => setMateriaPrima(e.target.value)} placeholder="Ex: Milho grão" required /></div>
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Lote MP</Label><Input value={loteMP} onChange={e => setLoteMP(e.target.value)} placeholder="Ex: MC-2026-041" /></div>
                        <div><Label>Fornecedor</Label><Input value={fornecedor} onChange={e => setFornecedor(e.target.value)} placeholder="Ex: AgroCorp" /></div>
                      </div>
                    </div>
                  </div>

                  {/* PA Section */}
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs font-semibold text-primary mb-2">② Produto Acabado (PA)</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label>Produto *</Label><Input value={produto} onChange={e => setProduto(e.target.value)} placeholder="Ex: Ração Bovino Engorda" required /></div>
                      <div><Label>Lote do PA</Label><Input value={loteProduto} onChange={e => setLoteProduto(e.target.value)} placeholder="Ex: RBE-0320-01" /></div>
                    </div>
                    <div className="mt-3">
                      <Label>Espécie Destino</Label>
                      <Select value={especieDestino} onValueChange={setEspecieDestino}>
                        <SelectTrigger><SelectValue placeholder="Selecione a espécie" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="bovinos">Bovinos</SelectItem><SelectItem value="suinos">Suínos</SelectItem><SelectItem value="aves">Aves</SelectItem><SelectItem value="equinos">Equinos</SelectItem>
                          <SelectItem value="caprinos_ovinos">Caprinos/Ovinos</SelectItem><SelectItem value="peixes">Peixes / Aquicultura</SelectItem><SelectItem value="pets">Pets (Cães e Gatos)</SelectItem><SelectItem value="multiespecie">Multiespécie</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* EEB Prevention */}
                  <div className="p-3 rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-900/20">
                    <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-2">🛡️ Prevenção EEB — IN 15/2009</p>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={contemOrigemAnimal} onChange={e => setContemOrigemAnimal(e.target.checked)} className="h-4 w-4" />
                      <Label>Matéria-prima contém ingrediente de origem animal</Label>
                    </div>
                    {contemOrigemAnimal && (
                      <div className="space-y-3">
                        <div>
                          <Label>Tipo de Origem Animal</Label>
                          <Select value={tipoOrigemAnimal} onValueChange={setTipoOrigemAnimal}>
                            <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="farinha_carne_ossos">Farinha de Carne e Ossos</SelectItem><SelectItem value="farinha_penas">Farinha de Penas</SelectItem>
                              <SelectItem value="farinha_sangue">Farinha de Sangue</SelectItem><SelectItem value="farinha_peixe">Farinha de Peixe</SelectItem>
                              <SelectItem value="sebo_gordura">Sebo / Gordura Animal</SelectItem><SelectItem value="outro">Outro</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Nº SIF/DIPOA do Ingrediente (IN 17/2017) *</Label>
                          <Input value={sifDipoa} onChange={e => setSifDipoa(e.target.value)} placeholder="Ex: SIF 0001 / DIPOA 12345" />
                          <p className="text-[10px] text-muted-foreground mt-1">Obrigatório para ingredientes de origem animal — IN 17/2017, Art. 18 e IN 15/2009.</p>
                        </div>
                        {especieDestino === "bovinos" && <p className="text-xs text-destructive mt-2 font-semibold">⚠️ ATENÇÃO: Uso de farinha de carne/ossos de ruminantes é PROIBIDO para bovinos (Prevenção EEB)</p>}
                      </div>
                    )}
                  </div>

                  {/* Processo Produtivo */}
                  <div className="p-3 rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-900/20">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">⚙️ Validação do Processo — IN 04/2007</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tempo de Mistura (min)</Label>
                        <Input value={tempoMistura} onChange={e => setTempoMistura(e.target.value)} placeholder="Ex: 5" type="number" />
                        {tempoMistura && parseFloat(tempoMistura) < 3 && <p className="text-xs text-destructive mt-1">⚠️ Tempo inferior ao mínimo (3 min)</p>}
                      </div>
                      <div>
                        <Label>Teste Homogeneidade</Label>
                        <Select value={testeHomogeneidade} onValueChange={setTesteHomogeneidade}>
                          <SelectTrigger><SelectValue placeholder="Resultado" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aprovado">Aprovado (CV ≤ 10%)</SelectItem><SelectItem value="reprovado">Reprovado (CV {'>'} 10%)</SelectItem><SelectItem value="nao_realizado">Não realizado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>

                  {/* Contraprova */}
                  <div className="p-3 rounded-lg border border-green-400 bg-green-50 dark:bg-green-900/20">
                    <p className="text-xs font-semibold text-green-700 dark:text-green-400 mb-2">🧪 Retenção de Amostra de Contraprova — POP-01 (Recebimento de MP)</p>
                    <div className="flex items-center gap-2 mb-2">
                      <input type="checkbox" checked={contraprovaColetada} onChange={e => setContraprovaColetada(e.target.checked)} className="h-4 w-4" />
                      <Label className="text-xs">Amostra de contraprova coletada e retida</Label>
                    </div>
                    {contraprovaColetada && (
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <div><Label className="text-xs">Local de Armazenamento</Label><Input value={contraprovaLocal} onChange={e => setContraprovaLocal(e.target.value)} placeholder="Ex: Sala de Retenção - Prateleira A3" className="h-8 text-xs" /></div>
                        <div><Label className="text-xs">Validade da Retenção</Label><Input type="date" value={contraprovaValidade} onChange={e => setContraprovaValidade(e.target.value)} className="h-8 text-xs" /></div>
                      </div>
                    )}
                    <p className="text-[10px] text-muted-foreground mt-2">Reter por no mínimo validade do produto + 30 dias (IN 04/2007).</p>
                  </div>

                  {/* Venda Section */}
                  <div className="p-3 rounded-lg bg-muted/50 border">
                    <p className="text-xs font-semibold mb-2">③ Venda e Entrega</p>
                    <div className="space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        <div><Label>Cliente / Comprador</Label><Input value={clienteDestino} onChange={e => setClienteDestino(e.target.value)} placeholder="Ex: Fazenda Boa Vista" /></div>
                        <div><Label>Local de Entrega</Label><Input value={localEntrega} onChange={e => setLocalEntrega(e.target.value)} placeholder="Ex: Uberaba-MG" /></div>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div><Label>Data da Venda</Label><Input type="date" value={dataVenda} onChange={e => setDataVenda(e.target.value)} /></div>
                        <div><Label>Nota Fiscal</Label><Input value={notaFiscal} onChange={e => setNotaFiscal(e.target.value)} placeholder="NF-e nº" /></div>
                        <div><Label>Quantidade</Label><Input value={quantidadeVendida} onChange={e => setQuantidadeVendida(e.target.value)} placeholder="Ex: 5 ton" /></div>
                      </div>
                    </div>
                  </div>

                  <Button onClick={handleAdd} className="w-full" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar Registro
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : (
            <Tabs defaultValue="todos">
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todos ({filtered.length})</TabsTrigger>
                <TabsTrigger value="sem_venda">Sem destino ({semVenda.length})</TabsTrigger>
                <TabsTrigger value="vendidos">Vendidos ({comVenda.length})</TabsTrigger>
                <TabsTrigger value="recall">Recall ({comRecall.length})</TabsTrigger>
              </TabsList>
              {["todos", "sem_venda", "vendidos", "recall"].map(tab => {
                const data = tab === "todos" ? filtered : tab === "sem_venda" ? semVenda : tab === "vendidos" ? comVenda : comRecall;
                return (
                  <TabsContent key={tab} value={tab} className="overflow-x-auto">
                    {data.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">Nenhum registro encontrado</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Produto / Lote PA</TableHead><TableHead>MP / Lote</TableHead><TableHead>Fornecedor</TableHead>
                            <TableHead>Cliente / Destino</TableHead><TableHead>NF / Data Venda</TableHead><TableHead>Recall</TableHead><TableHead></TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.map((r) => (
                            <TableRow key={r.id} className={r.recall_ativo ? "bg-destructive/5" : ""}>
                              <TableCell><p className="font-medium text-sm">{r.produto}</p><Badge variant="outline" className="font-mono text-xs mt-1">{r.lote_produto || "—"}</Badge></TableCell>
                              <TableCell><p className="text-sm">{r.materia_prima}</p><span className="font-mono text-xs text-muted-foreground">{r.lote_mp || "—"}</span></TableCell>
                              <TableCell className="text-sm">{r.fornecedor || "—"}</TableCell>
                              <TableCell>
                                {r.cliente_destino ? (<><p className="text-sm font-medium">{r.cliente_destino}</p><span className="text-xs text-muted-foreground">{r.local_entrega || ""}</span></>)
                                : (<Button variant="outline" size="sm" className="text-xs" onClick={() => openVenda(r.id)}><Truck className="w-3 h-3 mr-1" /> Registrar Venda</Button>)}
                              </TableCell>
                              <TableCell>
                                {r.nota_fiscal ? (<><p className="text-xs font-mono">{r.nota_fiscal}</p><span className="text-xs text-muted-foreground">{r.data_venda || ""}</span></>)
                                : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                {r.recall_ativo ? (
                                  <Badge variant={r.recall_status === "concluido" ? "outline" : "destructive"} className={`text-xs ${r.recall_status === "concluido" ? "border-green-600 text-green-700" : ""}`}>
                                    {r.recall_status === "concluido" ? "✅ Encerrado" : r.recall_status === "em_andamento" ? "Em andamento" : "Iniciado"}
                                  </Badge>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                              </TableCell>
                              <TableCell>
                                <div className="flex gap-1">
                                  {!r.recall_ativo && r.cliente_destino && (
                                    <Button variant="ghost" size="sm" className="text-destructive text-xs" onClick={() => { setSelectedId(r.id); setRecallOpen(true); }}>
                                      <AlertTriangle className="w-3 h-3 mr-1" /> Recall
                                    </Button>
                                  )}
                                  {r.recall_ativo && r.recall_status !== "concluido" && (
                                    <Button variant="ghost" size="sm" className="text-green-700 text-xs" onClick={() => { setSelectedId(r.id); setRecallStatus("concluido"); setRecallMotivo(r.recall_motivo || ""); setRecallData(r.recall_data || ""); setRecallOpen(true); }}>
                                      ✅ Encerrar
                                    </Button>
                                  )}
                                  {r.cliente_destino && <Button variant="ghost" size="sm" className="text-xs" onClick={() => openVenda(r.id)}>Editar venda</Button>}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          )}
        </CardContent>
      </Card>

      {/* Recall Dialog — com encerramento e destino de reprovados */}
      <Dialog open={recallOpen} onOpenChange={setRecallOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-destructive flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Registrar / Encerrar Recall — POP-09</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedId && (() => {
              const rec = registros.find(r => r.id === selectedId);
              return rec && rec.recall_ativo ? (
                <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-xs">
                  <p className="font-semibold text-destructive mb-1">Recall em andamento</p>
                  <p><strong>Produto:</strong> {rec.produto} | <strong>Lote:</strong> {rec.lote_produto || "—"}</p>
                  <p><strong>Motivo:</strong> {rec.recall_motivo}</p>
                  <p><strong>Status atual:</strong> {rec.recall_status}</p>
                </div>
              ) : null;
            })()}
            <div><Label>Motivo do Recall *</Label><Textarea value={recallMotivo} onChange={e => setRecallMotivo(e.target.value)} placeholder="Descreva o problema encontrado..." required /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><Label>Data do Recall</Label><Input type="date" value={recallData} onChange={e => setRecallData(e.target.value)} /></div>
              <div>
                <Label>Status</Label>
                <Select value={recallStatus} onValueChange={setRecallStatus}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="iniciado">Iniciado</SelectItem>
                    <SelectItem value="em_andamento">Em andamento</SelectItem>
                    <SelectItem value="quarentena">🔒 Quarentena (Segregação)</SelectItem>
                    <SelectItem value="retido">⛔ Retido (Produto Não Conforme)</SelectItem>
                    <SelectItem value="aguardando_analise">🔬 Aguardando Análise</SelectItem>
                    <SelectItem value="concluido">Concluído / Encerrado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Encerramento do Recall — Destino dos produtos */}
            {recallStatus === "concluido" && (
              <div className="p-3 rounded-lg border-2 border-green-600/30 bg-green-50 dark:bg-green-900/10 space-y-3">
                <p className="text-xs font-semibold text-green-800 flex items-center gap-1">
                  ✅ Encerramento do Recall — Registro obrigatório do destino (POP-09 / Decreto 12.031/2024)
                </p>
                <div>
                  <Label className="text-xs">Destino do produto reprovado/devolvido *</Label>
                  <Select value={recallMotivo.includes("[DESTINO:") ? "" : ""} onValueChange={(v) => {
                    setRecallMotivo(prev => {
                      const base = prev.replace(/\[DESTINO:.*?\]/g, "").trim();
                      return `${base} [DESTINO: ${v}]`;
                    });
                  }}>
                    <SelectTrigger><SelectValue placeholder="Selecione o destino" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Retrabalho (reprocessamento)">Retrabalho (reprocessamento)</SelectItem>
                      <SelectItem value="Descarte controlado (aterro/incineração)">Descarte controlado (aterro/incineração)</SelectItem>
                      <SelectItem value="Devolução ao fornecedor">Devolução ao fornecedor</SelectItem>
                      <SelectItem value="Doação (produto apto)">Doação (produto apto)</SelectItem>
                      <SelectItem value="Recolhido e segregado (aguardando análise)">Recolhido e segregado (aguardando análise)</SelectItem>
                      <SelectItem value="Venda com desconto (produto apto)">Venda com desconto (produto apto)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Quantidade recolhida</Label>
                  <Input placeholder="Ex: 2.500 kg / 50 sacos de 50kg" onChange={(e) => {
                    setRecallMotivo(prev => {
                      const base = prev.replace(/\[QTD_RECOLHIDA:.*?\]/g, "").trim();
                      return `${base} [QTD_RECOLHIDA: ${e.target.value}]`;
                    });
                  }} />
                </div>
                <div>
                  <Label className="text-xs">Responsável pelo encerramento</Label>
                  <Input placeholder="Nome completo + cargo" onChange={(e) => {
                    setRecallMotivo(prev => {
                      const base = prev.replace(/\[RESP_ENCERR:.*?\]/g, "").trim();
                      return `${base} [RESP_ENCERR: ${e.target.value}]`;
                    });
                  }} />
                </div>
                <p className="text-[10px] text-muted-foreground">
                  O encerramento do recall exige registro do destino final dos produtos, quantidade recolhida e responsável,
                  conforme Art. 55 da IN 17/2017 e fiscalização do MAPA (Decreto 12.031/2024).
                </p>
              </div>
            )}

            {/* Assinatura Digital */}
            <div className="p-3 rounded-lg border bg-muted/30 space-y-2">
              <p className="text-xs font-semibold flex items-center gap-1">✍️ Assinatura Digital — MP 2.200-2/2001</p>
              <div>
                <Label className="text-xs">Nome completo do responsável</Label>
                <Input placeholder="Assinatura digital do registro" onChange={(e) => {
                  setRecallMotivo(prev => {
                    const base = prev.replace(/\[ASSINATURA:.*?\]/g, "").trim();
                    return `${base} [ASSINATURA: ${e.target.value} — ${new Date().toLocaleString("pt-BR")}]`;
                  });
                }} />
              </div>
              <p className="text-[10px] text-muted-foreground">
                Registro com validade jurídica conforme MP 2.200-2/2001. Data/hora registradas automaticamente.
              </p>
            </div>

            <Button onClick={handleRecall} className="w-full" variant="destructive" disabled={saving || !recallMotivo}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} 
              {recallStatus === "concluido" ? "Encerrar Recall" : "Confirmar Recall"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Venda Dialog */}
      <Dialog open={vendaOpen} onOpenChange={setVendaOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Truck className="w-5 h-5" /> Registrar Venda / Destino do PA</DialogTitle></DialogHeader>
          <div className="space-y-4">
            {selectedId && (() => {
              const rec = registros.find(r => r.id === selectedId);
              return rec ? (
                <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-xs">
                  <p><strong>Produto:</strong> {rec.produto}</p><p><strong>Lote PA:</strong> {rec.lote_produto || "—"}</p>
                  {rec.lote_produto && <p className="text-muted-foreground mt-1">Venda aplicada a todos os registros deste lote ({registros.filter(r => r.lote_produto === rec.lote_produto).length} vínculos MP)</p>}
                </div>
              ) : null;
            })()}
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Cliente / Comprador *</Label><Input value={vendaCliente} onChange={e => setVendaCliente(e.target.value)} placeholder="Ex: Fazenda Boa Vista" /></div>
              <div><Label>Local de Entrega</Label><Input value={vendaLocal} onChange={e => setVendaLocal(e.target.value)} placeholder="Ex: Uberaba-MG" /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div><Label>Data da Venda</Label><Input type="date" value={vendaData} onChange={e => setVendaData(e.target.value)} /></div>
              <div><Label>Nota Fiscal</Label><Input value={vendaNF} onChange={e => setVendaNF(e.target.value)} placeholder="NF-e nº" /></div>
              <div><Label>Quantidade</Label><Input value={vendaQtd} onChange={e => setVendaQtd(e.target.value)} placeholder="Ex: 5 ton" /></div>
            </div>
            <Button onClick={handleVenda} className="w-full" disabled={saving || !vendaCliente}>{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Salvar Venda</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Rastreabilidade Reversa por Cliente */}
      <Dialog open={clienteReversoOpen} onOpenChange={setClienteReversoOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><GitBranch className="w-5 h-5 text-primary" /> Rastreabilidade Reversa — Por Cliente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Liste todos os lotes entregues a um cliente específico — essencial para recall direcionado e auditorias.</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Cliente</Label>
                <Select value={clienteReversoSelecionado} onValueChange={setClienteReversoSelecionado}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente..." /></SelectTrigger>
                  <SelectContent>
                    {clientesUnicos.map(c => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Período (dias)</Label>
                <Input type="number" min="1" value={clienteReversoDias} onChange={e => setClienteReversoDias(e.target.value)} />
              </div>
            </div>
            {clienteReversoSelecionado && (
              <>
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-sm font-semibold">{lotesPorCliente.length} lote(s) encontrado(s)</p>
                  <p className="text-xs text-muted-foreground">Total expedido: {fmtKg(lotesPorCliente.reduce((s, l) => s + l.qtdTotal, 0))} kg • Lotes em recall: {lotesPorCliente.filter(l => l.recall).length}</p>
                </div>
                <div className="border rounded-lg max-h-[400px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Produto</TableHead>
                        <TableHead>Lote PA</TableHead>
                        <TableHead>NFs</TableHead>
                        <TableHead>Qtd (kg)</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {lotesPorCliente.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground">Sem registros no período</TableCell></TableRow>
                      ) : lotesPorCliente.map((l, i) => (
                        <TableRow key={i} className={l.recall ? "bg-destructive/10" : ""}>
                          <TableCell className="text-xs">{l.produto}</TableCell>
                          <TableCell className="text-xs font-mono">{l.lote}</TableCell>
                          <TableCell className="text-xs">{Array.from(l.nfs).join(", ") || "—"}</TableCell>
                          <TableCell className="text-xs">{fmtKg(l.qtdTotal)}</TableCell>
                          <TableCell>{l.recall ? <Badge variant="destructive">RECALL</Badge> : <Badge variant="outline">OK</Badge>}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <Button onClick={exportClienteReversoCSV} disabled={lotesPorCliente.length === 0} className="w-full">
                  <Download className="w-4 h-4 mr-2" /> Exportar CSV
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Certificado de Rastreabilidade do Lote */}
      <Dialog open={certLoteOpen} onOpenChange={setCertLoteOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Package className="w-5 h-5 text-primary" /> Certificado de Rastreabilidade do Lote</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">Documento formal por lote PA: composição, fornecedores, contraprova, destinos e assinatura RT. Atende Decreto 12.031/2024 (Art. 18) e clientes/auditores que solicitam comprovante.</p>
            <div>
              <Label>Lote PA</Label>
              <Select value={certLote} onValueChange={setCertLote}>
                <SelectTrigger><SelectValue placeholder="Selecione um lote..." /></SelectTrigger>
                <SelectContent>
                  {lotesPADisponiveis.map(l => (<SelectItem key={l} value={l}>{l}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={gerarCertificadoLote} disabled={!certLote} className="w-full">
              <Download className="w-4 h-4 mr-2" /> Gerar Certificado (PDF)
            </Button>
            <p className="text-[10px] text-muted-foreground">O certificado abrirá em nova janela com diálogo de impressão. Salve como PDF.</p>
          </div>
        </DialogContent>
      </Dialog>
      {/* Mapa de Rastreabilidade (Planilha 9.1) — Invisível para Impressão */}
      <div className="hidden print:block" id="mapa-rastreabilidade-print">
        <div className="p-8 bg-white text-black min-w-[210mm]">
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-6">
            <div>
              <h1 className="text-xl font-bold uppercase">Planilha 9.1 — Mapa de Rastreabilidade (POP 05)</h1>
              <p className="text-sm font-mono mt-1">Lote PA: <strong>{testeResult?.lote}</strong></p>
              <p className="text-sm">Produto: <strong>{testeResult?.produto}</strong></p>
            </div>
            <div className="text-right">
              <p className="text-sm font-bold">{empresaAtiva?.nome || "BPF DIGITAL"}</p>
              <p className="text-[10px] text-gray-500 italic">Data do Teste: {new Date().toLocaleDateString('pt-BR')}</p>
              <p className="text-[10px] text-gray-500 italic">Tempo de Resposta: {testeResult?.tempoSegundos} segundos</p>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase bg-gray-100 p-2 mb-2 border">1. Montante (Matérias-Primas / Origem)</h2>
            <Table className="border border-black">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="border border-black text-[10px] font-bold h-8">Ingrediente / MP</TableHead>
                  <TableHead className="border border-black text-[10px] font-bold h-8">Lote MP</TableHead>
                  <TableHead className="border border-black text-[10px] font-bold h-8">Fornecedor</TableHead>
                  <TableHead className="border border-black text-[10px] font-bold h-8 text-center">NF Entrada</TableHead>
                  <TableHead className="border border-black text-[10px] font-bold h-8 text-center">Laudo / CA</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testeResult?.montante.map((m, i) => (
                  <TableRow key={i}>
                    <TableCell className="border border-black py-1 text-[10px]">{m.materia_prima}</TableCell>
                    <TableCell className="border border-black py-1 text-[10px] font-mono">{m.lote_mp}</TableCell>
                    <TableCell className="border border-black py-1 text-[10px]">{m.fornecedor}</TableCell>
                    <TableCell className="border border-black py-1 text-[10px] text-center">{m.nota_fiscal || "___"}</TableCell>
                    <TableCell className="border border-black py-1 text-[10px] text-center">{m.laudo_url ? "SIM ✓" : "NÃO ✗"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase bg-gray-100 p-2 mb-2 border">2. Jusante (Destinos / Clientes)</h2>
            <Table className="border border-black">
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="border border-black text-[10px] font-bold h-8">Cliente / Destinatário</TableHead>
                  <TableHead className="border border-black text-[10px] font-bold h-8">Local de Entrega</TableHead>
                  <TableHead className="border border-black text-[10px] font-bold h-8 text-center">NF Saída</TableHead>
                  <TableHead className="border border-black text-[10px] font-bold h-8 text-center">Data Venda</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {testeResult?.jusante.map((j, i) => (
                  <TableRow key={i}>
                    <TableCell className="border border-black py-1 text-[10px]">{j.cliente}</TableCell>
                    <TableCell className="border border-black py-1 text-[10px]">{j.local}</TableCell>
                    <TableCell className="border border-black py-1 text-[10px] text-center font-mono">{j.nf}</TableCell>
                    <TableCell className="border border-black py-1 text-[10px] text-center">{j.data_venda}</TableCell>
                  </TableRow>
                ))}
                {testeResult?.jusante.length === 0 && (
                  <TableRow><TableCell colSpan={4} className="border border-black py-4 text-center text-[10px] italic">Produto em estoque / Nenhuma venda registrada</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-2 gap-12 mt-12">
            <div className="text-center border-t border-black pt-2">
              <p className="text-[10px] font-bold">Responsável Técnico / Qualidade</p>
              <p className="text-[9px] text-gray-500 mt-4">Assinatura / Carimbo</p>
            </div>
            <div className="text-center border-t border-black pt-2">
              <p className="text-[10px] font-bold">Data da Validação</p>
              <p className="text-[9px] text-gray-500 mt-4">____/____/____</p>
            </div>
          </div>

          <div className="mt-8 text-[8px] text-gray-400 italic text-center">
            Este mapa de rastreabilidade foi gerado automaticamente e atende ao Art. 18 do Decreto 12.031/2024 e ao POP 05.
          </div>
        </div>
      </div>
      <div className="mt-6"><AmostrasRetencaoSection /></div>
    </>
  );
}
