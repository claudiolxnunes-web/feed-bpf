import { Link } from "react-router-dom";
import {
  ArrowLeft,
  FileText,
  FileSpreadsheet,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import imgCriarForm from "@/assets/tutorial-forms-1-criar.jpg";
import imgAppsScript from "@/assets/tutorial-forms-2-appsscript.jpg";
import imgTrigger from "@/assets/tutorial-forms-3-trigger.jpg";
import imgSheetsFluxo from "@/assets/tutorial-sheets-1-planilha.jpg";

const Illustration = ({ src, alt }: { src: string; alt: string }) => (
  <figure className="my-3 rounded-lg border border-border/60 overflow-hidden bg-muted/30">
    <img src={src} alt={alt} loading="lazy" width={1024} height={1024} className="w-full h-auto max-h-64 object-cover" />
    <figcaption className="text-xs text-muted-foreground px-3 py-2 border-t border-border/60 bg-background/50">
      {alt}
    </figcaption>
  </figure>
);
import { Separator } from "@/components/ui/separator";

const Step = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
  <div className="flex gap-4">
    <div className="shrink-0 w-9 h-9 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center">
      {n}
    </div>
    <div className="flex-1 pb-4">
      <h4 className="font-semibold text-base mb-1">{title}</h4>
      <div className="text-sm text-muted-foreground space-y-2">{children}</div>
    </div>
  </div>
);

export default function TutorialGoogleFormsSheets() {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-5xl space-y-6">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-2">
          <Link to="/feedbpf-custom/tutorial">
            <ArrowLeft className="h-4 w-4 mr-1" /> Voltar
          </Link>
        </Button>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Rocket className="h-8 w-8 text-emerald-600" />
          Tutorial: Google Forms & Google Sheets
        </h1>
        <p className="text-muted-foreground mt-1">
          Guia passo a passo para criar formulários e planilhas no Google e integrá-los ao
          Feed_BPF Custom. Toda resposta vira um <strong>Registro Digital</strong>  com
 hash SHA-256.
 </p>
      </div>

      <Alert className="border-emerald-500/40 bg-emerald-500/5">
        <Lightbulb className="h-4 w-4 text-emerald-600" />
        <AlertTitle>Antes de começar</AlertTitle>
        <AlertDescription>
          Você precisa de: (1) uma <strong>conta Google gratuita</strong>, (2) um{" "}
          <strong>Modelo ativo</strong> criado em{" "}
          <Link to="/feedbpf-custom/modelos" className="text-emerald-600 underline">
            Meus Modelos
          </Link>
          , e (3) o <strong>token do webhook</strong> disponível em{" "}
          <Link to="/feedbpf-custom/google-forms" className="text-emerald-600 underline">
            Google Forms
          </Link>
          .
        </AlertDescription>
      </Alert>

      {/* ==================== ATALHO — MODO RÁPIDO ==================== */}
      <Card className="border-2 border-emerald-500/40 bg-emerald-500/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5 text-emerald-600" />
            Atalho — Modo rápido (2 minutos)
            <Badge className="bg-emerald-600 hover:bg-emerald-700">Recomendado</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground mb-3">
            Se você já tem o formulário pronto no Google, não precisa criar o modelo campo a campo.
            O <strong>Modo rápido</strong> cria o modelo, os campos e o token do webhook de uma vez.
          </p>
          <Step n={1} title="Copie as perguntas do seu Forms">
            <p>
              Abra o formulário e copie o <strong>título de cada pergunta</strong>, uma por linha
              (ex.: <code className="px-1 bg-muted rounded">Data</code>,{" "}
              <code className="px-1 bg-muted rounded">Responsável</code>,{" "}
              <code className="px-1 bg-muted rounded">Cloro (ppm)</code>).
            </p>
          </Step>
          <Step n={2} title="Cole no Modo rápido">
            <p>
              Vá em{" "}
              <Link to="/feedbpf-custom/google-forms" className="text-emerald-600 underline">
                Google Forms
              </Link>{" "}
              e cole a lista no bloco <strong>Modo rápido</strong>. O sistema detecta o tipo de cada
              campo (data, número, sim/não, texto) e sugere o POP.
            </p>
          </Step>
          <Step n={3} title="Criar e conectar">
            <p>
              Clique em <strong>Criar modelo</strong>. Em seguida use o{" "}
              <strong>Assistente de configuração</strong> na mesma tela: ele valida os nomes das
              perguntas, entrega o script pronto e tem o botão <strong>Testar webhook</strong>.
            </p>
          </Step>
          <div className="pt-2">
            <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/feedbpf-custom/google-forms">Abrir Modo rápido</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground pt-3">
            Prefere entender tudo com detalhes? Continue no passo a passo completo abaixo.
          </p>
        </CardContent>
      </Card>


      {/* ==================== PARTE 1 — GOOGLE FORMS ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6 text-emerald-600" />
            Parte 1 — Google Forms (recomendado)
            <Badge variant="secondary">Mais simples</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <Step n={1} title="Criar o formulário">
            <p>
              Acesse{" "}
              <a
                href="https://forms.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline inline-flex items-center gap-1"
              >
                forms.google.com <ExternalLink className="h-3 w-3" />
              </a>
              , clique em <strong>+ Em branco</strong> e dê um título claro
              (ex.: “POP-03 — Saúde e Treinamentos”).
            </p>
            <Illustration src={imgCriarForm} alt="Exemplo de formulário criado no Google Forms com campos POP-03 (Data, Responsável, Treinamento, ASO)" />
          </Step>

          <Step n={2} title="Adicionar as perguntas">
            <p>Use tipos adequados para cada campo do seu modelo:</p>
            <ul className="list-disc ml-5">
              <li><strong>Texto curto</strong> — nome, lote, código</li>
              <li><strong>Parágrafo</strong> — observações</li>
              <li><strong>Data</strong> — data da execução</li>
              <li><strong>Número</strong> — cloro (ppm), pH, temperatura</li>
              <li><strong>Múltipla escolha / Caixas</strong> — checklists</li>
            </ul>
            <Alert className="mt-2">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>Dica de ouro:</strong> use como <em>título da pergunta</em> exatamente o
                mesmo nome do campo do seu Modelo no Feed_BPF. Ex.: pergunta chamada
                <code className="mx-1 px-1 bg-muted rounded">Cloro (ppm)</code> irá preencher o
                campo <code className="mx-1 px-1 bg-muted rounded">Cloro (ppm)</code>.
              </AlertDescription>
            </Alert>
          </Step>

          <Step n={3} title="Incluir campo Responsável">
            <p>
              Adicione uma pergunta de texto curto chamada exatamente{" "}
              <strong>Responsável</strong>. O sistema usa esse valor para assinar o registro
              automaticamente.
            </p>
          </Step>

          <Step n={4} title="Pegar seu token do webhook">
            <p>
              Vá em{" "}
              <Link to="/feedbpf-custom/google-forms" className="text-emerald-600 underline">
                Feed_BPF Custom → Google Forms
              </Link>
              , selecione o modelo que receberá as respostas e copie o <strong>token</strong>{" "}
              e o <strong>script Apps Script</strong> completo.
            </p>
          </Step>

          <Step n={5} title="Colar o script no Google Form">
            <p>
              Dentro do Form, clique nos <strong>três pontinhos (⋮)</strong> no canto superior
              direito → <strong>Editor de script</strong>. Apague o código padrão, cole o
              script copiado e clique no ícone 💾 <strong>Salvar</strong>.
            </p>
            <Illustration src={imgAppsScript} alt="Editor do Google Apps Script com o script colado e o botão Salvar em destaque" />
          </Step>

          <Step n={6} title="Criar o Gatilho (Trigger)">
            <p>Ainda no Apps Script:</p>
            <ol className="list-decimal ml-5">
              <li>Clique no ícone de <strong>relógio ⏰</strong> à esquerda (Acionadores).</li>
              <li>Botão azul <strong>+ Adicionar acionador</strong>.</li>
              <li>Função: <code className="px-1 bg-muted rounded">onFormSubmit</code></li>
              <li>Fonte do evento: <strong>Do formulário</strong></li>
              <li>Tipo de evento: <strong>No envio do formulário</strong></li>
              <li>Salvar <strong>autorizar</strong> com sua conta Google (aparecerá aviso
                “App não verificado” → “Avançado” → “Acessar mesmo assim”).</li>
            </ol>
            <Illustration src={imgTrigger} alt="Painel de Acionadores do Apps Script com função onFormSubmit configurada para disparar no envio do formulário" />
          </Step>

          <Step n={7} title="Testar">
            <p>
              Clique em <strong>Enviar</strong> no Google Form, preencha e envie uma resposta.
              Em poucos segundos ela aparecerá em{" "}
              <Link to="/feedbpf-custom/registros" className="text-emerald-600 underline">
                Registros Digitais
              </Link>{" "}
              com hash SHA-256.
            </p>
            <div className="flex items-center gap-1 text-emerald-600 text-sm font-medium mt-1">
              <CheckCircle2 className="h-4 w-4" /> Pronto! Cada nova resposta vira registro
              automaticamente.
            </div>
          </Step>
        </CardContent>
      </Card>

      {/* ==================== PARTE 2 — GOOGLE SHEETS ==================== */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
            Parte 2 — Google Sheets (para planilhas existentes)
            <Badge variant="outline">Avançado</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="text-sm text-muted-foreground mb-4">
            Use esta abordagem se você já tem uma planilha compartilhada onde a equipe
            registra dados manualmente (ex.: controle de cloro por dia).
          </p>

          <Step n={1} title="Preparar a planilha">
            <p>
              Crie/abra sua planilha em{" "}
              <a
                href="https://sheets.google.com"
                target="_blank"
                rel="noreferrer"
                className="text-emerald-600 hover:underline inline-flex items-center gap-1"
              >
                sheets.google.com <ExternalLink className="h-3 w-3" />
              </a>
              . Na <strong>linha 1</strong> coloque os cabeçalhos exatamente com os nomes dos
              campos do seu Modelo. Ex.: <code className="px-1 bg-muted rounded">Data</code>,{" "}
              <code className="px-1 bg-muted rounded">Responsável</code>,{" "}
              <code className="px-1 bg-muted rounded">Cloro (ppm)</code>,{" "}
              <code className="px-1 bg-muted rounded">pH</code>.
            </p>
            <Illustration src={imgSheetsFluxo} alt="Google Sheets com cabeçalhos e dados; cada linha completa vira um Registro Digital com hash SHA-256" />
          </Step>

          <Step n={2} title="Abrir o Apps Script">
            <p>
              Menu <strong>Extensões → Apps Script</strong>. Apague o código padrão e cole:
            </p>
            <pre className="bg-muted p-3 rounded text-xs overflow-x-auto">{`const WEBHOOK_URL = "${import.meta.env.VITE_SUPABASE_URL}/functions/v1/google-forms-webhook";
const TOKEN = "COLE_SEU_TOKEN_AQUI"; // pegue em Feed_BPF Custom → Google Forms

function onEdit(e) {
  const sheet = e.source.getActiveSheet();
  const row = e.range.getRow();
  if (row === 1) return; // ignora cabeçalho

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const values  = sheet.getRange(row, 1, 1, sheet.getLastColumn()).getValues()[0];

  const respostas = {};
  headers.forEach((h, i) => { if (h) respostas[h] = values[i]; });

  // Só envia quando a linha estiver completa (todas as colunas obrigatórias preenchidas)
  if (Object.values(respostas).some(v => v === "" || v === null)) return;

  UrlFetchApp.fetch(WEBHOOK_URL, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify({
      token: TOKEN,
      form_title: sheet.getName(),
      submitted_at: new Date().toISOString(),
      respostas: respostas
    }),
    muteHttpExceptions: true
  });
}`}</pre>
          </Step>

          <Step n={3} title="Criar o gatilho onEdit">
            <p>
              Ícone <strong>⏰ Acionadores → + Adicionar acionador</strong>:
            </p>
            <ul className="list-disc ml-5">
              <li>Função: <code className="px-1 bg-muted rounded">onEdit</code></li>
              <li>Fonte: <strong>Da planilha</strong></li>
              <li>Evento: <strong>Ao editar</strong></li>
            </ul>
            <p>Salve e autorize.</p>
          </Step>

          <Step n={4} title="Testar">
            <p>
              Preencha uma nova linha completa. Assim que a última célula obrigatória for
              preenchida, o registro aparece em{" "}
              <Link to="/feedbpf-custom/registros" className="text-emerald-600 underline">
                Registros Digitais
              </Link>
              .
            </p>
          </Step>

          <Alert className="mt-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Cuidado com duplicidade</AlertTitle>
            <AlertDescription>
              O gatilho <code>onEdit</code> dispara a cada célula alterada. O script acima só
              envia quando <em>todas</em> as colunas estão preenchidas — mantenha essa lógica
              para evitar registros duplicados. Se preferir mais controle, use{" "}
              <Link to="/feedbpf-custom/planilhas" className="text-emerald-600 underline">
                Importar Planilhas
              </Link>{" "}
              para uploads em lote.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* ==================== FAQ / TROUBLESHOOTING ==================== */}
      <Card>
        <CardHeader>
          <CardTitle>Problemas comuns</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-3">
          <div>
            <p className="font-semibold">❌ “Token inválido ou ausente” (401)</p>
            <p className="text-muted-foreground">
              O token no script está errado ou foi rotacionado. Vá em{" "}
              <Link to="/feedbpf-custom/google-forms" className="text-emerald-600 underline">
                Google Forms
              </Link>{" "}
              e copie novamente.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-semibold">❌ “Modelo não encontrado” (404)</p>
            <p className="text-muted-foreground">
              O modelo foi excluído ou desativado. Reative-o em{" "}
              <Link to="/feedbpf-custom/modelos" className="text-emerald-600 underline">
                Meus Modelos
              </Link>
              .
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-semibold">❌ Respostas não aparecem em Registros</p>
            <p className="text-muted-foreground">
              Verifique no Apps Script: menu <strong>Execuções</strong> — se houver erro,
              provavelmente o gatilho não foi autorizado. Recrie o acionador.
            </p>
          </div>
          <Separator />
          <div>
            <p className="font-semibold">✅ Posso usar o mesmo token em vários Forms?</p>
            <p className="text-muted-foreground">
              Sim. Todos os Forms que usam o mesmo token gravam no mesmo modelo. Ideal para
              filiais que preenchem o mesmo controle.
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button asChild>
          <Link to="/feedbpf-custom/google-forms">
            <FileText className="h-4 w-4 mr-1" /> Ir para Google Forms
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link to="/feedbpf-custom/modelos">
            <FileSpreadsheet className="h-4 w-4 mr-1" /> Criar/editar Modelo
          </Link>
        </Button>
      </div>
    </div>
  );
}
