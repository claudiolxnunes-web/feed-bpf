import { useState, useEffect } from "react";
import { ORIENTACAO_CONTRAPROVA } from "@/config/baseLegal";
import {
  Factory,
  Plus,
  Loader2,
  AlertTriangle,
  Trash2,
  FileWarning,
  Download,
  Pencil,
  X,
  Lock as LockIcon,
} from "lucide-react";
import { corrigirViaNC } from "@/utils/correcaoNC";
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
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProdRow {
  id: string;
  data: string;
  produto: string;
  lote: string | null;
  operador: string | null;
  tempo_mistura: string | null;
  quantidade: string | null;
  status?: string | null;
  // Campos de Flush
  flush_realizado?: boolean;
  flush_tipo?: string;
  flush_volume?: string;
  flush_produto_anterior?: string;
  // Campos de Contraprova
  contraprova_retida?: boolean;
  contraprova_local?: string;
  contraprova_validade?: string;
  contraprova_quantidade?: string;
}

const TEMPO_MISTURA_MINIMO = 3; // minutos — padrão baseLegal: bpf_geral

export default function Producao() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const navigate = useNavigate();
  const [items, setItems] = useState<ProdRow[]>([]);
  const [produtosCadastrados, setProdutosCadastrados] = useState<{ id: string; nome: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const [produto, setProduto] = useState("");
  const [lote, setLote] = useState("");
  const [operador, setOperador] = useState("");
  const [tempoMistura, setTempoMistura] = useState("");
  const [quantidade, setQuantidade] = useState("");

  // Sobras / Vassoura
  const [houveSobra, setHouveSobra] = useState(false);
  const [qtdSobra, setQtdSobra] = useState("");
  const [destinoSobra, setDestinoSobra] = useState("reprocesso");
  const [obsSobra, setObsSobra] = useState("");

  // Flush / Limpeza entre lotes — IN 15/2009
  const [realizouFlush, setRealizouFlush] = useState(false);
  const [tipoLimpeza, setTipoLimpeza] = useState("flush_inerte");
  const [volumeFlush, setVolumeFlush] = useState("");
  const [produtoAnterior, setProdutoAnterior] = useState("");
  const [prodAnteriorMedicado, setProdAnteriorMedicado] = useState(false);
  const [obsFlush, setObsFlush] = useState("");

  // Contraprova
  const [cpRetida, setCpRetida] = useState(false);
  const [cpQtd, setCpQtd] = useState("");
  const [cpLocal, setCpLocal] = useState("");
  const [cpVal, setCpVal] = useState("");

  // --- Persistência de rascunho (sessionStorage) ---
  const DRAFT_KEY = "draft_producao_form";

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      setProduto(d.produto || "");
      setLote(d.lote || "");
      setOperador(d.operador || "");
      setTempoMistura(d.tempoMistura || "");
      setQuantidade(d.quantidade || "");
      setHouveSobra(!!d.houveSobra);
      setQtdSobra(d.qtdSobra || "");
      setDestinoSobra(d.destinoSobra || "reprocesso");
      setObsSobra(d.obsSobra || "");
      setRealizouFlush(!!d.realizouFlush);
      setTipoLimpeza(d.tipoLimpeza || "flush_inerte");
      setVolumeFlush(d.volumeFlush || "");
      setProdutoAnterior(d.produtoAnterior || "");
      setProdAnteriorMedicado(!!d.prodAnteriorMedicado);
      setObsFlush(d.obsFlush || "");
      setCpRetida(!!d.cpRetida);
      setCpQtd(d.cpQtd || "");
      setCpLocal(d.cpLocal || "");
      setCpVal(d.cpVal || "");
    } catch {
      /* rascunho inválido — ignora */
    }
  }, []);

  useEffect(() => {
    if (editId) return; // edições não sobrescrevem o rascunho de novo registro
    try {
      sessionStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          produto,
          lote,
          operador,
          tempoMistura,
          quantidade,
          houveSobra,
          qtdSobra,
          destinoSobra,
          obsSobra,
          realizouFlush,
          tipoLimpeza,
          volumeFlush,
          produtoAnterior,
          prodAnteriorMedicado,
          obsFlush,
          cpRetida,
          cpQtd,
          cpLocal,
          cpVal,
        }),
      );
    } catch {
      /* storage cheio — ignora */
    }
  }, [
    editId,
    produto,
    lote,
    operador,
    tempoMistura,
    quantidade,
    houveSobra,
    qtdSobra,
    destinoSobra,
    obsSobra,
    realizouFlush,
    tipoLimpeza,
    volumeFlush,
    produtoAnterior,
    prodAnteriorMedicado,
    obsFlush,
    cpRetida,
    cpQtd,
    cpLocal,
    cpVal,
  ]);

  const limparFormulario = () => {
    setProduto("");
    setLote("");
    setOperador("");
    setTempoMistura("");
    setQuantidade("");
    setHouveSobra(false);
    setQtdSobra("");
    setDestinoSobra("reprocesso");
    setObsSobra("");
    setRealizouFlush(false);
    setTipoLimpeza("flush_inerte");
    setVolumeFlush("");
    setProdutoAnterior("");
    setProdAnteriorMedicado(false);
    setObsFlush("");
    setCpRetida(false);
    setCpQtd("");
    setCpLocal("");
    setCpVal("");
    sessionStorage.removeItem(DRAFT_KEY);
  };

  // Remove os apêndicos de flush/contraprova que foram concatenados na coluna
  // quantidade em salvamentos anteriores, evitando duplicação em re-edições.
  const extrairQuantidadeBase = (valor: string | null | undefined): string => {
    if (!valor) return "";
    return valor
      .replace(/\s*\|\s*\[CONTRAPROVA\].*?$/, "")
      .replace(/\s*\|\s*Sobra:\s*[^|]*?$/, "")
      .trim();
  };

  const abrirEdicao = (p: ProdRow) => {
    setEditId(p.id);
    setProduto(p.produto || "");
    setLote(p.lote || "");
    setOperador(p.operador || "");
    setTempoMistura((p.tempo_mistura || "").replace(/[^\d.,]/g, "").replace(",", "."));
    setQuantidade(extrairQuantidadeBase(p.quantidade));

    // Restaurar Flush
    setRealizouFlush(!!p.flush_realizado);
    setTipoLimpeza(p.flush_tipo || "flush_inerte");
    setVolumeFlush(p.flush_volume || "");
    setProdutoAnterior(p.flush_produto_anterior || "");

    // Restaurar Contraprova
    setCpRetida(!!p.contraprova_retida);
    setCpQtd(p.contraprova_quantidade || "");
    setCpLocal(p.contraprova_local || "");
    setCpVal(p.contraprova_validade || "");

    setOpen(true);
  };

  // Registros de produção não são excluídos (baseLegal: decreto_base) — correção via NC

  const fetchProdutos = async () => {
    try {
      let q = supabase.from("produtos").select("id, nome").eq("status", "ativo");
      if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      setProdutosCadastrados(data || []);
    } catch (err) {
      console.error("[Producao] fetchProdutos", err);
      toast.error("Erro ao carregar produtos cadastrados");
    }
  };

  const gerarLoteAutomatico = async (nomeProduto: string) => {
    if (!nomeProduto) return;

    const hoje = new Date();
    const prefixo = `${hoje.getFullYear()}${(hoje.getMonth() + 1).toString().padStart(2, "0")}${hoje.getDate().toString().padStart(2, "0")}`;

    // Buscar último lote do dia para este produto
    let q = supabase
      .from("producao")
      .select("lote")
      .ilike("lote", `%${prefixo}%`)
      .order("created_at", { ascending: false })
      .limit(1);

    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);

    const { data } = await q;
    let sequencial = 1;

    if (data && data.length > 0 && data[0].lote) {
      const parts = data[0].lote.split("-");
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) sequencial = lastSeq + 1;
    }

    // Extrair um código do produto (3 primeiras letras maiúsculas)
    const codigoProd = nomeProduto.substring(0, 3).toUpperCase();
    setLote(`${codigoProd}-${prefixo}-${sequencial.toString().padStart(3, "0")}`);
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from("producao").select("*").order("data", { ascending: false });
      if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      setItems(data || []);
    } catch (err) {
      console.error("[Producao] fetchData", err);
      toast.error("Erro ao carregar registros de produção");
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchProdutos();
  }, [user, empresaAtiva]);

  const tempoMisturaValido = () => {
    const min = parseFloat(tempoMistura);
    return !isNaN(min) && min >= TEMPO_MISTURA_MINIMO;
  };

  const handleAdd = async () => {
    if (!produto || !user) return;
    if (tempoMistura && !tempoMisturaValido()) {
      toast.error(`⚠️ Tempo de mistura mínimo: ${TEMPO_MISTURA_MINIMO} min para garantir homogeneidade.`);
      return;
    }
    setSaving(true);

    const obsCompleta = [
      houveSobra
        ? `[SOBRA/VASSOURA] Qtd: ${qtdSobra || "N/I"} kg | Destino: ${destinoSobra === "reprocesso" ? "Reprocesso" : destinoSobra === "descarte" ? "Descarte (resíduo)" : destinoSobra === "devolucao" ? "Devolução ao silo" : "Outro"} | ${obsSobra}`
        : "",
      realizouFlush
        ? `[FLUSH/LIMPEZA ENTRE LOTES — IN 15/2009] Tipo: ${tipoLimpeza === "flush_inerte" ? "Flushing c/ inerte" : tipoLimpeza === "limpeza_fisica" ? "Limpeza física (varrição)" : tipoLimpeza === "aspiracao" ? "Aspiração" : "Outro"} | Volume: ${volumeFlush || "N/I"} kg | Prod. anterior: ${produtoAnterior || "N/I"} | Medicado: ${prodAnteriorMedicado ? "SIM ⚠️" : "Não"} | ${obsFlush}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n")
      .trim();

    // Contraprova
    const cpRetida = !!(cpQtd || cpLocal);

    // Sempre reconstrói a partir da quantidade base, descartando apêndices
    // eventualmente presentes no estado por re-edições anteriores.
    const quantidadeBase = extrairQuantidadeBase(quantidade);
    let quantidadeFinal = quantidadeBase
      ? `${quantidadeBase}${obsCompleta ? ` | Sobra: ${qtdSobra || "?"} kg` : ""}`
      : "";
    if (cpRetida) {
      quantidadeFinal += ` | [CONTRAPROVA] ${cpQtd} em ${cpLocal}`;
    }

    const payload = {
      produto,
      lote,
      operador,
      tempo_mistura: tempoMistura ? `${tempoMistura} min` : "",
      quantidade: quantidadeFinal,
      contraprova_retida: cpRetida,
      contraprova_local: cpLocal,
      contraprova_validade: cpVal,
      contraprova_quantidade: cpQtd,
      // Campos de flush persistidos no DB — IN 15/2009
      flush_realizado: realizouFlush,
      flush_tipo: realizouFlush ? tipoLimpeza : "",
      flush_volume: realizouFlush ? volumeFlush : "",
      flush_produto_anterior: realizouFlush ? produtoAnterior : "",
    };

    const { error } = editId
      ? await (supabase.from("producao") as any).update(payload).eq("id", editId)
      : await supabase.from("producao").insert({
          user_id: user.id,
          empresa_id: empresaAtiva?.id || null,
          ...payload,
        } as any);

    if (error) toast.error(editId ? "Erro ao atualizar" : "Erro ao salvar");
    else {
      toast.success(editId ? "Registro atualizado!" : "Registro salvo!");
      registrarAuditLog({
        userId: user.id,
        empresaId: empresaAtiva?.id,
        tabela: "producao",
        registroId: editId || undefined,
        acao: editId ? "editar" : "criar",
        dadosNovos: { produto, lote, operador, flush_realizado: realizouFlush, flush_tipo: tipoLimpeza },
      });
      setOpen(false);
      setEditId(null);
      limparFormulario();
      fetchData();
    }
    setSaving(false);
  };

  const exportCSV = async () => {
    const headers = ["Data", "Produto", "Lote", "Operador", "Tempo Mistura", "Quantidade"];
    const rows = items.map((r) => [
      r.data,
      r.produto,
      r.lote || "",
      r.operador || "",
      r.tempo_mistura || "",
      r.quantidade || "",
    ]);
    let csv = [headers.join(";"), ...rows.map((r) => r.join(";"))].join("\n");
    const nomeArquivo = `producao_${new Date().toISOString().split("T")[0]}.csv`;
    const hash = await gerarHashIntegridade(csv);
    csv = adicionarRodapeIntegridade(csv, hash, user?.email || "sistema", nomeArquivo);
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = nomeArquivo;
    link.click();
  };

  return (
    <>
      <PageHeader
        icon={Factory}
        title="POP 05 - Controle de Produção"
        description="Registro de fabricação, tempo de mistura e sobras"
        orientacaoModuloId="producao"
       assuntoBaseLegal="bpf_geral" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display">{items.length}</p>
            <p className="text-xs text-muted-foreground">Total registros</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-primary">
              {new Set(items.map((i) => i.lote).filter(Boolean)).size}
            </p>
            <p className="text-xs text-muted-foreground">Lotes produzidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-muted-foreground">
              {new Set(items.map((i) => i.produto)).size}
            </p>
            <p className="text-xs text-muted-foreground">Produtos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-accent">
              {items.filter((i) => i.quantidade?.includes("Sobra")).length}
            </p>
            <p className="text-xs text-muted-foreground">C/ Sobras</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display">Registros de Produção</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={items.length === 0}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Dialog
              open={open}
              onOpenChange={(v) => {
                setOpen(v);
                if (!v) setEditId(null);
              }}
            >
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Novo Registro
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? "Editar Registro de Produção" : "Novo Registro de Produção"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <div>
                    <Label>Produto *</Label>
                    <Select
                      value={produto}
                      onValueChange={(val) => {
                        setProduto(val);
                        gerarLoteAutomatico(val);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o produto..." />
                      </SelectTrigger>
                      <SelectContent>
                        {produtosCadastrados.map((p) => (
                          <SelectItem key={p.id} value={p.nome}>
                            {p.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Lote</Label>
                      <Input value={lote} onChange={(e) => setLote(e.target.value)} placeholder="Ex: L2026-0321" />
                    </div>
                    <div>
                      <Label>Operador</Label>
                      <Input value={operador} onChange={(e) => setOperador(e.target.value)} placeholder="Nome" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Tempo de Mistura (min) *</Label>
                      <Input
                        value={tempoMistura}
                        onChange={(e) => setTempoMistura(e.target.value)}
                        placeholder={`Mínimo ${TEMPO_MISTURA_MINIMO} min`}
                        type="number"
                        min={TEMPO_MISTURA_MINIMO}
                      />
                      {tempoMistura && !tempoMisturaValido() && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Abaixo do mínimo ({TEMPO_MISTURA_MINIMO} min) — risco de
                          falta de homogeneidade
                        </p>
                      )}
                      {tempoMistura && tempoMisturaValido() && (
                        <p className="text-xs text-primary mt-1">✓ Tempo adequado para homogeneidade</p>
                      )}
                    </div>
                    <div>
                      <Label>Quantidade produzida (kg)</Label>
                      <Input
                        value={quantidade}
                        onChange={(e) => setQuantidade(e.target.value)}
                        placeholder="Ex: 2000"
                      />
                    </div>
                  </div>

                  {/* Flush / Limpeza entre Lotes — IN 15/2009 (Carryover) */}
                  <div className="p-3 rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-900/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
 🧹 Limpeza / Flush entre Lotes </p>
                      <Switch checked={realizouFlush} onCheckedChange={setRealizouFlush} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Registre a limpeza/varrição/flushing realizada entre lotes para mitigar arraste (carryover) de
                      medicamentos e aditivos restritos.
                    </p>
                    {realizouFlush && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Tipo de Limpeza</Label>
                            <Select value={tipoLimpeza} onValueChange={setTipoLimpeza}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="flush_inerte">Flushing com inerte (milho, farelo)</SelectItem>
                                <SelectItem value="limpeza_fisica">Limpeza física (varrição/raspagem)</SelectItem>
                                <SelectItem value="aspiracao">Aspiração mecânica</SelectItem>
                                <SelectItem value="lavagem">Lavagem úmida</SelectItem>
                                <SelectItem value="outro">Outro</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div>
                            <Label>Volume/Peso do Flush (kg)</Label>
                            <Input
                              value={volumeFlush}
                              onChange={(e) => setVolumeFlush(e.target.value)}
                              placeholder="Ex: 500"
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Produto Anterior na Linha</Label>
                            <Input
                              value={produtoAnterior}
                              onChange={(e) => setProdutoAnterior(e.target.value)}
                              placeholder="Ex: Ração Frango Engorda c/ Salinomicina"
                            />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input
                              type="checkbox"
                              checked={prodAnteriorMedicado}
                              onChange={(e) => setProdAnteriorMedicado(e.target.checked)}
                              className="h-4 w-4"
                            />
                            <Label className="text-sm">Produto anterior continha medicamento/ionóforo</Label>
                          </div>
                        </div>
                        {prodAnteriorMedicado && (
                          <div className="p-2 rounded border border-destructive/30 bg-destructive/10">
                            <p className="text-xs text-destructive font-semibold">
 ⚠️ Atenção: Flushing obrigatório — arraste máximo permitido: &lt; 1% ionóforos, &lt; 3%
 medicados.
 </p>
                          </div>
                        )}
                        <div>
                          <Label>Observações do Flush</Label>
                          <Input
                            value={obsFlush}
                            onChange={(e) => setObsFlush(e.target.value)}
                            placeholder="Destino do material de flushing, análise de arraste, etc."
                          />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Sobras / Vassoura de Produção 
 </p>
                      <Switch checked={houveSobra} onCheckedChange={setHouveSobra} />
                    </div>
                    {houveSobra && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Quantidade sobra (kg)</Label>
                            <Input
                              value={qtdSobra}
                              onChange={(e) => setQtdSobra(e.target.value)}
                              placeholder="Ex: 50"
                            />
                          </div>
                          <div>
                            <Label>Destino</Label>
                            <Select value={destinoSobra} onValueChange={setDestinoSobra}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="reprocesso">Reprocesso (mesmo produto)</SelectItem>
                                <SelectItem value="descarte">Descarte como resíduo</SelectItem>
                                <SelectItem value="devolucao">Devolução ao silo</SelectItem>
                                <SelectItem value="outro">Outro destino</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                        <div>
                          <Label>Observações da sobra</Label>
                          <Input
                            value={obsSobra}
                            onChange={(e) => setObsSobra(e.target.value)}
                            placeholder="Detalhes do reprocesso ou descarte"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Retenção de Amostra de Contraprova — autocontrole (baseLegal: amostra_arquivo) */}
                  <div className="p-3 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/10 space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      🧪 Retenção de Amostra (Contraprova)
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {ORIENTACAO_CONTRAPROVA}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <Label>Quantidade retida</Label>
                        <Input value={cpQtd} onChange={(e) => setCpQtd(e.target.value)} placeholder="Ex: 500g" />
                      </div>
                      <div>
                        <Label>Local armazenamento</Label>
                        <Input
                          value={cpLocal}
                          onChange={(e) => setCpLocal(e.target.value)}
                          placeholder="Ex: Sala de amostras"
                        />
                      </div>
                      <div>
                        <Label>Validade retenção</Label>
                        <Input
                          value={cpVal}
                          onChange={(e) => setCpVal(e.target.value)}
                          placeholder="Ex: Validade +30 dias"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {editId && (
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => {
                          setOpen(false);
                          setEditId(null);
                          limparFormulario();
                        }}
                      >
                        <X className="w-4 h-4 mr-1" /> Cancelar
                      </Button>
                    )}
                    <Button onClick={handleAdd} className="flex-1" disabled={saving || !produto}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      {editId ? "Salvar alterações" : "Salvar"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhum registro. Use também o módulo PCP para ordens detalhadas.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Lote</TableHead>
                  <TableHead>Operador</TableHead>
                  <TableHead>Tempo Mistura</TableHead>
                  <TableHead>Quantidade</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="whitespace-nowrap">{p.data}</TableCell>
                    <TableCell>{p.produto}</TableCell>
                    <TableCell className="font-mono text-sm">{p.lote}</TableCell>
                    <TableCell>{p.operador}</TableCell>
                    <TableCell>
                      {p.tempo_mistura ? (
                        <span
                          className={
                            parseFloat(p.tempo_mistura) < TEMPO_MISTURA_MINIMO ? "text-destructive font-medium" : ""
                          }
                        >
                          {p.tempo_mistura}
                        </span>
                      ) : (
                        "—"
                      )}
                    </TableCell>
                    <TableCell>{p.quantidade || "—"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {p.status === "concluido" || p.status === "assinado" ? (
                        <div className="flex justify-end gap-1">
                          <Badge
                            variant="outline"
                            className="h-7 px-2 border-amber-200 bg-amber-50 text-amber-700 text-[10px] gap-1"
                          >
                            <LockIcon className="w-3 h-3" /> Assinado
                          </Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-primary"
                            onClick={() => navigate("/nao-conformidades")}
                            title="Abrir NC corretiva"
                          >
                            <AlertTriangle className="w-4 h-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => abrirEdicao(p)} title="Editar registro">
                            <Pencil className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1 text-xs"
                            title="Registros não são excluídos — correção via Não Conformidade"
                            onClick={() =>
                              corrigirViaNC(navigate, {
                                tabela: "producao",
                                registroId: p.id,
                                descricao: `Produção — produto: ${p.produto} — lote: ${p.lote || "—"}`,
                              })
                            }
                          >
                            <FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p>
              <strong>💡 Dica:</strong> Para registros detalhados com fórmulas, batidas e rastreabilidade de lotes, use
              o módulo <strong>PCP / Ordens de Produção</strong>.
            </p>
            <p>
              <strong>⏱️ Homogeneidade:</strong> Tempo mínimo de mistura de {TEMPO_MISTURA_MINIMO} min. Registros abaixo deste valor são sinalizados.
            </p>
            <p>
              <strong>🧹 Sobras:</strong> Registre todas as sobras/vassouras e seu destino (reprocesso ou descarte).
 </p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
