import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users, TrendingUp, Key, AlertTriangle, MessageSquare, Megaphone,
  Target, Award, Clock, Activity, RefreshCw, ArrowRight, Loader2, DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";

interface DashboardData {
  leadsTotal: number;
  leadsPendentes: number;
  leadsNovos7d: number;
  crmGanhos: number;
  crmValorGanhos: number;
  crmEmNegociacao: number;
  crmValorNegociacao: number;
  licencasAtivas: number;
  licencasVencendo30d: number;
  licencasExpiradas: number;
  campanhasAtivas: number;
  campanhasEnviadas24h: number;
  whatsappStatus: "conectado" | "desconectado" | "desconhecido";
  errosCriticas24h: number;
  ultimaAtualizacao: Date;
}

interface Props {
  onNavigate: (tab: string) => void;
}

const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export default function SuperAdminDashboard({ onNavigate }: Props) {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const now = new Date();
      const in30d = new Date(now.getTime() + 30 * 86400000).toISOString().split("T")[0];
      const past7d = new Date(now.getTime() - 7 * 86400000).toISOString();
      const past24h = new Date(now.getTime() - 24 * 3600000).toISOString();
      const hoje = now.toISOString().split("T")[0];

      const leadsRes: any = await supabase.from("leads").select("id, notificado, created_at");
      const crmRes: any = await supabase.from("crm_pipeline").select("etapa, valor_estimado");
      const licencasRes: any = await supabase.functions.invoke("admin-licencas", { body: { action: "list" } });
      const campanhasRes: any = await (supabase.from as any)("campanhas").select("id, status").in("status", ["executando", "agendada", "pausada"]);
      const msgsRes: any = await (supabase.from as any)("campanha_mensagens").select("id", { count: "exact", head: true })
        .eq("status", "enviada").gte("enviado_em", past24h);
      const waRes: any = await (supabase.from as any)("whatsapp_config")
        .select("is_connected, last_known_status, last_status_check").limit(1).maybeSingle();
      const errosRes: any = await (supabase.from as any)("app_error_logs").select("id", { count: "exact", head: true })
        .in("error_type", ["boundary", "unhandled_error", "boot_failsafe"]).gte("created_at", past24h);

      const leads = leadsRes.data || [];
      const crm = crmRes.data || [];
      const licencas = (licencasRes.data as any[]) || [];

      const ganhos = crm.filter((i: any) => i.etapa === "ganho");
      const negociando = crm.filter((i: any) => ["qualificado", "proposta", "negociacao"].includes(i.etapa));

      const licAtivas = licencas.filter((l: any) =>
        l.liberado_admin || (l.status === "ativa" && l.data_expiracao && new Date(l.data_expiracao) > now)
      );
      const licVencendo = licAtivas.filter((l: any) =>
        l.data_expiracao && l.data_expiracao <= in30d && l.data_expiracao >= hoje
      );
      const licExpiradas = licencas.filter((l: any) =>
        l.data_expiracao && new Date(l.data_expiracao) < now && !l.liberado_admin
      );

      const wa = waRes.data as any;
      const waStatus: DashboardData["whatsappStatus"] =
        wa?.is_connected || wa?.last_known_status === "open" || wa?.last_known_status === "connected"
          ? "conectado"
          : wa?.last_known_status || wa
            ? "desconectado"
            : "desconhecido";

      setData({
        leadsTotal: leads.length,
        leadsPendentes: leads.filter((l: any) => !l.notificado).length,
        leadsNovos7d: leads.filter((l: any) => l.created_at && l.created_at >= past7d).length,
        crmGanhos: ganhos.length,
        crmValorGanhos: ganhos.reduce((s: number, i: any) => s + (Number(i.valor_estimado) || 0), 0),
        crmEmNegociacao: negociando.length,
        crmValorNegociacao: negociando.reduce((s: number, i: any) => s + (Number(i.valor_estimado) || 0), 0),
        licencasAtivas: licAtivas.length,
        licencasVencendo30d: licVencendo.length,
        licencasExpiradas: licExpiradas.length,
        campanhasAtivas: (campanhasRes.data || []).length,
        campanhasEnviadas24h: msgsRes.count || 0,
        whatsappStatus: waStatus,
        errosCriticas24h: errosRes.count || 0,
        ultimaAtualizacao: now,
      });
    } catch (err) {
      console.error("Erro dashboard:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void fetchData();
    const id = setInterval(() => void fetchData(), 60000);
    return () => clearInterval(id);
  }, []);

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const kpis = [
    {
      label: "Leads Totais", value: data.leadsTotal, icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-500/10",
      sub: `${data.leadsNovos7d} novos em 7d · ${data.leadsPendentes} pendentes`, tab: "leads",
    },
    {
      label: "Pipeline em Negociação", value: data.crmEmNegociacao, icon: TrendingUp, color: "text-indigo-600 dark:text-indigo-400", bg: "bg-indigo-500/10",
      sub: brl(data.crmValorNegociacao), tab: "crm",
    },
    {
      label: "Vendas Ganhas", value: data.crmGanhos, icon: Award, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10",
      sub: brl(data.crmValorGanhos), tab: "crm",
    },
    {
      label: "Licenças Ativas", value: data.licencasAtivas, icon: Key, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-500/10",
      sub: `${data.licencasVencendo30d} vencem em 30d`, tab: "licencas",
    },
    {
      label: "Campanhas Ativas", value: data.campanhasAtivas, icon: Megaphone, color: "text-purple-600 dark:text-purple-400", bg: "bg-purple-500/10",
      sub: `${data.campanhasEnviadas24h} msgs enviadas 24h`, tab: "campanhas",
    },
    {
      label: "WhatsApp",
      value: data.whatsappStatus === "conectado" ? "OK" : "OFF",
      icon: MessageSquare,
      color: data.whatsappStatus === "conectado" ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400",
      bg: data.whatsappStatus === "conectado" ? "bg-emerald-500/10" : "bg-rose-500/10",
      sub: data.whatsappStatus === "conectado" ? "Instância conectada" : "Verificar conexão",
      tab: "whatsapp",
    },
    {
      label: "Erros 24h",
      value: data.errosCriticas24h,
      icon: AlertTriangle,
      color: data.errosCriticas24h > 0 ? "text-rose-600 dark:text-rose-400" : "text-muted-foreground",
      bg: data.errosCriticas24h > 0 ? "bg-rose-500/10" : "bg-muted",
      sub: data.errosCriticas24h > 0 ? "Requer atenção" : "Sistema estável",
      tab: "error-logs",
    },
    {
      label: "Receita Fechada (CRM)", value: brl(data.crmValorGanhos), icon: DollarSign, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-500/10",
      sub: "Soma dos ganhos", tab: "crm",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          Atualizado {data.ultimaAtualizacao.toLocaleTimeString("pt-BR")} · Auto-refresh 60s
        </div>
        <Button size="sm" variant="outline" onClick={() => void fetchData()} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {kpis.map((k, i) => {
          const Icon = k.icon;
          return (
            <button key={i} type="button" onClick={() => onNavigate(k.tab)} className="text-left">
              <Card className="transition-all hover:shadow-md hover:-translate-y-0.5 border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className={`p-2 rounded-lg ${k.bg} ${k.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40" />
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-bold mb-1">{k.label}</p>
                  <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
                  <p className="text-[11px] text-muted-foreground mt-1 truncate">{k.sub}</p>
                </CardContent>
              </Card>
            </button>
          );
        })}
      </div>

      {(data.licencasVencendo30d > 0 || data.errosCriticas24h > 0 || data.whatsappStatus !== "conectado") && (
        <Card className="border-amber-500/30 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Ações Recomendadas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {data.licencasVencendo30d > 0 && (
              <button onClick={() => onNavigate("licencas")} className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 text-sm">
                <span>{data.licencasVencendo30d} licença(s) vencendo em 30 dias</span>
                <Badge variant="secondary">Ver licenças</Badge>
              </button>
            )}
            {data.whatsappStatus !== "conectado" && (
              <button onClick={() => onNavigate("whatsapp")} className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 text-sm">
                <span>WhatsApp desconectado — regenerar QR Code</span>
                <Badge variant="destructive">Reconectar</Badge>
              </button>
            )}
            {data.errosCriticas24h > 0 && (
              <button onClick={() => onNavigate("error-logs")} className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 text-sm">
                <span>{data.errosCriticas24h} erro(s) crítico(s) nas últimas 24h</span>
                <Badge variant="destructive">Investigar</Badge>
              </button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Atalhos Rápidos</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => onNavigate("campanhas")}>
              <Megaphone className="h-4 w-4" /> Nova Campanha WhatsApp
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => onNavigate("marketing")}>
              <Activity className="h-4 w-4" /> Gerar Headlines IA
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => onNavigate("licencas")}>
              <Key className="h-4 w-4" /> Liberar Licença Manual
            </Button>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Feed_BPF & Auditoria</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground mb-3">
              Verifique status de cadastros, logs de auditoria e erros específicos do Feed_BPF.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link to="/admin/auditoria-feedbpf" className="gap-2">
                  <Target className="h-4 w-4" /> Auditoria Feed_BPF
                </Link>
              </Button>
              <Button size="sm" variant="outline" asChild>
                <Link to="/dashboard" className="gap-2">
                  <Activity className="h-4 w-4" /> Abrir Feed_BPF
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
