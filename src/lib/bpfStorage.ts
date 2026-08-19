// ============================================================================
// Storage hierárquico dos documentos BPF
//
// Path de gravação (novo):
//   bpf/{empresa_id}/{POP}/{IT}/{frequencia}/{timestamp}_{nome_padronizado}.{ext}
//
// A profundidade do path é CONSTANTE: quando um metadado não vem preenchido,
// o nível é ocupado por um segmento de fallback (_sem-pop, _sem-it,
// _sem-frequencia). Isso mantém a árvore navegável e previsível.
//
// Leitura: convive com as convenções antigas. Nada do que já está no Storage
// é movido, renomeado ou excluído — a resolução tenta os buckets conhecidos
// em ordem até achar o objeto.
// ============================================================================

import { supabase } from "@/integrations/supabase/client";

/**
 * Valores aceitos pelo CHECK de `arquivos_bpf.frequencia` / `modelos_bpf.frequencia`.
 *
 * MAIÚSCULO, e isso não é estilo: é o que o CHECK do banco exige.
 * Verificado direto em `pg_constraint` no projeto de produção:
 *   CHECK (frequencia IS NULL OR frequencia = ANY (ARRAY['DIARIA', ...]))
 * Gravar minúsculo faz o insert ser rejeitado pela constraint.
 * Nos paths do Storage o valor sai minúsculo — `normalizarSegmento` cuida
 * disso, e path é caso à parte do valor gravado na coluna.
 */
export const FREQUENCIAS = [
  "DIARIA",
  "SEMANAL",
  "QUINZENAL",
  "MENSAL",
  "TRIMESTRAL",
  "SEMESTRAL",
  "ANUAL",
  "EVENTUAL",
] as const;

export type Frequencia = (typeof FREQUENCIAS)[number];

export const FREQUENCIA_LABEL: Record<Frequencia, string> = {
  DIARIA: "Diária",
  SEMANAL: "Semanal",
  QUINZENAL: "Quinzenal",
  MENSAL: "Mensal",
  TRIMESTRAL: "Trimestral",
  SEMESTRAL: "Semestral",
  ANUAL: "Anual",
  EVENTUAL: "Eventual",
};

export function isFrequencia(valor: unknown): valor is Frequencia {
  return typeof valor === "string" && (FREQUENCIAS as readonly string[]).includes(valor);
}

/**
 * Deduz a frequência canônica a partir do texto livre usado em
 * `INSTRUCOES_TRABALHO.frequencia` ("Semanal (armadilhas internas) / Quinzenal
 * (perímetro externo)", "A cada recebimento", ...).
 *
 * A ordem de teste importa: quando o texto cita duas periodicidades, vence a
 * mais frequente — é ela que define o ritmo mínimo de preenchimento do
 * registro, e subestimar a periodicidade é o erro que gera não conformidade.
 * Texto que não casa com nada vira `eventual`, nunca null: a coluna é opcional,
 * mas quando o importador escolhe um valor ele precisa ser um valor do CHECK.
 */
export function inferirFrequencia(textoLivre?: string | null): Frequencia {
  const t = (textoLivre || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  if (!t) return "EVENTUAL";

  // "a cada X" descreve evento, não calendário — resolve antes das palavras-chave.
  if (/\ba cada (novo|lote|entrada|recebimento|ocorrencia|troca)/.test(t)) return "EVENTUAL";

  if (/\bdiari|\bturno\b/.test(t)) return "DIARIA";
  if (/\bsemanal/.test(t)) return "SEMANAL";
  if (/\bquinzenal/.test(t)) return "QUINZENAL";
  if (/\bmensal/.test(t)) return "MENSAL";
  if (/\btrimestral/.test(t)) return "TRIMESTRAL";
  if (/\bsemestral/.test(t)) return "SEMESTRAL";
  if (/\banual/.test(t)) return "ANUAL";

  return "EVENTUAL";
}

/**
 * Buckets conhecidos, na ordem em que a leitura deve tentá-los.
 *
 * `documentos_bpf` (underline) é bucket distinto de `documentos-bpf` (hífen) —
 * órfão, com um único objeto. Fica na lista só para leitura.
 * `relatorios` entrou porque `src/pages/Relatorios.tsx` grava nele; sem isso um
 * relatório antigo não abriria pelo resolvedor.
 */
export const BUCKETS_CONHECIDOS = [
  "documentos-bpf",
  "feed-bpf",
  "normas_legislacao",
  "relatorios",
  "documentos_bpf",
] as const;

export type BucketConhecido = (typeof BUCKETS_CONHECIDOS)[number];

/** Bucket padrão para uploads novos. */
export const BUCKET_PADRAO: BucketConhecido = "documentos-bpf";

/** Segmentos usados quando o metadado não foi informado. */
export const SEGMENTO_SEM_POP = "_sem-pop";
export const SEGMENTO_SEM_IT = "_sem-it";
export const SEGMENTO_SEM_FREQUENCIA = "_sem-frequencia";

const MAX_SEGMENTO = 60;

/**
 * Normaliza um segmento de path: sem acentos, sem separador exótico, minúsculo.
 * Acento em path quebra URL assinada em alguns clientes (e no preview do
 * navegador embutido de alguns leitores de PDF), por isso a normalização é
 * aplicada antes de qualquer gravação.
 */
export function normalizarSegmento(valor?: string | null): string {
  return (valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase()
    .slice(0, MAX_SEGMENTO);
}

/** Extensão segura a partir do nome original. Preserva pontos internos do nome. */
export function extensaoDe(nomeArquivo: string): string {
  if (!nomeArquivo.includes(".")) return "bin";
  const ext = nomeArquivo.split(".").pop()!.toLowerCase().replace(/[^a-z0-9]/g, "");
  return ext || "bin";
}

export interface MetadadosBpf {
  /** Escopo do documento: empresa quando houver, senão o próprio usuário. */
  empresaId: string;
  popCodigo?: string | null;
  itCodigo?: string | null;
  frequencia?: Frequencia | string | null;
  /** ISO (`2026-08-19`) ou Date. Entra no nome padronizado, não no path. */
  dataRef?: string | Date | null;
}

/**
 * Nome padronizado do arquivo (sem extensão), no formato
 * `{POP}_{IT}_{frequencia}_{data_ref}`. Partes ausentes são simplesmente
 * omitidas — o nome encurta, não ganha placeholder.
 */
export function nomePadronizadoBpf(meta: MetadadosBpf): string {
  const partes = [
    normalizarSegmento(meta.popCodigo),
    normalizarSegmento(meta.itCodigo),
    normalizarSegmento(typeof meta.frequencia === "string" ? meta.frequencia : null),
    formatarDataRef(meta.dataRef),
  ].filter(Boolean);

  return partes.length > 0 ? partes.join("_") : "documento";
}

function formatarDataRef(data?: string | Date | null): string {
  if (!data) return "";
  const d = typeof data === "string" ? new Date(`${data.slice(0, 10)}T00:00:00`) : data;
  if (Number.isNaN(d.getTime())) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}-${mm}-${d.getFullYear()}`;
}

/**
 * Monta o path hierárquico de gravação.
 *
 * O prefixo de timestamp é obrigatório: sem ele, dois envios do mesmo
 * POP/IT/frequência na mesma data colidem e o segundo sobrescreve o primeiro
 * em silêncio.
 */
export function montarPathBpf(
  meta: MetadadosBpf,
  nomeArquivoOriginal: string,
  timestamp: number = Date.now(),
): string {
  const empresa = normalizarSegmento(meta.empresaId) || "sem-empresa";
  const pop = normalizarSegmento(meta.popCodigo) || SEGMENTO_SEM_POP;
  const it = normalizarSegmento(meta.itCodigo) || SEGMENTO_SEM_IT;
  const freq =
    normalizarSegmento(typeof meta.frequencia === "string" ? meta.frequencia : null) ||
    SEGMENTO_SEM_FREQUENCIA;

  const base = nomePadronizadoBpf(meta);
  const ext = extensaoDe(nomeArquivoOriginal);

  return `bpf/${empresa}/${pop}/${it}/${freq}/${timestamp}_${base}.${ext}`;
}

// ---------------------------------------------------------------------------
// Leitura — resolução de URL com fallback entre buckets
// ---------------------------------------------------------------------------

/**
 * Remove o nome do bucket quando ele veio embutido no início do path
 * (`documentos-bpf/user/arquivo.pdf` → `user/arquivo.pdf`).
 */
export function removerPrefixoDeBucket(path: string): { path: string; bucket?: BucketConhecido } {
  for (const bucket of BUCKETS_CONHECIDOS) {
    if (path.startsWith(`${bucket}/`)) {
      return { path: path.slice(bucket.length + 1), bucket };
    }
  }
  return { path };
}

/**
 * Extrai bucket + path de uma URL absoluta do Storage, nos dois formatos que
 * aparecem na tabela: `/object/public/{bucket}/{path}` e `/object/sign/{bucket}/{path}`.
 * Devolve null quando a URL não é reconhecível (link externo, por exemplo).
 */
export function extrairDeUrlAbsoluta(
  url: string,
): { bucket: string; path: string } | null {
  const m = /\/storage\/v1\/object\/(?:public|sign|authenticated)\/([^/]+)\/(.+?)(?:\?|$)/.exec(url);
  if (!m) return null;
  try {
    return { bucket: m[1], path: decodeURIComponent(m[2]) };
  } catch {
    return { bucket: m[1], path: m[2] };
  }
}

export interface ResolucaoUrl {
  url: string | null;
  bucket?: string;
  /** true quando devolvemos a URL original sem conseguir assinar. */
  bruta?: boolean;
}

/**
 * Resolve uma URL abrível a partir do que estiver gravado em
 * `arquivos_bpf.arquivo_url` (ou `arquivo_path`).
 *
 * Requisito crítico: documento antigo, gravado em QUALQUER uma das convenções
 * de path já existentes, tem que continuar abrindo. Por isso a função:
 *   1. aceita URL absoluta e path relativo;
 *   2. tira o nome do bucket embutido no começo do path, se houver;
 *   3. tenta todos os buckets conhecidos, em ordem;
 *   4. em último caso devolve a URL absoluta original, que é como o sistema
 *      funciona hoje — nunca fica pior do que estava.
 */
export async function resolverUrlArquivo(
  arquivoUrl?: string | null,
  expiraEmSegundos = 300,
): Promise<ResolucaoUrl> {
  const valor = (arquivoUrl || "").trim();
  if (!valor) return { url: null };

  const absoluta = /^https?:\/\//i.test(valor);

  if (absoluta) {
    const extraido = extrairDeUrlAbsoluta(valor);
    if (!extraido) {
      // Link externo ou formato desconhecido: devolve como está.
      return { url: valor, bruta: true };
    }
    const assinada = await assinar(extraido.bucket, extraido.path, expiraEmSegundos);
    if (assinada) return { url: assinada, bucket: extraido.bucket };
    // Bucket público ou assinatura negada: a URL original já abre hoje.
    return { url: valor, bucket: extraido.bucket, bruta: true };
  }

  const { path, bucket: bucketEmbutido } = removerPrefixoDeBucket(valor);

  const ordem: string[] = bucketEmbutido
    ? [bucketEmbutido, ...BUCKETS_CONHECIDOS.filter((b) => b !== bucketEmbutido)]
    : [...BUCKETS_CONHECIDOS];

  for (const bucket of ordem) {
    const assinada = await assinar(bucket, path, expiraEmSegundos);
    if (assinada) return { url: assinada, bucket };
  }

  return { url: null };
}

async function assinar(
  bucket: string,
  path: string,
  expiraEmSegundos: number,
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiraEmSegundos);
    if (error || !data?.signedUrl) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Upload com rollback
// ---------------------------------------------------------------------------

export interface UploadBpfParams {
  file: File;
  meta: MetadadosBpf;
  /** Colunas extras de `arquivos_bpf` (titulo, categoria, user_id, ...). */
  registro: Record<string, unknown>;
  bucket?: BucketConhecido;
}

export interface UploadBpfResultado {
  ok: boolean;
  path?: string;
  bucket?: string;
  erro?: string;
  /** true quando o objeto subiu mas o insert falhou e o objeto foi removido. */
  revertido?: boolean;
}

/**
 * Sobe o arquivo e grava a linha em `arquivos_bpf` na sequência.
 *
 * Se o insert falhar depois do objeto já ter subido, o objeto é removido do
 * bucket. Sem isso, cada erro de gravação deixa um arquivo órfão no Storage,
 * que ninguém referencia e ninguém limpa.
 */
export async function uploadArquivoBpf({
  file,
  meta,
  registro,
  bucket = BUCKET_PADRAO,
}: UploadBpfParams): Promise<UploadBpfResultado> {
  const path = montarPathBpf(meta, file.name);

  const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, {
    upsert: false,
  });
  if (upErr) {
    return { ok: false, erro: upErr.message };
  }

  const frequencia = isFrequencia(meta.frequencia) ? meta.frequencia : null;

  const linha = {
    ...registro,
    pop_codigo: meta.popCodigo || null,
    it_codigo: meta.itCodigo || null,
    frequencia,
    arquivo_url: path,
    arquivo_nome: registro.arquivo_nome ?? `${nomePadronizadoBpf(meta)}.${extensaoDe(file.name)}`,
    nome_padronizado: registro.nome_padronizado ?? nomePadronizadoBpf(meta),
  };

  // `as any`: os tipos gerados em src/integrations/supabase/types.ts ainda não
  // incluem it_codigo/frequencia — as colunas já existem no banco.
  const { error: insErr } = await (supabase.from("arquivos_bpf") as any).insert(linha);

  if (insErr) {
    await supabase.storage
      .from(bucket)
      .remove([path])
      .catch(() => {
        /* rollback best-effort: o erro do insert é o que importa reportar */
      });
    return { ok: false, erro: insErr.message, revertido: true };
  }

  return { ok: true, path, bucket };
}

// ---------------------------------------------------------------------------
// Agrupamento POP → IT → frequência
// ---------------------------------------------------------------------------

export interface LinhaClassificavel {
  pop_codigo?: string | null;
  it_codigo?: string | null;
  frequencia?: string | null;
  [k: string]: unknown;
}

export interface NoFrequencia<T> {
  frequencia: string;
  label: string;
  itens: T[];
}

export interface NoIt<T> {
  itCodigo: string;
  frequencias: NoFrequencia<T>[];
  total: number;
}

export interface NoPop<T> {
  popCodigo: string;
  its: NoIt<T>[];
  total: number;
}

/**
 * Monta a árvore POP → IT → frequência a partir das linhas da tabela.
 * Não consulta o Storage: o Storage é consequência da tabela, não fonte.
 */
export function agruparPorPopItFrequencia<T extends LinhaClassificavel>(
  linhas: T[],
): NoPop<T>[] {
  const arvore = new Map<string, Map<string, Map<string, T[]>>>();

  for (const linha of linhas) {
    const pop = linha.pop_codigo || SEGMENTO_SEM_POP;
    const it = linha.it_codigo || SEGMENTO_SEM_IT;
    const freq = linha.frequencia || SEGMENTO_SEM_FREQUENCIA;

    if (!arvore.has(pop)) arvore.set(pop, new Map());
    const porIt = arvore.get(pop)!;
    if (!porIt.has(it)) porIt.set(it, new Map());
    const porFreq = porIt.get(it)!;
    if (!porFreq.has(freq)) porFreq.set(freq, []);
    porFreq.get(freq)!.push(linha);
  }

  const ordenar = (a: string, b: string) => {
    // Segmentos de fallback vão para o fim da lista.
    const aFallback = a.startsWith("_sem-");
    const bFallback = b.startsWith("_sem-");
    if (aFallback !== bFallback) return aFallback ? 1 : -1;
    return a.localeCompare(b, "pt-BR");
  };

  return [...arvore.entries()]
    .sort(([a], [b]) => ordenar(a, b))
    .map(([popCodigo, porIt]) => {
      const its = [...porIt.entries()]
        .sort(([a], [b]) => ordenar(a, b))
        .map(([itCodigo, porFreq]) => {
          const frequencias = [...porFreq.entries()]
            .sort(([a], [b]) => ordenar(a, b))
            .map(([frequencia, itens]) => ({
              frequencia,
              label: isFrequencia(frequencia) ? FREQUENCIA_LABEL[frequencia] : "Sem periodicidade",
              itens,
            }));
          return {
            itCodigo,
            frequencias,
            total: frequencias.reduce((acc, f) => acc + f.itens.length, 0),
          };
        });

      return {
        popCodigo,
        its,
        total: its.reduce((acc, i) => acc + i.total, 0),
      };
    });
}
