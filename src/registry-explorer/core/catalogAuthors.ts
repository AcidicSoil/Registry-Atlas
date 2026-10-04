import type { RegistryCatalogIndex } from './registry.schema';

export interface CatalogAuthor {
  name: string;
  componentCount: number;
}

const COMPONENT_TYPES = new Set([
  'registry:component', 'registry:ui', 'registry:block', 'registry:item',
]);

// Counts only named attribution on exact catalog identities, never platform rank,
// account membership, inferred creator identity or an undocumented publication date.
export function buildAuthorDirectory(index: RegistryCatalogIndex): CatalogAuthor[] {
  const counts = new Map<string, number>();
  const seen = new Set<string>();
  for (const [namespace, items] of Object.entries(index.registries)) {
    for (const item of items) {
      const name = item.author?.trim();
      if (!name || name.length > 256 || !COMPONENT_TYPES.has(item.type)) continue;
      const identity = namespace + '/' + item.name;
      if (seen.has(identity)) continue;
      seen.add(identity);
      counts.set(name, (counts.get(name) ?? 0) + 1);
    }
  }
  return [...counts].map(([name, componentCount]) => ({ name, componentCount }))
    .sort((a, b) => b.componentCount - a.componentCount || a.name.localeCompare(b.name));
}
