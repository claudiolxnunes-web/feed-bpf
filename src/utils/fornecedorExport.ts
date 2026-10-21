import * as XLSX from "xlsx";
import { inserirCarimbo, CARIMBO_PLACEHOLDER } from "./carimboDocumento";

interface FornecedorData {
  nome: string;
  cnpj?: string | null;
  endereco?: string | null;
  bairro?: string | null;
  cep?: string | null;
  cidade?: string | null;
  estado?: string | null;
  inscricao_estadual?: string | null;
  registro_mapa?: string | null;
  contato_qualidade?: string | null;
  contato_qualidade_tel_email?: string | null;
  contato_comercial?: string | null;
  contato_comercial_tel_email?: string | null;
  tipo_produto?: string | null;
  produtos_fornecidos?: string | null;
  status_qualificacao?: string | null;
  doc_certificado_registro_mapa?: boolean | null;
  doc_alvara_funcionamento?: boolean | null;
  doc_certificado_registro_produto?: boolean | null;
  doc_ficha_tecnica?: boolean | null;
  doc_certificado_analise?: boolean | null;
  resultado_qualificacao?: string | null;
  registro_sipeagro?: string | null;
  sipeagro_verificado?: boolean | null;
  observacoes?: string | null;
}

function simNao(val?: boolean | null): string {
  return val ? "SIM" : "NÃO";
}

function statusLabel(status?: string | null): string {
  switch (status) {
    case "aprovado": return "APROVADO";
    case "aprovado_com_restricoes": return "APROVADO C/ RESTRIÇÕES";
    case "reprovado": return "REPROVADO";
    default: return "PENDENTE";
  }
}

/**
 * Gera template Excel em branco do Questionário PL POP 1.1
 */
export function exportQuestionarioBlankXlsx() {
  const rows: (string | number)[][] = [
    ["POP 01 — QUALIFICAÇÃO DE FORNECEDORES DE MATÉRIA-PRIMA — QUESTIONÁRIO AVALIAÇÃO", "", "", "", "PL. POP 1.1"],
    [],
    ["1 — DADOS DO FORNECEDOR"],
    [],
    ["NOME:", "", "", "", "DATA:", ""],
    ["ENDEREÇO:", "", "", "", "Nº REGISTRO MAPA:", ""],
    ["BAIRRO:", "", "", "", "CEP:", ""],
    ["CIDADE:", "", "", "", "ESTADO:", ""],
    ["CNPJ:", "", "", "", "INSCRIÇÃO ESTADUAL:", ""],
    [],
    ["CONTATO QUALIDADE:", "", "", "", "TELEFONE / EMAIL:", ""],
    ["CONTATO COMERCIAL:", "", "", "", "TELEFONE / EMAIL:", ""],
    [],
    ["", "", "PRODUTO(S) FORNECIDO(S)"],
    [""],
    [],
    [],
    [],
    [],
    ["", "", "DOCUMENTO(S) EXIGIDO(S) PARA QUALIFICAÇÃO", "", "", "", "SIM", "NÃO"],
    ["CERTIFICADO DE REGISTRO DO ESTABELECIMENTO NO MAPA"],
    ["ALVARÁ DE FUNCIONAMENTO DA PREFEITURA"],
    ["CERTIFICADO DE REGISTRO DO PRODUTO NO MAPA"],
    ["FICHA TÉCNICA"],
    ["CERTIFICADO DE ANÁLISE"],
    [],
    [],
    ["", "Aprovado", "", "", "Reprovado"],
    [],
    ["Controle de Qualidade", "", "", "", "Verificação"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 48 }, { wch: 20 }, { wch: 30 }, { wch: 16 }, { wch: 22 }, { wch: 20 }, { wch: 6 }, { wch: 6 }
  ];
  ws["!merges"] = [
    { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PL POP 1.1");

  // Aba 2 — Lista de Fornecedores Aprovados
  const listaRows: (string | number)[][] = [
    [],
    ["", "", "LISTA DE FORNECEDORES APROVADOS"],
    ["", "", "", "", "AVALIAÇÃO"],
    ["Nº", "FORNECEDOR", "PRODUTO FORNECIDO", "APROVADO", "APROVADO C/RESTRIÇÕES", "REPROVADO"],
    // Linhas vazias para preenchimento
    ...Array.from({ length: 20 }, (_, i) => [i + 1, "", "", "", "", ""] as (string | number)[]),
  ];

  const ws2 = XLSX.utils.aoa_to_sheet(listaRows);
  ws2["!cols"] = [
    { wch: 6 }, { wch: 30 }, { wch: 30 }, { wch: 14 }, { wch: 22 }, { wch: 14 }
  ];
  XLSX.utils.book_append_sheet(wb, ws2, "LISTA FORNEC. APROV.");

  XLSX.writeFile(wb, "PL_POP_1.1_Questionario_Qualificacao_Fornecedores.xlsx");
}

/**
 * Gera Excel preenchido com dados de um fornecedor
 */
export function exportQuestionarioPreenchidoXlsx(f: FornecedorData) {
  const rows: (string | number)[][] = [
    ["POP 01 — QUALIFICAÇÃO DE FORNECEDORES DE MATÉRIA-PRIMA — QUESTIONÁRIO AVALIAÇÃO", "", "", "", "PL. POP 1.1"],
    [],
    ["1 — DADOS DO FORNECEDOR"],
    [],
    ["NOME:", f.nome || "", "", "", "DATA:", new Date().toLocaleDateString("pt-BR")],
    ["ENDEREÇO:", f.endereco || "", "", "", "Nº REGISTRO MAPA:", f.registro_mapa || ""],
    ["BAIRRO:", f.bairro || "", "", "", "CEP:", f.cep || ""],
    ["CIDADE:", f.cidade || "", "", "", "ESTADO:", f.estado || ""],
    ["CNPJ:", f.cnpj || "", "", "", "INSCRIÇÃO ESTADUAL:", f.inscricao_estadual || ""],
    [],
    ["CONTATO QUALIDADE:", f.contato_qualidade || "", "", "", "TELEFONE / EMAIL:", f.contato_qualidade_tel_email || ""],
    ["CONTATO COMERCIAL:", f.contato_comercial || "", "", "", "TELEFONE / EMAIL:", f.contato_comercial_tel_email || ""],
    [],
    ["", "", "PRODUTO(S) FORNECIDO(S)"],
    [f.produtos_fornecidos || f.tipo_produto || ""],
    [],
    ["", "", "DOCUMENTO(S) EXIGIDO(S) PARA QUALIFICAÇÃO", "", "", "", "SIM", "NÃO"],
    ["CERTIFICADO DE REGISTRO DO ESTABELECIMENTO NO MAPA", "", "", "", "", "", simNao(f.doc_certificado_registro_mapa), simNao(!f.doc_certificado_registro_mapa)],
    ["ALVARÁ DE FUNCIONAMENTO DA PREFEITURA", "", "", "", "", "", simNao(f.doc_alvara_funcionamento), simNao(!f.doc_alvara_funcionamento)],
    ["CERTIFICADO DE REGISTRO DO PRODUTO NO MAPA", "", "", "", "", "", simNao(f.doc_certificado_registro_produto), simNao(!f.doc_certificado_registro_produto)],
    ["FICHA TÉCNICA", "", "", "", "", "", simNao(f.doc_ficha_tecnica), simNao(!f.doc_ficha_tecnica)],
    ["CERTIFICADO DE ANÁLISE", "", "", "", "", "", simNao(f.doc_certificado_analise), simNao(!f.doc_certificado_analise)],
    [],
    ["RESULTADO:", statusLabel(f.status_qualificacao || f.resultado_qualificacao)],
    [],
    ["OBSERVAÇÕES:", f.observacoes || ""],
    [],
    ["Controle de Qualidade", "", "", "", "Verificação"],
    ["Assinatura: ________________________________", "", "", "", "Assinatura: ________________________________"],
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 48 }, { wch: 24 }, { wch: 30 }, { wch: 16 }, { wch: 22 }, { wch: 20 }, { wch: 6 }, { wch: 6 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "PL POP 1.1");

  const safeName = f.nome.replace(/[^a-zA-Z0-9]/g, "_").substring(0, 30);
  XLSX.writeFile(wb, `PL_POP_1.1_${safeName}.xlsx`);
}

/**
 * Gera Excel da Lista de Fornecedores Aprovados
 */
export function exportListaAprovadosXlsx(fornecedores: FornecedorData[]) {
  const aprovados = fornecedores.filter(f =>
    f.status_qualificacao === "aprovado" || f.status_qualificacao === "aprovado_com_restricoes"
  );

  const rows: (string | number)[][] = [
    [],
    ["", "", "LISTA DE FORNECEDORES APROVADOS"],
    ["", "", "", "", "AVALIAÇÃO"],
    ["Nº", "FORNECEDOR", "PRODUTO FORNECIDO", "APROVADO", "APROVADO C/RESTRIÇÕES", "REPROVADO"],
    ...aprovados.map((f, i) => [
      i + 1,
      f.nome,
      f.produtos_fornecidos || f.tipo_produto || "",
      f.status_qualificacao === "aprovado" ? "X" : "",
      f.status_qualificacao === "aprovado_com_restricoes" ? "X" : "",
      "",
    ] as (string | number)[]),
  ];

  const ws = XLSX.utils.aoa_to_sheet(rows);
  ws["!cols"] = [
    { wch: 6 }, { wch: 35 }, { wch: 30 }, { wch: 14 }, { wch: 22 }, { wch: 14 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "LISTA FORNEC. APROV.");

  XLSX.writeFile(wb, "PL_POP_1.1_Lista_Fornecedores_Aprovados.xlsx");
}

/**
 * Gera um "PDF" via impressão do navegador (window.print) de conteúdo HTML
 */
export async function printQuestionario(f?: FornecedorData): Promise<void> {
  // Abre a janela antes de qualquer espera, para não ser bloqueada pelo navegador.
  const win = window.open("", "_blank");
  const e = (s: unknown) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  const nome = f?.nome || "";
  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>PL POP 1.1 — Questionário Qualificação Fornecedores</title>
<style>
  @media print { @page { size: A4; margin: 10mm; } }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; }
  .print-force-bg { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }

  h2 { font-size: 13px; text-align: center; margin-bottom: 4px; }
  .ref { text-align: right; font-size: 10px; margin-bottom: 12px; }
  .section { font-weight: bold; font-size: 12px; background: #e8e8e8; padding: 4px 8px; margin: 10px 0 6px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
  td, th { border: 1px solid #999; padding: 4px 6px; font-size: 11px; }
  th { background: #d0d0d0; text-align: left; }
  .field-label { font-weight: bold; width: 180px; background: #f5f5f5; }
  .field-value { min-width: 160px; }
  .check-table td { text-align: center; }
  .check-table td:first-child { text-align: left; }
  .resultado { display: flex; gap: 40px; justify-content: center; margin: 16px 0; }
  .resultado div { border: 2px solid #333; padding: 12px 30px; font-weight: bold; font-size: 14px; text-align: center; }
  .resultado .selected { background: #333; color: #fff; }
  .assinaturas { display: flex; justify-content: space-between; margin-top: 30px; }
  .assinaturas div { text-align: center; width: 45%; }
  .assinaturas .line { border-top: 1px solid #000; margin-top: 40px; padding-top: 4px; font-size: 10px; }
</style></head><body>
<h2>POP 01 — QUALIFICAÇÃO DE FORNECEDORES DE MATÉRIA-PRIMA<br>QUESTIONÁRIO AVALIAÇÃO</h2>
<div class="ref">PL. POP 1.1</div>

<div class="section">1 — Dados do Fornecedor</div>
<table>
  <tr><td class="field-label">NOME:</td><td class="field-value">${e(nome)}</td><td class="field-label">DATA:</td><td class="field-value">${f ? new Date().toLocaleDateString("pt-BR") : ""}</td></tr>
  <tr><td class="field-label">ENDEREÇO:</td><td class="field-value">${e(f?.endereco)}</td><td class="field-label">Nº REGISTRO MAPA:</td><td class="field-value">${e(f?.registro_mapa)}</td></tr>
  <tr><td class="field-label">BAIRRO:</td><td class="field-value">${e(f?.bairro)}</td><td class="field-label">CEP:</td><td class="field-value">${e(f?.cep)}</td></tr>
  <tr><td class="field-label">CIDADE:</td><td class="field-value">${e(f?.cidade)}</td><td class="field-label">ESTADO:</td><td class="field-value">${e(f?.estado)}</td></tr>
  <tr><td class="field-label">CNPJ:</td><td class="field-value">${e(f?.cnpj)}</td><td class="field-label">INSCRIÇÃO ESTADUAL:</td><td class="field-value">${e(f?.inscricao_estadual)}</td></tr>
  <tr><td class="field-label">CONTATO QUALIDADE:</td><td class="field-value">${e(f?.contato_qualidade)}</td><td class="field-label">TELEFONE / EMAIL:</td><td class="field-value">${e(f?.contato_qualidade_tel_email)}</td></tr>
  <tr><td class="field-label">CONTATO COMERCIAL:</td><td class="field-value">${e(f?.contato_comercial)}</td><td class="field-label">TELEFONE / EMAIL:</td><td class="field-value">${e(f?.contato_comercial_tel_email)}</td></tr>
</table>

<div class="section">2 — Produto(s) Fornecido(s)</div>
<table><tr><td style="min-height:40px">${e(f?.produtos_fornecidos || f?.tipo_produto)}</td></tr></table>

<div class="section">3 — Documento(s) Exigido(s) para Qualificação</div>
<table class="check-table">
  <tr><th>Documento</th><th>SIM</th><th>NÃO</th></tr>
  <tr><td>Certificado de Registro do Estabelecimento no MAPA</td><td>${f?.doc_certificado_registro_mapa ? "X" : ""}</td><td>${f && !f.doc_certificado_registro_mapa ? "X" : ""}</td></tr>
  <tr><td>Alvará de Funcionamento da Prefeitura</td><td>${f?.doc_alvara_funcionamento ? "X" : ""}</td><td>${f && !f.doc_alvara_funcionamento ? "X" : ""}</td></tr>
  <tr><td>Certificado de Registro do Produto no MAPA</td><td>${f?.doc_certificado_registro_produto ? "X" : ""}</td><td>${f && !f.doc_certificado_registro_produto ? "X" : ""}</td></tr>
  <tr><td>Ficha Técnica</td><td>${f?.doc_ficha_tecnica ? "X" : ""}</td><td>${f && !f.doc_ficha_tecnica ? "X" : ""}</td></tr>
  <tr><td>Certificado de Análise</td><td>${f?.doc_certificado_analise ? "X" : ""}</td><td>${f && !f.doc_certificado_analise ? "X" : ""}</td></tr>
</table>

<div class="section">4 — Resultado</div>
<div class="resultado">
  <div class="${f?.status_qualificacao === "aprovado" ? "selected" : ""}">APROVADO</div>
  <div class="${f?.status_qualificacao === "aprovado_com_restricoes" ? "selected" : ""}">APROVADO C/ RESTRIÇÕES</div>
  <div class="${f?.status_qualificacao === "reprovado" ? "selected" : ""}">REPROVADO</div>
</div>

${f?.observacoes ? `<p><strong>Observações:</strong> ${e(f.observacoes)}</p>` : ""}

<div class="assinaturas">
  <div><div class="line">Controle de Qualidade</div></div>
  <div><div class="line">Verificação</div></div>
</div>

${CARIMBO_PLACEHOLDER}

</body></html>`;

  const { html: htmlFinal } = await inserirCarimbo(html, {
    documentoTipo: "PL POP 1.1 — Questionário Qualificação Fornecedor",
    documentoId: f?.nome,
    empresa: f?.nome,
  });
  if (win) {
    win.document.write(htmlFinal);
    win.document.close();
    win.onload = () => { win.print(); };
  }
}

/**
 * Imprime a Lista de Fornecedores Aprovados
 */
export function printListaAprovados(fornecedores: FornecedorData[]) {
  const aprovados = fornecedores.filter(f =>
    f.status_qualificacao === "aprovado" || f.status_qualificacao === "aprovado_com_restricoes"
  );

  const e = (s: unknown) => String(s ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");

  const linhas = aprovados.map((f, i) => `
    <tr>
      <td style="text-align:center">${i + 1}</td>
      <td>${e(f.nome)}</td>
      <td>${e(f.produtos_fornecidos || f.tipo_produto)}</td>
      <td style="text-align:center">${f.status_qualificacao === "aprovado" ? "X" : ""}</td>
      <td style="text-align:center">${f.status_qualificacao === "aprovado_com_restricoes" ? "X" : ""}</td>
      <td style="text-align:center"></td>
    </tr>
  `).join("");

  // Linhas vazias para preenchimento manual
  const vazias = Array.from({ length: Math.max(0, 15 - aprovados.length) }, (_, i) => `
    <tr><td style="text-align:center">${aprovados.length + i + 1}</td><td></td><td></td><td></td><td></td><td></td></tr>
  `).join("");

  const html = `
<!DOCTYPE html>
<html><head><meta charset="utf-8">
<title>PL POP 1.1 — Lista de Fornecedores Aprovados</title>
<style>
  @media print { @page { size: A4 landscape; margin: 10mm; } }
  body { font-family: 'Inter', Arial, sans-serif; font-size: 11px; color: #000; padding: 20px; }

  h2 { font-size: 14px; text-align: center; margin-bottom: 12px; }
  .ref { text-align: right; font-size: 10px; margin-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; }
  td, th { border: 1px solid #999; padding: 5px 8px; font-size: 11px; }
  th { background: #d0d0d0; }
</style></head><body>
<h2>LISTA DE FORNECEDORES APROVADOS</h2>
<div class="ref">PL. POP 1.1</div>
<table>
  <thead>
    <tr><th rowspan="2">Nº</th><th rowspan="2">FORNECEDOR</th><th rowspan="2">PRODUTO FORNECIDO</th><th colspan="3">AVALIAÇÃO</th></tr>
    <tr><th>APROVADO</th><th>APROVADO C/RESTRIÇÕES</th><th>REPROVADO</th></tr>
  </thead>
  <tbody>${linhas}${vazias}</tbody>
</table>
</body></html>`;

  const win = window.open("", "_blank");
  if (win) {
    win.document.write(html);
    win.document.close();
    win.onload = () => { win.print(); };
  }
}
