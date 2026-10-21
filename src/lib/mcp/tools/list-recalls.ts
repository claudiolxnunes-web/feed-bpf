import { defineTool, ToolError } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { licensedCompany } from "../access";

export default defineTool({
  name: "listar_simulacoes_recall", title: "Consultar simulações de recall",
  description: "Consulta simulações recentes de recall de uma empresa autorizada com licença ativa, sem modificar registros.",
  inputSchema: {
    empresa_id: z.string().uuid().describe("Identificador da empresa retornado por listar_empresas."),
    limite: z.number().int().min(1).max(50).default(20).describe("Quantidade máxima de simulações, entre 1 e 50."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ empresa_id, limite }, ctx) => {
    const client = await licensedCompany(ctx, empresa_id);
    const { data, error } = await client.from("simulacoes_recall")
      .select("id,data,lote,produto,status,tempo_total_min").eq("empresa_id", empresa_id)
      .order("data", { ascending: false }).limit(limite).abortSignal(ctx.signal);
    if (error) throw new ToolError("Não foi possível consultar as simulações de recall.");
    const simulacoes = (data ?? []).map(({ id, data, lote, produto, status, tempo_total_min }) => ({ id, data, lote, produto, status, tempo_total_min }));
    return { content: [{ type: "text", text: simulacoes.length ? JSON.stringify(simulacoes) : "Nenhuma simulação nesta empresa." }], structuredContent: { simulacoes } };
  },
});