import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderOpen, Upload, Layers, FileSignature, CheckCircle2, ArrowRight, Sparkles } from "lucide-react";
import { Seo } from "@/components/Seo";
const WHATSAPP_CONTATO = "https://wa.me/5562996075522";

export default function FeedBpfCustomLanding() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-50/50 via-background to-teal-50/30">
      <Seo
        title="Feed_BPF Custom — Gestor de Documentos BPF Customizável"
        description="Traga a documentação BPF que sua fábrica já tem. Organize por POP, controle vencimentos e digitalize no seu ritmo, usando seus próprios modelos."
      />

      {/* Hero */}
      <section className="container mx-auto px-4 py-16 sm:py-24 max-w-5xl">
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-700 text-xs font-semibold uppercase tracking-widest">
            <Sparkles className="w-3.5 h-3.5" /> Novo em 2026
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 via-teal-600 to-emerald-500 bg-clip-text text-transparent">
            Feed_BPF Custom
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            <strong>Traga a documentação BPF que sua fábrica já tem.</strong> A gente organiza, controla vencimentos e, no seu ritmo, digitaliza — sempre usando os seus modelos, não os nossos.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700">
              <Link to="/cadastro?produto=feedbpfcustom">
                Começar teste grátis de 7 dias <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/feedbpf-custom/acervo">Já tenho conta — entrar</Link>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Sem cartão. Cancele quando quiser.</p>
        </div>
      </section>

      {/* Comparação */}
      <section className="container mx-auto px-4 py-12 max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">Qual versão é a sua?</h2>
        <div className="grid gap-6 md:grid-cols-2">
          <Card className="border-2">
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold">Feed_BPF</h3>
              <p className="text-sm text-muted-foreground">Fábrica-modelo pronta. POPs, ITs e planilhas nossas.</p>
              <ul className="space-y-2 text-sm">
                {["Ideal para começar do zero", "20+ módulos operacionais fixos", "Modelos padronizados MAPA", "Curva de aprendizado maior"].map(f => (
                  <li key={f} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-primary mt-0.5 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild variant="outline" className="w-full"><Link to="/feedbpf">Ver Feed_BPF</Link></Button>
            </CardContent>
          </Card>

          <Card className="border-2 border-emerald-500 shadow-lg shadow-emerald-500/10 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest">Novo</div>
            <CardContent className="p-6 space-y-4">
              <h3 className="text-xl font-bold text-emerald-700">Feed_BPF Custom</h3>
              <p className="text-sm text-muted-foreground">Gestor da documentação que sua fábrica já tem, com digitalização gradual.</p>
              <ul className="space-y-2 text-sm">
                {["Ideal para fábrica com BPF já implantado", "Documentos livres + modelos do cliente", "Formulários digitais customizáveis", "Adoção rápida — usa o que já existe"].map(f => (
                  <li key={f} className="flex items-start gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full bg-emerald-600 hover:bg-emerald-700"><Link to="/cadastro?produto=feedbpfcustom">Testar grátis 7 dias</Link></Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Jornada */}
      <section className="container mx-auto px-4 py-16 max-w-5xl">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-3">Sua jornada em 4 fases</h2>
        <p className="text-center text-muted-foreground mb-12">Do papel ao 100% digital, no ritmo da sua equipe.</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Upload, titulo: "1. Importar", desc: "Arraste a pasta inteira. Sistema sugere o POP de cada arquivo pelo nome." },
            { icon: FolderOpen, titulo: "2. Organizar", desc: "Cada documento ganha POP, tipo, data e validade. Dashboard mostra o que vence." },
            { icon: Layers, titulo: "3. Digitalizar", desc: "Marque seus melhores modelos e gere formulários digitais usando o layout deles." },
            { icon: FileSignature, titulo: "4. Operar", desc: "Registros digitais com assinatura, hash SHA-256 e workflow — respeitando seu modelo." },
          ].map((f) => (
            <Card key={f.titulo} className="border">
              <CardContent className="p-5 space-y-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <f.icon className="w-5 h-5 text-emerald-600" />
                </div>
                <h3 className="font-bold">{f.titulo}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Plano único */}
      <section className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-block px-4 py-1 rounded-full border text-xs tracking-widest uppercase mb-3">Plano Único</div>
          <h2 className="text-2xl sm:text-3xl font-bold">Um preço, você escolhe o quanto usa</h2>
          <p className="text-muted-foreground mt-2">Semestral 15% OFF • Anual 25% OFF • 7 dias grátis, sem cartão</p>
        </div>

        <Card className="border-2 border-emerald-500 shadow-xl shadow-emerald-500/10 relative overflow-hidden">
          <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-lg bg-emerald-600 text-white text-xs font-bold uppercase tracking-widest">
            Personalizável
          </div>
          <CardContent className="p-8 space-y-6">
            <div className="text-center space-y-2">
              <p className="text-sm font-semibold text-emerald-700 uppercase tracking-wider">Feed_BPF Custom</p>
              <p className="text-xs text-muted-foreground">1 empresa • Módulos ativáveis pelo cliente</p>
            </div>

            <div className="text-center py-4 border-y">
              <div className="flex items-baseline justify-center gap-1">
                <span className="text-5xl font-bold">R$ 497</span>
                <span className="text-lg text-muted-foreground">/mês</span>
              </div>
              <div className="grid grid-cols-2 gap-4 mt-4 text-sm">
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground">Semestral</p>
                  <p className="font-bold">R$ 2.534,70</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">= R$ 422/mês (15% OFF)</p>
                </div>
                <div className="p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/20">
                  <p className="text-xs text-muted-foreground">Anual</p>
                  <p className="font-bold">R$ 4.473,00</p>
                  <p className="text-[10px] text-emerald-600 font-semibold">= R$ 373/mês (25% OFF)</p>
                </div>
              </div>
            </div>

            <ul className="space-y-2 text-sm">
              {[
                "Cadastro de produtos, fórmulas, RTPI e rótulos (igual Feed_BPF)",
                "Você ativa/desativa cada módulo pelo painel de configuração",
                "Traga seus modelos: PDF, Excel, Google Forms/Sheets",
                "Assinatura digital SHA-256 e auditoria automática",
                "Suporte por WhatsApp em horário comercial",
              ].map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mt-0.5 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              size="lg"
              className="w-full bg-emerald-600 hover:bg-emerald-700"
              onClick={() => window.open(WHATSAPP_CONTATO, "_blank", "noopener,noreferrer")}
            >
              Em breve <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              Sem cartão no trial. Após o teste, escolha o período de cobrança dentro do sistema.
            </p>
          </CardContent>
        </Card>
      </section>

      {/* CTA */}
      <section className="container mx-auto px-4 py-16 max-w-3xl text-center">
        <Card className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white border-none">
          <CardContent className="p-8 sm:p-12 space-y-5">
            <h2 className="text-2xl sm:text-3xl font-bold">Sua documentação, seus modelos, nosso gestor.</h2>
            <p className="text-emerald-50">7 dias grátis, sem cartão. Se não gostar, é só sair.</p>
            <Button
              size="lg"
              variant="secondary"
              className="bg-white text-emerald-700 hover:bg-emerald-50"
              onClick={() => window.open(WHATSAPP_CONTATO, "_blank", "noopener,noreferrer")}
            >
              Em breve <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
