import { resolveRegistryItemRoute } from './itemRoutes';
import type {
  Registry,
  RegistryCatalogIndex,
  RegistryCatalogItem,
  RegistryItemSummary,
} from './registry.schema';

const DISCOVERABLE_REGISTRY_ITEM_TYPES = new Set([
  'registry:block',
  'registry:component',
  'registry:ui',
  'registry:page',
  'registry:item',
  'registry:style',
  'registry:theme',
  'registry:icon',
]);

export interface RegistryCatalogMatch {
  namespace: string;
  item: RegistryCatalogItem;
}

export interface RegistryCatalogSearchResult {
  matches: readonly RegistryCatalogMatch[];
  totalMatches: number;
  truncated: boolean;
}

export interface RegistryCatalogComponentOption {
  value: string;
  label: string;
  count: number;
}

export function parseRegistryCatalogIndex(value: unknown): RegistryCatalogIndex {
  if (!isRecord(value) || !isRecord(value.meta) || !isRecord(value.registries)) {
    throw new Error('Registry catalog index validation failed: expected meta and registries objects');
  }

  const registryCount = numberValue(value.meta.registry_count);
  const itemCount = numberValue(value.meta.item_count);
  if (registryCount === null || itemCount === null) {
    throw new Error('Registry catalog index validation failed: invalid counts');
  }

  const registries: Record<string, RegistryCatalogItem[]> = {};
  let parsedItemCount = 0;
  for (const [namespace, rawItems] of Object.entries(value.registries)) {
    if (!namespace.startsWith('@') || !Array.isArray(rawItems)) {
      throw new Error('Registry catalog index validation failed: invalid registry bucket');
    }

    const items = rawItems
      .map(rawItem => parseCatalogItem(rawItem))
      .filter((item): item is RegistryCatalogItem => item !== null);
    registries[namespace] = items;
    parsedItemCount += items.length;
  }

  if (
    Object.keys(registries).length !== registryCount
    || parsedItemCount !== itemCount
  ) {
    throw new Error('Registry catalog index validation failed: metadata counts do not match content');
  }

  return {
    meta: {
      source_url: optionalString(value.meta.source_url),
      source: optionalString(value.meta.source),
      synced_at: optionalString(value.meta.synced_at),
      generated_at: optionalString(value.meta.generated_at),
      registry_count: registryCount,
      item_count: itemCount,
    },
    registries,
  };
}

export function searchRegistryCatalog(
  index: RegistryCatalogIndex,
  search: string,
  selectedComponentValues: readonly string[] = [],
  limit = 1000,
  excludedKeys: ReadonlySet<string> = new Set(),
): RegistryCatalogSearchResult {
  const query = normalize(search);
  const selected = new Set(selectedComponentValues.map(registryCatalogItemIdentity).filter(Boolean));
  if (!query && selected.size === 0) {
    return { matches: [], totalMatches: 0, truncated: false };
  }

  const matches: RegistryCatalogMatch[] = [];
  let totalMatches = 0;

  for (const [namespace, items] of Object.entries(index.registries)) {
    for (const item of items) {
      const values = [item.name, item.title].filter(Boolean).map(value => normalize(String(value)));
      const matchesQuery = !query || values.some(value => matchesSearch(value, query));
      const matchesSelection = selected.size === 0 || selected.has(registryCatalogItemIdentity(item.name));
      const key = `${namespace}:${registryCatalogItemIdentity(item.name)}`;
      if (!matchesQuery || !matchesSelection || excludedKeys.has(key)) continue;

      totalMatches += 1;
      if (matches.length < limit) matches.push({ namespace, item });
    }
  }

  return {
    matches,
    totalMatches,
    truncated: totalMatches > matches.length,
  };
}

export function searchRegistryCatalogComponentOptions(
  index: RegistryCatalogIndex,
  search: string,
  limit = 25,
): RegistryCatalogComponentOption[] {
  const query = normalize(search);
  if (!query) return [];

  const options = new Map<string, RegistryCatalogComponentOption>();
  for (const items of Object.values(index.registries)) {
    for (const item of items) {
      const values = [item.name, item.title].filter(Boolean).map(value => normalize(String(value)));
      if (!values.some(value => matchesSearch(value, query))) continue;

      const key = registryCatalogItemIdentity(item.name);
      const existing = options.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        options.set(key, {
          value: item.name,
          label: item.title ?? titleCase(item.name),
          count: 1,
        });
      }
    }
  }

  return [...options.values()]
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
    .slice(0, limit);
}

export function findRegistryCatalogItem(
  index: RegistryCatalogIndex,
  namespace: string,
  slug: string,
): RegistryCatalogItem | undefined {
  const wanted = registryCatalogItemIdentity(slug);
  return index.registries[namespace]?.find(item => registryCatalogItemIdentity(item.name) === wanted);
}

export function compactCatalogItemToSummary(
  registry: Registry,
  item: RegistryCatalogItem,
): RegistryItemSummary {
  const route = registry.mirror
    ? resolveRegistryItemRoute(registry.name, registry.mirror.registryUrlTemplate, item.name)
    : null;
  const evidenceUrl = registry.atlas?.catalogEvidenceUrl;
  return {
    name: item.title ?? item.name,
    slug: item.name,
    title: item.title,
    type: item.type,
    category: item.categories?.[0],
    source: 'registry-catalog-index',
    provenance: evidenceUrl ?? 'machine-readable registry catalog',
    catalogStatus: 'available',
    confidence: 'high',
    routeEligible: route?.status === 'available',
    rawItemUrl: route?.status === 'available' ? route.url : undefined,
    evidenceUrl,
  };
}

function parseCatalogItem(value: unknown): RegistryCatalogItem | null {
  if (!isRecord(value)) {
    throw new Error('Registry catalog index validation failed: item is not an object');
  }

  const type = optionalString(value.type);
  if (!type) {
    throw new Error('Registry catalog index validation failed: item requires a type');
  }
  if (!DISCOVERABLE_REGISTRY_ITEM_TYPES.has(type)) return null;

  const name = optionalString(value.name);
  if (!name) {
    throw new Error('Registry catalog index validation failed: discoverable item requires a name');
  }

  const title = optionalString(value.title);
  let categories: string[] | undefined;
  if (value.categories !== undefined) {
    if (!Array.isArray(value.categories) || !value.categories.every(item => typeof item === 'string')) {
      throw new Error('Registry catalog index validation failed: item categories must be strings');
    }
    categories = value.categories.map(item => item.trim()).filter(Boolean);
  }

  return {
    name,
    type,
    ...(title ? { title } : {}),
    ...(categories?.length ? { categories } : {}),
  };
}

export function registryCatalogItemIdentity(value: string): string {
  return value.trim().toLowerCase();
}

function matchesSearch(value: string, query: string): boolean {
  if (value.includes(query) || query.includes(value)) return true;
  const words = query.split('-').filter(word => word.length >= 3);
  return words.length > 1 && words.every(word => value.includes(word));
}

function normalize(value: string): string {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

function titleCase(value: string): string {
  return value.replace(/[-_]+/g, ' ').replace(/\b\w/g, character => character.toUpperCase());
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function numberValue(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) && value >= 0 ? value : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
