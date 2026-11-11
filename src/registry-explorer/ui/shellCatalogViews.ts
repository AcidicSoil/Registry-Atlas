import { buildRegistryDirectory, registryCatalogCoverage } from "../core/registryDirectory";
import { catalogDistinctItemCount, queryCatalogComponents } from "../core/catalogQuery";
import { exploreCollectionBySlug, type CatalogAssetKind } from "../core/catalogCollections";
import type { CatalogBrowseQueryState } from "../core/catalogRoutes";
import type { Registry, RegistryCatalogIndex } from "../core/registry.schema";
import type { CatalogPolicy } from "../core/catalogPolicy";
import type { buildAuthorDirectory } from "../core/catalogAuthors";
import { renderCatalogLanding } from "./catalogLandingView";
import { renderCatalogCollection, renderEvidenceUnavailable } from "./catalogCollectionView";
import { renderCatalogAuthors } from "./catalogAuthorsView";
import {
  renderCatalogComponents,
  renderCatalogBrowseControls,
  type AssetKindToken,
} from "./catalogComponentsView";
import { renderRegistryDirectory } from "./registryDirectoryView";
import { renderRegistryCollection } from "./registryCollectionView";
import type { AppState } from "./shellState";

interface CatalogViewsDependencies {
  getState: () => AppState;
  registries: readonly Registry[];
  catalogIndex: RegistryCatalogIndex;
  policy: CatalogPolicy;
  authorRows: ReturnType<typeof buildAuthorDirectory>;
  registryAssetCountsFor: (namespace: string) => Record<AssetKindToken, number> | undefined;
  roots: { contentHeader: HTMLElement; contentBody: HTMLElement };
  basePath: () => string;
}

/** Catalog browse route views; reads state without owning navigation or history. */
export function createShellCatalogViews({
  getState,
  registries,
  catalogIndex,
  policy,
  authorRows,
  registryAssetCountsFor,
  roots,
  basePath,
}: CatalogViewsDependencies) {
  const taxonomy = policy.taxonomy;

  function catalogBrowseState(): CatalogBrowseQueryState {
    const state = getState();

    return {
      page: state.discoveryPage,
      sort: state.catalogSort,
      registryNames: state.catalogRegistryNames,
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      assetKinds: state.catalogAssetKinds,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      reviewed: "all",
    };
  }

  function renderHome(): void {
    const featured = queryCatalogComponents(registries, catalogIndex, {
      policy,
      assetKinds: ["component"],
      sort: "name",
      pageSize: 8,
      basePath: basePath(),
    });

    renderCatalogLanding(roots.contentHeader, roots.contentBody, {
      itemCount: catalogDistinctItemCount(catalogIndex),
      registryCount: registries.length,
      catalogCount: catalogIndex.meta.registry_count,
      featured,
      basePath: basePath(),
    });
  }

  function renderAuthorsRoute(): void {
    const state = getState();

    if (state.route.kind !== "authors") return;
    const author = state.authorIdentity;

    if (!author) {
      renderCatalogAuthors(roots.contentHeader, roots.contentBody, authorRows, {
        search: state.searchTerm,
        page: state.discoveryPage,
      });

      return;
    }

    if (!authorRows.some((row) => row.name === author)) {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        "Author attribution unavailable",
        "No exact author attribution matches this URL.",
        "Return to Authors to browse the catalog records.",
      );

      return;
    }

    const result = queryCatalogComponents(registries, catalogIndex, {
      policy,
      author,
      assetKinds: ["component"],
      search: state.searchTerm,
      page: state.discoveryPage,
      basePath: basePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: "Registry Atlas · Catalog attribution",
      title: author,
      description:
        "Original registry item metadata; this is not a verified 21st.dev account profile.",
      controls: '<button type="button" class="link-button" data-author-clear>All authors</button>',
      layout: state.catalogLayout,
    });
  }

  function renderComponentsRoute(): void {
    const state = getState();

    if (state.route.kind !== "components") return;

    const result = queryCatalogComponents(registries, catalogIndex, {
      policy,
      search: state.searchTerm,
      registryNames: state.catalogRegistryNames,
      itemTypes: state.catalogItemTypes,
      categories: state.catalogCategories,
      assetKinds: ["component"],
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      reviewed: "all",
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: basePath(),
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
    const state = getState();

    if (state.route.kind !== "explore") return;
    const collection = exploreCollectionBySlug(state.route.collection);

    if (!collection) {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        "Collection not found",
        "This collection is not configured.",
        "Return to Components and choose one of the available collections.",
      );

      return;
    }

    const result = queryCatalogComponents(registries, catalogIndex, {
      policy,
      search: state.searchTerm,
      categories: collection.categories,
      assetKinds: ["component"],
      registryNames: state.catalogRegistryNames,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: basePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: "Explore",
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
    const state = getState();

    const result = buildRegistryDirectory(registries, catalogIndex, {
      policy,
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
    const state = getState();

    const registry = registries.find((item) => item.name === namespace);

    if (!registry) {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        "Registry not found",
        namespace,
        "No registry has this name.",
      );

      return;
    }

    const result = queryCatalogComponents(registries, catalogIndex, {
      policy,
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
      basePath: basePath(),
    });

    renderRegistryCollection(roots.contentHeader, roots.contentBody, registry, result, {
      coverage: registryCatalogCoverage(registry, catalogIndex),
      assetCounts: registryAssetCountsFor(registry.name),
      selectedKind: scopedKind,
      basePath: basePath(),
      policy,
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
        selectedAssetKinds: state.catalogAssetKinds,
      }),
      layout: state.catalogLayout,
    });
  }

  function renderTypedCollection(
    kind: "block" | "page" | "template" | "theme" | "icon",
    title: string,
    description: string,
    routeKind: "component" | "block" | "page" | "template" | "theme" | "icon",
  ): void {
    const state = getState();

    const result = queryCatalogComponents(registries, catalogIndex, {
      policy,
      search: state.searchTerm,
      assetKinds: [kind],
      registryNames: state.catalogRegistryNames,
      categories: state.catalogCategories,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: basePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: "Explore",
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
    const state = getState();

    const result = queryCatalogComponents(registries, catalogIndex, {
      policy,
      search: state.searchTerm,
      assetKinds: ["icon"],
      categories: [category],
      registryNames: state.catalogRegistryNames,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: basePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: "Icons / Category",
      title: category,
      description: "Registry-published icons in this category.",
      routeKind: "icon",
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
      }),
      emptyTitle: "No icons match this category.",
      layout: state.catalogLayout,
    });
  }

  function renderIconFamily(family: string): void {
    const state = getState();

    const registry = registries.find((item) => item.name.slice(1) === family);

    if (!registry) {
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        `Icons · ${family}`,
        "This icon collection does not match a registry.",
        "Choose a registry or return to Icons.",
      );

      return;
    }

    const result = queryCatalogComponents(registries, catalogIndex, {
      policy,
      search: state.searchTerm,
      assetKinds: ["icon"],
      registryNames: [registry.name],
      categories: state.catalogCategories,
      canonicalIds: state.catalogCanonicalIds,
      access: state.catalogAccess,
      sort: state.catalogSort,
      page: state.discoveryPage,
      basePath: basePath(),
    });

    renderCatalogCollection(roots.contentHeader, roots.contentBody, result, {
      eyebrow: "Icons / Registry",
      title: family,
      description: `Icons published by ${registry.name}.`,
      routeKind: "icon",
      controls: renderCatalogBrowseControls(catalogBrowseState(), {
        taxonomy,
        searchTerm: state.searchTerm,
      }),
      emptyTitle: "This registry has no icons.",
      layout: state.catalogLayout,
    });
  }

  return {
    renderHome,
    renderAuthorsRoute,
    renderComponentsRoute,
    renderExploreRoute,
    renderRegistries,
    renderRegistryProfile,
    renderTypedCollection,
    renderIconCategory,
    renderIconFamily,
  };
}
