import { Building2, Plus, Pencil, Trash2, AlertTriangle } from "lucide-react";
import { DadosRegulatoriosEmpresaSection } from "@/components/mapa-evolucao/MapaEvolucaoSections";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import PageHeader from "@/components/PageHeader";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { useLicense } from "@/hooks/useLicense";
import { TIER_MAX_EMPRESAS, TIER_LABEL } from "@/config/tiers";
import { toast } from "sonner";
import { captureError } from "@/lib/monitoring";
import { useWebMCP } from "use-webmcp-tool";
import { runWebMCPTool } from "@/lib/webmcp-telemetry";

const TIPOS = ["Ração farelada", "Ração peletizada", "Núcleo", "Premix", "Suplemento mineral", "Sal mineral"];

interface EmpresaForm {
  nome: string;
  cnpj: string;
  endereco: string;
  responsavel_tecnico: string;
  crmv: string;
  capacidade: string;
  tipo_producao: string[];
  origem_agua: "" | "poco" | "concessionaria";
  prefixo_doc: string;
}

const emptyForm: EmpresaForm = { nome: "", cnpj: "", endereco: "", responsavel_tecnico: "", crmv: "", capacidade: "", tipo_producao: [], origem_agua: "", prefixo_doc: "" };

export default function Cadastro() {
  const { user, userType } = useAuth();
  const { empresas, empresaAtiva, loading: empresasLoading, error: empresasError, recarregar, setEmpresaAtiva } = useEmpresa();
  const { tier } = useLicense();
  const [form, setForm] = useState<EmpresaForm>(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  useWebMCP({
    name: "ler_empresas_na_tela",
    description: "Lê os nomes e identificadores das empresas exibidas nesta tela e identifica a empresa ativa, sem alterar dados.",
    enabled: Boolean(user),
    annotations: { readOnlyHint: true, untrustedContentHint: true },
    execute: () => runWebMCPTool("ler_empresas_na_tela", () => {
      if (empresasLoading) return "As empresas ainda estão carregando.";
      if (empresasError) throw new Error("Não foi possível carregar as empresas.");
      return empresas.length ? empresas.slice(0, 100).map((e) => `${e.id}: ${e.nome}${e.id === empresaAtiva?.id ? " (ativa)" : ""}`).join("\n") : "Nenhuma empresa exibida.";
    }),
  });

  const toggleTipo = (t: string) => {
    setForm(prev => ({
      ...prev,
      tipo_producao: prev.tipo_producao.includes(t)
        ? prev.tipo_producao.filter(x => x !== t)
        : [...prev.tipo_producao, t],
    }));
  };

  const unlimitedCompanies = userType === "consultoria";
  const MAX_EMPRESAS = unlimitedCompanies ? Number.POSITIVE_INFINITY : TIER_MAX_EMPRESAS[tier];
  const tierLabel = TIER_LABEL[tier];
  const limitReached = (empresas?.length || 0) >= MAX_EMPRESAS;

  const openNew = () => {
    if (limitReached) {
      toast.error(`Limite de ${MAX_EMPRESAS} empresa(s) do plano ${tierLabel} atingido. Faça upgrade para cadastrar mais.`);
      return;
    }
    setForm(emptyForm); setEditId(null); setOpen(true);
  };

  const openEdit = (e: any) => {
    setForm({
      nome: e.nome || "",
      cnpj: e.cnpj || "",
      endereco: e.endereco || "",
      responsavel_tecnico: e.responsavel_tecnico || "",
      crmv: e.crmv || "",
      capacidade: e.capacidade || "",
      tipo_producao: e.tipo_producao || [],
      origem_agua: e.origem_agua || "",
      prefixo_doc: e.prefixo_doc || "",
    });
    setEditId(e.id);
    setOpen(true);
  };

  const salvar = async () => {
    if (!form.nome.trim()) { toast.error("Nome da empresa é obrigatório"); return; }
    if (!user) { toast.error("Usuário não identificado. Tente fazer login novamente."); return; }
    setSaving(true);
    console.log("Iniciando salvamento da empresa...", { editId, userId: user.id });
    try {
      if (editId) {
        const { error } = await supabase.from("empresas").update({
          nome: form.nome.trim(), 
          cnpj: form.cnpj.trim(), 
          endereco: form.endereco.trim(),
          responsavel_tecnico: form.responsavel_tecnico.trim(), 
          crmv: form.crmv.trim(),
          capacidade: form.capacidade.trim(), 
          tipo_producao: form.tipo_producao,
          origem_agua: form.origem_agua || null,
          prefixo_doc: form.prefixo_doc.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8) || null,
        }).eq("id", editId);
        
        if (error) throw error;
        toast.success("Empresa atualizada com sucesso!");
      } else {
        const { data, error } = await supabase.from("empresas").insert({
          user_id: user.id, 
          nome: form.nome.trim(), 
          cnpj: form.cnpj.trim(), 
          endereco: form.endereco.trim(),
          responsavel_tecnico: form.responsavel_tecnico.trim(), 
          crmv: form.crmv.trim(),
          capacidade: form.capacidade.trim(), 
          tipo_producao: form.tipo_producao,
          origem_agua: form.origem_agua || null,
          prefixo_doc: form.prefixo_doc.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8) || null,
        }).select().single();
        
        if (error) {
          if (error.code === "23505") { // Unique constraint
             throw new Error("Já existe uma empresa cadastrada com este CNPJ.");
          }
          throw error;
        }
        
        toast.success("Empresa cadastrada com sucesso!");
        if (data) setEmpresaAtiva(data as any);
      }
      
      await recarregar();
      setOpen(false);
    } catch (err: any) {
      console.error("Erro ao salvar empresa:", err);
      captureError(err, { form, editId, userId: user?.id });
      const message = err.message || "Não foi possível salvar os dados. Verifique sua conexão.";
      toast.error(message, {
        description: "Se o erro persistir, verifique se o CNPJ já está em uso.",
      });
    } finally { 
      setSaving(false); 
    }
  };

  const excluir = async (id: string) => {
    if (!confirm("Excluir esta empresa? Todos os dados vinculados serão removidos.")) return;
    const { error } = await supabase.from("empresas").delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("Empresa excluída");
    await recarregar();
  };

  return (
    <>
      <PageHeader icon={Building2} title="Cadastro de Empresas" description="Gerencie múltiplas unidades fabris — dados isolados por empresa" />

      {limitReached && (
        <div className="mb-4 p-3 rounded-lg bg-warning/10 border border-warning/30 flex items-center gap-3 text-sm">
          <AlertTriangle className="w-5 h-5 text-warning shrink-0" />
          <span>
            Limite de <strong>{MAX_EMPRESAS} empresa(s)</strong> do plano <strong>{tierLabel}</strong> atingido. Faça upgrade para cadastrar mais unidades.
          </span>
        </div>
      )}

      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-muted-foreground">
          {empresas?.length || 0} / {unlimitedCompanies ? "∞" : MAX_EMPRESAS} empresas — plano {tierLabel}{unlimitedCompanies ? " · consultor" : ""}
        </span>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNew} disabled={limitReached}><Plus className="w-4 h-4 mr-1" /> Nova Empresa</Button>
          </DialogTrigger>
          <DialogContent className="w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
            <DialogHeader>
              <DialogTitle>{editId ? "Editar Empresa" : "Nova Empresa"}</DialogTitle>
            </DialogHeader>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nome da Empresa *</Label>
                <Input value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} placeholder="Ex: AgroNutri Rações Ltda" autoFocus />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={e => setForm(p => ({ ...p, cnpj: e.target.value }))} placeholder="00.000.000/0000-00" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Endereço</Label>
                <Input value={form.endereco} onChange={e => setForm(p => ({ ...p, endereco: e.target.value }))} placeholder="Rua, número, cidade, estado" />
              </div>
              <div className="space-y-2">
                <Label>Responsável Técnico</Label>
                <Input value={form.responsavel_tecnico} onChange={e => setForm(p => ({ ...p, responsavel_tecnico: e.target.value }))} placeholder="Nome do RT" />
              </div>
              <div className="space-y-2">
                <Label>CRMV</Label>
                <Input value={form.crmv} onChange={e => setForm(p => ({ ...p, crmv: e.target.value }))} placeholder="CRMV-XX 00000" />
              </div>
              <div className="space-y-2">
                <Label>Capacidade Produtiva</Label>
                <Input value={form.capacidade} onChange={e => setForm(p => ({ ...p, capacidade: e.target.value }))} placeholder="Ex: 10.000 ton/mês" />
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Tipo de Produção</Label>
                <div className="flex flex-wrap gap-2">
                  {TIPOS.map(t => (
                    <Badge key={t} variant={form.tipo_producao.includes(t) ? "default" : "outline"} className="cursor-pointer select-none" onClick={() => toggleTipo(t)}>
                      {t}
                    </Badge>
                  ))}
                </div>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Origem da Água (POP-04)</Label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { v: "concessionaria", l: "Concessionária (tratada) — cloro semanal" },
                    { v: "poco", l: "Poço/Captação própria — cloro diário" },
                  ].map(opt => (
                    <Badge
                      key={opt.v}
                      variant={form.origem_agua === opt.v ? "default" : "outline"}
                      className="cursor-pointer select-none"
                      onClick={() => setForm(p => ({ ...p, origem_agua: p.origem_agua === opt.v ? "" : opt.v as any }))}
                    >
                      {opt.l}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">Define a periodicidade pré-selecionada de cloro/pH no POP-04.</p>
              </div>
              <div className="md:col-span-2 space-y-2">
                <Label>Prefixo de Nomenclatura de Documentos (opcional)</Label>
                <Input
                  value={form.prefixo_doc}
                  onChange={e => setForm(p => ({ ...p, prefixo_doc: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "").slice(0, 8) }))}
                  placeholder="Ex: FBX, AGRO01, UNID-SP"
                  maxLength={8}
                />
                <p className="text-xs text-muted-foreground">
                  Se preenchido, será adicionado à frente do nome dos documentos anexados. Ex: <code className="text-foreground">FBX_POP-01_PL-001_08-07-2026</code>. Deixe em branco para usar o padrão <code className="text-foreground">POP-01_PL-001_...</code>. Cada empresa mantém sua própria sequência de números independentemente.
                </p>
              </div>
              <div className="md:col-span-2">
                <Button className="w-full" onClick={salvar} disabled={saving}>
                  {saving ? "Salvando..." : editId ? "Atualizar" : "Cadastrar Empresa"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {empresas.length === 0 ? (
        <Card className="border-dashed border-2 bg-muted/30">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-primary/10 p-4 rounded-full mb-4">
              <Building2 className="w-12 h-12 text-primary animate-pulse" />
            </div>
            <h3 className="text-xl font-bold mb-2">Primeiro passo: Cadastre sua empresa</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md">Para começar a usar o Feed_BPF, você precisa cadastrar pelo menos uma unidade fabril. Seus dados serão organizados por empresa.</p>
            <Button size="lg" onClick={openNew} className="shadow-lg"><Plus className="w-5 h-5 mr-2" /> Cadastrar Minha Primeira Empresa</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {empresas.map(e => (
            <Card key={e.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-base">{e.nome}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(e)}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => excluir(e.id)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground space-y-1">
                {e.cnpj && <p><strong>CNPJ:</strong> {e.cnpj}</p>}
                {e.responsavel_tecnico && <p><strong>RT:</strong> {e.responsavel_tecnico} {e.crmv && `(${e.crmv})`}</p>}
                {e.endereco && <p><strong>End.:</strong> {e.endereco}</p>}
                {e.capacidade && <p><strong>Capacidade:</strong> {e.capacidade}</p>}
                {e.tipo_producao && e.tipo_producao.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {e.tipo_producao.map(t => <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>)}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6">
        <DadosRegulatoriosEmpresaSection />
      </div>
    </>
  );
}
