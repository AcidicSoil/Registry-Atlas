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
import { escapeHtml, renderRegistryHomepageLink } from './renderSafety';
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
import { renderCatalogComponents, renderCatalogBrowseControls, type AssetKindToken } from './catalogComponentsView';
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
  catalogAssetKinds: AssetKindToken[];
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
  const directoryAssetCounts: Record<AssetKindToken, number> = { component: 0, template: 0, theme: 0, icon: 0 };
  const registryAssetCounts = new Map<string, Record<AssetKindToken, number>>();
  for (const [namespace, items] of Object.entries(catalogIndex.registries)) {
    const counts = { component: 0, template: 0, theme: 0, icon: 0 };
    for (const item of items) {
      const kind = assetKindForCatalogItem(item);
      if (kind) counts[kind] += 1;
    }
    registryAssetCounts.set(namespace, counts);
    for (const kind of Object.keys(counts) as AssetKindToken[]) {
      if (counts[kind] > 0) directoryAssetCounts[kind] += 1;
    }
  }
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

  function catalogBrowseState(): CatalogBrowseQueryState {
    return {
      page: state.discoveryPage,
      sort: state.catalogSort,
      registryNames: state.catalogRegistryNames,
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      reviewed: 'all',
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
    const candidates = [
      ...Array.from(roots.contentBody.querySelectorAll<HTMLElement>(identity.selector)),
      ...Array.from(roots.aside.querySelectorAll<HTMLElement>(identity.selector)),
    ];
    const equivalent = candidates.find(candidate =>
      identity.attributes.every(([name, value]) => candidate.getAttribute(name) === value),
    );
    (equivalent ?? candidates[0])?.focus();
  }

  function renderSidebar(queued: ReadonlySet<string>, batchCommand: string | null): void {
    const queueMarkup = queued.size > 0
      ? `<section class="catalog-sidebar-queue">
          <div class="queue-heading"><span>Install queue</span><strong>${queued.size}</strong></div>
          <button class="install-button install-button-primary" type="button" data-copy-text="${escapeHtml(batchCommand ?? '')}" data-copy-label="Batch command copied"${batchCommand ? '' : ' disabled'}>Copy batch</button>
          <button class="install-button" type="button" data-queue-clear>Clear</button>
        </section>`
      : '';

    // Keep filters alongside results, never in the navigation sidebar.
    roots.aside.innerHTML = queueMarkup
      ? `<div class="desktop-browse-rail">${queueMarkup}</div>`
      : '';
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
          renderTypedCollection('template', 'Templates', 'Templates published by registries.', 'template');
          break;
        case 'themes':
          renderTypedCollection('theme', 'Themes', 'Themes and styles published by registries.', 'theme');
          break;
        case 'theme-editor':
          renderEvidenceUnavailable(
            roots.contentHeader,
            roots.contentBody,
            'Theme editor',
            "Theme editor isn't available because registries use different token formats.",
            'Editing will stay disabled until Registry Atlas can read those formats consistently.',
          );
          break;
        case 'icons':
          renderTypedCollection(
            'icon',
            'Icon-related assets',
            'Items identified as icons or grouped in icon categories. This is not a searchable glyph index.',
            'component',
          );
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
            "This address doesn't match a Registry Atlas page.",
            'Check the URL or return home.',
          );
          break;
      }

      // A registry homepage is one route-level action, not an item/source fallback.
      // Include it even when a known registry's item route is unavailable.
      const route = state.route;
      const registryForHeader = route.kind === 'icon-family'
        ? registries.find(registry => registry.name.slice(1) === route.family)
        : 'namespace' in route
          ? registries.find(registry => registry.name === route.namespace)
          : undefined;
      const homepage = registryForHeader
        ? renderRegistryHomepageLink(registryForHeader.url) : '';
      if (homepage) {
        roots.contentHeader.innerHTML += `<div class="registry-header-homepage-action">${homepage}</div>`;
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
      sort: 'name',
      pageSize: 8,
      basePath: catalogBasePath(),
    });
    renderCatalogLanding(roots.contentHeader, roots.contentBody, {
      itemCount: catalogIndex.meta.item_count,
      registryCount: registries.length,
      catalogCount: catalogIndex.meta.registry_count,
      featured,
      basePath: catalogBasePath(),
    });
  }

  function renderComponentsRoute(): void {
    if (state.route.kind !== 'components') return;
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      registryNames: state.catalogRegistryNames,
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      assetKinds: ['component'],
      reviewed: 'all',
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });

    const facets = buildCatalogFacetSummary(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: ['component'],
    });
    const hasActiveBrowseConstraint = Boolean(
      state.searchTerm.trim()
      || state.catalogRegistryNames.length
      || state.catalogItemTypes.length
      || state.catalogCategories.length,
    );
    const discoveryBands = hasActiveBrowseConstraint
      ? []
      : buildExploreCollectionOptions(facets.categories.map(option => option.value))
          .slice(0, 3)
          .map(collection => ({
            label: collection.label,
            routePath: catalogRoutePath(
              { kind: 'explore', collection: collection.slug },
              catalogBasePath(),
            ),
            items: queryCatalogComponents(registries, catalogIndex, {
              categories: collection.categories,
              assetKinds: ['component'],
              sort: 'name',
              pageSize: 6,
              basePath: catalogBasePath(),
            }).items,
          }))
          .filter(band => band.items.length > 0);

    renderCatalogComponents(roots.contentHeader, roots.contentBody, result, {
      searchTerm: state.searchTerm,
      browseState: catalogBrowseState(),
      browseControls: renderCatalogBrowseControls(catalogBrowseState(), { facets }),
      discoveryBands,
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
        'This collection is not configured.',
        'Return to Components and choose one of the available collections.',
      );
      return;
    }
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      categories: collection.categories,
      assetKinds: ['component'],
      registryNames: state.catalogRegistryNames,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Explore',
      title: collection.label,
      description: `Components in the ${collection.label} category.`,
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        facets: buildCatalogFacetSummary(registries, catalogIndex, { search: state.searchTerm, assetKinds: ['component'] }),
      }),
    });
  }

  function renderRegistries(): void {
    const result = buildRegistryDirectory(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: state.catalogAssetKinds,
      sort: state.registrySort,
      page: state.discoveryPage,
    });
    renderRegistryDirectory(roots.contentHeader, roots.contentBody, result, {
      sort: state.registrySort,
    });
    roots.contentBody.innerHTML = roots.contentBody.innerHTML.replace(
      '<div class="registry-directory-controls" aria-label="Registry directory controls">',
      '<div class="registry-directory-controls" aria-label="Registry directory controls">' +
      renderCatalogBrowseControls(catalogBrowseState(), {
        hideSort: true, assetCounts: directoryAssetCounts,
        selectedAssetKinds: state.catalogAssetKinds,
      }),
    );

  }

  function renderRegistryProfile(namespace: string): void {
    const registry = registries.find(item => item.name === namespace);
    if (!registry) {
      renderEvidenceUnavailable(roots.contentHeader, roots.contentBody, 'Registry not found', namespace, 'No registry has this name.');
      return;
    }
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      registryNames: [registry.name],
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      reviewed: state.catalogReviewed,
      sort: state.catalogSort,
      assetKinds: state.catalogAssetKinds,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderRegistryCollection(roots.contentHeader, roots.contentBody, registry, result, {
      coverage: registryCatalogCoverage(registry, catalogIndex),
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        showRegistrySort: false,
        facets: buildCatalogFacetSummary(registries, catalogIndex, {
          search: state.searchTerm, registryNames: [registry.name],
        }),
        showRegistries: false,
        assetCounts: registryAssetCounts.get(registry.name) ?? {},
        selectedAssetKinds: state.catalogAssetKinds,
      }),
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
      registryNames: state.catalogRegistryNames,
      categories: state.catalogCategories,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Explore',
      title,
      description,
      routeKind,
      controls: renderCatalogBrowseControls(catalogBrowseState()),
      emptyTitle: `No ${title.toLowerCase()} are available.`,
    });
  }

  function renderIconCategory(category: string): void {
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: ['icon'],
      categories: [category],
      registryNames: state.catalogRegistryNames,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Icon-related assets / Category',
      title: category,
      description: 'Icon-related items in this category.',
      controls: renderCatalogBrowseControls(catalogBrowseState()),
      emptyTitle: 'No icon-related items match this category.',
    });
  }

  function renderIconFamily(family: string): void {
    const registry = registries.find(item => item.name.slice(1) === family);
    if (!registry) {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        `Icon-related assets · ${family}`,
        'This icon collection does not match a registry.',
        'Choose a registry or return to Icon-related assets.',
      );
      return;
    }
    const result = queryCatalogComponents(registries, catalogIndex, {
      assetKinds: ['icon'],
      registryNames: [registry.name],
      categories: state.catalogCategories,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Icon-related assets / Registry',
      title: family,
      description: `Icon-related items published by ${registry.name}.`,
      controls: renderCatalogBrowseControls(catalogBrowseState()),
      emptyTitle: 'This registry has no icon-related items.',
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
          `This item belongs to ${kind ?? 'an unsupported type'}, not ${route.kind}.`,
        );
        return;
      }
    } else if (route.kind !== 'component') {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        'Asset not found',
        `${route.namespace} · ${route.slug}`,
        'This item is not available in the requested catalog section.',
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
    const resetBrowse = { searchTerm: '', catalogRegistryNames: [], catalogItemTypes: [], catalogCategories: [], catalogAssetKinds: [], catalogSort: 'name' as CatalogSort, registrySort: 'name' as RegistryDirectorySort };
    if (view === 'home') navigate({ kind: 'home' }, 'push', resetBrowse);
    else if (view === 'discover') navigate({ kind: 'components' }, 'push', resetBrowse);
    else if (view === 'templates') navigate({ kind: 'templates' }, 'push', resetBrowse);
    else if (view === 'themes') navigate({ kind: 'themes' }, 'push', resetBrowse);
    else if (view === 'icons') navigate({ kind: 'icons' }, 'push', resetBrowse);
    else if (view === 'registries') navigate({ kind: 'registries' }, 'push', resetBrowse);
    else if (view === 'compare') navigate({ kind: 'compare' }, 'push', resetBrowse);
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

  function handleControlChange(target: HTMLSelectElement): void {
    if (target.hasAttribute('data-catalog-sort')) {
      const value = target.value as CatalogSort;
      if (['name', 'name-desc', 'registry', 'registry-desc'].includes(value)) {
        setState({ catalogSort: value, catalogReviewed: 'all', discoveryPage: 1 }, 'push');
      }
      return;
    }
    if (target.hasAttribute('data-registry-sort')) {
      const value = target.value as RegistryDirectorySort;
      if (['name', 'name-desc', 'item-count-asc', 'item-count-desc'].includes(value)) {
        setState({ registrySort: value, discoveryPage: 1 }, 'push');
      }
    }
  }

  roots.contentBody.addEventListener('change', event => handleControlChange(event.target as HTMLSelectElement));

  roots.contentBody.addEventListener('input', event => {
    const target = event.target as HTMLInputElement;
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
  roots.contentBody.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>('a[data-view-item-registry]');
    if (link) {
      const mouse = event as MouseEvent;
      if (mouse.button === 1 || mouse.ctrlKey || mouse.metaKey || mouse.shiftKey || mouse.altKey) return;
      event.preventDefault?.();
    }
    handleClick(target);
  });

  // Sandboxed examples send only a navigation intent when their empty space is
  // clicked. Interactive controls inside the iframe never request navigation.
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as { type?: string; namespace?: string; slug?: string } | null;
    if (event.origin !== 'null' || data?.type !== 'registry-atlas:component-open'
      || data.namespace !== '@8bitcn' || !['button', 'card', 'input'].includes(data.slug ?? '')) return;
    const frames = roots.contentBody.querySelectorAll<HTMLIFrameElement>('iframe[data-component-demo]');
    const matched = Array.from(frames).some(frame => {
      if (frame.contentWindow !== event.source
        || frame.getAttribute('data-component-demo') !== data.namespace + '/' + data.slug) return false;
      const src = frame.getAttribute('src');
      if (!src) return false;
      const url = new URL(src, window.location.href);
      return url.origin === window.location.origin
        && url.pathname === '/Registry-Atlas/component-demos/8bitcn/index.html'
        && url.searchParams.get('item') === data.slug
        && url.searchParams.get('mode') === 'card';
    });
    if (matched) navigate({ kind: 'component', namespace: data.namespace, slug: data.slug! }, 'push');
  });

  function handleClick(target: HTMLElement): void {
    if (handleInstall(target)) return;


    const directPath = target.closest('[data-catalog-route]')?.getAttribute('data-catalog-route');
    if (directPath) {
      const parsed = parseCatalogRoute(new URL(directPath, window.location.href).pathname, catalogBasePath());
      if (parsed) navigate(parsed, 'push', { searchTerm: '', catalogRegistryNames: [], catalogItemTypes: [], catalogCategories: [], catalogAssetKinds: [], catalogSort: 'name', catalogReviewed: 'all' });
      return;
    }

    if (target.closest('[data-catalog-clear]')) {
      setState({
        catalogRegistryNames: [],
        catalogItemTypes: [],
        catalogCategories: [],
        catalogAssetKinds: [],
        catalogReviewed: 'all',
        catalogSort: 'name',
        discoveryPage: 1,
      }, 'push');
      return;
    }

    const registryControl = target.closest('[data-catalog-registry-value]');
    if (registryControl) {
      const value = registryControl.getAttribute('data-catalog-registry-value') ?? '';
      setState({ catalogRegistryNames: value ? toggle(state.catalogRegistryNames, value) : [], discoveryPage: 1 }, 'push',
        createFocusIdentity(registryControl, '[data-catalog-registry-value]', ['data-catalog-registry-value']));
      return;
    }
    const categoryControl = target.closest('[data-catalog-category-value]');
    if (categoryControl) {
      const value = categoryControl.getAttribute('data-catalog-category-value') ?? '';
      setState({ catalogCategories: value ? toggle(state.catalogCategories, value) : [], discoveryPage: 1 }, 'push',
        createFocusIdentity(categoryControl, '[data-catalog-category-value]', ['data-catalog-category-value']));
      return;
    }
    const assetControl = target.closest('[data-asset-kind-value]');
    if (assetControl) {
      const value = assetControl.getAttribute('data-asset-kind-value') as AssetKindToken | '';
      if (value && !['component', 'template', 'theme', 'icon'].includes(value)) return;
      setState({ catalogAssetKinds: value ? toggle(state.catalogAssetKinds, value) : [], discoveryPage: 1 }, 'push',
        createFocusIdentity(assetControl, '[data-asset-kind-value]', ['data-asset-kind-value']));
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
  const registrySort: RegistryDirectorySort = registrySortParam === 'item-count-asc' || registrySortParam === 'item-count-desc' || registrySortParam === 'name-desc'
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
    catalogAssetKinds: [...new Set(params.getAll("asset"))].filter((kind): kind is AssetKindToken => ["component", "template", "theme", "icon"].includes(kind)),
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

function catalogBrowseStateForUrl(state: AppState): CatalogBrowseQueryState {
  return {
    page: state.discoveryPage,
    sort: state.catalogSort,
    registryNames: state.catalogRegistryNames,
    itemTypes: [],
    categories: state.catalogCategories,
    reviewed: 'all',
  };
}

function syncUrlState(state: AppState, historyMode: 'push' | 'replace' = 'replace'): void {
  if (state.route.kind === 'not-found') return;
  let route = state.route;
  if (
    route.kind === 'components'
    && state.searchTerm.trim()
    && !state.searchTerm.includes('/')
  ) {
    route = { kind: 'components', pathSearchTerm: state.searchTerm.trim() };
  }

  let params = new URLSearchParams();
  if (route.kind === 'components') {
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
    state.catalogAssetKinds.forEach(value => params.append('asset', value));
  } else if (route.kind === 'registries') {
    if (state.discoveryPage > 1) params.set('page', String(state.discoveryPage));
    if (state.searchTerm.trim()) params.set('q', state.searchTerm.trim());
    state.catalogAssetKinds.forEach(value => params.append('asset', value));
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
  ) {
    params = serializeCatalogBrowseQuery(catalogBrowseStateForUrl(state));
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
  if (route.kind === 'home') return 'home';
  if (route.kind === 'registries' || route.kind === 'registry') return 'registries';
  if (route.kind === 'templates' || route.kind === 'template') return 'templates';
  if (route.kind === 'themes' || route.kind === 'theme' || route.kind === 'theme-editor') return 'themes';
  if (route.kind === 'icons' || route.kind === 'icon-family' || route.kind === 'icon-category') return 'icons';
  if (route.kind === 'compare') return 'compare';
  if (route.kind === 'components' || route.kind === 'explore' || route.kind === 'component') return 'discover';
  return null;
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
