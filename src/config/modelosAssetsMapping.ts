import pop1_1Asset from "@/assets/modelos/pop1_1.xlsx.asset.json";
import pop1_2Asset from "@/assets/modelos/pop1_2.xls.asset.json";
import pop1_3Asset from "@/assets/modelos/pop1_3.xlsx.asset.json";
import pop1_4Asset from "@/assets/modelos/pop1_4_embalagens.xlsx.asset.json";
import pop1_5Asset from "@/assets/modelos/pop1_5_umidade.xls.asset.json";
import pop1_6Asset from "@/assets/modelos/pop1_6.xls.asset.json";
import pop1_7Asset from "@/assets/modelos/pop1_7.xlsx.asset.json";
import pop1_8Asset from "@/assets/modelos/pop1_8.xlsx.asset.json";
import pop1_1QualifAsset from "@/assets/modelos/pop1_1_questionario.xls.asset.json";
import pop1DocAsset from "@/assets/modelos/pop1_doc.doc.asset.json";

import pop2_1Asset from "@/assets/modelos/pop2_1.xlsx.asset.json";
import pop2_2Asset from "@/assets/modelos/pop2_2.xlsx.asset.json";
import pop2_3Asset from "@/assets/modelos/pop2_3.xlsx.asset.json";
import pop2_4Asset from "@/assets/modelos/pop2_4.xlsx.asset.json";
import pop2DocAsset from "@/assets/modelos/pop2_doc.doc.asset.json";

import pop3AgroAsset from "@/assets/modelos/pop3_agrocampo.doc.asset.json";
import treinamentosAsset from "@/assets/modelos/treinamento_presenca.docx.asset.json";

import pop4DocAsset from "@/assets/modelos/pop4_doc.doc.asset.json";
import pop5DocAsset from "@/assets/modelos/pop5_doc.doc.asset.json";

import pop6_1Asset from "@/assets/modelos/pop6_1.xlsx.asset.json";
import pop6_3Asset from "@/assets/modelos/pop6_3.xlsx.asset.json";
import pop6DocAsset from "@/assets/modelos/pop6_doc.doc.asset.json";
import listaEquipAsset from "@/assets/modelos/lista_equipamentos.xlsx.asset.json";

import pop7_1Asset from "@/assets/modelos/pop7_1.xlsx.asset.json";
import pop7DocAsset from "@/assets/modelos/pop7_doc.doc.asset.json";

import pop8Asset from "@/assets/modelos/pop8.xlsx.asset.json";
import pop8DocAsset from "@/assets/modelos/pop8_doc.doc.asset.json";

import pop9_1Asset from "@/assets/modelos/pop9_1.xlsx.asset.json";
import pop9_4Asset from "@/assets/modelos/pop9_4.xlsx.asset.json";
import pop9_02Asset from "@/assets/modelos/pop9_02_expedicao.xlsx.asset.json";
import pop9_03Asset from "@/assets/modelos/pop9_03_producao.xlsx.asset.json";
import pop9_05Asset from "@/assets/modelos/pop9_05_rnc.xlsx.asset.json";
import pop9_06Asset from "@/assets/modelos/pop9_06_reclamacoes.xlsx.asset.json";
import pop9DocAsset from "@/assets/modelos/pop9_doc.doc.asset.json";

import manualBpfAsset from "@/assets/modelos/manual_bpf.docx.asset.json";
import complexidadeAsset from "@/assets/modelos/complexidade_bpf.pdf.asset.json";
import desviosAsset from "@/assets/modelos/desvios_analiticos.xlsx.asset.json";
import matrizSensibAsset from "@/assets/modelos/matriz_sensibilidade.xlsx.asset.json";
import sipeagroAsset from "@/assets/modelos/sipeagro_lista.xlsx.asset.json";


interface AssetPointer {
  url: string;
}

export const MODELOS_ASSETS: Record<string, { label: string, url: string }[]> = {
  "POP-01": [
    { label: "Lista de Fornecedores (1.1)", url: (pop1_1Asset as AssetPointer).url },
    { label: "Questionário Qualificação MP (1.1)", url: (pop1_1QualifAsset as AssetPointer).url },
    { label: "Recebimento de MP (1.2)", url: (pop1_2Asset as AssetPointer).url },
    { label: "Controle de MP (1.3)", url: (pop1_3Asset as AssetPointer).url },
    { label: "Entrada de Embalagens (1.4)", url: (pop1_4Asset as AssetPointer).url },
    { label: "Umidade Silos (1.5)", url: (pop1_5Asset as AssetPointer).url },
    { label: "Recebimento Embalagens (1.6)", url: (pop1_6Asset as AssetPointer).url },
    { label: "Controle de Lotes (1.7)", url: (pop1_7Asset as AssetPointer).url },
    { label: "Controle de Expurgo (1.8)", url: (pop1_8Asset as AssetPointer).url },
    { label: "Procedimento POP 01 (Word)", url: (pop1DocAsset as AssetPointer).url }
  ],
  "POP-02": [
    { label: "Limpeza Diária (2.1)", url: (pop2_1Asset as AssetPointer).url },
    { label: "Limpeza Semanal (2.2)", url: (pop2_2Asset as AssetPointer).url },
    { label: "Limpeza Mensal (2.3)", url: (pop2_3Asset as AssetPointer).url },
    { label: "Limpeza de Veículos (2.4)", url: (pop2_4Asset as AssetPointer).url },
    { label: "Procedimento POP 02 (Word)", url: (pop2DocAsset as AssetPointer).url }
  ],
  "POP-03": [
    { label: "Procedimento POP 03 (Word)", url: (pop3AgroAsset as AssetPointer).url },
    { label: "Lista de Presença Treinamento", url: (treinamentosAsset as AssetPointer).url }
  ],
  "POP-04": [
    { label: "Procedimento POP 04 (Word)", url: (pop4DocAsset as AssetPointer).url }
  ],
  "POP-05": [
    { label: "Procedimento POP 05 (Word)", url: (pop5DocAsset as AssetPointer).url },
    { label: "Matriz de Sensibilidade e Risco", url: (matrizSensibAsset as AssetPointer).url }
  ],
  "POP-06": [
    { label: "Cronograma Manutenção (6.1)", url: (pop6_1Asset as AssetPointer).url },
    { label: "Ordem de Serviço (6.3)", url: (pop6_3Asset as AssetPointer).url },
    { label: "Lista de Equipamentos", url: (listaEquipAsset as AssetPointer).url },
    { label: "Procedimento POP 06 (Word)", url: (pop6DocAsset as AssetPointer).url }
  ],
  "POP-07": [
    { label: "Monitoramento de Pragas (7.1)", url: (pop7_1Asset as AssetPointer).url },
    { label: "Procedimento POP 07 (Word)", url: (pop7DocAsset as AssetPointer).url }
  ],
  "POP-08": [
    { label: "Controle de Resíduos (Excel)", url: (pop8Asset as AssetPointer).url },
    { label: "Procedimento POP 08 (Word)", url: (pop8DocAsset as AssetPointer).url }
  ],
  "POP-09": [
    { label: "Ordem de Produção (9.1)", url: (pop9_1Asset as AssetPointer).url },
    { label: "Expedição por Cliente/Lote (9.02)", url: (pop9_02Asset as AssetPointer).url },
    { label: "OP - Fórmula/Inclusão MP (9.03)", url: (pop9_03Asset as AssetPointer).url },
    { label: "Recolhimento - Recall (9.4)", url: (pop9_4Asset as AssetPointer).url },
    { label: "Controle de RNC (9.05)", url: (pop9_05Asset as AssetPointer).url },
    { label: "Reclamações Clientes (9.06)", url: (pop9_06Asset as AssetPointer).url },
    { label: "Procedimento POP 09 (Word)", url: (pop9DocAsset as AssetPointer).url }
  ],
  "Manual": [
    { label: "Manual de BPF (Template Word)", url: (manualBpfAsset as AssetPointer).url },
    { label: "Estudo Complexidade Registros", url: (complexidadeAsset as AssetPointer).url },
    { label: "Tabela Desvios Analíticos ( Sindirações)", url: (desviosAsset as AssetPointer).url },
    { label: "Lista Estabelecimentos SIPEAGRO", url: (sipeagroAsset as AssetPointer).url }
  ]
};
