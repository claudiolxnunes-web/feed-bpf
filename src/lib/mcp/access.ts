import { ToolError, type ToolContext } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "./supabase";

export async function licensedCompany(ctx: ToolContext, empresaId: string) {
  const client = supabaseForUser(ctx);
  const userId = ctx.getUserId();
  if (!userId) throw new ToolError("Autenticação necessária.");
  const { data: permitted, error } = await client.rpc("pode_usar_empresa", {
    _empresa_id: empresaId, _user_id: userId,
  }).abortSignal(ctx.signal);
  if (error || !permitted) throw new ToolError("Empresa indisponível para esta conta.");
  // Explicit company scope supplements, never replaces, the database's RLS.
  const { data: licenses, error: licenseError } = await client.from("licencas")
    .select("status,data_expiracao,liberado_admin").eq("produto", "feedbpf")
    .or(`empresa_id.eq.${empresaId},and(user_id.eq.${userId},empresa_id.is.null)`)
    .order("created_at", { ascending: false }).limit(50).abortSignal(ctx.signal);
  if (licenseError || !licenses?.some((l) => l.liberado_admin ||
    (l.status === "ativa" && new Date(l.data_expiracao).getTime() >= Date.now()))) {
    throw new ToolError("É necessária uma licença ativa do Feed_BPF para consultar esta empresa.");
  }
  return client;
}