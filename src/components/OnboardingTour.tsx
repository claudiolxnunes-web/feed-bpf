import { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogHeader } from "@/components/ui/dialog";

interface Step {
  title: string;
  descricao: string;
  targetSelector?: string;
  posicao?: "top" | "bottom" | "left" | "right" | "center";
}

const STEPS: Step[] = [
  {
    title: "Bem-vindo ao Feed_BPF! 🎉",
    descricao: "Este é o seu sistema completo de Boas Práticas de Fabricação para alimentação animal. Vamos conhecer os principais módulos em poucos passos.",
    posicao: "center",
  },
  {
    title: "📊 Dashboard",
    descricao: "Aqui você tem a visão geral: conformidade BPF, NCs abertas, alertas de vencimento (calibrações, treinamentos, documentos) e atalhos rápidos para as principais ações.",
    posicao: "center",
  },
  {
    title: "📋 Documentos & POPs",
    descricao: "Gerencie todos os 10 POPs obrigatórios da, controle versões, preencha planilhas e arquive documentos digitalizados. Acesse pelo menu Qualidade.",
    posicao: "center",
  },
  {
    title: "🏭 Operacional",
    descricao: "Registre recebimento de matéria-prima, produção, ordens de PCP e rastreabilidade. Cada registro alimenta automaticamente os indicadores do sistema.",
    posicao: "center",
  },
  {
    title: "✅ Auditoria & Conformidade",
    descricao: "Use o Checklist Pré-Auditoria para verificar automaticamente se tudo está em dia antes de uma inspeção do MAPA. O módulo de Simulação de Recall permite exercícios anuais obrigatórios.",
    posicao: "center",
  },
  {
    title: "🔍 Busca Global",
    descricao: "Pesquise lotes, produtos, fornecedores e NCs em todo o sistema de uma só vez. Acesse pela barra de atalhos no Dashboard ou pelo menu Gestão.",
    posicao: "center",
  },
  {
    title: "📱 Modo Chão de Fábrica",
    descricao: "Para operadores no tablet: uma interface simplificada com botões grandes para registrar produção, recebimento, limpeza e NCs rapidamente. Acesse pelo menu lateral.",
    posicao: "center",
  },
  {
    title: "Tudo pronto! 🚀",
    descricao: "Seu sistema está configurado. Comece cadastrando sua empresa e depois explore cada módulo. Você pode acessar este tour novamente pelo menu de ajuda. Bom trabalho!",
    posicao: "center",
  },
];

const STORAGE_KEY = "feedbpf_onboarding_done";

export function useOnboarding(options?: { autoStartEnabled?: boolean }) {
  const autoStartEnabled = options?.autoStartEnabled ?? true;
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (!autoStartEnabled) return;
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      // Delay to let the dashboard load first
      const timer = setTimeout(() => setShowOnboarding(true), 1500);
      return () => clearTimeout(timer);
    }
  }, [autoStartEnabled]);

  const iniciarTour = () => {
    localStorage.removeItem(STORAGE_KEY);
    setShowOnboarding(true);
  };
  const fecharTour = () => {
    setShowOnboarding(false);
    localStorage.setItem(STORAGE_KEY, "true");
  };

  return { showOnboarding, iniciarTour, fecharTour };
}

export function OnboardingOverlay({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;
  const isFirst = step === 0;

  const next = () => { if (isLast) { onClose(); } else { setStep(s => s + 1); } };
  const prev = () => { if (!isFirst) setStep(s => s - 1); };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md w-[90vw] p-6 rounded-2xl shadow-2xl border-border bg-card">
        <DialogHeader className="p-0 space-y-0">
          <DialogTitle className="text-lg font-bold font-display mb-2">{current.title}</DialogTitle>
          <DialogDescription className="sr-only">Passo {step + 1} de {STEPS.length}: {current.title}</DialogDescription>
        </DialogHeader>

        {/* Progress */}
        <div className="flex gap-1 mb-4" aria-hidden="true">
          {STEPS.map((_, i) => (
            <div key={i} className={cn("h-1 rounded-full flex-1 transition-colors", i <= step ? "bg-primary" : "bg-muted")} />
          ))}
        </div>

        {/* Content */}
        <p className="text-sm text-muted-foreground leading-relaxed mb-6">{current.descricao}</p>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">Passo {step + 1} de {STEPS.length}</div>
          <div className="flex gap-2">
            {!isFirst && (
              <Button variant="ghost" size="sm" onClick={prev}>
                <ArrowLeft className="w-4 h-4 mr-1" /> Anterior
              </Button>
            )}
            <Button size="sm" onClick={next}>
              {isLast ? (
                <><CheckCircle2 className="w-4 h-4 mr-1" /> Concluir</>
              ) : (
                <>Próximo <ArrowRight className="w-4 h-4 ml-1" /></>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
