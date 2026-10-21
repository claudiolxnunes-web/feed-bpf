import { textoTela } from "@/lib/textoTela";
import { Link } from "react-router-dom";
import {
  GraduationCap,
  Upload,
  FolderOpen,
  Layers,
  FileSignature,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lightbulb,
  ShieldCheck,
  PlayCircle,
  ClipboardList,
  AlertCircle,
  BookOpenCheck,
  FileSpreadsheet,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageHeader from "@/components/PageHeader";
import { DOCS_OBRIGATORIOS_POP, contarObrigatoriosEssenciais } from "@/config/documentosObrigatoriosBPF";


interface Passo {
  n: number;
  titulo: string;
  icon: React.ElementType;
  resumo: string;
  detalhes: string[];
  cta: { texto: string; link: string };
  dica?: string;
}

const PASSOS: Passo[] = [
  {
    n: 1,
    titulo: "Importe sua documentação",
    icon: Upload,
    resumo: "Suba tudo que sua fábrica já tem — PDFs, planilhas, laudos, fotos.",
    detalhes: [
      "Vá em Importação em Massa e arraste a pasta inteira (ou selecione vários arquivos).",
      "O sistema lê o nome de cada arquivo e sugere automaticamente o POP (ex: 'saude_pessoal_jan.pdf' → POP-03).",
      "Você pode ajustar o POP, dar um título melhor a cada arquivo e clicar Enviar tudo.",
      "Formatos aceitos: PDF, JPG, PNG, XLSX, DOC, DOCX.",
    ],
    cta: { texto: "Ir para Importação em Massa", link: "/feedbpf-custom/importacao" },
    dica: "Nomeie seus arquivos com palavras-chave (higiene, praga, água, receb…) — a sugestão automática fica quase 100% certa.",
  },
  {
    n: 2,
    titulo: "Organize o acervo por POP",
    icon: FolderOpen,
    resumo: "Cada documento aparece no card do seu POP. Vencimentos e buscas ficam à mão.",
    detalhes: [
      "Meu Acervo mostra 10 cards (POP-01 ao POP-10) + 1 card para arquivos sem POP vinculado.",
      "Clique num card para filtrar. Use a busca para localizar por título ou nome de arquivo.",
      "Se um arquivo caiu no lugar errado, use o Select ao lado dele para trocar o POP na hora.",
      "Baixe qualquer documento com um clique — ele abre em nova aba.",
    ],
    cta: { texto: "Ver Meu Acervo", link: "/feedbpf-custom/acervo" },
    dica: "O card amarelo 'Sem POP vinculado' é seu backlog — deixe zerado para manter o acervo organizado.",
  },
  {
    n: 3,
    titulo: "Crie seus modelos digitais",
    icon: Layers,
    resumo: "Transforme suas planilhas de papel em formulários digitais com SEUS campos.",
    detalhes: [
      "Em Meus Modelos, clique em Novo modelo.",
      "Dê um nome (ex: 'Planilha de Higiene Diária'), vincule ao POP e descreva quando é usado.",
      "Adicione os campos que você já usa: texto curto, texto longo, número, data, sim/não, ou lista de opções.",
      "Marque campos obrigatórios para evitar registros incompletos. Salve.",
    ],
    cta: { texto: "Criar meu primeiro modelo", link: "/feedbpf-custom/modelos" },
    dica: "Comece com 2-3 modelos das rotinas MAIS repetidas (limpeza diária, monitoramento de pragas). O resto vem depois.",
  },
  {
    n: 4,
    titulo: "Gere registros digitais",
    icon: FileSignature,
    resumo: "Preencha na tela, salve com hash SHA-256 e substitua o papel aos poucos.",
    detalhes: [
      "Em Registros Digitais, escolha um dos seus modelos.",
      "Preencha título, data, responsável e os campos do formulário.",
      "Salvar rascunho = pode editar depois. Salvar como vigente = trava com hash SHA-256 (prova de integridade para MAPA).",
      "Todos os registros ficam listados com selo verde, data e hash truncado — clique no hash para ver completo.",
    ],
    cta: { texto: "Ver Registros Digitais", link: "/feedbpf-custom/registros" },
    dica: "Só marque 'vigente' quando tiver certeza — o hash é gerado a partir dos dados e não pode ser alterado sem quebrar a integridade.",
  },
];

const FAQ = [
  {
    q: "Preciso trocar toda minha documentação de uma vez?",
    a: "Não. A ideia é justamente migrar aos poucos. Comece só importando o que já existe (Passo 1 e 2). Digitalize (Passos 3 e 4) apenas os controles que fazem mais sentido — um por vez. Papel e digital podem conviver enquanto a equipe se acostuma.",
  },
  {
    q: "Meus modelos vão ficar iguais aos do Feed_BPF padrão?",
    a: "Não. O Custom foi feito para respeitar SEUS layouts. Você define quais campos existem, os nomes, a ordem e o que é obrigatório. A plataforma só cuida da parte técnica (armazenar, versionar, gerar hash, listar).",
  },
  {
    q: "Perco tudo se eu excluir um modelo?",
    a: "Não. Modelos que já têm registros vinculados são protegidos — o sistema bloqueia a exclusão. Você pode 'arquivar' o modelo (deixar inativo) para não usar mais em novos registros, mas os antigos ficam preservados.",
  },
  {
    q: "Quem pode ver os meus documentos?",
    a: "Somente membros ativos da sua empresa (e consultor vinculado, se houver). Cada empresa tem isolamento total — outras empresas na mesma plataforma não enxergam nada seu.",
  },
  {
    q: "O hash SHA-256 vale para auditoria?",
    a: "Sim. É uma impressão digital matemática do conteúdo — qualquer alteração muda o hash, o que serve como prova de integridade em auditorias MAPA.",
  },
  {
    q: "Posso voltar para o Feed_BPF tradicional depois?",
    a: "Sim. Os dois produtos coexistem. Você pode assinar os dois em paralelo, se quiser, e usar módulos operacionais fixos do Feed_BPF + gestor de documentos do Custom.",
  },
];

export default function TutorialCustom() {
  return (
    <div className="space-y-8 max-w-4xl">
      <PageHeader
        icon={GraduationCap}
        title="Guia do Feed_BPF Custom"
        description="Como organizar seu acervo e digitalizar planilhas"
       assuntoBaseLegal="bpf_geral" />

      {/* Vídeo/gif placeholder + resumo */}
      <Card className="border-2 border-emerald-500/30 bg-emerald-500/5">
        <CardContent className="p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
              <PlayCircle className="w-6 h-6 text-white" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-bold">Em 5 minutos você entende tudo</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                O Feed_BPF Custom é um <strong>gestor da sua documentação</strong>. Ele organiza o que você já tem e permite criar planilhas digitais respeitando a numeração oficial dos 10 POPs.
 </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <Badge className="bg-emerald-600 hover:bg-emerald-700"><Sparkles className="w-3 h-3 mr-1" /> Sem migração forçada</Badge>
                <Badge variant="outline">Sem perda de dados</Badge>
                <Badge variant="outline">Papel + digital coexistem</Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* CTA para o Guia Detalhado */}
      <Card className="border-2 border-teal-500/40 bg-gradient-to-br from-teal-500/10 to-emerald-500/5">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-teal-600 flex items-center justify-center shrink-0">
            <BookOpenCheck className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-base">Guia de Customização — passo a passo detalhado</h3>
            <p className="text-sm text-muted-foreground">
              Versão longa e explicativa: pré-requisitos, ação exata em cada tela, campos, resultados esperados, dicas e erros comuns. Imprimível como PDF.
            </p>
          </div>
          <Button asChild className="bg-teal-600 hover:bg-teal-700 shrink-0">
            <Link to="/feedbpf-custom/guia">Abrir Guia Detalhado <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </CardContent>
      </Card>

      {/* CTA para o Tutorial Google Forms/Sheets */}
      <Card className="border-2 border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 to-teal-500/5">
        <CardContent className="p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center shrink-0">
            <FileSpreadsheet className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="font-bold text-base">Tutorial: Google Forms &amp; Google Sheets</h3>
            <p className="text-sm text-muted-foreground">
              Já usa formulários ou planilhas do Google? Aprenda a conectá-los ao Feed_BPF Custom —
              cada resposta vira um Registro Digital assinado com hash SHA-256.
            </p>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700 shrink-0">
            <Link to="/feedbpf-custom/tutorial-google">Abrir tutorial <ArrowRight className="w-4 h-4 ml-1" /></Link>
          </Button>
        </CardContent>
      </Card>




      {/* Passos */}
      <div className="space-y-4">
        {PASSOS.map((p) => (
          <Card key={p.n} className="hover:shadow-md transition">
            <CardContent className="p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex sm:flex-col items-center sm:items-start gap-3 sm:gap-1 shrink-0">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                    {p.n}
                  </div>
                  <p.icon className="w-5 h-5 text-emerald-600 sm:mt-1" />
                </div>

                <div className="flex-1 space-y-3 min-w-0">
                  <div>
                    <h3 className="text-lg font-bold">{p.titulo}</h3>
                    <p className="text-sm text-muted-foreground">{p.resumo}</p>
                  </div>

                  <ul className="space-y-1.5">
                    {p.detalhes.map((d, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                        <span className="text-foreground/85">{d}</span>
                      </li>
                    ))}
                  </ul>

                  {p.dica && (
                    <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/30">
                      <Lightbulb className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                      <p className="text-xs text-amber-900 dark:text-amber-100"><strong>Dica:</strong> {p.dica}</p>
                    </div>
                  )}

                  <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
                    <Link to={p.cta.link}>
                      {p.cta.texto} <ArrowRight className="w-4 h-4 ml-1" />
                    </Link>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Ordem sugerida na primeira semana */}
      <Card className="bg-gradient-to-br from-teal-500/5 to-emerald-500/5 border-teal-500/30">
        <CardContent className="p-6 space-y-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-teal-600" />
            <h3 className="font-bold">Sugestão de rotina — primeira semana</h3>
          </div>
          <ol className="space-y-2 text-sm">
            <li><strong>Dia 1:</strong> importar a pasta inteira em Importação em Massa (10-30 min).</li>
            <li><strong>Dia 2:</strong> em Meu Acervo, revisar POPs sugeridos e zerar o card "Sem POP vinculado".</li>
            <li><strong>Dia 3:</strong> criar 2 modelos digitais dos controles mais usados (higiene, pragas).</li>
            <li><strong>Dia 4 a 7:</strong> equipe operacional preenche registros digitais no lugar das planilhas antigas.</li>
            <li><strong>Semana 2 em diante:</strong> ir adicionando modelos conforme a rotina exigir.</li>
          </ol>
        </CardContent>
      </Card>

      {/* Documentos Obrigatórios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" /> Documentos obrigatórios por POP
            </h2>
            <p className="text-sm text-muted-foreground"><strong>{contarObrigatoriosEssenciais()} documentos essenciais</strong> no total</p>
          </div>
          <Button asChild size="sm" className="bg-emerald-600 hover:bg-emerald-700">
            <Link to="/feedbpf-custom/analise-ia">
              <Sparkles className="w-4 h-4 mr-1" /> Analisar meu acervo por IA
            </Link>
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap text-xs">
          <Badge className="bg-red-500/15 text-red-700 border-red-300 border" variant="outline"><AlertCircle className="w-3 h-3 mr-1" /> Essencial — reprovação em auditoria</Badge>
          <Badge className="bg-amber-500/15 text-amber-700 border-amber-300 border" variant="outline">Importante — pontos negativos</Badge>
          <Badge variant="outline" className="text-xs">Recomendado — boas práticas</Badge>
        </div>

        <Accordion type="multiple" className="space-y-2">
          {DOCS_OBRIGATORIOS_POP.map((pop) => {
            const essenciais = pop.documentos.filter(d => d.criticidade === "essencial").length;
            return (
              <AccordionItem key={pop.codigo} value={pop.codigo} className="border rounded-lg px-4 bg-card">
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left flex-1">
                    <Badge variant="outline" className="font-mono shrink-0">{pop.codigo}</Badge>
                    <span className="font-medium flex-1 truncate">{pop.nome}</span>
                    <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-200 shrink-0">{essenciais} essencial(is)</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pb-4">
                  <ul className="space-y-2">
                    {pop.documentos.map((doc, i) => {
                      const cor = doc.criticidade === "essencial" ? "text-red-600"
                        : doc.criticidade === "importante" ? "text-amber-600"
                        : "text-muted-foreground";
                      const icon = doc.criticidade === "essencial" ? <AlertCircle className={`w-4 h-4 ${cor} shrink-0 mt-0.5`} />
                        : doc.criticidade === "importante" ? <AlertCircle className={`w-4 h-4 ${cor} shrink-0 mt-0.5`} />
                        : <CheckCircle2 className={`w-4 h-4 ${cor} shrink-0 mt-0.5`} />;
                      return (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          {icon}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{doc.nome}</p>
                            <p className="text-xs text-muted-foreground">{textoTela(doc.descricao)}</p>
                          </div>
                          <Badge variant="outline" className={`text-[10px] uppercase shrink-0 ${cor}`}>{doc.criticidade}</Badge>
                        </li>
                      );
                    })}
                  </ul>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>


      {/* FAQ */}
      <div className="space-y-3">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-emerald-600" /> Perguntas frequentes
        </h2>
        <Accordion type="single" collapsible className="border rounded-lg">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`faq-${i}`} className="px-4">
              <AccordionTrigger className="text-left text-sm font-semibold hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground leading-relaxed pb-4">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {/* CTA final */}
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-none">
        <CardContent className="p-6 sm:p-8 text-center space-y-3">
          <h3 className="text-xl font-bold">Pronto para começar?</h3>
          <p className="text-emerald-50 text-sm">O primeiro passo é o mais fácil: importe o que já existe.</p>
          <Button asChild size="lg" variant="secondary" className="bg-white text-emerald-700 hover:bg-emerald-50">
            <Link to="/feedbpf-custom/importacao">Ir para Importação em Massa <ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
