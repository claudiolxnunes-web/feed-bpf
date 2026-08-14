import { useState } from "react";
import {
  BookOpen, LayoutDashboard, Building2, FileText, ClipboardCheck, AlertTriangle,
  Package, Factory, Search, Bug, GraduationCap, BarChart3, PlayCircle, FileDown,
  Scale, Users, Settings, ChevronDown, ChevronRight, HelpCircle, Droplets,
  Wrench, FlaskConical, ShieldCheck, Beaker, CalendarRange, Tag, FileSpreadsheet,
  Recycle, Pill, Star, UserCheck, Microscope, Activity, FileCheck
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";
import { DOCUMENTOS_ATIVACAO_CHECKLIST } from "@/config/documentosAtivacaoChecklist";

interface ManualSection {
  id: string;
  title: string;
  icon: React.ElementType;
  badge?: string;
  description: string;
  features: { title: string; text: string }[];
  tips?: string[];
}

const sections: ManualSection[] = [
  // ── GERAL ──
  {
    id: "dashboard",
    title: "Dashboard",
    icon: LayoutDashboard,
    badge: "Início",
    description:
      "Tela inicial do sistema com visão geral de todos os indicadores de BPF. Apresenta cards com métricas atualizadas ao carregar a tela e gráficos de evolução.",
    features: [
      { title: "Cards de Indicadores", text: "Exibe a conformidade BPF geral (%), total de NCs abertas, auditorias realizadas e treinamentos pendentes (vencidos ou a vencer em 30 dias)." },
      { title: "Conformidade por Área", text: "Barras de progresso mostrando o percentual de conformidade de cada área avaliada nas auditorias." },
      { title: "NCs Recentes", text: "Lista as 5 não conformidades mais recentes com setor, descrição e status." },
      { title: "Gráfico de NCs", text: "Gráfico de barras mostrando a evolução de NCs abertas vs. fechadas nos últimos 6 meses." },
      { title: "Gráfico de Conformidade", text: "Gráfico de linha mostrando a evolução do percentual de conformidade BPF ao longo do tempo." },
    ],
    tips: ["Os dados são consultados ao acessar a tela e podem permanecer em cache por até 5 minutos."],
  },
  {
    id: "cadastro",
    title: "Cadastro da Empresa",
    icon: Building2,
    badge: "Início",
    description:
      "Módulo para cadastrar e editar os dados da empresa: razão social, CNPJ, endereço, responsável técnico, CRMV, tipos de produção e capacidade instalada.",
    features: [
      { title: "Dados da Empresa", text: "Formulário para inserir nome, CNPJ, endereço completo, responsável técnico e número do CRMV." },
      { title: "Tipos de Produção", text: "Seleção múltipla dos tipos de produção (ração, suplemento, premix, sal mineral, etc.)." },
      { title: "Capacidade Instalada", text: "Informe a capacidade produtiva mensal da fábrica." },
    ],
  },
  {
    id: "produtos",
    title: "Produtos",
    icon: Tag,
    badge: "Início",
    description:
      "Cadastro completo de produtos acabados com dados regulatórios (MAPA), ficha técnica e editor de rótulos conforme IN 30/2009.",
    features: [
      { title: "Cadastro de Produto", text: "Registre nome, classificação (ração, suplemento, premix, etc.), espécie alvo, forma física, registro MAPA e composição." },
      { title: "Níveis de Garantia", text: "Informe os níveis de garantia do produto (umidade, PB, EE, FB, minerais, vitaminas, etc.) com valores mínimos e máximos." },
      { title: "Ficha Técnica", text: "Gere a ficha técnica consolidada em layout A4 com todos os dados regulatórios e comerciais, incluindo foto, diferenciais e modo de preparo." },
      { title: "Editor de Rótulos", text: "Crie e edite rótulos conforme legislação MAPA com todos os campos obrigatórios: composição, níveis de garantia, indicações de uso, precauções, dados da empresa e RT." },
    ],
    tips: ["A ficha técnica integra-se ao módulo PCP para reaproveitar dados de fórmulas.", "O rótulo pode ser configurado em dimensões customizáveis (mm)."],
  },

  // ── POP 01 — Fornecedores & MP ──
  {
    id: "recebimento",
    title: "Recebimento de Matéria-Prima",
    icon: Package,
    badge: "POP 01",
    description:
      "Controle de recebimento e inspeção de matérias-primas com certificado de análise e avaliação sensorial.",
    features: [
      { title: "Registro de Recebimento", text: "Informe data, fornecedor, matéria-prima, lote, quantidade e validade." },
      { title: "Inspeção Visual", text: "Avalie odor (normal/anormal), umidade, temperatura e presença de insetos." },
      { title: "Certificado de Análise", text: "Registre o número do certificado de análise e se é válido/inválido." },
      { title: "Aprovação/Rejeição", text: "Marque se o lote foi aprovado ou rejeitado. Lotes rejeitados podem gerar NCs." },
    ],
  },
  {
    id: "fornecedores",
    title: "Qualificação de Fornecedores",
    icon: UserCheck,
    badge: "POP 01",
    description:
      "Cadastro e avaliação de fornecedores com verificação SIPEAGRO e controle de qualificação.",
    features: [
      { title: "Cadastro Completo", text: "Nome, CNPJ, endereço, contato, e-mail e tipo de produto fornecido." },
      { title: "Avaliação e Nota", text: "Atribua notas de 0 a 10 e defina o status de qualificação (Aprovado, Aprovado c/ Restrições, Pendente, Reprovado)." },
      { title: "Verificação SIPEAGRO", text: "Registre o número de registro SIPEAGRO e a data de verificação para compliance com o MAPA." },
      { title: "Controle de Validade", text: "Registre a última e próxima avaliação programada." },
      { title: "Lista de Fornecedores Aprovados", text: "Tabela consolidada (PL POP 1.1) exibindo todos os fornecedores com status Aprovado ou Aprovado c/ Restrições." },
      { title: "Exportação Excel e PDF", text: "Exporte o questionário de qualificação e a lista de fornecedores aprovados nos formatos Excel (.xlsx) e PDF." },
    ],
  },
  {
    id: "analises-laboratorio",
    title: "Análises de Laboratório",
    icon: Microscope,
    badge: "POP 01",
    description:
      "Gestão de análises laboratoriais de matérias-primas e produtos acabados, com controle de laudos e conformidade.",
    features: [
      { title: "Registro de Análises", text: "Cadastre análises com tipo (físico-química, microbiológica, bromatológica), produto, lote e laboratório." },
      { title: "Resultados e Laudos", text: "Registre resultados, método de análise, limites de referência e número do laudo." },
      { title: "Conformidade", text: "Compare o resultado com o limite cadastrado e marque a análise como conforme ou não conforme." },
      { title: "Upload de Laudos", text: "Faça upload dos laudos em PDF para arquivo digital vinculado à análise." },
    ],
  },
  {
    id: "controle-substancias",
    title: "Controle de Substâncias Indesejáveis",
    icon: Pill,
    badge: "POP 01",
    description:
      "Monitoramento de substâncias indesejáveis, contaminantes e aditivos em matérias-primas conforme limites da legislação vigente.",
    features: [
      { title: "Tipos de Controle", text: "Gerencie micotoxinas (aflatoxinas, DON, fumonisinas), metais pesados (chumbo, mercúrio, cádmio) e aditivos." },
      { title: "Limites de Referência", text: "Compare resultados analíticos com os limites máximos normativos e classifique como conforme ou não conforme." },
      { title: "Vinculação com Fornecedor", text: "Relacione cada análise ao fornecedor e lote da matéria-prima para rastreabilidade." },
    ],
  },

  // ── POP 02 — Limpeza & Higienização ──
  {
    id: "higiene-sanitizacao",
    title: "Higiene e Sanitização",
    icon: Droplets,
    badge: "POP 02",
    description:
      "Módulo para POP 02 — Limpeza e Higienização das Instalações e Equipamentos, conforme IN 04/2007.",
    features: [
      { title: "Checklist Pré-Operacional", text: "7 áreas de verificação (pisos, silos, moegas, misturadores, etc.) com registro digital de conformidade antes de cada turno." },
      { title: "Cronograma de Higienização", text: "Programe limpezas por área, frequência, produto utilizado, concentração e responsável." },
      { title: "Registros de Limpeza", text: "Registre cada execução de limpeza com executor, horários, conformidade e observações." },
    ],
    tips: ["Mantenha os registros de limpeza pré-operacional sempre em dia para auditorias do MAPA."],
  },

  // ── POP 03 — Saúde do Pessoal ──
  {
    id: "saude-pessoal",
    title: "Saúde dos Manipuladores / ASO",
    icon: UserCheck,
    badge: "POP 03",
    description:
      "Gestão completa de Atestados de Saúde Ocupacional (ASO), exames laboratoriais e monitoramento de saúde dos manipuladores conforme POP 03 (IN 04/2007) e NR-7.",
    features: [
      { title: "Cadastro de Colaboradores", text: "Registre nome, cargo, data de admissão e tipo de exame (admissional, periódico, demissional, retorno ao trabalho)." },
      { title: "Controle de ASO", text: "Acompanhe no painel os ASOs vencidos ou a vencer em até 60 dias." },
      { title: "Exames Laboratoriais", text: "Registre coprocultura, hemograma, VDRL e outros exames com datas e resultados." },
      { title: "Dashboard de Conformidade", text: "Visualize rapidamente: total de colaboradores, ASOs válidos/vencidos e próximos vencimentos." },
      { title: "Histórico por Colaborador", text: "Consulte o histórico completo de exames e ASOs de cada manipulador para auditorias." },
    ],
    tips: [
      "Colaboradores com ASO vencido devem ser afastados das atividades até regularização.",
      "Exames periódicos devem seguir a periodicidade do PCMSO (geralmente anual).",
    ],
  },
  {
    id: "treinamentos",
    title: "Treinamentos",
    icon: GraduationCap,
    badge: "POP 03",
    description:
      "Controle de treinamentos dos funcionários com data de realização, instrutor e validade.",
    features: [
      { title: "Cadastro de Treinamento", text: "Registre funcionário, nome do treinamento, data, instrutor e validade." },
      { title: "Alertas de Vencimento", text: "O sistema identifica treinamentos vencidos ou a vencer nos próximos 30 dias e exibe no Dashboard." },
    ],
    tips: ["Mantenha todos os treinamentos de BPF dentro da validade para estar em conformidade com a legislação."],
  },
  {
    id: "controle-visitantes",
    title: "Controle de Visitantes",
    icon: Users,
    badge: "POP 03",
    description:
      "Registro e controle de acesso de visitantes às instalações, com orientação de biosseguridade e fornecimento de EPIs conforme IN 15/2009.",
    features: [
      { title: "Registro de Visitantes", text: "Cadastre nome, empresa, documento, motivo da visita, áreas visitadas e horários de entrada/saída." },
      { title: "Orientação de Biosseguridade", text: "Registre se o visitante recebeu orientação sobre normas de conduta e biosseguridade." },
      { title: "Fornecimento de EPIs", text: "Controle se foram fornecidos EPIs (touca, avental descartável, propés) ao visitante." },
      { title: "Acompanhante", text: "Registre o funcionário responsável por acompanhar o visitante durante toda a visita." },
      { title: "Declaração do Visitante", text: "Gere termo de responsabilidade com as normas e restrições, para assinatura do visitante." },
    ],
    tips: ["Visitantes com sintomas de enfermidades transmissíveis não devem acessar as instalações."],
  },

  // ── POP 04 — Potabilidade da Água ──
  {
    id: "potabilidade-agua",
    title: "Potabilidade da Água",
    icon: Beaker,
    badge: "POP 04",
    description:
      "Módulo dedicado ao controle de potabilidade da água, monitoramento de cloro residual, pH, coliformes e higienização de reservatórios conforme IN 04/2007 e Portaria GM/MS 888/2021.",
    features: [
      { title: "Dashboard de Indicadores", text: "Visão rápida dos parâmetros atuais: cloro residual, pH, turbidez e coliformes, com indicação visual de conformidade." },
      { title: "Pontos de Coleta", text: "Mapeamento dos pontos de coleta de água (entrada, produção, bebedouro, lavagem) com monitoramento diário de cloro e pH." },
      { title: "Laudos Laboratoriais", text: "Registro de análises microbiológicas e físico-químicas com upload de laudos em PDF e controle de conformidade." },
      { title: "Higienização de Reservatórios", text: "Checklist de 16 itens para limpeza semestral de caixas d'água com registro de executor, data e observações." },
      { title: "Conferência de Limites", text: "Confira se o cloro residual está na faixa de 0,2–2,0 mg/L e acompanhe a validade dos laudos." },
    ],
    tips: [
      "A higienização de reservatórios deve ser feita semestralmente por empresa especializada.",
      "Mantenha os laudos laboratoriais arquivados por no mínimo 2 anos.",
    ],
  },

  // ── POP 05 — Contaminação Cruzada ──
  {
    id: "contaminacao-cruzada",
    title: "Prevenção de Contaminação Cruzada",
    icon: ShieldCheck,
    badge: "POP 05",
    description:
      "Procedimentos para prevenção da contaminação cruzada no fluxo produtivo, armazenamento e identificação de matérias-primas, conforme IN 04/2007 e IN 15/2009.",
    features: [
      { title: "Checklist Semanal", text: "10 itens de verificação: sequência de produção, flushing, separação de ingredientes, identificação de MPs, armazenamento segregado." },
      { title: "Monitoramento de Limpeza", text: "Swabs, testes de água de enxágue, inspeção visual pós-limpeza e controle de produtos químicos." },
      { title: "Validação de Limpeza de Linha", text: "Registre produto anterior/seguinte, tipo de validação (flushing, swab, visual), resíduo detectado e limite aceitável." },
      { title: "Matriz de Sensibilidade", text: "Configure quais transições entre produtos requerem flushing obrigatório, especialmente quando envolvem medicamentos veterinários." },
    ],
    tips: ["Sempre valide a limpeza ao trocar de produto com medicamento para produto sem medicamento."],
  },
  {
    id: "producao",
    title: "Produção",
    icon: Factory,
    badge: "POP 05",
    description:
      "Registro simplificado de produção diária. Informe produto, lote, operador, tempo de mistura e quantidade produzida.",
    features: [
      { title: "Registro Diário", text: "Cadastre cada produção com data, produto, lote, operador e quantidade." },
      { title: "Tempo de Mistura", text: "Registre o tempo de mistura para controle de qualidade e rastreabilidade." },
    ],
  },
  {
    id: "pcp",
    title: "PCP / Ordens de Produção",
    icon: Settings,
    badge: "POP 05",
    description:
      "Planejamento e Controle de Produção com ordens detalhadas, fórmulas, batidas, retrabalho e controle de sobras.",
    features: [
      { title: "Ordens de Produção", text: "Crie ordens com número, produto, fórmula, quantidade, lote e prioridade. Suporte a ordens de retrabalho com vínculo à ordem original." },
      { title: "Fórmulas / Itens", text: "Cadastre os itens da fórmula com matéria-prima, quantidade, unidade, percentual e lote do fornecedor." },
      { title: "Batidas de Produção", text: "Registre cada batida com operador, horários, temperatura, tempo de mistura e observações." },
      { title: "Gestão de Sobras", text: "Controle quantidade de sobra de cada ordem e defina o destino (reprocesso, descarte, etc.)." },
      { title: "Status da Ordem", text: "Acompanhe: Programada → Em produção → Concluída → Cancelada." },
    ],
    tips: ["Vincule os lotes de MP recebidos às fórmulas para rastreabilidade completa."],
  },

  // ── POP 06 — Manutenção & Calibração ──
  {
    id: "manutencao-preventiva",
    title: "Manutenção e Calibração",
    icon: Wrench,
    badge: "POP 06",
    description:
      "Plano de manutenção preventiva/corretiva de equipamentos e calibração de instrumentos de medição, conforme IN 04/2007 e IN 15/2009.",
    features: [
      { title: "Cadastro de Equipamentos", text: "Registre equipamentos com código, descrição, localização e tipo de manutenção (preventiva, corretiva, preditiva)." },
      { title: "Programação de Manutenções", text: "Agende manutenções com datas programadas, responsáveis e controle de execução." },
      { title: "Registro de Execução", text: "Documente peças trocadas, custos, tempo de parada e próxima manutenção." },
      { title: "Calibrações", text: "Controle de calibração de balanças e instrumentos com certificados, datas e verificações intermediárias de balanças." },
    ],
    tips: ["Vincule manutenções aos cronogramas de limpeza para evitar gaps de produção."],
  },

  // ── POP 07 — Controle de Pragas ──
  {
    id: "pragas-expurgo",
    title: "Controle de Pragas e Expurgo",
    icon: Bug,
    badge: "POP 07",
    description:
      "Controle integrado de pragas e procedimentos de expurgo de grãos armazenados, conforme IN 04/2007.",
    features: [
      { title: "Monitoramento Semanal", text: "Inspeção de armadilhas, vedações, telas anti-inseto e indícios de pragas (roedores, insetos, pássaros)." },
      { title: "Aplicações e Laudos", text: "Registro de desinsetização, desratização, laudos da empresa terceirizada e mapa de iscas." },
      { title: "Controle de Expurgo", text: "Registro de expurgo de grãos com produto químico, dosagem, tempo de exposição e eficácia." },
    ],
  },

  // ── POP 08 — Resíduos ──
  {
    id: "controle-residuos",
    title: "Controle de Resíduos e Efluentes",
    icon: Recycle,
    badge: "POP 08",
    description:
      "Gestão de resíduos sólidos, efluentes e destino de produtos avariados/vencidos, conforme Decreto 12.031/2024 e IN 15/2009.",
    features: [
      { title: "Classificação de Resíduos", text: "Classifique resíduos como Classe I (perigosos) ou Classe II (não perigosos) e controle o destino final." },
      { title: "Descarte de Produtos", text: "Registre produtos descartados com lote, motivo (vencido, contaminado, avariado) e quantidade." },
      { title: "Efluentes e Emissões", text: "Monitore parâmetros de efluentes (DBO, pH, etc.) e controle licenças ambientais." },
      { title: "Manifesto de Transporte", text: "Registre manifestos de transporte de resíduos com empresa coletora, frequência e licenças." },
    ],
  },

  // ── POP 09 — Rastreabilidade ──
  {
    id: "rastreabilidade",
    title: "Rastreabilidade",
    icon: Search,
    badge: "POP 09",
    description:
      "Rastreabilidade bidirecional: do produto final até a matéria-prima e do lote vendido até o cliente. Inclui gestão de recall e testes de rastreabilidade.",
    features: [
      { title: "Vínculo Produto ↔ MP", text: "Relacione cada produto final com suas matérias-primas, lotes e fornecedores." },
      { title: "Origem Animal", text: "Identifique matérias-primas de origem animal com tipo específico para compliance regulatório." },
      { title: "Rastreio de Vendas", text: "Registre cliente, espécie destino, local de entrega, nota fiscal e quantidade vendida." },
      { title: "Gestão de Recall", text: "Ative recall em um lote, informe motivo e acompanhe o status." },
      { title: "Testes de Rastreabilidade", text: "Execute testes montante/jusante para verificar a capacidade de rastreio dentro do prazo regulatório (ex: 4 horas)." },
    ],
    tips: ["Em caso de recall, o sistema identifica rapidamente todos os clientes que receberam o lote afetado."],
  },

  // ── POP 10 — PAC / Auditoria ──
  {
    id: "auditoria",
    title: "Auditoria BPF",
    icon: ClipboardCheck,
    badge: "POP 10",
    description:
      "Checklist de auditoria interna baseado no Decreto 12.031/2024 (MAPA). Avalie cada item e gere relatórios de conformidade.",
    features: [
      { title: "Checklist por Área", text: "Itens organizados por áreas: Higiene, Instalações, Equipamentos, Controle de Qualidade, etc." },
      { title: "Avaliação Individual", text: "Marque cada item como conforme ou não conforme, com campo para observações." },
      { title: "Cálculo Automático", text: "O sistema calcula automaticamente o percentual de conformidade por área e geral." },
    ],
    tips: ["Realize auditorias periódicas (recomendado: mensal ou trimestral)."],
  },
  {
    id: "nao-conformidades",
    title: "Não Conformidades",
    icon: AlertTriangle,
    badge: "POP 10",
    description:
      "Registro e acompanhamento de todas as não conformidades identificadas, com sugestão de plano de ação por IA.",
    features: [
      { title: "Registro de NC", text: "Informe data, setor, descrição detalhada, causa raiz e ação corretiva planejada." },
      { title: "Plano de Ação", text: "Defina responsável e prazo para cada ação corretiva. O sistema alerta sobre prazos vencidos." },
      { title: "Status de Acompanhamento", text: "Acompanhe o ciclo: Aberta → Em andamento → Fechada." },
      { title: "IA para Plano de Ação", text: "Utilize inteligência artificial para sugerir causas e ações corretivas automaticamente." },
    ],
  },
  {
    id: "qualidade-total",
    title: "Qualidade Total / Reclamações",
    icon: Star,
    badge: "POP 10",
    description:
      "Gestão completa de reclamações de clientes e recolhimento de produtos, incluindo análise técnica e plano de ação corretiva/preventiva.",
    features: [
      { title: "Registro de Reclamações", text: "Cadastre reclamações com número, cliente, produto, lote, tipo (qualidade, corpo estranho, embalagem, etc.) e descrição detalhada." },
      { title: "Análise Técnica", text: "Registre causa raiz, análise técnica, ações imediatas, corretivas e preventivas com responsáveis e prazos." },
      { title: "Gestão de Recolhimento", text: "Para casos graves, ative o recolhimento de produto com rastreio de lotes afetados, quantidades e destino do produto recolhido." },
      { title: "Satisfação do Cliente", text: "Registre a resposta ao cliente e o nível de satisfação após a resolução." },
    ],
    tips: ["Vincule reclamações aos POPs de referência para análise sistêmica."],
  },
  {
    id: "matriz-risco",
    title: "Matriz de Risco / APPCC",
    icon: Activity,
    badge: "POP 10",
    description:
      "Análise de perigos e pontos críticos de controle (APPCC) com classificação de risco por probabilidade × severidade.",
    features: [
      { title: "Identificação de Perigos", text: "Cadastre perigos por etapa do processo, classificados como físico, químico ou biológico." },
      { title: "Classificação de Risco", text: "Avalie probabilidade e severidade para calcular automaticamente o nível de risco (Baixo, Médio, Alto, Crítico)." },
      { title: "Medidas de Controle", text: "Registre as medidas de controle para cada perigo identificado." },
    ],
  },
  {
    id: "categorizacao-risco",
    title: "Categorização de Risco — Tutorial",
    icon: ShieldCheck,
    badge: "POP 10",
    description:
      "Tutorial completo sobre como categorizar o risco do estabelecimento conforme o Decreto 12.031/2024 e IN 17/2017 do MAPA.",
    features: [
      { title: "Critérios de Avaliação", text: "O risco é determinado por: tipo de produto fabricado (medicamentoso = alto), espécies atendidas, volume de produção, histórico de conformidade e uso de substâncias controladas." },
      { title: "Método de Pontuação", text: "Responder questionário com SIM (100% do peso), PARCIAL (50%), NÃO (0%) ou N/A (excluído). Calcular: % Conformidade = (Σ Pontos / Σ Máximo) × 100." },
      { title: "Classificação de Risco", text: "≥80% = Risco BAIXO (verde). 50-79% = Risco MÉDIO (amarelo). <50% = Risco ALTO (vermelho)." },
      { title: "10 Categorias Avaliadas", text: "Infraestrutura, Higiene, Controle de MP, Processo Produtivo, Pragas, Treinamento, Rastreabilidade, Equipamentos, Documentação e PAC." },
      { title: "Periodicidade", text: "Avaliação semestral como rotina do PAC, após mudanças no processo, após NC crítica/recall, ou quando solicitado pelo SIF/MAPA." },
      { title: "Questionário Digital", text: "Acesse o módulo Matriz de Risco > aba 'Questionário de Risco' para realizar a avaliação automatizada." },
    ],
    tips: [
      "O Decreto 12.031/2024 alterou a classificação de estabelecimentos — atualize sua avaliação.",
      "Utilize o resultado da categorização para definir a frequência de auditorias internas no Planejamento Anual.",
    ],
  },

  // ── DOCUMENTAÇÃO & GESTÃO ──
  {
    id: "documentos",
    title: "Documentos / POPs",
    icon: FileText,
    badge: "Documentação",
    description:
      "Gerenciamento de todos os POPs e documentos do sistema de qualidade. Controle de versão, status e responsáveis.",
    features: [
      { title: "Cadastro de POPs", text: "Registre código, nome, versão, data de revisão e responsável de cada POP." },
      { title: "Status do Documento", text: "Controle se o documento está Ativo, Em Revisão ou Obsoleto." },
      { title: "Versionamento", text: "Histórico de versões para rastreabilidade de alterações." },
      { title: "Arquivos BPF", text: "Upload e gestão de arquivos digitalizados vinculados aos documentos do sistema." },
      { title: "Checklist de Ativação", text: `O manual agora traz o cadastro inicial exato de ${DOCUMENTOS_ATIVACAO_CHECKLIST.length} documentos (POPs + ITs) para liberar as planilhas físicas e digitais.` },
    ],
    tips: ["Mantenha todos os POPs atualizados antes de uma auditoria oficial.", "Cadastre primeiro POPs e ITs com o mesmo código operacional usado na execução para liberar os vínculos automáticos."],
  },
  {
    id: "planilhas-pop",
    title: "Planilhas de POP",
    icon: FileSpreadsheet,
    badge: "Documentação",
    description:
      "Registro mensal das planilhas de controle vinculadas a cada POP, com campos de assinatura do executor, supervisor e RT.",
    features: [
      { title: "Planilha Mensal", text: "Crie planilhas mensais para cada POP com código, periodicidade e status (Aberta, Preenchida, Verificada)." },
      { title: "Itens de Registro", text: "Adicione registros por período (turno/dia) com área, responsável, conformidade e observações." },
      { title: "Assinaturas Digitais", text: "Campos para assinatura do executor, supervisor e RT (com CRMV), com data de assinatura." },
      { title: "Verificação", text: "Registre quem verificou a planilha e quando, para auditoria e rastreabilidade." },
    ],
  },
  {
    id: "execucao-pops",
    title: "Execução de ITs / POPs",
    icon: PlayCircle,
    badge: "Documentação",
    description:
      "Registro da execução prática das Instruções de Trabalho e POPs no chão de fábrica.",
    features: [
      { title: "Registro de Execução", text: "Informe o POP executado, data, executor, setor e status (Pendente, Em execução, Concluído, Não conforme)." },
      { title: "Vinculação com Documentos", text: "Cada execução pode ser vinculada ao POP cadastrado no módulo de Documentos." },
      { title: "Referência de Auditoria", text: "Vincule a execução a um checklist de auditoria para rastreabilidade cruzada." },
      { title: "Observações", text: "Campo livre para anotações sobre desvios, condições especiais ou melhorias identificadas." },
    ],
  },
  {
    id: "instrucoes-trabalho",
    title: "Instruções de Trabalho (ITs)",
    icon: FileCheck,
    badge: "Documentação",
    description:
      "22 Instruções de Trabalho detalhadas cobrindo todos os 10 POPs obrigatórios. Cada IT fornece passo a passo operacional completo para o chão de fábrica.",
    features: [
      { title: "Cobertura Completa", text: "ITs para todos os 10 POPs: desde qualificação de fornecedores (IT-01) até auditoria interna e análise de indicadores (IT-10)." },
      { title: "Estrutura Padronizada", text: "Cada IT contém: objetivo, materiais necessários, EPIs obrigatórios, passo a passo numerado, critérios de aceitação, frequência e registro vinculado." },
      { title: "Acesso pelo Guia de POPs", text: "As ITs estão integradas ao Guia dos POPs (/guia-pops), dentro de cada POP na seção '10. Instruções de Trabalho'." },
      { title: "Modelos para Download", text: "Todas as 22 ITs estão disponíveis como modelos na Biblioteca de Modelos (/modelos) na categoria 'Instruções de Trabalho'." },
      { title: "Vinculação com Execução", text: "Cada IT indica o registro vinculado (planilha de controle) onde a execução deve ser documentada." },
    ],
    tips: [
      "Treine os operadores nas ITs específicas de suas funções antes de permitir a execução.",
      "As ITs devem ser revisadas junto com os POPs (anualmente ou após mudança de processo).",
    ],
  },

  // ── GESTÃO & RELATÓRIOS ──
  {
    id: "indicadores",
    title: "Indicadores",
    icon: BarChart3,
    badge: "Gestão",
    description:
      "Painel de indicadores de desempenho do sistema de qualidade com gráficos e métricas consolidadas.",
    features: [
      { title: "KPIs de Qualidade", text: "Visualize indicadores como taxa de conformidade, NCs por período, treinamentos realizados, etc." },
      { title: "Tendências", text: "Acompanhe a evolução dos indicadores ao longo do tempo com gráficos interativos." },
    ],
  },
  {
    id: "relatorios",
    title: "Relatórios",
    icon: FileDown,
    badge: "Gestão",
    description:
      "Geração e armazenamento de relatórios digitais e digitalizados, organizados por módulo.",
    features: [
      { title: "Relatórios Digitais", text: "Gere relatórios diretamente no sistema com dados consolidados de cada módulo." },
      { title: "Relatórios Digitalizados", text: "Faça upload de relatórios escaneados (laudos, certificados, etc.) e vincule ao módulo correspondente." },
      { title: "Relatório de Produção", text: "Visualize dados consolidados de produção com filtros por período e exportação." },
      { title: "Status", text: "Organize relatórios como Ativos ou Arquivados." },
    ],
  },
  {
    id: "planejamento-anual",
    title: "Planejamento Anual",
    icon: CalendarRange,
    badge: "Gestão",
    description:
      "Cronograma anual de atividades do sistema de qualidade com controle de execução e frequência.",
    features: [
      { title: "Atividades Programadas", text: "Cadastre atividades por categoria (auditoria, treinamento, calibração, manutenção, etc.) com frequência e mês de início." },
      { title: "Controle de Execução", text: "Registre última execução, próxima execução prevista e status (Programada, Em andamento, Concluída, Atrasada)." },
      { title: "Quantidade Prevista", text: "Defina a quantidade de execuções previstas no ano para cada atividade." },
    ],
  },
  {
    id: "legislacao",
    title: "Legislação & IA",
    icon: Scale,
    badge: "Gestão",
    description:
      "Consulte atualizações da legislação de alimentação animal (MAPA) usando busca assistida por IA, consulta inteligente e pesquisa SISLEGIS.",
    features: [
      { title: "Buscar Atualizações", text: "Clique em “Buscar Atualizações com IA” para consultar novas normas, atualizações e revogações relevantes para sua produção." },
      { title: "Classificação por Relevância", text: "Os resultados retornados pela busca com IA são classificados como relevância Alta, Média ou Baixa." },
      { title: "Resumo por IA", text: "Ao executar a busca, a IA gera um resumo claro de cada publicação." },
      { title: "Consulta à IA", text: "Faça perguntas sobre legislação diretamente ao assistente de IA integrado." },
      { title: "Pesquisa SISLEGIS", text: "Pesquise normas diretamente na base do SISLEGIS/DOU do MAPA, com filtros por categoria." },
      { title: "Base de Normas", text: "Cadastre e consulte normas com código, órgão, tipo, data de publicação e tags para busca rápida." },
    ],
    tips: ["Marque alertas como lidos para manter o controle do que já foi analisado."],
  },
  {
    id: "sala-auditor",
    title: "Sala do Auditor",
    icon: UserCheck,
    badge: "Gestão",
    description:
      "Espaço dedicado para auditores externos acessarem documentação e evidências de conformidade de forma organizada.",
    features: [
      { title: "Visão Consolidada", text: "Acesso rápido a todos os documentos, registros e evidências necessários para auditoria." },
      { title: "Organização por Módulo", text: "Documentação organizada por área (POPs, auditorias, treinamentos, calibrações, etc.)." },
    ],
  },
];

function SectionCard({ section, isOpen, onToggle }: { section: ManualSection; isOpen: boolean; onToggle: () => void }) {
  const Icon = section.icon;

  return (
    <Card className="border border-border transition-shadow hover:shadow-md">
      <button onClick={onToggle} className="w-full text-left">
        <CardHeader className="flex flex-row items-center gap-3 cursor-pointer">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 shrink-0">
            <Icon className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base font-semibold">{section.title}</CardTitle>
              {section.badge && (
                <Badge variant="secondary" className="text-xs">{section.badge}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-0.5 line-clamp-1">{section.description}</p>
          </div>
          {isOpen ? (
            <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0" />
          ) : (
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" />
          )}
        </CardHeader>
      </button>

      <div className={cn("overflow-hidden transition-all duration-300", isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0")}>
        <CardContent className="pt-0 space-y-4">
          <p className="text-sm text-foreground/80 leading-relaxed">{section.description}</p>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Funcionalidades:</h4>
            {section.features.map((f, i) => (
              <div key={i} className="flex gap-3 pl-1">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                <div>
                  <span className="text-sm font-medium text-foreground">{f.title}:</span>{" "}
                  <span className="text-sm text-muted-foreground">{f.text}</span>
                </div>
              </div>
            ))}
          </div>

          {section.id === "documentos" && (
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-foreground">Checklist inicial para ativação</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Código</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead>Versão</TableHead>
                    <TableHead>Revisão</TableHead>
                    <TableHead>Próx. revisão</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {DOCUMENTOS_ATIVACAO_CHECKLIST.map((item) => (
                    <TableRow key={item.codigo}>
                      <TableCell className="font-medium">{item.codigo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{item.nome}</TableCell>
                      <TableCell>{item.versao}</TableCell>
                      <TableCell>{item.dataRevisao}</TableCell>
                      <TableCell>{item.proximaRevisao}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {section.tips && section.tips.length > 0 && (
            <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <HelpCircle className="w-4 h-4 text-primary" />
                Dicas
              </div>
              {section.tips.map((tip, i) => (
                <p key={i} className="text-sm text-muted-foreground pl-6">• {tip}</p>
              ))}
            </div>
          )}
        </CardContent>
      </div>
    </Card>
  );
}

export default function Manual() {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});

  const toggleSection = (id: string) => {
    setOpenSections((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    sections.forEach((s) => (all[s.id] = true));
    setOpenSections(all);
  };

  const collapseAll = () => setOpenSections({});

  return (
    <>
      <PageHeader icon={BookOpen} title="Manual Feed_BPF" description="Manual de utilização do sistema Feed_BPF — guia das funcionalidades organizado pela sequência dos 10 POPs obrigatórios (IN 04/2007). Não confundir com o Manual BPF da empresa (gerado em 'Geração Manual BPF')." />

      <div className="flex gap-2 mb-6">
        <button onClick={expandAll} className="text-sm text-primary hover:underline font-medium">
          Expandir tudo
        </button>
        <span className="text-muted-foreground">|</span>
        <button onClick={collapseAll} className="text-sm text-primary hover:underline font-medium">
          Recolher tudo
        </button>
      </div>

      <div className="space-y-3">
        {sections.map((section) => (
          <SectionCard
            key={section.id}
            section={section}
            isOpen={openSections[section.id] ?? false}
            onToggle={() => toggleSection(section.id)}
          />
        ))}
      </div>
    </>
  );
}
