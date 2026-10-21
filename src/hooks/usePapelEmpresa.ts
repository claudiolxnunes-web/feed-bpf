import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useEmpresa } from "./useEmpresa";
import { permissoesEmpresa } from "@/lib/empresa-permissions";

export function usePapelEmpresa() {
  const { user } = useAuth();
  const { empresaAtiva, loading: empresaLoading } = useEmpresa();
  const empresaId = empresaAtiva?.id;
  const { data, isLoading, error } = useQuery({
    queryKey: ["papel-empresa", empresaId, user?.id],
    enabled: Boolean(empresaId && user),
    queryFn: async () => {
      if (!empresaId || !user) return { dono: false, papel: null };
      const [owner, role] = await Promise.all([
        supabase.from("empresas").select("user_id").eq("id", empresaId).single(),
        supabase.rpc("get_papel_empresa", { _empresa_id: empresaId, _user_id: user.id }),
      ]);
      if (owner.error) throw owner.error;
      if (role.error) throw role.error;
      return { dono: owner.data.user_id === user.id, papel: role.data ?? null };
    },
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: 60_000,
  });
  const dono = data?.dono ?? false;
  const papel = data?.papel ?? null;
  return { dono, papel, ...permissoesEmpresa(dono, papel), loading: empresaLoading || isLoading, error };
}