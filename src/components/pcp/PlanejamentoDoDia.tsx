import { useMemo, useState } from "react";
import { Calendar as CalendarIcon, Wand2, CheckCircle2, AlertTriangle, Save, Loader2, Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  reordenarPorMatriz,
  contarFlushings,
  type MatrizItem,
  type OrdemSeq,
} from "@/utils/pcpHelpers";

interface OrdemMin extends OrdemSeq {
  numero_ordem: string;
  status: string | null;
  formula_nome?: string | null;
  quantidade_programada?: string | null;
}

interface Props {
  ordens: OrdemMin[];
  matriz: MatrizItem[];
  onAplicado: () => void;
}

export default function PlanejamentoDoDia({ ordens, matriz, onAplicado }: Props) {
  const hoje = new Date().toISOString().split("T")[0];
  const [data, setData] = useState(hoje);
  const [salvando, setSalvando] = useState(false);
  const [previewOrdens, setPreviewOrdens] = useState<OrdemMin[] | null>(null);

  // Ordens programadas/em produção do dia
  const ordensDoDia = useMemo(
    () =>
      ordens.filter(
        (o) =>
          (o.data_programada || "").startsWith(data) &&
          (o.status === "programada" || o.status === "em_producao"),
      ),
    [ordens, data],
  );

  // Sequenciamento sugerido pela matriz
  const sequenciaSugerida = useMemo(
    () => reordenarPorMatriz(ordensDoDia, matriz),
    [ordensDoDia, matriz],
  );
  const totalFlush = useMemo(() => contarFlushings(sequenciaSugerida), [sequenciaSugerida]);

  const aplicarSequenciaSugerida = async () => {
    if (sequenciaSugerida.length === 0) return;
    setSalvando(true);
    try {
      // Atualiza sequencia_producao em cada ordem (1, 2, 3, …)
      for (let i = 0; i < sequenciaSugerida.length; i++) {
        const o = sequenciaSugerida[i].ordem;
        await supabase
          .from("ordens_producao")
          .update({ sequencia_producao: i + 1 } as any)
          .eq("id", o.id);
      }
      toast.success(
        `Sequenciamento aplicado a ${sequenciaSugerida.length} ordem(ns). ${totalFlush} flushing(s) previsto(s).`,
      );
      onAplicado();
    } catch (e: any) {
      toast.error("Erro ao aplicar sequenciamento: " + (e.message || ""));
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card className="mb-6 border-primary/30">
      <CardHeader>
        <div className="flex items-start justify-between flex-wrap gap-3">
          <div>
            <CardTitle className="font-display text-base flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Planejamento de Produção do Dia
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Antes de criar/iniciar as ordens, defina a <strong>produção geral do dia</strong> e o
              <strong> sequenciamento ótimo</strong> respeitando a Matriz de Sensibilidade.
 </p>
          </div>
          <div className="flex items-end gap-2">
            <div>
              <label className="text-[10px] text-muted-foreground flex items-center gap-1">
                <CalendarIcon className="w-3 h-3" /> Data do plano
              </label>
              <Input
                type="date"
                value={data}
                onChange={(e) => setData(e.target.value)}
                className="h-8 w-40 text-xs"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Resumo */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="p-2 rounded border bg-background text-center">
            <p className="text-xs text-muted-foreground">Ordens no dia</p>
            <p className="text-xl font-bold">{ordensDoDia.length}</p>
          </div>
          <div className="p-2 rounded border bg-background text-center">
            <p className="text-xs text-muted-foreground">Matriz cadastrada</p>
            <p className="text-xl font-bold">{matriz.length}</p>
          </div>
          <div
            className={`p-2 rounded border text-center ${
              totalFlush > 0 ? "border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10" : "bg-background"
            }`}
          >
            <p className="text-xs text-muted-foreground">Flushings previstos</p>
            <p className={`text-xl font-bold ${totalFlush > 0 ? "text-yellow-700" : "text-primary"}`}>
              {totalFlush}
            </p>
          </div>
          <div className="p-2 rounded border bg-background text-center">
            <p className="text-xs text-muted-foreground">Transições</p>
            <p className="text-xl font-bold">{Math.max(0, ordensDoDia.length - 1)}</p>
          </div>
        </div>

        {ordensDoDia.length === 0 ? (
          <div className="p-6 text-center text-sm text-muted-foreground border border-dashed rounded-lg">
            Nenhuma ordem programada para <strong>{data}</strong>. Crie ordens (botão "Nova Ordem")
            para visualizar o planejamento e o sequenciamento.
          </div>
        ) : ordensDoDia.length < 2 ? (
          <div className="p-3 text-xs text-muted-foreground bg-muted/30 rounded-lg">
            Apenas 1 ordem no dia — sequenciamento não se aplica. Adicione mais ordens para gerar a
            sequência ótima.
          </div>
        ) : (
          <>
            <div className="p-3 rounded-lg border-2 border-primary/30 bg-primary/5">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-start gap-2">
                  <Wand2 className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold">Sequenciamento ótimo sugerido</p>
                    <p className="text-[11px] text-muted-foreground">
                      Algoritmo guloso prioriza ordens que <strong>não exigem flushing</strong> entre
                      transições, depois respeita prioridades. Resultado: <strong>{totalFlush}</strong>{" "}
                      flushing(s) em <strong>{ordensDoDia.length - 1}</strong> transição(ões).
                    </p>
                  </div>
                </div>
                <Button size="sm" onClick={aplicarSequenciaSugerida} disabled={salvando}>
                  {salvando ? (
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ) : (
                    <Save className="w-3 h-3 mr-1" />
                  )}
                  Aplicar sequência às ordens
                </Button>
              </div>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Transição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sequenciaSugerida.map((seq, i) => (
                  <TableRow
                    key={seq.ordem.id}
                    className={
                      seq.flushingAntes ? "bg-yellow-50 dark:bg-yellow-900/10" : ""
                    }
                  >
                    <TableCell className="font-bold">{i + 1}</TableCell>
                    <TableCell className="font-mono text-xs">{seq.ordem.numero_ordem}</TableCell>
                    <TableCell className="text-sm">{seq.ordem.produto}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-[10px] capitalize">
                        {seq.ordem.prioridade || "normal"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {i === 0 ? (
                        <Badge variant="outline" className="text-[10px]">
                          <Sparkles className="w-3 h-3 mr-1" /> Início
                        </Badge>
                      ) : seq.flushingAntes ? (
                        <Badge className="bg-yellow-500/20 text-yellow-700 text-[10px]">
                          <AlertTriangle className="w-3 h-3 mr-1" /> Flushing necessário
                        </Badge>
                      ) : (
                        <Badge className="bg-primary/15 text-primary text-[10px]">
                          <CheckCircle2 className="w-3 h-3 mr-1" /> Sem flushing
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            {matriz.length === 0 && (
              <div className="p-2 text-[11px] text-muted-foreground bg-muted/30 rounded">
                💡 Cadastre combinações na <strong>Matriz de Sensibilidade</strong> para que o
                algoritmo possa identificar quais transições exigem flushing.
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
