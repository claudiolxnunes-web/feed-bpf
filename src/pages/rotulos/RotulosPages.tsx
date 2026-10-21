import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Info, Sparkles, Tag, FileText, Layers, Printer, Palette } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Produtos from "@/pages/Produtos";

const PreviewAlert = () => (
  <Alert variant="default" className="bg-teal-500/10 border-teal-500/20 mb-6">
    <Info className="h-4 w-4 text-teal-600" />
    <AlertTitle className="text-teal-700 font-bold">Nutri_Agro Labels — Ambiente Dedicado</AlertTitle>
    <AlertDescription className="text-teal-600">
 Selecione um produto para acessar Rótulo, Ficha Técnica, RTPI e Níveis de Garantia.
 </AlertDescription>
  </Alert>
);

export const RotulosDashboardPage = () => (
  <div className="space-y-6">
    <PreviewAlert />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="p-6 rounded-2xl bg-card border border-border shadow-sm">
        <h4 className="text-sm font-bold text-muted-foreground mb-4 uppercase tracking-widest">Acesso Rápido</h4>
        <div className="space-y-3">
          <Button asChild className="w-full justify-start gap-3" variant="outline">
            <Link to="/rotulos/editor"><Tag className="h-4 w-4 text-teal-600" /> Editor de Rótulos</Link>
          </Button>
          <Button asChild className="w-full justify-start gap-3" variant="outline">
            <Link to="/rotulos/rtpi"><FileText className="h-4 w-4 text-teal-600" /> Ficha Técnica RTPI</Link>
          </Button>
          <Button asChild className="w-full justify-start gap-3" variant="outline">
            <Link to="/rotulos/niveis"><Layers className="h-4 w-4 text-teal-600" /> Níveis de Garantia</Link>
          </Button>
        </div>
      </div>
      <div className="md:col-span-2 p-12 flex flex-col items-center justify-center text-center border-2 border-dashed rounded-2xl bg-teal-500/[0.02]">
        <Sparkles className="h-12 w-12 text-teal-200 mb-4" />
        <h3 className="text-xl font-bold mb-2 text-foreground">Gerador de Rótulos</h3>
        <p className="text-muted-foreground max-w-md mb-4">
 Cadastre seus produtos e gere rótulos comerciais para exportação em Zebra (ZPL), Word e Excel.
 </p>
        <Button asChild>
          <Link to="/rotulos/editor">Acessar Cadastro de Produtos</Link>
        </Button>
      </div>
    </div>
  </div>
);

// Editor de Rótulos: usa o gerador completo (HTML standalone validado pelo cliente)
// servido em /rotulos-editor.html para garantir paridade visual e funcional 1:1.
export const RotulosEditorPage = () => (
  <div className="-m-4 sm:-m-6 lg:-m-8 h-[calc(100vh-4rem)]">
    <iframe
      src="/rotulos-editor.html"
      title="Gerador de Rótulo — Alimentos para Animais"
      className="w-full h-full border-0 block"
      allow="clipboard-read; clipboard-write"
    />
  </div>
);
export const RotulosRTPIPage = () => <Produtos />;
export const RotulosNiveisPage = () => <Produtos />;
export const RotulosTemplatesPage = () => <Produtos />;

export const RotulosZebraPage = () => (
  <div className="max-w-3xl mx-auto space-y-6">
    <div className="p-8 rounded-2xl bg-card border border-border">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-12 w-12 rounded-full bg-teal-500/10 flex items-center justify-center">
          <Printer className="h-6 w-6 text-teal-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Configuração Zebra (ZPL)</h2>
          <p className="text-sm text-muted-foreground">Impressão direta nas impressoras térmicas Zebra.</p>
        </div>
      </div>
      <div className="space-y-3 text-sm text-muted-foreground">
        <p>1. Conecte sua impressora Zebra via USB ou rede.</p>
        <p>2. Acesse <Link to="/rotulos/editor" className="text-teal-600 underline">Editor de Rótulos</Link>, selecione o produto desejado e abra a aba <strong>Rótulo </strong>.</p>
        <p>3. Use o botão <strong>Exportar ZPL</strong> dentro do editor para baixar o comando e enviar à impressora.</p>
      </div>
      <Button asChild className="mt-6">
        <Link to="/rotulos/editor">Ir para o Editor</Link>
      </Button>
    </div>
  </div>
);

// Compat: alguns imports antigos podem usar GenericModule. Mantemos como alias do dashboard.
export const GenericModule = ({ name }: { name?: string; icon?: any }) => <RotulosDashboardPage />;
