import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { conferirRespostaEquipe } from "@/lib/equipe";
import { useAuth } from "./useAuth";
import { useEmpresa } from "./useEmpresa";
import { usePapelEmpresa } from "./usePapelEmpresa";
import type { PapelEmpresa } from "@/lib/empresa-permissions";

export function useEquipe() {
  const { user } = useAuth();
  const { empresaAtiva } = useEmpresa();
  const permissao = usePapelEmpresa();
  const client = useQueryClient();
  const id = empresaAtiva?.id;
  const query = useQuery({
    queryKey: ["equipe", id, user?.id], enabled: Boolean(id && permissao.podeGerenciarEquipe),
    queryFn: async () => {
      if (!id) throw new Error("Selecione uma empresa.");
      const [membros, convites, empresa] = await Promise.all([
        supabase.rpc("listar_membros_empresa", { _empresa_id: id }),
        supabase.from("convites_empresa").select("id,email,papel,expira_em").eq("empresa_id", id).is("aceito_em", null).gt("expira_em", new Date().toISOString()).order("created_at", { ascending: false }),
        supabase.from("empresas").select("user_id").eq("id", id).single(),
      ]);
      if (membros.error) throw membros.error;
      if (convites.error) throw convites.error;
      if (empresa.error) throw empresa.error;
      return { membros: membros.data, convites: convites.data, donoId: empresa.data.user_id };
    },
  });
  const mutation = useMutation({
    mutationFn: async (acao: { tipo: "convidar"; email: string; papel: PapelEmpresa } | { tipo: "papel"; membroId: string; papel: PapelEmpresa } | { tipo: "desativar"; membroId: string } | { tipo: "cancelar"; conviteId: string }) => {
      if (!id || !permissao.podeGerenciarEquipe) throw new Error("Sem permissão para gerenciar a equipe.");
      if (acao.tipo === "convidar") {
        const { data, error } = await supabase.rpc("criar_convite_empresa", { _empresa_id: id, _email: acao.email, _nome: "", _papel: acao.papel, _duracao_dias: 7 });
        if (error) throw error;
        return conferirRespostaEquipe(data);
      }
      if (acao.tipo === "papel") {
        const { data, error } = await supabase.rpc("alterar_papel_membro", { _membro_id: acao.membroId, _papel: acao.papel });
        if (error) throw error;
        return conferirRespostaEquipe(data);
      }
      const result = acao.tipo === "desativar"
        ? await supabase.from("empresa_membros").update({ ativo: false }).eq("id", acao.membroId).eq("empresa_id", id).select("id").single()
        : await supabase.from("convites_empresa").delete().eq("id", acao.conviteId).eq("empresa_id", id).is("aceito_em", null).select("id").single();
      if (result.error) throw result.error;
      return { ok: true };
    },
    onSuccess: async () => {
      await Promise.all([client.invalidateQueries({ queryKey: ["equipe", id] }), client.invalidateQueries({ queryKey: ["papel-empresa", id] })]);
    },
  });
  return { ...query, permissao, empresaAtiva, user, mutation };
}