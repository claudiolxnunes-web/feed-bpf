import { getBaseLegal } from "@/config/baseLegal";
// Lista de documentos obrigatórios para fábricas de produtos destinados à
// alimentação animal — base regulatória: baseLegal: bpf_geral, baseLegal: registro_estabelecimento, baseLegal: decreto_base
// e exigências MAPA/SIPEAGRO. Cada item possui categoria de arquivamento dedicada
// (separada das planilhas operacionais), e endereço fixo de busca no storage.

export interface DocObrigatorio {
  id: string;
  codigo: string;
  titulo: string;
  categoria:
    | "registro_empresa"
    | "manual_pop"
    | "responsabilidade_tecnica"
    | "ambiental_sanitario"
    | "pessoal"
    | "controles_oficiais";
  descricao: string;
  fonteLegal: string;
  obrigatorio: boolean;
  validadeMeses?: number; // null = sem validade definida
  /** Subpasta dentro do bucket feed-bpf/{empresa_id}/obrigatorios/{pasta} */
  pasta: string;
}

export const CATEGORIAS_OBRIGATORIOS: Record<DocObrigatorio["categoria"], { label: string; cor: string }> = {
  registro_empresa: { label: "Registro da Empresa", cor: "bg-blue-500/15 text-blue-700 border-blue-200" },
  manual_pop: { label: "Manual BPF & POPs", cor: "bg-purple-500/15 text-purple-700 border-purple-200" },
  responsabilidade_tecnica: { label: "Responsabilidade Técnica", cor: "bg-amber-500/15 text-amber-700 border-amber-200" },
  ambiental_sanitario: { label: "Ambiental & Sanitário", cor: "bg-green-500/15 text-green-700 border-green-200" },
  pessoal: { label: "Pessoal & Saúde", cor: "bg-pink-500/15 text-pink-700 border-pink-200" },
  controles_oficiais: { label: "Controles Oficiais", cor: "bg-red-500/15 text-red-700 border-red-200" },
};

export const DOCUMENTOS_OBRIGATORIOS: DocObrigatorio[] = [
  // ─── REGISTRO DA EMPRESA ───
  { id: "do-01", codigo: "DOC-01", titulo: "Registro do estabelecimento no MAPA (SIPEAGRO)", categoria: "registro_empresa", descricao: "Certificado de Registro do estabelecimento na SDA/MAPA via SIPEAGRO.", fonteLegal: `${getBaseLegal("registro_estabelecimento").citacao}`, obrigatorio: true, pasta: "registro-mapa" },
  { id: "do-02", codigo: "DOC-02", titulo: "CNPJ atualizado", categoria: "registro_empresa", descricao: "Comprovante de inscrição no CNPJ.", fonteLegal: "Receita Federal", obrigatorio: true, pasta: "cnpj" },
  { id: "do-03", codigo: "DOC-03", titulo: "Inscrição Estadual", categoria: "registro_empresa", descricao: "Comprovante de inscrição estadual ativa.", fonteLegal: "SEFAZ Estadual", obrigatorio: true, pasta: "inscricao-estadual" },
  { id: "do-04", codigo: "DOC-04", titulo: "Alvará de Funcionamento Municipal", categoria: "registro_empresa", descricao: "Alvará vigente emitido pela prefeitura.", fonteLegal: "Lei Municipal", obrigatorio: true, validadeMeses: 12, pasta: "alvara-municipal" },
  { id: "do-05", codigo: "DOC-05", titulo: "Contrato Social / Última Alteração", categoria: "registro_empresa", descricao: "Contrato social e última alteração registrada na Junta Comercial.", fonteLegal: "Junta Comercial", obrigatorio: true, pasta: "contrato-social" },

  // ─── MANUAL BPF & POPs ───
  { id: "do-10", codigo: "DOC-10", titulo: "Manual BPF da empresa (vigente)", categoria: "manual_pop", descricao: "Manual de Boas Práticas de Fabricação assinado pelo RT.", fonteLegal: `${getBaseLegal("bpf_geral").citacao}, Art. 5º`, obrigatorio: true, validadeMeses: 12, pasta: "manual-bpf" },
  { id: "do-11", codigo: "DOC-11", titulo: "POP-01 a POP-10 (versões vigentes)", categoria: "manual_pop", descricao: "Procedimentos Operacionais Padrão dos 10 itens obrigatórios.", fonteLegal: `${getBaseLegal("bpf_geral").citacao}`, obrigatorio: true, pasta: "pops-vigentes" },
  { id: "do-12", codigo: "DOC-12", titulo: "Instruções de Trabalho (ITs)", categoria: "manual_pop", descricao: "ITs vinculadas aos POPs vigentes.", fonteLegal: `${getBaseLegal("bpf_geral").citacao}`, obrigatorio: true, pasta: "its-vigentes" },
  { id: "do-13", codigo: "DOC-13", titulo: "Plano APPCC / Matriz de Risco", categoria: "manual_pop", descricao: "Análise de Perigos e Pontos Críticos de Controle.", fonteLegal: `Codex Alimentarius / ${getBaseLegal("bpf_geral").citacao}`, obrigatorio: true, pasta: "appcc" },

  // ─── RESPONSABILIDADE TÉCNICA ───
  { id: "do-20", codigo: "DOC-20", titulo: "ART de Responsabilidade Técnica (CRMV)", categoria: "responsabilidade_tecnica", descricao: "Anotação de Responsabilidade Técnica do RT vigente.", fonteLegal: "Resolução CFMV 1015/2012", obrigatorio: true, validadeMeses: 12, pasta: "art-rt" },
  { id: "do-21", codigo: "DOC-21", titulo: "Registro do RT no CRMV", categoria: "responsabilidade_tecnica", descricao: "Certidão de regularidade do Médico Veterinário/Zootecnista RT.", fonteLegal: "CFMV", obrigatorio: true, validadeMeses: 12, pasta: "crmv-rt" },

  // ─── AMBIENTAL & SANITÁRIO ───
  { id: "do-30", codigo: "DOC-30", titulo: "Licença Ambiental (LO/LP/LI)", categoria: "ambiental_sanitario", descricao: "Licença ambiental vigente do órgão estadual.", fonteLegal: "Resolução CONAMA 237/97", obrigatorio: true, validadeMeses: 24, pasta: "licenca-ambiental" },
  { id: "do-31", codigo: "DOC-31", titulo: "Outorga de uso da água", categoria: "ambiental_sanitario", descricao: "Outorga para captação de água (poço/superficial).", fonteLegal: "Lei 9.433/97", obrigatorio: false, pasta: "outorga-agua" },
  { id: "do-32", codigo: "DOC-32", titulo: "Plano de Gerenciamento de Resíduos (PGRS)", categoria: "ambiental_sanitario", descricao: "PGRS aprovado pelo órgão ambiental.", fonteLegal: "Lei 12.305/2010", obrigatorio: true, pasta: "pgrs" },
  { id: "do-33", codigo: "DOC-33", titulo: "Laudo de potabilidade da água (anual)", categoria: "ambiental_sanitario", descricao: "Análise físico-química e microbiológica da água.", fonteLegal: "Portaria GM/MS 888/2021", obrigatorio: true, validadeMeses: 12, pasta: "laudo-agua" },
  { id: "do-34", codigo: "DOC-34", titulo: "Contrato com empresa de controle de pragas", categoria: "ambiental_sanitario", descricao: "Contrato e licença sanitária da dedetizadora.", fonteLegal: `${getBaseLegal("controle_pragas").citacao}`, obrigatorio: true, pasta: "contrato-pragas" },

  // ─── PESSOAL & SAÚDE ───
  { id: "do-40", codigo: "DOC-40", titulo: "PCMSO / PGR vigentes", categoria: "pessoal", descricao: "Programas de saúde e gestão de riscos ocupacionais.", fonteLegal: "NR-07 / NR-01", obrigatorio: true, validadeMeses: 12, pasta: "pcmso-pgr" },
  { id: "do-41", codigo: "DOC-41", titulo: "ASOs dos colaboradores (admissão/periódico)", categoria: "pessoal", descricao: "Atestados de Saúde Ocupacional vigentes.", fonteLegal: "NR-07", obrigatorio: true, validadeMeses: 12, pasta: "asos" },
  { id: "do-42", codigo: "DOC-42", titulo: "Certificados de treinamento BPF", categoria: "pessoal", descricao: "Comprovantes de treinamento dos colaboradores em BPF.", fonteLegal: `${getBaseLegal("bpf_geral").citacao}, Art. 5º-IV`, obrigatorio: true, pasta: "treinamentos-bpf" },

  // ─── CONTROLES OFICIAIS ───
  { id: "do-50", codigo: "DOC-50", titulo: "Registros de produtos no MAPA", categoria: "controles_oficiais", descricao: "Certificados de registro de cada produto fabricado (ou isenções).", fonteLegal: `${getBaseLegal("registro_estabelecimento").citacao}`, obrigatorio: true, pasta: "registros-produtos" },
  { id: "do-51", codigo: "DOC-51", titulo: "Atas de fiscalização SIF/DIPOA/MAPA", categoria: "controles_oficiais", descricao: "Termos de fiscalização e respostas a apontamentos.", fonteLegal: `${getBaseLegal("autocontrole").citacao}`, obrigatorio: true, pasta: "atas-fiscalizacao" },
  { id: "do-52", codigo: "DOC-52", titulo: "Relatório Anual de Autocontrole", categoria: "controles_oficiais", descricao: `Relatório consolidado anual conforme ${getBaseLegal("autocontrole").citacao}.`, fonteLegal: getBaseLegal("autocontrole").citacao, obrigatorio: true, validadeMeses: 12, pasta: "relatorio-anual" },
  { id: "do-53", codigo: "DOC-53", titulo: "Apólice de seguro / responsabilidade civil", categoria: "controles_oficiais", descricao: "Seguro de responsabilidade do produto (recall).", fonteLegal: `${getBaseLegal("decreto_base").citacao}`, obrigatorio: false, validadeMeses: 12, pasta: "seguro-rc" },
];
