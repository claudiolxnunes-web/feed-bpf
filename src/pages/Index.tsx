import { useEffect, useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LayoutDashboard, AlertTriangle, ClipboardCheck, GraduationCap, CheckCircle2,
  CalendarDays, Wrench, FileText, Droplets, Building2
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { differenceInDays, parseISO } from "date-fns";

import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useOnboarding, OnboardingOverlay } from "@/components/OnboardingTour";
import { OnboardingChecklist } from "@/components/OnboardingChecklist";

// Components extracted for memoization if needed
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { DashboardCharts } from "@/components/dashboard/DashboardCharts";
import { DashboardAlerts } from "@/components/dashboard/DashboardAlerts";
import { DashboardPriorities } from "@/components/dashboard/DashboardPriorities";
import { DashboardOperationalHealth } from "@/components/dashboard/DashboardOperationalHealth";
import { DashboardRecentNCs } from "@/components/dashboard/DashboardRecentNCs";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardPopStatus } from "@/components/dashboard/DashboardPopStatus";

const getPeriodoCutoff = (periodo: string) => {
  if (periodo === "todos") return null;
  const base = new Date();
  const cutoff = new Date(base);
  if (periodo === "mes") cutoff.setMonth(base.getMonth() - 1);
  if (periodo === "trimestre") cutoff.setMonth(base.getMonth() - 3);
  if (periodo === "semestre") cutoff.setMonth(base.getMonth() - 6);
  if (periodo === "ano") cutoff.setFullYear(base.getFullYear() - 1);
  return cutoff.toISOString().split("T")[0];
};

const progressFromOverdue = (overdue: number, total: number) => {
  if (total <= 0) return 100;
  return Math.max(0, Math.round(((total - overdue) / total) * 100));
};

export default function Index() {
  const { user } = useAuth();
  const { empresas, empresaAtiva } = useEmpresa();
  const { showOnboarding, iniciarTour, fecharTour } = useOnboarding({ autoStartEnabled: (empresas?.length ?? 0) > 0 });
  const [periodoFiltro, setPeriodoFiltro] = useState("todos");

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id, empresaAtiva?.id, periodoFiltro],
    queryFn: async () => {
      if (!user) return null;

      const cutoff = getPeriodoCutoff(periodoFiltro);
      const addEmpresa = (q: any, dateField?: string) => {
        let r = q;
        if (empresaAtiva) r = r.eq("empresa_id", empresaAtiva.id);
        else r = r.eq("user_id", user.id);
        if (cutoff && dateField) r = r.gte(dateField, cutoff);
        return r;
      };

      const [ncsRes, checklistRes, treinamentosRes, recentNcsRes, planejamentoRes, calibracoesRes, documentosRes, execPopsRes] = await Promise.all([
        addEmpresa(supabase.from("nao_conformidades").select("data, status")),
        addEmpresa(supabase.from("checklist_items").select("area, conforme, auditoria_data")),
        addEmpresa(supabase.from("treinamentos").select("funcionario, treinamento, validade")),
        addEmpresa(supabase.from("nao_conformidades").select("setor, descricao, status, data")).order("data", { ascending: false }).limit(5),
        addEmpresa(supabase.from("planejamento_anual").select("atividade, proxima_execucao, categoria")).not("proxima_execucao", "is", null),
        addEmpresa(supabase.from("calibracoes").select("equipamento, proxima_calibracao, status")),
        addEmpresa(supabase.from("documentos").select("nome, codigo, proxima_revisao, validade_revisao, status")),
        addEmpresa(supabase.from("execucao_pops").select("codigo_pop, data_execucao, status")).order("data_execucao", { ascending: false }),
      ]);

      const ncs = ncsRes.data || [];
      const checklist = checklistRes.data || [];
      const treinamentos = treinamentosRes.data || [];
      const recentNCs = (recentNcsRes.data || []).map(nc => ({
        setor: nc.setor, descricao: nc.descricao, status: nc.status || "aberta"
      }));

      const ncAbertas = ncs.filter(nc => nc.status === "aberta" || nc.status === "em_andamento").length;
      const auditoriasRealizadas = new Set(checklist.map(c => c.auditoria_data).filter(Boolean)).size;

      const hoje = new Date();
      const em30dias = new Date();
      em30dias.setDate(hoje.getDate() + 30);

      const alertas: any[] = [];
      const treinamentosPendentes = treinamentos.filter((t: any) => !t.validade || new Date(t.validade) <= em30dias).length;

      treinamentos.forEach((t: any) => {
        if (!t.validade) return;
        const dias = differenceInDays(parseISO(t.validade), hoje);
        if (dias <= 30) alertas.push({ tipo: "treinamento", descricao: `${t.treinamento} — ${t.funcionario}`, vencimento: t.validade, diasRestantes: dias, link: "/treinamentos" });
      });

      const calibracoes = calibracoesRes.data || [];
      let calibracoesVencidas = 0;
      calibracoes.forEach((c: any) => {
        if (!c.proxima_calibracao) return;
        const dias = differenceInDays(parseISO(c.proxima_calibracao), hoje);
        if (dias <= 30) {
          if (dias < 0) calibracoesVencidas++;
          alertas.push({ tipo: "calibracao", descricao: `${c.equipamento}`, vencimento: c.proxima_calibracao, diasRestantes: dias, link: "/manutencao" });
        }
      });

      const documentos = documentosRes.data || [];
      let docsVencidos = 0;
      documentos.forEach((d: any) => {
        const dataRef = d.proxima_revisao || d.validade_revisao;
        if (!dataRef) return;
        const dias = differenceInDays(parseISO(dataRef), hoje);
        if (dias <= 30) {
          if (dias < 0) docsVencidos++;
          alertas.push({ tipo: "documento", descricao: `${d.codigo} — ${d.nome}`, vencimento: dataRef, diasRestantes: dias, link: "/documentos" });
        }
      });

      alertas.sort((a, b) => a.diasRestantes - b.diasRestantes);

      const areaMap = new Map<string, { total: number; conformes: number }>();
      checklist.forEach(c => {
        const entry = areaMap.get(c.area) || { total: 0, conformes: 0 };
        entry.total++;
        if (c.conforme === true) entry.conformes++;
        areaMap.set(c.area, entry);
      });
      const conformidadePorArea = Array.from(areaMap.entries()).map(([area, { total, conformes }]) => ({
        area: area.replace(/^\d+\.\s*/, "").split("(")[0].trim(),
        pct: total > 0 ? Math.round((conformes / total) * 100) : 0,
      }));

      const totalChecklist = checklist.length;
      const totalConformes = checklist.filter(c => c.conforme === true).length;
      const conformidadeBPF = totalChecklist > 0 ? Math.round((totalConformes / totalChecklist) * 100) : 0;

      const planejamento = (planejamentoRes.data || []) as any[];
      const atividadesVencidas = planejamento.filter(p => p.proxima_execucao && differenceInDays(parseISO(p.proxima_execucao), hoje) < 0);
      
      const acoesPrioritarias = [];
      if (calibracoesVencidas > 0) acoesPrioritarias.push({ titulo: "Regularizar calibrações vencidas", detalhe: `${calibracoesVencidas} equipamento(s) exigem ação imediata.`, criticidade: "critico", link: "/manutencao" });
      if (docsVencidos > 0) acoesPrioritarias.push({ titulo: "Revisar documentos obrigatórios", detalhe: `${docsVencidos} documento(s) estão vencidos ou fora da revisão.`, criticidade: "critico", link: "/documentos" });
      
      // Alertas de Conformidade MAPA (IN 04/2007)
      if (docsVencidos > 0 || alertas.some(a => a.tipo === "documento")) {
        acoesPrioritarias.push({ 
          titulo: "Conformidade MAPA (Revisão Anual)", 
          detalhe: "POPs e ITs exigem revisão anual obrigatória.", 
          criticidade: docsVencidos > 0 ? "critico" : "atencao", 
          link: "/planilhas-pop" 
        });
      }

      if (treinamentosPendentes > 0) acoesPrioritarias.push({ titulo: "Atualizar treinamentos da equipe", detalhe: `${treinamentosPendentes} treinamento(s) vencem em até 30 dias.`, criticidade: treinamentosPendentes >= 5 ? "critico" : "atencao", link: "/treinamentos" });
      if (ncAbertas > 0) acoesPrioritarias.push({ titulo: "Fechar não conformidades em aberto", detalhe: `${ncAbertas} ocorrência(s) impactando a rotina de BPF.`, criticidade: ncAbertas >= 5 ? "critico" : "atencao", link: "/nao-conformidades" });
      
      return {
        ncAbertas, auditoriasRealizadas, treinamentosPendentes, conformidadeBPF,
        recentNCs, conformidadePorArea, ncs, checklist,
        alertasVencimento: alertas, calibracoesVencidas, docsVencidos, acoesPrioritarias,
        saudeOperacional: [
          { label: "Agenda regulatória", valor: progressFromOverdue(calibracoesVencidas + docsVencidos, Math.max(alertas.length, 1)), descricao: `${alertas.length} alerta(s) monitorado(s).`, link: "/documentos" },
          { label: "Treinamento da equipe", valor: progressFromOverdue(treinamentosPendentes, Math.max(treinamentos.length, 1)), descricao: `${treinamentosPendentes} pendência(s).`, link: "/treinamentos" },
          { label: "Resposta a desvios", valor: progressFromOverdue(ncAbertas, Math.max(ncs.length, 1)), descricao: `${ncAbertas} NC(s) em aberto.`, link: "/nao-conformidades" },
        ],
        execucoes: execPopsRes.data || [],
        documentosResData: documentosRes.data || []
      };
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5,
  });

  if (isLoading) return <div className="p-8"><Skeleton className="h-8 w-64 mb-4"/><Skeleton className="h-[400px] w-full"/></div>;
  if (!data) return null;

  return (
    <div className="space-y-8 pb-10">
      {data.ncAbertas === 0 && data.auditoriasRealizadas === 0 && (
        <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg text-white">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-sm">Bem-vindo ao Feed_BPF!</p>
              <p className="text-xs text-muted-foreground">Para começar a operar, certifique-se de que sua empresa está cadastrada corretamente.</p>
            </div>
          </div>
          <Link to="/cadastro">
            <Button size="sm" variant="outline" className="whitespace-nowrap">Ver Cadastro de Empresas</Button>
          </Link>
        </div>
      )}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <PageHeader icon={LayoutDashboard} title="Painel de Controle" description="Visão geral da conformidade e indicadores de BPF" />
        <div className="flex items-center gap-3">
          <Select value={periodoFiltro} onValueChange={setPeriodoFiltro}>
            <SelectTrigger className="w-[180px] bg-card/50 backdrop-blur-sm border-primary/20"><SelectValue placeholder="Período" /></SelectTrigger>
            <SelectContent><SelectItem value="todos">Todo o histórico</SelectItem><SelectItem value="mes">Últimos 30 dias</SelectItem><SelectItem value="trimestre">Último trimestre</SelectItem><SelectItem value="semestre">Último semestre</SelectItem><SelectItem value="ano">Último ano</SelectItem></SelectContent>
          </Select>
        </div>
      </div>

      <OnboardingChecklist onStartTour={iniciarTour} />



      <DashboardStats 
        conformidadeBPF={data.conformidadeBPF}
        ncAbertas={data.ncAbertas}
        auditoriasRealizadas={data.auditoriasRealizadas}
        treinamentosPendentes={data.treinamentosPendentes}
        calibracoesVencidas={data.calibracoesVencidas}
        docsVencidos={data.docsVencidos}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <DashboardCharts ncs={data.ncs} checklist={data.checklist} conformidadePorArea={data.conformidadePorArea} />
          <DashboardRecentNCs recentNCs={data.recentNCs} />
        </div>
        <div className="space-y-6">
          <DashboardPriorities acoes={data.acoesPrioritarias} />
          <DashboardOperationalHealth items={data.saudeOperacional} />
          <DashboardPopStatus execucoes={data.execucoes} documentos={data.documentosResData || []} />
          <DashboardAlerts alertas={data.alertasVencimento} />
        </div>
      </div>

      {showOnboarding && <OnboardingOverlay onClose={fecharTour} />}
    </div>
  );
}
