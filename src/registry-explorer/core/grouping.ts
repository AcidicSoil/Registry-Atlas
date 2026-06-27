import {
  componentTaxonomyCategory,
  componentTaxonomyCategoryLabel,
  componentTaxonomyLabel,
  componentTaxonomySearchValues,
  expandComponentSearchTerms,
  normalizeTaxonomySearchTerm,
} from './componentTaxonomy';
import type {
  Registry,
  FocusGroup,
  ComponentGroup,
  MatrixRow,
  RegistryExplorerMetrics,
  ComponentTag,
  PrimaryFocus,
  CoverageStatusCounts,
  MatrixCell,
} from './registry.schema';
import { focusLabel, componentLabel } from './labels';
import { coverageStatusLabel } from './coverageStatus';

export function filterRegistries(
  registries: readonly Registry[],
  search: string
): Registry[] {
  const term = normalizeTaxonomySearchTerm(search);
  if (!term) return [...registries];
  const searchTerms = expandComponentSearchTerms(search);

  return registries.filter((r) => {
    const haystack = [
      r.name,
      r.description,
      r.framework || '',
      r.license || '',
      ...r.primary_focus,
      ...r.component_tags,
      ...r.component_tags.map(componentTaxonomyLabel),
      ...r.component_tags.flatMap(componentTaxonomySearchValues),
      ...(r.itemSummaries ?? []).flatMap(item => [
        item.name,
        item.slug,
        item.title ?? '',
        item.description ?? '',
        item.category ?? '',
        ...(item.componentTagsExisting ?? []),
        ...(item.componentTagsProposed ?? []),
      ]),
    ]
      .map(value => normalizeTaxonomySearchTerm(String(value)))
      .filter(Boolean);
    return haystack.some(value => searchTerms.some(searchTerm => value.includes(searchTerm) || searchTerm.includes(value)));
  });
}

export function countCoverageStatuses(registries: readonly Registry[]): CoverageStatusCounts {
  const counts: CoverageStatusCounts = {
    verified: 0,
    inferred: 0,
    partial: 0,
    unavailable: 0,
    unverified: 0,
  };

  registries.forEach(registry => {
    const status = registry.atlas?.coverageStatus ?? 'unverified';
    counts[status] += 1;
  });

  return counts;
}

export function buildFocusGroups(
  registries: readonly Registry[],
  search: string
): FocusGroup[] {
  const filtered = filterRegistries(registries, search);
  const groups = new Map<PrimaryFocus, Registry[]>();

  filtered.forEach((r) => {
    r.primary_focus.forEach((f) => {
      if (!groups.has(f)) {
        groups.set(f, []);
      }
      groups.get(f)!.push(r);
    });
  });

  const result: FocusGroup[] = [];
  groups.forEach((items, key) => {
    result.push({
      focusKey: key,
      label: focusLabel(key),
      registries: items.sort((a, b) => a.name.localeCompare(b.name)),
      count: items.length,
      statusCounts: countCoverageStatuses(items),
    });
  });

  return result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

export function buildComponentGroups(
  registries: readonly Registry[],
  search: string
): ComponentGroup[] {
  const filtered = filterRegistries(registries, search);
  const groups = new Map<ComponentTag, Registry[]>();

  filtered.forEach((r) => {
    r.component_tags.forEach((t) => {
      if (!groups.has(t)) {
        groups.set(t, []);
      }
      groups.get(t)!.push(r);
    });
  });

  const result: ComponentGroup[] = [];
  groups.forEach((items, key) => {
    result.push({
      componentKey: key,
      label: componentLabel(key),
      categoryLabel: componentTaxonomyCategoryLabel(componentTaxonomyCategory(key)),
      registries: items.sort((a, b) => a.name.localeCompare(b.name)),
      count: items.length,
      statusCounts: countCoverageStatuses(items),
    });
  });

  return result.sort((a, b) => {
    if (b.count !== a.count) return b.count - a.count;
    return a.label.localeCompare(b.label);
  });
}

export function buildMatrixRows(
  registries: readonly Registry[],
  search: string,
  columns: readonly ComponentTag[]
): MatrixRow[] {
  const filtered = filterRegistries(registries, search);
  // Sort rows by name
  const sorted = [...filtered].sort((a, b) => a.name.localeCompare(b.name));

  return sorted.map((r) => {
    const cells: MatrixCell[] = columns.map((col) => {
      const matched = r.component_tags.includes(col);
      const status: MatrixCell['status'] = matched ? (r.atlas?.coverageStatus ?? 'unverified') : 'absent';
      return {
        componentKey: col,
        matched,
        status,
        label: status === 'absent' ? 'No known tag match' : coverageStatusLabel(status),
      };
    });
    return {
      registry: r,
      coverage: cells.map(cell => cell.matched),
      cells,
    };
  });
}

export function computeMetrics(
  registries: readonly Registry[],
  search: string
): RegistryExplorerMetrics {
  const filtered = filterRegistries(registries, search);
  
  const focuses = new Set<PrimaryFocus>();
  filtered.forEach(r => r.primary_focus.forEach(f => focuses.add(f)));

  const components = new Set<ComponentTag>();
  filtered.forEach(r => r.component_tags.forEach(c => components.add(c)));

  return {
    totalRegistries: registries.length,
    visibleRegistries: filtered.length,
    focusGroupCount: focuses.size,
    componentTypeCount: components.size,
  };
}
