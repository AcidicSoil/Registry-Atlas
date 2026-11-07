import type { RawJsonInput } from "../core/jsonInput";
import { isInputObject, isInputString } from "../core/inputChecks";
import type {
  CoverageConfidence,
  CoverageStatus,
  ItemCatalogStatus,
  Registry,
  RegistryCatalogIndex,
  RegistryItemSummary,
  RegistrySourcePage,
} from "../core/registry.schema";
import { parseRegistryCatalogIndex } from "../core/registryCatalogIndex";
import { parseCatalogPolicy, type CatalogPolicy } from "../core/catalogPolicy";
import { verifiedSourcePageUrl } from "../core/sourcePageValidation";
import { type MirrorValidationIssue, validateRegistryMirror } from "../core/registryMirror";
import { loadRuntimeJson } from "./runtimeJson";

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
  policy: CatalogPolicy;
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
    comparison_evidence?: "catalog" | "stale-catalog" | "none";
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
  icons?: Record<
    string,
    {
      url?: string;
      source?: string;
      homepage?: string;
      observedAt?: string;
    }
  >;
}

type FetchLike = typeof fetch;

interface RuntimeSnapshot {
  mirror: RawJsonInput;
  catalog: RawJsonInput;
  taxonomy: RawJsonInput;
  kindOverrides: RawJsonInput;
  registryIcons: RegistryIconDocument | null;
  sourcePageManifest: RawJsonInput;
  itemRoutes: NonNullable<RegistryCatalogIndex["itemRoutes"]>;
  routePatterns: NonNullable<RegistryCatalogIndex["routePatterns"]>;
}

function parseRuntimeSnapshot(value: RawJsonInput): RuntimeSnapshot {
  if (!isRecord(value)) throw new Error("Runtime snapshot validation failed: invalid envelope");

  if (
    ![
      value.mirror,
      value.catalog,
      value.taxonomy,
      value.kindOverrides,
      value.sourcePageManifest,
      value.itemRoutes,
      value.routePatterns,
    ].every(isRecord)
  )
    throw new Error("Runtime snapshot validation failed: invalid envelope");

  // SAFETY: Envelope members are checked here; nested icon and route evidence is validated by its consumer.
  return {
    mirror: value.mirror,
    catalog: value.catalog,
    taxonomy: value.taxonomy,
    kindOverrides: value.kindOverrides,
    registryIcons: isRecord(value.registryIcons)
      ? (value.registryIcons as RegistryIconDocument)
      : null,
    sourcePageManifest: value.sourcePageManifest,
    itemRoutes: value.itemRoutes as NonNullable<RegistryCatalogIndex["itemRoutes"]>,
    routePatterns: value.routePatterns as NonNullable<RegistryCatalogIndex["routePatterns"]>,
  };
}

function isRecord(value: RawJsonInput): value is Record<string, RawJsonInput> {
  return isInputObject(value) && value !== null && !Array.isArray(value);
}

function registryReviewMetadata(record: RegistryMirrorRecord) {
  return {
    coverageStatus: record.atlas?.coverage_status ?? "unverified",
    confidence: record.atlas?.confidence ?? "unknown",
  };
}

function registryCatalogMetadata(record: RegistryMirrorRecord) {
  return {
    catalogStatus: record.atlas?.catalog_status ?? "unverified",
    comparisonEvidence: record.atlas?.comparison_evidence ?? "none",
    catalogItemCount: record.atlas?.catalog_item_count ?? 0,
  };
}

function registryCoverageMetadata(record: RegistryMirrorRecord) {
  return { ...registryReviewMetadata(record), ...registryCatalogMetadata(record) };
}

function registryAtlasMetadata(record: RegistryMirrorRecord) {
  return {
    aliases: record.atlas?.aliases ?? [],
    notes: record.atlas?.notes ?? "",
    catalogEvidenceUrl: record.atlas?.catalog_evidence_url || undefined,
    ...registryCoverageMetadata(record),
  };
}

function registryMirrorMetadata(
  record: RegistryMirrorRecord,
  meta: RegistryMirrorMeta,
  warnings: ReadonlyMap<string, string[]>,
) {
  return {
    officialName: record.official.name,
    registryUrlTemplate: record.official.registry_url_template,
    sourceUrl: meta.source_url,
    syncedAt: meta.synced_at,
    upstreamCount: meta.upstream_count,
    localCount: meta.local_count,
    warnings: [...(record.status?.warnings ?? []), ...(warnings.get(record.official.name) ?? [])],
  };
}

function mapMirrorRegistry(
  record: RegistryMirrorRecord,
  meta: RegistryMirrorMeta,
  icons: RegistryIconDocument | null,
  warnings: ReadonlyMap<string, string[]>,
): Registry {
  return {
    name: record.official.name,
    url: record.official.homepage,
    description: record.official.description,
    iconUrl: icons?.icons?.[record.official.name]?.url || undefined,
    atlas: registryAtlasMetadata(record),
    itemSummaries: mapItemSummaries(record.atlas?.item_summaries ?? []),
    mirror: registryMirrorMetadata(record, meta, warnings),
  };
}

export async function loadRegistries(fetchImpl: FetchLike = fetch): Promise<LoadedRegistryData> {
  const snapshot = await loadRuntimeJson(
    "data/registry-atlas.json.gz",
    parseRuntimeSnapshot,
    fetchImpl,
  );

  const validation = validateRegistryMirror(snapshot.mirror);

  if (validation.errors.length > 0) {
    throw new Error(`Registry mirror validation failed: ${validation.errors.length} error(s)`);
  }

  // SAFETY: validateRegistryMirror checked record array, metadata counts and nested record invariants.
  const mirror = snapshot.mirror as RegistryMirrorData;
  const policy = parseCatalogPolicy(snapshot.taxonomy, snapshot.kindOverrides);
  const catalogIndex = parseRegistryCatalogIndex(snapshot.catalog, policy);

  const officialSites = mirror.registries.map((row) => ({
    name: row.official?.name,
    url: row.official?.homepage,
  }));

  const sourcePages = readSourcePageManifest(
    snapshot.sourcePageManifest,
    catalogIndex,
    officialSites,
  );

  const warningsByNamespace = groupWarningsByNamespace(validation.warnings);

  return {
    meta: mirror.meta,
    catalogIndex: Object.assign(catalogIndex, {
      sourcePages,
      itemRoutes: snapshot.itemRoutes,
      routePatterns: snapshot.routePatterns,
    }),
    policy,
    warnings: validation.warnings,
    registries: mirror.registries.map((record) =>
      mapMirrorRegistry(record, mirror.meta, snapshot.registryIcons, warningsByNamespace),
    ),
  };
}

type RawSummary = NonNullable<RegistryMirrorRecord["atlas"]>["item_summaries"];

type SummaryRecord = NonNullable<RawSummary>[number];

function mappedSummaryIdentity(item: SummaryRecord) {
  return {
    name: item.name,
    slug: item.slug,
    title: item.title,
    description: item.description,
    type: item.type,
    category: item.category,
    source: item.source,
    provenance: item.provenance,
    catalogStatus: item.catalog_status ?? item.catalogStatus ?? "unverified",
    confidence: item.confidence,
  };
}

function mappedSummaryActions(item: SummaryRecord) {
  return {
    routeEligible: item.route_eligible ?? item.routeEligible ?? false,
    installToken: item.install_token ?? item.installToken,
    viewCommand: item.view_command ?? item.viewCommand,
    installCommand: item.install_command ?? item.installCommand,
    rawItemUrl: item.raw_item_url ?? item.rawItemUrl,
    docsUrl: item.docs_url ?? item.docsUrl,
  };
}

function mapItemSummary(item: SummaryRecord): RegistryItemSummary {
  return {
    ...mappedSummaryIdentity(item),
    ...mappedSummaryActions(item),
    evidenceUrl: item.evidence_url ?? item.evidenceUrl,
    evidenceNote: item.evidence_note ?? item.evidenceNote,
    dependencies: item.dependencies,
    devDependencies: item.devDependencies,
    registryDependencies: item.registryDependencies,
    files: item.files,
    warnings: item.warnings,
  };
}

function mapItemSummaries(items: RawSummary): RegistryItemSummary[] {
  return (items ?? []).map(mapItemSummary);
}

function groupWarningsByNamespace(
  warnings: readonly MirrorValidationIssue[],
): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  warnings.forEach((warning) => {
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
function isKnownSourceProvenance(record: Record<string, RawJsonInput>): boolean {
  const reviewed =
    record.level === "reviewed" &&
    ["reviewed-summary", "component-page-verified"].includes(String(record.source));

  const sitemap = record.level === "sitemap" && record.source === "official-sitemap";
  const pattern = record.level === "pattern" && record.source === "verified-route-pattern";
  const observed = record.level === "observed" && record.source === "documented-anchor";

  return reviewed || sitemap || pattern || observed;
}

function sourceProvenanceIsFresh(record: Record<string, RawJsonInput>): boolean {
  if (
    (record.level === "reviewed" && record.source !== "component-page-verified") ||
    (record.level === "observed" && record.source === "documented-anchor")
  )
    return true;
  const observed = isInputString(record.observedAt) ? Date.parse(record.observedAt) : NaN;
  const age = Date.now() - observed;

  return Number.isFinite(age) && age >= 0 && age <= 30 * 24 * 60 * 60 * 1000;
}

function sourceManifestIdentity(
  token: string,
  knownNames: ReadonlyMap<string, ReadonlySet<string>>,
): string | null {
  const split = token.indexOf("/");

  if (split < 1) return null;
  const namespace = token.slice(0, split);

  return knownNames.get(namespace)?.has(token.slice(split + 1)) ? namespace : null;
}

function sourceManifestRecord(
  value: RawJsonInput,
): (Record<string, RawJsonInput> & { url: string }) | null {
  if (!value || !isInputObject(value) || Array.isArray(value)) return null;
  // SAFETY: The upstream manifest record was checked for ownership, enum provenance and URL validity before this projection.
  const record = value as Record<string, RawJsonInput>;

  if (!isKnownSourceProvenance(record) || !isInputString(record.url)) return null;

  // SAFETY: The upstream manifest record was checked for ownership, enum provenance and URL validity before this projection.
  return sourceProvenanceIsFresh(record)
    ? (record as Record<string, RawJsonInput> & { url: string })
    : null;
}

function recognizedSourcePage(
  token: string,
  value: RawJsonInput,
  knownNames: ReadonlyMap<string, ReadonlySet<string>>,
  roots: ReadonlyMap<string, string>,
): RegistrySourcePage | null {
  const namespace = sourceManifestIdentity(token, knownNames);

  if (!namespace) return null;
  const record = sourceManifestRecord(value);

  if (!record) return null;
  const url = verifiedSourcePageUrl(record.url, roots.get(namespace) ?? "");

  if (!url || url !== record.url) return null;

  return materializeSourcePage(url, record);
}

function materializeSourcePage(
  url: string,
  record: Record<string, RawJsonInput>,
): RegistrySourcePage {
  // SAFETY: The record was validated for provenance and URL origin by the caller.
  const page = {
    url,
    level: record.level as RegistrySourcePage["level"],
    source: record.source as RegistrySourcePage["source"],
  };

  if (
    (record.level === "sitemap" || record.level === "pattern" || record.level === "observed") &&
    isInputString(record.observedAt)
  )
    return { ...page, observedAt: record.observedAt };

  return page;
}

type VerifiedSourcePages = Readonly<Record<string, RegistrySourcePage>>;

function validatedSourceManifestPages(input: RawJsonInput): Record<string, RawJsonInput> | null {
  if (!isRecord(input) || input.schema !== "registry-atlas-source-page-index/v1") return null;

  return isRecord(input.pages) ? input.pages : null;
}

export function readSourcePageManifest(
  input: RawJsonInput,
  catalog: RegistryCatalogIndex,
  registries: readonly { name: string; url: string }[],
): VerifiedSourcePages {
  const manifestPages = validatedSourceManifestPages(input);

  if (!manifestPages) return {};
  const roots = new Map(registries.map((registry) => [registry.name, registry.url]));

  const knownNames = new Map(
    Object.entries(catalog.registries).map(([namespace, items]) => [
      namespace,
      new Set(items.map((item) => item.name)),
    ]),
  );

  const pages = new Map<string, RegistrySourcePage>();

  for (const [token, value] of Object.entries(manifestPages)) {
    const page = recognizedSourcePage(token, value, knownNames, roots);

    if (page) pages.set(token, page);
  }

  return Object.fromEntries(pages);
}
