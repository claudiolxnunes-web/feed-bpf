import { useState, useEffect, useCallback, useMemo } from "react";
import { ClipboardList, Plus, Download, Check, FileSpreadsheet, ExternalLink, Info, CalendarDays, RefreshCcw } from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { POPS_CONFIG, type PopConfig, type PopPeriodicidade } from "@/config/popsConfig";
import PopPlanilhaForm from "@/components/pop/PopPlanilhaForm";
import { TEMPLATE_GENERATORS, exportPopDataToExcel } from "@/utils/excelTemplates";
import { markPopVisited } from "@/components/OnboardingChecklist";

const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

export default function PlanilhasPop() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialPopCode = searchParams.get("pop");
  const [selectedPop, setSelectedPop] = useState<PopConfig>(POPS_CONFIG[1]); // POP-02 default
  const preselectedPop = useMemo(
    () => POPS_CONFIG.find((p) => p.codigo === initialPopCode) ?? null,
    [initialPopCode],
  );

  useEffect(() => { markPopVisited(); }, []);


  useEffect(() => {
    if (preselectedPop) setSelectedPop(preselectedPop);
  }, [preselectedPop]);

  const [selectedPeriodicidade, setSelectedPeriodicidade] = useState<PopPeriodicidade | null>(null);
  const [mes, setMes] = useState(new Date().getMonth() + 1);
  const [ano, setAno] = useState(new Date().getFullYear());
  const [planilhaId, setPlanilhaId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    if (selectedPop.periodicidades.length > 0) {
      // POP-04: pré-seleciona conforme origem_agua da empresa ativa
      if (selectedPop.codigo === "POP-04" && empresaAtiva?.origem_agua) {
        const targetKey = empresaAtiva.origem_agua === "concessionaria" ? "cloro_semanal" : "cloro_diario";
        const match = selectedPop.periodicidades.find((p) => p.key === targetKey);
        setSelectedPeriodicidade(match ?? selectedPop.periodicidades[0]);
      } else {
        setSelectedPeriodicidade(selectedPop.periodicidades[0]);
      }
    } else {
      setSelectedPeriodicidade(null);
    }
  }, [selectedPop, empresaAtiva?.origem_agua]);

  const loadOrCreatePlanilha = useCallback(async (per?: PopPeriodicidade) => {
    const target = per || selectedPeriodicidade;
    if (!user) return;
    if (!target) {
      toast.error("Selecione uma periodicidade antes de abrir a planilha.");
      return;
    }
    if (selectedPop.codigo === "POP-04") {
      const validKeys = ["cloro_diario", "cloro_semanal"];
      if (!validKeys.includes(target.key)) {
        toast.error("POP-04 exige Cloro Diário (poço) ou Cloro Semanal (concessionária).");
        return;
      }
      if (!empresaAtiva?.origem_agua) {
        toast.warning("Defina a origem da água no Cadastro da empresa para automatizar a periodicidade.");
      } else {
        const esperado = empresaAtiva.origem_agua === "concessionaria" ? "cloro_semanal" : "cloro_diario";
        if (target.key !== esperado) {
          toast.warning(
            `Empresa configurada como "${empresaAtiva.origem_agua}". Recomendado: ${esperado === "cloro_semanal" ? "Semanal" : "Diário"}.`
          );
        }
      }
    }
    setLoading(true);


    const { data: existing } = await supabase
      .from("pop_planilhas")
      .select("id")
      .eq("user_id", user.id)
      .eq("pop_codigo", selectedPop.codigo)
      .eq("periodicidade", target.key)
      .eq("mes", mes)
      .eq("ano", ano)
      .maybeSingle();

    if (existing) {
      setPlanilhaId(existing.id);
    } else {
      const { data: created, error } = await supabase
        .from("pop_planilhas")
        .insert({
          user_id: user.id,
          pop_codigo: selectedPop.codigo,
          pop_nome: selectedPop.nome,
          periodicidade: target.key,
          mes,
          ano,
        })
        .select("id")
        .single();

      if (error) {
        toast.error("Erro ao criar planilha: " + error.message);
        setLoading(false);
        return;
      }
      setPlanilhaId(created.id);
    }

    setLoading(false);
    setShowForm(true);
  }, [user, selectedPop, selectedPeriodicidade, mes, ano, empresaAtiva?.origem_agua]);

  const exportToExcel = async () => {
    if (!planilhaId || !selectedPeriodicidade || !selectedPop) return;

    const { data: itens } = await supabase
      .from("pop_planilha_itens")
      .select("*")
      .eq("planilha_id", planilhaId);

    const rows = itens || [];
    
    exportPopDataToExcel(
      { codigo: selectedPop.codigo, nome: selectedPop.nome },
      selectedPeriodicidade,
      mes,
      ano,
      rows
    );
    
    toast.success("Planilha exportada com sucesso!");
  };


  if (showForm && planilhaId && selectedPeriodicidade) {
    return (
      <>
        <PageHeader icon={ClipboardList} title={`${selectedPop.codigo} - ${selectedPeriodicidade.label}`} description={`${MESES[mes - 1]} / ${ano}`}
        orientacaoModuloId="planilhas-pop" />
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={() => setShowForm(false)}>
            ← Voltar
          </Button>
          <Button variant="outline" size="sm" onClick={exportToExcel}>
            <Download className="w-4 h-4 mr-1" /> Exportar Excel
          </Button>

        </div>
        <PopPlanilhaForm
          planilhaId={planilhaId}
          periodicidade={selectedPeriodicidade}
          userId={user!.id}
          popCodigo={selectedPop.codigo}
          popNome={selectedPop.nome}
          empresaId={empresaAtiva?.id}
        />
      </>
    );
  }

  return (
    <>
      <PageHeader icon={ClipboardList} title="Planilhas de POPs" description="Registros específicos por atividade conforme IN 04/2007" />

      {/* Seleção de POP */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">POP</label>
          <Select
            value={selectedPop.codigo}
            onValueChange={(v) => {
              const pop = POPS_CONFIG.find((p) => p.codigo === v);
              if (pop) setSelectedPop(pop);
            }}
          >
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {POPS_CONFIG.map((p) => {
                const popNum = p.codigo.split("-")[1]?.replace(/^0+/, "");
                return (
                  <SelectItem key={p.codigo} value={p.codigo}>
                    Pop {popNum} - {p.nome}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Mês</label>
          <Select value={String(mes)} onValueChange={(v) => setMes(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium text-foreground mb-1.5 block">Ano</label>
          <Select value={String(ano)} onValueChange={(v) => setAno(Number(v))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {[2024, 2025, 2026, 2027].map((a) => (
                <SelectItem key={a} value={String(a)}>{a}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Descrição do POP */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">{selectedPop.codigo} - {selectedPop.nome}</CardTitle>
          <CardDescription>{selectedPop.descricao}</CardDescription>
          <div className="flex flex-wrap gap-2 pt-2">
            <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] py-0">
              <CalendarDays className="w-3 h-3 mr-1" /> Vencimento: 1 Ano
            </Badge>
            <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] py-0">
              <RefreshCcw className="w-3 h-3 mr-1" /> Revisão Anual Obrigatória
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Aviso de lançamento único em módulos específicos */}
      {selectedPop.modulos_vinculados && selectedPop.modulos_vinculados.length > 0 && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Info className="w-4 h-4 text-primary" />
              Lançamento único — registros operacionais deste POP
            </CardTitle>
            <CardDescription className="text-xs">
              Para evitar duplicidade, os registros do dia a dia deste POP são feitos diretamente nos módulos abaixo.
              As planilhas digitais oficiais (com assinatura RT) e os relatórios já consomem esses dados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedPop.modulos_vinculados.map((m) => (
                <Button
                  key={m.rota}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-2 text-left"
                  onClick={() => navigate(m.rota)}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-2 shrink-0 text-primary" />
                  <span className="flex flex-col items-start">
                    <span className="font-medium text-xs">{m.label}</span>
                    <span className="text-[11px] text-muted-foreground font-normal">{m.descricao}</span>
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Planilhas para Impressão (modelos manuais em branco) */}
      {selectedPop.planilhas_impressao && selectedPop.planilhas_impressao.length > 0 && (
        <Card className="mb-6 border-primary/40 bg-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Download className="w-4 h-4 text-primary" />
              Planilhas para Impressão (registro manual em campo)
            </CardTitle>
            <CardDescription className="text-xs">
              Modelos em branco para imprimir, preencher à mão e arquivar (mínimo 2 anos — IN 04/2007 MAPA).
              Para preenchimento digital com assinatura, use os módulos vinculados acima.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {selectedPop.planilhas_impressao.map((p) => (
                <Button
                  key={p.arquivo}
                  variant="outline"
                  size="sm"
                  className="justify-start h-auto py-2 text-left"
                  onClick={() => {
                    const gen = TEMPLATE_GENERATORS[p.arquivo];
                    if (gen) {
                      gen();
                      toast.success("Planilha gerada");
                    } else {
                      toast.error("Modelo não encontrado");
                    }
                  }}
                >
                  <Download className="w-3.5 h-3.5 mr-2 shrink-0 text-primary" />
                  <span className="flex flex-col items-start">
                    <span className="font-medium text-xs">{p.label}</span>
                    <span className="text-[11px] text-muted-foreground font-normal">{p.descricao}</span>
                  </span>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      {selectedPop.periodicidades.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-8 text-center">
            <ClipboardList className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">
              Este POP não possui planilhas próprias nesta tela. Todos os registros são lançados nos módulos vinculados acima.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Periodicidades disponíveis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedPop.periodicidades.map((per) => (
          <Card
            key={per.key}
            className="border border-border hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedPeriodicidade(per);
              loadOrCreatePlanilha(per);
            }}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">{per.label}</CardTitle>
                <Badge variant="secondary" className="text-xs">{per.periodos.length} períodos</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {per.areas.slice(0, 4).map((a) => (
                  <p key={a.area} className="text-xs text-muted-foreground">• {a.area}</p>
                ))}
                {per.areas.length > 4 && (
                  <p className="text-xs text-muted-foreground font-medium">+ {per.areas.length - 4} áreas</p>
                )}
              </div>
              <Button
                size="sm"
                className="w-full mt-3"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPeriodicidade(per);
                  loadOrCreatePlanilha(per);
                }}
              >
                <FileSpreadsheet className="w-4 h-4 mr-1" /> Abrir Planilha
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
