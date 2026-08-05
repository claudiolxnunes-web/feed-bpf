import { Link, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { ArrowLeft, Sparkles, ClipboardCheck, ShieldCheck, FileBarChart, AlertTriangle, BarChart3, History, Scale, Eye, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import dashboardPreview from "@/assets/auditsbpf-dashboard-preview.jpg";

import { useAuth } from "@/hooks/useAuth";
import { PublicFooter } from "@/components/layout/PublicFooter";
import { Seo } from "@/components/Seo";

const funcionalidades = [
  { icon: ClipboardCheck, title: "Checklist Completo", desc: "Checklist de auditoria interna baseado integralmente no Decreto 12.031/2024, com todos os itens exigidos pelo MAPA." },
  { icon: BarChart3, title: "Cálculo Automático", desc: "Cálculo automático de percentual de conformidade por área e geral, com classificação de criticidade." },
  { icon: ShieldCheck, title: "Sala do Auditor MAPA", desc: "Área exclusiva para o auditor acessar documentos, relatórios e evidências durante a auditoria." },
  { icon: FileBarChart, title: "Relatórios Completos", desc: "Relatórios detalhados de auditoria com gráficos, comparativos e exportação em PDF." },
  { icon: AlertTriangle, title: "Planos de Ação", desc: "Registro de não conformidades com plano de ação corretiva e preventiva, prazos e responsáveis." },
  { icon: History, title: "Histórico e Evolução", desc: "Acompanhe a evolução da conformidade ao longo do tempo com gráficos comparativos entre auditorias." },
];

export default function AuditsBPFPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const signupLink = "/auth?product=auditsbpf&mode=signup&redirect=%2Fauditsbpf%2Fdashboard";
  const loginLink = "/auth?product=auditsbpf&mode=login&redirect=%2Fauditsbpf%2Fdashboard";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Seo
        title="Audits_BPF — Auditorias e Checklists MAPA para Fábricas"
        description="Conduza auditorias internas com checklists do Decreto 12.031/2024, planos de ação e relatórios prontos para o fiscal."
        jsonLd={{"@context": "https://schema.org", "@type": "Product", "name": "Audits_BPF", "description": "Plataforma de auditorias internas e checklists de conformidade MAPA.", "brand": {"@type": "Brand", "name": "BPF_Consult"}}}
      />
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-primary/10" />
        <div className="relative max-w-6xl mx-auto px-4 py-12 sm:py-20">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
            <ArrowLeft className="h-4 w-4" /> Voltar para BPF_Consult
          </Link>
          <div className="flex flex-col sm:flex-row items-center gap-8">
            <div className="relative shrink-0">
              <div className="absolute -inset-4 rounded-full bg-emerald-500/10 blur-2xl" />
              <img src={logoAuditsBpf} alt="Audits_BPF Logo" className="relative w-36 h-36 sm:w-48 sm:h-48 object-contain drop-shadow-xl" />
            </div>
            <div>
              <Badge variant="secondary" className="mb-3 text-xs tracking-widest uppercase">Sistema de Auditoria Digital</Badge>
              <h1 className="text-4xl sm:text-5xl font-bold font-display text-foreground mb-4 tracking-tight">
                Audits_<span className="text-primary">BPF</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-6">
                Transforme suas auditorias internas em um processo 100% digital e conforme com o novo <strong className="text-foreground">Decreto 12.031/2024</strong> do MAPA.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Button size="lg" className="gap-2 shadow-lg shadow-primary/20" asChild>
                  <Link to="/auditsbpf/planos">
                    <Sparkles className="h-4 w-4" />
                    Ver Planos e Preços
                  </Link>
                </Button>
                <Button size="lg" variant="outline" className="gap-2" asChild>
                  <Link to={loginLink}>
                    <LogIn className="h-4 w-4" />
                    Acessar Auditoria
                  </Link>
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">Sem cartão de crédito • Trial de 7 dias</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-12 sm:py-16 flex-1">
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-3 text-xs tracking-widest uppercase px-4 py-1">Funcionalidades</Badge>
            <h2 className="text-3xl font-bold font-display text-foreground mb-2">Auditoria Profissional e Ágil</h2>
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
          <div className="max-w-5xl mx-auto rounded-xl overflow-hidden border border-border shadow-2xl">
            <img src={dashboardPreview} alt="Preview do dashboard Audits_BPF" className="w-full h-auto" />
          </div>
        </section>

        <section className="mt-12 text-center">
          <h3 className="text-xl font-bold font-display text-foreground mb-3">Experimente grátis por 7 dias!</h3>
          <p className="text-muted-foreground mb-6">Crie sua conta e tenha acesso completo ao Audits_BPF durante o período trial.</p>
          <Button size="lg" className="gap-2 shadow-lg shadow-primary/25" asChild>
            <Link to={signupLink}>
              <Sparkles className="h-4 w-4" />
              Começar Trial Grátis
            </Link>
          </Button>
        </section>
      </main>

      <PublicFooter />
    </div>
  );
}
