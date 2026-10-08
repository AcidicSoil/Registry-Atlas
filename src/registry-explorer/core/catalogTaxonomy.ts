export interface CatalogTaxonomyNode {
  id: string;
  label: string;
  aliases: readonly string[];
  what: string;
  notFor: readonly string[];
  examples: readonly string[];
  children: readonly CatalogTaxonomyNode[];
}

export interface CatalogTaxonomy {
  version: string;
  roots: readonly CatalogTaxonomyNode[];
}

export interface CatalogTaxonomyRecord extends CatalogTaxonomyNode {
  parentId: string | null;
  depth: number;
}

const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim()) throw new Error(`Catalog taxonomy ${field} must be a non-empty string`);
  return value.trim();
}

function stringArray(value: unknown, field: string, id: string): string[] {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) {
    throw new Error(`Catalog taxonomy ${id} ${field} must be an array of strings`);
  }
  return value.map(entry => entry.trim()).filter(Boolean);
}

function aliasKey(value: string): string {
  return value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export function parseCatalogTaxonomy(value: unknown): CatalogTaxonomy {
  if (!isRecord(value)) throw new Error('Catalog taxonomy must be an object');
  const version = nonEmptyString(value.version, 'version');
  if (!Array.isArray(value.roots) || value.roots.length === 0) throw new Error('Catalog taxonomy roots must be a non-empty array');

  const ids = new Set<string>();
  const aliases = new Map<string, string>();
  const seenObjects = new Set<object>();
  const ancestors = new Set<object>();

  const visit = (raw: unknown, parentId: string | null): CatalogTaxonomyNode => {
    if (!isRecord(raw)) throw new Error('Catalog taxonomy node must be an object');
    if (ancestors.has(raw)) throw new Error('Catalog taxonomy contains a cycle');
    if (seenObjects.has(raw)) throw new Error('Catalog taxonomy reuses a node object');
    seenObjects.add(raw);
    ancestors.add(raw);

    const id = nonEmptyString(raw.id, 'id');
    if (!ID_PATTERN.test(id)) throw new Error(`Catalog taxonomy id is invalid: ${id}`);
    if (ids.has(id)) throw new Error(`Catalog taxonomy duplicate id: ${id}`);
    ids.add(id);
    if (parentId === null) {
      if (id.includes('/')) throw new Error(`Catalog taxonomy root id must have one segment: ${id}`);
    } else {
      const direct = id.startsWith(`${parentId}/`) && id.split('/').length === parentId.split('/').length + 1;
      if (!direct) throw new Error(`Catalog taxonomy child ${id} is not a direct child of ${parentId}`);
    }

    const label = nonEmptyString(raw.label, `${id} label`);
    const what = nonEmptyString(raw.what, `${id} what`);
    const nodeAliases = stringArray(raw.aliases, 'aliases', id);
    const notFor = stringArray(raw.notFor, 'notFor', id);
    const examples = stringArray(raw.examples, 'examples', id);
    if (!Array.isArray(raw.children)) throw new Error(`Catalog taxonomy ${id} children must be an array`);

    for (const alias of nodeAliases) {
      const key = aliasKey(alias);
      const owner = aliases.get(key);
      if (owner && owner !== id) throw new Error(`Catalog taxonomy alias collision: ${alias}`);
      aliases.set(key, id);
    }

    const children = raw.children.map(child => visit(child, id));
    ancestors.delete(raw);
    return { id, label, aliases: nodeAliases, what, notFor, examples, children };
  };

  return { version, roots: value.roots.map(root => visit(root, null)) };
}

export function flattenCatalogTaxonomy(taxonomy: CatalogTaxonomy): CatalogTaxonomyRecord[] {
  const records: CatalogTaxonomyRecord[] = [];
  const walk = (node: CatalogTaxonomyNode, parentId: string | null, depth: number): void => {
    records.push({ ...node, parentId, depth });
    node.children.forEach(child => walk(child, node.id, depth + 1));
  };
  taxonomy.roots.forEach(root => walk(root, null, 0));
  return records;
}

export function catalogTaxonomyNodeMap(taxonomy: CatalogTaxonomy): ReadonlyMap<string, CatalogTaxonomyRecord> {
  return new Map(flattenCatalogTaxonomy(taxonomy).map(record => [record.id, record]));
}

export function catalogTaxonomyDescendantIds(taxonomy: CatalogTaxonomy, id: string): string[] {
  const map = catalogTaxonomyNodeMap(taxonomy);
  const record = map.get(id);
  if (!record) throw new Error(`Unknown catalog taxonomy node: ${id}`);
  const output: string[] = [];
  const collect = (node: CatalogTaxonomyNode): void => {
    for (const child of node.children) {
      output.push(child.id);
      collect(child);
    }
  };
  collect(record);
  return output;
}

export function catalogTaxonomySearchValues(taxonomy: CatalogTaxonomy, ids: readonly string[]): string[] {
  const map = catalogTaxonomyNodeMap(taxonomy);
  const output: string[] = [];
  for (const id of ids) {
    const node = map.get(id);
    if (!node) throw new Error(`Unknown catalog taxonomy node: ${id}`);
    output.push(node.id, node.label, ...node.aliases);
  }
  return [...new Set(output)];
}

let defaultCatalogTaxonomy: CatalogTaxonomy | null = null;

export function configureDefaultCatalogTaxonomy(taxonomy: CatalogTaxonomy): void {
  defaultCatalogTaxonomy = taxonomy;
}

export function getDefaultCatalogTaxonomy(): CatalogTaxonomy | null {
  return defaultCatalogTaxonomy;
}

export function isDefaultCatalogTaxonomyId(id: string): boolean {
  if (!defaultCatalogTaxonomy) return true;
  return catalogTaxonomyNodeMap(defaultCatalogTaxonomy).has(id);
}

export function defaultCatalogTaxonomySearchValues(ids: readonly string[]): string[] {
  if (!defaultCatalogTaxonomy) return [...ids];
  return catalogTaxonomySearchValues(defaultCatalogTaxonomy, ids);
}
