import type {
  CoverageConfidence,
  CoverageStatus,
  ItemCatalogStatus,
  Registry,
  RegistryCatalogIndex,
  RegistryItemSummary,
  RegistrySourcePage,
} from '../core/registry.schema';
import { parseRegistryCatalogIndex } from '../core/registryCatalogIndex';
import {
  configureDefaultCatalogTaxonomy,
  parseCatalogTaxonomy,
  type CatalogTaxonomy,
} from '../core/catalogTaxonomy';
import { configureCatalogKindOverrides } from '../core/catalogCollections';
import { verifiedSourcePageUrl } from '../ui/sourcePageLink';
import {
  type MirrorValidationIssue,
  validateRegistryMirror,
} from '../core/registryMirror';
import {
  loadRuntimeDatabase,
  queryDocument,
  queryJsonRows,
  queryOptionalDocument,
  queryKeyedJson,
  queryMetaJson,
} from './runtimeDatabase';

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
  taxonomy: CatalogTaxonomy;
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

interface RegistryIconDocument {
  schema?: string;
  icons?: Record<string, {
    url?: string;
    source?: string;
    homepage?: string;
    observedAt?: string;
  }>;
}

type FetchLike = typeof fetch;

export async function loadRegistries(fetchImpl: FetchLike = fetch): Promise<LoadedRegistryData> {
  const database = await loadRuntimeDatabase('data/registry-atlas.sqlite.gz', fetchImpl);
  let mirrorData: RegistryMirrorData;
  let catalogData: unknown;
  let taxonomyData: unknown;
  let kindOverridesData: unknown;
  let sourcePageManifest: unknown;
  let registryIcons: RegistryIconDocument | null = null;
  const itemRoutes: Record<string, { url: string; status: string }> = {};
  const routePatterns: Record<string, Array<{
    urlTemplate: string;
    slugPrefix: string;
    source: string;
    checkedAt?: string;
  }>> = {};
  try {
    mirrorData = {
      meta: queryMetaJson<RegistryMirrorMeta>(database, 'registry_snapshot_meta'),
      registries: queryJsonRows<RegistryMirrorRecord>(
        database,
        'SELECT payload_json FROM atlas_registries ORDER BY namespace',
      ),
    };
    const catalogMeta = queryMetaJson<Record<string, unknown>>(database, 'catalog_snapshot_meta');
    const namespaceRows = database.exec(
      'SELECT namespace FROM atlas_catalog_namespaces ORDER BY namespace',
    )[0];
    const registries: Record<string, unknown[]> = {};
    if (namespaceRows) {
      const namespaceIndex = namespaceRows.columns.indexOf('namespace');
      for (const row of namespaceRows.values) {
        const namespace = String(row[namespaceIndex] ?? '');
        if (namespace) registries[namespace] = [];
      }
    }
    const catalogRows = database.exec(
      'SELECT namespace,payload_json FROM atlas_catalog_items ORDER BY namespace,name',
    )[0];
    if (catalogRows) {
      const namespaceIndex = catalogRows.columns.indexOf('namespace');
      const payloadIndex = catalogRows.columns.indexOf('payload_json');
      for (const row of catalogRows.values) {
        const namespace = String(row[namespaceIndex] ?? '');
        const payload = row[payloadIndex];
        if (!namespace || typeof payload !== 'string') continue;
        (registries[namespace] ??= []).push(JSON.parse(payload) as unknown);
      }
    }
    catalogData = { meta: catalogMeta, registries };
    taxonomyData = queryDocument(database, 'catalog-taxonomy');
    kindOverridesData = queryDocument(database, 'catalog-kind-overrides');
    registryIcons = queryOptionalDocument<RegistryIconDocument>(database, 'registry-icons');
    const pages = queryKeyedJson<RegistrySourcePage>(
      database,
      'SELECT namespace,slug,payload_json FROM atlas_source_pages ORDER BY namespace,slug',
      ['namespace', 'slug'],
    );

    const itemRouteRows = database.exec(
      'SELECT namespace,slug,source_url,status FROM atlas_item_routes ORDER BY namespace,slug',
    )[0];
    if (itemRouteRows) {
      const namespaceIndex = itemRouteRows.columns.indexOf('namespace');
      const slugIndex = itemRouteRows.columns.indexOf('slug');
      const urlIndex = itemRouteRows.columns.indexOf('source_url');
      const statusIndex = itemRouteRows.columns.indexOf('status');
      for (const row of itemRouteRows.values) {
        const namespace = String(row[namespaceIndex] ?? '');
        const slug = String(row[slugIndex] ?? '');
        const url = String(row[urlIndex] ?? '');
        const status = String(row[statusIndex] ?? '');
        if (!namespace || !slug || !url) continue;
        itemRoutes[`${namespace}/${slug}`] = { url, status };
      }
    }

    const patternRows = database.exec(
      'SELECT namespace,template,prefix,source,checked_at FROM atlas_route_patterns ORDER BY namespace,template,prefix',
    )[0];
    if (patternRows) {
      const namespaceIndex = patternRows.columns.indexOf('namespace');
      const templateIndex = patternRows.columns.indexOf('template');
      const prefixIndex = patternRows.columns.indexOf('prefix');
      const sourceIndex = patternRows.columns.indexOf('source');
      const checkedIndex = patternRows.columns.indexOf('checked_at');
      for (const row of patternRows.values) {
        const namespace = String(row[namespaceIndex] ?? '');
        const urlTemplate = String(row[templateIndex] ?? '');
        const slugPrefix = String(row[prefixIndex] ?? '');
        const source = String(row[sourceIndex] ?? '');
        const checkedAt = row[checkedIndex] === null ? '' : String(row[checkedIndex] ?? '');
        if (!namespace || !urlTemplate) continue;
        (routePatterns[namespace] ??= []).push({
          urlTemplate,
          slugPrefix,
          source,
          ...(checkedAt ? { checkedAt } : {}),
        });
      }
    }

    const sourcePageMeta = queryDocument<Record<string, unknown>>(
      database,
      'source-page-index-meta',
    );
    sourcePageManifest = { ...sourcePageMeta, pages };
  } finally {
    database.close();
  }

  const taxonomy = parseCatalogTaxonomy(taxonomyData);
  configureDefaultCatalogTaxonomy(taxonomy);
  configureCatalogKindOverrides(kindOverridesData);
  const catalogIndex = parseRegistryCatalogIndex(catalogData);
  const officialSites = mirrorData.registries.map(row => ({
    name: row.official?.name, url: row.official?.homepage,
  }));
  const sourcePages = readSourcePageManifest(sourcePageManifest, catalogIndex, officialSites);
  const validation = validateRegistryMirror(mirrorData);

  if (validation.errors.length > 0) {
    throw new Error(`Registry mirror validation failed: ${validation.errors.length} error(s)`);
  }

  const typedMirror = mirrorData as RegistryMirrorData;
  const warningsByNamespace = groupWarningsByNamespace(validation.warnings);

  return {
    meta: typedMirror.meta,
    catalogIndex: Object.assign(catalogIndex, { sourcePages, itemRoutes, routePatterns }),
    taxonomy,
    warnings: validation.warnings,
    registries: typedMirror.registries.map(record => ({
      name: record.official.name,
      url: record.official.homepage,
      description: record.official.description,
      iconUrl: registryIcons?.icons?.[record.official.name]?.url || undefined,
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
    evidenceUrl: item.evidence_url ?? item.evidenceUrl,
    evidenceNote: item.evidence_note ?? item.evidenceNote,
    dependencies: item.dependencies,
    devDependencies: item.devDependencies,
    registryDependencies: item.registryDependencies,
    files: item.files,
    warnings: item.warnings,
  }));
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

/** Optional evidence artifact. Unknown identities, hosts and tiers fail closed. */
export function readSourcePageManifest(
  input: unknown,
  catalog: RegistryCatalogIndex,
  registries: readonly { name: string; url: string }[],
): Readonly<Record<string, RegistrySourcePage>> {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return {};
  const manifest = input as Record<string, unknown>;
  if (manifest.schema !== 'registry-atlas-source-page-index/v1'
    || !manifest.pages || typeof manifest.pages !== 'object' || Array.isArray(manifest.pages)) return {};
  const roots = new Map(registries.map(registry => [registry.name, registry.url]));
  const names = new Map(Object.entries(catalog.registries).map(([namespace, items]) =>
    [namespace, new Set(items.map(item => item.name))]));
  const pages: Record<string, RegistrySourcePage> = {};
  for (const [token, value] of Object.entries(manifest.pages)) {
    const split = token.indexOf('/');
    if (split < 1 || !value || typeof value !== 'object' || Array.isArray(value)) continue;
    const namespace = token.slice(0, split), slug = token.slice(split + 1);
    if (!names.get(namespace)?.has(slug)) continue;
    const record = value as Record<string, unknown>;
    const validLevel = (record.level === 'reviewed'
        && ['reviewed-summary', 'component-page-verified'].includes(String(record.source)))
      || (record.level === 'sitemap' && record.source === 'official-sitemap')
      || (record.level === 'pattern' && record.source === 'verified-route-pattern');
    if (!validLevel || typeof record.url !== 'string') continue;
    if (record.level === 'sitemap' || record.level === 'pattern' || record.source === 'component-page-verified') {
      const observed = typeof record.observedAt === 'string' ? Date.parse(record.observedAt) : NaN;
      const age = Date.now() - observed;
      if (!Number.isFinite(age) || age < 0 || age > 30 * 24 * 60 * 60 * 1000) continue;
    }
    const url = verifiedSourcePageUrl(record.url, roots.get(namespace) ?? '');
    if (!url || url !== record.url) continue;
    pages[token] = { url, level: record.level as RegistrySourcePage['level'],
      source: record.source as RegistrySourcePage['source'],
      ...(record.level === 'sitemap' || record.level === 'pattern'
        ? { observedAt: record.observedAt as string } : {}) };
  }
  return pages;
}
