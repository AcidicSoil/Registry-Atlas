import { getInstallActionState } from './installActions.ts';
import { resolveRegistryItemRoute, type ResolvedItemRoute } from './itemRoutes.ts';
import type {
  InstallActionState,
  CoverageConfidence,
  Registry,
  RegistryItemSummary,
  RegistryItemSummaryFile,
} from './registry.schema.ts';

export type RegistryItemDetailErrorStatus =
  | 'route-unavailable'
  | 'not-found'
  | 'fetch-error'
  | 'invalid-json'
  | 'invalid-schema';

export interface RegistryItemDetail {
  registry: Registry;
  summary: RegistryItemSummary;
  namespace: string;
  slug: string;
  name: string;
  title: string;
  description: string | null;
  type: string | null;
  category: string | null;
  taxonomyLabels: readonly string[];
  catalogStatus: RegistryItemSummary['catalogStatus'];
  confidence: CoverageConfidence | 'unknown';
  source: string;
  provenance: string;
  route: ResolvedItemRoute;
  installAction: InstallActionState;
  docsUrl: string | null;
  previewUrl: string | null;
  evidenceUrl: string | null;
  componentPageUrl: string | null;
  dependencies: readonly string[];
  devDependencies: readonly string[];
  registryDependencies: readonly string[];
  files: readonly RegistryItemSummaryFile[];
  warnings: readonly string[];
  visualStatus: 'available' | 'unavailable';
  loadedFromJson: boolean;
  /** Internal agent/maintainer data only. Do not render this in the normal user UI. */
  rawSource?: unknown;
}

export type RegistryItemDetailResult =
  | {
      status: 'loaded';
      detail: RegistryItemDetail;
      message: null;
    }
  | {
      status: 'summary-only';
      detail: RegistryItemDetail;
      message: string;
    }
  | {
      status: RegistryItemDetailErrorStatus;
      detail: RegistryItemDetail | null;
      message: string;
      reason: string;
    };

export interface RegistryItemDetailJson {
  name?: unknown;
  title?: unknown;
  description?: unknown;
  type?: unknown;
  category?: unknown;
  dependencies?: unknown;
  devDependencies?: unknown;
  registryDependencies?: unknown;
  files?: unknown;
}

export function resolveRegistryItemDetailFromSummary(
  registries: readonly Registry[],
  namespace: string | null | undefined,
  itemSlug: string | null | undefined,
  sourceJson?: unknown,
): RegistryItemDetailResult {
  const registryName = namespace?.trim() ?? '';
  const slug = itemSlug?.trim() ?? '';

  const registry = registries.find(item => item.name === registryName);
  if (!registry) {
    return notFound('Registry not found.', 'missing-registry');
  }

  const summary = registry.itemSummaries?.find(item => item.slug === slug);
  if (!summary) {
    return notFound('Item not found in registry catalog.', 'missing-item');
  }

  const base = buildBaseDetail(registry, summary);
  if (base.route.status !== 'available') {
    return {
      status: 'route-unavailable',
      detail: base,
      message: 'Item route unavailable.',
      reason: base.route.status,
    };
  }

  if (sourceJson === undefined) {
    return {
      status: 'summary-only',
      detail: base,
      message: 'Full item JSON was not loaded; showing catalog summary details.',
    };
  }

  const normalized = normalizeRegistryItemDetailJson(sourceJson);
  if (!normalized.valid) {
    return {
      status: 'invalid-schema',
      detail: base,
      message: 'Registry item data did not match the expected safe shape.',
      reason: normalized.reason,
    };
  }

  return {
    status: 'loaded',
    detail: mergeDetailJson(base, normalized.item, sourceJson),
    message: null,
  };
}

export function buildBaseDetail(registry: Registry, summary: RegistryItemSummary): RegistryItemDetail {
  const route = summary.routeEligible
    ? resolveRegistryItemRoute(
        registry.name,
        registry.mirror?.registryUrlTemplate ?? '',
        summary.slug,
        summary.rawItemUrl,
      )
    : {
        status: 'catalog-not-verified' as const,
        label: 'Catalog not verified' as const,
        url: null,
      };
  const installAction = getInstallActionState({
    namespace: registry.name,
    itemSlug: summary.slug,
    routeEligible: summary.routeEligible,
    registryUrlTemplate: registry.mirror?.registryUrlTemplate,
    rawItemUrl: summary.rawItemUrl,
  });
  const docsUrl = summary.docsUrl ?? null;
  const previewUrl = summary.previewUrl ?? null;

  return {
    registry,
    summary,
    namespace: registry.name,
    slug: summary.slug,
    name: summary.name,
    title: summary.title ?? summary.name,
    description: summary.description ?? null,
    type: summary.type ?? null,
    category: summary.category ?? null,
    taxonomyLabels: [...(summary.componentTagsExisting ?? []), ...(summary.componentTagsProposed ?? [])],
    catalogStatus: summary.catalogStatus,
    confidence: summary.confidence ?? registry.atlas?.confidence ?? 'unknown',
    source: summary.source,
    provenance: summary.provenance,
    route,
    installAction,
    docsUrl,
    previewUrl,
    evidenceUrl: summary.evidenceUrl ?? null,
    componentPageUrl: previewUrl ?? docsUrl ?? null,
    dependencies: summary.dependencies ?? [],
    devDependencies: summary.devDependencies ?? [],
    registryDependencies: summary.registryDependencies ?? [],
    files: summary.files ?? [],
    warnings: summary.warnings ?? [],
    visualStatus: previewUrl ? 'available' : 'unavailable',
    loadedFromJson: false,
  };
}

export function normalizeRegistryItemDetailJson(value: unknown):
  | { valid: true; item: Required<Pick<RegistryItemDetailJson, 'dependencies' | 'devDependencies' | 'registryDependencies' | 'files'>> & RegistryItemDetailJson }
  | { valid: false; reason: string } {
  if (!isRecord(value)) {
    return { valid: false, reason: 'item-json-not-object' };
  }

  const files = normalizeFiles(value.files);
  if (!files.valid) return { valid: false, reason: files.reason };

  const dependencies = normalizeStringArray(value.dependencies, 'dependencies');
  if (!dependencies.valid) return { valid: false, reason: dependencies.reason };

  const devDependencies = normalizeStringArray(value.devDependencies, 'devDependencies');
  if (!devDependencies.valid) return { valid: false, reason: devDependencies.reason };

  const registryDependencies = normalizeStringArray(value.registryDependencies, 'registryDependencies');
  if (!registryDependencies.valid) return { valid: false, reason: registryDependencies.reason };

  return {
    valid: true,
    item: {
      name: optionalString(value.name),
      title: optionalString(value.title),
      description: optionalString(value.description),
      type: optionalString(value.type),
      category: optionalString(value.category),
      dependencies: dependencies.items,
      devDependencies: devDependencies.items,
      registryDependencies: registryDependencies.items,
      files: files.items,
    },
  };
}

export function invalidJsonResult(detail: RegistryItemDetail | null, reason = 'invalid-json'): RegistryItemDetailResult {
  return {
    status: 'invalid-json',
    detail,
    message: 'Registry item JSON could not be parsed safely.',
    reason,
  };
}

export function fetchErrorResult(detail: RegistryItemDetail | null, reason = 'fetch-error'): RegistryItemDetailResult {
  return {
    status: 'fetch-error',
    detail,
    message: 'Registry item could not be loaded from the network.',
    reason,
  };
}

function mergeDetailJson(detail: RegistryItemDetail, item: RegistryItemDetailJson, rawSource: unknown): RegistryItemDetail {
  const dependencies = arrayOrFallback(item.dependencies, detail.dependencies);
  const devDependencies = arrayOrFallback(item.devDependencies, detail.devDependencies);
  const registryDependencies = arrayOrFallback(item.registryDependencies, detail.registryDependencies);
  const files = Array.isArray(item.files) ? item.files as readonly RegistryItemSummaryFile[] : detail.files;

  return {
    ...detail,
    name: optionalString(item.name) ?? detail.name,
    title: optionalString(item.title) ?? optionalString(item.name) ?? detail.title,
    description: optionalString(item.description) ?? detail.description,
    type: optionalString(item.type) ?? detail.type,
    category: optionalString(item.category) ?? detail.category,
    dependencies,
    devDependencies,
    registryDependencies,
    files,
    loadedFromJson: true,
    rawSource,
  };
}

function notFound(message: string, reason: string): RegistryItemDetailResult {
  return {
    status: 'not-found',
    detail: null,
    message,
    reason,
  };
}

function normalizeStringArray(value: unknown, field: string): { valid: true; items: readonly string[] } | { valid: false; reason: string } {
  if (value === undefined) return { valid: true, items: [] };
  if (!Array.isArray(value)) return { valid: false, reason: `${field}-not-array` };
  if (!value.every(item => typeof item === 'string')) return { valid: false, reason: `${field}-contains-non-string` };
  return { valid: true, items: value };
}

function normalizeFiles(value: unknown): { valid: true; items: readonly RegistryItemSummaryFile[] } | { valid: false; reason: string } {
  if (value === undefined) return { valid: true, items: [] };
  if (!Array.isArray(value)) return { valid: false, reason: 'files-not-array' };

  const files: RegistryItemSummaryFile[] = [];
  for (const file of value) {
    if (!isRecord(file)) return { valid: false, reason: 'files-contains-non-object' };
    const path = optionalString(file.path);
    const type = optionalString(file.type);
    const target = optionalString(file.target);
    if (!path || !type) return { valid: false, reason: 'file-missing-path-or-type' };
    files.push(target ? { path, type, target } : { path, type });
  }

  return { valid: true, items: files };
}

function arrayOrFallback<T>(value: unknown, fallback: readonly T[]): readonly T[] {
  return Array.isArray(value) ? value as readonly T[] : fallback;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
