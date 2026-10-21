import { useState, useEffect } from "react";
import { Zap, Plus, Loader2, ClipboardList, AlertCircle, CheckCircle2, ShieldCheck, Pencil, Trash2, Lock as LockIcon, History, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useSessionDraft } from "@/hooks/useSessionDraft";
import { registrarAuditLog } from "@/utils/auditLog";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

interface PCCRow {
  id: string;
  data: string;
  ponto_critico: string;
  parametro: string;
  limite_critico: string;
  valor_encontrado: string;
  conformidade: boolean;
  acao_corretiva: string | null;
  responsavel: string;
  observacoes: string | null;
  verificado_por: string | null;
  data_verificacao: string | null;
  status_verificacao: "pendente" | "aprovado" | null;
}

interface FormState {
  data: string;
  ponto_critico: string;
  parametro: string;
  limite_critico: string;
  valor_encontrado: string;
  conformidade: boolean;
  acao_corretiva: string;
  responsavel: string;
  observacoes: string;
}

const FORM_INICIAL: FormState = {
  data: new Date().toISOString().split("T")[0],
  ponto_critico: "",
  parametro: "",
  limite_critico: "",
  valor_encontrado: "",
  conformidade: true,
  acao_corretiva: "",
  responsavel: "",
  observacoes: "",
};

export default function MonitoramentoPCC() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const navigate = useNavigate();
  const [items, setItems] = useState<PCCRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [excluirId, setExcluirId] = useState<string | null>(null);
  
  const [form, setForm, clearDraft] = useSessionDraft<FormState>("pcc_monitoramento", FORM_INICIAL);
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm(prev => ({ ...prev, [key]: value }));

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      let q = supabase.from("monitoramento_pcc").select("*").order("data", { ascending: false });
      if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
      const { data, error } = await q;
      if (error) throw error;
      setItems((data as any) || []);
    } catch (err) {
      console.error("[MonitoramentoPCC] fetchData", err);
      toast.error("Erro ao carregar monitoramentos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [empresaAtiva, user]);

  const registroBloqueado = (item: PCCRow) => item.status_verificacao === 'aprovado';

  const abrirEdicao = (item: PCCRow) => {
    if (registroBloqueado(item)) {
      toast.error("Registro verificado/assinado não pode ser editado (exigência MAPA).");
      return;
    }
    setEditId(item.id);
    setForm({
      data: item.data,
      ponto_critico: item.ponto_critico,
      parametro: item.parametro,
      limite_critico: item.limite_critico || "",
      valor_encontrado: item.valor_encontrado,
      conformidade: item.conformidade,
      acao_corretiva: item.acao_corretiva || "",
      responsavel: item.responsavel,
      observacoes: item.observacoes || "",
    });
    setOpen(true);
  };

  const handleSalvar = async () => {
    if (!form.ponto_critico || !form.responsavel || !user) {
      toast.error("Preencha os campos obrigatórios.");
      return;
    }

    if (!form.conformidade && !form.acao_corretiva) {
      toast.error("Ação corretiva é obrigatória para registros não conformes!");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        data: form.data,
        ponto_critico: form.ponto_critico,
        parametro: form.parametro,
        limite_critico: form.limite_critico || null,
        valor_encontrado: form.valor_encontrado,
        conformidade: form.conformidade,
        acao_corretiva: form.acao_corretiva || null,
        responsavel: form.responsavel,
        observacoes: form.observacoes || null,
      };

      if (editId) {
        const anterior = items.find(i => i.id === editId);
        const { error } = await supabase.from("monitoramento_pcc").update(payload as any).eq("id", editId);
        if (error) throw error;
        
        await registrarAuditLog({
          userId: user.id, empresaId: empresaAtiva?.id, tabela: "monitoramento_pcc",
          registroId: editId, acao: "editar", dadosAnteriores: anterior, dadosNovos: payload,
        });
        toast.success("Registro atualizado!");
      } else {
        const { data: newRecord, error } = await supabase.from("monitoramento_pcc").insert({
          user_id: user.id,
          empresa_id: empresaAtiva?.id || null,
          ...payload,
          status_verificacao: 'pendente'
        } as any).select().single();
        
        if (error) throw error;

        if (!form.conformidade) {
          await supabase.from("nao_conformidades").insert({
            user_id: user.id,
            empresa_id: empresaAtiva?.id || null,
            data: form.data,
            setor: "PCC / Produção",
            descricao: `NC no monitoramento de PCC (${form.ponto_critico}): ${form.acao_corretiva}`,
            status: "aberta"
          } as any);
        }

        await registrarAuditLog({
          userId: user.id, empresaId: empresaAtiva?.id, tabela: "monitoramento_pcc",
          registroId: newRecord.id, acao: "criar", dadosNovos: newRecord,
        });
        toast.success("Registro salvo! Aguarde a verificação do RT/Supervisor.");
      }
      
      clearDraft();
      setForm(FORM_INICIAL);
      setEditId(null);
      setOpen(false);
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleExcluir = async () => {
    if (!excluirId || !user) return;
    const item = items.find(i => i.id === excluirId);
    
    if (item && registroBloqueado(item)) {
      toast.error("Registros assinados não podem ser excluídos.");
      setExcluirId(null);
      return;
    }

    try {
      const { error } = await supabase.from("monitoramento_pcc").delete().eq("id", excluirId);
      if (error) throw error;

      await registrarAuditLog({
        userId: user.id, empresaId: empresaAtiva?.id, tabela: "monitoramento_pcc",
        registroId: excluirId, acao: "excluir", dadosAnteriores: item,
      });
      toast.success("Registro excluído.");
      fetchData();
    } catch (err: any) {
      toast.error("Erro: " + err.message);
    } finally {
      setExcluirId(null);
    }
  };

  const handleVerificar = async (id: string) => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: profile } = await supabase.from('profiles').select('nome').eq('user_id', user.id).single();
      const verificador = profile?.nome || user.email;
      const item = items.find(i => i.id === id);
      
      const { error } = await supabase.from("monitoramento_pcc").update({
        verificado_por: verificador,
        data_verificacao: new Date().toISOString(),
        status_verificacao: 'aprovado'
      } as any).eq('id', id);

      if (error) throw error;

      await registrarAuditLog({
        userId: user.id, empresaId: empresaAtiva?.id, tabela: "monitoramento_pcc",
        registroId: id, acao: "editar", dadosAnteriores: item,
        dadosNovos: { status_verificacao: 'aprovado', verificado_por: verificador },
      });

      toast.success("Monitoramento verificado e assinado digitalmente.");
      fetchData();
    } catch (err: any) {
      toast.error("Erro na verificação: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const rascunhoAtivo = !editId && (
    form.ponto_critico !== FORM_INICIAL.ponto_critico || 
    form.responsavel !== FORM_INICIAL.responsavel ||
    form.valor_encontrado !== FORM_INICIAL.valor_encontrado
  );

  return (
    <>
      <PageHeader 
        icon={Zap} 
        title="POP 05 - Controle da Produção e Prevenção da Contaminação Cruzada" 
        description="Monitoramento de Pontos Críticos de Controle (PCC) e prevenção de contaminação cruzada" 
       assuntoBaseLegal="autocontrole" />
      
      {rascunhoAtivo && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm animate-in fade-in slide-in-from-top-4">
          <div className="flex items-center gap-3">
            <History className="w-5 h-5 text-primary" />
            <div>
              <p className="font-bold">Rascunho detectado</p>
              <p className="text-xs text-muted-foreground">Você tem um monitoramento iniciado que não foi salvo.</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => { clearDraft(); setForm(FORM_INICIAL); }}>Descartar</Button>
            <Button size="sm" onClick={() => setOpen(true)}>Continuar</Button>
          </div>
        </div>
      )}

      <Card className="border-border/50 shadow-premium overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/30 border-b border-border/50">
          <div>
            <CardTitle className="text-lg font-bold">Registros de Monitoramento</CardTitle>
            <p className="text-xs text-muted-foreground">Acompanhamento diário dos PCCs na fábrica</p>
          </div>
          <Button onClick={() => { setEditId(null); setOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" /> Novo Monitoramento
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Carregando monitoramentos...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-4">
              <ClipboardList className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-base font-semibold text-foreground">Nenhum registro encontrado</p>
              <p className="text-sm text-muted-foreground max-w-xs">Comece a monitorar os pontos críticos da sua produção hoje mesmo.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/20 hover:bg-muted/20">
                    <TableHead className="w-[100px] font-bold">Data</TableHead>
                    <TableHead className="font-bold">Ponto Crítico</TableHead>
                    <TableHead className="font-bold">Parâmetro</TableHead>
                    <TableHead className="font-bold text-center">Conformidade</TableHead>
                    <TableHead className="font-bold">Verificação (RT)</TableHead>
                    <TableHead className="font-bold text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(item => (
                    <TableRow key={item.id} className="group transition-colors">
                      <TableCell className="font-mono text-[13px]">{item.data}</TableCell>
                      <TableCell>
                        <div className="font-medium text-sm">{item.ponto_critico}</div>
                        <div className="text-[10px] text-muted-foreground">{item.responsavel}</div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">{item.parametro}</div>
                        <div className="text-[11px] font-mono text-primary">{item.valor_encontrado}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        {item.conformidade ? (
                          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-emerald-200 text-[10px]">
                            Conforme
                          </Badge>
                        ) : (
                          <Badge variant="destructive" className="text-[10px] animate-pulse">
                            Não Conforme
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.status_verificacao === 'aprovado' ? (
                          <div className="flex flex-col gap-0.5">
                            <Badge variant="outline" className="w-fit bg-blue-50 text-blue-700 border-blue-200 gap-1 text-[9px] py-0">
                              <ShieldCheck className="w-3 h-3" /> Verificado
                            </Badge>
                            <span className="text-[9px] text-muted-foreground truncate max-w-[120px]">
                              {item.verificado_por}
                            </span>
                          </div>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline" 
                            className="h-7 text-[10px] gap-1 px-2 border-primary/20 hover:border-primary/50 text-primary" 
                            onClick={() => handleVerificar(item.id)}
                            disabled={saving}
                          >
                            <ShieldCheck className="w-3 h-3" /> Assinar
                          </Button>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          {registroBloqueado(item) ? (
                            <>
                              <Badge variant="outline" className="h-7 px-2 border-amber-200 bg-amber-50 text-amber-700 text-[10px] gap-1">
                                <LockIcon className="w-3 h-3" /> Assinado
                              </Badge>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-7 w-7 p-0 text-primary" 
                                onClick={() => navigate("/nao-conformidades")}
                                title="Abrir NC corretiva"
                              >
                                <AlertTriangle className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0" 
                                onClick={() => abrirEdicao(item)}
                              >
                                <Pencil className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                              </Button>
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                className="h-8 w-8 p-0" 
                                onClick={() => setExcluirId(item.id)}
                              >
                                <Trash2 className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Cadastro/Edição */}
      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if(!v) setEditId(null); }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editId ? "Editar Registro" : "Novo Registro de Monitoramento"}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label>Data do Monitoramento</Label>
              <Input type="date" value={form.data} onChange={e => set("data", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Responsável</Label>
              <Input placeholder="Nome do operador" value={form.responsavel} onChange={e => set("responsavel", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Ponto Crítico de Controle (PCC)</Label>
              <Input placeholder="Ex: Moinho, Misturador, Peletizadora" value={form.ponto_critico} onChange={e => set("ponto_critico", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Parâmetro Monitorado</Label>
              <Input placeholder="Ex: Temperatura, Tempo, Peneira" value={form.parametro} onChange={e => set("parametro", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Limite Crítico (L.C.)</Label>
              <Input placeholder="Ex: < 80ºC, 5 min" value={form.limite_critico} onChange={e => set("limite_critico", e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Valor Encontrado</Label>
              <Input placeholder="Valor medido" value={form.valor_encontrado} onChange={e => set("valor_encontrado", e.target.value)} />
            </div>
            
            <div className="col-span-full p-4 rounded-xl border bg-muted/30 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-bold">Conformidade BPF</Label>
                  <p className="text-xs text-muted-foreground">O valor está dentro do limite crítico?</p>
                </div>
                <Switch 
                  checked={form.conformidade} 
                  onCheckedChange={v => set("conformidade", v)} 
                />
              </div>

              {!form.conformidade && (
                <div className="space-y-2 animate-in slide-in-from-left-2">
                  <Label className="text-destructive font-bold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> Ação Corretiva Imediata
                  </Label>
                  <Textarea 
                    placeholder="Descreva o que foi feito para corrigir o desvio..." 
                    value={form.acao_corretiva} 
                    onChange={e => set("acao_corretiva", e.target.value)}
                    className="border-destructive/30 focus-visible:ring-destructive"
                  />
                  <p className="text-[10px] text-destructive">Uma Não Conformidade será aberta automaticamente.</p>
                </div>
              )}
            </div>

            <div className="col-span-full space-y-2">
              <Label>Observações Adicionais</Label>
              <Textarea value={form.observacoes} onChange={e => set("observacoes", e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button className="flex-1" onClick={handleSalvar} disabled={saving}>
              {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editId ? "Salvar Alterações" : "Registrar Monitoramento"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!excluirId} onOpenChange={(v) => !v && setExcluirId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir registro?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita e será registrada no log de auditoria da empresa.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleExcluir} className="bg-destructive hover:bg-destructive/90">
              Confirmar Exclusão
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}