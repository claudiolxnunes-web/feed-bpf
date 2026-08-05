import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Check, Sparkles, BookOpen, Factory, GitBranch, ShieldCheck, Beaker, Bug, Wrench, BarChart3, CalendarRange, ClipboardCheck, Droplets, GraduationCap, Activity, Lock, FileCheck, LogIn, CreditCard } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import dashboardPreview from "@/assets/feedbpf-dashboard-preview.jpg";
import { useAuth } from "@/hooks/useAuth";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Seo } from "@/components/Seo";

const funcionalidades = [
  { icon: BookOpen, title: "Manual BPF Completo", desc: "Manual de Boas Práticas de Fabricação com todos os capítulos exigidos pela IN 04/2007." },
  { icon: ClipboardCheck, title: "POPs Digitais", desc: "Procedimentos Operacionais Padrão digitais com planilhas de monitoramento integradas." },
  { icon: Factory, title: "Produção & PCP", desc: "Ordens de produção, fórmulas, batidas, controle de lotes e planejamento da produção." },
  { icon: GitBranch, title: "Rastreabilidade Total", desc: "Rastreabilidade completa MP → Produto → Cliente com controle de recall." },
  { icon: ShieldCheck, title: "Higiene & Sanitização", desc: "Cronogramas de limpeza, registros de execução e validação de limpeza de linha." },
  { icon: Bug, title: "Controle de Pragas", desc: "Registro e monitoramento de ocorrências com plano de ação integrado." },
  { icon: Beaker, title: "Análises Laboratoriais", desc: "Registro de análises, laudos e controle de substâncias indesejáveis." },
  { icon: GraduationCap, title: "Treinamentos", desc: "Gestão completa de treinamentos dos colaboradores com controle de vencimento." },
  { icon: Wrench, title: "Manutenção Preventiva", desc: "Programação de manutenções, calibrações e histórico de equipamentos." },
  { icon: BarChart3, title: "Matriz de Risco (APPCC)", desc: "Análise de perigos e pontos críticos de controle com matriz de probabilidade x severidade." },
  { icon: CalendarRange, title: "Planejamento Anual", desc: "Cronograma anual de atividades com acompanhamento de execução." },
  { icon: Activity, title: "Indicadores & Relatórios", desc: "Dashboards em tempo real, indicadores de conformidade e relatórios automatizados." },
];

const diferenciais = [
  { icon: FileCheck, title: "100% Conforme IN 04/2007", desc: "Todos os documentos, procedimentos e registros exigidos pela legislação, prontos para uso." },
  { icon: Lock, title: "Dados Seguros & Isolados", desc: "Cada empresa acessa apenas seus próprios dados, com criptografia e backup automático na nuvem." },
];

export default function FeedBPFPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const destino = "/feedbpf/dashboard";
  const signupLink = "/auth?product=feedbpf&mode=signup&redirect=%2Ffeedbpf%2Fdashboard";
  const loginLink = "/auth?product=feedbpf&mode=login&redirect=%2Ffeedbpf%2Fdashboard";

  const handleCheckout = async (nivel: string, periodo: string) => {
    if (!session) {
      navigate(signupLink);
      return;
    }
    navigate(`${destino}?nivel=${encodeURIComponent(nivel)}&periodo=${encodeURIComponent(periodo)}`);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="Feed_BPF — Gestão de Boas Práticas de Fabricação de Ração"
        description="Digitalize os 10 POPs obrigatórios da IN 04/2007, rastreabilidade e recall conforme o Decreto 12.031/2024."
        jsonLd={{"@context": "https://schema.org", "@type": "Product", "name": "Feed_BPF", "description": "Sistema de gestão de Boas Práticas de Fabricação para fábricas de ração.", "brand": {"@type": "Brand", "name": "BPF_Consult"}}}
      />
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-blue-500/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(200,80%,50%,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-sky-500/10 blur-2xl" />
              <img src={logoFeedBpf} alt="Feed_BPF Logo" className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">Sistema de Gestão BPF</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Feed_<span className="text-primary">BPF</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-3">
                Plataforma completa de Boas Práticas de Fabricação para nutrição animal. 
                Em conformidade com <strong className="text-foreground">IN 04/2007</strong> e <strong className="text-foreground">Decreto 12.031/2024</strong>.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" asChild>
                  <Link to={signupLink}>
                    <Sparkles className="h-4 w-4" />
                    Testar grátis por 7 dias
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link to={loginLink}>
                    <LogIn className="h-4 w-4" />
                    Já é cadastrado? Acesse o Sistema
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16 flex-1">
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Tudo que sua fábrica precisa</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {funcionalidades.map((f) => (
              <div key={f.title} className="p-5 rounded-xl border border-border bg-card hover:shadow-lg hover:-translate-y-0.5 transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-primary/10 shrink-0">
                    <f.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{f.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-20">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Planos e Preços</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Escolha seu plano Feed_BPF</h2>
            <p className="text-muted-foreground">Semestral 15% OFF • Anual 25% OFF • 7 dias grátis</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                nivel: "Standard",
                desc: "Até 10 usuários",
                destaque: false,
                mensal: "R$ 397",
                semestral: "R$ 2.024,70",
                anual: "R$ 3.573,00",
              },
              {
                nivel: "Intermediária",
                desc: "Até 20 usuários",
                destaque: true,
                badge: "Mais Popular",
                mensal: "R$ 697",
                semestral: "R$ 3.554,70",
                anual: "R$ 6.273,00",
              },
              {
                nivel: "Premium",
                desc: "Usuários ilimitados",
                destaque: false,
                mensal: "R$ 1.297",
                semestral: "R$ 6.614,70",
                anual: "R$ 11.673,00",
              },
            ].map((p) => (
              <Card key={p.nivel} className={`transition-all hover:shadow-xl ${p.destaque ? "border-primary/50 bg-primary/5 scale-105" : "border-border"} relative`}>
                {p.badge && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs shadow-lg">
                    {p.badge}
                  </Badge>
                )}
                <CardContent className="p-6 text-center space-y-4">
                  <div>
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{p.nivel}</p>
                    <p className="text-xs text-muted-foreground mt-1">{p.desc}</p>
                  </div>
                  <div className="space-y-2 py-3 border-y border-border">
                    <div>
                      <span className="text-3xl font-bold text-foreground">{p.mensal}</span>
                      <span className="text-sm text-muted-foreground">/mês</span>
                    </div>
                    <div className="text-xs text-muted-foreground space-y-0.5">
                      <p>Semestral: <span className="font-semibold text-foreground">{p.semestral}</span></p>
                      <p>Anual: <span className="font-semibold text-foreground">{p.anual}</span></p>
                    </div>
                  </div>
                  <Button asChild variant={p.destaque ? "default" : "outline"} className="w-full gap-2">
                    <Link to={signupLink}>
                      <Sparkles className="h-3.5 w-3.5" />
                      Testar grátis 7 dias
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            Após o trial, escolha a licença dentro do sistema. Você pode fazer upgrade a qualquer momento.
          </p>
        </section>

        <section className="mb-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {diferenciais.map((d) => (
              <div key={d.title} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-sky-500/10 shrink-0">
                    <d.icon className="h-5 w-5 text-sky-600 dark:text-sky-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{d.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
