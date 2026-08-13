import { useState, useEffect, useMemo } from "react";
import { Search, Building2, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Database, Upload, FileSpreadsheet, ExternalLink } from "lucide-react";
import * as XLSX from "xlsx";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { format } from "date-fns";
import sipeagroBase from "@/data/sipeagroEstabelecimentos.json";

interface EstabSipeagro {
  reg: string;
  razao: string;
  cnpj: string;
  sit: string;
  uf: string;
  mun: string;
}

interface Fornecedor {
  id: string;
  nome: string;
  cnpj: string;
  registro_mapa: string;
  registro_sipeagro: string;
  sipeagro_verificado: boolean;
  sipeagro_data_verificacao: string | null;
  status_qualificacao: string;
}

interface MapaEstabelecimento {
  id: string;
  cnpj: string | null;
  registro_estabelecimento: string | null;
  razao_social: string;
  nome_fantasia: string | null;
  situacao: string | null;
  categoria: string | null;
  atividade: string | null;
  municipio: string | null;
  uf: string | null;
  data_atualizacao_fonte: string | null;
}

interface MapaImportacao {
  id: string;
  arquivo_nome: string;
  status: string;
  total_linhas: number;
  total_importadas: number;
  total_rejeitadas: number;
  observacoes: string | null;
  created_at: string;
  concluido_em: string | null;
}

const BASE_SIPEAGRO = sipeagroBase as {
  atualizado_em: string;
  total: number;
  estabelecimentos: EstabSipeagro[];
};

const onlyDigits = (s: string) => (s || "").replace(/\D/g, "");
const norm = (s: string) =>
  (s || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
const cleanLikeValue = (s: string) => s.replace(/[%_,]/g, " ").trim();

const normalizeHeader = (value: string) =>
  norm(value)
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const IMPORT_ALIASES = {
  fonte_linha_id: ["id", "codigo", "código", "linha", "sequencia", "sequência"],
  cnpj: ["cnpj", "cnpj cpf", "cpf cnpj"],
  registro_estabelecimento: ["registro", "registro estabelecimento", "registro sipeagro", "registro mapa", "numero registro", "n registro", "nr registro"],
  razao_social: ["razao social", "razão social", "nome empresarial", "empresa", "estabelecimento"],
  nome_fantasia: ["nome fantasia", "fantasia"],
  situacao: ["situacao", "situação", "status", "situacao cadastral", "situação cadastral"],
  categoria: ["categoria", "tipo estabelecimento", "tipo"],
  atividade: ["atividade", "atividade principal", "segmento", "classificacao", "classificação"],
  municipio: ["municipio", "município", "cidade"],
  uf: ["uf", "estado"],
  endereco: ["endereco", "endereço", "logradouro"],
  cep: ["cep"],
  data_registro: ["data registro", "data de registro", "registro em"],
  data_atualizacao_fonte: ["data atualizacao", "data atualização", "atualizado em", "ultima atualizacao", "última atualização"],
} as const;

const statusLabel: Record<string, string> = {
  processando: "Processando",
  concluida: "Concluída",
  concluida_parcial: "Concluída com ressalvas",
  falhou: "Falhou",
};

const MAIN_SHEET_HINTS = ["estabelecimentos"];

function parseDateFromText(value: string): string | null {
  const match = value.match(/(\d{2})\/(\d{2})\/(\d{4})/);
  if (!match) return null;
  return `${match[3]}-${match[2]}-${match[1]}`;
}

function normalizeDocumentNumber(value: unknown, length: number) {
  const digits = onlyDigits(String(value || ""));
  if (!digits) return null;
  if (digits.length >= length) return digits;
  return digits.padStart(length, "0");
}

function resolveImportSheet(workbook: XLSX.WorkBook) {
  return (
    workbook.SheetNames.find((name) => MAIN_SHEET_HINTS.some((hint) => normalizeHeader(name).includes(hint))) ||
    workbook.SheetNames[0]
  );
}

function resolveHeaderRowIndex(rows: unknown[][]) {
  const requiredGroups = [
    IMPORT_ALIASES.razao_social,
    IMPORT_ALIASES.cnpj,
    IMPORT_ALIASES.registro_estabelecimento,
    IMPORT_ALIASES.municipio,
    IMPORT_ALIASES.uf,
  ];

  let bestIndex = 0;
  let bestScore = -1;

  for (let index = 0; index < Math.min(rows.length, 12); index += 1) {
    const row = rows[index] || [];
    const normalizedCells = row.map((cell) => normalizeHeader(String(cell || "")));
    const score = requiredGroups.reduce((total, aliases) => {
      const hasMatch = aliases.some((alias) => normalizedCells.some((cell) => cell.includes(normalizeHeader(alias))));
      return total + (hasMatch ? 1 : 0);
    }, 0);

    if (score > bestScore) {
      bestScore = score;
      bestIndex = index;
    }
  }

  return bestIndex;
}

function extractImportRows(workbook: XLSX.WorkBook) {
  const sheetName = resolveImportSheet(workbook);
  const sheet = workbook.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, defval: "", raw: false });
  const headerRowIndex = resolveHeaderRowIndex(matrix);
  const titleDate = parseDateFromText(String(matrix[0]?.[0] || ""));
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    range: headerRowIndex,
    defval: "",
    raw: false,
  });

  return { rows, titleDate, sheetName };
}

function buildExternalSipeagroSearchUrl(query: string) {
  const cleanedQuery = query.trim();
  const target = cleanedQuery || "SIPEAGRO alimentação animal estabelecimentos";
  return `https://www.google.com/search?q=${encodeURIComponent(`site:gov.br SIPEAGRO ${target}`)}`;
}

function parseSpreadsheetDate(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (!parsed) return null;
    return `${String(parsed.y).padStart(4, "0")}-${String(parsed.m).padStart(2, "0")}-${String(parsed.d).padStart(2, "0")}`;
  }
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().split("T")[0];
  }
  const text = String(value).trim();
  if (!text) return null;
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (iso) return text;
  const br = text.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (br) return `${br[3]}-${br[2]}-${br[1]}`;
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString().split("T")[0];
}

function getCellValue(row: Record<string, unknown>, aliases: readonly string[]) {
  const entries = Object.entries(row);
  for (const [key, rawValue] of entries) {
    const normalizedKey = normalizeHeader(key);
    if (aliases.some((alias) => normalizedKey.includes(normalizeHeader(alias)))) {
      return rawValue;
    }
  }
  return null;
}

export default function ConsultaSipeagro() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([]);
  const [filtro, setFiltro] = useState("");
  const [loading, setLoading] = useState(true);
  const [buscaBase, setBuscaBase] = useState("");
  const [resultadosBase, setResultadosBase] = useState<MapaEstabelecimento[]>([]);
  const [baseLoading, setBaseLoading] = useState(false);
  const [baseTotal, setBaseTotal] = useState(0);
  const [latestImport, setLatestImport] = useState<MapaImportacao | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [sourceUrl, setSourceUrl] = useState("https://www.gov.br/agricultura/pt-br/assuntos/insumos-agropecuarios/insumos-pecuarios/alimentacao-animal/arquivos-alimentacao-animal");
  const [importing, setImporting] = useState(false);

  const usingEmbeddedFallback = baseTotal === 0 && !latestImport;

  const resultadosFallback = useMemo(() => {
    const q = buscaBase.trim();
    if (!usingEmbeddedFallback || q.length < 3) return [];

    const qDigits = onlyDigits(q);
    const qNorm = norm(q);

    return BASE_SIPEAGRO.estabelecimentos
      .filter((item) => {
        if (qDigits.length >= 3 && (onlyDigits(item.cnpj).includes(qDigits) || onlyDigits(item.reg).includes(qDigits))) {
          return true;
        }
        return norm(item.razao).includes(qNorm) || norm(item.reg).includes(qNorm) || norm(item.mun).includes(qNorm);
      })
      .slice(0, 50)
      .map((item, index) => ({
        id: `${item.reg}-${index}`,
        cnpj: item.cnpj || null,
        registro_estabelecimento: item.reg || null,
        razao_social: item.razao,
        nome_fantasia: null,
        situacao: item.sit || null,
        categoria: null,
        atividade: null,
        municipio: item.mun || null,
        uf: item.uf || null,
        data_atualizacao_fonte: BASE_SIPEAGRO.atualizado_em,
      }));
  }, [buscaBase, usingEmbeddedFallback]);

  useEffect(() => {
    if (!user) return;

    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => setIsAdmin(!!data));
  }, [user]);

  useEffect(() => {
    if (!user) return;
    carregarFornecedores();
    carregarResumoBase();
  }, [user, empresaAtiva]);

  useEffect(() => {
    if (usingEmbeddedFallback) {
      setResultadosBase(resultadosFallback);
      return;
    }

    const q = buscaBase.trim();
    if (q.length < 3) {
      setResultadosBase([]);
      return;
    }

    const timeout = setTimeout(() => {
      buscarBaseInterna(q);
    }, 250);

    return () => clearTimeout(timeout);
  }, [buscaBase, usingEmbeddedFallback, resultadosFallback]);

  const carregarResumoBase = async () => {
    const [{ count }, { data: importacao }] = await Promise.all([
      supabase.from("mapa_estabelecimentos").select("id", { count: "exact", head: true }),
      supabase.from("mapa_importacoes").select("*").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);

    setBaseTotal(count || 0);
    setLatestImport((importacao as MapaImportacao | null) || null);
  };

  const buscarBaseInterna = async (query: string) => {
    const qDigits = onlyDigits(query);
    const textQuery = cleanLikeValue(query);
    const textPattern = `%${textQuery}%`;
    const digitsPattern = `%${qDigits}%`;

    setBaseLoading(true);
    const { data, error } = await supabase
      .from("mapa_estabelecimentos")
      .select("id, cnpj, registro_estabelecimento, razao_social, nome_fantasia, situacao, categoria, atividade, municipio, uf, data_atualizacao_fonte")
      .or(
        [
          `razao_social.ilike.${textPattern}`,
          `nome_fantasia.ilike.${textPattern}`,
          `municipio.ilike.${textPattern}`,
          `registro_estabelecimento.ilike.${textPattern}`,
          ...(qDigits.length >= 3 ? [`cnpj.ilike.${digitsPattern}`, `registro_estabelecimento.ilike.${digitsPattern}`] : []),
        ].join(","),
      )
      .order("razao_social")
      .limit(50);

    setBaseLoading(false);

    if (error) {
      toast.error("Não foi possível consultar a base interna.");
      return;
    }

    setResultadosBase((data as MapaEstabelecimento[]) || []);
  };

  const carregarFornecedores = async () => {
    if (!user) return;
    setLoading(true);

    let query = supabase
      .from("fornecedores")
      .select("id, nome, cnpj, registro_mapa, registro_sipeagro, sipeagro_verificado, sipeagro_data_verificacao, status_qualificacao")
      .eq("user_id", user.id)
      .order("nome");

    if (empresaAtiva) query = query.eq("empresa_id", empresaAtiva.id);

    const { data } = await query;
    setFornecedores((data as Fornecedor[]) || []);
    setLoading(false);
  };

  const marcarVerificado = async (id: string, verificado: boolean) => {
    const { error } = await supabase
      .from("fornecedores")
      .update({
        sipeagro_verificado: verificado,
        sipeagro_data_verificacao: verificado ? new Date().toISOString().split("T")[0] : null,
      })
      .eq("id", id);

    if (error) {
      toast.error("Erro ao atualizar.");
      return;
    }

    toast.success(verificado ? "Fornecedor marcado como verificado na base interna." : "Verificação removida.");
    carregarFornecedores();
  };

  const importarPlanilha = async () => {
    if (!user || !isAdmin) {
      toast.error("Somente super admin pode atualizar a base.");
      return;
    }
    if (!importFile) {
      toast.error("Selecione um arquivo Excel para importar.");
      return;
    }

    setImporting(true);
    let importacaoId: string | null = null;

    try {
      const buffer = await importFile.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
      const { rows, titleDate, sheetName } = extractImportRows(workbook);

      if (!rows.length) {
        toast.error("A planilha está vazia.");
        setImporting(false);
        return;
      }

      const { data: importacao, error: importacaoError } = await supabase
        .from("mapa_importacoes")
        .insert({
          arquivo_nome: importFile.name,
          status: "processando",
          total_linhas: rows.length,
          imported_by: user.id,
        })
        .select("id")
        .single();

      if (importacaoError || !importacao?.id) throw importacaoError || new Error("Não foi possível abrir a importação.");
      importacaoId = importacao.id;

      const registros = rows
        .map((row, index) => {
          const razaoSocial = String(getCellValue(row, IMPORT_ALIASES.razao_social) || "").trim();
          const registro = String(getCellValue(row, IMPORT_ALIASES.registro_estabelecimento) || "").trim();
          const cnpj = normalizeDocumentNumber(getCellValue(row, IMPORT_ALIASES.cnpj), 14);

          if (!razaoSocial && !registro && !cnpj) return null;
          if ([razaoSocial, registro, cnpj].every((value) => !value || String(value).trim() === "-")) return null;

          return {
            fonte_linha_id: String(getCellValue(row, IMPORT_ALIASES.fonte_linha_id) || index + 1),
            cnpj: cnpj || null,
            registro_estabelecimento: registro || null,
            razao_social: razaoSocial || registro || `Linha ${index + 1}`,
            nome_fantasia: String(getCellValue(row, IMPORT_ALIASES.nome_fantasia) || "").trim() || null,
            situacao: String(getCellValue(row, IMPORT_ALIASES.situacao) || "").trim() || null,
            categoria: String(getCellValue(row, IMPORT_ALIASES.categoria) || "").trim() || null,
            atividade: String(getCellValue(row, IMPORT_ALIASES.atividade) || "").trim() || null,
            municipio: String(getCellValue(row, IMPORT_ALIASES.municipio) || "").trim() || null,
            uf: String(getCellValue(row, IMPORT_ALIASES.uf) || "").trim().toUpperCase() || null,
            endereco: String(getCellValue(row, IMPORT_ALIASES.endereco) || "").trim() || null,
            cep: onlyDigits(String(getCellValue(row, IMPORT_ALIASES.cep) || "")) || null,
            data_registro: parseSpreadsheetDate(getCellValue(row, IMPORT_ALIASES.data_registro)),
            data_atualizacao_fonte: parseSpreadsheetDate(getCellValue(row, IMPORT_ALIASES.data_atualizacao_fonte)) || titleDate,
            importacao_id: importacaoId,
            dados_brutos: row,
          };
        })
        .filter(Boolean);

      const totalImportadas = registros.length;
      const totalRejeitadas = rows.length - totalImportadas;

      await supabase.from("mapa_estabelecimentos").delete().not("id", "is", null);

      const chunkSize = 500;
      for (let i = 0; i < registros.length; i += chunkSize) {
        const chunk = registros.slice(i, i + chunkSize);
        const { error } = await supabase.from("mapa_estabelecimentos").insert(chunk as never);
        if (error) throw error;
      }

      const status = totalRejeitadas > 0 ? "concluida_parcial" : "concluida";
      await supabase
        .from("mapa_importacoes")
        .update({
          status,
          total_importadas: totalImportadas,
          total_rejeitadas: totalRejeitadas,
          observacoes: totalRejeitadas > 0
            ? `Importação da aba ${sheetName} concluída com ${totalRejeitadas} linha(s) ignoradas por falta de dados mínimos.`
            : `Importação da aba ${sheetName} concluída com sucesso.`,
          concluido_em: new Date().toISOString(),
        })
        .eq("id", importacaoId);

      setImportFile(null);
      setBuscaBase("");
      setResultadosBase([]);
      await carregarResumoBase();
      toast.success(`Base atualizada com ${totalImportadas} estabelecimento(s).`);
    } catch (error: unknown) {
      console.error(error);
      if (importacaoId) {
        await supabase
          .from("mapa_importacoes")
          .update({
            status: "falhou",
            observacoes: error instanceof Error ? error.message : "Falha inesperada na importação.",
            concluido_em: new Date().toISOString(),
          })
          .eq("id", importacaoId);
      }
      toast.error("Falha ao importar a planilha Excel.");
    } finally {
      setImporting(false);
    }
  };

  const importarPorUrl = async () => {
    if (!sourceUrl.trim()) {
      toast.error("Informe a URL oficial para atualização.");
      return;
    }

    setImporting(true);
    const { data, error } = await supabase.functions.invoke("import-sipeagro", {
      body: { sourceUrl: sourceUrl.trim() },
    });

    setImporting(false);

    if (error) {
      toast.error(error.message || "Falha ao importar pela URL oficial.");
      return;
    }

    await carregarResumoBase();
    setBuscaBase("");
    setResultadosBase([]);
    toast.success(`Base atualizada por URL com ${data?.totalImportadas ?? 0} estabelecimento(s).`);
  };

  const filtrados = fornecedores.filter(
    (fornecedor) =>
      fornecedor.nome.toLowerCase().includes(filtro.toLowerCase()) ||
      (fornecedor.cnpj || "").includes(filtro) ||
      (fornecedor.registro_mapa || "").includes(filtro) ||
      (fornecedor.registro_sipeagro || "").includes(filtro),
  );

  const totalVerificados = fornecedores.filter((fornecedor) => fornecedor.sipeagro_verificado).length;
  const totalPendentes = fornecedores.length - totalVerificados;
  const referenciaData = latestImport?.concluido_em || latestImport?.created_at || BASE_SIPEAGRO.atualizado_em;
  const totalExibido = usingEmbeddedFallback ? BASE_SIPEAGRO.total : baseTotal;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Consulta SIPEAGRO"
        description="Base interna pesquisável de estabelecimentos MAPA com atualização por planilha Excel"
        icon={Search}
        orientacaoModuloId="consulta-sipeagro"
      />

      <Card className="border-primary/40 bg-primary/5">
        <CardContent className="pt-4 pb-4 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex-1">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Database className="w-4 h-4 text-primary" />
              Base interna de estabelecimentos do MAPA
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {usingEmbeddedFallback ? (
                <>
                  Usando snapshot embarcado com <strong>{BASE_SIPEAGRO.total.toLocaleString("pt-BR")} registros</strong> até a primeira importação interna.
                </>
              ) : (
                <>
                  Base interna ativa com <strong>{totalExibido.toLocaleString("pt-BR")} registros</strong>, atualizada em {format(new Date(referenciaData), "dd/MM/yyyy") }.
                </>
              )}
            </p>
            {latestImport && (
              <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                <Badge variant="outline">{statusLabel[latestImport.status] || latestImport.status}</Badge>
                <span>Arquivo: {latestImport.arquivo_nome}</span>
                <span>Importados: {latestImport.total_importadas}</span>
                {latestImport.total_rejeitadas > 0 && <span>Ignorados: {latestImport.total_rejeitadas}</span>}
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2 shrink-0">
            <Button asChild size="sm" variant="outline">
              <Link to="/fornecedores">Abrir fornecedores</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {isAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Upload className="w-5 h-5 text-primary" />
              Atualizar base de estabelecimentos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2 rounded-md border p-3">
              <p className="text-sm font-medium">Acesso à página oficial do MAPA</p>
              <p className="text-sm text-muted-foreground">
                Abre a página oficial onde o MAPA publica a lista. Hoje o arquivo é disponibilizado em PDF — baixe, converta para Excel e importe abaixo.
              </p>
              <div className="flex flex-col gap-3 lg:flex-row">
                <Input value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} placeholder="https://..." className="flex-1" />
                <Button onClick={importarPorUrl} disabled={importing || !sourceUrl.trim()} className="gap-2">
                  <RefreshCw className="w-4 h-4" />
                  {importing ? "Atualizando..." : "Atualizar por URL"}
                </Button>
              </div>
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="flex-1 space-y-2">
                <p className="text-sm text-muted-foreground">
                  O MAPA publica a lista em PDF. Baixe o arquivo no site oficial, converta para Excel (iLovePDF ou similar) e envie aqui. A nova carga substitui a base anterior e registra o histórico da importação.
                </p>
                <Input type="file" accept=".xlsx,.xls" onChange={(e) => setImportFile(e.target.files?.[0] || null)} />
              </div>
              <Button onClick={importarPlanilha} disabled={!importFile || importing} className="gap-2">
                <FileSpreadsheet className="w-4 h-4" />
                {importing ? "Importando..." : "Importar Excel"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-5 h-5 text-primary" />
            Buscar na base interna MAPA
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Digite CNPJ, registro, razão social, fantasia ou município (mín. 3 caracteres)..."
              value={buscaBase}
              onChange={(e) => setBuscaBase(e.target.value)}
              className="flex-1"
            />
            <Button asChild variant="outline" className="gap-2 sm:w-auto">
              <a href={buildExternalSipeagroSearchUrl(buscaBase)} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
                Pesquisar externo
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            A busca principal usa a base interna do Excel importado; o botão externo abre uma pesquisa complementar em páginas oficiais do gov.br.
          </p>

          {buscaBase.trim().length >= 3 && (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {baseLoading ? (
                <p className="text-sm text-muted-foreground text-center py-4">Pesquisando na base interna...</p>
              ) : resultadosBase.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhum estabelecimento encontrado na base interna para esta busca.
                </p>
              ) : (
                <>
                  <p className="text-xs text-muted-foreground">
                    {resultadosBase.length} resultado(s)
                    {resultadosBase.length === 50 ? " (limitado a 50 — refine a busca)" : ""}
                  </p>
                  {resultadosBase.map((item) => (
                    <div key={item.id} className="border rounded-md p-3 text-sm">
                      <div className="flex items-start justify-between gap-2 flex-wrap">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{item.razao_social}</p>
                          <p className="text-xs text-muted-foreground">
                            Reg.: <strong>{item.registro_estabelecimento || "—"}</strong>
                            {" · "}CNPJ: {item.cnpj || "—"}
                            {" · "}{item.municipio || "—"}/{item.uf || "—"}
                          </p>
                          {(item.nome_fantasia || item.categoria || item.atividade) && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {[item.nome_fantasia, item.categoria, item.atividade].filter(Boolean).join(" · ")}
                            </p>
                          )}
                        </div>
                        <Badge variant={(item.situacao || "").toLowerCase().includes("ativo") ? "default" : "destructive"} className="shrink-0">
                          {item.situacao || "Sem status"}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <Building2 className="w-6 h-6 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{fornecedores.length}</p>
            <p className="text-xs text-muted-foreground">Total Fornecedores</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <CheckCircle2 className="w-6 h-6 mx-auto mb-2 text-green-600" />
            <p className="text-2xl font-bold">{totalVerificados}</p>
            <p className="text-xs text-muted-foreground">Verificados SIPEAGRO</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
            <p className="text-2xl font-bold">{totalPendentes}</p>
            <p className="text-xs text-muted-foreground">Pendentes</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-3 justify-between">
            <CardTitle>Fornecedores</CardTitle>
            <div className="flex gap-2">
              <Input
                placeholder="Filtrar por nome, CNPJ ou registro..."
                value={filtro}
                onChange={(e) => setFiltro(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="icon" onClick={carregarFornecedores}>
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground py-8">Carregando...</p>
          ) : filtrados.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum fornecedor encontrado.</p>
          ) : (
            <div className="space-y-3">
              {filtrados.map((fornecedor) => (
                <div key={fornecedor.id} className="border rounded-lg p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{fornecedor.nome}</h4>
                      {fornecedor.sipeagro_verificado ? (
                        <Badge className="bg-green-600 text-white">✓ Verificado</Badge>
                      ) : (
                        <Badge variant="outline" className="text-yellow-600 border-yellow-600">Pendente</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      CNPJ: {fornecedor.cnpj || "—"} · Reg. MAPA: {fornecedor.registro_mapa || "—"} · SIPEAGRO: {fornecedor.registro_sipeagro || "—"}
                    </p>
                    {fornecedor.sipeagro_data_verificacao && (
                      <p className="text-xs text-muted-foreground">
                        Última verificação: {format(new Date(fornecedor.sipeagro_data_verificacao), "dd/MM/yyyy")}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setBuscaBase(fornecedor.cnpj || fornecedor.registro_sipeagro || fornecedor.registro_mapa || fornecedor.nome);
                        window.scrollTo({ top: 0, behavior: "smooth" });
                      }}
                    >
                      <Search className="w-3 h-3 mr-1" /> Buscar na base
                    </Button>
                    {fornecedor.sipeagro_verificado ? (
                      <Button variant="ghost" size="sm" onClick={() => marcarVerificado(fornecedor.id, false)}>
                        <XCircle className="w-3 h-3 mr-1" /> Remover
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => marcarVerificado(fornecedor.id, true)}>
                        <CheckCircle2 className="w-3 h-3 mr-1" /> Marcar Verificado
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Como usar a verificação interna</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2">
          <p>1. Atualize a base pelo Excel oficial sempre que houver nova publicação.</p>
          <p>2. Pesquise por CNPJ, registro ou razão social na base interna.</p>
          <p>3. Use o botão “Buscar na base” a partir do fornecedor cadastrado para localizar o registro rapidamente.</p>
          <p>4. Depois da conferência, marque o fornecedor como verificado no sistema.</p>
          <p className="text-muted-foreground mt-4">
            <strong>Nota:</strong> a base interna facilita a consulta operacional, mas a atualização da planilha deve seguir a rotina do seu programa de qualificação de fornecedores.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
