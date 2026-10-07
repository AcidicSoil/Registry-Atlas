const KINDS = new Set(['component', 'block', 'page', 'template', 'theme', 'icon', 'other']);
const SOURCE_HINT_KEYS = new Set(['categories', 'verifiedGroups', 'breadcrumbs', 'pathHints']);
const MAX_NAME = 200;
const MAX_TITLE = 200;
const MAX_DESCRIPTION = 600;
const MAX_HINT = 200;

function cleanText(value, maxLength) {
  if (typeof value !== 'string') return undefined;
  const normalized = value.trim().replace(/\s+/g, ' ');
  if (!normalized) return undefined;
  return normalized.slice(0, maxLength);
}

function cleanHints(values) {
  if (values === undefined) return undefined;
  if (!Array.isArray(values) || values.some(value => typeof value !== 'string')) {
    throw new Error('Catalog classification source hints must be arrays of strings');
  }
  const output = [];
  const seen = new Set();
  for (const value of values) {
    const cleaned = cleanText(value, MAX_HINT);
    if (!cleaned || seen.has(cleaned)) continue;
    seen.add(cleaned);
    output.push(cleaned);
  }
  return output.length ? output : undefined;
}

export function buildCatalogClassificationState({ namespace, item, sourceHints } = {}) {
  if (typeof namespace !== 'string' || !namespace.trim()) {
    throw new Error('Catalog classification requires a registry namespace');
  }
  if (!item || typeof item !== 'object' || Array.isArray(item)) {
    throw new Error('Catalog classification requires an item object');
  }
  const name = cleanText(item.name, MAX_NAME);
  if (!name) throw new Error('Catalog classification item requires a name');
  if (!KINDS.has(item.kind)) throw new Error('Catalog classification item requires a canonical kind');

  const state = {
    item: {
      name,
      ...(cleanText(item.title, MAX_TITLE) ? { title: cleanText(item.title, MAX_TITLE) } : {}),
      ...(cleanText(item.description, MAX_DESCRIPTION)
        ? { description: cleanText(item.description, MAX_DESCRIPTION) } : {}),
      kind: item.kind,
    },
  };

  if (sourceHints !== undefined) {
    if (!sourceHints || typeof sourceHints !== 'object' || Array.isArray(sourceHints)) {
      throw new Error('Catalog classification source hints must be an object');
    }
    for (const key of Object.keys(sourceHints)) {
      if (!SOURCE_HINT_KEYS.has(key)) {
        throw new Error(`Unsupported source hint: ${key}`);
      }
    }
    const hints = {
      ...(cleanHints(sourceHints.categories) ? { categories: cleanHints(sourceHints.categories) } : {}),
      ...(cleanHints(sourceHints.verifiedGroups)
        ? { verifiedGroups: cleanHints(sourceHints.verifiedGroups) } : {}),
      ...(cleanHints(sourceHints.breadcrumbs) ? { breadcrumbs: cleanHints(sourceHints.breadcrumbs) } : {}),
      ...(cleanHints(sourceHints.pathHints) ? { pathHints: cleanHints(sourceHints.pathHints) } : {}),
    };
    if (Object.keys(hints).length) state.sourceHints = hints;
  }

  return state;
}
