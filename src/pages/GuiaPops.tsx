import { useState, useEffect } from "react";
import { BookOpen, FileText, Droplets, Users, ShieldCheck, Wrench, Bug, Recycle, Search, Beaker, ClipboardCheck, ListChecks, Hammer, ShieldAlert, Clock, Package, ChevronLeft } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { POP_TEXTOS } from "@/config/popTextos";
import { POPS_CONFIG } from "@/config/popsConfig";
import { INSTRUCOES_TRABALHO } from "@/config/instrucoesTrabalho";
import { useSearchParams } from "react-router-dom";
import { markPopVisited } from "@/components/OnboardingChecklist";

const POP_ICONS: Record<string, React.ElementType> = {
  "POP-01": Users, "POP-02": Droplets, "POP-03": ClipboardCheck, "POP-04": Beaker,
  "POP-05": ShieldCheck, "POP-06": Wrench, "POP-07": Bug, "POP-08": Recycle, "POP-09": Search,
  "POP-10": FileText,
};

function Tip({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-muted/50 rounded-lg p-3 flex gap-2 items-start border border-border/50">
      <p className="text-xs text-muted-foreground"><span className="font-bold text-primary mr-1">Dica:</span>{children}</p>
    </div>
  );
}

function PopContent({ codigo }: { codigo: string }) {
  const texto = POP_TEXTOS.find(p => p.codigo === codigo);
  const config = POPS_CONFIG.find(p => p.codigo === codigo);
  if (!texto) return null;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-muted/30">
          <CardHeader className="py-3 px-4"><CardTitle className="text-sm">1. Objetivo</CardTitle></CardHeader>
          <CardContent className="py-0 px-4 pb-3"><p className="text-xs text-muted-foreground">{texto.objetivo}</p></CardContent>
        </Card>
        <Card className="bg-muted/30">
          <CardHeader className="py-3 px-4"><CardTitle className="text-sm">2. Campo de Aplicação</CardTitle></CardHeader>
          <CardContent className="py-0 px-4 pb-3"><p className="text-xs text-muted-foreground">{texto.campoAplicacao}</p></CardContent>
        </Card>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
          <FileText className="w-4 h-4 text-primary" /> 3. Documentos de Referência
        </h4>
        <div className="flex flex-wrap gap-2">
            {texto.documentosReferencia.map((doc, i) => <Badge key={i} variant="outline" className="text-[10px] font-normal">{doc}</Badge>)}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">4. Definições</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {texto.definicoes.map((def, i) => (
                <div key={i} className="p-2 rounded border bg-background">
                    <p className="text-xs font-bold text-primary">{def.termo}</p>
                    <p className="text-[11px] text-muted-foreground">{def.definicao}</p>
                </div>
            ))}
        </div>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-2">5. Procedimentos Operacionais</h4>
        <div className="space-y-2">
            {texto.procedimentos.map((proc, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-lg border bg-background items-start">
                    <span className="flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0">{i+1}</span>
                    <p className="text-xs text-muted-foreground leading-relaxed">{proc}</p>
                </div>
            ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
              <CardHeader className="py-3 px-4 bg-primary/5 border-b"><CardTitle className="text-sm">6. Monitoramento</CardTitle></CardHeader>
              <CardContent className="p-0">
                  <div className="divide-y divide-border">
                      <div className="p-3 flex justify-between gap-4"><span className="text-xs font-semibold">Controle</span><span className="text-xs text-muted-foreground text-right">{texto.monitoramento.controle}</span></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-xs font-semibold">Frequência</span><span className="text-xs text-muted-foreground text-right">{texto.monitoramento.frequencia}</span></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-xs font-semibold">Registro</span><span className="text-xs text-muted-foreground text-right">{texto.monitoramento.registro}</span></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-xs font-semibold">Responsável</span><span className="text-xs text-muted-foreground text-right">{texto.monitoramento.responsavel}</span></div>
                  </div>
              </CardContent>
          </Card>
          <Card>
              <CardHeader className="py-3 px-4 bg-emerald-500/5 border-b"><CardTitle className="text-sm">7. Verificação</CardTitle></CardHeader>
              <CardContent className="p-0">
                  <div className="divide-y divide-border">
                      <div className="p-3 flex justify-between gap-4"><span className="text-xs font-semibold">Controle</span><span className="text-xs text-muted-foreground text-right">{texto.verificacao.controle}</span></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-xs font-semibold">Frequência</span><span className="text-xs text-muted-foreground text-right">{texto.verificacao.frequencia}</span></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-xs font-semibold">Registro</span><span className="text-xs text-muted-foreground text-right">{texto.verificacao.registro}</span></div>
                      <div className="p-3 flex justify-between gap-4"><span className="text-xs font-semibold">Responsável</span><span className="text-xs text-muted-foreground text-right">{texto.verificacao.responsavel}</span></div>
                  </div>
              </CardContent>
          </Card>
      </div>

      <div>
        <h4 className="text-sm font-semibold mb-3">8. Ações Corretivas (RNC)</h4>
        <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow><TableHead className="text-xs">Não Conformidade</TableHead><TableHead className="text-xs">Ação Corretiva Sugerida</TableHead></TableRow>
                </TableHeader>
                <TableBody>
                    {texto.acoesCorretivas.map((ac, i) => (
                        <TableRow key={i}>
                            <TableCell className="text-xs font-medium">{ac.naoConformidade}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{ac.acao}</TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
      </div>

      {(() => {
        const its = INSTRUCOES_TRABALHO.filter(it => it.popCodigo === codigo);
        if (its.length === 0) return null;
        return (
          <div className="pt-4 border-t border-border">
            <h4 className="text-sm font-bold mb-4 flex items-center gap-2 text-primary">
              <ListChecks className="w-5 h-5" /> Instruções de Trabalho (ITs)
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {its.map((it) => (
                <Card key={it.id} className="border-l-4 border-l-primary overflow-hidden">
                  <CardHeader className="py-3 px-4 bg-primary/5 flex flex-row items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-primary uppercase tracking-wider">{it.id}</span>
                        <CardTitle className="text-sm font-bold">{it.titulo}</CardTitle>
                      </div>
                      <Badge variant="outline" className="text-[10px] h-5 bg-background"><Clock className="w-3 h-3 mr-1" />{it.frequencia}</Badge>
                  </CardHeader>
                  <CardContent className="p-4 space-y-4">
                    <p className="text-xs text-muted-foreground italic">"{it.objetivo}"</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase text-muted-foreground">Materiais</p>
                            <ul className="space-y-1">{it.materiais.map((m, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-primary">•</span>{m}</li>)}</ul>
                        </div>
                        <div className="space-y-1.5">
                            <p className="text-[10px] font-bold uppercase text-destructive">EPIs</p>
                            <ul className="space-y-1">{it.epis.map((e, i) => <li key={i} className="text-[11px] flex gap-2"><span className="text-destructive">•</span>{e}</li>)}</ul>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-[10px] font-bold uppercase text-muted-foreground">Passo a Passo</p>
                        <div className="space-y-2">
                            {it.passos.map((p, i) => (
                                <div key={i} className="flex gap-2 text-[11px] items-start">
                                    <span className="w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center shrink-0 font-bold">{i+1}</span>
                                    <span className="text-muted-foreground">{p}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="p-2 rounded bg-muted/30 text-[10px] flex items-center gap-2">
                        <ClipboardCheck className="w-3 h-3 text-primary" />
                        <span className="font-semibold">Aceitação:</span>
                        <span className="text-muted-foreground">{it.criteriosAceitacao.join(", ")}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export default function GuiaPops() {
  const [searchParams, setSearchParams] = useSearchParams();
  const popParam = searchParams.get("pop")?.toUpperCase();
  const [selectedPop, setSelectedPop] = useState<string | null>(popParam || null);

  useEffect(() => {
    if (popParam) setSelectedPop(popParam);
  }, [popParam]);

  useEffect(() => { markPopVisited(); }, []);

  const handleSelectPop = (codigo: string) => {
    setSelectedPop(codigo);
    setSearchParams({ pop: codigo });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGoBack = () => {
    setSelectedPop(null);
    setSearchParams({});
  };

  const currentPop = POPS_CONFIG.find(p => p.codigo === selectedPop);

  if (selectedPop && currentPop) {
    const Icon = POP_ICONS[selectedPop] || FileText;
    const popNum = selectedPop.split("-")[1]?.replace(/^0+/, "");

    return (
      <div className="max-w-5xl mx-auto space-y-6 pb-20">
        <div className="flex items-center gap-3 mb-2">
            <Button variant="ghost" size="sm" onClick={handleGoBack} className="hover:bg-primary/10 hover:text-primary transition-colors">
                <ChevronLeft className="w-4 h-4 mr-1" /> Voltar para Lista
            </Button>
            <div className="h-4 w-px bg-border mx-1" />
            <Badge variant="outline" className="text-[10px] bg-primary/5 text-primary border-primary/20">PROCEDIMENTO OPERACIONAL PADRÃO</Badge>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-4 bg-background p-6 rounded-2xl border shadow-sm">
            <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary shrink-0">
                <Icon className="w-8 h-8" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                    <Badge className="bg-primary text-primary-foreground font-bold">Pop {popNum}</Badge>
                    <span className="text-xs text-muted-foreground font-mono">{selectedPop}</span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold tracking-tight text-foreground">{currentPop.nome}</h2>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{currentPop.descricao}</p>
            </div>
        </div>

        <PopContent codigo={selectedPop} />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20">
      <PageHeader 
        icon={BookOpen} 
        title="ITs e Procedimentos Detalhados" 
        description="Textos procedimentais completos dos 10 POPs obrigatórios" 
       assuntoBaseLegal="bpf_geral" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {POPS_CONFIG.map((pop) => {
          const Icon = POP_ICONS[pop.codigo] || FileText;
          const popNum = pop.codigo.split("-")[1]?.replace(/^0+/, "");
          const itsCount = INSTRUCOES_TRABALHO.filter(it => it.popCodigo === pop.codigo).length;

          return (
            <Card 
                key={pop.codigo} 
                className="group hover:border-primary/50 hover:shadow-lg transition-all cursor-pointer border-border relative overflow-hidden h-full flex flex-col"
                onClick={() => handleSelectPop(pop.codigo)}
            >
              <div className="absolute top-0 right-0 p-3">
                  <Badge variant="secondary" className="text-[10px] bg-muted group-hover:bg-primary/10 group-hover:text-primary transition-colors">Pop {popNum}</Badge>
              </div>
              
              <CardHeader className="pt-8 pb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/5 text-primary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <Icon className="w-6 h-6" />
                </div>
                <CardTitle className="text-base font-bold line-clamp-2 leading-tight group-hover:text-primary transition-colors">{pop.nome}</CardTitle>
                <CardDescription className="text-xs line-clamp-2 mt-2">{pop.descricao}</CardDescription>
              </CardHeader>

              <CardContent className="mt-auto pt-0 pb-6 flex flex-col gap-3">
                  <div className="h-px w-full bg-border/50" />
                  <div className="flex items-center justify-between text-[11px]">
                      <span className="text-muted-foreground flex items-center gap-1">
                          <ListChecks className="w-3 h-3" /> {itsCount} ITs vinculadas
                      </span>
                      <span className="text-primary font-bold flex items-center gap-1">
                          Acessar <ChevronLeft className="w-3 h-3 rotate-180" />
                      </span>
                  </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Tip>
        Os POPs são documentos de "como fazer". Eles devem estar sempre disponíveis para consulta dos colaboradores na área de produção, seja via tablet ou impresso.
      </Tip>
    </div>
  );
}
