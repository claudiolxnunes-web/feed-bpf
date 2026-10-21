import { CHECKLIST_VEICULO, CHECKLIST_DEPOSITO } from "@/components/armazenamento/constants";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Truck,
  Thermometer,
  Warehouse,
  ClipboardList,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Download,
} from "lucide-react";
import PageHeader from "@/components/PageHeader";

// ── CHECKLIST INSPEÇÃO DE VEÍCULO (POP-02 / PL POP 2.4 — Higiene/Limpeza de Veículos — IN 15/2009) ──

// ── CHECKLIST DEPÓSITO / ARMAZÉM ──

export default function ArmazenamentoTransporte() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const qc = useQueryClient();

  // Vehicle inspection
  const [veicChecklist, setVeicChecklist] = useState<Record<string, boolean>>({});
  const [veicData, setVeicData] = useState(new Date().toISOString().split("T")[0]);
  const [veicResp, setVeicResp] = useState("");
  const [veicPlaca, setVeicPlaca] = useState("");
  const [veicTransportadora, setVeicTransportadora] = useState("");
  const [veicTipoCarga, setVeicTipoCarga] = useState("ensacado");
  const [veicObs, setVeicObs] = useState("");
  const [savingVeic, setSavingVeic] = useState(false);

  // Deposit inspection
  const [depChecklist, setDepChecklist] = useState<Record<string, boolean>>({});
  const [depData, setDepData] = useState(new Date().toISOString().split("T")[0]);
  const [depResp, setDepResp] = useState("");
  const [depLocal, setDepLocal] = useState("");
  const [depTemp, setDepTemp] = useState("");
  const [depUmid, setDepUmid] = useState("");
  const [depObs, setDepObs] = useState("");
  const [savingDep, setSavingDep] = useState(false);

  // Temp/Humidity log
  const [logData, setLogData] = useState(new Date().toISOString().split("T")[0]);
  const [logHora, setLogHora] = useState("");
  const [logLocal, setLogLocal] = useState("Depósito MP");
  const [logTemp, setLogTemp] = useState("");
  const [logUmid, setLogUmid] = useState("");
  const [logResp, setLogResp] = useState("");
  const [logObs, setLogObs] = useState("");
  const [savingLog, setSavingLog] = useState(false);

  // Fetch records
  const { data: registros = [] } = useQuery({
    queryKey: ["armazenamento_transporte_pops", empresaAtiva?.id],
    queryFn: async () => {
      if (!empresaAtiva?.id) return [];
      const { data, error } = await supabase
        .from("execucao_pops")
        .select("*")
        // Inclui códigos antigos (POP-09-*, POP-DEPOSITO, POP-TEMP-UMID) e novos (POP-01-*, POP-02-*) para preservar histórico
        .in("codigo_pop", [
          "POP-02-VEICULO",
          "POP-09-VEICULO",
          "POP-VEICULO",
          "POP-01-DEPOSITO",
          "POP-DEPOSITO",
          "POP-01-TEMP-UMID",
          "POP-TEMP-UMID",
        ])
        .eq("empresa_id", empresaAtiva.id)
        .order("data_execucao", { ascending: false })
        .limit(200);
      if (error) throw error;
      return data;
    },
    enabled: !!empresaAtiva?.id,
  });

  const veicRegistros = registros.filter((r: any) => r.codigo_pop?.includes("VEICULO"));
  const depRegistros = registros.filter((r: any) => r.codigo_pop?.includes("DEPOSITO"));
  const tempRegistros = registros.filter((r: any) => r.codigo_pop?.includes("TEMP-UMID"));

  const saveVeiculoInspecao = async () => {
    if (!user || !empresaAtiva?.id || !veicResp) return;
    setSavingVeic(true);
    const totalItens = CHECKLIST_VEICULO.flatMap((a) => a.itens).length;
    const conformes = Object.values(veicChecklist).filter(Boolean).length;
    const pct = Math.round((conformes / totalItens) * 100);

    const obs = [
      `[INSPEÇÃO DE VEÍCULO — POP-02 / PL POP 2.4 — IN 15/2009]`,
      `Placa: ${veicPlaca || "—"} | Transportadora: ${veicTransportadora || "—"}`,
      `Tipo de carga: ${veicTipoCarga === "granel" ? "Granel" : "Ensacado/Paletizado"}`,
      `Conformidade: ${conformes}/${totalItens} itens (${pct}%)`,
      ...CHECKLIST_VEICULO.flatMap((area) =>
        area.itens
          .filter((item) => !veicChecklist[`${area.area}::${item}`])
          .map((item) => `❌ NC: [${area.area}] ${item}`),
      ),
      veicObs ? `Obs: ${veicObs}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id,
      empresa_id: empresaAtiva.id,
      codigo_pop: "POP-02-VEICULO",
      nome_pop: "PL POP 2.4 — Inspeção/Higiene de Veículo de Transporte",
      executor: veicResp,
      setor: `Placa: ${veicPlaca || "N/I"}`,
      status: pct >= 80 ? "concluido" : "nao_conforme",
      observacoes: obs,
      data_execucao: veicData,
    });

    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`Inspeção registrada — ${pct}% conforme`);
      setVeicChecklist({});
      setVeicPlaca("");
      setVeicTransportadora("");
      setVeicObs("");
      qc.invalidateQueries({ queryKey: ["armazenamento_transporte_pops"] });
    }
    setSavingVeic(false);
  };

  const saveDepositoInspecao = async () => {
    if (!user || !empresaAtiva?.id || !depResp) return;
    setSavingDep(true);
    const totalItens = CHECKLIST_DEPOSITO.flatMap((a) => a.itens).length;
    const conformes = Object.values(depChecklist).filter(Boolean).length;
    const pct = Math.round((conformes / totalItens) * 100);

    const obs = [
      `[INSPEÇÃO DE DEPÓSITO — POP-01 / Armazenamento de MP e PA — IN 04/2007]`,
      `Local: ${depLocal || "—"} | Temp: ${depTemp || "—"}°C | Umid: ${depUmid || "—"}%`,
      `Conformidade: ${conformes}/${totalItens} itens (${pct}%)`,
      ...CHECKLIST_DEPOSITO.flatMap((area) =>
        area.itens
          .filter((item) => !depChecklist[`${area.area}::${item}`])
          .map((item) => `❌ NC: [${area.area}] ${item}`),
      ),
      depObs ? `Obs: ${depObs}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id,
      empresa_id: empresaAtiva.id,
      codigo_pop: "POP-01-DEPOSITO",
      nome_pop: "Inspeção de Depósito / Armazém (Armazenamento de MP)",
      executor: depResp,
      setor: depLocal || "Depósito",
      status: pct >= 80 ? "concluido" : "nao_conforme",
      observacoes: obs,
      data_execucao: depData,
    });

    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success(`Inspeção registrada — ${pct}% conforme`);
      setDepChecklist({});
      setDepLocal("");
      setDepTemp("");
      setDepUmid("");
      setDepObs("");
      qc.invalidateQueries({ queryKey: ["armazenamento_transporte_pops"] });
    }
    setSavingDep(false);
  };

  const saveLogTempUmid = async () => {
    if (!user || !empresaAtiva?.id || !logResp) return;
    setSavingLog(true);
    const tempNum = parseFloat(logTemp);
    const umidNum = parseFloat(logUmid);
    const alertas: string[] = [];
    if (tempNum > 30) alertas.push("⚠️ Temperatura acima de 30°C — risco para ingredientes sensíveis");
    if (umidNum > 70) alertas.push("⚠️ Umidade acima de 70% — risco de formação de fungos/micotoxinas");

    const obs = [
      `[MONITORAMENTO TEMP/UMIDADE — POP-01 / Condições de Armazenamento]`,
      `Local: ${logLocal} | Hora: ${logHora || "—"}`,
      `Temperatura: ${logTemp || "—"}°C | Umidade: ${logUmid || "—"}%`,
      ...alertas,
      logObs ? `Obs: ${logObs}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("execucao_pops").insert({
      user_id: user.id,
      empresa_id: empresaAtiva.id,
      codigo_pop: "POP-01-TEMP-UMID",
      nome_pop: "Monitoramento de Temperatura e Umidade (Armazenamento)",
      executor: logResp,
      setor: logLocal,
      status: alertas.length === 0 ? "concluido" : "nao_conforme",
      observacoes: obs,
      data_execucao: logData,
    });

    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Registro salvo!");
      setLogTemp("");
      setLogUmid("");
      setLogHora("");
      setLogObs("");
      qc.invalidateQueries({ queryKey: ["armazenamento_transporte_pops"] });
    }
    setSavingLog(false);
  };

  const renderChecklist = (
    items: { area: string; itens: string[] }[],
    checklist: Record<string, boolean>,
    setChecklist: React.Dispatch<React.SetStateAction<Record<string, boolean>>>,
  ) => {
    const totalItens = items.flatMap((a) => a.itens).length;
    const conformes = Object.values(checklist).filter(Boolean).length;
    const pct = totalItens > 0 ? Math.round((conformes / totalItens) * 100) : 0;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Badge variant={pct >= 80 ? "default" : "destructive"} className="text-xs">
            {conformes}/{totalItens} — {pct}%
          </Badge>
          {pct >= 80 ? (
            <span className="text-xs text-primary flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" /> Conforme
            </span>
          ) : (
            <span className="text-xs text-destructive flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" /> Não Conforme
            </span>
          )}
        </div>
        {items.map((area) => (
          <Card key={area.area}>
            <CardHeader className="py-2 px-4">
              <CardTitle className="text-sm">{area.area}</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3 space-y-1">
              {area.itens.map((item) => {
                const key = `${area.area}::${item}`;
                return (
                  <label
                    key={key}
                    className="flex items-center gap-2 p-1.5 rounded hover:bg-muted/50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={!!checklist[key]}
                      onChange={(e) => setChecklist((prev) => ({ ...prev, [key]: e.target.checked }))}
                      className="h-4 w-4 rounded"
                    />
                    <span className={checklist[key] ? "text-muted-foreground line-through" : ""}>{item}</span>
                  </label>
                );
              })}
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const exportCsv = () => {
    const BOM = "\uFEFF";
    let csv = "Data,Tipo,Executor,Setor,Status,Observações\n";
    for (const r of registros) {
      csv += `${r.data_execucao},"${r.nome_pop}","${r.executor}","${r.setor || ""}","${r.status}","${(r.observacoes || "").replace(/"/g, '""').replace(/\n/g, " | ")}"\n`;
    }
    const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `armazenamento_transporte_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportado!");
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Warehouse}
        title="POP 01 e POP 02 - Armazenamento e Transporte"
        description="Armazenamento (POP 01) e Transporte (POP 02 - Higiene de Veículos)"
        orientacaoModuloId="armazenamento-transporte"
        assuntoBaseLegal="bpf_geral"
      />

      <Tabs defaultValue="veiculo" className="space-y-4">
        <TabsList className="flex-wrap">
          <TabsTrigger value="veiculo">
            <Truck className="w-4 h-4 mr-1" />
            Inspeção de Veículo
          </TabsTrigger>
          <TabsTrigger value="deposito">
            <Warehouse className="w-4 h-4 mr-1" />
            Inspeção de Depósito
          </TabsTrigger>
          <TabsTrigger value="temp_umid">
            <Thermometer className="w-4 h-4 mr-1" />
            Temp / Umidade
          </TabsTrigger>
          <TabsTrigger value="historico">
            <ClipboardList className="w-4 h-4 mr-1" />
            Histórico ({registros.length})
          </TabsTrigger>
        </TabsList>

        {/* ── INSPEÇÃO DE VEÍCULO ── */}
        <TabsContent value="veiculo" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Truck className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">
                    POP-02 / PL POP 2.4 — Inspeção e Higiene de Veículos de Transporte{" "}
                  </h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Todo veículo de transporte de matéria-prima ou produto acabado deve ser inspecionado quanto a
                    limpeza, integridade e ausência de contaminantes antes da carga/descarga.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={veicData} onChange={(e) => setVeicData(e.target.value)} />
            </div>
            <div>
              <Label>Responsável *</Label>
              <Input value={veicResp} onChange={(e) => setVeicResp(e.target.value)} placeholder="Nome do inspetor" />
            </div>
            <div>
              <Label>Placa do Veículo</Label>
              <Input
                value={veicPlaca}
                onChange={(e) => setVeicPlaca(e.target.value.toUpperCase())}
                placeholder="ABC-1234"
              />
            </div>
            <div>
              <Label>Transportadora</Label>
              <Input
                value={veicTransportadora}
                onChange={(e) => setVeicTransportadora(e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Tipo de Carga</Label>
              <Select value={veicTipoCarga} onValueChange={setVeicTipoCarga}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ensacado">Ensacado / Paletizado</SelectItem>
                  <SelectItem value="granel">Granel</SelectItem>
                  <SelectItem value="big_bag">Big Bag</SelectItem>
                  <SelectItem value="liquido">Líquido (tanque)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Observações</Label>
              <Input value={veicObs} onChange={(e) => setVeicObs(e.target.value)} placeholder="Observações gerais..." />
            </div>
          </div>

          {renderChecklist(CHECKLIST_VEICULO, veicChecklist, setVeicChecklist)}

          <Button onClick={saveVeiculoInspecao} disabled={savingVeic || !veicResp} className="w-full">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Registrar Inspeção de Veículo
          </Button>
        </TabsContent>

        {/* ── INSPEÇÃO DE DEPÓSITO ── */}
        <TabsContent value="deposito" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Warehouse className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">POP-01 — Inspeção de Depósito / Armazém de MP e PA</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Verificação periódica das condições de armazenamento, incluindo temperatura, umidade, organização,
                    identificação de lotes e prevenção contra pragas e contaminação.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div>
              <Label>Data *</Label>
              <Input type="date" value={depData} onChange={(e) => setDepData(e.target.value)} />
            </div>
            <div>
              <Label>Responsável *</Label>
              <Input value={depResp} onChange={(e) => setDepResp(e.target.value)} placeholder="Nome" />
            </div>
            <div>
              <Label>Local / Depósito</Label>
              <Input
                value={depLocal}
                onChange={(e) => setDepLocal(e.target.value)}
                placeholder="Ex: Depósito MP, PA..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Temp (°C)</Label>
                <Input type="number" value={depTemp} onChange={(e) => setDepTemp(e.target.value)} placeholder="25" />
              </div>
              <div>
                <Label>Umid (%)</Label>
                <Input type="number" value={depUmid} onChange={(e) => setDepUmid(e.target.value)} placeholder="60" />
              </div>
            </div>
          </div>
          <div>
            <Label>Observações</Label>
            <Input value={depObs} onChange={(e) => setDepObs(e.target.value)} />
          </div>

          {renderChecklist(CHECKLIST_DEPOSITO, depChecklist, setDepChecklist)}

          <Button onClick={saveDepositoInspecao} disabled={savingDep || !depResp} className="w-full">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Registrar Inspeção de Depósito
          </Button>
        </TabsContent>

        {/* ── TEMPERATURA / UMIDADE ── */}
        <TabsContent value="temp_umid" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="pt-4">
              <div className="flex items-start gap-3">
                <Thermometer className="w-6 h-6 text-primary mt-0.5" />
                <div>
                  <h4 className="font-semibold text-sm">POP-01 — Controle de Temperatura e Umidade dos Depósitos</h4>
                  <p className="text-xs text-muted-foreground mt-1">
                    Registro diário ou por turno de temperatura e umidade relativa nos depósitos de matéria-prima e
                    produto acabado (condições de armazenamento).
                  </p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline" className="text-[10px]">
                      Temp ideal: 15–25°C
                    </Badge>
                    <Badge variant="outline" className="text-[10px]">
                      Umidade ideal: 40–65%
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-4 space-y-3">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <Label>Data *</Label>
                  <Input type="date" value={logData} onChange={(e) => setLogData(e.target.value)} />
                </div>
                <div>
                  <Label>Hora</Label>
                  <Input type="time" value={logHora} onChange={(e) => setLogHora(e.target.value)} />
                </div>
                <div>
                  <Label>Local *</Label>
                  <Select value={logLocal} onValueChange={setLogLocal}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Depósito MP">Depósito Matéria-Prima</SelectItem>
                      <SelectItem value="Depósito PA">Depósito Produto Acabado</SelectItem>
                      <SelectItem value="Câmara Fria">Câmara Fria</SelectItem>
                      <SelectItem value="Área de Produção">Área de Produção</SelectItem>
                      <SelectItem value="Sala de Premix">Sala de Premix</SelectItem>
                      <SelectItem value="Expedição">Expedição</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Responsável *</Label>
                  <Input value={logResp} onChange={(e) => setLogResp(e.target.value)} placeholder="Nome" />
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Temperatura (°C) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={logTemp}
                    onChange={(e) => setLogTemp(e.target.value)}
                    placeholder="Ex: 24.5"
                  />
                </div>
                <div>
                  <Label>Umidade Relativa (%) *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={logUmid}
                    onChange={(e) => setLogUmid(e.target.value)}
                    placeholder="Ex: 58"
                  />
                </div>
                <div>
                  <Label>Observações</Label>
                  <Input value={logObs} onChange={(e) => setLogObs(e.target.value)} placeholder="Opcional" />
                </div>
              </div>

              {/* Alerts */}
              {(parseFloat(logTemp) > 30 || parseFloat(logUmid) > 70) && (
                <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span className="text-xs font-semibold text-destructive">Alerta de Condição Ambiental</span>
                  </div>
                  {parseFloat(logTemp) > 30 && (
                    <p className="text-xs text-destructive mt-1">
                      ⚠️ Temperatura acima de 30°C — risco para ingredientes sensíveis e formação de micotoxinas.
                    </p>
                  )}
                  {parseFloat(logUmid) > 70 && (
                    <p className="text-xs text-destructive mt-1">
                      ⚠️ Umidade acima de 70% — risco de formação de fungos e degradação de produto.
                    </p>
                  )}
                </div>
              )}

              <Button onClick={saveLogTempUmid} disabled={savingLog || !logResp || !logTemp} className="w-full">
                <Plus className="w-4 h-4 mr-2" />
                Registrar Leitura
              </Button>
            </CardContent>
          </Card>

          {/* History table */}
          {tempRegistros.length > 0 && (
            <Card>
              <CardHeader className="py-2 px-4">
                <CardTitle className="text-sm">Histórico de Leituras</CardTitle>
              </CardHeader>
              <CardContent className="px-0 pb-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Local</TableHead>
                      <TableHead>Responsável</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Detalhes</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {tempRegistros.slice(0, 30).map((r: any) => (
                      <TableRow key={r.id}>
                        <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                        <TableCell>{r.setor}</TableCell>
                        <TableCell>{r.executor}</TableCell>
                        <TableCell>
                          <Badge
                            className={
                              r.status === "concluido"
                                ? "bg-primary/20 text-primary text-[10px]"
                                : "bg-destructive/20 text-destructive text-[10px]"
                            }
                          >
                            {r.status === "concluido" ? "OK" : "Alerta"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[250px] truncate">{r.observacoes}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ── HISTÓRICO ── */}
        <TabsContent value="historico" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-1" /> Exportar CSV
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-primary">{veicRegistros.length}</p>
                <p className="text-[10px] text-muted-foreground">Inspeções de Veículo</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-primary">{depRegistros.length}</p>
                <p className="text-[10px] text-muted-foreground">Inspeções de Depósito</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 text-center">
                <p className="text-2xl font-bold text-primary">{tempRegistros.length}</p>
                <p className="text-[10px] text-muted-foreground">Leituras Temp/Umid</p>
              </CardContent>
            </Card>
          </div>

          {registros.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-40" />
                <p>Nenhum registro encontrado</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Executor</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {registros.map((r: any) => (
                    <TableRow key={r.id}>
                      <TableCell className="whitespace-nowrap">{r.data_execucao}</TableCell>
                      <TableCell className="text-xs">{r.nome_pop}</TableCell>
                      <TableCell>{r.executor}</TableCell>
                      <TableCell className="text-xs">{r.setor}</TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.status === "concluido"
                              ? "bg-primary/20 text-primary text-[10px]"
                              : "bg-destructive/20 text-destructive text-[10px]"
                          }
                        >
                          {r.status === "concluido" ? "Conforme" : "NC"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
