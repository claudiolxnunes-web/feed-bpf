import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo } from "react";
import { ArrowLeft, Sparkles, Tag, FileText, Printer, ShieldCheck, Lock, Layers, Palette, QrCode, Building2, Loader2, CheckCircle2, XCircle, Mail } from "lucide-react";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoRotulos from "@/assets/logo-nutri-agro-labels.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Seo } from "@/components/Seo";

const PLANOS_INFO: Record<string, { titulo: string; preco: string; periodo: string; nota: string }> = {
  "individual-mensal":    { titulo: "Individual", preco: "R$ 97,00",   periodo: "Mensal",    nota: "Assinatura recorrente mensal" },
  "individual-semestral": { titulo: "Individual", preco: "R$ 494,70",   periodo: "Semestral", nota: "Pagamento único • 15% OFF" },
  "individual-anual":     { titulo: "Individual", preco: "R$ 873,00",   periodo: "Anual",     nota: "Pagamento único • 25% OFF" },
  "grupo10-mensal":       { titulo: "Grupo 10 empresas", preco: "R$ 297,00",   periodo: "Mensal",    nota: "Assinatura recorrente mensal" },
  "grupo10-semestral":    { titulo: "Grupo 10 empresas", preco: "R$ 1.514,70", periodo: "Semestral", nota: "Pagamento único • 15% OFF" },
  "grupo10-anual":        { titulo: "Grupo 10 empresas", preco: "R$ 2.673,00", periodo: "Anual",     nota: "Pagamento único • 25% OFF" },
  "grupo20-mensal":       { titulo: "Grupo 20 empresas", preco: "R$ 497,00",   periodo: "Mensal",    nota: "Assinatura recorrente mensal" },
  "grupo20-semestral":    { titulo: "Grupo 20 empresas", preco: "R$ 2.534,70", periodo: "Semestral", nota: "Pagamento único • 15% OFF" },
  "grupo20-anual":        { titulo: "Grupo 20 empresas", preco: "R$ 4.473,00", periodo: "Anual",     nota: "Pagamento único • 25% OFF" },
};

const funcionalidades = [
  { icon: Tag, title: "Editor de Rótulos", desc: "Crie e edite rótulos comerciais com 18 campos obrigatórios da RTPI, conforme exigências do MAPA." },
  { icon: FileText, title: "Ficha Técnica (RTPI)", desc: "Geração automática da Ficha Técnica do produto com todos os campos regulatórios." },
  { icon: Layers, title: "Níveis de Garantia", desc: "Cálculo e conversão automática (g↔mg) com tratamento de exceções (UFC, FTU, UI, KUI)." },
  { icon: Printer, title: "Impressão Zebra, Word & Excel", desc: "Exporte direto para impressoras Zebra (ZPL), documentos Word e planilhas Excel." },
  { icon: QrCode, title: "QR Code & Lote", desc: "Inclua QR Code de rastreabilidade e codificação de lote/validade automaticamente." },
  { icon: Palette, title: "Templates Customizáveis", desc: "Modelos prontos para ração, premix, suplementos, sal mineral e produtos veterinários." },
];

const diferenciais = [
  { icon: ShieldCheck, title: "100% Conforme MAPA", desc: "Atende IN 04/2007, Decreto 12.031/2024 e regras de rotulagem para nutrição animal." },
  { icon: Lock, title: "Multi-tenant Seguro", desc: "Cada empresa acessa apenas seus rótulos, com isolamento total de dados." },
];

export default function RotulosBPFPage() {
  const { session } = useAuth();
  const destino = "/rotulos/dashboard";
  const signupLink = "/auth?product=rotulos&mode=signup&redirect=%2Frotulos%2Fdashboard";
  const loginLink = "/auth?product=rotulos&mode=login&redirect=%2Frotulos%2Fdashboard";
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const checkoutStatus = searchParams.get("checkout");
  const checkoutTipo = searchParams.get("tipo");
  const checkoutPlano = searchParams.get("plano");
  const planoInfo = useMemo(() => {
    if (!checkoutTipo || !checkoutPlano) return null;
    return PLANOS_INFO[`${checkoutTipo}-${checkoutPlano}`] || null;
  }, [checkoutTipo, checkoutPlano]);

  useEffect(() => {
    if (checkoutStatus === "success") {
      toast.success("Pagamento confirmado! 🎉", {
        description: planoInfo ? `${planoInfo.titulo} • ${planoInfo.periodo}` : "Seu acesso será liberado em instantes.",
      });
      if (session) {
        setTimeout(() => navigate("/rotulos/dashboard"), 3000);
      }
      try { window.scrollTo({ top: 0, behavior: "smooth" }); } catch {}
    } else if (checkoutStatus === "canceled") {
      toast.error("Checkout cancelado", { description: "Você pode tentar novamente quando quiser." });
    }
  }, [checkoutStatus, planoInfo]);

  const limparStatus = () => {
    const next = new URLSearchParams(searchParams);
    next.delete("checkout");
    next.delete("tipo");
    next.delete("plano");
    setSearchParams(next, { replace: true });
  };

  const handleCheckout = async (tipo: "individual" | "grupo10" | "grupo20", plano: "mensal" | "semestral" | "anual") => {
    const key = `${tipo}-${plano}`;
    setLoadingKey(key);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout-nutriagrolabels", {
        body: { tipo, plano },
      });
      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("URL de checkout não retornada");
      }
    } catch (e: any) {
      toast.error("Erro ao iniciar checkout", { description: e.message });
    } finally {
      setLoadingKey(null);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Nutri_Agro Labels — Rótulos e RTPI conforme IN MAPA"
        description="Crie rótulos e registros RTPI com níveis de garantia validados, conversão de unidades e exportação ZPL."
        jsonLd={{"@context": "https://schema.org", "@type": "Product", "name": "Nutri_Agro Labels", "description": "Editor de rótulos e RTPI para produtos de nutrição animal.", "brand": {"@type": "Brand", "name": "BPF_Consult"}}}
      />

      {checkoutStatus && (
        <section className="max-w-6xl mx-auto px-4 pt-6">
          {checkoutStatus === "success" ? (
            <Card className="border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent shadow-lg">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-emerald-500/15 shrink-0">
                    <CheckCircle2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <Badge className="bg-emerald-600 text-white mb-2">Pagamento confirmado</Badge>
                      <h2 className="text-2xl font-bold font-display text-foreground">Bem-vindo ao Nutri_Agro Labels! 🎉</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Recebemos seu pagamento e seu acesso será liberado em instantes.
                      </p>
                    </div>

                    {planoInfo && (
                      <div className="rounded-lg border border-emerald-500/30 bg-background/60 p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Plano</p>
                          <p className="font-semibold text-foreground">{planoInfo.titulo}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Periodicidade</p>
                          <p className="font-semibold text-foreground">{planoInfo.periodo}</p>
                        </div>
                        <div>
                          <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Valor</p>
                          <p className="font-semibold text-foreground">{planoInfo.preco}</p>
                          <p className="text-[11px] text-muted-foreground">{planoInfo.nota}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 text-xs text-muted-foreground">
                      <Mail className="h-4 w-4 mt-0.5 shrink-0" />
                      <p>O recibo foi enviado por e-mail. Em caso de dúvida, fale com <a href="mailto:contato@bpfconsult.com.br" className="text-primary underline">contato@bpfconsult.com.br</a>.</p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 pt-1">
                      <Button onClick={() => navigate(session ? "/" : signupLink)} className="gap-2">
                        <Sparkles className="h-4 w-4" /> {session ? "Acessar plataforma" : "Criar minha conta"}
                      </Button>
                      <Button variant="outline" onClick={limparStatus}>Fechar</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-destructive/40 bg-destructive/5">
              <CardContent className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-start gap-5">
                  <div className="flex items-center justify-center h-14 w-14 rounded-full bg-destructive/15 shrink-0">
                    <XCircle className="h-8 w-8 text-destructive" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-3">
                    <div>
                      <Badge variant="destructive" className="mb-2">Checkout cancelado</Badge>
                      <h2 className="text-2xl font-bold font-display text-foreground">Você cancelou o pagamento</h2>
                      <p className="text-sm text-muted-foreground mt-1">
                        Nenhum valor foi cobrado. {planoInfo ? `Você tentou contratar o ${planoInfo.titulo} ${planoInfo.periodo} (${planoInfo.preco}).` : "Você pode escolher outro plano abaixo."}
                      </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button onClick={limparStatus} className="gap-2">Ver planos novamente</Button>
                      <Button variant="outline" asChild>
                        <a href="mailto:contato@bpfconsult.com.br"><Mail className="h-4 w-4 mr-2" /> Falar com vendas</a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </section>
      )}

      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-primary/10" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,hsl(170,70%,40%,0.08),transparent_60%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-teal-500/10 blur-2xl" />
              <img src={logoRotulos} alt="Nutri_Agro Labels Logo" width={512} height={512} className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">Gerador de Rótulos para Nutrição Animal</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Nutri_Agro <span className="text-primary">Labels</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
                Gerador de rótulos para impressão em Zebra, Word e Excel — desenvolvido para nutrição animal, fábricas de rações e suplementos.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" asChild>
                  <Link to={session ? "/rotulos/dashboard" : `/auth?product=rotulos&mode=login&redirect=%2Frotulos%2Fdashboard`}>
                    <Sparkles className="h-4 w-4" />
                    Acessar Gerador Nutri_Agro Labels
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link to={loginLink}>
                    <Lock className="h-4 w-4" />
                    Já sou cliente
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Tudo que você precisa para rotular conforme</h2>
            <p className="text-muted-foreground">Editor profissional com regras regulatórias embutidas</p>
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
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Por que escolher o Nutri_Agro Labels?</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 max-w-3xl mx-auto">
            {diferenciais.map((d) => (
              <div key={d.title} className="p-6 rounded-xl border border-border bg-card/50 backdrop-blur-sm">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex items-center justify-center h-10 w-10 rounded-lg bg-teal-500/10 shrink-0">
                    <d.icon className="h-5 w-5 text-teal-600 dark:text-teal-400" />
                  </div>
                  <h3 className="font-bold text-foreground text-sm">{d.title}</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Planos e Preços</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Planos Individuais</h2>
            <p className="text-muted-foreground">Escolha o plano ideal para sua fábrica</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {[
              { periodo: "Mensal", planoKey: "mensal" as const, preco: "R$ 97", sub: "/mês", nota: "Sem fidelidade", destaque: false },
              { periodo: "Semestral", planoKey: "semestral" as const, preco: "R$ 494,70", sub: "", nota: "≈ R$ 82,45/mês • 15% OFF", destaque: true, badge: "Mais Popular" },
              { periodo: "Anual", planoKey: "anual" as const, preco: "R$ 873,00", sub: "", nota: "≈ R$ 72,75/mês • 25% OFF", destaque: true, badge: "Melhor Custo" },
            ].map((plan) => {
              const key = `individual-${plan.planoKey}`;
              const isLoading = loadingKey === key;
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
                      className="w-full gap-2 mt-4"
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
          <div className="mt-20">
            <div className="text-center mb-10">
              <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1 border-teal-500/40 text-teal-700 dark:text-teal-300">
                <Building2 className="h-3 w-3 mr-1 inline" /> Exclusivo Consultores e Empresas de Etiquetas
              </Badge>
              <h2 className="text-3xl font-bold font-display text-foreground mb-2">Planos em Grupo</h2>
              <p className="text-muted-foreground">Gerencie múltiplas empresas com um único acesso</p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {[
                {
                  tipo: "grupo10" as const,
                  titulo: "Grupo 10 empresas",
                  base: "R$ 297/mês",
                  destaque: false,
                  planos: [
                    { plano: "mensal" as const, label: "Mensal", preco: "R$ 297,00", sub: "/mês", nota: "Recorrente" },
                    { plano: "semestral" as const, label: "Semestral", preco: "R$ 1.514,70", sub: "", nota: "15% OFF • Pagamento único" },
                    { plano: "anual" as const, label: "Anual", preco: "R$ 2.673,00", sub: "", nota: "25% OFF • Pagamento único" },
                  ],
                },
                {
                  tipo: "grupo20" as const,
                  titulo: "Grupo 20 empresas",
                  base: "R$ 497/mês",
                  destaque: true,
                  planos: [
                    { plano: "mensal" as const, label: "Mensal", preco: "R$ 497,00", sub: "/mês", nota: "Recorrente" },
                    { plano: "semestral" as const, label: "Semestral", preco: "R$ 2.534,70", sub: "", nota: "15% OFF • Pagamento único" },
                    { plano: "anual" as const, label: "Anual", preco: "R$ 4.473,00", sub: "", nota: "25% OFF • Pagamento único" },
                  ],
                },
              ].map((grupo) => (
                <Card key={grupo.tipo} className={`${grupo.destaque ? "border-teal-500/50 bg-teal-500/5" : "border-border"} relative`}>
                  {grupo.destaque && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-teal-600 text-white text-xs shadow-lg">
                      Melhor escolha
                    </Badge>
                  )}
                  <CardContent className="p-6 space-y-4">
                    <div className="text-center pb-3 border-b border-border">
                      <h3 className="text-lg font-bold font-display text-foreground">{grupo.titulo}</h3>
                      <p className="text-xs text-muted-foreground">A partir de {grupo.base}</p>
                    </div>
                    <div className="space-y-3">
                      {grupo.planos.map((p) => {
                        const key = `${grupo.tipo}-${p.plano}`;
                        const loading = loadingKey === key;
                        return (
                          <div key={p.plano} className="flex items-center justify-between gap-3 p-3 rounded-lg border border-border bg-background hover:border-primary/40 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{p.label}</p>
                              <p className="text-foreground"><span className="text-lg font-bold">{p.preco}</span><span className="text-xs text-muted-foreground">{p.sub}</span></p>
                              <p className="text-[10px] text-muted-foreground">{p.nota}</p>
                            </div>
                            <Button
                              size="sm"
                              variant={grupo.destaque ? "default" : "outline"}
                              disabled={loading}
                              onClick={() => handleCheckout(grupo.tipo, p.plano)}
                              className="shrink-0"
                            >
                              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Assinar"}
                            </Button>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <div className="mt-12 text-center">
            <h3 className="text-xl font-bold font-display text-foreground mb-3">Experimente grátis por 7 dias!</h3>
            <p className="text-muted-foreground mb-6">Crie sua conta e tenha acesso completo ao Nutri_Agro Labels durante o período trial.</p>
            <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" asChild>
              <Link to={signupLink}>
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

      <PublicFooter />
    </div>
  );
}
