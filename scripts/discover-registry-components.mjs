import { execFileSync } from 'node:child_process';
import { readFile, open, unlink } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { isAbsolute } from 'node:path';
import { PinchTabBrowser } from './collect-browser-link-evidence.mjs';
import { discoverRegistry, DiscoveryLedger } from './lib/registry-discovery.mjs';

function args(argv) {
  const legal = new Set(['--registry', '--profile', '--server', '--tab', '--journal',
    '--limit', '--max-pages', '--max-depth', '--max-links', '--delay-ms']);
  const opts = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i], value = argv[i + 1];
    if (!legal.has(key) || !value || value.startsWith('--') || opts[key] !== undefined)
      throw new Error('Unknown, repeated or incomplete CLI argument: ' + key);
    opts[key] = value;
  }
  for (const key of ['--registry', '--profile', '--server', '--tab', '--journal']) {
    if (!opts[key]) throw new Error('Missing required ' + key);
  }
  if (!isAbsolute(opts['--journal'])) throw new Error('--journal must be an absolute path');
  const numeric = (key, defaultValue) => {
    if (!opts[key]) return defaultValue;
    const num = Number(opts[key]);
    if (!Number.isSafeInteger(num)) throw new Error('Invalid ' + key);
    return num;
  };
  return { registry: opts['--registry'], profile: opts['--profile'],
    server: opts['--server'], tab: opts['--tab'], journal: opts['--journal'],
    limit: numeric('--limit', 20), maxPages: numeric('--max-pages', 40),
    maxDepth: numeric('--max-depth', 4), maxLinks: numeric('--max-links', 1500),
    delayMs: numeric('--delay-ms', 1000) };
}

function checkedSourceProfile({profile, server}, registry) {
  const raw = execFileSync('pinchtab-profile-manager', [profile, 'status', '--json'],
    { encoding: 'utf8', timeout: 15000 });
  const response = JSON.parse(raw);
  if (!response.ok || !response.data?.instances?.some(
    instance => instance.status === 'running' && instance.url === server))
    throw new Error('Source server is not a running instance of the named managed profile');
  const allowed = response.data.settings?.allowedDomains ?? [];
  const host = new URL(registry.homepage).hostname.toLowerCase();
  if (!allowed.some(pattern => pattern === '*' || pattern === host
    || (pattern.startsWith('*.') && host.endsWith(pattern.slice(1))
      && host.length > pattern.length - 1)))
    throw new Error('Managed profile does not allow this registry official homepage domain');
}

export async function main(argv, cwd = process.cwd()) {
  const options = args(argv);
  const [raw, catalog, curated] = await Promise.all([
    readFile(cwd + '/data/shadcn/registries.raw.json', 'utf8').then(JSON.parse),
    readFile(cwd + '/public/data/registry-catalog-items.json', 'utf8').then(JSON.parse),
    readFile(cwd + '/data/shadcn/registry-items.json', 'utf8').then(JSON.parse),
  ]);
  const registry = raw.find(item => item.name === options.registry);
  if (!registry) throw new Error('Unknown exact raw registry namespace');
  checkedSourceProfile(options, registry);
  const indexedItems = [...new Set([
    ...(catalog.registries?.[options.registry] ?? []).map(x => x.name),
    ...(curated[options.registry] ?? []).map(x => x.slug),
  ])].filter(x => typeof x === 'string');
  // A journal has one writer at a time; an interrupted worker leaves an explicit
  // lock for operator recovery rather than silently racing another worker.
  const lockPath = options.journal + '.lock';
  const lock = await open(lockPath, 'wx', 0o600).catch(error => {
    if (error.code === 'EEXIST') throw new Error('Discovery journal is already claimed');
    throw error;
  });
  try {
  const ledger = await DiscoveryLedger.open(options.journal);
  const browser = new PinchTabBrowser(options.server, options.tab);
  // An empty hydration snapshot cannot be treated as an empty registry.
  browser.waitForLinks = async timeoutMs => browser.call('wait', '--fn',
    "document.querySelectorAll('a[href]').length > 0",
    '--timeout', String(Math.min(timeoutMs, 4000)));
  const result = await discoverRegistry({
    registry, indexedItems, ledger, browser,
    limit: options.limit, maxPages: options.maxPages,
    maxDepth: options.maxDepth, maxLinks: options.maxLinks, delayMs: options.delayMs,
  });
  const outcomes = {};
  for (const record of result.records) {
    const key = record.status === 'page-observed' ? 'page-observed' : record.reason;
    outcomes[key] = (outcomes[key] ?? 0) + 1;
  }
  return { schema: result.schema, namespace: registry.name,
    indexedIdentities: indexedItems.length, attemptedIdentities: result.records.length,
    processedThisRun: result.processed, pending: result.pending,
    allAttempted: result.complete, allDocumentationPagesObserved: result.fullyVerified,
    listingPages: result.listings.length, discoveryExhausted: result.exhausted,
    outcomes, catalogFingerprint: result.catalogFingerprint,
    journalPath: options.journal,
    upstreamBuildsVerified: 0,
    note: 'Observed documentation identity is not a reviewed source-exact build or functional component preview.' };
  } finally {
    await lock.close();
    await unlink(lockPath);
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(result => {
    console.log(JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error('Registry discovery failed: ' + error.message);
    process.exitCode = 1;
  });
}
