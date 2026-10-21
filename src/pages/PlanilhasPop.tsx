import { useState, useEffect, useMemo } from "react";
import { 
  Clipboard, 
  ChevronRight, 
  FileText, 
  CheckCircle2, 
  Download, 
  Search, 
  FileSignature, 
  FileBadge, 
  AlertTriangle, 
  Info, 
  ExternalLink, 
  BookOpen, 
  Settings2, 
  Lock, 
  History,
  Sparkles,
  Save,
  FileCheck,
  Printer,
  FileSearch,
  ArrowRight,
  CalendarDays,
  RefreshCcw
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { POPS_CUSTOM } from "@/config/feedBpfCustomConfig";
import { MODELOS_ASSETS } from "@/config/modelosAssetsMapping";
import { POPS_CONFIG } from "@/config/popsConfig";
import { getItsPorPop, POP_TO_MODULOS } from "@/config/documentosCentral";
import { useNavigate } from "react-router-dom";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useLicense } from "@/hooks/useLicense";
import { POP_PESOS, LIMITE_PONTOS_INTERMEDIARIO, calcularTotalPontos } from "@/config/popsPesos";
import { TIER_LABEL } from "@/config/tiers";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatarPopDocx } from "@/utils/exportPop";

export default function PlanilhasPop() {
  const navigate = useNavigate();
  const [selectedPop, setSelectedPop] = useState(POPS_CUSTOM[0]);
  const [searchTerm, setSearchTerm] = useState("");
  const { empresaAtiva, recarregar } = useEmpresa();
  const { tier } = useLicense();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [adendos, setAdendos] = useState("");
  const [historico, setHistorico] = useState<any[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [popGerado, setPopGerado] = useState<any>(null);

  const configModos = empresaAtiva?.config_modos_preenchimento || {};
  const totalPontos = useMemo(() => calcularTotalPontos(configModos), [configModos]);
  const isIntermediario = tier === "intermediario";

  // Carrega histórico de versões para o POP selecionado
  useEffect(() => {
    if (!empresaAtiva) return;
    
    const fetchHistorico = async () => {
      const { data } = await supabase
        .from("arquivos_bpf")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .eq("pop_codigo", selectedPop.codigo)
        .order("versao", { ascending: false });
      
      setHistorico(data || []);
    };

    fetchHistorico();
  }, [selectedPop.codigo, empresaAtiva]);

  const toggleModo = async (popCodigo: string) => {
    if (!empresaAtiva || isUpdating) return;

    const novoModo = configModos[popCodigo] === "digital" ? "hibrido" : "digital";
    
    // Validação de limite para plano intermediário
    if (isIntermediario && novoModo === "digital") {
      const pesoPop = POP_PESOS[popCodigo] || 0;
      if (totalPontos + pesoPop > LIMITE_PONTOS_INTERMEDIARIO) {
        toast.error(`Limite atingido! O Plano Intermediário permite apenas ${LIMITE_PONTOS_INTERMEDIARIO} pontos digitais.`);
        return;
      }
    }

    setIsUpdating(true);
    const newConfig = { ...configModos, [popCodigo]: novoModo };

    try {
      // Usamos uma tipagem forçada para o Supabase ignorar o erro de schema local
      // até que a migração seja processada no ambiente de build.
      const { error } = await supabase
        .from("empresas")
        .update({ config_modos_preenchimento: newConfig } as any)
        .eq("id", empresaAtiva.id);

      if (error) throw error;
      
      toast.success(`${popCodigo} configurado como ${novoModo === "digital" ? "DIGITAL" : "HÍBRIDO"}`);
      await recarregar();
    } catch (err: any) {
      toast.error("Erro ao atualizar configuração: " + err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleGerarPop = async () => {
    if (!empresaAtiva || isGenerating) return;

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-pop-ia", {
        body: { 
          codigo_pop: selectedPop.codigo, 
          nome_pop: selectedPop.nome,
          observacoes: adendos,
          especies: empresaAtiva.tipo_producao?.join(", "),
          capacidade: empresaAtiva.capacidade
        }
      });

      if (error) throw error;
      
      setPopGerado({ ...data.data, codigo: selectedPop.codigo, nome: selectedPop.nome });
      setShowPreview(true);
      toast.success("Rascunho do POP gerado com sucesso pela IA!");
      console.log("POP Gerado:", data);
      // Aqui poderíamos abrir um modal com o resultado ou salvar diretamente
    } catch (err: any) {
      console.error("Erro na geração:", err);
      toast.error("Erro ao gerar rascunho: " + (err.message || "Tente novamente mais tarde."));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSalvarVersao = async () => {
    if (!empresaAtiva || !popGerado) return;

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error("Usuário não autenticado");

      // Buscar última versão usando as colunas que acabamos de adicionar
      const { data: ultimaVersao } = await supabase
        .from("arquivos_bpf")
        .select("versao" as any)
        .eq("empresa_id", empresaAtiva.id)
        .eq("pop_codigo", selectedPop.codigo)
        .order("versao" as any, { ascending: false })
        .limit(1);

      const proximaVersao = (Number((ultimaVersao?.[0] as any)?.versao) || 0) + 1;
      
      const { error } = await supabase.from("arquivos_bpf").insert({
        empresa_id: empresaAtiva.id,
        user_id: userData.user.id,
        pop_codigo: selectedPop.codigo,
        titulo: `POP-${selectedPop.codigo} v${proximaVersao} (Gerado por IA)`,
        categoria: "procedimento",
        versao: proximaVersao,
        metadata: popGerado,
        descricao: `Rascunho técnico gerado via IA em ${new Date().toLocaleDateString("pt-BR")}`
      } as any);

      if (error) throw error;

      toast.success("POP Salvo no Histórico de Versões!");
      setShowPreview(false);
      
      // Recarregar histórico
      const { data: novoHistorico } = await supabase
        .from("arquivos_bpf")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .eq("pop_codigo", selectedPop.codigo)
        .order("versao" as any, { ascending: false });
      
      setHistorico(novoHistorico || []);
    } catch (err: any) {
      toast.error("Erro ao salvar versão: " + err.message);
    }
  };


  const filteredPops = POPS_CUSTOM.filter(pop => 
    pop.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    pop.codigo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const relatedIts = getItsPorPop(selectedPop.codigo);
  const popConfig = POPS_CONFIG.find(p => p.codigo === selectedPop.codigo);

  
  // No documentosCentral.ts temos o mapeamento para nomes de rotas amigáveis
  const moduloAtivoPath = (() => {
    const modulos = POP_TO_MODULOS[selectedPop.codigo];
    if (!modulos || modulos.length === 0) return null;
    return `/${modulos[0]}`;
  })();

  return (
    <div className="space-y-6">
      <PageHeader 
        icon={Clipboard} 
        title="Planilhas de POPs" 
        description="Acesso centralizado aos procedimentos, instruções de trabalho e registros digitais por POP."
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Barra Lateral de Seleção */}
        <Card className="lg:col-span-4 h-fit">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Buscar POP..." 
                className="pl-9 h-9 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[500px]">
              <div className="divide-y">
                {filteredPops.map((pop) => (
                  <button
                    key={pop.codigo}
                    onClick={() => setSelectedPop(pop)}
                    className={`w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group ${
                      selectedPop.codigo === pop.codigo ? "bg-primary/5 border-l-4 border-primary" : "border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-bold text-primary">{pop.codigo}</span>
                      <span className="text-sm font-medium leading-tight">{pop.nome}</span>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${selectedPop.codigo === pop.codigo ? "translate-x-1 text-primary" : "text-muted-foreground group-hover:translate-x-1"}`} />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Área de Conteúdo do POP Selecionado */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="border-primary/20">
            <CardHeader className="bg-primary/5 pb-6">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-primary font-mono border-primary/30">
                  {selectedPop.codigo}
                </Badge>
                {moduloAtivoPath && (
                  <Badge className="bg-emerald-500/15 text-emerald-700 hover:bg-emerald-500/20 border-emerald-200">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> Módulo Ativo
                  </Badge>
                )}
              </div>
              <CardTitle className="text-2xl mt-2">{selectedPop.nome}</CardTitle>
              <CardDescription className="text-base space-y-2">
                <p>Gestão integrada de documentos e registros.</p>
                {selectedPop.descricao && (
                  <div className="mt-3 p-4 bg-primary/10 rounded-lg border border-primary/20 text-foreground text-sm leading-relaxed italic relative">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                      <div className="space-y-2">
                        <span>{selectedPop.descricao}</span>
                        <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-primary/10">
                          <Badge variant="secondary" className="bg-amber-100 text-amber-800 border-amber-200 text-[10px] py-0">
                            <CalendarDays className="w-3 h-3 mr-1" /> Vencimento: 1 Ano
                          </Badge>
                          <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200 text-[10px] py-0">
                            <RefreshCcw className="w-3 h-3 mr-1" /> Revisão Anual Obrigatória
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs defaultValue="conteudo" className="w-full">
                <TabsList className="grid w-full grid-cols-4 mb-6">
                  <TabsTrigger value="conteudo">Conteúdo do POP</TabsTrigger>
                  <TabsTrigger value="geracao-ia">Geração com IA</TabsTrigger>
                  <TabsTrigger value="configuracao">Configuração & Limites</TabsTrigger>
                  <TabsTrigger value="historico">Histórico de Versões</TabsTrigger>
                </TabsList>

                <TabsContent value="geracao-ia" className="space-y-6">
                  <Card className="border-emerald-200 bg-emerald-50/30">
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        Geração de Documento com IA
                      </CardTitle>
                      <CardDescription>
                        Gere um rascunho técnico personalizado para este POP baseado nas normas do MAPA e nas especificidades da sua unidade.
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="adendos" className="text-sm font-semibold">
                          Adendos do Cliente / RT (Opcional)
                        </Label>
                        <Textarea 
                          id="adendos"
                          value={adendos}
                          onChange={(e) => setAdendos(e.target.value)}
                          placeholder="Descreva aqui particularidades da sua fábrica, equipamentos específicos, fluxos diferenciados ou exigências locais que a IA deve considerar no texto..."
                          className="min-h-[120px] bg-white"
                        />
                        <p className="text-[11px] text-muted-foreground italic">
                          Dica: A geração de IA também deve dar opção para gerar com adendos do cliente / RT, pois pode ter especificidades que não contempla nos modelos versionados.
                        </p>
                      </div>
                      <Button 
                        className="w-full bg-emerald-600 hover:bg-emerald-700" 
                        onClick={handleGerarPop}
                        disabled={isGenerating}
                      >
                        <Sparkles className={`w-4 h-4 mr-2 ${isGenerating ? "animate-spin" : ""}`} />
                        {isGenerating ? "Gerando Rascunho..." : `Gerar Rascunho do ${selectedPop.codigo} com IA`}
                      </Button>
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-xs">
                        <Info className="w-4 h-4 shrink-0" />
                        <p>A função de geração de documentos descritivos via IA está em fase de homologação para garantir total conformidade.</p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                {/* Modal de Visualização da IA */}
                <Dialog open={showPreview} onOpenChange={setShowPreview}>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                    <DialogHeader>
                      <DialogTitle className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-emerald-600" />
                        Visualização do POP Gerado por IA
                      </DialogTitle>
                      <DialogDescription>
                        Revise o conteúdo técnico gerado antes de salvar ou exportar.
                      </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1 pr-4 mt-4">
                      {popGerado && (
                        <div className="space-y-6 text-sm">
                          <section>
                            <h4 className="font-bold text-primary uppercase border-b pb-1 mb-2">1. Objetivo</h4>
                            <p className="leading-relaxed">{popGerado.objetivo}</p>
                          </section>

                          <section>
                            <h4 className="font-bold text-primary uppercase border-b pb-1 mb-2">2. Campo de Aplicação</h4>
                            <p className="leading-relaxed">{popGerado.campo_aplicacao}</p>
                          </section>

                          <section>
                            <h4 className="font-bold text-primary uppercase border-b pb-1 mb-2">3. Documentos de Referência</h4>
                            <ul className="list-disc pl-5 space-y-1">
                              {popGerado.documentos_referencia.map((doc: string, i: number) => (
                                <li key={i}>{doc}</li>
                              ))}
                            </ul>
                          </section>

                          <section>
                            <h4 className="font-bold text-primary uppercase border-b pb-1 mb-2">4. Definições</h4>
                            <div className="space-y-2">
                              {popGerado.definicoes.map((def: any, i: number) => (
                                <div key={i}>
                                  <span className="font-semibold">{def.termo}:</span> {def.definicao}
                                </div>
                              ))}
                            </div>
                          </section>

                          <section>
                            <h4 className="font-bold text-primary uppercase border-b pb-1 mb-2">5. Procedimentos Operacionais</h4>
                            <div className="space-y-3">
                              {popGerado.procedimentos.map((proc: string, i: number) => (
                                <div key={i} className="flex gap-3">
                                  <span className="font-mono text-xs text-muted-foreground pt-1">{i + 1}.</span>
                                  <p className="leading-relaxed">{proc}</p>
                                </div>
                              ))}
                            </div>
                          </section>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <section className="p-4 bg-muted/30 rounded-lg">
                              <h4 className="font-bold text-primary uppercase border-b pb-1 mb-3">6. Monitoramento</h4>
                              <div className="space-y-2">
                                <p><span className="font-semibold">O que:</span> {popGerado.monitoramento.controle}</p>
                                <p><span className="font-semibold">Frequência:</span> {popGerado.monitoramento.frequencia}</p>
                                <p><span className="font-semibold">Registro:</span> {popGerado.monitoramento.registro}</p>
                                <p><span className="font-semibold">Resp.:</span> {popGerado.monitoramento.responsavel}</p>
                              </div>
                            </section>

                            <section className="p-4 bg-muted/30 rounded-lg">
                              <h4 className="font-bold text-primary uppercase border-b pb-1 mb-3">7. Verificação</h4>
                              <div className="space-y-2">
                                <p><span className="font-semibold">O que:</span> {popGerado.verificacao.controle}</p>
                                <p><span className="font-semibold">Frequência:</span> {popGerado.verificacao.frequencia}</p>
                                <p><span className="font-semibold">Registro:</span> {popGerado.verificacao.registro}</p>
                                <p><span className="font-semibold">Resp.:</span> {popGerado.verificacao.responsavel}</p>
                              </div>
                            </section>
                          </div>

                          <section>
                            <h4 className="font-bold text-destructive uppercase border-b pb-1 mb-2">8. Ações Corretivas</h4>
                            <div className="space-y-2">
                              {popGerado.acoes_corretivas.map((acao: any, i: number) => (
                                <div key={i} className="p-3 border border-destructive/20 rounded bg-destructive/5">
                                  <p className="font-semibold text-destructive mb-1">{acao.nao_conformidade}</p>
                                  <p>{acao.acao}</p>
                                </div>
                              ))}
                            </div>
                          </section>

                          <section>
                            <h4 className="font-bold text-primary uppercase border-b pb-1 mb-2">9. Retenção de Registros</h4>
                            <p>{popGerado.tempo_retencao}</p>
                          </section>
                        </div>
                      )}
                    </ScrollArea>

                    <DialogFooter className="mt-6 border-t pt-4">
                      <Button variant="outline" onClick={() => setShowPreview(false)}>
                        Fechar e Ajustar
                      </Button>
                      <Button 
                        variant="secondary"
                        onClick={() => formatarPopDocx(popGerado, popGerado.codigo, popGerado.nome)}
                        className="bg-primary/10 hover:bg-primary/20 text-primary"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Exportar (.txt)
                      </Button>
                      <Button 
                        className="bg-emerald-600 hover:bg-emerald-700"
                        onClick={handleSalvarVersao}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Salvar Versão
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>

                <TabsContent value="conteudo" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Procedimento Descritivo (Word/PDF) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <FileText className="w-4 h-4" /> Procedimento Descritivo
                  </h3>
                  <div className="space-y-2">
                    {MODELOS_ASSETS[selectedPop.codigo]?.filter(m => !m.label.toLowerCase().includes("planilha")).map((doc, idx) => (
                      <Button 
                        key={idx}
                        variant="outline" 
                        className="w-full justify-start text-left h-auto py-3 border-dashed"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <Download className="w-4 h-4 mr-3 text-primary" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">{doc.label}</span>
                          <span className="text-[11px] text-muted-foreground font-normal">Documento original (Word/PDF)</span>
                        </div>
                      </Button>
                    ))}
                    {!MODELOS_ASSETS[selectedPop.codigo]?.some(m => !m.label.toLowerCase().includes("planilha")) && (
                      <div className="text-xs p-3 bg-muted rounded-md text-muted-foreground flex items-center gap-2">
                        <Info className="w-3 h-3" /> Nenhum procedimento Word encontrado.
                      </div>
                    )}
                  </div>
                </div>

                {/* Planilhas e Registros Digitais */}
                <div className="space-y-4">
                  <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                    <FileSignature className="w-4 h-4" /> Registros e Planilhas
                  </h3>
                  <div className="space-y-2">
                    {/* Link para o Módulo Integrado */}
                    {moduloAtivoPath && (
                      <Button 
                        className="w-full justify-start text-left h-auto py-3 bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => navigate(moduloAtivoPath)}
                      >
                        <ExternalLink className="w-4 h-4 mr-3" />
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold">Ir para o Módulo do Sistema</span>
                          <span className="text-[11px] opacity-80 font-normal">Preenchimento automatizado via formulários</span>
                        </div>
                      </Button>
                    )}

                    {/* Novo Registro Digital Customizado */}
                    <Button 
                      variant="outline"
                      className="w-full justify-start text-left h-auto py-3 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50"
                      onClick={() => navigate(`/feedbpf-custom/registros/novo?modelo=${selectedPop.codigo}`)}
                    >
                      <FileBadge className="w-4 h-4 mr-3 text-emerald-600" />
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-emerald-800">Novo Registro Digital Customizado</span>
                        <span className="text-[11px] text-muted-foreground font-normal">Preencher formulário digital personalizado</span>
                      </div>
                    </Button>

                    {/* Planilhas Excel Originais */}
                    {MODELOS_ASSETS[selectedPop.codigo]?.filter(m => m.label.toLowerCase().includes("planilha")).map((doc, idx) => (
                      <Button 
                        key={idx} 
                        variant="ghost" 
                        className="w-full justify-start text-left h-auto py-2 hover:bg-primary/5"
                        onClick={() => window.open(doc.url, "_blank")}
                      >
                        <Download className="w-3.5 h-3.5 mr-3 text-primary" />
                        <span className="text-xs">{doc.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Seção de Atalhos (Cópia do POP e Impressão Manual) */}
              <div className="mt-8 pt-6 border-t space-y-4">
                <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                  <ArrowRight className="w-4 h-4" /> Atalhos e Acessos Rápidos
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Atalho para Última Versão do POP */}
                  <Card className="bg-primary/5 border-primary/10 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <FileSearch className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate">Última Versão Salva</h4>
                        <p className="text-xs text-muted-foreground">Procedimento técnico vigente</p>
                      </div>
                      {historico.length > 0 ? (
                        <Button variant="ghost" size="sm" asChild>
                          <a href={historico[0].url} target="_blank" rel="noopener noreferrer">
                            <Download className="w-4 h-4" />
                          </a>
                        </Button>
                      ) : (
                        <Badge variant="outline" className="text-[10px] opacity-50">Nenhuma</Badge>
                      )}
                    </CardContent>
                  </Card>

                  {/* Atalho para Impressão Manual (Planilhas em Branco) */}
                  <Card className="bg-amber-50/50 border-amber-200/50 shadow-none">
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="p-2 bg-amber-100 rounded-lg text-amber-700">
                        <Printer className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold truncate text-amber-900">Impressão p/ Registro Manual</h4>
                        <p className="text-xs text-amber-700/70">Planilhas físicas para campo</p>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                        onClick={() => navigate('/documentos-bpf?tab=modelos')}
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </div>

              {/* Instruções de Trabalho (ITs) Relacionadas */}
              <div className="mt-8 pt-6 border-t">
                <h3 className="text-sm font-bold flex items-center gap-2 text-muted-foreground uppercase tracking-wider mb-4">
                  <BookOpen className="w-4 h-4" /> Instruções de Trabalho (ITs) Vinculadas
                </h3>
                {relatedIts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {relatedIts.map((it) => (
                      <Card key={it.id} className="bg-muted/30 border-none shadow-none">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <Badge variant="secondary" className="text-[10px] font-mono h-5">
                              {it.id}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase font-bold">{it.frequencia}</span>
                          </div>
                          <h4 className="text-sm font-bold mb-1">{it.titulo}</h4>
                          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{it.objetivo}</p>
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="p-0 h-auto text-primary text-xs"
                            onClick={() => navigate(`/execucao-pops`)}
                          >
                            Ver detalhes e registrar execução →
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-muted/20 rounded-xl border border-dashed">
                    <AlertTriangle className="w-6 h-6 mx-auto text-amber-500 mb-2 opacity-50" />
                    <p className="text-sm text-muted-foreground">Nenhuma Instrução de Trabalho mapeada para este POP ainda.</p>
                  </div>
                )}
              </div>
            </TabsContent>

                <TabsContent value="configuracao" className="space-y-6">
                  <div className="p-6 border rounded-xl bg-card space-y-6">
                    <div className="flex items-center justify-between pb-4 border-b">
                      <div>
                        <h4 className="text-lg font-bold">Modo de Operação</h4>
                        <p className="text-sm text-muted-foreground">Defina se este POP será 100% digital ou seguirá o modelo híbrido (papel + upload).</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{configModos[selectedPop.codigo] === "digital" ? "DIGITAL" : "HÍBRIDO"}</span>
                        <Switch 
                          checked={configModos[selectedPop.codigo] === "digital"}
                          onCheckedChange={() => toggleModo(selectedPop.codigo)}
                          disabled={tier === "entrada" || isUpdating}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                          <span>Complexidade do POP</span>
                          <span>{POP_PESOS[selectedPop.codigo] || 0} pts</span>
                        </div>
                        <Progress value={(POP_PESOS[selectedPop.codigo] || 0) * 4} className="h-1.5" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-xs font-bold uppercase text-muted-foreground">
                          <span>Uso da Licença ({TIER_LABEL[tier]})</span>
                          <span>{totalPontos} / {isIntermediario ? LIMITE_PONTOS_INTERMEDIARIO : "∞"} pts</span>
                        </div>
                        <Progress 
                          value={isIntermediario ? (totalPontos / LIMITE_PONTOS_INTERMEDIARIO) * 100 : 100} 
                          className={`h-1.5 ${totalPontos > LIMITE_PONTOS_INTERMEDIARIO * 0.9 ? "[&>div]:bg-destructive" : ""}`} 
                        />
                      </div>
                    </div>

                    {tier === "entrada" && (
                      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex gap-3 text-amber-800 text-sm">
                        <Lock className="w-5 h-5 shrink-0" />
                        <p>O <strong>Plano Entrada</strong> opera exclusivamente em modo híbrido. Faça upgrade para o Intermediário ou Avançado para habilitar registros 100% digitais.</p>
                      </div>
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="historico" className="space-y-4">
                  <div className="border rounded-xl overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50 border-b">
                        <tr>
                          <th className="px-4 py-3 text-left font-bold uppercase text-[10px] text-muted-foreground">Versão</th>
                          <th className="px-4 py-3 text-left font-bold uppercase text-[10px] text-muted-foreground">Data</th>
                          <th className="px-4 py-3 text-left font-bold uppercase text-[10px] text-muted-foreground">Arquivo</th>
                          <th className="px-4 py-3 text-right font-bold uppercase text-[10px] text-muted-foreground">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {historico.length > 0 ? (
                          historico.map((v) => (
                            <tr key={v.id} className="hover:bg-muted/30 transition-colors">
                              <td className="px-4 py-3">
                                <Badge variant="outline" className="font-mono">v{v.versao || 1}</Badge>
                              </td>
                              <td className="px-4 py-3 text-muted-foreground">
                                {new Date(v.created_at).toLocaleDateString("pt-BR")}
                              </td>
                              <td className="px-4 py-3 font-medium">
                                {v.nome_arquivo}
                              </td>
                              <td className="px-4 py-3 text-right">
                                <Button variant="ghost" size="sm" asChild>
                                  <a href={v.url} target="_blank" rel="noopener noreferrer">
                                    <Download className="w-4 h-4" />
                                  </a>
                                </Button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan={4} className="px-4 py-12 text-center text-muted-foreground italic">
                              Nenhum histórico de versão encontrado para este POP.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
