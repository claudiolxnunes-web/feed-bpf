import { useState, useEffect } from "react";
import { Package, Plus, Loader2, Edit, Tag, FileText, Trash2, ClipboardList, FlaskConical } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/PageHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import ProdutoForm from "@/components/produtos/ProdutoForm";
import RotuloEditor from "@/components/produtos/RotuloEditor";
import FichaTecnica from "@/components/produtos/FichaTecnica";
import RTPIEditor from "@/components/produtos/RTPIEditor";
import FormulasManager from "@/components/produtos/FormulasManager";

const CLASSIFICACAO_LABELS: Record<string, string> = {
  racao: "Ração",
  suplemento: "Suplemento",
  premix: "Premix",
  nucleo: "Núcleo",
  aditivo: "Aditivo",
  sal_mineral: "Sal Mineral",
};

interface Produto {
  id: string;
  nome: string;
  marca: string;
  classificacao: string;
  especie_alvo: string;
  registro_mapa: string;
  status: string;
}

export default function Produtos() {
  const { user } = useAuth();
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("lista");
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);

  const fetchProdutos = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("produtos")
      .select("id, nome, marca, classificacao, especie_alvo, registro_mapa, status")
      .order("nome");
    if (data) setProdutos(data);
    setLoading(false);
  };

  useEffect(() => { fetchProdutos(); }, [user]);

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("produtos").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Produto excluído"); fetchProdutos(); }
  };

  if (showForm || editingId) {
    return (
      <>
        <PageHeader icon={Package} title={editingId ? "Editar Produto" : "Novo Produto"} description="Cadastro de produto"
        orientacaoModuloId="produtos" />
        <Button variant="outline" size="sm" className="mb-4" onClick={() => { setShowForm(false); setEditingId(null); }}>
          ← Voltar
        </Button>
        <ProdutoForm
          produtoId={editingId}
          onSaved={() => { setShowForm(false); setEditingId(null); fetchProdutos(); }}
        />
      </>
    );
  }

  if (selectedProduto) {
    return (
      <>
        <PageHeader icon={Package} title={selectedProduto.nome} description={CLASSIFICACAO_LABELS[selectedProduto.classificacao] || selectedProduto.classificacao} />
        <Button variant="outline" size="sm" className="mb-4" onClick={() => setSelectedProduto(null)}>
          ← Voltar
        </Button>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="rotulo"><Tag className="w-4 h-4 mr-1" /> Rótulo </TabsTrigger>
            <TabsTrigger value="ficha"><FileText className="w-4 h-4 mr-1" /> Ficha Técnica</TabsTrigger>
            <TabsTrigger value="rtpi"><ClipboardList className="w-4 h-4 mr-1" /> RTPI</TabsTrigger>
            <TabsTrigger value="formulas"><FlaskConical className="w-4 h-4 mr-1" /> Fórmulas</TabsTrigger>
          </TabsList>
          <TabsContent value="rotulo">
            <RotuloEditor produtoId={selectedProduto.id} produtoNome={selectedProduto.nome} />
          </TabsContent>
          <TabsContent value="ficha">
            <FichaTecnica produtoId={selectedProduto.id} />
          </TabsContent>
          <TabsContent value="rtpi">
            <RTPIEditor produtoId={selectedProduto.id} />
          </TabsContent>
          <TabsContent value="formulas">
            <FormulasManager produtoIdFixo={selectedProduto.id} produtoNomeFixo={selectedProduto.nome} />
          </TabsContent>
        </Tabs>
      </>
    );
  }

  return (
    <>
      <PageHeader icon={Package} title="Produtos" description="Cadastro de fórmulas, rótulos e fichas técnicas"  assuntoBaseLegal="rotulagem" />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card><CardContent className="pt-4 text-center">
          <p className="text-2xl font-bold font-display">{produtos.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </CardContent></Card>
        {["racao", "suplemento", "premix"].map((c) => (
          <Card key={c}><CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold font-display text-primary">{produtos.filter((p) => p.classificacao === c).length}</p>
            <p className="text-xs text-muted-foreground">{CLASSIFICACAO_LABELS[c]}</p>
          </CardContent></Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display">Catálogo de Produtos</CardTitle>
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4 mr-1" /> Novo Produto
          </Button>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {loading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : produtos.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produto</TableHead>
                  <TableHead>Marca</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Espécie</TableHead>
                  <TableHead>Reg. MAPA</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {produtos.map((p) => (
                  <TableRow key={p.id} className="cursor-pointer" onClick={() => { setSelectedProduto(p); setActiveTab("rotulo"); }}>
                    <TableCell className="font-medium">{p.nome}</TableCell>
                    <TableCell>{p.marca}</TableCell>
                    <TableCell>
                      <Badge variant="secondary">{CLASSIFICACAO_LABELS[p.classificacao] || p.classificacao}</Badge>
                    </TableCell>
                    <TableCell>{p.especie_alvo}</TableCell>
                    <TableCell className="font-mono text-xs">{p.registro_mapa}</TableCell>
                    <TableCell>
                      <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingId(p.id)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(p.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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
