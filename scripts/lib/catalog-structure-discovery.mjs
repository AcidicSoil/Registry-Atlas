const clean = value => String(value ?? '').trim().replace(/\s+/g, ' ');
const slug = value => clean(value).toLowerCase()
  .replace(/&/g, ' and ')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-|-$/g, '');

function pathSegments(pathname) {
  return String(pathname ?? '').split('/').filter(Boolean);
}

function normalizePath(href, baseUrl) {
  try {
    const base = new URL(baseUrl);
    const url = new URL(href, base);
    if (url.protocol !== 'https:' || url.origin !== base.origin || url.username || url.password
      || url.port || url.hash) return null;
    return url.pathname.replace(/\/+$/, '') || '/';
  } catch {
    return null;
  }
}

function knownIndex(knownItems = []) {
  const ids = knownItems
    .map(item => typeof item === 'string' ? item : item?.name)
    .filter(value => typeof value === 'string' && value.trim())
    .map(value => value.trim());
  const exact = new Map();
  const leaves = new Map();
  for (const id of ids) {
    const normalized = id.toLowerCase().replace(/^\/+|\/+$/g, '');
    exact.set(normalized, id);
    const leaf = normalized.split('/').at(-1);
    if (!leaves.has(leaf)) leaves.set(leaf, []);
    leaves.get(leaf).push(id);
  }
  return { ids, exact, leaves };
}

function matchKnown(pathname, index) {
  const lower = String(pathname ?? '').toLowerCase().replace(/\/+$/, '');
  for (const [normalized, id] of index.exact) {
    if (lower.endsWith('/' + normalized)) return id;
  }
  const leaf = pathSegments(lower).at(-1);
  const matches = index.leaves.get(leaf) ?? [];
  return matches.length === 1 ? matches[0] : null;
}

function inferRoot(observation, index) {
  const current = String(observation.pathname ?? new URL(observation.url).pathname)
    .replace(/\/+$/, '') || '/';
  if (!matchKnown(current, index)) return current;
  const parts = pathSegments(current);
  return '/' + parts.slice(0, -1).join('/');
}

function recordsForLinks(links, { baseUrl, root, rootDepth, index }) {
  const records = [];
  for (const link of links ?? []) {
    const pathname = normalizePath(link.href, baseUrl);
    if (!pathname || !(pathname === root || pathname.startsWith(root + '/')) || pathname === root)
      continue;
    records.push({
      text: clean(link.text),
      href: link.href,
      pathname,
      knownId: matchKnown(pathname, index),
      heading: clean(link.heading),
      relative: pathSegments(pathname).slice(rootDepth),
    });
  }
  return records;
}

export function discoverCatalogGroups(observation, { knownItems = [] } = {}) {
  if (!observation?.url) throw new Error('Catalog observation URL is required');
  const index = knownIndex(knownItems);
  const root = inferRoot(observation, index);
  const rootDepth = pathSegments(root).length;
  const rootLeaf = slug(pathSegments(root).at(-1) ?? '');
  const groups = [];

  const add = (label, sourcePattern, records = [], metadata = {}) => {
    const key = slug(label);
    if (!key || key === rootLeaf || key === 'categories' || groups.some(group => slug(group.label) === key)) return;
    const memberIds = [...new Set(records.map(record => record.knownId).filter(Boolean))];
    groups.push({
      label: clean(label),
      sourcePattern,
      sourceUrl: observation.url,
      memberIds,
      links: records.slice(0, 12).map(record => ({
        text: record.text,
        href: record.href,
        ...(record.knownId ? { knownId: record.knownId } : {}),
      })),
      ...metadata,
    });
  };

  for (const range of observation.ranges ?? []) {
    const records = recordsForLinks(range.links, {
      baseUrl: observation.url, root, rootDepth, index,
    });
    const known = records.filter(record => record.knownId);
    const labelSlug = slug(String(range.text ?? '').replace(/\s*\([^)]*\)\s*$/, ''));
    const nestedAligned = records.filter(record =>
      record.relative.length >= 2 && slug(record.relative[0]) === labelSlug);
    const categoryLink = records.find(record =>
      record.relative.length === 1
      && slug(record.relative[0]) === labelSlug
      && !record.knownId
      && String(range.ownerTag ?? '').toUpperCase() === 'ARTICLE');
    const owner = String(range.ownerTag ?? '').toUpperCase();
    const navCluster = ['NAV', 'ASIDE'].includes(owner) && known.length >= 2;

    if (navCluster) add(range.text, 'semantic-container', known, {
      headingTag: range.tag ?? '', ownerTag: owner,
    });
    else if (nestedAligned.length) add(range.text, 'heading-range', known, {
      headingTag: range.tag ?? '', ownerTag: owner,
    });
    else if (categoryLink) add(range.text, 'category-card', [categoryLink], {
      headingTag: range.tag ?? '', ownerTag: owner,
    });
  }

  for (const container of observation.containers ?? []) {
    const owner = String(container.tag ?? '').toUpperCase();
    if (!['NAV', 'ASIDE'].includes(owner) || container.heads?.length !== 1) continue;
    const records = recordsForLinks(container.links, {
      baseUrl: observation.url, root, rootDepth, index,
    }).filter(record => record.knownId);
    if (records.length < 2) continue;
    add(container.heads[0].text, 'semantic-container', records, {
      headingTag: container.heads[0].tag ?? '', ownerTag: owner,
    });
  }

  const peerCandidates = [];
  for (const link of observation.links ?? []) {
    const pathname = normalizePath(link.href, observation.url);
    if (!pathname || !(pathname === root || pathname.startsWith(root + '/')) || pathname === root)
      continue;
    const relative = pathSegments(pathname).slice(rootDepth);
    if (relative.length !== 1 || matchKnown(pathname, index)) continue;
    const leafSlug = slug(relative[0]);
    const heading = clean(link.heading);
    const text = clean(link.text);
    const label = heading && slug(heading) === leafSlug
      ? heading
      : slug(text) === leafSlug ? text : '';
    if (!label) continue;
    peerCandidates.push({ label, href: link.href, pathname });
  }
  const distinctPeerPaths = new Set(peerCandidates.map(candidate => candidate.pathname));
  if (distinctPeerPaths.size >= 2) {
    for (const candidate of peerCandidates) {
      add(candidate.label, 'category-link', [{
        text: candidate.label, href: candidate.href, pathname: candidate.pathname, knownId: null,
      }], { headingTag: '', ownerTag: '' });
    }
  }

  const observedAssets = [];
  for (const record of recordsForLinks(observation.links, {
    baseUrl: observation.url, root, rootDepth, index,
  })) {
    if (!record.knownId || observedAssets.some(asset => asset.id === record.knownId)) continue;
    observedAssets.push({ id: record.knownId, text: record.text, href: record.href, sourceUrl: observation.url });
  }

  return { root, groups, observedAssets };
}

export function resolveDirectMembership(assetId, groups = []) {
  if (typeof assetId !== 'string' || !assetId) return [];
  return groups
    .filter(group => Array.isArray(group?.memberIds) && group.memberIds.includes(assetId))
    .map(group => group.label);
}

const GENERIC_DECISION_TOKENS = new Set([
  'all', 'block', 'blocks', 'component', 'components', 'group', 'groups',
  'item', 'items', 'section', 'sections',
]);
const MAX_DECISION_GROUPS = 16;

function decisionTokens(value) {
  return String(value ?? '')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(token => token.length >= 3 && !GENERIC_DECISION_TOKENS.has(token));
}

export function shortlistObservedGroupLabels(asset, groups = []) {
  const labels = [...new Set(groups
    .map(group => clean(typeof group === 'string' ? group : group?.label))
    .filter(Boolean))];
  if (labels.length <= MAX_DECISION_GROUPS) return labels;

  const assetTokens = decisionTokens([asset?.id, asset?.text].filter(Boolean).join(' '));
  if (!assetTokens.length) return [];

  return labels
    .map((label, index) => {
      const labelTokens = decisionTokens(label);
      let score = 0;
      for (const left of assetTokens) {
        for (const right of labelTokens) {
          if (left === right) score += 3;
          else if (left.length >= 4 && right.length >= 4
            && (left.includes(right) || right.includes(left))) score += 1;
        }
      }
      return { label, index, score };
    })
    .filter(row => row.score > 0)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, MAX_DECISION_GROUPS)
    .map(row => row.label);
}

export function classifyObservedAccess({ groups = [], markers = [] } = {}) {
  const values = [...groups, ...markers].map(value => clean(value).toLowerCase());
  const free = values.some(value => value === 'free');
  const paid = values.some(value => value === 'paid' || value === 'premium');
  if (free === paid) return 'unknown';
  return free ? 'free' : 'paid';
}

export function normalizeCatalogKind(rawType) {
  switch (String(rawType ?? '').toLowerCase()) {
    case 'registry:block': return 'block';
    case 'registry:page': return 'page';
    case 'registry:theme':
    case 'registry:style':
      return 'theme';
    case 'registry:icon': return 'icon';
    case 'registry:component':
    case 'registry:ui':
    case 'registry:item':
      return 'component';
    case 'template':
    case 'registry:template':
      return 'template';
    default:
      return 'other';
  }
}


function canonicalSurfaceUrl(raw, homepage) {
  try {
    const home = new URL(homepage);
    const url = new URL(raw, home);
    const canonicalHost = value => String(value).toLowerCase().replace(/^www\./, '');
    if (home.protocol !== 'https:' || url.protocol !== 'https:'
      || canonicalHost(url.hostname) !== canonicalHost(home.hostname)
      || url.username || url.password || url.port || home.port || url.hash) return null;
    url.search = '';
    if (!url.pathname.endsWith('/')) url.pathname += '/';
    return url.href;
  } catch {
    return null;
  }
}

const CATALOG_COLLECTION_SEGMENTS = new Set([
  'components', 'blocks', 'templates', 'themes', 'icons', 'pages',
  'examples', 'primitives', 'ui', 'catalog', 'library', 'elements',
]);
const COLLECTION_KIND_COMPATIBILITY = new Map([
  ['components', new Set(['component'])],
  ['blocks', new Set(['block'])],
  ['templates', new Set(['template', 'page'])],
  ['pages', new Set(['page', 'template'])],
  ['themes', new Set(['theme'])],
  ['icons', new Set(['icon'])],
]);

export function catalogSurfaceMatchesKnownKinds(rawUrl, homepage, knownItems = []) {
  if (!knownItems.length) return true;
  const safe = canonicalSurfaceUrl(rawUrl, homepage);
  if (!safe) return false;
  const segments = pathSegments(new URL(safe).pathname).map(segment => segment.toLowerCase());
  const collection = [...segments].reverse().find(segment => COLLECTION_KIND_COMPATIBILITY.has(segment));
  if (!collection) return true;
  const allowed = COLLECTION_KIND_COMPATIBILITY.get(collection);
  const kinds = new Set(knownItems.map(item => normalizeCatalogKind(item?.type)));
  return [...allowed].some(kind => kinds.has(kind));
}

function catalogCollectionAncestor(rawUrl, homepage) {
  const safe = canonicalSurfaceUrl(rawUrl, homepage);
  if (!safe) return null;
  const url = new URL(safe);
  const parts = pathSegments(url.pathname);
  let index = -1;
  for (let i = 0; i < parts.length; i++) {
    if (CATALOG_COLLECTION_SEGMENTS.has(parts[i].toLowerCase())) index = i;
  }
  if (index < 0 || index === parts.length - 1) return null;
  url.pathname = '/' + parts.slice(0, index + 1).map(part => encodeURIComponent(decodeURIComponent(part))).join('/') + '/';
  return url.href;
}

function parentFromObservedItem(rawUrl, itemSlug, homepage) {
  if (typeof itemSlug !== 'string' || !itemSlug.trim()) return null;
  const safe = canonicalSurfaceUrl(rawUrl, homepage);
  if (!safe) return null;
  const url = new URL(safe);
  let path;
  let slugParts;
  try {
    path = pathSegments(url.pathname).map(decodeURIComponent);
    slugParts = pathSegments(itemSlug).map(decodeURIComponent);
  } catch {
    return null;
  }
  if (!slugParts.length || slugParts.length > path.length) return null;
  const tail = path.slice(-slugParts.length).map(slug).join('/');
  const expected = slugParts.map(slug).join('/');
  if (tail !== expected) return null;
  const parent = '/' + path.slice(0, -slugParts.length)
    .map(part => encodeURIComponent(part)).join('/');
  url.pathname = (parent === '/' ? '/' : parent + '/');
  return url.href;
}

export function deriveCatalogSurfaceCandidates({
  homepage,
  routePatterns = [],
  examples = [],
  itemRoutes = [],
  sitemapLinks = [],
  knownItems = [],
} = {}) {
  const home = canonicalSurfaceUrl(homepage, homepage);
  if (!home) return [];
  const candidates = new Map();
  const add = (url, source) => {
    const safe = canonicalSurfaceUrl(url, homepage);
    if (!safe || !catalogSurfaceMatchesKnownKinds(safe, homepage, knownItems) || candidates.has(safe)) return;
    candidates.set(safe, { url: safe, source });
  };

  for (const pattern of routePatterns) {
    if (pattern?.status === 'failed') continue;
    const observed = pattern?.status === 'verified'
      || ['browser-observed', 'official-sitemap', 'observed-navigation']
        .includes(pattern?.source);
    if (!observed || typeof pattern?.template !== 'string'
      || !pattern.template.includes('{slug}')) continue;
    const prefix = pattern.template.slice(0, pattern.template.indexOf('{slug}'));
    const collection = catalogCollectionAncestor(prefix, homepage);
    if (collection) add(collection, 'route-pattern-parent');
    add(prefix, 'route-pattern');
  }

  for (const example of examples) {
    if (example?.pattern_status === 'failed') continue;
    const parent = parentFromObservedItem(example?.url, example?.slug, homepage);
    if (parent) add(parent, 'pattern-example');
  }

  for (const route of itemRoutes) {
    if (route?.pattern_status === 'failed'
      || !['pattern-observed', 'component-page-verified', 'verified'].includes(route?.status))
      continue;
    const parent = parentFromObservedItem(route?.source_url, route?.slug, homepage);
    if (parent) add(parent, 'item-route');
  }

  for (const link of sitemapLinks) {
    const parent = parentFromObservedItem(link?.url, link?.slug, homepage);
    if (parent) add(parent, 'sitemap');
  }

  add(home, 'homepage');
  return [...candidates.values()];
}

