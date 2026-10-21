import { useState } from "react";
import { Sparkles, Loader2, CheckCircle2, XCircle, AlertTriangle, TrendingUp, FileSearch, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { DOCS_OBRIGATORIOS_POP } from "@/config/documentosObrigatoriosBPF";
import { toast } from "sonner";

interface AnaliseIA {
  resumo_geral: {
    score_conformidade: number;
    total_obrigatorios_essenciais: number;
    atendidos_essenciais: number;
    parecer: string;
  };
  por_pop: Array<{
    codigo: string;
    nome: string;
    score: number;
    atendidos: string[];
    faltando: string[];
    observacao: string;
  }>;
  recomendacoes_prioritarias: string[];
}

export default function AnaliseIA() {
  const { empresaAtiva } = useEmpresa();
  const empresaId = empresaAtiva?.id;
  const [analise, setAnalise] = useState<AnaliseIA | null>(null);
  const [stats, setStats] = useState<{ total_documentos: number; total_modelos: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const executar = async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analisar-acervo-custom", {
        body: { empresa_id: empresaId, obrigatorios: DOCS_OBRIGATORIOS_POP },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setAnalise((data as any).analise);
      setStats((data as any).stats);
      toast.success("Análise concluída");
    } catch (err: any) {
      toast.error("Erro na análise: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader icon={Sparkles} title="Análise por IA" description="Selecione uma empresa" />
        <EmpresaSelector />
      </div>
    );
  }

  const scoreCor = (s: number) => s >= 80 ? "text-emerald-600" : s >= 50 ? "text-amber-600" : "text-destructive";
  const scoreBg = (s: number) => s >= 80 ? "bg-emerald-500" : s >= 50 ? "bg-amber-500" : "bg-destructive";

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="Análise por IA"
        description="A IA compara seu acervo com os documentos obrigatórios"
       assuntoBaseLegal="autocontrole" />

      {!analise && (
        <Card className="border-2 border-dashed border-emerald-500/40 bg-emerald-500/5">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-500 flex items-center justify-center">
              <FileSearch className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Diagnóstico automático do seu acervo</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto mt-1">
                A IA lê todos os documentos importados, compara com a checklist oficial e diz o que falta em cada POP.
              </p>
            </div>
            <Button onClick={executar} disabled={loading} size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              {loading ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : <Sparkles className="w-5 h-5 mr-2" />}
              {loading ? "Analisando..." : "Executar análise agora"}
            </Button>
            <p className="text-[11px] text-muted-foreground">Leva cerca de 30-60 segundos. Consome créditos de IA da plataforma.</p>
          </CardContent>
        </Card>
      )}

      {analise && (
        <>
          {/* Resumo geral */}
          <Card>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">Conformidade geral</p>
                  <div className={`text-5xl font-bold ${scoreCor(analise.resumo_geral.score_conformidade)}`}>
                    {analise.resumo_geral.score_conformidade}<span className="text-2xl text-muted-foreground">/100</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    {analise.resumo_geral.atendidos_essenciais} de {analise.resumo_geral.total_obrigatorios_essenciais} documentos essenciais cobertos
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end text-right">
                  {stats && (
                    <>
                      <Badge variant="outline">{stats.total_documentos} documento(s) no acervo</Badge>
                      <Badge variant="outline">{stats.total_modelos} modelo(s) digital(is)</Badge>
                    </>
                  )}
                  <Button size="sm" variant="ghost" onClick={executar} disabled={loading} className="mt-2">
                    <RefreshCw className={`w-4 h-4 mr-1 ${loading ? "animate-spin" : ""}`} /> Reanalisar
                  </Button>
                </div>
              </div>
              <Progress value={analise.resumo_geral.score_conformidade} className="h-3" />
              <div className="p-3 rounded-lg bg-muted/40 text-sm">
                <strong className="text-emerald-700">Parecer da IA:</strong> {analise.resumo_geral.parecer}
              </div>
            </CardContent>
          </Card>

          {/* Recomendações */}
          {analise.recomendacoes_prioritarias?.length > 0 && (
            <Card className="border-amber-500/30 bg-amber-500/5">
              <CardContent className="p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-amber-600" />
                  <h3 className="font-bold">Recomendações prioritárias</h3>
                </div>
                <ul className="space-y-2">
                  {analise.recomendacoes_prioritarias.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-xs font-bold flex items-center justify-center shrink-0">{i + 1}</span>
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Detalhamento por POP */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-bold mb-3 px-2">Detalhamento por POP</h3>
              <Accordion type="multiple" className="space-y-2">
                {analise.por_pop.map((p) => (
                  <AccordionItem key={p.codigo} value={p.codigo} className="border rounded-lg px-4">
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-3 flex-1 text-left">
                        <Badge variant="outline" className="font-mono">{p.codigo}</Badge>
                        <span className="font-medium flex-1 truncate">{p.nome}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="w-20 h-2 rounded-full bg-muted overflow-hidden">
                            <div className={`h-full ${scoreBg(p.score)}`} style={{ width: `${p.score}%` }} />
                          </div>
                          <span className={`font-bold text-sm w-10 text-right ${scoreCor(p.score)}`}>{p.score}%</span>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 pb-4">
                      {p.observacao && (
                        <p className="text-sm text-muted-foreground italic border-l-2 border-emerald-500 pl-3">{p.observacao}</p>
                      )}
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <p className="text-xs font-semibold text-emerald-700 mb-1 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Atendidos ({p.atendidos.length})
                          </p>
                          {p.atendidos.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhum</p>
                          ) : (
                            <ul className="space-y-1">
                              {p.atendidos.map((a, i) => (
                                <li key={i} className="text-xs flex items-start gap-1.5">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 mt-0.5 shrink-0" />
                                  <span>{a}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-destructive mb-1 flex items-center gap-1">
                            <XCircle className="w-3.5 h-3.5" /> Faltando ({p.faltando.length})
                          </p>
                          {p.faltando.length === 0 ? (
                            <p className="text-xs text-muted-foreground">Nenhum ✓</p>
                          ) : (
                            <ul className="space-y-1">
                              {p.faltando.map((f, i) => (
                                <li key={i} className="text-xs flex items-start gap-1.5">
                                  <AlertTriangle className="w-3 h-3 text-destructive mt-0.5 shrink-0" />
                                  <span>{f}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
