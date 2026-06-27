import type { ComponentCandidate, Registry, RegistryProfileItemRow } from './registry.schema.ts';

export type ComponentFilterDimension = 'type' | 'category' | 'tag' | 'visual' | 'status';

export interface ComponentFilterOption {
  dimension: ComponentFilterDimension;
  value: string;
  label: string;
  count: number;
}

export interface ComponentFilterGroup {
  dimension: ComponentFilterDimension;
  label: string;
  options: readonly ComponentFilterOption[];
}

export interface SelectedComponentFilter {
  dimension: ComponentFilterDimension;
  value: string;
  label: string;
}

const GROUP_LABELS: Record<ComponentFilterDimension, string> = {
  type: 'Type',
  category: 'Category',
  tag: 'Tag',
  visual: 'Visual',
  status: 'Status',
};

export function buildComponentFilterGroups(registries: readonly Registry[]): ComponentFilterGroup[] {
  const counts = new Map<ComponentFilterDimension, Map<string, number>>();

  for (const registry of registries) {
    for (const item of registry.itemSummaries ?? []) {
      addValue(counts, 'type', item.type);
      addValue(counts, 'category', item.category);
      for (const tag of [...(item.componentTagsExisting ?? []), ...(item.componentTagsProposed ?? [])]) {
        addValue(counts, 'tag', tag);
      }
      addValue(counts, 'visual', item.previewUrl ? 'available' : 'unavailable');
      addValue(counts, 'status', item.catalogStatus);
    }
  }

  return (Object.keys(GROUP_LABELS) as ComponentFilterDimension[])
    .map(dimension => ({
      dimension,
      label: GROUP_LABELS[dimension],
      options: toOptions(dimension, counts.get(dimension)),
    }))
    .filter(group => group.options.length > 0);
}

export function applyComponentFiltersToCandidates(
  candidates: readonly ComponentCandidate[],
  selected: readonly SelectedComponentFilter[],
): ComponentCandidate[] {
  if (selected.length === 0) return [...candidates];
  return candidates.filter(candidate => selected.every(filter => candidateMatches(candidate, filter)));
}

export function applyComponentFiltersToProfileRows(
  rows: readonly RegistryProfileItemRow[],
  selected: readonly SelectedComponentFilter[],
): RegistryProfileItemRow[] {
  if (selected.length === 0) return [...rows];
  return rows.filter(row => selected.every(filter => rowMatches(row, filter)));
}

export function activeFilterLabel(filter: SelectedComponentFilter): string {
  return `${GROUP_LABELS[filter.dimension]}: ${filter.label}`;
}

export function createSelectedComponentFilter(
  groups: readonly ComponentFilterGroup[],
  dimension: string | null,
  value: string | null,
): SelectedComponentFilter | null {
  const group = groups.find(item => item.dimension === dimension);
  const option = group?.options.find(item => item.value === value);
  return group && option
    ? { dimension: group.dimension, value: option.value, label: option.label }
    : null;
}

function addValue(
  counts: Map<ComponentFilterDimension, Map<string, number>>,
  dimension: ComponentFilterDimension,
  value: string | undefined,
): void {
  const trimmed = value?.trim();
  if (!trimmed) return;
  const dimensionCounts = counts.get(dimension) ?? new Map<string, number>();
  dimensionCounts.set(trimmed, (dimensionCounts.get(trimmed) ?? 0) + 1);
  counts.set(dimension, dimensionCounts);
}

function toOptions(
  dimension: ComponentFilterDimension,
  values: Map<string, number> | undefined,
): ComponentFilterOption[] {
  return [...(values ?? new Map<string, number>()).entries()]
    .sort((a, b) => b[1] - a[1] || labelFor(dimension, a[0]).localeCompare(labelFor(dimension, b[0])))
    .map(([value, count]) => ({ dimension, value, label: labelFor(dimension, value), count }));
}

function labelFor(dimension: ComponentFilterDimension, value: string): string {
  if (dimension === 'visual') return value === 'available' ? 'Visual available' : 'Preview unavailable';
  if (dimension === 'status') return value === 'available' ? 'catalog-backed' : value;
  return value;
}

function normalizeLabelKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function candidateMatches(candidate: ComponentCandidate, filter: SelectedComponentFilter): boolean {
  if (filter.dimension === 'type') return candidate.itemType === filter.value;
  if (filter.dimension === 'category') return candidate.itemCategory === filter.value;
  if (filter.dimension === 'tag') return [...(candidate.taxonomyTagLabels ?? []), ...(candidate.taxonomyCategoryLabels ?? [])].some(label => normalizeLabelKey(label) === normalizeLabelKey(filter.value));
  if (filter.dimension === 'visual') return (candidate.previewUrl ? 'available' : 'unavailable') === filter.value;
  return candidate.catalogStatus === filter.value || candidate.statusDisplayLabel === filter.value;
}

function rowMatches(row: RegistryProfileItemRow, filter: SelectedComponentFilter): boolean {
  if (filter.dimension === 'type') return row.type === filter.value;
  if (filter.dimension === 'category') return row.category === filter.value;
  if (filter.dimension === 'tag') return [...(row.taxonomyTagLabels ?? []), ...(row.taxonomyCategoryLabels ?? [])].some(label => normalizeLabelKey(label) === normalizeLabelKey(filter.value));
  if (filter.dimension === 'visual') return (row.previewUrl ? 'available' : 'unavailable') === filter.value;
  return row.catalogStatus === filter.value || row.statusDisplayLabel === filter.value;
}
