import { useState, useEffect } from "react";
import { Factory, Plus, Loader2, AlertTriangle, Trash2, Download } from "lucide-react";
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

interface ProdRow {
  id: string;
  data: string;
  produto: string;
  lote: string | null;
  operador: string | null;
  tempo_mistura: string | null;
  quantidade: string | null;
}

const TEMPO_MISTURA_MINIMO = 3; // minutos — padrão IN 04/2007

export default function Producao() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [items, setItems] = useState<ProdRow[]>([]);
  const [produtosCadastrados, setProdutosCadastrados] = useState<{id: string, nome: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);

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
    const prefixo = `${hoje.getFullYear()}${(hoje.getMonth() + 1).toString().padStart(2, '0')}${hoje.getDate().toString().padStart(2, '0')}`;
    
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
      const parts = data[0].lote.split('-');
      const lastSeq = parseInt(parts[parts.length - 1]);
      if (!isNaN(lastSeq)) sequencial = lastSeq + 1;
    }

    // Extrair um código do produto (3 primeiras letras maiúsculas)
    const codigoProd = nomeProduto.substring(0, 3).toUpperCase();
    setLote(`${codigoProd}-${prefixo}-${sequencial.toString().padStart(3, '0')}`);
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
      toast.error(`⚠️ Tempo de mistura mínimo: ${TEMPO_MISTURA_MINIMO} min para garantir homogeneidade (IN 04/2007).`);
      return;
    }
    setSaving(true);
    
    const obsCompleta = [
      houveSobra ? `[SOBRA/VASSOURA] Qtd: ${qtdSobra || "N/I"} kg | Destino: ${destinoSobra === "reprocesso" ? "Reprocesso" : destinoSobra === "descarte" ? "Descarte (resíduo)" : destinoSobra === "devolucao" ? "Devolução ao silo" : "Outro"} | ${obsSobra}` : "",
      realizouFlush ? `[FLUSH/LIMPEZA ENTRE LOTES — IN 15/2009] Tipo: ${tipoLimpeza === "flush_inerte" ? "Flushing c/ inerte" : tipoLimpeza === "limpeza_fisica" ? "Limpeza física (varrição)" : tipoLimpeza === "aspiracao" ? "Aspiração" : "Outro"} | Volume: ${volumeFlush || "N/I"} kg | Prod. anterior: ${produtoAnterior || "N/I"} | Medicado: ${prodAnteriorMedicado ? "SIM ⚠️" : "Não"} | ${obsFlush}` : "",
    ].filter(Boolean).join("\n\n").trim();
    
    // Contraprova
    const cpQtd = (document.getElementById("prod-cp-qtd") as HTMLInputElement)?.value || "";
    const cpLocal = (document.getElementById("prod-cp-local") as HTMLInputElement)?.value || "";
    const cpVal = (document.getElementById("prod-cp-val") as HTMLInputElement)?.value || "";
    const cpRetida = !!(cpQtd || cpLocal);
    
    let quantidadeFinal = quantidade ? `${quantidade}${obsCompleta ? ` | Sobra: ${qtdSobra || "?"} kg` : ""}` : "";
    if (cpRetida) {
      quantidadeFinal += ` | [CONTRAPROVA] ${cpQtd} em ${cpLocal}`;
    }

    const { error } = await supabase.from("producao").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null,
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
    } as any);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Registro salvo!");
      registrarAuditLog({
        userId: user.id, tabela: "producao", acao: "criar",
        dadosNovos: { produto, lote, operador, flush_realizado: realizouFlush, flush_tipo: tipoLimpeza },
      });
      setOpen(false);
      setProduto(""); setLote(""); setOperador(""); setTempoMistura(""); setQuantidade("");
      setHouveSobra(false); setQtdSobra(""); setDestinoSobra("reprocesso"); setObsSobra("");
      setRealizouFlush(false); setTipoLimpeza("flush_inerte"); setVolumeFlush(""); setProdutoAnterior(""); setProdAnteriorMedicado(false); setObsFlush("");
      fetchData();
    }
    setSaving(false);
  };

  const exportCSV = async () => {
    const headers = ["Data", "Produto", "Lote", "Operador", "Tempo Mistura", "Quantidade"];
    const rows = items.map(r => [r.data, r.produto, r.lote || "", r.operador || "", r.tempo_mistura || "", r.quantidade || ""]);
    let csv = [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
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
      <PageHeader icon={Factory} title="Controle de Produção" description="Registro de fabricação, tempo de mistura e sobras — IN 04/2007 e IN 15/2009"
        orientacaoModuloId="producao" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{items.length}</p>
          <p className="text-xs text-muted-foreground">Total registros</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{new Set(items.map(i => i.lote).filter(Boolean)).size}</p>
          <p className="text-xs text-muted-foreground">Lotes produzidos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-muted-foreground">{new Set(items.map(i => i.produto)).size}</p>
          <p className="text-xs text-muted-foreground">Produtos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{items.filter(i => i.quantidade?.includes("Sobra")).length}</p>
          <p className="text-xs text-muted-foreground">C/ Sobras</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display">Registros de Produção</CardTitle>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={exportCSV} disabled={items.length === 0}>
              <Download className="w-4 h-4 mr-1" /> CSV
            </Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Registro</Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Novo Registro de Produção</DialogTitle></DialogHeader>
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
                        {produtosCadastrados.map(p => (
                          <SelectItem key={p.id} value={p.nome}>{p.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Lote</Label>
                      <Input value={lote} onChange={e => setLote(e.target.value)} placeholder="Ex: L2026-0321" />
                    </div>
                    <div>
                      <Label>Operador</Label>
                      <Input value={operador} onChange={e => setOperador(e.target.value)} placeholder="Nome" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Tempo de Mistura (min) *</Label>
                      <Input 
                        value={tempoMistura} 
                        onChange={e => setTempoMistura(e.target.value)} 
                        placeholder={`Mínimo ${TEMPO_MISTURA_MINIMO} min`}
                        type="number"
                        min={TEMPO_MISTURA_MINIMO}
                      />
                      {tempoMistura && !tempoMisturaValido() && (
                        <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" /> Abaixo do mínimo ({TEMPO_MISTURA_MINIMO} min) — risco de falta de homogeneidade
                        </p>
                      )}
                      {tempoMistura && tempoMisturaValido() && (
                        <p className="text-xs text-primary mt-1">✓ Tempo adequado para homogeneidade</p>
                      )}
                    </div>
                    <div>
                      <Label>Quantidade produzida (kg)</Label>
                      <Input value={quantidade} onChange={e => setQuantidade(e.target.value)} placeholder="Ex: 2000" />
                    </div>
                  </div>

                  {/* Flush / Limpeza entre Lotes — IN 15/2009 (Carryover) */}
                  <div className="p-3 rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-900/10 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2 text-orange-700 dark:text-orange-400">
                        🧹 Limpeza / Flush entre Lotes — IN 15/2009
                      </p>
                      <Switch checked={realizouFlush} onCheckedChange={setRealizouFlush} />
                    </div>
                    <p className="text-[10px] text-muted-foreground">
                      Registre a limpeza/varrição/flushing realizada entre lotes para mitigar arraste (carryover) de medicamentos e aditivos restritos.
                    </p>
                    {realizouFlush && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Tipo de Limpeza</Label>
                            <Select value={tipoLimpeza} onValueChange={setTipoLimpeza}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
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
                            <Input value={volumeFlush} onChange={e => setVolumeFlush(e.target.value)} placeholder="Ex: 500" />
                          </div>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Produto Anterior na Linha</Label>
                            <Input value={produtoAnterior} onChange={e => setProdutoAnterior(e.target.value)} placeholder="Ex: Ração Frango Engorda c/ Salinomicina" />
                          </div>
                          <div className="flex items-center gap-2 pt-6">
                            <input type="checkbox" checked={prodAnteriorMedicado} onChange={e => setProdAnteriorMedicado(e.target.checked)} className="h-4 w-4" />
                            <Label className="text-sm">Produto anterior continha medicamento/ionóforo</Label>
                          </div>
                        </div>
                        {prodAnteriorMedicado && (
                          <div className="p-2 rounded border border-destructive/30 bg-destructive/10">
                            <p className="text-xs text-destructive font-semibold">⚠️ Atenção: Flushing obrigatório — arraste máximo permitido: &lt; 1% ionóforos, &lt; 3% medicados (IN 15/2009).</p>
                          </div>
                        )}
                        <div>
                          <Label>Observações do Flush</Label>
                          <Input value={obsFlush} onChange={e => setObsFlush(e.target.value)} placeholder="Destino do material de flushing, análise de arraste, etc." />
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <Trash2 className="w-4 h-4" /> Sobras / Vassoura de Produção (IN 15/2009)
                      </p>
                      <Switch checked={houveSobra} onCheckedChange={setHouveSobra} />
                    </div>
                    {houveSobra && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <Label>Quantidade sobra (kg)</Label>
                            <Input value={qtdSobra} onChange={e => setQtdSobra(e.target.value)} placeholder="Ex: 50" />
                          </div>
                          <div>
                            <Label>Destino</Label>
                            <Select value={destinoSobra} onValueChange={setDestinoSobra}>
                              <SelectTrigger><SelectValue /></SelectTrigger>
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
                          <Input value={obsSobra} onChange={e => setObsSobra(e.target.value)} placeholder="Detalhes do reprocesso ou descarte" />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Retenção de Amostra de Contraprova — IN 17/2017 */}
                  <div className="p-3 rounded-lg border border-blue-300 bg-blue-50 dark:bg-blue-900/10 space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">
                      🧪 Retenção de Amostra (Contraprova) — IN 17/2017
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      Reter amostra testemunha de cada lote produzido pelo prazo de validade do produto + 30 dias para defesa em fiscalizações.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div><Label>Quantidade retida</Label><Input id="prod-cp-qtd" placeholder="Ex: 500g" /></div>
                      <div><Label>Local armazenamento</Label><Input id="prod-cp-local" placeholder="Ex: Sala de amostras" /></div>
                      <div><Label>Validade retenção</Label><Input id="prod-cp-val" placeholder="Ex: Validade +30 dias" /></div>
                    </div>
                  </div>

                  <Button onClick={handleAdd} className="w-full" disabled={saving || !produto}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : items.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum registro. Use também o módulo PCP para ordens detalhadas.</p>
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
                        <span className={parseFloat(p.tempo_mistura) < TEMPO_MISTURA_MINIMO ? "text-destructive font-medium" : ""}>
                          {p.tempo_mistura}
                        </span>
                      ) : "—"}
                    </TableCell>
                    <TableCell>{p.quantidade || "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          <div className="mt-4 p-3 rounded-lg bg-muted/50 text-xs text-muted-foreground space-y-1">
            <p><strong>💡 Dica:</strong> Para registros detalhados com fórmulas, batidas e rastreabilidade de lotes, use o módulo <strong>PCP / Ordens de Produção</strong>.</p>
            <p><strong>⏱️ Homogeneidade:</strong> Tempo mínimo de mistura de {TEMPO_MISTURA_MINIMO} min conforme validação da IN 04/2007. Registros abaixo deste valor são sinalizados.</p>
            <p><strong>🧹 Sobras:</strong> Registre todas as sobras/vassouras e seu destino (reprocesso ou descarte) conforme IN 15/2009.</p>
          </div>
        </CardContent>
      </Card>
    </>
  );
}
