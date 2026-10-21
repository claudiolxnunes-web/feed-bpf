import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { getBaseLegal } from "@/config/baseLegal";
import { useState, useEffect, useMemo } from "react";
import { BarChart3, Download, Loader2, Calendar, Building2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

// Fixed MAPA item list for the monthly report
const ITENS_MAPA = [
  "Alimento para animais de companhia",
  "Aditivos nutricionais",
  "Aditivos sensoriais",
  "Aditivos tecnológicos",
  "Aditivos zootécnicos - melhorador de desempenho beta-agonista",
  "Aditivos zootécnicos – outros (acidificantes, enzimáticos, prebióticos e probióticos)",
  "Concentrado para aves (Corte e Postura)",
  "Concentrado para suínos",
  "Concentrado para outros monogástricos",
  "Concentrado para ruminantes (Todas as espécies)",
  "Coproduto",
  "Ingrediente - Milho ou derivados",
  "Ingrediente - Soja ou derivados",
  "Ingrediente - Trigo ou derivados",
  "Ingrediente de origem vegetal - Outros",
  "Ingrediente de origem animal - Derivados lácteos",
  "Ingrediente de origem animal - Farinhas de monogástricos",
  "Ingrediente de origem animal - Farinhas de ruminantes",
  "Ingrediente de origem animal - Farinhas mistas (Rum. e Monog.)",
  "Ingrediente de origem animal - Óleos e gorduras (todas as espécies)",
  "Ingrediente macromineral",
  "Núcleo para aves (Corte e Postura)",
  "Núcleo para suínos",
  "Núcleo para outros monogástricos",
  "Núcleo para ruminantes (Todas as espécies)",
  "Premix para aves (Corte e Postura)",
  "Premix para suínos",
  "Premix para outros monogástricos",
  "Premix para ruminantes (Todas as espécies)",
  "Produto mastigável",
  "Ração para aves (Corte e Postura)",
  "Ração para suínos",
  "Ração para outros monogástricos",
  "Ração para ruminantes (Todas as espécies)",
  "Suplemento para animais de companhia",
  "Suplemento para outros monogástricos",
  "Suplemento para ruminantes (Todas as espécies)",
  "Outros",
  "Produção de cozinhas industriais e caseiras",
];

type AtividadeTab = "producao" | "importacao" | "exportacao" | "fracionamento";

const TAB_LABELS: Record<AtividadeTab, string> = {
  producao: "Produção",
  importacao: "Importação",
  exportacao: "Exportação",
  fracionamento: "Fracionamento",
};

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];

type ValoresMap = Record<AtividadeTab, Record<string, string>>;

function escapeCsv(val: unknown): string {
  if (val === null || val === undefined) return "";
  const s = String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export default function RelatorioProducao() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [ano, setAno] = useState(String(currentYear));
  const [mes, setMes] = useState(String(currentMonth));
  const [activeTab, setActiveTab] = useState<AtividadeTab>("producao");
  const [loading, setLoading] = useState(true);
  const [empresaRegistroSipeagro, setEmpresaRegistroSipeagro] = useState("");

  // Values per tab per item
  const [valores, setValores] = useState<ValoresMap>({
    producao: {},
    importacao: {},
    exportacao: {},
    fracionamento: {},
  });

  // Use empresaAtiva from hook instead of manual loading
  const empresaNome = empresaAtiva?.nome || "";
  const empresaCnpj = empresaAtiva?.cnpj || "";

  // Load production data and auto-fill the "producao" tab
  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const startDate = `${ano}-${mes.padStart(2, "0")}-01`;
      const endMonth = Number(mes) === 12 ? 1 : Number(mes) + 1;
      const endYear = Number(mes) === 12 ? Number(ano) + 1 : Number(ano);
      const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

      // Escopo obrigatório: dados apenas da empresa ativa (isolamento multiempresa)
      const empId = empresaAtiva?.id;
      const scoped = (q: any) => (empId ? q.eq("empresa_id", empId) : q);
      const [prodRes, produtosRes] = await Promise.all([
        scoped(supabase.from("producao").select("produto, quantidade").gte("data", startDate).lt("data", endDate)),
        scoped(supabase.from("produtos").select("nome, classificacao, especie_alvo")),
      ]);

      // Build mapping from produto name to MAPA item
      const produtoToMapaItem: Record<string, string> = {};
      for (const p of produtosRes.data || []) {
        const key = p.nome.toLowerCase();
        const cls = (p.classificacao || "").toLowerCase();
        const esp = (p.especie_alvo || "").toLowerCase();

        // Map based on classificacao + especie
        if (cls.includes("racao") || cls.includes("ração")) {
          if (esp.includes("ave")) produtoToMapaItem[key] = "Ração para aves (Corte e Postura)";
          else if (esp.includes("suíno") || esp.includes("suino")) produtoToMapaItem[key] = "Ração para suínos";
          else if (esp.includes("ruminante") || esp.includes("bovino") || esp.includes("gado"))
            produtoToMapaItem[key] = "Ração para ruminantes (Todas as espécies)";
          else produtoToMapaItem[key] = "Ração para outros monogástricos";
        } else if (cls.includes("concentrado")) {
          if (esp.includes("ave")) produtoToMapaItem[key] = "Concentrado para aves (Corte e Postura)";
          else if (esp.includes("suíno") || esp.includes("suino")) produtoToMapaItem[key] = "Concentrado para suínos";
          else if (esp.includes("ruminante") || esp.includes("bovino"))
            produtoToMapaItem[key] = "Concentrado para ruminantes (Todas as espécies)";
          else produtoToMapaItem[key] = "Concentrado para outros monogástricos";
        } else if (cls.includes("suplemento")) {
          if (esp.includes("companhia") || esp.includes("pet"))
            produtoToMapaItem[key] = "Suplemento para animais de companhia";
          else if (esp.includes("ruminante") || esp.includes("bovino"))
            produtoToMapaItem[key] = "Suplemento para ruminantes (Todas as espécies)";
          else produtoToMapaItem[key] = "Suplemento para outros monogástricos";
        } else if (cls.includes("premix")) {
          if (esp.includes("ave")) produtoToMapaItem[key] = "Premix para aves (Corte e Postura)";
          else if (esp.includes("suíno") || esp.includes("suino")) produtoToMapaItem[key] = "Premix para suínos";
          else if (esp.includes("ruminante") || esp.includes("bovino"))
            produtoToMapaItem[key] = "Premix para ruminantes (Todas as espécies)";
          else produtoToMapaItem[key] = "Premix para outros monogástricos";
        } else if (cls.includes("nucleo") || cls.includes("núcleo")) {
          if (esp.includes("ave")) produtoToMapaItem[key] = "Núcleo para aves (Corte e Postura)";
          else if (esp.includes("suíno") || esp.includes("suino")) produtoToMapaItem[key] = "Núcleo para suínos";
          else if (esp.includes("ruminante") || esp.includes("bovino"))
            produtoToMapaItem[key] = "Núcleo para ruminantes (Todas as espécies)";
          else produtoToMapaItem[key] = "Núcleo para outros monogástricos";
        } else if (cls.includes("pet") || cls.includes("companhia")) {
          produtoToMapaItem[key] = "Alimento para animais de companhia";
        } else {
          produtoToMapaItem[key] = "Outros";
        }
      }

      // Aggregate production by MAPA item (in tonnes)
      const agg: Record<string, number> = {};
      for (const row of prodRes.data || []) {
        const mapaItem = produtoToMapaItem[row.produto.toLowerCase()] || "Outros";
        const qty = parseFloat((row.quantidade || "0").replace(/[^\d.,]/g, "").replace(",", ".")) || 0;
        agg[mapaItem] = (agg[mapaItem] || 0) + qty;
      }

      // Convert kg to tonnes and set values
      const autoValues: Record<string, string> = {};
      for (const [item, kgTotal] of Object.entries(agg)) {
        const tonnes = kgTotal / 1000;
        if (tonnes > 0) {
          autoValues[item] = tonnes.toFixed(2).replace(".", ",");
        }
      }

      setValores((prev) => ({
        ...prev,
        producao: autoValues,
      }));
      setLoading(false);
    };
    fetchData();
  }, [user, ano, mes]);

  const handleValueChange = (tab: AtividadeTab, item: string, value: string) => {
    setValores((prev) => ({
      ...prev,
      [tab]: { ...prev[tab], [item]: value },
    }));
  };

  const getTotal = (tab: AtividadeTab): number => {
    return Object.values(valores[tab]).reduce((sum, v) => {
      const n = parseFloat((v || "0").replace(",", "."));
      return sum + (isNaN(n) ? 0 : n);
    }, 0);
  };

  const exportCsv = () => {
    const mesLabel = MESES[Number(mes) - 1];
    let csv = `SIPEAGRO — Lançamento de Alimentação Animal\n`;
    csv += `Período: ${mesLabel}/${ano}\n`;
    csv += `Estabelecimento: ${empresaNome}\n`;
    csv += `CNPJ: ${empresaCnpj}\n`;
    csv += `Registro SIPEAGRO/MAPA: ${empresaRegistroSipeagro || "N/I"}\n`;
    csv += `Conforme ${getBaseLegal("relatorio_producao_mensal").citacao}\n\n`;

    for (const tab of Object.keys(TAB_LABELS) as AtividadeTab[]) {
      const total = getTotal(tab);
      csv += `\n${TAB_LABELS[tab].toUpperCase()}\n`;
      csv += `Item,Peso (Toneladas)\n`;
      for (const item of ITENS_MAPA) {
        const val = valores[tab][item];
        csv += `${escapeCsv(item)},${val ? val : "X"}\n`;
      }
      csv += `Total,${total > 0 ? total.toFixed(2).replace(".", ",") : "0,00"}\n`;
    }

    csv += `\n--- Relatório gerado conforme modelo de relatório de produção do MAPA (${getBaseLegal("relatorio_producao_mensal").citacao}) ---\n`;
    csv += `Data de geração: ${new Date().toLocaleString("pt-BR")}\n`;

    const BOM = "\uFEFF";
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio_${activeTab}_${ano}_${mes.padStart(2, "0")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Relatório exportado com sucesso!");
  };

  const renderTable = (tab: AtividadeTab) => {
    const tabValues = valores[tab];
    const total = getTotal(tab);

    return (
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-display flex items-center gap-2">
              <Building2 className="w-4 h-4" />
              Lançamento de {TAB_LABELS[tab]} — {MESES[Number(mes) - 1]}/{ano}
            </CardTitle>
          </div>
          {empresaNome && (
            <p className="text-xs text-muted-foreground mt-1">
              {empresaNome} {empresaCnpj && `— ${empresaCnpj}`}
            </p>
          )}
        </CardHeader>
        <CardContent>
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[70%]">Item</TableHead>
                  <TableHead className="text-center">Peso (Toneladas)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ITENS_MAPA.map((item) => {
                  const val = tabValues[item] || "";
                  const hasValue = val.trim() !== "" && val.trim() !== "0";
                  return (
                    <TableRow key={item} className={hasValue ? "bg-primary/5" : ""}>
                      <TableCell className="text-sm py-1.5">{item}</TableCell>
                      <TableCell className="text-center py-1.5">
                        <Input
                          className="w-24 mx-auto text-center h-7 text-sm"
                          placeholder="X"
                          value={val}
                          onChange={(e) => handleValueChange(tab, item, e.target.value)}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
                <TableRow className="font-bold bg-muted/60 border-t-2">
                  <TableCell className="text-sm">Total</TableCell>
                  <TableCell className="text-center text-sm text-primary">
                    {total > 0 ? total.toFixed(2).replace(".", ",") : "0,00"}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <PageHeader
        icon={BarChart3}
        title="Relatório Mensal de Produção — SIPEAGRO"
        description={`Lançamento mensal conforme relatório de produção mensal do MAPA — Produção, Importação, Exportação e Fracionamento`}
       assuntoBaseLegal="relatorio_producao_mensal" />

      {/* SIPEAGRO Header Info */}
      <Card className="mb-4 border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <Building2 className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h4 className="font-semibold text-sm">Dados do Estabelecimento — SIPEAGRO</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                <div>
                  <span className="text-muted-foreground">Razão Social:</span> <strong>{empresaNome || "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">CNPJ:</span> <strong>{empresaCnpj || "—"}</strong>
                </div>
                <div>
                  <span className="text-muted-foreground">Registro SIPEAGRO:</span>{" "}
                  <strong>{empresaRegistroSipeagro || "N/I"}</strong>
                </div>
                <div>
                  <BaseLegalBadge assunto="relatorio_producao_mensal" />
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6 items-end">
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Mês</label>
          <Select value={mes} onValueChange={setMes}>
            <SelectTrigger className="w-40">
              <Calendar className="w-4 h-4 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MESES.map((m, i) => (
                <SelectItem key={i} value={String(i + 1)}>
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-xs text-muted-foreground block mb-1">Ano</label>
          <Select value={ano} onValueChange={setAno}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[currentYear - 1, currentYear, currentYear + 1].map((y) => (
                <SelectItem key={y} value={String(y)}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button size="sm" variant="outline" onClick={exportCsv} disabled={loading}>
          <Download className="w-4 h-4 mr-1" /> Exportar CSV
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {(Object.keys(TAB_LABELS) as AtividadeTab[]).map((tab) => {
              const total = getTotal(tab);
              const filledCount = Object.values(valores[tab]).filter((v) => v.trim() !== "").length;
              return (
                <Card
                  key={tab}
                  className={`cursor-pointer transition-all ${activeTab === tab ? "ring-2 ring-primary" : "hover:bg-muted/30"}`}
                  onClick={() => setActiveTab(tab)}
                >
                  <CardContent className="pt-4 text-center">
                    <p className="text-xl font-bold font-display text-primary">
                      {total > 0 ? `${total.toFixed(2).replace(".", ",")} t` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">{TAB_LABELS[tab]}</p>
                    {filledCount > 0 && (
                      <p className="text-[10px] text-muted-foreground mt-1">{filledCount} itens preenchidos</p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as AtividadeTab)}>
            <TabsList className="mb-4">
              <TabsTrigger value="producao">Produção</TabsTrigger>
              <TabsTrigger value="importacao">Importação</TabsTrigger>
              <TabsTrigger value="exportacao">Exportação</TabsTrigger>
              <TabsTrigger value="fracionamento">Fracionamento</TabsTrigger>
            </TabsList>
            <TabsContent value="producao">{renderTable("producao")}</TabsContent>
            <TabsContent value="importacao">{renderTable("importacao")}</TabsContent>
            <TabsContent value="exportacao">{renderTable("exportacao")}</TabsContent>
            <TabsContent value="fracionamento">{renderTable("fracionamento")}</TabsContent>
          </Tabs>
        </>
      )}
    </>
  );
}
