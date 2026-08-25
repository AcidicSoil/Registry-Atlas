import { buildMatrixRows } from './grouping.ts';
import { MATRIX_COLUMNS } from './matrixColumns.ts';
import { COMPONENT_TAG_VALUES } from './registry.schema.ts';
import type { ComponentTag, MatrixRow, Registry } from './registry.schema.ts';

export interface CompareSelection {
  registryNames: readonly string[];
  componentKeys: readonly ComponentTag[];
}

export interface CompareModel {
  rows: readonly MatrixRow[];
  columns: readonly ComponentTag[];
  availableRegistryNames: readonly string[];
  availableComponentKeys: readonly ComponentTag[];
}

const COMPONENT_SET = new Set<string>(COMPONENT_TAG_VALUES);

export function buildCompareModel(
  registries: readonly Registry[],
  searchTerm: string,
  selection: CompareSelection,
): CompareModel {
  const selectedColumns = selection.componentKeys.filter(key => COMPONENT_SET.has(key));
  const columns = selectedColumns.length > 0 ? selectedColumns : MATRIX_COLUMNS;
  const selectedRegistries = selection.registryNames.length > 0
    ? registries.filter(registry => selection.registryNames.includes(registry.name))
    : registries;

  return {
    rows: buildMatrixRows(selectedRegistries, searchTerm, columns),
    columns,
    availableRegistryNames: [...registries].map(registry => registry.name).sort(),
    availableComponentKeys: availableComponents(registries),
  };
}
function availableComponents(registries: readonly Registry[]): ComponentTag[] {
  const values = new Set<ComponentTag>();
  registries.forEach(registry => {
    registry.component_tags.forEach(tag => values.add(tag));
    (registry.itemSummaries ?? []).forEach(item => {
      [...(item.componentTagsExisting ?? []), ...(item.componentTagsProposed ?? [])]
        .filter(value => COMPONENT_SET.has(value))
        .forEach(value => values.add(value as ComponentTag));
    });
  });
  return [...values].sort();
}
