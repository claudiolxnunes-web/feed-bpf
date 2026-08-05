import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ShieldCheck, Bug, Sparkles, Zap, AlertTriangle, CheckCircle2 } from "lucide-react";

type ChangeType = "fix" | "feature" | "security" | "performance" | "infra";

interface VersionEntry {
  version: string;
  date: string;
  title: string;
  type: ChangeType;
  changes: string[];
  impact: string;
  affects: string[];
  risk: "baixo" | "médio" | "alto";
}

const VERSIONS: VersionEntry[] = [
  {
    version: "v3.0.0",
    date: "01/08/2026",
    title: "Migração da infraestrutura e consolidação da BPF Suite",
    type: "infra",
    changes: [
      "Migração completa do banco para a infraestrutura Supabase administrada pela BPF Consult, com backup prévio e preservação dos dados existentes",
      "Aplicação e validação de 135 migrações, totalizando 110 tabelas, 230 políticas RLS e 43 rotinas no schema público",
      "Publicação e ativação das 52 Edge Functions da plataforma",
      "Configuração de autenticação, URLs de produção, Storage e integrações de IA e Evolution API",
      "Remoção das referências ativas ao projeto legado do Lovable e atualização dos editores estáticos para a infraestrutura atual",
      "Reforço de segurança no webhook de pagamentos, cabeçalhos HTTP, segredos operacionais e isolamento por RLS",
      "Ajuste da observabilidade Sentry, correção da resolução DNS da VPS e novo deploy validado em produção",
    ],
    impact:
      "A plataforma passa a operar integralmente na infraestrutura controlada pela BPF Consult, com maior governança, rastreabilidade e segurança. Dados existentes foram preservados e os fluxos principais permaneceram disponíveis após a migração.",
    affects: [
      "BPF Suite",
      "Supabase",
      "Autenticação",
      "Banco de dados e RLS",
      "Edge Functions",
      "Storage",
      "Integrações e observabilidade",
    ],
    risk: "alto",
  },
  {
    version: "v2.6.0",
    date: "10/06/2026",
    title: "Histórico de Versões & Auditoria Centralizada",
    type: "feature",
    changes: [
      "Nova aba 'Histórico' no Portal de Gestão com changelog estruturado",
      "Documentação de impacto e risco para cada release",
      "Centralização da auditoria do Feed_BPF dentro do Portal",
    ],
    impact:
      "Permite rastrear todas as mudanças efetivadas sem precisar acessar logs externos. Nenhum dado de cliente é afetado — apenas leitura.",
    affects: ["Portal de Gestão (BPF_Consult)"],
    risk: "baixo",
  },
  {
    version: "v2.5.0",
    date: "10/06/2026",
    title: "Detecção de versão desatualizada na tela de erro",
    type: "fix",
    changes: [
      "Tela de erro agora exibe timestamp do build atual",
      "Botão de limpeza profunda de cache (Service Worker + LocalStorage + Reload)",
      "Auto-reset da flag de erro quando o React monta com sucesso",
    ],
    impact:
      "Usuários presos em cache antigo conseguem se recuperar com 1 clique, sem precisar de suporte. Não altera dados — apenas storage do navegador.",
    affects: ["ErrorBoundary global", "main.tsx", "Todos os programas (Feed_BPF, Nutri_Agro, Audits_BPF)"],
    risk: "baixo",
  },
  {
    version: "v2.4.0",
    date: "09/06/2026",
    title: "Auditoria Feed_BPF (status de cadastros)",
    type: "feature",
    changes: [
      "Página /admin/auditoria-feedbpf com visão consolidada de usuários, empresas e licenças",
      "Listagem de últimos erros via app_error_logs",
      "Filtros por status (ativo / expirado / trial)",
    ],
    impact:
      "Visibilidade total da saúde do Feed_BPF em produção. Somente leitura via RLS — sem risco de alterar cadastros de clientes.",
    affects: ["SuperAdmin", "AuditoriaFeedBPF"],
    risk: "baixo",
  },
  {
    version: "v2.3.0",
    date: "08/06/2026",
    title: "Integração Sentry & logs de erros",
    type: "infra",
    changes: [
      "Captura automática de exceções no frontend",
      "Tabela app_error_logs com RLS para superadmin",
      "Notificação por e-mail para erros críticos",
    ],
    impact:
      "Erros em produção passam a ser visíveis em tempo real. Apenas observabilidade — não modifica fluxos de negócio.",
    affects: ["Todos os programas"],
    risk: "baixo",
  },
  {
    version: "v2.2.0",
    date: "05/06/2026",
    title: "CRM Comercial + Captura de Leads",
    type: "feature",
    changes: [
      "Pipeline Kanban /crm para etapas comerciais",
      "Edge function notify-new-lead envia para contato@bpfconsult.com.br",
      "Telefone obrigatório no signup, gravação em public.leads",
    ],
    impact:
      "Aumenta conversão de visitantes em leads qualificados. Dados de clientes existentes preservados (migração não-destrutiva).",
    affects: ["Auth", "CRM", "Landing pages /demo/:produto"],
    risk: "médio",
  },
  {
    version: "v2.1.0",
    date: "01/06/2026",
    title: "Multi-tenancy reforçada",
    type: "security",
    changes: [
      "Filtragem por empresa_id em todas as queries via useEmpresa",
      "Storage hierárquico {user_id}/{empresa_id}/...",
      "RLS revisada em todas as tabelas do schema public",
    ],
    impact:
      "Isolamento total entre clientes — impossível vazar dados entre empresas. Migração validada com backup prévio.",
    affects: ["Feed_BPF (todos os módulos)", "Storage bucket documentos-bpf"],
    risk: "alto",
  },
];

const TYPE_META: Record<ChangeType, { label: string; icon: any; className: string }> = {
  fix: { label: "Correção", icon: Bug, className: "bg-amber-500/10 text-amber-700 border-amber-500/20" },
  feature: { label: "Novo recurso", icon: Sparkles, className: "bg-primary/10 text-primary border-primary/20" },
  security: { label: "Segurança", icon: ShieldCheck, className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20" },
  performance: { label: "Performance", icon: Zap, className: "bg-blue-500/10 text-blue-700 border-blue-500/20" },
  infra: { label: "Infraestrutura", icon: Zap, className: "bg-indigo-500/10 text-indigo-700 border-indigo-500/20" },
};

const RISK_META = {
  baixo: { className: "bg-emerald-500/10 text-emerald-700 border-emerald-500/20", icon: CheckCircle2 },
  médio: { className: "bg-amber-500/10 text-amber-700 border-amber-500/20", icon: AlertTriangle },
  alto: { className: "bg-rose-500/10 text-rose-700 border-rose-500/20", icon: AlertTriangle },
} as const;

export default function VersionHistory() {
  return (
    <div className="space-y-6">
      <Card className="bg-gradient-to-br from-indigo-500/10 to-transparent border-indigo-500/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5 text-indigo-500" />
            Histórico de Versões — BPF_Consult / Feed_BPF
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Registro cronológico de todas as mudanças efetivadas, como foram aplicadas e qual o impacto esperado
            em produção. Use esta visão para auditar releases e comunicar clientes.
          </p>
        </CardHeader>
      </Card>

      <div className="relative space-y-4 before:absolute before:left-4 before:top-2 before:bottom-2 before:w-px before:bg-border md:before:left-6">
        {VERSIONS.map((v) => {
          const TypeIcon = TYPE_META[v.type].icon;
          const RiskIcon = RISK_META[v.risk].icon;
          return (
            <div key={v.version} className="relative pl-10 md:pl-14">
              <div className="absolute left-0 top-4 h-8 w-8 md:h-12 md:w-12 rounded-full bg-background border-2 border-primary/30 flex items-center justify-center">
                <TypeIcon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
              </div>
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-lg">{v.title}</CardTitle>
                        <Badge variant="outline" className="font-mono">{v.version}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{v.date}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={TYPE_META[v.type].className}>
                        {TYPE_META[v.type].label}
                      </Badge>
                      <Badge variant="outline" className={RISK_META[v.risk].className}>
                        <RiskIcon className="h-3 w-3 mr-1" />
                        Risco {v.risk}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-2">
                      O que mudou
                    </h4>
                    <ul className="space-y-1.5">
                      {v.changes.map((c, i) => (
                        <li key={i} className="text-sm flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 shrink-0" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Impacto / Como afeta clientes
                      </h4>
                      <p className="text-sm">{v.impact}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <h4 className="text-xs font-semibold uppercase text-muted-foreground mb-1">
                        Áreas afetadas
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {v.affects.map((a, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{a}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          );
        })}
      </div>
    </div>
  );
}
