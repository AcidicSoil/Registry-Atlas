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
import { describeSourcePreviewFailure } from './sourcePreviewStatus';
import { escapeHtml, renderRegistryHomepageLink } from './renderSafety';
import { buildCatalogFacetSummary, catalogDistinctItemCount, queryCatalogComponents } from '../core/catalogQuery';
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
import { renderCatalogSidebarNavigation } from './catalogSidebarNavigation';
import { buildAuthorDirectory } from '../core/catalogAuthors';
import { renderCatalogAuthors } from './catalogAuthorsView';

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
  authorIdentity: string | null;
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
  const authorRows = buildAuthorDirectory(catalogIndex);
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

  const sidebarFacetCache = new Map<string, ReturnType<typeof buildCatalogFacetSummary>>();
  function facetsForSidebar(): ReturnType<typeof buildCatalogFacetSummary> {
    const route=state.route;
    const namespace=route.kind==='registry' ? route.namespace : null;
    const kind = route.kind==='templates' || route.kind==='template' ? 'template'
      : route.kind==='themes' || route.kind==='theme' ? 'theme'
      : route.kind==='icons' || route.kind==='icon-category'
        || route.kind==='icon-family' ? 'icon' : 'component';
    const cacheKey=kind+(namespace?':'+namespace:'');
    let facets=sidebarFacetCache.get(cacheKey);
    if(!facets){
      facets=buildCatalogFacetSummary(registries,catalogIndex, {
        ...(namespace?{registryNames:[namespace]}:{}),
        assetKinds:[kind],
      });
      sidebarFacetCache.set(cacheKey,facets);
    }
    return facets;
  }

  function renderSidebar(queued: ReadonlySet<string>, batchCommand: string | null): void {
    const queueMarkup = queued.size > 0
      ? `<section class="catalog-sidebar-queue">
          <div class="queue-heading"><span>Install queue</span><strong>${queued.size}</strong></div>
          <button class="install-button install-button-primary" type="button" data-copy-text="${escapeHtml(batchCommand ?? '')}" data-copy-label="Batch command copied"${batchCommand ? '' : ' disabled'}>Copy batch</button>
          <button class="install-button" type="button" data-queue-clear>Clear</button>
        </section>`
      : '';

    const selectedRegistry = 'namespace' in state.route
      ? state.route.namespace : null;
    const contextFacets=facetsForSidebar();
    let globalFacets=sidebarFacetCache.get('all:registries');
    if(!globalFacets){
      globalFacets=buildCatalogFacetSummary(registries,catalogIndex);
      sidebarFacetCache.set('all:registries',globalFacets);
    }
    const navigation=renderCatalogSidebarNavigation({
      ...contextFacets,
      registries:globalFacets.registries,
    }, {
      kind:state.route.kind,
      categories:state.catalogCategories,
      registry:selectedRegistry,
      categorySearch:state.facetSearchTerms['sidebar:category']??'',
      registrySearch:state.facetSearchTerms['sidebar:registry']??'',
    });
    roots.aside.innerHTML = `<div class="desktop-browse-rail">${navigation}${queueMarkup}</div>`;
    for (const input of roots.aside.querySelectorAll<HTMLInputElement>(
      '[data-sidebar-search-root]',
    )) {
      filterSidebarSearch(input);
    }
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
          renderAuthorsRoute();
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
    // Lead with real visual evidence, rather than a row of unknown item tiles.
    const visualFeatured = queryCatalogComponents(registries, catalogIndex, {
      assetKinds: ['component'],
      visualOnly: true,
      sort: 'name',
      pageSize: 8,
      basePath: catalogBasePath(),
    });
    const featured = visualFeatured.items.length ? visualFeatured
      : queryCatalogComponents(registries, catalogIndex, {
          assetKinds: ['component'],
          sort: 'name',
          pageSize: 8,
          basePath: catalogBasePath(),
        });
    renderCatalogLanding(roots.contentHeader, roots.contentBody, {
      itemCount: catalogDistinctItemCount(catalogIndex),
      registryCount: registries.length,
      catalogCount: catalogIndex.meta.registry_count,
      featured,
      basePath: catalogBasePath(),
    });
  }

  function renderAuthorsRoute(): void {
    if (state.route.kind !== 'authors') return;
    const author=state.authorIdentity;
    if (!author) {
      renderCatalogAuthors(roots.contentHeader,roots.contentBody,authorRows,{
        search:state.searchTerm,page:state.discoveryPage,
      });
      return;
    }
    if (!authorRows.some(row=>row.name===author)) {
      renderEvidenceUnavailable(roots.contentHeader,roots.contentBody,
        'Author attribution unavailable','No exact author attribution matches this URL.',
        'Return to Authors to browse the catalog records.');
      return;
    }
    const result=queryCatalogComponents(registries,catalogIndex,{
      author,assetKinds:['component'],search:state.searchTerm,
      page:state.discoveryPage,basePath:catalogBasePath(),
    });
    renderCatalogCollection(roots.contentHeader,roots.contentBody,result,{
      eyebrow:'Registry Atlas · Catalog attribution',title:author,
      description:'Original registry item metadata; this is not a verified 21st.dev account profile.',
      controls:'<button type="button" class="link-button" data-author-clear>All authors</button>',
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
    const discoveryBands = hasActiveBrowseConstraint ? [] : [
      {
        label:'Visual previews',
        routePath:catalogRoutePath({kind:'components'},catalogBasePath()),
        items:queryCatalogComponents(registries,catalogIndex,{
          assetKinds:['component'],visualOnly:true,sort:'name',pageSize:8,
          basePath:catalogBasePath(),
        }).items,
      },
      ...buildExploreCollectionOptions(facets.categories.map(option=>option.value))
        .slice(0,3)
        .map(collection=>({
          label:collection.label,
          routePath:catalogRoutePath(
            {kind:'explore',collection:collection.slug},catalogBasePath(),
          ),
          items:queryCatalogComponents(registries,catalogIndex,{
            categories:collection.categories,assetKinds:['component'],
            visualOnly:true,sort:'name',pageSize:6,basePath:catalogBasePath(),
          }).items,
        })),
    ].filter(band=>band.items.length>0);

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
    const related=queryCatalogComponents(registries,catalogIndex,{
      registryNames:[route.namespace],
      assetKinds:[route.kind==='template'?'template':route.kind==='theme'?'theme':'component'],
      pageSize:9,sort:'name',basePath:catalogBasePath(),
    }).items.filter(item=>item.slug!==route.slug).slice(0,8);
    renderItemDetailView(
      roots.contentHeader,
      roots.contentBody,
      key ? itemDetailCache.get(key) ?? summary : summary,
      queued,
      related,
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

  function filterSidebarSearch(input: HTMLInputElement): void {
    const type = input.getAttribute('data-sidebar-search-root');
    if(type!=='category'&&type!=='registry')return;
    const term = input.value.trim().toLocaleLowerCase();
    const list=roots.aside.querySelector<HTMLElement>(`[data-sidebar-list="${type}"]`);
    if(!list)return;
    let visible=0;
    for(const item of list.querySelectorAll<HTMLElement>('[data-sidebar-search-label]')){
      const name=item.getAttribute('data-sidebar-search-label')??'';
      item.hidden=!!term&&!name.includes(term);
      if(!item.hidden)visible++;
    }
    const empty=roots.aside.querySelector<HTMLElement>(`[data-sidebar-search-empty="${type}"]`);
    if(empty)empty.hidden=visible>0;
  }
  roots.aside.addEventListener('input', event => {
    const input=event.target as HTMLInputElement;
    const type=input.getAttribute('data-sidebar-search-root');
    if(type!=='category'&&type!=='registry')return;
    state.facetSearchTerms['sidebar:'+type]=input.value;
    filterSidebarSearch(input);
  });

  roots.aside.addEventListener('click', event => handleClick(event.target as HTMLElement));
  roots.contentHeader.addEventListener('click', event => handleClick(event.target as HTMLElement));
  roots.contentBody.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>(
      'a[data-view-item-registry],a[data-profile-registry]',
    );
    if (link) {
      const mouse = event as MouseEvent;
      if (mouse.button === 1 || mouse.ctrlKey || mouse.metaKey || mouse.shiftKey || mouse.altKey) return;
      event.preventDefault?.();
    }
    handleClick(target);
  });


  function handleClick(target: HTMLElement): void {
    const sandboxButton = target.closest<HTMLButtonElement>('[data-source-sandbox-registry]');
    if (sandboxButton) {
      const registry = sandboxButton.dataset.sourceSandboxRegistry ?? '';
      const slug = sandboxButton.dataset.sourceSandboxSlug ?? '';
      const root = sandboxButton.closest<HTMLElement>('[data-source-sandbox-root]');
      const status = root?.querySelector<HTMLElement>('[data-source-sandbox-status]');
      const mount = root?.querySelector<HTMLElement>('[data-source-sandbox-mount]');
      if (!root || !mount || !status || !/^[a-z0-9][a-z0-9-]*$/.test(registry)
        || !/^[a-z0-9][a-z0-9._/-]*$/.test(slug)
        || !['127.0.0.1','localhost'].includes(window.location.hostname)) return;
      sandboxButton.disabled = true;
      status.textContent = 'Loading original component files and declared dependencies…';
      void (async () => {
        try {
          const result = await fetch('http://127.0.0.1:5198/sandbox/@'+registry+'/'+slug);
          const project = await result.json();
          if (!result.ok) {
            if (root.isConnected) {
              status.textContent = describeSourcePreviewFailure(project);
              sandboxButton.disabled = false;
            }
            return;
          }
          if (!root.isConnected) return;
          if (project.mode !== 'upstream-demo') {
            status.textContent = 'No original author demo is provided for this item.';
            sandboxButton.disabled = false;
            return;
          }
          const { mountRegistryProject } = await import('./liveRegistryPreview');
          if (!root.isConnected) return;
          mountRegistryProject(mount, project);
          status.textContent = project.warning;
          mount.style.minHeight = '320px';
          mount.style.width = '100%';
        } catch (error) {
          if (!root.isConnected) return;
          status.textContent = 'Original source demo unavailable. Check the local preview server and retry.';
          sandboxButton.disabled = false;
        }
      })();
      return;
    }
    const localBuild = target.closest<HTMLButtonElement>('[data-local-build-preview]');
    if (localBuild) {
      const slug = localBuild.getAttribute('data-local-build-preview') ?? '';
      const registry = localBuild.getAttribute('data-local-build-registry') ?? '';
      if (!['127.0.0.1','localhost'].includes(window.location.hostname)
        || !/^[a-z0-9][a-z0-9-]*$/.test(slug)
        || !/^[a-z0-9][a-z0-9-]*$/.test(registry)) return;
      const root = localBuild.closest<HTMLElement>('[data-local-preview-root]');
      if (!root || root.querySelector('iframe')) return;
      const frame = document.createElement('iframe');
      frame.className = 'component-demo-frame component-demo-frame-detail';
      frame.setAttribute('data-component-demo','@'+registry+'/'+slug);
      frame.setAttribute('title',slug+' local source preview; build-only');
      frame.setAttribute('sandbox','allow-scripts');
      frame.setAttribute('referrerpolicy','no-referrer');
      frame.setAttribute('loading','eager');
      frame.src = 'http://127.0.0.1:5198/preview/@'+registry+'/'+slug;
      const status = root.querySelector<HTMLElement>('[data-local-preview-status]');
      if (status) status.textContent = 'Requesting an isolated source build. This is not a verified demo.';
      frame.addEventListener('load',()=>{
        if (status) status.textContent = 'The local build service responded. Check the frame for the result; behavior is not verified.';
      });
      frame.addEventListener('error',()=>{
        if (status) status.textContent = 'Local preview service unavailable. Start it with pnpm preview:serve.';
      });
      localBuild.disabled = true;
      root.append(frame);
      return;
    }

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
      const sidebarChoice=categoryControl.hasAttribute('data-sidebar-category-link');
      const nextRoute: CatalogRoute = sidebarChoice
        && state.route.kind!=='components' && state.route.kind!=='registry'
          ? {kind:'components'} : state.route;
      setState({
        route:nextRoute,
        catalogCategories: value ? toggle(state.catalogCategories, value) : [],
        ...(sidebarChoice&&nextRoute.kind==='components'&&state.route.kind!=='components'
          ? {searchTerm:'',catalogRegistryNames:[],catalogAssetKinds:[]} : {}),
        discoveryPage:1,
      }, 'push', createFocusIdentity(categoryControl,
        '[data-catalog-category-value]', ['data-catalog-category-value']));
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


    const authorSelected=target.closest('[data-author-select]')?.getAttribute('data-author-select');
    if(authorSelected && authorRows.some(row=>row.name===authorSelected)){
      setState({authorIdentity:authorSelected,searchTerm:'',discoveryPage:1},'push');
      return;
    }
    if(target.closest('[data-author-clear]')){
      setState({authorIdentity:null,searchTerm:'',discoveryPage:1},'push');
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
      navigate({ kind: 'registry', namespace: profile }, 'push', {
        searchTerm: '', catalogCategories: [], catalogAssetKinds: [],
      });
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
    authorIdentity:route.kind==='authors' ? (params.get('author')?.trim().slice(0,256)||null) : null,
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
  } else if (route.kind === 'authors') {
    if(state.authorIdentity)params.set('author',state.authorIdentity);
    if(state.discoveryPage>1)params.set('page',String(state.discoveryPage));
    if(state.searchTerm.trim())params.set('q',state.searchTerm.trim());
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
  if (route.kind === 'authors') return 'discover';
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
