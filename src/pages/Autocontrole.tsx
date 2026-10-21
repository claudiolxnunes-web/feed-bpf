import { useState, useEffect } from "react";
import { ClipboardCheck, Plus, Loader2, CheckCircle2, AlertCircle, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { ORIENTACOES_PAC } from "@/config/baseLegal";

const ELEMENTOS = [
  "Água de Abastecimento",
  "Saúde e Higiene Pessoal",
  "Limpeza e Higienização",
  "Manejo de Pragas",
  "Manutenção e Calibração",
  "Resíduos e Efluentes",
  "Rastreabilidade",
  "Procedimentos de Produção",
];

export default function Autocontrole() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchData = async () => {
    let q = supabase.from("pac_monitoramento").select("*").order("data", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data } = await q;
    if (data) setData(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [empresaAtiva]);

  const handleVerificar = async (id: string) => {
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("nome").eq("user_id", user.id).single();
    const verificador = profile?.nome || user.email;

    const { error } = await (supabase.from("pac_monitoramento" as any) as any)
      .update({
        verificado_por: verificador,
        data_verificacao: new Date().toISOString(),
        status_verificacao: "aprovado",
      })
      .eq("id", id);

    if (error) toast.error("Erro ao verificar");
    else {
      toast.success("Registro verificado!");
      fetchData();
    }
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const conformidade = formData.get("conformidade") === "on";
    const acaoCorretiva = formData.get("acao_corretiva") as string;

    if (!conformidade && !acaoCorretiva) {
      toast.error("Ação corretiva é obrigatória para itens não conformes!");
      return;
    }

    const { data: record, error } = await supabase
      .from("pac_monitoramento")
      .insert({
        user_id: user?.id as any,
        empresa_id: empresaAtiva?.id as any,
        data: formData.get("data") as string,
        elemento_controle: formData.get("elemento_controle") as string,
        item_avaliado: formData.get("item_avaliado") as string,
        resultado: formData.get("resultado") as string,
        conformidade: conformidade,
        acao_corretiva: acaoCorretiva,
        monitor: formData.get("monitor") as string,
      } as any)
      .select()
      .single();

    if (error) toast.error("Erro ao salvar");
    else {
      toast.success("Monitoramento PAC registrado!");

      // Automatic NC Flow
      if (!conformidade) {
        await supabase.from("nao_conformidades").insert({
          user_id: user?.id,
          empresa_id: empresaAtiva?.id || null,
          data: formData.get("data"),
          setor: `PAC / ${formData.get("elemento_controle")}`,
          descricao: `NC no PAC (${formData.get("item_avaliado")}): ${acaoCorretiva}`,
          status: "pendente",
        } as any);
      }

      setOpen(false);
      fetchData();
    }
  };

  return (
    <>
      <PageHeader
        icon={ClipboardCheck}
        title="POP 10 - PAC - Programa de Autocontrole"
        description="Verificação geral dos POPs, auditoria interna e melhoria contínua do sistema"
        assuntoBaseLegal="autocontrole"
      />
      <div className="mb-6 space-y-2 text-sm text-muted-foreground">
        <p>{ORIENTACOES_PAC.origem}</p>
        <p>{ORIENTACOES_PAC.requisitos}</p>
        <p>{ORIENTACOES_PAC.perigos}</p>
      </div>
      <Card>
        <CardHeader className="flex flex-row justify-between">
          <CardTitle>Registros de PAC</CardTitle>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Novo Registro
              </Button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Novo Registro de Autocontrole</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleAdd} className="space-y-4">
                <Input type="date" name="data" defaultValue={new Date().toISOString().split("T")[0]} />
                <Select name="elemento_controle" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Elemento de Controle" />
                  </SelectTrigger>
                  <SelectContent>
                    {ELEMENTOS.map((e) => (
                      <SelectItem key={e} value={e}>
                        {e}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input name="item_avaliado" placeholder="Item Avaliado (ex: Caixa d'água)" required />
                <Input name="resultado" placeholder="Resultado Encontrado" />
                <div className="flex items-center space-x-2">
                  <Label>Conformidade</Label>
                  <Switch name="conformidade" defaultChecked />
                </div>
                <Textarea name="acao_corretiva" placeholder="Ação Corretiva" />
                <Input name="monitor" placeholder="Monitor / Responsável" required />
                <Button type="submit">Salvar</Button>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p>Carregando...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Elemento</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Monitor</TableHead>
                  <TableHead>Verificação</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>{item.data}</TableCell>
                    <TableCell className="text-xs font-semibold">{item.elemento_controle}</TableCell>
                    <TableCell className="text-xs">{item.item_avaliado}</TableCell>
                    <TableCell>
                      {item.conformidade ? (
                        <Badge className="bg-green-100 text-green-700 border-green-200">Conforme</Badge>
                      ) : (
                        <Badge variant="destructive">NC</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{item.monitor}</TableCell>
                    <TableCell>
                      {item.status_verificacao === "aprovado" ? (
                        <Badge variant="outline" className="text-green-600 border-green-600 gap-1 text-[10px]">
                          <CheckCircle2 className="w-3 h-3" /> {item.verificado_por}
                        </Badge>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[10px] gap-1 px-2"
                          onClick={() => handleVerificar(item.id)}
                        >
                          <ShieldCheck className="w-3 h-3 text-primary" /> Verificar
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
