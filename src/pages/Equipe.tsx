import { useState } from "react";
import { Users } from "lucide-react";
import { toast } from "sonner";
import { Navigate } from "react-router-dom";
import PageHeader from "@/components/PageHeader";
import PageLoader from "@/components/PageLoader";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { ConviteForm } from "@/components/equipe/ConviteForm";
import { EquipeListas } from "@/components/equipe/EquipeListas";
import { useEquipe } from "@/hooks/useEquipe";

export default function Equipe() {
  const { permissao, empresaAtiva, user, data, isLoading, error, refetch, mutation } = useEquipe();
  const [confirmacao, setConfirmacao] = useState<{ tipo: "desativar"; membroId: string } | { tipo: "cancelar"; conviteId: string } | null>(null);
  if (permissao.loading) return <PageLoader />;
  if (!empresaAtiva) return <p className="text-muted-foreground">Selecione uma empresa para gerenciar a equipe.</p>;
  if (permissao.error) return <p role="alert" className="text-destructive">Não foi possível verificar seu acesso.</p>;
  if (!permissao.podeGerenciarEquipe) return <Navigate to="/dashboard" replace />;
  const executar = async (acao: Parameters<typeof mutation.mutateAsync>[0]) => {
    try { await mutation.mutateAsync(acao); toast.success("Equipe atualizada."); }
    catch (erro) { toast.error(erro instanceof Error ? erro.message : "Não foi possível atualizar a equipe."); }
  };
  return <div className="space-y-6">
    <PageHeader title="Equipe" description={empresaAtiva.nome} icon={Users} />
    <ConviteForm key={empresaAtiva.id} pending={mutation.isPending} onInvite={(email, papel) => mutation.mutateAsync({ tipo: "convidar", email, papel })} />
    {isLoading ? <PageLoader /> : error ? <div role="alert" className="space-y-2"><p className="text-destructive">Não foi possível carregar a equipe.</p><Button variant="outline" onClick={() => void refetch()}>Tentar novamente</Button></div> : data && <EquipeListas {...data} userId={user?.id} pending={mutation.isPending} onRole={(membroId, papel) => void executar({ tipo: "papel", membroId, papel })} onDeactivate={(membroId) => setConfirmacao({ tipo: "desativar", membroId })} onCancel={(conviteId) => setConfirmacao({ tipo: "cancelar", conviteId })} />}
    <AlertDialog open={Boolean(confirmacao)} onOpenChange={(open) => { if (!open) setConfirmacao(null); }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>{confirmacao?.tipo === "desativar" ? "Desativar membro?" : "Cancelar convite?"}</AlertDialogTitle><AlertDialogDescription>{confirmacao?.tipo === "desativar" ? "Esta pessoa perderá o acesso à empresa." : "O link deste convite deixará de funcionar."}</AlertDialogDescription></AlertDialogHeader>
        <AlertDialogFooter><AlertDialogCancel>Voltar</AlertDialogCancel><AlertDialogAction disabled={mutation.isPending} onClick={() => { if (confirmacao) void executar(confirmacao); }}>Confirmar</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>;
}