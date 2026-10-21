import { createContext, useContext, ReactNode, useCallback, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export interface Empresa {
  id: string;
  nome: string;
  cnpj: string | null;
  endereco: string | null;
  responsavel_tecnico: string | null;
  crmv: string | null;
  tipo_producao: string[] | null;
  capacidade: string | null;
  origem_agua?: "poco" | "concessionaria" | null;
  prefixo_doc?: string | null;
  config_modos_preenchimento?: Record<string, "digital" | "hibrido">;
  limite_pontos_digitais?: number;
}

interface EmpresaContextType {
  empresas: Empresa[];
  empresaAtiva: Empresa | null;
  loading: boolean;
  error: Error | null;
  setEmpresaAtiva: (empresa: Empresa) => void;
  recarregar: () => Promise<void>;
}

const EmpresaContext = createContext<EmpresaContextType>({
  empresas: [],
  empresaAtiva: null,
  loading: true,
  error: null,
  setEmpresaAtiva: () => {},
  recarregar: async () => {},
});

const STORAGE_KEY = "feedbpf_empresa_ativa_id";

const getStorageKey = (userId?: string) =>
  userId ? `${STORAGE_KEY}:${userId}` : STORAGE_KEY;

export function EmpresaProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: empresas = [], isLoading, error, refetch } = useQuery({
    queryKey: ["empresas", user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const [own, members, licenses, invites] = await Promise.all([
        supabase.from("empresas").select("*").eq("user_id", user.id).order("nome"),
        supabase.from("empresa_membros").select("empresa_id").eq("user_id", user.id).eq("ativo", true),
        supabase.from("licenca_empresas").select("empresa_id").eq("user_id", user.id).eq("ativo", true),
        user.email
          ? supabase.from("convites_empresa").select("empresa_id, aceito_em, aceito_por").eq("email", user.email.toLowerCase())
          : Promise.resolve({ data: [], error: null }),
      ]);

      const ownEmpresas = own.data ?? [];
      const memberIds = (members.data ?? []).map((item) => item.empresa_id);
      const linkedLicenseIds = (licenses.data ?? []).map((item) => item.empresa_id);
      const inviteIds = (invites.data ?? [])
        .filter((item) => item.aceito_em || item.aceito_por === user.id)
        .map((item) => item.empresa_id);

      const empresaIds = Array.from(
        new Set([...ownEmpresas.map((e) => e.id), ...memberIds, ...linkedLicenseIds, ...inviteIds].filter(Boolean))
      );

      const missingIds = empresaIds.filter(id => !ownEmpresas.some(e => e.id === id));
      
      let extraEmpresas: Empresa[] = [];
      if (missingIds.length > 0) {
        const { data } = await supabase.from("empresas").select("*").in("id", missingIds);
        extraEmpresas = (data ?? []) as Empresa[];
      }

      return [...ownEmpresas, ...extraEmpresas].sort((a, b) => 
        a.nome.localeCompare(b.nome, "pt-BR")
      ) as Empresa[];
    },
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 2,
  });

  const empresaAtivaId = user?.id ? localStorage.getItem(getStorageKey(user.id)) : null;
  
  const empresaAtiva = useMemo(() => {
    if (!empresas.length) return null;
    const saved = empresas.find(e => e.id === empresaAtivaId);
    return saved || empresas[0] || null;
  }, [empresas, empresaAtivaId]);

  const setEmpresaAtiva = useCallback((empresa: Empresa) => {
    if (user?.id) {
      localStorage.setItem(getStorageKey(user.id), empresa.id);
      // Invalida queries que dependem da empresa ativa
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      // Força re-renderização local através do memo
      queryClient.setQueryData(["empresas", user.id], [...empresas]); 
    }
  }, [user?.id, queryClient, empresas]);

  const contextValue = useMemo(() => ({
    empresas,
    empresaAtiva,
    loading: isLoading,
    error: error as Error | null,
    setEmpresaAtiva,
    recarregar: async () => { await refetch(); }
  }), [empresas, empresaAtiva, isLoading, error, setEmpresaAtiva, refetch]);

  return (
    <EmpresaContext.Provider value={contextValue}>
      {children}
    </EmpresaContext.Provider>
  );
}

export const useEmpresa = () => useContext(EmpresaContext);
