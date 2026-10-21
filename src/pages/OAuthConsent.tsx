import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { oauthClient, type AuthorizationDetails } from "@/lib/oauth-client";

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const id = params.get("authorization_id") ?? "";
  const { user, loading, signOut } = useAuth();
  const [details, setDetails] = useState<AuthorizationDetails | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (loading) return;
    let active = true;
    setDetails(null);
    setError("");
    if (!id) { setError("Esta solicitação de conexão não tem um identificador válido."); return; }
    if (!user) {
      const next = window.location.pathname + window.location.search + window.location.hash;
      window.location.replace("/auth?product=feedbpf&next=" + encodeURIComponent(next));
      return;
    }
    void (async () => {
      try {
        const result = await oauthClient.getAuthorizationDetails(id);
        if (!active) return;
        if (result.error || !result.data) throw new Error("A solicitação expirou, é inválida ou não pôde ser carregada. Inicie uma nova conexão no agente.");
        const target = result.data.redirect_url ?? result.data.redirect_to;
        if (target && !result.data.client) { window.location.assign(target); return; }
        if (!result.data.client) throw new Error("Não foi possível identificar o aplicativo solicitante.");
        setDetails(result.data);
      } catch (failure) {
        if (active) setError(failure instanceof Error ? failure.message : "Não foi possível carregar a conexão.");
      }
    })();
    return () => { active = false; };
  }, [id, user, loading]);

  async function decide(approve: boolean) {
    if (busy || !details || !user) return;
    setBusy(true);
    setError("");
    try {
      const result = approve ? await oauthClient.approveAuthorization(id) : await oauthClient.denyAuthorization(id);
      if (result.error) throw new Error(approve ? "Não foi possível permitir a conexão. Tente novamente." : "Não foi possível cancelar a conexão. Tente novamente.");
      const target = result.data?.redirect_url ?? result.data?.redirect_to;
      if (!target) throw new Error("Não foi recebido um endereço de retorno. Inicie uma nova conexão no agente.");
      window.location.assign(target);
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : "Não foi possível concluir sua decisão.");
      setBusy(false);
    }
  }

  const clientName = details?.client?.name ?? details?.client?.client_name ?? "agente";
  const scopeLabels: Record<string, string> = { openid: "Identificar sua conta", email: "Compartilhar seu endereço de e-mail", profile: "Compartilhar seu perfil básico" };
  const scopes = details?.scopes ?? details?.scope?.split(/\s+/).filter(Boolean) ?? [];
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-6">
      <section className="w-full max-w-lg space-y-6" aria-busy={busy}>
        <ShieldCheck className="h-9 w-9 text-primary" aria-hidden="true" />
        <h1 className="text-2xl font-display font-semibold text-foreground">Conectar {clientName} ao Feed_BPF_Pro</h1>
        {error && <p role="alert" className="text-destructive">{error}</p>}
        {!details && !error && <p role="status" className="flex items-center gap-2 text-muted-foreground"><Loader2 className="h-4 w-4 animate-spin" />Carregando solicitação…</p>}
        {details && <>
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>Conta: <span className="text-foreground">{user?.email}</span></p>
            <p className="break-all">Endereço de retorno: {details.redirect_uri ?? details.client?.redirect_uri ?? "Informado pelo aplicativo solicitante"}</p>
            <p>{clientName} poderá consultar suas empresas e simulações de recall, sem alterar registros.</p>
            <ul className="list-disc pl-5">{scopes.map((scope) => <li key={scope}>{scopeLabels[scope] ?? `Permissão adicional solicitada: ${scope}`}</li>)}</ul>
            <p>As permissões da sua conta, a licença e o isolamento entre empresas continuam sendo respeitados.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button disabled={busy} onClick={() => void decide(true)}>Permitir conexão</Button>
            <Button variant="outline" disabled={busy} onClick={() => void decide(false)}>Cancelar conexão</Button>
          </div>
          <Button variant="ghost" disabled={busy} onClick={async () => {
            try { await signOut(); } catch { setError("Não foi possível sair da conta. Tente novamente."); }
          }}>Usar outra conta</Button>
        </>}
      </section>
    </main>
  );
}