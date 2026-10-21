import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, ChevronLeft, ChevronRight, Sparkles, Lock, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Seo } from "@/components/Seo";

import logoFeedBpf from "@/assets/logo-feed-bpf.png";
import logoAuditsBpf from "@/assets/logo-audits-bpf.png";
import logoNutriCrm from "@/assets/logo-nutricrm.png";
import logoAgroGestao from "@/assets/logo-agrogestao.png";
import logoAgroRc from "@/assets/logo-agrorc.png";
import logoRotulos from "@/assets/logo-nutri-agro-labels.png";

// Mockups HTML em português correto (dados fictícios — Fábrica Demo Ltda)
import {
  FeedDashboard, FeedDocumentos, FeedRastreabilidade, FeedRecall, FeedAuditoria,
  FeedRecebimento, FeedProducao, FeedMatrizRisco, FeedPlanejamento, FeedManual,
  AuditsDashboard, AuditsChecklist, AuditsSala, AuditsPlano, AuditsRelatorio, AuditsHistorico,
  AgroRcDashboard, AgroRcKanban, AgroRcClientes, AgroRcVisitas, AgroRcMetas, AgroRcAdmin,
  AgroDashboard, AgroClientes, AgroRegioes, AgroMetas, AgroVisitas, AgroRelatorios,
  NutriDashboard, NutriClientes, NutriPipeline, NutriVisita, NutriRelatorios, NutriClienteDetail,
  RotulosDashboard, RotulosEditor, RotulosFichaTecnica, RotulosNiveisGarantia, RotulosExportacao, RotulosVersionamento,
} from "@/components/demo/MockScreens";

interface Slide {
  title: string;
  description: string;
  render: () => JSX.Element;
}

interface DemoConfig {
  key: string;
  productSlug: string;
  authProduct: string;
  redirectPath: string;
  brand: string;
  tagline: string;
  logo: string;
  accent: string;
  ctaTrialLabel: string;
  slides: Slide[];
}

const DEMOS: Record<string, DemoConfig> = {
  feedbpf: {
    key: "feedbpf",
    productSlug: "feedbpf",
    authProduct: "feedbpf",
    redirectPath: "/feedbpf/dashboard",
    brand: "Feed_BPF",
    tagline: "Boas Práticas de Fabricação para Nutrição Animal",
    logo: logoFeedBpf,
    accent: "from-emerald-500 to-emerald-700",
    ctaTrialLabel: "Iniciar trial de 7 dias",
    slides: [
      { title: "Dashboard de Conformidade", description: "Visão consolidada dos 10 POPs obrigatórios da: % de conformidade BPF, NCs abertas, calibrações vencidas, treinamentos pendentes e alertas do planejamento anual.", render: FeedDashboard },
      { title: "Documentos & POPs Obrigatórios", description: "Os 10 POPs exigidos pelo MAPA já mapeados ao módulo correspondente — um clique e você está no formulário operacional.", render: FeedDocumentos },
      { title: "Rastreabilidade — MP → PA → Venda → Recall", description: "Cadeia completa rastreada por lote, com cobertura visual, segregação por espécie e controle digital de quarentena.", render: FeedRastreabilidade },
      { title: "Simulação de Recall", description: "Exercício anual obrigatório com cronômetro e 10 etapas pré-configuradas — da identificação do problema até a destinação final, com auto-registro como NC.", render: FeedRecall },
      { title: "Auditoria BPF — 80 itens", description: "Checklist oficial com Conforme/NC por item, observações, score automático de conformidade e categorização de risco.", render: FeedAuditoria },
      { title: "Recebimento de Matérias-Primas (POP-01)", description: "Inspeção sensorial, certificado de análise, lote, fornecedor, registro MAPA e exportação CSV — tudo.", render: FeedRecebimento },
      { title: "Controle de Produção", description: "Registro de fabricação, tempo mínimo de mistura (3 min), controle de sobras/vassouras e integração com PCP/ordens.", render: FeedProducao },
      { title: "Matriz de Sensibilidade e Risco (APPCC)", description: "Questionário de 27 perguntas em 7 categorias gera automaticamente a matriz de risco e a análise de perigos APPCC para sua fábrica.", render: FeedMatrizRisco },
      { title: "Planejamento Anual de Atividades", description: "Cronograma inteligente de análises, treinamentos e atividades obrigatórias com alertas de vencimento, % de conformidade e visões em Cards/Timeline.", render: FeedPlanejamento },
      { title: "Manual Feed_BPF Interativo", description: "Guia completo de utilização organizado pela sequência dos 10 POPs — cada módulo do sistema explicado com vínculo direto à norma MAPA.", render: FeedManual },
    ],
  },
  auditsbpf: {
    key: "auditsbpf",
    productSlug: "auditsbpf",
    authProduct: "auditsbpf",
    redirectPath: "/auditsbpf/dashboard",
    brand: "Audits_BPF",
    tagline: "Auditoria interna BPF para nutrição animal",
    logo: logoAuditsBpf,
    accent: "from-blue-500 to-blue-700",
    ctaTrialLabel: "Iniciar trial Audits_BPF",
    slides: [
      { title: "Dashboard de Auditorias", description: "Visão consolidada das auditorias internas: score médio, NCs abertas, próxima auditoria e conformidade por área. Dados ilustrativos.", render: AuditsDashboard },
      { title: "Checklist BPF — 80 itens", description: "Itens marcados como Conforme/NC/N.A. com observações, evidências e cálculo automático de score parcial e final.", render: AuditsChecklist },
      { title: "Sala do Auditor — Portal Externo", description: "Acesso restrito (read-only) para auditores externos consultarem POPs, manuais, laudos e certificados sem entrar na operação.", render: AuditsSala },
      { title: "Plano de Ação 5W2H", description: "Tratativa de NCs com responsável, prazo, custo e status. Integrado às auditorias e ao módulo de NCs do Feed_BPF.", render: AuditsPlano },
      { title: "Relatório Profissional de Auditoria", description: "PDF com identidade da consultoria, score gauge, classificação de risco, radar por área e linha de evolução trimestral.", render: AuditsRelatorio },
      { title: "Histórico e Evolução", description: "Linha do tempo de todas as auditorias realizadas, com comparativo de scores e taxa de tratamento de NCs por período.", render: AuditsHistorico },
    ],
  },
  nutricrm: {
    key: "nutricrm",
    productSlug: "nutricrm",
    authProduct: "nutricrm",
    redirectPath: "/nutricrm/dashboard",
    brand: "NutriCRM",
    tagline: "CRM especializado em nutrição animal",
    logo: logoNutriCrm,
    accent: "from-orange-500 to-rose-600",
    ctaTrialLabel: "Iniciar trial NutriCRM",
    slides: [
      { title: "Dashboard do Representante", description: "Visão consolidada da carteira: clientes ativos, visitas técnicas no mês, propostas em aberto e taxa de conversão por espécie. Dados ilustrativos.", render: NutriDashboard },
      { title: "Carteira de Clientes (multi-tenant)", description: "Cada representante visualiza apenas seus próprios clientes — privacidade total entre carteiras.", render: NutriClientes },
      { title: "Pipeline Comercial em Funil", description: "Acompanhe propostas, visitas técnicas, amostragens e fechamentos em um funil dedicado ao agro.", render: NutriPipeline },
      { title: "Visita Técnica com GPS", description: "Registro com geolocalização, avaliação do rebanho e recomendações nutricionais.", render: NutriVisita },
      { title: "Relatórios e Indicadores", description: "KPIs de faturamento, ticket médio, conversão. Exportação em PDF e Excel.", render: NutriRelatorios },
      { title: "Histórico Completo do Cliente", description: "Linha do tempo de visitas, vendas e recomendações técnicas por propriedade.", render: NutriClienteDetail },
    ],
  },
  agrogestao: {
    key: "agrogestao",
    productSlug: "agrogestao",
    authProduct: "agrogestao",
    redirectPath: "/agrogestao/dashboard",
    brand: "AgroGestão CRM",
    tagline: "Gestão comercial agrícola por região",
    logo: logoAgroGestao,
    accent: "from-lime-500 to-green-700",
    ctaTrialLabel: "Iniciar trial AgroGestão",
    slides: [
      { title: "Dashboard Regional", description: "Visão consolidada do gerente: faturamento, meta atingida, clientes ativos e visitas no mês — com mapa do Brasil por região. Dados ilustrativos.", render: AgroDashboard },
      { title: "Carteira de Clientes", description: "Cadastro completo por cidade/UF, região, cultura, ticket médio e última compra. Filtros por região e segmento.", render: AgroClientes },
      { title: "Mapa de Regiões e Performance", description: "Mapa do Brasil colorido por desempenho com cards de faturamento, RCs e clientes ativos por região (Norte, Nordeste, Centro-Oeste, Sudeste, Sul).", render: AgroRegioes },
      { title: "Metas Comerciais por Representante", description: "Acompanhamento individual de metas trimestrais com barras de progresso, badges de superação e ranking dos top RCs.", render: AgroMetas },
      { title: "Visitas a Campo com GPS", description: "Calendário com check-in/check-out por geolocalização, fotos e taxa de cumprimento da meta mensal de visitas.", render: AgroVisitas },
      { title: "Relatórios Gerenciais", description: "Evolução mensal de vendas, distribuição por cultura (donut), top clientes e exportação em PDF/Excel.", render: AgroRelatorios },
    ],
  },
  agrorc: {
    key: "agrorc",
    productSlug: "agrorc",
    authProduct: "agrorc",
    redirectPath: "/agrorc/dashboard",
    brand: "Agro RC CRM",
    tagline: "CRM para Representantes Comerciais do agro",
    logo: logoAgroRc,
    accent: "from-purple-500 to-violet-700",
    ctaTrialLabel: "Iniciar trial Agro RC",
    slides: [
      { title: "Painel do RC", description: "Visão exclusiva do Representante: carteira, meta do mês, visitas e ranking. Dados ilustrativos.", render: AgroRcDashboard },
      { title: "Pipeline Kanban", description: "Gestão visual de oportunidades (prospecção → proposta → negociação → fechamento) com arrastar e soltar.", render: AgroRcKanban },
      { title: "Carteira de Clientes", description: "Cadastro, histórico, ticket médio e score por cliente. Filtros por região e segmento.", render: AgroRcClientes },
      { title: "Visitas a Campo com GPS", description: "Planejamento semanal com check-in/check-out por geolocalização, fotos e taxa de cumprimento.", render: AgroRcVisitas },
      { title: "Metas Comerciais", description: "Acompanhamento de metas mensais, trimestrais e anuais com ranking dos top RCs.", render: AgroRcMetas },
      { title: "Painel Regional (Admin)", description: "Visão exclusiva do administrador: faturamento, margem bruta/líquida e performance por RC. Não visível aos RCs.", render: AgroRcAdmin },
    ],
  },
  rotulos: {
    key: "rotulos",
    productSlug: "rotulos",
    authProduct: "rotulos",
    redirectPath: "/rotulos/dashboard",
    brand: "Nutri_Agro Labels",
    tagline: "Editor de rótulos e fichas técnicas (RTPI) conforme MAPA",
    logo: logoRotulos,
    accent: "from-teal-500 to-emerald-700",
    ctaTrialLabel: "Começar — 7 dias grátis",
    slides: [
      { title: "Dashboard de Rótulos", description: "Visão geral dos rótulos ativos, fichas técnicas aprovadas, pendências de revisão e histórico de versões. Dados ilustrativos da Fábrica Demo Ltda.", render: RotulosDashboard },
      { title: "Editor de Rótulos com Pré-visualização", description: "Editor visual com checklist automático dos 18 campos obrigatórios da RTPI — composição, garantias, lote, validade e Reg. MAPA validados em tempo real.", render: RotulosEditor },
      { title: "Ficha Técnica RTPI Completa", description: "Geração da Ficha Técnica do produto com identificação, garantias, modo de uso e versionamento — pronta para envio ao MAPA e ao cliente.", render: RotulosFichaTecnica },
      { title: "Níveis de Garantia (Conversão Automática)", description: "Calculadora com conversão automática g↔mg e tratamento de exceções (UFC, FTU, UI, KUI) que não sofrem conversão, conforme regras MAPA.", render: RotulosNiveisGarantia },
      { title: "Exportação PDF, ZPL e QR Code", description: "Exporte para PDF de alta resolução (300 DPI/CMYK), ZPL para impressoras Zebra e QR Code de rastreabilidade do lote em um clique.", render: RotulosExportacao },
      { title: "Versionamento com Selo SHA-256", description: "Histórico imutável de versões com selo digital — cada alteração fica registrada com autor, data e observação para auditoria.", render: RotulosVersionamento },
    ],
  },
};


const ALIASES: Record<string, string> = {
  "feed-bpf": "feedbpf",
  "audits-bpf": "auditsbpf",
  "nutri-crm": "nutricrm",
  "agro-gestao": "agrogestao",
  "agro-rc": "agrorc",
};

export default function DemoPage() {
  const { produto } = useParams<{ produto: string }>();
  const navigate = useNavigate();
  const key = (produto && (ALIASES[produto] || produto)) || "feedbpf";
  const config = DEMOS[key];

  const [index, setIndex] = useState(0);

  const totalSlides = config?.slides.length ?? 0;
  const slide = useMemo(() => config?.slides[index], [config, index]);

  if (!config) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="max-w-md text-center">
          <CardContent className="pt-6 space-y-4">
            <h1 className="text-xl font-bold">Demo não encontrado</h1>
            <p className="text-sm text-muted-foreground">
              O produto solicitado não possui demo disponível.
            </p>
            <Button onClick={() => navigate("/")}>Voltar ao início</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const goPrev = () => setIndex((i) => (i - 1 + totalSlides) % totalSlides);
  const goNext = () => setIndex((i) => (i + 1) % totalSlides);

  const handleTrial = () => {
    navigate(`/auth?mode=signup&product=${config.authProduct}&redirect=${encodeURIComponent(config.redirectPath)}&source=Demo`);
  };

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`Demo ${config.brand} — BPF_Consult`}
        description={`Conheça ${config.brand}: ${config.tagline}. Navegação guiada com telas reais. Teste gratuito de 7 dias, sem cartão.`}
        canonical={`https://www.bpfconsult.com.br/demo/${produto ?? key}`}
      />
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <Link to="/" className="flex items-center gap-3 group">
            <ArrowLeft className="h-4 w-4 text-muted-foreground group-hover:-translate-x-1 transition-transform" />
            <img src={config.logo} alt={config.brand} className="h-10 w-10 object-contain" />
            <div>
              <div className="font-bold text-foreground">{config.brand}</div>
              <div className="text-xs text-muted-foreground">{config.tagline}</div>
            </div>
          </Link>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            <Sparkles className="h-3 w-3 mr-1" /> Demonstração
          </Badge>
        </div>
      </header>

      {/* Hero */}
      <section className={`bg-gradient-to-br ${config.accent} text-white`}>
        <div className="container mx-auto px-4 py-10 sm:py-14 text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-bold">
            Conheça o {config.brand} em poucos cliques
          </h1>
          <p className="text-white/90 max-w-2xl mx-auto">
            Esta é uma navegação guiada com telas reais do produto. Para usar com seus dados,
            inicie um trial gratuito de 7 dias.
          </p>
          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button size="lg" variant="secondary" onClick={handleTrial}>
              {config.ctaTrialLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="bg-transparent text-white border-white/40 hover:bg-white/10 hover:text-white"
              onClick={() => navigate("/")}
            >
              Ver todos os produtos
            </Button>
          </div>
        </div>
      </section>

      {/* Tour */}
      <section className="container mx-auto px-4 py-10 max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-sm text-muted-foreground">
            Tela {index + 1} de {totalSlides}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="icon" onClick={goPrev} aria-label="Anterior">
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={goNext} aria-label="Próxima">
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <Card className="overflow-hidden">
          <div className="relative bg-muted p-2 sm:p-4">
            {slide!.render()}
            <div className="absolute top-3 right-3">
              <Badge className="bg-black/60 hover:bg-black/60 text-white border-none">
                <Lock className="h-3 w-3 mr-1" /> Modo demonstração
              </Badge>
            </div>
          </div>
          <CardContent className="p-6 space-y-2">
            <h2 className="text-xl font-semibold">{slide!.title}</h2>
            <p className="text-muted-foreground">{slide!.description}</p>
          </CardContent>
        </Card>

        {/* Slide indicators */}
        <div className="flex justify-center gap-2 mt-4">
          {config.slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIndex(i)}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-8 bg-primary" : "w-2 bg-muted-foreground/40"
              }`}
              aria-label={`Ir para tela ${i + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="container mx-auto px-4 py-12 max-w-3xl text-center">
        <Card>
          <CardContent className="pt-8 pb-8 space-y-4">
            <h2 className="text-2xl font-bold">Gostou do que viu?</h2>
            <p className="text-muted-foreground">
              Crie sua conta e teste o {config.brand} com seus próprios dados por 7 dias —
              sem cobrança e sem cartão de crédito.
            </p>
            <Button size="lg" onClick={handleTrial}>
              {config.ctaTrialLabel}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* WhatsApp flutuante — conversão alternativa durante o tour */}
      <a
        href={`https://wa.me/5561996757585?text=${encodeURIComponent(
          `Olá! Estou vendo a demo do ${config.brand} e gostaria de tirar uma dúvida.`,
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Falar pelo WhatsApp"
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-full bg-green-600 px-5 py-3 text-white shadow-2xl transition-transform hover:scale-105 active:scale-95"
      >
        <MessageCircle className="h-5 w-5" />
        <span className="hidden sm:inline font-semibold">Tirar dúvida no WhatsApp</span>
      </a>
    </div>
  );
}
