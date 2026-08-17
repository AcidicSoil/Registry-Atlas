import type { Registry, RegistryItemSummary } from '../core/registry.schema';
import { escapeHtml } from '../ui/renderSafety';

type Variant = 'A' | 'B' | 'C';
type FacetKind = 'type' | 'category' | 'status' | null;

interface ItemRecord {
  id: string;
  registry: Registry;
  item: RegistryItemSummary;
  searchable: string;
}

interface PrototypeState {
  variant: Variant;
  query: string;
  facetKind: FacetKind;
  facetValue: string | null;
  selectedRegistry: string | null;
  selectedItemId: string | null;
  compare: string[];
  signal: string | null;
}

const VARIANTS: readonly { key: Variant; name: string }[] = [
  { key: 'A', name: 'Item Index' },
  { key: 'B', name: 'Registry Workbench' },
  { key: 'C', name: 'Signal Map' },
];

const STOPWORDS = new Set([
  'and', 'the', 'for', 'with', 'from', 'into', 'your', 'this', 'that', 'component', 'components',
  'registry', 'react', 'ui', 'built', 'using', 'based', 'ready', 'shadcn', 'tailwind', 'block', 'blocks',
  'app', 'apps', 'page', 'pages', 'custom', 'simple', 'modern', 'free', 'open', 'source', 'typescript',
]);

export function initAtlasRedesignPrototype(registries: readonly Registry[], initialVariant: Variant): void {
  const records = flattenItems(registries);
  const state: PrototypeState = {
    variant: initialVariant,
    query: '',
    facetKind: null,
    facetValue: null,
    selectedRegistry: firstRegistryWithItems(registries),
    selectedItemId: records[0]?.id ?? null,
    compare: [],
    signal: null,
  };

  installPrototypeStyles();
  render(false);

  document.addEventListener('click', event => {
    const target = event.target as HTMLElement;

    if (target.closest('[data-variant-prev]')) {
      cycleVariant(-1);
      return;
    }
    if (target.closest('[data-variant-next]')) {
      cycleVariant(1);
      return;
    }

    const facetButton = target.closest<HTMLElement>('[data-facet-kind]');
    if (facetButton) {
      const kind = facetButton.dataset.facetKind as FacetKind;
      const value = facetButton.dataset.facetValue ?? null;
      const alreadyActive = state.facetKind === kind && state.facetValue === value;
      state.facetKind = alreadyActive ? null : kind;
      state.facetValue = alreadyActive ? null : value;
      render(false);
      return;
    }

    const clearFacet = target.closest('[data-clear-facet]');
    if (clearFacet) {
      state.facetKind = null;
      state.facetValue = null;
      render(false);
      return;
    }

    const registryButton = target.closest<HTMLElement>('[data-registry-select]');
    if (registryButton) {
      state.selectedRegistry = registryButton.dataset.registrySelect ?? null;
      render(false);
      return;
    }

    const itemButton = target.closest<HTMLElement>('[data-item-select]');
    if (itemButton) {
      state.selectedItemId = itemButton.dataset.itemSelect ?? null;
      render(false);
      return;
    }

    const compareButton = target.closest<HTMLElement>('[data-compare-registry]');
    if (compareButton) {
      const name = compareButton.dataset.compareRegistry;
      if (!name) return;
      state.compare = state.compare.includes(name)
        ? state.compare.filter(item => item !== name)
        : [...state.compare, name].slice(-4);
      render(false);
      return;
    }

    const signalButton = target.closest<HTMLElement>('[data-signal]');
    if (signalButton) {
      const signal = signalButton.dataset.signal ?? null;
      state.signal = state.signal === signal ? null : signal;
      render(false);
      return;
    }

    if (target.closest('[data-clear-query]')) {
      state.query = '';
      state.signal = null;
      render(false);
    }
  });

  document.addEventListener('input', event => {
    const target = event.target as HTMLInputElement;
    if (target.id !== 'rap-query') return;
    state.query = target.value;
    render(true);
  });

  document.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    const target = event.target as HTMLElement | null;
    if (target && isEditable(target)) return;
    event.preventDefault();
    cycleVariant(event.key === 'ArrowLeft' ? -1 : 1);
  });

  function cycleVariant(delta: number): void {
    const current = VARIANTS.findIndex(variant => variant.key === state.variant);
    const next = (current + delta + VARIANTS.length) % VARIANTS.length;
    state.variant = VARIANTS[next].key;
    updateVariantUrl(state.variant);
    render(false);
  }

  function render(refocusQuery: boolean): void {
    const app = document.getElementById('app');
    if (!app) return;

    document.body.className = 'registry-atlas-prototype-body';
    const body = state.variant === 'A'
      ? renderVariantA(registries, records, state)
      : state.variant === 'B'
        ? renderVariantB(registries, records, state)
        : renderVariantC(registries, records, state);

    app.innerHTML = `
      <div class="rap-shell">
        <div class="rap-prototype-banner">PROTOTYPE — Three scalable directions for Registry Atlas, switchable via <code>?variant=</code> on the existing route.</div>
        ${body}
        ${renderStateInspector(registries, records, state)}
        ${import.meta.env.DEV ? renderSwitcher(state.variant) : ''}
      </div>
    `;

    if (refocusQuery) {
      const queryInput = document.getElementById('rap-query') as HTMLInputElement | null;
      queryInput?.focus();
      queryInput?.setSelectionRange(queryInput.value.length, queryInput.value.length);
    }
  }
}

function renderVariantA(registries: readonly Registry[], records: readonly ItemRecord[], state: PrototypeState): string {
  const filtered = filterRecords(records, state);
  const types = topCounts(records.map(record => record.item.type ?? 'unknown'), 8);
  const categories = topCounts(records.map(record => record.item.category ?? 'uncategorized'), 8);
  const statuses = topCounts(records.map(record => record.item.catalogStatus), 5);
  const selected = filtered.find(record => record.id === state.selectedItemId) ?? filtered[0] ?? records[0];
  const untagged = records.filter(record => !record.item.componentTagsExisting?.length && !record.item.componentTagsProposed?.length).length;

  return `
    <main class="rap-a">
      <header class="rap-a-header">
        <div class="rap-brand">Registry Atlas <span>A</span></div>
        <div class="rap-a-stats">
          <b>${registries.length}</b> registries
          <b>${records.length}</b> indexed items
          <b>${untagged}</b> taxonomy-free
        </div>
      </header>

      <section class="rap-search-stage">
        <input id="rap-query" class="rap-command-input" value="${escapeAttribute(state.query)}" placeholder="Search any item, registry, type, category, or description" autocomplete="off" />
        ${state.query ? '<button class="rap-clear" data-clear-query>Clear</button>' : ''}
      </section>

      <section class="rap-facet-strip">
        ${renderFacetGroup('type', types, state)}
        ${renderFacetGroup('category', categories, state)}
        ${renderFacetGroup('status', statuses, state)}
      </section>

      <section class="rap-index-layout">
        <div class="rap-index-list">
          <div class="rap-section-line"><b>${filtered.length}</b> matching items ${state.facetValue ? `<button data-clear-facet>× ${escapeHtml(state.facetValue)}</button>` : ''}</div>
          ${filtered.slice(0, 80).map(record => `
            <button class="rap-result-row ${selected?.id === record.id ? 'is-active' : ''}" data-item-select="${escapeAttribute(record.id)}">
              <span class="rap-result-name">${escapeHtml(record.item.title ?? record.item.name)}</span>
              <span class="rap-result-registry">${escapeHtml(record.registry.name)}</span>
              <span>${escapeHtml(record.item.type ?? 'unknown')}</span>
              <span>${escapeHtml(record.item.category ?? 'uncategorized')}</span>
              <span class="rap-status">${escapeHtml(record.item.catalogStatus)}</span>
            </button>
          `).join('') || '<div class="rap-empty">No item summaries match.</div>'}
        </div>
        <aside class="rap-detail-drawer">
          ${selected ? renderItemDetail(selected) : '<div class="rap-empty">No indexed item selected.</div>'}
        </aside>
      </section>
    </main>
  `;
}

function renderVariantB(registries: readonly Registry[], records: readonly ItemRecord[], state: PrototypeState): string {
  const filteredRegistries = registries.filter(registry => registryMatches(registry, state.query));
  const selectedRegistry = registries.find(registry => registry.name === state.selectedRegistry) ?? registries[0];
  const selectedRecords = selectedRegistry
    ? records.filter(record => record.registry.name === selectedRegistry.name && recordMatchesQuery(record, state.query))
    : [];
  const compared = state.compare.map(name => registries.find(registry => registry.name === name)).filter(Boolean) as Registry[];

  return `
    <main class="rap-b">
      <header class="rap-b-topbar">
        <div class="rap-brand">Registry Atlas <span>B</span></div>
        <input id="rap-query" class="rap-b-search" value="${escapeAttribute(state.query)}" placeholder="Filter workbench" autocomplete="off" />
        <div class="rap-b-count">${registries.length} sources · ${records.length} items</div>
      </header>

      <section class="rap-workbench">
        <aside class="rap-registry-rail">
          <div class="rap-pane-title">Sources</div>
          ${filteredRegistries.slice(0, 100).map(registry => {
            const count = registry.itemSummaries?.length ?? 0;
            return `
              <button class="rap-registry-row ${selectedRegistry?.name === registry.name ? 'is-active' : ''}" data-registry-select="${escapeAttribute(registry.name)}">
                <span>${escapeHtml(registry.name)}</span>
                <b>${count}</b>
              </button>
            `;
          }).join('')}
        </aside>

        <section class="rap-registry-canvas">
          ${selectedRegistry ? `
            <div class="rap-registry-head">
              <div>
                <div class="rap-kicker">${escapeHtml(selectedRegistry.atlas?.coverageStatus ?? 'unverified')}</div>
                <h1>${escapeHtml(selectedRegistry.name)}</h1>
              </div>
              <button class="rap-compare-button" data-compare-registry="${escapeAttribute(selectedRegistry.name)}">
                ${state.compare.includes(selectedRegistry.name) ? 'Remove compare' : 'Add compare'}
              </button>
            </div>
            <p class="rap-registry-description">${escapeHtml(selectedRegistry.description)}</p>
            <div class="rap-source-meta">
              <span>${escapeHtml(selectedRegistry.framework ?? 'framework unknown')}</span>
              <span>${escapeHtml(selectedRegistry.atlas?.catalogStatus ?? 'catalog unknown')}</span>
              <span>${selectedRegistry.itemSummaries?.length ?? 0} indexed items</span>
            </div>
            <div class="rap-item-table">
              ${selectedRecords.map(record => `
                <button class="rap-workbench-item" data-item-select="${escapeAttribute(record.id)}">
                  <b>${escapeHtml(record.item.title ?? record.item.name)}</b>
                  <span>${escapeHtml(record.item.type ?? 'unknown')}</span>
                  <span>${escapeHtml(record.item.category ?? 'uncategorized')}</span>
                  <span>${escapeHtml(record.item.catalogStatus)}</span>
                </button>
              `).join('') || '<div class="rap-empty">This registry has no mirrored item summaries yet. It remains browseable as a source instead of disappearing from the atlas.</div>'}
            </div>
          ` : '<div class="rap-empty">Select a registry.</div>'}
        </section>

        <aside class="rap-compare-tray">
          <div class="rap-pane-title">Compare tray <span>${compared.length}/4</span></div>
          ${compared.map(registry => `
            <div class="rap-compare-card">
              <div><b>${escapeHtml(registry.name)}</b><button data-compare-registry="${escapeAttribute(registry.name)}">×</button></div>
              <span>${registry.itemSummaries?.length ?? 0} items</span>
              <span>${escapeHtml(registry.atlas?.coverageStatus ?? 'unverified')}</span>
              <span>${escapeHtml((registry.primary_focus ?? []).join(', ') || 'no fixed focus')}</span>
            </div>
          `).join('') || '<div class="rap-empty">Add registries from the center pane.</div>'}
          <div class="rap-compare-summary">
            <b>Schema rule</b>
            <span>Registry membership is independent of Atlas taxonomy coverage.</span>
          </div>
        </aside>
      </section>
    </main>
  `;
}

function renderVariantC(registries: readonly Registry[], records: readonly ItemRecord[], state: PrototypeState): string {
  const signals = deriveSignals(records, 28);
  const signalFiltered = state.signal
    ? records.filter(record => record.searchable.includes(state.signal!))
    : filterRecords(records, state);
  const lanes = groupBy(signalFiltered, record => record.item.type ?? 'unknown');
  const laneEntries = [...lanes.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, 6);
  const unindexed = registries.filter(registry => !(registry.itemSummaries?.length)).length;
  const untagged = records.filter(record => !record.item.componentTagsExisting?.length && !record.item.componentTagsProposed?.length).length;

  return `
    <main class="rap-c">
      <header class="rap-c-header">
        <div class="rap-brand">Registry Atlas <span>C</span></div>
        <div class="rap-c-metrics">
          <div><b>${signals.length}</b><span>live signals</span></div>
          <div><b>${untagged}</b><span>taxonomy-free items</span></div>
          <div><b>${unindexed}</b><span>source-only registries</span></div>
        </div>
        <input id="rap-query" class="rap-c-search" value="${escapeAttribute(state.query)}" placeholder="Search the signal map" autocomplete="off" />
      </header>

      <section class="rap-signal-cloud">
        ${signals.map(signal => `
          <button class="rap-signal ${state.signal === signal.token ? 'is-active' : ''}" data-signal="${escapeAttribute(signal.token)}">
            ${escapeHtml(signal.token)} <b>${signal.count}</b>
          </button>
        `).join('')}
      </section>

      <section class="rap-map-meta">
        <span>${state.signal ? `Signal: <b>${escapeHtml(state.signal)}</b>` : 'All derived signals'}</span>
        <span>${signalFiltered.length} items in view</span>
      </section>

      <section class="rap-lanes">
        ${laneEntries.map(([type, laneRecords]) => `
          <article class="rap-lane">
            <header><b>${escapeHtml(type)}</b><span>${laneRecords.length}</span></header>
            <div class="rap-lane-stack">
              ${laneRecords.slice(0, 16).map(record => `
                <button class="rap-signal-card" data-item-select="${escapeAttribute(record.id)}">
                  <b>${escapeHtml(record.item.title ?? record.item.name)}</b>
                  <span>${escapeHtml(record.registry.name)}</span>
                  <em>${escapeHtml(record.item.category ?? 'uncategorized')}</em>
                </button>
              `).join('')}
            </div>
          </article>
        `).join('') || '<div class="rap-empty">No signals match.</div>'}
      </section>
    </main>
  `;
}

function renderFacetGroup(kind: Exclude<FacetKind, null>, entries: readonly [string, number][], state: PrototypeState): string {
  return `
    <div class="rap-facet-group">
      <b>${escapeHtml(kind)}</b>
      ${entries.map(([value, count]) => `
        <button class="${state.facetKind === kind && state.facetValue === value ? 'is-active' : ''}" data-facet-kind="${kind}" data-facet-value="${escapeAttribute(value)}">
          ${escapeHtml(value)} <span>${count}</span>
        </button>
      `).join('')}
    </div>
  `;
}

function renderItemDetail(record: ItemRecord): string {
  const tags = [...(record.item.componentTagsExisting ?? []), ...(record.item.componentTagsProposed ?? [])];
  return `
    <div class="rap-detail-kicker">${escapeHtml(record.registry.name)}</div>
    <h2>${escapeHtml(record.item.title ?? record.item.name)}</h2>
    <p>${escapeHtml(record.item.description ?? 'No item description in the mirror.')}</p>
    <dl>
      <div><dt>Type</dt><dd>${escapeHtml(record.item.type ?? 'unknown')}</dd></div>
      <div><dt>Category</dt><dd>${escapeHtml(record.item.category ?? 'uncategorized')}</dd></div>
      <div><dt>Catalog</dt><dd>${escapeHtml(record.item.catalogStatus)}</dd></div>
      <div><dt>Route</dt><dd>${record.item.routeEligible ? 'eligible' : 'not eligible'}</dd></div>
      <div><dt>Taxonomy</dt><dd>${tags.length ? escapeHtml(tags.join(', ')) : 'none required'}</dd></div>
    </dl>
    ${record.item.installCommand ? `<code class="rap-install-command">${escapeHtml(record.item.installCommand)}</code>` : ''}
  `;
}

function renderStateInspector(registries: readonly Registry[], records: readonly ItemRecord[], state: PrototypeState): string {
  const snapshot = {
    variant: state.variant,
    query: state.query,
    facet: state.facetKind && state.facetValue ? { kind: state.facetKind, value: state.facetValue } : null,
    selectedRegistry: state.selectedRegistry,
    selectedItemId: state.selectedItemId,
    compare: state.compare,
    signal: state.signal,
    data: {
      registries: registries.length,
      indexedItems: records.length,
      sourceOnlyRegistries: registries.filter(registry => !(registry.itemSummaries?.length)).length,
      taxonomyFreeItems: records.filter(record => !record.item.componentTagsExisting?.length && !record.item.componentTagsProposed?.length).length,
    },
  };

  return `
    <details class="rap-state-inspector">
      <summary>Prototype state</summary>
      <pre>${escapeHtml(JSON.stringify(snapshot, null, 2))}</pre>
    </details>
  `;
}

function renderSwitcher(current: Variant): string {
  const selected = VARIANTS.find(variant => variant.key === current) ?? VARIANTS[0];
  return `
    <nav class="rap-switcher" aria-label="Prototype variants">
      <button data-variant-prev aria-label="Previous variant">←</button>
      <span>${selected.key} — ${escapeHtml(selected.name)}</span>
      <button data-variant-next aria-label="Next variant">→</button>
    </nav>
  `;
}

function flattenItems(registries: readonly Registry[]): ItemRecord[] {
  return registries.flatMap(registry => (registry.itemSummaries ?? []).map(item => ({
    id: `${registry.name}/${item.slug}`,
    registry,
    item,
    searchable: normalize([
      registry.name,
      registry.description,
      item.name,
      item.title,
      item.description,
      item.slug,
      item.type,
      item.category,
      item.catalogStatus,
      ...(item.componentTagsExisting ?? []),
      ...(item.componentTagsProposed ?? []),
    ].filter(Boolean).join(' ')),
  })));
}

function filterRecords(records: readonly ItemRecord[], state: PrototypeState): ItemRecord[] {
  return records.filter(record => {
    if (!recordMatchesQuery(record, state.query)) return false;
    if (!state.facetKind || !state.facetValue) return true;
    if (state.facetKind === 'type') return (record.item.type ?? 'unknown') === state.facetValue;
    if (state.facetKind === 'category') return (record.item.category ?? 'uncategorized') === state.facetValue;
    return record.item.catalogStatus === state.facetValue;
  });
}

function recordMatchesQuery(record: ItemRecord, query: string): boolean {
  const normalized = normalize(query);
  if (!normalized) return true;
  return normalized.split(/\s+/).every(token => record.searchable.includes(token));
}

function registryMatches(registry: Registry, query: string): boolean {
  const normalized = normalize(query);
  if (!normalized) return true;
  const searchable = normalize([
    registry.name,
    registry.description,
    registry.framework,
    registry.license,
    ...(registry.primary_focus ?? []),
    ...(registry.component_tags ?? []),
  ].filter(Boolean).join(' '));
  return normalized.split(/\s+/).every(token => searchable.includes(token));
}

function deriveSignals(records: readonly ItemRecord[], limit: number): { token: string; count: number }[] {
  const counts = new Map<string, number>();

  for (const record of records) {
    const source = normalize([
      record.item.title,
      record.item.name,
      record.item.category,
      record.item.description,
    ].filter(Boolean).join(' '));
    const unique = new Set(source.split(/[^a-z0-9]+/).filter(token => token.length >= 3 && !STOPWORDS.has(token)));
    for (const token of unique) counts.set(token, (counts.get(token) ?? 0) + 1);
  }

  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, limit)
    .map(([token, count]) => ({ token, count }));
}

function groupBy<T>(items: readonly T[], keyFor: (item: T) => string): Map<string, T[]> {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const key = keyFor(item);
    const group = groups.get(key) ?? [];
    group.push(item);
    groups.set(key, group);
  }
  return groups;
}

function topCounts(values: readonly string[], limit: number): [string, number][] {
  const counts = new Map<string, number>();
  for (const value of values) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, limit);
}

function firstRegistryWithItems(registries: readonly Registry[]): string | null {
  return registries.find(registry => registry.itemSummaries?.length)?.name ?? registries[0]?.name ?? null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/[_/]+/g, ' ').replace(/-/g, ' ').replace(/\s+/g, ' ').trim();
}

function escapeAttribute(value: string): string {
  return escapeHtml(value).replace(/`/g, '&#96;');
}

function isEditable(target: HTMLElement): boolean {
  return target instanceof HTMLInputElement
    || target instanceof HTMLTextAreaElement
    || target.isContentEditable;
}

function updateVariantUrl(variant: Variant): void {
  const url = new URL(window.location.href);
  url.searchParams.set('variant', variant);
  window.history.replaceState({}, '', url);
}

function installPrototypeStyles(): void {
  if (document.getElementById('registry-atlas-prototype-styles')) return;
  const style = document.createElement('style');
  style.id = 'registry-atlas-prototype-styles';
  style.textContent = `
    :root { color-scheme: dark; font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    .registry-atlas-prototype-body { margin: 0; background: #090b10; color: #e8ebf2; min-width: 1100px; }
    .registry-atlas-prototype-body * { box-sizing: border-box; }
    .registry-atlas-prototype-body button, .registry-atlas-prototype-body input { font: inherit; }
    .registry-atlas-prototype-body button { color: inherit; }
    .rap-shell { min-height: 100vh; background: #090b10; }
    .rap-prototype-banner { height: 32px; display: flex; align-items: center; padding: 0 18px; border-bottom: 1px solid #272b35; background: #11141b; color: #8d95a8; font-size: 11px; letter-spacing: .02em; }
    .rap-prototype-banner code { margin: 0 4px; color: #c5ccdc; }
    .rap-brand { font-weight: 720; letter-spacing: -.04em; font-size: 18px; white-space: nowrap; }
    .rap-brand span { display: inline-grid; place-items: center; width: 24px; height: 24px; border: 1px solid #3b4150; border-radius: 7px; margin-left: 6px; font-size: 12px; color: #aab2c3; }
    .rap-empty { padding: 28px; color: #747e92; font-size: 13px; }

    .rap-a { min-height: calc(100vh - 32px); padding: 28px 34px 110px; background: radial-gradient(circle at 50% -20%, #18202f 0, #090b10 42%); }
    .rap-a-header { display: flex; align-items: center; justify-content: space-between; max-width: 1500px; margin: 0 auto 44px; }
    .rap-a-stats { display: flex; gap: 18px; color: #778196; font-size: 12px; }
    .rap-a-stats b { color: #dbe1ed; font-weight: 650; }
    .rap-search-stage { max-width: 980px; margin: 0 auto 24px; position: relative; }
    .rap-command-input { width: 100%; border: 1px solid #343b49; background: #11151d; color: #f5f7fb; padding: 22px 58px 22px 24px; border-radius: 16px; outline: none; font-size: 19px; box-shadow: 0 24px 70px rgba(0,0,0,.32); }
    .rap-command-input:focus { border-color: #6f7d96; }
    .rap-clear { position: absolute; right: 14px; top: 15px; border: 0; background: #252a35; border-radius: 8px; padding: 8px 10px; cursor: pointer; }
    .rap-facet-strip { max-width: 1500px; margin: 0 auto 22px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .rap-facet-group { border: 1px solid #232833; background: #0d1016; border-radius: 12px; padding: 10px; display: flex; gap: 6px; flex-wrap: wrap; align-content: flex-start; }
    .rap-facet-group > b { width: 100%; padding: 2px 3px 5px; color: #687187; text-transform: uppercase; font-size: 10px; letter-spacing: .12em; }
    .rap-facet-group button { border: 1px solid #2a303b; background: #151922; border-radius: 7px; padding: 5px 7px; font-size: 11px; cursor: pointer; color: #abb3c2; }
    .rap-facet-group button span { color: #5f6879; margin-left: 4px; }
    .rap-facet-group button.is-active { border-color: #8a96ad; color: #f1f4f9; background: #252c39; }
    .rap-index-layout { max-width: 1500px; margin: 0 auto; display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 12px; }
    .rap-index-list, .rap-detail-drawer { border: 1px solid #222731; background: #0d1016; border-radius: 14px; overflow: hidden; }
    .rap-section-line { height: 42px; padding: 0 13px; display: flex; align-items: center; gap: 8px; border-bottom: 1px solid #20252f; font-size: 11px; color: #737d91; }
    .rap-section-line button { margin-left: auto; border: 0; background: transparent; color: #a7afbd; cursor: pointer; }
    .rap-result-row { width: 100%; display: grid; grid-template-columns: 1.5fr 1fr .8fr 1fr .6fr; gap: 12px; align-items: center; padding: 10px 13px; border: 0; border-bottom: 1px solid #181d25; background: transparent; text-align: left; color: #828da2; font-size: 11px; cursor: pointer; }
    .rap-result-row:hover, .rap-result-row.is-active { background: #151a23; }
    .rap-result-row.is-active { box-shadow: inset 2px 0 0 #a8b7d0; }
    .rap-result-name { color: #e3e8f1; font-size: 12px; font-weight: 620; }
    .rap-result-registry { color: #aab2c1; }
    .rap-status { color: #747f92; }
    .rap-detail-drawer { padding: 22px; align-self: start; position: sticky; top: 18px; }
    .rap-detail-kicker, .rap-kicker { color: #7c879b; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; }
    .rap-detail-drawer h2 { margin: 8px 0 10px; font-size: 22px; letter-spacing: -.04em; }
    .rap-detail-drawer p { color: #8c95a7; font-size: 12px; line-height: 1.55; }
    .rap-detail-drawer dl { margin: 22px 0; display: grid; gap: 8px; }
    .rap-detail-drawer dl div { display: grid; grid-template-columns: 80px 1fr; gap: 10px; font-size: 11px; }
    .rap-detail-drawer dt { color: #636d7f; }
    .rap-detail-drawer dd { margin: 0; color: #c5cbd7; }
    .rap-install-command { display: block; padding: 10px; border-radius: 8px; background: #080a0e; color: #9aa6bb; white-space: normal; }

    .rap-b { min-height: calc(100vh - 32px); padding-bottom: 100px; background: #0a0c11; }
    .rap-b-topbar { height: 62px; display: grid; grid-template-columns: 260px minmax(360px, 620px) 1fr; align-items: center; gap: 24px; padding: 0 18px; border-bottom: 1px solid #252a34; background: #10131a; }
    .rap-b-search { width: 100%; border: 1px solid #303641; border-radius: 8px; background: #0b0e13; color: #eef1f6; padding: 10px 12px; outline: none; }
    .rap-b-count { justify-self: end; color: #6f788a; font-size: 11px; }
    .rap-workbench { display: grid; grid-template-columns: 260px minmax(620px, 1fr) 320px; min-height: calc(100vh - 94px); }
    .rap-registry-rail, .rap-compare-tray { background: #0c0f15; border-right: 1px solid #222730; padding: 14px; overflow: auto; max-height: calc(100vh - 94px); }
    .rap-compare-tray { border-right: 0; border-left: 1px solid #222730; }
    .rap-pane-title { display: flex; justify-content: space-between; align-items: center; padding: 4px 4px 12px; color: #777f91; font-size: 10px; text-transform: uppercase; letter-spacing: .12em; }
    .rap-registry-row { width: 100%; display: flex; justify-content: space-between; align-items: center; border: 0; background: transparent; color: #98a2b4; padding: 8px 9px; border-radius: 7px; cursor: pointer; text-align: left; font-size: 11px; }
    .rap-registry-row:hover, .rap-registry-row.is-active { background: #181d26; color: #edf1f7; }
    .rap-registry-row b { color: #606a7c; font-size: 10px; }
    .rap-registry-canvas { padding: 34px 42px; overflow: auto; max-height: calc(100vh - 94px); }
    .rap-registry-head { display: flex; justify-content: space-between; align-items: end; }
    .rap-registry-head h1 { margin: 6px 0 0; font-size: 34px; letter-spacing: -.05em; }
    .rap-compare-button { border: 1px solid #39404d; background: #181d26; border-radius: 8px; padding: 8px 11px; cursor: pointer; font-size: 11px; }
    .rap-registry-description { max-width: 820px; color: #8f98a9; line-height: 1.6; font-size: 13px; }
    .rap-source-meta { display: flex; gap: 8px; margin: 22px 0; }
    .rap-source-meta span { border: 1px solid #272d37; border-radius: 6px; padding: 5px 7px; color: #747e90; font-size: 10px; }
    .rap-item-table { border-top: 1px solid #252a33; }
    .rap-workbench-item { width: 100%; display: grid; grid-template-columns: 1.4fr .8fr 1fr .7fr; gap: 12px; border: 0; border-bottom: 1px solid #1b2028; background: transparent; padding: 12px 4px; text-align: left; color: #7d8798; font-size: 11px; cursor: pointer; }
    .rap-workbench-item b { color: #dfe4ed; }
    .rap-workbench-item:hover { background: #11151c; }
    .rap-compare-card { border: 1px solid #292f39; border-radius: 10px; padding: 12px; margin-bottom: 9px; display: grid; gap: 7px; color: #7d8798; font-size: 10px; }
    .rap-compare-card > div { display: flex; justify-content: space-between; color: #d9dee8; }
    .rap-compare-card button { border: 0; background: transparent; color: #7d8798; cursor: pointer; }
    .rap-compare-summary { margin-top: 20px; padding-top: 14px; border-top: 1px solid #252a33; display: grid; gap: 6px; font-size: 10px; color: #778194; }
    .rap-compare-summary b { color: #b9c0cc; }

    .rap-c { min-height: calc(100vh - 32px); padding: 24px 26px 120px; background: linear-gradient(180deg, #0f1218 0, #090b10 36%); }
    .rap-c-header { display: grid; grid-template-columns: 220px 1fr 380px; gap: 28px; align-items: center; margin-bottom: 24px; }
    .rap-c-metrics { display: flex; justify-content: center; gap: 30px; }
    .rap-c-metrics div { display: grid; gap: 2px; }
    .rap-c-metrics b { font-size: 18px; color: #eef2f7; }
    .rap-c-metrics span { color: #697286; font-size: 9px; text-transform: uppercase; letter-spacing: .1em; }
    .rap-c-search { width: 100%; border: 1px solid #313744; background: #0b0e13; border-radius: 8px; color: #e9edf4; padding: 10px 12px; outline: none; }
    .rap-signal-cloud { border: 1px solid #242a34; background: #0c0f15; border-radius: 14px; padding: 15px; display: flex; gap: 7px; flex-wrap: wrap; }
    .rap-signal { border: 1px solid #2b313c; background: #131820; border-radius: 999px; padding: 6px 9px; color: #a5aebe; font-size: 11px; cursor: pointer; }
    .rap-signal b { color: #5f6879; margin-left: 4px; }
    .rap-signal:hover, .rap-signal.is-active { border-color: #9aa6bb; color: #f0f3f8; background: #202733; }
    .rap-map-meta { display: flex; justify-content: space-between; color: #697387; font-size: 10px; padding: 18px 2px 9px; }
    .rap-lanes { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; align-items: start; }
    .rap-lane { border: 1px solid #232933; border-radius: 12px; background: #0c0f15; overflow: hidden; }
    .rap-lane > header { display: flex; justify-content: space-between; padding: 11px 12px; border-bottom: 1px solid #222832; font-size: 10px; text-transform: uppercase; letter-spacing: .08em; color: #98a2b3; }
    .rap-lane > header span { color: #5f6878; }
    .rap-lane-stack { padding: 7px; display: grid; gap: 5px; }
    .rap-signal-card { width: 100%; display: grid; grid-template-columns: 1fr auto; gap: 3px 10px; border: 0; border-radius: 7px; background: #11151c; padding: 9px 10px; text-align: left; cursor: pointer; }
    .rap-signal-card:hover { background: #181e27; }
    .rap-signal-card b { color: #dce2eb; font-size: 11px; font-weight: 620; }
    .rap-signal-card span { color: #6f798b; font-size: 9px; text-align: right; }
    .rap-signal-card em { grid-column: 1 / -1; color: #596376; font-size: 9px; font-style: normal; }

    .rap-state-inspector { position: fixed; right: 18px; bottom: 18px; width: 270px; z-index: 40; border: 1px solid #343a47; border-radius: 10px; background: rgba(13,16,22,.96); color: #8c96aa; font-size: 10px; box-shadow: 0 18px 50px rgba(0,0,0,.42); }
    .rap-state-inspector summary { cursor: pointer; padding: 9px 11px; color: #abb3c1; }
    .rap-state-inspector pre { max-height: 280px; overflow: auto; margin: 0; padding: 0 11px 11px; white-space: pre-wrap; }
    .rap-switcher { position: fixed; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 50; display: grid; grid-template-columns: 38px minmax(170px, auto) 38px; align-items: center; border: 1px solid #596174; background: #e9edf3; color: #0c0f14; border-radius: 999px; padding: 4px; box-shadow: 0 18px 45px rgba(0,0,0,.4); }
    .rap-switcher button { width: 34px; height: 34px; border: 0; border-radius: 999px; background: #cfd6e1; color: #11151b; cursor: pointer; }
    .rap-switcher span { padding: 0 13px; text-align: center; font-size: 11px; font-weight: 700; }
  `;
  document.head.append(style);
}
