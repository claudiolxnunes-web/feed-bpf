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
import { ReceitasMedicadosSection } from "@/components/medicados/MedicadosSections";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileWarning, ShieldAlert } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const TIPOS_SUBSTANCIA = [
  { value: "proibida", label: "Proibida" },
  { value: "indesejavel", label: "Indesejável" },
  { value: "restrita", label: "Restrita" },
];

const SUBSTANCIAS_COMUNS = [
  "Ractopamina (Cloridrato)",
  "Aflatoxinas (B1+B2+G1+G2)",
  "Aflatoxina B1",
  "Fumonisinas (B1+B2)",
  "Zearalenona",
  "Ocratoxina A",
  "Deoxinivalenol (DON)",
  "Cloranfenicol",
  "Nitrofuranos",
  "Melengesterol",
  "Proteínas de ruminante em ração de ruminantes",
  "Salmonella spp.",
  "Dioxinas e PCBs",
  "Chumbo (Pb)",
  "Arsênio (As)",
  "Mercúrio (Hg)",
  "Cádmio (Cd)",
  "Flúor (F)",
  "Carbadox",
  "Olaquindox",
  "Furazolidona",
  "Dietilestilbestrol (DES)",
];

export default function ControleSubstancias() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    materia_prima: "",
    fornecedor: "",
    lote: "",
    substancia: "",
    tipo: "proibida",
    limite_maximo: "",
    resultado: "",
    unidade: "",
    conforme: true,
    metodo_analise: "",
    data_analise: new Date().toISOString().split("T")[0],
    referencia_normativa: "IN 15/2009",
    observacoes: "",
  });

  const { data: registros = [] } = useQuery({
    queryKey: ["controle_substancias"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("controle_substancias")
        .select("*")
        .order("data_analise", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const add = useMutation({
    mutationFn: async () => {
      const status = form.conforme ? "conforme" : "nao_conforme";
      const { error } = await supabase
        .from("controle_substancias")
        .insert({ ...form, status, user_id: user!.id, empresa_id: empresaAtiva?.id || null });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controle_substancias"] });
      toast.success("Registro salvo");
      setOpen(false);
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const navigate = useNavigate();

  const ncCount = registros.filter((r: any) => !r.conforme).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Substâncias Proibidas e Indesejáveis"
        description="Monitoramento de substâncias e Programa Ractopamina Free"
        assuntoBaseLegal="substancias_proibidas"
        orientacaoModuloId="substancias"
      />

      {/* ── CERTIFICAÇÃO RACTOPAMINA FREE ── */}
      <Card className="border-green-600/30 bg-green-50 dark:bg-green-900/10">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-green-700 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-sm text-green-800 dark:text-green-300">
                🛡️ Programa Ractopamina Free — Exportação
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                A Ractopamina é <strong>proibida</strong> em diversos mercados (UE, Rússia, China). Para atender
                exigências de exportação, todos os lotes devem ser monitorados com análise laboratorial (HPLC/LC-MS/MS)
                e resultado <strong>ND (não detectado)</strong>.
              </p>
              {(() => {
                const ractRecords = registros.filter((r: any) => r.substancia?.toLowerCase().includes("ractopamina"));
                const ractConformes = ractRecords.filter((r: any) => r.conforme);
                const ractNC = ractRecords.filter((r: any) => !r.conforme);
                const ultimaAnalise = ractRecords.length > 0 ? ractRecords[0].data_analise : null;
                return (
                  <div className="grid grid-cols-4 gap-3 mt-3">
                    <div className="text-center p-2 rounded bg-background border">
                      <p className="text-lg font-bold">{ractRecords.length}</p>
                      <p className="text-[10px] text-muted-foreground">Análises Ractopamina</p>
                    </div>
                    <div className="text-center p-2 rounded bg-green-100 dark:bg-green-900/20 border border-green-300">
                      <p className="text-lg font-bold text-green-700">{ractConformes.length}</p>
                      <p className="text-[10px] text-muted-foreground">ND (Conformes)</p>
                    </div>
                    <div className="text-center p-2 rounded bg-background border border-destructive/20">
                      <p
                        className={`text-lg font-bold ${ractNC.length > 0 ? "text-destructive" : "text-muted-foreground"}`}
                      >
                        {ractNC.length}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Detectadas (NC)</p>
                    </div>
                    <div className="text-center p-2 rounded bg-background border">
                      <p className="text-xs font-mono font-bold">{ultimaAnalise || "—"}</p>
                      <p className="text-[10px] text-muted-foreground">Última análise</p>
                    </div>
                  </div>
                );
              })()}
              <p className="text-[10px] text-muted-foreground mt-2">
                📋 (MAPA) — Plano Nacional de Controle de Resíduos e Contaminantes (PNCRC). Limite:{" "}
                <strong>ND (Não Detectado)</strong> | Método: HPLC ou LC-MS/MS.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-primary">{registros.length}</p>
            <p className="text-sm text-muted-foreground">Total Análises</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-green-600">{registros.length - ncCount}</p>
            <p className="text-sm text-muted-foreground">Conformes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-3xl font-bold text-destructive">{ncCount}</p>
            <p className="text-sm text-muted-foreground">Não Conformes</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Nova Análise
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Análise de Substância</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Matéria-Prima *</Label>
                  <Input
                    value={form.materia_prima}
                    onChange={(e) => setForm((p) => ({ ...p, materia_prima: e.target.value }))}
                    placeholder="Ex: Milho grão"
                  />
                </div>
                <div>
                  <Label>Fornecedor</Label>
                  <Input
                    value={form.fornecedor}
                    onChange={(e) => setForm((p) => ({ ...p, fornecedor: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Lote</Label>
                  <Input value={form.lote} onChange={(e) => setForm((p) => ({ ...p, lote: e.target.value }))} />
                </div>
                <div>
                  <Label>Data Análise</Label>
                  <Input
                    type="date"
                    value={form.data_analise}
                    onChange={(e) => setForm((p) => ({ ...p, data_analise: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Substância *</Label>
                <Select value={form.substancia} onValueChange={(v) => setForm((p) => ({ ...p, substancia: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBSTANCIAS_COMUNS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo</Label>
                  <Select value={form.tipo} onValueChange={(v) => setForm((p) => ({ ...p, tipo: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIPOS_SUBSTANCIA.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Método</Label>
                  <Input
                    value={form.metodo_analise}
                    onChange={(e) => setForm((p) => ({ ...p, metodo_analise: e.target.value }))}
                    placeholder="HPLC, ELISA..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Limite Máximo</Label>
                  <Input
                    value={form.limite_maximo}
                    onChange={(e) => setForm((p) => ({ ...p, limite_maximo: e.target.value }))}
                    placeholder="20"
                  />
                </div>
                <div>
                  <Label>Resultado</Label>
                  <Input
                    value={form.resultado}
                    onChange={(e) => setForm((p) => ({ ...p, resultado: e.target.value }))}
                    placeholder="< 5"
                  />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Input
                    value={form.unidade}
                    onChange={(e) => setForm((p) => ({ ...p, unidade: e.target.value }))}
                    placeholder="µg/kg"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.conforme}
                  onChange={(e) => setForm((p) => ({ ...p, conforme: e.target.checked }))}
                  className="h-4 w-4"
                />
                <Label>Conforme</Label>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                />
              </div>
              <Button onClick={() => add.mutate()} disabled={!form.materia_prima || !form.substancia}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {registros.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            <ShieldAlert className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>Nenhuma análise registrada</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data</TableHead>
                <TableHead>MP</TableHead>
                <TableHead>Substância</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Limite</TableHead>
                <TableHead>Resultado</TableHead>
                <TableHead>Conforme</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {registros.map((r: any) => (
                <TableRow key={r.id}>
                  <TableCell>{r.data_analise}</TableCell>
                  <TableCell className="font-medium">{r.materia_prima}</TableCell>
                  <TableCell>{r.substancia}</TableCell>
                  <TableCell>
                    <Badge variant={r.tipo === "proibida" ? "destructive" : "outline"}>
                      {TIPOS_SUBSTANCIA.find((t) => t.value === r.tipo)?.label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {r.limite_maximo} {r.unidade}
                  </TableCell>
                  <TableCell>
                    {r.resultado} {r.unidade}
                  </TableCell>
                  <TableCell>
                    {r.conforme ? (
                      <Badge className="bg-green-600">Conforme</Badge>
                    ) : (
                      <Badge variant="destructive">NC</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 text-xs"
                      title="Registros não são excluídos — correção via Não Conformidade"
                      onClick={() =>
                        corrigirViaNC(navigate, {
                          tabela: "controle_substancias",
                          registroId: r.id,
                          descricao: `Substância: ${r.substancia} — resultado ${r.resultado} ${r.unidade}`,
                        })
                      }
                    >
                      <FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <div className="mt-6">
        <ReceitasMedicadosSection />
      </div>
    </div>
  );
}
