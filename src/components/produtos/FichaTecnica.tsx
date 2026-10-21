import { useState, useEffect } from "react";
import { Loader2, Printer } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { gerarCarimbo, carimboHTML, type CarimboInfo } from "@/utils/carimboDocumento";
import { printElement } from "@/utils/printUtils";

const CLASSIFICACAO_LABELS: Record<string, string> = {
  racao: "Ração", suplemento: "Suplemento", premix: "Premix",
  aditivo: "Aditivo", sal_mineral: "Sal Mineral",
};

const NIVEIS_LABELS: Record<string, string> = {
  umidade: "Umidade (máx.)", proteina_bruta: "Proteína Bruta (mín.)",
  extrato_etereo: "Extrato Etéreo (mín.)", fibra_bruta: "Fibra Bruta (máx.)",
  materia_mineral: "Matéria Mineral (máx.)", calcio: "Cálcio",
  fosforo: "Fósforo (mín.)", sodio: "Sódio", ndt: "NDT",
};

interface Props {
  produtoId: string;
}

export default function FichaTecnica({ produtoId }: Props) {
  const { user } = useAuth();
  const [produto, setProduto] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { empresaAtiva, loading: loadingEmpresa } = useEmpresa();
  const [carimbo, setCarimbo] = useState<CarimboInfo | null>(null);

  // Selo SHA-256 sobre os dados exibidos da ficha (produto) + metadados; refeito quando mudam.
  useEffect(() => {
    if (!produto) { setCarimbo(null); return; }
    let ativo = true;
    gerarCarimbo({
      documentoTipo: "Ficha Técnica",
      documentoId: produto.id,
      empresa: empresaAtiva?.nome || "BPF DIGITAL",
      usuario: user?.email,
      conteudo: JSON.stringify(produto),
    }).then((c) => { if (ativo) setCarimbo(c); });
    return () => { ativo = false; };
  }, [produto, empresaAtiva?.nome, user?.email]);

  useEffect(() => {
    loadData();
  }, [produtoId]);

  async function loadData() {
    const { data: prod } = await supabase.from("produtos").select("*").eq("id", produtoId).single();
    setProduto(prod);
    setLoading(false);
  }

  function formatNivel(value: any): string {
    if (value == null) return "";
    if (typeof value === "object") {
      const { min, max, unit } = value as { min?: string; max?: string; unit?: string };
      if (min && max) return `${min} a ${max} ${unit || ""}`;
      if (min) return `${min} ${unit || ""}`;
      if (max) return `${max} ${unit || ""}`;
    }
    return String(value);
  }

  // Safe text renderer — never lets an object reach JSX
  function s(value: any): string {
    if (value == null) return "";
    if (typeof value === "object") {
      const formatted = formatNivel(value);
      if (formatted) return formatted;
      try { return JSON.stringify(value); } catch { return ""; }
    }
    return String(value);
  }

  function handlePrint() {
    printElement(`ficha-tecnica-content-${produtoId}`, { 
      title: `Ficha Técnica - ${produto?.nome}`,
      className: "print-mode"
    });
  }

  if (loading) return <div className="p-8 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" /></div>;
  if (!produto) return <div className="p-8 text-center">Produto não encontrado.</div>;

  const niveis = (produto.niveis_garantia as Record<string, any>) || {};

  return (
    <div className="space-y-6">
      <Card className="no-print">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-xl font-bold font-display">Ficha Técnica Digital</CardTitle>
          <Button onClick={handlePrint} variant="outline" className="gap-2">
            <Printer className="w-4 h-4" /> Imprimir Documento
          </Button>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Esta é a visualização oficial do produto para controle de qualidade e registros.</p>
        </CardContent>
      </Card>

      <div id={`ficha-tecnica-content-${produtoId}`} className="bg-white p-8 rounded-xl shadow-sm border border-border print:shadow-none print:border-none print:p-0">
        <div className="max-w-[800px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex justify-between items-start border-b-2 border-primary/20 pb-4">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-foreground font-display tracking-tight uppercase">{produto.nome}</h1>
              <Badge variant="secondary" className="text-primary font-bold uppercase tracking-wider">{CLASSIFICACAO_LABELS[produto.classificacao] || produto.classificacao}</Badge>
            </div>
            {empresaAtiva && (
              <div className="text-right text-[10px] text-muted-foreground uppercase">
                <p className="font-bold text-foreground text-[11px]">{empresaAtiva.nome}</p>
                <p>CNPJ: {empresaAtiva.cnpj || "—"}</p>
                <p>Resp. Técnico: {empresaAtiva.responsavel_tecnico || "—"}</p>
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-6">
              <section>
                <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-3 mb-4">1. Identificação</h2>
                <div className="grid grid-cols-2 gap-y-3 text-sm">
                  <div className="text-muted-foreground">Marca:</div><div className="font-semibold">{s(produto.marca) || "—"}</div>
                  <div className="text-muted-foreground">Espécie Alvo:</div><div className="font-semibold">{s(produto.especie_alvo) || "—"}</div>
                  <div className="text-muted-foreground">Registro MAPA:</div><div className="font-semibold font-mono text-xs">{s(produto.registro_mapa) || "—"}</div>
                  <div className="text-muted-foreground">Forma Física:</div><div className="font-semibold">{s(produto.forma_fisica) || "—"}</div>
                  <div className="text-muted-foreground">Peso Líquido:</div><div className="font-semibold">{s(produto.peso_liquido)} {s(produto.unidade_peso)}</div>
                </div>
              </section>

              <section>
                <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-3 mb-4">2. Composição</h2>
                <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">{s(produto.composicao) || "—"}</p>
              </section>
            </div>

            <section>
              <h2 className="text-sm font-bold text-primary uppercase tracking-widest border-l-4 border-primary pl-3 mb-4">3. Níveis de Garantia</h2>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 border-b border-border">
                      <th className="px-4 py-2 text-left font-bold text-xs uppercase tracking-wider">Parâmetro</th>
                      <th className="px-4 py-2 text-center font-bold text-xs uppercase tracking-wider">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {Object.entries(niveis).map(([key, value]) => [key, formatNivel(value)] as const).filter(([_, v]) => v).map(([key, value]) => (
                      <tr key={key} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2 text-muted-foreground">{NIVEIS_LABELS[key] || key}</td>
                        <td className="px-4 py-2 text-center font-mono text-xs font-bold text-primary">{value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <div className="grid md:grid-cols-2 gap-8 pt-6">
            <section className="space-y-4">
              <div>
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 4. Indicações de Uso
                </h2>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">{s(produto.indicacoes) || "—"}</p>
              </div>
              <div>
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 5. Modo de Uso / Preparo
                </h2>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">{s(produto.modo_uso) || "—"}</p>
              </div>
            </section>

            <section className="space-y-4">
              <div>
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 6. Precauções
                </h2>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">{s(produto.precaucoes) || "—"}</p>
              </div>
              <div>
                <h2 className="text-xs font-bold text-primary uppercase tracking-widest mb-2 flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" /> 7. Armazenamento
                </h2>
                <p className="text-sm text-foreground bg-muted/30 p-3 rounded-lg border border-border/50">{s(produto.armazenamento) || "—"}</p>
              </div>
            </section>
          </div>

          {/* Footer with stamp */}
          <div className="pt-10 mt-10 border-t border-border flex flex-col items-center gap-4">
            {carimbo && <div dangerouslySetInnerHTML={{ __html: carimboHTML(carimbo) }} />}
            <p className="text-[9px] text-muted-foreground italic text-center max-w-md">
              Documento gerado eletronicamente pelo Sistema BPF Digital em {new Date().toLocaleString("pt-BR")}. 
 Conformidade garantida.
 </p>
          </div>
        </div>
      </div>
    </div>
  );
}
