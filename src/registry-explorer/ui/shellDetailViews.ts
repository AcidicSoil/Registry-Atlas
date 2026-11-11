import { assetKindForCatalogItem } from "../core/catalogCollections";
import { queryCatalogComponents } from "../core/catalogQuery";
import { buildCatalogComparison } from "../core/catalogCompare";
import type { CatalogRoute } from "../core/catalogRoutes";
import { findRegistryCatalogItem } from "../core/registryCatalogIndex";
import {
  resolveRegistryItemDetailFromCatalogIndex,
  type RegistryItemDetailResult,
} from "../core/registryItemDetail";
import { loadRegistryItemDetailFromCatalogIndex } from "../data/loadRegistryItemDetail";
import type { Registry, RegistryCatalogIndex } from "../core/registry.schema";
import type { CatalogPolicy } from "../core/catalogPolicy";
import { renderItemDetailView } from "./itemDetailView";
import { renderEvidenceUnavailable } from "./catalogCollectionView";
import { renderCatalogCompare } from "./catalogCompareView";
import type { AppState } from "./shellState";

interface DetailDependencies {
  getState: () => AppState;
  render: () => void;
  roots: { contentHeader: HTMLElement; contentBody: HTMLElement };
  registries: readonly Registry[];
  catalogIndex: RegistryCatalogIndex;
  policy: CatalogPolicy;
  fetchImpl: typeof fetch;
  signal: AbortSignal;
  basePath: () => string;
}

export function isDetailRoute(
  route: CatalogRoute,
): route is Extract<CatalogRoute, { kind: "component" | "block" | "page" | "template" | "theme" }> {
  return (
    route.kind === "component" ||
    route.kind === "block" ||
    route.kind === "page" ||
    route.kind === "template" ||
    route.kind === "theme"
  );
}

function itemDetailKey(namespace: string, slug: string): string {
  return `${namespace}\u0000${slug}`;
}

/** Owns item-detail loading, related items, validation, and comparisons. */
export function createShellDetailViews({
  getState,
  render,
  roots,
  registries,
  catalogIndex,
  policy,
  fetchImpl,
  signal,
  basePath,
}: DetailDependencies) {
  const itemDetailCache = new Map<string, RegistryItemDetailResult>();
  const itemDetailLoading = new Set<string>();

  async function ensureItemDetailLoaded(
    key: string,
    namespace: string,
    slug: string,
  ): Promise<void> {
    if (signal.aborted || itemDetailLoading.has(key)) return;
    itemDetailLoading.add(key);

    try {
      const result = await loadRegistryItemDetailFromCatalogIndex(
        registries,
        catalogIndex,
        namespace,
        slug,
        policy,
        fetchImpl,
      );

      if (signal.aborted) return;
      itemDetailCache.set(key, result);
    } finally {
      itemDetailLoading.delete(key);
    }

    if (signal.aborted) return;
    const route = getState().route;

    if (isDetailRoute(route) && itemDetailKey(route.namespace, route.slug) === key) {
      render();
    }
  }

  function rejectInvalidAssetDetailRoute(
    route: Extract<CatalogRoute, { kind: "component" | "block" | "page" | "template" | "theme" }>,
    compact: ReturnType<typeof findRegistryCatalogItem>,
  ): boolean {
    if (compact) {
      const kind = assetKindForCatalogItem(compact, policy, route.namespace);

      const matches =
        route.kind === "component"
          ? kind === "component" || kind === "icon" || kind === "other"
          : kind === route.kind;

      if (matches) return false;
      renderEvidenceUnavailable(
        roots.contentHeader,
        roots.contentBody,
        "Asset route mismatch",
        route.namespace + " · " + route.slug,
        "This item belongs to " + (kind ?? "an unsupported type") + ", not " + route.kind + ".",
      );

      return true;
    }

    if (route.kind === "component") return false;
    renderEvidenceUnavailable(
      roots.contentHeader,
      roots.contentBody,
      "Asset not found",
      route.namespace + " · " + route.slug,
      "This item is not available in the requested catalog section.",
    );

    return true;
  }

  function renderDetail(
    route: Extract<CatalogRoute, { kind: "component" | "block" | "page" | "template" | "theme" }>,
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
      policy,
    );

    const relatedKind = compact
      ? assetKindForCatalogItem(compact, policy, route.namespace)
      : route.kind;

    const related = queryCatalogComponents(registries, catalogIndex, {
      policy,
      registryNames: [route.namespace],
      assetKinds: [relatedKind],
      pageSize: 9,
      sort: "name",
      basePath: basePath(),
    })
      .items.filter((item) => item.slug !== route.slug)
      .slice(0, 8);

    renderItemDetailView(
      roots.contentHeader,
      roots.contentBody,
      key ? (itemDetailCache.get(key) ?? summary) : summary,
      queued,
      policy,
      related,
    );

    if (key && needsItemDetailLoad(key, summary)) {
      void ensureItemDetailLoaded(key, route.namespace, route.slug);
    }
  }

  function needsItemDetailLoad(key: string, summary: RegistryItemDetailResult): boolean {
    return (
      !itemDetailCache.has(key) &&
      summary.status === "summary-only" &&
      summary.detail.route.status === "available"
    );
  }

  function renderCompare(): void {
    const state = getState();
    const registrySearch = state.facetSearchTerms["compare:registry"] ?? "";

    const availableRegistryNames = registries
      .filter((registry) =>
        Object.prototype.hasOwnProperty.call(catalogIndex.registries, registry.name),
      )
      .map((registry) => registry.name)
      .sort((a, b) => a.localeCompare(b));

    const result = buildCatalogComparison(registries, catalogIndex, state.compareRegistryNames, {
      policy,
      search: state.searchTerm,
      page: state.discoveryPage,
      basePath: basePath(),
    });

    renderCatalogCompare(
      roots.contentHeader,
      roots.contentBody,
      result,
      availableRegistryNames,
      registrySearch,
    );
  }

  return { renderDetail, renderCompare };
}
