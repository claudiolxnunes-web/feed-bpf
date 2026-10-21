/**
 * PDF Export Utility — Generates professional PDF reports using browser print.
 * Uses a hidden iframe to render styled HTML, then triggers print-to-PDF.
 *
 * Todos os relatórios incluem registro com identificação do responsável, data e hora
 * e selo de integridade (baseLegal: autocontrole, §3º).
 */

import { inserirCarimbo, CARIMBO_PLACEHOLDER } from "./carimboDocumento";

interface PdfColumn {
  header: string;
  accessor: string | ((row: Record<string, unknown>) => string);
  width?: string;
}

interface PdfReportOptions {
  title: string;
  subtitle?: string;
  empresa?: string;
  responsavel?: string;
  periodo?: string;
  columns: PdfColumn[];
  data: Record<string, unknown>[];
  footer?: string;
  orientation?: "portrait" | "landscape";
}

function getCellValue(row: Record<string, unknown>, col: PdfColumn): string {
  if (typeof col.accessor === "function") return col.accessor(row);
  const val = row[col.accessor];
  if (val === null || val === undefined) return "—";
  if (typeof val === "boolean") return val ? "Sim" : "Não";
  return String(val);
}

export async function gerarRelatorioPDF(options: PdfReportOptions): Promise<void> {
  const {
    title, subtitle, empresa, responsavel, periodo,
    columns, data, footer, orientation = "portrait"
  } = options;

  const now = new Date().toLocaleString("pt-BR");

  const tableRows = data.map((row, i) => {
    const cells = columns.map(col =>
      `<td style="padding:6px 8px;border:1px solid #ddd;font-size:11px;">${getCellValue(row, col)}</td>`
    ).join("");
    return `<tr style="background:${i % 2 === 0 ? '#fff' : '#f9f9f9'}">${cells}</tr>`;
  }).join("");

  const tableHeaders = columns.map(col =>
    `<th style="padding:8px;border:1px solid #ccc;background:#1a1a2e;color:#fff;font-size:11px;text-align:left;${col.width ? `width:${col.width}` : ''}">${col.header}</th>`
  ).join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>${title}</title>
<style>
  @page { size: A4 ${orientation}; margin: 15mm; }
  @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
  body { font-family: Arial, sans-serif; color: #333; margin: 0; padding: 20px; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1a1a2e; padding-bottom: 12px; margin-bottom: 16px; }
  .header h1 { font-size: 20px; color: #1a1a2e; margin: 0; }
  .header p { font-size: 11px; color: #666; margin: 2px 0; }
  .meta { display: flex; gap: 24px; margin-bottom: 12px; font-size: 11px; color: #555; }
  .meta span { background: #f0f0f0; padding: 4px 10px; border-radius: 4px; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  .footer { border-top: 2px solid #1a1a2e; padding-top: 8px; font-size: 10px; color: #888; display: flex; justify-content: space-between; }
  .selo { font-size: 9px; color: #999; margin-top: 8px; font-family: monospace; }
</style>
</head>
<body>
<div class="header">
  <div>
    <h1>📋 ${title}</h1>
    ${subtitle ? `<p>${subtitle}</p>` : ''}
  </div>
  <div style="text-align:right">
    <p><strong>Feed_BPF</strong></p>
    <p>Gerado em: ${now}</p>
  </div>
</div>

<div class="meta">
  ${empresa ? `<span><strong>Empresa:</strong> ${empresa}</span>` : ''}
  ${responsavel ? `<span><strong>Responsável:</strong> ${responsavel}</span>` : ''}
  ${periodo ? `<span><strong>Período:</strong> ${periodo}</span>` : ''}
  <span><strong>Registros:</strong> ${data.length}</span>
</div>

<table>
  <thead><tr>${tableHeaders}</tr></thead>
  <tbody>${tableRows}</tbody>
</table>

<div class="footer">
  <span>${footer || 'Documento gerado automaticamente pelo sistema BPF_Consult'}</span>
  <span>Página 1 de 1</span>
</div>
${CARIMBO_PLACEHOLDER}
</body>
</html>`;

  const { html: htmlFinal } = await inserirCarimbo(html, {
    documentoTipo: title,
    documentoId: subtitle,
    empresa,
    usuario: responsavel,
  });

  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(htmlFinal);
  doc.close();

  iframe.onload = () => {
    // Breve delay para garantir renderização dos estilos e fontes
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
        // Remove o iframe após um tempo suficiente para o diálogo de impressão fechar/processar
        setTimeout(() => {
          if (document.body.contains(iframe)) {
            document.body.removeChild(iframe);
          }
        }, 2000);
      } catch (err) {
        console.error("Erro ao imprimir PDF:", err);
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }
    }, 500);
  };
}
