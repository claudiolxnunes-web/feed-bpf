import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { useState, useEffect, useRef } from "react";
import { Loader2, Printer, Download, Save, RefreshCw, Settings, Eye, Send, FileText, FileDown } from "lucide-react";
import { exportRotuloDocx } from "@/utils/rotuloDocxExport";
import { exportRotuloPdf } from "@/utils/rotuloPdfExport";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { gerarCarimbo, carimboHTMLCompacto } from "@/utils/carimboDocumento";

interface Props {
  produtoId: string;
  produtoNome: string;
}

interface RotuloData {
  id?: string;
  tipo_rotulo: string;
  nome_comercial: string;
  classificacao_label: string;
  especie_categoria: string;
  composicao_ingredientes: string;
  eventuais_substitutivos: string;
  niveis_garantia_texto: string;
  indicacoes_uso: string;
  modo_usar: string;
  precaucoes_restricoes: string;
  peso_liquido: string;
  prazo_validade: string;
  armazenamento: string;
  lote_placeholder: string;
  fabricacao_placeholder: string;
  registro_mapa: string;
  razao_social: string;
  cnpj: string;
  endereco: string;
  rt_nome: string;
  rt_crmv: string;
  sac_contato: string;
  largura_mm: number;
  altura_mm: number;
  exibir_tabela_consumo: boolean;
  lote: string;
  data_fabricacao: string;
  validade_dias: number;
}

interface ZebraConfig {
  dpi: 203 | 300;
  largura_mm: number;
  altura_mm: number;
  velocidade: number;
  escurecimento: number;
  conexao: "download" | "usb" | "rede";
  ip_impressora: string;
  porta: number;
}

function objectNivelToText(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const v = value as { min?: string | number; max?: string | number; unit?: string };
    const unit = v.unit ? ` ${v.unit}` : "";
    if (v.min != null && v.max != null && `${v.min}` && `${v.max}`) return `mín. ${v.min}${unit}; máx. ${v.max}${unit}`;
    if (v.min != null && `${v.min}`) return `mín. ${v.min}${unit}`;
    if (v.max != null && `${v.max}`) return `máx. ${v.max}${unit}`;
    try { return JSON.stringify(value); } catch { return ""; }
  }
  return String(value);
}

function sanitizeRotuloDraft(input: Partial<RotuloData> | null | undefined): Partial<RotuloData> {
  if (!input) return {};
  return {
    ...input,
    nome_comercial: objectNivelToText(input.nome_comercial),
    classificacao_label: objectNivelToText(input.classificacao_label),
    especie_categoria: objectNivelToText(input.especie_categoria),
    composicao_ingredientes: objectNivelToText(input.composicao_ingredientes),
    eventuais_substitutivos: objectNivelToText(input.eventuais_substitutivos),
    niveis_garantia_texto: objectNivelToText(input.niveis_garantia_texto),
    indicacoes_uso: objectNivelToText(input.indicacoes_uso),
    modo_usar: objectNivelToText(input.modo_usar),
    precaucoes_restricoes: objectNivelToText(input.precaucoes_restricoes),
    peso_liquido: objectNivelToText(input.peso_liquido),
    prazo_validade: objectNivelToText(input.prazo_validade),
    armazenamento: objectNivelToText(input.armazenamento),
    lote_placeholder: objectNivelToText(input.lote_placeholder),
    fabricacao_placeholder: objectNivelToText(input.fabricacao_placeholder),
    registro_mapa: objectNivelToText(input.registro_mapa),
    razao_social: objectNivelToText(input.razao_social),
    cnpj: objectNivelToText(input.cnpj),
    endereco: objectNivelToText(input.endereco),
    rt_nome: objectNivelToText(input.rt_nome),
    rt_crmv: objectNivelToText(input.rt_crmv),
    sac_contato: objectNivelToText(input.sac_contato),
    lote: objectNivelToText(input.lote),
    data_fabricacao: objectNivelToText(input.data_fabricacao),
  };
}

const EMPTY_ROTULO: RotuloData = {
  tipo_rotulo: "racao",
  nome_comercial: "", classificacao_label: "", especie_categoria: "",
  composicao_ingredientes: "", eventuais_substitutivos: "", niveis_garantia_texto: "",
  indicacoes_uso: "", modo_usar: "", precaucoes_restricoes: "",
  peso_liquido: "", prazo_validade: "", armazenamento: "",
  lote_placeholder: "LOTE: ___________",
  fabricacao_placeholder: "FAB: ___/___/______",
  registro_mapa: "", razao_social: "", cnpj: "", endereco: "",
  rt_nome: "", rt_crmv: "", sac_contato: "",
  largura_mm: 200, altura_mm: 100,
  exibir_tabela_consumo: false,
  lote: "", data_fabricacao: "", validade_dias: 180,
};

const DEFAULT_ZEBRA: ZebraConfig = {
  dpi: 203,
  largura_mm: 200,
  altura_mm: 100,
  velocidade: 4,
  escurecimento: 15,
  conexao: "download",
  ip_impressora: "192.168.1.100",
  porta: 9100,
};

const CLASSIFICACAO_FULL: Record<string, string> = {
  racao: "RAÇÃO",
  suplemento: "SUPLEMENTO",
  premix: "PREMIX",
  nucleo: "NÚCLEO",
  aditivo: "ADITIVO",
  sal_mineral: "SAL MINERAL",
  proteico: "SUPLEMENTO MINERAL PROTEICO",
  proteico_energetico: "SUPLEMENTO MINERAL PROTEICO ENERGÉTICO",
  energetico: "SUPLEMENTO ENERGÉTICO",
};

// ──── Reference values for 450kg bovine maintenance (NRC / IN 12/2004) ────
const VR_MACRO = [
  { mineral: "Cálcio", vr: 14, unit: "g/dia", key: "calcio" },
  { mineral: "Fósforo", vr: 11, unit: "g/dia", key: "fosforo" },
  { mineral: "Sódio", vr: 7, unit: "g/dia", key: "sodio" },
  { mineral: "Magnésio", vr: 9, unit: "g/dia", key: "magnesio" },
  { mineral: "Enxofre", vr: 13.5, unit: "g/dia", key: "enxofre" },
  { mineral: "Potássio", vr: 54, unit: "g/dia", key: "potassio" },
];

const VR_MICRO = [
  { mineral: "Cobalto", vr: 0.9, unit: "mg/dia", key: "cobalto" },
  { mineral: "Cobre", vr: 90, unit: "mg/dia", key: "cobre" },
  { mineral: "Iodo", vr: 4.5, unit: "mg/dia", key: "iodo" },
  { mineral: "Manganês", vr: 180, unit: "mg/dia", key: "manganes" },
  { mineral: "Selênio", vr: 0.9, unit: "mg/dia", key: "selenio" },
  { mineral: "Zinco", vr: 270, unit: "mg/dia", key: "zinco" },
  { mineral: "Ferro", vr: 450, unit: "mg/dia", key: "ferro" },
];

const VR_VITAMINAS = [
  { mineral: "Vitamina A", vr: 20000, unit: "UI/dia", key: "vitamina_a" },
  { mineral: "Vitamina D", vr: 2500, unit: "UI/dia", key: "vitamina_d" },
  { mineral: "Vitamina E", vr: 350, unit: "UI/dia", key: "vitamina_e" },
];

// ──── Example data ────
const EXEMPLO_RACAO: { rotulo: Partial<RotuloData>; niveis: Record<string, any> } = {
  rotulo: {
    tipo_rotulo: "racao",
    nome_comercial: "RAÇÃO HGM BEZERROS 18%",
    classificacao_label: "RAÇÃO PARA BEZERROS DE LEITE E CORTE",
    especie_categoria: "BOVINOS – BEZERROS DE LEITE E CORTE",
    composicao_ingredientes: "Milho integral moído (Espécie doadora do gene Agrobacterium thumefaciens, Bacillus thuringiensis, Streptomyces viridochromogenes, Zea mays), farelo de soja (Espécie doadora do gene Agrobacterium thumefaciens, Arabidopsis thaliana, Bacillus thuringiensis, Streptomyces viridochromogenes), cloreto de sódio (sal comum), enxofre ventilado (flor de enxofre), fosfato bicálcico, iodato de cálcio, niacina, óxido de magnésio, pantotenato de cálcio, selenito de sódio, sulfato de cobalto, sulfato de cobre, sulfato de manganês, sulfato de zinco, vitamina A, Vitamina B12, vitamina B2, vitamina D3, vitamina E, caulim, aditivo aromatizante, BHT (hidróxido de tolueno butilado), monensina sódica.",
    eventuais_substitutivos: "Farelo de Algodão (Espécie doadora do gene Agrobacterium thumefaciens, Bacillus thuringiensis, Streptomyces hygroscopicus, Streptomyces viridochromogenes, Zea mays), casca de soja, milheto, sorgo integral moído, calcário calcítico, fosfato monobicálcico, iodato de potássio, monóxido de manganês, óxido de zinco.",
    niveis_garantia_texto: "Umidade (máx.) 130 g/Kg; Proteína Bruta (mín.) 180 g/Kg; Extrato Etéreo (mín.) 30 g/Kg; FDA (máx.) 80 g/Kg; Matéria Fibrosa (máx.) 80 g/Kg; Cálcio (mín.) 7.000 mg/Kg; Cálcio (máx.) 10 g/Kg; Enxofre (mín.) 450 mg/Kg; Fósforo (mín.) 4.200 mg/Kg; Cobalto (mín.) 0,45 mg/Kg; Cobre (mín.) 11,5 mg/Kg; Iodo (mín.) 0,85 mg/Kg; Magnésio (mín.) 450 mg/Kg; Manganês (mín.) 15 mg/Kg; Monensina Sódica 31 mg/Kg; NDT (mín.) 750 g/Kg; Selênio (mín.) 0,18 mg/Kg; Sódio (mín.) 4.450 mg/Kg; Vitamina A (mín.) 10.000 U.I./Kg; Vitamina B1 (mín.) 3 mg/Kg; Vitamina B12 (mín.) 11,25 mcg/Kg; Vitamina B2 (mín.) 4 mg/Kg; Vitamina D3 (mín.) 1.980 U.I./Kg; Vitamina E (mín.) 0,240 U.I./Kg; Zinco (mín.) 59 mg/Kg.",
    indicacoes_uso: "Ração para bezerros/as de leite ou corte em fase de aleitamento.",
    modo_usar: "Fornecer à vontade 1 a 1,5 kg para cada 100 kg de peso vivo, do 4° dia de vida adiante até o desmame.",
    precaucoes_restricoes: "Este produto contém Ionóforo: Não permitir que cavalos ou outros equídeos tenham acesso a rações contendo Monensina, pois a ingestão pode ser fatal.",
    armazenamento: "Conservar em local seco e arejado, afastado de piso e paredes e de preferência sobre estrados, evitar presença de insetos e roedores.",
    peso_liquido: "40 kg",
    prazo_validade: "6 meses a partir da data de fabricação",
    razao_social: "Agro Campo EIRELI-M. E.",
    cnpj: "10.957.552/0001-46",
    endereco: "AV. CAETANO LUIZ DE SOUZA S/N QDA 8 LT 06 – JARDIM SANTA FÉ – ABADIANIA GO – CEP: 72.940-000",
    registro_mapa: "",
    exibir_tabela_consumo: false,
  },
  niveis: {},
};

const EXEMPLO_PROTEINADO: { rotulo: Partial<RotuloData>; niveis: Record<string, any> } = {
  rotulo: {
    tipo_rotulo: "suplemento",
    nome_comercial: "HGM PAC 400",
    classificacao_label: "SUPLEMENTO MINERAL PROTEICO ENERGÉTICO DE PRONTO USO – BOVINOS DE CORTE",
    especie_categoria: "BOVINOS DE CORTE",
    composicao_ingredientes: "CALCÁRIO CALCÍTICO, CLORETO DE SÓDIO (SAL COMUM 9,60%), ENXOFRE VENTILADO (FLOR DE ENXOFRE) FARELO DE SOJA (POSSÍVEIS ESPÉCIES DOADORAS DO GENE: Agrobacterium tumefaciens, Bacillus thuringiensis, Arabidopsis thaliana E Streptomyces viridochromogenes), FOSFATO BICÁLCICO, IODATO DE CÁLCIO, MILHO INTEGRAL MOÍDO (POSSÍVEIS ESPÉCIES DOADORAS DO GENTE: Agrobacterium tumefaciens, Bacillus thuringiensis, Streptomyces viridochromogenes E Zea mays), ÓXIDO DE MAGNÉSIO, SELENITO DE SÓDIO, SULFATO DE COBALTO, SULFATO DE COBRE, SULFATO DE MANGANÊS, SULFATO DE ZINCO, CAULIM MICRO, URÉIA PECUÁRIA, MONENSINA SÓDICA.",
    eventuais_substitutivos: "Farelo de Algodão (Espécie doadora do gene Agrobacterium thumefaciens, Bacillus thuringiensis, Streptomyces hygroscopicus, Streptomyces viridochromogenes, Zea mays), casca de soja, milheto, sorgo integral moído, carbonato de cálcio, fosfato monobicálcico, iodato de potássio, monóxido de manganês, óxido de zinco.",
    niveis_garantia_texto: "Cálcio (Mín.) 10,00 g; Cálcio (Máx.) 30,00 g; Cobalto (Mín.) 9,00 mg; Cobre (Mín.) 156,00 mg; Enxofre (Mín.) 1.750,00 mg; Flúor (Máx.) 55,00 mg; Fósforo (Mín.) 7.490,00 mg; Iodo (Mín.) 10,00 mg; Magnésio (Mín.) 1.690,00 mg; Manganês (Mín.) 150,00 mg; Monensina – 167,00 mg; Proteína Bruta (Mín.) 200,00 g; NNP Equivalente Proteína (Máx.) 112 g; NDT (Mín.) 700,00 g; Selênio (Mín.) 2,8 mg; Sódio (Mín.) 22,00 g; Zinco (Mín.) 500,00 mg.",
    indicacoes_uso: "PRODUTO DESTINADO À SUPLEMENTAÇÃO DE MINERAIS E PROTEÍNAS PARA BOVINOS DE CORTE NAS FASES DE CRIA, RECRIA E ENGORDA.",
    modo_usar: "Adaptação ao consumo de PROTÉICO HGM PAC 400:\nDe 1 a 7 dias: Fornecer 100 g/100 kg de peso vivo. De 8 a 14 dias fornecer 200 g/100 kg de peso vivo. Após 14 dias fornecer de 200 a 400 g/100 kg de peso vivo.\nCONSUMO DIÁRIO: Varia de 200 a 400g de HGM PAC 400 para cada 100Kg de peso corporal. Para um melhor resultado servir no final do dia.",
    precaucoes_restricoes: "CUIDADOS AO USAR PRODUTO COM URÉIA: Servir o produto sempre em cochos cobertos e/ou com sistema que evite o acúmulo de água, manter boa disponibilidade de pasto, manter o cocho com o produto, não fornecer o produto para animais em jejum, famintos e debilitados e procurar o profissional habilitado de sua confiança em caso de intoxicação.\nRESTRIÇÃO DE USO: Não permitir que cavalos ou outros equídeos tenham acesso a produtos contendo monensina. A ingestão pode ser fatal. A monensina é incompatível com tiamulina.",
    armazenamento: "Conservar em local seco e arejado, afastado de piso e paredes e de preferência sobre estrados, evitar presença de insetos e roedores.",
    peso_liquido: "30 kg",
    prazo_validade: "6 meses a partir da data de fabricação",
    razao_social: "Agro Campo EIRELI-M. E.",
    cnpj: "10.957.552/0001-46",
    endereco: "AV. CAETANO LUIZ DE SOUZA S/N QDA 8 LT 06 – JARDIM SANTA FÉ – ABADIANIA GO – CEP: 72.940-000",
    registro_mapa: "",
    exibir_tabela_consumo: true,
  },
  niveis: {
    calcio: { min: "10.00", max: "30.00", unit: "g/kg" },
    fosforo: { min: "7.49", unit: "g/kg" },
    sodio: { min: "22.00", unit: "g/kg" },
    magnesio: { min: "1.69", unit: "g/kg" },
    enxofre: { min: "1.750", unit: "g/kg" },
    cobalto: { min: "9.00", unit: "mg/kg" },
    cobre: { min: "156.00", unit: "mg/kg" },
    iodo: { min: "10.00", unit: "mg/kg" },
    manganes: { min: "150.00", unit: "mg/kg" },
    selenio: { min: "2.80", unit: "mg/kg" },
    zinco: { min: "500.00", unit: "mg/kg" },
    ferro: { min: "450.00", unit: "mg/kg" },
    consumo_pb: { min: "200", vr: "550" },
    consumo_ndt: { min: "700", vr: "4000" },
    vitamina_a: { min: "20000", unit: "UI/kg" },
    vitamina_d: { min: "2500", unit: "UI/kg" },
    vitamina_e: { min: "350", unit: "UI/kg" },
  },
};

const EXEMPLO_SAL_MINERAL: { rotulo: Partial<RotuloData>; niveis: Record<string, any> } = {
  rotulo: {
    tipo_rotulo: "sal_mineral",
    nome_comercial: "SAL HGM 60",
    classificacao_label: "SUPLEMENTO MINERAL DE PRONTO USO PARA BOVINOS DE CORTE",
    especie_categoria: "BOVINOS DE CORTE",
    composicao_ingredientes: "CALCÁRIO CALCÍTICO, CLORETO DE SÓDIO (SAL COMUM), ENXOFRE VENTILADO (FLOR DE ENXOFRE), FOSFATO BICÁLCICO, IODATO DE CÁLCIO, ÓXIDO DE MAGNÉSIO, SULFATO DE ZINCO, SELENITO DE SÓDIO, SULFATO DE COBALTO, SULFATO DE COBRE, SULFATO DE MANGANÊS, CAULIM MICRO.",
    eventuais_substitutivos: "CARBONATO DE CÁLCIO, IODATO DE POTÁSSIO, MONÓXIDO DE MANGANÊS, ÓXIDO DE ZINCO.",
    niveis_garantia_texto: "Cálcio (Mín.) 120,00 g/kg; Cálcio (Máx.) 180,00 g/kg; Cobalto (Mín.) 54,00 mg/kg; Cobre (Mín.) 936,00 mg/kg; Enxofre (Mín.) 10,00 g/kg; Flúor (Máx.) 610,00 mg/kg; Fósforo (Mín.) 60,00 g/kg; Iodo (Mín.) 60,00 mg/kg; Magnésio (Mín.) 14,40 g/kg; Manganês (Mín.) 990,00 mg/kg; Selênio (Mín.) 16,80 mg/kg; Sódio (Mín.) 134,00 g/kg; Zinco (Mín.) 3.000,00 mg/kg.",
    indicacoes_uso: "Suplemento mineral pronto para uso para bovinos de corte.",
    modo_usar: "Fornecer Sal HGM 60 puro em cochos cobertos, com espaço satisfatório e sem interrupção do fornecimento. Consumo diário mínimo: 70g por 450kg de peso corporal.",
    precaucoes_restricoes: "Não há.",
    armazenamento: "Conservar em local seco e arejado, afastado de piso e paredes e de preferência sobre estrados, evitar presença de insetos e roedores.",
    peso_liquido: "30 kg",
    prazo_validade: "6 meses a partir da data de fabricação",
    razao_social: "Agro Campo EIRELI-M. E.",
    cnpj: "10.957.552/0001-46",
    endereco: "AV. CAETANO LUIZ DE SOUZA S/N QDA 8 LT 06 – JARDIM SANTA FÉ – ABADIANIA GO – CEP: 72.940-000",
    registro_mapa: "",
    exibir_tabela_consumo: true,
  },
  niveis: {
    calcio: { min: "120.00", max: "180.00", unit: "g/kg" },
    fosforo: { min: "60.00", unit: "g/kg" },
    sodio: { min: "134.00", unit: "g/kg" },
    magnesio: { min: "14.40", unit: "g/kg" },
    enxofre: { min: "10.00", unit: "g/kg" },
    cobalto: { min: "54.00", unit: "mg/kg" },
    cobre: { min: "936.00", unit: "mg/kg" },
    iodo: { min: "60.00", unit: "mg/kg" },
    manganes: { min: "990.00", unit: "mg/kg" },
    selenio: { min: "16.80", unit: "mg/kg" },
    zinco: { min: "3000.00", unit: "mg/kg" },
  },
};

function shouldShowConsumptionTable(tipo: string, especie: string): boolean {
  const tiposValidos = ["sal_mineral", "suplemento", "proteico", "proteico_energetico", "energetico"];
  const isBovino = especie.toLowerCase().includes("bovin");
  const classLower = (tipo || "").toLowerCase();
  const matchesClassificacao = tiposValidos.includes(classLower) ||
    classLower.includes("mineral") || classLower.includes("proteico") || classLower.includes("energetico");
  return matchesClassificacao && isBovino;
}

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

function calcVRPercent(qtdPer100g: number, vr: number): number | null {
  if (vr <= 0) return null;
  return (qtdPer100g / vr) * 100;
}

// Units that must NOT be auto-converted between g/mg
const SPECIAL_UNIT_PATTERNS = [
  /ufc/i, /ftu/i, /u\.?i\.?/i, /kui/i, /mcg/i, /ui/i,
];

function isSpecialUnit(unit: string): boolean {
  return SPECIAL_UNIT_PATTERNS.some(p => p.test(unit));
}

/**
 * Auto-adjust unit per MAPA convention:
 * - < 10 g/kg → show in mg/kg (×1000)
 * - ≥ 10 g/kg → show in g/kg (÷1000 if was mg)
 * - Exception: UFC, FTU, UI, KUI, mcg units are never converted
 */
function autoAdjustUnit(value: string, unit: string): { displayValue: string; displayUnit: string } {
  const u = (unit || "").trim().toLowerCase();
  // Don't touch special units (vitamins UI/KUI, enzymes FTU, yeasts UFC, mcg)
  if (isSpecialUnit(u)) return { displayValue: value, displayUnit: unit };

  const numVal = parseFloat(value.replace(/\./g, "").replace(",", "."));
  if (isNaN(numVal)) return { displayValue: value, displayUnit: unit };

  const isGperKg = u === "g/kg" || u === "g";
  const isMgPerKg = u === "mg/kg" || u === "mg";

  if (isGperKg && numVal < 10) {
    // Convert g → mg
    const mgVal = numVal * 1000;
    return { displayValue: mgVal.toFixed(2).replace(/\.?0+$/, ""), displayUnit: "mg/kg" };
  }
  if (isMgPerKg && numVal >= 10000) {
    // Convert mg → g (10000 mg/kg = 10 g/kg)
    const gVal = numVal / 1000;
    return { displayValue: gVal.toFixed(2).replace(/\.?0+$/, ""), displayUnit: "g/kg" };
  }

  return { displayValue: value, displayUnit: unit };
}

function formatNiveisIN22(niveisObj: Record<string, any>): string {
  const lines: string[] = [];
  Object.entries(niveisObj).forEach(([key, val]) => {
    if (key.startsWith("_") || key === "consumo_pb" || key === "consumo_ndt") return;
    const label = key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (typeof val === "object" && val !== null) {
      const { min, max, unit } = val as { min?: string; max?: string; unit?: string };
      const u = unit || "";
      if (min && max) {
        const adjMin = autoAdjustUnit(min, u);
        const adjMax = autoAdjustUnit(max, u);
        lines.push(`${label} (Mín.) ${adjMin.displayValue} ${adjMin.displayUnit}; ${label} (Máx.) ${adjMax.displayValue} ${adjMax.displayUnit}`);
      } else if (min) {
        const adj = autoAdjustUnit(min, u);
        lines.push(`${label} (Mín.) ${adj.displayValue} ${adj.displayUnit}`);
      } else if (max) {
        const adj = autoAdjustUnit(max, u);
        lines.push(`${label} (Máx.) ${adj.displayValue} ${adj.displayUnit}`);
      }
    } else if (val) lines.push(`${label}: ${val}`);
  });
  return lines.join("; ") + ".";
}

function extractFromProduto(prod: any): Partial<RotuloData> {
  const niveisObj = (prod.niveis_garantia as Record<string, any>) || {};
  const niveisText = formatNiveisIN22(niveisObj);
  const eventuais = niveisObj._eventuais_substitutos || "";
  const tipo = prod.classificacao || "racao";
  const classificacaoLabel = CLASSIFICACAO_FULL[tipo] || tipo.toUpperCase();
  const especie = `${prod.especie_alvo || ""}`.toUpperCase();
  const categoria = `${prod.categoria_animal || ""}`.toUpperCase();
  const especieCategoria = [especie, categoria].filter(Boolean).join(" – ");

  return {
    nome_comercial: prod.nome || "",
    tipo_rotulo: tipo,
    classificacao_label: `${classificacaoLabel} PARA ${especieCategoria}`,
    especie_categoria: especieCategoria,
    composicao_ingredientes: (prod.composicao || "").toUpperCase(),
    eventuais_substitutivos: eventuais,
    niveis_garantia_texto: niveisText,
    indicacoes_uso: prod.indicacoes || "",
    modo_usar: prod.modo_uso || "",
    precaucoes_restricoes: prod.precaucoes || "",
    peso_liquido: `${prod.peso_liquido || ""} ${prod.unidade_peso || "kg"}`.trim(),
    prazo_validade: prod.validade_meses ? `${prod.validade_meses} meses a partir da data de fabricação` : "6 meses a partir da data de fabricação",
    validade_dias: prod.validade_meses ? prod.validade_meses * 30 : 180,
    armazenamento: prod.armazenamento || "",
    registro_mapa: prod.registro_mapa || "",
    exibir_tabela_consumo: shouldShowConsumptionTable(tipo, prod.especie_alvo || ""),
  };
}

// ──── Consumption table UI sub-component ────
function TabelaConsumo({ niveisObj, onNiveisChange }: { niveisObj: Record<string, any>; onNiveisChange?: (n: Record<string, any>) => void }) {
  const consumoPB = niveisObj.consumo_pb;
  const consumoNDT = niveisObj.consumo_ndt;
  const consumoDiario = parseFloat(niveisObj._consumo_diario_g || "100");

  const updateNivel = (key: string, field: string, value: string) => {
    if (!onNiveisChange) return;
    const current = typeof niveisObj[key] === "object" ? niveisObj[key] : {};
    onNiveisChange({ ...niveisObj, [key]: { ...current, [field]: value } });
  };

  const setConsumoDiario = (val: string) => {
    if (!onNiveisChange) return;
    onNiveisChange({ ...niveisObj, _consumo_diario_g: val });
  };

  const fatorConsumo = consumoDiario / 1000; // e.g. 100g = 0.1 of 1kg

  const calcQtdConsumo = (key: string, refUnit: string): number | null => {
    const nutrient = niveisObj[key];
    if (!nutrient || typeof nutrient !== "object") return null;
    const rawVal = parseFloat(nutrient.min || nutrient.max || "0");
    if (!rawVal) return null;
    const nutUnit = (nutrient.unit || "").toLowerCase();
    // value is per kg, multiply by factor to get per consumoDiario grams
    let val = rawVal * fatorConsumo;
    // Convert units to match VR unit
    if (refUnit.includes("g/dia") && nutUnit.includes("mg")) val = val / 1000;
    if (refUnit.includes("mg/dia") && nutUnit.includes("g/")) val = val * 1000;
    return val;
  };

  const renderRow = (ref: typeof VR_MACRO[0], editable: boolean) => {
    const qtd = calcQtdConsumo(ref.key, ref.unit);
    const pct = qtd !== null ? calcVRPercent(qtd, ref.vr) : null;
    const nutrient = niveisObj[ref.key];
    const rawVal = nutrient && typeof nutrient === "object" ? (nutrient.min || "") : "";
    const rawUnit = nutrient && typeof nutrient === "object" ? (nutrient.unit || "") : "";

    return (
      <TableRow key={ref.key}>
        <TableCell className="py-1 text-xs">{ref.mineral}</TableCell>
        <TableCell className="py-1 text-xs text-center">
          {editable ? (
            <Input className="h-6 text-xs w-20 text-center mx-auto" value={rawVal}
              onChange={(e) => updateNivel(ref.key, "min", e.target.value)} />
          ) : rawVal || "–"}
        </TableCell>
        <TableCell className="py-1 text-xs text-center">{rawUnit || "–"}</TableCell>
        <TableCell className="py-1 text-xs text-center">{ref.vr}</TableCell>
        <TableCell className="py-1 text-xs text-center">{qtd !== null ? qtd.toFixed(2) : "–"}</TableCell>
        <TableCell className="py-1 text-xs text-center font-semibold">{pct !== null ? `${pct.toFixed(1)}%` : "–"}</TableCell>
      </TableRow>
    );
  };

  const tableHeader = (
    <TableHeader>
      <TableRow>
        <TableHead className="py-1 text-xs">Nutriente</TableHead>
        <TableHead className="py-1 text-xs text-center">Teor/kg</TableHead>
        <TableHead className="py-1 text-xs text-center">Unid.</TableHead>
        <TableHead className="py-1 text-xs text-center">VR¹ (dia)</TableHead>
        <TableHead className="py-1 text-xs text-center">Qtd/{consumoDiario}g</TableHead>
        <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
      </TableRow>
    </TableHeader>
  );

  const editable = !!onNiveisChange;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
        <Label className="text-xs font-semibold whitespace-nowrap">Consumo diário recomendado (g):</Label>
        <Input
          type="number" min={1} max={5000}
          className="h-8 w-24 text-xs"
          value={niveisObj._consumo_diario_g || "100"}
          onChange={(e) => setConsumoDiario(e.target.value)}
          disabled={!editable}
        />
        <span className="text-[10px] text-muted-foreground">gramas de suplemento/animal/dia</span>
      </div>

      {(consumoPB || consumoNDT) && (
        <div>
          <p className="text-xs font-bold mb-1">PARÂMETROS NUTRICIONAIS</p>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="py-1 text-xs">Parâmetro</TableHead>
                <TableHead className="py-1 text-xs text-center">Teor/kg</TableHead>
                <TableHead className="py-1 text-xs text-center">Unid.</TableHead>
                <TableHead className="py-1 text-xs text-center">VR¹ (g/dia)</TableHead>
                <TableHead className="py-1 text-xs text-center">Qtd/{consumoDiario}g</TableHead>
                <TableHead className="py-1 text-xs text-center">% do VR</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {consumoPB && typeof consumoPB === "object" && (() => {
                const val = parseFloat(consumoPB.min || "0");
                const vrPB = parseFloat(consumoPB.vr || "550");
                const qtd = val * fatorConsumo;
                const pct = vrPB > 0 ? (qtd / vrPB) * 100 : 0;
                return (
                  <TableRow>
                    <TableCell className="py-1 text-xs">Proteína Bruta</TableCell>
                    <TableCell className="py-1 text-xs text-center">
                      {editable ? <Input className="h-6 text-xs w-20 text-center mx-auto" value={consumoPB.min || ""} onChange={(e) => updateNivel("consumo_pb", "min", e.target.value)} /> : consumoPB.min || "–"}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-center">g/kg</TableCell>
                    <TableCell className="py-1 text-xs text-center">
                      {editable ? <Input className="h-6 text-xs w-20 text-center mx-auto" value={consumoPB.vr || "550"} onChange={(e) => updateNivel("consumo_pb", "vr", e.target.value)} /> : vrPB}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-center">{val ? qtd.toFixed(1) : "–"}</TableCell>
                    <TableCell className="py-1 text-xs text-center font-semibold">{val ? `${pct.toFixed(1)}%` : "–"}</TableCell>
                  </TableRow>
                );
              })()}
              {consumoNDT && typeof consumoNDT === "object" && (() => {
                const val = parseFloat(consumoNDT.min || "0");
                const vrNDT = parseFloat(consumoNDT.vr || "4000");
                const qtd = val * fatorConsumo;
                const pct = vrNDT > 0 ? (qtd / vrNDT) * 100 : 0;
                return (
                  <TableRow>
                    <TableCell className="py-1 text-xs">NDT</TableCell>
                    <TableCell className="py-1 text-xs text-center">
                      {editable ? <Input className="h-6 text-xs w-20 text-center mx-auto" value={consumoNDT.min || ""} onChange={(e) => updateNivel("consumo_ndt", "min", e.target.value)} /> : consumoNDT.min || "–"}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-center">g/kg</TableCell>
                    <TableCell className="py-1 text-xs text-center">
                      {editable ? <Input className="h-6 text-xs w-20 text-center mx-auto" value={consumoNDT.vr || "4000"} onChange={(e) => updateNivel("consumo_ndt", "vr", e.target.value)} /> : vrNDT}
                    </TableCell>
                    <TableCell className="py-1 text-xs text-center">{val ? qtd.toFixed(1) : "–"}</TableCell>
                    <TableCell className="py-1 text-xs text-center font-semibold">{val ? `${pct.toFixed(1)}%` : "–"}</TableCell>
                  </TableRow>
                );
              })()}
            </TableBody>
          </Table>
        </div>
      )}

      <div>
        <p className="text-xs font-bold mb-1">MACROMINERAIS (g/dia)</p>
        <Table>{tableHeader}<TableBody>{VR_MACRO.map(r => renderRow(r, editable))}</TableBody></Table>
      </div>
      <div>
        <p className="text-xs font-bold mb-1">MICROMINERAIS (mg/dia)</p>
        <Table>{tableHeader}<TableBody>{VR_MICRO.map(r => renderRow(r, editable))}</TableBody></Table>
      </div>
      <div>
        <p className="text-xs font-bold mb-1">VITAMINAS (UI/dia)</p>
        <Table>{tableHeader}<TableBody>{VR_VITAMINAS.map(r => renderRow(r, editable))}</TableBody></Table>
      </div>
      <p className="text-[9px] text-muted-foreground italic">
 ¹ Valor diário de referência para manutenção de um animal de 450 kg de peso corporal (referência nutricional).
 </p>
    </div>
  );
}

function formatDateBR(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function calcDataVencimento(dataFab: string, validadeDias: number): string {
  if (!dataFab) return "";
  const date = new Date(dataFab + "T00:00:00");
  date.setDate(date.getDate() + validadeDias);
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}/${m}/${y}`;
}

// ──── Build print-ready HTML matching the uploaded label models ────
const escHtml = (s: any): string =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

function buildPrintHTML(rotulo: RotuloData, niveisObj: Record<string, any>): string {
  const hasTable = rotulo.exibir_tabela_consumo;

  const buildTableHTML = () => {
    const thS = 'border:1px solid #000;padding:2px 4px;font-size:6.5pt;text-align:center;font-weight:bold;background:#fff;';
    const cellS = 'border:1px solid #000;padding:1px 3px;font-size:6.5pt;text-align:center;';
    const leftS = cellS + 'text-align:left;';

    const consumoPB = niveisObj.consumo_pb;
    const consumoNDT = niveisObj.consumo_ndt;
    const consumoDiario = parseFloat(niveisObj._consumo_diario_g || "100");
    const fator = consumoDiario / 1000;

    let html = `
      <div style="padding:4px 6px;">
        <p style="font-size:8pt;font-weight:bold;text-align:center;margin:0 0 4px;text-decoration:underline;">TABELA VALOR DE REFERÊNCIA</p>
        <p style="font-size:6pt;text-align:center;margin:0 0 4px;">(Consumo diário: ${consumoDiario} g de suplemento)</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:4px;">
          <thead><tr>
            <th style="${thS}">VALOR<br/>GARANTIA</th>
            <th style="${thS}">VALOR<br/>REFERÊNCIA<br/>(VR)¹</th>
            <th style="${thS}">QUANTIDADE<br/>POR ${consumoDiario} G DE<br/>SUPLEMENTO</th>
            <th style="${thS}">% DO VR</th>
          </tr></thead>
          <tbody>`;

    if (consumoPB && typeof consumoPB === "object" && parseFloat(consumoPB.min || "0")) {
      const vrPB = parseFloat(consumoPB.vr || "550");
      const qtd = parseFloat(consumoPB.min) * fator;
      const pct = ((qtd / vrPB) * 100).toFixed(2);
      html += `<tr><td style="${leftS}">Proteína Bruta (g/dia)</td><td style="${cellS}">${vrPB}</td><td style="${cellS}">${qtd.toFixed(1)}</td><td style="${cellS}">${pct}%</td></tr>`;
    }
    if (consumoNDT && typeof consumoNDT === "object" && parseFloat(consumoNDT.min || "0")) {
      const vrNDT = parseFloat(consumoNDT.vr || "4000");
      const qtd = parseFloat(consumoNDT.min) * fator;
      const pct = ((qtd / vrNDT) * 100).toFixed(2);
      html += `<tr><td style="${leftS}">NDT (g/dia)</td><td style="${cellS}">${vrNDT}</td><td style="${cellS}">${qtd.toFixed(1)}</td><td style="${cellS}">${pct}%</td></tr>`;
    }
    html += `</tbody></table>`;

    const calcPrint = (key: string, refUnit: string): number | null => {
      const nutrient = niveisObj[key];
      if (!nutrient || typeof nutrient !== "object") return null;
      const rawVal = parseFloat(nutrient.min || nutrient.max || "0");
      if (!rawVal) return null;
      const nutUnit = (nutrient.unit || "").toLowerCase();
      let val = rawVal * fator;
      if (refUnit.includes("g/dia") && nutUnit.includes("mg")) val = val / 1000;
      if (refUnit.includes("mg/dia") && nutUnit.includes("g/")) val = val * 1000;
      return val;
    };

    const renderGroup = (title: string, refs: typeof VR_MACRO) => {
      let g = `<p style="font-size:6.5pt;font-weight:bold;margin:4px 0 2px;">${title}</p>
        <table style="width:100%;border-collapse:collapse;margin-bottom:2px;">
        <tbody>`;
      refs.forEach(ref => {
        const qtd = calcPrint(ref.key, ref.unit);
        const pct = qtd !== null ? calcVRPercent(qtd, ref.vr) : null;
        g += `<tr>
          <td style="${leftS}">${ref.mineral}</td>
          <td style="${cellS}">${ref.vr}</td>
          <td style="${cellS}">${qtd !== null ? qtd.toFixed(2) : '–'}</td>
          <td style="${cellS}">${pct !== null ? pct.toFixed(1) + '%' : '–'}</td>
        </tr>`;
      });
      g += `</tbody></table>`;
      return g;
    };

    html += renderGroup("MACROMINERAIS (g/dia)", VR_MACRO);
    html += renderGroup("MICROMINERAIS (mg/dia)", VR_MICRO);
    html += renderGroup("VITAMINAS (UI/dia)", VR_VITAMINAS);
    html += `<p style="font-size:5.5pt;font-style:italic;margin:3px 0 0;">¹ Valor diário de referência para manutenção de um animal de 450 kg de peso corporal (NRC / IN 12/2004)</p>`;
    html += `</div>`;
    return html;
  };

  const section = (title: string, content: string) => {
    if (!content) return '';
    return `<p style="font-size:7pt;font-weight:bold;margin:4px 0 1px;">${escHtml(title)}</p><p style="font-size:6.5pt;line-height:1.4;margin:0 0 2px;text-align:justify;">${escHtml(content)}</p>`;
  };

  const bodyContent = `
    ${section('COMPOSIÇÃO BÁSICA:', rotulo.composicao_ingredientes)}
    ${section('EVENTUAIS SUBSTITUTIVOS:', rotulo.eventuais_substitutivos)}
    ${section('NÍVEIS DE GARANTIA POR KG DO PRODUTO:', rotulo.niveis_garantia_texto)}
    ${section('INDICAÇÕES DE USO:', rotulo.indicacoes_uso)}
    ${section('MODO DE USAR:', rotulo.modo_usar)}
    ${section('RESTRIÇÕES E OUTRAS RECOMENDAÇÕES:', rotulo.precaucoes_restricoes)}
    ${section('CONDIÇÕES DE CONSERVAÇÃO:', rotulo.armazenamento)}
  `;

  const leftColumnWidth = hasTable ? '55%' : '100%';

  return `
    <div style="width:${rotulo.largura_mm - 4}mm;font-family:Arial,Helvetica,sans-serif;border:2px solid #000;box-sizing:border-box;background:#fff;color:#000;">
      <!-- HEADER -->
      <div style="display:flex;border-bottom:2px solid #000;">
        <div style="flex:1;padding:6px 10px;border-right:1px solid #000;">
          <p style="font-size:7.5pt;text-align:center;margin:0 0 4px;font-weight:bold;">${escHtml(rotulo.classificacao_label)}</p>
          <p style="font-size:18pt;font-weight:900;text-align:center;margin:4px 0;letter-spacing:1px;">${escHtml(rotulo.nome_comercial)}</p>
        </div>
        <div style="width:30%;padding:5px 8px;font-size:6.5pt;line-height:1.5;border-left:1px solid #000;">
          <p style="font-weight:bold;font-size:7pt;margin:0 0 1px;text-align:right;">Fabricado por:</p>
          <p style="margin:0;text-align:right;">${escHtml(rotulo.razao_social)}</p>
          <p style="margin:0;text-align:right;">${escHtml(rotulo.endereco)}</p>
          <p style="margin:0;text-align:right;">CNPJ: ${escHtml(rotulo.cnpj)}</p>
          <p style="margin:0;font-weight:bold;text-align:right;">INDÚSTRIA BRASILEIRA</p>
        </div>
      </div>

      <!-- BODY -->
      <div style="display:flex;">
        <!-- Left column: text content -->
        <div style="width:${leftColumnWidth};padding:6px 10px;${hasTable ? 'border-right:1px solid #000;' : ''}">
          ${bodyContent}
        </div>

        ${hasTable ? `
          <!-- Right column: consumption table -->
          <div style="width:45%;">
            ${buildTableHTML()}
          </div>
        ` : ''}
      </div>

      <!-- FOOTER -->
      <div style="border-top:1px solid #000;padding:4px 10px;font-size:6.5pt;">
        <div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:2px;">
          <span>${rotulo.lote ? `LOTE: ${escHtml(rotulo.lote)}` : escHtml(rotulo.lote_placeholder)}</span>
          <span>${rotulo.data_fabricacao ? `FAB: ${escHtml(formatDateBR(rotulo.data_fabricacao))}` : escHtml(rotulo.fabricacao_placeholder)}</span>
          <span>${rotulo.data_fabricacao && rotulo.validade_dias ? `VAL: ${escHtml(calcDataVencimento(rotulo.data_fabricacao, rotulo.validade_dias))}` : 'VAL: ___/___/______'}</span>
          ${rotulo.rt_nome ? `<span>RT: ${escHtml(rotulo.rt_nome)} – CRMV: ${escHtml(rotulo.rt_crmv)}</span>` : ''}
          ${rotulo.sac_contato ? `<span>SAC: ${escHtml(rotulo.sac_contato)}</span>` : ''}
        </div>
        <div style="text-align:center;margin-top:6px;padding-top:4px;border-top:0.5pt solid #666;">
          <p style="font-weight:bold;font-size:8pt;margin:2px 0;color:#000;">INDÚSTRIA BRASILEIRA</p>
          <p style="margin:1px 0;font-size:7pt;">
            ${rotulo.registro_mapa
              ? 'Produto Registrado no Ministério da Agricultura e Pecuária.'
              : 'Produto Isento de Registro no Ministério da Agricultura e Pecuária.'
            }
          </p>
        </div>
      </div>
    </div>
  `;
}

// ──── Zebra Config Dialog ────
function ZebraConfigDialog({ config, onChange }: { config: ZebraConfig; onChange: (c: ZebraConfig) => void }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="w-4 h-4 mr-1" /> Config. Zebra
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-sm">Configuração da Impressora Zebra</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Resolução (DPI)</Label>
              <Select value={String(config.dpi)} onValueChange={(v) => onChange({ ...config, dpi: parseInt(v) as 203 | 300 })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="203">203 DPI (padrão)</SelectItem>
                  <SelectItem value="300">300 DPI (alta resolução)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Velocidade (pol/s)</Label>
              <Select value={String(config.velocidade)} onValueChange={(v) => onChange({ ...config, velocidade: parseInt(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2 (lento/qualidade)</SelectItem>
                  <SelectItem value="4">4 (padrão)</SelectItem>
                  <SelectItem value="6">6 (rápido)</SelectItem>
                  <SelectItem value="8">8 (muito rápido)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Largura Etiqueta (mm)</Label>
              <Input type="number" value={config.largura_mm} onChange={(e) => onChange({ ...config, largura_mm: parseInt(e.target.value) || 200 })} />
            </div>
            <div>
              <Label className="text-xs">Altura Etiqueta (mm)</Label>
              <Input type="number" value={config.altura_mm} onChange={(e) => onChange({ ...config, altura_mm: parseInt(e.target.value) || 100 })} />
            </div>
            <div>
              <Label className="text-xs">Escurecimento (0-30)</Label>
              <Input type="number" min={0} max={30} value={config.escurecimento} onChange={(e) => onChange({ ...config, escurecimento: parseInt(e.target.value) || 15 })} />
            </div>
          </div>

          <div className="border-t pt-3">
            <Label className="text-xs font-semibold">Método de Envio</Label>
            <Select value={config.conexao} onValueChange={(v) => onChange({ ...config, conexao: v as any })}>
              <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="download">Download arquivo .zpl</SelectItem>
                <SelectItem value="rede">Envio direto via rede (TCP/IP)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {config.conexao === "rede" && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">IP da Impressora</Label>
                <Input value={config.ip_impressora} onChange={(e) => onChange({ ...config, ip_impressora: e.target.value })} placeholder="192.168.1.100" />
              </div>
              <div>
                <Label className="text-xs">Porta</Label>
                <Input type="number" value={config.porta} onChange={(e) => onChange({ ...config, porta: parseInt(e.target.value) || 9100 })} />
              </div>
            </div>
          )}

          <div className="bg-muted/50 rounded p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-foreground">Impressoras compatíveis:</p>
            <p>• ZT230/ZT231 — Industrial de mesa</p>
            <p>• ZT410/ZT420 — Industrial alto volume</p>
            <p>• ZD420/ZD620 — Desktop compacta</p>
            <p>• GC420/GK420 — Econômica</p>
            <p className="mt-2">O ZPL gerado é compatível com qualquer impressora Zebra que aceite linguagem ZPL II.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──── ZPL Preview Dialog ────
function ZPLPreviewDialog({ zpl }: { zpl: string }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Eye className="w-4 h-4 mr-1" /> Ver ZPL
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="text-sm">Código ZPL Gerado</DialogTitle>
        </DialogHeader>
        <div className="overflow-auto max-h-[60vh]">
          <pre className="bg-muted p-4 rounded text-xs font-mono whitespace-pre-wrap break-all">
            {zpl}
          </pre>
        </div>
        <div className="flex gap-2 justify-end">
          <Button size="sm" variant="outline" onClick={() => { navigator.clipboard.writeText(zpl); toast.success("ZPL copiado!"); }}>
            Copiar ZPL
          </Button>
          <Button size="sm" variant="outline" onClick={() => {
            const url = `http://labelary.com/viewer.html?zpl=${encodeURIComponent(zpl)}`;
            window.open(url, "_blank");
          }}>
            Testar no Labelary
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ──── Main component ────
export default function RotuloEditor({ produtoId, produtoNome }: Props) {
  const { user } = useAuth();
  const sessionKey = `rotulo_draft_${produtoId}`;
  const niveisSessionKey = `rotulo_niveis_draft_${produtoId}`;

  const [rotulo, setRotulo] = useState<RotuloData>(() => {
    const draft = sessionStorage.getItem(sessionKey);
    if (draft) { try { return { ...EMPTY_ROTULO, ...sanitizeRotuloDraft(JSON.parse(draft)) }; } catch {} }
    return { ...EMPTY_ROTULO, nome_comercial: produtoNome };
  });
  const [rotuloId, setRotuloId] = useState<string | null>(null);
  const [niveisObj, setNiveisObj] = useState<Record<string, any>>(() => {
    const draft = sessionStorage.getItem(niveisSessionKey);
    if (draft) { try { return JSON.parse(draft); } catch {} }
    return {};
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [zebraConfig, setZebraConfig] = useState<ZebraConfig>(() => {
    const saved = localStorage.getItem("zebra_config");
    return saved ? JSON.parse(saved) : DEFAULT_ZEBRA;
  });
  const [qtdEtiquetas, setQtdEtiquetas] = useState(1);
  const printRef = useRef<HTMLDivElement>(null);

  // Persist draft to sessionStorage (survives navigation, lost on tab close)
  useEffect(() => {
    sessionStorage.setItem(sessionKey, JSON.stringify(rotulo));
  }, [rotulo, sessionKey]);

  useEffect(() => {
    sessionStorage.setItem(niveisSessionKey, JSON.stringify(niveisObj));
  }, [niveisObj, niveisSessionKey]);

  useEffect(() => { loadRotulo(); }, [produtoId]);

  useEffect(() => {
    localStorage.setItem("zebra_config", JSON.stringify(zebraConfig));
  }, [zebraConfig]);

  async function loadRotulo() {
    setLoading(true);
    const { data: prod } = await supabase.from("produtos").select("niveis_garantia, classificacao, especie_alvo, validade_meses").eq("id", produtoId).single();
    if (prod) setNiveisObj((prod.niveis_garantia as Record<string, any>) || {});

    const { data } = await supabase.from("rotulos").select("*").eq("produto_id", produtoId).maybeSingle();

    if (data) {
      setRotuloId(data.id);
      const autoTabela = prod ? shouldShowConsumptionTable(prod.classificacao, prod.especie_alvo || "") : false;
      setRotulo({
        ...EMPTY_ROTULO,
        ...sanitizeRotuloDraft({
        tipo_rotulo: data.tipo_rotulo || "racao",
        nome_comercial: data.nome_comercial || produtoNome,
        classificacao_label: data.classificacao_label || "",
        especie_categoria: data.especie_categoria || "",
        composicao_ingredientes: data.composicao_ingredientes || "",
        eventuais_substitutivos: data.eventuais_substitutivos || "",
        niveis_garantia_texto: data.niveis_garantia_texto || "",
        indicacoes_uso: data.indicacoes_uso || "",
        modo_usar: data.modo_usar || "",
        precaucoes_restricoes: data.precaucoes_restricoes || "",
        peso_liquido: data.peso_liquido || "",
        prazo_validade: data.prazo_validade || "",
        armazenamento: data.armazenamento || "",
        lote_placeholder: data.lote_placeholder || "LOTE: ___________",
        fabricacao_placeholder: data.fabricacao_placeholder || "FAB: ___/___/______",
        registro_mapa: data.registro_mapa || "",
        razao_social: data.razao_social || "",
        cnpj: data.cnpj || "",
        endereco: data.endereco || "",
        rt_nome: data.rt_nome || "",
        rt_crmv: data.rt_crmv || "",
        sac_contato: data.sac_contato || "",
        largura_mm: data.largura_mm || 200,
        altura_mm: data.altura_mm || 100,
        exibir_tabela_consumo: autoTabela,
        lote: "",
        data_fabricacao: "",
        validade_dias: prod?.validade_meses ? prod.validade_meses * 30 : 180,
        }),
      });
    } else {
      await syncFromProduto(true);
    }
    setLoading(false);
  }

  async function syncFromProduto(silent = false) {
    setSyncing(true);
    const { data: prod } = await supabase.from("produtos").select("*").eq("id", produtoId).single();
    if (prod) {
      const extracted = sanitizeRotuloDraft(extractFromProduto(prod));
      setRotulo((prev) => ({ ...prev, ...extracted }));
      setNiveisObj((prod.niveis_garantia as Record<string, any>) || {});
      if (!silent) toast.success("Dados sincronizados do cadastro do produto!");
    }
    setSyncing(false);
  }

  async function handleSave() {
    if (!user) return;
    setSaving(true);
    const { exibir_tabela_consumo, lote, data_fabricacao, validade_dias, ...rotuloToSave } = rotulo;
    const payload = { user_id: user.id, produto_id: produtoId, ...rotuloToSave };

    const { error } = rotuloId
      ? await supabase.from("rotulos").update(payload).eq("id", rotuloId)
      : await supabase.from("rotulos").insert(payload).select("id").single().then(({ data, error }) => {
          if (data) setRotuloId(data.id);
          return { error };
        });

    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Rótulo salvo!");
      sessionStorage.removeItem(sessionKey);
      sessionStorage.removeItem(niveisSessionKey);
    }
    setSaving(false);
  }

  function generateZPL(): string {
    const dpmm = zebraConfig.dpi === 300 ? 12 : 8; // dots per mm
    const w = zebraConfig.largura_mm || rotulo.largura_mm;
    const h = zebraConfig.altura_mm || rotulo.altura_mm;
    const dotsW = w * dpmm;
    const dotsH = h * dpmm;
    const hasTable = rotulo.exibir_tabela_consumo;
    const textColW = hasTable ? Math.floor(dotsW * 0.55) : dotsW;
    const tableColX = textColW + 10;
    const x = 20;
    const maxFB = textColW - 40;

    // Scale font sizes based on DPI
    const s = dpmm === 12 ? 1.5 : 1;

    const lines: string[] = [];
    let y = 20;

    const addLine = (text: string, fontH: number, fontW: number, maxLines = 1, customX = x, customFB = maxFB) => {
      if (!text) return;
      const fH = Math.round(fontH * s);
      const fW = Math.round(fontW * s);
      if (maxLines > 1) {
        lines.push(`^FO${customX},${y}^A0N,${fH},${fW}^FB${customFB},${maxLines},,^FD${text}^FS`);
        y += fH * maxLines + 2;
      } else {
        lines.push(`^FO${customX},${y}^A0N,${fH},${fW}^FD${text}^FS`);
        y += fH + 4;
      }
    };

    const addSep = () => { lines.push(`^FO${x},${y}^GB${maxFB},1,1^FS`); y += 6; };

    const addSection = (title: string, content: string, contentLines = 3) => {
      if (!content) return;
      addLine(title, 16, 16);
      y -= 2;
      addLine(content, 14, 14, contentLines);
    };

    // ── Header ──
    const mfX = hasTable ? tableColX : Math.floor(dotsW * 0.65);
    lines.push(`^FO${x},${y}^A0N,${Math.round(16 * s)},${Math.round(16 * s)}^FB${textColW - 40},1,,^FD${rotulo.classificacao_label}^FS`);
    lines.push(`^FO${mfX},${y}^A0N,${Math.round(14 * s)},${Math.round(14 * s)}^FDFabricado por:^FS`);
    y += Math.round(18 * s);
    lines.push(`^FO${x},${y}^A0N,${Math.round(28 * s)},${Math.round(28 * s)}^FB${textColW - 40},1,,^FD${rotulo.nome_comercial}^FS`);
    lines.push(`^FO${mfX},${y}^A0N,${Math.round(12 * s)},${Math.round(12 * s)}^FD${rotulo.razao_social}^FS`);
    y += Math.round(16 * s);
    lines.push(`^FO${mfX},${y}^A0N,${Math.round(12 * s)},${Math.round(12 * s)}^FD${rotulo.endereco}^FS`);
    y += Math.round(14 * s);
    lines.push(`^FO${mfX},${y}^A0N,${Math.round(12 * s)},${Math.round(12 * s)}^FDCNPJ: ${rotulo.cnpj}^FS`);
    y += Math.round(14 * s);
    lines.push(`^FO${mfX},${y}^A0N,${Math.round(12 * s)},${Math.round(12 * s)}^FDINDUSTRIA BRASILEIRA^FS`);
    y = Math.round(90 * s);

    // Full separator
    lines.push(`^FO${x},${y}^GB${dotsW - 40},2,2^FS`);
    y += 8;

    // ── Body ──
    addSection("COMPOSICAO BASICA:", rotulo.composicao_ingredientes, 4);
    addSection("EVENTUAIS SUBSTITUTIVOS:", rotulo.eventuais_substitutivos, 2);
    addSection("NIVEIS DE GARANTIA POR KG DO PRODUTO:", rotulo.niveis_garantia_texto, 5);
    addSection("INDICACOES DE USO:", rotulo.indicacoes_uso, 2);
    addSection("MODO DE USAR:", rotulo.modo_usar, 3);
    addSection("RESTRICOES E OUTRAS RECOMENDACOES:", rotulo.precaucoes_restricoes, 2);
    if (rotulo.armazenamento) addSection("CONDICOES DE CONSERVACAO:", rotulo.armazenamento, 1);

    addSep();

    // Footer info
    const loteZpl = rotulo.lote ? `LOTE: ${rotulo.lote}` : rotulo.lote_placeholder;
    const fabZpl = rotulo.data_fabricacao ? `FAB: ${formatDateBR(rotulo.data_fabricacao)}` : rotulo.fabricacao_placeholder;
    const valZpl = rotulo.data_fabricacao && rotulo.validade_dias ? `VAL: ${calcDataVencimento(rotulo.data_fabricacao, rotulo.validade_dias)}` : 'VAL: ___/___/______';
    lines.push(`^FO${x},${y}^A0N,${Math.round(14 * s)},${Math.round(14 * s)}^FD${loteZpl}^FS`);
    lines.push(`^FO${Math.floor(textColW / 3)},${y}^A0N,${Math.round(14 * s)},${Math.round(14 * s)}^FD${fabZpl}^FS`);
    lines.push(`^FO${Math.floor(textColW * 2 / 3)},${y}^A0N,${Math.round(14 * s)},${Math.round(14 * s)}^FD${valZpl}^FS`);
    y += Math.round(18 * s);
    if (rotulo.rt_nome) { addLine(`RT: ${rotulo.rt_nome} - CRMV: ${rotulo.rt_crmv}`, 12, 12); }
    if (rotulo.sac_contato) { addLine(`SAC: ${rotulo.sac_contato}`, 12, 12); }

    addSep();
    addLine("INDUSTRIA BRASILEIRA", 14, 14);
    addLine(rotulo.registro_mapa ? "Produto Registrado no MAPA" : "Produto Isento de Registro no Ministerio da Agricultura, Pecuaria e Abastecimento.", 12, 12, 2);

    // ── Right column: consumption table (ZPL grid) ──
    if (hasTable) {
      const tX = tableColX;
      const tW = dotsW - tableColX - 20;
      let tY = Math.round(96 * s);
      const colW = [Math.floor(tW * 0.28), Math.floor(tW * 0.24), Math.floor(tW * 0.24), Math.floor(tW * 0.24)];

      lines.push(`^FO${tX},${tY}^A0N,${Math.round(16 * s)},${Math.round(16 * s)}^FB${tW},1,,^FDTABELA VALOR DE REFERENCIA^FS`);
      tY += Math.round(20 * s);

      const headers = ["GARANTIA", "VR", "QTD/100G", "% VR"];
      let cx = tX;
      headers.forEach((h, i) => {
        lines.push(`^FO${cx},${tY}^A0N,${Math.round(12 * s)},${Math.round(10 * s)}^FB${colW[i]},1,,^FD${h}^FS`);
        cx += colW[i];
      });
      tY += Math.round(16 * s);
      lines.push(`^FO${tX},${tY}^GB${tW},1,1^FS`);
      tY += 4;

      // PB / NDT
      const consumoPB = niveisObj.consumo_pb;
      const consumoNDT = niveisObj.consumo_ndt;
      if (consumoPB && typeof consumoPB === "object" && parseFloat(consumoPB.min || "0")) {
        const vrVal = consumoPB.vr || "550";
        const v = (parseFloat(consumoPB.min) / 10).toFixed(0);
        const pct = ((parseFloat(consumoPB.min) / 10 / parseFloat(vrVal)) * 100).toFixed(2);
        lines.push(`^FO${tX},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FDConsumo PB (g/dia)^FS`);
        lines.push(`^FO${tX + colW[0]},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${vrVal}^FS`);
        lines.push(`^FO${tX + colW[0] + colW[1]},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${v}^FS`);
        lines.push(`^FO${tX + colW[0] + colW[1] + colW[2]},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${pct}^FS`);
        tY += Math.round(14 * s);
      }
      if (consumoNDT && typeof consumoNDT === "object" && parseFloat(consumoNDT.min || "0")) {
        const vrVal = consumoNDT.vr || "4000";
        const v = (parseFloat(consumoNDT.min) / 10).toFixed(0);
        const pct = ((parseFloat(consumoNDT.min) / 10 / parseFloat(vrVal)) * 100).toFixed(2);
        lines.push(`^FO${tX},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FDConsumo NDT (g/dia)^FS`);
        lines.push(`^FO${tX + colW[0]},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${vrVal}^FS`);
        lines.push(`^FO${tX + colW[0] + colW[1]},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${v}^FS`);
        lines.push(`^FO${tX + colW[0] + colW[1] + colW[2]},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${pct}^FS`);
        tY += Math.round(14 * s);
      }

      // Minerals & Vitamins groups
      const allGroups = [
        { label: "MACROMINERAIS (g/dia)", refs: VR_MACRO },
        { label: "MICROMINERAIS (mg/dia)", refs: VR_MICRO },
        { label: "VITAMINAS (UI/dia)", refs: VR_VITAMINAS },
      ];

      allGroups.forEach(grp => {
        tY += 4;
        lines.push(`^FO${tX},${tY}^A0N,${Math.round(12 * s)},${Math.round(10 * s)}^FD${grp.label}^FS`);
        tY += Math.round(14 * s);
        grp.refs.forEach(ref => {
          const qtd = calcQtdPer100g(niveisObj, ref.key, ref.unit);
          const pct = qtd !== null ? calcVRPercent(qtd, ref.vr) : null;
          let cx2 = tX;
          lines.push(`^FO${cx2},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${ref.mineral}^FS`);
          cx2 += colW[0];
          lines.push(`^FO${cx2},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${ref.vr}^FS`);
          cx2 += colW[1];
          lines.push(`^FO${cx2},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${qtd !== null ? qtd.toFixed(2) : '--'}^FS`);
          cx2 += colW[2];
          lines.push(`^FO${cx2},${tY}^A0N,${Math.round(11 * s)},${Math.round(10 * s)}^FD${pct !== null ? pct.toFixed(2) : '--'}^FS`);
          tY += Math.round(13 * s);
        });
      });

      tY += 4;
      lines.push(`^FO${tX},${tY}^A0N,${Math.round(10 * s)},${Math.round(9 * s)}^FB${tW},2,,^FD1: VR para manutencao de animal de 450 kg^FS`);
    }

    const finalH = Math.max(dotsH, y + 20);

    // Build ZPL with printer config
    let zpl = `^XA\n`;
    zpl += `^PW${dotsW}\n`;
    zpl += `^LL${finalH}\n`;
    zpl += `^PR${zebraConfig.velocidade}\n`;
    zpl += `~SD${zebraConfig.escurecimento.toString().padStart(2, '0')}\n`;
    zpl += `^CF0,${Math.round(16 * s)}\n`;
    zpl += lines.join("\n") + "\n";

    // Repeat for quantity
    if (qtdEtiquetas > 1) {
      zpl += `^PQ${qtdEtiquetas}\n`;
    }

    zpl += `^XZ`;
    return zpl;
  }

  function downloadZPL() {
    const zpl = generateZPL();
    const blob = new Blob([zpl], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Rotulo_${rotulo.nome_comercial.replace(/\s+/g, "_")}.zpl`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Arquivo ZPL baixado! Envie para sua impressora Zebra.");
  }

  async function enviarParaImpressora() {
    if (zebraConfig.conexao === "download") {
      downloadZPL();
      return;
    }

    const zpl = generateZPL();

    if (zebraConfig.conexao === "rede") {
      // For network printing, we create a download with instructions
      toast.info(
        `Para imprimir via rede, envie o arquivo ZPL para ${zebraConfig.ip_impressora}:${zebraConfig.porta}.\n\nNo terminal: echo "${zpl.substring(0, 30)}..." | nc ${zebraConfig.ip_impressora} ${zebraConfig.porta}`,
        { duration: 8000 }
      );
      downloadZPL();
      return;
    }

    downloadZPL();
  }

  async function handlePrint() {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    const html = buildPrintHTML(rotulo, niveisObj);
    // Selo sobre o conteúdo exibido do rótulo (HTML de impressão) + metadados.
    const carimbo = await gerarCarimbo({
      documentoTipo: "Rótulo Comercial",
      documentoId: rotulo.nome_comercial,
      conteudo: html,
    });
    printWindow.document.write(`
      <html><head><title>Rótulo – ${rotulo.nome_comercial}</title>
      <style>
        @page { size: ${rotulo.largura_mm}mm ${rotulo.altura_mm}mm; margin: 2mm; }
        body { margin: 0; padding: 0; background: #fff; color: #000; }
        .__carimbo { page-break-before: always; padding: 8mm; font-family: Arial, sans-serif; }
      </style></head><body>
      ${html}
      <div class="__carimbo">${carimboHTMLCompacto(carimbo)}</div>
      <script>window.print();window.close();<\/script>
      </body></html>
    `);
    printWindow.document.close();
  }

  async function handleExportPdf() {
    await exportRotuloPdf({
      larguraMm: rotulo.largura_mm,
      alturaMm: rotulo.altura_mm,
      nomeArquivo: `Rotulo-${(rotulo.nome_comercial || "sem-nome").replace(/[^\w\-]+/g, "_")}`,
      html: buildPrintHTML(rotulo, niveisObj),
    });
  }

  const updateField = (field: keyof RotuloData, value: any) => {
    setRotulo((prev) => ({ ...prev, [field]: value }));
  };

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  const currentZPL = generateZPL();

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <div className="flex gap-2 items-center">
          <ZebraConfigDialog config={zebraConfig} onChange={setZebraConfig} />
          <ZPLPreviewDialog zpl={currentZPL} />
          <div className="flex items-center gap-1">
            <Label className="text-xs whitespace-nowrap">Qtd:</Label>
            <Input type="number" min={1} max={999} value={qtdEtiquetas} onChange={(e) => setQtdEtiquetas(Math.max(1, parseInt(e.target.value) || 1))} className="w-16 h-8 text-xs" />
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={() => syncFromProduto()} disabled={syncing}>
          {syncing ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-1" />}
          Sincronizar do Produto
        </Button>
      </div>

      <Tabs defaultValue="preview">
        <TabsList>
          <TabsTrigger value="preview">Visualizar Rótulo</TabsTrigger>
          <TabsTrigger value="editor">Editor</TabsTrigger>
          {rotulo.exibir_tabela_consumo && <TabsTrigger value="tabela">Calculadora VR</TabsTrigger>}
        </TabsList>

        {/* Preview Tab — now default */}
        <TabsContent value="preview">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center justify-between">
                <span>Pré-visualização do Rótulo</span>
                <div className="flex gap-2 flex-wrap">
                  <Button variant="default" size="sm" onClick={enviarParaImpressora}>
                    <Send className="w-4 h-4 mr-1" /> Imprimir Zebra ({zebraConfig.dpi} DPI)
                  </Button>
                  <Button variant="outline" size="sm" onClick={downloadZPL}>
                    <Download className="w-4 h-4 mr-1" /> Download ZPL
                  </Button>
                  <Button variant="outline" size="sm" onClick={handlePrint}>
                    <Printer className="w-4 h-4 mr-1" /> Imprimir
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleExportPdf}>
                    <FileDown className="w-4 h-4 mr-1" /> Exportar PDF
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportRotuloDocx(rotulo, niveisObj)}>
                    <FileText className="w-4 h-4 mr-1" /> Exportar Word
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 mb-4 flex-wrap">
                <span className="text-xs text-muted-foreground self-center mr-1">Carregar exemplo:</span>
                <Button variant="secondary" size="sm" onClick={() => { setRotulo(prev => ({ ...prev, ...EXEMPLO_RACAO.rotulo })); setNiveisObj(EXEMPLO_RACAO.niveis); toast.info("Exemplo: Ração HGM Bezerros 18%"); }}>
                  Ração Bezerros
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setRotulo(prev => ({ ...prev, ...EXEMPLO_PROTEINADO.rotulo })); setNiveisObj(EXEMPLO_PROTEINADO.niveis); toast.info("Exemplo: HGM PAC 400"); }}>
                  HGM PAC 400
                </Button>
                <Button variant="secondary" size="sm" onClick={() => { setRotulo(prev => ({ ...prev, ...EXEMPLO_SAL_MINERAL.rotulo })); setNiveisObj(EXEMPLO_SAL_MINERAL.niveis); toast.info("Exemplo: SAL HGM 60"); }}>
                  Sal Mineral
                </Button>
              </div>

              <div className="overflow-auto bg-muted/30 p-4 rounded-lg flex justify-center">
                <div
                  ref={printRef}
                  style={{
                    width: `${rotulo.largura_mm}mm`,
                    minHeight: `${rotulo.altura_mm}mm`,
                    fontFamily: "Arial, sans-serif",
                    transformOrigin: "top center",
                  }}
                  dangerouslySetInnerHTML={{ __html: buildPrintHTML(rotulo, niveisObj) }}
                />
              </div>

              <div className="mt-3 bg-muted/50 rounded p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">ℹ️ Informação sobre impressão</p>
                <p>• O <strong>selo do MAPA</strong> e o <strong>símbolo de transgênicos (T)</strong> vão impressos diretamente na <strong>sacaria/embalagem</strong>, não no rótulo.</p>
                <p>• A configuração Zebra ({zebraConfig.dpi} DPI, {zebraConfig.largura_mm}×{zebraConfig.altura_mm}mm) é salva automaticamente para uso futuro.</p>
                <p>• Use o botão <strong>"Testar no Labelary"</strong> (em "Ver ZPL") para verificar o layout antes de imprimir.</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="editor" className="space-y-4">
          {/* Identificação */}
          <Card>
            <CardContent className="pt-6 space-y-4">
              <h3 className="font-semibold text-foreground text-sm">Identificação do Produto <BaseLegalBadge assunto="rotulagem" /></h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Nome Comercial</Label><Input value={rotulo.nome_comercial} onChange={(e) => updateField("nome_comercial", e.target.value)} /></div>
                <div>
                  <Label className="text-xs">Tipo de Rótulo </Label>
                  <Select value={rotulo.tipo_rotulo} onValueChange={(v) => updateField("tipo_rotulo", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="racao">Ração</SelectItem>
                      <SelectItem value="suplemento">Suplemento</SelectItem>
                      <SelectItem value="sal_mineral">Sal Mineral</SelectItem>
                      <SelectItem value="proteico">Supl. Mineral Proteico</SelectItem>
                      <SelectItem value="proteico_energetico">Supl. Proteico Energético</SelectItem>
                      <SelectItem value="energetico">Supl. Energético</SelectItem>
                      <SelectItem value="premix">Premix</SelectItem>
                      <SelectItem value="nucleo">Núcleo</SelectItem>
                      <SelectItem value="aditivo">Aditivo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs">Classificação</Label><Input value={rotulo.classificacao_label} onChange={(e) => updateField("classificacao_label", e.target.value)} placeholder="Ex: RAÇÃO PARA BOVINOS DE CORTE" /></div>
                <div><Label className="text-xs">Espécie / Categoria</Label><Input value={rotulo.especie_categoria} onChange={(e) => updateField("especie_categoria", e.target.value)} /></div>
                <div><Label className="text-xs">Peso Líquido</Label><Input value={rotulo.peso_liquido} onChange={(e) => updateField("peso_liquido", e.target.value)} /></div>
                <div><Label className="text-xs">Prazo de Validade (texto)</Label><Input value={rotulo.prazo_validade} onChange={(e) => updateField("prazo_validade", e.target.value)} /></div>
                <div><Label className="text-xs">Registro MAPA (se aplicável)</Label><Input value={rotulo.registro_mapa} onChange={(e) => updateField("registro_mapa", e.target.value)} placeholder="Deixe vazio se isento" /></div>
              </div>

              <h3 className="font-semibold text-foreground text-sm mt-4">Lote e Datas (para impressão)</h3>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <div>
                  <Label className="text-xs">Lote</Label>
                  <Input value={rotulo.lote} onChange={(e) => updateField("lote", e.target.value)} placeholder="Ex: L001-2026" />
                </div>
                <div>
                  <Label className="text-xs">Data de Fabricação</Label>
                  <Input type="date" value={rotulo.data_fabricacao} onChange={(e) => updateField("data_fabricacao", e.target.value)} />
                </div>
                <div>
                  <Label className="text-xs">Validade (dias)</Label>
                  <Input type="number" min={1} value={rotulo.validade_dias} onChange={(e) => updateField("validade_dias", parseInt(e.target.value) || 180)} />
                  <p className="text-[10px] text-muted-foreground mt-0.5">Importado do cadastro do produto</p>
                </div>
                <div>
                  <Label className="text-xs">Data de Vencimento</Label>
                  <Input readOnly value={rotulo.data_fabricacao ? calcDataVencimento(rotulo.data_fabricacao, rotulo.validade_dias) : "Preencha a data de fabricação"} className="bg-muted/50" />
                </div>
              </div>

              <h3 className="font-semibold text-foreground text-sm mt-4">Dimensões do Rótulo</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label className="text-xs">Largura (mm)</Label>
                  <Input type="number" min={50} max={500} value={rotulo.largura_mm} onChange={(e) => updateField("largura_mm", parseInt(e.target.value) || 200)} />
                </div>
                <div>
                  <Label className="text-xs">Altura (mm)</Label>
                  <Input type="number" min={30} max={500} value={rotulo.altura_mm} onChange={(e) => updateField("altura_mm", parseInt(e.target.value) || 100)} />
                </div>
                <div className="flex items-end">
                  <p className="text-[10px] text-muted-foreground pb-2">Preview: {rotulo.largura_mm}×{rotulo.altura_mm} mm — ajuste conforme a impressora</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Composição e Garantias */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Composição e Garantias</h3>
              <div>
                <Label className="text-xs">Composição Básica (Ingredientes)</Label>
                <Textarea value={rotulo.composicao_ingredientes} onChange={(e) => updateField("composicao_ingredientes", e.target.value)} rows={3} />
              </div>
              <div>
                <Label className="text-xs">Eventuais Substitutivos</Label>
                <Textarea value={rotulo.eventuais_substitutivos} onChange={(e) => updateField("eventuais_substitutivos", e.target.value)} rows={2} placeholder="Ingredientes que podem substituir os da composição básica..." />
              </div>
              <div>
                <Label className="text-xs">Níveis de Garantia por kg do Produto</Label>
                <Textarea value={rotulo.niveis_garantia_texto} onChange={(e) => updateField("niveis_garantia_texto", e.target.value)} rows={5} placeholder="Gerado automaticamente ao sincronizar do produto" />
                <p className="text-[10px] text-muted-foreground mt-1">Formato: Nutriente (Mín./Máx.) valor unidade. Editável manualmente.</p>
              </div>
            </CardContent>
          </Card>

          {/* Uso e Precauções */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Uso e Precauções</h3>
              <div><Label className="text-xs">Indicações de Uso</Label><Textarea value={rotulo.indicacoes_uso} onChange={(e) => updateField("indicacoes_uso", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Modo de Usar</Label><Textarea value={rotulo.modo_usar} onChange={(e) => updateField("modo_usar", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Precauções / Restrições</Label><Textarea value={rotulo.precaucoes_restricoes} onChange={(e) => updateField("precaucoes_restricoes", e.target.value)} rows={2} /></div>
              <div><Label className="text-xs">Armazenamento</Label><Input value={rotulo.armazenamento} onChange={(e) => updateField("armazenamento", e.target.value)} /></div>
            </CardContent>
          </Card>

          {/* Fabricante */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Dados do Fabricante</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div><Label className="text-xs">Razão Social</Label><Input value={rotulo.razao_social} onChange={(e) => updateField("razao_social", e.target.value)} /></div>
                <div><Label className="text-xs">CNPJ</Label><Input value={rotulo.cnpj} onChange={(e) => updateField("cnpj", e.target.value)} /></div>
                <div className="md:col-span-2"><Label className="text-xs">Endereço</Label><Input value={rotulo.endereco} onChange={(e) => updateField("endereco", e.target.value)} /></div>
                <div><Label className="text-xs">RT (Nome)</Label><Input value={rotulo.rt_nome} onChange={(e) => updateField("rt_nome", e.target.value)} /></div>
                <div><Label className="text-xs">CRMV</Label><Input value={rotulo.rt_crmv} onChange={(e) => updateField("rt_crmv", e.target.value)} /></div>
                <div><Label className="text-xs">SAC / Contato</Label><Input value={rotulo.sac_contato} onChange={(e) => updateField("sac_contato", e.target.value)} /></div>
              </div>
            </CardContent>
          </Card>

          {/* Tabela de Consumo toggle */}
          <Card>
            <CardContent className="pt-6 space-y-3">
              <h3 className="font-semibold text-foreground text-sm">Tabela de Consumo (Bovinos)</h3>
              <div className="flex items-center gap-3">
                <Switch checked={rotulo.exibir_tabela_consumo} onCheckedChange={(v) => updateField("exibir_tabela_consumo", v)} />
                <Label className="text-xs">Exibir tabela de consumo por 100g de suplemento no rótulo</Label>
              </div>
              <p className="text-[10px] text-muted-foreground">
 Ativado automaticamente para Sal Mineral e Suplementos de Bovinos (referência nutricional). Mostra macro e microminerais com VR para 450 kg.
 </p>
            </CardContent>
          </Card>

          <div className="flex gap-2 flex-wrap">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
              Salvar Rótulo
            </Button>
            <Button variant="default" onClick={enviarParaImpressora}>
              <Send className="w-4 h-4 mr-1" /> Imprimir Zebra
            </Button>
            <Button variant="outline" onClick={downloadZPL}>
              <Download className="w-4 h-4 mr-1" /> Download ZPL
            </Button>
            <Button variant="outline" onClick={handlePrint}>
              <Printer className="w-4 h-4 mr-1" /> Imprimir
            </Button>
            <Button variant="outline" onClick={handleExportPdf}>
              <FileDown className="w-4 h-4 mr-1" /> Exportar PDF
            </Button>
            <Button variant="outline" onClick={() => exportRotuloDocx(rotulo, niveisObj)}>
              <FileText className="w-4 h-4 mr-1" /> Exportar Word
            </Button>
          </div>
        </TabsContent>

        {/* Consumption Table Tab — interactive calculator */}
        {rotulo.exibir_tabela_consumo && (
          <TabsContent value="tabela">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Calculadora — Tabela de Referência por Consumo Diário</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-3">
                  Os valores são calculados automaticamente a partir dos Níveis de Garantia do produto. Ajuste o consumo diário recomendado e os teores conforme necessário.
                </p>
                <TabelaConsumo niveisObj={niveisObj} onNiveisChange={setNiveisObj} />
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
