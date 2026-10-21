import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Copy, Check, Megaphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Headline {
  h1: string;
  h2: string;
  impacto: number;
  contexto: string;
}

interface HeadlineGroup {
  abordagem: string;
  headlines: Headline[];
}

export default function GeradorHeadlines() {
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null);
  const [results, setResults] = useState<HeadlineGroup[] | null>(null);

  const [formData, setFormData] = useState({
    oferta: "",
    publico: "",
    problema: "",
    resultado: "",
    diferencial: "",
    prova: ""
  });

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(id);
    toast.success("Copiado para a área de transferência!");
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const generateHeadlines = async () => {
    if (!formData.oferta || !formData.publico) {
      toast.error("Por favor, preencha pelo menos a Oferta e o Público-alvo.");
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-headlines", {
        body: formData
      });

      if (error) throw error;
      setResults(data.groups);
    } catch (error) {
      console.error("Erro ao gerar headlines:", error);
      toast.error("Erro ao conectar com o serviço de IA. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-3">
        <Megaphone className="h-8 w-8 text-primary" />
        <div>
          <h2 className="text-3xl font-bold">Gerador de Headlines Estratégicas</h2>
          <p className="text-muted-foreground">Crie copies de alta conversão para suas landing pages usando IA.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="h-fit">
          <CardHeader>
            <CardTitle>Contexto da Oferta</CardTitle>
            <CardDescription>Preencha os detalhes para que a IA entenda seu negócio.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="oferta">O que está sendo oferecido?</Label>
              <Input 
                id="oferta" 
                placeholder="Ex: Plataforma de gestão para PMEs" 
                value={formData.oferta}
                onChange={(e) => setFormData({...formData, oferta: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="publico">Para quem? (Público-alvo)</Label>
              <Input 
                id="publico" 
                placeholder="Ex: Donos de fábricas de nutrição animal" 
                value={formData.publico}
                onChange={(e) => setFormData({...formData, publico: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="problema">Problema que resolve</Label>
              <Textarea 
                id="problema" 
                placeholder="Ex: Dificuldade em manter conformidade com o MAPA" 
                value={formData.problema}
                onChange={(e) => setFormData({...formData, problema: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado prometido</Label>
              <Input 
                id="resultado" 
                placeholder="Ex: Auditoria aprovada sem apontamentos" 
                value={formData.resultado}
                onChange={(e) => setFormData({...formData, resultado: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diferencial">Diferencial único</Label>
              <Input 
                id="diferencial" 
                placeholder="Ex: Sistema 100% focado no" 
                value={formData.diferencial}
                onChange={(e) => setFormData({...formData, diferencial: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="prova">Prova Social/Números</Label>
              <Input 
                id="prova" 
                placeholder="Ex: Mais de 200 fábricas utilizam" 
                value={formData.prova}
                onChange={(e) => setFormData({...formData, prova: e.target.value})}
              />
            </div>
            <Button className="w-full gap-2 mt-4" onClick={generateHeadlines} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              Gerar 12 Headlines Estratégicas
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {results ? (
            results.map((group, gIdx) => (
              <div key={gIdx} className="space-y-4">
                <h3 className="font-bold text-lg text-primary flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  {group.abordagem}
                </h3>
                {group.headlines.map((h, hIdx) => {
                  const id = `${gIdx}-${hIdx}`;
                  return (
                    <Card key={hIdx} className="hover:border-primary/50 transition-colors group relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => handleCopy(`${h.h1}\n${h.h2}`, id)}>
                           {copiedIndex === id ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                         </Button>
                      </div>
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between mb-1">
                          <Badge variant="outline" className="text-[10px]">{h.contexto}</Badge>
                          <span className="text-xs font-medium text-muted-foreground">Impacto: {h.impacto}/10</span>
                        </div>
                        <CardTitle className="text-base leading-tight">{h.h1}</CardTitle>
                        <CardDescription className="text-xs">{h.h2}</CardDescription>
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            ))
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border border-dashed rounded-xl bg-muted/30">
              <Megaphone className="h-12 w-12 text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-muted-foreground">Nenhuma headline gerada ainda</h3>
              <p className="text-sm text-muted-foreground max-w-[250px]">Preencha o contexto ao lado e clique em gerar para ver a mágica acontecer.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
