import { useMemo, useRef } from "react";
import { Printer, ArrowRightLeft, ShieldAlert, CheckCircle2, Factory, Package, Warehouse, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { printElement } from "@/utils/printUtils";

interface Ordem {
  id: string;
  numero_ordem: string;
  produto: string;
  formula_nome: string;
  lote_produto: string | null;
  quantidade_programada: string | null;
  prioridade: string | null;
  status: string | null;
  sequencia_producao: number | null;
  tempo_mistura_padrao_minutos: number | null;
  tipo_embalagem: string | null;
  local_armazenamento: string | null;
  necessita_flushing?: boolean | null;
}

interface Props {
  ordens: Ordem[];
  matriz: any[];
}

export default function SequenciamentoPlanilha({ ordens, matriz }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  // Filtrar ordens programadas ou em produção
  const ordensAtivas = useMemo(() => {
    return [...ordens]
      .filter(o => o.status === "programada" || o.status === "em_producao")
      .sort((a, b) => {
        const seqA = a.sequencia_producao || 999;
        const seqB = b.sequencia_producao || 999;
        return seqA - seqB;
      });
  }, [ordens]);

  const sequenciaComTransicao = useMemo(() => {
    return ordensAtivas.map((ordem, idx) => {
      const anterior = idx > 0 ? ordensAtivas[idx - 1] : undefined;
      let requerFlushing = false;
      let tipoLimpeza = "Vassouragem";

      if (anterior) {
        const match = matriz.find(
          (m: any) => m.produto_anterior.toLowerCase() === anterior.produto.toLowerCase() &&
                      m.produto_seguinte.toLowerCase() === ordem.produto.toLowerCase()
        );
        if (match) {
          requerFlushing = match.requer_flushing;
          tipoLimpeza = requerFlushing ? "Flushing / Lavagem" : "Vassouragem";
        }
      }

      return { ...ordem, requerFlushing, tipoLimpeza, anterior };
    });
  }, [ordensAtivas, matriz]);

  const handlePrint = () => {
    const hoje = new Date().toLocaleDateString('pt-BR');
    printElement("planilha-sequenciamento-print", {
      title: `Planilha_Sequenciamento_${hoje.replace(/\//g, '-')}`,
      landscape: true
    });
  };

  if (ordensAtivas.length === 0) return null;

  return (
    <Card className="border-primary/20 bg-muted/5">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <ArrowRightLeft className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-base font-display">Planilha de Sequenciamento — Programação de Fábrica</CardTitle>
            <p className="text-xs text-muted-foreground mt-0.5">Visão detalhada da sequência de produção e transições </p>
          </div>
        </div>
        <Button size="sm" variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-2" /> Imprimir Planilha
        </Button>
      </CardHeader>
      <CardContent>
        <div id="planilha-sequenciamento-print" className="bg-white">
          <div className="hidden print:block mb-6 border-b-2 border-gray-800 pb-4">
            <h1 className="text-xl font-bold uppercase">Planilha 5.2 — Programação e Sequenciamento de Fábrica</h1>
            <p className="text-sm">Data de Emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
          
          <Table className="border print:text-black">
            <TableHeader className="bg-muted/50 print:bg-gray-100">
              <TableRow>
                <TableHead className="w-10 text-center font-bold">#</TableHead>
                <TableHead>OP / Produto</TableHead>
                <TableHead>Fórmula / Lote PA</TableHead>
                <TableHead className="text-center">Qtd / Ensaque</TableHead>
                <TableHead className="text-center">Mistura</TableHead>
                <TableHead>Transição / Limpeza</TableHead>
                <TableHead className="hidden print:table-cell border-l">Assinatura Operador</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sequenciaComTransicao.map((item, i) => (
                <TableRow key={item.id} className={item.requerFlushing ? "bg-yellow-50/50 print:bg-yellow-50" : ""}>
                  <TableCell className="text-center font-bold border-r">{i + 1}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-mono text-xs font-bold text-primary">{item.numero_ordem}</span>
                      <span className="font-medium text-sm">{item.produto}</span>
                      <Badge variant="outline" className="w-fit text-[9px] mt-1 capitalize">{item.prioridade || "normal"}</Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-1 text-[11px]">
                        <Factory className="w-3 h-3 text-muted-foreground" />
                        <span>{item.formula_nome}</span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px]">
                        <Package className="w-3 h-3 text-muted-foreground" />
                        <span>Lote: {item.lote_produto || "A definir"}</span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col gap-1 items-center">
                      <span className="text-sm font-bold">{item.quantidade_programada || "—"} kg</span>
                      <span className="text-[10px] text-muted-foreground">{item.tipo_embalagem || "Sacos 25kg"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex flex-col items-center">
                      <Clock className="w-4 h-4 text-muted-foreground mb-1" />
                      <span className="text-xs font-semibold">{item.tempo_mistura_padrao_minutos || 3} min</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {i === 0 ? (
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1 italic">
                        <CheckCircle2 className="w-3 h-3" /> Início da Linha (Limpa)
                      </span>
                    ) : (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          {item.requerFlushing ? (
                            <ShieldAlert className="w-3.5 h-3.5 text-yellow-600" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                          )}
                          <span className={`text-[11px] font-semibold ${item.requerFlushing ? "text-yellow-700" : "text-primary"}`}>
                            {item.tipoLimpeza}
                          </span>
                        </div>
                        <p className="text-[9px] text-muted-foreground leading-tight italic">
                          Após: {item.anterior?.produto}
                        </p>
                      </div>
                    )}
                    <div className="mt-2 text-[10px] flex items-center gap-1">
                      <Warehouse className="w-3 h-3" />
                      <span>Estoque: {item.local_armazenamento || "Expedição"}</span>
                    </div>
                  </TableCell>
                  <TableCell className="hidden print:table-cell border-l min-w-[120px]">
                    <div className="h-8 border-b border-dotted border-gray-400"></div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          <div className="hidden print:grid grid-cols-2 gap-8 mt-12 text-xs">
            <div className="border-t border-black pt-2 text-center">
              <p className="font-bold">Responsável PCP / Programação</p>
              <p className="mt-1">Assinatura / Data</p>
            </div>
            <div className="border-t border-black pt-2 text-center">
              <p className="font-bold">Gerente de Produção / Qualidade</p>
              <p className="mt-1">Visto / Validação</p>
            </div>
          </div>
          
          <div className="hidden print:block mt-6 text-[9px] text-gray-500 italic text-center">
            Este documento é parte integrante do PAC 05 e deve ser arquivado por no mínimo 2 anos para auditorias do MAPA.
          </div>
        </div>
      </CardContent>
    </Card>
  );
}