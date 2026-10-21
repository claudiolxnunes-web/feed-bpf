import type { z, ZodRawShape } from "zod";

/** Erro com mensagem segura para devolver ao cliente MCP. */
export class ToolError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ToolError";
  }
}

/** Contexto da chamada, montado a partir do token OAuth já verificado. */
export interface ToolContext {
  getToken(): string | undefined;
  getUserId(): string | undefined;
  isAuthenticated(): boolean;
  signal: AbortSignal;
}

export interface ToolResult {
  content: { type: "text"; text: string }[];
  structuredContent?: Record<string, unknown>;
}

export interface ToolDefinition<S extends ZodRawShape = ZodRawShape> {
  name: string;
  title: string;
  description: string;
  inputSchema: S;
  annotations: { readOnlyHint?: boolean; idempotentHint?: boolean; openWorldHint?: boolean };
  handler: (args: z.infer<z.ZodObject<S>>, ctx: ToolContext) => Promise<ToolResult>;
}

export function defineTool<S extends ZodRawShape>(tool: ToolDefinition<S>): ToolDefinition<S> {
  return tool;
}
