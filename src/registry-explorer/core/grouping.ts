import type {
  Registry,
  FocusGroup,
  ComponentGroup,
  MatrixRow,
  RegistryExplorerMetrics,
  ComponentTag,
  PrimaryFocus,
} from './registry.schema';
import { focusLabel, componentLabel } from './labels';

export function filterRegistries(
  registries: readonly Registry[],
  search: string
): Registry[] {
  const term = search.trim().toLowerCase();
  if (!term) return [...registries];

  return registries.filter((r) => {
    const haystack = [
      r.name,
      r.description,
      r.framework || '',
      r.license || '',
      ...r.primary_focus,
      ...r.component_tags,
    ]
      .join(' ')
      .toLowerCase();
    return haystack.includes(term);
  });
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
      registries: items.sort((a, b) => a.name.localeCompare(b.name)),
      count: items.length,
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
    const coverage = columns.map((col) => r.component_tags.includes(col));
    return {
      registry: r,
      coverage,
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
