// Componentes plug-and-play para as novas tabelas MAPA (Sprint 1+2).
// Cada export é uma Card autônoma que pode ser plugada em qualquer página existente
// sem alterar layouts/módulos. Filtram automaticamente por empresa ativa.

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, FlaskConical, FileText, MapPin, Stethoscope, Beaker, Timer } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import FileUpload from "@/components/FileUpload";
import { BaseLegalBadge } from "@/components/BaseLegalBadge";

// Helper genérico CRUD
function useCrud<T extends { id: string; empresa_id?: string | null }>(tabela: string) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [rows, setRows] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);

  const fetch = async () => {
    setLoading(true);
    let q = (supabase.from(tabela as any) as any).select("*").order("created_at", { ascending: false });
    if (empresaAtiva) q = q.eq("empresa_id", empresaAtiva.id);
    const { data, error } = await q;
    if (error) toast.error("Erro: " + error.message);
    else setRows((data ?? []) as T[]);
    setLoading(false);
  };

  useEffect(() => {
    fetch(); /* eslint-disable-next-line */
  }, [empresaAtiva?.id]);

  const insert = async (payload: Record<string, any>) => {
    const { error } = await (supabase.from(tabela as any) as any).insert({
      ...payload,
      user_id: user?.id,
      empresa_id: empresaAtiva?.id ?? null,
    });
    if (error) {
      toast.error("Erro: " + error.message);
      return false;
    }
    toast.success("Registro salvo!");
    fetch();
    return true;
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este registro?")) return;
    const { error } = await (supabase.from(tabela as any) as any).delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else {
      toast.success("Excluído");
      fetch();
    }
  };

  return { rows, loading, insert, remove, refetch: fetch };
}

// === 1) AMOSTRAS DE RETENÇÃO (plugar em Rastreabilidade) ===
export function AmostrasRetencaoSection() {
  const { rows, insert, remove } = useCrud<any>("amostras_retencao");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await insert({
      data_coleta: fd.get("data_coleta"),
      produto: fd.get("produto"),
      lote: fd.get("lote"),
      quantidade_g: Number(fd.get("quantidade_g")) || null,
      local_armazenamento: fd.get("local_armazenamento"),
      responsavel_coleta: fd.get("responsavel_coleta"),
      prazo_descarte: fd.get("prazo_descarte") || null,
    });
    if (ok) setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="w-4 h-4" /> Amostras de Retenção (MAPA)
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova Amostra
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Amostra de Retenção</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Data Coleta</Label>
                  <Input type="date" name="data_coleta" defaultValue={new Date().toISOString().slice(0, 10)} required />
                </div>
                <div>
                  <Label>Qtd (g)</Label>
                  <Input type="number" name="quantidade_g" step="0.01" />
                </div>
              </div>
              <div>
                <Label>Produto</Label>
                <Input name="produto" required />
              </div>
              <div>
                <Label>Lote</Label>
                <Input name="lote" required />
              </div>
              <div>
                <Label>Local de Armazenamento</Label>
                <Input name="local_armazenamento" placeholder="Câmara fria 02, prateleira 3" />
              </div>
              <div>
                <Label>Responsável pela Coleta</Label>
                <Input name="responsavel_coleta" />
              </div>
              <div>
                <Label>Prazo de Descarte</Label>
                <Input type="date" name="prazo_descarte" />
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Lote</TableHead>
              <TableHead>Local</TableHead>
              <TableHead>Descarte</TableHead>
              <TableHead>Status</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.data_coleta}</TableCell>
                <TableCell>{r.produto}</TableCell>
                <TableCell className="font-mono text-xs">{r.lote}</TableCell>
                <TableCell className="text-xs">{r.local_armazenamento}</TableCell>
                <TableCell className="text-xs">{r.prazo_descarte ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant={r.status === "descartada" ? "secondary" : "default"}>{r.status}</Badge>
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground text-sm">
                  Nenhuma amostra registrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// === 2) RECEITUÁRIOS DE MEDICAMENTOS (plugar em ControleSubstancias) ===
export function ReceituariosMedSection() {
  const { rows, insert, remove } = useCrud<any>("receituarios_medicamentos");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await insert({
      data_emissao: fd.get("data_emissao"),
      numero_receita: fd.get("numero_receita"),
      medico_veterinario: fd.get("medico_veterinario"),
      crmv: fd.get("crmv"),
      uf_crmv: fd.get("uf_crmv"),
      produto: fd.get("produto"),
      lote_op: fd.get("lote_op"),
      principio_ativo: fd.get("principio_ativo"),
      dosagem: fd.get("dosagem"),
      especie_destino: fd.get("especie_destino"),
      validade_receita: fd.get("validade_receita") || null,
    });
    if (ok) setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Stethoscope className="w-4 h-4" /> Receituários de Medicamentos
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova Receita
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Novo Receituário</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Data Emissão</Label>
                  <Input
                    type="date"
                    name="data_emissao"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div>
                  <Label>Nº Receita</Label>
                  <Input name="numero_receita" />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input type="date" name="validade_receita" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <Label>Médico Veterinário</Label>
                  <Input name="medico_veterinario" required />
                </div>
                <div className="grid grid-cols-2 gap-1">
                  <div>
                    <Label>CRMV</Label>
                    <Input name="crmv" required />
                  </div>
                  <div>
                    <Label>UF</Label>
                    <Input name="uf_crmv" maxLength={2} />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Produto</Label>
                  <Input name="produto" required />
                </div>
                <div>
                  <Label>Lote / OP</Label>
                  <Input name="lote_op" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Princípio Ativo</Label>
                  <Input name="principio_ativo" />
                </div>
                <div>
                  <Label>Dosagem</Label>
                  <Input name="dosagem" />
                </div>
                <div>
                  <Label>Espécie</Label>
                  <Input name="especie_destino" placeholder="Aves, Suínos..." />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Data</TableHead>
              <TableHead>Nº</TableHead>
              <TableHead>MV / CRMV</TableHead>
              <TableHead>Produto</TableHead>
              <TableHead>Lote/OP</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.data_emissao}</TableCell>
                <TableCell className="text-xs">{r.numero_receita}</TableCell>
                <TableCell className="text-xs">
                  {r.medico_veterinario}{" "}
                  <span className="text-muted-foreground">
                    / {r.crmv}-{r.uf_crmv}
                  </span>
                </TableCell>
                <TableCell>{r.produto}</TableCell>
                <TableCell className="font-mono text-xs">{r.lote_op}</TableCell>
                <TableCell className="text-xs">{r.validade_receita ?? "-"}</TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground text-sm">
                  Nenhum receituário registrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// === 3) PRODUTOS QUÍMICOS — Cadastro (plugar em Pragas) ===
export function ProdutosQuimicosSection() {
  const { rows, insert, remove } = useCrud<any>("produtos_quimicos_cadastro");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await insert({
      nome_comercial: fd.get("nome_comercial"),
      principio_ativo: fd.get("principio_ativo"),
      fabricante: fd.get("fabricante"),
      registro_mapa: fd.get("registro_mapa"),
      registro_anvisa: fd.get("registro_anvisa"),
      validade_registro: fd.get("validade_registro") || null,
      categoria: fd.get("categoria"),
      local_armazenamento: fd.get("local_armazenamento"),
    });
    if (ok) setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Beaker className="w-4 h-4" /> Cadastro de Produtos Químicos (FISPQ / Registro)
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Novo Produto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Cadastro de Produto Químico</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Nome Comercial</Label>
                <Input name="nome_comercial" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Princípio Ativo</Label>
                  <Input name="principio_ativo" />
                </div>
                <div>
                  <Label>Fabricante</Label>
                  <Input name="fabricante" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label>Registro MAPA</Label>
                  <Input name="registro_mapa" />
                </div>
                <div>
                  <Label>Registro ANVISA</Label>
                  <Input name="registro_anvisa" />
                </div>
                <div>
                  <Label>Validade</Label>
                  <Input type="date" name="validade_registro" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Categoria</Label>
                  <Input name="categoria" placeholder="Inseticida, Sanitizante..." />
                </div>
                <div>
                  <Label>Local Armazenamento</Label>
                  <Input name="local_armazenamento" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nome</TableHead>
              <TableHead>P.A.</TableHead>
              <TableHead>Reg. MAPA</TableHead>
              <TableHead>Validade</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-medium">{r.nome_comercial}</TableCell>
                <TableCell className="text-xs">{r.principio_ativo}</TableCell>
                <TableCell className="text-xs">{r.registro_mapa}</TableCell>
                <TableCell className="text-xs">{r.validade_registro ?? "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline">{r.categoria}</Badge>
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground text-sm">
                  Nenhum produto químico cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// === 4) MAPA DE ISCAS/ARMADILHAS (plugar em Pragas) ===
export function MapaIscasSection() {
  const { rows, insert, remove } = useCrud<any>("mapa_iscas_armadilhas");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await insert({
      codigo: fd.get("codigo"),
      tipo: fd.get("tipo"),
      localizacao: fd.get("localizacao"),
      setor: fd.get("setor"),
      coordenadas: fd.get("coordenadas"),
      periodicidade_dias: Number(fd.get("periodicidade_dias")) || 30,
    });
    if (ok) setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-4 h-4" /> Mapa de Iscas / Armadilhas
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Novo Ponto
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Ponto de Monitoramento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Código</Label>
                  <Input name="codigo" placeholder="A-01" required />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <Input name="tipo" placeholder="Isca, Armadilha luminosa..." required />
                </div>
              </div>
              <div>
                <Label>Localização</Label>
                <Input name="localizacao" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Setor</Label>
                  <Input name="setor" />
                </div>
                <div>
                  <Label>Coordenadas / Ref.</Label>
                  <Input name="coordenadas" />
                </div>
              </div>
              <div>
                <Label>Periodicidade (dias)</Label>
                <Input type="number" name="periodicidade_dias" defaultValue={30} />
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Código</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Localização</TableHead>
              <TableHead>Setor</TableHead>
              <TableHead>Periodicidade</TableHead>
              <TableHead>Inspeções</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id}>
                <TableCell className="font-mono text-xs">{r.codigo}</TableCell>
                <TableCell>{r.tipo}</TableCell>
                <TableCell className="text-xs">{r.localizacao}</TableCell>
                <TableCell className="text-xs">{r.setor}</TableCell>
                <TableCell className="text-xs">{r.periodicidade_dias} dias</TableCell>
                <TableCell>
                  <InspecoesIscaInline pontoId={r.id} />
                </TableCell>
                <TableCell>
                  <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="text-center text-muted-foreground text-sm">
                  Nenhum ponto cadastrado
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// Sub-componente: registro rápido de inspeção numa isca/armadilha
function InspecoesIscaInline({ pontoId }: { pontoId: string }) {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState<number>(0);
  const [ultima, setUltima] = useState<string | null>(null);

  const load = async () => {
    const { data } = await (supabase.from("inspecoes_iscas" as any) as any)
      .select("data_inspecao", { count: "exact" })
      .eq("ponto_id", pontoId)
      .order("data_inspecao", { ascending: false })
      .limit(1);
    if (data && data.length > 0) setUltima(data[0].data_inspecao);
    const { count: c } = await (supabase.from("inspecoes_iscas" as any) as any)
      .select("id", { count: "exact", head: true })
      .eq("ponto_id", pontoId);
    setCount(c ?? 0);
  };
  useEffect(() => {
    load(); /* eslint-disable-next-line */
  }, [pontoId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const { error } = await (supabase.from("inspecoes_iscas" as any) as any).insert({
      user_id: user?.id,
      empresa_id: empresaAtiva?.id ?? null,
      ponto_id: pontoId,
      data_inspecao: fd.get("data_inspecao"),
      situacao: fd.get("situacao"),
      acao_corretiva: fd.get("acao_corretiva"),
      observacoes: fd.get("observacoes"),
    });
    if (error) {
      toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Inspeção registrada");
    setOpen(false);
    load();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          {count} {ultima ? `(últ. ${new Date(ultima).toLocaleDateString("pt-BR")})` : ""}
          <Plus className="w-3 h-3 ml-1" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Inspeção</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label>Data</Label>
            <Input type="date" name="data_inspecao" defaultValue={new Date().toISOString().slice(0, 10)} required />
          </div>
          <div>
            <Label>Situação</Label>
            <select name="situacao" className="w-full border rounded p-2 text-sm" defaultValue="integra">
              <option value="integra">Íntegra / Sem captura</option>
              <option value="captura">Com captura</option>
              <option value="violada">Violada / Avariada</option>
              <option value="reposicao">Necessitou reposição</option>
            </select>
          </div>
          <div>
            <Label>Ação Corretiva</Label>
            <Input name="acao_corretiva" placeholder="Repor isca, substituir armadilha..." />
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea name="observacoes" rows={2} />
          </div>
          <Button type="submit" className="w-full">
            Salvar Inspeção
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// === 5) TEMPOS DE MISTURA VALIDADOS (plugar em PCP) ===
export function TemposMisturaSection() {
  const { rows, insert, remove } = useCrud<any>("tempos_mistura_validados");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const ok = await insert({
      nome_formula: fd.get("nome_formula"),
      tempo_mistura_seg: Number(fd.get("tempo_mistura_seg")),
      cv_homogeneidade: Number(fd.get("cv_homogeneidade")) || null,
      data_validacao: fd.get("data_validacao"),
      proxima_validacao: fd.get("proxima_validacao") || null,
      metodo: fd.get("metodo"),
      responsavel: fd.get("responsavel"),
    });
    if (ok) setOpen(false);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-4 h-4" /> Tempos de Mistura Validados (CV%)
        </CardTitle>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              Nova Validação
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Validação de Tempo de Mistura</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label>Fórmula / Produto</Label>
                <Input name="nome_formula" required />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Tempo Ideal (seg)</Label>
                  <Input type="number" name="tempo_mistura_seg" required />
                </div>
                <div>
                  <Label>CV Homogeneidade (%)</Label>
                  <Input type="number" step="0.01" name="cv_homogeneidade" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Data Validação</Label>
                  <Input
                    type="date"
                    name="data_validacao"
                    defaultValue={new Date().toISOString().slice(0, 10)}
                    required
                  />
                </div>
                <div>
                  <Label>Próxima Validação</Label>
                  <Input type="date" name="proxima_validacao" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Método</Label>
                  <Input name="metodo" placeholder="Microtraçador, Cloreto..." />
                </div>
                <div>
                  <Label>Responsável</Label>
                  <Input name="responsavel" />
                </div>
              </div>
              <Button type="submit" className="w-full">
                Salvar
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fórmula</TableHead>
              <TableHead>Tempo (s)</TableHead>
              <TableHead>CV%</TableHead>
              <TableHead>Validação</TableHead>
              <TableHead>Próxima</TableHead>
              <TableHead></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const cvOk = r.cv_homogeneidade != null && r.cv_homogeneidade <= 10;
              return (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nome_formula}</TableCell>
                  <TableCell className="font-mono">{r.tempo_mistura_seg}s</TableCell>
                  <TableCell>
                    {r.cv_homogeneidade != null ? (
                      <Badge className={cvOk ? "bg-green-600" : "bg-orange-600"}>{r.cv_homogeneidade}%</Badge>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell className="text-xs">{r.data_validacao}</TableCell>
                  <TableCell className="text-xs">{r.proxima_validacao ?? "-"}</TableCell>
                  <TableCell>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground text-sm">
                  Nenhuma validação registrada
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

// === 6) DADOS REGULATÓRIOS DA EMPRESA (SIPEAGRO + Autorização Medicamentos) ===
export function DadosRegulatoriosEmpresaSection() {
  const { empresaAtiva } = useEmpresa();
  const [empresa, setEmpresa] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [fabricaMed, setFabricaMed] = useState(false);
  const [arquivoAut, setArquivoAut] = useState<string | null>(null);
  useEffect(() => {
    if (!empresaAtiva) return;
    (async () => {
      const { data } = await supabase.from("empresas").select("*").eq("id", empresaAtiva.id).single();
      setEmpresa(data);
      setFabricaMed(!!(data as any)?.fabrica_medicamentos);
      setArquivoAut((data as any)?.arquivo_autorizacao_medicamentos ?? null);
    })();
  }, [empresaAtiva?.id]);

  if (!empresaAtiva) {
    return (
      <Card>
        <CardContent className="p-6 text-center text-sm text-muted-foreground">Selecione uma empresa.</CardContent>
      </Card>
    );
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const fd = new FormData(e.currentTarget);
    const atividades = String(fd.get("atividades_sipeagro") || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const { error } = await (supabase.from("empresas") as any)
      .update({
        numero_sipeagro: fd.get("numero_sipeagro"),
        validade_registro_sipeagro: fd.get("validade_registro_sipeagro") || null,
        atividades_sipeagro: atividades.length ? atividades : null,
        fabrica_medicamentos: fabricaMed,
        data_autorizacao_medicamentos: fd.has("data_autorizacao_medicamentos")
          ? fd.get("data_autorizacao_medicamentos") || null
          : (empresa?.data_autorizacao_medicamentos ?? null),
        arquivo_autorizacao_medicamentos: arquivoAut,
        autorizacao_medicamentos: fd.has("autorizacao_medicamentos")
          ? fd.get("autorizacao_medicamentos")
          : (empresa?.autorizacao_medicamentos ?? null),
        validade_autorizacao_medicamentos: fd.has("validade_autorizacao_medicamentos")
          ? fd.get("validade_autorizacao_medicamentos") || null
          : (empresa?.validade_autorizacao_medicamentos ?? null),
      })
      .eq("id", empresaAtiva.id);
    setSaving(false);
    if (error) toast.error("Erro: " + error.message);
    else toast.success("Dados regulatórios atualizados!");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-4 h-4" /> Registro SIPEAGRO & Autorização MAPA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-3" key={empresa?.id}>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nº Registro SIPEAGRO</Label>
              <Input name="numero_sipeagro" defaultValue={empresa?.numero_sipeagro ?? ""} />
            </div>
            <div>
              <Label>Validade do Registro</Label>
              <Input
                type="date"
                name="validade_registro_sipeagro"
                defaultValue={empresa?.validade_registro_sipeagro ?? ""}
              />
            </div>
          </div>
          <div>
            <Label>Atividades Registradas (separadas por vírgula)</Label>
            <Textarea
              name="atividades_sipeagro"
              defaultValue={(empresa?.atividades_sipeagro ?? []).join(", ")}
              rows={2}
              placeholder="Fabricação de ração, Pré-mistura..."
            />
          </div>
          <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30">
            <input
              id="fabrica_medicamentos"
              type="checkbox"
              className="h-4 w-4"
              checked={fabricaMed}
              onChange={(e) => setFabricaMed(e.target.checked)}
            />
            <Label htmlFor="fabrica_medicamentos">Fabrica com medicamentos?</Label>
            <BaseLegalBadge assunto="alimentos_medicados" className="ml-auto" />
          </div>
          {fabricaMed && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Nº da autorização do MAPA</Label>
                  <Input name="autorizacao_medicamentos" defaultValue={empresa?.autorizacao_medicamentos ?? ""} />
                </div>
                <div>
                  <Label>Data da autorização</Label>
                  <Input
                    type="date"
                    name="data_autorizacao_medicamentos"
                    defaultValue={empresa?.data_autorizacao_medicamentos ?? ""}
                  />
                </div>
                <div>
                  <Label>Validade da autorização</Label>
                  <Input
                    type="date"
                    name="validade_autorizacao_medicamentos"
                    defaultValue={empresa?.validade_autorizacao_medicamentos ?? ""}
                  />
                </div>
              </div>
              <FileUpload
                folder="autorizacao-medicamentos"
                empresaId={empresaAtiva.id}
                label="Documento da autorização"
                currentUrl={arquivoAut}
                onUploadComplete={(url) => setArquivoAut(url)}
              />
            </div>
          )}
          <Button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar Dados Regulatórios"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
