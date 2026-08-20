import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, WidthType, BorderStyle,
} from "docx";
import { saveAs } from "file-saver";

export interface PopGeradoDocx {
  objetivo: string;
  campo_aplicacao: string;
  documentos_referencia: string[];
  definicoes: { termo: string; definicao: string }[];
  procedimentos: string[];
  monitoramento: { controle: string; frequencia: string; registro: string; responsavel: string };
  verificacao: { controle: string; frequencia: string; registro: string; responsavel: string };
  acoes_corretivas: { nao_conformidade: string; acao: string }[];
  tempo_retencao: string;
}

const secao = (numero: number, titulo: string) =>
  new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    children: [new TextRun({ text: `${numero}. ${titulo}`, bold: true, size: 24 })],
  });

const texto = (conteudo: string) =>
  new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: conteudo || "—", size: 22 })],
  });

const bullet = (conteudo: string) =>
  new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 60 },
    children: [new TextRun({ text: conteudo, size: 22 })],
  });

const numerado = (indice: number, conteudo: string) =>
  new Paragraph({
    spacing: { after: 60 },
    children: [new TextRun({ text: `${indice}. ${conteudo}`, size: 22 })],
  });

const celula = (conteudo: string, opts: { negrito?: boolean; largura?: number } = {}) =>
  new TableCell({
    width: opts.largura ? { size: opts.largura, type: WidthType.PERCENTAGE } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [
      new Paragraph({
        children: [new TextRun({ text: conteudo || "—", bold: !!opts.negrito, size: 20 })],
      }),
    ],
  });

/** Tabela de 2 colunas (rotulo/valor) usada em Monitoramento e Verificacao. */
const tabelaControle = (dados: { controle: string; frequencia: string; registro: string; responsavel: string }) =>
  new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      bottom: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      left: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      right: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
      insideVertical: { style: BorderStyle.SINGLE, size: 1, color: "BFBFBF" },
    },
    rows: [
      ["O que controlar", dados.controle],
      ["Frequência", dados.frequencia],
      ["Registro", dados.registro],
      ["Responsável", dados.responsavel],
    ].map(([rotulo, valor]) =>
      new TableRow({ children: [celula(rotulo, { negrito: true, largura: 30 }), celula(valor, { largura: 70 })] })
    ),
  });

/**
 * Gera e baixa o POP em .docx a partir do rascunho retornado pela IA,
 * seguindo a estrutura de secoes do MAPA (IN 04/2007).
 */
export async function formatarPopDocx(pop: PopGeradoDocx, codigoPop: string, nomePop: string) {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [new TextRun({ text: `${codigoPop} — ${nomePop}`, bold: true, size: 32 })],
          }),

          secao(1, "Objetivo"),
          texto(pop.objetivo),

          secao(2, "Campo de Aplicação"),
          texto(pop.campo_aplicacao),

          secao(3, "Documentos de Referência"),
          ...(pop.documentos_referencia?.length
            ? pop.documentos_referencia.map(bullet)
            : [texto("—")]),

          secao(4, "Definições"),
          ...(pop.definicoes?.length
            ? pop.definicoes.map(d =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 60 },
                  children: [
                    new TextRun({ text: `${d.termo}: `, bold: true, size: 22 }),
                    new TextRun({ text: d.definicao, size: 22 }),
                  ],
                })
              )
            : [texto("—")]),

          secao(5, "Procedimentos"),
          ...(pop.procedimentos?.length
            ? pop.procedimentos.map((p, i) => numerado(i + 1, p))
            : [texto("—")]),

          secao(6, "Monitoramento"),
          tabelaControle(pop.monitoramento),

          secao(7, "Verificação"),
          tabelaControle(pop.verificacao),

          secao(8, "Ações Corretivas"),
          ...(pop.acoes_corretivas?.length
            ? pop.acoes_corretivas.map(a =>
                new Paragraph({
                  bullet: { level: 0 },
                  spacing: { after: 60 },
                  children: [
                    new TextRun({ text: `${a.nao_conformidade}: `, bold: true, size: 22 }),
                    new TextRun({ text: a.acao, size: 22 }),
                  ],
                })
              )
            : [texto("—")]),

          secao(9, "Tempo de Retenção"),
          texto(pop.tempo_retencao),

          new Paragraph({
            spacing: { before: 360 },
            children: [
              new TextRun({
                text: "Rascunho gerado por IA — revisar e validar antes de uso oficial.",
                italics: true,
                size: 18,
                color: "808080",
              }),
            ],
          }),
        ],
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `${codigoPop}-${nomePop.replace(/\s+/g, "_")}-rascunho.docx`);
}
