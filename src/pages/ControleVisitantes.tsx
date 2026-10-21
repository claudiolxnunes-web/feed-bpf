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
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Users, ShieldCheck, FileWarning, ClipboardCheck } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export default function ControleVisitantes() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const queryClient = useQueryClient();
  const [openDialog, setOpenDialog] = useState(false);

  const [nome, setNome] = useState("");
  const [empresa, setEmpresa] = useState("");
  const [documento, setDocumento] = useState("");
  const [dataVisita, setDataVisita] = useState(new Date().toISOString().split("T")[0]);
  const [horaEntrada, setHoraEntrada] = useState("");
  const [horaSaida, setHoraSaida] = useState("");
  const [motivo, setMotivo] = useState("");
  const [areasVisitadas, setAreasVisitadas] = useState("");
  const [acompanhante, setAcompanhante] = useState("");
  const [epiFornecido, setEpiFornecido] = useState(false);
  const [orientacaoBio, setOrientacaoBio] = useState(false);
  const [obs, setObs] = useState("");

  const { data: visitantes = [] } = useQuery({
    queryKey: ["controle-visitantes", empresaAtiva?.id],
    queryFn: async () => {
      const q = supabase.from("controle_visitantes").select("*").order("data_visita", { ascending: false });
      if (empresaAtiva?.id) q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
    enabled: !!user,
  });

  const addVisitante = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("controle_visitantes").insert({
        user_id: user!.id,
        empresa_id: empresaAtiva?.id || null,
        nome_visitante: nome,
        empresa,
        documento,
        data_visita: dataVisita,
        hora_entrada: horaEntrada,
        hora_saida: horaSaida,
        motivo,
        areas_visitadas: areasVisitadas,
        acompanhante,
        epi_fornecido: epiFornecido,
        orientacao_biosseguridade: orientacaoBio,
        observacoes: obs,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["controle-visitantes"] });
      toast.success("Visitante registrado!");
      setOpenDialog(false);
      setNome("");
      setEmpresa("");
      setDocumento("");
      setMotivo("");
      setObs("");
    },
    onError: () => toast.error("Erro ao salvar"),
  });

  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="POP 03 - Controle de Visitantes"
        description="Registro de entrada e biosseguridade de visitantes"
        orientacaoModuloId="visitantes"
        assuntoBaseLegal="bpf_geral"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 text-center">
            <Users className="mx-auto h-6 w-6 text-primary mb-1" />
            <p className="text-2xl font-bold">{visitantes.length}</p>
            <p className="text-xs text-muted-foreground">Total de Visitas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ShieldCheck className="mx-auto h-6 w-6 text-green-500 mb-1" />
            <p className="text-2xl font-bold text-green-600">
              {visitantes.filter((v) => v.orientacao_biosseguridade).length}
            </p>
            <p className="text-xs text-muted-foreground">Com Orientação Bio</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <ClipboardCheck className="mx-auto h-6 w-6 text-blue-500 mb-1" />
            <p className="text-2xl font-bold">{visitantes.filter((v) => v.epi_fornecido).length}</p>
            <p className="text-xs text-muted-foreground">EPI Fornecido</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Dialog open={openDialog} onOpenChange={setOpenDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-1" /> Registrar Visitante
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Registro de Visitante</DialogTitle>
            </DialogHeader>
            <div className="grid gap-3">
              <div>
                <Label>Nome do Visitante</Label>
                <Input value={nome} onChange={(e) => setNome(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Empresa</Label>
                  <Input value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
                </div>
                <div>
                  <Label>Documento (RG/CPF)</Label>
                  <Input value={documento} onChange={(e) => setDocumento(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                <div>
                  <Label>Data</Label>
                  <Input type="date" value={dataVisita} onChange={(e) => setDataVisita(e.target.value)} />
                </div>
                <div>
                  <Label>Entrada</Label>
                  <Input type="time" value={horaEntrada} onChange={(e) => setHoraEntrada(e.target.value)} />
                </div>
                <div>
                  <Label>Saída</Label>
                  <Input type="time" value={horaSaida} onChange={(e) => setHoraSaida(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Motivo da Visita</Label>
                <Input
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value)}
                  placeholder="Ex: Auditoria, Manutenção, Entrega"
                />
              </div>
              <div>
                <Label>Áreas Visitadas</Label>
                <Input
                  value={areasVisitadas}
                  onChange={(e) => setAreasVisitadas(e.target.value)}
                  placeholder="Ex: Produção, Laboratório"
                />
              </div>
              <div>
                <Label>Acompanhante (Funcionário)</Label>
                <Input value={acompanhante} onChange={(e) => setAcompanhante(e.target.value)} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={epiFornecido} onCheckedChange={setEpiFornecido} />
                  EPI Fornecido
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <Switch checked={orientacaoBio} onCheckedChange={setOrientacaoBio} />
                  Orientação de Biosseguridade
                </label>
              </div>
              <div>
                <Label>Observações</Label>
                <Textarea value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
              </div>
              <Button onClick={() => addVisitante.mutate()} disabled={!nome}>
                Salvar
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Registro de Visitantes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Visitante</TableHead>
                  <TableHead>Empresa</TableHead>
                  <TableHead>Entrada/Saída</TableHead>
                  <TableHead>Motivo</TableHead>
                  <TableHead>EPI</TableHead>
                  <TableHead>Bio</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visitantes.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                      Nenhum visitante registrado
                    </TableCell>
                  </TableRow>
                )}
                {visitantes.map((v) => (
                  <TableRow key={v.id}>
                    <TableCell className="whitespace-nowrap">{v.data_visita}</TableCell>
                    <TableCell className="font-medium">{v.nome_visitante}</TableCell>
                    <TableCell className="text-xs">{v.empresa || "—"}</TableCell>
                    <TableCell className="text-xs">
                      {v.hora_entrada || "—"} — {v.hora_saida || "—"}
                    </TableCell>
                    <TableCell className="text-xs max-w-[120px] truncate">{v.motivo || "—"}</TableCell>
                    <TableCell>
                      {v.epi_fornecido ? (
                        <Badge variant="default" className="text-xs">
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Não
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {v.orientacao_biosseguridade ? (
                        <Badge variant="default" className="text-xs">
                          Sim
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Não
                        </Badge>
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
                            tabela: "controle_visitantes",
                            registroId: v.id,
                            descricao: `Visitante: ${v.nome_visitante}${v.empresa ? ` (${v.empresa})` : ""} — visita em ${v.data_visita}`,
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
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
