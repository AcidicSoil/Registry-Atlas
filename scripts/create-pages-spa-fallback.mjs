import { copyFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export async function createPagesSpaFallback(outputDir = 'dist') {
  const directory = path.resolve(outputDir);
  const indexPath = path.join(directory, 'index.html');
  const fallbackPath = path.join(directory, '404.html');

  const indexStat = await stat(indexPath);
  if (!indexStat.isFile() || indexStat.size === 0) {
    throw new Error(`Expected a non-empty Vite entrypoint at ${indexPath}`);
  }

  await copyFile(indexPath, fallbackPath);
  return { indexPath, fallbackPath };
}

const invokedPath = process.argv[1] ? path.resolve(process.argv[1]) : '';
const modulePath = fileURLToPath(import.meta.url);

if (invokedPath === modulePath) {
  await createPagesSpaFallback(process.argv[2] ?? 'dist');
}
