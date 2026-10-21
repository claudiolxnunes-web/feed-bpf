import { useState, useEffect, useRef, useMemo } from "react";
import { Plus, Loader2, Truck, Upload, Search, Trash2, FileText, Package, Eye, Download, Pencil, AlertTriangle, TrendingUp, Users, Weight, Filter, CheckCircle2, ClipboardCheck, FileSpreadsheet, Camera } from "lucide-react";
import * as XLSX from "xlsx";
import { gerarFormExpedicaoSimples, gerarFormExpedicaoCompleta, gerarMapaExpedicaoMAPA } from "@/utils/excelTemplates";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { mensagemErroRegistro } from "@/utils/registroImutavel";
import { LoteProdutoPicker } from "@/components/expedicao/LoteProdutoPicker";
import { MapaExpedicaoDigital } from "@/components/expedicao/MapaExpedicaoDigital";

interface Expedicao {
  id: string;
  numero_nf: string;
  serie_nf: string | null;
  data_emissao: string | null;
  data_saida: string | null;
  cliente_nome: string;
  cliente_cnpj: string | null;
  cliente_cidade: string | null;
  cliente_uf: string | null;
  transportadora_nome: string | null;
  motorista_nome: string | null;
  veiculo_placa: string | null;
  peso_liquido_kg: number | null;
  valor_total: number | null;
  origem: string;
  status: string;
  created_at: string;
}

interface Item {
  id?: string; // id do registro em expedicao_itens (presente só na edição)
  produto: string;
  codigo_produto: string;
  lote_produto: string;
  quantidade: number;
  unidade: string;
  quantidade_sacos?: number;
  valor_unitario?: number;
  valor_total?: number;
}

const emptyItem = (): Item => ({ produto: "", codigo_produto: "", lote_produto: "", quantidade: 0, unidade: "kg" });

export default function Expedicao() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [expedicoes, setExpedicoes] = useState<Expedicao[]>([]);
  const [lotesEmRecall, setLotesEmRecall] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [busca, setBusca] = useState("");
  const [filtroLote, setFiltroLote] = useState("");
  const [dataIni, setDataIni] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroCliente, setFiltroCliente] = useState("__all__");
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [detalheOpen, setDetalheOpen] = useState(false);
  const [detalheItens, setDetalheItens] = useState<any[]>([]);
  const [todosItens, setTodosItens] = useState<any[]>([]);
  const [detalheExp, setDetalheExp] = useState<Expedicao | null>(null);
  const [mapaOpen, setMapaOpen] = useState(false);
  const [mapaDados, setMapaDados] = useState<any[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);

  const [form, setForm] = useState({
    numero_nf: "", serie_nf: "", chave_acesso: "", data_emissao: "", data_saida: "",
    cliente_nome: "", cliente_cnpj: "", cliente_ie: "", cliente_endereco: "",
    cliente_cidade: "", cliente_uf: "", cliente_cep: "", cliente_telefone: "",
    transportadora_nome: "", transportadora_cnpj: "",
    motorista_nome: "", motorista_cpf: "", veiculo_placa: "", veiculo_uf: "",
    peso_bruto_kg: "", peso_liquido_kg: "", valor_total: "", observacoes: "",
  });
  const [itens, setItens] = useState<Item[]>([emptyItem()]);
  const [origem, setOrigem] = useState<"manual" | "xml">("manual");
  const [xmlContent, setXmlContent] = useState<string | null>(null);

  const resetForm = () => {
    setForm({
      numero_nf: "", serie_nf: "", chave_acesso: "", data_emissao: "", data_saida: "",
      cliente_nome: "", cliente_cnpj: "", cliente_ie: "", cliente_endereco: "",
      cliente_cidade: "", cliente_uf: "", cliente_cep: "", cliente_telefone: "",
      transportadora_nome: "", transportadora_cnpj: "",
      motorista_nome: "", motorista_cpf: "", veiculo_placa: "", veiculo_uf: "",
      peso_bruto_kg: "", peso_liquido_kg: "", valor_total: "", observacoes: "",
    });
    setItens([emptyItem()]);
    setOrigem("manual");
    setXmlContent(null);
    setEditId(null);
  };

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    let q = supabase.from("expedicoes" as any).select("*").order("created_at", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await q;
    if (error) toast.error("Erro ao carregar: " + error.message);
    else setExpedicoes((data as any) || []);

    // Carregar itens para o filtro de lotes
    let qi = supabase.from("expedicao_itens" as any).select("expedicao_id, lote_produto").neq("status", "cancelado");
    if (empresaAtiva) qi = qi.eq("empresa_id", empresaAtiva.id);
    const { data: ditens } = await qi;
    setTodosItens(ditens || []);

    // Lotes em recall ativo
    let qr = supabase.from("rastreabilidade" as any).select("lote_produto").eq("recall_ativo", true);
    if (empresaAtiva) qr = qr.eq("empresa_id", empresaAtiva.id);
    const { data: rec } = await qr;
    setLotesEmRecall(new Set(((rec as any) || []).map((r: any) => r.lote_produto).filter(Boolean)));

    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, empresaAtiva]);

  const clientesUnicos = useMemo(() => {
    const set = new Set(expedicoes.map(e => e.cliente_nome).filter(Boolean));
    return Array.from(set).sort();
  }, [expedicoes]);

  const filtered = useMemo(() => {
    const t = busca.toLowerCase().trim();
    const l = filtroLote.toLowerCase().trim();
    return expedicoes.filter(e => {
      if (t && !(e.numero_nf?.toLowerCase().includes(t) || e.cliente_nome?.toLowerCase().includes(t) || e.cliente_cnpj?.toLowerCase().includes(t))) return false;
      if (l) {
        const itensDaNF = todosItens.filter(i => i.expedicao_id === e.id);
        if (!itensDaNF.some(i => i.lote_produto?.toLowerCase().includes(l))) return false;
      }
      if (filtroCliente !== "__all__" && e.cliente_nome !== filtroCliente) return false;
      const data = e.data_saida || e.data_emissao || e.created_at?.slice(0, 10);
      if (dataIni && data && data < dataIni) return false;
      if (dataFim && data && data > dataFim) return false;
      return true;
    });
  }, [expedicoes, busca, filtroLote, todosItens, dataIni, dataFim, filtroCliente]);

  // Dashboard mês corrente
  const dashboard = useMemo(() => {
    const hoje = new Date();
    const ym = `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`;
    const mes = expedicoes.filter(e => (e.data_saida || e.data_emissao || e.created_at)?.startsWith(ym));
    const peso = mes.reduce((s, e) => s + (Number(e.peso_liquido_kg) || 0), 0);
    const valor = mes.reduce((s, e) => s + (Number(e.valor_total) || 0), 0);
    const clientes = new Set(mes.map(e => e.cliente_nome).filter(Boolean)).size;
    return { qtd: mes.length, peso, valor, clientes, mesLabel: hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) };
  }, [expedicoes]);

  const handleXmlUpload = async (file: File) => {
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, "text/xml");
      const get = (tag: string, ctx: Element | Document = doc) =>
        ctx.getElementsByTagName(tag)[0]?.textContent?.trim() || "";

      const ide = doc.getElementsByTagName("ide")[0];
      const dest = doc.getElementsByTagName("dest")[0];
      const transp = doc.getElementsByTagName("transporta")[0];
      const veicTransp = doc.getElementsByTagName("veicTransp")[0];
      const total = doc.getElementsByTagName("ICMSTot")[0];
      const infNFe = doc.getElementsByTagName("infNFe")[0];
      const enderDest = dest?.getElementsByTagName("enderDest")[0];
      const chave = (infNFe?.getAttribute("Id") || "").replace(/^NFe/, "");

      setForm(f => ({
        ...f,
        numero_nf: ide ? get("nNF", ide) : "",
        serie_nf: ide ? get("serie", ide) : "",
        chave_acesso: chave,
        data_emissao: ide ? get("dhEmi", ide).slice(0, 10) : "",
        data_saida: ide ? (get("dhSaiEnt", ide) || "").slice(0, 10) : "",
        cliente_nome: dest ? (get("xNome", dest) || "") : "",
        cliente_cnpj: dest ? (get("CNPJ", dest) || get("CPF", dest)) : "",
        cliente_ie: dest ? get("IE", dest) : "",
        cliente_endereco: enderDest ? `${get("xLgr", enderDest)}, ${get("nro", enderDest)} - ${get("xBairro", enderDest)}` : "",
        cliente_cidade: enderDest ? get("xMun", enderDest) : "",
        cliente_uf: enderDest ? get("UF", enderDest) : "",
        cliente_cep: enderDest ? get("CEP", enderDest) : "",
        cliente_telefone: enderDest ? get("fone", enderDest) : "",
        transportadora_nome: transp ? get("xNome", transp) : "",
        transportadora_cnpj: transp ? get("CNPJ", transp) : "",
        veiculo_placa: veicTransp ? get("placa", veicTransp) : "",
        veiculo_uf: veicTransp ? get("UF", veicTransp) : "",
        valor_total: total ? get("vNF", total) : "",
        peso_bruto_kg: doc.getElementsByTagName("vol")[0] ? get("pesoB", doc.getElementsByTagName("vol")[0]) : "",
        peso_liquido_kg: doc.getElementsByTagName("vol")[0] ? get("pesoL", doc.getElementsByTagName("vol")[0]) : "",
        observacoes: get("infCpl") || "",
      }));

      const dets = Array.from(doc.getElementsByTagName("det"));
      const novosItens: Item[] = dets.map(det => {
        const prod = det.getElementsByTagName("prod")[0];
        const rastro = det.getElementsByTagName("rastro")[0];
        return {
          produto: prod ? get("xProd", prod) : "",
          codigo_produto: prod ? get("cProd", prod) : "",
          lote_produto: rastro ? get("nLote", rastro) : "",
          quantidade: prod ? parseFloat(get("qCom", prod)) || 0 : 0,
          unidade: prod ? get("uCom", prod) || "kg" : "kg",
          valor_unitario: prod ? parseFloat(get("vUnCom", prod)) || undefined : undefined,
          valor_total: prod ? parseFloat(get("vProd", prod)) || undefined : undefined,
        };
      });

      if (novosItens.length > 0) setItens(novosItens);
      setOrigem("xml");
      setXmlContent(text);
      toast.success(`XML importado: ${novosItens.length} item(ns)`);
    } catch (err: any) {
      toast.error("Erro ao ler XML: " + err.message);
    }
  };

  const handleExcelUpload = async (file: File) => {
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as any[][];

      if (json.length < 2) {
        toast.error("Planilha vazia ou sem dados suficientes.");
        return;
      }

      // Procura a linha de cabeçalho (pode não ser a primeira)
      let headerIdx = 0;
      for (let i = 0; i < Math.min(json.length, 10); i++) {
        const row = (json[i] || []).map(c => String(c || "").toLowerCase());
        if (row.some(c => c.includes("cliente") || c.includes("nf") || c.includes("nota") || c.includes("lote"))) {
          headerIdx = i;
          break;
        }
      }

      const headers = json[headerIdx].map(h => String(h || "").toLowerCase().trim());
      const findCol = (terms: string[]) => headers.findIndex(h => terms.some(t => h.includes(t)));

      const colNF = findCol(["nf", "nota", "numero", "nº", "faturamento"]);
      const colCliente = findCol(["cliente", "razao", "destinatario", "nome"]);
      const colLote = findCol(["lote", "pa", "lote de pa", "lote pa", "rastro"]);
      const colProd = findCol(["produto", "descricao", "item", "nome do produto"]);
      const colQtde = findCol(["qtd", "quantidade", "peso", "volume", "liquido"]);
      const colData = findCol(["data", "emissao", "saida"]);
      const colPedido = findCol(["pedido", "ordem", "op", "numero pedido"]);

      const firstRow = json[headerIdx + 1];
      if (!firstRow) return;

      setForm(f => ({
        ...f,
        numero_nf: colNF !== -1 ? String(firstRow[colNF] || "") : f.numero_nf,
        cliente_nome: colCliente !== -1 ? String(firstRow[colCliente] || "") : f.cliente_nome,
        observacoes: colPedido !== -1 ? `Pedido/OP: ${firstRow[colPedido]}` : f.observacoes,
      }));

      if (colData !== -1) {
        const d = firstRow[colData];
        if (typeof d === 'number') {
          const date = new Date((d - 25569) * 86400 * 1000);
          setForm(f => ({ ...f, data_emissao: date.toISOString().slice(0, 10) }));
        } else if (d) {
          const dateStr = String(d).split(' ')[0].split('T')[0];
          if (dateStr.includes('-')) setForm(f => ({ ...f, data_emissao: dateStr }));
        }
      }

      const novosItens: Item[] = json.slice(headerIdx + 1).map(row => ({
        produto: colProd !== -1 ? String(row[colProd] || "") : "Produto não identificado",
        codigo_produto: "",
        lote_produto: colLote !== -1 ? String(row[colLote] || "") : "",
        quantidade: colQtde !== -1 ? parseFloat(String(row[colQtde]).replace(",", ".")) || 0 : 0,
        unidade: "kg",
      })).filter(i => (i.produto && i.produto !== "undefined") || (i.lote_produto && i.lote_produto !== "undefined"));

      if (novosItens.length > 0) {
        setItens(novosItens);
        setOrigem("manual");
        toast.success(`Varredura concluída: ${novosItens.length} itens/lotes encontrados.`);
      } else {
        toast.warning("Nenhum item válido encontrado na planilha.");
      }
    } catch (err: any) {
      toast.error("Erro ao ler Planilha: " + err.message);
    }
  };

  const handlePhotoUpload = async (file: File) => {
    try {
      setIsScanning(true);
      
      // Criar FormData para enviar a imagem para a Edge Function
      const formData = new FormData();
      formData.append('file', file);
      
      // Chamada para a Edge Function de OCR/Processamento de Documentos
      // Nota: Esta função precisa ser implementada no Supabase
      const { data, error } = await supabase.functions.invoke('process-document', {
        body: formData,
      });

      if (error) throw error;

      if (data) {
        setForm(f => ({
          ...f,
          numero_nf: data.numero_nf || f.numero_nf,
          cliente_nome: data.cliente_nome || f.cliente_nome,
          data_emissao: data.data_emissao || f.data_emissao,
          observacoes: data.observacoes || f.observacoes,
        }));

        if (data.itens && data.itens.length > 0) {
          setItens(data.itens.map((i: any) => ({
            produto: i.produto || "Item escaneado",
            codigo_produto: i.codigo_produto || "",
            lote_produto: i.lote_produto || "",
            quantidade: parseFloat(i.quantidade) || 0,
            unidade: i.unidade || "kg",
          })));
        }
        
        toast.success("Documento processado por IA com sucesso!");
      }
    } catch (err: any) {
      console.error("Erro OCR:", err);
      toast.error("Erro ao processar imagem. Verifique a iluminação e tente novamente.");
    } finally {
      setIsScanning(false);
    }
  };

  const abrirEdicao = async (exp: Expedicao) => {
    setEditId(exp.id);
    const { data } = await supabase.from("expedicao_itens" as any).select("*").eq("expedicao_id", exp.id);
    const e: any = exp;
    setForm({
      numero_nf: e.numero_nf || "", serie_nf: e.serie_nf || "", chave_acesso: e.chave_acesso || "",
      data_emissao: e.data_emissao || "", data_saida: e.data_saida || "",
      cliente_nome: e.cliente_nome || "", cliente_cnpj: e.cliente_cnpj || "", cliente_ie: e.cliente_ie || "",
      cliente_endereco: e.cliente_endereco || "", cliente_cidade: e.cliente_cidade || "",
      cliente_uf: e.cliente_uf || "", cliente_cep: e.cliente_cep || "", cliente_telefone: e.cliente_telefone || "",
      transportadora_nome: e.transportadora_nome || "", transportadora_cnpj: e.transportadora_cnpj || "",
      motorista_nome: e.motorista_nome || "", motorista_cpf: e.motorista_cpf || "",
      veiculo_placa: e.veiculo_placa || "", veiculo_uf: e.veiculo_uf || "",
      peso_bruto_kg: e.peso_bruto_kg?.toString() || "", peso_liquido_kg: e.peso_liquido_kg?.toString() || "",
      valor_total: e.valor_total?.toString() || "", observacoes: e.observacoes || "",
    });
    setItens(((data as any) || []).filter((i: any) => (i.status || "ativo") === "ativo").map((i: any) => ({
      id: i.id,
      produto: i.produto, codigo_produto: i.codigo_produto || "", lote_produto: i.lote_produto || "",
      quantidade: Number(i.quantidade) || 0, unidade: i.unidade || "kg",
      quantidade_sacos: i.quantidade_sacos || undefined,
      valor_unitario: i.valor_unitario, valor_total: i.valor_total,
    })));
    setOrigem(e.origem || "manual");
    setOpen(true);
  };

  const handleSave = async () => {
    if (!user) return;
    if (!form.numero_nf || !form.cliente_nome) {
      toast.error("Número da NF e cliente são obrigatórios.");
      return;
    }
    const itensValidos = itens.filter(i => i.produto.trim());
    if (itensValidos.length === 0) {
      toast.error("Adicione pelo menos um item.");
      return;
    }

    // Validação de NF duplicada (mesma NF + série + cliente)
    if (!editId) {
      const dup = expedicoes.find(e =>
        e.numero_nf === form.numero_nf &&
        (e.serie_nf || "") === (form.serie_nf || "") &&
        e.cliente_nome === form.cliente_nome
      );
      if (dup) {
        toast.error(`NF ${form.numero_nf}/${form.serie_nf || "—"} já registrada para ${form.cliente_nome}`);
        return;
      }
    }

    // Alerta lote em recall
    const lotesEmRecallNoForm = itensValidos.filter(i => i.lote_produto && lotesEmRecall.has(i.lote_produto));
    if (lotesEmRecallNoForm.length > 0) {
      const ok = confirm(`⚠️ ATENÇÃO: Os lotes [${lotesEmRecallNoForm.map(i => i.lote_produto).join(", ")}] estão em RECALL ATIVO. Deseja prosseguir mesmo assim?`);
      if (!ok) return;
    }

    setSaving(true);
    const payload: any = {
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      origem,
      xml_content: xmlContent,
      ...form,
      data_emissao: form.data_emissao || null,
      data_saida: form.data_saida || null,
      peso_bruto_kg: form.peso_bruto_kg ? Number(form.peso_bruto_kg) : null,
      peso_liquido_kg: form.peso_liquido_kg ? Number(form.peso_liquido_kg) : null,
      valor_total: form.valor_total ? Number(form.valor_total) : null,
    };

    let expedicaoId: string;
    if (editId) {
      const { error } = await supabase.from("expedicoes" as any).update(payload).eq("id", editId);
      if (error) { toast.error(mensagemErroRegistro(error, "Erro ao atualizar expedição")); setSaving(false); return; }
      expedicaoId = editId;
    } else {
      const { data: exp, error } = await supabase.from("expedicoes" as any).insert(payload).select().single();
      if (error || !exp) { toast.error("Erro ao salvar: " + (error?.message || "")); setSaving(false); return; }
      expedicaoId = (exp as any).id;
    }

    const montarItemPayload = (i: Item) => ({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      expedicao_id: expedicaoId,
      produto: i.produto,
      codigo_produto: i.codigo_produto,
      lote_produto: i.lote_produto,
      quantidade: i.quantidade || 0,
      unidade: i.unidade,
      quantidade_sacos: i.quantidade_sacos || null,
      valor_unitario: i.valor_unitario || null,
      valor_total: i.valor_total || null,
    });

    if (editId) {
      // Sem DELETE: registros salvos não são apagados (Decreto 12.031/2024).
      // Itens existentes são atualizados; novos são inseridos; removidos do formulário são marcados como "cancelado".
      const { data: existentes } = await supabase.from("expedicao_itens" as any)
        .select("id, status").eq("expedicao_id", editId);
      const idsNoForm = new Set(itensValidos.filter(i => i.id).map(i => i.id as string));

      for (const item of itensValidos) {
        const payloadItem = montarItemPayload(item);
        if (item.id) {
          const { error } = await supabase.from("expedicao_itens" as any).update(payloadItem).eq("id", item.id);
          if (error) toast.error("Erro ao atualizar item: " + error.message);
        } else {
          const { error } = await supabase.from("expedicao_itens" as any).insert({ ...payloadItem, status: "ativo" });
          if (error) toast.error("Erro ao inserir item: " + error.message);
        }
      }

      const idsParaCancelar = ((existentes as any) || [])
        .filter((e: any) => (e.status || "ativo") === "ativo" && !idsNoForm.has(e.id))
        .map((e: any) => e.id);
      if (idsParaCancelar.length > 0) {
        const { error } = await supabase.from("expedicao_itens" as any)
          .update({ status: "cancelado" }).in("id", idsParaCancelar);
        if (error) toast.error("Erro ao cancelar itens removidos: " + error.message);
      }
    } else {
      const itensPayload = itensValidos.map(i => ({ ...montarItemPayload(i), status: "ativo" }));
      const { error: errItens } = await supabase.from("expedicao_itens" as any).insert(itensPayload);
      if (errItens) toast.error("NF salva, mas erro nos itens: " + errItens.message);
    }

    if (!editId) {
      const rastroPayload = itensValidos.filter(i => i.lote_produto).map(i => ({
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        produto: i.produto,
        lote_produto: i.lote_produto,
        materia_prima: "—",
        cliente_destino: form.cliente_nome,
        local_entrega: `${form.cliente_cidade}/${form.cliente_uf}`.replace(/^\//, ""),
        data_venda: form.data_saida || form.data_emissao || null,
        nota_fiscal: form.numero_nf,
        quantidade_vendida: `${i.quantidade} ${i.unidade}`,
      }));
      if (rastroPayload.length > 0) await supabase.from("rastreabilidade" as any).insert(rastroPayload);
    }

    toast.success(editId ? "Expedição atualizada!" : "Expedição registrada e rastreabilidade atualizada!");
    setOpen(false);
    resetForm();
    fetchData();
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir esta expedição?")) return;
    const { error } = await supabase.from("expedicoes" as any).delete().eq("id", id);
    if (error) toast.error(mensagemErroRegistro(error, "Erro ao excluir expedição"));
    else { toast.success("Excluída"); fetchData(); }
  };

  const verDetalhe = async (exp: Expedicao) => {
    setDetalheExp(exp);
    const { data } = await supabase.from("expedicao_itens" as any).select("*").eq("expedicao_id", exp.id).neq("status", "cancelado");
    setDetalheItens((data as any) || []);
    setDetalheOpen(true);
  };

  const updateItem = (idx: number, field: keyof Item, value: any) => {
    setItens(prev => prev.map((it, i) => i === idx ? { ...it, [field]: value } : it));
  };

  // Marcador visual de NF que contém lote em recall
  const nfTemRecall = (exp: Expedicao) => {
    // Sem buscar itens em massa: aproxima usando lote do produto na rastreabilidade pelo número da NF
    return false; // alerta principal já é dado no salvamento; o destaque visual completo abaixo via dashboard
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expedição & Faturamento"
        description="Registro de saída de produto acabado por NF — rastreabilidade completa para recall"
        icon={Truck}
        assuntoBaseLegal="recolhimento_recall"
      />

      {/* Dashboard mês */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground capitalize">{dashboard.mesLabel}</span><TrendingUp className="h-4 w-4 text-primary" /></div>
            <div className="text-2xl font-bold mt-1">{dashboard.qtd}</div>
            <div className="text-xs text-muted-foreground">NFs emitidas</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Peso líquido</span><Weight className="h-4 w-4 text-primary" /></div>
            <div className="text-2xl font-bold mt-1">{dashboard.peso.toLocaleString("pt-BR", { maximumFractionDigits: 0 })} kg</div>
            <div className="text-xs text-muted-foreground">total expedido</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Faturamento</span><FileText className="h-4 w-4 text-primary" /></div>
            <div className="text-2xl font-bold mt-1">R$ {dashboard.valor.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
            <div className="text-xs text-muted-foreground">valor total</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between"><span className="text-xs text-muted-foreground">Clientes</span><Users className="h-4 w-4 text-primary" /></div>
            <div className="text-2xl font-bold mt-1">{dashboard.clientes}</div>
            <div className="text-xs text-muted-foreground">únicos no mês</div>
          </CardContent>
        </Card>
      </div>

      {lotesEmRecall.size > 0 && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="pt-4 flex items-center gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <span><strong>{lotesEmRecall.size} lote(s)</strong> em recall ativo. Expedições contendo esses lotes serão bloqueadas com alerta.</span>
          </CardContent>
        </Card>
      )}

      <Card className="border-primary/20 bg-primary/5">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Download className="h-4 w-4 text-primary" />
            Planilhas de Expedição (PL POP 9.2) — para registro manual / arquivamento
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => gerarFormExpedicaoSimples()}>
            <Download className="h-4 w-4 mr-2" />Lista Simples (manual)
          </Button>
          <Button variant="outline" size="sm" onClick={() => gerarFormExpedicaoCompleta()}>
            <Download className="h-4 w-4 mr-2" />Romaneio por NF
          </Button>
          <Button variant="default" size="sm" onClick={async () => {
            const { data } = await supabase.from("expedicao_itens" as any).select("*").neq("status", "cancelado");
            const mapped = filtered.map(f => ({ ...f, itens: data?.filter((i: any) => i.expedicao_id === f.id) }));
            setMapaDados(mapped);
            setMapaOpen(true);
          }}>
            <Eye className="h-4 w-4 mr-2" />Visualizar Mapa de Expedição (Digital)
          </Button>
          <Button variant="outline" size="sm" onClick={async () => {
            const { data } = await supabase.from("expedicao_itens" as any).select("*").neq("status", "cancelado");
            const mapped = filtered.map(f => ({ ...f, itens: data?.filter((i: any) => i.expedicao_id === f.id) }));
            gerarMapaExpedicaoMAPA(mapped, empresaAtiva);
          }}>
            <Download className="h-4 w-4 mr-2" />Mapa para Excel
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              <CardTitle>Notas Fiscais Emitidas ({filtered.length})</CardTitle>
            </div>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button><Plus className="h-4 w-4 mr-2" />Nova Expedição</Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>{editId ? "Editar Expedição" : "Registrar Expedição / Faturamento"}</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="entrada" className="w-full">
                  <TabsList>
                    <TabsTrigger value="entrada"><Upload className="h-4 w-4 mr-2" />Importar XML NF-e</TabsTrigger>
                    <TabsTrigger value="foto"><Camera className="h-4 w-4 mr-2" />Foto / Escaneado</TabsTrigger>
                    <TabsTrigger value="excel"><FileSpreadsheet className="h-4 w-4 mr-2" />Varredura Excel</TabsTrigger>
                    <TabsTrigger value="simples"><Package className="h-4 w-4 mr-2" />Lista Simples</TabsTrigger>
                    <TabsTrigger value="manual"><FileText className="h-4 w-4 mr-2" />Manual Completo</TabsTrigger>
                  </TabsList>

                  <TabsContent value="foto" className="space-y-3">
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="pt-6 space-y-4">
                        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-primary/20 rounded-lg bg-background/50">
                          <Camera className="h-10 w-10 text-primary/40 mb-2" />
                          <p className="text-sm font-medium">Tire uma foto ou envie a imagem</p>
                          <p className="text-xs text-muted-foreground mb-4">Ideal para documentos preenchidos à mão ou romaneios físicos</p>
                          <Input type="file" accept="image/*" capture="environment"
                            onChange={(e) => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
                            className="hidden" id="photo-upload" />
                          <Button asChild disabled={isScanning}>
                            <label htmlFor="photo-upload">
                              {isScanning ? (
                                <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Processando com IA...</>
                              ) : (
                                <><Camera className="h-4 w-4 mr-2" /> Capturar Documento</>
                              )}
                            </label>
                          </Button>
                        </div>
                        <div className="p-3 bg-secondary/30 rounded-md text-xs space-y-2">
                          <p className="font-semibold text-primary">Dicas para melhor leitura:</p>
                          <ul className="list-disc list-inside text-muted-foreground">
                            <li>Centralize o documento na foto</li>
                            <li>Evite sombras sobre o papel</li>
                            <li>Mantenha a câmera estável</li>
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="simples" className="space-y-3">
                    <Card className="border-primary/30 bg-primary/5">
                      <CardContent className="pt-6 text-sm space-y-2">
                        <p className="font-medium">Registro rápido (PL POP 9.2 — digital)</p>
                        <p className="text-xs text-muted-foreground">
                          Preencha apenas <strong>Cliente, NF, Data e Produto/Lote/Qtde</strong>. Campos de transporte ficam em branco.
                        </p>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="entrada" className="space-y-3">
                    <Card>
                      <CardContent className="pt-6">
                        <Label>Selecione o XML da NF-e</Label>
                        <Input ref={fileRef} type="file" accept=".xml,text/xml"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleXmlUpload(f); }}
                          className="mt-2" />
                        <p className="text-xs text-muted-foreground mt-2">
                          Extrai: NF, cliente, transportadora, motorista, placa, produtos <strong>lotes (rastro/nLote)</strong>.
                        </p>
                        {origem === "xml" && <Badge variant="secondary" className="mt-3">XML carregado — revise e salve</Badge>}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="excel" className="space-y-3">
                    <Card>
                      <CardContent className="pt-6">
                        <Label>Selecione a Planilha de Faturamento/Pedidos</Label>
                        <Input type="file" accept=".xlsx,.xls,.csv"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleExcelUpload(f); }}
                          className="mt-2" />
                        <div className="mt-3 p-3 bg-secondary/30 rounded-md text-xs space-y-2">
                          <p className="font-semibold text-primary flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" /> Varredura Inteligente Ativa
                          </p>
                          <p className="text-muted-foreground">
                            O sistema identifica automaticamente colunas de: <strong>Cliente, NF, Pedido, Produto e Lote de PA</strong>.
                          </p>
                          <p className="text-muted-foreground italic">
                            Ideal para empresas que controlam expedição via planilhas de romaneio ou pedidos.
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="manual" />
                </Tabs>

                <div className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                    <div><Label>NF nº *</Label><Input value={form.numero_nf} onChange={e => setForm({ ...form, numero_nf: e.target.value })} /></div>
                    <div><Label>Série</Label><Input value={form.serie_nf} onChange={e => setForm({ ...form, serie_nf: e.target.value })} /></div>
                    <div><Label>Data Emissão</Label><Input type="date" value={form.data_emissao} onChange={e => setForm({ ...form, data_emissao: e.target.value })} /></div>
                    <div><Label>Data Saída</Label><Input type="date" value={form.data_saida} onChange={e => setForm({ ...form, data_saida: e.target.value })} /></div>
                  </div>
                  <div><Label>Chave de Acesso</Label><Input value={form.chave_acesso} onChange={e => setForm({ ...form, chave_acesso: e.target.value })} /></div>

                  <div className="border rounded-md p-3 space-y-3">
                    <h4 className="font-semibold text-sm">Cliente / Destinatário</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2"><Label>Razão Social *</Label><Input value={form.cliente_nome} onChange={e => setForm({ ...form, cliente_nome: e.target.value })} /></div>
                      <div><Label>CNPJ/CPF</Label><Input value={form.cliente_cnpj} onChange={e => setForm({ ...form, cliente_cnpj: e.target.value })} /></div>
                      <div className="md:col-span-2"><Label>Endereço</Label><Input value={form.cliente_endereco} onChange={e => setForm({ ...form, cliente_endereco: e.target.value })} /></div>
                      <div><Label>Cidade/UF</Label>
                        <div className="flex gap-2">
                          <Input value={form.cliente_cidade} onChange={e => setForm({ ...form, cliente_cidade: e.target.value })} placeholder="Cidade" />
                          <Input value={form.cliente_uf} onChange={e => setForm({ ...form, cliente_uf: e.target.value })} placeholder="UF" className="w-16" />
                        </div>
                      </div>
                      <div><Label>Telefone</Label><Input value={form.cliente_telefone} onChange={e => setForm({ ...form, cliente_telefone: e.target.value })} /></div>
                      <div><Label>IE</Label><Input value={form.cliente_ie} onChange={e => setForm({ ...form, cliente_ie: e.target.value })} /></div>
                    </div>
                  </div>

                  <div className="border rounded-md p-3 space-y-3">
                    <h4 className="font-semibold text-sm">Transporte</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="md:col-span-2"><Label>Transportadora</Label><Input value={form.transportadora_nome} onChange={e => setForm({ ...form, transportadora_nome: e.target.value })} /></div>
                      <div><Label>CNPJ Transp.</Label><Input value={form.transportadora_cnpj} onChange={e => setForm({ ...form, transportadora_cnpj: e.target.value })} /></div>
                      <div><Label>Motorista</Label><Input value={form.motorista_nome} onChange={e => setForm({ ...form, motorista_nome: e.target.value })} /></div>
                      <div><Label>CPF Motorista</Label><Input value={form.motorista_cpf} onChange={e => setForm({ ...form, motorista_cpf: e.target.value })} /></div>
                      <div><Label>Placa / UF</Label>
                        <div className="flex gap-2">
                          <Input value={form.veiculo_placa} onChange={e => setForm({ ...form, veiculo_placa: e.target.value })} />
                          <Input value={form.veiculo_uf} onChange={e => setForm({ ...form, veiculo_uf: e.target.value })} className="w-16" />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="border rounded-md p-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm flex items-center gap-2"><Package className="h-4 w-4" />Itens / Lotes Expedidos</h4>
                      <Button size="sm" variant="outline" onClick={() => setItens([...itens, emptyItem()])}>
                        <Plus className="h-3 w-3 mr-1" />Adicionar item
                      </Button>
                    </div>
                    {itens.map((it, idx) => {
                      const recall = it.lote_produto && lotesEmRecall.has(it.lote_produto);
                      return (
                        <div key={idx} className={`grid grid-cols-12 gap-2 items-end border-b pb-2 ${recall ? "bg-destructive/10 rounded p-2" : ""}`}>
                          <div className="col-span-3"><Label className="text-xs">Produto *</Label><Input value={it.produto} onChange={e => updateItem(idx, "produto", e.target.value)} /></div>
                          <div className="col-span-3">
                            <Label className="text-xs flex items-center gap-1">Lote *{recall && <AlertTriangle className="h-3 w-3 text-destructive" />}</Label>
                            <LoteProdutoPicker 
                              value={it.lote_produto} 
                              produtoNome={it.produto}
                              onChange={(lote, prod) => {
                                updateItem(idx, "lote_produto", lote);
                                if (prod) updateItem(idx, "produto", prod);
                              }} 
                            />
                          </div>
                          <div className="col-span-1"><Label className="text-xs">Qtde</Label><Input type="number" value={it.quantidade} onChange={e => updateItem(idx, "quantidade", Number(e.target.value))} /></div>
                          <div className="col-span-1"><Label className="text-xs">Un.</Label><Input value={it.unidade} onChange={e => updateItem(idx, "unidade", e.target.value)} /></div>
                          <div className="col-span-1"><Label className="text-xs">Sacos</Label><Input type="number" value={it.quantidade_sacos} onChange={e => updateItem(idx, "quantidade_sacos", Number(e.target.value))} placeholder="ex: 20" /></div>
                          <div className="col-span-2"><Label className="text-xs">Cód. Prod.</Label><Input value={it.codigo_produto} onChange={e => updateItem(idx, "codigo_produto", e.target.value)} /></div>
                          <div className="col-span-1">
                            <Button size="icon" variant="ghost" onClick={() => setItens(itens.filter((_, i) => i !== idx))} disabled={itens.length === 1}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div><Label>Peso Bruto (kg)</Label><Input type="number" value={form.peso_bruto_kg} onChange={e => setForm({ ...form, peso_bruto_kg: e.target.value })} /></div>
                    <div><Label>Peso Líquido (kg)</Label><Input type="number" value={form.peso_liquido_kg} onChange={e => setForm({ ...form, peso_liquido_kg: e.target.value })} /></div>
                    <div><Label>Valor Total (R$)</Label><Input type="number" value={form.valor_total} onChange={e => setForm({ ...form, valor_total: e.target.value })} /></div>
                  </div>
                  <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm({ ...form, observacoes: e.target.value })} /></div>
                </div>

                <DialogFooter className="sticky bottom-0 z-10 -mx-6 -mb-6 mt-2 border-t bg-background px-6 py-3 gap-2">
                  <Button variant="outline" onClick={() => { setOpen(false); resetForm(); }}>Cancelar</Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}{editId ? "Atualizar" : "Salvar"} Expedição
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filtros */}
          <div className="flex flex-wrap items-end gap-3 mt-4 pt-3 border-t">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="NF, cliente ou CNPJ..." value={busca} onChange={e => setBusca(e.target.value)} className="pl-8 w-64" />
            </div>
            <div className="relative">
              <Package className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Filtrar por Lote..." value={filtroLote} onChange={e => setFiltroLote(e.target.value)} className="pl-8 w-48" />
            </div>
            <div>
              <Label className="text-xs">De</Label>
              <Input type="date" value={dataIni} onChange={e => setDataIni(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs">Até</Label>
              <Input type="date" value={dataFim} onChange={e => setDataFim(e.target.value)} className="w-40" />
            </div>
            <div>
              <Label className="text-xs">Cliente</Label>
              <select value={filtroCliente} onChange={e => setFiltroCliente(e.target.value)} className="h-10 w-56 rounded-md border border-input bg-background px-3 text-sm">
                <option value="__all__">Todos os clientes</option>
                {clientesUnicos.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {(busca || filtroLote || dataIni || dataFim || filtroCliente !== "__all__") && (
              <Button variant="ghost" size="sm" onClick={() => { setBusca(""); setFiltroLote(""); setDataIni(""); setDataFim(""); setFiltroCliente("__all__"); }}>
                <Filter className="h-3 w-3 mr-1" />Limpar
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Truck className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhuma expedição registrada.</p>
              <p className="text-xs mt-1">Importe um XML de NF-e ou registre manualmente para começar.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>NF</TableHead>
                  <TableHead>Data Saída</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Cidade/UF</TableHead>
                  <TableHead>Transporte</TableHead>
                  <TableHead>Origem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map(e => (
                  <TableRow key={e.id}>
                    <TableCell className="font-medium">{e.numero_nf}{e.serie_nf ? `/${e.serie_nf}` : ""}</TableCell>
                    <TableCell>{e.data_saida || e.data_emissao || "—"}</TableCell>
                    <TableCell>
                      <div className="font-medium">{e.cliente_nome}</div>
                      <div className="text-xs text-muted-foreground">{e.cliente_cnpj}</div>
                    </TableCell>
                    <TableCell>{e.cliente_cidade}{e.cliente_uf ? `/${e.cliente_uf}` : ""}</TableCell>
                    <TableCell className="text-xs">
                      {e.transportadora_nome || "—"}
                      {e.veiculo_placa && <div className="text-muted-foreground">Placa: {e.veiculo_placa}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant={e.origem === "xml" ? "default" : "secondary"}>{e.origem === "xml" ? "XML" : "Manual"}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="icon" variant="ghost" onClick={() => verDetalhe(e)}><Eye className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => abrirEdicao(e)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => handleDelete(e.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={mapaOpen} onOpenChange={setMapaOpen}>
        <DialogContent className="max-w-[95vw] w-full max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Mapa de Expedição (Fiscalização)</DialogTitle>
          </DialogHeader>
          <MapaExpedicaoDigital 
            expedicoes={mapaDados} 
            empresa={empresaAtiva} 
            dataInicio={dataIni} 
            dataFim={dataFim} 
          />
        </DialogContent>
      </Dialog>

      <Dialog open={detalheOpen} onOpenChange={setDetalheOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>NF {detalheExp?.numero_nf} — {detalheExp?.cliente_nome}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><strong>CNPJ:</strong> {detalheExp?.cliente_cnpj || "—"}</div>
              <div><strong>Cidade/UF:</strong> {detalheExp?.cliente_cidade}/{detalheExp?.cliente_uf}</div>
              <div><strong>Transportadora:</strong> {detalheExp?.transportadora_nome || "—"}</div>
              <div><strong>Motorista:</strong> {detalheExp?.motorista_nome || "—"}</div>
              <div><strong>Placa:</strong> {detalheExp?.veiculo_placa || "—"}</div>
              <div><strong>Valor:</strong> R$ {detalheExp?.valor_total?.toFixed(2) || "—"}</div>
            </div>
            <Table>
              <TableHeader>
                <TableRow><TableHead>Produto</TableHead><TableHead>Lote</TableHead><TableHead>Qtde</TableHead></TableRow>
              </TableHeader>
              <TableBody>
                {detalheItens.map((it, i) => {
                  const recall = it.lote_produto && lotesEmRecall.has(it.lote_produto);
                  return (
                    <TableRow key={i} className={recall ? "bg-destructive/10" : ""}>
                      <TableCell>{it.produto}</TableCell>
                      <TableCell>
                        <Badge variant={recall ? "destructive" : "outline"}>
                          {recall && <AlertTriangle className="h-3 w-3 mr-1" />}{it.lote_produto || "—"}
                        </Badge>
                      </TableCell>
                      <TableCell>{it.quantidade} {it.unidade}</TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
