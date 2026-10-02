import {readFile, writeFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {isAbsolute, join, resolve} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {DiscoveryLedger} from './lib/registry-discovery.mjs';
import {planRegistryDiscovery} from './lib/registry-discovery-schedule.mjs';
import {planPreviewCoverage} from './plan-component-previews.mjs';

export function reconcileCoverage(raw, catalog, curated, manifest, ledgers, options = {}) {
  const discovery = planRegistryDiscovery(raw, catalog, curated, ledgers, {
    asOf: options.asOf, maxAgeMs: options.maxAgeMs,
    allowedDomains: options.allowedDomains ?? [],
  });
  const preview = planPreviewCoverage(raw, catalog, manifest, {
    limit: 1, assetExists: options.assetExists,
  }, curated);
  if (discovery.summary.rawRegistries !== preview.summary.rawRegistries
    || discovery.summary.distinctItems !== preview.summary.distinctItems)
    throw new Error('Discovery and preview source identities do not reconcile');
  const summary = {
    rawRegistries: preview.summary.rawRegistries,
    populatedRegistries: preview.summary.populatedRegistries,
    emptyRegistries: preview.summary.emptyRegistries,
    distinctItems: preview.summary.distinctItems,
    indexedDuplicates: preview.summary.indexedDuplicates,
    blockedByProfile: discovery.summary.blockedByProfile,
    pageObserved: discovery.summary.pageObserved,
    notVisited: discovery.summary.notVisited,
    stale: discovery.summary.stale,
    ambiguous: discovery.summary.ambiguous,
    blocked: discovery.summary.blocked,
    unresolved: discovery.summary.unresolved,
    fixtureVerified: preview.summary.fixtureVerified,
    upstreamBuiltVerified: preview.summary.upstreamBuiltVerified,
    previewPending: preview.summary.pending,
    previewBlocked: preview.summary.blocked,
    errors: preview.summary.errors,
    complete: preview.summary.complete
      && discovery.summary.pageObserved === preview.summary.distinctItems
      && discovery.summary.stale === 0 && discovery.summary.ambiguous === 0
      && discovery.summary.notVisited === 0 && discovery.summary.blocked === 0
      && discovery.summary.unresolved === 0,
  };
  const previewByName = new Map(preview.registries.map(row => [row.namespace, row]));
  const registries = discovery.registries.map(row => ({
    ...row, preview: previewByName.get(row.namespace),
  }));
  return {
    schema: 'registry-atlas-coverage-reconciliation/v1',
    summary, registries, errors: preview.errors,
    note: 'Page-observed documents and source-informed fixtures are not reviewed upstream React builds.',
  };
}

export function parseReconciliationArgs(argv) {
  const opts = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i], value = argv[i + 1];
    if (!['--journal-dir', '--report', '--profile', '--server'].includes(key) || !value
      || value.startsWith('--') || Object.hasOwn(opts, key))
      throw new Error('Unknown, duplicate or missing reconciliation argument');
    opts[key] = value;
  }
  if (!opts['--profile']) throw new Error('Missing --profile');
  if (!opts['--server']) throw new Error('Missing --server');
  if (!opts['--journal-dir'] || !isAbsolute(opts['--journal-dir'])
    || (opts['--report'] && !isAbsolute(opts['--report'])))
    throw new Error('Reconciliation journal directory and report must use absolute paths');
  return {profile: opts['--profile'], server: opts['--server'],
    journalDir: opts['--journal-dir'], report: opts['--report'] ?? null};
}

export function domainsFromManagedProfile(status, profile, server) {
  if (!status?.ok || status.profile !== profile
    || !status.data?.instances?.some(instance =>
      instance.status === 'running' && instance.url === server))
    throw new Error('Selected server is not running under the named managed profile');
  const allowed = status.data?.settings?.allowedDomains;
  if (!Array.isArray(allowed) || allowed.some(domain =>
    typeof domain !== 'string' || !domain.trim()))
    throw new Error('Managed profile allowedDomains are missing or invalid');
  return [...allowed];
}

async function main(argv) {
  const opts = parseReconciliationArgs(argv);
  const status = JSON.parse(execFileSync('pinchtab-profile-manager',
    [opts.profile, 'status', '--json'],
    {encoding: 'utf8', timeout: 15000, maxBuffer: 1024 * 1024}));
  const allowedDomains = domainsFromManagedProfile(status, opts.profile, opts.server);
  const root = fileURLToPath(new URL('../', import.meta.url));
  const readJson = async file => JSON.parse(await readFile(join(root, file), 'utf8'));
  const [raw, catalog, curated, manifest] = await Promise.all([
    readJson('data/shadcn/registries.raw.json'),
    readJson('public/data/registry-catalog-items.json'),
    readJson('data/shadcn/registry-items.json'),
    readJson('src/registry-explorer/data/component-demo-manifest.json'),
  ]);
  const ledgers = {};
  for (const registry of raw) {
    if (!/^@[a-z0-9][a-z0-9-]*$/.test(registry.name))
      throw new Error('Invalid registry journal filename');
    ledgers[registry.name] = await DiscoveryLedger.open(
      join(opts.journalDir, registry.name.slice(1) + '.jsonl'));
  }
  const report = reconcileCoverage(raw, catalog, curated, manifest, ledgers, {
    allowedDomains,
    assetExists: localPath => existsSync(join(root, 'public',
      localPath.slice('/Registry-Atlas/'.length))),
  });
  if (opts.report) await writeFile(opts.report,
    JSON.stringify(report, null, 2) + '\n', {flag:'wx'});
  return report;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main(process.argv.slice(2)).then(report => {
    console.log(JSON.stringify(optsOutput(report), null, 2));
    if (report.summary.errors) process.exitCode = 2;
  }).catch(error => {
    console.error('Coverage reconciliation failed: ' + error.message);
    process.exitCode = 1;
  });
}

function optsOutput(report) {
  return {schema: report.schema, summary: report.summary,
    errors: report.errors, note: report.note};
}
