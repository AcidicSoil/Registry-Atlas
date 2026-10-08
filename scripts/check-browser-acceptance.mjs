import { spawnSync } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { openAtlasCoreDatabase, readAtlasState } from './lib/atlas-storage.mjs';

const server = process.env.PINCHTAB_SERVER;
const tab = process.env.PINCHTAB_TAB;
const baseUrl = (process.env.REGISTRY_ATLAS_URL ?? 'http://127.0.0.1:5189/Registry-Atlas').replace(/\/$/, '');
const outputDir = process.env.REGISTRY_ATLAS_ACCEPTANCE_DIR
  ?? path.join('/tmp', `registry-atlas-acceptance-${new Date().toISOString().replace(/[:.]/g, '-')}`);

if (!server || !tab) {
  console.error('PINCHTAB_SERVER and PINCHTAB_TAB are required.');
  process.exit(2);
}

const database = openAtlasCoreDatabase(process.cwd(), { readOnly: true });
const atlasState = readAtlasState(database);
database.close();
const catalog = atlasState.catalog;
const kindDefaults = atlasState.kindOverrides?.registryDefaults ?? {};
const entries = Object.entries(catalog.registries);
const flat = entries.flatMap(([namespace, items]) =>
  items.map(item => ({ namespace, ...item, assetKind: assetKind(item, namespace) })));

function assetKind(item, namespace) {
  const categories = (item.categories ?? []).map(value => String(value).trim().toLowerCase());
  if (categories.some(value => value === 'template' || value === 'templates')) return 'template';
  if (item.kind) return item.kind;
  if (kindDefaults[namespace]) return kindDefaults[namespace];
  if (item.type === 'registry:icon'
    || categories.some(value => ['icon', 'icons', 'icon-stack', 'morph-icon'].includes(value))) {
    return 'icon';
  }
  if (item.type === 'registry:block') return 'block';
  if (item.type === 'registry:page') return 'page';
  if (item.type === 'registry:style' || item.type === 'registry:theme') return 'theme';
  if (['registry:component', 'registry:ui', 'registry:item'].includes(item.type)) return 'component';
  return 'other';
}

const simple = flat.find(item => item.name === 'button' && item.assetKind === 'component')
  ?? flat.find(item => item.assetKind === 'component');
const nested = flat.find(item => item.assetKind === 'component' && item.name.includes('/'));
const block = flat.find(item => item.assetKind === 'block');
const page = flat.find(item => item.assetKind === 'page');
const template = flat.find(item => item.assetKind === 'template');
const theme = flat.find(item => item.assetKind === 'theme');
const icon = flat.find(item => item.assetKind === 'icon');
const largeRegistry = entries
  .map(([namespace, items]) => ({ namespace, count: items.length }))
  .sort((a, b) => b.count - a.count)[0];
const comparisonRegistry = entries.find(([namespace]) => namespace !== largeRegistry?.namespace)?.[0];

for (const [label, value] of Object.entries({
  simple, nested, block, page, template, theme, icon, largeRegistry, comparisonRegistry,
})) {
  if (!value) {
    console.error(`Unable to derive real acceptance identity: ${label}`);
    process.exit(2);
  }
}

const nsPath = namespace => namespace;
const itemPath = item => item.name.split('/').map(encodeURIComponent).join('/');

const routes = [
  { name: 'home', path: '/' },
  { name: 'components', path: '/components', requireItems: true },
  { name: 'components-search-button', path: '/components/s/button', requireItems: true },
  { name: 'blocks', path: '/blocks', requireItems: true },
  { name: 'pages', path: '/pages', requireItems: true },
  { name: 'explore-forms', path: '/components/explore/forms', requireItems: true },
  { name: 'authors-attribution', path: '/authors', expectAuthors: true },
  { name: 'retired-newest', path: '/components/newest', expectUnavailable: true },
  { name: 'retired-reviewed', path: '/components/featured', expectUnavailable: true },
  {
    name: 'registries-filtered',
    path: '/registries?asset=template&registrySort=item-count-desc',
  },
  { name: 'registry-large', path: `/${nsPath(largeRegistry.namespace)}`, requireItems: true },
  {
    name: 'component-simple',
    path: `/${nsPath(simple.namespace)}/components/${itemPath(simple)}`,
  },
  {
    name: 'component-nested',
    path: `/${nsPath(nested.namespace)}/components/${itemPath(nested)}`,
  },
  {
    name: 'block-detail',
    path: `/${nsPath(block.namespace)}/blocks/${itemPath(block)}`,
  },
  {
    name: 'page-detail',
    path: `/${nsPath(page.namespace)}/pages/${itemPath(page)}`,
  },
  { name: 'templates', path: '/templates', requireItems: true },
  {
    name: 'template-detail',
    path: `/${nsPath(template.namespace)}/templates/${itemPath(template)}`,
  },
  { name: 'themes', path: '/themes', requireItems: true },
  { name: 'theme-editor', path: '/themes/editor', expectUnavailable: true },
  {
    name: 'theme-detail',
    path: `/${nsPath(theme.namespace)}/themes/${itemPath(theme)}`,
  },
  { name: 'icons', path: '/icons', requireItems: true },
  { name: 'icon-family', path: `/icons/${icon.namespace.slice(1)}` },
  { name: 'icon-category', path: '/icons/c/icons' },
  {
    name: 'compare',
    path: `/compare?compareRegistry=${encodeURIComponent(largeRegistry.namespace)}&compareRegistry=${encodeURIComponent(comparisonRegistry)}`,
  },
];

const viewports = [
  { name: 'desktop', width: 1920, height: 1080, mobile: false },
  { name: 'mobile', width: 390, height: 844, mobile: true },
];

mkdirSync(outputDir, { recursive: true });
const results = [];
const failures = [];

function run(args, { allowFailure = false } = {}) {
  const result = spawnSync('pinchtab', ['--server', server, ...args], {
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
  });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`pinchtab ${args.join(' ')} failed: ${result.stderr || result.stdout}`);
  }
  return {
    status: result.status ?? 1,
    stdout: (result.stdout ?? '').trim(),
    stderr: (result.stderr ?? '').trim(),
  };
}

function pageState() {
  const expression = `(() => {
    const visible = element => Boolean(
      element.offsetWidth || element.offsetHeight || element.getClientRects().length
    );
    const accessibleName = element =>
      (element.getAttribute('aria-label')
        || element.getAttribute('aria-labelledby')
        || element.getAttribute('title')
        || element.textContent
        || '').trim();
    const fields = [...document.querySelectorAll('input, select, textarea')].filter(visible);
    const buttons = [...document.querySelectorAll('button')].filter(visible);
    const links = [...document.querySelectorAll('a[href]')].filter(visible);
    const images = [...document.querySelectorAll('img')].filter(visible);
    const ids = [...document.querySelectorAll('[id]')].map(element => element.id).filter(Boolean);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
    return JSON.stringify({
      pathname: location.pathname,
      search: location.search,
      width: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      overflow: document.documentElement.scrollWidth > innerWidth,
      heading: document.querySelector('h1')?.textContent?.trim() ?? '',
      h1Count: document.querySelectorAll('h1').length,
      evidenceUnavailable: Boolean(document.querySelector('.evidence-unavailable')),
      visibleCatalogItems: document.querySelectorAll('[data-view-item-registry]').length,
      attributedAuthors: document.querySelectorAll('[data-author-select]').length,
      unlabeledButtons: buttons.filter(element => !accessibleName(element)).length,
      unlabeledLinks: links.filter(element => !accessibleName(element)).length,
      unlabeledFields: fields.filter(element =>
        !element.closest('label')
        && !element.getAttribute('aria-label')
        && !element.getAttribute('aria-labelledby')
      ).length,
      imagesMissingAlt: images.filter(element => !element.hasAttribute('alt')).length,
      duplicateIdCount: new Set(duplicateIds).size
    });
  })()`;
  const raw = run(['eval', '--tab', tab, expression]).stdout;
  return JSON.parse(raw);
}

function expectedPathname(routePath) {
  const url = new URL(baseUrl + (routePath === '/' ? '/' : routePath));
  return url.pathname;
}

function mobileSidebarFocusState() {
  const openResult = JSON.parse(run(['eval', '--tab', tab, `(() => {
    const sidebar = document.querySelector('#appSidebar');
    const toggle = document.querySelector('#sidebarToggle');
    const close = document.querySelector('#sidebarClose');
    if (!(sidebar instanceof HTMLElement) || !(toggle instanceof HTMLButtonElement) || !(close instanceof HTMLButtonElement)) {
      return JSON.stringify({ available: false });
    }
    sidebar.dataset.open = 'false';
    toggle.setAttribute('aria-expanded', 'false');
    toggle.focus();
    toggle.click();
    return JSON.stringify({ available: true });
  })()`]).stdout);
  if (!openResult.available) return openResult;

  const opened = JSON.parse(run(['eval', '--tab', tab, `JSON.stringify({
    open: document.querySelector('#appSidebar')?.getAttribute('data-open') === 'true',
    expanded: document.querySelector('#sidebarToggle')?.getAttribute('aria-expanded') === 'true',
    focusMovedInside: document.activeElement?.id === 'sidebarClose'
  })`]).stdout);
  run(['eval', '--tab', tab, `document.querySelector('#sidebarClose')?.click(); 'clicked'`]);
  const closed = JSON.parse(run(['eval', '--tab', tab, `JSON.stringify({
    closed: document.querySelector('#appSidebar')?.getAttribute('data-open') === 'false',
    collapsed: document.querySelector('#sidebarToggle')?.getAttribute('aria-expanded') === 'false',
    focusReturned: document.activeElement?.id === 'sidebarToggle'
  })`]).stdout);

  return {
    available: true,
    opened: opened.open && opened.expanded,
    focusMovedInside: opened.focusMovedInside,
    closed: closed.closed && closed.collapsed,
    focusReturned: closed.focusReturned,
  };
}

function readNetwork5xx() {
  const raw = run([
    'network', '--tab', tab, '--status', '5xx', '--limit', '100', '--json',
  ]).stdout;
  const parsed = JSON.parse(raw || '{"count":0,"entries":[]}');
  return Array.isArray(parsed.entries) ? parsed.entries : [];
}

function networkEntryKey(entry) {
  return String(entry?.requestId ?? entry?.id ?? JSON.stringify(entry));
}

function capturePairedScreenshot(screenshot, expectedUrl) {
  const args = ['capture', '--tab', tab, '--require-pair',
    '--beyond-viewport', '--format', 'png', '--output', screenshot];
  for (let attempt = 0; attempt < 3; attempt++) {
    const capture = run(args, { allowFailure: true });
    if (capture.status === 0) return;
    const error = capture.stderr || capture.stdout;
    if (!/pairing broken: navigation observed during capture window/.test(error)
      || run(['url', '--tab', tab]).stdout !== expectedUrl) {
      throw new Error('Paired capture failed: ' + error);
    }
    // The page moved during capture. Reobserve the current page and retry
    // a bounded number of times without accepting an unpaired screenshot.
    run(['snap', '--tab', tab, '--max-tokens', '300']);
  }
  throw new Error('Could not obtain a stable paired screenshot after 3 attempts');
}

for (const viewport of viewports) {
  const viewportArgs = ['set', 'viewport', String(viewport.width), String(viewport.height), '--tab', tab];
  if (viewport.mobile) viewportArgs.push('--mobile');
  run(viewportArgs);

  for (const route of routes) {
    run(['errors', '--tab', tab, '--clear']);
    run(['console', '--tab', tab, '--clear']);
    const networkBefore = new Set(readNetwork5xx().map(networkEntryKey));

    const url = baseUrl + (route.path === '/' ? '/' : route.path);
    run(['nav', url, '--tab', tab, '--timeout', '30']);

    const screenshot = path.join(outputDir, `${viewport.name}-${route.name}.png`);
    capturePairedScreenshot(screenshot, url);

    const state = pageState();
    const errors = run(['errors', '--tab', tab, '--limit', '50']).stdout;
    const consoleOutput = run(['console', '--tab', tab, '--limit', '100']).stdout;
    const networkEntries = readNetwork5xx();
    const newNetwork5xx = networkEntries.filter(entry => !networkBefore.has(networkEntryKey(entry)));

    const routeFailures = [];
    if (state.pathname !== expectedPathname(route.path)) {
      routeFailures.push(`pathname ${state.pathname} != ${expectedPathname(route.path)}`);
    }
    if (state.overflow) routeFailures.push(`horizontal overflow ${state.scrollWidth} > ${state.width}`);
    if (errors !== 'No errors') routeFailures.push(`browser errors: ${errors}`);
    if (newNetwork5xx.length > 0) routeFailures.push('unexpected 5xx network response');
    if (/\[ERROR\]/.test(consoleOutput)) routeFailures.push('console contains ERROR');
    if (route.expectUnavailable && !state.evidenceUnavailable) {
      routeFailures.push('expected evidence-unavailable state was not rendered');
    }
    if (!route.expectUnavailable && state.evidenceUnavailable) {
      routeFailures.push('unexpected evidence-unavailable state');
    }
    if (route.requireItems && state.visibleCatalogItems === 0) {
      routeFailures.push('expected exact catalog items but none were rendered');
    }
    if (route.expectAuthors && (state.heading !== 'Authors' || state.attributedAuthors === 0)) {
      routeFailures.push('expected source-backed author directory but none was rendered');
    }
    if (!state.heading) routeFailures.push('missing h1');
    if (state.h1Count !== 1) routeFailures.push(`expected one h1, found ${state.h1Count}`);
    if (state.unlabeledButtons > 0) routeFailures.push(`${state.unlabeledButtons} visible button(s) lack an accessible name`);
    if (state.unlabeledLinks > 0) routeFailures.push(`${state.unlabeledLinks} visible link(s) lack an accessible name`);
    if (state.unlabeledFields > 0) routeFailures.push(`${state.unlabeledFields} visible form field(s) lack a label`);
    if (state.imagesMissingAlt > 0) routeFailures.push(`${state.imagesMissingAlt} visible image(s) lack alt text`);
    if (state.duplicateIdCount > 0) routeFailures.push(`${state.duplicateIdCount} duplicate DOM id(s)`);
    if (viewport.mobile && route.name === 'components') {
      const sidebarFocus = mobileSidebarFocusState();
      if (!sidebarFocus.available) routeFailures.push('mobile sidebar is unavailable');
      if (sidebarFocus.available && !sidebarFocus.opened) routeFailures.push('mobile sidebar did not open');
      if (sidebarFocus.available && !sidebarFocus.focusMovedInside) routeFailures.push('mobile sidebar did not move focus to Close');
      if (sidebarFocus.available && !sidebarFocus.closed) routeFailures.push('mobile sidebar did not close');
      if (sidebarFocus.available && !sidebarFocus.focusReturned) routeFailures.push('mobile sidebar did not return focus to the menu button');
    }

    const record = {
      viewport: viewport.name,
      route: route.name,
      requested: route.path,
      screenshot,
      state,
      errorCount: errors === 'No errors' ? 0 : errors.split('\n').length,
      network5xxCount: newNetwork5xx.length,
      failures: routeFailures,
    };
    results.push(record);
    for (const failure of routeFailures) {
      failures.push(`${viewport.name}/${route.name}: ${failure}`);
    }
  }
}

const report = {
  schemaVersion: 'registry-atlas-browser-acceptance/v1',
  generatedAt: new Date().toISOString(),
  server,
  tab,
  baseUrl,
  outputDir,
  identities: {
    simple, nested, block, page, template, theme, icon, largeRegistry, comparisonRegistry,
  },
  resultCount: results.length,
  failureCount: failures.length,
  failures,
  results,
};
const reportPath = path.join(outputDir, 'report.json');
writeFileSync(reportPath, JSON.stringify(report, null, 2) + '\n');

if (failures.length) {
  console.error(`Registry Atlas browser acceptance failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  console.error(`Report: ${reportPath}`);
  process.exit(1);
}

console.log(`Registry Atlas browser acceptance passed: ${results.length} route/viewport checks.`);
console.log(`Evidence: ${outputDir}`);
