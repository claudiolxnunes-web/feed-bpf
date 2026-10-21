import { useState, useEffect } from "react";
import { useSessionDraft } from "@/hooks/useSessionDraft";
import { Loader2, Printer, Save, RefreshCw, Download } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { inserirCarimbo, CARIMBO_PLACEHOLDER } from "@/utils/carimboDocumento";

interface Props {
  produtoId: string;
}

interface RTPIData {
  razao_social: string;
  nome_fantasia: string;
  endereco: string;
  cnpj: string;
  inscricao_estadual: string;
  telefone: string;
  registro_mapa: string;
  nome_produto: string;
  marca: string;
  classificacao: string;
  forma_fisica: string;
  embalagem: string;
  composicao_qualitativa: string;
  composicao_basica: string;
  enriquecimento: string;
  eventuais_substitutivos: string;
  niveis_garantia: string;
  controle_produto_acabado: string;
  indicacoes_uso: string;
  especie_destino: string;
  modo_usar: string;
  conteudo_liquido: string;
  prazo_validade: string;
  condicoes_conservacao: string;
  restricoes: string;
  rt_nome: string;
  rt_crmv: string;
  local_data: string;
}

const EMPTY_RTPI: RTPIData = {
  razao_social: "", nome_fantasia: "", endereco: "", cnpj: "",
  inscricao_estadual: "", telefone: "", registro_mapa: "",
  nome_produto: "", marca: "", classificacao: "", forma_fisica: "",
  embalagem: "", composicao_qualitativa: "", composicao_basica: "",
  enriquecimento: "", eventuais_substitutivos: "", niveis_garantia: "",
  controle_produto_acabado: "Os produtos acabados serão armazenados separadamente por espécies, e em estrados. A sacaria deve ser limpa e sem sujidades ou furos. Os produtos identificados para evitar carregamentos errôneos. As análises laboratoriais são realizadas de maneira aleatória, visando o controle de qualidade dos produtos acabados. As análises serão feitas em laboratório pelo método Kjeldahl (bromatológico).",
  indicacoes_uso: "", especie_destino: "", modo_usar: "",
  conteudo_liquido: "", prazo_validade: "", condicoes_conservacao: "",
  restricoes: "", rt_nome: "", rt_crmv: "", local_data: "",
};

function formatNiveisForRTPI(niveisObj: Record<string, any>): string {
  const lines: string[] = [];
  const labels: Record<string, string> = {
    umidade: "Umidade", proteina_bruta: "Proteína Bruta", extrato_etereo: "Extrato Etéreo",
    fibra_bruta: "Fibra Bruta", fda: "Fibra em Detergente Ácido", materia_fibrosa: "Matéria Fibrosa",
    materia_mineral: "Matéria Mineral", ndt: "NDT", fluor: "Flúor",
    calcio: "Cálcio", fosforo: "Fósforo", sodio: "Sódio", magnesio: "Magnésio",
    enxofre: "Enxofre", potassio: "Potássio", cobalto: "Cobalto", cobre: "Cobre",
    iodo: "Iodo", manganes: "Manganês", selenio: "Selênio", zinco: "Zinco", ferro: "Ferro",
    vitamina_a: "Vitamina A", vitamina_d3: "Vitamina D3", vitamina_e: "Vitamina E",
    vitamina_k3: "Vitamina K", vitamina_b1: "Vitamina B1", vitamina_b2: "Vitamina B2",
    vitamina_b12: "Vitamina B12", niacina: "Niacina", acido_pantotenico: "Ácido Pantotênico",
    colina: "Colina", lisina: "Lisina", metionina: "Metionina",
    monensina_sodica: "Monensina Sódica", nnp_eq_proteina: "NNP Equiv. Proteína",
  };

  Object.entries(niveisObj).forEach(([key, val]) => {
    if (key.startsWith("_") || key === "consumo_pb" || key === "consumo_ndt") return;
    const label = labels[key] || key.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase());
    if (typeof val === "object" && val !== null) {
      const { min, max, unit } = val as { min?: string; max?: string; unit?: string };
      const u = unit || "";
      if (min) lines.push(`${label} (Mín.)${".".repeat(Math.max(2, 60 - label.length))} ${min} ${u}`);
      if (max) lines.push(`${label} (Máx.)${".".repeat(Math.max(2, 60 - label.length))} ${max} ${u}`);
    }
  });
  return lines.join("\n");
}

export default function RTPIEditor({ produtoId }: Props) {
  const { user } = useAuth();
  const [rtpi, setRtpi, clearRtpiDraft] = useSessionDraft<RTPIData>(`rtpi_${produtoId}`, { ...EMPTY_RTPI });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadData(); }, [produtoId]);

  async function loadData() {
    setLoading(true);
    const [{ data: prod }, { data: emp }] = await Promise.all([
      supabase.from("produtos").select("*").eq("id", produtoId).single(),
      supabase.from("empresas").select("*").limit(1).maybeSingle(),
    ]);

    if (prod) {
      const niveis = (prod.niveis_garantia as Record<string, any>) || {};
      const eventuais = niveis._eventuais_substitutos || "";
      const classificacaoMap: Record<string, string> = {
        racao: "Ração", suplemento: "Suplemento Mineral Proteico", premix: "Premix",
        nucleo: "Núcleo", aditivo: "Aditivo", sal_mineral: "Suplemento Mineral",
      };

      setRtpi(prev => ({
        ...prev,
        nome_produto: prod.nome || "",
        marca: prod.marca || "",
        classificacao: `${classificacaoMap[prod.classificacao] || prod.classificacao} para ${prod.especie_alvo || ""} ${prod.categoria_animal || ""}`.trim(),
        forma_fisica: prod.forma_fisica || "",
        embalagem: prod.embalagem || `Embalagens plásticas de ${prod.peso_liquido || ""} ${prod.unidade_peso || "kg"}`.trim(),
        composicao_qualitativa: prod.composicao || "",
        composicao_basica: prod.composicao || "",
        eventuais_substitutivos: eventuais,
        niveis_garantia: formatNiveisForRTPI(niveis),
        indicacoes_uso: prod.indicacoes || "",
        especie_destino: `${prod.especie_alvo || ""} - ${prod.categoria_animal || ""}`.trim(),
        modo_usar: prod.modo_uso || "",
        conteudo_liquido: `${prod.peso_liquido || ""} ${prod.unidade_peso || "kg"}`.trim(),
        prazo_validade: `${prod.validade_meses || 6 * 30} dias após a data de fabricação`,
        condicoes_conservacao: prod.armazenamento || "Conservar em local fresco e ventilado, ao abrigo da luz solar direta, livre de umidade e em estrados afastados da parede. Proteger do ataque de insetos e roedores.",
        restricoes: prod.precaucoes || "",
        registro_mapa: prod.registro_mapa || "SIF-",
        razao_social: emp?.nome || "",
        nome_fantasia: emp?.nome || "",
        endereco: emp?.endereco || "",
        cnpj: emp?.cnpj || "",
        rt_nome: emp?.responsavel_tecnico || "",
        rt_crmv: emp?.crmv || "",
        local_data: `${emp?.endereco?.split("–").pop()?.trim() || ""}, em ${new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}`,
      }));
    }
    setLoading(false);
  }

  const updateField = (field: keyof RTPIData, value: string) => {
    setRtpi(prev => ({ ...prev, [field]: value }));
  };

  function buildPrintHTML(): string {
    const e = (s: unknown) => String(s ?? "")
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const row = (num: string, title: string, content: string) =>
      `<tr><td style="border:1px solid #000;padding:6px 10px;font-weight:bold;width:100%;font-size:10pt;" colspan="2">
        <strong>${e(num)}) ${e(title)}</strong>
      </td></tr>
      <tr><td style="border:1px solid #000;padding:8px 14px;font-size:10pt;white-space:pre-wrap;" colspan="2">${e(content)}</td></tr>`;

    return `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>RTPI - ${e(rtpi.nome_produto)}</title>
<style>
  @page { margin: 20mm; size: A4; }
  body { font-family: Arial, sans-serif; font-size: 10pt; color: #000; margin: 0; }
  h1 { font-size: 14pt; text-align: center; margin: 0 0 16px; }
  table { width: 100%; border-collapse: collapse; }
</style></head><body>
<h1>RELATÓRIO TÉCNICO DE PRODUTO ISENTO DE REGISTRO - RTPI</h1>
<table>
  ${row("1", "Nome, endereço e CNPJ do estabelecimento proprietário do produto",
    `Razão Social: ${rtpi.razao_social}\nNome de Fantasia: ${rtpi.nome_fantasia}\nEndereço: ${rtpi.endereco}\nCNPJ: ${rtpi.cnpj}\nInsc. Est.: ${rtpi.inscricao_estadual}\nTelefone: ${rtpi.telefone}\nRegistro no MAPA: ${rtpi.registro_mapa}`)}
  ${row("2", "Designação do produto por nome e marca comercial",
    `PRODUTO: ${rtpi.nome_produto}\nMARCA: ${rtpi.marca}`)}
  ${row("3", "Classificação do produto", rtpi.classificacao)}
  ${row("4", "Forma física de apresentação", rtpi.forma_fisica)}
  ${row("5", "Característica da embalagem e forma de acondicionamento", rtpi.embalagem)}
  ${row("6", "Composição qualitativa", rtpi.composicao_qualitativa)}
  ${row("7", "Enriquecimento (IN 30/2009)", rtpi.enriquecimento || "N/A")}
  ${row("8", "Composição Básica", rtpi.composicao_basica)}
  ${row("9", "Eventuais substitutivos", rtpi.eventuais_substitutivos || "N/A")}
  ${row("10", "Níveis de garantia por quilograma do produto", rtpi.niveis_garantia)}
  ${row("11", "Descrição do controle do produto acabado", rtpi.controle_produto_acabado)}
  ${row("12", "Indicações de uso e espécie animal a que se destina",
    `CATEGORIA ANIMAL: ${rtpi.especie_destino}\n${rtpi.indicacoes_uso}`)}
  ${row("13", "Modo de usar", rtpi.modo_usar)}
  ${row("14", "Conteúdo líquido expresso no sistema métrico decimal", rtpi.conteudo_liquido)}
  ${row("15", "Prazo de validade", rtpi.prazo_validade)}
  ${row("16", "Condições de conservação", rtpi.condicoes_conservacao)}
  ${row("17", "Restrições e outras recomendações", rtpi.restricoes || "N/A")}
  ${row("18", "ANEXO - Croqui do rótulo aprovado e assinado pelo RT", "")}
</table>
<div style="margin-top:40px;text-align:center;font-size:10pt;">
  <p>${e(rtpi.local_data)}</p>
  <br/><br/>
  <p>_______________________________________</p>
  <p><strong>${e(rtpi.rt_nome)}</strong></p>
  <p>CRMV: ${e(rtpi.rt_crmv)}</p>
</div>
${CARIMBO_PLACEHOLDER}
</body></html>`;
  }

  /** Documento final com selo SHA-256 calculado sobre o conteúdo exibido. */
  async function buildDocumentoComSelo(): Promise<string> {
    const { html } = await inserirCarimbo(buildPrintHTML(), {
      documentoTipo: "RTPI — Relatório Técnico Produto Isento",
      documentoId: rtpi.nome_produto,
      empresa: rtpi.razao_social,
    });
    return html;
  }

  async function handlePrint() {
    const w = window.open("", "_blank");
    if (!w) return;
    const html = await buildDocumentoComSelo();
    w.document.write(html.replace("</body></html>", "<script>window.print();window.close();</script></body></html>"));
    w.document.close();
  }

  async function handleDownloadDoc() {
    const html = await buildDocumentoComSelo();
    const blob = new Blob([html], { type: "application/msword" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `RTPI_${rtpi.nome_produto.replace(/\s+/g, "_")}.doc`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("RTPI exportado!");
  }

  if (loading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" size="sm" onClick={loadData}>
          <RefreshCw className="w-4 h-4 mr-1" /> Sincronizar do Produto
        </Button>
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" /> Imprimir RTPI
        </Button>
        <Button variant="outline" size="sm" onClick={handleDownloadDoc}>
          <Download className="w-4 h-4 mr-1" /> Exportar DOC
        </Button>
      </div>

      {/* 1. Estabelecimento */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">1) Estabelecimento proprietário do produto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label className="text-xs">Razão Social</Label><Input value={rtpi.razao_social} onChange={e => updateField("razao_social", e.target.value)} /></div>
            <div><Label className="text-xs">Nome Fantasia</Label><Input value={rtpi.nome_fantasia} onChange={e => updateField("nome_fantasia", e.target.value)} /></div>
            <div className="md:col-span-2"><Label className="text-xs">Endereço</Label><Input value={rtpi.endereco} onChange={e => updateField("endereco", e.target.value)} /></div>
            <div><Label className="text-xs">CNPJ</Label><Input value={rtpi.cnpj} onChange={e => updateField("cnpj", e.target.value)} /></div>
            <div><Label className="text-xs">Inscrição Estadual</Label><Input value={rtpi.inscricao_estadual} onChange={e => updateField("inscricao_estadual", e.target.value)} /></div>
            <div><Label className="text-xs">Telefone</Label><Input value={rtpi.telefone} onChange={e => updateField("telefone", e.target.value)} /></div>
            <div><Label className="text-xs">Registro no MAPA</Label><Input value={rtpi.registro_mapa} onChange={e => updateField("registro_mapa", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* 2-5. Produto */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">2-5) Identificação do Produto</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label className="text-xs">2) Nome do Produto</Label><Input value={rtpi.nome_produto} onChange={e => updateField("nome_produto", e.target.value)} /></div>
            <div><Label className="text-xs">Marca</Label><Input value={rtpi.marca} onChange={e => updateField("marca", e.target.value)} /></div>
            <div><Label className="text-xs">3) Classificação</Label><Input value={rtpi.classificacao} onChange={e => updateField("classificacao", e.target.value)} /></div>
            <div><Label className="text-xs">4) Forma Física</Label><Input value={rtpi.forma_fisica} onChange={e => updateField("forma_fisica", e.target.value)} /></div>
            <div className="md:col-span-2"><Label className="text-xs">5) Embalagem</Label><Input value={rtpi.embalagem} onChange={e => updateField("embalagem", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      {/* 6-9. Composição */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">6-9) Composição</h3>
          <div><Label className="text-xs">6) Composição Qualitativa</Label><Textarea value={rtpi.composicao_qualitativa} onChange={e => updateField("composicao_qualitativa", e.target.value)} rows={3} /></div>
          <div><Label className="text-xs">7) Enriquecimento </Label><Textarea value={rtpi.enriquecimento} onChange={e => updateField("enriquecimento", e.target.value)} rows={2} placeholder="Campo exclusivo para produtos abrangidos pelo enriquecimento" /></div>
          <div><Label className="text-xs">8) Composição Básica</Label><Textarea value={rtpi.composicao_basica} onChange={e => updateField("composicao_basica", e.target.value)} rows={3} /></div>
          <div><Label className="text-xs">9) Eventuais Substitutivos</Label><Textarea value={rtpi.eventuais_substitutivos} onChange={e => updateField("eventuais_substitutivos", e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      {/* 10. Níveis de Garantia */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">10) Níveis de Garantia por kg do Produto</h3>
          <Textarea value={rtpi.niveis_garantia} onChange={e => updateField("niveis_garantia", e.target.value)} rows={10} className="font-mono text-xs" />
          <p className="text-[10px] text-muted-foreground">Formatado automaticamente a partir do cadastro. Edite manualmente se necessário.</p>
        </CardContent>
      </Card>

      {/* 11. Controle */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">11) Controle do Produto Acabado</h3>
          <Textarea value={rtpi.controle_produto_acabado} onChange={e => updateField("controle_produto_acabado", e.target.value)} rows={4} />
        </CardContent>
      </Card>

      {/* 12-13. Uso */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">12-13) Indicações e Modo de Uso</h3>
          <div><Label className="text-xs">Espécie / Categoria Animal</Label><Input value={rtpi.especie_destino} onChange={e => updateField("especie_destino", e.target.value)} /></div>
          <div><Label className="text-xs">12) Indicações de Uso</Label><Textarea value={rtpi.indicacoes_uso} onChange={e => updateField("indicacoes_uso", e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">13) Modo de Usar</Label><Textarea value={rtpi.modo_usar} onChange={e => updateField("modo_usar", e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      {/* 14-17. Final */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">14-17) Informações Finais</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label className="text-xs">14) Conteúdo Líquido</Label><Input value={rtpi.conteudo_liquido} onChange={e => updateField("conteudo_liquido", e.target.value)} /></div>
            <div><Label className="text-xs">15) Prazo de Validade</Label><Input value={rtpi.prazo_validade} onChange={e => updateField("prazo_validade", e.target.value)} /></div>
          </div>
          <div><Label className="text-xs">16) Condições de Conservação</Label><Textarea value={rtpi.condicoes_conservacao} onChange={e => updateField("condicoes_conservacao", e.target.value)} rows={2} /></div>
          <div><Label className="text-xs">17) Restrições e Recomendações</Label><Textarea value={rtpi.restricoes} onChange={e => updateField("restricoes", e.target.value)} rows={2} /></div>
        </CardContent>
      </Card>

      {/* 18. Assinatura */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-semibold text-foreground text-sm">18) Assinatura do Responsável Técnico</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div><Label className="text-xs">Nome do RT</Label><Input value={rtpi.rt_nome} onChange={e => updateField("rt_nome", e.target.value)} /></div>
            <div><Label className="text-xs">CRMV</Label><Input value={rtpi.rt_crmv} onChange={e => updateField("rt_crmv", e.target.value)} /></div>
            <div className="md:col-span-2"><Label className="text-xs">Local e Data</Label><Input value={rtpi.local_data} onChange={e => updateField("local_data", e.target.value)} /></div>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-2 flex-wrap">
        <Button variant="outline" onClick={handlePrint}>
          <Printer className="w-4 h-4 mr-1" /> Imprimir RTPI
        </Button>
        <Button variant="outline" onClick={handleDownloadDoc}>
          <Download className="w-4 h-4 mr-1" /> Exportar DOC
        </Button>
      </div>
    </div>
  );
}
