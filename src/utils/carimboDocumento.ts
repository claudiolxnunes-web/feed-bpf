import { getBaseLegal } from "@/config/baseLegal";
/**
 * Selo de integridade para documentos — baseLegal: autocontrole, §3º do artigo de registros.
 *
 * Padroniza data/hora de emissão, usuário responsável, identificação do documento
 * e selo SHA-256 do conteúdo completo em TODOS os documentos (impressos e digitais) gerados
 * pelo sistema, sem representar assinatura com certificado ICP-Brasil.
 */

import { gerarHashIntegridade } from "@/utils/integridade";
import { toast } from "sonner";

export interface CarimboInfo {
  documentoTipo: string;        // Ex: "Ficha de Produção", "Ficha Técnica"
  documentoId?: string;         // Nº OP, lote, código do POP etc.
  empresa?: string;             // Razão social
  usuario?: string;             // E-mail / nome do usuário logado
  dataHoraISO: string;          // ISO 8601
  dataHoraBR: string;           // dd/mm/aaaa hh:mm:ss
  /** SHA-256 completo (64 hex) do conteúdo + metadados; null quando o selo não pôde ser emitido. */
  hashCompleto: string | null;
  /** 16 primeiros caracteres do hash, em maiúsculas, exibidos no rodapé; "" sem selo. */
  hashCurto: string;
  selo: string;                 // String formatada para exibição
}

export interface CarimboParams {
  documentoTipo: string;
  documentoId?: string;
  empresa?: string;
  usuario?: string;
  /** Conteúdo completo exibido no documento (HTML/texto/JSON), sem o próprio selo. */
  conteudo: string;
}

export const SELO_INDISPONIVEL = "SELO DE INTEGRIDADE NÃO EMITIDO (navegador sem suporte a SHA-256)";

/** Texto canônico hasheado: metadados + conteúdo completo. */
export function montarBaseCarimbo(p: Omit<CarimboParams, "conteudo">, dataHoraISO: string, conteudo: string): string {
  return [
    `tipo=${p.documentoTipo}`,
    `id=${p.documentoId ?? ""}`,
    `empresa=${p.empresa ?? ""}`,
    `usuario=${p.usuario ?? ""}`,
    `emitido=${dataHoraISO}`,
    "conteudo:",
    conteudo,
  ].join("\n");
}

const temSubtle = (): boolean => typeof crypto !== "undefined" && !!crypto.subtle;

/**
 * Gera o selo com SHA-256 (mesmo padrão de utils/integridade.ts) sobre conteúdo + metadados.
 * Sem crypto.subtle (ou em erro), não emite selo: avisa o usuário e devolve hashCompleto = null.
 */
export async function gerarCarimbo(params: CarimboParams): Promise<CarimboInfo> {
  const agora = new Date();
  const dataHoraISO = agora.toISOString();
  const dataHoraBR = agora.toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
  const { conteudo, ...meta } = params;
  let hashCompleto: string | null = null;
  if (temSubtle()) {
    try {
      hashCompleto = await gerarHashIntegridade(montarBaseCarimbo(meta, dataHoraISO, conteudo));
    } catch {
      hashCompleto = null;
    }
  }
  if (!hashCompleto) {
    toast.warning("Selo de integridade não emitido: este navegador não suporta SHA-256. O documento sai sem selo.");
  }
  const hashCurto = hashCompleto ? hashCompleto.slice(0, 16).toUpperCase() : "";
  return {
    ...meta,
    dataHoraISO,
    dataHoraBR,
    hashCompleto,
    hashCurto,
    selo: hashCompleto ? `INTEGRIDADE: ${hashCurto}` : SELO_INDISPONIVEL,
  };
}

/** Marcador onde o rodapé do selo será inserido num documento HTML. */
export const CARIMBO_PLACEHOLDER = "<!--__CARIMBO_INTEGRIDADE__-->";

/**
 * Calcula o selo sobre o HTML do documento (sem o selo) e substitui o marcador pelo rodapé.
 * O conteúdo hasheado é exatamente o HTML exibido, com o marcador removido.
 */
export async function inserirCarimbo(
  html: string,
  params: Omit<CarimboParams, "conteudo">,
  formato: "completo" | "compacto" = "completo",
): Promise<{ html: string; carimbo: CarimboInfo }> {
  const conteudo = html.split(CARIMBO_PLACEHOLDER).join("");
  const carimbo = await gerarCarimbo({ ...params, conteudo });
  const bloco = formato === "compacto" ? carimboHTMLCompacto(carimbo) : carimboHTML(carimbo);
  return { html: html.split(CARIMBO_PLACEHOLDER).join(bloco), carimbo };
}

/**
 * Bloco HTML pronto para colar em qualquer PDF/impressão.
 * Aparece como rodapé discreto, mas auditável.
 */
/** Escapa HTML para evitar XSS em campos controlados pelo usuário */
function esc(s: string | undefined | null): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function carimboHTML(info: CarimboInfo): string {
  return `
<div data-sha256="${esc(info.hashCompleto ?? "")}" data-emitido="${esc(info.dataHoraISO)}" style="margin-top:14px;padding:8px 10px;border-top:2px solid #1a1a2e;font-family:Arial,sans-serif;font-size:9px;color:#444;background:#fafafa;">
  <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px;">
    <div>
      <strong>${esc(info.documentoTipo)}</strong>${info.documentoId ? ` — ${esc(info.documentoId)}` : ""}
      ${info.empresa ? `<br/>Empresa: ${esc(info.empresa)}` : ""}
    </div>
    <div style="text-align:right;">
      Emitido em: <strong>${esc(info.dataHoraBR)}</strong><br/>
      ${info.usuario ? `Por: ${esc(info.usuario)}<br/>` : ""}
      <span style="font-family:monospace;color:#1a1a2e;">${esc(info.selo)}</span>
    </div>
  </div>
  <div style="margin-top:4px;font-size:8px;color:#888;">
    Registro com identificação do responsável, data e hora; selo de integridade — ${getBaseLegal("autocontrole").norma} (${getBaseLegal("autocontrole").artigo}, §3º).
  </div>
</div>`;
}

/** Versão monocromática mais compacta para fichas operacionais */
export function carimboHTMLCompacto(info: CarimboInfo): string {
  return `
<div data-sha256="${esc(info.hashCompleto ?? "")}" data-emitido="${esc(info.dataHoraISO)}" style="margin-top:10px;padding:4px 6px;border-top:1px solid #000;font-family:Arial,sans-serif;font-size:9px;color:#222;display:flex;justify-content:space-between;">
  <span>${esc(info.documentoTipo)}${info.documentoId ? ` — ${esc(info.documentoId)}` : ""}${info.empresa ? ` | ${esc(info.empresa)}` : ""}</span>
  <span>Emitido: <strong>${esc(info.dataHoraBR)}</strong>${info.usuario ? ` | ${esc(info.usuario)}` : ""} | <span style="font-family:monospace;">${esc(info.selo)}</span></span>
</div>`;
}

/** Versão texto puro (CSV, TXT) */
export function carimboTexto(info: CarimboInfo): string {
  return [
    "",
    "─────────────────────────────────────────────",
    `${info.documentoTipo}${info.documentoId ? ` — ${info.documentoId}` : ""}`,
    info.empresa ? `Empresa: ${info.empresa}` : "",
    `Emitido em: ${info.dataHoraBR}`,
    info.usuario ? `Por: ${info.usuario}` : "",
    info.selo,
    info.hashCompleto ? `SHA-256: ${info.hashCompleto}` : "",
    `Registro com identificação do responsável, data e hora; selo de integridade — ${getBaseLegal("autocontrole").norma} (${getBaseLegal("autocontrole").artigo}, §3º).`,
    "─────────────────────────────────────────────",
  ].filter(Boolean).join("\n");
}
