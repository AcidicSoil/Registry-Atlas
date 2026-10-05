import { mkdir, rename, writeFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import {
  catalogSurfaceMatchesKnownKinds,
  classifyObservedAccess,
  deriveCatalogSurfaceCandidates,
  decisionOverlapScore,
  discoverCatalogGroups,
  normalizeCatalogKind,
  resolveDirectMembership,
  shortlistObservedGroupLabels,
} from './catalog-structure-discovery.mjs';

export const CATALOG_STRUCTURE_SURVEY_SCHEMA = 'registry-atlas-catalog-structure-survey/v1';

function uniqueItems(catalogItems = [], curatedItems = []) {
  const byName = new Map();
  for (const item of catalogItems) {
    if (!item || typeof item.name !== 'string' || !item.name.trim()) continue;
    if (!byName.has(item.name)) byName.set(item.name, { name: item.name, type: item.type ?? 'registry:item' });
  }
  for (const item of curatedItems) {
    const name = item?.slug;
    if (typeof name !== 'string' || !name.trim() || byName.has(name)) continue;
    byName.set(name, { name, type: item.type ?? 'registry:item' });
  }
  return [...byName.values()];
}

export function planCatalogStructureSurvey(
  raw,
  catalog,
  curated = {},
  evidenceByRegistry = {},
  { cursor, maxRegistries = 20 } = {},
) {
  if (!Array.isArray(raw) || !catalog?.registries || typeof catalog.registries !== 'object')
    throw new Error('Invalid registry inventory or compact catalog');
  if (!Number.isSafeInteger(maxRegistries) || maxRegistries < 1 || maxRegistries > 10000)
    throw new Error('Invalid maxRegistries');
  const ordered = [...raw].sort((a, b) => String(a.name).localeCompare(String(b.name)));
  if (cursor && !ordered.some(registry => registry.name === cursor))
    throw new Error('Unknown registry cursor');

  const registries = ordered.map(registry => {
    const items = uniqueItems(catalog.registries[registry.name] ?? [], curated[registry.name] ?? []);
    const evidence = evidenceByRegistry[registry.name] ?? {};
    return {
      namespace: registry.name,
      homepage: registry.homepage,
      itemCount: items.length,
      surfaces: deriveCatalogSurfaceCandidates({
        homepage: registry.homepage,
        routePatterns: evidence.routePatterns ?? [],
        examples: evidence.examples ?? [],
        itemRoutes: evidence.itemRoutes ?? [],
        sitemapLinks: evidence.sitemapLinks ?? [],
        knownItems: items,
      }),
    };
  });
  const eligible = registries.filter(row => !cursor || row.namespace.localeCompare(cursor) > 0);
  const batch = eligible.slice(0, maxRegistries);
  return {
    schema: CATALOG_STRUCTURE_SURVEY_SCHEMA,
    totalRegistries: registries.length,
    registries,
    batch,
    nextCursor: eligible.length > batch.length ? batch.at(-1)?.namespace ?? null : null,
  };
}

function mergeGroup(target, group) {
  const existing = target.find(candidate => candidate.label === group.label);
  if (!existing) {
    target.push({
      ...group,
      sourceUrls: [...new Set([...(group.sourceUrls ?? []), group.sourceUrl].filter(Boolean))],
      memberIds: [...new Set(group.memberIds ?? [])],
      links: [...(group.links ?? [])],
    });
    return;
  }
  existing.sourceUrls = [...new Set([
    ...(existing.sourceUrls ?? [existing.sourceUrl].filter(Boolean)),
    ...(group.sourceUrls ?? [group.sourceUrl].filter(Boolean)),
  ])];
  existing.memberIds = [...new Set([...(existing.memberIds ?? []), ...(group.memberIds ?? [])])];
  const keys = new Set((existing.links ?? []).map(link => String(link.href) + '\0' + String(link.text)));
  for (const link of group.links ?? []) {
    const key = String(link.href) + '\0' + String(link.text);
    if (!keys.has(key)) {
      existing.links.push(link);
      keys.add(key);
    }
  }
}

const DECISION_PATTERN = new Map([
  ['category-link', 'link'],
  ['category-card', 'card'],
  ['heading-range', 'range'],
  ['semantic-container', 'container'],
]);

function decisionPathAffinity(assetHref, group) {
  if (!assetHref) return 0;
  let assetPath;
  try { assetPath = new URL(assetHref, 'https://catalog.invalid').pathname.replace(/\/$/, ''); }
  catch { return 0; }
  return (group?.links ?? []).some(link => {
    try {
      const groupPath = new URL(link?.href, 'https://catalog.invalid').pathname.replace(/\/$/, '');
      return groupPath && assetPath.startsWith(groupPath + '/');
    } catch { return false; }
  }) ? 1 : 0;
}

function compactDecisionState(asset, groups, labels) {
  return {
    asset: {
      id: String(asset?.id ?? '').slice(0, 120),
      ...(asset?.text ? { text: String(asset.text).slice(0, 120) } : {}),
    },
    candidates: labels.map(label => {
      const group = groups.find(candidate => candidate.label === label);
      const samples = [...new Set([
        ...(group?.links ?? []).map(link => link?.knownId).filter(Boolean),
        ...(group?.memberIds ?? []),
      ])].slice(0, 2).map(value => String(value).slice(0, 80));
      return {
        label,
        pattern: DECISION_PATTERN.get(group?.sourcePattern) ?? 'other',
        path: decisionPathAffinity(asset?.href, group),
        overlap: Math.min(99, decisionOverlapScore(asset, label)),
        samples,
      };
    }),
  };
}

function countBy(rows, pick) {
  const result = {};
  for (const row of rows) {
    const key = pick(row);
    result[key] = (result[key] ?? 0) + 1;
  }
  return result;
}

const CATALOG_PATH_SEGMENTS = new Set([
  'components', 'blocks', 'templates', 'themes', 'icons', 'pages',
  'examples', 'primitives', 'ui', 'catalog', 'library', 'elements',
]);

const canonicalHost = host => String(host).toLowerCase().replace(/^www\./, '');

function publicSameOrigin(raw, homepage) {
  try {
    const page = new URL(raw);
    const home = new URL(homepage);
    return page.protocol === 'https:' && home.protocol === 'https:'
      && canonicalHost(page.hostname) === canonicalHost(home.hostname)
      && !page.username && !page.password && !page.port
      && !home.username && !home.password && !home.port;
  } catch {
    return false;
  }
}

function surfaceKey(raw) {
  try {
    const url = new URL(raw);
    return canonicalHost(url.hostname) + (url.pathname.replace(/\/+$/, '') || '/');
  } catch {
    return String(raw);
  }
}

function observedSurfaceCandidates(observation, groups, homepage, knownItems) {
  const candidates = [];
  const seen = new Set();
  const add = (raw, source, requireCatalogSegment) => {
    try {
      const url = new URL(raw, observation.url);
      url.hash = '';
      url.search = '';
      if (!publicSameOrigin(url.href, homepage)
        || !catalogSurfaceMatchesKnownKinds(url.href, homepage, knownItems)) return;
      const segments = url.pathname.split('/').filter(Boolean).map(segment => segment.toLowerCase());
      if (requireCatalogSegment && !CATALOG_PATH_SEGMENTS.has(segments.at(-1))) return;
      const key = surfaceKey(url.href);
      if (seen.has(key)) return;
      seen.add(key);
      candidates.push({ url: url.href, source });
    } catch {
      // Invalid observed links are ignored.
    }
  };
  for (const link of observation.links ?? [])
    add(link.href, 'observed-catalog-link', true);
  for (const group of groups) {
    if (!['category-card', 'category-link'].includes(group.sourcePattern)) continue;
    for (const link of group.links ?? [])
      add(link.href, 'observed-group-link', false);
  }
  return candidates;
}

export async function surveyRegistryCatalogStructure({
  registry,
  items,
  surfaces,
  observePage,
  chooseGroup,
  maxSurfaces = 4,
  maxLinks = 1500,
  surveyedAt = new Date().toISOString(),
  catalogFingerprint = null,
} = {}) {
  if (!registry?.name || !registry?.homepage) throw new Error('Registry identity is required');
  if (!Array.isArray(items)) throw new Error('Catalog items are required');
  if (!Array.isArray(surfaces)) throw new Error('Catalog surfaces are required');
  if (typeof observePage !== 'function') throw new Error('observePage is required');
  if (!Number.isSafeInteger(maxSurfaces) || maxSurfaces < 1 || maxSurfaces > 20)
    throw new Error('Invalid maxSurfaces');
  if (!Number.isSafeInteger(maxLinks) || maxLinks < 1 || maxLinks > 10000)
    throw new Error('Invalid maxLinks');

  const knownItems = uniqueItems(items);
  const groups = [];
  const observedAssets = new Map();
  const visitedSurfaces = [];
  const errors = [];

  const pendingSurfaces = surfaces.map(surface => ({ ...surface }));
  const queuedSurfaces = new Set(pendingSurfaces.map(surface => surfaceKey(surface.url)));
  let attemptedSurfaces = 0;
  while (pendingSurfaces.length && attemptedSurfaces < maxSurfaces) {
    const surface = pendingSurfaces.shift();
    attemptedSurfaces++;
    try {
      const observation = await observePage(surface.url, { maxLinks });
      if (!publicSameOrigin(observation?.url, registry.homepage))
        throw new Error('Observed page left the official registry origin');
      const discovered = discoverCatalogGroups(observation, { knownItems });
      for (const group of discovered.groups) mergeGroup(groups, group);
      for (const asset of discovered.observedAssets ?? []) {
        const existing = observedAssets.get(asset.id);
        if (existing) {
          if (!existing.sourceUrls.includes(asset.sourceUrl))
            existing.sourceUrls.push(asset.sourceUrl);
        } else {
          observedAssets.set(asset.id, {
            id: asset.id,
            text: asset.text,
            href: asset.href,
            sourceUrls: [asset.sourceUrl],
          });
        }
      }
      visitedSurfaces.push({
        requestedUrl: surface.url,
        finalUrl: observation.url,
        source: surface.source,
        groupCount: discovered.groups.length,
        observedItemCount: discovered.observedAssets?.length ?? 0,
      });
      for (const candidate of observedSurfaceCandidates(
        observation, discovered.groups, registry.homepage, knownItems
      )) {
        const key = surfaceKey(candidate.url);
        if (queuedSurfaces.has(key)) continue;
        queuedSurfaces.add(key);
        pendingSurfaces.push(candidate);
      }
    } catch (error) {
      errors.push({
        type: 'surface',
        url: surface.url,
        message: String(error?.message ?? error).slice(0, 250),
      });
    }
  }

  const classified = [];
  for (const sourceItem of knownItems) {
    const direct = resolveDirectMembership(sourceItem.name, groups);
    const observed = observedAssets.get(sourceItem.name);
    const candidateGroups = observed
      ? groups.filter(group => (group.sourceUrls ?? [group.sourceUrl])
        .some(sourceUrl => observed.sourceUrls.includes(sourceUrl)))
      : [];
    const candidateLabels = candidateGroups.map(group => group.label);
    let row = {
      id: sourceItem.name,
      rawKind: sourceItem.type ?? 'registry:item',
      kind: normalizeCatalogKind(sourceItem.type),
      groups: [],
      access: 'unknown',
      assignment: 'unresolved',
    };

    if (direct.length) {
      row = {
        ...row,
        groups: direct,
        access: classifyObservedAccess({ groups: direct }),
        assignment: 'deterministic',
      };
    } else if (!observed) {
      row = { ...row, reason: 'not-observed-on-surveyed-surface' };
    } else if (!candidateLabels.length) {
      row = { ...row, groups: [], access: 'unknown', assignment: 'flat' };
    } else if (typeof chooseGroup !== 'function') {
      row = { ...row, reason: 'ambiguous-no-decision-model' };
    } else {
      const decisionLabels = shortlistObservedGroupLabels(observed, candidateGroups);
      if (!decisionLabels.length) {
        row = { ...row, reason: 'decision-candidates-too-broad' };
        classified.push(row);
        continue;
      }
      try {
        const decision = await chooseGroup({
          state: compactDecisionState(observed, candidateGroups, decisionLabels),
          groups: decisionLabels,
        });
        if (decision?.choice === 'NONE') {
          row = {
            ...row,
            reason: 'decision-none',
            decision: {
              probability: decision.probability ?? decision.probabilities?.NONE ?? null,
              confidence: decision.confidence ?? null,
            },
          };
        } else if (!decisionLabels.includes(decision?.choice)) {
          throw new Error('Decision returned a group outside the observed labels');
        } else {
          row = {
            ...row,
            groups: [decision.choice],
            access: classifyObservedAccess({ groups: [decision.choice] }),
            assignment: 'clef',
            decision: {
              probability: decision.probability ?? decision.probabilities?.[decision.choice] ?? null,
              confidence: decision.confidence ?? null,
            },
          };
        }
      } catch (error) {
        row = { ...row, reason: 'decision-failed' };
        errors.push({
          type: 'decision',
          item: sourceItem.name,
          message: String(error?.message ?? error).slice(0, 250),
        });
      }
    }
    classified.push(row);
  }

  const access = { free: 0, paid: 0, unknown: 0 };
  for (const row of classified) access[row.access]++;

  return {
    schema: CATALOG_STRUCTURE_SURVEY_SCHEMA,
    namespace: registry.name,
    officialHomepage: registry.homepage,
    surveyedAt,
    catalogFingerprint,
    status: visitedSurfaces.length ? 'surveyed' : surfaces.length ? 'navigation-failed' : 'no-surface',
    surfaces: visitedSurfaces,
    groups,
    items: classified,
    errors,
    summary: {
      items: classified.length,
      observedItems: observedAssets.size,
      groups: groups.length,
      deterministic: classified.filter(row => row.assignment === 'deterministic').length,
      clef: classified.filter(row => row.assignment === 'clef').length,
      flat: classified.filter(row => row.assignment === 'flat').length,
      unresolved: classified.filter(row => row.assignment === 'unresolved').length,
      kinds: countBy(classified, row => row.kind),
      access,
    },
  };
}

export async function writeRegistrySurveyArtifact(outputDir, artifact) {
  if (!isAbsolute(outputDir)) throw new Error('Survey output directory must be absolute');
  if (!artifact?.namespace || artifact.schema !== CATALOG_STRUCTURE_SURVEY_SCHEMA)
    throw new Error('Invalid catalog structure survey artifact');
  await mkdir(outputDir, { recursive: true });
  const filename = artifact.namespace.replace(/^@/, '') + '.json';
  const destination = join(outputDir, filename);
  const partial = destination + '.partial';
  await writeFile(partial, JSON.stringify(artifact, null, 2) + '\n');
  await rename(partial, destination);
  return destination;
}
