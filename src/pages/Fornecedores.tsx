import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Users, Plus, Loader2, Star, AlertCircle, CheckCircle2, Clock, FileText, Download, Printer, ExternalLink, Search, Edit } from "lucide-react";
import { format } from "date-fns";
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
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import {
  exportQuestionarioBlankXlsx,
  exportQuestionarioPreenchidoXlsx,
  exportListaAprovadosXlsx,
  printQuestionario,
  printListaAprovados,
} from "@/utils/fornecedorExport";

interface FornecedorRow {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  bairro: string | null;
  cep: string | null;
  cidade: string | null;
  estado: string | null;
  inscricao_estadual: string | null;
  registro_mapa: string | null;
  contato: string | null;
  email: string | null;
  contato_qualidade: string | null;
  contato_qualidade_tel_email: string | null;
  contato_comercial: string | null;
  contato_comercial_tel_email: string | null;
  tipo_produto: string | null;
  produtos_fornecidos: string | null;
  status_qualificacao: string | null;
  nota_avaliacao: number | null;
  ultima_avaliacao: string | null;
  proxima_avaliacao: string | null;
  observacoes: string | null;
  registro_sipeagro: string | null;
  sipeagro_verificado: boolean | null;
  doc_certificado_registro_mapa: boolean | null;
  doc_alvara_funcionamento: boolean | null;
  doc_certificado_registro_produto: boolean | null;
  doc_ficha_tecnica: boolean | null;
  doc_certificado_analise: boolean | null;
  resultado_qualificacao: string | null;
  created_at: string;
  auditorias?: any[];
}

interface MapaEstabelecimentoResumo {
  razao_social: string;
  cnpj: string | null;
  registro_estabelecimento: string | null;
  situacao: string | null;
  municipio: string | null;
  uf: string | null;
  data_atualizacao_fonte: string | null;
}

interface RecebimentoRow {
  id: string;
  data: string;
  fornecedor: string;
  materia_prima: string;
  lote: string | null;
  aprovado: boolean | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: typeof CheckCircle2 }> = {
  aprovado: { label: "Aprovado", color: "bg-primary text-primary-foreground", icon: CheckCircle2 },
  aprovado_com_restricoes: { label: "Aprovado c/ Restrições", color: "bg-yellow-600/20 text-yellow-700", icon: CheckCircle2 },
  pendente: { label: "Pendente", color: "bg-accent text-accent-foreground", icon: Clock },
  reprovado: { label: "Reprovado", color: "bg-destructive text-destructive-foreground", icon: AlertCircle },
  em_avaliacao: { label: "Em Avaliação", color: "bg-yellow-500/20 text-yellow-700", icon: Clock },
};

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
const cleanLikeValue = (s: string) => s.replace(/[%_,]/g, " ").trim();

const ESTADOS_BR = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA",
  "PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"
];

export default function Fornecedores() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [fornecedores, setFornecedores] = useState<FornecedorRow[]>([]);
  const [recebimentos, setRecebimentos] = useState<RecebimentoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [avaliarOpen, setAvaliarOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [formTab, setFormTab] = useState("dados");

  // Form - Dados do Fornecedor
  const [nome, setNome] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [endereco, setEndereco] = useState("");
  const [bairro, setBairro] = useState("");
  const [cep, setCep] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [registroMapa, setRegistroMapa] = useState("");
  const [contatoQualidade, setContatoQualidade] = useState("");
  const [contatoQualidadeTelEmail, setContatoQualidadeTelEmail] = useState("");
  const [contatoComercial, setContatoComercial] = useState("");
  const [contatoComercialTelEmail, setContatoComercialTelEmail] = useState("");
  const [dataAvaliacao, setDataAvaliacao] = useState(new Date().toISOString().split("T")[0]);

  // Form - Produtos
  const [produtosFornecidos, setProdutosFornecidos] = useState("");
  const [tipoProduto, setTipoProduto] = useState("");

  // Form - Documentos
  const [docCertRegistroMapa, setDocCertRegistroMapa] = useState(false);
  const [docAlvara, setDocAlvara] = useState(false);
  const [docCertRegistroProduto, setDocCertRegistroProduto] = useState(false);
  const [docFichaTecnica, setDocFichaTecnica] = useState(false);
  const [docCertAnalise, setDocCertAnalise] = useState(false);

  // Form - Resultado
  const [resultadoQualificacao, setResultadoQualificacao] = useState("pendente");
  const [observacoes, setObservacoes] = useState("");

  // SIPEAGRO
  const [registroSipeagro, setRegistroSipeagro] = useState("");
  const [sipeagroVerificado, setSipeagroVerificado] = useState(false);
  const [mapaStatus, setMapaStatus] = useState<"idle" | "loading" | "found" | "not_found">("idle");
  const [mapaResultados, setMapaResultados] = useState<MapaEstabelecimentoResumo[]>([]);

  // Avaliação
  const [nota, setNota] = useState(0);
  const [statusQual, setStatusQual] = useState("aprovado");
  const [obsAval, setObsAval] = useState("");
  const [auditData, setAuditData] = useState<any[]>([]);

  const fetchData = async () => {
    if (!user) return;
    let fornQ = supabase.from("fornecedores").select("*, auditorias:fornecedor_auditorias(*)").order("nome");
    let recQ = supabase.from("recebimento_mp").select("id, data, fornecedor, materia_prima, lote, aprovado").order("data", { ascending: false }).limit(100);
    if (empresaAtiva) {
      fornQ = fornQ.eq("empresa_id", empresaAtiva.id);
      recQ = recQ.eq("empresa_id", empresaAtiva.id);
    }
    const [fornRes, recRes] = await Promise.all([fornQ, recQ]);
    if (fornRes.data) setFornecedores(fornRes.data as unknown as FornecedorRow[]);
    if (recRes.data) setRecebimentos(recRes.data as unknown as RecebimentoRow[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, empresaAtiva]);

  const resetForm = () => {
    setNome(""); setCnpj(""); setEndereco(""); setBairro(""); setCep(""); setCidade(""); setEstado("");
    setInscricaoEstadual(""); setRegistroMapa(""); setContatoQualidade(""); setContatoQualidadeTelEmail("");
    setContatoComercial(""); setContatoComercialTelEmail(""); setProdutosFornecidos(""); setTipoProduto("");
    setDocCertRegistroMapa(false); setDocAlvara(false); setDocCertRegistroProduto(false);
    setDocFichaTecnica(false); setDocCertAnalise(false); setResultadoQualificacao("pendente");
    setObservacoes(""); setRegistroSipeagro(""); setSipeagroVerificado(false);
    setMapaStatus("idle"); setMapaResultados([]);
    setDataAvaliacao(new Date().toISOString().split("T")[0]); setFormTab("dados");
  };

  const verificarNoMapa = async (registro: string) => {
    const cnpjDigits = onlyDigits(cnpj);
    const filtros = [`registro_estabelecimento.ilike.%${cleanLikeValue(registro)}%`];
    if (cnpjDigits.length >= 11) filtros.push(`cnpj.ilike.%${cnpjDigits}%`);

    setMapaStatus("loading");

    const { data, error } = await supabase
      .from("mapa_estabelecimentos")
      .select("razao_social, cnpj, registro_estabelecimento, situacao, municipio, uf, data_atualizacao_fonte")
      .or(filtros.join(","))
      .limit(10);

    if (error) {
      setMapaStatus("idle");
      setMapaResultados([]);
      return;
    }

    const encontrados = (data as MapaEstabelecimentoResumo[]) || [];
    setMapaResultados(encontrados);
    setMapaStatus(encontrados.length > 0 ? "found" : "not_found");
  };

  const selecionarResultadoMapa = (item: MapaEstabelecimentoResumo) => {
    setNome(item.razao_social || "");
    if (item.cnpj) setCnpj(item.cnpj);
    setRegistroSipeagro(item.registro_estabelecimento || "");
  };

  useEffect(() => {
    const registro = registroSipeagro.trim();
    if (!open || registro.length < 3) {
      setMapaStatus("idle");
      setMapaResultados([]);
      return;
    }

    const timeout = setTimeout(() => {
      verificarNoMapa(registro);
    }, 500);

    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registroSipeagro, open]);

  const handleAdd = async () => {
    if (!nome || !user) return;
    setSaving(true);
    const payload = {
      user_id: user.id, empresa_id: empresaAtiva?.id || null, nome, cnpj, endereco, contato: contatoQualidade, email: contatoQualidadeTelEmail,
      tipo_produto: tipoProduto, observacoes,
      bairro, cep, cidade, estado, inscricao_estadual: inscricaoEstadual,
      registro_mapa: registroMapa, contato_qualidade: contatoQualidade,
      contato_qualidade_tel_email: contatoQualidadeTelEmail,
      contato_comercial: contatoComercial, contato_comercial_tel_email: contatoComercialTelEmail,
      produtos_fornecidos: produtosFornecidos,
      doc_certificado_registro_mapa: docCertRegistroMapa,
      doc_alvara_funcionamento: docAlvara,
      doc_certificado_registro_produto: docCertRegistroProduto,
      doc_ficha_tecnica: docFichaTecnica,
      doc_certificado_analise: docCertAnalise,
      resultado_qualificacao: resultadoQualificacao,
      status_qualificacao: resultadoQualificacao,
      registro_sipeagro: registroSipeagro,
      sipeagro_verificado: sipeagroVerificado,
      sipeagro_data_verificacao: sipeagroVerificado ? new Date().toISOString().split("T")[0] : null,
    } as any;

    let error;
    if (selectedId) {
        ({ error } = await supabase.from("fornecedores").update(payload).eq("id", selectedId));
    } else {
        ({ error } = await supabase.from("fornecedores").insert(payload));
    }

    if (error) toast.error("Erro ao salvar");
    else { toast.success(selectedId ? "Fornecedor atualizado!" : "Fornecedor cadastrado!"); setOpen(false); resetForm(); fetchData(); }
    setSaving(false);
  };

  const handleEdit = (f: FornecedorRow) => {
    setSelectedId(f.id);
    setNome(f.nome || ""); setCnpj(f.cnpj || ""); setEndereco(f.endereco || ""); setBairro(f.bairro || ""); setCep(f.cep || ""); setCidade(f.cidade || ""); setEstado(f.estado || "");
    setInscricaoEstadual(f.inscricao_estadual || ""); setRegistroMapa(f.registro_mapa || ""); setContatoQualidade(f.contato_qualidade || ""); setContatoQualidadeTelEmail(f.contato_qualidade_tel_email || "");
    setContatoComercial(f.contato_comercial || ""); setContatoComercialTelEmail(f.contato_comercial_tel_email || ""); setProdutosFornecidos(f.produtos_fornecidos || ""); setTipoProduto(f.tipo_produto || "");
    setDocCertRegistroMapa(!!f.doc_certificado_registro_mapa); setDocAlvara(!!f.doc_alvara_funcionamento); setDocCertRegistroProduto(!!f.doc_certificado_registro_produto);
    setDocFichaTecnica(!!f.doc_ficha_tecnica); setDocCertAnalise(!!f.doc_certificado_analise); setResultadoQualificacao(f.resultado_qualificacao || "pendente");
    setObservacoes(f.observacoes || ""); setRegistroSipeagro(f.registro_sipeagro || ""); setSipeagroVerificado(!!f.sipeagro_verificado);
    setMapaStatus("idle"); setMapaResultados([]);
    setOpen(true);
  };

  const unusedHandleAdd = async () => {
    if (!nome || !user) return;
    setSaving(true);
    const { error } = await supabase.from("fornecedores").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id || null, nome, cnpj, endereco, contato: contatoQualidade, email: contatoQualidadeTelEmail,
      tipo_produto: tipoProduto, observacoes,
      bairro, cep, cidade, estado, inscricao_estadual: inscricaoEstadual,
      registro_mapa: registroMapa, contato_qualidade: contatoQualidade,
      contato_qualidade_tel_email: contatoQualidadeTelEmail,
      contato_comercial: contatoComercial, contato_comercial_tel_email: contatoComercialTelEmail,
      produtos_fornecidos: produtosFornecidos,
      doc_certificado_registro_mapa: docCertRegistroMapa,
      doc_alvara_funcionamento: docAlvara,
      doc_certificado_registro_produto: docCertRegistroProduto,
      doc_ficha_tecnica: docFichaTecnica,
      doc_certificado_analise: docCertAnalise,
      resultado_qualificacao: resultadoQualificacao,
      status_qualificacao: resultadoQualificacao,
      registro_sipeagro: registroSipeagro,
      sipeagro_verificado: sipeagroVerificado,
      sipeagro_data_verificacao: sipeagroVerificado ? new Date().toISOString().split("T")[0] : null,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else { toast.success("Fornecedor cadastrado!"); setOpen(false); resetForm(); fetchData(); }
    setSaving(false);
  };

  const handleAvaliar = async () => {
    if (!selectedId) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const proxima = new Date();
    proxima.setMonth(proxima.getMonth() + 6);
    const { error } = await supabase.from("fornecedores").update({
      nota_avaliacao: nota,
      status_qualificacao: statusQual,
      ultima_avaliacao: today,
      proxima_avaliacao: proxima.toISOString().split("T")[0],
      observacoes: obsAval,
    } as any).eq("id", selectedId);
    if (error) toast.error("Erro ao avaliar");
    else { toast.success("Avaliação registrada!"); setAvaliarOpen(false); setSelectedId(null); fetchData(); }
    setSaving(false);
  };

  const getRecebimentosFornecedor = (nomeForn: string) =>
    recebimentos.filter(r => r.fornecedor.toLowerCase() === nomeForn.toLowerCase());

  const getTaxaAprovacao = (nomeForn: string) => {
    const recs = getRecebimentosFornecedor(nomeForn);
    if (recs.length === 0) return null;
    return Math.round((recs.filter(r => r.aprovado).length / recs.length) * 100);
  };

  const aprovados = fornecedores.filter(f => f.status_qualificacao === "aprovado" || f.status_qualificacao === "aprovado_com_restricoes");
  const pendentes = fornecedores.filter(f => f.status_qualificacao === "pendente" || f.status_qualificacao === "em_avaliacao");
  const reprovados = fornecedores.filter(f => f.status_qualificacao === "reprovado");

  return (
    <>
      <PageHeader icon={Users} title="POP 01 - Qualificação de Fornecedores" description="Cadastro, avaliação e histórico integrado ao Recebimento de MP"
        orientacaoModuloId="fornecedores" assuntoBaseLegal="registro_estabelecimento" />

      {/* Validação SIPEAGRO — links oficiais MAPA */}
      <Card className="border-primary/40 bg-primary/5 mb-6">
        <CardContent className="pt-4 pb-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1">
            <p className="font-semibold text-sm">🏛️ Validar fornecedor no MAPA/SIPEAGRO</p>
            <p className="text-xs text-muted-foreground mt-1">
              Lista oficial atualizada semanalmente. Consulte por CNPJ, Razão Social ou nº de registro antes de aprovar fornecedores de insumos para alimentação animal (registro de estabelecimentos).
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 shrink-0">
            <Button asChild size="sm" className="gap-2 w-full"><Link to="/consulta-sipeagro"><ExternalLink className="w-4 h-4" />Base interna MAPA</Link></Button>
            <Button asChild size="sm" variant="outline" className="gap-2 w-full"><Link to="/consulta-sipeagro"><Search className="w-4 h-4" />Consultar no sistema</Link></Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{fornecedores.length}</p>
          <p className="text-xs text-muted-foreground">Fornecedores</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-primary">{aprovados.length}</p>
          <p className="text-xs text-muted-foreground">Aprovados</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-accent">{pendentes.length}</p>
          <p className="text-xs text-muted-foreground">Pendentes</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{reprovados.length}</p>
          <p className="text-xs text-muted-foreground">Reprovados</p>
        </CardContent></Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <CardTitle className="font-display">Fornecedores Cadastrados</CardTitle>
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="outline" onClick={() => exportQuestionarioBlankXlsx()}>
              <Download className="w-3.5 h-3.5 mr-1" /> Modelo Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => printQuestionario()}>
              <Printer className="w-3.5 h-3.5 mr-1" /> Modelo PDF
            </Button>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
              <DialogTrigger asChild>
                <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Novo Fornecedor</Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Questionário de Qualificação — PL POP 1.1
                </DialogTitle>
              </DialogHeader>

              <Tabs value={formTab} onValueChange={setFormTab}>
                <TabsList className="grid grid-cols-5 w-full">
                  <TabsTrigger value="dados" className="text-xs">1. Dados</TabsTrigger>
                  <TabsTrigger value="produtos" className="text-xs">2. Produtos</TabsTrigger>
                  <TabsTrigger value="documentos" className="text-xs">3. Documentos</TabsTrigger>
                  <TabsTrigger value="resultado" className="text-xs">4. Resultado</TabsTrigger>
                  <TabsTrigger value="auditorias" className="text-xs">5. Auditorias</TabsTrigger>
                </TabsList>

                {/* ABA 1 — DADOS DO FORNECEDOR */}
                <TabsContent value="dados" className="space-y-4 mt-4">
                  <h3 className="text-sm font-semibold border-b pb-1">1 — Dados do Fornecedor</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1">
                      <Label>Nome / Razão Social *</Label>
                      <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: AgroCorp Ltda" />
                    </div>
                    <div>
                      <Label>Data</Label>
                      <Input type="date" value={dataAvaliacao} onChange={e => setDataAvaliacao(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Endereço</Label>
                      <Input value={endereco} onChange={e => setEndereco(e.target.value)} placeholder="Rua, número" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Nº Registro MAPA</Label>
                      <Input value={registroMapa} onChange={e => setRegistroMapa(e.target.value)} placeholder="Ex: BR-00000" />
                    </div>
                    <div>
                      <Label>Bairro</Label>
                      <Input value={bairro} onChange={e => setBairro(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <Label>CEP</Label>
                      <Input value={cep} onChange={e => setCep(e.target.value)} placeholder="00000-000" />
                    </div>
                    <div>
                      <Label>Cidade</Label>
                      <Input value={cidade} onChange={e => setCidade(e.target.value)} />
                    </div>
                    <div>
                      <Label>Estado</Label>
                      <Select value={estado} onValueChange={setEstado}>
                        <SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger>
                        <SelectContent>
                          {ESTADOS_BR.map(uf => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>CNPJ</Label>
                      <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                    </div>
                    <div>
                      <Label>Inscrição Estadual</Label>
                      <Input value={inscricaoEstadual} onChange={e => setInscricaoEstadual(e.target.value)} />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label>Contato Qualidade</Label>
                      <Input value={contatoQualidade} onChange={e => setContatoQualidade(e.target.value)} placeholder="Nome do contato" />
                    </div>
                    <div>
                      <Label>Telefone / E-mail (Qualidade)</Label>
                      <Input value={contatoQualidadeTelEmail} onChange={e => setContatoQualidadeTelEmail(e.target.value)} placeholder="(00) 00000-0000 / email" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Contato Comercial</Label>
                      <Input value={contatoComercial} onChange={e => setContatoComercial(e.target.value)} placeholder="Nome do contato" />
                    </div>
                    <div>
                      <Label>Telefone / E-mail (Comercial)</Label>
                      <Input value={contatoComercialTelEmail} onChange={e => setContatoComercialTelEmail(e.target.value)} placeholder="(00) 00000-0000 / email" />
                    </div>
                  </div>

                  {/* SIPEAGRO */}
                  <div className="p-3 rounded-lg border bg-muted/20 space-y-3">
                    <p className="text-sm font-semibold flex items-center gap-2">🏛️ Registro SIPEAGRO</p>
                    <p className="text-[10px] text-muted-foreground">Estabelecimentos fornecedores de insumos para alimentação animal devem possuir registro no SIPEAGRO/MAPA.</p>
                    <div>
                      <Label>Nº Registro SIPEAGRO</Label>
                      <Input value={registroSipeagro} onChange={e => setRegistroSipeagro(e.target.value)} placeholder="Ex: BR-0000000000" />
                    </div>
                    <p className="text-[10px] text-muted-foreground">Ao digitar (mín. 3 caracteres), a base MAPA é consultada automaticamente por este registro ou pelo CNPJ já preenchido acima.</p>

                    {mapaStatus !== "idle" && (
                      <div className="space-y-1">
                        {mapaStatus === "loading" ? (
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Loader2 className="w-3 h-3 animate-spin" /> Consultando base MAPA...
                          </p>
                        ) : mapaStatus === "not_found" ? (
                          <p className="rounded border bg-muted/30 border-muted p-2 text-xs text-muted-foreground">
                            Nenhum estabelecimento encontrado na base MAPA para este registro/CNPJ.
                          </p>
                        ) : (
                          <>
                            <p className="text-[10px] text-muted-foreground">
                              {mapaResultados.length > 1
                                ? `${mapaResultados.length} resultados — clique no correto para preencher a ficha:`
                                : "Clique para preencher a ficha com estes dados:"}
                            </p>
                            {mapaResultados.map((item, idx) => {
                              const ativo = (item.situacao || "").toLowerCase().includes("ativo");
                              return (
                                <button
                                  key={`${item.registro_estabelecimento || "sem-registro"}-${idx}`}
                                  type="button"
                                  onClick={() => selecionarResultadoMapa(item)}
                                  className={`w-full text-left rounded border p-2 text-xs space-y-1 transition-colors hover:brightness-95 ${
                                    ativo ? "bg-green-600/10 border-green-600/40" : "bg-destructive/10 border-destructive/40"
                                  }`}
                                >
                                  <div className="flex items-start justify-between gap-2 flex-wrap">
                                    <p className="font-medium">{item.razao_social}</p>
                                    <Badge className={ativo ? "bg-green-600 text-white" : "bg-destructive text-destructive-foreground"}>
                                      {item.situacao || "Sem status"}
                                    </Badge>
                                  </div>
                                  <p className="text-muted-foreground">
                                    Reg.: <strong>{item.registro_estabelecimento || "—"}</strong> · {item.municipio || "—"}/{item.uf || "—"}
                                  </p>
                                  {item.data_atualizacao_fonte && (
                                    <p className="text-[10px] text-muted-foreground">
                                      Base MAPA de {format(new Date(item.data_atualizacao_fonte), "dd/MM/yyyy")}.
                                    </p>
                                  )}
                                </button>
                              );
                            })}
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex items-start gap-2">
                      <Checkbox checked={sipeagroVerificado} onCheckedChange={(v) => setSipeagroVerificado(!!v)} className="mt-0.5" />
                      <div>
                        <Label className="text-sm">Registro verificado e ativo no SIPEAGRO</Label>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          Ao marcar, você declara ter conferido o registro na fonte oficial. A base interna é um apoio à consulta e reflete a última importação.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <Button type="button" onClick={() => setFormTab("produtos")}>Próximo →</Button>
                  </div>
                </TabsContent>

                {/* ABA 2 — PRODUTOS FORNECIDOS */}
                <TabsContent value="produtos" className="space-y-4 mt-4">
                  <h3 className="text-sm font-semibold border-b pb-1">2 — Produto(s) Fornecido(s)</h3>
                  <div>
                    <Label>Tipo de Produto</Label>
                    <Input value={tipoProduto} onChange={e => setTipoProduto(e.target.value)} placeholder="Ex: Milho, Farelo de soja, Premix" />
                  </div>
                  <div>
                    <Label>Produtos Fornecidos (lista detalhada)</Label>
                    <Textarea
                      value={produtosFornecidos}
                      onChange={e => setProdutosFornecidos(e.target.value)}
                      placeholder="Liste os produtos fornecidos, um por linha"
                      rows={6}
                    />
                  </div>
                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setFormTab("dados")}>← Anterior</Button>
                    <Button type="button" onClick={() => setFormTab("documentos")}>Próximo →</Button>
                  </div>
                </TabsContent>

                {/* ABA 3 — DOCUMENTOS EXIGIDOS */}
                <TabsContent value="documentos" className="space-y-4 mt-4">
                  <h3 className="text-sm font-semibold border-b pb-1">3 — Documento(s) Exigido(s) para Qualificação</h3>
                  <p className="text-xs text-muted-foreground">Marque os documentos apresentados pelo fornecedor:</p>

                  <div className="space-y-3 p-4 border rounded-lg bg-muted/10">
                    {[
                      { label: "Certificado de Registro do Estabelecimento no MAPA", checked: docCertRegistroMapa, onChange: setDocCertRegistroMapa },
                      { label: "Alvará de Funcionamento da Prefeitura", checked: docAlvara, onChange: setDocAlvara },
                      { label: "Certificado de Registro do Produto no MAPA", checked: docCertRegistroProduto, onChange: setDocCertRegistroProduto },
                      { label: "Ficha Técnica", checked: docFichaTecnica, onChange: setDocFichaTecnica },
                      { label: "Certificado de Análise", checked: docCertAnalise, onChange: setDocCertAnalise },
                    ].map((doc) => (
                      <div key={doc.label} className="flex items-center gap-3 p-2 rounded hover:bg-muted/20">
                        <Checkbox checked={doc.checked} onCheckedChange={(v) => doc.onChange(!!v)} />
                        <Label className="text-sm cursor-pointer">{doc.label}</Label>
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setFormTab("produtos")}>← Anterior</Button>
                    <Button type="button" onClick={() => setFormTab("resultado")}>Próximo →</Button>
                  </div>
                </TabsContent>

                {/* ABA 4 — RESULTADO */}
                <TabsContent value="resultado" className="space-y-4 mt-4">
                  <h3 className="text-sm font-semibold border-b pb-1">4 — Resultado da Qualificação</h3>

                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setResultadoQualificacao("aprovado")}
                      className={`p-5 rounded-lg border-2 text-center transition-all ${
                        resultadoQualificacao === "aprovado"
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-muted hover:border-primary/50"
                      }`}
                    >
                      <CheckCircle2 className="w-7 h-7 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Aprovado</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultadoQualificacao("aprovado_com_restricoes")}
                      className={`p-5 rounded-lg border-2 text-center transition-all ${
                        resultadoQualificacao === "aprovado_com_restricoes"
                          ? "border-yellow-600 bg-yellow-600/10 text-yellow-700"
                          : "border-muted hover:border-yellow-500/50"
                      }`}
                    >
                      <CheckCircle2 className="w-7 h-7 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Aprovado c/ Restrições</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setResultadoQualificacao("reprovado")}
                      className={`p-5 rounded-lg border-2 text-center transition-all ${
                        resultadoQualificacao === "reprovado"
                          ? "border-destructive bg-destructive/10 text-destructive"
                          : "border-muted hover:border-destructive/50"
                      }`}
                    >
                      <AlertCircle className="w-7 h-7 mx-auto mb-2" />
                      <p className="font-semibold text-sm">Reprovado</p>
                    </button>
                  </div>

                  <div>
                    <Label>Observações</Label>
                    <Textarea value={observacoes} onChange={e => setObservacoes(e.target.value)} placeholder="Certificações, laudos, justificativas..." rows={3} />
                  </div>

                  <div className="flex justify-between">
                    <Button type="button" variant="outline" onClick={() => setFormTab("documentos")}>← Anterior</Button>
                    <Button onClick={handleAdd} disabled={saving || !nome}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar Fornecedor
                    </Button>
                  </div>
                </TabsContent>

                {/* ABA 5 — AUDITORIAS */}
                <TabsContent value="auditorias" className="space-y-4 mt-4">
                  <h3 className="text-sm font-semibold border-b pb-1">5 — Histórico de Auditorias</h3>
                  <div className="space-y-4">
                    {!selectedId ? (
                      <p className="text-xs text-muted-foreground">Cadastre o fornecedor primeiro para gerenciar auditorias.</p>
                    ) : (
                      <>
                        <div className="flex justify-between items-center">
                          <p className="text-xs font-semibold">Últimas auditorias realizadas</p>
                        </div>
                        <div className="border rounded-lg overflow-hidden">
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/30">
                                <TableHead className="text-[10px]">Data</TableHead>
                                <TableHead className="text-[10px]">Tipo</TableHead>
                                <TableHead className="text-[10px]">Nota</TableHead>
                                <TableHead className="text-[10px]">Auditor</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {fornecedores.find(f => f.id === selectedId)?.auditorias?.map((a: any) => (
                                <TableRow key={a.id}>
                                  <TableCell className="text-xs">{a.data_auditoria}</TableCell>
                                  <TableCell className="text-xs">{a.tipo_auditoria}</TableCell>
                                  <TableCell className="text-xs font-bold">{a.pontuacao_obtida}</TableCell>
                                  <TableCell className="text-xs">{a.auditor}</TableCell>
                                </TableRow>
                              ))}
                              {(!fornecedores.find(f => f.id === selectedId)?.auditorias || fornecedores.find(f => f.id === selectedId)?.auditorias?.length === 0) && (
                                <TableRow>
                                  <TableCell colSpan={4} className="text-center py-4 text-xs text-muted-foreground">
                                    Nenhuma auditoria registrada.
                                  </TableCell>
                                </TableRow>
                              )}
                            </TableBody>
                          </Table>
                        </div>
                      </>
                    )}
                  </div>
                  <div className="flex justify-start">
                    <Button type="button" variant="outline" onClick={() => setFormTab("resultado")}>← Anterior</Button>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : fornecedores.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum fornecedor cadastrado</p>
          ) : (
            <Table>
              <TableHeader>
               <TableRow>
                   <TableHead>Fornecedor</TableHead>
                   <TableHead>Produto</TableHead>
                   <TableHead>SIPEAGRO</TableHead>
                   <TableHead>Documentos</TableHead>
                   <TableHead>Status</TableHead>
                   <TableHead>Nota</TableHead>
                   <TableHead>Taxa Aprovação MP</TableHead>
                   <TableHead></TableHead>
                 </TableRow>
              </TableHeader>
              <TableBody>
                {fornecedores.map(f => {
                  const taxa = getTaxaAprovacao(f.nome);
                  const st = STATUS_CONFIG[f.status_qualificacao || "pendente"] || STATUS_CONFIG.pendente;
                  const recs = getRecebimentosFornecedor(f.nome);
                  const docsCount = [f.doc_certificado_registro_mapa, f.doc_alvara_funcionamento, f.doc_certificado_registro_produto, f.doc_ficha_tecnica, f.doc_certificado_analise].filter(Boolean).length;
                  return (
                    <TableRow key={f.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{f.nome}</p>
                        {f.cnpj && <span className="text-xs text-muted-foreground">{f.cnpj}</span>}
                        {f.cidade && f.estado && <span className="text-xs text-muted-foreground block">{f.cidade}/{f.estado}</span>}
                      </TableCell>
                      <TableCell className="text-sm">{f.tipo_produto || "—"}</TableCell>
                      <TableCell>
                        {f.registro_sipeagro ? (
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-mono">{f.registro_sipeagro}</span>
                            {f.sipeagro_verificado ? <CheckCircle2 className="w-3 h-3 text-primary" /> : <Clock className="w-3 h-3 text-muted-foreground" />}
                          </div>
                        ) : (
                          <span className="text-xs text-destructive">Sem registro</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className={`text-xs font-mono ${docsCount === 5 ? "text-primary" : docsCount >= 3 ? "text-accent" : "text-destructive"}`}>
                          {docsCount}/5
                        </span>
                      </TableCell>
                      <TableCell><Badge className={st.color}>{st.label}</Badge></TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map(i => (
                            <Star key={i} className={`w-3.5 h-3.5 ${i <= (f.nota_avaliacao || 0) ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        {taxa !== null ? (
                          <div className="flex items-center gap-2">
                            <Progress value={taxa} className="w-16 h-2" />
                            <span className={`text-xs font-mono ${taxa >= 80 ? "text-primary" : taxa >= 50 ? "text-accent" : "text-destructive"}`}>{taxa}%</span>
                            <span className="text-xs text-muted-foreground">({recs.length})</span>
                          </div>
                        ) : <span className="text-xs text-muted-foreground">Sem recebimentos</span>}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => handleEdit(f)}>
                            <Edit className="w-3 h-3 mr-1" /> Editar
                          </Button>
                          <Button variant="outline" size="sm" className="text-xs" onClick={() => {
                            setSelectedId(f.id);
                            setNota(f.nota_avaliacao || 0);
                            setStatusQual(f.status_qualificacao || "pendente");
                            setObsAval(f.observacoes || "");
                            setAvaliarOpen(true);
                          }}>
                            <Star className="w-3 h-3 mr-1" /> Avaliar
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs" title="Exportar questionário" onClick={() => {
                            exportQuestionarioPreenchidoXlsx(f as any);
                            toast.success("Questionário exportado!");
                          }}>
                            <Download className="w-3 h-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-xs" title="Imprimir questionário" onClick={() => printQuestionario(f as any)}>
                            <Printer className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Recebimentos por Fornecedor */}
      {fornecedores.length > 0 && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="font-display text-sm">Histórico de Recebimento por Fornecedor</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={fornecedores[0]?.nome}>
              <TabsList className="flex-wrap h-auto gap-1">
                {fornecedores.slice(0, 8).map(f => (
                  <TabsTrigger key={f.nome} value={f.nome} className="text-xs">{f.nome}</TabsTrigger>
                ))}
              </TabsList>
              {fornecedores.slice(0, 8).map(f => {
                const recs = getRecebimentosFornecedor(f.nome);
                return (
                  <TabsContent key={f.nome} value={f.nome}>
                    {recs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-4 text-sm">Nenhum recebimento registrado para este fornecedor</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Data</TableHead>
                            <TableHead>Matéria-Prima</TableHead>
                            <TableHead>Lote</TableHead>
                            <TableHead>Aprovado</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {recs.map(r => (
                            <TableRow key={r.id}>
                              <TableCell className="text-sm">{r.data}</TableCell>
                              <TableCell className="text-sm">{r.materia_prima}</TableCell>
                              <TableCell className="font-mono text-xs">{r.lote || "—"}</TableCell>
                              <TableCell>
                                {r.aprovado ? (
                                  <Badge className="bg-primary text-primary-foreground text-xs">Aprovado</Badge>
                                ) : (
                                  <Badge variant="destructive" className="text-xs">Reprovado</Badge>
                                )}
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
          </CardContent>
        </Card>
      )}

      {/* Lista de Fornecedores Aprovados — PL POP 1.1 */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
          <div>
            <CardTitle className="font-display text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Lista de Fornecedores Aprovados
            </CardTitle>
            <p className="text-xs text-muted-foreground">Conforme PL POP 1.1 — Lista de Fornecedores Aprovados</p>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => { exportListaAprovadosXlsx(fornecedores as any); toast.success("Lista exportada!"); }}>
              <Download className="w-3.5 h-3.5 mr-1" /> Excel
            </Button>
            <Button size="sm" variant="outline" onClick={() => printListaAprovados(fornecedores as any)}>
              <Printer className="w-3.5 h-3.5 mr-1" /> PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {aprovados.length === 0 ? (
            <p className="text-center text-muted-foreground py-6 text-sm">Nenhum fornecedor aprovado ainda</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Nº</TableHead>
                  <TableHead>Fornecedor</TableHead>
                  <TableHead>Produto Fornecido</TableHead>
                  <TableHead className="text-center">Aprovado</TableHead>
                  <TableHead className="text-center">Aprovado c/ Restrições</TableHead>
                  <TableHead className="text-center">Reprovado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {aprovados.map((f, idx) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">{idx + 1}</TableCell>
                    <TableCell>
                      <p className="font-medium text-sm">{f.nome}</p>
                      {f.cnpj && <span className="text-xs text-muted-foreground">{f.cnpj}</span>}
                    </TableCell>
                    <TableCell className="text-sm">{f.produtos_fornecidos || f.tipo_produto || "—"}</TableCell>
                    <TableCell className="text-center">
                      {f.status_qualificacao === "aprovado" && <CheckCircle2 className="w-5 h-5 text-primary mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">
                      {f.status_qualificacao === "aprovado_com_restricoes" && <CheckCircle2 className="w-5 h-5 text-yellow-600 mx-auto" />}
                    </TableCell>
                    <TableCell className="text-center">{/* Vazio */}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Avaliação Dialog */}
      <Dialog open={avaliarOpen} onOpenChange={setAvaliarOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="flex items-center gap-2"><Star className="w-5 h-5 text-accent" /> Avaliar Fornecedor</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nota (1 a 5)</Label>
              <div className="flex gap-2 mt-1">
                {[1, 2, 3, 4, 5].map(i => (
                  <button key={i} onClick={() => setNota(i)} className="focus:outline-none">
                    <Star className={`w-7 h-7 transition-colors ${i <= nota ? "fill-accent text-accent" : "text-muted-foreground/30 hover:text-accent/50"}`} />
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label>Status de Qualificação</Label>
              <Select value={statusQual} onValueChange={setStatusQual}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="aprovado">Aprovado</SelectItem>
                  <SelectItem value="aprovado_com_restricoes">Aprovado c/ Restrições</SelectItem>
                  <SelectItem value="em_avaliacao">Em Avaliação</SelectItem>
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="reprovado">Reprovado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações da Avaliação</Label>
              <Textarea value={obsAval} onChange={e => setObsAval(e.target.value)} placeholder="Critérios avaliados, laudos verificados..." />
            </div>
            <Button onClick={handleAvaliar} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar Avaliação
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}