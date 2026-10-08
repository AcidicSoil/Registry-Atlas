import {
  applyCatalogClassificationOverlay,
  validateCatalogClassificationOverlay,
} from './catalog-classification-overlay.mjs';
import {
  flattenCatalogTaxonomy,
  validateCatalogTaxonomy,
} from './catalog-taxonomy.mjs';
import { catalogArtifactFingerprint } from '../evaluate-catalog-classifications.mjs';

function identity(namespace, name) {
  return `${String(namespace).trim().toLowerCase()}\u0000${String(name).trim().toLowerCase()}`;
}

function sameJson(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function pathMap(taxonomy) {
  const records = flattenCatalogTaxonomy(taxonomy);
  const byId = new Map(records.map(record => [record.id, record]));
  const output = new Map();
  for (const record of records) {
    const path = [];
    let current = record;
    while (current) {
      path.unshift(current.id);
      current = current.parentId ? byId.get(current.parentId) : null;
    }
    output.set(record.id, path);
  }
  return output;
}

function managedFields(item) {
  const output = {};
  for (const key of ['kind', 'canonical', 'sourceGroups', 'access']) {
    if (item?.[key] !== undefined) output[key] = item[key];
  }
  return output;
}

export function validateCatalogRuntimeContract({
  sourceTaxonomy,
  runtimeTaxonomy,
  overlay,
  runtimeCatalog,
  accessRules = {},
} = {}) {
  const errors = [];
  const summary = {
    overlayItems: 0,
    runtimeCanonicalItems: 0,
    staleOverlayItems: 0,
    missingOverlayItems: 0,
  };

  let source;
  let runtime;
  let reviewedOverlay;

  try {
    source = validateCatalogTaxonomy(sourceTaxonomy);
  } catch (error) {
    errors.push(`source taxonomy is invalid: ${String(error?.message ?? error)}`);
    return { errors, summary };
  }
  try {
    runtime = validateCatalogTaxonomy(runtimeTaxonomy);
  } catch (error) {
    errors.push(`runtime taxonomy is invalid: ${String(error?.message ?? error)}`);
    return { errors, summary };
  }

  const sourceFingerprint = catalogArtifactFingerprint(source);
  const runtimeFingerprint = catalogArtifactFingerprint(runtime);
  if (sourceFingerprint !== runtimeFingerprint) {
    errors.push('runtime taxonomy does not match the source taxonomy');
  }

  try {
    reviewedOverlay = validateCatalogClassificationOverlay(overlay, source);
    summary.overlayItems = reviewedOverlay.items.length;
  } catch (error) {
    errors.push(`reviewed classification overlay is invalid: ${String(error?.message ?? error)}`);
    return { errors, summary };
  }

  if (reviewedOverlay.taxonomyFingerprint !== sourceFingerprint) {
    errors.push('reviewed classification overlay taxonomy fingerprint does not match the source taxonomy');
  }

  if (!runtimeCatalog || typeof runtimeCatalog !== 'object' || Array.isArray(runtimeCatalog)
    || !runtimeCatalog.registries || typeof runtimeCatalog.registries !== 'object'
    || Array.isArray(runtimeCatalog.registries)) {
    errors.push('runtime catalog must contain a registries object');
    return { errors, summary };
  }

  const expectedPaths = pathMap(source);
  const overlayIds = new Set(reviewedOverlay.items.map(item => identity(item.namespace, item.name)));
  const runtimeKeys = new Set();

  for (const [namespace, items] of Object.entries(runtimeCatalog.registries)) {
    if (!Array.isArray(items)) {
      errors.push(`runtime catalog registry bucket is not an array: ${namespace}`);
      continue;
    }
    for (const item of items) {
      if (!item || typeof item !== 'object' || typeof item.name !== 'string') continue;
      const key = identity(namespace, item.name);
      runtimeKeys.add(key);

      const hasManaged = ['kind', 'canonical', 'sourceGroups', 'access']
        .some(field => item[field] !== undefined);
      if (hasManaged && !overlayIds.has(key)) {
        errors.push(`runtime managed classification is not present in reviewed overlay: ${namespace}/${item.name}`);
      }

      if (item.canonical !== undefined) {
        summary.runtimeCanonicalItems += 1;
        const canonical = item.canonical;
        if (!canonical || typeof canonical !== 'object' || Array.isArray(canonical)
          || canonical.taxonomyVersion !== source.version || !Array.isArray(canonical.path)) {
          errors.push(`runtime canonical value is malformed: ${namespace}/${item.name}`);
          continue;
        }
        if (canonical.primary === null) {
          if (canonical.path.length !== 0) {
            errors.push(`runtime unclassified canonical path must be empty: ${namespace}/${item.name}`);
          }
          continue;
        }
        const expected = expectedPaths.get(canonical.primary);
        if (!expected || !sameJson(expected, canonical.path)) {
          errors.push(`runtime canonical path is outside the approved taxonomy: ${namespace}/${item.name}`);
        }
      }
    }
  }

  let projected;
  try {
    projected = applyCatalogClassificationOverlay(
      runtimeCatalog.registries,
      reviewedOverlay,
      accessRules,
    );
    const projectedManagedKeys = new Set();
    for (const [namespace, items] of Object.entries(projected.itemsByNamespace)) {
      for (const item of items) {
        if (!item || typeof item !== 'object' || typeof item.name !== 'string') continue;
        const hasManaged = ['kind', 'canonical', 'sourceGroups', 'access']
          .some(field => item[field] !== undefined);
        if (hasManaged) projectedManagedKeys.add(identity(namespace, item.name));
      }
    }
    const missingOverlayIds = [...overlayIds].filter(key => !runtimeKeys.has(key));
    const staleOverlayIds = [...overlayIds]
      .filter(key => runtimeKeys.has(key) && !projectedManagedKeys.has(key));
    summary.staleOverlayItems = staleOverlayIds.length;
    summary.missingOverlayItems = missingOverlayIds.length;
    if (staleOverlayIds.length > 0) {
      errors.push(`reviewed overlay has ${staleOverlayIds.length} stale input fingerprint(s) and was not fully applied`);
    }
  } catch (error) {
    errors.push(`reviewed overlay cannot be projected onto runtime catalog: ${String(error?.message ?? error)}`);
    return { errors, summary };
  }

  for (const [namespace, runtimeItems] of Object.entries(runtimeCatalog.registries)) {
    if (!Array.isArray(runtimeItems)) continue;
    const projectedItems = projected.itemsByNamespace?.[namespace];
    if (!Array.isArray(projectedItems) || projectedItems.length !== runtimeItems.length) {
      errors.push(`runtime classification projection shape mismatch: ${namespace}`);
      continue;
    }
    for (let index = 0; index < runtimeItems.length; index += 1) {
      const runtimeItem = runtimeItems[index];
      const projectedItem = projectedItems[index];
      if (!sameJson(managedFields(runtimeItem), managedFields(projectedItem))) {
        const name = runtimeItem?.name ?? projectedItem?.name ?? `index-${index}`;
        errors.push(
          `runtime classification does not match reviewed overlay projection: ${namespace}/${name}`,
        );
      }
    }
  }

  return { errors: [...new Set(errors)], summary };
}
