import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { loadEnv } from 'vite';

const indexPath = join(process.cwd(), 'dist', 'index.html');
try {
  let content = readFileSync(indexPath, 'utf-8');
  const buildTime = new Date().toISOString();
  content = content.replace('%BUILD_TIME%', buildTime);
  writeFileSync(indexPath, content);
  console.log(`Build time stamp added to HTML: ${buildTime}`);
} catch (e) {
  console.error('Failed to update index.html with build time');
}

const env = loadEnv('production', process.cwd(), 'VITE_');
const supabaseUrl = env.VITE_SUPABASE_URL;
const supabasePublishableKey = env.VITE_SUPABASE_PUBLISHABLE_KEY;

if (!supabaseUrl || !supabasePublishableKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY are required');
}

for (const relativePath of ['rotulos-editor.html', 'gerador-rotulos/index.html']) {
  const filePath = join(process.cwd(), 'dist', relativePath);
  const content = readFileSync(filePath, 'utf-8')
    .replaceAll('__SUPABASE_URL__', supabaseUrl)
    .replaceAll('__SUPABASE_PUBLISHABLE_KEY__', supabasePublishableKey);
  writeFileSync(filePath, content);
}

console.log('Supabase public configuration injected into static label editors');
