import type {
  InstallQueueEntry,
  Registry,
  RegistryCatalogIndex,
} from '../core/registry.schema';
import type { MirrorValidationIssue } from '../core/registryMirror';
import type { RegistryMirrorMeta } from '../data/loadRegistries';
import { parseRegistryExplorerUrlState } from '../core/urlState';
import {
  resolveRegistryItemDetailFromCatalogIndex,
  type RegistryItemDetailResult,
} from '../core/registryItemDetail';
import { loadRegistryItemDetailFromCatalogIndex } from '../data/loadRegistryItemDetail';
import {
  addToInstallQueue,
  buildInstallQueueBatchState,
  clearInstallQueue,
  removeFromInstallQueue,
} from '../core/installQueue';
import type { CopyFeedback } from './discoveryView';
import { renderItemDetailView } from './itemDetailView';
import { escapeHtml } from './renderSafety';
import { buildCatalogFacetSummary, queryCatalogComponents } from '../core/catalogQuery';
import { buildRegistryDirectory } from '../core/registryDirectory';
import { buildCatalogComparison } from '../core/catalogCompare';
import {
  catalogRoutePath,
  parseCatalogBrowseQuery,
  parseCatalogRoute,
  serializeCatalogBrowseQuery,
  type CatalogBrowseQueryState,
  type CatalogReviewedFilter,
  type CatalogRoute,
  type CatalogSort,
} from '../core/catalogRoutes';
import { renderCatalogComponents } from './catalogComponentsView';
import { renderRegistryDirectory } from './registryDirectoryView';
import { renderRegistryCollection } from './registryCollectionView';
import { renderCatalogCompare } from './catalogCompareView';

export interface ShellOptions {
  registries: readonly Registry[];
  catalogIndex: RegistryCatalogIndex;
  mirrorMeta: RegistryMirrorMeta;
  mirrorWarnings: readonly MirrorValidationIssue[];
  fetchImpl?: typeof fetch;
  roots: {
    aside: HTMLElement;
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>;
    searchInput: HTMLInputElement;
  };
}
interface AppState {
  currentView: 'discover' | 'registries' | 'compare' | 'item';
  returnView: 'discover' | 'registries';
  returnRegistryName: string | null;
  compareRegistryNames: string[];
  selectedProfileRegistryName: string | null;
  selectedItemSlug: string | null;
  searchTerm: string;
  installQueue: InstallQueueEntry[];
  copyFeedback: CopyFeedback | null;
  facetSearchTerms: Record<string, string>;
  discoveryPage: number;
  catalogSort: CatalogSort;
  catalogRegistryNames: string[];
  catalogItemTypes: string[];
  catalogCategories: string[];
  catalogReviewed: CatalogReviewedFilter;
}
interface FocusIdentity {
  selector: string;
  attributes: ReadonlyArray<readonly [string, string]>;
}
function catalogBasePath(): string {
  const configured = import.meta.env.BASE_URL;
  if (configured && configured !== '/') return configured;
  return window.location.pathname === '/Registry-Atlas'
    || window.location.pathname.startsWith('/Registry-Atlas/')
    ? '/Registry-Atlas/'
    : (configured || '/');
}

function isView(value: string | null): value is AppState['currentView'] {
  return (
    value === 'discover' ||
    value === 'registries' ||
    value === 'compare' ||
    value === 'item'
  );
}

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, catalogIndex, roots } = options;
  const fetchImpl = options.fetchImpl ?? fetch;
  const itemDetailCache = new Map<string, RegistryItemDetailResult>();
  const itemDetailLoading = new Set<string>();
  const parsed = hydrateStateFromUrl(registries);
  let state: AppState = {
    ...parsed,
    returnView: parsed.currentView === 'registries' ? 'registries' : 'discover',
    returnRegistryName: null,
    installQueue: [],
    copyFeedback: null,
    facetSearchTerms: {},
  };
  roots.searchInput.value = state.searchTerm;
  const setState = (
    partial: Partial<AppState>,
    historyMode: 'push' | 'replace' = 'replace',
    focusIdentity: FocusIdentity | null = null,
  ) => {
    const routeContextChanged =
      (partial.currentView !== undefined && partial.currentView !== state.currentView)
      || (partial.selectedProfileRegistryName !== undefined && partial.selectedProfileRegistryName !== state.selectedProfileRegistryName)
      || (partial.selectedItemSlug !== undefined && partial.selectedItemSlug !== state.selectedItemSlug);
    state = { ...state, ...partial };
    if (routeContextChanged && partial.copyFeedback === undefined) state.copyFeedback = null;
    syncUrlState(state, historyMode);
    render();
    if (focusIdentity) restoreControlFocus(focusIdentity);
  };

  function searchTermsFor(scope: 'discover' | 'registries' | 'compare'): Record<string, string> {
    const prefix = `${scope}:`;
    return Object.fromEntries(
      Object.entries(state.facetSearchTerms)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => [key.slice(prefix.length), value]),
    );
  }

  function catalogBrowseState(includeRegistry = true): CatalogBrowseQueryState {
    return {
      page: state.discoveryPage,
      sort: state.catalogSort,
      registryNames: includeRegistry ? state.catalogRegistryNames : [],
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      reviewed: state.catalogReviewed,
    };
  }

  async function ensureItemDetailLoaded(
    key: string,
    namespace: string | null,
    slug: string | null,
  ): Promise<void> {
    if (itemDetailLoading.has(key)) return;
    itemDetailLoading.add(key);
    try {
      const result = await loadRegistryItemDetailFromCatalogIndex(
        registries,
        catalogIndex,
        namespace,
        slug,
        fetchImpl,
      );
      itemDetailCache.set(key, result);
    } finally {
      itemDetailLoading.delete(key);
    }

    if (
      state.currentView === 'item'
      && itemDetailKey(state.selectedProfileRegistryName, state.selectedItemSlug) === key
    ) {
      render();
    }
  }

  function restoreControlFocus(identity: FocusIdentity): void {
    const candidates = Array.from(
      roots.contentBody.querySelectorAll<HTMLElement>(identity.selector),
    );
    const equivalent = candidates.find(candidate =>
      identity.attributes.every(([name, value]) => candidate.getAttribute(name) === value),
    );
    const fallback = equivalent ?? candidates[0];
    fallback?.focus();
  }

  function renderCatalogSidebar(
    queued: ReadonlySet<string>,
    batchCommand: string | null,
  ): void {
    const queueMarkup = queued.size > 0
      ? '<section class="catalog-sidebar-queue"><div class="queue-heading"><span>Install queue</span><strong>'
        + String(queued.size)
        + '</strong></div><button class="install-button install-button-primary" type="button" data-copy-text="'
        + escapeHtml(batchCommand ?? '')
        + '" data-copy-label="Batch command copied"'
        + (batchCommand ? '' : ' disabled')
        + '>Copy batch</button><button class="install-button" type="button" data-queue-clear>Clear</button></section>'
      : '';

    roots.aside.innerHTML = [
      '<div class="catalog-sidebar-summary">',
      '<div class="aside-section-title">Catalog</div>',
      '<div class="aside-summary"><strong>',
      options.catalogIndex.meta.item_count.toLocaleString(),
      '</strong> indexed components<br><strong>',
      options.catalogIndex.meta.registry_count.toLocaleString(),
      '</strong> indexed catalogs<br><strong>',
      registries.length.toLocaleString(),
      '</strong> registries</div>',
      '</div>',
      queueMarkup,
    ].join('');
  }

  function render(): void {
    try {
      roots.tabs.forEach((tab) => {
        const tabView = tab.getAttribute('data-view');
        const activeView = state.currentView === 'item'
          ? null
          : state.selectedProfileRegistryName
            ? 'registries'
            : state.currentView;
        tab.classList.toggle('nav-item-active', tabView === activeView);
        if (tabView === activeView) tab.setAttribute('aria-current', 'page');
        else tab.removeAttribute('aria-current');
      });

      const queued = new Set(state.installQueue.map((entry) => entry.token));
      const batch = buildInstallQueueBatchState(state.installQueue);
      renderCatalogSidebar(queued, batch.command);

      if (state.currentView === 'item') {
        const namespace = state.selectedProfileRegistryName;
        const slug = state.selectedItemSlug;
        const key = itemDetailKey(namespace, slug);
        const summaryResult = resolveRegistryItemDetailFromCatalogIndex(
          registries,
          catalogIndex,
          namespace,
          slug,
        );
        renderItemDetailView(
          roots.contentHeader,
          roots.contentBody,
          key ? itemDetailCache.get(key) ?? summaryResult : summaryResult,
          queued,
        );
        if (
          key
          && !itemDetailCache.has(key)
          && summaryResult.status === 'summary-only'
          && summaryResult.detail.route.status === 'available'
        ) {
          void ensureItemDetailLoaded(key, namespace, slug);
        }
      } else if (state.currentView !== 'compare' && state.selectedProfileRegistryName) {
        const registry = registries.find(item => item.name === state.selectedProfileRegistryName);
        if (!registry) return;
        const result = queryCatalogComponents(registries, catalogIndex, {
          search: state.searchTerm,
          registryNames: [registry.name],
          itemTypes: state.catalogItemTypes,
          categories: state.catalogCategories,
          reviewed: state.catalogReviewed,
          sort: state.catalogSort,
          page: state.discoveryPage,
          basePath: catalogBasePath(),
        });
        const facets = buildCatalogFacetSummary(registries, catalogIndex, {
          search: state.searchTerm,
          registryNames: [registry.name],
        });
        renderRegistryCollection(roots.contentHeader, roots.contentBody, registry, result, {
          facets,
          browseState: catalogBrowseState(false),
        });
      } else if (state.currentView === 'discover') {
        const result = queryCatalogComponents(registries, catalogIndex, {
          search: state.searchTerm,
          registryNames: state.catalogRegistryNames,
          itemTypes: state.catalogItemTypes,
          categories: state.catalogCategories,
          reviewed: state.catalogReviewed,
          sort: state.catalogSort,
          page: state.discoveryPage,
          basePath: catalogBasePath(),
        });
        const facets = buildCatalogFacetSummary(registries, catalogIndex, {
          search: state.searchTerm,
        });
        renderCatalogComponents(roots.contentHeader, roots.contentBody, result, {
          searchTerm: state.searchTerm,
          facets,
          browseState: catalogBrowseState(),
          includeRegistryFilter: true,
        });
      } else if (state.currentView === 'registries') {
        const result = buildRegistryDirectory(registries, catalogIndex, {
          search: state.searchTerm,
          page: state.discoveryPage,
        });
        renderRegistryDirectory(roots.contentHeader, roots.contentBody, result);
      } else {
        const compareSearchTerms = searchTermsFor('compare');
        const availableRegistryNames = registries
          .filter(registry => Object.prototype.hasOwnProperty.call(catalogIndex.registries, registry.name))
          .map(registry => registry.name)
          .sort((a, b) => a.localeCompare(b));
        const result = buildCatalogComparison(
          registries,
          catalogIndex,
          state.compareRegistryNames,
          {
            search: state.searchTerm,
            page: state.discoveryPage,
            basePath: catalogBasePath(),
          },
        );
        renderCatalogCompare(
          roots.contentHeader,
          roots.contentBody,
          result,
          availableRegistryNames,
          compareSearchTerms.registry ?? '',
        );
      }

      roots.contentHeader.insertAdjacentHTML('beforeend', renderCopyFeedback(state.copyFeedback));
    } catch (error) {
      console.error('Registry Explorer: Render failed', error);
      roots.contentBody.innerHTML =
        '<div class="empty-state">Something went wrong while rendering this view.</div>';
    }
  }
  roots.tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      if (isView(view) && view !== 'item') {
        setState({
          currentView: view,
          selectedProfileRegistryName: null,
          selectedItemSlug: null,
          returnRegistryName: null,
          returnView: view === 'registries' ? 'registries' : 'discover',
          discoveryPage: 1,
        }, 'push');
      }
    }),
  );
  roots.searchInput.addEventListener('input', () =>
    setState({ searchTerm: roots.searchInput.value, copyFeedback: null, discoveryPage: 1 }),
  );
  roots.contentBody.addEventListener('change', (event) => {
    const target = event.target as HTMLSelectElement;
    const dimension = target.getAttribute('data-catalog-filter');
    if (dimension) {
      const value = target.value.trim();
      if (dimension === 'registry') {
        setState({ catalogRegistryNames: value ? [value] : [], discoveryPage: 1 }, 'push');
      } else if (dimension === 'type') {
        setState({ catalogItemTypes: value ? [value] : [], discoveryPage: 1 }, 'push');
      } else if (dimension === 'category') {
        setState({ catalogCategories: value ? [value] : [], discoveryPage: 1 }, 'push');
      }
      return;
    }

    if (target.hasAttribute('data-catalog-reviewed')) {
      const reviewed = target.value;
      if (reviewed === 'all' || reviewed === 'reviewed' || reviewed === 'unreviewed') {
        setState({ catalogReviewed: reviewed, discoveryPage: 1 }, 'push');
      }
      return;
    }

    if (target.hasAttribute('data-catalog-sort')) {
      const sort = target.value;
      if (sort === 'name' || sort === 'registry' || sort === 'type' || sort === 'reviewed') {
        setState({ catalogSort: sort, discoveryPage: 1 }, 'push');
      }
    }
  });
  roots.contentBody.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    const control = target.closest('[data-compare-search]');
    const dimension = control?.getAttribute('data-compare-search');
    if (!control || !dimension) return;
    const key = 'compare:' + dimension;
    const value = target.value;
    const focusIdentity = createFocusIdentity(
      control,
      '[data-compare-search]',
      ['data-compare-search'],
    );
    setState(
      { facetSearchTerms: { ...state.facetSearchTerms, [key]: value }, discoveryPage: 1 },
      'replace',
      focusIdentity,
    );
    const nextInput = Array.from(
      roots.contentBody.querySelectorAll<HTMLInputElement>('[data-compare-search]'),
    ).find(item => item.getAttribute('data-compare-search') === dimension);
    nextInput?.focus();
    nextInput?.setSelectionRange(value.length, value.length);
  });
  roots.aside.addEventListener('click', (event) =>
    handleClick(event.target as HTMLElement),
  );
  roots.contentHeader.addEventListener('click', (event) =>
    handleClick(event.target as HTMLElement),
  );
  roots.contentBody.addEventListener('click', (event) =>
    handleClick(event.target as HTMLElement),
  );
  function handleClick(target: HTMLElement): void {
    if (handleInstall(target)) return;

    if (target.closest('[data-catalog-clear]')) {
      setState({
        catalogRegistryNames: [],
        catalogItemTypes: [],
        catalogCategories: [],
        catalogReviewed: 'all',
        catalogSort: 'name',
        discoveryPage: 1,
      }, 'push');
      return;
    }

    const discoveryPage = target.closest('[data-discovery-page]')?.getAttribute('data-discovery-page');
    if (discoveryPage) {
      const nextPage = Number(discoveryPage);
      if (Number.isInteger(nextPage) && nextPage > 0) {
        setState({ discoveryPage: nextPage, copyFeedback: null }, 'push');
      }
      return;
    }

    const registry = target
      .closest('[data-compare-registry]')
      ?.getAttribute('data-compare-registry');
    if (registry) {
      const alreadySelected = state.compareRegistryNames.includes(registry);
      if (!alreadySelected && state.compareRegistryNames.length >= 4) return;
      setState({
        compareRegistryNames: toggle(state.compareRegistryNames, registry),
        discoveryPage: 1,
      }, 'push', createFocusIdentity(
        target.closest('[data-compare-registry]'),
        '[data-compare-registry]',
        ['data-compare-registry'],
      ));
      return;
    }

    const profile = target
      .closest('[data-profile-registry]')
      ?.getAttribute('data-profile-registry');
    if (profile) {
      setState({
        currentView: 'registries',
        returnView: 'registries',
        returnRegistryName: null,
        selectedProfileRegistryName: profile,
        selectedItemSlug: null,
        discoveryPage: 1,
      }, 'push');
      return;
    }

    const item = target.closest('[data-view-item-registry]');
    if (item) {
      const itemRegistry = item.getAttribute('data-view-item-registry');
      const itemSlug = item.getAttribute('data-view-item-slug');
      if (!itemRegistry || !itemSlug) return;
      const returnView = state.currentView === 'registries' ? 'registries' : 'discover';
      setState({
        currentView: 'item',
        returnView,
        returnRegistryName: state.selectedProfileRegistryName,
        selectedProfileRegistryName: itemRegistry,
        selectedItemSlug: itemSlug,
      }, 'push');
      return;
    }

    if (target.closest('[data-back-from-item]')) {
      setState({
        currentView: state.returnView,
        selectedProfileRegistryName: state.returnRegistryName,
        selectedItemSlug: null,
        returnRegistryName: null,
      }, 'push');
      return;
    }

    if (target.closest('[data-back-to-results]')) {
      setState({
        currentView: 'registries',
        selectedProfileRegistryName: null,
        selectedItemSlug: null,
        returnRegistryName: null,
        discoveryPage: 1,
      }, 'push');
    }
  }
  function handleInstall(target: HTMLElement): boolean {
    const copy = target.closest(
      '[data-copy-text], [data-copy-current-url], [data-copy-command]',
    );
    if (copy) {
      const text = copy.hasAttribute('data-copy-current-url')
        ? window.location.href
        : (copy.getAttribute('data-copy-text') ??
          copy.getAttribute('data-copy-command') ??
          '');
      if (text)
        void copyText(text, copy.getAttribute('data-copy-label') ?? 'Copied.');
      return true;
    }
    const add = target.closest('[data-queue-add]');
    if (add) {
      setState({
        installQueue: addToInstallQueue(state.installQueue, {
          action: {
            status: 'enabled',
            token: add.getAttribute('data-queue-add') ?? '',
            installCommand: add.getAttribute('data-queue-install') ?? '',
            inspectCommand: add.getAttribute('data-queue-inspect') ?? '',
            route: add.getAttribute('data-queue-route') ?? '',
            disabledReason: null,
          },
          label: add.getAttribute('data-queue-label') ?? '',
          registry: add.getAttribute('data-queue-registry') ?? '',
          item: add.getAttribute('data-queue-item') ?? '',
        }),
      });
      return true;
    }
    const remove = target.closest('[data-queue-remove]');
    if (remove) {
      setState({
        installQueue: removeFromInstallQueue(
          state.installQueue,
          remove.getAttribute('data-queue-remove') ?? '',
        ),
      });
      return true;
    }
    if (target.closest('[data-queue-clear]')) {
      setState({ installQueue: clearInstallQueue() });
      return true;
    }
    return false;
  }
  async function copyText(text: string, message: string): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(text);
      setState({ copyFeedback: { status: 'success', message, command: text } });
    } catch {
      setState({
        copyFeedback: {
          status: 'error',
          message: 'Clipboard unavailable. Select and copy the text manually.',
          command: text,
        },
      });
    }
  }
  window.addEventListener('popstate', (event) => {
    const parsed = hydrateStateFromUrl(registries);
    state = {
      ...state,
      ...parsed,
      returnView: historyReturnView(event.state, parsed.currentView),
      copyFeedback: null,
      returnRegistryName: null,
    };
    roots.searchInput.value = state.searchTerm;
    render();
  });
  syncUrlState(state);
  render();
}
function renderCopyFeedback(feedback: CopyFeedback | null): string {
  if (!feedback) return '';
  return `
    <div class="copy-feedback copy-feedback-${escapeHtml(feedback.status)}" role="status" aria-live="polite" aria-atomic="true">
      <span>${escapeHtml(feedback.message)}</span>
      ${feedback.status === 'error' && feedback.command ? `<code>${escapeHtml(feedback.command)}</code>` : ''}
    </div>
  `;
}

function createFocusIdentity(
  control: Element | null,
  selector: string,
  attributes: readonly string[],
): FocusIdentity | null {
  if (!control) return null;
  const values: Array<readonly [string, string]> = [];
  for (const name of attributes) {
    const value = control.getAttribute(name);
    if (value === null) return null;
    values.push([name, value] as const);
  }
  return { selector, attributes: values };
}

function historyReturnView(
  historyState: unknown,
  currentView: AppState['currentView'],
): 'discover' | 'registries' {
  if (typeof historyState === 'object' && historyState !== null) {
    const returnView = (historyState as { returnView?: unknown }).returnView;
    if (returnView === 'discover' || returnView === 'registries') return returnView;
  }
  return currentView === 'registries' ? 'registries' : 'discover';
}

function itemDetailKey(
  namespace: string | null | undefined,
  slug: string | null | undefined,
): string | null {
  const registryName = namespace?.trim();
  const itemName = slug?.trim();
  return registryName && itemName ? `${registryName}\u0000${itemName}` : null;
}

function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
function hydrateStateFromUrl(
  registries: readonly Registry[],
): Omit<AppState, 'installQueue' | 'copyFeedback' | 'returnView' | 'returnRegistryName' | 'facetSearchTerms'> {
  const params = new URLSearchParams(window.location.search);
  const parsed = parseRegistryExplorerUrlState(params);
  const browse = parseCatalogBrowseQuery(params);
  const hasLegacyView = params.has('view');
  const route = hasLegacyView
    ? null
    : parseCatalogRoute(window.location.pathname, catalogBasePath());

  let currentView: AppState['currentView'] = parsed.view;
  let selectedProfileRegistryName = parsed.selectedProfileRegistryName;
  let selectedItemSlug = parsed.selectedItemSlug;
  let searchTerm = parsed.searchTerm;

  if (hasLegacyView && !searchTerm && params.get('component')) {
    searchTerm = params.get('component')?.trim() ?? '';
  }

  if (route) {
    if (route.kind === 'components') {
      currentView = 'discover';
      selectedProfileRegistryName = null;
      selectedItemSlug = null;
      if (!searchTerm && route.pathSearchTerm) searchTerm = route.pathSearchTerm;
    } else if (route.kind === 'registries') {
      currentView = 'registries';
      selectedProfileRegistryName = null;
      selectedItemSlug = null;
    } else if (route.kind === 'compare') {
      currentView = 'compare';
      selectedProfileRegistryName = null;
      selectedItemSlug = null;
    } else if (route.kind === 'registry') {
      currentView = 'registries';
      selectedProfileRegistryName = route.namespace;
      selectedItemSlug = null;
    } else {
      currentView = 'item';
      selectedProfileRegistryName = route.namespace;
      selectedItemSlug = route.slug;
    }
  }

  const registry = selectedProfileRegistryName
    && registries.some(item => item.name === selectedProfileRegistryName)
      ? selectedProfileRegistryName
      : null;
  const names = parsed.compareRegistryNames.filter(name =>
    registries.some(item => item.name === name),
  );

  return {
    currentView,
    searchTerm,
    selectedProfileRegistryName: currentView === 'compare' ? null : registry,
    selectedItemSlug: currentView === 'item' && registry ? selectedItemSlug : null,
    compareRegistryNames: names.slice(0, 4),
    discoveryPage: browse.page,
    catalogSort: browse.sort,
    catalogRegistryNames: browse.registryNames.filter(name =>
      registries.some(registryItem => registryItem.name === name),
    ),
    catalogItemTypes: browse.itemTypes,
    catalogCategories: browse.categories,
    catalogReviewed: browse.reviewed,
  };
}

function syncUrlState(state: AppState, historyMode: 'push' | 'replace' = 'replace'): void {
  let route: CatalogRoute;
  if (state.currentView === 'item' && state.selectedProfileRegistryName && state.selectedItemSlug) {
    route = {
      kind: 'component',
      namespace: state.selectedProfileRegistryName,
      slug: state.selectedItemSlug,
    };
  } else if (state.currentView !== 'compare' && state.selectedProfileRegistryName) {
    route = { kind: 'registry', namespace: state.selectedProfileRegistryName };
  } else if (state.currentView === 'registries') {
    route = { kind: 'registries' };
  } else if (state.currentView === 'compare') {
    route = { kind: 'compare' };
  } else if (state.searchTerm.trim() && !state.searchTerm.includes('/')) {
    route = { kind: 'components', pathSearchTerm: state.searchTerm.trim() };
  } else {
    route = { kind: 'components' };
  }

  const isCatalogBrowse = state.currentView === 'discover'
    || (state.currentView === 'registries' && Boolean(state.selectedProfileRegistryName));
  const params = isCatalogBrowse
    ? serializeCatalogBrowseQuery({
        page: state.discoveryPage,
        sort: state.catalogSort,
        registryNames: state.currentView === 'discover' ? state.catalogRegistryNames : [],
        itemTypes: state.catalogItemTypes,
        categories: state.catalogCategories,
        reviewed: state.catalogReviewed,
      })
    : new URLSearchParams();
  if (!isCatalogBrowse && state.currentView !== 'item' && state.discoveryPage > 1) {
    params.set('page', String(state.discoveryPage));
  }
  const pathCarriesSearch = route.kind === 'components' && Boolean(route.pathSearchTerm);
  if (state.searchTerm.trim() && !pathCarriesSearch && state.currentView !== 'item') {
    params.set('q', state.searchTerm.trim());
  }
  if (state.currentView === 'compare') {
    state.compareRegistryNames.forEach(name => params.append('compareRegistry', name));
  }

  let pathname: string;
  try {
    pathname = catalogRoutePath(route, catalogBasePath());
  } catch {
    pathname = catalogRoutePath({ kind: 'components' }, catalogBasePath());
  }
  const query = params.toString();
  const next = pathname + (query ? '?' + query : '') + window.location.hash;
  if (next === window.location.pathname + window.location.search + window.location.hash) return;

  const history = historyMode === 'push' ? window.history.pushState : window.history.replaceState;
  history.call(window.history, { returnView: state.returnView }, '', next);
}
