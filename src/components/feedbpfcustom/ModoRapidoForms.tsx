import { useMemo, useState } from "react";
import { Sparkles, Wand2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { POPS_CUSTOM, sugerirPopPorNome, type CampoModelo, type CampoTipo } from "@/config/feedBpfCustomConfig";
import { toast } from "sonner";

export interface ModoRapidoFormsProps {
  empresaId: string;
  userId: string;
  /** Chamado com o id do modelo recém-criado, para seleção automática. */
  onModeloCriado: (modeloId: string) => void;
}

function slugId(nome: string): string {
  return (
    nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "") || `campo_${Math.random().toString(36).slice(2, 7)}`
  );
}

/** Inferência simples de tipo a partir do título da pergunta. */
function inferirTipo(titulo: string): CampoTipo {
  const t = titulo.toLowerCase();
  if (/(data|dia|quando)/.test(t)) return "data";
  if (/(hora|horário|horario)/.test(t)) return "texto";
  if (/(quantidade|qtd|peso|temperatura|ph|cloro|número|numero|nº|valor|dose)/.test(t)) return "numero";
  if (/(conforme|ok\?|houve|possui|existe|sim\/não|sim\/nao|checou|verificado)/.test(t)) return "checkbox";
  return "texto";
}

export function ModoRapidoForms({ empresaId, userId, onModeloCriado }: ModoRapidoFormsProps) {
  const [nome, setNome] = useState("");
  const [popCodigo, setPopCodigo] = useState("");
  const [perguntas, setPerguntas] = useState("");
  const [salvando, setSalvando] = useState(false);

  const campos: CampoModelo[] = useMemo(() => {
    const linhas = perguntas
      .split("\n")
      .map((l) => l.replace(/^\s*[-•*\d.)]+\s*/, "").trim())
      .filter((l) => l.length > 0);
    const vistos = new Set<string>();
    return linhas
      .map((l) => ({ id: slugId(l), nome: l, tipo: inferirTipo(l), obrigatorio: false }))
      .filter((c) => (vistos.has(c.id) ? false : (vistos.add(c.id), true)));
  }, [perguntas]);

  const sugerirPop = () => {
    const sugestao = sugerirPopPorNome(`${nome} ${perguntas}`);
    if (sugestao) {
      setPopCodigo(sugestao);
      toast.success(`POP sugerido: ${sugestao}`);
    } else {
      toast.info("Não foi possível sugerir um POP — selecione manualmente.");
    }
  };

  const criar = async () => {
    if (!nome.trim()) return toast.error("Dê um nome ao formulário");
    if (campos.length === 0) return toast.error("Cole ao menos uma pergunta");
    setSalvando(true);
    try {
      const { data, error } = await supabase
        .from("modelos_empresa")
        .insert({
          user_id: userId,
          empresa_id: empresaId,
          nome: nome.trim(),
          pop_codigo: popCodigo || null,
          campos: campos as unknown as never,
          ativo: true,
        })
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Modelo criado! Agora é só copiar o script abaixo.");
      setNome("");
      setPerguntas("");
      setPopCodigo("");
      onModeloCriado(data.id as string);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro desconhecido";
      toast.error("Erro ao criar modelo: " + msg);
    } finally {
      setSalvando(false);
    }
  };

  return (
    <Card className="border-emerald-600/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" /> Modo rápido — criar em 1 tela
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Cole as perguntas do seu Google Forms (uma por linha). O sistema cria o modelo, os campos e o token do webhook
          automaticamente.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label>Nome do formulário *</Label>
            <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Checklist de Higiene Diária" />
          </div>
          <div>
            <Label>POP vinculado</Label>
            <div className="flex gap-2">
              <Select value={popCodigo || "__none__"} onValueChange={(v) => setPopCodigo(v === "__none__" ? "" : v)}>
                <SelectTrigger><SelectValue placeholder="Nenhum" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {POPS_CUSTOM.map((p) => (
                    <SelectItem key={p.codigo} value={p.codigo}>{p.codigo} — {p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button type="button" variant="outline" size="icon" onClick={sugerirPop} title="Sugerir POP">
                <Wand2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <div>
          <Label>Perguntas do Forms (uma por linha) *</Label>
          <Textarea
            rows={7}
            value={perguntas}
            onChange={(e) => setPerguntas(e.target.value)}
            placeholder={"Data\nResponsável\nÁrea higienizada\nProduto utilizado\nConcentração (ppm)\nConforme?"}
          />
        </div>

        {campos.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">{campos.length} campo(s) detectado(s):</p>
            <div className="flex flex-wrap gap-2">
              {campos.map((c) => (
                <Badge key={c.id} variant="secondary">
                  {c.nome} <span className="ml-1 opacity-70">({c.tipo})</span>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <Button onClick={criar} disabled={salvando} className="w-full sm:w-auto">
          {salvando ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          Criar modelo e gerar webhook
        </Button>
      </CardContent>
    </Card>
  );
}
