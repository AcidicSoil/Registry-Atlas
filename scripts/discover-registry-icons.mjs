#!/usr/bin/env node

import { pathToFileURL } from 'node:url';
import {
  openAtlasCoreDatabase,
  putDocument,
  readAtlasState,
  readDocument,
} from './lib/atlas-storage.mjs';

const SCHEMA = 'registry-atlas-registry-icons/v1';
const DEFAULT_CONCURRENCY = 12;
const DEFAULT_TIMEOUT_MS = 7000;

export function extractHtmlIconCandidates(html, baseUrl) {
  const candidates = [];
  for (const tag of String(html ?? '').match(/<link\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    const rel = String(attrs.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    const href = attrs.href;
    if (!href || !rel.some(token => token === 'icon' || token === 'apple-touch-icon' || token === 'mask-icon')) {
      continue;
    }
    const url = safeIconUrl(href, baseUrl);
    if (!url) continue;
    candidates.push({
      url,
      source: 'html-link',
      score: iconScore({
        url,
        rel: rel.join(' '),
        sizes: attrs.sizes,
        type: attrs.type,
      }),
    });
  }
  return uniqueRanked(candidates);
}

export function extractManifestIconCandidates(manifest, baseUrl) {
  if (!manifest || !Array.isArray(manifest.icons)) return [];
  const candidates = [];
  for (const icon of manifest.icons) {
    if (!icon || typeof icon.src !== 'string') continue;
    const url = safeIconUrl(icon.src, baseUrl);
    if (!url) continue;
    candidates.push({
      url,
      source: 'manifest',
      score: iconScore({
        url,
        rel: 'manifest-icon',
        sizes: typeof icon.sizes === 'string' ? icon.sizes : undefined,
        type: typeof icon.type === 'string' ? icon.type : undefined,
      }),
    });
  }
  return uniqueRanked(candidates);
}

export async function discoverRegistryIcon({
  namespace,
  homepage,
  fetchImpl = fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  observedAt = new Date().toISOString(),
}) {
  const safeHomepage = safePageUrl(homepage);
  if (!safeHomepage) {
    return {
      namespace,
      homepage: homepage ?? '',
      url: null,
      source: 'none',
      observedAt,
      reason: 'invalid-homepage',
    };
  }

  let response;
  try {
    response = await fetchWithTimeout(fetchImpl, safeHomepage, timeoutMs, {
      headers: {
        accept: 'text/html,application/xhtml+xml',
        'user-agent': 'RegistryAtlas/1.0 registry-icon-discovery',
      },
      redirect: 'follow',
    });
  } catch (error) {
    return {
      namespace,
      homepage: safeHomepage,
      url: null,
      source: 'none',
      observedAt,
      reason: error instanceof Error ? error.message : String(error),
    };
  }

  if (!response.ok) {
    return {
      namespace,
      homepage: safeHomepage,
      url: null,
      source: 'none',
      observedAt,
      reason: `homepage-http-${response.status}`,
    };
  }

  const pageUrl = safePageUrl(response.url) ?? safeHomepage;
  const html = await response.text();
  const htmlCandidates = extractHtmlIconCandidates(html, pageUrl);
  if (htmlCandidates[0]) {
    return {
      namespace,
      homepage: pageUrl,
      url: htmlCandidates[0].url,
      source: 'html-link',
      observedAt,
    };
  }

  const manifestUrls = extractManifestUrls(html, pageUrl);
  for (const manifestUrl of manifestUrls) {
    try {
      const manifestResponse = await fetchWithTimeout(fetchImpl, manifestUrl, timeoutMs, {
        headers: {
          accept: 'application/manifest+json,application/json',
          'user-agent': 'RegistryAtlas/1.0 registry-icon-discovery',
        },
        redirect: 'follow',
      });
      if (!manifestResponse.ok) continue;
      const manifestBase = safePageUrl(manifestResponse.url) ?? manifestUrl;
      const candidates = extractManifestIconCandidates(await manifestResponse.json(), manifestBase);
      if (!candidates[0]) continue;
      return {
        namespace,
        homepage: pageUrl,
        url: candidates[0].url,
        source: 'manifest',
        observedAt,
      };
    } catch {
      // Keep checking any other explicitly linked manifest.
    }
  }

  return {
    namespace,
    homepage: pageUrl,
    url: null,
    source: 'none',
    observedAt,
  };
}

export async function discoverRegistryIcons({
  registries,
  fetchImpl = fetch,
  concurrency = DEFAULT_CONCURRENCY,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  observedAt = new Date().toISOString(),
}) {
  const results = new Array(registries.length);
  let cursor = 0;

  async function worker() {
    while (true) {
      const index = cursor++;
      if (index >= registries.length) return;
      const registry = registries[index];
      results[index] = await discoverRegistryIcon({
        namespace: registry.name,
        homepage: registry.homepage,
        fetchImpl,
        timeoutMs,
        observedAt,
      });
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(Math.max(1, concurrency), Math.max(1, registries.length)) }, worker),
  );

  const icons = {};
  const missing = [];
  for (const result of results) {
    if (result.url) {
      icons[result.namespace] = {
        url: result.url,
        source: result.source,
        homepage: result.homepage,
        observedAt: result.observedAt,
      };
    } else {
      missing.push({
        namespace: result.namespace,
        homepage: result.homepage,
        reason: result.reason ?? 'no-explicit-icon',
      });
    }
  }

  return {
    schema: SCHEMA,
    generatedAt: observedAt,
    summary: {
      registryCount: registries.length,
      found: Object.keys(icons).length,
      missing: missing.length,
    },
    icons,
    missing,
  };
}

function parseAttributes(tag) {
  const attrs = {};
  const pattern = /([:\w-]+)\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>\x60]+))/g;
  for (const match of tag.matchAll(pattern)) {
    attrs[match[1].toLowerCase()] = match[2] ?? match[3] ?? match[4] ?? '';
  }
  return attrs;
}

function extractManifestUrls(html, baseUrl) {
  const urls = [];
  for (const tag of String(html ?? '').match(/<link\b[^>]*>/gi) ?? []) {
    const attrs = parseAttributes(tag);
    const rel = String(attrs.rel ?? '').toLowerCase().split(/\s+/).filter(Boolean);
    if (!rel.includes('manifest') || !attrs.href) continue;
    const url = safePageUrl(attrs.href, baseUrl);
    if (url && !urls.includes(url)) urls.push(url);
  }
  return urls;
}

function iconScore({ url, rel = '', sizes = '', type = '' }) {
  let score = 0;
  if (/svg/i.test(type) || /\.svg(?:$|[?#])/i.test(url)) score += 1_000_000;
  if (/apple-touch-icon/i.test(rel)) score += 200_000;
  else if (/\bicon\b/i.test(rel)) score += 100_000;
  if (/\bany\b/i.test(sizes)) score += 900_000;

  let largestArea = 0;
  for (const match of String(sizes).matchAll(/(\d+)x(\d+)/gi)) {
    largestArea = Math.max(largestArea, Number(match[1]) * Number(match[2]));
  }
  return score + largestArea;
}

function uniqueRanked(candidates) {
  const best = new Map();
  for (const candidate of candidates) {
    const previous = best.get(candidate.url);
    if (!previous || candidate.score > previous.score) best.set(candidate.url, candidate);
  }
  return [...best.values()].sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));
}

function safePageUrl(value, base) {
  if (typeof value !== 'string' || !value.trim() || value.trim().startsWith('//')) return null;
  try {
    const url = base ? new URL(value, base) : new URL(value);
    if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/\.$/, '');
    if (!host || host === 'localhost' || host.endsWith('.localhost')
      || host.endsWith('.local') || host.endsWith('.internal')
      || /^\d+(?:\.\d+){3}$/.test(host)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function sameOrigin(left, right) {
  try {
    return Boolean(left && right && new URL(left).origin === new URL(right).origin);
  } catch {
    return false;
  }
}

function safeIconUrl(value, base) {
  const url = safePageUrl(value, base);
  if (!url) return null;
  try {
    return new URL(url).protocol === 'https:' ? url : null;
  } catch {
    return null;
  }
}

async function fetchWithTimeout(fetchImpl, input, timeoutMs, init = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

function parseArgs(argv) {
  const options = {
    concurrency: DEFAULT_CONCURRENCY,
    timeoutMs: DEFAULT_TIMEOUT_MS,
    maxRegistries: null,
    registry: null,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (flag === '--dry-run') {
      options.dryRun = true;
      continue;
    }
    if (!['--concurrency', '--timeout-ms', '--max-registries', '--registry'].includes(flag)) {
      throw new Error(`Unknown argument: ${flag}`);
    }
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--registry') options.registry = value;
    else {
      const parsed = Number(value);
      if (!Number.isInteger(parsed) || parsed < 1) throw new Error(`Invalid value for ${flag}: ${value}`);
      if (flag === '--concurrency') options.concurrency = parsed;
      else if (flag === '--timeout-ms') options.timeoutMs = parsed;
      else options.maxRegistries = parsed;
    }
  }
  return options;
}

export function mergeRegistryIconDocument(current, previous) {
  if (!previous?.icons || typeof previous.icons !== 'object') return current;

  const icons = { ...current.icons };
  const missing = [];
  let preserved = 0;

  for (const entry of current.missing ?? []) {
    const prior = previous.icons[entry.namespace];
    const transient = entry.reason
      && !['no-explicit-icon', 'invalid-homepage'].includes(entry.reason);
    if (prior && transient && sameOrigin(entry.homepage, prior.homepage)) {
      icons[entry.namespace] = {
        ...prior,
        preservedAt: current.generatedAt,
        preservedBecause: entry.reason,
      };
      preserved += 1;
      continue;
    }
    missing.push(entry);
  }

  return {
    ...current,
    summary: {
      ...current.summary,
      discovered: current.summary?.found ?? Object.keys(current.icons ?? {}).length,
      preserved,
      found: Object.keys(icons).length,
      missing: missing.length,
    },
    icons,
    missing,
  };
}

export async function main(argv = process.argv.slice(2), cwd = process.cwd()) {
  const options = parseArgs(argv);
  const database = openAtlasCoreDatabase(cwd, { readOnly: true });
  const state = readAtlasState(database);
  const previousIcons = readDocument(database, 'registry-icons');
  database.close();

  let registries = state.rawRegistries
    .map(registry => ({ name: registry.name, homepage: registry.homepage }))
    .filter(registry => registry.name && registry.homepage);
  if (options.registry) registries = registries.filter(registry => registry.name === options.registry);
  if (options.maxRegistries) registries = registries.slice(0, options.maxRegistries);
  if (!registries.length) throw new Error('No matching registries to inspect');

  const discovered = await discoverRegistryIcons({
    registries,
    concurrency: options.concurrency,
    timeoutMs: options.timeoutMs,
  });
  const document = mergeRegistryIconDocument(discovered, previousIcons);

  if (!options.dryRun) {
    const writeDatabase = openAtlasCoreDatabase(cwd);
    try {
      putDocument(writeDatabase, 'registry-icons', 'registry-enrichment', document);
    } finally {
      writeDatabase.close();
    }
  }

  console.log(JSON.stringify(document.summary, null, 2));
  return document;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  });
}
