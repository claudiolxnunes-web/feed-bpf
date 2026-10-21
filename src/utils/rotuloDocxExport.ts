import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, WidthType, BorderStyle, ShadingType, PageOrientation,
} from "docx";
import { saveAs } from "file-saver";

interface RotuloDocxData {
  nome_comercial: string;
  classificacao_label: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  composicao_ingredientes: string;
  eventuais_substitutivos: string;
  niveis_garantia_texto: string;
  indicacoes_uso: string;
  modo_usar: string;
  precaucoes_restricoes: string;
  armazenamento: string;
  lote_placeholder: string;
  fabricacao_placeholder: string;
  registro_mapa: string;
  rt_nome: string;
  rt_crmv: string;
  sac_contato: string;
  peso_liquido: string;
  prazo_validade: string;
  exibir_tabela_consumo: boolean;
}

interface VRRef {
  mineral: string;
  vr: number;
  unit: string;
  key: string;
}

const VR_MACRO: VRRef[] = [
  { mineral: "Cálcio", vr: 14, unit: "g/dia", key: "calcio" },
  { mineral: "Fósforo", vr: 11, unit: "g/dia", key: "fosforo" },
  { mineral: "Sódio", vr: 7, unit: "g/dia", key: "sodio" },
  { mineral: "Magnésio", vr: 9, unit: "g/dia", key: "magnesio" },
  { mineral: "Enxofre", vr: 13.5, unit: "g/dia", key: "enxofre" },
  { mineral: "Potássio", vr: 54, unit: "g/dia", key: "potassio" },
];

const VR_MICRO: VRRef[] = [
  { mineral: "Cobalto", vr: 0.9, unit: "mg/dia", key: "cobalto" },
  { mineral: "Cobre", vr: 90, unit: "mg/dia", key: "cobre" },
  { mineral: "Iodo", vr: 4.5, unit: "mg/dia", key: "iodo" },
  { mineral: "Manganês", vr: 180, unit: "mg/dia", key: "manganes" },
  { mineral: "Selênio", vr: 0.9, unit: "mg/dia", key: "selenio" },
  { mineral: "Zinco", vr: 270, unit: "mg/dia", key: "zinco" },
  { mineral: "Ferro", vr: 450, unit: "mg/dia", key: "ferro" },
];

const VR_VITAMINAS: VRRef[] = [
  { mineral: "Vitamina A", vr: 20000, unit: "UI/dia", key: "vitamina_a" },
  { mineral: "Vitamina D", vr: 2500, unit: "UI/dia", key: "vitamina_d" },
  { mineral: "Vitamina E", vr: 350, unit: "UI/dia", key: "vitamina_e" },
];

function calcQtdPer100g(niveisObj: Record<string, any>, key: string, refUnit: string): number | null {
  const nutrient = niveisObj[key];
  if (!nutrient || typeof nutrient !== "object") return null;
  const rawVal = parseFloat(nutrient.min || nutrient.max || "0");
  if (!rawVal) return null;
  const nutUnit = (nutrient.unit || "").toLowerCase();
  let valPer100g = rawVal / 10;
  if (refUnit.includes("g/dia") && nutUnit.includes("mg")) valPer100g = valPer100g / 1000;
  if (refUnit.includes("mg/dia") && nutUnit.includes("g/")) valPer100g = valPer100g * 1000;
  return valPer100g;
}

const cellBorder = { style: BorderStyle.SINGLE, size: 1, color: "000000" };
const cellBorders = { top: cellBorder, bottom: cellBorder, left: cellBorder, right: cellBorder };
const noBorders = {
  top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
  right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
};
const cellMargins = { top: 40, bottom: 40, left: 80, right: 80 };

function sectionParagraphs(title: string, content: string): Paragraph[] {
  if (!content) return [];
  return [
    new Paragraph({
      spacing: { before: 80, after: 20 },
      children: [new TextRun({ text: title, bold: true, font: "Arial", size: 14 })],
    }),
    new Paragraph({
      spacing: { after: 40 },
      alignment: AlignmentType.JUSTIFIED,
      children: [new TextRun({ text: content, font: "Arial", size: 13 })],
    }),
  ];
}

function buildVRTableRows(refs: VRRef[], niveisObj: Record<string, any>): TableRow[] {
  return refs.map(ref => {
    const qtd = calcQtdPer100g(niveisObj, ref.key, ref.unit);
    const pct = qtd !== null && ref.vr > 0 ? ((qtd / ref.vr) * 100) : null;
    return new TableRow({
      children: [
        new TableCell({
          borders: cellBorders, margins: cellMargins,
          width: { size: 1200, type: WidthType.DXA },
          children: [new Paragraph({ children: [new TextRun({ text: ref.mineral, font: "Arial", size: 12 })] })],
        }),
        new TableCell({
          borders: cellBorders, margins: cellMargins,
          width: { size: 800, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(ref.vr), font: "Arial", size: 12 })] })],
        }),
        new TableCell({
          borders: cellBorders, margins: cellMargins,
          width: { size: 900, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: qtd !== null ? qtd.toFixed(2) : "–", font: "Arial", size: 12 })] })],
        }),
        new TableCell({
          borders: cellBorders, margins: cellMargins,
          width: { size: 900, type: WidthType.DXA },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: pct !== null ? pct.toFixed(2) : "–", font: "Arial", size: 12 })] })],
        }),
      ],
    });
  });
}

export async function exportRotuloDocx(rotulo: RotuloDocxData, niveisObj: Record<string, any>) {
  // ---- LEFT COLUMN CONTENT ----
  const leftChildren: Paragraph[] = [];

  leftChildren.push(...sectionParagraphs("COMPOSIÇÃO BÁSICA:", rotulo.composicao_ingredientes));
  leftChildren.push(...sectionParagraphs("EVENTUAIS SUBSTITUTIVOS:", rotulo.eventuais_substitutivos));
  leftChildren.push(...sectionParagraphs("NÍVEIS DE GARANTIA POR KG DO PRODUTO:", rotulo.niveis_garantia_texto));
  leftChildren.push(...sectionParagraphs("INDICAÇÕES DE USO:", rotulo.indicacoes_uso));
  leftChildren.push(...sectionParagraphs("MODO DE USAR:", rotulo.modo_usar));
  leftChildren.push(...sectionParagraphs("RESTRIÇÕES E OUTRAS RECOMENDAÇÕES:", rotulo.precaucoes_restricoes));
  leftChildren.push(...sectionParagraphs("CONDIÇÕES DE CONSERVAÇÃO:", rotulo.armazenamento));

  // ---- CONSUMPTION TABLE (right column content for supplements) ----
  const rightChildren: Paragraph[] = [];

  if (rotulo.exibir_tabela_consumo) {
    rightChildren.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 60 },
      children: [new TextRun({ text: "TABELA VALOR DE REFERÊNCIA", bold: true, font: "Arial", size: 16, underline: {} })],
    }));

    const headerRow = new TableRow({
      children: ["VALOR\nGARANTIA", "VALOR\nREFERÊNCIA\n(VR)¹", "QUANTIDADE\nPOR 100 G DE\nSUPLEMENTO", "QUANTIDADE\nDO VR POR 100\nSUPLEMENTO"].map((h, i) =>
        new TableCell({
          borders: cellBorders, margins: cellMargins,
          width: { size: i === 0 ? 1200 : i === 1 ? 800 : 900, type: WidthType.DXA },
          shading: { fill: "E5E5E5", type: ShadingType.CLEAR },
          children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: h, bold: true, font: "Arial", size: 11 })] })],
        })
      ),
    });

    // PB / NDT rows
    const extraRows: TableRow[] = [];
    const consumoPB = niveisObj.consumo_pb;
    const consumoNDT = niveisObj.consumo_ndt;

    if (consumoPB && typeof consumoPB === "object" && parseFloat(consumoPB.min || "0")) {
      const vrPB = parseFloat(consumoPB.vr || "550");
      const qtd = parseFloat(consumoPB.min) / 10;
      const pct = ((qtd / vrPB) * 100).toFixed(2);
      extraRows.push(new TableRow({
        children: [
          new TableCell({ borders: cellBorders, margins: cellMargins, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Consumo em PB (g/dia)", font: "Arial", size: 12 })] })] }),
          new TableCell({ borders: cellBorders, margins: cellMargins, width: { size: 800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(vrPB), font: "Arial", size: 12 })] })] }),
          new TableCell({ borders: cellBorders, margins: cellMargins, width: { size: 900, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: qtd.toFixed(0), font: "Arial", size: 12 })] })] }),
          new TableCell({ borders: cellBorders, margins: cellMargins, width: { size: 900, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: pct, font: "Arial", size: 12 })] })] }),
        ],
      }));
    }
    if (consumoNDT && typeof consumoNDT === "object" && parseFloat(consumoNDT.min || "0")) {
      const vrNDT = parseFloat(consumoNDT.vr || "4000");
      const qtd = parseFloat(consumoNDT.min) / 10;
      const pct = ((qtd / vrNDT) * 100).toFixed(2);
      extraRows.push(new TableRow({
        children: [
          new TableCell({ borders: cellBorders, margins: cellMargins, width: { size: 1200, type: WidthType.DXA }, children: [new Paragraph({ children: [new TextRun({ text: "Consumo em NDT (g/dia)", font: "Arial", size: 12 })] })] }),
          new TableCell({ borders: cellBorders, margins: cellMargins, width: { size: 800, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: String(vrNDT), font: "Arial", size: 12 })] })] }),
          new TableCell({ borders: cellBorders, margins: cellMargins, width: { size: 900, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: qtd.toFixed(0), font: "Arial", size: 12 })] })] }),
          new TableCell({ borders: cellBorders, margins: cellMargins, width: { size: 900, type: WidthType.DXA }, children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: pct, font: "Arial", size: 12 })] })] }),
        ],
      }));
    }

    const vrTable = new Table({
      width: { size: 3800, type: WidthType.DXA },
      columnWidths: [1200, 800, 900, 900],
      rows: [headerRow, ...extraRows],
    });

    rightChildren.push(new Paragraph({ children: [] })); // spacer
    // We'll embed the table directly in the section

    // Group tables for Macro, Micro, Vitaminas
    const groups = [
      { label: "MACROMINERAIS (g/dia)", refs: VR_MACRO },
      { label: "MICROMINERAIS (mg/dia)", refs: VR_MICRO },
      { label: "VITAMINAS (UI/dia)", refs: VR_VITAMINAS },
    ];

    // We'll build these as separate tables below
    const groupTables: (Paragraph | Table)[] = [vrTable];

    groups.forEach(grp => {
      groupTables.push(new Paragraph({
        spacing: { before: 60, after: 20 },
        children: [new TextRun({ text: grp.label, bold: true, font: "Arial", size: 12 })],
      }));
      groupTables.push(new Table({
        width: { size: 3800, type: WidthType.DXA },
        columnWidths: [1200, 800, 900, 900],
        rows: buildVRTableRows(grp.refs, niveisObj),
      }));
    });

    groupTables.push(new Paragraph({
      spacing: { before: 40 },
      children: [new TextRun({ text: "1: Valor diário de referência para manutenção de um animal de 450 kg de peso corporal", font: "Arial", size: 10, italics: true })],
    }));

    // Store for later use
    (rightChildren as any)._tables = groupTables;
  }

  // ---- HEADER TABLE (Classification + Name | Manufacturer) ----
  const headerTable = new Table({
    width: { size: 15120, type: WidthType.DXA },
    columnWidths: [10080, 5040],
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: cellBorders, margins: { top: 60, bottom: 60, left: 120, right: 120 },
            width: { size: 10080, type: WidthType.DXA },
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 40 },
                children: [new TextRun({ text: rotulo.classificacao_label, bold: true, font: "Arial", size: 16 })],
              }),
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [new TextRun({ text: rotulo.nome_comercial, bold: true, font: "Arial", size: 36 })],
              }),
            ],
          }),
          new TableCell({
            borders: cellBorders, margins: { top: 60, bottom: 60, left: 80, right: 80 },
            width: { size: 5040, type: WidthType.DXA },
            children: [
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "Fabricado por:", bold: true, font: "Arial", size: 14 })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: rotulo.razao_social, font: "Arial", size: 13 })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: rotulo.endereco, font: "Arial", size: 13 })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: `CNPJ: ${rotulo.cnpj}`, font: "Arial", size: 13 })] }),
              new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: "INDÚSTRIA BRASILEIRA", bold: true, font: "Arial", size: 13 })] }),
            ],
          }),
        ],
      }),
    ],
  });

  // ---- BODY: two-column layout via table ----
  const bodyLeftCell = new TableCell({
    borders: rotulo.exibir_tabela_consumo
      ? { ...noBorders, right: cellBorder }
      : noBorders,
    margins: { top: 40, bottom: 40, left: 120, right: 120 },
    width: { size: rotulo.exibir_tabela_consumo ? 10080 : 15120, type: WidthType.DXA },
    children: leftChildren.length > 0 ? leftChildren : [new Paragraph({ children: [] })],
  });

  let bodyRows: TableRow[];
  if (rotulo.exibir_tabela_consumo) {
    const tables = (rightChildren as any)._tables as (Paragraph | Table)[] || [];
    const rightCell = new TableCell({
      borders: noBorders,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      width: { size: 5040, type: WidthType.DXA },
      children: [
        ...rightChildren.filter(c => c instanceof Paragraph),
        ...tables,
      ],
    });
    bodyRows = [new TableRow({ children: [bodyLeftCell, rightCell] })];
  } else {
    bodyRows = [new TableRow({ children: [bodyLeftCell] })];
  }

  const bodyTable = new Table({
    width: { size: 15120, type: WidthType.DXA },
    columnWidths: rotulo.exibir_tabela_consumo ? [10080, 5040] : [15120],
    rows: bodyRows,
  });

  // ---- FOOTER ----
  const footerParagraphs: Paragraph[] = [
    new Paragraph({
      border: { top: { style: BorderStyle.SINGLE, size: 1, color: "000000", space: 4 } },
      spacing: { before: 60, after: 20 },
      children: [
        new TextRun({ text: rotulo.lote_placeholder, font: "Arial", size: 13 }),
        new TextRun({ text: "          ", font: "Arial", size: 13 }),
        new TextRun({ text: rotulo.fabricacao_placeholder, font: "Arial", size: 13 }),
      ],
    }),
  ];

  if (rotulo.rt_nome) {
    footerParagraphs.push(new Paragraph({
      children: [new TextRun({ text: `RT: ${rotulo.rt_nome} – CRMV: ${rotulo.rt_crmv}`, font: "Arial", size: 12 })],
    }));
  }
  if (rotulo.sac_contato) {
    footerParagraphs.push(new Paragraph({
      children: [new TextRun({ text: `SAC: ${rotulo.sac_contato}`, font: "Arial", size: 12 })],
    }));
  }

  footerParagraphs.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { before: 80 },
    border: { top: { style: BorderStyle.SINGLE, size: 1, color: "666666", space: 4 } },
    children: [new TextRun({ text: "INDÚSTRIA BRASILEIRA", bold: true, font: "Arial", size: 16 })],
  }));

  footerParagraphs.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({
      text: rotulo.registro_mapa
        ? "Produto Registrado no Ministério da Agricultura e Pecuária."
        : "Produto Isento de Registro no Ministério da Agricultura e Pecuária.",
      font: "Arial", size: 14,
    })],
  }));

  // ---- BUILD DOCUMENT ----
  const doc = new Document({
    sections: [{
      properties: {
        page: {
          // docx-js espera as medidas em retrato e faz a troca ao aplicar LANDSCAPE
          size: {
            width: 12240,
            height: 15840,
            orientation: PageOrientation.LANDSCAPE,
          },
          margin: { top: 360, right: 360, bottom: 360, left: 360 },
        },
      },

      children: [
        headerTable,
        bodyTable,
        ...footerParagraphs,
      ],
    }],
  });

  const buffer = await Packer.toBlob(doc);
  saveAs(buffer, `Rotulo_${rotulo.nome_comercial.replace(/\s+/g, "_")}.docx`);
}
