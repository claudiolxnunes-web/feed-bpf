import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_empresas", title: "Listar empresas",
  description: "Lista até 100 empresas visíveis para a conta conectada, com identificadores para consultas posteriores.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_args, ctx) => {
    const client = supabaseForUser(ctx);
    const userId = ctx.getUserId();
    if (!userId) throw new ToolError("Autenticação necessária.");
    const { data: members, error: memberError } = await client.from("empresa_membros")
      .select("empresa_id").eq("user_id", userId).eq("ativo", true).limit(100).abortSignal(ctx.signal);
    if (memberError) throw new ToolError("Não foi possível consultar os vínculos da conta.");
    const ids = (members ?? []).map((m) => m.empresa_id);
    const query = client.from("empresas").select("id,nome,cnpj");
    const { data, error } = await (ids.length
      ? query.or(`user_id.eq.${userId},id.in.(${ids.join(",")})`)
      : query.eq("user_id", userId)).order("nome").limit(100).abortSignal(ctx.signal);
    if (error) throw new ToolError("Não foi possível consultar as empresas.");
    const empresas = (data ?? []).map(({ id, nome, cnpj }) => ({ id, nome, cnpj }));
    return { content: [{ type: "text", text: empresas.length ? JSON.stringify(empresas) : "Nenhuma empresa disponível." }], structuredContent: { empresas } };
  },
});