import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FileText, Plus, Loader2, Wrench, Gauge, AlertCircle, ExternalLink, Upload, FolderOpen, Trash2, History, GitBranch, Send, CheckCircle2, Archive, BookOpen } from "lucide-react";
import { registrarAuditLog, registrarVersaoDocumento } from "@/utils/auditLog";
import { WorkflowBadge, type WorkflowStatus } from "@/components/documentos/WorkflowBadge";
import { AprovarPopDialog } from "@/components/documentos/AprovarPopDialog";
import { VincularPopButton } from "@/components/documentos/VincularPopButton";
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
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { POPS_CONFIG } from "@/config/popsConfig";
import { markPopVisited } from "@/components/OnboardingChecklist";
import {
  TIPOS_DOC,
  type TipoDoc,
  nomeDisplay,
  nomeArquivoFinal,
  storagePath,
  formatNumero,
  nomePadronizado,
  FREQUENCIAS_DOC,
  type FrequenciaDoc,
} from "@/utils/nomenclaturaDoc";
import { SeletorItFrequencia } from "@/components/SeletorItFrequencia";
import { importarModelosIt } from "@/lib/importadorIts";
import {
  uploadArquivoBpf,
  montarPathBpf,
  FREQUENCIA_LABEL,
  isFrequencia,
} from "@/lib/bpfStorage";

const POPS_OBRIGATORIOS = POPS_CONFIG.map((p) => {
  const moduloMap: Record<string, { modulo: string; moduloLabel: string }> = {
    "POP-01": { modulo: "/recebimento", moduloLabel: "Recebimento MP" },
    "POP-02": { modulo: "/higiene", moduloLabel: "Higiene / Sanitização" },
    "POP-03": { modulo: "/saude-pessoal", moduloLabel: "Saúde Pessoal" },
    "POP-04": { modulo: "/potabilidade-agua", moduloLabel: "Potabilidade da Água" },
    "POP-05": { modulo: "/pcp", moduloLabel: "PCP / Sequenciamento" },
    "POP-06": { modulo: "/manutencao", moduloLabel: "Manutenção / Calibração" },
    "POP-07": { modulo: "/pragas", moduloLabel: "Controle de Pragas" },
    "POP-08": { modulo: "/residuos", moduloLabel: "Resíduos / Efluentes" },
    "POP-09": { modulo: "/rastreabilidade", moduloLabel: "Rastreabilidade / Recall" },
    "POP-10": { modulo: "/auditoria", moduloLabel: "Auditoria BPF (PAC)" },
  };
  const link = moduloMap[p.codigo] || { modulo: "/documentos", moduloLabel: "Documentos" };
  return { codigo: p.codigo, nome: p.descricao, ...link };
});

const TIPOS_EQUIPAMENTO = [
  { value: "balanca", label: "Balança" },
  { value: "termometro", label: "Termômetro" },
  { value: "higrometro", label: "Higrômetro" },
  { value: "medidor_umidade", label: "Medidor de Umidade" },
  { value: "manometro", label: "Manômetro" },
  { value: "outro", label: "Outro" },
];

const CATEGORIAS_ARQ = [
  { value: "pop", label: "POP" },
  { value: "it", label: "Instrução de Trabalho (IT)" },
  { value: "planilha", label: "Planilha" },
  { value: "manual", label: "Manual BPF" },
  { value: "certificado", label: "Certificado / Laudo" },
  { value: "outro", label: "Outro" },
];

/**
 * Etiquetas de IT e periodicidade na listagem.
 *
 * A grande maioria dos arquivos já existentes não tem essa classificação —
 * as colunas são novas e opcionais. Linha sem classificação simplesmente não
 * renderiza badge; ausência é o estado normal, não um erro a sinalizar.
 */
function BadgesClassificacao({ linha }: { linha: ArquivoBpf }) {
  const { it_codigo, frequencia } = linha as ArquivoBpf & {
    it_codigo?: string | null;
    frequencia?: string | null;
  };

  if (!it_codigo && !frequencia) return null;

  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {it_codigo && (
        <Badge variant="secondary" className="text-[10px] font-mono">{it_codigo}</Badge>
      )}
      {frequencia && (
        <Badge variant="outline" className="text-[10px]">
          {isFrequencia(frequencia) ? FREQUENCIA_LABEL[frequencia] : frequencia}
        </Badge>
      )}
    </div>
  );
}

interface DocRow {
  id: string;
  codigo: string;
  nome: string;
  versao: string | null;
  data_revisao: string | null;
  responsavel: string | null;
  status: string | null;
  validade_revisao: string | null;
  proxima_revisao: string | null;
  workflow_status?: string | null;
  documento_pai_id?: string | null;
  aprovador_nome?: string | null;
  aprovado_em?: string | null;
}

interface ArquivoBpf {
  id: string;
  titulo: string;
  categoria: string;
  descricao: string | null;
  arquivo_nome: string | null;
  arquivo_url: string | null;
  created_at: string;
  pop_codigo?: string | null;
  tipo_doc?: string | null;
  numero_doc?: number | null;
  data_ref?: string | null;
  nome_padronizado?: string | null;
  it_codigo?: string | null;
  frequencia?: string | null;
}

interface CalibracaoRow {
  id: string;
  equipamento: string;
  codigo: string | null;
  tipo: string | null;
  localizacao: string | null;
  data_calibracao: string | null;
  proxima_calibracao: string | null;
  responsavel: string | null;
  certificado_numero: string | null;
  status: string | null;
  observacoes: string | null;
}

const statusBadge: Record<string, string> = {
  ativo: "bg-primary text-primary-foreground",
  em_revisao: "bg-yellow-500/20 text-yellow-700",
  obsoleto: "bg-muted text-muted-foreground",
};

const calibStatusBadge: Record<string, string> = {
  calibrado: "bg-primary text-primary-foreground",
  vencido: "bg-destructive text-destructive-foreground",
  em_calibracao: "bg-yellow-500/20 text-yellow-700",
  fora_de_uso: "bg-muted text-muted-foreground",
};

export default function Documentos() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const navigate = useNavigate();
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [arquivos, setArquivos] = useState<ArquivoBpf[]>([]);
  const [calibracoes, setCalibracoes] = useState<CalibracaoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    markPopVisited();
  }, []);

  // POP form
  const [popOpen, setPopOpen] = useState(false);
  const [popCodigo, setPopCodigo] = useState("");
  const [popNome, setPopNome] = useState("");
  const [popVersao, setPopVersao] = useState("01");
  const [popResponsavel, setPopResponsavel] = useState("");
  const [popValidade, setPopValidade] = useState("");
  const [popProximaRevisao, setPopProximaRevisao] = useState("");

  // Versão / Revisão
  const [versaoOpen, setVersaoOpen] = useState(false);
  const [versaoDocId, setVersaoDocId] = useState("");
  const [versaoDocCodigo, setVersaoDocCodigo] = useState("");
  const [versaoAnterior, setVersaoAnterior] = useState("");
  const [versaoNova, setVersaoNova] = useState("");
  const [versaoMotivo, setVersaoMotivo] = useState("");
  const [versaoAlteracoes, setVersaoAlteracoes] = useState("");
  const [versaoResponsavel, setVersaoResponsavel] = useState("");
  const [versoes, setVersoes] = useState<any[]>([]);
  const [versoesOpen, setVersoesOpen] = useState(false);
  const [versoesDocNome, setVersoesDocNome] = useState("");

  // Workflow de aprovação
  const [aprovarOpen, setAprovarOpen] = useState(false);
  const [aprovarDoc, setAprovarDoc] = useState<DocRow | null>(null);
  const [aprovarStatus, setAprovarStatus] = useState<"em_revisao" | "vigente" | "obsoleto">("vigente");

  // Arquivo BPF form
  const [arqOpen, setArqOpen] = useState(false);
  const [arqPopCodigo, setArqPopCodigo] = useState("");
  const [arqTipo, setArqTipo] = useState<TipoDoc>("PL");
  const [arqNumero, setArqNumero] = useState<string>("001");
  const [arqDataRef, setArqDataRef] = useState<string>(new Date().toISOString().split("T")[0]);
  const [arqDescricao, setArqDescricao] = useState("");
  const [arqFile, setArqFile] = useState<File | null>(null);
  const [arqItCodigo, setArqItCodigo] = useState("");
  const [importando, setImportando] = useState(false);
  const [arqFrequencia, setArqFrequencia] = useState("");
  const [padronizando, setPadronizando] = useState(false);
  const [arqFilterCat, setArqFilterCat] = useState("todos");
  const [arqFilterPop, setArqFilterPop] = useState("todos");
  const [arqSearch, setArqSearch] = useState("");

  const [calOpen, setCalOpen] = useState(false);
  const [calEquipamento, setCalEquipamento] = useState("");
  const [calCodigo, setCalCodigo] = useState("");
  const [calTipo, setCalTipo] = useState("balanca");
  const [calLocal, setCalLocal] = useState("");
  const [calData, setCalData] = useState("");
  const [calProxima, setCalProxima] = useState("");
  const [calResponsavel, setCalResponsavel] = useState("");
  const [calCertificado, setCalCertificado] = useState("");
  const [calObs, setCalObs] = useState("");

  const fetchData = async () => {
    if (!user) return;
    let docsQ = supabase.from("documentos").select("*").order("codigo");
    let calQ = supabase.from("calibracoes").select("*").order("proxima_calibracao");
    let arqQ = supabase.from("arquivos_bpf").select("*").order("created_at", { ascending: false });
    if (empresaAtiva) {
      docsQ = docsQ.eq("empresa_id", empresaAtiva.id);
      calQ = calQ.eq("empresa_id", empresaAtiva.id);
      arqQ = arqQ.eq("empresa_id", empresaAtiva.id);
    }
    const [docsRes, calRes, arqRes] = await Promise.all([docsQ, calQ, arqQ]);
    if (docsRes.data) setDocs(docsRes.data);
    if (calRes.data) setCalibracoes(calRes.data as unknown as CalibracaoRow[]);
    if (arqRes.data) setArquivos(arqRes.data as unknown as ArquivoBpf[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [user, empresaAtiva]);

  const handleAddPop = async () => {
    if (!popCodigo || !popNome || !user) return;
    setSaving(true);
    const { error } = await supabase.from("documentos").insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      codigo: popCodigo,
      nome: popNome,
      versao: popVersao,
      responsavel: popResponsavel,
      validade_revisao: popValidade || null,
      proxima_revisao: popProximaRevisao || null,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Documento salvo!");
      registrarAuditLog({
        userId: user.id,
        tabela: "documentos",
        acao: "criar",
        dadosNovos: { codigo: popCodigo, nome: popNome, versao: popVersao },
      });
      setPopOpen(false);
      setPopCodigo("");
      setPopNome("");
      setPopVersao("01");
      setPopResponsavel("");
      setPopValidade("");
      setPopProximaRevisao("");
      fetchData();
    }
    setSaving(false);
  };

  const handleRevisarPop = async () => {
    if (!versaoDocId || !versaoNova || !user) return;
    setSaving(true);
    // Update document version
    const { error } = await supabase
      .from("documentos")
      .update({
        versao: versaoNova,
        data_revisao: new Date().toISOString().split("T")[0],
        responsavel: versaoResponsavel || undefined,
      } as any)
      .eq("id", versaoDocId);
    if (error) {
      toast.error("Erro ao atualizar");
      setSaving(false);
      return;
    }
    // Register version history
    await registrarVersaoDocumento({
      userId: user.id,
      empresaId: empresaAtiva?.id,
      documentoId: versaoDocId,
      versaoAnterior: versaoAnterior,
      versaoNova: versaoNova,
      responsavel: versaoResponsavel,
      motivo: versaoMotivo,
      alteracoes: versaoAlteracoes,
    });
    registrarAuditLog({
      userId: user.id,
      tabela: "documentos",
      acao: "editar",
      registroId: versaoDocId,
      dadosAnteriores: { versao: versaoAnterior },
      dadosNovos: { versao: versaoNova, motivo: versaoMotivo },
    });
    toast.success("Revisão registrada com sucesso!");
    setVersaoOpen(false);
    setVersaoDocId("");
    setVersaoNova("");
    setVersaoMotivo("");
    setVersaoAlteracoes("");
    setVersaoResponsavel("");
    fetchData();
    setSaving(false);
  };

  const handleVerHistorico = async (docId: string, docNome: string) => {
    const { data } = await (supabase.from("documento_versoes") as any)
      .select("*")
      .eq("documento_id", docId)
      .order("created_at", { ascending: false });
    setVersoes(data || []);
    setVersoesDocNome(docNome);
    setVersoesOpen(true);
  };

  const abrirAprovacao = (doc: DocRow, status: "em_revisao" | "vigente" | "obsoleto") => {
    setAprovarDoc(doc);
    setAprovarStatus(status);
    setAprovarOpen(true);
  };

  const handleNovaVersao = async (doc: DocRow) => {
    if (!user) return;
    const novaVersao = String(parseInt(doc.versao || "01") + 1).padStart(2, "0");
    const motivo = window.prompt(`Criar nova versão (v${novaVersao}) em rascunho?\nInforme o motivo da revisão:`);
    if (motivo === null) return;
    const { data, error } = await (supabase.rpc as any)("criar_nova_versao_pop", {
      _documento_pai_id: doc.id,
      _nova_versao: novaVersao,
      _motivo: motivo || null,
    });
    if (error) {
      toast.error(error.message);
      return;
    }
    const result = data as { ok: boolean; error?: string };
    if (!result.ok) {
      toast.error(result.error || "Falha");
      return;
    }
    toast.success(`Nova versão v${novaVersao} criada como rascunho`);
    fetchData();
  };

  const handleAddCalibracao = async () => {
    if (!calEquipamento || !user) return;
    setSaving(true);
    const { error } = await supabase.from("calibracoes").insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      equipamento: calEquipamento,
      codigo: calCodigo,
      tipo: calTipo,
      localizacao: calLocal,
      data_calibracao: calData || null,
      proxima_calibracao: calProxima || null,
      responsavel: calResponsavel,
      certificado_numero: calCertificado,
      observacoes: calObs,
    } as any);
    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Calibração registrada!");
      setCalOpen(false);
      setCalEquipamento("");
      setCalCodigo("");
      setCalTipo("balanca");
      setCalLocal("");
      setCalData("");
      setCalProxima("");
      setCalResponsavel("");
      setCalCertificado("");
      setCalObs("");
      fetchData();
    }
    setSaving(false);
  };

  /**
   * Cria os modelos preenchíveis das ITs para a empresa ativa.
   *
   * Exige empresa ativa: `modelos_bpf.empresa_id` é NOT NULL, então sem
   * empresa o insert seria recusado pelo banco. O botão fica desabilitado
   * nesse caso, e a checagem aqui é a segunda linha de defesa.
   *
   * Reexecutar é seguro — o importador ignora o que já existe.
   */
  const handleImportarModelos = async () => {
    if (!user || !empresaAtiva) {
      toast.error("Selecione uma empresa ativa antes de importar os modelos.");
      return;
    }
    setImportando(true);
    try {
      const r = await importarModelosIt({ empresaId: empresaAtiva.id, userId: user.id });

      if (r.falhas.length > 0) {
        toast.error(
          `${r.falhas.length} modelo(s) não importado(s). Primeiro erro: ${r.falhas[0].erro}`,
        );
      }
      if (r.criados.length > 0) {
        toast.success(
          `${r.criados.length} modelo(s) de IT importado(s)` +
            (r.ignorados.length > 0 ? `; ${r.ignorados.length} já existia(m).` : "."),
        );
      } else if (r.falhas.length === 0) {
        toast.info(`Nada a importar: os ${r.ignorados.length} modelos já estão cadastrados.`);
      }
    } finally {
      setImportando(false);
    }
  };

  const handleAddArquivo = async () => {
    if (!arqFile || !arqPopCodigo || !arqNumero || !arqDataRef || !user) return;
    setSaving(true);
    const scopeId = empresaAtiva?.id || user.id;
    const arquivoFinal = nomeArquivoFinal(arqPopCodigo, arqTipo, arqNumero, arqDataRef, arqFile.name);
    const titulo = nomeDisplay(arqPopCodigo, arqTipo, arqNumero, arqDataRef);

    // Grava no path hierárquico bpf/{empresa}/{POP}/{IT}/{frequencia}/...
    // O nome de exibição e o nome do arquivo continuam vindo da nomenclatura
    // já existente — só o path e a classificação IT/frequência são novos.
    const resultado = await uploadArquivoBpf({
      file: arqFile,
      meta: {
        empresaId: scopeId,
        popCodigo: arqPopCodigo,
        itCodigo: arqItCodigo || null,
        frequencia: arqFrequencia || null,
        dataRef: arqDataRef,
      },
      registro: {
        user_id: user.id,
        empresa_id: empresaAtiva?.id || null,
        titulo,
        categoria: arqTipo.toLowerCase(),
        descricao: arqDescricao || null,
        arquivo_nome: arquivoFinal,
        tipo_doc: arqTipo,
        numero_doc: parseInt(arqNumero, 10) || 0,
        data_ref: arqDataRef,
        nome_padronizado: arquivoFinal.replace(/\.[^.]+$/, ""),
      },
    });

    if (!resultado.ok) {
      toast.error(
        resultado.revertido
          ? `Erro ao salvar arquivo: ${resultado.erro}. O upload foi desfeito.`
          : `Erro no upload: ${resultado.erro}`,
      );
    } else {
      toast.success(`Arquivo salvo: ${titulo}`);
      setArqOpen(false);
      setArqPopCodigo("");
      setArqTipo("PL");
      setArqNumero("001");
      setArqDataRef(new Date().toISOString().split("T")[0]);
      setArqDescricao(""); setArqFile(null);
      setArqItCodigo(""); setArqFrequencia("");
      fetchData();
    }
    setSaving(false);
  };

  /**
   * Retroativo: preenche tipo_doc/numero_doc/data_ref/nome_padronizado
   * para arquivos legados que ainda não seguem o padrão. Não move arquivos
   * no storage — apenas normaliza metadados e o título exibido.
   */
  const handlePadronizarNomes = async () => {
    if (!user) return;
    const pendentes = arquivos.filter((a) => !a.nome_padronizado && a.pop_codigo);
    if (pendentes.length === 0) {
      toast.info("Todos os arquivos já estão padronizados.");
      return;
    }
    if (
      !window.confirm(
        `Padronizar ${pendentes.length} arquivo(s) legado(s)? Números serão gerados sequencialmente por POP+Tipo.`,
      )
    )
      return;
    setPadronizando(true);
    try {
      // Descobre próximos números por (pop, tipo) já usados
      const contadores = new Map<string, number>();
      for (const a of arquivos) {
        if (a.pop_codigo && a.tipo_doc && a.numero_doc) {
          const k = `${a.pop_codigo}|${a.tipo_doc}`;
          contadores.set(k, Math.max(contadores.get(k) || 0, a.numero_doc));
        }
      }
      let ok = 0;
      for (const a of pendentes) {
        const tipoInferido: TipoDoc =
          a.categoria === "it"
            ? "IT"
            : a.categoria === "manual"
              ? "MN"
              : a.categoria === "planilha"
                ? "PL"
                : a.categoria === "certificado"
                  ? "RG"
                  : "FR";
        const k = `${a.pop_codigo}|${tipoInferido}`;
        const proximo = (contadores.get(k) || 0) + 1;
        contadores.set(k, proximo);
        const dataRef = a.created_at?.split("T")[0] || new Date().toISOString().split("T")[0];
        const base = nomePadronizado(a.pop_codigo!, tipoInferido, proximo, dataRef);
        const titulo = nomeDisplay(a.pop_codigo!, tipoInferido, proximo, dataRef);
        const { error } = await (supabase.from("arquivos_bpf") as any)
          .update({
            tipo_doc: tipoInferido,
            numero_doc: proximo,
            data_ref: dataRef,
            nome_padronizado: base,
            titulo,
          })
          .eq("id", a.id);
        if (!error) ok++;
      }
      toast.success(`${ok}/${pendentes.length} arquivos padronizados.`);
      fetchData();
    } finally {
      setPadronizando(false);
    }
  };

  const handleDeleteArquivo = async (id: string) => {
    const { error } = await supabase.from("arquivos_bpf").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else {
      toast.success("Arquivo excluído");
      fetchData();
    }
  };

  const filteredArquivos = arquivos.filter((a) => {
    if (arqFilterCat !== "todos" && a.categoria !== arqFilterCat) return false;
    if (arqFilterPop !== "todos" && (a.pop_codigo || "") !== arqFilterPop) return false;
    if (arqSearch.trim()) {
      const q = arqSearch.trim().toLowerCase();
      // Incluir busca por IT no filtro
      const hay =
        `${a.titulo || ""} ${a.descricao || ""} ${a.arquivo_nome || ""} ${a.pop_codigo || ""} ${a.it_codigo || ""}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const tipoLabel = (tipo: string) => TIPOS_EQUIPAMENTO.find((t) => t.value === tipo)?.label || tipo;

  const today = new Date().toISOString().split("T")[0];
  const calibVencidas = calibracoes.filter(
    (c) => c.proxima_calibracao && c.proxima_calibracao < today && c.status !== "fora_de_uso",
  );
  const calibOk = calibracoes.filter(
    (c) => c.status === "calibrado" && (!c.proxima_calibracao || c.proxima_calibracao >= today),
  );

  return (
    <>
      <PageHeader
        icon={FileText}
        title="Documentos, POPs e Calibração"
        description="POPs obrigatórios, Manual BPF, ITs, arquivos e gestão de calibração"
        orientacaoModuloId="documentos"
      />

      <Tabs defaultValue="pops" className="space-y-4">
        <TabsList className="mb-4 w-full justify-start overflow-x-auto h-auto p-1 flex">
          <TabsTrigger value="pops">POPs Obrigatórios</TabsTrigger>
          <TabsTrigger value="registrados">Docs Registrados ({docs.length})</TabsTrigger>
          <TabsTrigger value="arquivo_bpf" className="flex items-center gap-1">
            <FolderOpen className="w-4 h-4" /> Arquivo BPF ({arquivos.length})
          </TabsTrigger>
          <TabsTrigger value="calibracao" className="flex items-center gap-1">
            <Gauge className="w-4 h-4" /> Calibração ({calibracoes.length})
            {calibVencidas.length > 0 && (
              <Badge variant="destructive" className="ml-1 text-[10px] px-1">
                {calibVencidas.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: POPs */}
        <TabsContent value="pops">
          <Card>
            <CardHeader>
              <CardTitle className="font-display">
                10 POPs Obrigatórios — IN nº 04/2007 / <BaseLegalBadge assunto="autocontrole" />
              </CardTitle>
              <p className="text-xs text-muted-foreground mt-1">
                Procedimentos operacionais padrão exigidos pelo MAPA para fábricas de alimentação animal
              </p>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 overflow-x-auto">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-24">Código</TableHead>
                      <TableHead>Procedimento</TableHead>
                      <TableHead className="w-28">Status</TableHead>
                      <TableHead className="w-40">Módulo Vinculado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {POPS_OBRIGATORIOS.map((p) => {
                      const registrado = docs.find((d) => d.codigo === p.codigo);
                      return (
                        <TableRow key={p.codigo}>
                          <TableCell className="font-mono text-sm font-medium">{p.codigo}</TableCell>
                          <TableCell>
                            <p className="text-sm">{p.nome}</p>
                            {registrado && (
                              <span className="text-xs text-muted-foreground">
                                v{registrado.versao} • {registrado.responsavel}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>
                            {registrado ? (
                              <Badge className={statusBadge[registrado.status || "ativo"]}>
                                {registrado.status === "em_revisao"
                                  ? "Em revisão"
                                  : registrado.status === "obsoleto"
                                    ? "Obsoleto"
                                    : "Ativo"}
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-destructive border-destructive">
                                Pendente
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {p.modulo && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs gap-1 h-7"
                                onClick={() => navigate(p.modulo)}
                              >
                                <ExternalLink className="w-3 h-3" /> {p.moduloLabel}
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 2: Docs registrados */}
        <TabsContent value="registrados">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Documentos Registrados</CardTitle>
              <Dialog open={popOpen} onOpenChange={setPopOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-8 text-xs sm:h-9 sm:text-sm">
                    <Plus className="w-4 h-4 mr-1" /> <span className="hidden sm:inline">Novo Documento</span>
                    <span className="sm:hidden">Novo</span>
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar Documento</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label>Código</Label>
                      <Select
                        value={popCodigo}
                        onValueChange={(v) => {
                          setPopCodigo(v);
                          const found = POPS_OBRIGATORIOS.find((p) => p.codigo === v);
                          if (found) setPopNome(found.nome);
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione ou digite" />
                        </SelectTrigger>
                        <SelectContent>
                          {POPS_OBRIGATORIOS.map((p) => (
                            <SelectItem key={p.codigo} value={p.codigo}>
                              {p.codigo} — {p.nome.slice(0, 40)}...
                            </SelectItem>
                          ))}
                          <SelectItem value="IT-001">IT-001 — Instrução de Trabalho</SelectItem>
                          <SelectItem value="MANUAL-BPF">MANUAL-BPF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Nome / Título</Label>
                      <Input value={popNome} onChange={(e) => setPopNome(e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Versão</Label>
                        <Input value={popVersao} onChange={(e) => setPopVersao(e.target.value)} />
                      </div>
                      <div>
                        <Label>Responsável</Label>
                        <Input value={popResponsavel} onChange={(e) => setPopResponsavel(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Validade da Revisão</Label>
                        <Input type="date" value={popValidade} onChange={(e) => setPopValidade(e.target.value)} />
                      </div>
                      <div>
                        <Label>Próxima Revisão</Label>
                        <Input
                          type="date"
                          value={popProximaRevisao}
                          onChange={(e) => setPopProximaRevisao(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button onClick={handleAddPop} className="w-full" disabled={saving}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : docs.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum documento registrado</p>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Código</TableHead>
                          <TableHead>Nome</TableHead>
                          <TableHead>Versão</TableHead>
                          <TableHead>Workflow</TableHead>
                          <TableHead>Aprovação</TableHead>
                          <TableHead>Validade</TableHead>
                          <TableHead>Próx. Revisão</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead className="w-56">Ações</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {docs.map((d) => {
                          const today = new Date().toISOString().split("T")[0];
                          const vencido = d.validade_revisao && d.validade_revisao < today;
                          const proximoVencer =
                            d.proxima_revisao &&
                            d.proxima_revisao <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
                          const wf = (d.workflow_status || "vigente") as WorkflowStatus;
                          return (
                            <TableRow key={d.id} className={wf === "obsoleto" ? "opacity-60" : ""}>
                              <TableCell className="font-mono text-sm">{d.codigo}</TableCell>
                              <TableCell>
                                {d.nome}
                                {d.documento_pai_id && (
                                  <span className="ml-1 text-[10px] text-muted-foreground">(revisão)</span>
                                )}
                              </TableCell>
                              <TableCell>v{d.versao}</TableCell>
                              <TableCell>
                                <WorkflowBadge status={wf} />
                              </TableCell>
                              <TableCell className="text-xs">
                                {d.aprovador_nome ? (
                                  <div>
                                    <div className="font-medium">{d.aprovador_nome}</div>
                                    <div className="text-muted-foreground">
                                      {d.aprovado_em ? new Date(d.aprovado_em).toLocaleDateString("pt-BR") : ""}
                                    </div>
                                  </div>
                                ) : (
                                  <span className="text-muted-foreground">—</span>
                                )}
                              </TableCell>
                              <TableCell className={vencido ? "text-destructive font-medium" : ""}>
                                {d.validade_revisao || "—"}
                              </TableCell>
                              <TableCell className={proximoVencer ? "text-yellow-600 font-medium" : ""}>
                                {d.proxima_revisao || "—"}
                              </TableCell>
                              <TableCell>{d.responsavel}</TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {wf === "rascunho" && (
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      onClick={() => abrirAprovacao(d, "em_revisao")}
                                    >
                                      <Send className="w-3 h-3" /> Enviar revisão
                                    </Button>
                                  )}
                                  {wf === "em_revisao" && (
                                    <Button
                                      size="sm"
                                      className="h-7 text-xs gap-1"
                                      onClick={() => abrirAprovacao(d, "vigente")}
                                    >
                                      <CheckCircle2 className="w-3 h-3" /> Aprovar
                                    </Button>
                                  )}
                                  {wf === "vigente" && (
                                    <>
                                      <Button
                                        variant="outline"
                                        size="sm"
                                        className="h-7 text-xs gap-1"
                                        onClick={() => handleNovaVersao(d)}
                                      >
                                        <GitBranch className="w-3 h-3" /> Nova versão
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-7 text-xs"
                                        onClick={() => abrirAprovacao(d, "obsoleto")}
                                      >
                                        <Archive className="w-3 h-3" />
                                      </Button>
                                    </>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs gap-1"
                                    onClick={() => handleVerHistorico(d.id, `${d.codigo} — ${d.nome}`)}
                                  >
                                    <History className="w-3 h-3" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile View */}
                  <div className="md:hidden space-y-3">
                    {docs.map((d) => {
                      const today = new Date().toISOString().split("T")[0];
                      const vencido = d.validade_revisao && d.validade_revisao < today;
                      const proximoVencer =
                        d.proxima_revisao &&
                        d.proxima_revisao <= new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];
                      const wf = (d.workflow_status || "vigente") as WorkflowStatus;

                      return (
                        <Card key={d.id} className={`border shadow-sm ${wf === "obsoleto" ? "opacity-60" : ""}`}>
                          <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <p className="text-xs font-mono text-muted-foreground">{d.codigo}</p>
                                <p className="text-sm font-bold truncate max-w-[200px]">{d.nome}</p>
                              </div>
                              <WorkflowBadge status={wf} />
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-[10px] pt-2 border-t">
                              <div>
                                <p className="font-bold uppercase text-muted-foreground">Versão</p>
                                <p>v{d.versao}</p>
                              </div>
                              <div>
                                <p className="font-bold uppercase text-muted-foreground">Validade</p>
                                <p className={vencido ? "text-destructive font-bold" : ""}>
                                  {d.validade_revisao || "—"}
                                </p>
                              </div>
                            </div>

                            <div className="flex flex-wrap gap-2 pt-1">
                              {wf === "rascunho" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs flex-1"
                                  onClick={() => abrirAprovacao(d, "em_revisao")}
                                >
                                  Enviar
                                </Button>
                              )}
                              {wf === "em_revisao" && (
                                <Button
                                  size="sm"
                                  className="h-8 text-xs flex-1"
                                  onClick={() => abrirAprovacao(d, "vigente")}
                                >
                                  Aprovar
                                </Button>
                              )}
                              {wf === "vigente" && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs flex-1"
                                  onClick={() => handleNovaVersao(d)}
                                >
                                  Revisar
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 text-xs px-2"
                                onClick={() => handleVerHistorico(d.id, `${d.codigo} — ${d.nome}`)}
                              >
                                <History className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab 4: Calibração */}
        <TabsContent value="calibracao">
          {calibVencidas.length > 0 && (
            <Card className="border-destructive/30 bg-destructive/5 mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="w-5 h-5 text-destructive" />
                  <h3 className="font-display font-semibold text-sm text-destructive">
                    {calibVencidas.length} equipamento(s) com calibração vencida!
                  </h3>
                </div>
                <div className="space-y-1">
                  {calibVencidas.map((c) => (
                    <div
                      key={c.id}
                      className="text-xs flex items-center gap-2 p-1.5 rounded bg-background border border-destructive/20"
                    >
                      <Gauge className="w-3.5 h-3.5 text-destructive" />
                      <span className="font-medium">{c.equipamento}</span>
                      <span className="text-muted-foreground">({c.codigo})</span>
                      <span className="text-destructive">Vencida em {c.proxima_calibracao}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-display">{calibracoes.length}</p>
                <p className="text-xs text-muted-foreground">Equipamentos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-display text-primary">{calibOk.length}</p>
                <p className="text-xs text-muted-foreground">Calibrados OK</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold font-display text-destructive">{calibVencidas.length}</p>
                <p className="text-xs text-muted-foreground">Vencidos</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-display">Gestão de Calibração</CardTitle>
              <Dialog open={calOpen} onOpenChange={setCalOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="w-4 h-4 mr-1" /> Novo Equipamento
                  </Button>
                </DialogTrigger>
                <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Registrar Calibração</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <Label>Equipamento *</Label>
                        <Input
                          value={calEquipamento}
                          onChange={(e) => setCalEquipamento(e.target.value)}
                          placeholder="Ex: Balança Toledo 500kg"
                        />
                      </div>
                      <div>
                        <Label>Código / Patrimônio</Label>
                        <Input
                          value={calCodigo}
                          onChange={(e) => setCalCodigo(e.target.value)}
                          placeholder="Ex: BAL-001"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Tipo</Label>
                        <Select value={calTipo} onValueChange={setCalTipo}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {TIPOS_EQUIPAMENTO.map((t) => (
                              <SelectItem key={t.value} value={t.value}>
                                {t.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Localização</Label>
                        <Input
                          value={calLocal}
                          onChange={(e) => setCalLocal(e.target.value)}
                          placeholder="Ex: Setor Mistura"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Data da Calibração</Label>
                        <Input type="date" value={calData} onChange={(e) => setCalData(e.target.value)} />
                      </div>
                      <div>
                        <Label>Próxima Calibração</Label>
                        <Input type="date" value={calProxima} onChange={(e) => setCalProxima(e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Responsável / Empresa</Label>
                        <Input value={calResponsavel} onChange={(e) => setCalResponsavel(e.target.value)} />
                      </div>
                      <div>
                        <Label>Nº Certificado</Label>
                        <Input value={calCertificado} onChange={(e) => setCalCertificado(e.target.value)} />
                      </div>
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Textarea value={calObs} onChange={(e) => setCalObs(e.target.value)} />
                    </div>
                    <Button onClick={handleAddCalibracao} className="w-full" disabled={saving || !calEquipamento}>
                      {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Salvar
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : calibracoes.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum equipamento cadastrado</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipamento</TableHead>
                        <TableHead>Código</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Local</TableHead>
                        <TableHead>Calibração</TableHead>
                        <TableHead>Próxima</TableHead>
                        <TableHead>Certificado</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calibracoes.map((c) => {
                        const vencido = c.proxima_calibracao && c.proxima_calibracao < today;
                        const displayStatus =
                          vencido && c.status !== "fora_de_uso" ? "vencido" : c.status || "calibrado";
                        return (
                          <TableRow key={c.id} className={vencido ? "bg-destructive/5" : ""}>
                            <TableCell className="font-medium text-sm">{c.equipamento}</TableCell>
                            <TableCell className="font-mono text-xs">{c.codigo || "—"}</TableCell>
                            <TableCell className="text-sm">{tipoLabel(c.tipo || "outro")}</TableCell>
                            <TableCell className="text-sm">{c.localizacao || "—"}</TableCell>
                            <TableCell className="text-sm">{c.data_calibracao || "—"}</TableCell>
                            <TableCell className={`text-sm ${vencido ? "text-destructive font-semibold" : ""}`}>
                              {c.proxima_calibracao || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-xs">{c.certificado_numero || "—"}</TableCell>
                            <TableCell>
                              <Badge className={calibStatusBadge[displayStatus]}>
                                {displayStatus === "calibrado"
                                  ? "Calibrado"
                                  : displayStatus === "vencido"
                                    ? "Vencido"
                                    : displayStatus === "em_calibracao"
                                      ? "Em calibração"
                                      : "Fora de uso"}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Arquivo BPF */}
        <TabsContent value="arquivo_bpf">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
              <div>
                <CardTitle className="font-display">Arquivo BPF — POPs, ITs e Documentos</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">
                  Upload e organização de documentos físicos escaneados, ITs associadas aos POPs e demais arquivos
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Input
                  value={arqSearch}
                  onChange={(e) => setArqSearch(e.target.value)}
                  placeholder="Buscar título, descrição ou POP…"
                  className="w-56 h-8 text-xs"
                />
                <Select value={arqFilterPop} onValueChange={setArqFilterPop}>
                  <SelectTrigger className="w-40 h-8 text-xs">
                    <SelectValue placeholder="POP" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todos os POPs</SelectItem>
                    {POPS_OBRIGATORIOS.map((p) => (
                      <SelectItem key={p.codigo} value={p.codigo}>
                        {p.codigo}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={arqFilterCat} onValueChange={setArqFilterCat}>
                  <SelectTrigger className="w-44 h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todos">Todas categorias</SelectItem>
                    {CATEGORIAS_ARQ.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button size="sm" variant="outline" onClick={handlePadronizarNomes} disabled={padronizando}>
                  {padronizando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  Padronizar nomes
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleImportarModelos}
                  disabled={importando || !empresaAtiva}
                  title={
                    empresaAtiva
                      ? "Cria os modelos preenchíveis das ITs para esta empresa"
                      : "Selecione uma empresa ativa para importar os modelos"
                  }
                >
                  {importando && <Loader2 className="w-4 h-4 mr-1 animate-spin" />}
                  <BookOpen className="w-4 h-4 mr-1" />
                  Importar modelos de IT
                </Button>
                <Dialog open={arqOpen} onOpenChange={setArqOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Upload className="w-4 h-4 mr-1" /> Enviar Arquivo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>Enviar Arquivo BPF</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>POP vinculado *</Label>
                        <Select value={arqPopCodigo} onValueChange={setArqPopCodigo}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o POP a que este arquivo pertence" />
                          </SelectTrigger>
                          <SelectContent>
                            {POPS_OBRIGATORIOS.map((p) => (
                              <SelectItem key={p.codigo} value={p.codigo}>
                                {p.codigo} — {p.nome.slice(0, 50)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Obrigatório para o arquivo ficar pesquisável por POP.
                        </p>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label>Tipo *</Label>
                          <Select value={arqTipo} onValueChange={(v) => setArqTipo(v as TipoDoc)}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {TIPOS_DOC.map((t) => (
                                <SelectItem key={t.value} value={t.value}>
                                  {t.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label>Número *</Label>
                          <Input
                            value={arqNumero}
                            onChange={(e) => setArqNumero(e.target.value.replace(/\D/g, "").slice(0, 4))}
                            onBlur={() => setArqNumero((n) => formatNumero(n))}
                            placeholder="001"
                            inputMode="numeric"
                          />
                        </div>
                      </div>

                      <div>
                        <Label>Data de referência *</Label>
                        <Input type="date" value={arqDataRef} onChange={(e) => setArqDataRef(e.target.value)} />
                      </div>
                      <SeletorItFrequencia
                        popCodigo={arqPopCodigo}
                        itCodigo={arqItCodigo}
                        onItChange={setArqItCodigo}
                        frequencia={arqFrequencia}
                        onFrequenciaChange={setArqFrequencia}
                      />
                      <div><Label>Descrição</Label><Textarea value={arqDescricao} onChange={e => setArqDescricao(e.target.value)} placeholder="Detalhes: nº do lote, operador, etc." /></div>
                      <div>
                        <Label>Arquivo * (PDF, imagem, DOC)</Label>
                        <Input
                          type="file"
                          accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                          onChange={(e) => setArqFile(e.target.files?.[0] || null)}
                        />
                      </div>
                      {arqPopCodigo && (
                        <div className="rounded-md border bg-muted/40 p-3 text-xs space-y-1">
                          <div className="text-muted-foreground">Nome exibido:</div>
                          <div className="font-mono font-medium text-foreground">
                            {nomeDisplay(arqPopCodigo, arqTipo, arqNumero, arqDataRef)}
                          </div>
                          {arqFile && (
                            <>
                              <div className="text-muted-foreground pt-1">Arquivo salvo como:</div>
                              <div className="font-mono text-[11px] break-all text-foreground">
                                {nomeArquivoFinal(arqPopCodigo, arqTipo, arqNumero, arqDataRef, arqFile.name)}
                              </div>
                              <div className="text-muted-foreground pt-1">Pasta de destino:</div>
                              <div className="font-mono text-[11px] break-all text-foreground">
                                {montarPathBpf(
                                  {
                                    empresaId: empresaAtiva?.id || user?.id || "",
                                    popCodigo: arqPopCodigo,
                                    itCodigo: arqItCodigo || null,
                                    frequencia: arqFrequencia || null,
                                    dataRef: arqDataRef,
                                  },
                                  arqFile.name,
                                )
                                  .split("/")
                                  .slice(0, -1)
                                  .join("/")}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                      <Button
                        onClick={handleAddArquivo}
                        className="w-full"
                        disabled={saving || !arqFile || !arqPopCodigo || !arqNumero || !arqDataRef}
                      >
                        {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Enviar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-2 sm:p-6 overflow-hidden">
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredArquivos.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">Nenhum arquivo nesta categoria</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                  <TableHeader><TableRow>
                    <TableHead>POP</TableHead><TableHead>Título</TableHead><TableHead>Categoria</TableHead><TableHead>Arquivo</TableHead>
                    <TableHead>Descrição</TableHead><TableHead>Data</TableHead><TableHead className="w-16"></TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {filteredArquivos.map(a => (
                      <TableRow key={a.id}>
                        <TableCell>
                          {a.pop_codigo
                            ? <Badge className="text-xs font-mono">{a.pop_codigo}</Badge>
                            : <Badge variant="outline" className="text-xs text-muted-foreground">sem POP</Badge>}
                        </TableCell>
                        <TableCell className="font-medium text-sm">
                          {a.titulo}
                          <BadgesClassificacao linha={a} />
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {CATEGORIAS_ARQ.find(c => c.value === a.categoria)?.label || a.categoria}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {a.arquivo_url ? (
                            <a href={a.arquivo_url} target="_blank" rel="noopener noreferrer" className="text-xs text-primary hover:underline flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" /> {a.arquivo_nome || "Abrir"}
                            </a>
                          ) : <span className="text-xs text-muted-foreground">{a.arquivo_nome || "—"}</span>}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground max-w-[200px] truncate">{a.descricao || "—"}</TableCell>
                        <TableCell className="text-xs">{a.created_at?.split("T")[0]}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <VincularPopButton arquivoId={a.id} currentPop={a.pop_codigo} onSaved={fetchData} />
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDeleteArquivo(a.id)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog: Revisar POP */}
      <Dialog open={versaoOpen} onOpenChange={setVersaoOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Revisar Documento — {versaoDocCodigo}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Versão Anterior</Label>
                <Input value={versaoAnterior} disabled />
              </div>
              <div>
                <Label>Nova Versão</Label>
                <Input value={versaoNova} onChange={(e) => setVersaoNova(e.target.value)} />
              </div>
            </div>
            <div>
              <Label>Responsável pela Revisão</Label>
              <Input value={versaoResponsavel} onChange={(e) => setVersaoResponsavel(e.target.value)} />
            </div>
            <div>
              <Label>Motivo da Revisão</Label>
              <Input
                value={versaoMotivo}
                onChange={(e) => setVersaoMotivo(e.target.value)}
                placeholder="Ex: Atualização"
              />
            </div>
            <div>
              <Label>Descrição das Alterações</Label>
              <Textarea
                value={versaoAlteracoes}
                onChange={(e) => setVersaoAlteracoes(e.target.value)}
                placeholder="Descreva o que mudou nesta revisão..."
              />
            </div>
            <Button onClick={handleRevisarPop} className="w-full" disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Registrar Revisão
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Histórico de Versões */}
      <Dialog open={versoesOpen} onOpenChange={setVersoesOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Histórico de Revisões — {versoesDocNome}</DialogTitle>
          </DialogHeader>
          {versoes.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Nenhuma revisão registrada</p>
          ) : (
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {versoes.map((v: any) => (
                <div key={v.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="font-mono">
                      v{v.versao_anterior} → v{v.versao_nova}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{v.created_at?.split("T")[0]}</span>
                  </div>
                  {v.responsavel && (
                    <p className="text-sm">
                      <span className="font-medium">Responsável:</span> {v.responsavel}
                    </p>
                  )}
                  {v.motivo && (
                    <p className="text-sm">
                      <span className="font-medium">Motivo:</span> {v.motivo}
                    </p>
                  )}
                  {v.alteracoes && <p className="text-xs text-muted-foreground">{v.alteracoes}</p>}
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {aprovarDoc && (
        <AprovarPopDialog
          open={aprovarOpen}
          onOpenChange={setAprovarOpen}
          documentoId={aprovarDoc.id}
          documentoNome={`${aprovarDoc.codigo} — ${aprovarDoc.nome}`}
          versao={aprovarDoc.versao || "01"}
          novoStatus={aprovarStatus}
          onSuccess={fetchData}
        />
      )}
    </>
  );
}
