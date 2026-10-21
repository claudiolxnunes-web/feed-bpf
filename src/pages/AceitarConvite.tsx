import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Copy, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEmpresa } from "@/hooks/useEmpresa";
import { supabase } from "@/integrations/supabase/client";
import { conferirRespostaEquipe, copiarLink, linkConvite } from "@/lib/equipe";
import LicenseGate from "@/components/LicenseGate";
import PageLoader from "@/components/PageLoader";

export default function AceitarConvite() {
  const [params] = useSearchParams();
  const token = params.get("token") ?? "";
  const { user, loading } = useAuth();
  const { setEmpresaAtiva } = useEmpresa();
  const client = useQueryClient();
  const [aceito, setAceito] = useState(false);
  const [avisoEmpresa, setAvisoEmpresa] = useState("");
  const mutation = useMutation({
    mutationFn: async () => {
      if (!user || !token) throw new Error("Entre com a conta convidada.");
      const { data, error } = await supabase.rpc("aceitar_convite_empresa", { _token: token });
      if (error) throw error;
      const result = conferirRespostaEquipe(data);
      await client.invalidateQueries({ queryKey: ["empresas", user.id] });
      await client.invalidateQueries({ queryKey: ["papel-empresa"] });
      if (result.empresa_id) {
        const { data: empresa, error: erroEmpresa } = await supabase.from("empresas").select("id,nome,cnpj,endereco,responsavel_tecnico,crmv,tipo_producao,capacidade").eq("id", result.empresa_id).single();
        if (!erroEmpresa && empresa) setEmpresaAtiva(empresa);
        else setAvisoEmpresa("Seu convite foi aceito, mas não foi possível selecionar a empresa. Recarregue a página e selecione-a no menu.");
      }
      setAceito(true);
    },
  });
  if (loading) return <PageLoader />;
  const retorno = `/aceitar-convite?token=${encodeURIComponent(token)}`;
  return <main className="flex min-h-screen items-center justify-center bg-background p-4">
    <section className="w-full max-w-lg space-y-5">
      <Users className="h-10 w-10 text-primary" aria-hidden="true" /><h1 className="font-display text-2xl font-semibold">Convite para equipe</h1>
      {!token ? <p role="alert" className="text-destructive">Link de convite inválido.</p> : aceito ? <>
        <p role="status">Convite aceito. Você já faz parte da equipe.</p>{avisoEmpresa && <p role="alert" className="text-muted-foreground">{avisoEmpresa}</p>}<LicenseGate product="feedbpf"><Button asChild><Link to="/dashboard">Acessar empresa</Link></Button></LicenseGate>
      </> : <>
        <p className="text-muted-foreground">Entre com o e-mail que recebeu o convite para confirmar sua participação.</p>
        {user ? <><p className="break-all">Conta: {user.email}</p><Button disabled={mutation.isPending} onClick={() => mutation.mutate()}>{mutation.isPending ? "Confirmando…" : "Aceitar convite"}</Button></> : <div className="flex flex-wrap gap-2"><Button asChild><Link to={`/auth?product=feedbpf&redirect=${encodeURIComponent(retorno)}`}>Entrar</Link></Button><Button variant="outline" asChild><Link to={`/auth?product=feedbpf&mode=signup&redirect=${encodeURIComponent(retorno)}`}>Criar conta</Link></Button></div>}
        {mutation.error && <p role="alert" className="text-destructive">{mutation.error instanceof Error ? mutation.error.message : "Não foi possível aceitar o convite."}</p>}
        <Button variant="outline" onClick={async () => { try { await copiarLink(linkConvite(token)); toast.success("Link copiado."); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível copiar."); } }}><Copy aria-hidden="true" />Copiar link</Button>
      </>}
    </section>
  </main>;
}