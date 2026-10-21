import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { TIPOS_RESIDUO, TRATAMENTO_EFLUENTE, CLASSIFICACOES, MOTIVOS_DESCARTE } from "@/components/residuos/constants";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, FileWarning, Recycle, ShieldAlert, Droplets, PackageX, AlertTriangle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import PageHeader from "@/components/PageHeader";
import { AnexarPlanilhaPop } from "@/components/documentos/AnexarPlanilhaPop";

export default function ControleResiduos() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    tipo_residuo: "",
    classificacao: "classe_II_A",
    origem: "",
    destino_final: "",
    empresa_coletora: "",
    licenca_ambiental: "",
    frequencia_coleta: "semanal",
    quantidade: "",
    unidade: "kg",
    data_coleta: new Date().toISOString().split("T")[0],
    responsavel: "",
    manifesto_numero: "",
    observacoes: "",
    motivo_descarte: "",
    lote_produto: "",
    produto_nome: "",
  });

  const isEfluente = ["Efluente líquido", "Efluente industrial", "Água de lavagem"].includes(form.tipo_residuo);

  const { data: residuos = [] } = useQuery({
    queryKey: ["controle_residuos", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("controle_residuos")
        .select("*")
        .eq("empresa_id", empresaAtiva.id)
        .order("data_coleta", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!empresaAtiva?.id,
  });

  const add = useMutation({
    mutationFn: async () => {
      if (!user || !empresaAtiva?.id) throw new Error("Selecione uma empresa antes de registrar resíduos.");
      const { error } = await supabase
        .from("controle_residuos")
        .insert({ ...form, user_id: user.id, empresa_id: empresaAtiva.id });
      if (error) throw error;

      // Auto-register in execucao_pops for discarded products (IN 15/2009)
      const isProdutoDescartado = ["Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção"].includes(
        form.tipo_residuo,
      );
      if (isProdutoDescartado && form.produto_nome) {
        const motivo =
          MOTIVOS_DESCARTE.find((m) => m.value === form.motivo_descarte)?.label ||
          form.motivo_descarte ||
          "Não informado";
        const obs = [
          `[REGISTRO DE DESCARTE — POP-08 / IN 15/2009]`,
          `Tipo: ${form.tipo_residuo}`,
          `Produto: ${form.produto_nome} | Lote: ${form.lote_produto || "—"}`,
          `Motivo: ${motivo}`,
          `Destino: ${form.destino_final || "—"}`,
          `Qtd: ${form.quantidade || "—"} ${form.unidade}`,
          `Empresa coletora: ${form.empresa_coletora || "—"}`,
          form.manifesto_numero ? `Manifesto: ${form.manifesto_numero}` : "",
          form.observacoes ? `Obs: ${form.observacoes}` : "",
        ]
          .filter(Boolean)
          .join("\n");

        await supabase.from("execucao_pops").insert({
          user_id: user.id,
          empresa_id: empresaAtiva.id,
          codigo_pop: "POP-08-DESCARTE",
          nome_pop: "Registro de Descarte de Produto",
          executor: form.responsavel || "—",
          setor: form.origem || "Produção",
          status: "concluido",
          observacoes: obs,
          data_execucao: form.data_coleta,
        });
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["controle_residuos"] });
      toast.success("Registro de resíduo salvo");
      setOpen(false);
      setForm({
        tipo_residuo: "",
        classificacao: "classe_II_A",
        origem: "",
        destino_final: "",
        empresa_coletora: "",
        licenca_ambiental: "",
        frequencia_coleta: "semanal",
        quantidade: "",
        unidade: "kg",
        data_coleta: new Date().toISOString().split("T")[0],
        responsavel: "",
        manifesto_numero: "",
        observacoes: "",
        motivo_descarte: "",
        lote_produto: "",
        produto_nome: "",
      });
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const navigate = useNavigate();

  const totalResiduos = residuos.length;
  const comManifesto = residuos.filter((r: any) => r.manifesto_numero).length;
  const efluentes = residuos.filter((r: any) =>
    ["Efluente líquido", "Efluente industrial", "Água de lavagem"].includes(r.tipo_residuo),
  );
  const comLicenca = residuos.filter((r: any) => r.licenca_ambiental).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="POP 08 - Controle de Resíduos e Efluentes"
        description="Procedimentos de coleta, segregação e destinação de resíduos sólidos e efluentes"
        orientacaoModuloId="residuos"
        assuntoBaseLegal="autocontrole"
      />
      <div className="flex justify-end mb-3">
        <AnexarPlanilhaPop popCodigo="POP-08" popNome="Controle de Resíduos e Efluentes" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display">{totalResiduos}</p>
            <p className="text-xs text-muted-foreground">Registros totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-primary">{comManifesto}</p>
            <p className="text-xs text-muted-foreground">Com manifesto</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-blue-600">{efluentes.length}</p>
            <p className="text-xs text-muted-foreground">Efluentes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-accent">{comLicenca}</p>
            <p className="text-xs text-muted-foreground">Com licença ambiental</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-4">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-6 h-6 text-primary mt-0.5" />
            <div>
              <h4 className="font-display font-semibold text-sm">
                POP 08 — Controle de Resíduos e Efluentes <BaseLegalBadge assunto="bpf_geral" />
              </h4>
              <p className="text-xs text-muted-foreground mt-1">
                Abrange: separação e identificação de resíduos por classe (ABNT), rastreamento de produtos descartados,
                controle de efluentes (pH, DBO, DQO), manifestos de transporte e licenças ambientais.
              </p>
              <div className="flex flex-wrap gap-2 mt-2"></div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Novo Registro
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registrar Resíduo / Efluente</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Tipo de Resíduo *</Label>
                <Select value={form.tipo_residuo} onValueChange={(v) => setForm((p) => ({ ...p, tipo_residuo: v }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_RESIDUO.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Classificação ABNT</Label>
                <Select value={form.classificacao} onValueChange={(v) => setForm((p) => ({ ...p, classificacao: v }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASSIFICACOES.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {["Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção"].includes(form.tipo_residuo) && (
                <div className="p-3 rounded-lg border border-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 space-y-3">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                    ⚠️ Controle de Produto Descartado (POP 08)
                  </p>
                  <div>
                    <Label>Motivo do Descarte</Label>
                    <Select
                      value={form.motivo_descarte}
                      onValueChange={(v) => setForm((p) => ({ ...p, motivo_descarte: v }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {MOTIVOS_DESCARTE.map((m) => (
                          <SelectItem key={m.value} value={m.value}>
                            {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Produto</Label>
                      <Input
                        value={form.produto_nome}
                        onChange={(e) => setForm((p) => ({ ...p, produto_nome: e.target.value }))}
                        placeholder="Ex: Ração Bovino 20kg"
                      />
                    </div>
                    <div>
                      <Label>Lote do Produto</Label>
                      <Input
                        value={form.lote_produto}
                        onChange={(e) => setForm((p) => ({ ...p, lote_produto: e.target.value }))}
                        placeholder="Ex: RBE-0320-01"
                      />
                    </div>
                  </div>
                </div>
              )}
              {isEfluente && (
                <div className="p-3 rounded-lg border border-blue-400 bg-blue-50 dark:bg-blue-900/20 space-y-3">
                  <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">💧 Controle de Efluentes </p>
                  <div>
                    <Label>Tipo de Tratamento</Label>
                    <Select
                      value={form.observacoes.includes("[TRATAMENTO:") ? "" : ""}
                      onValueChange={(v) =>
                        setForm((p) => ({
                          ...p,
                          observacoes: `[TRATAMENTO: ${TRATAMENTO_EFLUENTE.find((t) => t.value === v)?.label || v}] ${p.observacoes.replace(/\[TRATAMENTO:.*?\]\s?/, "")}`,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tratamento" />
                      </SelectTrigger>
                      <SelectContent>
                        {TRATAMENTO_EFLUENTE.map((t) => (
                          <SelectItem key={t.value} value={t.value}>
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Registre pH, DBO e demais parâmetros nas observações. Laudos devem ser arquivados no módulo
                    Relatórios.
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Origem / Setor</Label>
                  <Input value={form.origem} onChange={(e) => setForm((p) => ({ ...p, origem: e.target.value }))} />
                </div>
                <div>
                  <Label>Destino Final</Label>
                  <Input
                    value={form.destino_final}
                    onChange={(e) => setForm((p) => ({ ...p, destino_final: e.target.value }))}
                    placeholder="Aterro, reciclagem, incineração..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Empresa Coletora</Label>
                  <Input
                    value={form.empresa_coletora}
                    onChange={(e) => setForm((p) => ({ ...p, empresa_coletora: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Licença Ambiental</Label>
                  <Input
                    value={form.licenca_ambiental}
                    onChange={(e) => setForm((p) => ({ ...p, licenca_ambiental: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Quantidade</Label>
                  <Input
                    value={form.quantidade}
                    onChange={(e) => setForm((p) => ({ ...p, quantidade: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Unidade</Label>
                  <Select value={form.unidade} onValueChange={(v) => setForm((p) => ({ ...p, unidade: v }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="kg">kg</SelectItem>
                      <SelectItem value="litros">Litros</SelectItem>
                      <SelectItem value="ton">Toneladas</SelectItem>
                      <SelectItem value="m3">m³</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Data Coleta</Label>
                  <Input
                    type="date"
                    value={form.data_coleta}
                    onChange={(e) => setForm((p) => ({ ...p, data_coleta: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Responsável</Label>
                  <Input
                    value={form.responsavel}
                    onChange={(e) => setForm((p) => ({ ...p, responsavel: e.target.value }))}
                  />
                </div>
                <div>
                  <Label>Nº Manifesto</Label>
                  <Input
                    value={form.manifesto_numero}
                    onChange={(e) => setForm((p) => ({ ...p, manifesto_numero: e.target.value }))}
                  />
                </div>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea
                  value={form.observacoes}
                  onChange={(e) => setForm((p) => ({ ...p, observacoes: e.target.value }))}
                  placeholder={isEfluente ? "Ex: pH=7.2, DBO=45mg/L, DQO=90mg/L..." : ""}
                />
              </div>
              <Button onClick={() => add.mutate()} disabled={!form.tipo_residuo}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="registros" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="registros">
            <Recycle className="w-4 h-4 mr-1" />
            Registros
          </TabsTrigger>
          <TabsTrigger value="descartes">
            <PackageX className="w-4 h-4 mr-1" />
            Descartes Produto
          </TabsTrigger>
          <TabsTrigger value="efluentes">
            <Droplets className="w-4 h-4 mr-1" />
            Efluentes ({efluentes.length})
          </TabsTrigger>
          <TabsTrigger value="pgrs">📋 PGRS</TabsTrigger>
        </TabsList>

        <TabsContent value="registros" className="space-y-4">
          {residuos.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Recycle className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum registro de resíduo</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Classificação</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Destino</TableHead>
                    <TableHead>Empresa Coletora</TableHead>
                    <TableHead>Manifesto</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {residuos.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.data_coleta}</TableCell>
                      <TableCell className="font-medium">{r.tipo_residuo}</TableCell>
                      <TableCell>
                        <Badge variant={r.classificacao === "classe_I" ? "destructive" : "outline"}>
                          {CLASSIFICACOES.find((c) => c.value === r.classificacao)?.label || r.classificacao}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.quantidade} {r.unidade}
                      </TableCell>
                      <TableCell>{r.destino_final}</TableCell>
                      <TableCell>{r.empresa_coletora}</TableCell>
                      <TableCell>{r.manifesto_numero}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="gap-1 text-xs"
                          title="Registros não são excluídos — correção via Não Conformidade"
                          onClick={() =>
                            corrigirViaNC(navigate, {
                              tabela: "controle_residuos",
                              registroId: r.id,
                              descricao: `Resíduo: ${r.tipo_residuo} — ${r.quantidade} ${r.unidade} — destino: ${r.destino_final}`,
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
        </TabsContent>

        {/* ── DESCARTES DE PRODUTO (Vencidos, Avariados, Reprovados) ── */}
        <TabsContent value="descartes" className="space-y-4">
          <Card className="border-yellow-500/20 bg-yellow-50 dark:bg-yellow-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <PackageX className="w-6 h-6 text-yellow-600 mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">
                    Controle de Descarte de Produtos — POP 08 <BaseLegalBadge assunto="bpf_geral" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registro obrigatório de produtos vencidos, avariados, rejeitados ou reprovados em análise. Cada
                    descarte deve conter: identificação do produto, lote, motivo, destino e responsável. O registro é
                    automaticamente vinculado à execução do POP-08 (Descarte).
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      {" "}
                      POP-08
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {(() => {
            const descartes = residuos.filter((r: any) =>
              ["Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção"].includes(r.tipo_residuo),
            );
            const vencidos = descartes.filter((r: any) => r.motivo_descarte === "vencido");
            const reprovados = descartes.filter(
              (r: any) => r.motivo_descarte === "reprovado_analise" || r.motivo_descarte === "rejeitado_recebimento",
            );
            const contaminados = descartes.filter((r: any) => r.motivo_descarte === "contaminado");
            const semMotivo = descartes.filter((r: any) => !r.motivo_descarte);

            return (
              <>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold">{descartes.length}</p>
                      <p className="text-[10px] text-muted-foreground">Total Descartes</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-yellow-600">{vencidos.length}</p>
                      <p className="text-[10px] text-muted-foreground">Vencidos</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-destructive">{reprovados.length}</p>
                      <p className="text-[10px] text-muted-foreground">Reprovados/Rejeitados</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-orange-600">{contaminados.length}</p>
                      <p className="text-[10px] text-muted-foreground">Contaminados</p>
                    </CardContent>
                  </Card>
                  <Card className={semMotivo.length > 0 ? "border-destructive" : ""}>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold text-destructive">{semMotivo.length}</p>
                      <p className="text-[10px] text-muted-foreground">Sem Motivo</p>
                    </CardContent>
                  </Card>
                </div>

                {semMotivo.length > 0 && (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-destructive" />
                        <p className="text-sm font-semibold text-destructive">
                          {semMotivo.length} descarte(s) sem motivo registrado — preencha para conformidade.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {descartes.length === 0 ? (
                  <Card>
                    <CardContent className="py-12 text-center text-muted-foreground">
                      <PackageX className="w-12 h-12 mx-auto mb-3 opacity-40" />
                      <p>Nenhum descarte de produto registrado</p>
                      <p className="text-xs mt-1">
                        Use "Novo Registro" e selecione "Produto vencido", "Produto rejeitado/reprovado" ou "Sobra de
                        produção".
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Data</TableHead>
                          <TableHead>Produto</TableHead>
                          <TableHead>Lote</TableHead>
                          <TableHead>Motivo</TableHead>
                          <TableHead>Qtd</TableHead>
                          <TableHead>Destino</TableHead>
                          <TableHead>Responsável</TableHead>
                          <TableHead>Manifesto</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {descartes.map((r: any) => (
                          <TableRow key={r.id}>
                            <TableCell className="whitespace-nowrap">{r.data_coleta}</TableCell>
                            <TableCell className="font-medium">{r.produto_nome || r.tipo_residuo}</TableCell>
                            <TableCell className="font-mono text-xs">{r.lote_produto || "—"}</TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  r.motivo_descarte === "vencido"
                                    ? "outline"
                                    : r.motivo_descarte === "contaminado"
                                      ? "destructive"
                                      : "secondary"
                                }
                                className="text-[10px]"
                              >
                                {MOTIVOS_DESCARTE.find((m) => m.value === r.motivo_descarte)?.label ||
                                  r.motivo_descarte ||
                                  "Não informado"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {r.quantidade} {r.unidade}
                            </TableCell>
                            <TableCell>{r.destino_final || "—"}</TableCell>
                            <TableCell>{r.responsavel || "—"}</TableCell>
                            <TableCell className="font-mono text-xs">{r.manifesto_numero || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </>
            );
          })()}
        </TabsContent>

        <TabsContent value="efluentes" className="space-y-4">
          <Card className="border-blue-400/20 bg-blue-50 dark:bg-blue-900/10">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Droplets className="w-6 h-6 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">
                    Controle de Efluentes — POP 08
                    <BaseLegalBadge assunto="autocontrole" />
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registros de efluentes líquidos, industriais e água de lavagem com tipo de tratamento. Parâmetros
                    obrigatórios: pH, DBO, DQO, Sólidos Suspensos.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      Resolução CONAMA 430/2011
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {" "}
                      — POP 08
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Parâmetros de referência */}
          <Card>
            <CardContent className="pt-4">
              <h4 className="font-semibold text-sm mb-3">Parâmetros de Referência — CONAMA 430/2011</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { param: "pH", faixa: "5,0 – 9,0", unidade: "" },
                  { param: "DBO₅", faixa: "≤ 120 mg/L", unidade: "ou remoção ≥ 60%" },
                  { param: "DQO", faixa: "≤ 450 mg/L", unidade: "referência" },
                  { param: "Sólidos Susp.", faixa: "≤ 150 mg/L", unidade: "CONAMA" },
                ].map((p) => (
                  <div key={p.param} className="p-2 rounded border bg-background text-center">
                    <p className="text-xs font-semibold text-primary">{p.param}</p>
                    <p className="text-sm font-bold">{p.faixa}</p>
                    <p className="text-[10px] text-muted-foreground">{p.unidade}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          {efluentes.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <Droplets className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum efluente registrado</p>
                <p className="text-xs mt-1">Use "Novo Registro" e selecione um tipo de efluente.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Origem</TableHead>
                    <TableHead>Destino / Tratamento</TableHead>
                    <TableHead>Qtd</TableHead>
                    <TableHead>Manifesto</TableHead>
                    <TableHead>Observações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {efluentes.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_coleta}</TableCell>
                      <TableCell className="font-medium">{r.tipo_residuo}</TableCell>
                      <TableCell>{r.origem}</TableCell>
                      <TableCell>{r.destino_final}</TableCell>
                      <TableCell>
                        {r.quantidade} {r.unidade}
                      </TableCell>
                      <TableCell>{r.manifesto_numero || "—"}</TableCell>
                      <TableCell className="max-w-[200px] text-xs truncate">{r.observacoes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        {/* ── PGRS — Plano de Gerenciamento de Resíduos Sólidos ── */}
        <TabsContent value="pgrs" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <ShieldAlert className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-display font-semibold text-sm">
                    PGRS — Plano de Gerenciamento de Resíduos Sólidos
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Conforme POP 08 e critérios ambientais do MAPA, o estabelecimento deve manter um PGRS atualizado,
                    contemplando: classificação dos resíduos, segregação na origem, acondicionamento, transporte e
                    destinação final licenciada.
                  </p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      ABNT NBR 10.004
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Resolução CONAMA 313/2002
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      {" "}
                      — POP 08
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Dashboard PGRS */}
          {(() => {
            const organicos = residuos.filter(
              (r: any) => r.tipo_residuo === "Orgânico" || r.tipo_residuo === "Pó/Varredura",
            );
            const embalagens = residuos.filter((r: any) => r.tipo_residuo?.includes("Embalagens"));
            const perigosos = residuos.filter((r: any) => r.classificacao === "classe_I");
            const descartes = residuos.filter((r: any) =>
              ["Produto vencido", "Produto rejeitado/reprovado", "Sobra de produção"].includes(r.tipo_residuo),
            );
            const semManifesto = residuos.filter((r: any) => !r.manifesto_numero && r.classificacao === "classe_I");
            const semLicenca = residuos.filter((r: any) => !r.licenca_ambiental && r.empresa_coletora);

            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold font-display">{organicos.length}</p>
                      <p className="text-[10px] text-muted-foreground">Orgânicos / Pó</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold font-display text-primary">{embalagens.length}</p>
                      <p className="text-[10px] text-muted-foreground">Embalagens</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold font-display text-destructive">{perigosos.length}</p>
                      <p className="text-[10px] text-muted-foreground">Classe I (Perigosos)</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-4 text-center">
                      <p className="text-2xl font-bold font-display">{descartes.length}</p>
                      <p className="text-[10px] text-muted-foreground">Descartes de Produto</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Alertas de conformidade ambiental */}
                {(semManifesto.length > 0 || semLicenca.length > 0) && (
                  <Card className="border-destructive/30 bg-destructive/5">
                    <CardContent className="pt-4">
                      <div className="flex items-center gap-2 mb-3">
                        <ShieldAlert className="w-5 h-5 text-destructive" />
                        <h3 className="font-semibold text-sm text-destructive">Pendências Ambientais</h3>
                      </div>
                      {semManifesto.length > 0 && (
                        <p className="text-xs text-destructive mb-1">
                          ⚠️ {semManifesto.length} resíduo(s) Classe I <strong>sem manifesto de transporte</strong> —
                          obrigatório conforme CONAMA.
                        </p>
                      )}
                      {semLicenca.length > 0 && (
                        <p className="text-xs text-destructive">
                          ⚠️ {semLicenca.length} registro(s) com empresa coletora{" "}
                          <strong>sem licença ambiental informada</strong>.
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Checklist PGRS */}
                <Card>
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-sm mb-3">Checklist de Conformidade — PGRS / POP 08</h4>
                    <div className="space-y-2">
                      {[
                        { item: "Resíduos classificados conforme ABNT NBR 10.004", ok: residuos.length > 0 },
                        { item: "Segregação por classe na origem (coletores identificados)", ok: true },
                        {
                          item: "Empresa coletora licenciada para transporte de resíduos",
                          ok: comLicenca > 0 || residuos.length === 0,
                        },
                        {
                          item: "Manifesto de Transporte de Resíduos (MTR) para Classe I",
                          ok: semManifesto.length === 0,
                        },
                        {
                          item: "Controle de efluentes com parâmetros (pH, DBO, DQO)",
                          ok: efluentes.length === 0 || efluentes.some((e: any) => e.observacoes?.includes("pH")),
                        },
                        {
                          item: "Registros de descarte de produtos (vencidos/reprovados) integrados ao POP",
                          ok: descartes.length === 0 || descartes.every((d: any) => d.motivo_descarte),
                        },
                        {
                          item: "Frequência de coleta definida para cada tipo de resíduo",
                          ok: residuos.every((r: any) => r.frequencia_coleta),
                        },
                        { item: "Área de armazenamento temporário identificada e coberta", ok: true },
                      ].map((c, i) => (
                        <div key={i} className="flex items-center gap-2 p-2 rounded border bg-background">
                          <span className={`text-sm ${c.ok ? "text-primary" : "text-destructive"}`}>
                            {c.ok ? "✅" : "❌"}
                          </span>
                          <span className="text-xs flex-1">{c.item}</span>
                          <Badge variant={c.ok ? "default" : "destructive"} className="text-[10px]">
                            {c.ok ? "OK" : "Pendente"}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            );
          })()}
        </TabsContent>
      </Tabs>
    </div>
  );
}
