import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  BadgeCheck,
  Bug,
  CheckCircle2,
  ClipboardCheck,
  Droplets,
  Factory,
  FileUp,
  GitBranch,
  ListChecks,
  Lock,
  Package,
  RotateCcw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Truck,
  Wifi,
  WifiOff,
  Workflow,
} from "lucide-react";
import { z } from "zod";
import { RegistroPopGenerico } from "@/components/tablet/RegistroPopGenerico";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { usePapelEmpresa } from "@/hooks/usePapelEmpresa";
import { Link } from "react-router-dom";
import { useSessionDraft } from "@/hooks/useSessionDraft";
import { registrarAuditLog } from "@/utils/auditLog";
import { sha256 } from "@/utils/carimboHash";

type Tela =
  | "menu"
  | "producao"
  | "recebimento"
  | "limpeza"
  | "nc"
  | "pragas"
  | "expedicao"
  | "ordem_batida"
  | "rastreabilidade"
  | "pre_operacao"
  | "pop_generico";

type OfflineTable =
  | "producao"
  | "recebimento_mp"
  | "registros_limpeza"
  | "nao_conformidades"
  | "controle_pragas"
  | "expedicoes"
  | "rastreabilidade"
  | "checklist_items";

type OfflineOperation = "insert" | "expedicao" | "ordem_batida";

type ExpedicaoAttachment = {
  fileName: string;
  mimeType: string;
  previewUrl: string | null;
  dataUrl?: string;
};

type ExpedicaoQueuePayload = {
  empresaId: string;
  userId: string;
  numeroNF: string;
  clienteNome: string;
  clienteCnpj: string;
  motoristaNome: string;
  veiculoPlaca: string;
  produto: string;
  loteProduto: string;
  quantidade: string;
  observacoes: string;
  operadorNome: string;
  pinHashConfirmacao: string;
  assinaturaData: string;
  attachment?: {
    dataUrl: string;
    fileName: string;
    mimeType: string;
  };
};

type OrdemBatidaQueuePayload = {
  empresaId: string;
  userId: string;
  ordemId?: string;
  ordem?: {
    numeroOrdem: string;
    produto: string;
    loteProduto: string;
    quantidadeProgramada: string;
    numeroBatidas: number;
    proximoProduto: string;
    necessitaFlushing: boolean;
    materialFlushing: string;
    observacoes: string;
  };
  batida: {
    numeroBatida: number;
    operador: string;
    horaInicio: string;
    horaFim: string;
    tempoMisturaMinutos: number | null;
    temperatura: string;
    observacoes: string;
  };
  consumos: Array<{
    materiaPrima: string;
    loteMp: string;
    fornecedor: string;
    quantidadeKg: number;
  }>;
};

type OfflineQueueItem = {
  id: string;
  operation: OfflineOperation;
  table?: OfflineTable;
  label: string;
  successTitle: string;
  payload: unknown;
  createdAt: string;
};

type OrdemResumo = {
  id: string;
  numero_ordem: string;
  produto: string;
  lote_produto?: string | null;
  numero_batidas?: number | null;
  proximo_produto?: string | null;
  necessita_flushing?: boolean | null;
  material_flushing?: string | null;
  status?: string | null;
};

type MatrizSensibilidadeRow = {
  produto_anterior: string;
  produto_seguinte: string;
  requer_flushing: boolean;
};

type CalibracaoResumo = {
  equipamento: string;
  proxima_calibracao?: string | null;
  status?: string | null;
};

type CronogramaResumo = {
  area: string;
  status?: string | null;
};

type ManutencaoResumo = {
  equipamento: string;
  data_programada?: string | null;
  status?: string | null;
};

const MENU_ITEMS = [
  { id: "producao" as Tela, label: "Registrar Produção", icon: Factory, tone: "bg-primary text-primary-foreground" },
  { id: "recebimento" as Tela, label: "Recebimento MP", icon: Package, tone: "bg-secondary text-secondary-foreground" },
  { id: "limpeza" as Tela, label: "Registro Limpeza", icon: Droplets, tone: "bg-accent text-accent-foreground" },
  { id: "pragas" as Tela, label: "Observação de Pragas", icon: Bug, tone: "bg-muted text-foreground" },
  { id: "nc" as Tela, label: "Registrar NC", icon: ShieldAlert, tone: "bg-destructive text-destructive-foreground" },
  { id: "expedicao" as Tela, label: "Registrar Expedição", icon: Truck, tone: "bg-primary text-primary-foreground" },
  { id: "ordem_batida" as Tela, label: "Ordem / Batida", icon: Workflow, tone: "bg-secondary text-secondary-foreground" },
  { id: "rastreabilidade" as Tela, label: "Rastreabilidade", icon: GitBranch, tone: "bg-accent text-accent-foreground" },
  { id: "pre_operacao" as Tela, label: "Pré-operação", icon: ListChecks, tone: "bg-muted text-foreground" },
  { id: "pop_generico" as Tela, label: "Executar POP / IT", icon: ShieldCheck, tone: "bg-primary text-primary-foreground" },
];

const expedicaoSchema = z.object({
  numeroNF: z.string().trim().min(1, "Informe o número da NF").max(40, "NF muito longa"),
  clienteNome: z.string().trim().min(2, "Informe o cliente").max(120, "Cliente muito longo"),
  clienteCnpj: z.string().trim().max(20, "CNPJ muito longo"),
  motoristaNome: z.string().trim().min(2, "Informe o motorista").max(120, "Motorista muito longo"),
  veiculoPlaca: z.string().trim().min(5, "Informe a placa").max(16, "Placa muito longa"),
  produto: z.string().trim().min(2, "Informe o produto").max(120, "Produto muito longo"),
  loteProduto: z.string().trim().min(1, "Informe o lote").max(60, "Lote muito longo"),
  quantidade: z.string().trim().min(1, "Informe a quantidade").max(20, "Quantidade muito longa"),
  observacoes: z.string().trim().max(500, "Observações muito longas"),
  operadorNome: z.string().trim().min(2, "Informe o operador").max(120, "Nome muito longo"),
  pin: z.string().trim().regex(/^\d{4,10}$/, "PIN deve ter entre 4 e 10 dígitos"),
});

const ordemBatidaSchema = z
  .object({
    existingOrderId: z.string().trim().optional(),
    numeroOrdem: z.string().trim().max(50, "Número da ordem muito longo").optional(),
    produto: z.string().trim().max(120, "Produto muito longo").optional(),
    loteProduto: z.string().trim().max(60, "Lote muito longo").optional(),
    quantidadeProgramada: z.string().trim().max(20, "Quantidade muito longa").optional(),
    numeroBatidasPlanejadas: z.string().trim().max(4, "Quantidade de batidas inválida").optional(),
    proximoProduto: z.string().trim().max(120, "Próximo produto muito longo").optional(),
    operador: z.string().trim().min(2, "Informe o operador").max(120, "Operador muito longo"),
    batidaNumero: z.string().trim().min(1, "Informe o número da batida").max(4, "Batida inválida"),
    horaInicio: z.string().trim().max(8, "Hora inválida"),
    horaFim: z.string().trim().max(8, "Hora inválida"),
    tempoMistura: z.string().trim().max(4, "Tempo inválido"),
    temperatura: z.string().trim().max(20, "Temperatura muito longa"),
    observacoes: z.string().trim().max(500, "Observações muito longas"),
    materiaPrima: z.string().trim().max(120, "Matéria-prima muito longa"),
    loteMp: z.string().trim().max(60, "Lote MP muito longo"),
    fornecedor: z.string().trim().max(120, "Fornecedor muito longo"),
    quantidadeKg: z.string().trim().max(20, "Quantidade inválida"),
  })
  .superRefine((value, ctx) => {
    if (!value.existingOrderId && (!value.numeroOrdem || !value.produto)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Selecione uma ordem ou informe número e produto para criar uma nova." });
    }
  });

const rastreabilidadeSchema = z.object({
  produto: z.string().trim().min(2, "Informe o produto").max(120, "Produto muito longo"),
  loteProduto: z.string().trim().min(1, "Informe o lote do produto").max(60, "Lote muito longo"),
  materiaPrima: z.string().trim().min(2, "Informe a matéria-prima").max(120, "Matéria-prima muito longa"),
  loteMp: z.string().trim().min(1, "Informe o lote da MP").max(60, "Lote MP muito longo"),
  fornecedor: z.string().trim().max(120, "Fornecedor muito longo"),
});

const preOperacaoSchema = z.object({
  area: z.string().trim().min(2, "Informe a área").max(120, "Área muito longa"),
  responsavel: z.string().trim().min(2, "Informe o responsável").max(120, "Responsável muito longo"),
  observacoes: z.string().trim().max(500, "Observações muito longas"),
});

const MAX_EXPEDICAO_FILE_MB = 5;

function isNetworkError(message?: string) {
  if (!message) return false;
  const normalized = message.toLowerCase();
  return normalized.includes("failed to fetch") || normalized.includes("network") || normalized.includes("fetch");
}

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

function getFileExtension(fileName: string) {
  const ext = fileName.split(".").pop()?.toLowerCase();
  return ext || "bin";
}

function buildExpedicaoFilePath(userId: string, empresaId: string, fileName: string) {
  const ext = getFileExtension(fileName);
  return `${userId}/${empresaId}/tablet-expedicao/${Date.now()}_${sanitizeFileName(fileName.replace(/\.[^.]+$/, ""))}.${ext}`;
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Falha ao ler o arquivo"));
    reader.readAsDataURL(file);
  });
}

function dataUrlToFile(dataUrl: string, fileName: string, mimeType: string) {
  const [meta, base64] = dataUrl.split(",");
  const finalMime = mimeType || meta.match(/data:(.*?);base64/)?.[1] || "application/octet-stream";
  const bytes = atob(base64 || "");
  const array = new Uint8Array(bytes.length);

  for (let i = 0; i < bytes.length; i += 1) {
    array[i] = bytes.charCodeAt(i);
  }

  return new File([array], fileName, { type: finalMime });
}

type ProducaoDraft = {
  produto: string;
  lote: string;
  operador: string;
  quantidade: string;
};

type RecebimentoDraft = {
  fornecedor: string;
  materiaPrima: string;
  lote: string;
  odor: string;
  insetos: string;
  aprovado: boolean;
};

type LimpezaDraft = {
  executor: string;
  conforme: boolean;
  observacoes: string;
};

type NaoConformidadeDraft = {
  setor: string;
  descricao: string;
};

type ExpedicaoDraft = {
  numeroNF: string;
  clienteNome: string;
  clienteCnpj: string;
  motoristaNome: string;
  veiculoPlaca: string;
  produto: string;
  loteProduto: string;
  quantidade: string;
  observacoes: string;
  operadorNome: string;
  pin: string;
};

type OrdemBatidaDraft = {
  existingOrderId: string;
  numeroOrdem: string;
  produto: string;
  loteProduto: string;
  quantidadeProgramada: string;
  numeroBatidasPlanejadas: string;
  proximoProduto: string;
  operador: string;
  batidaNumero: string;
  horaInicio: string;
  horaFim: string;
  tempoMistura: string;
  temperatura: string;
  observacoes: string;
  materiaPrima: string;
  loteMp: string;
  fornecedor: string;
  quantidadeKg: string;
};

type RastreabilidadeDraft = {
  produto: string;
  loteProduto: string;
  materiaPrima: string;
  loteMp: string;
  fornecedor: string;
};

type PreOperacaoDraft = {
  area: string;
  responsavel: string;
  limpezaOk: boolean;
  balancaOk: boolean;
  epiOk: boolean;
  linhaLiberada: boolean;
  observacoes: string;
};

type PragaDraft = {
  local: string;
  tipos: {
    roedores: boolean;
    aves: boolean;
    voadores: boolean;
    rasteiros: boolean;
    outros: boolean;
  };
  acao: string;
  responsavel: string;
};

const INITIAL_PRODUCAO: ProducaoDraft = { produto: "", lote: "", operador: "", quantidade: "" };
const INITIAL_RECEBIMENTO: RecebimentoDraft = {
  fornecedor: "",
  materiaPrima: "",
  lote: "",
  odor: "normal",
  insetos: "ausente",
  aprovado: true,
};
const INITIAL_LIMPEZA: LimpezaDraft = { executor: "", conforme: true, observacoes: "" };
const INITIAL_NC: NaoConformidadeDraft = { setor: "", descricao: "" };
const INITIAL_EXPEDICAO: ExpedicaoDraft = {
  numeroNF: "",
  clienteNome: "",
  clienteCnpj: "",
  motoristaNome: "",
  veiculoPlaca: "",
  produto: "",
  loteProduto: "",
  quantidade: "",
  observacoes: "",
  operadorNome: "",
  pin: "",
};
const INITIAL_ORDEM_BATIDA: OrdemBatidaDraft = {
  existingOrderId: "",
  numeroOrdem: "",
  produto: "",
  loteProduto: "",
  quantidadeProgramada: "",
  numeroBatidasPlanejadas: "1",
  proximoProduto: "",
  operador: "",
  batidaNumero: "1",
  horaInicio: "",
  horaFim: "",
  tempoMistura: "",
  temperatura: "",
  observacoes: "",
  materiaPrima: "",
  loteMp: "",
  fornecedor: "",
  quantidadeKg: "",
};
const INITIAL_RASTREABILIDADE: RastreabilidadeDraft = {
  produto: "",
  loteProduto: "",
  materiaPrima: "",
  loteMp: "",
  fornecedor: "",
};
const INITIAL_PRE_OPERACAO: PreOperacaoDraft = {
  area: "Misturador / linha principal",
  responsavel: "",
  limpezaOk: true,
  balancaOk: true,
  epiOk: true,
  linhaLiberada: true,
  observacoes: "",
};
const INITIAL_PRAGA: PragaDraft = {
  local: "",
  tipos: { roedores: false, aves: false, voadores: false, rasteiros: false, outros: false },
  acao: "",
  responsavel: "",
};

export default function ModoTablet() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const { isVisualizador, loading: papelLoading } = usePapelEmpresa();
  const escritaBloqueada = isVisualizador || papelLoading;
  const [tela, setTela] = useState<Tela>("menu");
  const [saving, setSaving] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator === "undefined" ? true : navigator.onLine);
  const [syncingQueue, setSyncingQueue] = useState(false);
  const [pendingQueue, setPendingQueue] = useState<OfflineQueueItem[]>([]);
  const [pinHashCache, setPinHashCache] = useState<string | null>(null);
  const [pinConfigurado, setPinConfigurado] = useState<boolean | null>(null);
  const [expedicaoAttachment, setExpedicaoAttachment] = useState<ExpedicaoAttachment | null>(null);
  const [ordensDisponiveis, setOrdensDisponiveis] = useState<OrdemResumo[]>([]);
  const [matrizSensibilidade, setMatrizSensibilidade] = useState<MatrizSensibilidadeRow[]>([]);
  const [calibracoesResumo, setCalibracoesResumo] = useState<CalibracaoResumo[]>([]);
  const [cronogramasResumo, setCronogramasResumo] = useState<CronogramaResumo[]>([]);
  const [manutencoesResumo, setManutencoesResumo] = useState<ManutencaoResumo[]>([]);
  const empresaKey = empresaAtiva?.id ?? "sem-empresa";
  const queueStorageKey = useMemo(() => `tablet_offline_queue_${user?.id ?? "anonimo"}`, [user?.id]);
  const pinCacheStorageKey = useMemo(() => `empresa_pin_cache_${empresaKey}`, [empresaKey]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [producaoDraft, setProducaoDraft, clearProducaoDraft] = useSessionDraft(`tablet_producao_${empresaKey}`, INITIAL_PRODUCAO);
  const [recebimentoDraft, setRecebimentoDraft, clearRecebimentoDraft] = useSessionDraft(`tablet_recebimento_${empresaKey}`, INITIAL_RECEBIMENTO);
  const [limpezaDraft, setLimpezaDraft, clearLimpezaDraft] = useSessionDraft(`tablet_limpeza_${empresaKey}`, INITIAL_LIMPEZA);
  const [ncDraft, setNcDraft, clearNcDraft] = useSessionDraft(`tablet_nc_${empresaKey}`, INITIAL_NC);
  const [pragaDraft, setPragaDraft, clearPragaDraft] = useSessionDraft(`tablet_pragas_${empresaKey}`, INITIAL_PRAGA);
  const [expedicaoDraft, setExpedicaoDraft, clearExpedicaoDraft] = useSessionDraft(`tablet_expedicao_${empresaKey}`, INITIAL_EXPEDICAO);
  const [ordemBatidaDraft, setOrdemBatidaDraft, clearOrdemBatidaDraft] = useSessionDraft(`tablet_ordem_batida_${empresaKey}`, INITIAL_ORDEM_BATIDA);
  const [rastreabilidadeDraft, setRastreabilidadeDraft, clearRastreabilidadeDraft] = useSessionDraft(`tablet_rastreabilidade_${empresaKey}`, INITIAL_RASTREABILIDADE);
  const [preOperacaoDraft, setPreOperacaoDraft, clearPreOperacaoDraft] = useSessionDraft(`tablet_pre_operacao_${empresaKey}`, INITIAL_PRE_OPERACAO);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const raw = window.localStorage.getItem(queueStorageKey);
      setPendingQueue(raw ? (JSON.parse(raw) as OfflineQueueItem[]) : []);
    } catch {
      setPendingQueue([]);
    }
  }, [queueStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      window.localStorage.setItem(queueStorageKey, JSON.stringify(pendingQueue));
      window.dispatchEvent(new CustomEvent("offline-queue-updated"));
    } catch {
    }
  }, [pendingQueue, queueStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      const cachedHash = window.localStorage.getItem(pinCacheStorageKey);
      setPinHashCache(cachedHash || null);
      setPinConfigurado(Boolean(cachedHash));
    } catch {
      setPinHashCache(null);
      setPinConfigurado(null);
    }
  }, [pinCacheStorageKey]);

  useEffect(() => {
    if (!empresaAtiva?.id) {
      setPinConfigurado(null);
      return;
    }

    supabase
      .from("empresa_pin")
      .select("pin_hash")
      .eq("empresa_id", empresaAtiva.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) return;
        const nextHash = data?.pin_hash || null;
        setPinHashCache(nextHash);
        setPinConfigurado(Boolean(nextHash));

        if (typeof window !== "undefined") {
          if (nextHash) {
            window.localStorage.setItem(pinCacheStorageKey, nextHash);
          } else {
            window.localStorage.removeItem(pinCacheStorageKey);
          }
        }
      });
  }, [empresaAtiva?.id, pinCacheStorageKey]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchOperationalContext = useCallback(async () => {
    if (!user || !empresaAtiva?.id) return;

    const [ordensRes, matrizRes, calibracoesRes, cronogramasRes, manutencoesRes] = await Promise.all([
      supabase
        .from("ordens_producao")
        .select("id, numero_ordem, produto, lote_produto, numero_batidas, proximo_produto, necessita_flushing, material_flushing, status")
        .eq("empresa_id", empresaAtiva.id)
        .order("data_programada", { ascending: false })
        .limit(30),
      supabase.from("matriz_sensibilidade").select("produto_anterior, produto_seguinte, requer_flushing").eq("empresa_id", empresaAtiva.id),
      supabase.from("calibracoes").select("equipamento, proxima_calibracao, status").eq("empresa_id", empresaAtiva.id).order("proxima_calibracao", { ascending: true }).limit(10),
      supabase.from("cronogramas_higiene").select("area, status").eq("empresa_id", empresaAtiva.id).order("area").limit(10),
      supabase.from("manutencoes").select("equipamento, data_programada, status").eq("empresa_id", empresaAtiva.id).order("data_programada", { ascending: true }).limit(10),
    ]);

    setOrdensDisponiveis((ordensRes.data || []) as OrdemResumo[]);
    setMatrizSensibilidade((matrizRes.data || []) as MatrizSensibilidadeRow[]);
    setCalibracoesResumo((calibracoesRes.data || []) as CalibracaoResumo[]);
    setCronogramasResumo((cronogramasRes.data || []) as CronogramaResumo[]);
    setManutencoesResumo((manutencoesRes.data || []) as ManutencaoResumo[]);
  }, [empresaAtiva?.id, user]);

  useEffect(() => {
    void fetchOperationalContext();
  }, [fetchOperationalContext]);

  const clearExpedicaoAttachment = useCallback(() => {
    setExpedicaoAttachment((current) => {
      if (current?.previewUrl?.startsWith("blob:")) {
        URL.revokeObjectURL(current.previewUrl);
      }
      return null;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, []);

  const resetExpedicao = useCallback(() => {
    setExpedicaoDraft(INITIAL_EXPEDICAO);
    clearExpedicaoDraft();
    clearExpedicaoAttachment();
  }, [clearExpedicaoAttachment, clearExpedicaoDraft, setExpedicaoDraft]);

  const resetOrdemBatida = useCallback(() => {
    setOrdemBatidaDraft(INITIAL_ORDEM_BATIDA);
    clearOrdemBatidaDraft();
  }, [clearOrdemBatidaDraft, setOrdemBatidaDraft]);

  const resetRastreabilidade = useCallback(() => {
    setRastreabilidadeDraft(INITIAL_RASTREABILIDADE);
    clearRastreabilidadeDraft();
  }, [clearRastreabilidadeDraft, setRastreabilidadeDraft]);

  const resetPreOperacao = useCallback(() => {
    setPreOperacaoDraft(INITIAL_PRE_OPERACAO);
    clearPreOperacaoDraft();
  }, [clearPreOperacaoDraft, setPreOperacaoDraft]);

  const draftStatus = useMemo<Record<Exclude<Tela, "menu" | "pop_generico">, boolean>>(
    () => ({
      producao: Boolean(producaoDraft.produto || producaoDraft.lote || producaoDraft.operador || producaoDraft.quantidade),
      recebimento: Boolean(recebimentoDraft.fornecedor || recebimentoDraft.materiaPrima || recebimentoDraft.lote),
      limpeza: Boolean(limpezaDraft.executor || limpezaDraft.observacoes),
      nc: Boolean(ncDraft.setor || ncDraft.descricao),
      pragas: Boolean(pragaDraft.local || pragaDraft.acao || pragaDraft.responsavel || Object.values(pragaDraft.tipos).some(Boolean)),
      expedicao: Boolean(
        expedicaoDraft.numeroNF ||
          expedicaoDraft.clienteNome ||
          expedicaoDraft.motoristaNome ||
          expedicaoDraft.veiculoPlaca ||
          expedicaoDraft.produto ||
          expedicaoDraft.loteProduto ||
          expedicaoDraft.quantidade ||
          expedicaoDraft.operadorNome ||
          expedicaoAttachment
      ),
      ordem_batida: Boolean(
        ordemBatidaDraft.existingOrderId ||
          ordemBatidaDraft.numeroOrdem ||
          ordemBatidaDraft.produto ||
          ordemBatidaDraft.operador ||
          ordemBatidaDraft.batidaNumero ||
          ordemBatidaDraft.materiaPrima
      ),
      rastreabilidade: Boolean(
        rastreabilidadeDraft.produto ||
          rastreabilidadeDraft.loteProduto ||
          rastreabilidadeDraft.materiaPrima ||
          rastreabilidadeDraft.loteMp
      ),
      pre_operacao: Boolean(
        preOperacaoDraft.responsavel ||
          preOperacaoDraft.observacoes ||
          !preOperacaoDraft.limpezaOk ||
          !preOperacaoDraft.balancaOk ||
          !preOperacaoDraft.epiOk ||
          !preOperacaoDraft.linhaLiberada
      ),
    }),
    [
      expedicaoAttachment,
      expedicaoDraft.clienteNome,
      expedicaoDraft.loteProduto,
      expedicaoDraft.motoristaNome,
      expedicaoDraft.numeroNF,
      expedicaoDraft.operadorNome,
      expedicaoDraft.produto,
      expedicaoDraft.quantidade,
      expedicaoDraft.veiculoPlaca,
      limpezaDraft.executor,
      limpezaDraft.observacoes,
      ncDraft.descricao,
      ncDraft.setor,
      ordemBatidaDraft.batidaNumero,
      ordemBatidaDraft.existingOrderId,
      ordemBatidaDraft.materiaPrima,
      ordemBatidaDraft.numeroOrdem,
      ordemBatidaDraft.operador,
      ordemBatidaDraft.produto,
      pragaDraft.acao,
      pragaDraft.local,
      pragaDraft.responsavel,
      pragaDraft.tipos,
      preOperacaoDraft.balancaOk,
      preOperacaoDraft.epiOk,
      preOperacaoDraft.limpezaOk,
      preOperacaoDraft.linhaLiberada,
      preOperacaoDraft.observacoes,
      preOperacaoDraft.responsavel,
      producaoDraft.lote,
      producaoDraft.operador,
      producaoDraft.produto,
      producaoDraft.quantidade,
      rastreabilidadeDraft.loteMp,
      rastreabilidadeDraft.loteProduto,
      rastreabilidadeDraft.materiaPrima,
      rastreabilidadeDraft.produto,
      recebimentoDraft.fornecedor,
      recebimentoDraft.lote,
      recebimentoDraft.materiaPrima,
    ]
  );

  const primeiroRascunho = useMemo(
    () => MENU_ITEMS.find((item) => item.id !== "pop_generico" && item.id !== "menu" && draftStatus[item.id as Exclude<Tela, "menu" | "pop_generico">]),
    [draftStatus]
  );

  const filaResumo = useMemo(
    () => pendingQueue.slice(0, 3).map((item) => `${item.label} • ${new Date(item.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}`),
    [pendingQueue]
  );

  const ordemSelecionada = useMemo(
    () => ordensDisponiveis.find((ordem) => ordem.id === ordemBatidaDraft.existingOrderId) || null,
    [ordemBatidaDraft.existingOrderId, ordensDisponiveis]
  );

  const produtoBaseOrdem = ordemSelecionada?.produto || ordemBatidaDraft.produto;
  const proximoProdutoBase = ordemSelecionada?.proximo_produto || ordemBatidaDraft.proximoProduto;

  const flushRecomendado = useMemo(() => {
    if (!produtoBaseOrdem || !proximoProdutoBase) return null;

    const match = matrizSensibilidade.find(
      (row) =>
        row.produto_anterior.toLowerCase() === produtoBaseOrdem.toLowerCase() &&
        row.produto_seguinte.toLowerCase() === proximoProdutoBase.toLowerCase()
    );

    if (match) return match;
    if (ordemSelecionada?.necessita_flushing) {
      return {
        produto_anterior: produtoBaseOrdem,
        produto_seguinte: proximoProdutoBase,
        requer_flushing: true,
      };
    }

    return null;
  }, [matrizSensibilidade, ordemSelecionada?.necessita_flushing, produtoBaseOrdem, proximoProdutoBase]);

  const calibracoesVencendo = useMemo(() => {
    const hoje = new Date();
    return calibracoesResumo.filter((item) => item.proxima_calibracao && new Date(item.proxima_calibracao) <= hoje).length;
  }, [calibracoesResumo]);

  const manutencoesPendentes = useMemo(() => {
    const hoje = new Date();
    return manutencoesResumo.filter((item) => item.data_programada && new Date(item.data_programada) <= hoje && item.status !== "concluida").length;
  }, [manutencoesResumo]);

  const cronogramasInativos = useMemo(() => cronogramasResumo.filter((item) => item.status && item.status !== "ativo").length, [cronogramasResumo]);

  const requireContext = () => {
    if (escritaBloqueada) {
      toast({ title: "Acesso somente leitura", variant: "destructive" });
      return false;
    }
    if (!user) {
      toast({ title: "Faça login para registrar", variant: "destructive" });
      return false;
    }
    if (!empresaAtiva?.id) {
      toast({ title: "Selecione uma empresa ativa", variant: "destructive" });
      return false;
    }
    return true;
  };

  const enqueueOfflineItem = useCallback((item: Omit<OfflineQueueItem, "id" | "createdAt">) => {
    if (escritaBloqueada) return;
    const queuedItem: OfflineQueueItem = {
      ...item,
      id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}_${Math.random().toString(36).slice(2)}`,
      createdAt: new Date().toISOString(),
    };

    setPendingQueue((current) => [...current, queuedItem]);
    return queuedItem;
  }, [escritaBloqueada]);

  const uploadExpedicaoAttachment = useCallback(async (attachment: ExpedicaoQueuePayload["attachment"], userId: string, empresaId: string) => {
    if (!attachment) return { comprovanteArquivoNome: "", comprovanteArquivoPath: "" };

    const file = dataUrlToFile(attachment.dataUrl, attachment.fileName, attachment.mimeType);
    const filePath = buildExpedicaoFilePath(userId, empresaId, attachment.fileName);
    const { error } = await supabase.storage.from("feed-bpf").upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

    if (error) throw error;

    return {
      comprovanteArquivoNome: attachment.fileName,
      comprovanteArquivoPath: filePath,
    };
  }, []);

  const persistExpedicao = useCallback(async (payload: ExpedicaoQueuePayload, syncOrigem: "online" | "offline_queue") => {
    const uploadData = await uploadExpedicaoAttachment(payload.attachment, payload.userId, payload.empresaId);

    const { data: expedicao, error: expedicaoError } = await supabase
      .from("expedicoes")
      .insert({
        user_id: payload.userId,
        empresa_id: payload.empresaId,
        numero_nf: payload.numeroNF,
        cliente_nome: payload.clienteNome,
        cliente_cnpj: payload.clienteCnpj,
        motorista_nome: payload.motoristaNome,
        veiculo_placa: payload.veiculoPlaca.toUpperCase(),
        data_saida: new Date().toISOString().split("T")[0],
        data_emissao: new Date().toISOString().split("T")[0],
        operador_nome: payload.operadorNome,
        pin_hash_confirmacao: payload.pinHashConfirmacao,
        assinatura_data: payload.assinaturaData,
        comprovante_arquivo_nome: uploadData.comprovanteArquivoNome,
        comprovante_arquivo_path: uploadData.comprovanteArquivoPath,
        sync_origem: syncOrigem,
        origem: "tablet",
        observacoes: payload.observacoes,
        status: "emitida",
      })
      .select("id")
      .single();

    if (expedicaoError || !expedicao) throw expedicaoError || new Error("Falha ao salvar expedição");

    const quantidadeNumerica = Number(payload.quantidade.replace(",", "."));
    const { error: itemError } = await supabase.from("expedicao_itens").insert({
      user_id: payload.userId,
      empresa_id: payload.empresaId,
      expedicao_id: expedicao.id,
      produto: payload.produto,
      lote_produto: payload.loteProduto,
      quantidade: Number.isFinite(quantidadeNumerica) ? quantidadeNumerica : 0,
      unidade: "kg",
      operador_nome: payload.operadorNome,
      pin_hash_confirmacao: payload.pinHashConfirmacao,
      assinatura_data: payload.assinaturaData,
    });

    if (itemError) throw itemError;

    await registrarAuditLog({
      userId: payload.userId,
      empresaId: payload.empresaId,
      tabela: "expedicoes",
      registroId: expedicao.id,
      acao: "criar",
      dadosNovos: {
        numero_nf: payload.numeroNF,
        cliente_nome: payload.clienteNome,
        produto: payload.produto,
        lote_produto: payload.loteProduto,
        quantidade: payload.quantidade,
        sync_origem: syncOrigem,
        comprovante_arquivo_nome: uploadData.comprovanteArquivoNome || null,
      },
    });
  }, [uploadExpedicaoAttachment]);

  const persistOrdemBatida = useCallback(async (payload: OrdemBatidaQueuePayload, syncOrigem: "online" | "offline_queue") => {
    let ordemId = payload.ordemId;

    if (!ordemId && payload.ordem) {
      const { data: ordem, error: ordemError } = await supabase
        .from("ordens_producao")
        .insert({
          user_id: payload.userId,
          empresa_id: payload.empresaId,
          numero_ordem: payload.ordem.numeroOrdem,
          produto: payload.ordem.produto,
          lote_produto: payload.ordem.loteProduto,
          quantidade_programada: payload.ordem.quantidadeProgramada,
          numero_batidas: payload.ordem.numeroBatidas,
          proximo_produto: payload.ordem.proximoProduto || null,
          necessita_flushing: payload.ordem.necessitaFlushing,
          material_flushing: payload.ordem.materialFlushing || null,
          observacoes: payload.ordem.observacoes || null,
          data_programada: new Date().toISOString().split("T")[0],
          status: "em_producao",
          tipo_ordem: "normal",
        })
        .select("id")
        .single();

      if (ordemError || !ordem) throw ordemError || new Error("Falha ao criar ordem");
      ordemId = ordem.id;
    }

    if (!ordemId) throw new Error("Ordem não encontrada para registrar a batida");

    const { data: batida, error: batidaError } = await supabase
      .from("batidas_producao")
      .insert({
        user_id: payload.userId,
        empresa_id: payload.empresaId,
        ordem_id: ordemId,
        numero_batida: payload.batida.numeroBatida,
        operador: payload.batida.operador,
        hora_inicio: payload.batida.horaInicio || null,
        hora_fim: payload.batida.horaFim || null,
        tempo_mistura_minutos: payload.batida.tempoMisturaMinutos,
        temperatura: payload.batida.temperatura,
        status: "concluida",
        observacoes: `[${syncOrigem === "offline_queue" ? "FILA OFFLINE" : "REGISTRO ONLINE"}] ${payload.batida.observacoes}`.trim(),
      })
      .select("id")
      .single();

    if (batidaError || !batida) throw batidaError || new Error("Falha ao registrar batida");

    if (payload.consumos.length > 0) {
      const { error: consumoError } = await supabase.from("batida_lotes").insert(
        payload.consumos.map((item) => ({
          user_id: payload.userId,
          empresa_id: payload.empresaId,
          ordem_id: ordemId,
          numero_batida: payload.batida.numeroBatida,
          materia_prima: item.materiaPrima,
          lote_mp: item.loteMp,
          fornecedor: item.fornecedor,
          quantidade_kg: item.quantidadeKg,
        })) as any
      );

      if (consumoError) throw consumoError;
    }

    await supabase.from("ordens_producao").update({ status: "em_producao" } as any).eq("id", ordemId);

    await registrarAuditLog({
      userId: payload.userId,
      empresaId: payload.empresaId,
      tabela: "batidas_producao",
      registroId: batida.id,
      acao: "criar",
      dadosNovos: {
        ordem_id: ordemId,
        numero_batida: payload.batida.numeroBatida,
        operador: payload.batida.operador,
        consumos: payload.consumos.length,
        sync_origem: syncOrigem,
      },
    });
  }, []);

  const flushQueue = useCallback(async () => {
    if (escritaBloqueada || !isOnline || syncingQueue || pendingQueue.length === 0) return;

    setSyncingQueue(true);
    let syncedCount = 0;
    const remaining: OfflineQueueItem[] = [];

    for (let index = 0; index < pendingQueue.length; index += 1) {
      const item = pendingQueue[index];

      try {
        if (item.operation === "expedicao") {
          await persistExpedicao(item.payload as ExpedicaoQueuePayload, "offline_queue");
        } else if (item.operation === "ordem_batida") {
          await persistOrdemBatida(item.payload as OrdemBatidaQueuePayload, "offline_queue");
        } else {
          const { error } = await (supabase.from(item.table as never) as any).insert(item.payload as any);
          if (error) throw error;
        }

        syncedCount += 1;
      } catch (error) {
        const message = error instanceof Error ? error.message : undefined;
        remaining.push(item, ...pendingQueue.slice(index + 1));
        if (!isNetworkError(message)) {
          toast({
            title: `Falha ao sincronizar ${item.label}`,
            description: message || "Tente novamente em instantes.",
            variant: "destructive",
          });
        }
        break;
      }
    }

    setPendingQueue(remaining);
    setSyncingQueue(false);

    if (syncedCount > 0) {
      await fetchOperationalContext();
      toast({
        title: syncedCount === 1 ? "1 registro sincronizado" : `${syncedCount} registros sincronizados`,
        description: remaining.length > 0 ? "Alguns itens seguirão na fila até a próxima tentativa." : "Todos os registros pendentes foram enviados.",
      });
    }
  }, [escritaBloqueada, fetchOperationalContext, isOnline, pendingQueue, persistExpedicao, persistOrdemBatida, syncingQueue]);

  useEffect(() => {
    if (isOnline && pendingQueue.length > 0 && !syncingQueue) {
      void flushQueue();
    }
  }, [flushQueue, isOnline, pendingQueue.length, syncingQueue]);

  const saveOrQueue = useCallback(async ({
    table,
    payload,
    label,
    successTitle,
    onSuccess,
  }: {
    table: OfflineTable;
    payload: unknown;
    label: string;
    successTitle: string;
    onSuccess: () => void;
  }) => {
    if (!requireContext()) return;

    if (!isOnline) {
      enqueueOfflineItem({ operation: "insert", table, payload, label, successTitle });
      onSuccess();
      toast({
        title: `${label} salvo na fila`,
        description: "O registro será enviado automaticamente quando a conexão voltar.",
      });
      return;
    }

    setSaving(true);

    try {
      const { error } = await (supabase.from(table as never) as any).insert(payload as any);

      if (error) {
        if (isNetworkError(error.message)) {
          enqueueOfflineItem({ operation: "insert", table, payload, label, successTitle });
          onSuccess();
          toast({
            title: `${label} salvo na fila`,
            description: "A conexão oscilou. O registro será reenviado automaticamente.",
          });
          return;
        }

        toast({ title: "Erro", description: error.message, variant: "destructive" });
        return;
      }

      await fetchOperationalContext();
      toast({ title: successTitle });
      onSuccess();
    } catch {
      enqueueOfflineItem({ operation: "insert", table, payload, label, successTitle });
      onSuccess();
      toast({
        title: `${label} salvo na fila`,
        description: "Não foi possível enviar agora. O sistema tentará novamente quando voltar a conexão.",
      });
    } finally {
      setSaving(false);
    }
  }, [escritaBloqueada, enqueueOfflineItem, fetchOperationalContext, isOnline]);

  const resolvePinHash = useCallback(async () => {
    if (!empresaAtiva?.id) return null;
    if (pinHashCache) return pinHashCache;

    const { data, error } = await supabase.from("empresa_pin").select("pin_hash").eq("empresa_id", empresaAtiva.id).maybeSingle();
    if (error || !data?.pin_hash) return null;

    setPinHashCache(data.pin_hash);
    setPinConfigurado(true);
    if (typeof window !== "undefined") window.localStorage.setItem(pinCacheStorageKey, data.pin_hash);
    return data.pin_hash;
  }, [empresaAtiva?.id, pinCacheStorageKey, pinHashCache]);

  const validarPin = useCallback(async (pinDigitado: string) => {
    const expectedHash = await resolvePinHash();
    if (!empresaAtiva?.id || !expectedHash) {
      toast({
        title: "PIN não configurado",
        description: "Configure o PIN da empresa antes de registrar a expedição.",
        variant: "destructive",
      });
      return null;
    }

    const currentHash = await sha256(`${empresaAtiva.id}:${pinDigitado.trim()}`);
    if (currentHash !== expectedHash) {
      toast({ title: "PIN incorreto", variant: "destructive" });
      return null;
    }

    return currentHash;
  }, [empresaAtiva?.id, resolvePinHash]);

  const criarPayloadExpedicao = useCallback(async (pinHashConfirmacao: string) => {
    if (!user || !empresaAtiva?.id) return null;

    const assinaturaData = new Date().toISOString();
    let attachment: ExpedicaoQueuePayload["attachment"] | undefined;

    if (expedicaoAttachment?.dataUrl && expedicaoAttachment.fileName) {
      attachment = {
        dataUrl: expedicaoAttachment.dataUrl,
        fileName: expedicaoAttachment.fileName,
        mimeType: expedicaoAttachment.mimeType,
      };
    }

    return {
      empresaId: empresaAtiva.id,
      userId: user.id,
      numeroNF: expedicaoDraft.numeroNF.trim(),
      clienteNome: expedicaoDraft.clienteNome.trim(),
      clienteCnpj: expedicaoDraft.clienteCnpj.trim(),
      motoristaNome: expedicaoDraft.motoristaNome.trim(),
      veiculoPlaca: expedicaoDraft.veiculoPlaca.trim().toUpperCase(),
      produto: expedicaoDraft.produto.trim(),
      loteProduto: expedicaoDraft.loteProduto.trim(),
      quantidade: expedicaoDraft.quantidade.trim(),
      observacoes: expedicaoDraft.observacoes.trim(),
      operadorNome: expedicaoDraft.operadorNome.trim(),
      pinHashConfirmacao,
      assinaturaData,
      attachment,
    } satisfies ExpedicaoQueuePayload;
  }, [empresaAtiva?.id, expedicaoAttachment, expedicaoDraft, user]);

  const prepararAnexoParaFila = useCallback(async () => {
    if (!expedicaoAttachment?.previewUrl || expedicaoAttachment.dataUrl || !fileInputRef.current?.files?.[0]) {
      return expedicaoAttachment;
    }

    const selectedFile = fileInputRef.current.files[0];
    const dataUrl = await fileToDataUrl(selectedFile);
    const nextAttachment = {
      ...expedicaoAttachment,
      dataUrl,
    };
    setExpedicaoAttachment(nextAttachment);
    return nextAttachment;
  }, [expedicaoAttachment]);

  const salvarProducao = async () => {
    if (!producaoDraft.produto || !user || !empresaAtiva?.id) {
      requireContext();
      return;
    }

    await saveOrQueue({
      table: "producao",
      label: "Produção",
      successTitle: "✅ Produção registrada!",
      payload: {
        user_id: user.id,
        empresa_id: empresaAtiva.id,
        produto: producaoDraft.produto,
        lote: producaoDraft.lote,
        operador: producaoDraft.operador,
        quantidade: producaoDraft.quantidade,
      },
      onSuccess: () => {
        setProducaoDraft(INITIAL_PRODUCAO);
        clearProducaoDraft();
        setTela("menu");
      },
    });
  };

  const salvarRecebimento = async () => {
    if (!recebimentoDraft.fornecedor || !recebimentoDraft.materiaPrima || !user || !empresaAtiva?.id) {
      requireContext();
      return;
    }

    await saveOrQueue({
      table: "recebimento_mp",
      label: "Recebimento",
      successTitle: "✅ Recebimento registrado!",
      payload: {
        user_id: user.id,
        empresa_id: empresaAtiva.id,
        fornecedor: recebimentoDraft.fornecedor,
        materia_prima: recebimentoDraft.materiaPrima,
        lote: recebimentoDraft.lote,
        odor: recebimentoDraft.odor,
        insetos: recebimentoDraft.insetos,
        aprovado: recebimentoDraft.aprovado,
      },
      onSuccess: () => {
        setRecebimentoDraft(INITIAL_RECEBIMENTO);
        clearRecebimentoDraft();
        setTela("menu");
      },
    });
  };

  const salvarLimpeza = async () => {
    if (!limpezaDraft.executor || !user || !empresaAtiva?.id) {
      requireContext();
      return;
    }

    await saveOrQueue({
      table: "registros_limpeza",
      label: "Limpeza",
      successTitle: "✅ Limpeza registrada!",
      payload: {
        user_id: user.id,
        empresa_id: empresaAtiva.id,
        executor: limpezaDraft.executor,
        conforme: limpezaDraft.conforme,
        observacoes: limpezaDraft.observacoes,
      },
      onSuccess: () => {
        setLimpezaDraft(INITIAL_LIMPEZA);
        clearLimpezaDraft();
        setTela("menu");
      },
    });
  };

  const salvarNC = async () => {
    if (!ncDraft.setor || !ncDraft.descricao || !user || !empresaAtiva?.id) {
      requireContext();
      return;
    }

    await saveOrQueue({
      table: "nao_conformidades",
      label: "Não conformidade",
      successTitle: "✅ NC registrada!",
      payload: {
        user_id: user.id,
        empresa_id: empresaAtiva.id,
        setor: ncDraft.setor,
        descricao: ncDraft.descricao,
      },
      onSuccess: () => {
        setNcDraft(INITIAL_NC);
        clearNcDraft();
        setTela("menu");
      },
    });
  };

  const salvarPraga = async () => {
    if (!pragaDraft.local || !pragaDraft.responsavel || !user || !empresaAtiva?.id) {
      requireContext();
      return;
    }

    const tipos: string[] = [];
    if (pragaDraft.tipos.roedores) tipos.push("Roedores");
    if (pragaDraft.tipos.aves) tipos.push("Aves/Pássaros");
    if (pragaDraft.tipos.voadores) tipos.push("Insetos voadores");
    if (pragaDraft.tipos.rasteiros) tipos.push("Insetos rasteiros");
    if (pragaDraft.tipos.outros) tipos.push("Outros");

    if (tipos.length === 0) {
      toast({ title: "Selecione ao menos um tipo de evidência", variant: "destructive" });
      return;
    }

    await saveOrQueue({
      table: "controle_pragas",
      label: "Observação de pragas",
      successTitle: "✅ Observação registrada!",
      payload: {
        user_id: user.id,
        empresa_id: empresaAtiva.id,
        data: new Date().toISOString().split("T")[0],
        local: pragaDraft.local,
        tipo_praga: tipos.join(", "),
        acao: pragaDraft.acao || "Inspeção / observação visual",
        responsavel: pragaDraft.responsavel,
      },
      onSuccess: () => {
        setPragaDraft(INITIAL_PRAGA);
        clearPragaDraft();
        setTela("menu");
      },
    });
  };

  const salvarExpedicao = async () => {
    if (!requireContext()) return;

    const parsed = expedicaoSchema.safeParse({
      numeroNF: expedicaoDraft.numeroNF,
      clienteNome: expedicaoDraft.clienteNome,
      clienteCnpj: expedicaoDraft.clienteCnpj,
      motoristaNome: expedicaoDraft.motoristaNome,
      veiculoPlaca: expedicaoDraft.veiculoPlaca,
      produto: expedicaoDraft.produto,
      loteProduto: expedicaoDraft.loteProduto,
      quantidade: expedicaoDraft.quantidade,
      observacoes: expedicaoDraft.observacoes,
      operadorNome: expedicaoDraft.operadorNome,
      pin: expedicaoDraft.pin,
    });

    if (!parsed.success) {
      toast({ title: "Revise os campos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }

    const pinHashConfirmacao = await validarPin(expedicaoDraft.pin);
    if (!pinHashConfirmacao) return;

    setSaving(true);

    try {
      const preparedAttachment = await prepararAnexoParaFila();
      const payload = await criarPayloadExpedicao(pinHashConfirmacao);
      if (!payload) return;

      const payloadComAnexo: ExpedicaoQueuePayload = preparedAttachment?.dataUrl
        ? {
            ...payload,
            attachment: {
              dataUrl: preparedAttachment.dataUrl,
              fileName: preparedAttachment.fileName,
              mimeType: preparedAttachment.mimeType,
            },
          }
        : payload;

      if (!isOnline) {
        enqueueOfflineItem({
          operation: "expedicao",
          table: "expedicoes",
          payload: payloadComAnexo,
          label: "Expedição",
          successTitle: "✅ Expedição registrada!",
        });
        resetExpedicao();
        setTela("menu");
        toast({
          title: "Expedição salva na fila",
          description: "A assinatura por PIN e o comprovante serão sincronizados automaticamente quando a conexão voltar.",
        });
        return;
      }

      await persistExpedicao(payloadComAnexo, "online");
      await fetchOperationalContext();
      resetExpedicao();
      setTela("menu");
      toast({
        title: "✅ Expedição registrada!",
        description: payloadComAnexo.attachment?.fileName
          ? "Assinatura validada e comprovante anexado com sucesso."
          : "Assinatura validada com sucesso.",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao registrar expedição";

      if (isNetworkError(message)) {
        const preparedAttachment = await prepararAnexoParaFila();
        const payload = await criarPayloadExpedicao(pinHashConfirmacao);
        if (payload) {
          const payloadComAnexo: ExpedicaoQueuePayload = preparedAttachment?.dataUrl
            ? {
                ...payload,
                attachment: {
                  dataUrl: preparedAttachment.dataUrl,
                  fileName: preparedAttachment.fileName,
                  mimeType: preparedAttachment.mimeType,
                },
              }
            : payload;

          enqueueOfflineItem({
            operation: "expedicao",
            table: "expedicoes",
            payload: payloadComAnexo,
            label: "Expedição",
            successTitle: "✅ Expedição registrada!",
          });
          resetExpedicao();
          setTela("menu");
          toast({
            title: "Expedição salva na fila",
            description: "A conexão oscilou. O registro será reenviado automaticamente.",
          });
          return;
        }
      }

      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const salvarOrdemBatida = async () => {
    if (!requireContext()) return;

    const parsed = ordemBatidaSchema.safeParse(ordemBatidaDraft);
    if (!parsed.success) {
      toast({ title: "Revise os campos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }

    if (!ordemBatidaDraft.existingOrderId && (!ordemBatidaDraft.numeroOrdem || !ordemBatidaDraft.produto)) {
      toast({ title: "Informe a ordem", description: "Selecione uma ordem existente ou preencha número e produto.", variant: "destructive" });
      return;
    }

    const payload: OrdemBatidaQueuePayload = {
      empresaId: empresaAtiva!.id,
      userId: user!.id,
      ordemId: ordemBatidaDraft.existingOrderId || undefined,
      ordem: ordemBatidaDraft.existingOrderId
        ? undefined
        : {
            numeroOrdem: ordemBatidaDraft.numeroOrdem.trim(),
            produto: ordemBatidaDraft.produto.trim(),
            loteProduto: ordemBatidaDraft.loteProduto.trim(),
            quantidadeProgramada: ordemBatidaDraft.quantidadeProgramada.trim(),
            numeroBatidas: Number(ordemBatidaDraft.numeroBatidasPlanejadas || "1") || 1,
            proximoProduto: ordemBatidaDraft.proximoProduto.trim(),
            necessitaFlushing: Boolean(flushRecomendado?.requer_flushing),
            materialFlushing: flushRecomendado?.requer_flushing ? "Verificar POP de flushing" : "",
            observacoes: ordemBatidaDraft.observacoes.trim(),
          },
      batida: {
        numeroBatida: Number(ordemBatidaDraft.batidaNumero || "1") || 1,
        operador: ordemBatidaDraft.operador.trim(),
        horaInicio: ordemBatidaDraft.horaInicio.trim(),
        horaFim: ordemBatidaDraft.horaFim.trim(),
        tempoMisturaMinutos: ordemBatidaDraft.tempoMistura ? Number(ordemBatidaDraft.tempoMistura) || null : null,
        temperatura: ordemBatidaDraft.temperatura.trim(),
        observacoes: [
          flushRecomendado?.requer_flushing
            ? `Flushing recomendado entre ${flushRecomendado.produto_anterior} e ${flushRecomendado.produto_seguinte}.`
            : null,
          ordemBatidaDraft.observacoes.trim() || null,
        ]
          .filter(Boolean)
          .join(" "),
      },
      consumos: ordemBatidaDraft.materiaPrima
        ? [
            {
              materiaPrima: ordemBatidaDraft.materiaPrima.trim(),
              loteMp: ordemBatidaDraft.loteMp.trim(),
              fornecedor: ordemBatidaDraft.fornecedor.trim(),
              quantidadeKg: Number(ordemBatidaDraft.quantidadeKg.replace(",", ".")) || 0,
            },
          ]
        : [],
    };

    setSaving(true);
    try {
      if (!isOnline) {
        enqueueOfflineItem({
          operation: "ordem_batida",
          payload,
          label: "Ordem / batida",
          successTitle: "✅ Batida registrada!",
        });
        resetOrdemBatida();
        setTela("menu");
        toast({ title: "Batida salva na fila", description: "A ordem, a batida e o consumo de MP serão sincronizados quando a conexão voltar." });
        return;
      }

      await persistOrdemBatida(payload, "online");
      await fetchOperationalContext();
      resetOrdemBatida();
      setTela("menu");
      toast({ title: "✅ Batida registrada!", description: payload.consumos.length > 0 ? "Batida e consumo de MP gravados com sucesso." : "Batida gravada com sucesso." });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao registrar ordem/batida";
      if (isNetworkError(message)) {
        enqueueOfflineItem({
          operation: "ordem_batida",
          payload,
          label: "Ordem / batida",
          successTitle: "✅ Batida registrada!",
        });
        resetOrdemBatida();
        setTela("menu");
        toast({ title: "Batida salva na fila", description: "A conexão oscilou. O sistema vai reenviar automaticamente." });
        return;
      }
      toast({ title: "Erro", description: message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const salvarRastreabilidade = async () => {
    if (!requireContext()) return;

    const parsed = rastreabilidadeSchema.safeParse(rastreabilidadeDraft);
    if (!parsed.success) {
      toast({ title: "Revise os campos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }

    await saveOrQueue({
      table: "rastreabilidade",
      label: "Rastreabilidade",
      successTitle: "✅ Vínculo de rastreabilidade salvo!",
      payload: {
        user_id: user!.id,
        empresa_id: empresaAtiva!.id,
        produto: rastreabilidadeDraft.produto.trim(),
        lote_produto: rastreabilidadeDraft.loteProduto.trim(),
        materia_prima: rastreabilidadeDraft.materiaPrima.trim(),
        lote_mp: rastreabilidadeDraft.loteMp.trim(),
        fornecedor: rastreabilidadeDraft.fornecedor.trim(),
      },
      onSuccess: () => {
        resetRastreabilidade();
        setTela("menu");
      },
    });
  };

  const salvarPreOperacao = async () => {
    if (!requireContext()) return;

    const parsed = preOperacaoSchema.safeParse({
      area: preOperacaoDraft.area,
      responsavel: preOperacaoDraft.responsavel,
      observacoes: preOperacaoDraft.observacoes,
    });

    if (!parsed.success) {
      toast({ title: "Revise os campos", description: parsed.error.issues[0]?.message, variant: "destructive" });
      return;
    }

    const observacaoBase = [
      `Responsável: ${preOperacaoDraft.responsavel.trim()}`,
      preOperacaoDraft.observacoes.trim() || null,
      calibracoesVencendo > 0 ? `${calibracoesVencendo} calibração(ões) vencendo.` : null,
      manutencoesPendentes > 0 ? `${manutencoesPendentes} manutenção(ões) pendentes.` : null,
      cronogramasInativos > 0 ? `${cronogramasInativos} cronograma(s) fora do status ativo.` : null,
    ]
      .filter(Boolean)
      .join(" | ");

    const checklistRows = [
      { item: "Limpeza da linha", conforme: preOperacaoDraft.limpezaOk },
      { item: "Balança / instrumentos liberados", conforme: preOperacaoDraft.balancaOk },
      { item: "EPI obrigatório conferido", conforme: preOperacaoDraft.epiOk },
      { item: "Linha liberada para partida", conforme: preOperacaoDraft.linhaLiberada },
    ].map((row) => ({
      user_id: user!.id,
      empresa_id: empresaAtiva!.id,
      area: `Pré-operação — ${preOperacaoDraft.area.trim()}`,
      item: row.item,
      conforme: row.conforme,
      observacao: observacaoBase,
      auditoria_data: new Date().toISOString().split("T")[0],
    }));

    await saveOrQueue({
      table: "checklist_items",
      label: "Pré-operação",
      successTitle: "✅ Checklist pré-operação salvo!",
      payload: checklistRows,
      onSuccess: () => {
        resetPreOperacao();
        setTela("menu");
      },
    });
  };

  const handleExpedicaoAttachmentChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_EXPEDICAO_FILE_MB * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: `Use arquivos com até ${MAX_EXPEDICAO_FILE_MB}MB no chão de fábrica.`,
        variant: "destructive",
      });
      event.target.value = "";
      return;
    }

    clearExpedicaoAttachment();

    const isImage = file.type.startsWith("image/");
    const previewUrl = isImage ? URL.createObjectURL(file) : null;
    const nextAttachment: ExpedicaoAttachment = {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      previewUrl,
    };

    if (!isOnline) {
      nextAttachment.dataUrl = await fileToDataUrl(file);
    }

    setExpedicaoAttachment(nextAttachment);
  };

  const Voltar = ({ onClearDraft }: { onClearDraft?: () => void }) => (
    <div className="mb-4 flex items-center justify-between gap-2">
      <Button variant="ghost" onClick={() => setTela("menu")}>
        <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
      </Button>
      {onClearDraft ? (
        <Button variant="outline" size="sm" onClick={onClearDraft}>
          <RotateCcw className="w-4 h-4 mr-2" /> Limpar rascunho
        </Button>
      ) : null}
    </div>
  );

  const StatusBanner = () => {
    if (!isOnline) {
      return (
        <div className="mb-4 w-full rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <p className="flex items-center gap-2 font-medium">
            <WifiOff className="w-4 h-4" /> Sem conexão no momento
          </p>
          <p className="mt-1 text-muted-foreground">
            {pendingQueue.length > 0
              ? `${pendingQueue.length} registro(s) aguardando envio automático quando a internet voltar.`
              : "Os novos lançamentos serão guardados na fila deste aparelho até a conexão voltar."}
          </p>
          {filaResumo.length > 0 ? (
            <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
              {filaResumo.map((linha) => (
                <li key={linha}>• {linha}</li>
              ))}
            </ul>
          ) : null}
        </div>
      );
    }

    if (syncingQueue) {
      return (
        <div className="mb-4 w-full rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm text-foreground">
          <p className="flex items-center gap-2 font-medium">
            <Wifi className="w-4 h-4 text-primary" /> Sincronizando registros pendentes
          </p>
          <p className="mt-1 text-muted-foreground">Enviando {pendingQueue.length} item(ns) assim que o backend responder.</p>
        </div>
      );
    }

    if (pendingQueue.length > 0) {
      return (
        <div className="mb-4 w-full rounded-lg border border-border bg-card p-3 text-sm text-foreground">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 font-medium">
                <BadgeCheck className="w-4 h-4 text-primary" /> Fila pronta para sincronizar
              </p>
              <p className="mt-1 text-muted-foreground">Há {pendingQueue.length} registro(s) pendente(s) salvos neste aparelho.</p>
              {filaResumo.length > 0 ? (
                <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                  {filaResumo.map((linha) => (
                    <li key={linha}>• {linha}</li>
                  ))}
                </ul>
              ) : null}
            </div>
            <Button type="button" size="sm" variant="outline" onClick={() => void flushQueue()}>
              Sincronizar agora
            </Button>
          </div>
        </div>
      );
    }

    return null;
  };

  const CardHeader = ({ title, subtitle, icon: Icon }: { title: string; subtitle: string; icon: typeof Factory }) => (
    <div className="space-y-3">
      <div className="flex items-start gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-foreground">
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
        <p className="font-medium text-foreground">Empresa ativa</p>
        <p className="text-muted-foreground mt-1">{empresaAtiva?.nome || "Selecione uma empresa antes de registrar."}</p>
      </div>
    </div>
  );

  if (tela === "menu") {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
        <div className="text-center mb-8">
          <Factory className="w-12 h-12 text-primary mx-auto mb-3" />
          <h1 className="text-2xl font-bold font-display">Modo Chão de Fábrica</h1>
          <p className="text-muted-foreground mt-1">Selecione a operação para registrar</p>
          <p className="text-sm text-foreground mt-3">{empresaAtiva?.nome || "Nenhuma empresa ativa selecionada"}</p>
        </div>

        <div className="w-full max-w-md">
          <StatusBanner />
        </div>

        {primeiroRascunho ? (
          <div className="mb-4 w-full max-w-md rounded-lg border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-foreground">Rascunho disponível</p>
                <p className="text-sm text-muted-foreground mt-1">Continue o último lançamento em andamento sem perder o que já foi digitado.</p>
              </div>
              <BadgeCheck className="w-5 h-5 text-primary shrink-0" />
            </div>
            <Button className="w-full mt-3" onClick={() => setTela(primeiroRascunho.id)}>
              Continuar {primeiroRascunho.label}
            </Button>
          </div>
        ) : null}

        <div className="grid grid-cols-2 gap-4 w-full max-w-md">
          {MENU_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => setTela(item.id)}
              className="relative flex flex-col items-center justify-center gap-3 p-6 rounded-xl bg-card border-2 border-border hover:border-primary/50 hover:shadow-lg transition-all active:scale-95 min-h-[140px]"
            >
              {item.id !== "pop_generico" && item.id !== "menu" && draftStatus[item.id as Exclude<Tela, "menu" | "pop_generico">] ? (
                <span className="absolute right-3 top-3 rounded-full bg-primary px-2 py-1 text-xs font-semibold text-primary-foreground">
                  Rascunho
                </span>
              ) : null}
              <div className={`w-14 h-14 rounded-lg ${item.tone} flex items-center justify-center`}>
                <item.icon className="w-7 h-7" />
              </div>
              <span className="text-sm font-semibold text-center">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="mt-8 flex flex-col items-center gap-2">
          <Link to="/configurar-pin">
            <Button variant="outline" size="sm">
              <Lock className="w-4 h-4 mr-2" /> Configurar PIN da Empresa
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" /> Voltar ao Painel Completo
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  if (tela === "pop_generico") {
    return <RegistroPopGenerico onVoltar={() => setTela("menu")} />;
  }

  if (tela === "producao") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setProducaoDraft(INITIAL_PRODUCAO); clearProducaoDraft(); }} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Registrar Produção" subtitle="Lançamento rápido do lote produzido." icon={Factory} />
            <div><Label className="text-base">Produto *</Label><Input value={producaoDraft.produto} onChange={e => setProducaoDraft({ ...producaoDraft, produto: e.target.value })} className="text-lg h-12 mt-1" placeholder="Nome do produto" /></div>
            <div><Label className="text-base">Lote</Label><Input value={producaoDraft.lote} onChange={e => setProducaoDraft({ ...producaoDraft, lote: e.target.value })} className="text-lg h-12 mt-1" placeholder="Nº do lote" /></div>
            <div><Label className="text-base">Operador</Label><Input value={producaoDraft.operador} onChange={e => setProducaoDraft({ ...producaoDraft, operador: e.target.value })} className="text-lg h-12 mt-1" placeholder="Nome do operador" /></div>
            <div><Label className="text-base">Quantidade (kg)</Label><Input value={producaoDraft.quantidade} onChange={e => setProducaoDraft({ ...producaoDraft, quantidade: e.target.value })} className="text-lg h-12 mt-1" placeholder="0" type="number" inputMode="decimal" /></div>
            <Button onClick={salvarProducao} disabled={saving || !producaoDraft.produto} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Salvar Produção" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "recebimento") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setRecebimentoDraft(INITIAL_RECEBIMENTO); clearRecebimentoDraft(); }} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Recebimento MP" subtitle="Inspeção rápida de matéria-prima na chegada." icon={Package} />
            <div><Label className="text-base">Fornecedor *</Label><Input value={recebimentoDraft.fornecedor} onChange={e => setRecebimentoDraft({ ...recebimentoDraft, fornecedor: e.target.value })} className="text-lg h-12 mt-1" /></div>
            <div><Label className="text-base">Matéria-Prima *</Label><Input value={recebimentoDraft.materiaPrima} onChange={e => setRecebimentoDraft({ ...recebimentoDraft, materiaPrima: e.target.value })} className="text-lg h-12 mt-1" /></div>
            <div><Label className="text-base">Lote</Label><Input value={recebimentoDraft.lote} onChange={e => setRecebimentoDraft({ ...recebimentoDraft, lote: e.target.value })} className="text-lg h-12 mt-1" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Odor</Label>
                <Select value={recebimentoDraft.odor} onValueChange={(value) => setRecebimentoDraft({ ...recebimentoDraft, odor: value })}>
                  <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="normal">Normal</SelectItem><SelectItem value="anormal">Anormal</SelectItem></SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-base">Insetos</Label>
                <Select value={recebimentoDraft.insetos} onValueChange={(value) => setRecebimentoDraft({ ...recebimentoDraft, insetos: value })}>
                  <SelectTrigger className="h-12 text-base mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="ausente">Ausente</SelectItem><SelectItem value="presente">Presente</SelectItem></SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Checkbox checked={recebimentoDraft.aprovado} onCheckedChange={(c) => setRecebimentoDraft({ ...recebimentoDraft, aprovado: !!c })} id="aprovado" />
              <Label htmlFor="aprovado" className="text-base font-medium cursor-pointer">Material Aprovado</Label>
            </div>
            <Button onClick={salvarRecebimento} disabled={saving || !recebimentoDraft.fornecedor || !recebimentoDraft.materiaPrima} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Salvar Recebimento" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "limpeza") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setLimpezaDraft(INITIAL_LIMPEZA); clearLimpezaDraft(); }} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Registro de Limpeza" subtitle="Confirmação operacional ao final da higienização." icon={Droplets} />
            <div><Label className="text-base">Executor *</Label><Input value={limpezaDraft.executor} onChange={e => setLimpezaDraft({ ...limpezaDraft, executor: e.target.value })} className="text-lg h-12 mt-1" placeholder="Nome de quem executou" /></div>
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted">
              <Checkbox checked={limpezaDraft.conforme} onCheckedChange={(c) => setLimpezaDraft({ ...limpezaDraft, conforme: !!c })} id="conforme" />
              <Label htmlFor="conforme" className="text-base font-medium cursor-pointer">Limpeza Conforme</Label>
            </div>
            <div><Label className="text-base">Observações</Label><Textarea value={limpezaDraft.observacoes} onChange={e => setLimpezaDraft({ ...limpezaDraft, observacoes: e.target.value })} className="text-base mt-1" rows={3} /></div>
            <Button onClick={salvarLimpeza} disabled={saving || !limpezaDraft.executor} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Salvar Limpeza" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "nc") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setNcDraft(INITIAL_NC); clearNcDraft(); }} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Registrar NC" subtitle="Notifique o desvio assim que ele for identificado." icon={ShieldAlert} />
            <div><Label className="text-base">Setor *</Label><Input value={ncDraft.setor} onChange={e => setNcDraft({ ...ncDraft, setor: e.target.value })} className="text-lg h-12 mt-1" placeholder="Ex: Mistura, Envase..." /></div>
            <div><Label className="text-base">Descrição *</Label><Textarea value={ncDraft.descricao} onChange={e => setNcDraft({ ...ncDraft, descricao: e.target.value })} className="text-base mt-1" rows={4} placeholder="Descreva a não conformidade encontrada..." /></div>
            <Button onClick={salvarNC} disabled={saving || !ncDraft.setor || !ncDraft.descricao} className="w-full h-14 text-lg" size="lg" variant="destructive">
              <AlertTriangle className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Registrar NC" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "expedicao") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={resetExpedicao} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Registrar Expedição" subtitle="Saída rápida com assinatura por PIN, comprovante e fila auditável." icon={Truck} />

            {pinConfigurado === false ? (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                <p className="font-medium flex items-center gap-2"><Lock className="w-4 h-4" /> PIN da empresa não configurado</p>
                <p className="mt-1 text-muted-foreground">Configure o PIN antes de liberar expedições neste dispositivo.</p>
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Número NF *</Label>
                <Input value={expedicaoDraft.numeroNF} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, numeroNF: e.target.value.slice(0, 40) })} className="text-lg h-12 mt-1" placeholder="12345" />
              </div>
              <div>
                <Label className="text-base">Placa *</Label>
                <Input value={expedicaoDraft.veiculoPlaca} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, veiculoPlaca: e.target.value.toUpperCase().slice(0, 16) })} className="text-lg h-12 mt-1" placeholder="ABC1D23" />
              </div>
            </div>

            <div>
              <Label className="text-base">Cliente *</Label>
              <Input value={expedicaoDraft.clienteNome} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, clienteNome: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Nome do cliente" />
            </div>

            <div>
              <Label className="text-base">CNPJ cliente</Label>
              <Input value={expedicaoDraft.clienteCnpj} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, clienteCnpj: e.target.value.slice(0, 20) })} className="text-lg h-12 mt-1" placeholder="00.000.000/0000-00" />
            </div>

            <div>
              <Label className="text-base">Motorista *</Label>
              <Input value={expedicaoDraft.motoristaNome} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, motoristaNome: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Nome do motorista" />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Produto *</Label>
                <Input value={expedicaoDraft.produto} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, produto: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Produto expedido" />
              </div>
              <div>
                <Label className="text-base">Lote *</Label>
                <Input value={expedicaoDraft.loteProduto} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, loteProduto: e.target.value.slice(0, 60) })} className="text-lg h-12 mt-1" placeholder="Lote final" />
              </div>
            </div>

            <div>
              <Label className="text-base">Quantidade (kg) *</Label>
              <Input value={expedicaoDraft.quantidade} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, quantidade: e.target.value.slice(0, 20) })} className="text-lg h-12 mt-1" placeholder="0" inputMode="decimal" />
            </div>

            <div>
              <Label className="text-base">Observações</Label>
              <Textarea value={expedicaoDraft.observacoes} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, observacoes: e.target.value.slice(0, 500) })} className="text-base mt-1" rows={3} placeholder="Ex: lacre conferido, temperatura do veículo, restrições..." />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-foreground">Comprovante da expedição</p>
                  <p className="text-xs text-muted-foreground">Foto ou PDF até {MAX_EXPEDICAO_FILE_MB}MB. Offline, o arquivo entra junto na fila.</p>
                </div>
                <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                  <FileUp className="w-4 h-4 mr-2" /> Anexar
                </Button>
              </div>
              <input ref={fileInputRef} type="file" accept="image/*,application/pdf" className="hidden" onChange={handleExpedicaoAttachmentChange} />
              {expedicaoAttachment ? (
                <div className="rounded-lg border border-border bg-background p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{expedicaoAttachment.fileName}</p>
                      <p className="text-xs text-muted-foreground">{isOnline ? "Pronto para enviar" : "Guardado localmente para sincronizar"}</p>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={clearExpedicaoAttachment}>Remover</Button>
                  </div>
                  {expedicaoAttachment.previewUrl ? (
                    <img src={expedicaoAttachment.previewUrl} alt="Comprovante da expedição" className="mt-3 max-h-48 w-full rounded-lg object-contain" />
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Operador *</Label>
                <Input value={expedicaoDraft.operadorNome} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, operadorNome: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Nome do operador" />
              </div>
              <div>
                <Label className="text-base">PIN *</Label>
                <Input value={expedicaoDraft.pin} onChange={(e) => setExpedicaoDraft({ ...expedicaoDraft, pin: e.target.value.replace(/\D/g, "").slice(0, 10) })} type="password" inputMode="numeric" className="text-lg h-12 mt-1 tracking-widest" placeholder="••••" />
              </div>
            </div>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              O registro salva a expedição, o item expedido, a confirmação por PIN e mantém a origem online/offline para auditoria.
            </div>

            <Button onClick={salvarExpedicao} disabled={saving || !pinConfigurado} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Salvar Expedição" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "ordem_batida") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={resetOrdemBatida} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Ordem / Batida" subtitle="Apontamento rápido da produção e consumo real de matéria-prima." icon={Workflow} />

            <div>
              <Label className="text-base">Ordem existente</Label>
              <Select
                value={ordemBatidaDraft.existingOrderId}
                onValueChange={(value) => {
                  const ordem = ordensDisponiveis.find((item) => item.id === value);
                  setOrdemBatidaDraft({
                    ...ordemBatidaDraft,
                    existingOrderId: value,
                    numeroOrdem: ordem?.numero_ordem || ordemBatidaDraft.numeroOrdem,
                    produto: ordem?.produto || ordemBatidaDraft.produto,
                    loteProduto: ordem?.lote_produto || ordemBatidaDraft.loteProduto,
                    numeroBatidasPlanejadas: String(ordem?.numero_batidas || ordemBatidaDraft.numeroBatidasPlanejadas || "1"),
                    proximoProduto: ordem?.proximo_produto || ordemBatidaDraft.proximoProduto,
                  });
                }}
              >
                <SelectTrigger className="h-12 text-base mt-1"><SelectValue placeholder="Criar nova ordem" /></SelectTrigger>
                <SelectContent>
                  {ordensDisponiveis.map((ordem) => (
                    <SelectItem key={ordem.id} value={ordem.id}>{ordem.numero_ordem} • {ordem.produto}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Nº ordem {!ordemBatidaDraft.existingOrderId ? "*" : ""}</Label>
                <Input value={ordemBatidaDraft.numeroOrdem} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, numeroOrdem: e.target.value.slice(0, 50) })} className="text-lg h-12 mt-1" placeholder="OP-001" disabled={Boolean(ordemBatidaDraft.existingOrderId)} />
              </div>
              <div>
                <Label className="text-base">Batida *</Label>
                <Input value={ordemBatidaDraft.batidaNumero} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, batidaNumero: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="text-lg h-12 mt-1" placeholder="1" inputMode="numeric" />
              </div>
            </div>

            <div>
              <Label className="text-base">Produto {!ordemBatidaDraft.existingOrderId ? "*" : ""}</Label>
              <Input value={ordemBatidaDraft.produto} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, produto: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Produto em processo" disabled={Boolean(ordemBatidaDraft.existingOrderId)} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Lote PA</Label>
                <Input value={ordemBatidaDraft.loteProduto} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, loteProduto: e.target.value.slice(0, 60) })} className="text-lg h-12 mt-1" placeholder="Lote final" disabled={Boolean(ordemBatidaDraft.existingOrderId)} />
              </div>
              <div>
                <Label className="text-base">Qtd programada</Label>
                <Input value={ordemBatidaDraft.quantidadeProgramada} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, quantidadeProgramada: e.target.value.slice(0, 20) })} className="text-lg h-12 mt-1" placeholder="kg" disabled={Boolean(ordemBatidaDraft.existingOrderId)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-base">Batidas planejadas</Label>
                <Input value={ordemBatidaDraft.numeroBatidasPlanejadas} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, numeroBatidasPlanejadas: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="text-lg h-12 mt-1" inputMode="numeric" disabled={Boolean(ordemBatidaDraft.existingOrderId)} />
              </div>
              <div>
                <Label className="text-base">Próximo produto</Label>
                <Input value={ordemBatidaDraft.proximoProduto} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, proximoProduto: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Ajuda no flushing" disabled={Boolean(ordemBatidaDraft.existingOrderId)} />
              </div>
            </div>

            {flushRecomendado ? (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
                <p className="font-medium text-foreground">Flushing recomendado</p>
                <p className="mt-1 text-muted-foreground">Entre {flushRecomendado.produto_anterior} e {flushRecomendado.produto_seguinte} a matriz indica limpeza de linha antes desta sequência.</p>
              </div>
            ) : null}

            <div>
              <Label className="text-base">Operador *</Label>
              <Input value={ordemBatidaDraft.operador} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, operador: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Quem executou" />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-base">Início</Label>
                <Input value={ordemBatidaDraft.horaInicio} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, horaInicio: e.target.value.slice(0, 8) })} className="text-lg h-12 mt-1" placeholder="07:30" />
              </div>
              <div>
                <Label className="text-base">Fim</Label>
                <Input value={ordemBatidaDraft.horaFim} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, horaFim: e.target.value.slice(0, 8) })} className="text-lg h-12 mt-1" placeholder="08:10" />
              </div>
              <div>
                <Label className="text-base">Mistura (min)</Label>
                <Input value={ordemBatidaDraft.tempoMistura} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, tempoMistura: e.target.value.replace(/\D/g, "").slice(0, 4) })} className="text-lg h-12 mt-1" inputMode="numeric" />
              </div>
            </div>

            <div>
              <Label className="text-base">Temperatura</Label>
              <Input value={ordemBatidaDraft.temperatura} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, temperatura: e.target.value.slice(0, 20) })} className="text-lg h-12 mt-1" placeholder="Ex: 28°C" />
            </div>

            <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-3">
              <p className="text-sm font-medium text-foreground">Consumo real de MP desta batida</p>
              <div><Label className="text-base">Matéria-prima</Label><Input value={ordemBatidaDraft.materiaPrima} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, materiaPrima: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Opcional, para rastreabilidade real" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label className="text-base">Lote MP</Label><Input value={ordemBatidaDraft.loteMp} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, loteMp: e.target.value.slice(0, 60) })} className="text-lg h-12 mt-1" /></div>
                <div><Label className="text-base">Quantidade (kg)</Label><Input value={ordemBatidaDraft.quantidadeKg} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, quantidadeKg: e.target.value.slice(0, 20) })} className="text-lg h-12 mt-1" inputMode="decimal" /></div>
              </div>
              <div><Label className="text-base">Fornecedor</Label><Input value={ordemBatidaDraft.fornecedor} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, fornecedor: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" /></div>
            </div>

            <div>
              <Label className="text-base">Observações</Label>
              <Textarea value={ordemBatidaDraft.observacoes} onChange={(e) => setOrdemBatidaDraft({ ...ordemBatidaDraft, observacoes: e.target.value.slice(0, 500) })} className="text-base mt-1" rows={3} placeholder="Ex: peneira ok, limpeza entre lotes, variação de tempo..." />
            </div>

            <Button onClick={salvarOrdemBatida} disabled={saving || !ordemBatidaDraft.operador} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Salvar Batida" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "rastreabilidade") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={resetRastreabilidade} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Rastreabilidade rápida" subtitle="Vincule lote final com MP usada para consultas e recall." icon={GitBranch} />
            <div><Label className="text-base">Produto *</Label><Input value={rastreabilidadeDraft.produto} onChange={(e) => setRastreabilidadeDraft({ ...rastreabilidadeDraft, produto: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Produto acabado" /></div>
            <div><Label className="text-base">Lote do produto *</Label><Input value={rastreabilidadeDraft.loteProduto} onChange={(e) => setRastreabilidadeDraft({ ...rastreabilidadeDraft, loteProduto: e.target.value.slice(0, 60) })} className="text-lg h-12 mt-1" placeholder="Lote PA" /></div>
            <div><Label className="text-base">Matéria-prima *</Label><Input value={rastreabilidadeDraft.materiaPrima} onChange={(e) => setRastreabilidadeDraft({ ...rastreabilidadeDraft, materiaPrima: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Ingrediente crítico" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-base">Lote MP *</Label><Input value={rastreabilidadeDraft.loteMp} onChange={(e) => setRastreabilidadeDraft({ ...rastreabilidadeDraft, loteMp: e.target.value.slice(0, 60) })} className="text-lg h-12 mt-1" /></div>
              <div><Label className="text-base">Fornecedor</Label><Input value={rastreabilidadeDraft.fornecedor} onChange={(e) => setRastreabilidadeDraft({ ...rastreabilidadeDraft, fornecedor: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" /></div>
            </div>
            <Button onClick={salvarRastreabilidade} disabled={saving || !rastreabilidadeDraft.produto || !rastreabilidadeDraft.loteProduto || !rastreabilidadeDraft.materiaPrima || !rastreabilidadeDraft.loteMp} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Salvar vínculo" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "pre_operacao") {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={resetPreOperacao} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Checklist pré-operação" subtitle="Liberação rápida antes de iniciar a produção." icon={ListChecks} />

            <div className="grid grid-cols-3 gap-3 text-xs">
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-muted-foreground">Calibrações</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{calibracoesVencendo}</p>
                <p className="text-muted-foreground">vencendo</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-muted-foreground">Manutenções</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{manutencoesPendentes}</p>
                <p className="text-muted-foreground">pendentes</p>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-3">
                <p className="text-muted-foreground">Cronogramas</p>
                <p className="mt-1 text-lg font-semibold text-foreground">{cronogramasInativos}</p>
                <p className="text-muted-foreground">fora do ativo</p>
              </div>
            </div>

            <div><Label className="text-base">Área *</Label><Input value={preOperacaoDraft.area} onChange={(e) => setPreOperacaoDraft({ ...preOperacaoDraft, area: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" /></div>
            <div><Label className="text-base">Responsável *</Label><Input value={preOperacaoDraft.responsavel} onChange={(e) => setPreOperacaoDraft({ ...preOperacaoDraft, responsavel: e.target.value.slice(0, 120) })} className="text-lg h-12 mt-1" placeholder="Quem liberou a partida" /></div>

            <div className="space-y-3 rounded-lg border border-border bg-muted/30 p-3">
              <div className="flex items-center gap-3"><Checkbox checked={preOperacaoDraft.limpezaOk} onCheckedChange={(c) => setPreOperacaoDraft({ ...preOperacaoDraft, limpezaOk: !!c })} id="pre-limpeza" /><Label htmlFor="pre-limpeza" className="text-base font-medium cursor-pointer">Linha limpa e sem resíduos</Label></div>
              <div className="flex items-center gap-3"><Checkbox checked={preOperacaoDraft.balancaOk} onCheckedChange={(c) => setPreOperacaoDraft({ ...preOperacaoDraft, balancaOk: !!c })} id="pre-balanca" /><Label htmlFor="pre-balanca" className="text-base font-medium cursor-pointer">Balança e instrumentos liberados</Label></div>
              <div className="flex items-center gap-3"><Checkbox checked={preOperacaoDraft.epiOk} onCheckedChange={(c) => setPreOperacaoDraft({ ...preOperacaoDraft, epiOk: !!c })} id="pre-epi" /><Label htmlFor="pre-epi" className="text-base font-medium cursor-pointer">EPI obrigatório conferido</Label></div>
              <div className="flex items-center gap-3"><Checkbox checked={preOperacaoDraft.linhaLiberada} onCheckedChange={(c) => setPreOperacaoDraft({ ...preOperacaoDraft, linhaLiberada: !!c })} id="pre-linha" /><Label htmlFor="pre-linha" className="text-base font-medium cursor-pointer">Linha liberada para iniciar</Label></div>
            </div>

            <div><Label className="text-base">Observações</Label><Textarea value={preOperacaoDraft.observacoes} onChange={(e) => setPreOperacaoDraft({ ...preOperacaoDraft, observacoes: e.target.value.slice(0, 500) })} className="text-base mt-1" rows={3} placeholder="Ex: aferição da balança 0,0 kg, área liberada pelo líder..." /></div>

            <Button onClick={salvarPreOperacao} disabled={saving || !preOperacaoDraft.responsavel} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Salvar checklist" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (tela === "pragas") {
    const ToggleTipo = ({ k, label }: { k: keyof PragaDraft["tipos"]; label: string }) => (
      <button
        type="button"
        onClick={() => setPragaDraft({ ...pragaDraft, tipos: { ...pragaDraft.tipos, [k]: !pragaDraft.tipos[k] } })}
        className={`flex items-center justify-between gap-2 p-4 rounded-xl border-2 text-left transition-all active:scale-95 min-h-[64px] ${
          pragaDraft.tipos[k] ? "border-primary bg-muted" : "border-border bg-card"
        }`}
      >
        <span className="text-base font-medium">{label}</span>
        <span className={`text-sm font-bold px-2 py-1 rounded ${pragaDraft.tipos[k] ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
          {pragaDraft.tipos[k] ? "PRESENÇA" : "Sem evidência"}
        </span>
      </button>
    );
    return (
      <div className="max-w-lg mx-auto p-4">
        <Voltar onClearDraft={() => { setPragaDraft(INITIAL_PRAGA); clearPragaDraft(); }} />
        <StatusBanner />
        <Card>
          <CardContent className="pt-6 space-y-4">
            <CardHeader title="Observação de Pragas" subtitle="Registro imediato de evidências no chão de fábrica." icon={Bug} />
            <p className="text-xs text-muted-foreground">POP 7.3 — Toque nos itens onde houver evidência (visual, fezes, ninhos, dejetos, vestígios).</p>
            <div>
              <Label className="text-base">Local / Área *</Label>
              <Input value={pragaDraft.local} onChange={e => setPragaDraft({ ...pragaDraft, local: e.target.value })} className="text-lg h-12 mt-1" placeholder="Ex: Depósito MP, Silo 2, Mistura..." />
            </div>
            <div className="grid grid-cols-1 gap-2">
              <ToggleTipo k="roedores" label="🐀 Roedores" />
              <ToggleTipo k="aves" label="🐦 Aves / Pássaros" />
              <ToggleTipo k="voadores" label="🦟 Insetos voadores" />
              <ToggleTipo k="rasteiros" label="🪳 Insetos rasteiros" />
              <ToggleTipo k="outros" label="❓ Outros vestígios" />
            </div>
            <div>
              <Label className="text-base">Ação imediata</Label>
              <Input value={pragaDraft.acao} onChange={e => setPragaDraft({ ...pragaDraft, acao: e.target.value })} className="text-lg h-12 mt-1" placeholder="Ex: Limpeza, isca reposta, vedação..." />
            </div>
            <div>
              <Label className="text-base">Responsável *</Label>
              <Input value={pragaDraft.responsavel} onChange={e => setPragaDraft({ ...pragaDraft, responsavel: e.target.value })} className="text-lg h-12 mt-1" placeholder="Seu nome" />
            </div>
            <Button onClick={salvarPraga} disabled={saving || !pragaDraft.local || !pragaDraft.responsavel} className="w-full h-14 text-lg" size="lg">
              <CheckCircle2 className="w-5 h-5 mr-2" /> {saving ? "Salvando..." : isOnline ? "Salvar Observação" : "Salvar na fila"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return null;
}
