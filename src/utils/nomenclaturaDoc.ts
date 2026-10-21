// ============================================================================
// Padronização de nomenclatura de documentos BPF
// Formato salvo (storage / DB): POP-01_PL-001_08-07-2026
// Formato exibido (UI):         POP 01 · PL 001 · 08/07/2026
// ============================================================================

export const TIPOS_DOC = [
  { value: "PL", label: "PL — Planilha" },
  { value: "IT", label: "IT — Instrução de Trabalho" },
  { value: "RG", label: "RG — Registro" },
  { value: "FR", label: "FR — Formulário" },
  { value: "MN", label: "MN — Manual" },
] as const;

export const FREQUENCIAS_DOC = [
  { value: "DIARIA", label: "Diária" },
  { value: "SEMANAL", label: "Semanal" },
  { value: "QUINZENAL", label: "Quinzenal" },
  { value: "MENSAL", label: "Mensal" },
  { value: "TRIMESTRAL", label: "Trimestral" },
  { value: "SEMESTRAL", label: "Semestral" },
  { value: "ANUAL", label: "Anual" },
  { value: "EVENTUAL", label: "Eventual/Outros" },
] as const;

export type FrequenciaDoc = typeof FREQUENCIAS_DOC[number]["value"];

export type TipoDoc = typeof TIPOS_DOC[number]["value"];

/** Extrai o número do POP a partir de "POP-01" → "01" */
export function popShort(popCodigo: string): string {
  const m = /(\d+)/.exec(popCodigo || "");
  return m ? m[1].padStart(2, "0") : "00";
}

/** "001", "002" ... */
export function formatNumero(n: number | string | null | undefined): string {
  const num = typeof n === "number" ? n : parseInt(String(n || "0"), 10) || 0;
  return String(num).padStart(3, "0");
}

/** "2026-07-08" ou Date → "08-07-2026" (para storage) */
export function formatDataStorage(data: string | Date): string {
  const d = typeof data === "string" ? new Date(data + "T00:00:00") : data;
  if (isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

/** "2026-07-08" ou Date → "08/07/2026" (para exibição) */
export function formatDataDisplay(data: string | Date): string {
  return formatDataStorage(data).replace(/-/g, "/");
}

/** Normaliza prefixo customizado do cliente: "FBX" ou "" */
export function normalizarPrefixo(prefixo?: string | null): string {
  return (prefixo || "").toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8);
}

/**
 * Nome padronizado seguro para storage / DB:
 *   [PREFIXO_]POP-01_PL-001_08-07-2026
 */
export function nomePadronizado(
  popCodigo: string,
  tipo: TipoDoc | string,
  numero: number | string,
  data: string | Date,
  prefixo?: string | null
): string {
  const pref = normalizarPrefixo(prefixo);
  const base = `POP-${popShort(popCodigo)}_${tipo}-${formatNumero(numero)}_${formatDataStorage(data)}`;
  return pref ? `${pref}_${base}` : base;
}

/**
 * Nome bonito para exibição na UI:
 *   [PREFIXO ·] POP 01 · PL 001 · 08/07/2026
 */
export function nomeDisplay(
  popCodigo: string,
  tipo: TipoDoc | string,
  numero: number | string,
  data: string | Date,
  prefixo?: string | null
): string {
  const pref = normalizarPrefixo(prefixo);
  const base = `POP ${popShort(popCodigo)} · ${tipo} ${formatNumero(numero)} · ${formatDataDisplay(data)}`;
  return pref ? `${pref} · ${base}` : base;
}

/**
 * Caminho de storage padronizado:
 *   {scopeId}/POP-01/IT-01-01/MENSAL/v1/POP-01_PL-001_08-07-2026.pdf
 */
export function storagePath(
  scopeId: string,
  popCodigo: string,
  tipo: TipoDoc | string,
  numero: number | string,
  data: string | Date,
  originalFileName: string,
  prefixo?: string | null,
  itCodigo?: string | null,
  frequencia?: string | null,
  versao?: number | string
): string {
  const ext = originalFileName.includes(".")
    ? originalFileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";
  const base = nomePadronizado(popCodigo, tipo, numero, data, prefixo);
  
  const popDir = `POP-${popShort(popCodigo)}`;
  const itDir = itCodigo ? itCodigo.replace(/[^A-Z0-9-]/gi, "") : tipo;
  const freqDir = frequencia ? frequencia.toUpperCase() : "GERAL";
  const vDir = versao ? `v${versao}` : "v1";

  return `bpf/${scopeId}/${popDir}/${itDir}/${freqDir}/${vDir}/${base}.${ext}`;
}

/** Extrai a extensão preservando pontos internos do nome original */
export function nomeArquivoFinal(
  popCodigo: string,
  tipo: TipoDoc | string,
  numero: number | string,
  data: string | Date,
  originalFileName: string,
  prefixo?: string | null
): string {
  const ext = originalFileName.includes(".")
    ? originalFileName.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "")
    : "bin";
  return `${nomePadronizado(popCodigo, tipo, numero, data, prefixo)}.${ext}`;
}
