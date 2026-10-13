import type { RawJsonInput } from './jsonInput';
import { isInputNumber, isInputObject, isInputString } from './inputChecks';
import { resolveRegistryItemRoute } from './itemRoutes';
import { catalogTaxonomyNodeMap, getDefaultCatalogTaxonomy } from './catalogTaxonomy';
import type {
  CatalogCanonicalKind,
  Registry,
  RegistryCatalogAccess,
  RegistryCatalogCanonical,
  RegistryCatalogIndex,
  RegistryCatalogItem,
  RegistryItemSummary,
  RegistryThemePreview,
  RegistryThemeSwatch,
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

const CATALOG_CANONICAL_KINDS = new Set<CatalogCanonicalKind>([
  'component', 'block', 'page', 'template', 'theme', 'icon', 'other',
]);

const CANONICAL_ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

const THEME_SWATCH_KEYS: readonly RegistryThemeSwatch[] = [
  'background', 'foreground', 'primary', 'secondary', 'accent', 'muted', 'card',
];

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

type ParsedCatalogBuckets = Record<string, RegistryCatalogItem[]>;

function parsedCatalogBuckets(raw: Record<string, RawJsonInput>): ParsedCatalogBuckets {
  const registries = new Map<string, RegistryCatalogItem[]>();

  for (const [namespace, rawItems] of Object.entries(raw)) {
    if (!namespace.startsWith('@') || !Array.isArray(rawItems)) {
      throw new Error('Registry catalog index validation failed: invalid registry bucket');
    }

    registries.set(namespace, rawItems.map(parseCatalogItem)
      .filter((item): item is RegistryCatalogItem => item !== null));
  }

  return Object.fromEntries(registries);
}

export function parseRegistryCatalogIndex(value: RawJsonInput): RegistryCatalogIndex {
  if (!isRecord(value) || !isRecord(value.meta) || !isRecord(value.registries)) {
    throw new Error('Registry catalog index validation failed: expected meta and registries objects');
  }

  const registryCount = numberValue(value.meta.registry_count);
  const itemCount = numberValue(value.meta.item_count);

  if (registryCount === null || itemCount === null) {
    throw new Error('Registry catalog index validation failed: invalid counts');
  }

  const registries = parsedCatalogBuckets(value.registries);
  const parsedItemCount = Object.values(registries).reduce((sum, items) => sum + items.length, 0);

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

function matchesRegistryCatalogItem(
  namespace: string, item: RegistryCatalogItem, query: string,
  selected: ReadonlySet<string>, excludedKeys: ReadonlySet<string>,
): boolean {
  const identity = registryCatalogItemIdentity(item.name);

  if (selected.size && !selected.has(identity)) return false;

  if (excludedKeys.has(namespace + ':' + identity)) return false;
  const values = [item.name, item.title].flatMap(value => value ? [normalize(String(value))] : []);

  return !query || values.some(value => matchesSearch(value, query));
}

export function searchRegistryCatalog(
  index: RegistryCatalogIndex,
  search: string,
  selectedComponentValues: readonly string[] = [],
  limit = 1000,
  excludedKeys: ReadonlySet<string> = new Set(),
): RegistryCatalogSearchResult {
  const query = normalize(search);

  const selected = new Set(selectedComponentValues.flatMap(value => { const id=registryCatalogItemIdentity(value);

 return id ? [id] : []; }));

  if (!query && selected.size === 0) {
    return { matches: [], totalMatches: 0, truncated: false };
  }

  const matches: RegistryCatalogMatch[] = [];
  let totalMatches = 0;

  for (const [namespace, items] of Object.entries(index.registries)) {
    for (const item of items) {
      if (!matchesRegistryCatalogItem(namespace, item, query, selected, excludedKeys)) continue;
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
      const values = [item.name, item.title].flatMap(value => value ? [normalize(String(value))] : []);

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
    ? resolveRegistryItemRoute(
        registry.name,
        registry.mirror.registryUrlTemplate,
        item.name,
        item.rawItemUrl,
      )
    : null;

  const evidenceUrl = registry.atlas?.catalogEvidenceUrl;
  const pathLeaf = item.name.split('/').filter(Boolean).at(-1) ?? item.name;

  return {
    name: item.title ?? pathLeaf,
    slug: item.name,
    title: item.title,
    description: item.description,
    author: item.author,
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

function parseStringArray(value: RawJsonInput, field: 'categories' | 'sourceGroups'): string[] | undefined {
  if (value === undefined) return undefined;
  const nonempty = field === 'sourceGroups';

  if (!Array.isArray(value) || value.some(item =>
    !isInputString(item) || (nonempty && !item.trim()))) {
    throw new Error(field === 'categories'
      ? 'Registry catalog index validation failed: item categories must be strings'
      : 'Registry catalog index validation failed: item sourceGroups must be non-empty strings');
  }

  return value.map((item: string) => item.trim()).filter(value => nonempty || !!value);
}

function parseItemFileCount(value: RawJsonInput): number | null {
  if (value === undefined) return null;
  const count = numberValue(value);

  if (count === null || !Number.isInteger(count)) {
    throw new Error('Registry catalog index validation failed: item fileCount must be a non-negative integer');
  }

  return count;
}

function optionalCatalogTextFields(value: Record<string, RawJsonInput>): Pick<RegistryCatalogItem, 'rawItemUrl' | 'title' | 'description' | 'author'> {
  const title = optionalString(value.title);
  const rawItemUrl = optionalString(value.rawItemUrl);
  const description = optionalString(value.description);
  const author = optionalString(value.author);

  const fields: Pick<RegistryCatalogItem, 'rawItemUrl' | 'title' | 'description' | 'author'> = {};

  if (rawItemUrl) fields.rawItemUrl = rawItemUrl;

  if (title) fields.title = title;

  if (description) fields.description = description;

  if (author) fields.author = author;

  return fields;
}

function optionalTaxonomyFields(value: Record<string, RawJsonInput>): Pick<RegistryCatalogItem, 'categories' | 'kind' | 'canonical'> {
  const categories = parseStringArray(value.categories, 'categories');
  const kind = value.kind === undefined ? undefined : parseCanonicalKind(value.kind);
  const canonical = value.canonical === undefined ? undefined : parseCanonical(value.canonical);

  const fields: Pick<RegistryCatalogItem, 'categories' | 'kind' | 'canonical'> = {};

  if (categories?.length) fields.categories = categories;

  if (kind) fields.kind = kind;

  if (canonical) fields.canonical = canonical;

  return fields;
}

function optionalSourceFields(value: Record<string, RawJsonInput>): Pick<RegistryCatalogItem, 'sourceGroups' | 'access'> {
  const sourceGroups = parseStringArray(value.sourceGroups, 'sourceGroups');
  const access = value.access === undefined ? undefined : parseAccess(value.access);

  const fields: Pick<RegistryCatalogItem, 'sourceGroups' | 'access'> = {};

  if (sourceGroups?.length) fields.sourceGroups = sourceGroups;

  if (access) fields.access = access;

  return fields;
}

function optionalClassificationFields(value: Record<string, RawJsonInput>) {
  return { ...optionalTaxonomyFields(value), ...optionalSourceFields(value) };
}

function optionalPreviewFields(value: Record<string, RawJsonInput>): Pick<RegistryCatalogItem, 'fileCount' | 'themePreview'> {
  const fileCount = parseItemFileCount(value.fileCount);
  const themePreview = value.themePreview === undefined ? undefined : parseThemePreview(value.themePreview);

  const fields: Pick<RegistryCatalogItem, 'fileCount' | 'themePreview'> = {};

  if (fileCount !== null) fields.fileCount = fileCount;

  if (themePreview) fields.themePreview = themePreview;

  return fields;
}

function optionalCatalogMetadataFields(value: Record<string, RawJsonInput>) {
  return { ...optionalClassificationFields(value), ...optionalPreviewFields(value) };
}

function optionalCatalogItemFields(value: Record<string, RawJsonInput>) {
  return { ...optionalCatalogTextFields(value), ...optionalCatalogMetadataFields(value) };
}

function parseCatalogItem(value: RawJsonInput): RegistryCatalogItem | null {
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

  return { name, type, ...optionalCatalogItemFields(value) };
}

function isApprovedCanonicalKind(value: string): value is CatalogCanonicalKind {
  return [...CATALOG_CANONICAL_KINDS].some(kind => kind === value);
}

function parseCanonicalKind(value: RawJsonInput): CatalogCanonicalKind {
  if (!isInputString(value) || !isApprovedCanonicalKind(value)) {
    throw new Error('Registry catalog index validation failed: item kind is invalid');
  }

  return value;
}

function validatedCanonicalPrimary(value: RawJsonInput): string | null {
  if (value === null) return null;
  const primary = optionalString(value);

  if (!primary) throw new Error('Registry catalog index validation failed: item canonical primary is invalid');

  return primary;
}

function validatedCanonicalPath(value: RawJsonInput): string[] {
  if (!Array.isArray(value) || value.some(id => !isInputString(id) || !CANONICAL_ID_PATTERN.test(id))) {
    throw new Error('Registry catalog index validation failed: item canonical path is invalid');
  }

  // SAFETY: The value is checked against the matching supported schema or finite enum before this narrow type is used.
  return [...value] as string[];
}

function verifyCanonicalAncestors(path: string[]): void {
  for (let index = 0; index < path.length; index += 1) {
    const id = path[index]!;
    const segments = id.split('/');

    if (index === 0) {
      if (segments.length !== 1) {
        throw new Error('Registry catalog index validation failed: item canonical path must start at a root');
      }
    } else {
      const parent = path[index - 1]!;

      if (!id.startsWith(parent + '/') || segments.length !== parent.split('/').length + 1) {
        throw new Error('Registry catalog index validation failed: item canonical path must be hierarchical');
      }
    }
  }
}

function verifyCanonicalHierarchy(path: string[], primary: string | null): void {
  if (primary === null) {
    if (path.length) throw new Error('Registry catalog index validation failed: item canonical path must be empty when primary is null');

    return;
  }

  if (!CANONICAL_ID_PATTERN.test(primary) || !path.length || path.at(-1) !== primary) {
    throw new Error('Registry catalog index validation failed: item canonical path must end at primary');
  }

  verifyCanonicalAncestors(path);
}

function verifyApprovedCanonicalPath(path: string[], primary: string | null): void {
  const taxonomy = getDefaultCatalogTaxonomy();

  if (!taxonomy || primary === null) return;
  const approved = catalogTaxonomyNodeMap(taxonomy).get(primary);

  if (!approved) throw new Error('Registry catalog index validation failed: unknown canonical taxonomy node');
  const approvedPath = primary.split('/').map((_, index, parts) => parts.slice(0, index + 1).join('/'));

  if (approvedPath.length !== path.length || approvedPath.some((id, index) => id !== path[index])) {
    throw new Error('Registry catalog index validation failed: item canonical path does not match approved taxonomy');
  }
}

function parseCanonical(value: RawJsonInput): RegistryCatalogCanonical {
  if (!isRecord(value)) {
    throw new Error('Registry catalog index validation failed: item canonical must be an object');
  }

  const taxonomyVersion = optionalString(value.taxonomyVersion);

  if (!taxonomyVersion) {
    throw new Error('Registry catalog index validation failed: item canonical taxonomyVersion is required');
  }

  const configuredTaxonomy = getDefaultCatalogTaxonomy();

  if (configuredTaxonomy && taxonomyVersion !== configuredTaxonomy.version) {
    throw new Error('Registry catalog index validation failed: item canonical taxonomy version is not the approved runtime taxonomy');
  }

  const primary = validatedCanonicalPrimary(value.primary);
  const path = validatedCanonicalPath(value.path);
  verifyCanonicalHierarchy(path, primary);
  verifyApprovedCanonicalPath(path, primary);

  return { taxonomyVersion, primary, path };
}

function parseAccess(value: RawJsonInput): RegistryCatalogAccess {
  if (!isRecord(value) || (value.normalized !== 'free' && value.normalized !== 'paid')) {
    throw new Error('Registry catalog index validation failed: item access normalized value is invalid');
  }

  const sourceLabel = optionalString(value.sourceLabel);

  if (!sourceLabel) {
    throw new Error('Registry catalog index validation failed: item access sourceLabel is required');
  }

  return { normalized: value.normalized, sourceLabel };
}

function parseThemeSwatches(value: RawJsonInput, mode: 'light' | 'dark'):
  Partial<Record<RegistryThemeSwatch, string>> | undefined {
  if (value === undefined) return undefined;

  if (!isRecord(value)) {
    throw new Error(`Registry catalog index validation failed: themePreview.${mode} must be an object`);
  }

  const swatches: Partial<Record<RegistryThemeSwatch, string>> = {};

  for (const [key, raw] of Object.entries(value)) {
    if (!isThemeSwatch(key)) {
      throw new Error(`Registry catalog index validation failed: unsupported theme swatch ${key}`);
    }

    const swatch = optionalString(raw);

    if (!swatch) throw new Error(`Registry catalog index validation failed: theme swatch ${key} must be a string`);
    swatches[key] = swatch;
  }

  return Object.keys(swatches).length ? swatches : undefined;
}

function parseThemePreview(value: RawJsonInput): RegistryThemePreview | undefined {
  if (!isRecord(value)) {
    throw new Error('Registry catalog index validation failed: item themePreview must be an object');
  }

  const light = parseThemeSwatches(value.light, 'light');
  const dark = parseThemeSwatches(value.dark, 'dark');

  if (!light && !dark) return undefined;
  const preview: RegistryThemePreview = {};

  if (light) preview.light = light;

  if (dark) preview.dark = dark;

  return preview;
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

function optionalString(value: RawJsonInput): string | undefined {
  return isInputString(value) && value.trim() ? value.trim() : undefined;
}

function isThemeSwatch(value: string): value is RegistryThemeSwatch {
  return THEME_SWATCH_KEYS.some(key => key === value);
}

function numberValue(value: RawJsonInput): number | null {
  return isInputNumber(value) && Number.isFinite(value) && value >= 0 ? value : null;
}

function isRecord(value: RawJsonInput): value is Record<string, RawJsonInput> {
  return isInputObject(value) && value !== null && !Array.isArray(value);
}
