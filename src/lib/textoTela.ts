/** Apresentação apenas: não aplicar a dados salvos, documentos ou exportações. */
export function textoTela(texto: string): string {
  return texto
    .replace(/\b(?:INs?|Instrução Normativa)\s*(?:MAPA\s*)?[-–]?\s*\d[\d.]*\s*(?:\/\s*\d{2,4})?(?:\s*\([^)]*\))?/gi, "")
    .replace(/\b(?:Decreto|Portaria|RDC|Lei|Resolução)\s*(?:(?:ANVISA|SDA|GM\/MS|MAPA|CONAMA|CFMV)\s*)?(?:n[º°.]*\s*)?\d[\d.]*\s*(?:\/\s*\d{2,4})?/gi, "")
    .replace(/\b(?:arts?\.|artigos?)\s*\d[\dº°]*(?:\s*[-–,e]+\s*\d[\dº°]*)?(?:\s*,?\s*(?:§\s*\d[º°]?|[IVXLCDM]+\b))?/gi, "")
    .replace(/\bNR\s*[-–]?\s*\d+/gi, "")
    .replace(/\(\s*[,;|/+–—-]*\s*\)/g, "")
    .replace(/\b(?:conforme|segundo|nos termos d[ao]|referência:|ref\.:|basead[oa] n[ao])\s*(?:a|o|as|os)?\s*(?=[.,;)]|$)/gi, "")
    .replace(/\s+([,.;:])/g, "$1")
    .replace(/\s*[-–—|/]\s*$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}