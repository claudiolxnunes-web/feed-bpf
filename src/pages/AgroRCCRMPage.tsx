import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowLeft, Sparkles, Users, Target, BarChart3, FileText, MapPin, Award, ShieldCheck, Lock, Kanban, TrendingUp, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logoAgrorc from "@/assets/logo-agrorc.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";

import { useAuth } from "@/hooks/useAuth";
import { Seo } from "@/components/Seo";

const funcionalidades = [
  { icon: BarChart3, title: "Painel RC", desc: "Painel exclusivo do Representante Comercial com margens, comissões, scores de desempenho e ranking." },
  { icon: Kanban, title: "Pipeline Kanban", desc: "Gestão visual de oportunidades em colunas (prospect → proposta → fechamento) com arrastar e soltar." },
  { icon: Target, title: "Metas Comerciais", desc: "Defina metas por RC, produto e período, com acompanhamento em tempo real e alertas de desempenho." },
  { icon: MapPin, title: "Visitas a Campo", desc: "Planeje e registre visitas técnicas com geolocalização, fotos e relatórios de check-in/check-out." },
  { icon: Users, title: "Clientes & Carteira", desc: "Cadastro completo de clientes, histórico de compras, perfil produtivo e segmentação por região." },
  { icon: Award, title: "Scores de Desempenho", desc: "Indicadores automáticos de performance individual e comparativo entre representantes." },
];

const diferenciais = [
  { icon: Lock, title: "Privacidade por RC", desc: "Cada Representante Comercial visualiza apenas sua própria carteira — total isolamento entre equipes." },
  { icon: ShieldCheck, title: "Foco no Agro", desc: "Desenvolvido especificamente para Representantes Comerciais do agronegócio, com fluxos adaptados ao setor." },
];

export default function AgroRCCRMPage() {
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const { session } = useAuth();
  const destino = "/agrorc/dashboard";
  const signupLink = "/auth?product=agrorc&mode=signup&redirect=%2Fagrorc%2Fdashboard";
  const loginLink = "/auth?product=agrorc&mode=login&redirect=%2Fagrorc%2Fdashboard";

  const handleCheckout = async (tipo: "individual" | "grupo10" | "grupo20", plano: "mensal" | "semestral" | "anual") => {
    const key = `${tipo}-${plano}`;
    setLoadingPlan(key);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-agrorc", {
        body: { tipo, plano, produto: "agrorc" },
      });
      if (error) throw error;
      if (!data?.url) throw new Error("URL de checkout não retornada");
      window.location.href = data.url;
    } catch (e: any) {
      toast.error(e?.message || "Erro ao abrir checkout");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Agro RC — CRM de Representantes Comerciais do Agro"
        description="Controle carteira de clientes, visitas, pipeline e metas de representantes comerciais do agronegócio."
        jsonLd={{"@context": "https://schema.org", "@type": "Product", "name": "Agro RC", "description": "CRM para representantes comerciais do agronegócio.", "brand": {"@type": "Brand", "name": "BPF_Consult"}}}
      />
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-violet-500/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(270,70%,45%,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-purple-500/10 blur-2xl" />
              <img src={logoAgrorc} alt="Agro RC CRM Logo" className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">CRM para Representantes Comerciais</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Agro <span className="text-primary">RC</span> CRM
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
                Plataforma de gestão para Representantes Comerciais do agronegócio. Controle clientes, metas, visitas e pipeline de oportunidades em um só lugar.
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
                    <Lock className="h-4 w-4" />
                    Já é cadastrado? Acesse o Sistema
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Sem cartão de crédito • Acesso completo</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16">
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">CRM feito para Representantes Comerciais</h2>
            <p className="text-muted-foreground">Ferramentas específicas para gestão da carteira e do pipeline de vendas</p>
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
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Diferenciais</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Por que escolher o Agro RC CRM?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {diferenciais.map((d) => (
              <div key={d.title} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-purple-500/10 shrink-0">
                    <d.icon className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{d.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Preços Individuais */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Planos e Preços</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Planos Individuais</h2>
            <p className="text-muted-foreground">Por usuário • Escolha o plano ideal</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {([
              { periodo: "Mensal", planoKey: "mensal" as const, preco: "R$ 97", sub: "/mês", nota: "Cobrança recorrente", destaque: false, badge: undefined },
              { periodo: "Semestral", planoKey: "semestral" as const, preco: "R$ 494,70", sub: "", nota: "Pagamento único • 6 meses • 15% OFF", destaque: true, badge: "Mais Popular" },
              { periodo: "Anual", planoKey: "anual" as const, preco: "R$ 873,00", sub: "", nota: "Pagamento único • 12 meses • 25% OFF", destaque: true, badge: "Melhor Custo" },
            ]).map((plan) => {
              const key = `individual-${plan.planoKey}`;
              const isLoading = loadingPlan === key;
              return (
                <Card key={plan.periodo} className={`transition-all hover:shadow-xl ${plan.destaque ? "border-primary/50 bg-primary/5 scale-[1.02]" : "border-border"} relative`}>
                  {plan.badge && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs shadow-lg">
                      {plan.badge}
                    </Badge>
                  )}
                  <CardContent className="p-6 text-center space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{plan.periodo}</p>
                    <div>
                      <span className="text-3xl font-bold text-foreground">{plan.preco}</span>
                      <span className="text-muted-foreground">{plan.sub}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.nota}</p>
                    <Button
                      size="sm"
                      className="w-full gap-2 mt-2"
                      disabled={isLoading}
                      onClick={() => handleCheckout("individual", plan.planoKey)}
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Assinar {plan.periodo}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Preços Grupo 10 */}
        <section className="mb-16">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Planos de Grupo (10 usuários)</h2>
            <p className="text-muted-foreground">Equipes pequenas e médias</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { periodo: "Mensal", planoKey: "mensal" as const, preco: "R$ 297", sub: "/mês", nota: "≈ R$ 29,70/usuário/mês" },
              { periodo: "Semestral", planoKey: "semestral" as const, preco: "R$ 1.514,70", sub: "", nota: "Pagamento único • 6 meses • 15% OFF" },
              { periodo: "Anual", planoKey: "anual" as const, preco: "R$ 2.673,00", sub: "", nota: "Pagamento único • 12 meses • 25% OFF" },
            ].map((plan) => {
              const key = `grupo10-${plan.planoKey}`;
              const isLoading = loadingPlan === key;
              return (
                <Card key={plan.periodo} className="border-border hover:shadow-xl transition-all">
                  <CardContent className="p-6 text-center space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{plan.periodo}</p>
                    <div>
                      <span className="text-3xl font-bold text-foreground">{plan.preco}</span>
                      <span className="text-muted-foreground">{plan.sub}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.nota}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 mt-2"
                      disabled={isLoading}
                      onClick={() => handleCheckout("grupo10", plan.planoKey)}
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Assinar {plan.periodo}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Preços Grupo 20 */}
        <section>
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Planos de Grupo (20 usuários)</h2>
            <p className="text-muted-foreground">Ideal para equipes e cooperativas</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {([
              { periodo: "Mensal", planoKey: "mensal" as const, preco: "R$ 497", sub: "/mês", nota: "≈ R$ 24,85/usuário/mês" },
              { periodo: "Semestral", planoKey: "semestral" as const, preco: "R$ 2.534,70", sub: "", nota: "Pagamento único • 6 meses • 15% OFF" },
              { periodo: "Anual", planoKey: "anual" as const, preco: "R$ 4.473,00", sub: "", nota: "Pagamento único • 12 meses • 25% OFF" },
            ]).map((plan) => {
              const key = `grupo20-${plan.planoKey}`;
              const isLoading = loadingPlan === key;
              return (
                <Card key={plan.periodo} className="border-border hover:shadow-xl transition-all">
                  <CardContent className="p-6 text-center space-y-3">
                    <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">{plan.periodo}</p>
                    <div>
                      <span className="text-3xl font-bold text-foreground">{plan.preco}</span>
                      <span className="text-muted-foreground">{plan.sub}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{plan.nota}</p>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-2 mt-2"
                      disabled={isLoading}
                      onClick={() => handleCheckout("grupo20", plan.planoKey)}
                    >
                      {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                      Assinar {plan.periodo}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          <div className="mt-12 text-center">
            <h3 className="text-xl font-bold font-display text-foreground mb-3">Experimente grátis por 7 dias!</h3>
            <p className="text-muted-foreground mb-6">Acesse o sistema completo do Agro RC CRM durante o período trial.</p>
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" asChild>
              <Link to="/auth?product=agrorc&mode=signup&redirect=%2Fagrorc">
                <Sparkles className="h-4 w-4" />
                Começar Trial Grátis
              </Link>
            </Button>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-12">
            Pagamento processado com segurança via Paddle. Você poderá cancelar a qualquer momento.
          </p>
        </section>
      </main>

      <footer className="border-t border-border py-8 text-center">
        <img src={logoBpfConsult} alt="BPF_Consult" className="mx-auto w-10 h-10 object-contain mb-2 opacity-60" />
        <p className="text-sm text-muted-foreground">Agro RC CRM © {new Date().getFullYear()} — by BPF_Consult</p>
      </footer>
    </div>
  );
}
