import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import { toast } from "sonner";

interface ExportPdfOptions {
  /** Largura do rótulo em milímetros. */
  larguraMm: number;
  /** Altura do rótulo em milímetros. */
  alturaMm: number;
  /** Nome base do arquivo, sem extensão. */
  nomeArquivo: string;
  /** HTML do rótulo já montado (mesmo usado na impressão). */
  html: string;
}

/**
 * Gera um arquivo PDF do rótulo em tamanho real (mm), a partir do HTML de impressão.
 * Renderiza o HTML fora da tela para não interferir no layout da página.
 */
export async function exportRotuloPdf({
  larguraMm,
  alturaMm,
  nomeArquivo,
  html,
}: ExportPdfOptions): Promise<boolean> {
  if (!html?.trim()) {
    toast.error("Não há conteúdo de rótulo para exportar.");
    return false;
  }

  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-10000px";
  container.style.top = "0";
  container.style.width = `${larguraMm}mm`;
  container.style.minHeight = `${alturaMm}mm`;
  container.style.background = "#ffffff";
  container.style.color = "#000000";
  container.style.fontFamily = "Arial, Helvetica, sans-serif";
  container.innerHTML = html;
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 3,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
    });

    // Altura real ocupada pelo conteúdo, na largura do rótulo.
    const proporcao = canvas.height / canvas.width;
    const alturaConteudoMm = larguraMm * proporcao;

    // Se o conteúdo passar da altura declarada, a página cresce para não cortar nada.
    const alturaPaginaMm = Math.max(alturaMm, Math.ceil(alturaConteudoMm * 100) / 100);

    const orientation = larguraMm >= alturaPaginaMm ? "landscape" : "portrait";
    const pdf = new jsPDF({
      orientation,
      unit: "mm",
      format: [larguraMm, alturaPaginaMm],
    });

    pdf.addImage(
      canvas.toDataURL("image/jpeg", 0.95),
      "JPEG",
      0,
      0,
      larguraMm,
      alturaConteudoMm,
    );
    pdf.save(`${nomeArquivo || "rotulo"}.pdf`);

    if (alturaPaginaMm > alturaMm + 0.5) {
      toast.warning(
        `PDF gerado com ${alturaPaginaMm.toFixed(0)} mm de altura: o conteúdo não cabe nos ${alturaMm} mm do rótulo.`,
      );
      return true;
    }

    toast.success("PDF do rótulo gerado.");
    return true;
  } catch (error) {
    console.error("[rotuloPdfExport] Falha ao gerar PDF:", error);
    toast.error("Não foi possível gerar o PDF do rótulo.");
    return false;
  } finally {
    document.body.removeChild(container);
  }
}
