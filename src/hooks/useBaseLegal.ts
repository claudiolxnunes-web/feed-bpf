import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEmpresa } from "@/hooks/useEmpresa";
import { getBaseLegal, type AssuntoBaseLegal, type BaseLegal } from "@/config/baseLegal";

const CACHE_24H = 1000 * 60 * 60 * 24;

/** Campos que o banco pode fornecer: só identificação e link do documento. */
export interface DocumentoVinculado {
  readonly titulo: string;
  readonly codigo: string | null;
  readonly arquivoUrl: string | null;
}

export interface BaseLegalComDocumento extends BaseLegal {
  readonly documento: DocumentoVinculado | null;
}

interface LinhaNorma {
  titulo: string;
  codigo: string | null;
  arquivo_url: string | null;
  empresa_id: string | null;
}

/**
 * Escolhe a linha da empresa (vence) ou a global, e mescla com a reserva.
 * Norma, artigo, citação e observação vêm SEMPRE da reserva.
 */
export function mesclarBaseLegal(
  reserva: BaseLegal,
  linhas: readonly LinhaNorma[] | null | undefined,
  empresaId: string | null,
): BaseLegalComDocumento {
  const linha =
    (empresaId ? linhas?.find((r) => r.empresa_id === empresaId) : undefined) ??
    linhas?.find((r) => r.empresa_id === null) ??
    null;
  if (!linha) return { ...reserva, documento: null };
  return {
    ...reserva,
    documento: {
      titulo: linha.titulo,
      codigo: linha.codigo?.trim() || null,
      arquivoUrl: linha.arquivo_url?.trim() || null,
    },
  };
}

/** Lê só normas ativas com slug = assunto; falha silenciosa para a reserva. Cache 24 h. */
export function useBaseLegal(assunto: AssuntoBaseLegal): BaseLegalComDocumento {
  const { empresaAtiva } = useEmpresa();
  const reserva = getBaseLegal(assunto);
  const empresaId = empresaAtiva?.id ?? null;

  const { data } = useQuery({
    queryKey: ["base-legal", empresaId, assunto],
    staleTime: CACHE_24H,
    gcTime: CACHE_24H,
    retry: 1,
    queryFn: async (): Promise<LinhaNorma[]> => {
      let consulta = supabase
        .from("normas_legislacao")
        .select("titulo, codigo, arquivo_url, empresa_id")
        .eq("slug", assunto)
        .eq("situacao", "ativa");
      consulta = empresaId
        ? consulta.or(`empresa_id.eq.${empresaId},empresa_id.is.null`)
        : consulta.is("empresa_id", null);
      const { data, error } = await consulta.limit(2);
      if (error || !data) return [];
      return data as LinhaNorma[];
    },
  });

  return mesclarBaseLegal(reserva, data, empresaId);
}
