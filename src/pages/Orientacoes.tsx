import { textoTela } from "@/lib/textoTela";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ORIENTACOES, ORIENTACOES_POR_POP } from "@/config/orientacoesConfig";
import { OrientacaoModulo } from "@/components/OrientacaoModulo";
import { Search, BookOpen, ArrowLeft, GraduationCap } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const POP_ORDEM = ["POP-01", "POP-02", "POP-03", "POP-04", "POP-05", "POP-06", "POP-07", "POP-08", "POP-09", "POP-10", "AUX"];

const POP_LABEL: Record<string, string> = {
  "AUX": "Auxiliares & Operacionais",
};

export default function Orientacoes() {
  const [busca, setBusca] = useState("");
  const [moduloSelecionado, setModuloSelecionado] = useState<string | null>(null);

  const filtrados = ORIENTACOES.filter(
    (m) =>
      m.titulo.toLowerCase().includes(busca.toLowerCase()) ||
      m.descricao.toLowerCase().includes(busca.toLowerCase()) ||
      m.codigo.toLowerCase().includes(busca.toLowerCase())
  );

  if (moduloSelecionado) {
    const modulo = ORIENTACOES.find((m) => m.id === moduloSelecionado);
    if (modulo) {
      return (
        <div className="space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setModuloSelecionado(null)} className="-ml-2">
            <ArrowLeft className="w-4 h-4 mr-1" />Voltar à Central
          </Button>
          <OrientacaoModulo modulo={modulo} />
        </div>
      );
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Central de Orientações"
        description="Tutoriais passo-a-passo e simuladores sandbox para todos os módulos do sistema. Aprenda sem medo de errar — nada é salvo no banco."
        icon={GraduationCap}
      />

      <Card className="bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <BookOpen className="w-10 h-10 text-primary shrink-0" />
            <div className="flex-1 space-y-2">
              <h3 className="font-semibold text-lg">Como usar esta central</h3>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Escolha o módulo que deseja aprender, organizado por POP.</li>
                <li>Leia o <strong>Tutorial</strong> com passo-a-passo e base legal</li>
                <li>Use a <strong>Simulação</strong> sandbox para testar sem afetar dados reais</li>
                <li>Quando estiver confiante, clique em "Ir ao módulo" para usar de verdade</li>
              </ol>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Buscar módulo (ex: rastreabilidade, fornecedor, recall...)"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          className="pl-9"
        />
      </div>

      {busca ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtrados.map((m) => (
            <ModuloCard key={m.id} modulo={m} onClick={() => setModuloSelecionado(m.id)} />
          ))}
          {filtrados.length === 0 && (
            <p className="col-span-full text-center text-muted-foreground py-8">Nenhum módulo encontrado.</p>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {POP_ORDEM.map((pop) => {
            const modulos = ORIENTACOES_POR_POP[pop] || [];
            if (modulos.length === 0) return null;
            return (
              <div key={pop} className="space-y-3">
                <h2 className="font-display text-xl font-semibold flex items-center gap-2">
                  <Badge variant="default">{pop}</Badge>
                  <span className="text-muted-foreground">
                    {POP_LABEL[pop] ? `— ${POP_LABEL[pop]} · ` : "— "}
                    {modulos.length} módulo{modulos.length > 1 ? "s" : ""}
                  </span>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {modulos.map((m) => (
                    <ModuloCard key={m.id} modulo={m} onClick={() => setModuloSelecionado(m.id)} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModuloCard({ modulo, onClick }: { modulo: typeof ORIENTACOES[0]; onClick: () => void }) {
  return (
    <Card
      onClick={onClick}
      className="cursor-pointer hover:border-primary/50 hover:shadow-md transition-all"
    >
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{modulo.titulo}</CardTitle>
        <CardDescription className="text-xs line-clamp-2">{textoTela(modulo.descricao)}</CardDescription>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center justify-between">
          <Badge variant="outline" className="text-xs">{modulo.passos.length} passos</Badge>
          <span className="text-xs text-primary font-medium">Abrir →</span>
        </div>
      </CardContent>
    </Card>
  );
}
