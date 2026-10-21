import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Database,
  Server, MessageSquare, Mail, Clock, HardDrive, Loader2, Zap,
} from "lucide-react";

type Status = "ok" | "warn" | "down" | "checking";

interface HealthCheck {
  id: string;
  label: string;
  icon: any;
  status: Status;
  latencyMs?: number;
  detail: string;
  checkedAt?: Date;
}

const STATUS_CFG: Record<Status, { color: string; bg: string; label: string; Icon: any }> = {
  ok:       { color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/30", label: "Operacional", Icon: CheckCircle2 },
  warn:     { color: "text-amber-600 dark:text-amber-400",     bg: "bg-amber-500/10 border-amber-500/30",     label: "Atenção",     Icon: AlertTriangle },
  down:     { color: "text-rose-600 dark:text-rose-400",       bg: "bg-rose-500/10 border-rose-500/30",       label: "Indisponível",Icon: XCircle },
  checking: { color: "text-muted-foreground",                  bg: "bg-muted",                                label: "Verificando", Icon: Loader2 },
};

export default function SystemHealthPanel() {
  const [checks, setChecks] = useState<HealthCheck[]>([]);
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const runChecks = async () => {
    setRunning(true);
    const results: HealthCheck[] = [];
    const now = new Date();

    // 1. Database (round-trip via lightweight query)
    {
      const t = performance.now();
      const { error } = await supabase.from("profiles").select("id", { head: true, count: "exact" }).limit(1);
      const ms = Math.round(performance.now() - t);
      results.push({
        id: "db",
        label: "Banco de Dados",
        icon: Database,
        status: error ? "down" : ms > 1500 ? "warn" : "ok",
        latencyMs: ms,
        detail: error ? `Erro: ${error.message}` : `Resposta em ${ms}ms`,
        checkedAt: new Date(),
      });
    }

    // 2. Edge Functions (ping via admin-licencas list – lightweight, already used)
    {
      const t = performance.now();
      try {
        const { error } = await supabase.functions.invoke("admin-licencas", { body: { action: "list" } });
        const ms = Math.round(performance.now() - t);
        results.push({
          id: "edge",
          label: "Edge Functions",
          icon: Server,
          status: error ? "down" : ms > 3000 ? "warn" : "ok",
          latencyMs: ms,
          detail: error ? `Erro: ${error.message}` : `Resposta em ${ms}ms`,
          checkedAt: new Date(),
        });
      } catch (e: any) {
        results.push({
          id: "edge", label: "Edge Functions", icon: Server, status: "down",
          detail: e?.message || "Falha ao invocar", checkedAt: new Date(),
        });
      }
    }

    // 3. WhatsApp / Evolution
    {
      const { data } = await (supabase.from as any)("whatsapp_config")
        .select("is_connected, last_known_status, last_status_check, instance_name")
        .limit(1).maybeSingle();
      const st = data?.last_known_status;
      const conectado = !!data?.is_connected || st === "open" || st === "connected";
      const ultima = data?.last_status_check ? new Date(data.last_status_check) : null;
      const staleMin = ultima ? (Date.now() - ultima.getTime()) / 60000 : Infinity;
      results.push({
        id: "wa",
        label: "WhatsApp (Evolution)",
        icon: MessageSquare,
        status: !data ? "warn" : conectado ? (staleMin > 30 ? "warn" : "ok") : "down",
        detail: !data
          ? "Nenhuma instância configurada"
          : `${data.instance_name || "—"} · ${st || "desconhecido"}${ultima ? ` · verif. ${Math.round(staleMin)}min atrás` : ""}`,
        checkedAt: new Date(),
      });
    }

    // 4. Fila de e-mails
    {
      const past1h = new Date(Date.now() - 3600000).toISOString();
      const { count: pend } = await (supabase.from as any)("email_send_state")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending");
      const { count: falhas } = await (supabase.from as any)("email_send_log")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed").gte("created_at", past1h);
      const pendN = pend || 0;
      const falhasN = falhas || 0;
      results.push({
        id: "email",
        label: "Fila de E-mails",
        icon: Mail,
        status: falhasN > 5 ? "down" : pendN > 50 || falhasN > 0 ? "warn" : "ok",
        detail: `${pendN} pendentes · ${falhasN} falhas na última hora`,
        checkedAt: new Date(),
      });
    }

    // 5. Erros críticos recentes
    {
      const past1h = new Date(Date.now() - 3600000).toISOString();
      const { count } = await (supabase.from as any)("app_error_logs")
        .select("id", { count: "exact", head: true })
        .in("error_type", ["boundary", "unhandled_error", "boot_failsafe"])
        .gte("created_at", past1h);
      const n = count || 0;
      results.push({
        id: "errors",
        label: "Erros da Aplicação (1h)",
        icon: AlertTriangle,
        status: n >= 10 ? "down" : n > 0 ? "warn" : "ok",
        detail: `${n} erro(s) crítico(s) na última hora`,
        checkedAt: new Date(),
      });
    }

    // 6. Campanhas / worker
    {
      const past15m = new Date(Date.now() - 15 * 60000).toISOString();
      const { count: exec } = await (supabase.from as any)("campanhas")
        .select("id", { count: "exact", head: true }).eq("status", "executando");
      const { count: recentes } = await (supabase.from as any)("campanha_mensagens")
        .select("id", { count: "exact", head: true })
        .eq("status", "enviada").gte("enviado_em", past15m);
      const execN = exec || 0;
      results.push({
        id: "campanhas",
        label: "Worker de Campanhas",
        icon: Zap,
        status: execN > 0 && (recentes || 0) === 0 ? "warn" : "ok",
        detail: `${execN} em execução · ${recentes || 0} enviadas nos últimos 15min`,
        checkedAt: new Date(),
      });
    }

    // 7. Storage bucket documentos-bpf
    {
      try {
        const { error } = await supabase.storage.from("documentos-bpf").list("", { limit: 1 });
        results.push({
          id: "storage",
          label: "Storage (documentos-bpf)",
          icon: HardDrive,
          status: error ? "down" : "ok",
          detail: error ? `Erro: ${error.message}` : "Bucket acessível",
          checkedAt: new Date(),
        });
      } catch (e: any) {
        results.push({
          id: "storage", label: "Storage (documentos-bpf)", icon: HardDrive, status: "down",
          detail: e?.message || "Falha", checkedAt: new Date(),
        });
      }
    }

    setChecks(results);
    setLastRun(now);
    setRunning(false);
  };

  useEffect(() => {
    void runChecks();
    const id = setInterval(() => void runChecks(), 120000); // 2min
    return () => clearInterval(id);
  }, []);

  const okCount = checks.filter(c => c.status === "ok").length;
  const warnCount = checks.filter(c => c.status === "warn").length;
  const downCount = checks.filter(c => c.status === "down").length;
  const overall: Status = downCount > 0 ? "down" : warnCount > 0 ? "warn" : "ok";
  const overallCfg = STATUS_CFG[overall];

  return (
    <div className="space-y-6">
      <Card className={`border-2 ${overallCfg.bg}`}>
        <CardContent className="p-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-full ${overallCfg.bg} ${overallCfg.color}`}>
              <overallCfg.Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Status Geral do Sistema</p>
              <p className={`text-2xl font-black ${overallCfg.color}`}>{overallCfg.label}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {okCount} OK · {warnCount} atenção · {downCount} indisponível
                {lastRun && ` · Última verificação: ${lastRun.toLocaleTimeString("pt-BR")}`}
              </p>
            </div>
          </div>
          <Button size="sm" variant="outline" onClick={() => void runChecks()} disabled={running} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${running ? "animate-spin" : ""}`} />
            Rodar checks
          </Button>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(checks.length === 0 && running ? Array.from({ length: 7 }).map((_, i) => ({
          id: `s${i}`, label: "Verificando...", icon: Activity, status: "checking" as Status, detail: "—",
        })) : checks).map((c) => {
          const cfg = STATUS_CFG[c.status];
          const Icon = c.icon;
          const StatusIcon = cfg.Icon;
          return (
            <Card key={c.id} className={`border ${cfg.bg}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2">
                    <Icon className={`h-4 w-4 ${cfg.color}`} />
                    {c.label}
                  </span>
                  <Badge variant="outline" className={`${cfg.color} gap-1`}>
                    <StatusIcon className={`h-3 w-3 ${c.status === "checking" ? "animate-spin" : ""}`} />
                    {cfg.label}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">{c.detail}</p>
                {c.latencyMs !== undefined && (
                  <p className="text-[10px] text-muted-foreground mt-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" /> {c.latencyMs}ms
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Sobre este painel</CardTitle>
        </CardHeader>
        <CardContent className="text-xs text-muted-foreground space-y-1">
          <p>• Auto-refresh a cada 2 minutos. Cada card mede um serviço crítico do BPF_Consult.</p>
          <p>• <strong className="text-foreground">OK</strong>: operacional · <strong className="text-foreground">Atenção</strong>: degradado ou próximo do limite · <strong className="text-foreground">Indisponível</strong>: falha detectada.</p>
          <p>• Erros críticos e WhatsApp desconectado disparam alerta automático no Dashboard.</p>
        </CardContent>
      </Card>
    </div>
  );
}
