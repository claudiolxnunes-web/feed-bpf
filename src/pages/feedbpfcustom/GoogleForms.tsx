import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Copy, Check, RefreshCcw, ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { toast } from "sonner";

const WEBHOOK_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-forms-webhook`;

interface Modelo {
  id: string;
  nome: string;
  pop_codigo: string | null;
  webhook_token: string | null;
  ativo: boolean;
}

export default function GoogleForms() {
  const { empresaAtiva } = useEmpresa();
  const [modelos, setModelos] = useState<Modelo[]>([]);
  const [selecionado, setSelecionado] = useState<string>("");
  const [copiado, setCopiado] = useState<string>("");
  const [loading, setLoading] = useState(true);

  const modelo = modelos.find((m) => m.id === selecionado);

  useEffect(() => {
    if (!empresaAtiva?.id) return;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("modelos_empresa")
        .select("id, nome, pop_codigo, webhook_token, ativo")
        .eq("empresa_id", empresaAtiva.id)
        .eq("ativo", true)
        .order("nome");
      if (error) toast.error("Erro ao carregar modelos");
      setModelos((data as Modelo[]) ?? []);
      setLoading(false);
    })();
  }, [empresaAtiva?.id]);

  const copiar = async (texto: string, chave: string) => {
    await navigator.clipboard.writeText(texto);
    setCopiado(chave);
    toast.success("Copiado!");
    setTimeout(() => setCopiado(""), 2000);
  };

  const rotacionar = async () => {
    if (!modelo) return;
    if (!confirm("Rotacionar o token invalidará o webhook atual em todos os Google Forms conectados. Continuar?")) return;
    const novo = crypto.randomUUID();
    const { error } = await supabase
      .from("modelos_empresa")
      .update({ webhook_token: novo })
      .eq("id", modelo.id);
    if (error) return toast.error("Erro ao rotacionar token");
    setModelos((prev) => prev.map((m) => (m.id === modelo.id ? { ...m, webhook_token: novo } : m)));
    toast.success("Token rotacionado com sucesso");
  };

  const token = modelo?.webhook_token ?? "";
  const urlCompleta = token ? `${WEBHOOK_URL}?token=${token}` : WEBHOOK_URL;

  const appsScript = `// Cole este código em Extensões > Apps Script do seu Google Form
// Depois: Gatilhos (relógio) > Adicionar Gatilho > onFormSubmit > No envio do formulário
const WEBHOOK_URL = "${WEBHOOK_URL}";
const TOKEN = "${token || 'COLE_SEU_TOKEN_AQUI'}";

function onFormSubmit(e) {
  const respostas = {};
  e.response.getItemResponses().forEach(r => {
    respostas[r.getItem().getTitle()] = r.getResponse();
  });

  const payload = {
    token: TOKEN,
    form_title: e.source.getTitle(),
    submitted_at: new Date().toISOString(),
    respostas: respostas
  };

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  });
}`;

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
      </div>

      <Card>
        <CardHeader>
          <CardTitle>1. Escolha o modelo que receberá as respostas</CardTitle>
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
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>2. Seu token de webhook</span>
                <Button variant="outline" size="sm" onClick={rotacionar}>
                  <RefreshCcw className="h-4 w-4 mr-1" /> Rotacionar
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input readOnly value={token} className="font-mono text-xs" />
                <Button variant="outline" onClick={() => copiar(token, "token")}>
                  {copiado === "token" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <div className="flex gap-2">
                <Input readOnly value={urlCompleta} className="font-mono text-xs" />
                <Button variant="outline" onClick={() => copiar(urlCompleta, "url")}>
                  {copiado === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                ⚠️ Trate este token como uma senha. Qualquer pessoa com ele pode enviar respostas para este modelo. Rotacione se suspeitar de vazamento.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3. Cole o script no seu Google Form</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <ol className="list-decimal ml-5 text-sm space-y-1">
                <li>Abra seu Google Form.</li>
                <li>Menu ⋮ (três pontos) → <strong>Editor de script</strong> (ou <em>Extensões → Apps Script</em>).</li>
                <li>Apague o conteúdo padrão e cole o código abaixo.</li>
                <li>Salve (💾) e nomeie o projeto.</li>
                <li>Ícone de relógio (⏰) → <strong>Adicionar Acionador</strong>:
                  <ul className="list-disc ml-5 mt-1">
                    <li>Função: <code>onFormSubmit</code></li>
                    <li>Evento: <strong>No envio do formulário</strong></li>
                  </ul>
                </li>
                <li>Autorize os acessos solicitados pelo Google.</li>
                <li>Envie uma resposta de teste — ela aparecerá em <Link to="/feedbpf-custom/registros" className="text-emerald-600 underline">Registros Digitais</Link>.</li>
              </ol>
              <Textarea readOnly value={appsScript} rows={22} className="font-mono text-xs" />
              <Button onClick={() => copiar(appsScript, "script")} className="w-full">
                {copiado === "script" ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                Copiar script completo
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>4. Dicas importantes</CardTitle></CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>• Os títulos das perguntas do Form viram as chaves dos dados salvos — use nomes idênticos aos campos do seu Modelo para melhor rastreabilidade.</p>
              <p>• Inclua uma pergunta chamada <strong>Responsável</strong> no Form para preencher automaticamente esse campo no registro.</p>
              <p>• Cada envio gera um hash SHA-256 imutável (Decreto 12.031/2024).</p>
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
