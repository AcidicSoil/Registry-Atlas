import { isInputObject, isInputString } from './input-guards.mjs';

const KINDS = new Set(['component', 'block', 'page', 'template', 'theme', 'icon', 'other']);

const SOURCE_HINT_KEYS = new Set(['categories', 'verifiedGroups', 'breadcrumbs', 'pathHints']);

const MAX_NAME = 200;

const MAX_TITLE = 200;

const MAX_DESCRIPTION = 600;

const MAX_HINT = 200;

function cleanText(value, maxLength) {
  if (!isInputString(value)) return undefined;
  const normalized = value.trim().replace(/\s+/g, ' ');

  if (!normalized) return undefined;

  return normalized.slice(0, maxLength);
}

function cleanHints(values) {
  if (values === undefined) return undefined;

  if (!Array.isArray(values) || values.some(value => !isInputString(value))) {
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
  if (!isInputString(namespace) || !namespace.trim()) {
    throw new Error('Catalog classification requires a registry namespace');
  }

  if (!item || !isInputObject(item) || Array.isArray(item)) {
    throw new Error('Catalog classification requires an item object');
  }

  const name = cleanText(item.name, MAX_NAME);

  if (!name) throw new Error('Catalog classification item requires a name');

  if (!KINDS.has(item.kind)) throw new Error('Catalog classification item requires a canonical kind');

  const state = {
    item: (() => {
  const result = {};
  result.name = name;

  if (cleanText(item.title, MAX_TITLE)) Object.assign(result, { title: cleanText(item.title, MAX_TITLE) });

  if (cleanText(item.description, MAX_DESCRIPTION)) Object.assign(result, { description: cleanText(item.description, MAX_DESCRIPTION) });
  result.kind = item.kind;

  return result;
})(),
  };

  if (sourceHints !== undefined) {
    if (!sourceHints || !isInputObject(sourceHints) || Array.isArray(sourceHints)) {
      throw new Error('Catalog classification source hints must be an object');
    }

    for (const key of Object.keys(sourceHints)) {
      if (!SOURCE_HINT_KEYS.has(key)) {
        throw new Error(`Unsupported source hint: ${key}`);
      }
    }

    const hints = (() => {
  const result = {};

  if (cleanHints(sourceHints.categories)) Object.assign(result, { categories: cleanHints(sourceHints.categories) });

  if (cleanHints(sourceHints.verifiedGroups)) Object.assign(result, { verifiedGroups: cleanHints(sourceHints.verifiedGroups) });

  if (cleanHints(sourceHints.breadcrumbs)) Object.assign(result, { breadcrumbs: cleanHints(sourceHints.breadcrumbs) });

  if (cleanHints(sourceHints.pathHints)) Object.assign(result, { pathHints: cleanHints(sourceHints.pathHints) });

  return result;
})();

    if (Object.keys(hints).length) state.sourceHints = hints;
  }

  return state;
}
