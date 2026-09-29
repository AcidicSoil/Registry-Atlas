import type {
  InstallQueueEntry,
  Registry,
  RegistryCatalogIndex,
} from '../core/registry.schema';
import type { MirrorValidationIssue } from '../core/registryMirror';
import type { RegistryMirrorMeta } from '../data/loadRegistries';
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
import { renderItemDetailView } from './itemDetailView';
import { escapeHtml } from './renderSafety';
import { buildCatalogFacetSummary, queryCatalogComponents } from '../core/catalogQuery';
import {
  buildRegistryDirectory,
  registryCatalogCoverage,
  type RegistryCatalogCoverage,
  type RegistryDirectorySort,
} from '../core/registryDirectory';
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
import {
  assetKindForCatalogItem,
  buildExploreCollectionOptions,
  exploreCollectionBySlug,
} from '../core/catalogCollections';
import { findRegistryCatalogItem } from '../core/registryCatalogIndex';
import { renderCatalogComponents } from './catalogComponentsView';
import { renderCatalogLanding } from './catalogLandingView';
import { renderCatalogCollection, renderEvidenceUnavailable } from './catalogCollectionView';
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

interface CopyFeedback {
  status: 'success' | 'error';
  message: string;
  command?: string;
}

interface AppState {
  route: CatalogRoute;
  returnRoute: CatalogRoute | null;
  compareRegistryNames: string[];
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
  registryCoverage: RegistryCatalogCoverage[];
  registrySort: RegistryDirectorySort;
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

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, catalogIndex, roots } = options;
  const fetchImpl = options.fetchImpl ?? fetch;
  const itemDetailCache = new Map<string, RegistryItemDetailResult>();
  const itemDetailLoading = new Set<string>();
  let state: AppState = {
    ...hydrateStateFromUrl(registries),
    returnRoute: null,
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
    const routeChanged = partial.route !== undefined
      && catalogRouteIdentity(partial.route) !== catalogRouteIdentity(state.route);
    state = { ...state, ...partial };
    if (routeChanged && partial.copyFeedback === undefined) state.copyFeedback = null;
    syncUrlState(state, historyMode);
    render();
    if (focusIdentity) restoreControlFocus(focusIdentity);
  };

  function navigate(
    route: CatalogRoute,
    historyMode: 'push' | 'replace' = 'push',
    extra: Partial<AppState> = {},
  ): void {
    setState({
      route,
      discoveryPage: 1,
      copyFeedback: null,
      ...extra,
    }, historyMode);
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
    namespace: string,
    slug: string,
  ): Promise<void> {
    if (itemDetailLoading.has(key)) return;
    itemDetailLoading.add(key);
    try {
      itemDetailCache.set(
        key,
        await loadRegistryItemDetailFromCatalogIndex(
          registries,
          catalogIndex,
          namespace,
          slug,
          fetchImpl,
        ),
      );
    } finally {
      itemDetailLoading.delete(key);
    }
    if (isDetailRoute(state.route) && itemDetailKey(state.route.namespace, state.route.slug) === key) {
      render();
    }
  }

  function restoreControlFocus(identity: FocusIdentity): void {
    const candidates = Array.from(roots.contentBody.querySelectorAll<HTMLElement>(identity.selector));
    const equivalent = candidates.find(candidate =>
      identity.attributes.every(([name, value]) => candidate.getAttribute(name) === value),
    );
    (equivalent ?? candidates[0])?.focus();
  }

  function renderSidebar(queued: ReadonlySet<string>, batchCommand: string | null): void {
    const facets = buildCatalogFacetSummary(registries, catalogIndex, { assetKinds: ['component'] });
    const collections = buildExploreCollectionOptions(facets.categories.map(option => option.value));
    const routeButton = (route: CatalogRoute, label: string) =>
      `<button type="button" class="aside-route" data-catalog-route="${escapeHtml(catalogRoutePath(route, catalogBasePath()))}">${escapeHtml(label)}</button>`;
    const queueMarkup = queued.size > 0
      ? `<section class="catalog-sidebar-queue">
          <div class="queue-heading"><span>Install queue</span><strong>${queued.size}</strong></div>
          <button class="install-button install-button-primary" type="button" data-copy-text="${escapeHtml(batchCommand ?? '')}" data-copy-label="Batch command copied"${batchCommand ? '' : ' disabled'}>Copy batch</button>
          <button class="install-button" type="button" data-queue-clear>Clear</button>
        </section>`
      : '';

    roots.aside.innerHTML = `
      <div class="catalog-sidebar-routes">
        <div class="aside-section-title">Browse</div>
        ${routeButton({ kind: 'components', lens: 'featured' }, 'Reviewed')}
        ${routeButton({ kind: 'components', lens: 'newest' }, 'Newest')}
        ${routeButton({ kind: 'authors' }, 'Authors')}
        ${routeButton({ kind: 'registries' }, 'Libraries')}
        ${routeButton({ kind: 'templates' }, 'Templates')}
        ${routeButton({ kind: 'themes' }, 'Themes')}
        ${routeButton({ kind: 'icons' }, 'Icons')}
      </div>
      ${collections.length ? `
        <div class="catalog-sidebar-routes">
          <div class="aside-section-title">Explore</div>
          ${collections.slice(0, 6).map(collection =>
            routeButton({ kind: 'explore', collection: collection.slug }, collection.label),
          ).join('')}
        </div>
      ` : ''}
      <div class="catalog-sidebar-summary">
        <div class="aside-section-title">Catalog</div>
        <div class="aside-summary"><strong>${catalogIndex.meta.item_count.toLocaleString()}</strong> indexed assets<br><strong>${catalogIndex.meta.registry_count.toLocaleString()}</strong> indexed catalogs<br><strong>${registries.length.toLocaleString()}</strong> registries</div>
      </div>
      ${queueMarkup}
    `;
  }

  function render(): void {
    try {
      renderTabs();
      const queued = new Set(state.installQueue.map(entry => entry.token));
      const batch = buildInstallQueueBatchState(state.installQueue);
      renderSidebar(queued, batch.command);

      switch (state.route.kind) {
        case 'home':
          renderHome();
          break;
        case 'components':
          renderComponentsRoute();
          break;
        case 'explore':
          renderExploreRoute();
          break;
        case 'authors':
          renderEvidenceUnavailable(
            roots.contentHeader,
            roots.contentBody,
            'Authors',
            'Creator routes require explicit upstream author or publisher metadata.',
            'The mirrored registry catalog does not currently provide trustworthy per-item author identity, so Registry Atlas will not relabel registry namespaces as people.',
          );
          break;
        case 'registries':
          renderRegistries();
          break;
        case 'registry':
          renderRegistryProfile(state.route.namespace);
          break;
        case 'component':
        case 'template':
        case 'theme':
          renderDetail(state.route, queued);
          break;
        case 'templates':
          renderTypedCollection('template', 'Templates', 'Explicit registry:page assets from mirrored catalogs.', 'template');
          break;
        case 'themes':
          renderTypedCollection('theme', 'Themes', 'Explicit registry theme/style assets from mirrored catalogs.', 'theme');
          break;
        case 'theme-editor':
          renderEvidenceUnavailable(
            roots.contentHeader,
            roots.contentBody,
            'Theme editor',
            'The editor activates only when a registry publishes explicit theme-token data.',
            'Current catalog evidence does not provide a normalized theme-token model. A decorative fake editor would violate the evidence contract.',
          );
          break;
        case 'icons':
          renderTypedCollection('icon', 'Icons', 'Icon assets backed by explicit item type or upstream icon category.', 'component');
          break;
        case 'icon-category':
          renderIconCategory(state.route.category);
          break;
        case 'icon-family':
          renderIconFamily(state.route.family);
          break;
        case 'compare':
          renderCompare();
          break;
        case 'not-found':
          renderEvidenceUnavailable(
            roots.contentHeader,
            roots.contentBody,
            'Route not found',
            'This Registry Atlas path does not map to a supported catalog surface.',
            'Unknown routes stay distinguishable from Components instead of silently falling back to the default catalog.',
          );
          break;
      }

      roots.contentHeader.insertAdjacentHTML('beforeend', renderCopyFeedback(state.copyFeedback));
    } catch (error) {
      console.error('Registry Explorer: Render failed', error);
      roots.contentBody.innerHTML = '<div class="empty-state">Something went wrong while rendering this view.</div>';
    }
  }

  function renderTabs(): void {
    const active = primaryViewForRoute(state.route);
    roots.tabs.forEach(tab => {
      const tabView = tab.getAttribute('data-view');
      tab.classList.toggle('nav-item-active', tabView === active);
      if (tabView === active) tab.setAttribute('aria-current', 'page');
      else tab.removeAttribute('aria-current');
    });
  }

  function renderHome(): void {
    const featured = queryCatalogComponents(registries, catalogIndex, {
      assetKinds: ['component'],
      reviewed: 'reviewed',
      sort: 'reviewed',
      pageSize: 8,
      basePath: catalogBasePath(),
    });
    const facets = buildCatalogFacetSummary(registries, catalogIndex, { assetKinds: ['component'] });
    renderCatalogLanding(roots.contentHeader, roots.contentBody, {
      itemCount: catalogIndex.meta.item_count,
      registryCount: registries.length,
      indexedRegistryCount: catalogIndex.meta.registry_count,
      featured,
      collections: buildExploreCollectionOptions(facets.categories.map(option => option.value)),
      basePath: catalogBasePath(),
    });
  }

  function renderComponentsRoute(): void {
    if (state.route.kind !== 'components') return;
    if (state.route.lens === 'newest') {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        state.route.period ? `Newest · ${state.route.period}` : 'Newest',
        'Chronological browsing requires an explicit upstream item publication timestamp.',
        'Registry sync timestamps describe when Atlas fetched a catalog, not when an item was published. They are intentionally not used as a recency signal.',
      );
      return;
    }

    const featured = state.route.lens === 'featured';
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      registryNames: state.catalogRegistryNames,
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      assetKinds: ['component'],
      reviewed: featured ? 'reviewed' : state.catalogReviewed,
      sort: featured ? 'reviewed' : state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    if (featured) {
      renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
        eyebrow: 'Components / Reviewed',
        title: 'Reviewed components',
        description: 'Real indexed components with reviewed Registry Atlas enrichment. This is not a popularity ranking.',
      });
      return;
    }

    const facets = buildCatalogFacetSummary(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: ['component'],
    });
    renderCatalogComponents(roots.contentHeader, roots.contentBody, result, {
      searchTerm: state.searchTerm,
      facets,
      browseState: catalogBrowseState(),
      includeRegistryFilter: true,
    });
  }

  function renderExploreRoute(): void {
    if (state.route.kind !== 'explore') return;
    const collection = exploreCollectionBySlug(state.route.collection);
    if (!collection) {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        'Collection not found',
        'Explore collections are configured from explicit upstream categories.',
        'This collection slug has no evidence-backed rule.',
      );
      return;
    }
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      categories: collection.categories,
      assetKinds: ['component'],
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Explore',
      title: collection.label,
      description: `Components carrying explicit upstream categories: ${collection.categories.join(', ')}.`,
    });
  }

  function renderRegistries(): void {
    const result = buildRegistryDirectory(registries, catalogIndex, {
      search: state.searchTerm,
      coverage: state.registryCoverage,
      sort: state.registrySort,
      page: state.discoveryPage,
    });
    renderRegistryDirectory(roots.contentHeader, roots.contentBody, result, {
      searchTerm: state.searchTerm,
      coverage: state.registryCoverage,
      sort: state.registrySort,
    });
  }

  function renderRegistryProfile(namespace: string): void {
    const registry = registries.find(item => item.name === namespace);
    if (!registry) {
      renderEvidenceUnavailable(roots.contentHeader, roots.contentBody, 'Registry not found', namespace, 'No mirrored registry has this exact namespace.');
      return;
    }
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
      coverage: registryCatalogCoverage(registry, catalogIndex),
    });
  }

  function renderTypedCollection(
    kind: 'template' | 'theme' | 'icon',
    title: string,
    description: string,
    routeKind: 'component' | 'template' | 'theme',
  ): void {
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: [kind],
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Community',
      title,
      description,
      routeKind,
      emptyTitle: `No explicit ${title.toLowerCase()} are indexed yet.`,
    });
  }

  function renderIconCategory(category: string): void {
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: ['icon'],
      categories: [category],
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Icons / Category',
      title: category,
      description: 'Only icons carrying this exact upstream category are shown.',
      emptyTitle: 'No explicit icons match this category.',
    });
  }

  function renderIconFamily(family: string): void {
    const registry = registries.find(item => item.name.slice(1) === family);
    if (!registry) {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        `Icons · ${family}`,
        'Icon family routes require an exact registry-backed family.',
        'No mirrored registry has this exact family namespace.',
      );
      return;
    }
    const result = queryCatalogComponents(registries, catalogIndex, {
      assetKinds: ['icon'],
      registryNames: [registry.name],
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Icons / Family',
      title: family,
      description: `Explicit icon assets published by ${registry.name}.`,
      emptyTitle: 'This registry has no explicitly classified icon assets.',
    });
  }

  function renderDetail(
    route: Extract<CatalogRoute, { kind: 'component' | 'template' | 'theme' }>,
    queued: ReadonlySet<string>,
  ): void {
    const compact = findRegistryCatalogItem(catalogIndex, route.namespace, route.slug);
    if (compact) {
      const kind = assetKindForCatalogItem(compact);
      const valid = route.kind === 'component'
        ? kind === 'component' || kind === 'icon'
        : kind === route.kind;
      if (!valid) {
        renderEvidenceUnavailable(
          roots.contentHeader,
          roots.contentBody,
          'Asset route mismatch',
          `${route.namespace} · ${route.slug}`,
          `The indexed item is classified as ${kind ?? 'unsupported'}, not ${route.kind}.`,
        );
        return;
      }
    } else if (route.kind !== 'component') {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        'Asset not found',
        `${route.namespace} · ${route.slug}`,
        'Typed asset routes require an exact compact-index identity.',
      );
      return;
    }

    const key = itemDetailKey(route.namespace, route.slug);
    const summary = resolveRegistryItemDetailFromCatalogIndex(
      registries,
      catalogIndex,
      route.namespace,
      route.slug,
    );
    renderItemDetailView(
      roots.contentHeader,
      roots.contentBody,
      key ? itemDetailCache.get(key) ?? summary : summary,
      queued,
    );
    if (key && !itemDetailCache.has(key) && summary.status === 'summary-only' && summary.detail.route.status === 'available') {
      void ensureItemDetailLoaded(key, route.namespace, route.slug);
    }
  }

  function renderCompare(): void {
    const registrySearch = state.facetSearchTerms['compare:registry'] ?? '';
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
      registrySearch,
    );
  }

  roots.tabs.forEach(tab => tab.addEventListener('click', () => {
    const view = tab.getAttribute('data-view');
    if (view === 'discover') navigate({ kind: 'components' });
    else if (view === 'registries') navigate({ kind: 'registries' });
    else if (view === 'compare') navigate({ kind: 'compare' });
  }));

  roots.searchInput.addEventListener('input', () => {
    const nextRoute = state.route.kind === 'home' ? { kind: 'components' } as CatalogRoute : state.route;
    setState({
      route: nextRoute,
      searchTerm: roots.searchInput.value,
      copyFeedback: null,
      discoveryPage: 1,
    });
  });

  roots.contentBody.addEventListener('change', event => {
    const target = event.target as HTMLSelectElement;
    const dimension = target.getAttribute('data-catalog-filter');
    if (dimension) {
      const value = target.value.trim();
      if (dimension === 'registry') setState({ catalogRegistryNames: value ? [value] : [], discoveryPage: 1 }, 'push');
      else if (dimension === 'type') setState({ catalogItemTypes: value ? [value] : [], discoveryPage: 1 }, 'push');
      else if (dimension === 'category') setState({ catalogCategories: value ? [value] : [], discoveryPage: 1 }, 'push');
      return;
    }
    if (target.hasAttribute('data-catalog-reviewed')) {
      const value = target.value as CatalogReviewedFilter;
      if (value === 'all' || value === 'reviewed' || value === 'unreviewed') {
        setState({ catalogReviewed: value, discoveryPage: 1 }, 'push');
      }
      return;
    }
    if (target.hasAttribute('data-catalog-sort')) {
      const value = target.value as CatalogSort;
      if (['name', 'registry', 'type', 'reviewed'].includes(value)) {
        setState({ catalogSort: value, discoveryPage: 1 }, 'push');
      }
      return;
    }
    if (target.hasAttribute('data-registry-coverage')) {
      const value = target.value as RegistryCatalogCoverage;
      setState({ registryCoverage: value ? [value] : [], discoveryPage: 1 }, 'push');
      return;
    }
    if (target.hasAttribute('data-registry-sort')) {
      const value = target.value as RegistryDirectorySort;
      if (['name', 'item-count-asc', 'item-count-desc'].includes(value)) {
        setState({ registrySort: value, discoveryPage: 1 }, 'push');
      }
    }
  });

  roots.contentBody.addEventListener('input', event => {
    const target = event.target as HTMLInputElement;
    if (target.hasAttribute('data-registry-search')) {
      roots.searchInput.value = target.value;
      setState({ searchTerm: target.value, discoveryPage: 1 });
      return;
    }
    const control = target.closest('[data-compare-search]');
    const dimension = control?.getAttribute('data-compare-search');
    if (!control || !dimension) return;
    const key = `compare:${dimension}`;
    const value = target.value;
    const focusIdentity = createFocusIdentity(control, '[data-compare-search]', ['data-compare-search']);
    setState(
      { facetSearchTerms: { ...state.facetSearchTerms, [key]: value }, discoveryPage: 1 },
      'replace',
      focusIdentity,
    );
  });

  roots.aside.addEventListener('click', event => handleClick(event.target as HTMLElement));
  roots.contentHeader.addEventListener('click', event => handleClick(event.target as HTMLElement));
  roots.contentBody.addEventListener('click', event => handleClick(event.target as HTMLElement));

  function handleClick(target: HTMLElement): void {
    if (handleInstall(target)) return;

    const directPath = target.closest('[data-catalog-route]')?.getAttribute('data-catalog-route');
    if (directPath) {
      const parsed = parseCatalogRoute(new URL(directPath, window.location.href).pathname, catalogBasePath());
      if (parsed) navigate(parsed, 'push', { searchTerm: '', catalogRegistryNames: [], catalogItemTypes: [], catalogCategories: [], catalogReviewed: 'all' });
      return;
    }

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

    const page = target.closest('[data-discovery-page]')?.getAttribute('data-discovery-page');
    if (page) {
      const nextPage = Number(page);
      if (Number.isInteger(nextPage) && nextPage > 0) setState({ discoveryPage: nextPage, copyFeedback: null }, 'push');
      return;
    }

    const compareRegistry = target.closest('[data-compare-registry]')?.getAttribute('data-compare-registry');
    if (compareRegistry) {
      const selected = state.compareRegistryNames.includes(compareRegistry);
      if (!selected && state.compareRegistryNames.length >= 4) return;
      setState(
        { compareRegistryNames: toggle(state.compareRegistryNames, compareRegistry), discoveryPage: 1 },
        'push',
        createFocusIdentity(target.closest('[data-compare-registry]'), '[data-compare-registry]', ['data-compare-registry']),
      );
      return;
    }

    const profile = target.closest('[data-profile-registry]')?.getAttribute('data-profile-registry');
    if (profile) {
      navigate({ kind: 'registry', namespace: profile }, 'push', { searchTerm: '' });
      return;
    }

    const item = target.closest('[data-view-item-registry]');
    if (item) {
      const namespace = item.getAttribute('data-view-item-registry');
      const slug = item.getAttribute('data-view-item-slug');
      const kind = item.getAttribute('data-view-item-kind');
      if (!namespace || !slug) return;
      const route: CatalogRoute = kind === 'template'
        ? { kind: 'template', namespace, slug }
        : kind === 'theme'
          ? { kind: 'theme', namespace, slug }
          : { kind: 'component', namespace, slug };
      setState({ route, returnRoute: state.route, copyFeedback: null }, 'push');
      return;
    }

    if (target.closest('[data-back-from-item]')) {
      navigate(state.returnRoute ?? { kind: 'components' }, 'push', { returnRoute: null });
      return;
    }

    if (target.closest('[data-back-to-results]')) {
      navigate({ kind: 'registries' });
    }
  }

  function handleInstall(target: HTMLElement): boolean {
    const copy = target.closest('[data-copy-text], [data-copy-current-url], [data-copy-command]');
    if (copy) {
      const text = copy.hasAttribute('data-copy-current-url')
        ? window.location.href
        : (copy.getAttribute('data-copy-text') ?? copy.getAttribute('data-copy-command') ?? '');
      if (text) void copyText(text, copy.getAttribute('data-copy-label') ?? 'Copied.');
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
      setState({ installQueue: removeFromInstallQueue(state.installQueue, remove.getAttribute('data-queue-remove') ?? '') });
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

  window.addEventListener('popstate', () => {
    state = {
      ...state,
      ...hydrateStateFromUrl(registries),
      returnRoute: null,
      copyFeedback: null,
    };
    roots.searchInput.value = state.searchTerm;
    render();
  });

  syncUrlState(state);
  render();
}

function hydrateStateFromUrl(
  registries: readonly Registry[],
): Omit<AppState, 'installQueue' | 'copyFeedback' | 'returnRoute' | 'facetSearchTerms'> {
  const params = new URLSearchParams(window.location.search);
  const browse = parseCatalogBrowseQuery(params);
  const route = params.has('view')
    ? legacyRoute(params)
    : parseCatalogRoute(window.location.pathname, catalogBasePath())
      ?? { kind: 'not-found', path: window.location.pathname };

  let searchTerm = params.get('q')?.trim() ?? '';
  if (!searchTerm && route.kind === 'components' && route.pathSearchTerm) searchTerm = route.pathSearchTerm;
  if (!searchTerm && params.has('view') && params.get('component')) searchTerm = params.get('component')?.trim() ?? '';

  const registryCoverage = params.getAll('coverage')
    .filter((value): value is RegistryCatalogCoverage => ['current', 'stale', 'empty', 'failed'].includes(value));
  const registrySortParam = params.get('registrySort');
  const registrySort: RegistryDirectorySort = registrySortParam === 'item-count-asc' || registrySortParam === 'item-count-desc'
    ? registrySortParam
    : 'name';
  const compareRegistryNames = [...new Set(params.getAll('compareRegistry'))]
    .filter(name => registries.some(registry => registry.name === name))
    .slice(0, 4);

  return {
    route,
    compareRegistryNames,
    searchTerm,
    discoveryPage: browse.page,
    catalogSort: browse.sort,
    catalogRegistryNames: browse.registryNames.filter(name => registries.some(registry => registry.name === name)),
    catalogItemTypes: browse.itemTypes,
    catalogCategories: browse.categories,
    catalogReviewed: browse.reviewed,
    registryCoverage,
    registrySort,
  };
}

function legacyRoute(params: URLSearchParams): CatalogRoute {
  const view = params.get('view');
  const registry = params.get('registry')?.trim();
  const item = params.get('item')?.trim();
  if (view === 'compare' || view === 'matrix') return { kind: 'compare' };
  if (view === 'registries') return registry ? { kind: 'registry', namespace: registry } : { kind: 'registries' };
  if (view === 'item' && registry && item) return { kind: 'component', namespace: registry, slug: item };
  return { kind: 'components' };
}

function syncUrlState(state: AppState, historyMode: 'push' | 'replace' = 'replace'): void {
  if (state.route.kind === 'not-found') return;
  let route = state.route;
  if (
    route.kind === 'components'
    && !route.lens
    && state.searchTerm.trim()
    && !state.searchTerm.includes('/')
  ) {
    route = { kind: 'components', pathSearchTerm: state.searchTerm.trim() };
  }

  let params = new URLSearchParams();
  if (route.kind === 'components' && !route.lens) {
    params = serializeCatalogBrowseQuery({
      page: state.discoveryPage,
      sort: state.catalogSort,
      registryNames: state.catalogRegistryNames,
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      reviewed: state.catalogReviewed,
    });
    if (!route.pathSearchTerm && state.searchTerm.trim()) params.set('q', state.searchTerm.trim());
  } else if (route.kind === 'registry') {
    params = serializeCatalogBrowseQuery({
      page: state.discoveryPage,
      sort: state.catalogSort,
      registryNames: [],
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      reviewed: state.catalogReviewed,
    });
    if (state.searchTerm.trim()) params.set('q', state.searchTerm.trim());
  } else if (route.kind === 'registries') {
    if (state.discoveryPage > 1) params.set('page', String(state.discoveryPage));
    if (state.searchTerm.trim()) params.set('q', state.searchTerm.trim());
    state.registryCoverage.forEach(value => params.append('coverage', value));
    if (state.registrySort !== 'name') params.set('registrySort', state.registrySort);
  } else if (route.kind === 'compare') {
    if (state.discoveryPage > 1) params.set('page', String(state.discoveryPage));
    if (state.searchTerm.trim()) params.set('q', state.searchTerm.trim());
    state.compareRegistryNames.forEach(name => params.append('compareRegistry', name));
  } else if (
    route.kind === 'explore'
    || route.kind === 'templates'
    || route.kind === 'themes'
    || route.kind === 'icons'
    || route.kind === 'icon-family'
    || route.kind === 'icon-category'
    || (route.kind === 'components' && Boolean(route.lens))
  ) {
    if (state.discoveryPage > 1) params.set('page', String(state.discoveryPage));
    if (state.searchTerm.trim()) params.set('q', state.searchTerm.trim());
  }

  const pathname = catalogRoutePath(route, catalogBasePath());
  const query = params.toString();
  const next = pathname + (query ? `?${query}` : '') + window.location.hash;
  if (next === window.location.pathname + window.location.search + window.location.hash) return;
  const history = historyMode === 'push' ? window.history.pushState : window.history.replaceState;
  history.call(window.history, {}, '', next);
}

function primaryViewForRoute(route: CatalogRoute): string | null {
  if (route.kind === 'registries' || route.kind === 'registry') return 'registries';
  if (route.kind === 'compare') return 'compare';
  if (isDetailRoute(route) || route.kind === 'not-found') return null;
  return 'discover';
}

function isDetailRoute(
  route: CatalogRoute,
): route is Extract<CatalogRoute, { kind: 'component' | 'template' | 'theme' }> {
  return route.kind === 'component' || route.kind === 'template' || route.kind === 'theme';
}

function catalogRouteIdentity(route: CatalogRoute): string {
  return JSON.stringify(route);
}

function itemDetailKey(namespace: string, slug: string): string {
  return `${namespace}\u0000${slug}`;
}

function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value) ? values.filter(item => item !== value) : [...values, value];
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
