import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ExternalLink, FileText, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";
import { AssistenteGoogleForms } from "@/components/feedbpfcustom/AssistenteGoogleForms";
import { ModoRapidoForms } from "@/components/feedbpfcustom/ModoRapidoForms";
import { useAuth } from "@/hooks/useAuth";
import type { CampoModelo } from "@/config/feedBpfCustomConfig";


const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-forms-webhook`;

interface Modelo {
  id: string;
  nome: string;
  pop_codigo: string | null;
  webhook_token: string | null;
  ativo: boolean;
  campos: CampoModelo[];
}

export default function GoogleForms() {
  const { empresaAtiva } = useEmpresa();
  const { user } = useAuth();
  const userId = user?.id;

  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [selecionado, setSelecionado] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const modelo = modelos.find((m) => m.id === selecionado);

  useEffect(() => {
    if (!empresaAtiva?.id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("modelos_empresa")
        .select("id, nome, pop_codigo, webhook_token, ativo, campos")
        .eq("empresa_id", empresaAtiva.id)
        .eq("ativo", true)
        .order("nome");
      if (error) toast.error("Erro ao carregar modelos");
      setModelos((data as unknown as Modelo[]) ?? []);
      setLoading(false);
    })();
  }, [empresaAtiva?.id]);




  return (
    <div className="container mx-auto p-6 max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/feedbpf-custom/tutorial"><ArrowLeft className="h-4 w-4 mr-1" /> Voltar</Link>
          </Button>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <FileText className="h-8 w-8 text-emerald-600" /> Integração Google Forms
          </h1>
          <p className="text-muted-foreground mt-1">
            Cada resposta enviada no Google Forms vira automaticamente um Registro Digital assinado com hash SHA-256.
          </p>
        </div>
        <Button variant="outline" asChild className="shrink-0">
          <Link to="/feedbpf-custom/tutorial-google">
            <GraduationCap className="h-4 w-4 mr-1" /> Ver tutorial passo a passo
          </Link>
        </Button>
      </div>


      {empresaAtiva?.id && userId && (
        <ModoRapidoForms
          empresaId={empresaAtiva.id}
          userId={userId}
          onModeloCriado={async (id) => {
            const { data } = await supabase
              .from("modelos_empresa")
              .select("id, nome, pop_codigo, webhook_token, ativo, campos")
              .eq("empresa_id", empresaAtiva.id)
              .eq("ativo", true)
              .order("nome");
            setModelos((data as unknown as Modelo[]) ?? []);
            setSelecionado(id);
          }}
        />
      )}

      <Card>
        <CardHeader>
          <CardTitle>Ou escolha um modelo já existente</CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {loading ? (
            <p className="text-sm text-muted-foreground">Carregando modelos…</p>
          ) : modelos.length === 0 ? (
            <div className="text-sm text-muted-foreground">
              Nenhum modelo ativo. Crie um em <Link to="/feedbpf-custom/modelos" className="text-emerald-600 underline">Meus Modelos</Link> antes de conectar o Google Forms.
            </div>
          ) : (
            <Select value={selecionado} onValueChange={setSelecionado}>
              <SelectTrigger><SelectValue placeholder="Selecione um modelo…" /></SelectTrigger>
              <SelectContent>
                {modelos.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.pop_codigo ? <Badge variant="secondary" className="mr-2">{m.pop_codigo}</Badge> : null}
                    {m.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {modelo && (
        <>
          <AssistenteGoogleForms
            webhookUrl={WEBHOOK_URL}
            modelo={modelo}
            onTokenRotacionado={(novo) =>
              setModelos((prev) => prev.map((m) => (m.id === modelo.id ? { ...m, webhook_token: novo } : m)))
            }
          />


          <Card>
            <CardHeader><CardTitle>4. Dicas importantes</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Os títulos das perguntas do Form viram as chaves dos dados salvos — use nomes idênticos aos campos do seu Modelo para melhor rastreabilidade.</p>
              <p>• Inclua uma pergunta chamada <strong>Responsável</strong> no Form para preencher automaticamente esse campo no registro.</p>
              <p>• Cada envio gera um hash SHA-256 imutável.</p>
              <p>• Você pode conectar vários Forms ao mesmo modelo — todos usam o mesmo token.</p>
              <a href="https://script.google.com" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-emerald-600 hover:underline">
                Abrir Google Apps Script <ExternalLink className="h-3 w-3" />
              </a>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
