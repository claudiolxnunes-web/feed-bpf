import {
  AlertTriangle,
  BookOpen,
  Building2,
  Clipboard,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FolderOpen,
  GraduationCap,
  LayoutDashboard,
  MessageSquare,
  Tablet,

  Layers,
  Tag,
  BarChart3,
  Users,
  CalendarDays,
  Wrench,
  Droplets,
  Bug,
  Activity,
  Trash2,
  Zap,
  History,
  CheckCircle2,
  Package,
  FlaskConical,
  Truck,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { SUPER_ADMIN_EMAILS } from "@/config/adminAccess";

import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoNutricrm from "@/assets/logo-nutricrm.png";
import logoAgrogestao from "@/assets/logo-agrogestao.png";
import logoAgrorc from "@/assets/logo-agrorc.png";
import logoRotulos from "@/assets/logo-nutri-agro-labels.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";

export interface NavItem {
  path: string;
  label: string;
  icon: React.ElementType;
  logo?: string;
  keywords?: string[];
  requiredRoles?: string[];
  requiredEmail?: string | string[] | readonly string[];
  external?: boolean;
}

export interface NavGroup {
  label: string;
  icon: React.ElementType;
  logo?: string;
  items: NavItem[];
}

export type NavEntry = NavItem | NavGroup;

export function isGroup(entry: NavEntry): entry is NavGroup {
  return "items" in entry;
}

export const NAV_ENTRIES: NavEntry[] = [
  // Feed_BPF é área operacional do cliente. Não incluir aqui Portal de Gestão,
  // CRM, leads, licenças, campanhas, marketing ou integrações comerciais.
  // --- NAVEGAÇÃO PRINCIPAL (FLAT) ---
  { path: "/dashboard", label: "Dashboard Principal", icon: LayoutDashboard },
  { path: "/cadastro", label: "Dados da Empresa", icon: Building2 },

  // --- POPs (SEQUÊNCIA OFICIAL IN 04/2007 — 09 POPs + PAC) ---
  {
    label: "POP 01 - Qualificação de Fornecedores",
    icon: Users,
    items: [
      { path: "/fornecedores", label: "Qualificação de Fornecedores", icon: Users, keywords: ["parceiros", "compras", "homologação"] },
      { path: "/recebimento", label: "Recebimento de Matéria Prima e Embalagens", icon: ClipboardList, keywords: ["matéria-prima", "conferência", "entrada", "embalagens"] },
    ],
  },
  {
    label: "POP 02 - Limpeza de Instalações, Equipamentos e Utensílios",
    icon: Sparkles,
    items: [
      { path: "/higiene", label: "Higiene / Sanitização", icon: Droplets, keywords: ["limpeza", "faxina", "sanitização"] },
      { path: "/validacao-limpeza", label: "Validação de Limpeza de Linha", icon: CheckCircle2, keywords: ["suabe", "microbiologia", "atp"] },
    ],
  },
  {
    label: "POP 03 - Higiene e Saúde Pessoal",
    icon: Activity,
    items: [
      { path: "/saude-pessoal", label: "Saúde Pessoal", icon: Activity, keywords: ["aso", "exames", "colaboradores"] },
      { path: "/treinamentos", label: "Treinamentos BPF", icon: GraduationCap, keywords: ["capacitação", "cursos", "conscientização"] },
      { path: "/visitantes", label: "Controle de Visitantes", icon: Users, keywords: ["visitas", "biosseguridade", "epi"] },
    ],
  },
  { path: "/potabilidade-agua", label: "POP 04 - Potabilidade da Água", icon: Droplets, keywords: ["cloro", "ph", "análise"] },
  {
    label: "POP 05 - Controle da Produção e Prevenção da Contaminação Cruzada",
    icon: Zap,
    items: [
      { path: "/monitoramento-pcc", label: "Monitoramento PCC / Contaminação Cruzada", icon: Zap, keywords: ["perigo", "crítico", "limite", "carry-over"] },
      { path: "/pcp", label: "PCP / Sequenciamento", icon: CalendarDays, keywords: ["planejamento", "programação", "sequenciamento", "ordem"] },
      { path: "/producao", label: "Controle de Produção", icon: Layers, keywords: ["fabricação", "lote", "rendimento"] },
      { path: "/expedicao", label: "Expedição", icon: Truck, keywords: ["carregamento", "transporte", "entrega"] },
      { path: "/produtos", label: "Cadastro de Produtos", icon: Package, keywords: ["itens", "mercadoria", "sku"] },
      { path: "/formulas", label: "Fórmulas de Produção", icon: FlaskConical, keywords: ["receita", "composição", "mistura"] },
      { path: "/status-lotes", label: "Status & Fila de Lotes", icon: Tag, keywords: ["estoque", "fifo", "bloqueio", "mp"] },
      { path: "/analises", label: "Análises Laboratoriais", icon: FlaskConical, keywords: ["laudo", "laboratório", "amostra", "resultado"] },
      { path: "/substancias", label: "Substâncias Restritas (IN 17/2017)", icon: ShieldAlert, keywords: ["ractopamina", "medicamento", "aditivo", "proibido"] },
      { path: "/armazenamento-transporte", label: "Armazenamento e Transporte", icon: Truck, keywords: ["estocagem", "veículo", "carga", "eeb"] },
    ],
  },
  { path: "/manutencao", label: "POP 06 - Manutenção e Calibração de Equipamentos e Instrumentos", icon: Wrench, keywords: ["máquinas", "equipamentos", "reparo", "calibração", "inventário"] },
  { path: "/pragas", label: "POP 07 - Controle Integrado de Pragas", icon: Bug, keywords: ["insetos", "roedores", "controle"] },
  { path: "/residuos", label: "POP 08 - Controle de Resíduos e Efluentes", icon: Trash2, keywords: ["lixo", "efluentes", "descarte"] },
  {
    label: "POP 09 - Programa de Rastreabilidade e Recolhimento (Recall)",
    icon: History,
    items: [
      { path: "/rastreabilidade", label: "Rastreabilidade", icon: History, keywords: ["lote", "origem", "destino"] },
      { path: "/simulacao-recall", label: "Simulação de Recall", icon: AlertTriangle, keywords: ["recall", "recolhimento", "simulação"] },
    ],
  },
  {
    label: "POP 10 - PAC - Programa de Autocontrole",
    icon: ClipboardCheck,
    items: [
      { path: "/autocontrole", label: "Programa de Autocontrole", icon: ClipboardCheck, keywords: ["checklists", "diário", "fiscalização", "pac"] },
      { path: "/matriz-risco", label: "Matriz de Risco / APPCC", icon: ShieldAlert, keywords: ["análise", "perigos", "severidade", "haccp"] },
    ],
  },


  // --- DOCUMENTAÇÃO & REGISTROS (FLAT) ---
  { path: "/manual", label: "Manual Feed_BPF", icon: BookOpen },
  { path: "/documentos", label: "Documentos e Registros", icon: FileText },
  { path: "/documentos-bpf", label: "Arquivo Digital BPF", icon: FolderOpen, keywords: ["anexos", "scaneados", "upload", "acervo"] },
  { path: "/execucao-pops", label: "Execução ITs/POPs", icon: Clipboard },
  { path: "/planilhas-pop", label: "Planilhas de POPs", icon: Clipboard },
  { path: "/guia-geral-pops", label: "Guia Geral POPs", icon: ClipboardList },
  { path: "/guia-pops", label: "ITs Detalhadas", icon: FileText },
  { path: "/modelos", label: "Biblioteca de Modelos", icon: FolderOpen },
  { path: "/orientacoes", label: "Central de Orientações", icon: GraduationCap },
  { path: "/legislacao", label: "Legislação e Normas", icon: BookOpen, keywords: ["mapa", "in", "decreto", "norma"] },

  // --- AUDITORIA & MELHORIA (FLAT) ---
  { path: "/auditoria", label: "Auditoria BPF", icon: ClipboardCheck },
  { path: "/nao-conformidades", label: "Não Conformidades", icon: AlertTriangle },
  { path: "/sala-auditor", label: "🔍 Sala do Auditor", icon: ClipboardCheck },
  { path: "/audit-log", label: "Log de Atividades", icon: History },
  { path: "/checklist-pre-auditoria", label: "Checklist Pré-Auditoria", icon: ClipboardList },
  { path: "/simulador-tf-autocontroles", label: "Simulador TF-Autocontroles (MAPA)", icon: ShieldCheck },
  { path: "/simulacao-carimbo", label: "Simulação de Carimbo/Selo", icon: ShieldCheck, keywords: ["selo", "carimbo", "certificado"] },
  { path: "/planejamento-anual", label: "Planejamento Anual", icon: CalendarDays, keywords: ["cronograma", "calendário", "programação anual"] },
  { path: "/qualidade-total", label: "Qualidade Total (SAC)", icon: MessageSquare },
  { path: "/indicadores", label: "Indicadores de Qualidade", icon: BarChart3 },

  // --- RELATÓRIOS ---
  {
    label: "Relatórios",
    icon: BarChart3,
    items: [
      { path: "/relatorios", label: "Central de Relatórios", icon: FileText, keywords: ["pdf", "exportar", "documento"] },
      { path: "/relatorio-producao", label: "Relatório de Produção", icon: Layers, keywords: ["produção", "lote", "rendimento"] },
      { path: "/analise-tendencias", label: "Análise de Tendências (IA)", icon: Sparkles, keywords: ["ia", "tendência", "estatística"] },
    ],
  },

  // --- FERRAMENTAS & IA ---
  {
    label: "Ferramentas & IA",
    icon: Sparkles,
    items: [
      { path: "/gerador-pop-ia", label: "Gerador de POPs (IA)", icon: Sparkles, keywords: ["ia", "pop", "gerar"] },
      { path: "/geracao-manual-bpf", label: "Geração do Manual BPF", icon: BookOpen, keywords: ["manual", "gerar", "pdf"] },
      { path: "/consulta-sipeagro", label: "Consulta SIPEAGRO", icon: ShieldCheck, keywords: ["mapa", "registro", "estabelecimento"] },
      { path: "/busca-global", label: "Busca Global", icon: FolderOpen, keywords: ["pesquisar", "localizar"] },
      { path: "/configurar-pin", label: "Configurar PIN de Assinatura", icon: ShieldCheck, keywords: ["senha", "assinatura", "aprovação"] },
    ],
  },

  // --- OUTROS ---
  { path: "/modo-tablet", label: "Factory / Modo Tablet", icon: Tablet },
];
