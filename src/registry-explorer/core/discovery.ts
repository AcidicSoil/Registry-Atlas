import { coverageStatusLabel, compareCoverageStatus } from './coverageStatus.ts';
import { resolveRegistryItemRoute } from './itemRoutes.ts';
import type {
  CandidateMatchField,
  ComponentCandidate,
  DiscoveryOverview,
  Registry,
  RegistryItemSummary,
} from './registry.schema.ts';

const FIELD_SCORE: Record<CandidateMatchField, number> = {
  item: 1000,
  'component-tag': 800,
  alias: 600,
  focus: 500,
  namespace: 400,
  description: 300,
  metadata: 200,
};

export function normalizeSearchTerm(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '-');
}

export function buildDiscoveryOverview(registries: readonly Registry[]): DiscoveryOverview {
  const knownItemCount = registries.reduce((count, registry) => count + (registry.itemSummaries ?? []).length, 0);
  return {
    totalRegistries: registries.length,
    knownItemCount,
    routeEligibleItemCount: registries.reduce(
      (count, registry) => count + (registry.itemSummaries ?? []).filter(item => item.routeEligible).length,
      0,
    ),
    verifiedRegistryCount: registries.filter(registry => atlasOf(registry).coverageStatus === 'verified').length,
    unverifiedRegistryCount: registries.filter(registry => atlasOf(registry).coverageStatus === 'unverified').length,
  };
}

export function searchComponentCandidates(
  registries: readonly Registry[],
  search: string,
): ComponentCandidate[] {
  const query = normalizeSearchTerm(search);
  const candidates: ComponentCandidate[] = [];

  registries.forEach(registry => {
    const itemCandidates = (registry.itemSummaries ?? [])
      .filter(item => matchesItem(item, query))
      .map(item => buildItemCandidate(registry, item, query));
    candidates.push(...itemCandidates);

    if (itemCandidates.length > 0) return;

    const fallback = buildFallbackCandidate(registry, query);
    if (fallback) candidates.push(fallback);
  });

  return candidates.sort(compareCandidates);
}

function atlasOf(registry: Registry): NonNullable<Registry['atlas']> {
  return registry.atlas ?? {
    aliases: [],
    coverageStatus: 'unverified',
    confidence: 'unknown',
    notes: '',
    catalogStatus: 'unverified',
  };
}

function matchesItem(item: RegistryItemSummary, query: string): boolean {
  if (!query) return true;
  return [item.name, item.slug, item.type, item.category]
    .filter(Boolean)
    .some(value => normalizeSearchTerm(String(value)).includes(query));
}

function buildItemCandidate(registry: Registry, item: RegistryItemSummary, query: string): ComponentCandidate {
  const atlas = atlasOf(registry);
  const exact = query.length > 0 && (normalizeSearchTerm(item.name) === query || item.slug === query);
  const route = item.routeEligible && registry.mirror
    ? resolveRegistryItemRoute(registry.name, registry.mirror.registryUrlTemplate, item.slug)
    : null;

  return {
    id: `${registry.name}:${item.slug}`,
    registry,
    matchedLabel: item.name,
    matchedField: 'item',
    itemName: item.name,
    itemSlug: item.slug,
    itemType: item.type,
    itemCategory: item.category,
    itemSource: item.source,
    itemProvenance: item.provenance,
    catalogStatus: item.catalogStatus,
    routeEligible: item.routeEligible,
    route: route?.status === 'available' ? route.url : undefined,
    matchReasons: [exact ? 'Exact item match' : 'Known item summary match'],
    coverageStatus: atlas.coverageStatus,
    coverageLabel: coverageStatusLabel(atlas.coverageStatus),
    confidence: atlas.confidence,
    score: FIELD_SCORE.item + (exact ? 100 : 0) + catalogBonus(item.catalogStatus),
    warnings: registry.mirror?.warnings ?? [],
  };
}

function buildFallbackCandidate(registry: Registry, query: string): ComponentCandidate | null {
  const atlas = atlasOf(registry);
  const checks: Array<[CandidateMatchField, string, string[]]> = [
    ['component-tag', registry.component_tags.find(tag => !query || normalizeSearchTerm(tag).includes(query)) ?? '', ['Component tag match']],
    ['alias', atlas.aliases.find(alias => !query || normalizeSearchTerm(alias).includes(query)) ?? '', ['Why this matched: alias match']],
    ['focus', registry.primary_focus.find(focus => !query || normalizeSearchTerm(focus).includes(query)) ?? '', ['Focus tag match']],
    ['namespace', !query || normalizeSearchTerm(registry.name).includes(query) ? registry.name : '', ['Namespace match']],
    ['description', !query || normalizeSearchTerm(registry.description).includes(query) ? registry.description : '', ['Description match']],
  ];
  const match = checks.find(([, label]) => label.length > 0);
  if (!match) return null;

  const [matchedField, matchedLabel, matchReasons] = match;
  return {
    id: `${registry.name}:${matchedField}`,
    registry,
    matchedLabel,
    matchedField,
    catalogStatus: atlas.catalogStatus,
    routeEligible: false,
    matchReasons,
    coverageStatus: atlas.coverageStatus,
    coverageLabel: coverageStatusLabel(atlas.coverageStatus),
    confidence: atlas.confidence,
    score: FIELD_SCORE[matchedField] + catalogBonus(atlas.catalogStatus),
    warnings: registry.mirror?.warnings ?? [],
  };
}

function catalogBonus(status: string): number {
  if (status === 'available') return 40;
  if (status === 'partial') return 20;
  return 0;
}

function compareCandidates(a: ComponentCandidate, b: ComponentCandidate): number {
  if (b.score !== a.score) return b.score - a.score;
  const coverage = compareCoverageStatus(a.coverageStatus, b.coverageStatus);
  if (coverage !== 0) return coverage;
  return a.registry.name.localeCompare(b.registry.name);
}
