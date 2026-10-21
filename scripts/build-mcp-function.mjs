// Gera supabase/functions/mcp/index.ts a partir de src/lib/mcp (fonte única,
// coberta pelo vitest). Dependências npm viram especificadores `npm:` do Deno
// com as versões instaladas, para o deploy da Edge Function ser reprodutível.
//
// Uso: npm run build:mcp   (rodar sempre que src/lib/mcp mudar)
import { build } from "esbuild";
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(root, "package.json"));
const outFile = path.join(root, "supabase/functions/mcp/index.ts");

const NPM_PACKAGES = ["@modelcontextprotocol/sdk", "@supabase/supabase-js", "jose", "zod"];

// Nem todo pacote exporta ./package.json; sobe a partir de qualquer entrada resolvida.
function installedVersion(pkg) {
  const entry = require.resolve.paths(pkg)
    .map((dir) => path.join(dir, pkg, "package.json"))
    .find((file) => {
      try { return JSON.parse(readFileSync(file, "utf8")).name === pkg; } catch { return false; }
    });
  if (!entry) throw new Error(`Pacote não instalado: ${pkg}`);
  return JSON.parse(readFileSync(entry, "utf8")).version;
}

const denoNpm = {
  name: "deno-npm-specifiers",
  setup(b) {
    b.onResolve({ filter: /^[^./]/ }, (args) => {
      const pkg = NPM_PACKAGES.find((p) => args.path === p || args.path.startsWith(`${p}/`));
      if (!pkg) return undefined;
      return { path: `npm:${pkg}@${installedVersion(pkg)}${args.path.slice(pkg.length)}`, external: true };
    });
  },
};

const entry = `import { createMcpHandler } from "./src/lib/mcp/handler";
Deno.serve(createMcpHandler({ supabaseUrl: Deno.env.get("SUPABASE_URL")!, functionName: "mcp" }));
`;

const result = await build({
  stdin: { contents: entry, resolveDir: root, sourcefile: "mcp-entry.ts", loader: "ts" },
  bundle: true,
  format: "esm",
  platform: "neutral",
  target: "es2022",
  write: false,
  alias: { "@": path.join(root, "src") },
  plugins: [denoNpm],
  logLevel: "warning",
});

const banner = `// @ts-nocheck — bundle JS gerado; os tipos são checados em src/lib/mcp pelo tsc.
// GERADO por scripts/build-mcp-function.mjs a partir de src/lib/mcp — não editar.
// Para mudar o MCP, edite src/lib/mcp e rode \`npm run build:mcp\`.
`;
await writeFile(outFile, banner + result.outputFiles[0].text);
console.log(`mcp: ${path.relative(root, outFile)} gerado`);
