import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Plus, Stethoscope, ShieldCheck, AlertTriangle } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { validadePadraoReceita, receitaValida, revisaoVencida, programaVigente } from "./regras";

/** Lista registros da empresa ativa numa tabela de medicados. */
function useLista(tabela: "receitas_medicados" | "programas_sanitarios") {
  const { empresaAtiva } = useEmpresa();
  const [rows, setRows] = useState<any[]>([]);
  const carregar = async () => {
    let q = (supabase.from(tabela) as any).select("*").order("created_at", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await q;
    if (error) toast.error("Erro: " + error.message);
    else setRows(data ?? []);
  };
  useEffect(() => { carregar(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [empresaAtiva?.id]);
  return { rows, carregar };
}

const hoje = () => new Date().toISOString().slice(0, 10);

export function ReceitasMedicadosSection() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const { rows, carregar } = useLista("receitas_medicados");
  const [open, setOpen] = useState(false);
  const [emissao, setEmissao] = useState(hoje());
  const [validade, setValidade] = useState(validadePadraoReceita(hoje()));
  const [finalidade, setFinalidade] = useState("tratamento");
  const [arquivo, setArquivo] = useState<string | null>(null);

  const salvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => String(fd.get(k) ?? "").trim();
    const { error } = await supabase.from("receitas_medicados").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id ?? null,
      numero: g("numero"), data_emissao: emissao, validade,
      medico_veterinario: g("medico_veterinario"), crmv: g("crmv"), cliente: g("cliente"),
      especie: g("especie"), principio_ativo: g("principio_ativo"), dose: g("dose"),
      finalidade, arquivo, status: "vigente",
    });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Receita registrada");
    setOpen(false); setArquivo(null); carregar();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base"><Stethoscope className="w-4 h-4" /> Receitas de Medicados <BaseLegalBadge assunto="alimentos_medicados" /></CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Nova Receita</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Nova receita (tratamento ou metafilaxia)</DialogTitle></DialogHeader>
            <form onSubmit={salvar} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <div><Label>Nº da receita *</Label><Input name="numero" required /></div>
                <div><Label>Emissão *</Label><Input type="date" value={emissao} required onChange={(e) => { setEmissao(e.target.value); setValidade(validadePadraoReceita(e.target.value)); }} /></div>
                <div><Label>Validade *</Label><Input type="date" value={validade} min={emissao} required onChange={(e) => setValidade(e.target.value)} /><p className="text-[10px] text-muted-foreground">Padrão: emissão + 10 dias</p></div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div><Label>Médico veterinário *</Label><Input name="medico_veterinario" required /></div>
                <div><Label>CRMV *</Label><Input name="crmv" required /></div>
                <div><Label>Cliente *</Label><Input name="cliente" required /></div>
                <div><Label>Espécie *</Label><Input name="especie" required placeholder="Aves, Suínos..." /></div>
                <div><Label>Princípio ativo *</Label><Input name="principio_ativo" required /></div>
                <div><Label>Dose *</Label><Input name="dose" required /></div>
              </div>
              <div><Label>Finalidade *</Label>
                <Select value={finalidade} onValueChange={setFinalidade}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent><SelectItem value="tratamento">Tratamento</SelectItem><SelectItem value="metafilaxia">Metafilaxia</SelectItem></SelectContent>
                </Select>
              </div>
              <FileUpload folder="receitas-medicados" empresaId={empresaAtiva?.id} label="Anexar receita" onUploadComplete={(url) => setArquivo(url)} />
              <p className="text-[10px] text-muted-foreground">Após salvar, a receita não pode ser editada nem excluída; correções via Não Conformidade.</p>
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="overflow-x-auto">
        <Table>
          <TableHeader><TableRow><TableHead>Nº</TableHead><TableHead>Emissão</TableHead><TableHead>Validade</TableHead><TableHead>Cliente / Espécie</TableHead><TableHead>Princípio ativo</TableHead><TableHead>Finalidade</TableHead><TableHead>Situação</TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="text-xs">{r.arquivo ? <a href={r.arquivo} target="_blank" rel="noreferrer" className="underline">{r.numero}</a> : r.numero}</TableCell>
                <TableCell className="text-xs">{r.data_emissao}</TableCell>
                <TableCell className="text-xs">{r.validade}</TableCell>
                <TableCell className="text-xs">{r.cliente} / {r.especie}</TableCell>
                <TableCell className="text-xs">{r.principio_ativo} — {r.dose}</TableCell>
                <TableCell className="text-xs capitalize">{r.finalidade}</TableCell>
                <TableCell>{receitaValida(r) ? <Badge className="bg-primary/20 text-primary">Válida</Badge> : <Badge variant="destructive">{r.status === "cancelada" ? "Cancelada" : "Vencida"}</Badge>}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground text-sm">Nenhuma receita registrada</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function ProgramasSanitariosSection() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const { rows, carregar } = useLista("programas_sanitarios");
  const [open, setOpen] = useState(false);
  const [arquivo, setArquivo] = useState<string | null>(null);

  const salvar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user) return;
    const fd = new FormData(e.currentTarget);
    const g = (k: string) => String(fd.get(k) ?? "").trim();
    const { error } = await supabase.from("programas_sanitarios").insert({
      user_id: user.id, empresa_id: empresaAtiva?.id ?? null,
      nome: g("nome"), cliente: g("cliente"), especie: g("especie"), principio_ativo: g("principio_ativo"),
      dose: g("dose") || null, medico_veterinario: g("medico_veterinario"), crmv: g("crmv"),
      data_inicio: g("data_inicio"), data_ultima_revisao: g("data_ultima_revisao"), arquivo, status: "ativo",
    });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Programa sanitário registrado");
    setOpen(false); setArquivo(null); carregar();
  };

  const registrarRevisao = async (id: string) => {
    const { error } = await supabase.from("programas_sanitarios").update({ data_ultima_revisao: hoje() }).eq("id", id);
    if (error) toast.error("Erro: " + error.message); else { toast.success("Revisão registrada"); carregar(); }
  };

  const vencidos = rows.filter((p) => p.status === "ativo" && revisaoVencida(p.data_ultima_revisao)).length;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between gap-2">
        <CardTitle className="flex items-center gap-2 text-base"><ShieldCheck className="w-4 h-4" /> Programas Sanitários (profilaxia) <BaseLegalBadge assunto="alimentos_medicados" /></CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild><Button size="sm"><Plus className="w-4 h-4 mr-1" />Novo Programa</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>Novo programa sanitário</DialogTitle></DialogHeader>
            <form onSubmit={salvar} className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="md:col-span-2"><Label>Nome do programa *</Label><Input name="nome" required /></div>
                <div><Label>Cliente *</Label><Input name="cliente" required /></div>
                <div><Label>Espécie *</Label><Input name="especie" required /></div>
                <div><Label>Princípio ativo *</Label><Input name="principio_ativo" required /></div>
                <div><Label>Dose</Label><Input name="dose" /></div>
                <div><Label>Médico veterinário *</Label><Input name="medico_veterinario" required /></div>
                <div><Label>CRMV *</Label><Input name="crmv" required /></div>
                <div><Label>Início *</Label><Input type="date" name="data_inicio" required defaultValue={hoje()} /></div>
                <div><Label>Última revisão *</Label><Input type="date" name="data_ultima_revisao" required defaultValue={hoje()} /></div>
              </div>
              <FileUpload folder="programas-sanitarios" empresaId={empresaAtiva?.id} label="Anexar programa" onUploadComplete={(url) => setArquivo(url)} />
              <Button type="submit" className="w-full">Salvar</Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent className="space-y-3 overflow-x-auto">
        {vencidos > 0 && (
          <div role="alert" className="flex items-center gap-2 p-2 rounded border border-destructive/40 bg-destructive/10 text-xs text-destructive">
            <AlertTriangle className="w-4 h-4" /> {vencidos} programa(s) com última revisão há mais de 6 meses. Revise antes de usar em ordens de produção.
          </div>
        )}
        <Table>
          <TableHeader><TableRow><TableHead>Programa</TableHead><TableHead>Cliente / Espécie</TableHead><TableHead>Princípio ativo</TableHead><TableHead>Última revisão</TableHead><TableHead>Situação</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {rows.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="text-xs">{p.arquivo ? <a href={p.arquivo} target="_blank" rel="noreferrer" className="underline">{p.nome}</a> : p.nome}</TableCell>
                <TableCell className="text-xs">{p.cliente} / {p.especie}</TableCell>
                <TableCell className="text-xs">{p.principio_ativo}</TableCell>
                <TableCell className="text-xs">{p.data_ultima_revisao}</TableCell>
                <TableCell>{programaVigente(p) ? <Badge className="bg-primary/20 text-primary">Vigente</Badge> : <Badge variant="destructive">{p.status === "encerrado" ? "Encerrado" : "Revisão vencida"}</Badge>}</TableCell>
                <TableCell>{p.status === "ativo" && <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => registrarRevisao(p.id)}>Registrar revisão hoje</Button>}</TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground text-sm">Nenhum programa registrado</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
