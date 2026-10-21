import { ReactNode, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { AlertTriangle, FileDown, Lock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLicense } from "@/hooks/useLicense";
import { checkAccess, TIER_LABEL } from "@/config/tiers";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { SUPER_ADMIN_EMAILS } from "@/config/adminAccess";
import { POP_PESOS, LIMITE_PONTOS_INTERMEDIARIO } from "@/config/popsPesos";

interface TierGateProps {
  children: ReactNode;
}

const HYBRID_SHORTCUTS: Record<string, { templatePath: string; archivePath: string }> = {
  "/recebimento": {
    templatePath: "/planilhas-pop?pop=POP-01",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-01",
  },
  "/fornecedores": {
    templatePath: "/planilhas-pop?pop=POP-01",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-01",
  },
  "/higiene": {
    templatePath: "/planilhas-pop?pop=POP-02",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-02",
  },
  "/potabilidade-agua": {
    templatePath: "/planilhas-pop?pop=POP-04",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-04",
  },
  "/pcp": {
    templatePath: "/planilhas-pop?pop=POP-05",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-05",
  },
  "/producao": {
    templatePath: "/planilhas-pop?pop=POP-05",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-05",
  },
  "/validacao-limpeza": {
    templatePath: "/planilhas-pop?pop=POP-05",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-05",
  },
  "/manutencao": {
    templatePath: "/planilhas-pop?pop=POP-06",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-06",
  },
  "/pragas": {
    templatePath: "/planilhas-pop?pop=POP-07",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-07",
  },
  "/residuos": {
    templatePath: "/planilhas-pop?pop=POP-08",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-08",
  },
  "/armazenamento-transporte": {
    templatePath: "/planilhas-pop?pop=POP-09",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-09",
  },
  "/relatorio-producao": {
    templatePath: "/planilhas-pop?pop=POP-09",
    archivePath: "/documentos-bpf?upload=1&tipo=planilha&pop=POP-09",
  },
};

/**
 * Bloqueio funcional por nível.
 * - Avançado bloqueado: card "Disponível no Avançado".
 * - Entrada em módulo operacional: aviso de modo híbrido (mantém o conteúdo,
 *   mas exibe banner com link para Documentos BPF para arquivamento físico).
 */
export default function TierGate({ children }: TierGateProps) {
  const { tier } = useLicense();
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const location = useLocation();
  const isSuperAdmin = !!(user?.email && SUPER_ADMIN_EMAILS.includes(user.email.toLowerCase() as any));
  
  // Lógica de pontos digitais para o plano Intermediário
  const isIntermediario = tier === "intermediario";
  const configModos = empresaAtiva?.config_modos_preenchimento || {};
  
  // Identifica o POP relacionado à rota atual para verificar o modo
  // Esta lógica mapeia o path para o código do POP
  const currentPop = useMemo(() => {
    const path = location.pathname;
    if (path.includes("recebimento") || path.includes("fornecedores")) return "POP-01";
    if (path.includes("higiene")) return "POP-02";
    if (path.includes("saude")) return "POP-03";
    if (path.includes("agua")) return "POP-04";
    if (path.includes("pcp") || path.includes("producao")) return "POP-05";
    if (path.includes("manutencao")) return "POP-06";
    if (path.includes("pragas")) return "POP-07";
    if (path.includes("residuos")) return "POP-08";
    if (path.includes("armazenamento") || path.includes("transporte")) return "POP-09";
    if (path.includes("pac") || path.includes("auditoria")) return "POP-10";
    return null;
  }, [location.pathname]);

  const access = useMemo(() => {
    if (isSuperAdmin) return { allowed: true, hybrid: false, reason: "" };
    
    const baseAccess = checkAccess(tier, location.pathname);
    
    // Se for intermediário e o POP específico não estiver configurado como digital,
    // tratamos como híbrido (mesmo que o plano permita digital em outros)
    if (isIntermediario && currentPop && configModos[currentPop] !== "digital") {
      return { 
        allowed: true, 
        hybrid: true, 
        reason: `Este módulo está operando em modo Híbrido. No Plano Intermediário, você pode escolher quais POPs serão 100% digitais na configuração da empresa (limite de ${LIMITE_PONTOS_INTERMEDIARIO} pontos).` 
      };
    }
    
    return baseAccess;
  }, [tier, location.pathname, isSuperAdmin, isIntermediario, currentPop, configModos]);

  const shortcuts = useMemo(
    () => HYBRID_SHORTCUTS[location.pathname] ?? {
      templatePath: "/planilhas-pop",
      archivePath: "/documentos-bpf?upload=1&tipo=planilha",
    },
    [location.pathname],
  );

  if (!access.allowed) {
    return (
      <div className="flex items-center justify-center min-h-[50vh] p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Lock aria-hidden="true" className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">Recurso bloqueado</CardTitle>
                <Badge variant="outline" className="mt-1 text-xs">
                  Plano atual: {TIER_LABEL[tier]}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{access.reason}</p>
            <Button asChild className="w-full">
              <Link to="/dashboard">Voltar ao Dashboard</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (access.hybrid) {
    return (
      <>
        <div className="mb-4 p-4 rounded-lg bg-warning/10 border border-warning/30 flex items-start gap-3">
          <AlertTriangle aria-hidden="true" className="w-5 h-5 text-warning shrink-0 mt-0.5" />
          <div className="flex-1 text-sm space-y-2">
            <p className="font-semibold">Modo Híbrido — Plano Entrada</p>
            <p className="text-muted-foreground">{access.reason}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button asChild size="sm" variant="outline">
                <Link to={shortcuts.templatePath}>
                  <FileDown aria-hidden="true" className="w-4 h-4 mr-1" /> Baixar planilha em branco
                </Link>
              </Button>
              <Button asChild size="sm" variant="outline">
                <Link to={shortcuts.archivePath}>Arquivar arquivo preenchido</Link>
              </Button>
            </div>
          </div>
        </div>
        {/* No modo híbrido o conteúdo segue visível como referência (read-only ideal),
            mas inserções continuarão funcionando — o aviso orienta o fluxo correto. */}
        {children}
      </>
    );
  }

  return <>{children}</>;
}
