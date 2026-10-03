import type {
  CoverageConfidence,
  CoverageStatus,
  ItemCatalogStatus,
  Registry,
  RegistryCatalogIndex,
  RegistryItemSummary,
  RegistryVisualReference,
} from '../core/registry.schema';
import { parseRegistryCatalogIndex } from '../core/registryCatalogIndex';
import {
  type MirrorValidationIssue,
  validateRegistryMirror,
} from '../core/registryMirror';

export interface RegistryMirrorMeta {
  source_url: string;
  synced_at: string;
  upstream_count: number;
  registry_count: number;
  local_count: number;
  validation_status: string;
  report_path: string;
}

export interface LoadedRegistryData {
  registries: Registry[];
  catalogIndex: RegistryCatalogIndex;
  meta: RegistryMirrorMeta;
  warnings: MirrorValidationIssue[];
}

interface RegistryMirrorRecord {
  official: {
    name: string;
    homepage: string;
    registry_url_template: string;
    description: string;
  };
  atlas?: {
    aliases?: string[];
    coverage_status?: CoverageStatus;
    confidence?: CoverageConfidence;
    notes?: string;
    catalog_status?: ItemCatalogStatus;
    comparison_evidence?: 'catalog' | 'stale-catalog' | 'none';
    catalog_item_count?: number;
    catalog_evidence_url?: string;
    item_summaries?: Array<{
      name: string;
      slug: string;
      title?: string;
      description?: string;
      type?: string;
      category?: string;
      source: string;
      provenance: string;
      catalog_status?: ItemCatalogStatus;
      catalogStatus?: ItemCatalogStatus;
      confidence?: CoverageConfidence;
      route_eligible?: boolean;
      routeEligible?: boolean;
      install_token?: string;
      installToken?: string;
      view_command?: string;
      viewCommand?: string;
      install_command?: string;
      installCommand?: string;
      raw_item_url?: string;
      rawItemUrl?: string;
      docs_url?: string;
      docsUrl?: string;
      preview_url?: string;
      previewUrl?: string;
      evidence_url?: string;
      evidenceUrl?: string;
      evidence_note?: string;
      evidenceNote?: string;
      dependencies?: string[];
      devDependencies?: string[];
      registryDependencies?: string[];
      files?: Array<{ path: string; type: string; target?: string }>;
      warnings?: string[];
    }>;
  };
  status?: {
    warnings?: string[];
  };
}

interface RegistryMirrorData {
  meta: RegistryMirrorMeta;
  registries: RegistryMirrorRecord[];
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function loadRegistries(fetchImpl: FetchLike = fetch): Promise<LoadedRegistryData> {
  const mirrorUrl = `${import.meta.env.BASE_URL}data/registries.json`;
  const catalogUrl = `${import.meta.env.BASE_URL}data/registry-catalog-items.json`;
  const visualUrl = `${import.meta.env.BASE_URL}data/component-previews.json`;
  const [response, catalogResponse] = await Promise.all([
    fetchImpl(mirrorUrl),
    fetchImpl(catalogUrl),
  ]);

  if (!response.ok) {
    throw new Error(`Registry mirror fetch failed: ${response.status} ${response.statusText}`);
  }
  if (!catalogResponse.ok) {
    throw new Error(`Registry catalog index fetch failed: ${catalogResponse.status} ${catalogResponse.statusText}`);
  }

  const mirrorData = await response.json() as unknown;
  const catalogData = await catalogResponse.json() as unknown;
  const catalogIndex = parseRegistryCatalogIndex(catalogData);
  // Visual captures are optional; missing evidence must never block registry browsing.
  const previewManifest = await fetchImpl(visualUrl).then(async response =>
    response.ok ? await response.json() as unknown : null).catch(() => null);
  const visualReferences = readVisualReferenceManifest(previewManifest, catalogIndex);
  const visualPreviews = Object.fromEntries(
    Object.entries(visualReferences).map(([key, entry]) => [key, entry.imageUrl]),
  );
  const validation = validateRegistryMirror(mirrorData);

  if (validation.errors.length > 0) {
    throw new Error(`Registry mirror validation failed: ${validation.errors.length} error(s)`);
  }

  const typedMirror = mirrorData as RegistryMirrorData;
  const warningsByNamespace = groupWarningsByNamespace(validation.warnings);

  return {
    meta: typedMirror.meta,
    catalogIndex: Object.assign(catalogIndex, { visualPreviews, visualReferences }),
    warnings: validation.warnings,
    registries: typedMirror.registries.map(record => ({
      name: record.official.name,
      url: record.official.homepage,
      description: record.official.description,
      atlas: {
        aliases: record.atlas?.aliases ?? [],
        coverageStatus: record.atlas?.coverage_status ?? 'unverified',
        confidence: record.atlas?.confidence ?? 'unknown',
        notes: record.atlas?.notes ?? '',
        catalogStatus: record.atlas?.catalog_status ?? 'unverified',
        comparisonEvidence: record.atlas?.comparison_evidence ?? 'none',
        catalogItemCount: record.atlas?.catalog_item_count ?? 0,
        catalogEvidenceUrl: record.atlas?.catalog_evidence_url || undefined,
      },
      itemSummaries: mapItemSummaries(record.atlas?.item_summaries ?? []),
      mirror: {
        officialName: record.official.name,
        registryUrlTemplate: record.official.registry_url_template,
        sourceUrl: typedMirror.meta.source_url,
        syncedAt: typedMirror.meta.synced_at,
        upstreamCount: typedMirror.meta.upstream_count,
        localCount: typedMirror.meta.local_count,
        warnings: [
          ...(record.status?.warnings ?? []),
          ...(warningsByNamespace.get(record.official.name) ?? []),
        ],
      },
    })),
  };
}

function mapItemSummaries(items: NonNullable<RegistryMirrorRecord['atlas']>['item_summaries']): RegistryItemSummary[] {
  return (items ?? []).map(item => ({
    name: item.name,
    slug: item.slug,
    title: item.title,
    description: item.description,
    type: item.type,
    category: item.category,
    source: item.source,
    provenance: item.provenance,
    catalogStatus: item.catalog_status ?? item.catalogStatus ?? 'unverified',
    confidence: item.confidence,
    routeEligible: item.route_eligible ?? item.routeEligible ?? false,
    installToken: item.install_token ?? item.installToken,
    viewCommand: item.view_command ?? item.viewCommand,
    installCommand: item.install_command ?? item.installCommand,
    rawItemUrl: item.raw_item_url ?? item.rawItemUrl,
    docsUrl: item.docs_url ?? item.docsUrl,
    previewUrl: item.preview_url ?? item.previewUrl,
    evidenceUrl: item.evidence_url ?? item.evidenceUrl,
    evidenceNote: item.evidence_note ?? item.evidenceNote,
    dependencies: item.dependencies,
    devDependencies: item.devDependencies,
    registryDependencies: item.registryDependencies,
    files: item.files,
    warnings: item.warnings,
  }));
}

export function readVisualPreviewManifest(
  input: unknown, catalog: RegistryCatalogIndex,
): Readonly<Record<string, string>> {
  return Object.fromEntries(Object.entries(readVisualReferenceManifest(input, catalog))
    .map(([key, entry]) => [key, entry.imageUrl]));
}

export function readVisualReferenceManifest(
  input: unknown, catalog: RegistryCatalogIndex,
): Readonly<Record<string, RegistryVisualReference>> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const data = input as Record<string, unknown>;
  if (data.schemaVersion !== 1 || !data.previews || typeof data.previews !== 'object'
    || Array.isArray(data.previews)) return {};
  const names = new Map(Object.entries(catalog.registries).map(([ns, items]) =>
    [ns, new Set(items.map(item => item.name))]));
  const previews: Record<string, RegistryVisualReference> = {};
  for (const [key, entry] of Object.entries(data.previews)) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) continue;
    const item = entry as Record<string, unknown>;
    if (typeof item.imageUrl !== 'string' || typeof item.officialPage !== 'string') continue;
    const separator = key.indexOf('/');
    if (separator < 1 || !names.get(key.slice(0, separator))?.has(key.slice(separator + 1))) continue;
    const local = item.imageUrl.startsWith('/Registry-Atlas/data/previews/')
      && !item.imageUrl.includes('..')
      && /^\/Registry-Atlas\/data\/previews\/[a-z0-9-]+(?:\/[a-z0-9-]+)*\.(?:jpe?g|png|webp)$/i.test(item.imageUrl);
    try {
      const official = new URL(item.officialPage);
      if (official.protocol !== 'https:' || official.username || official.password) continue;
      if (!local) {
        const visual = new URL(item.imageUrl);
        if (visual.protocol !== 'https:' || visual.origin !== official.origin
          || visual.username || visual.password
          || !/\.(?:svg|jpe?g|png|webp)$/i.test(visual.pathname)) continue;
      }
    } catch { continue; }
    previews[key] = { imageUrl: item.imageUrl, officialPage: new URL(item.officialPage).href };
  }
  return previews;
}

function groupWarningsByNamespace(warnings: readonly MirrorValidationIssue[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  warnings.forEach(warning => {
    if (!warning.namespace) {
      return;
    }

    const existing = grouped.get(warning.namespace) ?? [];
    existing.push(warning.message);
    grouped.set(warning.namespace, existing);
  });

  return grouped;
}
