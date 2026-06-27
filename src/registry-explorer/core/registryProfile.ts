import {
  componentTaxonomyCategoryLabel,
  componentTaxonomyEntry,
  componentTaxonomyLabel,
  taxonomyTagsForValues,
} from './componentTaxonomy.ts';
import { coverageStatusLabel } from './coverageStatus.ts';
import { getInstallActionState } from './installActions.ts';
import { resolveRegistryItemRoute } from './itemRoutes.ts';
import type {
  ComponentCandidate,
  Registry,
  RegistryProfile,
  RegistryProfileFact,
  RegistryProfileItemRow,
  RegistryProfileSection,
} from './registry.schema.ts';

export interface BuildRegistryProfileOptions {
  candidate?: ComponentCandidate;
  relatedCandidates?: readonly ComponentCandidate[];
}

export function buildRegistryProfile(
  registry: Registry,
  options: BuildRegistryProfileOptions = {},
): RegistryProfile {
  const sections: RegistryProfileSection[] = [
    {
      name: 'Official shadcn facts',
      facts: officialFacts(registry),
    },
    {
      name: 'Registry Atlas enrichment',
      facts: atlasFacts(registry),
    },
    {
      name: 'Item discovery status',
      items: (registry.itemSummaries ?? []).map(item => itemRow(registry, item)),
    },
  ];

  if (options.candidate) {
    sections.push({
      name: 'Why this matched',
      facts: [
        { label: 'Matched field', value: options.candidate.matchedField },
        { label: 'Matched label', value: options.candidate.matchedLabel },
        { label: 'Match reasons', value: options.candidate.matchReasons },
      ],
    });
  }

  return { registry, sections };
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

function officialFacts(registry: Registry): RegistryProfileFact[] {
  return [
    { label: 'Namespace', value: registry.name },
    { label: 'Homepage/source URL', value: registry.url, url: registry.url },
    { label: 'Registry URL template', value: registry.mirror?.registryUrlTemplate ?? '' },
    { label: 'Official source URL', value: registry.mirror?.sourceUrl ?? '', url: registry.mirror?.sourceUrl },
    { label: 'Last sync', value: registry.mirror?.syncedAt ?? '' },
    { label: 'Upstream count', value: registry.mirror?.upstreamCount ?? 0 },
    { label: 'Local count', value: registry.mirror?.localCount ?? 0 },
    { label: 'Warning count', value: registry.mirror?.warnings.length ?? 0 },
  ];
}

function atlasFacts(registry: Registry): RegistryProfileFact[] {
  const atlas = atlasOf(registry);
  return [
    { label: 'Focus tags', value: registry.primary_focus },
    { label: 'Component tags', value: registry.component_tags },
    { label: 'Aliases', value: atlas.aliases },
    { label: 'Notes', value: atlas.notes },
    { label: 'Confidence', value: atlas.confidence },
    { label: 'Coverage status', value: coverageStatusLabel(atlas.coverageStatus) },
  ];
}

function statusDisplayFor(
  catalogStatus: NonNullable<Registry['itemSummaries']>[number]['catalogStatus'],
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

function itemRow(registry: Registry, item: NonNullable<Registry['itemSummaries']>[number]): RegistryProfileItemRow {
  const route = item.routeEligible && registry.mirror
    ? resolveRegistryItemRoute(registry.name, registry.mirror.registryUrlTemplate, item.slug, item.rawItemUrl)
    : null;
  const taxonomyTags = taxonomyTagsForValues([
    item.category,
    ...(item.componentTagsExisting ?? []),
    ...(item.componentTagsProposed ?? []),
  ]);
  const taxonomyCategoryLabels = [...new Set(taxonomyTags
    .map(tag => componentTaxonomyEntry(tag)?.category)
    .filter(Boolean)
    .map(category => componentTaxonomyCategoryLabel(category))
    .filter(Boolean))];
  const statusDisplay = statusDisplayFor(item.catalogStatus, atlasOf(registry).coverageStatus);

  return {
    name: item.name,
    slug: item.slug,
    type: item.type,
    category: item.category,
    catalogStatus: item.catalogStatus,
    confidence: item.confidence,
    source: item.source,
    provenance: item.provenance,
    description: item.description ?? item.title,
    taxonomyTagLabels: taxonomyTags.map(componentTaxonomyLabel),
    taxonomyCategoryLabels,
    statusDisplayLabel: statusDisplay.label,
    statusExplanation: statusDisplay.explanation,
    rawItemUrl: item.rawItemUrl,
    docsUrl: item.docsUrl,
    evidenceUrl: item.evidenceUrl,
    previewUrl: item.previewUrl,
    componentPageUrl: item.previewUrl ?? item.docsUrl ?? (route?.status === 'available' ? route.url : undefined),
    dependencyCount: item.dependencies?.length ?? 0,
    registryDependencyCount: item.registryDependencies?.length ?? 0,
    fileCount: item.files?.length ?? 0,
    routeEligible: item.routeEligible,
    route: route?.status === 'available' ? route.url : undefined,
    routeLabel: route?.status === 'available' ? route.label : 'Catalog not verified',
    installAction: getInstallActionState({
      namespace: registry.name,
      itemSlug: item.slug,
      routeEligible: item.routeEligible,
      registryUrlTemplate: registry.mirror?.registryUrlTemplate,
      rawItemUrl: item.rawItemUrl,
    }),
  };
}
