import { readFile, writeFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const ITEM_TYPES = new Set(['registry:block', 'registry:component', 'registry:ui', 'registry:page', 'registry:item', 'registry:style', 'registry:theme', 'registry:icon']);
const FIELDS = ['title', 'description', 'author', 'type', 'category'];
const ARRAYS = ['dependencies', 'devDependencies', 'registryDependencies'];

function publicUrl(value) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash) return null;
    if (['localhost', '127.0.0.1', '[::1]'].includes(url.hostname) || /^(?:10|127|169\.254|192\.168)\./.test(url.hostname)) return null;
    return url.href;
  } catch { return null; }
}

export function officialItemUrl(registry, slug) {
  if (!/^@[a-z0-9][a-z0-9_-]*$/.test(registry?.name ?? '') || !/^[a-z0-9][a-z0-9_-]*$/.test(slug)) return null;
  const template = registry?.url;
  if (typeof template !== 'string' || !template.includes('{name}')) return null;
  return publicUrl(template.replaceAll('{name}', slug));
}

export function verifyOfficialItem(registry, slug, fetchedUrl, item) {
  const expected = officialItemUrl(registry, slug);
  if (!expected || fetchedUrl !== expected) return { status: 'unresolved', reason: 'source-url-mismatch' };
  if (!item || typeof item !== 'object' || Array.isArray(item) || item.name !== slug || !ITEM_TYPES.has(item.type)) {
    return { status: 'unresolved', reason: 'item-identity-or-type-mismatch' };
  }
  for (const field of FIELDS) {
    if (item[field] !== undefined && (typeof item[field] !== 'string' || !item[field].trim())) {
      return { status: 'unresolved', reason: `invalid-${field}` };
    }
  }
  for (const field of ARRAYS) {
    if (item[field] !== undefined && (!Array.isArray(item[field]) || !item[field].every(value => typeof value === 'string' && value.trim()))) {
      return { status: 'unresolved', reason: `invalid-${field}` };
    }
  }
  if (item.files !== undefined && (!Array.isArray(item.files) || !item.files.every(file => file && typeof file.path === 'string' && file.path.trim() && typeof file.type === 'string' && file.type.trim()))) {
    return { status: 'unresolved', reason: 'invalid-files' };
  }
  const summary = {
    name: item.title ?? item.name, slug, type: item.type, source: 'registry-json',
    provenance: `Official item JSON ${expected}`, catalog_status: 'available', route_eligible: true,
    confidence: 'high', raw_item_url: expected, evidence_url: expected,
    installCommand: `npx shadcn@latest add ${registry.name}/${slug}`,
  };
  for (const field of FIELDS) if (item[field] !== undefined) summary[field] = item[field].trim();
  for (const field of ARRAYS) if (item[field]) summary[field] = [...item[field]];
  if (item.files) summary.files = item.files.map(file => ({
    path: file.path.trim(), type: file.type.trim(),
    ...(typeof file.target === 'string' && file.target.trim() ? { target: file.target.trim() } : {}),
  }));
  const unresolved = ['docsUrl', 'previewUrl', 'importStatements', 'requiredProps', 'runtimeRender'];
  return { status: 'verified', summary, unresolved, sourceUrl: expected };
}

export function mergeVerifiedSummary(existing, verified) {
  if (verified?.status !== 'verified') throw new Error('Cannot promote unresolved evidence');
  if (existing && existing.slug !== verified.summary.slug) throw new Error('Existing item identity mismatch');
  const { installCommand, ...safe } = verified.summary;
  return { ...existing, ...safe, install_command: installCommand };
}

export async function recoverOfficialItem(registry, slug, fetchImpl = fetch) {
  const url = officialItemUrl(registry, slug);
  if (!url) return { status: 'unresolved', reason: 'invalid-official-route' };
  try {
    const response = await fetchImpl(url, { redirect: 'manual', signal: AbortSignal.timeout(8000) });
    if (!response.ok || response.redirected || response.url !== url) return { status: 'unresolved', reason: `http-or-redirect-${response.status}` };
    if (!(response.headers.get('content-type') || '').includes('application/json')) return { status: 'unresolved', reason: 'invalid-content-type' };
    const bytes = await response.text();
    if (bytes.length > 1_000_000) return { status: 'unresolved', reason: 'oversized-item' };
    return verifyOfficialItem(registry, slug, url, JSON.parse(bytes));
  } catch (error) {
    return { status: 'unresolved', reason: error instanceof SyntaxError ? 'invalid-json' : 'network-error' };
  }
}

async function main(args) {
  const targets = args.filter(arg => arg.startsWith('@'));
  const apply = args.includes('--apply');
  if (!targets.length || targets.length > 20) throw new Error('Pass 1-20 registry item tokens');
  const registries = JSON.parse(await readFile('data/shadcn/registries.raw.json', 'utf8'));
  const curated = JSON.parse(await readFile('data/shadcn/registry-items.json', 'utf8'));
  const results = [];
  for (const token of targets) {
    const index = token.indexOf('/');
    const namespace = token.slice(0, index);
    const slug = token.slice(index + 1);
    const registry = registries.find(entry => entry.name === namespace);
    const result = await recoverOfficialItem(registry, slug);
    results.push({ token, ...result });
    if (apply && result.status === 'verified') {
      const existing = curated[namespace] ?? [];
      const previous = existing.find(entry => entry.slug === slug);
      curated[namespace] = [...existing.filter(entry => entry.slug !== slug), mergeVerifiedSummary(previous, result)];
    }
  }
  if (apply && results.some(result => result.status === 'verified')) {
    await writeFile('data/shadcn/registry-items.json', `${JSON.stringify(curated, null, 2)}\n`);
  }
  console.log(JSON.stringify({ mode: apply ? 'apply' : 'dry-run', results }, null, 2));
  if (results.some(result => result.status !== 'verified')) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
