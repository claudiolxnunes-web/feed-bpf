import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, Printer, FileText } from "lucide-react";
import { gerarCarimbo, carimboHTML, carimboHTMLCompacto, carimboTexto, type CarimboInfo } from "@/utils/carimboDocumento";
import { gerarRelatorioPDF } from "@/utils/pdfExport";
import PageHeader from "@/components/PageHeader";

const DADOS_FICTICIOS = [
  { produto: "Ração Bovinos Confinamento 22%", lote: "L-2026-0118", quantidade: "12.500 kg", operador: "João Silva", status: "Aprovado" },
  { produto: "Suplemento Mineral Equinos", lote: "L-2026-0119", quantidade: "3.200 kg", operador: "Maria Souza", status: "Aprovado" },
  { produto: "Premix Aves Postura", lote: "L-2026-0120", quantidade: "850 kg", operador: "Carlos Lima", status: "Aprovado" },
  { produto: "Concentrado Suínos Crescimento", lote: "L-2026-0121", quantidade: "5.700 kg", operador: "Ana Pereira", status: "Aprovado" },
  { produto: "Sal Mineral Bovinos Cria", lote: "L-2026-0122", quantidade: "2.400 kg", operador: "Pedro Oliveira", status: "Aprovado" },
];

export default function SimulacaoCarimbo() {
  const [carimbo, setCarimbo] = useState<CarimboInfo | null>(null);

  // Selo calculado sobre os dados fictícios exibidos + metadados.
  const regerar = useCallback(async () => {
    setCarimbo(await gerarCarimbo({
      documentoTipo: "Simulação — Relatório de Produção",
      documentoId: "OP-2026-0118",
      empresa: "Fazenda Modelo Ltda. (FICTÍCIO)",
      usuario: "demo@bpfconsult.com.br",
      conteudo: JSON.stringify(DADOS_FICTICIOS),
    }));
  }, []);

  useEffect(() => { void regerar(); }, [regerar]);

  const imprimirRelatorio = () => {
    gerarRelatorioPDF({
      title: "Relatório de Produção (SIMULAÇÃO)",
      subtitle: "Dados fictícios para demonstração do selo de integridade",
      empresa: "Fazenda Modelo Ltda.",
      responsavel: "Dr. João Silva — CRMV/SP 12345",
      periodo: "Janeiro/2026",
      columns: [
        { header: "Produto", accessor: "produto" },
        { header: "Lote", accessor: "lote" },
        { header: "Quantidade", accessor: "quantidade" },
        { header: "Operador", accessor: "operador" },
        { header: "Status", accessor: "status" },
      ],
      data: DADOS_FICTICIOS,
      footer: "BPF_Consult — Demonstração de selo de integridade",
    });
  };

  if (!carimbo) {
    return <div className="py-12 text-center text-sm text-muted-foreground">Gerando selo de integridade…</div>;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Simulação — Selo de Integridade"
        description="Registro com identificação do responsável, data e hora; selo de integridade (dados fictícios).."
        icon={ShieldCheck}
       assuntoBaseLegal="autocontrole" />

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" /> Selo de integridade gerado agora
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><strong>Documento:</strong> {carimbo.documentoTipo}</div>
            <div><strong>ID/Referência:</strong> {carimbo.documentoId}</div>
            <div><strong>Empresa:</strong> {carimbo.empresa}</div>
            <div><strong>Usuário:</strong> {carimbo.usuario}</div>
            <div><strong>Data/Hora (BR):</strong> {carimbo.dataHoraBR}</div>
            <div><strong>ISO 8601:</strong> <code className="text-xs">{carimbo.dataHoraISO}</code></div>
            <div className="md:col-span-2">
              <strong>Selo:</strong>{" "}
              <Badge variant="secondary" className="font-mono">{carimbo.selo}</Badge>
            </div>
            {carimbo.hashCompleto && (
              <div className="md:col-span-2"><strong>SHA-256 completo:</strong> <code className="text-xs break-all">{carimbo.hashCompleto}</code></div>
            )}
          </div>
          <Button variant="outline" onClick={regerar}>Regerar selo de integridade</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pré-visualização HTML — Versão completa</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden bg-card" dangerouslySetInnerHTML={{ __html: carimboHTML(carimbo) }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pré-visualização HTML — Versão compacta (rótulos)</CardTitle></CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden bg-card" dangerouslySetInnerHTML={{ __html: carimboHTMLCompacto(carimbo) }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Pré-visualização texto puro (CSV/TXT)</CardTitle></CardHeader>
        <CardContent>
          <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto whitespace-pre-wrap">{carimboTexto(carimbo)}</pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" /> Testar PDF com dados fictícios
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Gera um relatório PDF de produção com {DADOS_FICTICIOS.length} lotes fictícios e o selo de integridade aplicado automaticamente no rodapé.
          </p>
          <Button onClick={imprimirRelatorio}>
            <Printer className="w-4 h-4 mr-2" /> Gerar PDF de demonstração
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
