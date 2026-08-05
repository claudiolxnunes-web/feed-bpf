import fs from "fs";
import path from "path";
import https from "https";
import { promisify } from "util";
import { exec } from "child_process";

/**
 * Script: download-storage.mjs
 * Objetivo: Baixar todos os arquivos de todos os buckets do Supabase Storage via Edge Function 'export-storage'.
 * 
 * Requisitos:
 * 1. Node.js instalado.
 * 2. URL da Edge Function e o Token de Exportação.
 * 
 * Uso:
 * node download-storage.mjs <SUPABASE_URL_OR_FUNCTION_URL> <EXPORT_TOKEN>
 */

const execAsync = promisify(exec);

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const dir = path.dirname(dest);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    const file = fs.createWriteStream(dest);
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Falha ao baixar ${url}: Status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function run() {
  const [,, baseUrl, token] = process.argv;

  if (!baseUrl || !token) {
    console.error("Uso: node download-storage.mjs <FUNCTION_URL> <EXPORT_TOKEN>");
    console.log("Exemplo: node download-storage.mjs https://xxxx.supabase.co/functions/v1/export-storage meu-token-seguro");
    process.exit(1);
  }

  const exportUrl = baseUrl.includes("/functions/v1/") 
    ? baseUrl 
    : `${baseUrl.replace(/\/$/, "")}/functions/v1/export-storage`;

  console.log(`🚀 Iniciando exportação de arquivos via: ${exportUrl}`);

  try {
    const response = await new Promise((resolve, reject) => {
      const url = new URL(exportUrl);
      url.searchParams.set("token", token);
      
      https.get(url, (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          if (res.statusCode !== 200) {
            reject(new Error(`Erro na API (${res.statusCode}): ${data}`));
          } else {
            resolve(JSON.parse(data));
          }
        });
      }).on("error", reject);
    });

    if (!response.ok) {
      throw new Error("Resposta da API não é 'ok'");
    }

    const baseDir = path.join(process.cwd(), "supabase_storage_backup");
    console.log(`📂 Pasta de destino: ${baseDir}`);

    const buckets = response.buckets;
    const bucketNames = Object.keys(buckets);

    console.log(`📦 Encontrados ${bucketNames.length} buckets.`);

    for (const bucketName of bucketNames) {
      const { count, files } = buckets[bucketName];
      console.log(`\n🔹 Baixando bucket: ${bucketName} (${count} arquivos)`);

      for (const file of files) {
        const localPath = path.join(baseDir, bucketName, file.path);
        process.stdout.write(`  -> ${file.path} ... `);
        try {
          await downloadFile(file.url, localPath);
          console.log("✅ OK");
        } catch (err) {
          console.log(`❌ ERRO: ${err.message}`);
        }
      }
    }

    console.log("\n✨ Exportação concluída com sucesso!");
    console.log(`Os arquivos estão em: ${baseDir}`);

  } catch (err) {
    console.error("\n💥 Erro fatal durante a execução:");
    console.error(err.message);
    process.exit(1);
  }
}

run();
