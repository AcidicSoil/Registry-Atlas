import { readFile, writeFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';

const CORE = 'public/data/registry-atlas.json.gz';

const OUTPUT = 'src/registry-explorer/ui/aceternityVisualEvidence.ts';

const CONCURRENCY = 8;

const SOURCE_PREFIX = 'https://ui.aceternity.com/';

function upstreamImageForPage(pageUrl, html) {
  const tags = html.match(/<meta\s[^>]*>/gi) ?? [];
  const tag = tags.find(item => /property=["']og:image["']/i.test(item));
  const candidate = /content=["']([^"']+)["']/i.exec(tag ?? '')?.[1];

  if (!candidate) return null;

  const image = new URL(candidate.replaceAll('&amp;', '&'), pageUrl);
  const page = new URL(pageUrl);

  if (image.protocol !== 'https:' || image.hostname !== 'assets.aceternity.com') return null;

  if (!/\.(?:png|webp|jpe?g)$/i.test(image.pathname)) return null;

  const slug = page.pathname.split('/').filter(Boolean).at(-1);

  if (!slug || !image.pathname.toLowerCase().includes(slug.toLowerCase())) return null;

  return image.href;
}

async function collectVisual(pageUrl) {
  try {
    const response = await fetch(pageUrl, { signal: AbortSignal.timeout(12000) });

    if (!response.ok || !response.headers.get('content-type')?.includes('html')) return null;

    const imageUrl = upstreamImageForPage(pageUrl, await response.text());

    if (!imageUrl) return null;

    const image = await fetch(imageUrl, { method: 'HEAD', redirect: 'manual', signal: AbortSignal.timeout(9000) });

    return image.ok && image.headers.get('content-type')?.startsWith('image/')
      ? [pageUrl, imageUrl] : null;
  } catch {
    return null;
  }
}

async function main() {
  const data = JSON.parse(gunzipSync(await readFile(CORE)).toString('utf8'));

  const entries = Object.entries(data.sourcePageManifest.pages)
    .filter(([key, value]) => key.startsWith('@aceternity/') && value.url.startsWith(SOURCE_PREFIX))
    .map(([, value]) => value.url);

  const urls = [...new Set(entries)].sort();
  const found = [];

  for (let offset = 0; offset < urls.length; offset += CONCURRENCY) {
    const results = await Promise.all(urls.slice(offset, offset + CONCURRENCY).map(collectVisual));

    found.push(...results.filter(Boolean));
  }

  const counts = new Map();

  for (const [, asset] of found) counts.set(asset, (counts.get(asset) ?? 0) + 1);

  const unique = found.filter(([, asset]) => counts.get(asset) === 1);
  const map = Object.fromEntries(unique);

  const output = [
    '/** Verified item-specific media read from the official Aceternity source pages. */',
    'export const aceternityVisualEvidence = ',
    JSON.stringify(map, null, 2) + ' as const satisfies Readonly<Record<string, string>>;',
    '',
  ].join('\n');

  await writeFile(OUTPUT, output);
  console.log(JSON.stringify({
    sourcePages: urls.length,
    eligible: found.length,
    uniqueItemVisuals: unique.length,
    rejected: urls.length - unique.length,
    output: OUTPUT,
  }));
}

await main();
