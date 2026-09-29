import { spawnSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const server = process.env.PINCHTAB_SERVER;
const tab = process.env.PINCHTAB_TAB;
const baseUrl = (process.env.REGISTRY_ATLAS_URL ?? 'http://127.0.0.1:5189/Registry-Atlas').replace(/\/$/, '');
const outputDir = process.env.REGISTRY_ATLAS_ACCEPTANCE_DIR
  ?? path.join('/tmp', `registry-atlas-acceptance-${new Date().toISOString().replace(/[:.]/g, '-')}`);

if (!server || !tab) {
  console.error('PINCHTAB_SERVER and PINCHTAB_TAB are required.');
  process.exit(2);
}

const catalog = JSON.parse(readFileSync('public/data/registry-catalog-items.json', 'utf8'));
const entries = Object.entries(catalog.registries);
const flat = entries.flatMap(([namespace, items]) =>
  items.map(item => ({ namespace, ...item })));

const componentTypes = new Set(['registry:block', 'registry:component', 'registry:ui', 'registry:item']);
const simple = flat.find(item => item.name === 'button' && componentTypes.has(item.type))
  ?? flat.find(item => componentTypes.has(item.type));
const nested = flat.find(item => componentTypes.has(item.type) && item.name.includes('/'));
const template = flat.find(item => item.type === 'registry:page');
const theme = flat.find(item => item.type === 'registry:style' || item.type === 'registry:theme');
const icon = flat.find(item =>
  item.type === 'registry:icon'
  || (item.categories ?? []).some(category => ['icon', 'icons', 'icon-stack', 'morph-icon'].includes(String(category).toLowerCase())));
const largeRegistry = entries
  .map(([namespace, items]) => ({ namespace, count: items.length }))
  .sort((a, b) => b.count - a.count)[0];
const comparisonRegistry = entries.find(([namespace]) => namespace !== largeRegistry?.namespace)?.[0];

for (const [label, value] of Object.entries({ simple, nested, template, theme, icon, largeRegistry, comparisonRegistry })) {
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
  { name: 'components-featured', path: '/components/featured', requireItems: true },
  { name: 'components-newest', path: '/components/newest', expectUnavailable: true },
  { name: 'components-search-button', path: '/components/s/button', requireItems: true },
  { name: 'explore-forms', path: '/components/explore/forms', requireItems: true },
  { name: 'authors', path: '/authors', expectUnavailable: true },
  {
    name: 'registries-filtered',
    path: '/registries?q=registry&coverage=current&registrySort=item-count-desc',
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
  { name: 'desktop', width: 1440, height: 1000, mobile: false },
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
    run([
      'capture',
      '--tab', tab,
      '--require-pair',
      '--beyond-viewport',
      '--format', 'png',
      '--output', screenshot,
    ]);

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
    if (!state.heading) routeFailures.push('missing h1');
    if (state.h1Count !== 1) routeFailures.push(`expected one h1, found ${state.h1Count}`);
    if (state.unlabeledButtons > 0) routeFailures.push(`${state.unlabeledButtons} visible button(s) lack an accessible name`);
    if (state.unlabeledLinks > 0) routeFailures.push(`${state.unlabeledLinks} visible link(s) lack an accessible name`);
    if (state.unlabeledFields > 0) routeFailures.push(`${state.unlabeledFields} visible form field(s) lack a label`);
    if (state.imagesMissingAlt > 0) routeFailures.push(`${state.imagesMissingAlt} visible image(s) lack alt text`);
    if (state.duplicateIdCount > 0) routeFailures.push(`${state.duplicateIdCount} duplicate DOM id(s)`);

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
  identities: { simple, nested, template, theme, icon, largeRegistry, comparisonRegistry },
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
