import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Lock, ShieldCheck, Factory, Beaker, BarChart3, GraduationCap, ClipboardCheck, Sparkles, Building2, Users, LayoutDashboard, Tag, CheckCircle2, AlertCircle, FolderOpen } from "lucide-react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoAgrorc from "@/assets/logo-agrorc.png";
import logoRotulos from "@/assets/logo-nutri-agro-labels.png";
import logoNutriCrm from "@/assets/logo-nutricrm.png";
import logoAgroGestao from "@/assets/logo-agrogestao.png";
import { Seo } from "@/components/Seo";

type ProdutoCard = {
  nome: string;
  logo: string;
  desc: string;
  destaques: string[];
  link: string;
  appLink?: string;
  gradient: string;
  bgCard: string;
  borderColor: string;
  trial: string;
  trialLink: string;
  demoLink?: string;
  preco: string;
  external?: boolean;
  trialExternal?: boolean;
  adminOnly?: boolean;
  icon?: React.ElementType;
};

const produtos: ProdutoCard[] = [
  {
    nome: "Feed_BPF",
    icon: LayoutDashboard,
    logo: logoFeedBpf,
    desc: "Plataforma completa de Boas Práticas de Fabricação para nutrição animal. Manual BPF, POPs digitais, planilhas de monitoramento, produção, PCP e rastreabilidade total.",
    destaques: ["Manual BPF & POPs", "Produção & PCP", "Rastreabilidade MP → Cliente", "Higiene & Manutenção", "Matriz de Risco (APPCC)", "Relatórios de Autocontrole"],
    link: "/feedbpf",
    appLink: "/feedbpf/dashboard",
    gradient: "from-[#173404] to-[#27500A]",
    bgCard: "bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30",
    borderColor: "border-green-200 dark:border-green-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=feedbpf&mode=signup&redirect=%2Ffeedbpf%2Fdashboard",
    demoLink: "/demo/feedbpf",
    preco: "A partir de R$ 397/mês",
  },
  {
    nome: "Feed_BPF Custom",
    icon: FolderOpen,
    logo: logoFeedBpf,
    desc: "Já tem sua documentação BPF pronta? Traga como está. O Feed_BPF Custom organiza, controla vencimentos e digitaliza no seu ritmo — sempre respeitando os SEUS modelos, não os nossos.",
    destaques: ["Importa sua pasta inteira", "Organiza por POP (10 POPs)", "Modelos customizáveis por cliente", "Construtor de formulário visual", "Registros digitais com hash SHA-256", "Migração gradual do papel"],
    link: "/feedbpf-custom",
    appLink: "/feedbpf-custom/acervo",
    gradient: "from-emerald-600 to-teal-600",
    bgCard: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    borderColor: "border-emerald-300 dark:border-emerald-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=feedbpfcustom&mode=signup&redirect=%2Ffeedbpf-custom%2Facervo",
    preco: "A partir de R$ 297/mês",
  },
  {
    nome: "Audits_BPF",
    icon: ShieldCheck,
    logo: logoAuditsBpf,
    desc: "Auditoria interna baseada no Decreto 12.031/2024. Sala do auditor MAPA, cálculo automático de conformidade e planos de ação automatizados.",
    destaques: ["Checklist Decreto 12.031", "Sala do Auditor MAPA", "Planos de Ação (NC)", "Cálculo de Conformidade", "Histórico de Auditorias", "Relatórios Oficiais"],
    link: "/auditsbpf",
    appLink: "/auditsbpf/dashboard",
    gradient: "from-emerald-700 to-emerald-900",
    bgCard: "bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/30 dark:to-teal-950/30",
    borderColor: "border-emerald-200 dark:border-emerald-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=auditsbpf&mode=signup&redirect=%2Fauditsbpf%2Fdashboard",
    demoLink: "/demo/auditsbpf",
    preco: "A partir de R$ 297/mês",
    external: false,
    trialExternal: false,
  },
  {
    nome: "Agro RC CRM",
    icon: BarChart3,
    logo: logoAgrorc,
    desc: "Gestão para Representantes Comerciais do agronegócio. Controle de visitas a campo, pipeline Kanban, metas regionais e scores de desempenho.",
    destaques: ["Painel do Representante", "Pipeline Kanban", "Visitas Técnicas/Campo", "Gestão de Metas", "Clientes & Carteira", "Indicadores Regionais"],
    link: "/agro-rc",
    appLink: "/agrorc/dashboard",
    gradient: "from-purple-700 to-purple-900",
    bgCard: "bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/30 dark:to-indigo-950/30",
    borderColor: "border-purple-200 dark:border-purple-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=agrorc&mode=signup&redirect=%2Fagrorc%2Fdashboard",
    demoLink: "/demo/agrorc",
    preco: "A partir de R$ 97/mês",
    external: false,
    trialExternal: false,
  },
  {
    nome: "Nutri_Agro Labels",
    icon: Tag,
    logo: logoRotulos,
    desc: "Gerador de rótulos conforme MAPA (RTPI). Impressão em Zebra, Word e Excel com cálculo automático de níveis de garantia e QR Code de lote.",
    destaques: ["Impressão Zebra (ZPL)", "Ficha Técnica RTPI", "Níveis de Garantia", "QR Code & Lotes", "Templates Personalizáveis", "Conforme Legislação MAPA"],
    link: "/rotulos",
    appLink: "/rotulos/dashboard",
    gradient: "from-teal-600 to-teal-800",
    bgCard: "bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30",
    borderColor: "border-teal-200 dark:border-teal-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=rotulos&mode=signup&redirect=%2Frotulos%2Fdashboard",
    demoLink: "/demo/rotulos",
    preco: "A partir de R$ 97/mês",
  },
  // NutriCRM temporariamente removido da vitrine pública — produto em manutenção.
  // Rotas /nutricrm/* e edge functions seguem ativas para licenças existentes.
  {
    nome: "AgroGestão CRM",
    icon: Building2,
    logo: logoAgroGestao,
    desc: "Plataforma de CRM e gestão completa para o agronegócio. Controle de carteira, oportunidades e indicadores de performance para equipes comerciais.",
    destaques: ["CRM Corporativo", "Gestão de Oportunidades", "Indicadores de Vendas", "Controle de Equipe", "BI & Analytics", "Integração com ERP"],
    link: "/agrogestao",
    external: false,
    appLink: "/agrogestao/dashboard",
    gradient: "from-blue-700 to-blue-900",
    bgCard: "bg-gradient-to-br from-blue-50 to-sky-50 dark:from-blue-950/30 dark:to-sky-950/30",
    borderColor: "border-blue-200 dark:border-blue-800",
    trial: "7 dias grátis",
    trialLink: "/auth?product=agrogestao&mode=signup&redirect=%2Fagrogestao%2Fdashboard",
    trialExternal: false,
    demoLink: "/demo/agrogestao",
    preco: "A partir de R$ 97/mês",
  },
  {
    nome: "Portal de Gestão",
    icon: ShieldCheck,
    logo: logoBpfConsult,
    desc: "Central administrativa da BPF_Consult. Controle de leads, pipeline de vendas e gestão centralizada de licenças para todo o ecossistema.",
    destaques: ["Gestão de Leads", "CRM Interno", "Gestão de Licenças", "Painel Super Admin", "Consolidação de Dados", "Relatórios Gerenciais"],
    link: "/admin",
    appLink: "/admin",
    gradient: "from-[#173404] to-[#173404]",
    bgCard: "bg-slate-50 dark:bg-slate-900/40",
    borderColor: "border-slate-300 dark:border-slate-700",
    trial: "Acesso Restrito",
    trialLink: "/auth?product=admin&redirect=%2Fadmin",
    preco: "Uso Interno Admin",
    adminOnly: true,
  },
];

const estatisticas = [
  { valor: "~2.900", label: "Fábricas no Brasil", icon: Building2 },
  { valor: "100%", label: "Adequação IN 17/2023", icon: CheckCircle2 },
  { valor: "24/7", label: "Gestão Cloud", icon: GraduationCap },
  { valor: "12031", label: "Conforme Decreto", icon: ShieldCheck },
];

export default function Vitrine() {
  const navigate = useNavigate();
  const produtosVisiveis = produtos.filter(p => !p.adminOnly);

  return (
    <div className="min-h-screen bg-[#F7F5F0]">
      <Seo
        title="BPF_Consult — Software de Boas Práticas para Fábricas de Ração"
        description="Plataforma completa de conformidade MAPA: POPs, rastreabilidade, auditorias e rótulos para fábricas de ração e nutrição animal."
        jsonLd={{"@context": "https://schema.org", "@type": "Organization", "name": "BPF_Consult", "url": "https://www.bpfconsult.com.br", "description": "Software de conformidade MAPA para fábricas de ração e nutrição animal."}}
      />
      {/* Top Banner - Urgency */}
      <div className="bg-[#173404] text-[#97C459] py-2 px-4 text-center text-xs font-bold tracking-widest uppercase">
        Prepare sua fábrica para as novas exigências do MAPA · IN 17/2023
      </div>

      {/* Hero Section */}
      <header className="relative overflow-hidden bg-[#173404] pt-12 pb-24 sm:pt-20 sm:pb-32">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(151,196,89,0.1),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(59,109,17,0.1),transparent_50%)]" />
        
        <div className="relative max-w-7xl mx-auto px-4">
          <div className="flex flex-col items-center text-center">
            <div className="mb-8">
              <img
                src={logoBpfConsult}
                alt="BPF_Consult Logo"
                className="w-32 h-32 sm:w-44 sm:h-44 object-contain opacity-90 transition-opacity hover:opacity-100"
              />
            </div>
            
            <Badge variant="outline" className="mb-6 border-[#97C459] text-[#97C459] px-4 py-1.5 rounded-full text-xs uppercase tracking-widest font-bold">
              Consultoria & Tecnologia para Nutrição Animal
            </Badge>
            
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold font-display text-white mb-6 tracking-tight leading-[1.1]">
              Abandone as <span className="text-[#97C459]">planilhas de papel</span> e prepare sua fábrica para o <span className="text-[#97C459]">MAPA</span>.
            </h1>
            
            <p className="text-lg sm:text-xl text-green-100/80 max-w-3xl mx-auto mb-10 leading-relaxed font-sans">
              A única plataforma que integra <strong className="text-white">BPF, Auditoria Digital e CRM</strong> especializado para o agronegócio. 
              Sua fábrica 100% auditável, eficiente e em conformidade total com a <strong className="text-white">IN 17/2023</strong>.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
              <Link to="/auth" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-[#97C459] hover:bg-[#86b14d] text-[#173404] font-bold text-lg px-8 py-7 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95">
                  <Lock className="h-5 w-5 mr-2" />
                  Acessar Sistemas
                </Button>
              </Link>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-5xl mx-auto">
            {estatisticas.map((s) => (
              <div key={s.label} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl flex flex-col items-center text-center">
                <s.icon className="h-6 w-6 text-[#97C459] mb-3" />
                <div className="text-2xl sm:text-3xl font-bold text-white mb-1 font-display">{s.valor}</div>
                <div className="text-[10px] text-green-200/60 uppercase tracking-widest font-bold">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-20 sm:py-32">
        <div className="text-center mb-16">
          <Badge variant="outline" className="mb-4 text-[#173404] border-[#173404]/20 uppercase tracking-widest px-4 py-1">
            Ecossistema BPF_Consult
          </Badge>
          <h2 className="text-4xl font-bold font-display text-[#173404] mb-4">
            Soluções integradas para cada etapa da sua operação
          </h2>
          <p className="text-[#5F5E5A] text-lg max-w-2xl mx-auto font-sans">
            Clique em cada solução para conhecer as funcionalidades, preços e iniciar seu trial gratuito.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {produtosVisiveis.map((p) => (
            <div 
              key={p.nome} 
              className="group cursor-pointer" 
              onClick={() => {
                // Para visitantes, sempre levamos para a landing page (p.link) onde estão os preços.
                // p.appLink é usado apenas internamente ou quando o usuário já está logado.
                const target = p.link || p.appLink;
                if (p.external) {
                  window.open(target, "_blank", "noopener,noreferrer");
                  return;
                }
                navigate(target);
              }}
            >
              <div className={`h-full rounded-2xl border ${p.borderColor} bg-white transition-all duration-500 hover:shadow-[0_20px_50px_rgba(23,52,4,0.1)] hover:-translate-y-2 overflow-hidden flex flex-col`}>
                <div className={`h-2 w-full bg-gradient-to-r ${p.gradient}`} />
                <div className="p-8 flex flex-col flex-1">
                  <div className="flex justify-between items-start mb-6">
                    <img
                      src={p.logo}
                      alt={p.nome}
                      className="w-20 h-20 object-contain drop-shadow-sm group-hover:scale-110 transition-transform duration-500"
                    />
                    {p.adminOnly && (
                      <Badge className="bg-[#173404] text-white text-[10px] font-bold uppercase tracking-widest py-1">
                        Restrito
                      </Badge>
                    )}
                  </div>

                  <h3 className="text-2xl font-bold font-display text-[#173404] mb-3 flex items-center gap-2">
                    {p.nome}
                  </h3>
                  <p className="text-sm text-[#5F5E5A] leading-relaxed mb-6 font-sans">
                    {p.desc}
                  </p>

                  <div className="space-y-2 mb-8 flex-1">
                    {p.destaques.map((d) => (
                      <div key={d} className="flex items-start gap-2 text-xs text-[#2C2C2A] font-medium">
                        <CheckCircle2 className="h-3.5 w-3.5 text-[#639922] shrink-0 mt-0.5" />
                        {d}
                      </div>
                    ))}
                  </div>

                  <div className="pt-6 border-t border-[#F1EFE8] space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-[#888780] font-medium uppercase tracking-wider">{p.preco}</span>
                      <span className="text-xs font-bold text-[#639922]">{p.trial}</span>
                    </div>
                    
                    <Button 
                      className={`w-full font-bold group-hover:bg-[#173404] group-hover:text-white transition-colors ${p.adminOnly ? 'bg-slate-200 text-slate-700' : 'bg-[#F7F5F0] text-[#173404] border border-[#173404]/10'}`}
                    >
                      {p.adminOnly ? 'Acessar Portal' : 'Ver Detalhes'}
                      <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Social Proof / Urgency Section */}
      <section className="bg-white border-y border-[#F1EFE8] py-20">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <AlertCircle className="h-12 w-12 text-[#EF9F27] mx-auto mb-6" />
          <h2 className="text-3xl font-bold font-display text-[#173404] mb-6">
            O fim da correria antes da fiscalização
          </h2>
          <p className="text-xl text-[#5F5E5A] leading-relaxed font-sans italic">
            "Sua fábrica sempre pronta, 100% auditável e digital. BPF_Consult é a única solução que une <strong className="text-[#173404]">Consultoria Técnica</strong> e <strong className="text-[#173404]">Software especializado</strong> para o sucesso da sua operação."
          </p>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}