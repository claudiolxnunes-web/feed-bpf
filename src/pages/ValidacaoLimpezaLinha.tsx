import { TIPOS_VALIDACAO } from "@/components/higiene/constants";
import { citar798, REGRAS_CARRY_OVER, avaliarValidacaoCarryOver, REPETICOES_EXIGIDAS } from "@/config/carryOver798";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { corrigirViaNC } from "@/utils/correcaoNC";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileWarning, ShieldCheck, AlertTriangle } from "lucide-react";
import PageHeader from "@/components/PageHeader";



export default function ValidacaoLimpezaLinha() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    linha_producao: "", produto_anterior: "", produto_seguinte: "",
    contem_medicamento: false, tipo_validacao: "visual", resultado: "aprovado",
    residuo_detectado: "", limite_aceitavel: "", metodo_analise: "",
    responsavel: "", data_validacao: new Date().toISOString().split("T")[0],
    hora_validacao: "", observacoes: "", repeticao: "1"
  });

  const { data: validacoes = [] } = useQuery({
    queryKey: ["validacao_limpeza_linha"],
    queryFn: async () => {
      const { data, error } = await supabase.from("validacao_limpeza_linha").select("*").order("data_validacao", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const { repeticao, ...resto } = form;
      const { error } = await supabase.from("validacao_limpeza_linha").insert({
        ...resto,
        repeticao: resto.tipo_validacao === "carryover" ? Number(repeticao) : null,
        user_id: user!.id,
        empresa_id: empresaAtiva?.id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["validacao_limpeza_linha"] });
      toast.success("Validação registrada");
      setOpen(false);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const navigate = useNavigate();

  /** Situação da validação por sequência (linha + produto anterior → seguinte), só testes de carry-over. */
  const chaveSeq = (v: any) => `${v.linha_producao}|${v.produto_anterior}|${v.produto_seguinte}`;
  const statusPorSequencia = new Map<string, ReturnType<typeof avaliarValidacaoCarryOver>>();
  const grupos = new Map<string, { repeticao: number; conforme: boolean }[]>();
  validacoes.forEach((v: any) => {
    if (v.tipo_validacao !== "carryover" || !v.repeticao) return;
    const k = chaveSeq(v);
    grupos.set(k, [...(grupos.get(k) ?? []), { repeticao: v.repeticao, conforme: v.resultado === "aprovado" }]);
  });
  grupos.forEach((reps, k) => statusPorSequencia.set(k, avaliarValidacaoCarryOver(reps)));

  const reprovados = validacoes.filter((v: any) => v.resultado === "reprovado").length;
  const comMed = validacoes.filter((v: any) => v.contem_medicamento).length;

  return (
    <div className="space-y-6">
      <PageHeader title="Validação de Limpeza de Linha" description="Controle de contaminação cruzada"
        orientacaoModuloId="validacao-limpeza"  assuntoBaseLegal="bpf_geral" />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-primary">{validacoes.length}</p><p className="text-sm text-muted-foreground">Total</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-green-600">{validacoes.length - reprovados}</p><p className="text-sm text-muted-foreground">Aprovados</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-destructive">{reprovados}</p><p className="text-sm text-muted-foreground">Reprovados</p></CardContent></Card>
        <Card><CardContent className="pt-6 text-center"><p className="text-3xl font-bold text-yellow-600">{comMed}</p><p className="text-sm text-muted-foreground">c/ Medicamento</p></CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button><Plus className="w-4 h-4 mr-2" />Nova Validação</Button></DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registrar Validação de Limpeza</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Linha de Produção *</Label><Input value={form.linha_producao} onChange={e => setForm(p => ({ ...p, linha_producao: e.target.value }))} placeholder="Ex: Linha 01 — Misturador" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Produto Anterior *</Label><Input value={form.produto_anterior} onChange={e => setForm(p => ({ ...p, produto_anterior: e.target.value }))} placeholder="Produzido antes" /></div>
                <div><Label>Produto Seguinte *</Label><Input value={form.produto_seguinte} onChange={e => setForm(p => ({ ...p, produto_seguinte: e.target.value }))} placeholder="A produzir" /></div>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20">
                <input type="checkbox" checked={form.contem_medicamento} onChange={e => setForm(p => ({ ...p, contem_medicamento: e.target.checked }))} className="h-4 w-4" />
                <Label className="flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-yellow-600" />Produto anterior contém medicamento</Label>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo Validação</Label>
                  <Select value={form.tipo_validacao} onValueChange={v => setForm(p => ({ ...p, tipo_validacao: v, limite_aceitavel: v === "carryover" && !p.limite_aceitavel ? "≤ 2,5% do princípio ativo" : p.limite_aceitavel }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS_VALIDACAO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Resultado</Label>
                  <Select value={form.resultado} onValueChange={v => setForm(p => ({ ...p, resultado: v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aprovado">Aprovado</SelectItem>
                      <SelectItem value="reprovado">Reprovado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Resíduo Detectado</Label><Input value={form.residuo_detectado} onChange={e => setForm(p => ({ ...p, residuo_detectado: e.target.value }))} placeholder="Ex: Monensina" /></div>
                <div><Label>Limite Aceitável</Label><Input value={form.limite_aceitavel} onChange={e => setForm(p => ({ ...p, limite_aceitavel: e.target.value }))} placeholder="Ex: < 1 ppm" /></div>
              </div>
              <div><Label>Método de Análise</Label><Input value={form.metodo_analise} onChange={e => setForm(p => ({ ...p, metodo_analise: e.target.value }))} placeholder="Ex: HPLC, ELISA, CV% < 10%" /></div>
              {(form.tipo_validacao === "tempo_mistura" || form.tipo_validacao === "homogeneidade") && (
                <div className="p-3 rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-900/20">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2">📐 Validação de Mistura</p>
                  <p className="text-xs text-muted-foreground">Registre o CV% (Coeficiente de Variação) do teste de homogeneidade. O limite aceitável é CV até 10% no método de concentração ({citar798("art. 26")}). Informe o tempo de mistura validado no campo "Observações".</p>
                </div>
              )}
              {form.tipo_validacao === "carryover" && (
                <div className="p-3 rounded-lg border border-orange-400 bg-orange-50 dark:bg-orange-900/20 space-y-2">
                  <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 mb-1">🔬 Teste de Carry-Over (Arraste) — {citar798("art. 29")}</p>
                  <ul className="text-[10px] text-muted-foreground space-y-0.5">
                    {REGRAS_CARRY_OVER.slice(0, 3).map(r => <li key={r.titulo}>• {r.texto} ({r.citacao})</li>)}
                  </ul>
                  <div>
                    <Label>Repetição da sequência-piloto *</Label>
                    <Select value={form.repeticao} onValueChange={v => setForm(p => ({ ...p, repeticao: v }))}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3].map(n => <SelectItem key={n} value={String(n)}>{n} de {REPETICOES_EXIGIDAS}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Data</Label><Input type="date" value={form.data_validacao} onChange={e => setForm(p => ({ ...p, data_validacao: e.target.value }))} /></div>
                <div><Label>Hora</Label><Input value={form.hora_validacao} onChange={e => setForm(p => ({ ...p, hora_validacao: e.target.value }))} placeholder="14:30" /></div>
              </div>
              <div><Label>Responsável</Label><Input value={form.responsavel} onChange={e => setForm(p => ({ ...p, responsavel: e.target.value }))} /></div>
              <div><Label>Observações</Label><Textarea value={form.observacoes} onChange={e => setForm(p => ({ ...p, observacoes: e.target.value }))} placeholder={form.tipo_validacao === "tempo_mistura" ? "Informe o tempo de mistura validado (ex: 4 min para lote de 2 ton)" : ""} /></div>
              <Button onClick={() => add.mutate()} disabled={!form.linha_producao || !form.produto_anterior || !form.produto_seguinte}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {validacoes.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground"><ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-40" /><p>Nenhuma validação registrada</p></CardContent></Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>Linha</TableHead>
                <TableHead>Prod. Anterior</TableHead>
                <TableHead>Prod. Seguinte</TableHead>
                <TableHead>Med.</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Rep.</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Validação</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {validacoes.map((v: any) => (
                <TableRow key={v.id}>
                  <TableCell>{v.data_validacao}</TableCell>
                  <TableCell className="font-medium">{v.linha_producao}</TableCell>
                  <TableCell>{v.produto_anterior}</TableCell>
                  <TableCell>{v.produto_seguinte}</TableCell>
                  <TableCell>{v.contem_medicamento ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> : "—"}</TableCell>
                  <TableCell>{TIPOS_VALIDACAO.find(t => t.value === v.tipo_validacao)?.label}</TableCell>
                  <TableCell>{v.repeticao ?? "—"}</TableCell>
                  <TableCell>{v.resultado === "aprovado" ? <Badge className="bg-green-600">Aprovado</Badge> : <Badge variant="destructive">Reprovado</Badge>}</TableCell>
                  <TableCell>{(() => {
                    const st = v.tipo_validacao === "carryover" && v.repeticao ? statusPorSequencia.get(chaveSeq(v)) : undefined;
                    if (!st) return "—";
                    if (st === "aprovada") return <Badge className="bg-primary/20 text-primary" title={citar798("art. 29, §1º")}>Aprovada (3/3)</Badge>;
                    if (st === "reprovada") return <Badge variant="destructive">Reprovada</Badge>;
                    return <Badge variant="outline" title="Exige 3 repetições conformes">Em andamento</Badge>;
                  })()}</TableCell>
                  <TableCell><Button variant="ghost" size="sm" className="gap-1 text-xs" title="Registros não são excluídos — correção via Não Conformidade" onClick={() => corrigirViaNC(navigate, { tabela: "validacao_limpeza_linha", registroId: v.id, descricao: `Linha: ${v.linha_producao} — ${v.produto_anterior} → ${v.produto_seguinte} — resultado: ${v.resultado}` })}><FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC</Button></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
