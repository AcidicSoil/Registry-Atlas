import {
  componentTaxonomyAliases,
  componentTaxonomyCategoryLabel,
  componentTaxonomyEntry,
  componentTaxonomyLabel,
  componentTaxonomySearchValues,
  expandComponentSearchTerms,
  normalizeTaxonomySearchTerm,
  taxonomyTagsForValues,
} from './componentTaxonomy.ts';
import { coverageStatusLabel, compareCoverageStatus } from './coverageStatus.ts';
import { getInstallActionState } from './installActions.ts';
import { resolveRegistryItemRoute } from './itemRoutes.ts';
import type {
  CandidateMatchField,
  ComponentCandidate,
  DiscoveryOverview,
  Registry,
  RegistryItemSummary,
  ComponentTag,
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
  return normalizeTaxonomySearchTerm(value);
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
  const queryTerms = expandComponentSearchTerms(query);
  return itemSearchValues(item).some(value => matchesAnyQueryTerm(value, queryTerms));
}

function itemSearchValues(item: RegistryItemSummary): string[] {
  const tags = itemTaxonomyTags(item);
  return [
    item.name,
    item.slug,
    item.title,
    item.description,
    item.type,
    item.category,
    ...(item.componentTagsExisting ?? []),
    ...(item.componentTagsProposed ?? []),
    ...(item.dependencies ?? []),
    ...(item.devDependencies ?? []),
    ...(item.registryDependencies ?? []),
    ...tags.flatMap(tag => componentTaxonomySearchValues(tag)),
  ]
    .filter(Boolean)
    .map(value => normalizeSearchTerm(String(value)));
}

function matchesAnyQueryTerm(value: string, queryTerms: readonly string[]): boolean {
  return queryTerms.some(term => value.includes(term) || term.includes(value));
}

function matchesDirectQueryTerm(value: string, queryTerms: readonly string[]): boolean {
  return queryTerms.some(term => value === term || (term.length >= 3 && value.startsWith(term)));
}

function itemTaxonomyTags(item: RegistryItemSummary): ComponentTag[] {
  return taxonomyTagsForValues([
    item.category,
    ...(item.componentTagsExisting ?? []),
    ...(item.componentTagsProposed ?? []),
  ]);
}

function taxonomyTagLabels(tags: readonly ComponentTag[]): string[] {
  return tags.map(tag => componentTaxonomyLabel(tag));
}

function taxonomyCategoryLabels(tags: readonly ComponentTag[]): string[] {
  return [...new Set(tags
    .map(tag => componentTaxonomyEntry(tag)?.category)
    .filter((category): category is NonNullable<ReturnType<typeof componentTaxonomyEntry>>['category'] => Boolean(category))
    .map(category => componentTaxonomyCategoryLabel(category))
    .filter(Boolean))];
}

function taxonomyMatchReason(item: RegistryItemSummary, query: string): string {
  if (!query) return 'Known item summary match';
  const queryTerms = expandComponentSearchTerms(query);
  const tags = itemTaxonomyTags(item);
  if (tags.some(tag => matchesDirectTaxonomyTerm(tag, queryTerms))) {
    return 'Taxonomy tag match';
  }
  if ([item.category, item.type].filter(Boolean).some(value => matchesDirectQueryTerm(normalizeSearchTerm(String(value)), queryTerms))) {
    return 'Taxonomy category match';
  }
  return 'Known item summary match';
}

function taxonomyMatchBonus(item: RegistryItemSummary, query: string): number {
  if (!query) return 0;
  const queryTerms = expandComponentSearchTerms(query);
  const tags = itemTaxonomyTags(item);
  return tags.some(tag => matchesDirectTaxonomyTerm(tag, queryTerms)) ? 60 : 0;
}

function matchesDirectTaxonomyTerm(tag: ComponentTag, queryTerms: readonly string[]): boolean {
  const entry = componentTaxonomyEntry(tag);
  const values = [
    tag,
    entry?.label,
    ...(entry ? entry.exampleItems.map(item => item.slug) : []),
    ...componentTaxonomyAliases(tag),
  ]
    .filter((value): value is string => Boolean(value))
    .map(normalizeSearchTerm);

  return values.some(value => matchesDirectQueryTerm(value, queryTerms));
}

function statusDisplayFor(
  catalogStatus: RegistryItemSummary['catalogStatus'],
  coverageStatus: NonNullable<Registry['atlas']>['coverageStatus'],
): { label: string; explanation: string } {
  if (catalogStatus === 'available') {
    return {
      label: 'catalog-backed',
      explanation: 'Registry Atlas has a concrete catalog item for this result.',
    };
  }
  if (coverageStatus === 'inferred' || catalogStatus === 'partial') {
    return {
      label: 'inferred',
      explanation: 'Registry Atlas can match this result, but catalog evidence is incomplete.',
    };
  }
  if (catalogStatus === 'unavailable') {
    return {
      label: 'unavailable',
      explanation: 'No verified item catalog is available for this result yet.',
    };
  }
  return {
    label: 'manual follow-up',
    explanation: 'This result needs manual review before stronger item actions are shown.',
  };
}

function buildItemCandidate(registry: Registry, item: RegistryItemSummary, query: string): ComponentCandidate {
  const atlas = atlasOf(registry);
  const exact = query.length > 0 && (normalizeSearchTerm(item.name) === query || normalizeSearchTerm(item.slug) === query);
  const tags = itemTaxonomyTags(item);
  const statusDisplay = statusDisplayFor(item.catalogStatus, atlas.coverageStatus);
  const route = item.routeEligible && registry.mirror
    ? resolveRegistryItemRoute(registry.name, registry.mirror.registryUrlTemplate, item.slug, item.rawItemUrl)
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
    itemDescription: item.description ?? item.title,
    taxonomyTagLabels: taxonomyTagLabels(tags),
    taxonomyCategoryLabels: taxonomyCategoryLabels(tags),
    statusDisplayLabel: statusDisplay.label,
    statusExplanation: statusDisplay.explanation,
    itemSource: item.source,
    itemProvenance: item.provenance,
    rawItemUrl: item.rawItemUrl,
    docsUrl: item.docsUrl,
    evidenceUrl: item.evidenceUrl,
    dependencyCount: item.dependencies?.length ?? 0,
    registryDependencyCount: item.registryDependencies?.length ?? 0,
    fileCount: item.files?.length ?? 0,
    catalogStatus: item.catalogStatus,
    routeEligible: item.routeEligible,
    route: route?.status === 'available' ? route.url : undefined,
    installAction: getInstallActionState({
      namespace: registry.name,
      itemSlug: item.slug,
      routeEligible: item.routeEligible,
      registryUrlTemplate: registry.mirror?.registryUrlTemplate,
      rawItemUrl: item.rawItemUrl,
    }),
    matchReasons: [exact ? 'Exact item match' : taxonomyMatchReason(item, query)],
    coverageStatus: atlas.coverageStatus,
    coverageLabel: coverageStatusLabel(atlas.coverageStatus),
    confidence: atlas.confidence,
    score: FIELD_SCORE.item + (exact ? 100 : 0) + taxonomyMatchBonus(item, query) + catalogBonus(item.catalogStatus),
    warnings: registry.mirror?.warnings ?? [],
  };
}

function buildFallbackCandidate(registry: Registry, query: string): ComponentCandidate | null {
  const atlas = atlasOf(registry);
  const checks: Array<[CandidateMatchField, string, string[]]> = [
    ['component-tag', findRegistryTagMatch(registry.component_tags, query), ['Taxonomy tag match']],
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
    installAction: getInstallActionState({
      namespace: registry.name,
      itemSlug: null,
      routeEligible: false,
      registryUrlTemplate: registry.mirror?.registryUrlTemplate,
      isFallbackCandidate: true,
      fallbackReason: 'Inferred/fallback candidate; install command unavailable.',
    }),
    matchReasons,
    coverageStatus: atlas.coverageStatus,
    coverageLabel: coverageStatusLabel(atlas.coverageStatus),
    confidence: atlas.confidence,
    score: FIELD_SCORE[matchedField] + catalogBonus(atlas.catalogStatus),
    warnings: registry.mirror?.warnings ?? [],
  };
}

function findRegistryTagMatch(tags: readonly ComponentTag[], query: string): string {
  if (!query) return tags[0] ?? '';
  const queryTerms = expandComponentSearchTerms(query);
  const match = tags.find(tag => {
    const values = [tag, componentTaxonomyLabel(tag), ...componentTaxonomySearchValues(tag)]
      .map(value => normalizeSearchTerm(String(value)));
    return values.some(value => matchesAnyQueryTerm(value, queryTerms));
  });
  return match ?? '';
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
