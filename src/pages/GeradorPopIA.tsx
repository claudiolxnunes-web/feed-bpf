import { useState } from "react";
import { Sparkles, Loader2, Download, FileText, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { POPS_CONFIG } from "@/config/popsConfig";
import { formatarPopDocx } from "@/utils/exportPop";

interface PopGerado {
  objetivo: string;
  campo_aplicacao: string;
  documentos_referencia: string[];
  definicoes: { termo: string; definicao: string }[];
  procedimentos: string[];
  monitoramento: { controle: string; frequencia: string; registro: string; responsavel: string };
  verificacao: { controle: string; frequencia: string; registro: string; responsavel: string };
  acoes_corretivas: { nao_conformidade: string; acao: string }[];
  tempo_retencao: string;
}

export default function GeradorPopIA() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [codigoPop, setCodigoPop] = useState("");
  const [nomePop, setNomePop] = useState("");
  const [especies, setEspecies] = useState("");
  const [capacidade, setCapacidade] = useState("");
  const [equipamentos, setEquipamentos] = useState("");
  const [observacoes, setObservacoes] = useState("");
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pop, setPop] = useState<PopGerado | null>(null);
  const [exportingDocx, setExportingDocx] = useState(false);

  const handleSelectPop = (codigo: string) => {
    setCodigoPop(codigo);
    const cfg = POPS_CONFIG.find(p => p.codigo === codigo);
    if (cfg) setNomePop(cfg.nome);
  };

  const handleGenerate = async () => {
    if (!codigoPop || !nomePop) {
      toast.error("Selecione o POP e informe o nome");
      return;
    }
    setLoading(true);
    setPop(null);
    try {
      const { data, error } = await supabase.functions.invoke("gerar-pop-ia", {
        body: { codigo_pop: codigoPop, nome_pop: nomePop, especies, capacidade, equipamentos, observacoes },
      });
      if (error) { toast.error("Erro: " + error.message); setLoading(false); return; }
      if (data?.error) { toast.error(data.error); setLoading(false); return; }
      if (data?.data) {
        setPop(data.data);
        toast.success("POP gerado pela IA! Revise e salve.");
      }
    } catch { toast.error("Erro ao conectar com IA"); }
    setLoading(false);
  };

  const handleSaveAsDocument = async () => {
    if (!pop || !user) return;
    setSaving(true);
    const { error } = await supabase.from("documentos").insert({
      user_id: user.id,
      empresa_id: empresaAtiva?.id || null,
      codigo: codigoPop,
      nome: nomePop,
      versao: "01-IA",
      data_revisao: new Date().toISOString().split("T")[0],
      status: "rascunho",
      responsavel: "Gerado por IA",
    });
    if (error) toast.error("Erro ao salvar: " + error.message);
    else toast.success("Rascunho de POP salvo em Docs Registrados!");
    setSaving(false);
  };

  const handleDownloadMarkdown = () => {
    if (!pop) return;
    const md = `# ${codigoPop} — ${nomePop}\n\n## 1. Objetivo\n${pop.objetivo}\n\n## 2. Campo de Aplicação\n${pop.campo_aplicacao}\n\n## 3. Documentos de Referência\n${pop.documentos_referencia.map(d => `- ${d}`).join("\n")}\n\n## 4. Definições\n${pop.definicoes.map(d => `- **${d.termo}:** ${d.definicao}`).join("\n")}\n\n## 5. Procedimentos\n${pop.procedimentos.map((p, i) => `${i + 1}. ${p}`).join("\n")}\n\n## 6. Monitoramento\n- **Controle:** ${pop.monitoramento.controle}\n- **Frequência:** ${pop.monitoramento.frequencia}\n- **Registro:** ${pop.monitoramento.registro}\n- **Responsável:** ${pop.monitoramento.responsavel}\n\n## 7. Verificação\n- **Controle:** ${pop.verificacao.controle}\n- **Frequência:** ${pop.verificacao.frequencia}\n- **Registro:** ${pop.verificacao.registro}\n- **Responsável:** ${pop.verificacao.responsavel}\n\n## 8. Ações Corretivas\n${pop.acoes_corretivas.map(a => `- **${a.nao_conformidade}:** ${a.acao}`).join("\n")}\n\n## 9. Tempo de Retenção\n${pop.tempo_retencao}\n\n---\n*Rascunho gerado por IA — revisar e validar antes de uso oficial*\n`;
    const blob = new Blob([md], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${codigoPop}-${nomePop.replace(/\s+/g, "_")}-rascunho.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadDocx = async () => {
    if (!pop) return;
    setExportingDocx(true);
    try {
      await formatarPopDocx(pop, codigoPop, nomePop);
    } catch (err: any) {
      console.error("Erro ao gerar .docx:", err);
      toast.error("Falha ao gerar o .docx: " + (err?.message || "erro desconhecido"));
    } finally {
      setExportingDocx(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Sparkles}
        title="Gerador de POPs por IA"
        description="Crie rascunhos completos de POPs personalizados para sua fábrica usando IA especializada em BPF"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuração do POP</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>POP Padrão (IN 04/2007) *</Label>
              <Select value={codigoPop} onValueChange={handleSelectPop}>
                <SelectTrigger><SelectValue placeholder="Selecione um POP..." /></SelectTrigger>
                <SelectContent>
                  {POPS_CONFIG.map(p => (
                    <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} — {p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Nome / Título do POP *</Label>
              <Input value={nomePop} onChange={e => setNomePop(e.target.value)} placeholder="Ex: Higienização de Equipamentos" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label>Espécies-alvo</Label>
              <Input value={especies} onChange={e => setEspecies(e.target.value)} placeholder="Aves, suínos, bovinos..." />
            </div>
            <div className="space-y-1">
              <Label>Capacidade da fábrica</Label>
              <Input value={capacidade} onChange={e => setCapacidade(e.target.value)} placeholder="Ex: 100 t/dia" />
            </div>
            <div className="space-y-1">
              <Label>Equipamentos principais</Label>
              <Input value={equipamentos} onChange={e => setEquipamentos(e.target.value)} placeholder="Misturador, peletizadora..." />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Observações específicas (opcional)</Label>
            <Textarea
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Particularidades da fábrica, riscos específicos, requisitos extras..."
              rows={3}
            />
          </div>

          <Button onClick={handleGenerate} disabled={loading || !codigoPop || !nomePop} className="w-full">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Sparkles className="w-4 h-4 mr-2" />}
            {loading ? "Gerando POP completo com IA..." : "⚡ Gerar Rascunho de POP com IA"}
          </Button>
        </CardContent>
      </Card>

      {pop && (
        <Card className="border-primary/30">
          <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-2">
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                {codigoPop} — {nomePop}
                <Badge variant="secondary">Rascunho IA</Badge>
              </CardTitle>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleDownloadMarkdown}>
                <Download className="w-4 h-4 mr-1" /> Baixar .md
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadDocx} disabled={exportingDocx}>
                {exportingDocx ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
                Baixar .docx
              </Button>
              <Button size="sm" onClick={handleSaveAsDocument} disabled={saving}>
                {saving ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />}
                Salvar como Documento
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5 text-sm">
            <Section title="1. Objetivo">{pop.objetivo}</Section>
            <Section title="2. Campo de Aplicação">{pop.campo_aplicacao}</Section>

            <div>
              <h4 className="font-semibold mb-2">3. Documentos de Referência</h4>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                {pop.documentos_referencia.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">4. Definições</h4>
              <div className="space-y-1">
                {pop.definicoes.map((d, i) => (
                  <div key={i}><strong>{d.termo}:</strong> <span className="text-muted-foreground">{d.definicao}</span></div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">5. Procedimentos</h4>
              <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                {pop.procedimentos.map((p, i) => <li key={i}>{p}</li>)}
              </ol>
            </div>

            <div>
              <h4 className="font-semibold mb-2">6. Monitoramento</h4>
              <Table>
                <TableBody>
                  <TableRow><TableCell className="font-medium w-32">Controle</TableCell><TableCell>{pop.monitoramento.controle}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Frequência</TableCell><TableCell>{pop.monitoramento.frequencia}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Registro</TableCell><TableCell>{pop.monitoramento.registro}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Responsável</TableCell><TableCell>{pop.monitoramento.responsavel}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold mb-2">7. Verificação</h4>
              <Table>
                <TableBody>
                  <TableRow><TableCell className="font-medium w-32">Controle</TableCell><TableCell>{pop.verificacao.controle}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Frequência</TableCell><TableCell>{pop.verificacao.frequencia}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Registro</TableCell><TableCell>{pop.verificacao.registro}</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium">Responsável</TableCell><TableCell>{pop.verificacao.responsavel}</TableCell></TableRow>
                </TableBody>
              </Table>
            </div>

            <div>
              <h4 className="font-semibold mb-2">8. Ações Corretivas</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[40%]">Não Conformidade</TableHead>
                    <TableHead>Ação Corretiva</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {pop.acoes_corretivas.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell>{a.nao_conformidade}</TableCell>
                      <TableCell className="text-muted-foreground">{a.acao}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="bg-muted/50 rounded-lg p-3">
              <strong>Tempo de retenção:</strong> <span className="text-muted-foreground">{pop.tempo_retencao}</span>
            </div>

            <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 text-xs">
              ⚠️ <strong>Atenção:</strong> Este é um rascunho gerado por IA. Revise tecnicamente, ajuste para a realidade da sua fábrica e valide com o RT antes de uso oficial.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="font-semibold mb-1">{title}</h4>
      <p className="text-muted-foreground">{children}</p>
    </div>
  );
}
