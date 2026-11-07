import type { RegistryCatalogIndex, RegistryCatalogItem } from "./registry.schema";

export interface CatalogAuthor {
  name: string;
  componentCount: number;
}

const COMPONENT_TYPES = new Set([
  "registry:component",
  "registry:ui",
  "registry:block",
  "registry:item",
]);

// Counts only named attribution on exact catalog identities, never platform rank,
// account membership, inferred creator identity or an undocumented publication date.
export function buildAuthorDirectory(index: RegistryCatalogIndex): CatalogAuthor[] {
  const counts = new Map<string, number>();
  const seen = new Set<string>();

  for (const [namespace, items] of Object.entries(index.registries)) {
    for (const item of items) {
      countNamedAuthor(counts, seen, namespace, item);
    }
  }

  return [...counts]
    .map(([name, componentCount]) => ({ name, componentCount }))
    .sort((a, b) => b.componentCount - a.componentCount || a.name.localeCompare(b.name));
}

function countNamedAuthor(
  counts: Map<string, number>,
  seen: Set<string>,
  namespace: string,
  item: RegistryCatalogItem,
): void {
  const name = item.author?.trim();

  if (!name || name.length > 256 || !COMPONENT_TYPES.has(item.type)) return;
  const identity = namespace + "/" + item.name;

  if (seen.has(identity)) return;
  seen.add(identity);
  counts.set(name, (counts.get(name) ?? 0) + 1);
}
