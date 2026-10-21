import { TIPOS_EXAME } from "@/components/saude/constants";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { corrigirViaNC } from "@/utils/correcaoNC";
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
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, HeartPulse, CheckCircle2, AlertTriangle, FileWarning, UserCheck, Clock } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import { AnexarPlanilhaPop } from "@/components/documentos/AnexarPlanilhaPop";



export default function SaudePessoal() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);

  const [funcionario, setFuncionario] = useState("");
  const [tipoExame, setTipoExame] = useState("periodico");
  const [dataExame, setDataExame] = useState(new Date().toISOString().split("T")[0]);
  const [dataValidade, setDataValidade] = useState("");
  const [medico, setMedico] = useState("");
  const [crm, setCrm] = useState("");
  const [apto, setApto] = useState(true);
  const [restricoes, setRestricoes] = useState("");
  const [obs, setObs] = useState("");

  const { data: registros = [] } = useQuery({
    queryKey: ["saude-manipuladores", empresaAtiva?.id],
    queryFn: async () => {
      const q = supabase
        .from("saude_manipuladores")
        .select("*")
        .order("data_exame", { ascending: false });
      if (empresaAtiva?.id) q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addRegistro = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("saude_manipuladores").insert({
        user_id: user!.id,
        empresa_id: empresaAtiva?.id || null,
        funcionario,
        tipo_exame: tipoExame,
        data_exame: dataExame,
        data_validade: dataValidade || null,
        medico,
        crm,
        apto,
        restricoes,
        observacoes: obs,
        status: apto ? "valido" : "inapto",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["saude-manipuladores"] });
      toast.success("Exame registrado!");
      setOpenDialog(false);
      setFuncionario("");
      setRestricoes("");
      setObs("");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];
  const aptos = registros.filter(r => r.apto).length;
  const inaptos = registros.filter(r => !r.apto).length;
  const vencidos = registros.filter(r => r.data_validade && r.data_validade < today).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="POP 03 - Higiene e Saúde Pessoal"
        description="Procedimentos de higiene pessoal, saúde dos colaboradores e uso de EPIs"
        orientacaoModuloId="saude-pessoal"
       assuntoBaseLegal="bpf_geral" />
      <div className="flex justify-end mb-3"><AnexarPlanilhaPop popCodigo="POP-03" popNome="Saúde e Higiene Pessoal" /></div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="pt-4 text-center">
          <HeartPulse className="mx-auto h-6 w-6 text-primary mb-1" />
          <p className="text-2xl font-bold">{registros.length}</p>
          <p className="text-xs text-muted-foreground">Total de Exames</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <UserCheck className="mx-auto h-6 w-6 text-green-500 mb-1" />
          <p className="text-2xl font-bold text-green-600">{aptos}</p>
          <p className="text-xs text-muted-foreground">Aptos</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <AlertTriangle className="mx-auto h-6 w-6 text-red-500 mb-1" />
          <p className="text-2xl font-bold text-red-600">{inaptos}</p>
          <p className="text-xs text-muted-foreground">Inaptos / Restrição</p>
        </CardContent></Card>
        <Card><CardContent className="pt-4 text-center">
          <Clock className="mx-auto h-6 w-6 text-amber-500 mb-1" />
          <p className="text-2xl font-bold text-amber-600">{vencidos}</p>
          <p className="text-xs text-muted-foreground">Exames Vencidos</p>
        </CardContent></Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-1" /> Registrar Exame</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Registro de Exame / ASO</DialogTitle></DialogHeader>
            <div className="grid gap-3">
              <div><Label>Funcionário</Label><Input value={funcionario} onChange={e => setFuncionario(e.target.value)} placeholder="Nome completo" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Tipo de Exame</Label>
                  <Select value={tipoExame} onValueChange={setTipoExame}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{TIPOS_EXAME.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label>Data do Exame</Label><Input type="date" value={dataExame} onChange={e => setDataExame(e.target.value)} /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Validade (ASO)</Label><Input type="date" value={dataValidade} onChange={e => setDataValidade(e.target.value)} /></div>
                <div className="flex items-end gap-2">
                  <Label>Apto?</Label>
                  <Switch checked={apto} onCheckedChange={setApto} />
                  <Badge variant={apto ? "default" : "destructive"}>{apto ? "Apto" : "Inapto"}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>Médico</Label><Input value={medico} onChange={e => setMedico(e.target.value)} /></div>
                <div><Label>CRM</Label><Input value={crm} onChange={e => setCrm(e.target.value)} /></div>
              </div>
              <div><Label>Restrições</Label><Input value={restricoes} onChange={e => setRestricoes(e.target.value)} placeholder="Ex: afastado de área produtiva" /></div>
              <div><Label>Observações</Label><Textarea value={obs} onChange={e => setObs(e.target.value)} rows={2} /></div>
              <Button onClick={() => addRegistro.mutate()} disabled={!funcionario}>Salvar</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Registros de Exames Médicos</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Funcionário</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Médico/CRM</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Restrições</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {registros.length === 0 && (
                  <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">Nenhum exame registrado</TableCell></TableRow>
                )}
                {registros.map(r => {
                  const vencido = r.data_validade && r.data_validade < today;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-medium">{r.funcionario}</TableCell>
                      <TableCell><Badge variant="outline" className="text-xs">{TIPOS_EXAME.find(t => t.value === r.tipo_exame)?.label || r.tipo_exame}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">{r.data_exame}</TableCell>
                      <TableCell className={vencido ? "text-red-600 font-medium" : ""}>{r.data_validade || "—"}{vencido && " ⚠️"}</TableCell>
                      <TableCell className="text-xs">{r.medico}{r.crm ? ` (${r.crm})` : ""}</TableCell>
                      <TableCell>
                        <Badge variant={r.apto ? (vencido ? "secondary" : "default") : "destructive"} className="text-xs">
                          {r.apto ? (vencido ? "Vencido" : "Apto") : "Inapto"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[120px] truncate">{r.restricoes || "—"}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" className="gap-1 text-xs" title="Registros não são excluídos — correção via Não Conformidade" onClick={() => corrigirViaNC(navigate, { tabela: "saude_manipuladores", registroId: r.id, descricao: `Saúde de manipulador — ${r.funcionario} — exame: ${r.tipo_exame || "—"} — validade: ${r.data_validade || "—"}` })}><FileWarning className="w-4 h-4 text-primary" /> Corrigir via NC</Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
