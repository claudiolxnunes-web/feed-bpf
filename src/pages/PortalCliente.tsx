import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Copy, ExternalLink, Key, Building2, LifeBuoy, Gift, User as UserIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";

export default function PortalCliente() {
  const { user } = useAuth();
  const [licencas, setLicencas] = useState<any[]>([]);
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [indicacoes, setIndicacoes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [novoTicket, setNovoTicket] = useState({ assunto: "", mensagem: "" });

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      try {
        const [lic, emp, tk, ind] = await Promise.all([
          supabase.from("licencas").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
          supabase.from("empresas").select("*").eq("user_id", user.id),
          supabase.from("leads_contato").select("*").eq("email", user.email ?? "").order("created_at", { ascending: false }),
          supabase.from("indicacoes").select("*").eq("indicador_user_id", user.id).order("criado_em", { ascending: false }),
        ]);
        setLicencas(lic.data ?? []);
        setEmpresas(emp.data ?? []);
        setTickets(tk.data ?? []);
        setIndicacoes(ind.data ?? []);
      } catch (err) {
        console.error("[PortalCliente] carga inicial", err);
        toast.error("Não foi possível carregar seus dados. Tente novamente.");
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const abrirTicket = async () => {
    if (!user || !novoTicket.assunto || !novoTicket.mensagem) return;
    const { error } = await supabase.from("leads_contato").insert({
      nome: user.user_metadata?.nome ?? user.email,
      email: user.email,
      telefone: user.user_metadata?.telefone ?? "",
      programa: "suporte",
      mensagem: `[${novoTicket.assunto}] ${novoTicket.mensagem}`,
    });
    if (error) return toast.error("Erro ao abrir ticket");
    toast.success("Ticket aberto! Responderemos em breve.");
    setNovoTicket({ assunto: "", mensagem: "" });
    const { data } = await supabase.from("leads_contato").select("*").eq("email", user.email ?? "").order("created_at", { ascending: false });
    setTickets(data ?? []);
  };

  if (loading) return <div className="p-8">Carregando portal...</div>;

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <Seo title="Portal do Cliente | BPF_Consult" description="Área do cliente: licenças, downloads, suporte e indicações." />
      <div className="flex items-center gap-3 mb-6">
        <UserIcon className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Meu Portal</h1>
          <p className="text-muted-foreground">Bem-vindo, {user?.user_metadata?.nome ?? user?.email}</p>
        </div>
      </div>

      <Tabs defaultValue="licencas" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="licencas"><Key className="w-4 h-4 mr-1" />Licenças</TabsTrigger>
          <TabsTrigger value="empresas"><Building2 className="w-4 h-4 mr-1" />Empresas</TabsTrigger>
          <TabsTrigger value="suporte"><LifeBuoy className="w-4 h-4 mr-1" />Suporte</TabsTrigger>
          <TabsTrigger value="indicar"><Gift className="w-4 h-4 mr-1" />Indicar & Ganhar</TabsTrigger>
        </TabsList>

        <TabsContent value="licencas" className="space-y-3">
          {licencas.length === 0 ? (
            <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma licença ativa.</CardContent></Card>
          ) : licencas.map((l) => (
            <Card key={l.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{l.produto ?? "Feed_BPF"} — {l.plano}</div>
                  <div className="text-xs text-muted-foreground">Chave: {l.chave_licenca}</div>
                  <div className="text-xs">Expira: {l.data_expiracao}</div>
                </div>
                <Badge variant={l.status === "ativa" ? "default" : "destructive"}>{l.status}</Badge>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="empresas" className="space-y-3">
          {empresas.map((e) => (
            <Card key={e.id}>
              <CardContent className="p-4 flex justify-between items-center">
                <div>
                  <div className="font-semibold">{e.nome}</div>
                  <div className="text-xs text-muted-foreground">{e.cnpj ?? "Sem CNPJ"}</div>
                </div>
                <Button asChild size="sm" variant="outline"><Link to="/cadastro">Gerenciar</Link></Button>
              </CardContent>
            </Card>
          ))}
          {empresas.length === 0 && <Card><CardContent className="p-6 text-center text-muted-foreground">Nenhuma empresa cadastrada. <Link to="/cadastro" className="text-primary underline">Cadastrar agora</Link></CardContent></Card>}
        </TabsContent>

        <TabsContent value="suporte" className="space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Abrir novo ticket</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div><Label>Assunto</Label><Input value={novoTicket.assunto} onChange={(e) => setNovoTicket({ ...novoTicket, assunto: e.target.value })} placeholder="Ex: Erro ao gerar relatório" /></div>
              <div><Label>Descrição</Label><Textarea value={novoTicket.mensagem} onChange={(e) => setNovoTicket({ ...novoTicket, mensagem: e.target.value })} rows={4} /></div>
              <Button onClick={abrirTicket}>Enviar ticket</Button>
            </CardContent>
          </Card>
          {tickets.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Meus tickets ({tickets.length})</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                {tickets.map((t) => (
                  <div key={t.id} className="border-l-2 border-primary pl-3 py-2">
                    <div className="text-sm font-medium">{t.mensagem?.substring(0, 80)}</div>
                    <div className="text-xs text-muted-foreground">{new Date(t.created_at).toLocaleString("pt-BR")} — {t.status ?? "aberto"}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="indicar">
          <ProgramaIndicacoes indicacoes={indicacoes} onUpdate={setIndicacoes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProgramaIndicacoes({ indicacoes, onUpdate }: { indicacoes: any[]; onUpdate: (v: any[]) => void }) {
  const { user } = useAuth();
  const [email, setEmail] = useState("");
  const [gerando, setGerando] = useState(false);

  const gerarIndicacao = async () => {
    if (!user) return;
    setGerando(true);
    const codigo = `REF-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    const { data, error } = await supabase.from("indicacoes").insert({
      indicador_user_id: user.id,
      indicado_email: email || null,
      codigo_referral: codigo,
      recompensa_valor: 50,
    }).select().single();
    setGerando(false);
    if (error) return toast.error("Erro ao gerar link");
    toast.success("Link de indicação gerado!");
    onUpdate([data, ...indicacoes]);
    setEmail("");
  };

  const copiarLink = (codigo: string) => {
    const url = `${window.location.origin}/auth?ref=${codigo}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  };

  const totalGanho = indicacoes.filter((i) => i.recompensa_creditada).reduce((s, i) => s + Number(i.recompensa_valor ?? 0), 0);
  const pendentes = indicacoes.filter((i) => i.status === "convertido" && !i.recompensa_creditada).length;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-3">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-primary">{indicacoes.length}</div><div className="text-xs text-muted-foreground">Indicações</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-green-600">R$ {totalGanho.toFixed(2)}</div><div className="text-xs text-muted-foreground">Ganho</div></CardContent></Card>
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-yellow-600">{pendentes}</div><div className="text-xs text-muted-foreground">A creditar</div></CardContent></Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">Como funciona</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-1 text-muted-foreground">
          <p>1. Gere um link único de indicação</p>
          <p>2. Compartilhe com colegas do setor</p>
          <p>3. Ganhe <b className="text-primary">R$ 50 de crédito</b> a cada assinatura confirmada</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Gerar novo link</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Input placeholder="E-mail do indicado (opcional)" value={email} onChange={(e) => setEmail(e.target.value)} />
          <Button onClick={gerarIndicacao} disabled={gerando}>Gerar link</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">Minhas indicações</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {indicacoes.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhuma indicação ainda</p>}
          {indicacoes.map((i) => (
            <div key={i.id} className="flex items-center justify-between border rounded p-2">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-mono truncate">{i.codigo_referral}</div>
                <div className="text-xs text-muted-foreground">{i.indicado_email ?? "—"} · {new Date(i.criado_em).toLocaleDateString("pt-BR")}</div>
              </div>
              <Badge variant={i.status === "convertido" ? "default" : i.status === "cadastrado" ? "secondary" : "outline"}>{i.status}</Badge>
              <Button size="sm" variant="ghost" onClick={() => copiarLink(i.codigo_referral)}><Copy className="w-4 h-4" /></Button>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
