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
  exploreCollectionBySlug,
  type CatalogAssetKind,
} from '../core/catalogCollections';
import { configureDefaultCatalogTaxonomy, catalogTaxonomyNodeMap, type CatalogTaxonomy } from '../core/catalogTaxonomy';
import { findRegistryCatalogItem } from '../core/registryCatalogIndex';
import { renderCatalogComponents, renderCatalogBrowseControls, type AssetKindToken } from './catalogComponentsView';
import { renderCatalogLanding } from './catalogLandingView';
import { renderCatalogCollection, renderEvidenceUnavailable } from './catalogCollectionView';
import {
  renderRegistryDirectory,
  renderRegistryDirectorySidebar,
  type RegistryDirectoryLayout,
} from './registryDirectoryView';
import { renderRegistryCollection } from './registryCollectionView';
import { renderCatalogBreadcrumbs } from './catalogBreadcrumbs';
import { renderCatalogCompare } from './catalogCompareView';
import { renderCatalogSidebarNavigation } from './catalogSidebarNavigation';
import { nextRegistryIconCandidate } from './registryIdentity';
import { buildAuthorDirectory } from '../core/catalogAuthors';
import { renderCatalogAuthors } from './catalogAuthorsView';

export interface ShellOptions {
  registries: readonly Registry[];
  catalogIndex: RegistryCatalogIndex;
  taxonomy: CatalogTaxonomy;
  mirrorMeta: RegistryMirrorMeta;
  mirrorWarnings: readonly MirrorValidationIssue[];
  fetchImpl?: typeof fetch;
  roots: {
    aside: HTMLElement;
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>;
    searchInput: HTMLInputElement;
    sidebarContext?: HTMLElement;
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
  catalogAssetKinds: CatalogAssetKind[];
  catalogCanonicalIds: string[];
  catalogAccess: Array<'free' | 'paid'>;
  catalogReviewed: CatalogReviewedFilter;
  registryCoverage: RegistryCatalogCoverage[];
  registrySort: RegistryDirectorySort;
  registryLayout: RegistryDirectoryLayout;
  catalogLayout: RegistryDirectoryLayout;
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
  const { registries, catalogIndex, roots, taxonomy } = options;
  configureDefaultCatalogTaxonomy(taxonomy);
  const taxonomyIds = new Set(catalogTaxonomyNodeMap(taxonomy).keys());
  const fetchImpl = options.fetchImpl ?? fetch;

  const emptyAssetCounts = (): Record<AssetKindToken, number> => ({
    component: 0, block: 0, page: 0, template: 0, theme: 0, icon: 0, other: 0,
  });

  const directoryAssetCounts = emptyAssetCounts();
  const catalogAssetItemCounts = emptyAssetCounts();
  const registryAssetCounts = new Map<string, Record<AssetKindToken, number>>();

  for (const [namespace, items] of Object.entries(catalogIndex.registries)) {
    const counts = emptyAssetCounts();

    for (const item of items) {
      const kind = assetKindForCatalogItem(item, namespace);
      counts[kind] += 1;
      catalogAssetItemCounts[kind] += 1;
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
      assetKinds: state.catalogAssetKinds,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
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

  function routeAssetKinds(): CatalogAssetKind[] {
    const route = state.route;

    if (route.kind === 'registry-assets') return [route.assetKind];

    const byKind: Partial<Record<CatalogRoute['kind'], CatalogAssetKind>> = {
      components: 'component', component: 'component', explore: 'component',
      blocks: 'block', block: 'block', pages: 'page', page: 'page',
      templates: 'template', template: 'template', themes: 'theme', theme: 'theme',
      icons: 'icon', 'icon-category': 'icon', 'icon-family': 'icon',
    };

    const assetKind = byKind[route.kind];

    return assetKind ? [assetKind] : state.catalogAssetKinds;
  }

  function facetsForSidebar(): ReturnType<typeof buildCatalogFacetSummary> {
    const route = state.route;
    const namespace = route.kind === 'registry' || route.kind === 'registry-assets' ? route.namespace : null;

    return buildCatalogFacetSummary(registries, catalogIndex, {
      search: state.searchTerm,
      registryNames: namespace ? [namespace] : state.catalogRegistryNames,
      assetKinds: routeAssetKinds(),
      access: state.catalogAccess,
    });
  }

  function sidebarContextForRoute(route: CatalogRoute): { label: string; route: CatalogRoute } {
    const sections: Readonly<Record<string, { label: string; route: CatalogRoute }>> = {
      components: { label: 'Components', route: { kind: 'components' } },
      blocks: { label: 'Blocks', route: { kind: 'blocks' } },
      pages: { label: 'Pages', route: { kind: 'pages' } },
      templates: { label: 'Templates', route: { kind: 'templates' } },
      themes: { label: 'Themes', route: { kind: 'themes' } },
      icons: { label: 'Icons', route: { kind: 'icons' } },
      registries: { label: 'Registries', route: { kind: 'registries' } },
      authors: { label: 'Authors', route: { kind: 'authors' } },
      compare: { label: 'Compare', route: { kind: 'compare' } },
    };

    const kind: Readonly<Record<string, string>> = {
      component: 'components', explore: 'components', block: 'blocks', page: 'pages',
      template: 'templates', theme: 'themes', 'theme-editor': 'themes',
      'icon-category': 'icons', 'icon-family': 'icons',
      registry: 'registries', 'registry-assets': 'registries',
    };

    return sections[kind[route.kind] ?? route.kind] ?? { label: 'Home', route: { kind: 'home' } };
  }

  function renderSidebarContext(): void {
    if (!roots.sidebarContext) return;
    const context = sidebarContextForRoute(state.route);
    const href = catalogRoutePath(context.route, catalogBasePath());
    roots.sidebarContext.innerHTML =
      '<a class="sidebar-context-link" href="' + escapeHtml(href) + '" data-catalog-route="' + escapeHtml(href) + '">' +
        '<span class="sidebar-context-icon" aria-hidden="true">' +
          '<svg viewBox="0 0 16 16" width="14" height="14" fill="none">' +
            '<rect x="2" y="2" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
            '<rect x="9" y="2" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
            '<rect x="2" y="9" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
            '<rect x="9" y="9" width="5" height="5" rx="1" stroke="currentColor"></rect>' +
          '</svg>' +
        '</span>' +
        '<span class="sidebar-context-label">' + escapeHtml(context.label) + '</span>' +
        '<span class="sidebar-context-end" aria-hidden="true"></span>' +
      '</a>';
  }

  function supportsBrowseLayout(route: CatalogRoute): boolean {
    return [
      'components','blocks','pages','templates','themes','icons','explore',
      'registries','registry','registry-assets','icon-category','icon-family',
    ].includes(route.kind);
  }

  function renderBrowseLayoutToggle(layout: RegistryDirectoryLayout): string {
    return '<div class="sidebar-layout-strip">' +
      '<div class="sidebar-layout-toggle" role="group" aria-label="Result layout">' +
        '<button type="button" data-browse-layout="grid" aria-pressed="' + String(layout === 'grid') + '">Grid</button>' +
        '<button type="button" data-browse-layout="list" aria-pressed="' + String(layout === 'list') + '">List</button>' +
      '</div>' +
    '</div>';
  }

  function fixedSidebarNamespace(route: CatalogRoute): string | null {
    if (route.kind === 'registry' || route.kind === 'registry-assets') return route.namespace;

    if (route.kind === 'icon-family') return '@' + route.family;

    return null;
  }

  function filteredSidebarNavigation(
    contextFacets: ReturnType<typeof buildCatalogFacetSummary>,
    globalFacets: ReturnType<typeof buildCatalogFacetSummary>,
  ): string {
    const route = state.route;
    const fixedNamespace = fixedSidebarNamespace(route);
    const fixedRegistry = fixedNamespace !== null;

    const sourceCount = fixedNamespace
      ? (globalFacets.registries.find(item => item.value === fixedNamespace)?.count ?? 0)
      : globalFacets.registries.length;

    return renderCatalogSidebarNavigation({
      ...contextFacets,
      registries: globalFacets.registries,
    }, {
      kind: route.kind,
      canonicalIds: state.catalogCanonicalIds,
      registryNames: fixedRegistry ? [] : state.catalogRegistryNames,
      sort: state.catalogSort,
      access: state.catalogAccess,
      assetKinds: state.catalogAssetKinds,
    }, taxonomy, {
      showRegistrySort: !fixedRegistry,
      sourceLabel: fixedNamespace ?? 'shadcn directory',
      sourceCount,
      assetCounts: route.kind === 'registry' || route.kind === 'registry-assets'
        ? registryAssetCounts.get(route.namespace) : undefined,
    });
  }

  function sidebarNavigation(): string {
    if (state.route.kind === 'registries') {
      return renderRegistryDirectorySidebar({
        layout: state.registryLayout,
        sort: state.registrySort,
        registryCount: registries.length,
        assetCounts: directoryAssetCounts,
        selectedAssetKinds: state.catalogAssetKinds,
      });
    }

    if (![
      'components', 'blocks', 'pages', 'templates', 'themes', 'icons',
      'explore', 'registry', 'registry-assets', 'icon-category', 'icon-family',
    ].includes(state.route.kind)) return '';

    const contextFacets = facetsForSidebar();
    let globalFacets = sidebarFacetCache.get('all:registries');

    if (!globalFacets) {
      globalFacets = buildCatalogFacetSummary(registries, catalogIndex);
      sidebarFacetCache.set('all:registries', globalFacets);
    }

    return filteredSidebarNavigation(contextFacets, globalFacets);
  }

  function renderSidebar(queued: ReadonlySet<string>, batchCommand: string | null): void {
    renderSidebarContext();

    const queueMarkup = queued.size > 0
      ? '<section class="catalog-sidebar-queue">' +
          '<div class="queue-heading"><span>Install queue</span><strong>' + queued.size + '</strong></div>' +
          '<button class="install-button install-button-primary" type="button" data-copy-text="' +
            escapeHtml(batchCommand ?? '') + '" data-copy-label="Batch command copied"' +
            (batchCommand ? '' : ' disabled') + '>Copy batch</button>' +
          '<button class="install-button" type="button" data-queue-clear>Clear</button>' +
        '</section>'
      : '';

    const navigation = sidebarNavigation();

    const layout = state.route.kind === 'registries'
      ? state.registryLayout
      : state.catalogLayout;

    const layoutMarkup = supportsBrowseLayout(state.route)
      ? renderBrowseLayoutToggle(layout)
      : '';

    roots.aside.innerHTML = layoutMarkup +
      '<div class="sidebar-scroll-pane"><div class="desktop-browse-rail">' +
      navigation + queueMarkup +
      '</div></div>';
  }

  function renderLandingRoute(): boolean {
    switch (state.route.kind) {
      case 'home': renderHome();

 return true;
      case 'components': renderComponentsRoute();

 return true;
      case 'blocks':
        renderTypedCollection('block', 'Blocks', 'Composed blocks published by registries.', 'block');

        return true;
      case 'pages':
        renderTypedCollection('page', 'Pages', 'Full-page compositions published by registries.', 'page');

        return true;
      case 'explore': renderExploreRoute();

 return true;
      case 'authors': renderAuthorsRoute();

 return true;
      case 'registries': renderRegistries();

 return true;
      case 'registry': renderRegistryProfile(state.route.namespace);

 return true;
      case 'registry-assets': renderRegistryProfile(state.route.namespace, state.route.assetKind);

 return true;
      default: return false;
    }
  }

  function renderDetailsAndThemes(queued: ReadonlySet<string>): boolean {
    switch (state.route.kind) {
      case 'component':
      case 'block':
      case 'page':
      case 'template':
      case 'theme':
        renderDetail(state.route, queued);

        return true;
      case 'templates':
        renderTypedCollection('template', 'Templates', 'Templates published by registries.', 'template');

        return true;
      case 'themes':
        renderTypedCollection('theme', 'Themes', 'Themes and styles published by registries.', 'theme');

        return true;
      case 'theme-editor':
        renderEvidenceUnavailable(
          roots.contentHeader, roots.contentBody, 'Theme editor',
          "Theme editor isn't available because registries use different token formats.",
          'Editing will stay disabled until Registry Atlas can read those formats consistently.',
        );

        return true;
      default: return false;
    }
  }

  function renderIconAndOtherRoute(): boolean {
    switch (state.route.kind) {
      case 'icons':
        renderTypedCollection(
          'icon', 'Icons',
          'Items identified as icons or grouped in icon categories. This is not a searchable glyph index.',
          'icon',
        );

        return true;
      case 'icon-category': renderIconCategory(state.route.category);

 return true;
      case 'icon-family': renderIconFamily(state.route.family);

 return true;
      case 'compare': renderCompare();

 return true;
      case 'not-found':
        renderEvidenceUnavailable(
          roots.contentHeader, roots.contentBody, 'Route not found',
          "This address doesn't match a Registry Atlas page.",
          'Check the URL or return home.',
        );

        return true;
      default: return false;
    }
  }

  function renderRouteContent(queued: ReadonlySet<string>): void {
    if (renderLandingRoute()) return;

    if (renderDetailsAndThemes(queued)) return;
    renderIconAndOtherRoute();
  }

  function renderHeaderDecorations(): void {
      const breadcrumbTitle = 'namespace' in state.route && 'slug' in state.route
        ? findRegistryCatalogItem(catalogIndex, state.route.namespace, state.route.slug)?.title
        : undefined;

      roots.contentHeader.insertAdjacentHTML('afterbegin',
        renderCatalogBreadcrumbs(state.route, catalogBasePath(), breadcrumbTitle));

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

      if (homepage && (!isDetailRoute(route) || !roots.contentHeader.innerHTML.includes("item-quick-links"))) {
        roots.contentHeader.innerHTML += `<div class="registry-header-homepage-action">${homepage}</div>`;
      }

      roots.contentHeader.insertAdjacentHTML('beforeend', renderCopyFeedback(state.copyFeedback));
  }

  function render(): void {
    try {
      renderTabs();
      const queued = new Set(state.installQueue.map(entry => entry.token));
      const batch = buildInstallQueueBatchState(state.installQueue);
      renderSidebar(queued, batch.command);

      renderRouteContent(queued);

      renderHeaderDecorations();
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
      layout: state.catalogLayout,
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
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      reviewed: 'all',
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });

    renderCatalogComponents(roots.contentHeader, roots.contentBody, result, {
      searchTerm: state.searchTerm,
      browseState: catalogBrowseState(),
      browseControls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
      }),
      discoveryBands: [],
      layout: state.catalogLayout,
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
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Explore',
      title: collection.label,
      description: `Components in the ${collection.label} category.`,
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
      }),
      layout: state.catalogLayout,
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
      layout: state.registryLayout,
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        searchTerm: state.searchTerm,
        selectedAssetKinds: state.catalogAssetKinds,
      }),
    });
  }

  function renderRegistryProfile(namespace: string, scopedKind?: CatalogAssetKind): void {
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
      assetKinds: scopedKind ? [scopedKind] : state.catalogAssetKinds,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });

    renderRegistryCollection(roots.contentHeader, roots.contentBody, registry, result, {
      coverage: registryCatalogCoverage(registry, catalogIndex),
      assetCounts: registryAssetCounts.get(registry.name),
      selectedKind: scopedKind,
      basePath: catalogBasePath(),
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
        selectedAssetKinds: state.catalogAssetKinds,
      }),
      layout: state.catalogLayout,
    });
  }

  function renderTypedCollection(
    kind: 'block' | 'page' | 'template' | 'theme' | 'icon',
    title: string,
    description: string,
    routeKind: 'component' | 'block' | 'page' | 'template' | 'theme' | 'icon',
  ): void {
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: [kind],
      registryNames: state.catalogRegistryNames,
      categories: state.catalogCategories,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Explore',
      title,
      description,
      routeKind,
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
      }),
      emptyTitle: `No ${title.toLowerCase()} are available.`,
      layout: state.catalogLayout,
    });
  }

  function renderIconCategory(category: string): void {
    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: ['icon'],
      categories: [category],
      registryNames: state.catalogRegistryNames,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Icons / Category',
      title: category,
      description: 'Registry-published icons in this category.',
      routeKind: 'icon',
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
      }),
      emptyTitle: 'No icons match this category.',
      layout: state.catalogLayout,
    });
  }

  function renderIconFamily(family: string): void {
    const registry = registries.find(item => item.name.slice(1) === family);

    if (!registry) {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        `Icons · ${family}`,
        'This icon collection does not match a registry.',
        'Choose a registry or return to Icons.',
      );

      return;
    }

    const result = queryCatalogComponents(registries, catalogIndex, {
      search: state.searchTerm,
      assetKinds: ['icon'],
      registryNames: [registry.name],
      categories: state.catalogCategories,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: catalogBasePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: 'Icons / Registry',
      title: family,
      description: `Icons published by ${registry.name}.`,
      routeKind: 'icon',
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
      }),
      emptyTitle: 'This registry has no icons.',
      layout: state.catalogLayout,
    });
  }

  function rejectInvalidAssetDetailRoute(
    route: Extract<CatalogRoute, { kind: 'component' | 'block' | 'page' | 'template' | 'theme' }>,
    compact: ReturnType<typeof findRegistryCatalogItem>,
  ): boolean {
    if (compact) {
      const kind = assetKindForCatalogItem(compact, route.namespace);

      const matches = route.kind === 'component'
        ? kind === 'component' || kind === 'icon' || kind === 'other'
        : kind === route.kind;

      if (matches) return false;
      renderEvidenceUnavailable(
        roots.contentHeader, roots.contentBody, 'Asset route mismatch',
        route.namespace + ' · ' + route.slug,
        'This item belongs to ' + (kind ?? 'an unsupported type') + ', not ' + route.kind + '.',
      );

      return true;
    }

    if (route.kind === 'component') return false;
    renderEvidenceUnavailable(
      roots.contentHeader, roots.contentBody, 'Asset not found',
      route.namespace + ' · ' + route.slug,
      'This item is not available in the requested catalog section.',
    );

    return true;
  }

  function renderDetail(
    route: Extract<CatalogRoute, { kind: 'component' | 'block' | 'page' | 'template' | 'theme' }>,
    queued: ReadonlySet<string>,
  ): void {
    const compact = findRegistryCatalogItem(catalogIndex, route.namespace, route.slug);

    if (rejectInvalidAssetDetailRoute(route, compact)) return;
    const key = itemDetailKey(route.namespace, route.slug);

    const summary = resolveRegistryItemDetailFromCatalogIndex(
      registries,
      catalogIndex,
      route.namespace,
      route.slug,
    );

    const relatedKind = compact ? assetKindForCatalogItem(compact, route.namespace) : route.kind;

    const related=queryCatalogComponents(registries,catalogIndex,{
      registryNames:[route.namespace],
      assetKinds:[relatedKind],
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

    const resetBrowse = {
      searchTerm: '',
      catalogRegistryNames: [],
      catalogItemTypes: [],
      catalogCategories: [],
      catalogAssetKinds: [],
      catalogCanonicalIds: [],
      catalogAccess: [],
      catalogSort: 'name' as CatalogSort,
      registrySort: 'name' as RegistryDirectorySort,
    };

    if (view === 'home') navigate({ kind: 'home' }, 'push', resetBrowse);
    else if (view === 'discover') navigate({ kind: 'components' }, 'push', resetBrowse);
    else if (view === 'blocks') navigate({ kind: 'blocks' }, 'push', resetBrowse);
    else if (view === 'pages') navigate({ kind: 'pages' }, 'push', resetBrowse);
    else if (view === 'templates') navigate({ kind: 'templates' }, 'push', resetBrowse);
    else if (view === 'themes') navigate({ kind: 'themes' }, 'push', resetBrowse);
    else if (view === 'icons') navigate({ kind: 'icons' }, 'push', resetBrowse);
    else if (view === 'registries') navigate({ kind: 'registries' }, 'push', resetBrowse);
    else if (view === 'compare') navigate({ kind: 'compare' }, 'push', resetBrowse);
  }));

  function routeForGlobalSearch(route: CatalogRoute): CatalogRoute {
    const replacements: Readonly<Record<string, CatalogRoute>> = {
      home: { kind: 'components' },
      'not-found': { kind: 'components' },
      'theme-editor': { kind: 'components' },
      component: { kind: 'components' },
      block: { kind: 'blocks' },
      page: { kind: 'pages' },
      template: { kind: 'templates' },
      theme: { kind: 'themes' },
      'icon-category': { kind: 'icons' },
      'icon-family': { kind: 'icons' },
    };

    return replacements[route.kind] ?? route;
  }

  roots.searchInput.addEventListener('input', () => {
    setState({
      route: routeForGlobalSearch(state.route),
      searchTerm: roots.searchInput.value,
      copyFeedback: null,
      discoveryPage: 1,
    });
  });

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

  function registryIconCandidates(image: HTMLImageElement): string[] {
    try {
      const parsed: unknown = JSON.parse(image.getAttribute('data-registry-icon-candidates') ?? '[]');

      return Array.isArray(parsed) ? parsed.filter((value): value is string => typeof value === 'string') : [];
    } catch {
      return [];
    }
  }

  function handleRegistryIconError(event: Event): void {
    const image = event.target as HTMLImageElement | null;

    if (!image?.hasAttribute?.('data-registry-icon-image')) return;
    const candidates = registryIconCandidates(image);
    const current = Number.parseInt(image.getAttribute('data-registry-icon-index') ?? '0', 10);
    const next = nextRegistryIconCandidate(candidates, Number.isFinite(current) ? current : 0);

    if (next) {
      image.setAttribute('data-registry-icon-index', String(next.index));
      image.src = next.src;

      return;
    }

    image.hidden = true;
    image.closest('.registry-icon')?.setAttribute('data-registry-icon-failed', 'true');
  }

  roots.aside.addEventListener('click', event => handleClick(event.target as HTMLElement));
  roots.contentHeader.addEventListener('click', event => {
    const target = event.target as HTMLElement;
    const link = target.closest<HTMLAnchorElement>('a[data-catalog-route],a[data-profile-registry]');
    const mouse = event as MouseEvent;

    if (link && mouse.button === 0 && !mouse.ctrlKey && !mouse.metaKey && !mouse.shiftKey && !mouse.altKey) {
      event.preventDefault();
    }

    handleClick(target);
  });
  roots.contentHeader.addEventListener('error', handleRegistryIconError, true);
  roots.contentBody.addEventListener('error', handleRegistryIconError, true);
  roots.contentBody.addEventListener('click', event => {
    const target = event.target as HTMLElement;

    const link = target.closest<HTMLAnchorElement>(
      'a[data-view-item-registry],a[data-profile-registry],a[data-catalog-route]',
    );

    if (link) {
      const mouse = event as MouseEvent;

      if (mouse.button === 1 || mouse.ctrlKey || mouse.metaKey || mouse.shiftKey || mouse.altKey) return;
      event.preventDefault?.();
    }

    handleClick(target);
  });


  function handleCatalogRouteClick(target: HTMLElement): boolean {
    const directPath = target.closest('[data-catalog-route]')?.getAttribute('data-catalog-route');

    if (directPath) {
      const parsed = parseCatalogRoute(new URL(directPath, window.location.href).pathname, catalogBasePath());

      if (parsed) navigate(parsed, 'push', {
        searchTerm: '',
        catalogRegistryNames: [],
        catalogItemTypes: [],
        catalogCategories: [],
        catalogAssetKinds: [],
        catalogCanonicalIds: [],
        catalogAccess: [],
        catalogSort: 'name',
        catalogReviewed: 'all',
      });

      return true;
    }

    if (target.closest('[data-catalog-clear]')) {
      roots.searchInput.value = '';
      setState({
        searchTerm: '',
        catalogRegistryNames: [],
        catalogItemTypes: [],
        catalogCategories: [],
        catalogAssetKinds: [],
        catalogCanonicalIds: [],
        catalogAccess: [],
        catalogReviewed: 'all',
        catalogSort: 'name',
        discoveryPage: 1,
      }, 'push');

      return true;
    }

    return false;
  }

  function handleCatalogFiltersClick(target: HTMLElement): boolean {
    const registryControl = target.closest('[data-catalog-registry-value]');

    if (registryControl) {
      const value = registryControl.getAttribute('data-catalog-registry-value') ?? '';
      setState({ catalogRegistryNames: value ? toggle(state.catalogRegistryNames, value) : [], discoveryPage: 1 }, 'push',
        createFocusIdentity(registryControl, '[data-catalog-registry-value]', ['data-catalog-registry-value']));

      return true;
    }

    const canonicalControl = target.closest('[data-catalog-canonical-value]');

    if (canonicalControl) {
      const value = canonicalControl.getAttribute('data-catalog-canonical-value') ?? '';

      if (value && !taxonomyIds.has(value)) return true;
      setState({
        catalogCanonicalIds: value && state.catalogCanonicalIds[0] !== value ? [value] : [],
        discoveryPage: 1,
      }, 'push', createFocusIdentity(
        canonicalControl,
        '[data-catalog-canonical-value]',
        ['data-catalog-canonical-value'],
      ));

      return true;
    }

    return false;
  }

  function handleCatalogCategoryClick(target: HTMLElement): boolean {
    return handleCategorySelection(target) || handleAccessSelection(target);
  }

  function handleCategorySelection(target: HTMLElement): boolean {
    const categoryControl = target.closest('[data-catalog-category-value]');

    if (categoryControl) {
      const value = categoryControl.getAttribute('data-catalog-category-value') ?? '';
      setState({
        catalogCategories: value ? toggle(state.catalogCategories, value) : [],
        discoveryPage: 1,
      }, 'push', createFocusIdentity(
        categoryControl,
        '[data-catalog-category-value]',
        ['data-catalog-category-value'],
      ));

      return true;
    }

    return false;
  }

  function handleAccessSelection(target: HTMLElement): boolean {
    const accessControl = target.closest('[data-catalog-access-value]');

    if (accessControl) {
      const value = accessControl.getAttribute('data-catalog-access-value') ?? '';

      if (value && value !== 'free' && value !== 'paid') return true;
      setState({
        catalogAccess: value && state.catalogAccess[0] !== value
          ? [value as 'free' | 'paid']
          : [],
        discoveryPage: 1,
      }, 'push', createFocusIdentity(
        accessControl,
        '[data-catalog-access-value]',
        ['data-catalog-access-value'],
      ));

      return true;
    }

    return false;
  }

  function handleCatalogLayoutClick(target: HTMLElement): boolean {
    const browseLayoutControl = target.closest('[data-browse-layout]');

    if (browseLayoutControl) {
      const value = browseLayoutControl.getAttribute('data-browse-layout');

      if (value === 'grid' || value === 'list') {
        setState({
          registryLayout: value,
          catalogLayout: value,
          discoveryPage: 1,
        }, 'push', createFocusIdentity(
          browseLayoutControl,
          '[data-browse-layout]',
          ['data-browse-layout'],
        ));
      }

      return true;
    }

    const catalogSortControl = target.closest('[data-catalog-sort-value]');

    if (catalogSortControl) {
      const value = catalogSortControl.getAttribute('data-catalog-sort-value');

      if (value === 'name' || value === 'registry') {
        setState({ catalogSort: value, discoveryPage: 1 }, 'push',
          createFocusIdentity(
            catalogSortControl,
            '[data-catalog-sort-value]',
            ['data-catalog-sort-value'],
          ));
      }

      return true;
    }

    const registrySortControl = target.closest('[data-registry-sort-value]');

    if (registrySortControl) {
      const value = registrySortControl.getAttribute('data-registry-sort-value');

      if (value === 'name' || value === 'item-count-desc') {
        setState({ registrySort: value, discoveryPage: 1 }, 'push',
          createFocusIdentity(
            registrySortControl,
            '[data-registry-sort-value]',
            ['data-registry-sort-value'],
          ));
      }

      return true;
    }

    return false;
  }

  function handleCatalogAssetsClick(target: HTMLElement): boolean {
    const values: Array<[selector: string, attribute: string]> = [
      ['[data-registry-asset-value]', 'data-registry-asset-value'],
      ['[data-asset-kind-value]', 'data-asset-kind-value'],
    ];

    for (const [selector, attribute] of values) {
      const control = target.closest(selector);

      if (!control) continue;
      const raw = control.getAttribute(attribute) ?? '';

      if (raw && !['component', 'block', 'page', 'template', 'theme', 'icon', 'other'].includes(raw)) return true;
      const value = raw as CatalogAssetKind | '';
      setState({
        catalogAssetKinds: value && state.catalogAssetKinds[0] !== value ? [value] : [],
        discoveryPage: 1,
      }, 'push', createFocusIdentity(control, selector, [attribute]));

      return true;
    }

    return false;
  }

  function handleCatalogAuthorClick(target: HTMLElement): boolean {
    const authorSelected=target.closest('[data-author-select]')?.getAttribute('data-author-select');

    if(authorSelected && authorRows.some(row=>row.name===authorSelected)){
      setState({authorIdentity:authorSelected,searchTerm:'',discoveryPage:1},'push');

      return true;
    }

    if(target.closest('[data-author-clear]')){
      setState({authorIdentity:null,searchTerm:'',discoveryPage:1},'push');

      return true;
    }

    const page = target.closest('[data-discovery-page]')?.getAttribute('data-discovery-page');

    if (page) {
      const nextPage = Number(page);

      if (Number.isInteger(nextPage) && nextPage > 0) setState({ discoveryPage: nextPage, copyFeedback: null }, 'push');

      return true;
    }

    return false;
  }

  function handleComparisonClick(target: HTMLElement): boolean {
    const compareRegistry = target.closest('[data-compare-registry]')?.getAttribute('data-compare-registry');

    if (compareRegistry) {
      const selected = state.compareRegistryNames.includes(compareRegistry);

      if (!selected && state.compareRegistryNames.length >= 4) return true;
      setState(
        { compareRegistryNames: toggle(state.compareRegistryNames, compareRegistry), discoveryPage: 1 },
        'push',
        createFocusIdentity(target.closest('[data-compare-registry]'), '[data-compare-registry]', ['data-compare-registry']),
      );

      return true;
    }

    const profile = target.closest('[data-profile-registry]')?.getAttribute('data-profile-registry');

    if (profile) {
      navigate({ kind: 'registry', namespace: profile }, 'push', {
        searchTerm: '',
        catalogCategories: [],
        catalogAssetKinds: [],
        catalogCanonicalIds: [],
        catalogAccess: [],
      });

      return true;
    }

    return false;
  }

  function handleCatalogItemClick(target: HTMLElement): boolean {
    return handleDetailSelection(target) || handleDetailReturn(target);
  }

  function handleDetailSelection(target: HTMLElement): boolean {
    const item = target.closest('[data-view-item-registry]');

    if (item) {
      const namespace = item.getAttribute('data-view-item-registry');
      const slug = item.getAttribute('data-view-item-slug');
      const kind = item.getAttribute('data-view-item-kind');

      if (!namespace || !slug) return true;
      const knownKinds = ['block', 'page', 'template', 'theme'] as const;
      const routeKind = knownKinds.find(value => value === kind) ?? 'component';
      const route: CatalogRoute = { kind: routeKind, namespace, slug };
      setState({ route, returnRoute: state.route, copyFeedback: null }, 'push');

      return true;
    }

    return false;
  }

  function handleDetailReturn(target: HTMLElement): boolean {
    if (target.closest('[data-back-from-item]')) {
      navigate(state.returnRoute ?? { kind: 'components' }, 'push', { returnRoute: null });

      return true;
    }

    if (target.closest('[data-back-to-results]')) {
      navigate({ kind: 'registries' });
    }

    return false;
  }

  function handleClick(target: HTMLElement): void {
    if (handleInstall(target)) return;

    if (handleCatalogRouteClick(target)) return;

    if (handleCatalogFiltersClick(target)) return;

    if (handleCatalogCategoryClick(target)) return;

    if (handleCatalogLayoutClick(target)) return;

    if (handleCatalogAssetsClick(target)) return;

    if (handleCatalogAuthorClick(target)) return;

    if (handleComparisonClick(target)) return;

    if (handleCatalogItemClick(target)) return;
  }

  function handleInstall(target: HTMLElement): boolean {
    return handleInstallCopy(target) || handleInstallQueue(target);
  }

  function handleInstallCopy(target: HTMLElement): boolean {
    const copy = target.closest('[data-copy-text], [data-copy-current-url], [data-copy-command]');

    if (copy) {
      const text = copy.hasAttribute('data-copy-current-url')
        ? window.location.href
        : (copy.getAttribute('data-copy-text') ?? copy.getAttribute('data-copy-command') ?? '');

      if (text) void copyText(text, copy.getAttribute('data-copy-label') ?? 'Copied.');

      return true;
    }

    return false;
  }

  function handleInstallQueue(target: HTMLElement): boolean {
    return handleInstallQueueAdd(target) || handleInstallQueueRemove(target);
  }

  function handleInstallQueueAdd(target: HTMLElement): boolean {
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

    return false;
  }

  function handleInstallQueueRemove(target: HTMLElement): boolean {
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

function routeFromLocation(params: URLSearchParams): CatalogRoute {
  if (params.has('view')) return legacyRoute(params);

  return parseCatalogRoute(window.location.pathname, catalogBasePath())
    ?? { kind: 'not-found', path: window.location.pathname };
}

function searchTermFromLocation(params: URLSearchParams, route: CatalogRoute): string {
  const query = params.get('q')?.trim();

  if (query) return query;

  if (route.kind === 'components' && route.pathSearchTerm) return route.pathSearchTerm;

  if (params.has('view')) return params.get('component')?.trim() ?? '';

  return '';
}

function sortRegistriesFromLocation(params: URLSearchParams): RegistryDirectorySort {
  const sort = params.get('registrySort');

  return sort === 'item-count-desc' || sort === 'item-count-asc' ? 'item-count-desc' : 'name';
}

function hydrateStateFromUrl(
  registries: readonly Registry[],
): Omit<AppState, 'installQueue' | 'copyFeedback' | 'returnRoute' | 'facetSearchTerms'> {
  const params = new URLSearchParams(window.location.search);
  const browse = parseCatalogBrowseQuery(params);
  const route = routeFromLocation(params);
  const searchTerm = searchTermFromLocation(params, route);

  const registryCoverage = params.getAll('coverage')
    .filter((value): value is RegistryCatalogCoverage => ['current', 'stale', 'empty', 'failed'].includes(value));

  const registrySort = sortRegistriesFromLocation(params);

  const browseLayout: RegistryDirectoryLayout = params.get('layout') === 'list'
    ? 'list'
    : 'grid';

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
    catalogAssetKinds: browse.assetKinds,
    catalogCanonicalIds: browse.canonicalIds,
    catalogAccess: browse.access,
    catalogReviewed: browse.reviewed,
    registryCoverage,
    registrySort,
    registryLayout: browseLayout,
    catalogLayout: browseLayout,
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
    assetKinds: state.catalogAssetKinds,
    canonicalIds: state.catalogCanonicalIds,
    access: state.catalogAccess,
    reviewed: 'all',
  };
}

const CATALOG_BROWSE_ROUTE_KINDS = new Set<CatalogRoute['kind']>([
  'explore', 'blocks', 'pages', 'templates', 'themes',
  'icons', 'icon-family', 'icon-category',
]);

function searchAwareRoute(state: AppState): CatalogRoute {
  const route = state.route;

  if (route.kind !== 'components') return route;
  const search = state.searchTerm.trim();

  if (!search || state.searchTerm.includes('/')) return route;

  return { kind: 'components', pathSearchTerm: search };
}

function paramsForBrowseRoute(route: CatalogRoute, state: AppState): URLSearchParams | null {
  if (route.kind === 'components') {
    const params = serializeCatalogBrowseQuery({
      ...catalogBrowseStateForUrl(state),
      itemTypes: state.catalogItemTypes,
      reviewed: state.catalogReviewed,
    });

    if (!route.pathSearchTerm && state.searchTerm.trim()) params.set('q', state.searchTerm.trim());

    return params;
  }

  if (route.kind === 'registry' || route.kind === 'registry-assets') {
    const params = serializeCatalogBrowseQuery({
      ...catalogBrowseStateForUrl(state),
      registryNames: [],
      itemTypes: state.catalogItemTypes,
      reviewed: state.catalogReviewed,
    });

    if (state.searchTerm.trim()) params.set('q', state.searchTerm.trim());

    return params;
  }

  if (!CATALOG_BROWSE_ROUTE_KINDS.has(route.kind)) return null;
  const params = serializeCatalogBrowseQuery(catalogBrowseStateForUrl(state));

  if (state.searchTerm.trim()) params.set('q', state.searchTerm.trim());

  return params;
}

function appendDirectoryQuery(params: URLSearchParams, state: AppState): void {
  if (state.discoveryPage > 1) params.set('page', String(state.discoveryPage));

  if (state.searchTerm.trim()) params.set('q', state.searchTerm.trim());
}

function paramsForOtherRoute(route: CatalogRoute, state: AppState): URLSearchParams {
  const params = new URLSearchParams();

  if (route.kind === 'authors') {
    if (state.authorIdentity) params.set('author', state.authorIdentity);
    appendDirectoryQuery(params, state);
  } else if (route.kind === 'registries') {
    appendDirectoryQuery(params, state);
    state.catalogAssetKinds.forEach(value => params.append('asset', value));

    if (state.registrySort !== 'name') params.set('registrySort', state.registrySort);

    if (state.registryLayout !== 'grid') params.set('layout', state.registryLayout);
  } else if (route.kind === 'compare') {
    appendDirectoryQuery(params, state);
    state.compareRegistryNames.forEach(name => params.append('compareRegistry', name));
  }

  return params;
}

function syncUrlState(state: AppState, historyMode: 'push' | 'replace' = 'replace'): void {
  if (state.route.kind === 'not-found') return;
  const route = searchAwareRoute(state);
  const params = paramsForBrowseRoute(route, state) ?? paramsForOtherRoute(route, state);

  if (state.catalogLayout === 'list' && route.kind !== 'registries' && [
    'components', 'registry', 'registry-assets', 'explore', 'blocks', 'pages',
    'templates', 'themes', 'icons', 'icon-family', 'icon-category',
  ].includes(route.kind)) params.set('layout', 'list');
  const pathname = catalogRoutePath(route, catalogBasePath());
  const query = params.toString();
  const next = pathname + (query ? '?'+query : '') + window.location.hash;

  if (next === window.location.pathname + window.location.search + window.location.hash) return;
  const history = historyMode === 'push' ? window.history.pushState : window.history.replaceState;
  history.call(window.history, {}, '', next);
}

const ROUTE_PRIMARY_VIEWS: Readonly<Record<string, string>> = {
  home: 'home', authors: 'discover', components: 'discover', component: 'discover',
  explore: 'discover', registries: 'registries', registry: 'registries',
  'registry-assets': 'registries', blocks: 'blocks', block: 'blocks',
  pages: 'pages', page: 'pages', templates: 'templates', template: 'templates',
  themes: 'themes', theme: 'themes', 'theme-editor': 'themes',
  icons: 'icons', 'icon-family': 'icons', 'icon-category': 'icons',
  compare: 'compare',
};

function primaryViewForRoute(route: CatalogRoute): string | null {
  return ROUTE_PRIMARY_VIEWS[route.kind] ?? null;
}

function isDetailRoute(
  route: CatalogRoute,
): route is Extract<CatalogRoute, { kind: 'component' | 'block' | 'page' | 'template' | 'theme' }> {
  return route.kind === 'component'
    || route.kind === 'block'
    || route.kind === 'page'
    || route.kind === 'template'
    || route.kind === 'theme';
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
