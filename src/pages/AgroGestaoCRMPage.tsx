import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Sparkles, Building2, LayoutDashboard, Target, Users, BarChart3, PieChart, ShieldCheck, CheckCircle2, Lock, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoAgroGestao from "@/assets/logo-agrogestao.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import { useAuth } from "@/hooks/useAuth";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Seo } from "@/components/Seo";

const funcionalidades = [
  { icon: LayoutDashboard, title: "Dashboard Comercial", desc: "Visão geral do desempenho de vendas, funil de vendas e indicadores em tempo real." },
  { icon: Users, title: "Gestão de Clientes", desc: "Controle completo da carteira de clientes, histórico de interações e segmentação." },
  { icon: Target, title: "Funil de Vendas", desc: "Gestão visual de oportunidades em pipeline Kanban para não perder nenhum negócio." },
  { icon: BarChart3, title: "Indicadores de Performance", desc: "Acompanhamento de metas, taxas de conversão e produtividade da equipe." },
  { icon: PieChart, title: "BI & Analytics", desc: "Relatórios avançados para tomada de decisão baseada em dados reais de campo." },
  { icon: Building2, title: "Gestão de Unidades", desc: "Estrutura para gerenciar múltiplas filiais, depósitos ou unidades de negócio." },
];

const diferenciais = [
  { icon: ShieldCheck, title: "Específico para o Agro", desc: "Diferente de CRMs genéricos, o AgroGestão entende a dinâmica do campo e canais de distribuição." },
  { icon: Lock, title: "Segurança de Dados", desc: "Isolamento total por empresa e criptografia de ponta a ponta para proteger sua carteira." },
];

// O AgroGestão CRM é uma aplicação externa, com login e licenciamento próprios.
// Por isso os botões enviam o usuário diretamente para o app externo — passar
// pelo /auth interno só atrapalhava (login não é compartilhado) e fazia o app
// externo abrir a tela de pagamento/login, que ao cancelar voltava para a raiz.
const APP_EXTERNO = "https://regional-fixer-charm.lovable.app";

export default function AgroGestaoCRMPage() {
  const signupLink = `${APP_EXTERNO}/?trial=1`;
  const loginLink = APP_EXTERNO;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="AgroGestão — Gestão Comercial e Técnica no Agronegócio"
        description="Pipeline comercial, visitas e indicadores para equipes técnicas do agronegócio em uma única plataforma."
        jsonLd={{"@context": "https://schema.org", "@type": "Product", "name": "AgroGestão", "description": "Gestão comercial e técnica para o agronegócio.", "brand": {"@type": "Brand", "name": "BPF_Consult"}}}
      />
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-indigo-500/5 to-primary/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20 text-center sm:text-left">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-blue-500/10 blur-2xl" />
              <img src={logoAgroGestao} alt="AgroGestão CRM Logo" className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">CRM Corporativo para o Agronegócio</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Agro<span className="text-primary">Gestão</span> CRM
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
                A plataforma definitiva para gestão de equipes comerciais, carteira de clientes e oportunidades no setor de nutrição e insumos animais.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" asChild>
                  <a href={signupLink} target="_blank" rel="noopener noreferrer">
                    <Sparkles className="h-4 w-4" />
                    Testar grátis por 7 dias
                  </a>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <a href={loginLink} target="_blank" rel="noopener noreferrer">
                    <LogIn className="h-4 w-4" />
                    Acessar o CRM
                  </a>
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Poder para seu time de vendas</h2>
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
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Preços</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Planos AgroGestão</h2>
            <p className="text-muted-foreground">Semestral 15% OFF • Anual 25% OFF</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {[
              {
                nivel: "Empresa",
                desc: "1 licença • até 10 usuários",
                destaque: false,
                mensal: "R$ 97",
                semestral: "R$ 494,70",
                anual: "R$ 873,00",
              },
              {
                nivel: "Gestor Comercial",
                desc: "Até 10 representantes",
                destaque: true,
                badge: "Mais Popular",
                mensal: "R$ 297",
                semestral: "R$ 1.514,70",
                anual: "R$ 2.673,00",
              },
              {
                nivel: "Consultor Comercial",
                desc: "Até 20 representantes",
                destaque: false,
                mensal: "R$ 497",
                semestral: "R$ 2.534,70",
                anual: "R$ 4.473,00",
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
                    <a href={APP_EXTERNO} target="_blank" rel="noopener noreferrer">Começar agora</a>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
