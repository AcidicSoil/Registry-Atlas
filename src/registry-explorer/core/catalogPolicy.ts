import type { RawJsonInput } from "./jsonInput";
import { isInputObject } from "./inputChecks";
import { parseCatalogTaxonomy, type CatalogTaxonomy } from "./catalogTaxonomy";
import type { CatalogCanonicalKind } from "./registry.schema";

export interface CatalogPolicy {
  readonly taxonomy: CatalogTaxonomy;
  readonly kindOverrides: ReadonlyMap<string, CatalogCanonicalKind>;
}

function isCatalogCanonicalKind(value: RawJsonInput): value is CatalogCanonicalKind {
  return (
    value === "component" ||
    value === "block" ||
    value === "page" ||
    value === "template" ||
    value === "theme" ||
    value === "icon" ||
    value === "other"
  );
}

/** Parse source-specific classification policy without mutating module state. */
export function parseCatalogPolicy(
  taxonomyValue: RawJsonInput,
  overrideValue: RawJsonInput,
): CatalogPolicy {
  const taxonomy = parseCatalogTaxonomy(taxonomyValue);

  const registryDefaults =
    isRecord(overrideValue) && isRecord(overrideValue.registryDefaults)
      ? overrideValue.registryDefaults
      : {};

  const kindOverrides = new Map<string, CatalogCanonicalKind>(
    Object.entries(registryDefaults).flatMap(([namespace, kind]) =>
      isCatalogCanonicalKind(kind) ? [[namespace, kind] as const] : [],
    ),
  );

  return { taxonomy, kindOverrides };
}

function isRecord(value: RawJsonInput): value is Record<string, RawJsonInput> {
  return isInputObject(value) && value !== null && !Array.isArray(value);
}
