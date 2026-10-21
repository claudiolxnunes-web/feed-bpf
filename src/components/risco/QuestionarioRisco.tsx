import { CATEGORIAS, PERGUNTAS_PADRAO } from "@/components/risco/constants";
import type { Pergunta } from "@/components/risco/constants";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Save, RotateCcw, ClipboardCheck, ChevronDown, ChevronUp } from "lucide-react";
import { toast } from "sonner";







let idCounter = 0;
function genId() {
  return `q-${Date.now()}-${idCounter++}`;
}

function initPerguntas(): Pergunta[] {
  return PERGUNTAS_PADRAO.map(p => ({ ...p, id: genId() }));
}

interface ResultadoCategoria {
  categoria: string;
  pontuacaoObtida: number;
  pontuacaoMaxima: number;
  percentual: number;
  nivel: string;
}

function calcularResultados(perguntas: Pergunta[]): { categorias: ResultadoCategoria[]; geral: ResultadoCategoria } {
  const catMap = new Map<string, Pergunta[]>();
  perguntas.forEach(p => {
    if (p.resposta === "na" || p.resposta === "") return;
    const list = catMap.get(p.categoria) || [];
    list.push(p);
    catMap.set(p.categoria, list);
  });

  const categorias: ResultadoCategoria[] = [];
  let totalObtida = 0;
  let totalMaxima = 0;

  CATEGORIAS.forEach(cat => {
    const items = catMap.get(cat);
    if (!items || items.length === 0) return;
    let obtida = 0;
    let maxima = 0;
    items.forEach(p => {
      maxima += p.peso;
      if (p.resposta === "sim") obtida += p.peso;
      else if (p.resposta === "parcial") obtida += p.peso * 0.5;
    });
    const pct = maxima > 0 ? (obtida / maxima) * 100 : 0;
    categorias.push({
      categoria: cat,
      pontuacaoObtida: obtida,
      pontuacaoMaxima: maxima,
      percentual: pct,
      nivel: pct >= 80 ? "Baixo" : pct >= 50 ? "Médio" : "Alto",
    });
    totalObtida += obtida;
    totalMaxima += maxima;
  });

  const pctGeral = totalMaxima > 0 ? (totalObtida / totalMaxima) * 100 : 0;
  return {
    categorias,
    geral: {
      categoria: "GERAL",
      pontuacaoObtida: totalObtida,
      pontuacaoMaxima: totalMaxima,
      percentual: pctGeral,
      nivel: pctGeral >= 80 ? "Baixo" : pctGeral >= 50 ? "Médio" : "Alto",
    },
  };
}

function nivelColor(nivel: string) {
  if (nivel === "Alto") return "bg-destructive/20 text-destructive border-destructive/30";
  if (nivel === "Médio") return "bg-yellow-100 text-yellow-800 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-700";
  return "bg-green-100 text-green-800 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-700";
}

function nivelBadge(nivel: string) {
  if (nivel === "Alto") return "destructive" as const;
  if (nivel === "Médio") return "secondary" as const;
  return "default" as const;
}

interface Props {
  savedData?: Pergunta[];
  onSave?: (perguntas: Pergunta[]) => void;
}

export default function QuestionarioRisco({ savedData, onSave }: Props) {
  const [perguntas, setPerguntas] = useState<Pergunta[]>(savedData || initPerguntas());
  const [showResultados, setShowResultados] = useState(false);
  const [expandedCats, setExpandedCats] = useState<Set<string>>(new Set(CATEGORIAS));
  const [novaCategoria, setNovaCategoria] = useState("");
  const [novaPergunta, setNovaPergunta] = useState("");
  const [novoPeso, setNovoPeso] = useState("4");
  const [addingTo, setAddingTo] = useState("");

  const toggleCat = (cat: string) => {
    setExpandedCats(prev => {
      const s = new Set(prev);
      if (s.has(cat)) s.delete(cat); else s.add(cat);
      return s;
    });
  };

  const updateResposta = (id: string, resposta: Pergunta["resposta"]) => {
    setPerguntas(prev => prev.map(p => p.id === id ? { ...p, resposta } : p));
  };

  const updateObservacao = (id: string, observacao: string) => {
    setPerguntas(prev => prev.map(p => p.id === id ? { ...p, observacao } : p));
  };

  const updateTexto = (id: string, texto: string) => {
    setPerguntas(prev => prev.map(p => p.id === id ? { ...p, texto } : p));
  };

  const updatePeso = (id: string, peso: number) => {
    setPerguntas(prev => prev.map(p => p.id === id ? { ...p, peso } : p));
  };

  const removePergunta = (id: string) => {
    setPerguntas(prev => prev.filter(p => p.id !== id));
  };

  const addPergunta = (categoria: string) => {
    if (!novaPergunta.trim()) return;
    setPerguntas(prev => [...prev, {
      id: genId(),
      categoria,
      texto: novaPergunta.trim(),
      peso: parseInt(novoPeso) || 4,
      resposta: "",
      observacao: "",
    }]);
    setNovaPergunta("");
    setNovoPeso("4");
    setAddingTo("");
  };

  const resetAll = () => {
    setPerguntas(initPerguntas());
    setShowResultados(false);
    toast.info("Questionário resetado para o padrão");
  };

  const handleSave = () => {
    onSave?.(perguntas);
    toast.success("Questionário salvo!");
  };

  const respondidas = perguntas.filter(p => p.resposta !== "").length;
  const total = perguntas.length;
  const resultados = calcularResultados(perguntas);

  const perguntasPorCategoria = new Map<string, Pergunta[]>();
  perguntas.forEach(p => {
    const list = perguntasPorCategoria.get(p.categoria) || [];
    list.push(p);
    perguntasPorCategoria.set(p.categoria, list);
  });

  const categoriasUsadas = Array.from(new Set(perguntas.map(p => p.categoria)));

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex flex-wrap items-center gap-4 mb-2">
        <div className="text-sm text-muted-foreground">
          Progresso: <span className="font-bold text-foreground">{respondidas}/{total}</span> perguntas respondidas
        </div>
        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-xs">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${total > 0 ? (respondidas / total) * 100 : 0}%` }}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={resetAll}>
            <RotateCcw className="w-4 h-4 mr-1" />Resetar
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowResultados(!showResultados)}>
            <ClipboardCheck className="w-4 h-4 mr-1" />{showResultados ? "Ocultar" : "Ver"} Resultados
          </Button>
          <Button size="sm" onClick={handleSave}>
            <Save className="w-4 h-4 mr-1" />Salvar
          </Button>
        </div>
      </div>

      {/* Results panel */}
      {showResultados && (
        <Card className="border-2 border-primary/30">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-3">
              Resultado da Categorização de Risco
              <Badge variant={nivelBadge(resultados.geral.nivel)} className="text-sm px-3 py-1">
                Risco {resultados.geral.nivel} — {resultados.geral.percentual.toFixed(0)}%
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {resultados.categorias.map(r => (
                <div key={r.categoria} className={`rounded-lg border p-3 ${nivelColor(r.nivel)}`}>
                  <div className="text-xs font-medium mb-1">{r.categoria}</div>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold">{r.percentual.toFixed(0)}%</span>
                    <Badge variant={nivelBadge(r.nivel)}>Risco {r.nivel}</Badge>
                  </div>
                  <div className="h-1.5 bg-background/50 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-current rounded-full opacity-40" style={{ width: `${r.percentual}%` }} />
                  </div>
                  <div className="text-xs mt-1 opacity-70">{r.pontuacaoObtida}/{r.pontuacaoMaxima} pts</div>
                </div>
              ))}
            </div>
            <div className="mt-4 text-xs text-muted-foreground space-y-1">
              <p><strong>≥80%</strong> conformidade = Risco <span className="text-green-600 font-bold">Baixo</span></p>
              <p><strong>50-79%</strong> conformidade = Risco <span className="text-yellow-600 font-bold">Médio</span></p>
              <p><strong>&lt;50%</strong> conformidade = Risco <span className="text-destructive font-bold">Alto</span></p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Questions by category */}
      {categoriasUsadas.map(cat => {
        const items = perguntasPorCategoria.get(cat) || [];
        const isExpanded = expandedCats.has(cat);
        const catRespondidas = items.filter(p => p.resposta !== "").length;

        return (
          <Card key={cat}>
            <CardHeader
              className="cursor-pointer select-none pb-2"
              onClick={() => toggleCat(cat)}
            >
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm flex items-center gap-2">
                  {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {cat}
                  <span className="text-xs font-normal text-muted-foreground">
                    ({catRespondidas}/{items.length})
                  </span>
                </CardTitle>
              </div>
            </CardHeader>
            {isExpanded && (
              <CardContent className="space-y-3 pt-0">
                {items.map((p, idx) => (
                  <div key={p.id} className="border rounded-lg p-3 space-y-2 bg-muted/30">
                    <div className="flex gap-2 items-start">
                      <span className="text-xs font-mono text-muted-foreground mt-1 min-w-[24px]">{idx + 1}.</span>
                      <div className="flex-1 space-y-2">
                        <Input
                          value={p.texto}
                          onChange={e => updateTexto(p.id, e.target.value)}
                          className="text-sm h-8"
                        />
                        <div className="flex flex-wrap gap-2 items-center">
                          <span className="text-xs text-muted-foreground">Peso:</span>
                          <Select value={String(p.peso)} onValueChange={v => updatePeso(p.id, parseInt(v))}>
                            <SelectTrigger className="w-16 h-7 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {[1, 2, 3, 4, 5].map(n => (
                                <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <span className="text-xs text-muted-foreground ml-2">Resposta:</span>
                          {(["sim", "parcial", "nao", "na"] as const).map(r => (
                            <Button
                              key={r}
                              size="sm"
                              variant={p.resposta === r ? "default" : "outline"}
                              className={`h-7 text-xs px-2 ${
                                p.resposta === r
                                  ? r === "sim" ? "bg-green-600 hover:bg-green-700 text-white"
                                    : r === "parcial" ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                                    : r === "nao" ? "bg-destructive hover:bg-destructive/90 text-white"
                                    : ""
                                  : ""
                              }`}
                              onClick={() => updateResposta(p.id, p.resposta === r ? "" : r)}
                            >
                              {r === "sim" ? "Sim" : r === "parcial" ? "Parcial" : r === "nao" ? "Não" : "N/A"}
                            </Button>
                          ))}
                        </div>
                        <Input
                          placeholder="Observação (opcional)..."
                          value={p.observacao}
                          onChange={e => updateObservacao(p.id, e.target.value)}
                          className="text-xs h-7"
                        />
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive shrink-0" onClick={() => removePergunta(p.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}

                {/* Add question */}
                {addingTo === cat ? (
                  <div className="border rounded-lg p-3 space-y-2 border-dashed border-primary/50">
                    <Input
                      placeholder="Digite a nova pergunta..."
                      value={novaPergunta}
                      onChange={e => setNovaPergunta(e.target.value)}
                      className="text-sm h-8"
                      autoFocus
                      onKeyDown={e => e.key === "Enter" && addPergunta(cat)}
                    />
                    <div className="flex gap-2 items-center">
                      <span className="text-xs text-muted-foreground">Peso:</span>
                      <Select value={novoPeso} onValueChange={setNovoPeso}>
                        <SelectTrigger className="w-16 h-7 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3, 4, 5].map(n => (
                            <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button size="sm" className="h-7 text-xs" onClick={() => addPergunta(cat)}>Adicionar</Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setAddingTo("")}>Cancelar</Button>
                    </div>
                  </div>
                ) : (
                  <Button variant="ghost" size="sm" className="text-xs w-full border-dashed border" onClick={() => { setAddingTo(cat); setNovaPergunta(""); }}>
                    <Plus className="w-3.5 h-3.5 mr-1" />Adicionar pergunta a {cat}
                  </Button>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Add new category */}
      <Card className="border-dashed">
        <CardContent className="py-3">
          <div className="flex gap-2 items-center">
            <Input
              placeholder="Nova categoria de risco..."
              value={novaCategoria}
              onChange={e => setNovaCategoria(e.target.value)}
              className="text-sm h-8"
              onKeyDown={e => {
                if (e.key === "Enter" && novaCategoria.trim()) {
                  const cat = novaCategoria.trim();
                  if (!categoriasUsadas.includes(cat)) {
                    setPerguntas(prev => [...prev, {
                      id: genId(),
                      categoria: cat,
                      texto: "Nova pergunta...",
                      peso: 4,
                      resposta: "",
                      observacao: "",
                    }]);
                    setExpandedCats(prev => new Set(prev).add(cat));
                    setNovaCategoria("");
                  }
                }
              }}
            />
            <Button size="sm" variant="outline" onClick={() => {
              const cat = novaCategoria.trim();
              if (!cat || categoriasUsadas.includes(cat)) return;
              setPerguntas(prev => [...prev, {
                id: genId(),
                categoria: cat,
                texto: "Nova pergunta...",
                peso: 4,
                resposta: "",
                observacao: "",
              }]);
              setExpandedCats(prev => new Set(prev).add(cat));
              setNovaCategoria("");
            }}>
              <Plus className="w-4 h-4 mr-1" />Categoria
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
