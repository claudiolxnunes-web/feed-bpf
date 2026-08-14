import { useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { AlertTriangle, CreditCard, Loader2, Clock, ShieldCheck, Mail, MessageCircle, X } from "lucide-react";
import { PublicFooter } from "@/components/layout/PublicFooter";

// Rotas livres — conteúdo 100% educativo / sandbox.
// Sempre acessíveis, mesmo sem licença ativa ou empresa selecionada,
// para que treinamento e onboarding nunca fiquem bloqueados.
const ROTAS_LIVRES = ["/orientacoes", "/manual", "/guia-pops", "/ativar-licenca"];
const isRotaLivre = (path: string) =>
  ROTAS_LIVRES.some((r) => path === r || path.startsWith(r + "/"));
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLicense } from "@/hooks/useLicense";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

import { useAuth } from "@/hooks/useAuth";

type ProductKey = "feedbpf" | "nutricrm" | "agrogestao" | "auditsbpf" | "agrorc" | "rotulos" | "feedbpfcustom";
type NivelKey = "entrada" | "intermediario" | "avancado";

interface PlanInfo {
  key: string;
  label: string;
  priceFull: number;     // preço cheio mensal-equivalente do período
  priceTotal: number;    // total do período
  desc: string;
}

interface NivelInfo {
  key: NivelKey;
  label: string;
  porte: string;
  destaque?: boolean;
  features: string[];
  plans: PlanInfo[];
}

// Lançamento 2026: 50% off em todos os planos até 31/12/2026
const LAUNCH_END = new Date("2026-12-31T23:59:59");
const isLaunchActive = () => new Date() <= LAUNCH_END;

const NIVEIS: NivelInfo[] = [
  {
    key: "entrada",
    label: "Entrada",
    porte: "Pequeno porte — modo híbrido",
    features: [
      "Gestão 100% digital de Documentos & POPs",
      "Rastreabilidade, Recall e Matriz de Risco (Decreto 12.031/2024)",
      "Saúde do Pessoal / ASO (NR-07)",
      "Operacionais em planilha física + arquivamento PDF",
      "Até 1 empresa",
    ],
    plans: [
      { key: "mensal", label: "Mensal", priceFull: 495, priceTotal: 495, desc: "30 dias" },
      { key: "semestral", label: "Semestral", priceFull: 420.75, priceTotal: 2524.5, desc: "15% off — 6 meses" },
      { key: "anual", label: "Anual", priceFull: 371.25, priceTotal: 4455, desc: "25% off — 12 meses" },
    ],
  },
  {
    key: "intermediario",
    label: "Intermediário",
    porte: "Médio porte — 100% digital",
    destaque: true,
    features: [
      "Tudo do Entrada + lançamento digital operacional",
      "PCP, fórmulas versionadas, planilhas POP digitais",
      "Recebimento, Produção, Higiene, Pragas, Resíduos",
      "Até 5 empresas",
    ],
    plans: [
      { key: "mensal", label: "Mensal", priceFull: 890, priceTotal: 890, desc: "30 dias" },
      { key: "semestral", label: "Semestral", priceFull: 756.5, priceTotal: 4539, desc: "15% off — 6 meses" },
      { key: "anual", label: "Anual", priceFull: 667.5, priceTotal: 8010, desc: "25% off — 12 meses" },
    ],
  },
  {
    key: "avancado",
    label: "Avançado",
    porte: "Grande porte — multi-unidade",
    features: [
      "Tudo do Intermediário + IA + Integrações",
      "Análise de Tendências (IA), Consulta SIPEAGRO",
      "Geração automática do Manual BPF",
      "Até 10 empresas",
    ],
    plans: [
      { key: "mensal", label: "Mensal", priceFull: 1490, priceTotal: 1490, desc: "30 dias" },
      { key: "semestral", label: "Semestral", priceFull: 1266.5, priceTotal: 7599, desc: "15% off — 6 meses" },
      { key: "anual", label: "Anual", priceFull: 1117.5, priceTotal: 13410, desc: "25% off — 12 meses" },
    ],
  },
];

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

const PRODUCT_LABELS: Record<ProductKey, string> = {
  feedbpf: "Feed_BPF",
  nutricrm: "NutriCRM",
  agrogestao: "AgroGestão CRM",
  auditsbpf: "Audits_BPF",
  agrorc: "Agro RC CRM",
  rotulos: "Nutri_Agro Labels",
  feedbpfcustom: "Feed_BPF Custom",
};

interface LicenseGateProps {
  children: React.ReactNode;
  product?: ProductKey;
}

export default function LicenseGate({ children, product: initialProduct }: LicenseGateProps) {
  const { product: urlProduct } = useParams();
  // Se initialProduct for passado (pelo Layout dedicado), ele tem prioridade sobre a URL
  const product = initialProduct || (urlProduct as ProductKey) || "feedbpf";
  
  const { license, loading, isActive, daysRemaining } = useLicense(product);
  const { empresaAtiva, loading: empresaLoading } = useEmpresa();
  const { user, roles, loading: authLoading } = useAuth();
  const SUPER_ADMIN_EMAILS = ["claudiolx.nunes@gmail.com", "clxn2000@hotmail.com", "contato@bpfconsult.com.br"];
  const isSuperAdmin =
    roles?.includes("admin") ||
    (user?.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase()));

  const location = useLocation();
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [nivelSelecionado, setNivelSelecionado] = useState<NivelKey>("intermediario");

  const productLabel = PRODUCT_LABELS[product] || PRODUCT_LABELS.feedbpf;
  const launchActive = isLaunchActive();
  const nivelAtivo = NIVEIS.find((n) => n.key === nivelSelecionado)!;

  // Conteúdo educativo (Central de Orientações, Manual, Guia de POPs) sempre liberado.
  if (isRotaLivre(location.pathname)) return <>{children}</>;

  if (loading || empresaLoading || authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 aria-hidden="true" className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isSuperAdmin) return <>{children}</>;

  if (!empresaAtiva) return <>{children}</>;

  if (isActive) {
    return (
      <>
        {license?.plano === "trial" && daysRemaining <= 3 && (
          <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-3 text-sm">
            <Clock aria-hidden="true" className="w-5 h-5 text-warning shrink-0" />
            <span>
              Seu período de teste expira em <strong>{daysRemaining} dia{daysRemaining !== 1 ? "s" : ""}</strong>.
            </span>
            <Button
              size="sm"
              variant="outline"
              className="ml-auto shrink-0"
              onClick={() => document.getElementById("license-plans")?.scrollIntoView({ behavior: "smooth" })}
            >
              <CreditCard aria-hidden="true" className="w-4 h-4 mr-1" />
              Assinar agora
            </Button>
          </div>
        )}
        {children}
      </>
    );
  }

  const handleCheckout = async (planoKey: string) => {
    if (!empresaAtiva) return;
    const loadingKey = `${nivelSelecionado}-${planoKey}`;
    setCheckoutLoading(loadingKey);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { empresa_id: empresaAtiva.id, plano: planoKey, nivel: nivelSelecionado },
      });
      if (error) throw error;
      if (data?.url) window.open(data.url, "_blank");
    } catch (err: any) {
      toast.error("Erro ao iniciar pagamento: " + err.message);
    } finally {
      setCheckoutLoading(null);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh] p-4">
      <div className="max-w-5xl w-full space-y-6">
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-2">
            <AlertTriangle aria-hidden="true" className="w-8 h-8 text-destructive" />
          </div>
          <h2 className="text-2xl font-bold">Acesso expirado — {productLabel}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            A licença da empresa <strong>{empresaAtiva.nome}</strong> expirou.
            Escolha um nível e plano para continuar.
          </p>
          {license && (
            <Badge variant="destructive">
              {license.status === "revogada" ? "Revogada" : "Expirada"} em{" "}
              {new Date(license.data_expiracao).toLocaleDateString("pt-BR")}
            </Badge>
          )}
          {launchActive && (
            <div className="inline-block px-4 py-2 rounded-lg bg-primary/10 border border-primary/30">
              <p className="text-sm font-semibold text-primary">
                🎉 Lançamento 2026 — 50% OFF aplicado automaticamente em todos os planos
              </p>
            </div>
          )}
        </div>

        <div id="license-plans" className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {NIVEIS.map((nivel) => (
            <button
              key={nivel.key}
              onClick={() => setNivelSelecionado(nivel.key)}
              aria-pressed={nivelSelecionado === nivel.key}
              className={`text-left p-4 sm:p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${
                nivelSelecionado === nivel.key
                  ? "border-primary bg-primary/5 ring-4 ring-primary/10"
                  : "border-border hover:border-primary/50 bg-card/50"
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-lg sm:text-xl tracking-tight">{nivel.label}</h3>
                {nivel.destaque && <Badge variant="default" className="text-[10px] uppercase tracking-wider px-2 py-0.5">Mais popular</Badge>}
              </div>
              <p className="text-xs text-muted-foreground mb-4 font-medium uppercase tracking-wide">{nivel.porte}</p>
              <ul className="space-y-2">
                {nivel.features.map((f, i) => (
                  <li key={i} className="text-xs flex items-start gap-2 leading-relaxed">
                    <div className="w-4 h-4 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[10px] font-bold">✓</span>
                    </div>
                    <span className="text-foreground/80">{f}</span>
                  </li>
                ))}
              </ul>
            </button>
          ))}
        </div>

        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {nivelAtivo.plans.map((plan) => {
            const totalEffective = launchActive ? plan.priceTotal / 2 : plan.priceTotal;
            const mesEffective = launchActive ? plan.priceFull / 2 : plan.priceFull;
            const loadingKey = `${nivelSelecionado}-${plan.key}`;
            const isAnual = plan.key === "anual";
            
            return (
              <Card key={plan.key} className={cn(
                "rounded-2xl border-2 transition-all flex flex-col relative overflow-hidden",
                isAnual ? "border-primary shadow-xl shadow-primary/5 bg-primary/[0.02]" : "hover:border-primary/30"
              )}>
                {isAnual && (
                  <div className="absolute top-0 right-0 px-3 py-1 bg-primary text-white text-[10px] font-bold uppercase tracking-widest rounded-bl-xl z-10 shadow-sm">
                    Recomendado
                  </div>
                )}
                <CardHeader className="pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-xl font-bold tracking-tight">{plan.label}</CardTitle>
                    {isAnual && <Badge variant="default" className="text-[10px] h-5">Melhor valor</Badge>}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 flex-1 flex flex-col justify-between">
                  <div className="space-y-1">
                    {launchActive && (
                      <p className="text-xs text-muted-foreground line-through opacity-60">
                        {formatBRL(plan.priceTotal)}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground tracking-tight">{formatBRL(totalEffective)}</span>
                      <span className="text-xs text-muted-foreground font-medium lowercase">/total</span>
                    </div>
                    {plan.key !== "mensal" && (
                      <div className="inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wide">
                        equivale a {formatBRL(mesEffective)}/mês
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">{plan.desc}</p>
                  </div>
                  <Button
                    className={cn(
                      "w-full h-11 rounded-xl font-bold transition-all active:scale-[0.97]",
                      isAnual ? "bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" : "variant-outline"
                    )}
                    variant={isAnual ? "default" : "outline"}
                    onClick={() => handleCheckout(plan.key)}
                    disabled={!!checkoutLoading}
                  >
                    {checkoutLoading === loadingKey ? (
                      <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard aria-hidden="true" className="w-4 h-4 mr-2" />
                    )}
                    Assinar Agora
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <PublicFooter />
      </div>
    </div>
  );
}

function ContactFormDialog({ programa }: { programa?: string }) {
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    telefone: "",
    cidade: "",
    estado: "",
    mensagem: "",
  });
  const [sending, setSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome || !formData.email) {
      toast.error("Preencha ao menos nome e e-mail.");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase.from("leads_contato").insert({
        nome: formData.nome.trim(),
        email: formData.email.trim(),
        telefone: formData.telefone.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado: formData.estado.trim().toUpperCase() || null,
        mensagem: formData.mensagem.trim() || null,
        programa: programa || null,
        user_id: user?.id || null,
      });
      if (error) throw error;
      toast.success("Mensagem enviada com sucesso! Entraremos em contato.");
      setOpen(false);
      setFormData({ nome: "", email: "", telefone: "", cidade: "", estado: "", mensagem: "" });
    } catch (err: any) {
      toast.error("Erro ao enviar mensagem: " + (err.message || "Tente novamente."));
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline cursor-pointer bg-transparent border-none p-0">
          <MessageCircle aria-hidden="true" className="w-3.5 h-3.5" />
          Fale Conosco
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Fale Conosco</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <Label htmlFor="contact-nome">Nome completo *</Label>
            <Input
              id="contact-nome"
              value={formData.nome}
              onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
              placeholder="Seu nome"
              required
              maxLength={100}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="contact-email">E-mail *</Label>
              <Input
                id="contact-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="seu@email.com"
                required
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="contact-telefone">Telefone</Label>
              <Input
                id="contact-telefone"
                value={formData.telefone}
                onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                placeholder="(00) 00000-0000"
                maxLength={20}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="contact-cidade">Cidade</Label>
              <Input
                id="contact-cidade"
                value={formData.cidade}
                onChange={(e) => setFormData({ ...formData, cidade: e.target.value })}
                placeholder="Sua cidade"
                maxLength={100}
              />
            </div>
            <div>
              <Label htmlFor="contact-estado">Estado</Label>
              <Input
                id="contact-estado"
                value={formData.estado}
                onChange={(e) => setFormData({ ...formData, estado: e.target.value })}
                placeholder="UF"
                maxLength={2}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="contact-mensagem">Mensagem</Label>
            <Textarea
              id="contact-mensagem"
              value={formData.mensagem}
              onChange={(e) => setFormData({ ...formData, mensagem: e.target.value })}
              placeholder="Como podemos ajudar?"
              rows={3}
              maxLength={1000}
            />
          </div>
          <Button type="submit" className="w-full gap-2" disabled={sending}>
            {sending ? <Loader2 aria-hidden="true" className="w-4 h-4 animate-spin" /> : <Mail aria-hidden="true" className="w-4 h-4" />}
            Enviar Mensagem
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}