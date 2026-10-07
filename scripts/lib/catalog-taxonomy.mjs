const ID_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/;

function isRecord(value) {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function requireString(value, field, id = 'taxonomy') {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${id}: ${field} must be a non-empty string`);
  }
  return value.trim();
}

function requireStringArray(value, field, id) {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string')) {
    throw new Error(`${id}: ${field} must be an array of strings`);
  }
  return value.map(entry => entry.trim()).filter(Boolean);
}

function normalizeAlias(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\s+/g, ' ');
}

export function validateCatalogTaxonomy(value) {
  if (!isRecord(value)) throw new Error('Catalog taxonomy must be an object');
  const version = requireString(value.version, 'version');
  if (!Array.isArray(value.roots) || value.roots.length === 0) {
    throw new Error('Catalog taxonomy roots must be a non-empty array');
  }

  const ids = new Set();
  const aliases = new Map();
  const seenObjects = new Set();
  const ancestors = new Set();

  function visit(raw, parentId = null) {
    if (!isRecord(raw)) throw new Error('Catalog taxonomy node must be an object');
    if (ancestors.has(raw)) throw new Error('Catalog taxonomy contains a cycle');
    if (seenObjects.has(raw)) throw new Error('Catalog taxonomy contains a duplicate node object');
    seenObjects.add(raw);
    ancestors.add(raw);

    const id = requireString(raw.id, 'id');
    if (!ID_PATTERN.test(id)) throw new Error(`Invalid taxonomy id: ${id}`);
    if (ids.has(id)) throw new Error(`Duplicate taxonomy node id: ${id}`);
    ids.add(id);

    const segments = id.split('/');
    if (parentId === null) {
      if (segments.length !== 1) throw new Error(`Root taxonomy id must have one segment: ${id}`);
    } else {
      const parentSegments = parentId.split('/');
      if (segments.length !== parentSegments.length + 1 || !id.startsWith(`${parentId}/`)) {
        throw new Error(`Child taxonomy id ${id} must be a direct child of ${parentId}`);
      }
    }

    const label = requireString(raw.label, 'label', id);
    const what = requireString(raw.what, 'what', id);
    const nodeAliases = requireStringArray(raw.aliases, 'aliases', id);
    const notFor = requireStringArray(raw.notFor, 'notFor', id);
    const examples = requireStringArray(raw.examples, 'examples', id);
    if (!Array.isArray(raw.children)) throw new Error(`${id}: children must be an array`);

    for (const alias of nodeAliases) {
      const normalized = normalizeAlias(alias);
      if (!normalized) continue;
      const owner = aliases.get(normalized);
      if (owner && owner !== id) {
        throw new Error(`Normalized alias collision for ${normalized}: ${owner} and ${id}`);
      }
      aliases.set(normalized, id);
    }

    const children = raw.children.map(child => visit(child, id));
    ancestors.delete(raw);
    return { id, label, aliases: nodeAliases, what, notFor, examples, children };
  }

  return { version, roots: value.roots.map(root => visit(root)) };
}

export function flattenCatalogTaxonomy(taxonomy) {
  const validated = validateCatalogTaxonomy(taxonomy);
  const records = [];
  function walk(node, parentId = null, depth = 0) {
    records.push({
      id: node.id,
      label: node.label,
      parentId,
      depth,
      aliases: node.aliases,
      what: node.what,
      notFor: node.notFor,
      examples: node.examples,
      children: node.children.map(child => child.id),
      node,
    });
    for (const child of node.children) walk(child, node.id, depth + 1);
  }
  for (const root of validated.roots) walk(root);
  return records;
}

export function taxonomyNodeMap(taxonomy) {
  return new Map(flattenCatalogTaxonomy(taxonomy).map(record => [record.id, record]));
}

export function taxonomyDescendantIds(taxonomy, id) {
  const map = taxonomyNodeMap(taxonomy);
  const root = map.get(id);
  if (!root) throw new Error(`Unknown taxonomy node: ${id}`);
  const descendants = [];
  function collect(record) {
    for (const childId of record.children) {
      descendants.push(childId);
      collect(map.get(childId));
    }
  }
  collect(root);
  return descendants;
}
