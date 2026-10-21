import { getBaseLegal } from "@/config/baseLegal";
/**
 * Selo de integridade de relatórios — baseLegal: autocontrole, §3º do artigo de registros.
 * Gera hash SHA-256 para verificação de integridade dos documentos exportados.
 */

export async function gerarHashIntegridade(conteudo: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(conteudo);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function gerarBlocoIntegridade(hash: string, nomeArquivo: string, usuario: string) {
  const agora = new Date();
  return {
    hash_sha256: hash,
    arquivo: nomeArquivo,
    gerado_por: usuario,
    data_geracao: agora.toISOString(),
    timestamp_unix: Math.floor(agora.getTime() / 1000),
    referencia_legal: `${getBaseLegal("autocontrole").norma} (${getBaseLegal("autocontrole").artigo}, §3º)`,
    selo: `INTEGRIDADE: ${hash.substring(0, 16).toUpperCase()}`,
  };
}

/**
 * Adiciona rodapé de integridade a conteúdo CSV/texto exportado.
 */
export function adicionarRodapeIntegridade(
  conteudo: string,
  hash: string,
  usuario: string,
  nomeArquivo: string
): string {
  const bloco = gerarBlocoIntegridade(hash, nomeArquivo, usuario);
  const rodape = [
    "",
    "═══════════════════════════════════════════════════════",
    `SELO DE INTEGRIDADE — ${getBaseLegal("autocontrole").norma} (${getBaseLegal("autocontrole").artigo}, §3º)`,
    `Hash SHA-256: ${bloco.hash_sha256}`,
    `Arquivo: ${bloco.arquivo}`,
    `Gerado por: ${bloco.gerado_por}`,
    `Data/Hora: ${bloco.data_geracao}`,
    `Timestamp UNIX: ${bloco.timestamp_unix}`,
    `Referência Legal: ${bloco.referencia_legal}`,
    "═══════════════════════════════════════════════════════",
  ].join("\n");
  return conteudo + "\n" + rodape;
}
