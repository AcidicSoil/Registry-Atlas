import { execFileSync } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DiscoveryLedger } from './lib/registry-discovery.mjs';
import { planRegistryDiscovery, executeDiscoveryBatch } from './lib/registry-discovery-schedule.mjs';
import { main as runDiscovery } from './discover-registry-components.mjs';
import { openAtlasCoreDatabase, readAtlasState } from './lib/atlas-storage.mjs';

export function parseRegistryScheduleArgs(argv) {
  const flags = new Set(['--profile', '--server', '--tab', '--journal-dir',
    '--cursor', '--max-registries', '--per-registry-limit', '--max-pages',
    '--max-depth', '--max-links', '--delay-ms', '--report', '--sitemap-dir']);
  const opts = {dryRun: false};
  for (let i = 0; i < argv.length; i++) {
    const key = argv[i];
    if (key === '--dry-run') {
      if (opts.dryRun) throw new Error('Duplicate --dry-run');
      opts.dryRun = true;
      continue;
    }
    if (!flags.has(key) || !argv[i + 1] || argv[i + 1].startsWith('--')
      || Object.hasOwn(opts, key)) throw new Error('Unknown, repeated or incomplete argument: ' + key);
    opts[key] = argv[++i];
  }
  for (const key of ['--profile', '--server', '--journal-dir']) {
    if (!opts[key]) throw new Error('Missing ' + key);
  }
  if (!opts.dryRun && !opts['--tab']) throw new Error('Live scheduling requires --tab');
  if (!isAbsolute(opts['--journal-dir'])) throw new Error('--journal-dir must be absolute');
  if (opts['--sitemap-dir'] && !isAbsolute(opts['--sitemap-dir']))
    throw new Error('--sitemap-dir must be absolute');
  if (opts['--report'] && !isAbsolute(opts['--report']))
    throw new Error('--report must be absolute');
  const integer = (key, fallback, min, max) => {
    if (opts[key] === undefined) return fallback;
    const value = Number(opts[key]);
    if (!Number.isSafeInteger(value) || value < min || value > max)
      throw new Error('Invalid ' + key);
    return value;
  };
  return {
    profile: opts['--profile'], server: opts['--server'], tab: opts['--tab'],
    journalDir: opts['--journal-dir'], cursor: opts['--cursor'] ?? null,
    report: opts['--report'] ?? null, sitemapDir: opts['--sitemap-dir'] ?? null,
    dryRun: opts.dryRun,
    maxRegistries: integer('--max-registries', 2, 1, 20),
    perRegistryLimit: integer('--per-registry-limit', 20, 1, 200),
    maxPages: integer('--max-pages', 40, 1, 250),
    maxDepth: integer('--max-depth', 4, 0, 10),
    maxLinks: integer('--max-links', 1500, 1, 10000),
    delayMs: integer('--delay-ms', 1000, 0, 60000),
  };
}

function verifiedProfile(opts) {
  const status = JSON.parse(execFileSync('pinchtab-profile-manager',
    [opts.profile, 'status', '--json'],
    {encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024}));
  if (!status.ok || !status.data?.instances?.some(instance =>
    instance.url === opts.server && instance.status === 'running'))
    throw new Error('Selected server is not running under the approved managed profile');
  return status.data.settings?.allowedDomains ?? [];
}

async function readLedgers(raw, directory) {
  const ledgers = {};
  for (const registry of raw) {
    if (!/^@[a-z0-9][a-z0-9-]*$/.test(registry.name))
      throw new Error('Unsafe registry journal filename');
    ledgers[registry.name] = await DiscoveryLedger.open(
      join(directory, registry.name.slice(1) + '.jsonl'));
  }
  return ledgers;
}

export async function main(argv, cwd = process.cwd()) {
  const opts = parseRegistryScheduleArgs(argv);
  const allowedDomains = verifiedProfile(opts);
  const database = openAtlasCoreDatabase(cwd, { readOnly: true });
  const state = readAtlasState(database);
  database.close();
  const raw = state.rawRegistries;
  const catalog = state.catalog;
  const curated = state.curated;
  const asOf = new Date().toISOString();
  const before = planRegistryDiscovery(raw, catalog, curated,
    await readLedgers(raw, opts.journalDir), {
      asOf, cursor: opts.cursor, maxRegistries: opts.maxRegistries, allowedDomains,
    });
  let execution = [];
  if (!opts.dryRun && before.batch.length) {
    await mkdir(opts.journalDir, {recursive: true});
    execution = await executeDiscoveryBatch(before.batch, async job => runDiscovery([
      '--registry', job.namespace,
      '--profile', opts.profile, '--server', opts.server, '--tab', opts.tab,
      '--journal', join(opts.journalDir, job.namespace.slice(1) + '.jsonl'),
      ...(opts.sitemapDir ? ['--sitemap-dir',opts.sitemapDir] : []),
      '--limit', String(opts.perRegistryLimit),
      '--max-pages', String(opts.maxPages), '--max-depth', String(opts.maxDepth),
      '--max-links', String(opts.maxLinks), '--delay-ms', String(opts.delayMs),
    ], cwd));
  }
  const after = opts.dryRun ? before : planRegistryDiscovery(raw, catalog, curated,
    await readLedgers(raw, opts.journalDir), {
      asOf: new Date().toISOString(), cursor: opts.cursor,
      maxRegistries: opts.maxRegistries, allowedDomains,
    });
  const result = {
    schema: 'registry-atlas-discovery-run/v1', dryRun: opts.dryRun,
    profile: opts.profile, cursor: opts.cursor,
    batch: before.batch.map(job => ({namespace: job.namespace,
      totalItems: job.totalItems, remaining: job.remaining})),
    nextCursor: before.nextCursor,
    before: before.summary, after: after.summary,
    execution,
    errors: execution.filter(row => row.outcome === 'failed').length,
    // Page observations are not build/interaction verification.
    note: 'Catalog, documentation, source, build and browser proof are distinct stages.',
  };
  if (opts.report) await writeFile(opts.report,
    JSON.stringify(result, null, 2) + '\n', {flag: 'wx'});
  return result;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(result => {
    console.log(JSON.stringify(result, null, 2));
    if (result.errors) process.exitCode = 2;
  }).catch(error => {
    console.error('Registry scheduler failed: ' + error.message);
    process.exitCode = 1;
  });
}
