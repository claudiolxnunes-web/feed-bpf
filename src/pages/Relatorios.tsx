import { textoTela } from "@/lib/textoTela";
import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { citar, getBaseLegal } from "@/config/baseLegal";
import { useState, useEffect } from "react";
import {
  FileDown,
  Plus,
  Upload,
  Monitor,
  ScanLine,
  Eye,
  Loader2,
  Download,
  CheckSquare,
  CalendarDays,
  BarChart3,
  FileText,
  Printer,
} from "lucide-react";
import { gerarRelatorioPDF } from "@/utils/pdfExport";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

const MODULOS = [
  "Auditoria BPF",
  "Não Conformidades",
  "Recebimento MP",
  "Produção",
  "Rastreabilidade",
  "Controle de Pragas",
  "Treinamentos",
  "Execução ITs/POPs",
  `Checklist ${getBaseLegal("decreto_base").norma.split("/")[0]}`,
];

const EXPORT_MODULES = [
  { key: "nao_conformidades", label: "Não Conformidades", table: "nao_conformidades" as const },
  { key: "recebimento_mp", label: "Recebimento de MP", table: "recebimento_mp" as const },
  { key: "producao", label: "Produção", table: "producao" as const },
  { key: "rastreabilidade", label: "Rastreabilidade", table: "rastreabilidade" as const },
  { key: "controle_pragas", label: "Controle de Pragas", table: "controle_pragas" as const },
  { key: "treinamentos", label: "Treinamentos", table: "treinamentos" as const },
  { key: "execucao_pops", label: "Execução ITs/POPs", table: "execucao_pops" as const },
  { key: "checklist_items", label: "Checklist Auditoria", table: "checklist_items" as const },
  { key: "fornecedores", label: "Fornecedores", table: "fornecedores" as const },
  { key: "calibracoes", label: "Calibrações", table: "calibracoes" as const },
  { key: "documentos", label: "Documentos/POPs", table: "documentos" as const },
] as const;

type ExportTableName = (typeof EXPORT_MODULES)[number]["table"];

interface RelatorioRow {
  id: string;
  titulo: string;
  tipo: string;
  modulo: string;
  descricao: string | null;
  arquivo_url: string | null;
  arquivo_nome: string | null;
  data_geracao: string | null;
  status: string | null;
}

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function downloadCsv(filename: string, csvContent: string) {
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const COLUMN_LABELS: Record<string, Record<string, string>> = {
  nao_conformidades: {
    data: "Data",
    setor: "Setor",
    descricao: "Descrição",
    causa: "Causa Raiz",
    acao_corretiva: "Ação Corretiva",
    responsavel: "Responsável",
    prazo: "Prazo",
    status: "Status",
  },
  recebimento_mp: {
    data: "Data",
    fornecedor: "Fornecedor",
    materia_prima: "Matéria-Prima",
    lote: "Lote",
    odor: "Odor",
    umidade: "Umidade",
    insetos: "Insetos",
    aprovado: "Aprovado",
  },
  producao: {
    data: "Data",
    produto: "Produto",
    lote: "Lote",
    operador: "Operador",
    tempo_mistura: "Tempo Mistura",
    quantidade: "Quantidade",
  },
  rastreabilidade: {
    produto: "Produto",
    lote_produto: "Lote Produto",
    materia_prima: "Matéria-Prima",
    lote_mp: "Lote MP",
    fornecedor: "Fornecedor",
    cliente_destino: "Cliente",
    data_venda: "Data Venda",
    nota_fiscal: "NF",
  },
  controle_pragas: {
    data: "Data",
    local: "Local",
    tipo_praga: "Tipo de Praga",
    acao: "Ação",
    responsavel: "Responsável",
  },
  treinamentos: {
    data: "Data",
    funcionario: "Funcionário",
    treinamento: "Treinamento",
    instrutor: "Instrutor",
    validade: "Validade",
  },
  execucao_pops: {
    data_execucao: "Data",
    codigo_pop: "Código POP",
    nome_pop: "Nome POP",
    executor: "Executor",
    setor: "Setor",
    status: "Status",
    observacoes: "Observações",
  },
  checklist_items: {
    auditoria_data: "Data",
    area: "Área",
    item: "Item",
    conforme: "Conforme",
    observacao: "Observação",
  },
  fornecedores: {
    nome: "Nome",
    cnpj: "CNPJ",
    tipo_produto: "Tipo Produto",
    status_qualificacao: "Qualificação",
    nota_avaliacao: "Nota",
    contato: "Contato",
    email: "E-mail",
  },
  calibracoes: {
    equipamento: "Equipamento",
    codigo: "Código",
    tipo: "Tipo",
    data_calibracao: "Data Calibração",
    proxima_calibracao: "Próxima",
    status: "Status",
    certificado_numero: "Certificado",
  },
  documentos: {
    codigo: "Código",
    nome: "Nome",
    versao: "Versão",
    data_revisao: "Data Revisão",
    responsavel: "Responsável",
    status: "Status",
  },
};

export default function Relatorios() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [relatorios, setRelatorios] = useState<RelatorioRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [selectedModules, setSelectedModules] = useState<string[]>([]);
  const [titulo, setTitulo] = useState("");
  const [tipo, setTipo] = useState<"digital" | "digitalizado">("digital");
  const [modulo, setModulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [arquivo, setArquivo] = useState<File | null>(null);

  // Assinatura RT
  const [rtNome, setRtNome] = useState("");
  const [rtCrmv, setRtCrmv] = useState("");
  const [rtAssinado, setRtAssinado] = useState(false);

  // Relatório Anual de Atividades
  const [anualOpen, setAnualOpen] = useState(false);
  const [anualAno, setAnualAno] = useState(new Date().getFullYear());
  const [anualExporting, setAnualExporting] = useState(false);
  const [anualRtNome, setAnualRtNome] = useState("");
  const [anualRtCrmv, setAnualRtCrmv] = useState("");

  const fetchRelatorios = async () => {
    if (!user) return;
    let q = supabase.from("relatorios").select("*").order("created_at", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await q;
    if (error) {
      toast.error("Erro ao carregar relatórios");
    } else {
      setRelatorios(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRelatorios();
  }, [user, empresaAtiva]);

  const handleAdd = async () => {
    if (!titulo || !modulo || !user) return;
    setSaving(true);

    let arquivoUrl = "";
    let arquivoNome = "";

    if (tipo === "digitalizado" && arquivo) {
      const empresaSegment = empresaAtiva ? `${empresaAtiva.id}/` : "";
      const filePath = `${user.id}/${empresaSegment}${Date.now()}_${arquivo.name}`;
      const { error: uploadError } = await supabase.storage.from("relatorios").upload(filePath, arquivo);
      if (uploadError) {
        toast.error("Erro ao enviar arquivo: " + uploadError.message);
        setSaving(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("relatorios").getPublicUrl(filePath);
      arquivoUrl = urlData.publicUrl;
      arquivoNome = arquivo.name;
    }

    const rtInfo = rtAssinado
      ? ` | [Registro com identificação do responsável, data e hora] ${rtNome} - CRMV: ${rtCrmv} - ${new Date().toISOString()}`
      : "";
    const { error } = await supabase.from("relatorios").insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      titulo,
      tipo,
      modulo,
      descricao: (descricao || "") + rtInfo,
      arquivo_url: arquivoUrl,
      arquivo_nome: arquivoNome,
    });

    if (error) {
      toast.error("Erro ao salvar relatório");
    } else {
      toast.success("Relatório salvo!");
      setOpen(false);
      setTitulo("");
      setTipo("digital");
      setModulo("");
      setDescricao("");
      setArquivo(null);
      fetchRelatorios();
    }
    setSaving(false);
  };

  const handleExportAnual = async () => {
    if (!user) return;
    setAnualExporting(true);
    try {
      const anoStart = `${anualAno}-01-01`;
      const anoEnd = `${anualAno}-12-31`;
      const now = new Date();
      const dataGeracao = now.toLocaleString("pt-BR");

      // Escopo obrigatório: todos os dados do relatório anual são da empresa ativa
      const empId = empresaAtiva?.id;
      const scoped = (q: any) => (empId ? q.eq("empresa_id", empId) : q);

      const [
        empresaRes,
        prodRes,
        recebRes,
        ncRes,
        treinRes,
        pragRes,
        execRes,
        checkRes,
        calibRes,
        limpRes,
        analisesRes,
        rastRes,
        reclamRes,
      ] = await Promise.all([
        empId
          ? supabase.from("empresas").select("*").eq("id", empId).maybeSingle()
          : supabase.from("empresas").select("*").limit(1).maybeSingle(),
        scoped(supabase.from("producao").select("*").gte("data", anoStart).lte("data", anoEnd)),
        scoped(supabase.from("recebimento_mp").select("*").gte("data", anoStart).lte("data", anoEnd)),
        scoped(supabase.from("nao_conformidades").select("*").gte("data", anoStart).lte("data", anoEnd)),
        scoped(supabase.from("treinamentos").select("*").gte("data", anoStart).lte("data", anoEnd)),
        scoped(supabase.from("controle_pragas").select("*").gte("data", anoStart).lte("data", anoEnd)),
        scoped(supabase.from("execucao_pops").select("*").gte("data_execucao", anoStart).lte("data_execucao", anoEnd)),
        scoped(
          supabase.from("checklist_items").select("*").gte("auditoria_data", anoStart).lte("auditoria_data", anoEnd),
        ),
        scoped(supabase.from("calibracoes").select("*")),
        scoped(
          supabase.from("registros_limpeza").select("*").gte("data_execucao", anoStart).lte("data_execucao", anoEnd),
        ),
        scoped(
          supabase.from("analises_laboratorio").select("*").gte("data_analise", anoStart).lte("data_analise", anoEnd),
        ),
        scoped(supabase.from("rastreabilidade").select("*")),
        scoped(
          supabase
            .from("reclamacoes_qualidade")
            .select("*")
            .gte("data_reclamacao", anoStart)
            .lte("data_reclamacao", anoEnd),
        ),
      ]);

      const emp = (empresaRes.data || {}) as any;
      const prod = prodRes.data || [];
      const receb = recebRes.data || [];
      const ncs = ncRes.data || [];
      const treins = treinRes.data || [];
      const pragas = pragRes.data || [];
      const execs = execRes.data || [];
      const checks = checkRes.data || [];
      const calibs = calibRes.data || [];
      const limps = limpRes.data || [];
      const analises = analisesRes.data || [];
      const rast = rastRes.data || [];
      const reclam = reclamRes.data || [];

      const ncAbertas = ncs.filter((n: any) => n.status === "aberta").length;
      const ncFechadas = ncs.filter((n: any) => n.status === "fechada").length;
      const checksConformes = checks.filter((c: any) => c.conforme === true).length;
      const checksTotal = checks.length;
      const pctConf = checksTotal > 0 ? ((checksConformes / checksTotal) * 100).toFixed(1) : "0";
      const analConformes = analises.filter((a: any) => a.conforme === true).length;
      const analNaoConf = analises.filter((a: any) => a.conforme === false).length;
      const recallAtivos = rast.filter((r: any) => r.recall_ativo === true);
      const funcionariosTreinados = new Set(treins.map((t: any) => t.funcionario)).size;

      const prodByProduct: Record<string, { qtd: number; lotes: number }> = {};
      prod.forEach((p: any) => {
        const key = p.produto || "Sem nome";
        if (!prodByProduct[key]) prodByProduct[key] = { qtd: 0, lotes: 0 };
        prodByProduct[key].lotes++;
        prodByProduct[key].qtd += parseFloat(p.quantidade || "0") || 0;
      });

      const ncBySetor: Record<string, number> = {};
      ncs.forEach((n: any) => {
        const s = n.setor || "N/I";
        ncBySetor[s] = (ncBySetor[s] || 0) + 1;
      });

      const treinTemas: Record<string, number> = {};
      treins.forEach((t: any) => {
        const tema = t.treinamento || "Outros";
        treinTemas[tema] = (treinTemas[tema] || 0) + 1;
      });

      const esc = (v: any) =>
        String(v ?? "")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");

      const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="UTF-8"><style>
@page{size:A4;margin:18mm 15mm}*{margin:0;padding:0;box-sizing:border-box}body{font-family:Arial,sans-serif;font-size:10pt;color:#1a1a1a;line-height:1.5}.pb{page-break-before:always}.hdr{text-align:center;border-bottom:3px solid #1a5f2a;padding-bottom:12px;margin-bottom:18px}.hdr h1{font-size:15pt;color:#1a5f2a;letter-spacing:1px}.hdr h2{font-size:11pt;color:#333;font-weight:normal}.hdr .sub{font-size:8pt;color:#666;margin-top:3px}.sec{margin-bottom:14px}.st{font-size:11pt;font-weight:bold;color:#1a5f2a;border-bottom:2px solid #1a5f2a;padding-bottom:3px;margin-bottom:8px}.sn{display:inline-block;background:#1a5f2a;color:#fff;width:20px;height:20px;text-align:center;border-radius:50%;font-size:9pt;line-height:20px;margin-right:6px}table{width:100%;border-collapse:collapse;margin:6px 0;font-size:9pt}th{background:#1a5f2a;color:#fff;padding:5px 7px;text-align:left;font-size:8pt;text-transform:uppercase}td{padding:4px 7px;border-bottom:1px solid #ddd}tr:nth-child(even){background:#f5f9f6}.kg{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:8px 0}.k{background:#f5f9f6;border:1px solid #c8e0cc;border-radius:6px;padding:8px;text-align:center}.kv{font-size:18pt;font-weight:bold;color:#1a5f2a}.kl{font-size:7pt;color:#666;text-transform:uppercase}.ig{display:grid;grid-template-columns:1fr 1fr;gap:3px 16px;margin:6px 0}.ii{font-size:9pt}.ii b{color:#333}.bo{background:#d4edda;color:#155724;padding:2px 6px;border-radius:10px;font-size:8pt;font-weight:bold}.bw{background:#fff3cd;color:#856404;padding:2px 6px;border-radius:10px;font-size:8pt;font-weight:bold}.conc{border:2px solid #1a5f2a;border-radius:8px;padding:14px;margin-top:16px;background:#f5f9f6}.sig{margin-top:24px;text-align:center}.sl{border-top:1px solid #333;width:280px;margin:32px auto 3px}.ft{margin-top:14px;text-align:center;font-size:7pt;color:#999;border-top:1px solid #ddd;padding-top:6px}.ab{background:#fff3cd;border:1px solid #ffc107;border-radius:6px;padding:8px;margin:6px 0}.nd{color:#999;font-style:italic;font-size:9pt;padding:6px 0}
</style></head><body>

<div class="hdr"><h1>RELAT&Oacute;RIO ANUAL DE AUTOCONTROLE</h1><h2>${esc(emp.nome)} &mdash; Ano ${anualAno}</h2><div class="sub">Programa de Autocontrole (PAC/BPF) &mdash; ${getBaseLegal("bpf_geral").citacao} | ${getBaseLegal("autocontrole").citacao}</div><div class="sub">Gerado em ${dataGeracao} pelo Sistema FeedBPF</div></div>

<div class="sec"><div class="st"><span class="sn">1</span>Identifica&ccedil;&atilde;o da Empresa</div>
<div class="ig"><div class="ii"><b>Raz&atilde;o Social:</b> ${esc(emp.nome) || "&mdash;"}</div><div class="ii"><b>CNPJ:</b> ${esc(emp.cnpj) || "&mdash;"}</div><div class="ii"><b>Endere&ccedil;o:</b> ${esc(emp.endereco) || "&mdash;"}</div><div class="ii"><b>Registro MAPA:</b> ${emp.crmv ? "SIF vinculado" : "&mdash;"}</div><div class="ii"><b>RT:</b> ${esc(anualRtNome || emp.responsavel_tecnico) || "&mdash;"}</div><div class="ii"><b>CRMV:</b> ${esc(anualRtCrmv || emp.crmv) || "&mdash;"}</div><div class="ii"><b>Produ&ccedil;&atilde;o:</b> ${esc((emp.tipo_producao || []).join(", ")) || "&mdash;"}</div><div class="ii"><b>Capacidade:</b> ${esc(emp.capacidade) || "&mdash;"}</div></div></div>

<div class="sec"><div class="st"><span class="sn">2</span>Resumo Produtivo Anual</div>
<div class="kg"><div class="k"><div class="kv">${prod.length}</div><div class="kl">Lotes Produzidos</div></div><div class="k"><div class="kv">${Object.keys(prodByProduct).length}</div><div class="kl">Produtos</div></div><div class="k"><div class="kv">${receb.length}</div><div class="kl">Recebimentos MP</div></div></div>
${
  Object.keys(prodByProduct).length > 0
    ? `<table><thead><tr><th>Produto</th><th>Lotes</th><th>Volume (kg)</th></tr></thead><tbody>${Object.entries(
        prodByProduct,
      )
        .map(([p, v]) => `<tr><td>${esc(p)}</td><td>${v.lotes}</td><td>${v.qtd.toLocaleString("pt-BR")}</td></tr>`)
        .join("")}</tbody></table>`
    : '<p class="nd">Sem registros de produ&ccedil;&atilde;o.</p>'
}</div>

<div class="sec"><div class="st"><span class="sn">3</span>Controle de Qualidade</div>
<div class="kg"><div class="k"><div class="kv">${analises.length}</div><div class="kl">An&aacute;lises</div></div><div class="k"><div class="kv">${analConformes}</div><div class="kl">Conformes</div></div><div class="k"><div class="kv" style="color:${analNaoConf > 0 ? "#dc3545" : "#1a5f2a"}">${analNaoConf}</div><div class="kl">Fora do Padr&atilde;o</div></div></div>
${analNaoConf > 0 ? `<div class="ab">&#9888; ${analNaoConf} resultado(s) fora do padr&atilde;o.</div>` : '<p style="color:#1a5f2a;font-size:9pt;">&#10004; Resultados dentro dos padr&otilde;es.</p>'}
<p style="font-size:9pt;margin-top:6px;"><b>Calibra&ccedil;&otilde;es:</b> ${calibs.length} equipamentos. ${calibs.filter((c: any) => c.proxima_calibracao && new Date(c.proxima_calibracao) < new Date()).length > 0 ? `<span class="bw">${calibs.filter((c: any) => c.proxima_calibracao && new Date(c.proxima_calibracao) < new Date()).length} vencida(s)</span>` : '<span class="bo">Todas em dia</span>'}</p></div>

<div class="pb"></div>

<div class="sec"><div class="st"><span class="sn">4</span>N&atilde;o Conformidades</div>
<div class="kg"><div class="k"><div class="kv">${ncs.length}</div><div class="kl">Total NCs</div></div><div class="k"><div class="kv" style="color:${ncAbertas > 0 ? "#dc3545" : "#1a5f2a"}">${ncAbertas}</div><div class="kl">Abertas</div></div><div class="k"><div class="kv">${ncFechadas}</div><div class="kl">Fechadas</div></div></div>
${
  Object.keys(ncBySetor).length > 0
    ? `<table><thead><tr><th>Setor</th><th>Qtd</th></tr></thead><tbody>${Object.entries(ncBySetor)
        .sort((a, b) => b[1] - a[1])
        .map(([s, q]) => `<tr><td>${esc(s)}</td><td>${q}</td></tr>`)
        .join("")}</tbody></table>`
    : '<p class="nd">Nenhuma NC. &#10004;</p>'
}</div>

<div class="sec"><div class="st"><span class="sn">5</span>Rastreabilidade</div>
<div class="kg"><div class="k"><div class="kv">${rast.length}</div><div class="kl">Registros</div></div><div class="k"><div class="kv">${rast.filter((r: any) => r.data_venda).length}</div><div class="kl">Vendas</div></div><div class="k"><div class="kv">${recallAtivos.length}</div><div class="kl">Recalls</div></div></div>
<p style="font-size:9pt;">${rast.length > 0 ? "Sistema montante/jusante operacional." : "Sem registros no per&iacute;odo."}</p></div>

<div class="sec"><div class="st"><span class="sn">6</span>Treinamentos</div>
<div class="kg"><div class="k"><div class="kv">${treins.length}</div><div class="kl">Sess&otilde;es</div></div><div class="k"><div class="kv">${funcionariosTreinados}</div><div class="kl">Colaboradores</div></div><div class="k"><div class="kv">${Object.keys(treinTemas).length}</div><div class="kl">Temas</div></div></div>
${
  Object.keys(treinTemas).length > 0
    ? `<table><thead><tr><th>Tema</th><th>Sess&otilde;es</th></tr></thead><tbody>${Object.entries(treinTemas)
        .sort((a, b) => b[1] - a[1])
        .map(([t, q]) => `<tr><td>${esc(t)}</td><td>${q}</td></tr>`)
        .join("")}</tbody></table>`
    : '<p class="nd">Sem treinamentos.</p>'
}</div>

<div class="sec"><div class="st"><span class="sn">7</span>Auditorias</div>
<div class="kg"><div class="k"><div class="kv">${checksTotal}</div><div class="kl">Itens Auditados</div></div><div class="k"><div class="kv">${pctConf}%</div><div class="kl">Conformidade</div></div><div class="k"><div class="kv">${execs.length}</div><div class="kl">POPs/ITs</div></div></div>
<p style="font-size:9pt;"><b>Higieniza&ccedil;&atilde;o:</b> ${limps.length} limpezas (${limps.filter((l: any) => l.conforme).length} conformes). <b>Pragas:</b> ${pragas.length} ocorr&ecirc;ncia(s).</p></div>

<div class="pb"></div>

<div class="sec"><div class="st"><span class="sn">8</span>Recall e Reclama&ccedil;&otilde;es</div>
${recallAtivos.length > 0 ? `<div class="ab">&#9888; ${recallAtivos.length} recall(s) ativo(s).</div><table><thead><tr><th>Produto</th><th>Lote</th><th>Motivo</th><th>Status</th></tr></thead><tbody>${recallAtivos.map((r: any) => `<tr><td>${esc(r.produto)}</td><td>${esc(r.lote_produto)}</td><td>${esc(r.recall_motivo)}</td><td>${esc(r.recall_status)}</td></tr>`).join("")}</tbody></table>` : '<p style="color:#1a5f2a;font-size:9pt;">&#10004; Nenhum recall no per&iacute;odo.</p>'}
<p style="font-size:9pt;margin-top:6px;"><b>Reclama&ccedil;&otilde;es:</b> ${reclam.length}${reclam.length > 0 ? ` (${reclam.filter((r: any) => r.status === "fechada" || r.status === "concluida").length} conclu&iacute;da(s))` : ""}</p></div>

<div class="conc"><div class="st"><span class="sn">9</span>Conclus&atilde;o T&eacute;cnica</div>
<p style="font-size:10pt;line-height:1.7;text-align:justify;">O presente relat&oacute;rio consolida as atividades de autocontrole da <b>${esc(emp.nome)}</b> durante <b>${anualAno}</b>, conforme BPF (${getBaseLegal("bpf_geral").citacao}, ${getBaseLegal("autocontrole").citacao}).</p>
<p style="font-size:10pt;line-height:1.7;text-align:justify;margin-top:6px;">Foram produzidos <b>${prod.length} lotes</b>, realizadas <b>${analises.length} an&aacute;lises</b>, <b>${treins.length} treinamentos</b> para <b>${funcionariosTreinados} colaborador(es)</b> e tratadas <b>${ncs.length} NC(s)</b>${ncFechadas > 0 ? ` (${ncFechadas} encerrada(s))` : ""}.${recallAtivos.length === 0 ? " N&atilde;o houve recall." : " Houve " + recallAtivos.length + " recall(s)."}</p>
<p style="font-size:10pt;line-height:1.7;text-align:justify;margin-top:6px;">Os registros atendem ${getBaseLegal("bpf_geral").citacao}, IN 15/2009, ${getBaseLegal("rotulagem").citacao} e ${getBaseLegal("decreto_base").citacao}.</p>
<div class="sig"><div class="sl"></div><p style="font-size:10pt;font-weight:bold;">${esc(anualRtNome || emp.responsavel_tecnico || "Respons&aacute;vel T&eacute;cnico")}</p><p style="font-size:9pt;">CRMV: ${esc(anualRtCrmv || emp.crmv) || "&mdash;"}</p><p style="font-size:8pt;color:#666;margin-top:3px;">[Registro com identificação do responsável, data e hora &mdash; ${now.toISOString()}]</p></div></div>

<div class="ft"><p>Relat&oacute;rio Anual de Autocontrole &mdash; ${esc(emp.nome)} &mdash; ${anualAno}</p><p>BPF_Consult &mdash; ${dataGeracao}</p><p>${getBaseLegal("bpf_geral").citacao} | IN 15/2009 | ${getBaseLegal("autocontrole").citacao}</p></div>
${(() => {
  const ts = new Date();
  const dt = ts.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  let h = 5381;
  const base = `Relatório Anual|${anualAno}|${emp.nome}|${ts.toISOString()}`;
  for (let i = 0; i < base.length; i++) h = (h << 5) + h + base.charCodeAt(i);
  const hash = (h >>> 0).toString(16).padStart(8, "0").toUpperCase().slice(0, 12);
  return `<div style="margin-top:14px;padding:8px 10px;border-top:2px solid #1a1a2e;font-family:Arial,sans-serif;font-size:9px;color:#444;background:#fafafa;">
    <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
      <div><strong>Relat&oacute;rio Anual de Autocontrole</strong> &mdash; ${anualAno}<br/>Empresa: ${esc(emp.nome)}</div>
      <div style="text-align:right;">Emitido em: <strong>${dt}</strong><br/><span style="font-family:monospace;color:#1a1a2e;">INTEGRIDADE: ${hash}</span></div>
    </div>
    <div style="margin-top:4px;font-size:8px;color:#888;">Registro com identificação do responsável, data e hora; selo de integridade &mdash; ${getBaseLegal("autocontrole").norma} (${getBaseLegal("autocontrole").artigo}, §3º).</div>
  </div>`;
})()}
</body></html>`;

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        toast.error("Permita pop-ups para gerar o PDF");
        setAnualExporting(false);
        return;
      }
      printWindow.document.write(html);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 600);
      toast.success("Relatório Anual gerado! Use 'Salvar como PDF' na janela de impressão.");
      setAnualOpen(false);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao gerar relatório anual");
    }
    setAnualExporting(false);
  };

  const toggleModule = (key: string) => {
    setSelectedModules((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  };

  const selectAll = () => {
    if (selectedModules.length === EXPORT_MODULES.length) {
      setSelectedModules([]);
    } else {
      setSelectedModules(EXPORT_MODULES.map((m) => m.key));
    }
  };

  const handleExport = async () => {
    if (!user || selectedModules.length === 0) {
      toast.error("Selecione ao menos um módulo");
      return;
    }
    setExporting(true);

    try {
      const modulesToExport = EXPORT_MODULES.filter((m) => selectedModules.includes(m.key));
      const now = new Date();
      const dataHora = now.toLocaleString("pt-BR");
      const dataLabel = now.toISOString().slice(0, 10);

      // Cabeçalho — registros de rastreabilidade
      let fullCsv = "";
      fullCsv += `RELATÓRIO DE REGISTROS — SISTEMA BPF\n`;
      fullCsv += `${citar("Decreto 12.031/2024", "arts. 41 e 57, §2º")} — Disponibilização de registros ao SIF/MAPA\n`;
      fullCsv += `Data/Hora de Geração: ${dataHora}\n`;
      fullCsv += `Módulos incluídos: ${modulesToExport.map((m) => m.label).join(", ")}\n`;
      fullCsv += `Total de módulos: ${modulesToExport.length}\n`;
      fullCsv += `\n`;

      for (const mod of modulesToExport) {
        let modQuery = supabase.from(mod.table).select("*").order("created_at", { ascending: false });
        if (empresaAtiva?.id) modQuery = modQuery.eq("empresa_id", empresaAtiva.id);
        const { data, error } = await modQuery;

        if (error) {
          toast.error(`Erro ao exportar ${mod.label}`);
          continue;
        }

        const rows = data || [];
        const labels = COLUMN_LABELS[mod.key] || {};
        const columns = Object.keys(labels);

        fullCsv += `\n========================================\n`;
        fullCsv += `MÓDULO: ${mod.label.toUpperCase()}\n`;
        fullCsv += `Total de Registros: ${rows.length}\n`;
        fullCsv += `========================================\n`;

        fullCsv += columns.map((c) => escapeCsv(labels[c])).join(",") + "\n";

        for (const row of rows) {
          const r = row as Record<string, unknown>;
          fullCsv +=
            columns
              .map((c) => {
                const val = r[c];
                if (typeof val === "boolean") return val ? "Sim" : "Não";
                return escapeCsv(val);
              })
              .join(",") + "\n";
        }

        fullCsv += "\n";
      }

      // Footer
      fullCsv += `\n========================================\n`;
      fullCsv += `FIM DO RELATÓRIO\n`;
      fullCsv += `Gerado em: ${dataHora}\n`;
      fullCsv += `${citar("Decreto 12.031/2024", "arts. 41 e 57, §2º")}: Os registros devem estar disponíveis ao SIF em formato organizado.\n`;
      fullCsv += `Este documento é parte integrante do programa de autocontrole (PAC/BPF).\n`;
      fullCsv += `========================================\n`;

      const label =
        selectedModules.length === 1
          ? EXPORT_MODULES.find((m) => m.key === selectedModules[0])?.label.replace(/\s/g, "_") || "modulo"
          : "MAPA_completo";
      downloadCsv(`relatorio_${label}_${dataLabel}.csv`, fullCsv);
      toast.success(`Relatório exportado com ${selectedModules.length} módulo(s)!`);
      setExportOpen(false);
    } catch {
      toast.error("Erro ao exportar relatório");
    }
    setExporting(false);
  };

  const digitais = relatorios.filter((r) => r.tipo === "digital");
  const digitalizados = relatorios.filter((r) => r.tipo === "digitalizado");

  return (
    <>
      <PageHeader
        icon={FileDown}
        title="Relatórios"
        description="Relatórios digitais e documentos digitalizados"
        orientacaoModuloId="relatorios"
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display">{relatorios.length}</p>
            <p className="text-xs text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex justify-center mb-1">
              <Monitor className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-bold font-display text-primary">{digitais.length}</p>
            <p className="text-xs text-muted-foreground">Digitais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <div className="flex justify-center mb-1">
              <ScanLine className="w-5 h-5 text-accent" />
            </div>
            <p className="text-2xl font-bold font-display text-accent">{digitalizados.length}</p>
            <p className="text-xs text-muted-foreground">Digitalizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-muted-foreground">
              {relatorios.filter((r) => r.status === "arquivado").length}
            </p>
            <p className="text-xs text-muted-foreground">Arquivados</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mb-6">
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <Monitor className="w-8 h-8 text-primary mt-1 shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-sm">Relatórios Digitais</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Para empresas médias e maiores com dispositivo eletrônico de registro.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-accent/20 bg-accent/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-3">
              <ScanLine className="w-8 h-8 text-accent mt-1 shrink-0" />
              <div>
                <h3 className="font-display font-semibold text-sm">Documentos Digitalizados</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Para empresas menores com planilha em papel assinada e escaneada.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display">Relatórios</CardTitle>
          <div className="flex gap-2 flex-wrap">
            {/* Relatório Anual de Atividades */}
            <Dialog open={anualOpen} onOpenChange={setAnualOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="border-primary/30 text-primary hover:bg-primary/10">
                  <CalendarDays className="w-4 h-4 mr-1" /> Relatório Anual de Atividades
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Relatório Anual de Atividades
                  </DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Gera o Relatório Anual de Atividades do autocontrole, consolidando todos os registros do ano
                  selecionado.
                </p>
                <div className="space-y-4 mt-2">
                  <div>
                    <Label>Ano de referência</Label>
                    <Select value={String(anualAno)} onValueChange={(v) => setAnualAno(Number(v))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(
                          (y) => (
                            <SelectItem key={y} value={String(y)}>
                              {y}
                            </SelectItem>
                          ),
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Nome do RT</Label>
                      <Input
                        value={anualRtNome}
                        onChange={(e) => setAnualRtNome(e.target.value)}
                        placeholder="Dr(a). Nome"
                      />
                    </div>
                    <div>
                      <Label>CRMV</Label>
                      <Input
                        value={anualRtCrmv}
                        onChange={(e) => setAnualRtCrmv(e.target.value)}
                        placeholder="CRMV-XX 00000"
                      />
                    </div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/30 border space-y-1">
                    <p className="text-xs font-semibold flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Seções do PDF:
                    </p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-0.5 text-[11px] text-muted-foreground">
                      <span>1. Identificação da Empresa</span>
                      <span>2. Resumo Produtivo Anual</span>
                      <span>3. Controle de Qualidade</span>
                      <span>4. Não Conformidades</span>
                      <span>5. Rastreabilidade</span>
                      <span>6. Treinamentos</span>
                      <span>7. Auditorias</span>
                      <span>8. Recall e Reclamações</span>
                      <span>9. Conclusão Técnica + Identificação do RT</span>
                    </div>
                  </div>
                  <Button onClick={handleExportAnual} className="w-full" disabled={anualExporting}>
                    {anualExporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    Gerar Relatório Anual {anualAno}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={exportOpen} onOpenChange={setExportOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                  <Download className="w-4 h-4 mr-1" /> Exportar Dados
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Exportar Relatório <BaseLegalBadge assunto="decreto_base" /></DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
 Selecione os módulos para gerar relatório organizado xigência do MAPA.
 </p>
                <p className="text-[10px] text-muted-foreground">
                  O relatório inclui cabeçalho institucional, data/hora de geração e rodapé com referência normativa
                  para apresentação a fiscais do SIF.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <Checkbox
                    checked={selectedModules.length === EXPORT_MODULES.length}
                    onCheckedChange={selectAll}
                    id="select-all"
                  />
                  <Label htmlFor="select-all" className="text-sm font-semibold cursor-pointer">
                    {selectedModules.length === EXPORT_MODULES.length
                      ? "Desmarcar todos"
                      : "Selecionar todos (Relatório Completo)"}
                  </Label>
                </div>
                <div className="border rounded-md p-3 space-y-2 max-h-64 overflow-y-auto mt-1">
                  {EXPORT_MODULES.map((mod) => (
                    <div key={mod.key} className="flex items-center gap-2">
                      <Checkbox
                        checked={selectedModules.includes(mod.key)}
                        onCheckedChange={() => toggleModule(mod.key)}
                        id={`mod-${mod.key}`}
                      />
                      <Label htmlFor={`mod-${mod.key}`} className="text-sm cursor-pointer">
                        {mod.label}
                      </Label>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={handleExport}
                    className="flex-1"
                    disabled={exporting || selectedModules.length === 0}
                  >
                    {exporting ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    CSV {selectedModules.length > 0 ? `(${selectedModules.length})` : ""}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={exporting || selectedModules.length === 0}
                    onClick={async () => {
                      if (!user || selectedModules.length === 0) return;
                      setExporting(true);
                      try {
                        for (const key of selectedModules) {
                          const mod = EXPORT_MODULES.find((m) => m.key === key);
                          if (!mod) continue;
                          let pdfQuery = supabase.from(mod.table).select("*").order("created_at", { ascending: false });
                          if (empresaAtiva?.id) pdfQuery = pdfQuery.eq("empresa_id", empresaAtiva.id);
                          const { data } = await pdfQuery;
                          const labels = COLUMN_LABELS[mod.key] || {};
                          const cols = Object.keys(labels);
                          gerarRelatorioPDF({
                            title: `Relatório — ${mod.label}`,
                            subtitle: citar("Decreto 12.031/2024", "arts. 41 e 57, §2º"),
                            columns: cols.map((c) => ({ header: labels[c], accessor: c })),
                            data: (data || []) as Record<string, unknown>[],
                          });
                        }
                        toast.success("PDF(s) gerado(s)!");
                      } catch {
                        toast.error("Erro ao gerar PDF");
                      }
                      setExporting(false);
                    }}
                  >
                    <Printer className="w-4 h-4 mr-2" /> PDF
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-1" /> Novo Relatório
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>Adicionar Relatório</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Título</Label>
                    <Input
                      value={titulo}
                      onChange={(e) => setTitulo(e.target.value)}
                      placeholder="Título do relatório"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Tipo</Label>
                      <Select value={tipo} onValueChange={(v: "digital" | "digitalizado") => setTipo(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="digital">📊 Digital</SelectItem>
                          <SelectItem value="digitalizado">📄 Digitalizado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Módulo</Label>
                      <Select value={modulo} onValueChange={setModulo}>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          {MODULOS.map((m) => (
                            <SelectItem key={textoTela(m)} value={textoTela(m)}>
                              {textoTela(m)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Descrição</Label>
                    <Textarea
                      value={descricao}
                      onChange={(e) => setDescricao(e.target.value)}
                      placeholder="Descrição do relatório..."
                    />
                  </div>
                  {tipo === "digitalizado" && (
                    <div>
                      <Label>Arquivo digitalizado (PDF, foto)</Label>
                      <div className="mt-1 flex items-center gap-2">
                        <Input
                          type="file"
                          accept=".pdf,.jpg,.jpeg,.png"
                          onChange={(e) => setArquivo(e.target.files?.[0] || null)}
                        />
                        <Upload className="w-5 h-5 text-muted-foreground shrink-0" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Planilha preenchida em papel, assinada e escaneada/fotografada
                      </p>
                    </div>
                  )}
                  {/* Identificação do responsável técnico */}
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" /> Registro com identificação do responsável, data e hora
                      </p>
                      <Switch checked={rtAssinado} onCheckedChange={setRtAssinado} />
                    </div>
                    {rtAssinado && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Nome do RT</Label>
                          <Input
                            value={rtNome}
                            onChange={(e) => setRtNome(e.target.value)}
                            placeholder="Dr(a). Nome Completo"
                          />
                        </div>
                        <div>
                          <Label>CRMV</Label>
                          <Input
                            value={rtCrmv}
                            onChange={(e) => setRtCrmv(e.target.value)}
                            placeholder="CRMV-XX 00000"
                          />
                        </div>
                      </div>
                    )}
                    {rtAssinado && (
                      <p className="text-xs text-primary">
                        ✓ Registro com identificação do responsável, data e hora ao salvar o relatório.
                      </p>
                    )}
                  </div>

                  <Button onClick={handleAdd} className="w-full" disabled={saving}>
                    {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {rtAssinado ? "Salvar com identificação do responsável" : "Salvar Relatório"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <Tabs defaultValue="todos">
              <TabsList className="mb-4">
                <TabsTrigger value="todos">Todos ({relatorios.length})</TabsTrigger>
                <TabsTrigger value="digitais">Digitais ({digitais.length})</TabsTrigger>
                <TabsTrigger value="digitalizados">Digitalizados ({digitalizados.length})</TabsTrigger>
              </TabsList>
              {["todos", "digitais", "digitalizados"].map((tab) => (
                <TabsContent key={tab} value={tab} className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Data</TableHead>
                        <TableHead>Título</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Módulo</TableHead>
                        <TableHead>Arquivo</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(tab === "todos" ? relatorios : tab === "digitais" ? digitais : digitalizados).length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                            Nenhum relatório cadastrado
                          </TableCell>
                        </TableRow>
                      ) : (
                        (tab === "todos" ? relatorios : tab === "digitais" ? digitais : digitalizados).map((r) => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap">{r.data_geracao}</TableCell>
                            <TableCell>
                              <p className="font-medium text-sm">{r.titulo}</p>
                              <p className="text-xs text-muted-foreground">{r.descricao}</p>
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={
                                  r.tipo === "digital" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent"
                                }
                              >
                                {r.tipo === "digital" ? "Digital" : "Digitalizado"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">{textoTela(r.modulo)}</TableCell>
                            <TableCell>
                              {r.arquivo_nome ? (
                                <Button variant="ghost" size="sm" className="gap-1 text-xs" asChild>
                                  <a href={r.arquivo_url || "#"} target="_blank" rel="noopener noreferrer">
                                    <Eye className="w-3 h-3" /> {r.arquivo_nome}
                                  </a>
                                </Button>
                              ) : (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant={r.status === "ativo" ? "default" : "secondary"}>
                                {r.status === "ativo" ? "Ativo" : "Arquivado"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </>
  );
}
