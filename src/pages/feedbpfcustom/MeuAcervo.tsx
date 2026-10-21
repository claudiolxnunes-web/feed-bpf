import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FolderOpen, AlertTriangle, Link2Off, Upload, ChevronRight, Search, Download, Trash2, Loader2, CheckSquare, Square, FileSpreadsheet, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/PageHeader";
import EmpresaSelector from "@/components/EmpresaSelector";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { POPS_CUSTOM } from "@/config/feedBpfCustomConfig";
import { resolverUrlArquivo } from "@/lib/bpfStorage";
import { MODELOS_ASSETS } from "@/config/modelosAssetsMapping";
import { toast } from "sonner";
import { baixarArquivoStorage, isArquivoArte, extensaoDe, programaRecomendado } from "@/utils/fileTypes";


interface Doc {
  id: string;
  titulo: string;
  tipo: string;
  pop_codigo: string | null;
  it_codigo: string | null;
  frequencia: string | null;
  versao: number | null;
  arquivo_nome: string;
  arquivo_path: string;
  data_documento: string | null;
  created_at: string;
}

export default function MeuAcervo() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [popFiltro, setPopFiltro] = useState<string | null>(null);
  const [busca, setBusca] = useState("");
  const [selecionados, setSelecionados] = useState<Set<string>>(new Set());
  const [confirmarExclusao, setConfirmarExclusao] = useState<null | { escopo: "selecao" | "filtro" | "todos"; ids: string[] }>(null);
  const [excluindo, setExcluindo] = useState(false);

  const empresaId = empresaAtiva?.id;

  useEffect(() => {
    if (!user || !empresaId) return;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("documentos_bpf")
        .select("id,titulo,tipo,pop_codigo,it_codigo,frequencia,versao,arquivo_nome,arquivo_path,data_documento,created_at")
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });
      setDocs((data as any as Doc[]) || []);
      setSelecionados(new Set());
      setLoading(false);
    })();
  }, [user, empresaId]);

  const stats = useMemo(() => {
    const map: Record<string, { total: number; semPop: number }> = {};
    POPS_CUSTOM.forEach(p => (map[p.codigo] = { total: 0, semPop: 0 }));
    let semPopGeral = 0;
    docs.forEach(d => {
      if (d.pop_codigo && map[d.pop_codigo]) map[d.pop_codigo].total++;
      else semPopGeral++;
    });
    return { map, semPopGeral, total: docs.length };
  }, [docs]);

  const filtrados = useMemo(() => {
    return docs.filter(d => {
      if (popFiltro === "__sem__") { if (d.pop_codigo) return false; }
      else if (popFiltro && d.pop_codigo !== popFiltro) return false;
      if (busca && !d.titulo.toLowerCase().includes(busca.toLowerCase()) && !d.arquivo_nome.toLowerCase().includes(busca.toLowerCase())) return false;
      return true;
    });
  }, [docs, popFiltro, busca]);

  const toggleSel = (id: string) => {
    setSelecionados(prev => {
      const s = new Set(prev);
      if (s.has(id)) s.delete(id); else s.add(id);
      return s;
    });
  };
  const selecionarTodosFiltrados = () => {
    const todosSelecionados = filtrados.every(d => selecionados.has(d.id));
    setSelecionados(prev => {
      const s = new Set(prev);
      if (todosSelecionados) filtrados.forEach(d => s.delete(d.id));
      else filtrados.forEach(d => s.add(d.id));
      return s;
    });
  };
  const limparSelecao = () => setSelecionados(new Set());

  const handleDownload = async (d: Doc) => {
    // Antes tentava só documentos-bpf e feed-bpf. O resolvedor cobre todos os
    // buckets conhecidos e ainda aceita arquivo_path gravado como URL absoluta,
    // que é como parte do acervo antigo foi salvo.
    const { url } = await resolverUrlArquivo(d.arquivo_path);
    if (!url) return toast.error("Erro ao gerar link");
    window.open(url, "_blank");
  };


  const executarExclusao = async () => {
    if (!confirmarExclusao) return;
    const ids = confirmarExclusao.ids;
    if (ids.length === 0) { setConfirmarExclusao(null); return; }
    setExcluindo(true);
    const alvos = docs.filter(d => ids.includes(d.id));
    const paths = alvos.map(d => d.arquivo_path).filter(Boolean);

    // Remove no storage em lote (ignora erros de arquivos ausentes)
    if (paths.length > 0) {
      await supabase.storage.from("documentos-bpf").remove(paths);
      // best-effort no bucket legado
      await supabase.storage.from("feed-bpf").remove(paths).catch(() => {});
    }

    // Deleta em lote no banco
    const { error } = await supabase.from("documentos_bpf").delete().in("id", ids);
    setExcluindo(false);
    setConfirmarExclusao(null);

    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      return;
    }
    setDocs(prev => prev.filter(d => !ids.includes(d.id)));
    setSelecionados(prev => {
      const s = new Set(prev);
      ids.forEach(i => s.delete(i));
      return s;
    });
    toast.success(`${ids.length} documento(s) excluído(s)`);
  };

  const pedirExclusao = (escopo: "selecao" | "filtro" | "todos") => {
    let ids: string[] = [];
    if (escopo === "selecao") ids = Array.from(selecionados);
    else if (escopo === "filtro") ids = filtrados.map(d => d.id);
    else ids = docs.map(d => d.id);
    if (ids.length === 0) { toast.info("Nada para excluir"); return; }
    setConfirmarExclusao({ escopo, ids });
  };

  const atualizarPop = async (d: Doc, novoPop: string) => {
    const { error } = await supabase.from("documentos_bpf").update({ pop_codigo: novoPop }).eq("id", d.id);
    if (error) return toast.error("Erro ao vincular POP");
    setDocs(docs.map(x => (x.id === d.id ? { ...x, pop_codigo: novoPop } : x)));
    toast.success(`Vinculado a ${novoPop}`);
  };

  if (!empresaId) {
    return (
      <div className="space-y-6">
        <PageHeader icon={FolderOpen} title="Meu Acervo" description="Selecione uma empresa para gerenciar documentos" />
        <EmpresaSelector />
      </div>
    );
  }

  const todosFiltradosSelecionados = filtrados.length > 0 && filtrados.every(d => selecionados.has(d.id));
  const totalSel = selecionados.size;

  return (
    <div className="space-y-6">
      <PageHeader icon={FolderOpen} title="Meu Acervo" description="Documentos organizados por POP — cada card mostra o que você tem" />

      <div className="flex flex-wrap gap-3 items-end">
        <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
          <Link to="/feedbpf-custom/importacao"><Upload className="w-4 h-4 mr-2" /> Importar documentos</Link>
        </Button>
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input placeholder="Buscar por título ou arquivo..." className="pl-9" value={busca} onChange={e => setBusca(e.target.value)} />
          </div>
        </div>
      </div>

      {/* Grid de POPs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {POPS_CUSTOM.map(pop => {
          const s = stats.map[pop.codigo];
          const ativo = popFiltro === pop.codigo;
          return (
            <button
              key={pop.codigo}
              onClick={() => setPopFiltro(ativo ? null : pop.codigo)}
              className={`text-left p-4 rounded-xl border-2 transition-all ${
                ativo ? "border-emerald-500 bg-emerald-500/10 shadow-md" : "border-border hover:border-emerald-500/50 bg-card"
              }`}
            >
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-mono font-bold text-emerald-700">{pop.codigo}</span>
                <span className="text-2xl font-bold">{s.total}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-2 leading-tight">{pop.nome}</p>
            </button>
          );
        })}
        <button
          onClick={() => setPopFiltro(popFiltro === "__sem__" ? null : "__sem__")}
          className={`text-left p-4 rounded-xl border-2 transition-all ${
            popFiltro === "__sem__" ? "border-amber-500 bg-amber-500/10" : "border-amber-200 hover:border-amber-400 bg-amber-50/50"
          }`}
        >
          <div className="flex items-baseline justify-between">
            <Link2Off className="w-4 h-4 text-amber-700" />
            <span className="text-2xl font-bold text-amber-700">{stats.semPopGeral}</span>
          </div>
          <p className="text-xs text-amber-800 mt-2 font-medium">Sem POP vinculado</p>
        </button>
      </div>

      {/* Atalhos para Modelos Originais (Zip) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardHeader className="pb-3 pt-4">
            <CardTitle className="text-sm flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Modelos Rápidos (Arquivos do Material Enviado)
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-2">
              {Object.keys(MODELOS_ASSETS).slice(0, 5).map(popKey => (
                <Button 
                  key={popKey} 
                  variant="outline" 
                  size="sm" 
                  className="text-[10px] h-7 border-emerald-200 hover:bg-emerald-100"
                  onClick={() => setPopFiltro(popKey)}
                >
                  Modelos {popKey}
                </Button>
              ))}
              <Button 
                variant="ghost" 
                size="sm" 
                className="text-[10px] h-7"
                asChild
              >
                <Link to="/modelos">Ver todos na Biblioteca →</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {popFiltro && MODELOS_ASSETS[popFiltro] && (
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2 pt-4">
              <CardTitle className="text-xs font-bold uppercase tracking-wider text-primary">
                Downloads disponíveis para {popFiltro}
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-3">
              <div className="flex flex-wrap gap-2">
                {MODELOS_ASSETS[popFiltro].map((m, idx) => (
                  <Button 
                    key={idx} 
                    variant="link" 
                    size="sm" 
                    className="h-auto p-0 text-xs text-primary underline decoration-primary/30"
                    onClick={() => window.open(m.url, "_blank")}
                  >
                    <Download className="w-3 h-3 mr-1" /> {m.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Barra de ações em lote */}
      {docs.length > 0 && (
        <Card className="border-emerald-200 bg-emerald-500/5">
          <CardContent className="p-3 flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={selecionarTodosFiltrados} disabled={filtrados.length === 0} className="h-8 text-xs">
              {todosFiltradosSelecionados ? <CheckSquare className="w-3.5 h-3.5 mr-1" /> : <Square className="w-3.5 h-3.5 mr-1" />}
              {todosFiltradosSelecionados ? "Desmarcar visíveis" : "Selecionar visíveis"} ({filtrados.length})
            </Button>
            {totalSel > 0 && (
              <>
                <Badge variant="outline" className="border-emerald-500 text-emerald-700">{totalSel} selecionado(s)</Badge>
                <Button size="sm" variant="ghost" onClick={limparSelecao} className="h-8 text-xs">Limpar seleção</Button>
                <Button size="sm" variant="destructive" onClick={() => pedirExclusao("selecao")} className="h-8 text-xs">
                  <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir selecionados ({totalSel})
                </Button>
              </>
            )}
            <div className="flex-1" />
            {(popFiltro || busca) && filtrados.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => pedirExclusao("filtro")} className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> Excluir todos filtrados ({filtrados.length})
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={() => pedirExclusao("todos")} className="h-8 text-xs border-destructive/40 text-destructive hover:bg-destructive/10">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> Limpar base ({docs.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Lista */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-12 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" /></div>
          ) : filtrados.length === 0 ? (
            <div className="p-12 text-center">
              <FolderOpen className="w-10 h-10 mx-auto text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">Nenhum documento encontrado.</p>
              <Button asChild variant="link" className="mt-2 text-emerald-600">
                <Link to="/feedbpf-custom/importacao">Importar documentos agora <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {filtrados.map(d => {
                const marcado = selecionados.has(d.id);
                return (
                  <div key={d.id} className={`p-3 flex flex-col sm:flex-row sm:items-center gap-2 hover:bg-muted/30 ${marcado ? "bg-emerald-500/5" : ""}`}>
                    <Checkbox checked={marcado} onCheckedChange={() => toggleSel(d.id)} className="shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium truncate">{d.titulo}</p>
                        {d.it_codigo && <Badge variant="secondary" className="text-[9px] font-mono h-4">{d.it_codigo}</Badge>}
                        {d.versao && <Badge variant="outline" className="text-[9px] font-mono h-4 border-emerald-200 text-emerald-700">v{d.versao}</Badge>}
                        {isArquivoArte(d.arquivo_nome) && (
                          <Badge
                            variant="outline"
                            className="text-[9px] h-4 border-violet-300 text-violet-700 bg-violet-500/10"
                            title={`Arquivo de arte — abra no ${programaRecomendado(d.arquivo_nome)}. Não abre no Word.`}
                          >
                            <Palette className="w-2.5 h-2.5 mr-1" />
                            arte .{extensaoDe(d.arquivo_nome)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {d.arquivo_nome} · {d.data_documento ? new Date(d.data_documento + "T12:00").toLocaleDateString("pt-BR") : "sem data"}
                        {d.frequencia && ` · ${d.frequencia}`}
                      </p>

                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Select value={d.pop_codigo || ""} onValueChange={(v) => atualizarPop(d, v)}>
                        <SelectTrigger className="h-8 w-28 text-xs">
                          <SelectValue placeholder="POP..." />
                        </SelectTrigger>
                        <SelectContent>
                          {POPS_CUSTOM.map(p => <SelectItem key={p.codigo} value={p.codigo}>{p.codigo}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      {d.pop_codigo ? <Badge variant="outline" className="text-[10px]">{d.pop_codigo}</Badge> : <Badge className="bg-amber-500/15 text-amber-700 border-amber-200 text-[10px]"><AlertTriangle className="w-3 h-3 mr-1" />sem POP</Badge>}
                      <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleDownload(d)}><Download className="w-4 h-4" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => setConfirmarExclusao({ escopo: "selecao", ids: [d.id] })}><Trash2 className="w-4 h-4" /></Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!confirmarExclusao} onOpenChange={(o) => !o && !excluindo && setConfirmarExclusao(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmarExclusao?.escopo === "todos"
                ? `Você vai apagar TODOS os ${confirmarExclusao?.ids.length} documento(s) desta empresa (banco + arquivos no storage). Esta ação não pode ser desfeita.`
                : confirmarExclusao?.escopo === "filtro"
                ? `Você vai apagar ${confirmarExclusao?.ids.length} documento(s) do filtro atual (banco + arquivos). Esta ação não pode ser desfeita.`
                : `Você vai apagar ${confirmarExclusao?.ids.length} documento(s) selecionado(s) (banco + arquivos). Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={excluindo}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); executarExclusao(); }}
              disabled={excluindo}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {excluindo && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Excluir definitivamente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
