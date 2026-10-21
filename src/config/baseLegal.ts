/** Catálogo local e reserva por assunto; os slugs identificam documentos na biblioteca. */
export type SituacaoNorma = "vigente" | "revogada" | "parcial";

export interface NormaLegal {
  readonly codigo: string;
  readonly titulo: string;
  readonly orgao: string;
  readonly situacao: SituacaoNorma;
  readonly substituida_por?: string;
  readonly link_oficial: string;
  readonly observacao?: string;
}

const MAPA_ALIMENTACAO = "https://www.gov.br/agricultura/pt-br/assuntos/insumos-agropecuarios/insumos-pecuarios/alimentacao-animal/";
const MAPA_LEGISLACAO = `${MAPA_ALIMENTACAO}arquivos-alimentacao-animal/legislacao/`;

/** Normas históricas permanecem identificadas; não substituem os assuntos vigentes abaixo. */
export const NORMAS = {
  "Lei 6.198/1974": { codigo: "Lei 6.198/1974", titulo: "Inspeção e fiscalização de produtos para alimentação animal", orgao: "Presidência da República", situacao: "vigente", link_oficial: `${MAPA_LEGISLACAO}Lei6.198alteradapela145152022.pdf` },
  "Lei 14.515/2022": { codigo: "Lei 14.515/2022", titulo: "Autocontrole e defesa agropecuária", orgao: "Presidência da República", situacao: "vigente", link_oficial: "https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/L14515.htm" },
  "Decreto 12.031/2024": { codigo: "Decreto 12.031/2024", titulo: "Fiscalização de produtos para alimentação animal", orgao: "Presidência da República", situacao: "parcial", substituida_por: "Decreto 12.502/2025", observacao: "Arts. 116 e 118 revogados pelo Decreto 12.502/2025; demais disposições preservadas.", link_oficial: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/d12031.htm" },
  "Decreto 12.126/2024": { codigo: "Decreto 12.126/2024", titulo: "Programas de autocontrole e fiscalização baseada em risco", orgao: "Presidência da República", situacao: "vigente", link_oficial: "https://www.planalto.gov.br/ccivil_03/_ato2023-2026/2024/decreto/d12126.htm" },
  "Decreto 12.502/2025": { codigo: "Decreto 12.502/2025", titulo: "Processo administrativo de fiscalização agropecuária", orgao: "Presidência da República", situacao: "vigente", link_oficial: `${MAPA_ALIMENTACAO}DECRETON12.502DE11DEJUNHODE2025DECRETON12.502DE11DEJUNHODE2025DOUImprensaNacional.pdf` },
  "IN 4/2007": { codigo: "IN 4/2007", titulo: "Boas práticas de fabricação de alimentação animal", orgao: "MAPA", situacao: "parcial", substituida_por: "IN 27/2020", observacao: "Itens 10.1 a 10.3 e Anexo II revogados pela IN 27/2020.", link_oficial: `${MAPA_LEGISLACAO}instrucao-normativa-no-4-de-23-de-fevereiro-de-2007.pdf` },
  "IN 27/2020": { codigo: "IN 27/2020", titulo: "Procedimentos de fiscalização da alimentação animal", orgao: "MAPA", situacao: "vigente", link_oficial: `${MAPA_LEGISLACAO}INM000000272020.pdf` },
  "IN 15/2009": { codigo: "IN 15/2009", titulo: "Registro de estabelecimentos e produtos de alimentação animal", orgao: "MAPA", situacao: "vigente", link_oficial: `${MAPA_ALIMENTACAO}arquivos-alimentacao-animal/copy_of_INM000000151.pdf` },
  "IN 17/2020": { codigo: "IN 17/2020", titulo: "Registro e cadastro eletrônico de estabelecimentos e produtos", orgao: "MAPA", situacao: "vigente", link_oficial: `${MAPA_LEGISLACAO}copy2_of_INM00000017.pdf` },
  "IN 22/2009": { codigo: "IN 22/2009", titulo: "Embalagem, rotulagem e propaganda de alimentação animal", orgao: "MAPA", situacao: "vigente", link_oficial: `${MAPA_ALIMENTACAO}copy2_of_InstruoNormativan222009consolidada2.pdf` },
  "IN 138/2022": { codigo: "IN 138/2022", titulo: "Risco estimado e frequência de fiscalização", orgao: "SDA/MAPA", situacao: "vigente", link_oficial: `${MAPA_ALIMENTACAO}arquivos-alimentacao-animal/INSTRUONORMATIVASDAN138DE8DEFEVEREIRODE2022caraterizaoderisco.pdf` },
  "IN 1/2020": { codigo: "IN 1/2020", titulo: "Proibição de tilosina, lincomicina e tiamulina como melhoradores de desempenho", orgao: "MAPA", situacao: "vigente", link_oficial: `${MAPA_LEGISLACAO}INM000000012020.pdf` },
  "IN 45/2016": { codigo: "IN 45/2016", titulo: "Proibição de colistina como melhorador de desempenho", orgao: "MAPA", situacao: "vigente", link_oficial: `${MAPA_LEGISLACAO}instrucao-normativa-no-45-de-22-de-novembro-de-2016.pdf` },
  "IN 14/2012": { codigo: "IN 14/2012", titulo: "Proibição de espiramicina e eritromicina como melhoradores de desempenho", orgao: "MAPA", situacao: "vigente", link_oficial: `${MAPA_LEGISLACAO}instrucao-normativa-no-14-de-17-de-maio-de-2012.pdf` },
  "Portaria SDA 798/2023": { codigo: "Portaria SDA 798/2023", titulo: "Fabricação e uso de alimentos medicados", orgao: "SDA/MAPA", situacao: "vigente", link_oficial: `${MAPA_ALIMENTACAO}POR00000798alteradapelaPortaria1231de2025.pdf` },
  "Portaria SDA 1.180/2024": { codigo: "Portaria SDA 1.180/2024", titulo: "PNEEB — prevenção e vigilância da encefalopatia espongiforme bovina", orgao: "SDA/MAPA", situacao: "vigente", link_oficial: `${MAPA_ALIMENTACAO}POR00001180.pdf` },
  "Portaria GM/MS 888/2021": { codigo: "Portaria GM/MS 888/2021", titulo: "Controle da qualidade e padrão de potabilidade da água", orgao: "Ministério da Saúde", situacao: "vigente", link_oficial: "https://bvsms.saude.gov.br/bvs/saudelegis/gm/2021/prt0888_07_05_2021.html" },
  "RDC ANVISA 622/2022": { codigo: "RDC ANVISA 622/2022", titulo: "Empresas de controle de vetores e pragas urbanas", orgao: "ANVISA", situacao: "vigente", link_oficial: "https://www.in.gov.br/en/web/dou/-/resolucao-rdc-n-622-de-9-de-marco-de-2022-386107395" },
  "CONAMA 430/2011": { codigo: "CONAMA 430/2011", titulo: "Condições e padrões de lançamento de efluentes", orgao: "CONAMA/MMA", situacao: "vigente", link_oficial: "https://conama.mma.gov.br/?option=com_sisconama&task=arquivo.download&id=627" },
  "Decreto 6.296/2007": { codigo: "Decreto 6.296/2007", titulo: "Regulamento anterior da alimentação animal", orgao: "Presidência da República", situacao: "revogada", substituida_por: "Decreto 12.031/2024", link_oficial: "https://www.planalto.gov.br/ccivil_03/_ato2007-2010/2007/decreto/d6296.htm" },
  "IN 65/2006": { codigo: "IN 65/2006", titulo: "Regulamento anterior de alimentos medicados", orgao: "MAPA", situacao: "revogada", substituida_por: "Portaria SDA 798/2023", link_oficial: `${MAPA_LEGISLACAO}INSTRUONORMATIVAN65.2006.pdf` },
  "RDC ANVISA 52/2009": { codigo: "RDC ANVISA 52/2009", titulo: "Regulamento anterior de controle de vetores e pragas urbanas", orgao: "ANVISA", situacao: "revogada", substituida_por: "RDC ANVISA 622/2022", link_oficial: "https://bvsms.saude.gov.br/bvs/saudelegis/anvisa/2009/rdc0052_22_10_2009.html" },
  "Portaria SDA 651/2022": { codigo: "Portaria SDA 651/2022", titulo: "Norma anterior de prevenção e vigilância da EEB", orgao: "SDA/MAPA", situacao: "revogada", substituida_por: "Portaria SDA 1.180/2024", link_oficial: "https://www.gov.br/agricultura/pt-br/assuntos/inspecao/produtos-animal/legislacao/Port6512022mitigaoriscoEEB.pdf" },
} as const satisfies Record<string, NormaLegal>;

export type CodigoNorma = keyof typeof NORMAS;

/** Apenas formata a norma solicitada: não inventa dispositivos nem troca normas históricas. */
export function citar(codigo: CodigoNorma, dispositivo?: string): string {
  if (!Object.prototype.hasOwnProperty.call(NORMAS, codigo)) {
    throw new Error(`Norma não cadastrada na base legal: ${codigo}`);
  }
  const norma = NORMAS[codigo];
  const complemento = dispositivo?.trim();
  return complemento ? `${norma.codigo}, ${complemento}` : norma.codigo;
}

/** Orientação de retenção; não calcula nem altera o prazo definido pela empresa. */
export const ORIENTACAO_CONTRAPROVA = `Preservar a contraprova até o fim da validade do produto (${citar("Decreto 12.031/2024", "art. 70, §5º")}). Prazo adicional conforme o POP da empresa.`;

/** Fundamentos do PAC; apenas orientação documental, sem definir cálculos ou controles. */
export const ORIENTACOES_PAC = {
  origem: `A ${citar("IN 4/2007")} lista 9 POPs de BPF. O PAC decorre da ${citar("Lei 14.515/2022")} e do ${citar("Decreto 12.126/2024")} e é organizado neste sistema como POP 10.`,
  requisitos: `O PAC contempla registros auditáveis, recolhimento, autocorreção e boas práticas (${citar("Decreto 12.126/2024", "art. 4º")}).`,
  perigos: `Os perigos são classificados em baixo, médio e alto (${citar("Decreto 12.126/2024", "art. 8º")}), no âmbito do PAC previsto na ${citar("Lei 14.515/2022")}.`,
} as const;

export interface BaseLegal {
  readonly norma: string;
  readonly artigo: string;
  readonly citacao: string;
  readonly observacao: string;
}

interface DefinicaoBaseLegal extends BaseLegal {
  readonly slugs: readonly string[];
}

const decreto = "Decreto 12.031/2024";
const bpf = "IN 04/2007";

export const BASE_LEGAL = {
  bpf_geral: { norma: bpf, artigo: "", citacao: bpf, observacao: "Regulamento Técnico de BPF.", slugs: ["in-04-2007"] },
  autocontrole: { norma: decreto, artigo: "art. 40", citacao: `${citar("Decreto 12.031/2024", "art. 40")}; ${citar("Lei 14.515/2022")}; ${citar("Decreto 12.126/2024", "arts. 4º e 8º")}`, observacao: "Art. 4º do decreto de autocontrole: registros auditáveis, recolhimento, autocorreção e boas práticas. Art. 8º: perigos classificados em baixo, médio e alto. Selo de integridade: art. 40, §3º do decreto de alimentação animal.", slugs: ["decreto-12031-2024", "decreto-12126-2024", "lei-14515-2022"] },
  relatorio_producao_mensal: { norma: decreto, artigo: "art. 39, III", citacao: `${decreto}, art. 39, III`, observacao: "Envio até o 10º dia do mês seguinte (Ofício-Circular 51/2023/CGI/DIPOA/SDA/MAPA).", slugs: ["decreto-12031-2024", "oficio-circular-51-2023"] },
  rastreabilidade: { norma: decreto, artigo: "arts. 41 e 44", citacao: `${decreto}, arts. 41 e 44`, observacao: "", slugs: ["decreto-12031-2024"] },
  registro_estabelecimento: { norma: "IN 17/2020", artigo: "", citacao: "IN 17/2020", observacao: "Registro e cadastro de estabelecimentos e produtos no sistema eletrônico do MAPA.", slugs: ["in-17-2020"] },
  rotulagem: { norma: "IN 22/2009", artigo: "", citacao: "IN 22/2009 (alterada pelas INs 30/2009, 66/2009, 42/2010, 39/2014 e 47/2020)", observacao: "", slugs: ["in-22-2009", "in-30-2009", "in-66-2009", "in-42-2010", "in-39-2014", "in-47-2020"] },
  contraprova_fiscal: { norma: decreto, artigo: "art. 70", citacao: `${decreto}, art. 70`, observacao: "Contraprova da análise fiscal; não há prazo geral de retenção de amostra pelo fabricante.", slugs: ["decreto-12031-2024"] },
  amostra_arquivo: { norma: decreto, artigo: "art. 40", citacao: `Prática interna do autocontrole (${decreto}, art. 40)`, observacao: "Sem prazo fixado em norma.", slugs: ["decreto-12031-2024"] },
  recolhimento_recall: { norma: decreto, artigo: "arts. 39 e 44", citacao: `${decreto}, arts. 39 e 44`, observacao: "", slugs: ["decreto-12031-2024"] },
  alimentos_medicados: { norma: "Portaria SDA 798/2023", artigo: "", citacao: "Portaria SDA 798/2023", observacao: "", slugs: ["portaria-sda-798-2023"] },
  pneeb: { norma: "Portaria SDA 1.180/2024", artigo: "", citacao: "Portaria SDA 1.180/2024", observacao: "", slugs: ["portaria-sda-1180-2024"] },
  controle_pragas: { norma: "RDC ANVISA 622/2022", artigo: "", citacao: "RDC ANVISA 622/2022", observacao: "", slugs: ["rdc-anvisa-622-2022"] },
  substancias_proibidas: { norma: "Lista oficial de substâncias proibidas do MAPA", artigo: "", citacao: "Lista oficial de substâncias proibidas do MAPA; norma por substância (ex.: IN 9/2003, IN 17/2004, IN 26/2009, IN 14/2012, IN 45/2016, IN 1/2020)", observacao: "Não classificar ractopamina como proibida.", slugs: ["in-9-2003", "in-17-2004", "in-26-2009", "in-14-2012", "in-45-2016", "in-1-2020"] },
  decreto_base: { norma: decreto, artigo: "", citacao: decreto, observacao: "Revogou o Decreto 6.296/2007.", slugs: ["decreto-12031-2024"] },
} as const satisfies Record<string, DefinicaoBaseLegal>;

export type AssuntoBaseLegal = keyof typeof BASE_LEGAL;

/** Lista fechada de assuntos, para selects de vínculo (ex.: tela de legislação). */
export const ASSUNTOS_BASE_LEGAL = Object.keys(BASE_LEGAL) as AssuntoBaseLegal[];

/** Sempre síncrona: PDFs/exportações nunca aguardam rede ou uma sessão React. */
export function getBaseLegal(assunto: AssuntoBaseLegal): BaseLegal {
  const { norma, artigo, citacao, observacao } = BASE_LEGAL[assunto];
  return { norma, artigo, citacao, observacao };
}