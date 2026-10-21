import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, AlertCircle, Clock, ShieldCheck } from "lucide-react";
import { differenceInDays, parseISO } from "date-fns";
import { cn } from "@/lib/utils";

const POPS_CONFIG: Record<string, { label: string; freq: number }> = {
  "POP-01": { label: "Fornecedores", freq: 30 },
  "POP-02": { label: "Higiene/Limpeza", freq: 7 },
  "POP-03": { label: "Higiene Pessoal", freq: 30 },
  "POP-04": { label: "Água", freq: 30 },
  "POP-05": { label: "Produção/PCC", freq: 7 },
  "POP-06": { label: "Manutenção", freq: 7 },
  "POP-07": { label: "Pragas", freq: 30 },
  "POP-08": { label: "Resíduos", freq: 90 },
  "POP-09": { label: "Rastreabilidade", freq: 30 },
  "POP-10": { label: "PAC - Autocontrole", freq: 30 },
};

interface DashboardPopStatusProps {
  execucoes: any[];
  documentos: any[];
}

export function DashboardPopStatus({ execucoes, documentos }: DashboardPopStatusProps) {
  const hoje = new Date();

  const popStatus = Object.entries(POPS_CONFIG).map(([codigo, config]) => {
    const ultimaExec = execucoes.find(e => e.codigo_pop === codigo);
    const docRelacionado = documentos.find(d => d.codigo === codigo);
    
    let status = "pendente";
    let diasAtraso = 0;
    let dataUltima = "-";

    if (ultimaExec) {
      const data = parseISO(ultimaExec.data_execucao);
      const dias = differenceInDays(hoje, data);
      dataUltima = ultimaExec.data_execucao;
      
      if (dias <= config.freq) {
        status = "conforme";
      } else {
        status = "atrasado";
        diasAtraso = dias - config.freq;
      }
    }

    // Alerta de Revisão Anual (Documento)
    let statusRevisao = "no_prazo";
    let dataRevisao = null;
    if (docRelacionado) {
      dataRevisao = docRelacionado.proxima_revisao || docRelacionado.validade_revisao;
      if (dataRevisao) {
        const diasParaRevisao = differenceInDays(parseISO(dataRevisao), hoje);
        if (diasParaRevisao < 0) statusRevisao = "vencido";
        else if (diasParaRevisao <= 30) statusRevisao = "alerta";
      }
    }

    return {
      codigo,
      ...config,
      status,
      diasAtraso,
      dataUltima,
      statusRevisao,
      dataRevisao
    };
  });

  return (
    <Card className="border-border/50 shadow-premium overflow-hidden">
      <CardHeader className="pb-2 border-b border-border/50 bg-primary/5">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-bold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Status BPF (10 POPs + PAC)
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[9px] font-mono border-amber-200 text-amber-800 bg-amber-50">Rev. 1 Ano</Badge>
            <Badge variant="outline" className="text-[9px] font-mono border-primary/20">MAPA Assertivo</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border/30">
          {popStatus.map((pop) => (
            <div key={pop.codigo} className="flex items-center justify-between p-3 hover:bg-muted/30 transition-colors">
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-foreground">{pop.codigo}</span>
                  {pop.statusRevisao === "vencido" && (
                    <Badge variant="destructive" className="h-3.5 px-1 text-[8px] animate-pulse">REV VENCIDA</Badge>
                  )}
                  {pop.statusRevisao === "alerta" && (
                    <Badge variant="outline" className="h-3.5 px-1 text-[8px] border-amber-300 bg-amber-50 text-amber-700">REV 30D</Badge>
                  )}
                </div>
                <span className="text-[10px] text-muted-foreground truncate w-32">{pop.label}</span>
              </div>
              
              <div className="flex flex-col items-end gap-1">
                {pop.status === "conforme" ? (
                  <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px] gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Em dia
                  </Badge>
                ) : pop.status === "atrasado" ? (
                  <Badge variant="destructive" className="text-[10px] gap-1">
                    <AlertCircle className="w-3 h-3" /> {pop.diasAtraso}d atraso
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Clock className="w-3 h-3" /> Sem registro
                  </Badge>
                )}
                <span className="text-[9px] text-muted-foreground font-mono">Último: {pop.dataUltima}</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
