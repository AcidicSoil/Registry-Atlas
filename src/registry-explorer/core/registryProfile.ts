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

function itemRow(registry: Registry, item: NonNullable<Registry['itemSummaries']>[number]): RegistryProfileItemRow {
  const route = item.routeEligible && registry.mirror
    ? resolveRegistryItemRoute(registry.name, registry.mirror.registryUrlTemplate, item.slug)
    : null;

  return {
    name: item.name,
    slug: item.slug,
    type: item.type,
    category: item.category,
    catalogStatus: item.catalogStatus,
    source: item.source,
    provenance: item.provenance,
    routeEligible: item.routeEligible,
    route: route?.status === 'available' ? route.url : undefined,
    routeLabel: route?.status === 'available' ? route.label : 'Catalog not verified',
    installAction: getInstallActionState({
      namespace: registry.name,
      itemSlug: item.slug,
      routeEligible: item.routeEligible,
      registryUrlTemplate: registry.mirror?.registryUrlTemplate,
    }),
  };
}
