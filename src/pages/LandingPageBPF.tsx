import { BaseLegalBadge } from "@/components/BaseLegalBadge";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  ArrowRight, CheckCircle2, Factory, ClipboardCheck, 
  Search, BarChart3, ShieldCheck, Tag, Building2, 
  MessageCircle, AlertTriangle, CheckCircle, Smartphone, 
  Layers, Package, FileText, LayoutDashboard, Compass,
  Users, X, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import logoBpfConsult from "@/assets/logo-bpf-consult.png";
import { Seo } from "@/components/Seo";

const ORG_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "BPF_Consult",
  url: "https://www.bpfconsult.com.br",
  logo: "https://www.bpfconsult.com.br/favicon.png",
  description:
    "Plataforma integrada de BPF, Auditoria Digital e CRM para o agronegócio: Feed_BPF, Audits_BPF, Agro RC, Nutri_Agro Labels, NutriCRM e AgroGestão CRM.",
  sameAs: ["https://www.bpfconsult.com.br"],
  contactPoint: {
    "@type": "ContactPoint",
    contactType: "customer support",
    email: "contato@bpfconsult.com.br",
    areaServed: "BR",
    availableLanguage: ["Portuguese"],
  },
};

const SOFTWARE_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "Feed_BPF",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  offers: { "@type": "Offer", price: "0", priceCurrency: "BRL" },
  description:
    "Sistema completo de Boas Práticas de Fabricação (BPF) para fábricas de ração.",
};

export default function LandingPageBPF() {
  const navigate = useNavigate();
  const [showSupport, setShowSupport] = useState(false);

  const scrollToContact = () => {
    document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
  };

  const scrollToModules = () => {
    document.getElementById("modulos")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Seo
        title="BPF_Consult — BPF, Auditoria e CRM para Nutrição Animal"
        description="Plataforma integrada para fábricas de ração: BPF, auditoria digital, rastreabilidade, recall e CRM. Conformidade MAPA simplificada."
        canonical="https://www.bpfconsult.com.br/"
        jsonLd={[ORG_JSON_LD, SOFTWARE_JSON_LD]}
      />
      {/* Navbar Minimalist */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md z-50 border-b border-gray-100 py-4 px-6 flex justify-between items-center">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/")}>
          <img src={logoBpfConsult} alt="BPF_Consult Logo" className="h-8 w-auto object-contain" />
          <div className="font-bold text-2xl text-[#173404]">BPF<span className="text-[#97C459]">_Consult</span></div>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <Button variant="ghost" onClick={() => navigate("/auth")} className="hidden sm:flex text-slate-600 font-medium">Entrar</Button>
          <Button variant="outline" onClick={() => navigate("/demo/feedbpf")} className="hidden sm:flex border-[#97C459] text-[#173404] rounded-full px-5">Ver demo ao vivo</Button>
          <Button onClick={scrollToContact} className="bg-[#173404] text-white rounded-full px-6">Agendar Demo</Button>
        </div>
      </nav>


      {/* BLOCO 1 - HERO PRINCIPAL */}
      <section className="relative overflow-hidden bg-[#173404] pt-32 pb-24 px-4 text-center text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(151,196,89,0.1),transparent_50%)]" />
        <div className="relative max-w-4xl mx-auto z-10">
          <div className="mb-8 flex justify-center">
            <img 
              src={logoBpfConsult} 
              alt="BPF_Consult Logo" 
              className="w-32 h-32 sm:w-44 sm:h-44 object-contain opacity-90 drop-shadow-2xl" 
            />
          </div>
          <Badge className="mb-6 border-[#97C459] text-[#97C459] bg-transparent px-4 py-1">Consultoria & Tecnologia para Nutrição Animal</Badge>
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 leading-tight">Sua fábrica em conformidade. Seus processos no digital. Seu negócio no controle.</h1>

          <p className="text-lg sm:text-xl text-green-100/80 mb-10 max-w-2xl mx-auto">Plataforma e consultoria especializada em BPF, auditorias digitais, rastreabilidade e CRM para fábricas de rações e suplementos animais - com total aderência à do MAPA.</p>
          <div className="flex flex-col items-center gap-6">
            <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
              <Button onClick={() => navigate("/demo/feedbpf")} size="lg" className="bg-[#97C459] hover:bg-[#86b14d] text-[#173404] font-bold text-lg px-8 py-7 rounded-xl shadow-xl transition-all hover:scale-105 active:scale-95">
                ▶️ Ver demo ao vivo (2 min)
              </Button>
              <Button variant="outline" onClick={scrollToContact} className="border-white/20 text-white hover:bg-white/10 h-[60px] rounded-xl px-8">Agendar demonstração com especialista →</Button>
            </div>
            <p className="text-sm text-green-100/60 font-medium">Tour guiado em 10 telas com dados reais. Sem cadastro. Sem compromisso.</p>
          </div>
        </div>
      </section>

      {/* BLOCO 2 - SEÇÃO DE DOR / DESAFIOS */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#173404] mb-4">Você ainda lida com alguma dessas situações?</h2>
            <p className="text-slate-600 text-lg">São problemas comuns no setor. Mas nenhum deles precisa continuar assim.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              "📁 \"A documentação de BPF está espalhada em pastas, planilhas e e-mails. Se vier uma auditoria amanhã, não estou preparado.\"",
              "📋 \"Não sei se meus rótulos estão. Fico esperando ser notificado para agir.\"",
              "🔍 \"Se houver um problema com um lote, não consigo rastrear de onde veio nem para onde foi.\"",
              "📉 \"Minha equipe comercial trabalha de forma informal. Não tenho visibilidade da carteira de clientes.\"",
              "⚠️ \"Já passei por uma auditoria difícil. Não quero repetir. Mas não sei como me preparar de forma contínua.\"",
              "🧩 \"Cresci como empresa, mas meu controle de qualidade ainda é manual e cheio de gaps.\""
            ].map((text, i) => (
              <Card key={i} className="p-8 border-none shadow-sm hover:shadow-md transition-shadow bg-white rounded-2xl flex items-center">
                <p className="text-slate-700 italic leading-relaxed">{text}</p>
              </Card>
            ))}
          </div>
          <div className="mt-16 p-8 bg-white border border-slate-100 rounded-3xl text-center max-w-4xl mx-auto shadow-sm">
            <p className="text-slate-600 leading-relaxed">
              Esses problemas custam dinheiro, tempo e reputação. A BPF_Consult existe para resolver cada um deles - com tecnologia feita para o setor e consultores que já estiveram dentro de uma fábrica como a sua.
            </p>
          </div>
        </div>
      </section>

      {/* BLOCO 3 - SEÇÃO DE SOLUÇÃO */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#173404] mb-4">Uma plataforma feita para quem fabrica. Uma consultoria para quem quer resultado.</h2>
            <p className="text-slate-600 text-lg mb-8">Não vendemos software genérico. Não somos consultores de apostila.</p>
            <div className="max-w-3xl mx-auto text-slate-600 leading-relaxed space-y-4">
              <p>A BPF_Consult combina tecnologia especializada com consultoria técnica de quem conhece o setor.</p>
              <p>Cada funcionalidade da nossa plataforma foi desenvolvida a partir da realidade das fábricas de rações e suplementos: os fluxos, os riscos, as exigências do MAPA e os desafios do dia a dia da produção.</p>
              <p>O resultado é um sistema que sua equipe usa de verdade - e uma consultoria que acompanha a implementação até o resultado aparecer.</p>
            </div>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <Card className="p-8 border-t-4 border-t-[#173404] shadow-lg rounded-2xl text-center">
              <Smartphone className="h-12 w-12 text-[#173404] mx-auto mb-6" />
              <h3 className="font-bold text-xl mb-4">Plataforma Digital</h3>
              <p className="text-slate-600">Módulos integrados para BPF, auditorias, rastreabilidade, rotulagem e CRM. Tudo em um só lugar.</p>
            </Card>
            <Card className="p-8 border-t-4 border-t-[#173404] shadow-lg rounded-2xl text-center">
              <Users className="h-12 w-12 text-[#173404] mx-auto mb-6" />
              <h3 className="font-bold text-xl mb-4">Consultoria Especializada</h3>
              <p className="text-slate-600">Diagnóstico, implantação e acompanhamento contínuo por especialistas que conhecem o setor.</p>
            </Card>
            <Card className="p-8 border-t-4 border-t-[#173404] shadow-lg rounded-2xl text-center">
              <ShieldCheck className="h-12 w-12 text-[#173404] mx-auto mb-6" />
              <h3 className="font-bold text-xl mb-4">Conformidade Garantida</h3>
              <p className="text-slate-600">Desenvolvido para apoiar os procedimentos de BPF e a organização dos registros da sua fábrica.</p>
            </Card>
          </div>
        </div>
      </section>

      {/* BLOCO 4 - MÓDULOS / FUNCIONALIDADES */}
      <section id="modulos" className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#173404] mb-4">Tudo o que sua fábrica precisa, organizado em módulos</h2>
            <p className="text-slate-600 text-lg">Cada módulo resolve um problema real. Use isolado ou integrado.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Módulo 1 */}
            <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
              <Factory className="h-10 w-10 text-[#173404] mb-6" />
              <h3 className="text-xl font-bold mb-4 text-[#173404]">Feed_BPF: Gestão de BPF Digital</h3>
              <p className="text-slate-600 mb-6 text-sm">Digitalize POPs, registros de controle de qualidade e documentação de BPF. Tudo estruturado.</p>
              <ul className="space-y-3 mb-8">
                {["POPs digitais acessíveis", "Alertas automáticos de NC", "Histórico de registros", "Manual de BPF integrado"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#97C459]" /> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <Button variant="link" onClick={scrollToContact} className="p-0 text-[#173404] font-bold">Saia do papel agora →</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/feedbpf")} className="text-slate-400 text-xs">Ver detalhes</Button>
              </div>
            </Card>

            {/* Módulo 2 */}
            <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
              <ShieldCheck className="h-10 w-10 text-[#173404] mb-6" />
              <h3 className="text-xl font-bold mb-4 text-[#173404]">Audits_BPF: Auditorias Sem Improviso</h3>
              <p className="text-slate-600 mb-6 text-sm">Prepare-se para auditorias do MAPA com simulações, checklists e planos de ação. Sem surpresas.</p>
              <ul className="space-y-3 mb-8">
                {["Checklists alinhados", "Relatórios automáticos", "Plano de ação integrado", "Histórico de auditorias"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#97C459]" /> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <Button variant="link" onClick={scrollToContact} className="p-0 text-[#173404] font-bold">Prepare-se já →</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/auditsbpf")} className="text-slate-400 text-xs">Ver detalhes</Button>
              </div>
            </Card>

            {/* Módulo 3 */}
            <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
              <Layers className="h-10 w-10 text-[#173404] mb-6" />
              <h3 className="text-xl font-bold mb-4 text-[#173404]">Agro RC: Rastreabilidade Total</h3>
              <p className="text-slate-600 mb-6 text-sm">Rastreie cada lote de matéria-prima e produto acabado do recebimento até o destino final.</p>
              <ul className="space-y-3 mb-8">
                {["Rastreamento completo", "Gestão de recalls", "Histórico de movimentação", "Integração com estoque"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#97C459]" /> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <Button variant="link" onClick={scrollToContact} className="p-0 text-[#173404] font-bold">Controle seus lotes →</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/agro-rc")} className="text-slate-400 text-xs">Ver detalhes</Button>
              </div>
            </Card>

            {/* Módulo 4 */}
            <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
              <Tag className="h-10 w-10 text-[#173404] mb-6" />
              <h3 className="text-xl font-bold mb-4 text-[#173404]">Nutri_Agro Labels: Rotulagem</h3>
              <p className="text-slate-600 mb-6 text-sm">Valide e gerencie seus rótulos com base. Reduza o risco de notificações.</p>
              <ul className="space-y-3 mb-8">
                {["Validação", "Alertas obrigatórios", "Suporte registro MAPA", "Biblioteca de rótulos"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#97C459]" /> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <Button variant="link" onClick={scrollToContact} className="p-0 text-[#173404] font-bold">Rotule com segurança →</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/rotulos")} className="text-slate-400 text-xs">Ver detalhes</Button>
              </div>
            </Card>

            {/* Módulo 5 */}
            <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
              <BarChart3 className="h-10 w-10 text-[#173404] mb-6" />
              <h3 className="text-xl font-bold mb-4 text-[#173404]">NutriCRM: CRM Nutrição Animal</h3>
              <p className="text-slate-600 mb-6 text-sm">Gerencie distribuidores, revendas e clientes diretos com um CRM pensado para o setor.</p>
              <ul className="space-y-3 mb-8">
                {["Pipeline por representante", "Histórico de pedidos", "Alertas clientes inativos", "Réguas automatizadas"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#97C459]" /> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <Button variant="link" onClick={scrollToContact} className="p-0 text-[#173404] font-bold">Evolua seu comercial →</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/nutricrm")} className="text-slate-400 text-xs">Ver detalhes</Button>
              </div>
            </Card>

            {/* Módulo 6 */}
            <Card className="p-8 bg-white border-none shadow-sm rounded-2xl">
              <Compass className="h-10 w-10 text-[#173404] mb-6" />
              <h3 className="text-xl font-bold mb-4 text-[#173404]">AgroGestão: Gestão Estratégica</h3>
              <p className="text-slate-600 mb-6 text-sm">Visão de negócio: metas, desempenho por região e indicadores para a diretoria.</p>
              <ul className="space-y-3 mb-8">
                {["Dashboards em tempo real", "Análise de carteira", "Relatórios executivos", "Acompanhamento de metas"].map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    <CheckCircle className="h-4 w-4 text-[#97C459]" /> {f}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between">
                <Button variant="link" onClick={scrollToContact} className="p-0 text-[#173404] font-bold">Tome decisões com dados →</Button>
                <Button variant="ghost" size="sm" onClick={() => navigate("/agrogestao")} className="text-slate-400 text-xs">Ver detalhes</Button>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* BLOCO 5 - BENEFÍCIOS */}
      <section className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#173404] mb-4">O que muda na sua operação quando você usa a BPF_Consult</h2>
            <p className="text-slate-600 text-lg">Resultados que aparecem nas primeiras semanas.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-12 mb-20">
            {[
              { t: "Conformidade", d: "Opere com segurança regulatória.", icon: ShieldCheck },
              { t: "Rastreabilidade", d: "Saiba onde está cada lote em tempo real.", icon: Search },
              { t: "Produtividade", d: "Processos padronizados reduzem retrabalho.", icon: Factory },
              { t: "Redução de Erros", d: "Validações automáticas que protegem sua operação.", icon: AlertTriangle },
              { t: "Centralização", d: "Tudo num só lugar, acessível por quem precisa.", icon: Package },
              { t: "Dados p/ Decisão", d: "Dashboards em tempo real para gestores e donos.", icon: BarChart3 },
            ].map((b, i) => (
              <div key={i} className="flex gap-4">
                <div className="h-12 w-12 bg-green-50 rounded-xl flex items-center justify-center shrink-0">
                  <b.icon className="h-6 w-6 text-[#173404]" />
                </div>
                <div>
                  <h4 className="font-bold text-lg mb-2">{b.t}</h4>
                  <p className="text-slate-600 text-sm leading-relaxed">{b.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 sm:p-12 text-white overflow-hidden relative">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#97C459]/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <h3 className="text-2xl font-bold mb-10 text-center">Transformação Real: Antes vs Depois</h3>
            <div className="overflow-x-auto">
              <Table className="min-w-[600px]">
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-white font-bold text-lg">❌ Antes da BPF_Consult</TableHead>
                    <TableHead className="text-[#97C459] font-bold text-lg">✅ Com a BPF_Consult</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[
                    ["Documentação em pastas e e-mails", "Tudo centralizado, digital e auditável"],
                    ["Auditoria como evento de pânico", "Preparação contínua, resultado previsível"],
                    ["Rastreabilidade manual/inexistente", "Lotes rastreáveis em segundos"],
                    ["CRM genérico ou sem processo", "Gestão comercial especializada"],
                    ["Rótulos desatualizados", "Conformidade validada automaticamente"],
                    ["Decisões baseadas em intuição", "Dashboards com dados em tempo real"]
                  ].map((row, i) => (
                    <TableRow key={i} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="py-4 text-slate-400">{row[0]}</TableCell>
                      <TableCell className="py-4 font-medium">{row[1]}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 6 - PROVA SOCIAL */}
      <section className="py-24 px-4 bg-slate-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#173404] mb-4">Fábricas que transformaram a operação</h2>
            <p className="text-slate-600 text-lg">Resultados reais de quem saiu do improviso.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-20">
            {[
              { v: "+120", l: "Fábricas atendidas" },
              { v: "100%", l: "Aprovação auditorias" },
              { v: "+12 anos", l: "Experiência no setor" },
              { v: "8 estados", l: "Atuação direta" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-4xl font-bold text-[#173404] mb-2">{s.v}</div>
                <div className="text-slate-500 text-sm font-medium uppercase tracking-wider">{s.l}</div>
              </div>
            ))}
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { d: "\"Passamos por uma auditoria surpresa três semanas depois de implementar a plataforma. Aprovados em tudo.\"", a: "R.T. | Fábrica de Suplementos MG" },
              { d: "\"Nossa carteira tinha 40% de clientes inativos que a gente nem sabia. Em 60 dias reativamos um terço.\"", a: "Diretor Comercial | Indústria de Rações PR" },
              { d: "\"Tinha receio de que o sistema fosse complexo. Em duas semanas, todo mundo estava usando sem ajuda.\"", a: "Gerente Industrial | Rações Pet SP" },
            ].map((t, i) => (
              <Card key={i} className="p-8 bg-white shadow-sm border-none rounded-2xl italic">
                <p className="text-slate-600 mb-6">"{t.d}"</p>
                <p className="text-slate-900 font-bold text-sm not-italic">— {t.a}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* BLOCO 7 - COMO FUNCIONA */}
      <section className="py-24 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-[#173404] mb-4">Da primeira conversa à operação transformada</h2>
            <p className="text-slate-600 text-lg">Um processo simples, direto e com você do começo ao fim.</p>
          </div>

          <div className="space-y-12">
            {[
              { t: "Diagnóstico", d: "Fazemos uma análise da situação atual da sua fábrica. Você recebe um mapa claro do que precisa ser resolvido." },
              { t: "Configuração", d: "Configuramos a plataforma de acordo com a sua operação: produtos, fluxos e usuários." },
              { t: "Treinamento", d: "Treinamos sua equipe diretamente na plataforma. Em até duas semanas, seu time opera com autonomia." },
              { t: "Acompanhamento", d: "Não vamos embora depois da entrega. Nossos especialistas acompanham a evolução continuamente." },
              { t: "Resultado", d: "Sua fábrica em conformidade, com processos documentados e comercial estruturado." },
            ].map((s, i) => (
              <div key={i} className="flex gap-8 items-start">
                <div className="h-12 w-12 bg-[#173404] text-[#97C459] rounded-full flex items-center justify-center shrink-0 font-bold text-xl">
                  {i + 1}
                </div>
                <div>
                  <h4 className="text-xl font-bold mb-2 text-[#173404]">{s.t}</h4>
                  <p className="text-slate-600 leading-relaxed">{s.d}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Button onClick={scrollToContact} className="bg-[#97C459] hover:bg-[#86b14d] text-[#173404] font-bold px-8 py-6 rounded-xl">
              Quero começar com um diagnóstico gratuito →
            </Button>
          </div>
        </div>
      </section>

      {/* BLOCO 8 - IN 17/2023 DO MAPA */}
      <section className="py-24 px-4 bg-[#173404] text-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold mb-8">Sua fábrica está pronta para a fiscalização?<BaseLegalBadge assunto="rotulagem" /></h2>
              <div className="space-y-6 text-green-100/80 leading-relaxed">
                <p>Organize os registros, a rotulagem e o controle de qualidade da sua fábrica.</p>
                <p>As mudanças afetam diretamente:</p>
                <ul className="space-y-4">
                  {[
                    "📌 O processo de registro de produtos junto ao MAPA",
                    "🏷️ As exigências de rotulagem e declarações nutricionais",
                    "🏭 Os padrões de BPF e controle de qualidade",
                    "🔍 A rastreabilidade de matérias-primas e acabados"
                  ].map((it, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5 text-[#97C459]" /> {it}
                    </li>
                  ))}
                </ul>
                <p className="pt-4 font-bold text-white">Não espere uma notificação para agir. A adequação mais barata é a que acontece antes do problema.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { t: "Registro", d: "Fluxo de protocolo atualizado." },
                { t: "Rotulagem", d: "Validação automática." },
                { t: "BPF", d: "Checklists alinhados." },
                { t: "Rastreio", d: "Padrão aceito auditoria." },
              ].map((c, i) => (
                <div key={i} className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                  <h4 className="font-bold text-[#97C459] mb-2">{c.t}</h4>
                  <p className="text-xs text-green-100/60">{c.d}</p>
                </div>
              ))}
              <div className="col-span-2 pt-4">
                <Button onClick={scrollToContact} variant="outline" className="w-full border-white/20 text-white hover:bg-white/10 py-6">
                  Verificar a conformidade da minha fábrica →
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* BLOCO 9 - CTA FINAL & FORM */}
      <section id="contato" className="py-24 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-3xl sm:text-4xl font-bold text-[#173404] mb-6">Sua fábrica pode estar a uma auditoria de um problema sério. Ou de uma virada de chave.</h2>
              <p className="text-slate-600 text-lg mb-8 italic">A diferença entre as duas situações é o processo que você tem hoje.</p>
              <div className="space-y-6">
                <p className="text-slate-600">Agende uma demonstração gratuita de 30 minutos. Vamos analisar o cenário da sua fábrica e mostrar exatamente como a BPF_Consult pode ajudar.</p>
                <div className="flex flex-col gap-4">
                  <Button
                    size="lg"
                    onClick={() => navigate("/demo/feedbpf")}
                    className="bg-[#97C459] hover:bg-[#86b14d] text-[#173404] font-bold h-14 rounded-xl"
                  >
                    ▶️ Ver demo ao vivo agora
                  </Button>
                  <Button
                    size="lg"
                    variant="outline"
                    onClick={() =>
                      window.open(
                        "https://wa.me/5561996757585?text=" +
                          encodeURIComponent("Olá! Vim do site BPF_Consult e gostaria de uma demonstração."),
                        "_blank",
                      )
                    }
                    className="h-14 rounded-xl border-slate-200"
                  >
                    <MessageCircle className="h-5 w-5 mr-2 text-green-600" /> Falar pelo WhatsApp
                  </Button>
                </div>
                <p className="text-xs text-slate-400">Atendemos fábricas de todos os portes: do pequeno produtor à grande indústria.</p>
              </div>
            </div>

            <Card className="p-8 sm:p-10 shadow-2xl border-none rounded-3xl bg-slate-50">
              <h3 className="text-xl font-bold mb-6 text-slate-900">Quero falar com um especialista</h3>
              <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                <div className="grid gap-4">
                  <Input placeholder="Nome completo *" className="bg-white" />
                  <Input placeholder="Nome da empresa *" className="bg-white" />
                  <div className="grid grid-cols-2 gap-4">
                    <Input placeholder="WhatsApp *" className="bg-white" />
                    <Input placeholder="E-mail *" className="bg-white" type="email" />
                  </div>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Segmento" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="racoes">Rações</SelectItem>
                      <SelectItem value="suplementos">Suplementos</SelectItem>
                      <SelectItem value="ambos">Ambos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Principal necessidade" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bpf">BPF</SelectItem>
                      <SelectItem value="auditoria">Auditoria</SelectItem>
                      <SelectItem value="rotulagem">Rotulagem</SelectItem>
                      <SelectItem value="crm">CRM</SelectItem>
                      <SelectItem value="nao-sei">Não sei por onde começar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-[#173404] text-white font-bold h-12 mt-4">
                  Solicitar Contato
                </Button>
                <p className="text-[10px] text-center text-slate-400 mt-4 leading-relaxed">
                  Seus dados são usados apenas para retorno da nossa equipe. Sem spam. Em conformidade com a LGPD.
                </p>
              </form>
            </Card>
          </div>
        </div>
      </section>

      {/* RODAPÉ */}
      <footer className="bg-slate-50 border-t border-slate-100 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8 text-center md:text-left">
            <div>
              <div className="flex items-center gap-2 mb-4 justify-center md:justify-start">
                <img src={logoBpfConsult} alt="BPF_Consult Logo" className="h-8 w-8 object-contain" />
                <div className="font-bold text-xl text-[#173404]">BPF<span className="text-[#97C459]">_Consult</span></div>
              </div>
              <p className="text-sm text-slate-500 max-w-xs">Consultoria técnica e tecnologia especializada para fábricas de nutrição animal.</p>
            </div>
            <div className="flex gap-8 text-sm font-medium text-slate-600">
              <Button variant="link" onClick={() => navigate("/privacidade")} className="p-0 h-auto font-medium hover:text-[#173404]">Privacidade</Button>
              <Button variant="link" onClick={() => navigate("/termos")} className="p-0 h-auto font-medium hover:text-[#173404]">Termos</Button>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#173404]">LinkedIn</a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-[#173404]">Instagram</a>
              
            </div>
          </div>
          <Separator className="my-8 opacity-50" />
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-400 uppercase tracking-widest font-bold">
            <p>BPF_Consult © {new Date().getFullYear()} · Todos os direitos reservados</p>
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">🔒 SSL Seguro</span>
              <span className="flex items-center gap-1">✅ LGPD Compliant</span>
            </div>
          </div>
        </div>
      </footer>
      {/* Floating Support Button */}
      <div className="fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-4">
        {showSupport && (
          <Card className="w-80 p-6 shadow-2xl border-none animate-in fade-in slide-in-from-bottom-4 duration-300">
            <div className="flex justify-between items-center mb-4">
              <h4 className="font-bold text-[#173404]">Suporte BPF_Consult</h4>
              <Button variant="ghost" size="sm" onClick={() => setShowSupport(false)} className="h-8 w-8 p-0">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <p className="text-sm text-slate-600">Como podemos ajudar você hoje?</p>
              <div className="space-y-2">
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm h-10"
                  onClick={() => {
                    window.open("https://wa.me/5500000000000", "_blank");
                    setShowSupport(false);
                  }}
                >
                  <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
                  Falar com especialista
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full justify-start text-sm h-10"
                  onClick={() => {
                    scrollToContact();
                    setShowSupport(false);
                  }}
                >
                  <Send className="h-4 w-4 mr-2 text-blue-600" />
                  Solicitar diagnóstico
                </Button>
              </div>
            </div>
          </Card>
        )}
        <Button 
          onClick={() => setShowSupport(!showSupport)}
          className={`h-14 w-14 rounded-full shadow-2xl transition-all duration-300 ${
            showSupport ? "bg-slate-200 text-slate-600 rotate-90" : "bg-[#173404] text-white hover:scale-110"
          }`}
        >
          {showSupport ? <X /> : <MessageCircle className="h-7 w-7" />}
        </Button>
      </div>
    </div>
  );
}
