import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Extensões de arquivos de arte gráfica: não abrem no Word/Excel.
 * O Windows costuma sugerir o Word por engano, exibindo símbolos ilegíveis.
 */
const EXTENSOES_ARTE = ["cdr", "ai", "psd", "eps", "indd", "svg", "dwg"] as const;

const PROGRAMA_POR_EXTENSAO: Record<string, string> = {
  cdr: "CorelDRAW",
  ai: "Adobe Illustrator",
  eps: "Illustrator ou CorelDRAW",
  psd: "Adobe Photoshop",
  indd: "Adobe InDesign",
  svg: "navegador, Illustrator ou Inkscape",
  dwg: "AutoCAD",
};

/** Tipos MIME por extensão, para o navegador entregar o arquivo corretamente. */
const MIME_POR_EXTENSAO: Record<string, string> = {
  cdr: "application/vnd.corel-draw",
  ai: "application/postscript",
  eps: "application/postscript",
  psd: "image/vnd.adobe.photoshop",
  svg: "image/svg+xml",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ppt: "application/vnd.ms-powerpoint",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  csv: "text/csv",
  txt: "text/plain",
  zip: "application/zip",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function extensaoDe(nomeOuPath: string | null | undefined): string {
  if (!nomeOuPath) return "";
  const limpo = nomeOuPath.split("?")[0].split("#")[0];
  const partes = limpo.split(".");
  if (partes.length < 2) return "";
  return partes.pop()!.toLowerCase();
}

export function isArquivoArte(nomeOuPath: string | null | undefined): boolean {
  return (EXTENSOES_ARTE as readonly string[]).includes(extensaoDe(nomeOuPath));
}

export function programaRecomendado(nomeOuPath: string | null | undefined): string | null {
  const ext = extensaoDe(nomeOuPath);
  return PROGRAMA_POR_EXTENSAO[ext] || null;
}

export function mimeDe(nomeOuPath: string | null | undefined): string {
  return MIME_POR_EXTENSAO[extensaoDe(nomeOuPath)] || "application/octet-stream";
}

/**
 * Garante que o nome do arquivo baixado mantenha a extensão original
 * (caso o título cadastrado esteja sem extensão).
 */
export function nomeComExtensao(nomeDesejado: string, path: string): string {
  const extPath = extensaoDe(path);
  if (!extPath) return nomeDesejado;
  if (extensaoDe(nomeDesejado) === extPath) return nomeDesejado;
  return `${nomeDesejado}.${extPath}`;
}

interface BaixarOpcoes {
  /** Buckets alternativos tentados em ordem caso o primeiro falhe. */
  bucketsAlternativos?: string[];
  /** Silencia o aviso sobre arquivos de arte. */
  semAviso?: boolean;
}

/**
 * Baixa um arquivo do storage forçando nome e extensão corretos.
 * Para arquivos de arte, avisa qual programa deve abrir o arquivo.
 */
export async function baixarArquivoStorage(
  bucket: string,
  path: string,
  nomeArquivo?: string | null,
  opcoes: BaixarOpcoes = {},
): Promise<boolean> {
  if (!path) {
    toast.error("Arquivo não encontrado");
    return false;
  }

  const nomeFinal = nomeComExtensao(nomeArquivo?.trim() || path.split("/").pop() || "arquivo", path);
  const buckets = [bucket, ...(opcoes.bucketsAlternativos || [])];

  for (const b of buckets) {
    const { data, error } = await supabase.storage
      .from(b)
      .createSignedUrl(path, 300, { download: nomeFinal });

    if (error || !data?.signedUrl) continue;

    const link = document.createElement("a");
    link.href = data.signedUrl;
    link.download = nomeFinal;
    link.rel = "noopener";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (!opcoes.semAviso && isArquivoArte(nomeFinal)) {
      toast.info(
        `Arquivo de arte (.${extensaoDe(nomeFinal)}) — abra no ${programaRecomendado(nomeFinal)}. Não abre no Word.`,
        { duration: 8000 },
      );
    }
    return true;
  }

  toast.error("Erro ao gerar link de download");
  return false;
}
