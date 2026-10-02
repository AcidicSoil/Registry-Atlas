import { createHash } from 'node:crypto';
import { readFile, appendFile } from 'node:fs/promises';
import { isAbsolute } from 'node:path';
import { isIP } from 'node:net';

const SCHEMA = 'registry-atlas-discovery/v1';
const DIRECTORY = /^(?:docs?|documentation|components|primitives|blocks|patterns|catalog|library|elements|ui|examples|animations|actions|forms|inputs|buttons|navigation|feedback|browse)$/i;
const normalize = text => String(text ?? '').toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
const leaf = item => item.split('/').at(-1);
const hash = input => createHash('sha256').update(input).digest('hex');
const isFresh = (row, fingerprint, checkedAt, maxAgeMs) =>
  row?.catalogFingerprint === fingerprint && typeof row.checkedAt === 'string'
  && Date.parse(checkedAt) >= Date.parse(row.checkedAt)
  && Date.parse(checkedAt) - Date.parse(row.checkedAt) < maxAgeMs;

function officialRoot(homepage) {
  let url;
  try { url = new URL(homepage); } catch { throw new Error('Invalid official homepage'); }
  const host = url.hostname.toLowerCase().replace(/^\[|\]$/g, '');
  if (url.protocol !== 'https:' || !host || url.port || url.username || url.password
    || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.local')
    || host.endsWith('.internal') || host.includes('%')
    || (isIP(host) === 4 && (/^(?:0|10|127|169\.254|192\.168)\./.test(host)
      || /^172\.(?:1[6-9]|2\d|3[01])\./.test(host)
      || /^1(?:9[8-9])\./.test(host) || /^2(?:2[4-9]|3\d|4\d|5[0-5])\./.test(host)))
    || isIP(host) === 6)
    throw new Error('Unsafe official homepage');
  return url;
}
function sameOrigin(raw, from, root) {
  try {
    if (typeof raw !== 'string' || !raw.trim() || raw.startsWith('#') || raw.length > 1200)
      return null;
    const u = new URL(raw, from);
    if (u.protocol !== 'https:' || u.origin !== root.origin || u.port
      || u.username || u.password || u.hash) return null;
    return u.href;
  } catch { return null; }
}
function directoryLink(link) {
  const path = new URL(link.url).pathname.split('/').filter(Boolean);
  const last = path.at(-1) ?? '';
  return DIRECTORY.test(normalize(link.name).replace(/ /g, '-').replace(/-/g, ''))
    || DIRECTORY.test(link.name.trim())
    || DIRECTORY.test(last);
}
async function observedLinks(browser, current, root, remaining) {
  const snap = await browser.snap();
  if (snap?.url !== current || await browser.url() !== current)
    throw new Error('Stale rendered-page observation');
  const found = new Map();
  const add = (name, raw, navigationSource) => {
    const url = sameOrigin(raw, current, root);
    if (!url || !String(name ?? '').trim() || url === current) return;
    const key = name.trim() + '\0' + url;
    if (!found.has(key)) found.set(key, {
      name: name.trim().slice(0, 180), url,
      listingUrl: current, navigationSource,
    });
  };
  const semantics = (snap.nodes ?? []).filter(x => x.role === 'link'
    && typeof x.ref === 'string' && typeof x.name === 'string').slice(0, remaining);
  for (const node of semantics) add(node.name, await browser.attr(node.ref), 'semantic-ref');
  if (typeof browser.domLinks === 'function') {
    for (const node of (await browser.domLinks()).slice(0, remaining)) {
      add(node.name, node.href, 'observed-dom-anchor');
    }
  }
  return { links: [...found.values()].slice(0, remaining), snap };
}
function matchesFor(link, identities, repeatedLeaves) {
  const label = normalize(link.name);
  const matches = [];
  for (const slug of identities) {
    const full = normalize(slug);
    if (label === full || label.startsWith(full + ' ')) {
      matches.push({ slug, kind: 'full-name' });
      continue;
    }
    const end = normalize(leaf(slug));
    const fullPath = slug.split('/').map(encodeURIComponent).join('/');
    if ((label === end || label.startsWith(end + ' '))
      && link.url.split('?')[0].endsWith('/' + fullPath)) {
      if (repeatedLeaves.get(end) === 1) matches.push({ slug, kind: 'unique-leaf-path' });
      else matches.push({ slug, kind: 'ambiguous-leaf' });
    } else if ((label === end || label.startsWith(end + ' '))
      && repeatedLeaves.get(end) > 1) {
      matches.push({ slug, kind: 'ambiguous-leaf' });
    }
  }
  return matches;
}
async function inspectNavigation({registry, identities, browser, root, maxPages, maxDepth, maxLinks, delayMs}) {
  const origin = root.href;
  const queue = [{url: origin, depth: 0}];
  const visited = new Set();
  const candidates = [];
  const ambiguous = new Set();
  const listings = [];
  const repeatedLeaves = new Map();
  for (const slug of identities) {
    const name = normalize(leaf(slug));
    repeatedLeaves.set(name, (repeatedLeaves.get(name) ?? 0) + 1);
  }
  let remaining = maxLinks;
  let error = null;
  while (queue.length && visited.size < maxPages && remaining > 0) {
    const next = queue.shift();
    if (visited.has(next.url)) continue;
    visited.add(next.url);
    if (delayMs && visited.size > 1)
      await new Promise(done => setTimeout(done, delayMs));
    try {
      if (await browser.url() !== next.url) await browser.nav(next.url);
      if (await browser.url() !== next.url) throw new Error('Unexpected destination');
      const { links } = await observedLinks(browser, next.url, root, remaining);
      remaining -= links.length;
      listings.push({ url: next.url, depth: next.depth, observedLinks: links.length });
      for (const link of links) {
        const matched = matchesFor(link, identities, repeatedLeaves);
        for (const match of matched) {
          if (match.kind === 'ambiguous-leaf') ambiguous.add(match.slug);
          else candidates.push({ ...link, slug: match.slug, matching: match.kind });
        }
        if (next.depth < maxDepth && directoryLink(link) && !visited.has(link.url)) {
          if (!queue.some(x => x.url === link.url)) queue.push({url: link.url, depth: next.depth + 1});
        }
      }
    } catch (e) {
      error = String(e?.message ?? e).slice(0, 160);
    }
  }
  return {
    listings, candidates, ambiguous: [...ambiguous].sort(),
    exhausted: queue.length > 0 || remaining === 0, error,
  };
}

export function catalogFingerprint(registry, indexedItems) {
  const names = [...new Set(indexedItems)].sort();
  return hash(JSON.stringify([registry.name, registry.homepage, names]));
}

export class DiscoveryLedger {
  constructor(path, rows) { this.path = path; this.rows = rows; }
  get(token) { return this.rows.get(token); }
  async append(row) {
    if (row.schema !== SCHEMA || typeof row.token !== 'string' || !row.token)
      throw new Error('Invalid discovery ledger record');
    await appendFile(this.path, JSON.stringify(row) + '\n', {flag: 'a'});
    this.rows.set(row.token, row);
  }
  static async open(path) {
    if (!isAbsolute(path)) throw new Error('Discovery journal path must be absolute');
    let data = '';
    try { data = await readFile(path, 'utf8'); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const rows = new Map();
    for (const line of data.split('\n').filter(Boolean)) {
      const row = JSON.parse(line);
      if (row.schema !== SCHEMA || typeof row.token !== 'string' || !row.token)
        throw new Error('Invalid discovery journal line');
      rows.set(row.token, row);
    }
    return new DiscoveryLedger(path, rows);
  }
}

export async function discoverRegistry({
  registry, indexedItems, browser, ledger, checkedAt = new Date().toISOString(),
  limit = 100, maxPages = 40, maxDepth = 4, maxLinks = 1500, delayMs = 0,
  maxAgeMs = 24 * 60 * 60 * 1000,
}) {
  const root = officialRoot(registry.homepage);
  if (!/^[a-z0-9@_-]+$/i.test(registry.name)) throw new Error('Invalid registry namespace');
  if (!Array.isArray(indexedItems) || indexedItems.some(x => typeof x !== 'string' || !x.trim()))
    throw new Error('Invalid indexed component names');
  for (const [name, value, maximum] of [
    ['limit', limit, 200], ['maxPages', maxPages, 250],
    ['maxDepth', maxDepth, 10], ['maxLinks', maxLinks, 10000],
  ]) {
    if (!Number.isSafeInteger(value) || value < (name === 'maxDepth' ? 0 : 1) || value > maximum)
      throw new Error('Invalid ' + name);
  }
  if (!Number.isSafeInteger(delayMs) || delayMs < 0 || delayMs > 60000)
    throw new Error('Invalid delayMs');
  const identities = [...new Set(indexedItems)].sort();
  const fp = catalogFingerprint(registry, identities);
  const prefix = registry.name + '/';
  const snapshotToken = 'registry:' + registry.name;
  let snapshot = ledger.get(snapshotToken);
  if (!isFresh(snapshot, fp, checkedAt, maxAgeMs) || snapshot.status !== 'discovered') {
    const nav = await inspectNavigation({
      registry, identities, browser, root, maxPages, maxDepth, maxLinks, delayMs,
    });
    snapshot = {schema: SCHEMA, token: snapshotToken, namespace: registry.name,
      status: 'discovered', catalogFingerprint: fp, checkedAt, ...nav};
    await ledger.append(snapshot);
  }
  let processed = 0;
  const records = [];
  for (const slug of identities) {
    const token = prefix + slug;
    let row = ledger.get(token);
    if (!isFresh(row, fp, checkedAt, maxAgeMs)) {
      if (processed >= limit) continue;
      const candidates = (snapshot.candidates ?? []).filter(x => x.slug === slug);
      const unique = [...new Set(candidates.map(x => x.url))];
      const base = {schema: SCHEMA, token, namespace: registry.name,
        slug, catalogFingerprint: fp, checkedAt};
      if (unique.length !== 1) {
        row = {...base, status: 'unresolved',
          reason: unique.length > 1 ? 'multiple-observed-destinations'
            : snapshot.ambiguous.includes(slug) ? 'ambiguous-component-identity'
              : snapshot.exhausted ? 'discovery-budget-exhausted'
                : snapshot.error ? 'discovery-navigation-error'
                  : 'not-found-in-observed-navigation'};
      } else {
        const source = candidates.find(x => x.url === unique[0]);
        try {
          if (delayMs) await new Promise(done => setTimeout(done, delayMs));
          await browser.nav(source.url);
          const landed = await browser.url();
          const snap = await browser.snap();
          const heads = (snap.nodes ?? []).filter(x => x.role === 'heading')
            .map(x => normalize(x.name));
          const full = normalize(slug);
          const itemLeaf = normalize(leaf(slug));
          const expected = source.matching === 'unique-leaf-path' ? itemLeaf : full;
          if (landed !== source.url || snap.url !== landed
            || !sameOrigin(landed, source.url, root)) {
            row = {...base, status: 'unresolved', reason: 'destination-changed'};
          } else if (!heads.includes(expected)) {
            row = {...base, status: 'unresolved', reason: 'rendered-identity-mismatch'};
          } else {
            row = {...base, status: 'page-observed', docsUrl: landed,
              evidence: { strategy: 'rendered-navigation', listingUrl: source.listingUrl,
                observedLink: source.url, linkName: source.name,
                matching: source.matching, navigationSource: source.navigationSource,
                renderedHeading: (snap.nodes ?? []).find(x =>
                  x.role === 'heading' && normalize(x.name) === expected)?.name,
                observedUrl: landed },
            };
          }
        } catch {
          row = {...base, status: 'unresolved', reason: 'component-navigation-error'};
        }
      }
      await ledger.append(row);
      processed++;
    }
    records.push(row);
  }
  const pending = identities.length - records.length;
  return {schema: SCHEMA, namespace: registry.name, catalogFingerprint: fp,
    listings: snapshot.listings ?? [], records, processed, pending,
    complete: pending === 0, fullyVerified: identities.length > 0 && pending === 0
      && records.every(x => x.status === 'page-observed'),
    exhausted: snapshot.exhausted ?? false,
    observationError: snapshot.error ?? null};
}
