import { writeFile, mkdir, stat } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';
import { openAtlasCoreDatabase, readAtlasState } from './lib/atlas-storage.mjs';

const SCHEMA = 'registry-atlas-component-link-evidence/v1';

function safeSameOrigin(raw, base) {
  if (typeof raw !== 'string' || !raw.trim() || raw.trim().startsWith('#')) return null;
  try {
    const origin = new URL(base);
    const target = new URL(raw.trim(), base);
    if (target.protocol !== 'https:' || target.origin !== origin.origin
      || target.username || target.password || target.port || target.hash) return null;
    return target.href;
  } catch { return null; }
}

const slugFromPath = url => decodeURIComponent(new URL(url).pathname.split('/').filter(Boolean).at(-1) ?? '');
const headings = snap => (snap.nodes ?? []).filter(n => n.role === 'heading' && typeof n.name === 'string').map(n => n.name.trim());
const links = snap => (snap.nodes ?? []).filter(n => n.role === 'link'
  && /^e\d+$/.test(n.ref ?? '') && typeof n.name === 'string' && n.name.trim());
const normalize = name => name.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();

async function safeLink(browser, node, currentUrl, homepage) {
  const href = await browser.attr(node.ref);
  return safeSameOrigin(href, currentUrl) && safeSameOrigin(href, homepage)
    ? safeSameOrigin(href, currentUrl) : null;
}

function refuse(result, slug, reason) {
  result.unresolved.push({ ...(slug ? { slug } : {}), reason });
}

export async function collectBrowserLinkEvidence(browser, registry, targets, captureDir, checkedAt = new Date().toISOString()) {
  const homepage = new URL(registry.homepage).href;
  const result = { schemaVersion: SCHEMA, registry: registry.name, homepageUrl: homepage,
    listingUrl: null, records: [], unresolved: [] };
  if (!safeSameOrigin(homepage, homepage)) throw new Error('Official homepage must be HTTPS');
  if (!Array.isArray(targets) || targets.length > 200
    || targets.some(x => !/^[a-z0-9][a-z0-9_-]*$/.test(x?.slug ?? '')))
    throw new Error('Expected at most 200 indexed component slugs');
  if (await browser.url() !== homepage) {
    refuse(result, null, 'tab-not-on-homepage');
    return result;
  }
  const homepageSnapshot = await browser.snap();
  if (homepageSnapshot.url !== homepage) {
    refuse(result, null, 'stale-homepage-observation');
    return result;
  }
  const componentLinks = links(homepageSnapshot)
    .filter(n => /\b(components|catalog)\b/i.test(n.name) && !/github|sponsor|pricing/i.test(n.name));
  const choices = [];
  for (const link of componentLinks) {
    const target = await safeLink(browser, link, homepage, homepage);
    if (target) choices.push({ ...link, url: target,
      priority: /^components$/i.test(link.name.trim()) ? 0 : 1 });
  }
  choices.sort((a, b) => a.priority - b.priority);
  if (!choices.length) {
    refuse(result, null, 'no-safe-catalog-link');
    return result;
  }
  // A real link already observed in the browser, not a guessed URL template.
  const listingChoice = choices[0];
  await browser.click(listingChoice.ref);
  const listing = await browser.snap();
  if (listing.url !== listingChoice.url || await browser.url() !== listing.url
    || !safeSameOrigin(listing.url, homepage)) {
    refuse(result, null, 'catalog-navigation-mismatch');
    return result;
  }
  result.listingUrl = listing.url;
  for (const target of targets) {
    const slug = target.slug;
    if (await browser.url() !== listing.url) {
      await browser.nav(listing.url);
    }
    const current = await browser.snap();
    if (current.url !== listing.url || await browser.url() !== current.url) {
      refuse(result, slug, 'stale-listing-observation');
      break;
    }
    const wanted = normalize(slug);
    const maybe = links(current).filter(link => {
      const label = normalize(link.name);
      return label === wanted || label.startsWith(wanted + ' ');
    });
    const matches = [];
    for (const link of maybe) {
      const url = await safeLink(browser, link, listing.url, homepage);
      if (url && normalize(slugFromPath(url)) === wanted && url !== listing.url) {
        matches.push({ ...link, url });
      }
    }
    let observed = null;
    let navigationSource = 'semantic-ref';
    if (matches.length) {
      const distinctDestinations = new Set(matches.map(match => match.url));
      if (distinctDestinations.size === 1) observed = matches[0];
    } else if (typeof browser.domLinks === 'function') {
      // Some site links exist in the DOM but are omitted from the compact
      // accessibility snapshot. Inspect only actual anchors, never build a URL.
      const anchors = await browser.domLinks();
      const anchorsWithUrls = anchors
        .filter(link => typeof link.name === 'string'
          && (normalize(link.name) === wanted || normalize(link.name).startsWith(wanted + ' ')))
        .map(link => ({ ...link, url: safeSameOrigin(link.href, listing.url) }))
        .filter(link => link.url && normalize(slugFromPath(link.url)) === wanted
          && link.url !== listing.url);
      if (anchorsWithUrls.length
        && new Set(anchorsWithUrls.map(link => link.url)).size === 1) {
        observed = anchorsWithUrls[0];
        navigationSource = 'observed-dom-anchor';
      }
    }
    if (!observed) {
      refuse(result, slug, 'missing-unique-component-link');
      continue;
    }
    if (navigationSource === 'semantic-ref') {
      // Re-read the actual href immediately before clicking the live ref.
      if (await safeLink(browser, observed, listing.url, homepage) !== observed.url) {
        refuse(result, slug, 'stale-component-link');
        continue;
      }
      await browser.click(observed.ref);
    } else {
      // Reobserve the actual anchor before navigating, so a mutated link
      // cannot silently change an earlier evidence decision.
      const currentAnchors = await browser.domLinks();
      if (!currentAnchors.some(link => link.name === observed.name
        && safeSameOrigin(link.href, listing.url) === observed.url)) {
        refuse(result, slug, 'stale-component-link');
        continue;
      }
      await browser.nav(observed.url);
    }
    const finalPage = await browser.snap();
    if (finalPage.url !== observed.url || await browser.url() !== observed.url
      || !safeSameOrigin(finalPage.url, homepage)) {
      refuse(result, slug, 'component-navigation-mismatch');
      continue;
    }
    const renderedHeading = headings(finalPage).find(name => normalize(name) === wanted);
    if (!renderedHeading || normalize(slugFromPath(finalPage.url)) !== wanted) {
      refuse(result, slug, 'component-identity-mismatch');
      continue;
    }
    const screenshot = join(captureDir, registry.name.replace(/^@/, ''), slug + '.jpg');
    const capture = await browser.capture(screenshot);
    if (capture.url !== observed.url || await browser.url() !== observed.url) {
      refuse(result, slug, 'capture-url-mismatch');
      continue;
    }
    const pageEvidence = typeof browser.extract === 'function' ? await browser.extract() : null;
    result.records.push({
      namespace: registry.name, slug, previousUrl: target.docs_url ?? target.docsUrl ?? null,
      verifiedUrl: observed.url,
      browser: {
        homepageUrl: homepage, listingUrl: listing.url, observedUrl: finalPage.url,
        observedSlug: slugFromPath(finalPage.url), renderedHeading, checkedAt,
        capturePath: screenshot, navigationSource,
        ...(pageEvidence ? { pageEvidence } : {}),
      },
    });
  }
  return result;
}

export class PinchTabBrowser {
  constructor(server, tab) {
    const u = new URL(server);
    if (u.protocol !== 'http:' || u.hostname !== '127.0.0.1' || u.username || u.password
      || !/^[0-9]+$/.test(u.port) || u.pathname !== '/') throw new Error('PinchTab must use explicit loopback server');
    if (!/^[0-9a-f]{32}$/i.test(tab)) throw new Error('PinchTab requires an explicit managed tab ID');
    this.server = u.href.replace(/\/$/, '');
    this.tab = tab;
  }

  call(...args) {
    const json = execFileSync('pinchtab', ['--server', this.server, ...args, '--tab', this.tab, '--json'],
      { encoding: 'utf8', timeout: 30000, maxBuffer: 8 * 1024 * 1024 });
    return JSON.parse(json);
  }

  async url() { return this.call('url').url; }
  async snap() { return this.call('snap'); }
  async attr(ref) { return this.call('attr', ref, 'href').value; }
  async click(ref) { this.call('click', ref, '--wait-nav'); }
  async nav(url) { this.call('nav', url); }
  async capture(path) {
    const captured = this.call('capture', '--require-pair', '--output', path);
    return { url: captured.url, capturePath: path };
  }

  async domLinks() {
    // Read observed page anchors when the compact semantic snapshot omits them.
    // Never fabricate URLs from item slugs or execute page-provided scripts.
    const expression = String.raw`JSON.stringify([...document.querySelectorAll('a[href]')]
      .slice(0, 1500).map(a => ({
        name: (a.innerText || a.textContent || '').trim().slice(0, 160),
        href: (a.getAttribute('href') || '').slice(0, 600),
      })))`;
    return JSON.parse(this.call('eval', expression).result);
  }

  async extract() {
    // This fixed expression only reads DOM text. It never executes source code
    // from registry examples, installs dependencies, or evaluates page-supplied JS.
    const expression = String.raw`(() => {
      const text = document.body?.innerText || '';
      const installationCommands = [...new Set(
        text.match(/(?:pnpm dlx|npx|yarn dlx|bunx)\s+shadcn@latest\s+add\s+@[a-z0-9_-]+\/[a-z0-9_-]+/gi) || []
      )].slice(0, 8);
      const usageExamples = [...new Set([...document.querySelectorAll('pre')]
        .map(n => n.innerText.trim()).filter(Boolean).map(s => s.slice(0, 4000)))].slice(0, 12);
      return JSON.stringify({ installationCommands, usageExamples });
    })()`;
    const observed = JSON.parse(this.call('eval', expression).result);
    return {
      installationCommands: observed.installationCommands ?? [],
      usageExamples: observed.usageExamples ?? [],
    };
  }
}

async function main(argv) {
  const opt = flag => argv[argv.indexOf(flag) + 1];
  for (const flag of ['--registry', '--server', '--tab', '--slugs', '--output', '--capture-dir']) {
    if (!argv.includes(flag) || !opt(flag) || opt(flag).startsWith('--')) throw new Error('Missing ' + flag);
  }
  const registryName = opt('--registry');
  const slugs = [...new Set(opt('--slugs').split(',').map(x => x.trim()).filter(Boolean))];
  if (slugs.length < 1 || slugs.length > 200) throw new Error('Pass 1 to 200 indexed slugs');
  const database = openAtlasCoreDatabase(process.cwd(), { readOnly: true });
  const state = readAtlasState(database);
  database.close();
  const registries = state.rawRegistries;
  const catalog = state.catalog;
  const curated = state.curated;
  const registry = registries.find(r => r.name === registryName);
  if (!registry) throw new Error('Unknown official registry: ' + registryName);
  const indexed = new Set((catalog.registries?.[registryName] ?? []).map(x => x.name));
  const curatedRows = new Map((curated[registryName] ?? []).map(x => [x.slug, x]));
  if (slugs.some(slug => !indexed.has(slug) && !curatedRows.has(slug))) throw new Error('Unknown component slug in source catalog');
  const reportPath = resolve(opt('--output'));
  const captureDir = resolve(opt('--capture-dir'));
  if (await stat(reportPath).catch(() => null)) throw new Error('Refusing to overwrite existing report');
  await mkdir(join(captureDir, registry.name.replace(/^@/, '')), { recursive: true });
  const browser = new PinchTabBrowser(opt('--server'), opt('--tab'));
  const result = await collectBrowserLinkEvidence(browser, registry,
    slugs.map(slug => ({ slug, docs_url: curatedRows.get(slug)?.docs_url ?? null })), captureDir);
  await writeFile(reportPath, JSON.stringify(result, null, 2) + '\n', { flag: 'wx' });
  console.log(JSON.stringify({ registry: registryName, visited: result.records.length, unresolved: result.unresolved,
    evidenceManifest: reportPath, apply: false }, null, 2));
  if (result.unresolved.length) process.exitCode = 2;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
}
