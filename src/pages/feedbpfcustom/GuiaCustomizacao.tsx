import { Link } from "react-router-dom";
import { BookOpenCheck, Printer, ArrowLeft, CheckCircle2, AlertTriangle, Lightbulb, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageHeader from "@/components/PageHeader";

/**
 * Guia detalhado passo a passo para customização do Feed_BPF Custom.
 * Foco em assertividade: cada seção descreve pré-requisitos, ação exata na tela,
 * campos/opções, resultado esperado, dicas e erros comuns.
 * Suporta impressão (window.print) para gerar PDF pela função "Salvar como PDF" do navegador.
 */

interface Secao {
  n: string;
  titulo: string;
  objetivo: string;
  prereq?: string[];
  passos: { acao: string; detalhe?: string }[];
  campos?: { nome: string; descricao: string; obrigatorio?: boolean }[];
  resultado: string;
  dicas?: string[];
  erros?: { erro: string; correcao: string }[];
  proximo?: { texto: string; link: string };
}

const SECOES: Secao[] = [
  {
    n: "1",
    titulo: "Preparar seu material antes de começar",
    objetivo: "Reunir toda a documentação existente (papel + digital) para evitar retrabalho.",
    prereq: [
      "Acesso de administrador da empresa dentro da plataforma.",
      "Empresa já criada e selecionada no seletor do topo (canto superior esquerdo).",
    ],
    passos: [
      { acao: "Junte todos os documentos que a fábrica já usa hoje.", detalhe: "POPs, planilhas de higiene, laudos de água, registros de pragas, ASOs, contratos com fornecedores, notas fiscais de matéria-prima, checklists impressos, fotos de auditorias etc." },
      { acao: "Digitalize (scanner ou foto do celular) o que ainda está em papel.", detalhe: "Prefira PDF para documentos com várias páginas e JPG/PNG para folhas soltas. Google Sheets e Excel podem ser importados no formato original." },
      { acao: "Renomeie os arquivos com palavras-chave.", detalhe: "Exemplos: 'limpeza_equipamentos_jan2026.pdf' (POP-02), 'controle_pragas_dez.xlsx' (POP-07), 'saude_joao_silva_2026.pdf' (POP-03). Isso ativa a sugestão automática de POP na importação." },
      { acao: "Organize em uma pasta única no computador.", detalhe: "Pode manter subpastas por POP se quiser, mas não é obrigatório — o sistema reagrupa depois." },
    ],
    resultado: "Uma pasta local com todos os arquivos nomeados e prontos para upload em lote.",
    dicas: [
      "Nomeie SEMPRE em minúsculas, sem acentos e com underline no lugar de espaço. Ex: 'limpeza_semanal_area_producao.pdf'.",
      "Se um documento cobre vários POPs (ex: manual BPF completo), duplique o arquivo com nomes diferentes ou faça upload uma vez e vincule ao POP principal.",
    ],
    erros: [
      { erro: "Arquivos com nomes tipo 'DOC001.pdf', 'IMG_2043.jpg'.", correcao: "O sistema não conseguirá sugerir POP automaticamente — você terá que classificar um a um. Renomeie ANTES do upload." },
    ],
    proximo: { texto: "Ir para o passo 2 — Importação em Massa", link: "/feedbpf-custom/importacao" },
  },
  {
    n: "2",
    titulo: "Importar tudo de uma vez",
    objetivo: "Subir dezenas ou centenas de arquivos com sugestão automática de POP em minutos.",
    prereq: [
      "Documentos renomeados conforme Passo 1.",
      "Conexão de internet estável (o upload é feito em paralelo).",
    ],
    passos: [
      { acao: "Abra o menu lateral e clique em 'Importação em Massa'.", detalhe: "Ou clique diretamente no card 'Ir para Importação' se estiver no tutorial." },
      { acao: "Arraste a pasta inteira (ou selecione múltiplos arquivos) para a área de upload.", detalhe: "Formatos aceitos: PDF, JPG, PNG, XLSX, XLS, CSV, DOC, DOCX. Limite recomendado: até 200 arquivos por lote." },
      { acao: "Revise a sugestão de POP arquivo por arquivo.", detalhe: "Uma coluna 'POP sugerido' aparece ao lado de cada arquivo. Se estiver correto, mantenha; se não, use o Select para trocar." },
      { acao: "Ajuste o título de cada documento (opcional).", detalhe: "O sistema usa o nome do arquivo como título — mude para algo mais legível se quiser. Ex: 'higiene_diaria_jan2026' → 'Higiene diária — Janeiro 2026'." },
      { acao: "Marque documentos que devem ficar 'sem POP vinculado' (opcional).", detalhe: "Útil para arquivos genéricos como manuais gerais, políticas da empresa etc." },
      { acao: "Clique em 'Enviar tudo' e aguarde a barra de progresso.", detalhe: "Cada arquivo é enviado para o bucket 'documentos-bpf' isolado por empresa (RLS ativo)." },
    ],
    resultado: "Todos os arquivos aparecem em 'Meu Acervo', agrupados por POP, com data de upload e link para download.",
    dicas: [
      "Se o lote for muito grande (>200 arquivos), divida em blocos. O upload em paralelo funciona melhor assim.",
      "Documentos com nome 'aso_...', 'saude_...', 'manipulador_...' caem automaticamente no POP-03. Se algum ASO cair em outro POP, é sinal de nome ambíguo.",
    ],
    erros: [
      { erro: "Upload trava em 90% e não finaliza.", correcao: "Recarregue a página (F5) e refaça o lote. Arquivos já enviados aparecem em Meu Acervo — não sobem duplicados se o nome for igual." },
      { erro: "Arquivo maior que 50MB é rejeitado.", correcao: "Compacte PDFs escaneados usando ferramentas online (ILovePDF, Smallpdf) antes de subir." },
    ],
    proximo: { texto: "Ir para o passo 3 — Organizar Acervo", link: "/feedbpf-custom/acervo" },
  },
  {
    n: "3",
    titulo: "Organizar o acervo e zerar o backlog",
    objetivo: "Garantir que 100% dos documentos estão no POP certo e que o card 'Sem POP vinculado' está vazio.",
    prereq: [
      "Importação em Massa concluída.",
    ],
    passos: [
      { acao: "Abra 'Meu Acervo' no menu lateral.", detalhe: "Você verá 10 cards (POP-01 ao POP-10) + 1 card amarelo 'Sem POP vinculado'." },
      { acao: "Clique no card amarelo primeiro.", detalhe: "Se estiver vazio, ótimo. Se tiver arquivos, revise um a um e use o Select 'POP' ao lado para classificá-los." },
      { acao: "Percorra cada card de POP e verifique se algum documento caiu no lugar errado.", detalhe: "Filtre por busca (título ou nome do arquivo) para localizar rápido." },
      { acao: "Renomeie documentos com títulos ruins.", detalhe: "Clique no ícone de edição ao lado do título e digite algo descritivo. Exemplo: 'Scan_002' → 'Laudo de água — Reservatório 1 — Março 2026'." },
      { acao: "(Opcional) Marque documentos vencidos ou obsoletos com uma tag.", detalhe: "Use o campo 'Status' para separar 'Ativo' de 'Obsoleto' — o sistema não deleta, apenas oculta dos filtros padrão." },
    ],
    resultado: "Acervo 100% organizado, com todos os POPs preenchidos e o card 'Sem POP vinculado' zerado.",
    dicas: [
      "Se um POP estiver com muito mais documentos que os outros (ex: POP-05 com 80 arquivos), pode ser sinal de que uma palavra-chave está enviesando a sugestão. Use a busca para conferir.",
      "Documentos que se repetem em POPs diferentes (ex: manual BPF) podem ficar em UM POP principal e ser referenciados pelos demais via título descritivo.",
    ],
    proximo: { texto: "Ir para o passo 4 — Analisar Conformidade", link: "/feedbpf-custom/analise-ia" },
  },
  {
    n: "4",
    titulo: "Analisar conformidade com os 10 POPs",
    objetivo: "Descobrir quais documentos obrigatórios faltam no acervo.",
    prereq: [
      "Passos 1 a 3 concluídos.",
      "Acervo com pelo menos 10 documentos importados (para a IA ter contexto suficiente).",
    ],
    passos: [
      { acao: "Abra 'Análise por IA' no menu lateral.", detalhe: "Ou clique no botão 'Analisar meu acervo por IA' dentro do tutorial." },
      { acao: "Clique em 'Rodar análise'.", detalhe: "A IA (Gemini 2.5 Flash via Lovable AI Gateway) lê a lista de documentos + modelos e cruza com o checklist oficial de obrigatórios." },
      { acao: "Aguarde ~30 segundos.", detalhe: "O resultado aparece com: (a) score de conformidade 0-100, (b) lista por POP do que está OK e do que falta, (c) recomendações de próximos passos priorizadas." },
      { acao: "Anote os itens 'Essenciais' faltantes.", detalhe: "São os documentos que causam reprovação em auditoria MAPA. Priorize criar modelos digitais para eles no próximo passo." },
    ],
    resultado: "Um diagnóstico visual do quão preparado o acervo está para auditoria, com lista clara do que fazer a seguir.",
    dicas: [
      "Rode a análise novamente sempre que subir um lote grande de documentos ou criar novos modelos — o score deve subir.",
      "Score abaixo de 60 = risco alto de reprovação. Foque nos itens essenciais primeiro, importantes depois, recomendados por último.",
    ],
    erros: [
      { erro: "Erro 429 (rate limit) na análise.", correcao: "Aguarde 1 minuto e tente novamente. O Lovable AI Gateway limita chamadas por minuto." },
      { erro: "Erro 402 (créditos esgotados).", correcao: "Verifique o saldo em Configurações → Créditos IA. Adicione mais créditos se necessário." },
    ],
    proximo: { texto: "Ir para o passo 5 — Criar Modelos", link: "/feedbpf-custom/modelos" },
  },
  {
    n: "5",
    titulo: "Criar seus modelos digitais (customização de verdade)",
    objetivo: "Transformar suas planilhas de papel em formulários digitais respeitando SEUS campos, SEUS nomes e SUA ordem.",
    prereq: [
      "Lista de itens essenciais faltantes (do Passo 4).",
      "Planilha de papel ou digital em mãos para copiar a estrutura dos campos.",
    ],
    passos: [
      { acao: "Abra 'Meus Modelos' no menu lateral.", detalhe: "Você verá a lista de modelos existentes (pode estar vazia na primeira vez)." },
      { acao: "Clique em 'Novo modelo'.", detalhe: "Um formulário abre para preencher os metadados do modelo." },
    ],
    campos: [
      { nome: "Nome do modelo", descricao: "Como aparecerá na lista. Ex: 'Higiene diária — área de produção'.", obrigatorio: true },
      { nome: "POP vinculado", descricao: "Escolha entre POP-01 a POP-10. Define a numeração oficial e onde os registros aparecem.", obrigatorio: true },
      { nome: "Descrição", descricao: "Quando esse modelo deve ser preenchido, por quem, e com que frequência.", obrigatorio: false },
      { nome: "Frequência sugerida", descricao: "Diária, semanal, mensal, por lote, por turno etc. Ajuda o operador a saber quando preencher.", obrigatorio: false },
    ],
    resultado: "Modelo criado e disponível na tela 'Registros Digitais' para uso pela equipe.",
    dicas: [
      "Comece com 2-3 modelos das rotinas mais repetidas (higiene diária, monitoramento de pragas semanal, checklist de recebimento). Não tente cobrir tudo de uma vez.",
      "Ao adicionar campos: use nomes CURTOS e OBJETIVOS. 'Temperatura (°C)' é melhor que 'Qual foi a temperatura medida na câmara fria?'.",
      "Marque como obrigatórios APENAS os campos que impedem o registro de ter valor auditável (data, responsável, medição crítica). Campos secundários deixe opcionais.",
    ],
    erros: [
      { erro: "Modelo criado com 30 campos, ninguém preenche até o fim.", correcao: "Divida em 2 modelos menores por escopo (ex: 'Higiene manhã' e 'Higiene tarde'). Registros curtos são preenchidos; longos, não." },
      { erro: "Todos os campos marcados como obrigatórios.", correcao: "Se o operador esquece um dado, o registro nem começa. Deixe obrigatório só o essencial." },
    ],
    proximo: { texto: "Ir para o passo 6 — Gerar Registros", link: "/feedbpf-custom/registros" },
  },
  {
    n: "6",
    titulo: "Configurar tipos de campo corretamente",
    objetivo: "Escolher o tipo certo de cada campo para garantir preenchimento rápido no chão de fábrica e dados confiáveis para auditoria.",
    passos: [
      { acao: "Ao criar/editar um modelo, para cada campo escolha o TIPO adequado.", detalhe: "Isso muda como o operador preenche (teclado numérico, calendário, dropdown etc.) e como o dado é validado." },
    ],
    campos: [
      { nome: "Texto curto", descricao: "Nome do responsável, código do lote, número do equipamento. Máximo ~100 caracteres." },
      { nome: "Texto longo (textarea)", descricao: "Observações, não conformidades encontradas, ações corretivas. Suporta várias linhas." },
      { nome: "Número", descricao: "Temperatura, pH, concentração de cloro, peso, quantidade. Ativa teclado numérico no celular." },
      { nome: "Data", descricao: "Data do registro, data de coleta, prazo de validade. Ativa calendário." },
      { nome: "Sim/Não (checkbox)", descricao: "Checklists: 'EPI utilizado?', 'Superfície higienizada?', 'Amostra coletada?'." },
      { nome: "Lista de opções (select)", descricao: "Área da fábrica, turno, tipo de produto, status. Você define as opções." },
    ],
    resultado: "Modelo com tipos de campo apropriados = preenchimento 3x mais rápido e menos erros de digitação.",
    dicas: [
      "Sempre que possível, prefira 'Lista de opções' a 'Texto curto'. Padroniza a resposta e evita erros de grafia (ex: 'Sala A' vs 'sala a' vs 'SalaA').",
      "Para valores com unidade (temperatura, pH), coloque a unidade NO NOME do campo, não no valor. Ex: 'Temperatura (°C)' e o campo é só um número.",
    ],
    erros: [
      { erro: "Campo 'temperatura' criado como Texto curto.", correcao: "Muda para tipo Número. No celular ativa o teclado numérico e evita entradas como 'vinte graus'." },
    ],
  },
  {
    n: "7",
    titulo: "Preencher o primeiro registro digital (validar o modelo)",
    objetivo: "Testar o modelo antes de liberar para a equipe, garantindo que a estrutura faz sentido na prática.",
    prereq: [
      "Pelo menos 1 modelo criado (Passo 5-6).",
    ],
    passos: [
      { acao: "Abra 'Registros Digitais' no menu lateral.", detalhe: "Você verá a lista de registros existentes e o botão 'Novo registro'." },
      { acao: "Clique em 'Novo registro' e escolha o modelo que acabou de criar.", detalhe: "O formulário aparece com todos os campos configurados." },
      { acao: "Preencha título, data, responsável e todos os campos do formulário.", detalhe: "Simule o preenchimento como se fosse o operador de fábrica. Anote se algum campo é confuso ou está fora de ordem." },
      { acao: "Clique em 'Salvar rascunho'.", detalhe: "O registro fica editável — útil enquanto você ainda está testando." },
      { acao: "Se estiver satisfeito, clique em 'Salvar como vigente'.", detalhe: "O sistema gera um hash SHA-256 dos dados. O registro é TRAVADO — não pode mais ser editado. Serve como prova de integridade em auditoria." },
    ],
    resultado: "Registro na lista com selo verde 'Vigente', data, responsável e hash truncado clicável.",
    dicas: [
      "Faça 2-3 registros de teste no modo rascunho antes de liberar para a equipe. Se algo estiver estranho, volte no modelo (Passo 5) e ajuste.",
      "Só marque 'vigente' quando o dado for real e auditável — o hash congela tudo.",
    ],
    erros: [
      { erro: "Salvei como vigente e vi um erro depois.", correcao: "Registros vigentes NÃO podem ser editados. Crie um novo registro de correção com observação no textarea explicando o que foi ajustado. Isso mantém a rastreabilidade que o MAPA exige." },
    ],
  },
  {
    n: "8",
    titulo: "Importar planilhas de consultores (Google Sheets / Excel)",
    objetivo: "Aproveitar planilhas que consultores já usam nas fábricas, sem retrabalho de digitação.",
    prereq: [
      "Planilha em formato .xlsx, .xls, .csv OU link público do Google Sheets ('Qualquer pessoa com o link — Leitor').",
    ],
    passos: [
      { acao: "Abra 'Importar Planilhas' no menu lateral.", detalhe: "Tela dedicada com duas abas: 'Upload de arquivo' e 'Link do Google Sheets'." },
      { acao: "Escolha o modo de importação.", detalhe: "Upload: arraste o arquivo. Link: cole a URL pública do Google Sheets (deve terminar com '/edit#gid=0' ou similar)." },
      { acao: "Aguarde a detecção automática.", detalhe: "O sistema identifica se é um MODELO (cabeçalhos apenas, linhas em branco) ou REGISTROS (cabeçalhos + dados preenchidos)." },
      { acao: "No mapeador visual, ajuste cada coluna.", detalhe: "Para cada coluna você define: nome do campo no modelo digital, tipo (texto/número/data/select), obrigatoriedade, e se deve ser importada ou ignorada." },
      { acao: "Escolha o destino.", detalhe: "'Criar modelo novo' (colunas viram campos), 'Criar registros' (uma linha = um registro preenchido) ou 'Ambos' (cria o modelo e importa os registros de uma vez)." },
      { acao: "Clique em 'Importar'.", detalhe: "O sistema cria o(s) registro(s) no banco (tabela registros_customizados) e gera hash SHA-256 dos que forem marcados como vigentes." },
    ],
    resultado: "Planilha do consultor virou modelo digital + registros dentro da plataforma, sem digitação manual.",
    dicas: [
      "Se o consultor tiver 10 planilhas iguais (uma por mês), importe apenas a mais recente como MODELO e depois as outras como REGISTROS.",
      "Para Google Sheets privadas: por enquanto exporte como .xlsx e faça upload. A conexão OAuth (Fase 2) permitirá importar direto sem tornar pública.",
    ],
    erros: [
      { erro: "Link do Google Sheets retorna erro 403.", correcao: "A planilha não está pública. Vá em Compartilhar → 'Qualquer pessoa com o link' → 'Leitor'. Ou exporte como .xlsx e faça upload." },
      { erro: "Colunas mal detectadas (tudo virou 'texto').", correcao: "Ajuste manualmente no mapeador. Se datas estão como 'texto', é porque a planilha tem formato inconsistente — normalize no Excel antes de reimportar." },
    ],
  },
  {
    n: "9",
    titulo: "Manter a rotina — o que fazer toda semana e todo mês",
    objetivo: "Garantir que o acervo digital continua útil e auditável ao longo do tempo.",
    passos: [
      { acao: "TODA SEMANA: pedir para a equipe operacional gerar os registros digitais dos modelos ativos.", detalhe: "Higiene, pragas, temperatura de câmara — tudo o que era feito em papel deve virar registro digital. Papel pode conviver por 30-60 dias durante a transição." },
      { acao: "TODA SEMANA: revisar o card 'Sem POP vinculado' em Meu Acervo.", detalhe: "Mantenha zerado — se algo caiu lá, classifique." },
      { acao: "TODO MÊS: rodar a Análise por IA de novo.", detalhe: "Compare o score com o mês anterior. Se caiu, algum documento venceu ou algum modelo essencial ficou sem uso." },
      { acao: "TODO MÊS: adicionar 1-2 modelos novos.", detalhe: "Ataque os itens 'Essenciais' e 'Importantes' que ainda estão faltando no diagnóstico." },
      { acao: "TODO TRIMESTRE: exportar backup dos registros vigentes.", detalhe: "Use o botão 'Exportar Excel' em Registros Digitais. Guarde uma cópia externa — prática recomendada para auditoria." },
    ],
    resultado: "Fábrica com 100% da documentação obrigatória digitalizada, atualizada e auditável em ≤ 90 dias.",
    dicas: [
      "Cole em um lugar visível da fábrica o QR code das telas de registro digital. A equipe abre no celular direto e preenche.",
      "Faça uma reunião de 15 minutos por semana com a equipe para revisar o que foi preenchido e o que ficou faltando.",
    ],
  },
];

export default function GuiaCustomizacao() {
  const handlePrint = () => window.print();

  return (
    <div id="guia-print" className="space-y-6 max-w-4xl print:max-w-none print:space-y-4">
      {/* Cabeçalho + ações (ocultas na impressão) */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/feedbpf-custom/tutorial"><ArrowLeft className="w-4 h-4 mr-1" /> Voltar ao Tutorial</Link>
        </Button>
        <Button size="sm" onClick={handlePrint} className="bg-emerald-600 hover:bg-emerald-700">
          <Printer className="w-4 h-4 mr-1" /> Imprimir / Salvar PDF
        </Button>
      </div>

      <PageHeader
        icon={BookOpenCheck}
        title="Guia de Customização Feed_BPF"
        description="Passo a passo detalhado para transformar seu papel em documentação digital auditável"
      />

      {/* Introdução */}
      <Card className="border-emerald-500/30 bg-emerald-500/5 print:border-black print:bg-white">
        <CardContent className="p-6 space-y-3">
          <h2 className="text-lg font-bold">Como usar este guia</h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Este documento é a versão longa e detalhada do Tutorial. Cada seção descreve <strong>pré-requisitos, ação exata na tela, campos a preencher, resultado esperado, dicas e erros comuns</strong>. Siga na ordem se estiver começando do zero. Use como referência de consulta quando tiver dúvida em um passo específico.
          </p>
          <div className="flex flex-wrap gap-2 pt-1">
            <Badge className="bg-emerald-600 hover:bg-emerald-700">9 seções</Badge>
            <Badge variant="outline">Base: </Badge>
            
            <Badge variant="outline">Imprimível como PDF</Badge>
          </div>
        </CardContent>
      </Card>

      {/* Sumário */}
      <Card className="print:break-after-page">
        <CardContent className="p-6">
          <h2 className="text-base font-bold mb-3">Sumário</h2>
          <ol className="space-y-1 text-sm">
            {SECOES.map((s) => (
              <li key={s.n} className="flex gap-3">
                <span className="font-mono text-emerald-600 w-8 shrink-0">{s.n}.</span>
                <span>{s.titulo}</span>
              </li>
            ))}
          </ol>
        </CardContent>
      </Card>

      {/* Seções */}
      {SECOES.map((s) => (
        <Card key={s.n} className="print:break-inside-avoid print:shadow-none print:border print:border-black/20">
          <CardContent className="p-6 space-y-5">
            {/* Cabeçalho da seção */}
            <div className="flex items-start gap-4 border-b border-border/50 pb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-500 text-white flex items-center justify-center font-bold text-lg shrink-0">
                {s.n}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold leading-tight">{s.titulo}</h2>
                <p className="text-sm text-muted-foreground mt-1"><strong>Objetivo:</strong> {s.objetivo}</p>
              </div>
            </div>

            {/* Pré-requisitos */}
            {s.prereq && s.prereq.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Pré-requisitos</h3>
                <ul className="space-y-1">
                  {s.prereq.map((p, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Passos */}
            <div className="space-y-2">
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Passo a passo</h3>
              <ol className="space-y-3">
                {s.passos.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="font-mono text-emerald-600 shrink-0 font-bold">{s.n}.{i + 1}</span>
                    <div className="space-y-1">
                      <p className="font-medium">{p.acao}</p>
                      {p.detalhe && <p className="text-muted-foreground text-xs leading-relaxed">{p.detalhe}</p>}
                    </div>
                  </li>
                ))}
              </ol>
            </div>

            {/* Campos */}
            {s.campos && s.campos.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Campos / opções</h3>
                <div className="border rounded-lg divide-y">
                  {s.campos.map((c, i) => (
                    <div key={i} className="p-3 flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-sm font-bold">{c.nome}</span>
                          {c.obrigatorio && <Badge variant="outline" className="text-[10px] uppercase text-red-600 border-red-300">Obrigatório</Badge>}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{c.descricao}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Resultado */}
            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
              <p className="text-sm"><strong className="text-emerald-700 dark:text-emerald-400">Resultado esperado:</strong> <span className="text-foreground/85">{s.resultado}</span></p>
            </div>

            {/* Dicas */}
            {s.dicas && s.dicas.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><Lightbulb className="w-4 h-4 text-amber-600" /> Dicas</h3>
                <ul className="space-y-1.5">
                  {s.dicas.map((d, i) => (
                    <li key={i} className="text-sm text-foreground/85 pl-4 border-l-2 border-amber-400/50">{d}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Erros comuns */}
            {s.erros && s.erros.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1"><AlertTriangle className="w-4 h-4 text-red-600" /> Erros comuns e correção</h3>
                <div className="space-y-2">
                  {s.erros.map((e, i) => (
                    <div key={i} className="text-sm p-3 rounded-lg bg-red-500/5 border border-red-500/20">
                      <p className="font-medium text-red-700 dark:text-red-400">✗ {e.erro}</p>
                      <p className="text-xs text-foreground/85 mt-1">→ {e.correcao}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Próximo */}
            {s.proximo && (
              <div className="flex justify-end print:hidden">
                <Button asChild size="sm" variant="outline" className="border-emerald-500/50 text-emerald-700 hover:bg-emerald-500/10">
                  <Link to={s.proximo.link}>{s.proximo.texto} <ArrowRight className="w-4 h-4 ml-1" /></Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Rodapé do guia */}
      <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-none print:bg-white print:text-black print:border print:border-black">
        <CardContent className="p-6 text-center space-y-2">
          <p className="text-sm font-bold">Guia de Customização Feed_BPF · versão 1.0</p>
          <p className="text-xs opacity-90">BPF_Consult ·</p>
          <p className="text-xs opacity-75">Última atualização automática ao publicar a plataforma</p>
        </CardContent>
      </Card>

      {/* Estilos de impressão — força pagina\u00e7\u00e3o correta desatando os containers de scroll do layout */}
      <style>{`
        @media print {
          @page { size: A4; margin: 12mm 10mm; }
          html, body, #root { height: auto !important; min-height: 0 !important; overflow: visible !important; background: white !important; }
          body * { visibility: hidden; }
          #guia-print, #guia-print * { visibility: visible; }
          #guia-print {
            position: absolute !important;
            left: 0; top: 0; right: 0;
            width: 100% !important; max-width: none !important;
            padding: 0 !important; margin: 0 !important;
            background: white !important; color: black !important;
          }
          #guia-print .print\\:hidden, .print\\:hidden { display: none !important; }
          #guia-print .print\\:break-after-page { break-after: page; page-break-after: always; }
          #guia-print .print\\:break-inside-avoid { break-inside: avoid; page-break-inside: avoid; }
          /* Neutraliza containers de scroll do FeedBpfCustomLayout */
          [data-sidebar], header, aside, nav { display: none !important; }
          main, .overflow-hidden, .overflow-y-auto, .overflow-x-hidden, .h-screen {
            height: auto !important; max-height: none !important; overflow: visible !important;
            display: block !important; position: static !important;
          }
        }
      `}</style>
    </div>
  );
}
