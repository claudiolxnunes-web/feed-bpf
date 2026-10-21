import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, Loader2, RefreshCcw, Send, X, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { CampoModelo } from "@/config/feedBpfCustomConfig";

export interface AssistenteGoogleFormsModelo {
  id: string;
  nome: string;
  pop_codigo: string | null;
  webhook_token: string | null;
  campos: CampoModelo[];
}

export interface AssistenteGoogleFormsProps {
  webhookUrl: string;
  modelo: AssistenteGoogleFormsModelo;
  onTokenRotacionado: (novoToken: string) => void;
}

/** Normaliza um título para comparação tolerante (acentos, caixa, espaços, pontuação final). */
function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[?:*]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

const PASSOS = [
  "Verificar campos do modelo",
  "Conferir perguntas do Forms",
  "Colar o script no Forms",
  "Testar o envio",
] as const;

export function AssistenteGoogleForms({ webhookUrl, modelo, onTokenRotacionado }: AssistenteGoogleFormsProps) {
  const [passo, setPasso] = useState(0);
  const [perguntasColadas, setPerguntasColadas] = useState("");
  const [copiado, setCopiado] = useState("");
  const [testando, setTestando] = useState(false);
  const [resultadoTeste, setResultadoTeste] = useState<{ ok: boolean; msg: string } | null>(null);

  const token = modelo.webhook_token ?? "";
  const urlCompleta = token ? `${webhookUrl}?token=${token}` : webhookUrl;
  const campos = Array.isArray(modelo.campos) ? modelo.campos : [];

  /** Compara os títulos colados do Forms com os campos cadastrados no modelo. */
  const validacao = useMemo(() => {
    const titulos = perguntasColadas
      .split("\n")
      .map((linha) => linha.trim())
      .filter(Boolean);
    const titulosNorm = titulos.map(normalizar);
    const encontrados = campos.filter((c) => titulosNorm.includes(normalizar(c.nome)));
    const faltando = campos.filter((c) => !titulosNorm.includes(normalizar(c.nome)));
    const camposNorm = campos.map((c) => normalizar(c.nome));
    const extras = titulos.filter((t) => !camposNorm.includes(normalizar(t)));
    return { titulos, encontrados, faltando, extras };
  }, [perguntasColadas, campos]);

  const obrigatoriosFaltando = validacao.faltando.filter((c) => c.obrigatorio);
  const podeAvancarValidacao = validacao.titulos.length > 0 && obrigatoriosFaltando.length === 0;

  const copiar = async (texto: string, chave: string) => {
    await navigator.clipboard.writeText(texto);
    setCopiado(chave);
    toast.success("Copiado!");
    setTimeout(() => setCopiado(""), 2000);
  };

  const rotacionar = async () => {
    if (!confirm("Rotacionar o token invalidará o webhook atual em todos os Google Forms conectados. Continuar?")) return;
    const novo = crypto.randomUUID();
    const { error } = await supabase.from("modelos_empresa").update({ webhook_token: novo }).eq("id", modelo.id);
    if (error) {
      toast.error("Erro ao rotacionar token");
      return;
    }
    onTokenRotacionado(novo);
    toast.success("Token rotacionado com sucesso");
  };

  const appsScript = `// Cole em Extensões > Apps Script do seu Google Form
const WEBHOOK_URL = "${webhookUrl}";
const TOKEN = "${token || "COLE_SEU_TOKEN_AQUI"}";

function onFormSubmit(e) {
  const respostas = {};
  e.response.getItemResponses().forEach(r => {
    respostas[r.getItem().getTitle()] = r.getResponse();
  });

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      token: TOKEN,
      form_title: e.source.getTitle(),
      submitted_at: new Date().toISOString(),
      respostas: respostas
    }),
    muteHttpExceptions: true
  });
}`;

  const testarWebhook = async () => {
    if (!token) return;
    setTestando(true);
    setResultadoTeste(null);
    try {
      const res = await fetch(urlCompleta, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          form_title: `[TESTE] ${modelo.nome}`,
          submitted_at: new Date().toISOString(),
          respostas: {
            "Responsável": "Teste automático do assistente",
            "Observação": "Registro gerado pelo assistente de configuração.",
          },
        }),
      });
      const json: unknown = await res.json().catch(() => ({}));
      const corpo = (json ?? {}) as { error?: string; registro_id?: string };
      if (!res.ok) {
        const msg = corpo.error ?? `HTTP ${res.status}`;
        setResultadoTeste({ ok: false, msg });
        toast.error(`Falha no teste: ${msg}`);
        return;
      }
      setResultadoTeste({ ok: true, msg: `Registro de teste criado (id: ${corpo.registro_id ?? "—"}).` });
      toast.success("Webhook funcionando!");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro de rede";
      setResultadoTeste({ ok: false, msg });
      toast.error(`Falha no teste: ${msg}`);
    } finally {
      setTestando(false);
    }
  };

  return (
    <Card>
      <CardHeader className="space-y-3">
        <CardTitle className="flex flex-wrap items-center gap-2">
          Assistente de configuração
          {modelo.pop_codigo ? <Badge variant="secondary">{modelo.pop_codigo}</Badge> : null}
          <span className="text-sm font-normal text-muted-foreground">{modelo.nome}</span>
        </CardTitle>
        <ol className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          {PASSOS.map((titulo, i) => (
            <li key={titulo}>
              <button
                type="button"
                onClick={() => setPasso(i)}
                className={cn(
                  "flex w-full items-center gap-2 rounded-md border px-3 py-2 text-left text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:w-auto",
                  i === passo ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:bg-muted",
                )}
                aria-current={i === passo ? "step" : undefined}
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold">
                  {i + 1}
                </span>
                {titulo}
              </button>
            </li>
          ))}
        </ol>
      </CardHeader>

      <CardContent className="space-y-4">
        {passo === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              As perguntas do Google Forms precisam ter exatamente estes títulos. Copie cada um ao montar o formulário.
            </p>
            {campos.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Este modelo não tem campos cadastrados. Adicione-os em{" "}
                <Link to="/feedbpf-custom/modelos" className="text-primary underline">Meus Modelos</Link>.
              </p>
            ) : (
              <ul className="divide-y rounded-md border">
                {campos.map((c) => (
                  <li key={c.id} className="flex items-center justify-between gap-2 p-2 text-sm">
                    <span className="truncate">
                      {c.nome}
                      {c.obrigatorio && <span className="ml-1 text-destructive">*</span>}
                      <span className="ml-2 text-xs text-muted-foreground">{c.tipo}</span>
                    </span>
                    <Button variant="ghost" size="sm" onClick={() => copiar(c.nome, c.id)}>
                      {copiado === c.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <Button onClick={() => setPasso(1)} className="w-full">Próximo passo</Button>
          </div>
        )}

        {passo === 1 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Cole abaixo os títulos das perguntas do seu Forms — uma por linha. Validamos contra os campos do modelo.
            </p>
            <Textarea
              value={perguntasColadas}
              onChange={(e) => setPerguntasColadas(e.target.value.slice(0, 5000))}
              rows={8}
              placeholder={"Responsável\nData da execução\nObservação"}
              aria-label="Títulos das perguntas do Google Forms"
            />
            {validacao.titulos.length > 0 && (
              <div className="space-y-2 text-sm">
                <p className="text-emerald-600">
                  <Check className="mr-1 inline h-4 w-4" />
                  {validacao.encontrados.length} de {campos.length} campos do modelo encontrados.
                </p>
                {validacao.faltando.length > 0 && (
                  <div className="rounded-md border border-destructive/40 bg-destructive/5 p-2">
                    <p className="font-medium text-destructive">Faltando no Forms:</p>
                    <ul className="ml-4 list-disc">
                      {validacao.faltando.map((c) => (
                        <li key={c.id}>
                          {c.nome} {c.obrigatorio && <span className="text-destructive">(obrigatório)</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {validacao.extras.length > 0 && (
                  <div className="rounded-md border p-2">
                    <p className="font-medium">Perguntas sem campo correspondente (serão salvas mesmo assim):</p>
                    <ul className="ml-4 list-disc text-muted-foreground">
                      {validacao.extras.map((t) => <li key={t}>{t}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPasso(0)} className="flex-1">Voltar</Button>
              <Button onClick={() => setPasso(2)} disabled={!podeAvancarValidacao} className="flex-1">
                Próximo passo
              </Button>
            </div>
            {!podeAvancarValidacao && obrigatoriosFaltando.length > 0 && (
              <p className="text-xs text-destructive">
                <X className="mr-1 inline h-3 w-3" />
                Ajuste os títulos das perguntas obrigatórias no Forms antes de continuar.
              </p>
            )}
          </div>
        )}

        {passo === 2 && (
          <div className="space-y-3">
            <div className="flex gap-2">
              <Input readOnly value={urlCompleta} className="font-mono text-xs" aria-label="URL do webhook" />
              <Button variant="outline" onClick={() => copiar(urlCompleta, "url")}>
                {copiado === "url" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
              <Button variant="outline" onClick={rotacionar} title="Rotacionar token">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
            <ol className="ml-5 list-decimal space-y-1 text-sm">
              <li>Abra o Google Form → <strong>Extensões → Apps Script</strong>.</li>
              <li>Apague o conteúdo padrão e cole o script abaixo.</li>
              <li>Salve e clique no ícone de relógio → <strong>Adicionar acionador</strong>.</li>
              <li>Função <code>onFormSubmit</code>, evento <strong>No envio do formulário</strong>.</li>
              <li>Autorize os acessos solicitados pelo Google.</li>
            </ol>
            <Textarea readOnly value={appsScript} rows={16} className="font-mono text-xs" />
            <Button onClick={() => copiar(appsScript, "script")} className="w-full">
              {copiado === "script" ? <Check className="mr-1 h-4 w-4" /> : <Copy className="mr-1 h-4 w-4" />}
              Copiar script
            </Button>
            <a
              href="https://script.google.com"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
            >
              Abrir Google Apps Script <ExternalLink className="h-3 w-3" />
            </a>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setPasso(1)} className="flex-1">Voltar</Button>
              <Button onClick={() => setPasso(3)} className="flex-1">Próximo passo</Button>
            </div>
          </div>
        )}

        {passo === 3 && (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Envie um registro de teste para confirmar que o webhook está recebendo os dados.
            </p>
            <Button onClick={testarWebhook} disabled={testando || !token} className="w-full">
              {testando ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Send className="mr-1 h-4 w-4" />}
              Testar webhook agora
            </Button>
            {resultadoTeste && (
              <p className={cn("text-sm", resultadoTeste.ok ? "text-emerald-600" : "text-destructive")}>
                {resultadoTeste.ok ? "✅ " : "❌ "}
                {resultadoTeste.msg}
              </p>
            )}
            <p className="text-sm">
              Confira o resultado em{" "}
              <Link to="/feedbpf-custom/registros" className="text-primary underline">Registros Digitais</Link>.
            </p>
            <Button variant="outline" onClick={() => setPasso(2)} className="w-full">Voltar</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default AssistenteGoogleForms;
