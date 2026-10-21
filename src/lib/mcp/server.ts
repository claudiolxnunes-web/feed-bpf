import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { mcpInstructions, mcpServerInfo, mcpTools } from "./index";
import { ToolError, type ToolContext } from "./context";

interface CallExtra {
  signal: AbortSignal;
  authInfo?: { token: string; extra?: Record<string, unknown> };
}

function contextFrom(extra: CallExtra): ToolContext {
  const token = extra.authInfo?.token;
  const userId = typeof extra.authInfo?.extra?.userId === "string" ? extra.authInfo.extra.userId : undefined;
  return {
    getToken: () => token,
    getUserId: () => userId,
    isAuthenticated: () => !!token && !!userId,
    signal: extra.signal,
  };
}

/** Servidor MCP só de leitura; uma instância por requisição (modo stateless). */
export function createMcpServer(): McpServer {
  const server = new McpServer(mcpServerInfo, { instructions: mcpInstructions });
  for (const tool of mcpTools) {
    server.registerTool(
      tool.name,
      { title: tool.title, description: tool.description, inputSchema: tool.inputSchema, annotations: tool.annotations },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (async (args: any, extra: CallExtra) => {
        try {
          return await tool.handler(args, contextFrom(extra));
        } catch (error) {
          const text = error instanceof ToolError ? error.message : "Erro interno ao executar a ferramenta.";
          if (!(error instanceof ToolError)) console.error("mcp tool error", tool.name, error);
          return { isError: true, content: [{ type: "text" as const, text }] };
        }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }) as any,
    );
  }
  return server;
}
