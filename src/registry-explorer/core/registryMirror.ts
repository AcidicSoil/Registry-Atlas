import type { RawJsonInput } from './jsonInput';
import { isInputBoolean, isInputObject, isInputString } from './inputChecks.ts';
import {
  COVERAGE_CONFIDENCE_VALUES,
  COVERAGE_STATUS_VALUES,
  ITEM_CATALOG_STATUS_VALUES,
} from './coverageStatus.ts';
import {
  type CoverageConfidence,
  type CoverageStatus,
  type ItemCatalogStatus,
} from './registry.schema.ts';

export type MirrorValidationSeverity = 'error' | 'warning';

export type MirrorValidationCode =
  | 'mirror-invalid-shape'
  | 'raw-invalid-shape'
  | 'count-mismatch'
  | 'namespace-missing'
  | 'namespace-missing-prefix'
  | 'namespace-duplicate'
  | 'url-missing'
  | 'url-protocol-relative'
  | 'url-malformed'
  | 'url-protocol-disallowed'
  | 'url-http'
  | 'template-missing-token'
  | 'atlas-invalid-primary-focus'
  | 'atlas-invalid-component-tag'
  | 'atlas-invalid-coverage-status'
  | 'atlas-invalid-confidence'
  | 'atlas-invalid-catalog-status'
  | 'atlas-invalid-item-summary'
  | 'atlas-invalid-item-slug'
  | 'atlas-invalid-item-url'
  | 'atlas-invalid-item-token'
  | 'atlas-invalid-item-command'
  | 'atlas-invalid-item-array'
  | 'atlas-invalid-item-file';

export interface MirrorValidationIssue {
  code: MirrorValidationCode;
  message: string;
  severity: MirrorValidationSeverity;
  namespace?: string;
  field?: string;
  value?: string;
}

export interface MirrorValidationResult {
  errors: MirrorValidationIssue[];
  warnings: MirrorValidationIssue[];
}

interface UrlPolicy {
  allowedProtocols: readonly string[];
  warningProtocols: readonly string[];
}

interface MirrorRecord {
  official?: {
    name?: unknown;
    homepage?: unknown;
    registry_url_template?: unknown;
    description?: unknown;
  };
  atlas?: {
    coverage_status?: unknown;
    confidence?: unknown;
    catalog_status?: unknown;
    item_summaries?: unknown;
  };
}

interface MirrorData {
  meta?: {
    upstream_count?: unknown;
    registry_count?: unknown;
    local_count?: unknown;
  };
  registries?: unknown;
}

interface RawRegistry {
  name?: unknown;
  homepage?: unknown;
  url?: unknown;
}

const OFFICIAL_URL_POLICY: UrlPolicy = {
  allowedProtocols: ['https:', 'http:'],
  warningProtocols: ['http:'],
};

const COVERAGE_STATUS_SET = new Set<CoverageStatus>(COVERAGE_STATUS_VALUES);

const COVERAGE_CONFIDENCE_SET = new Set<CoverageConfidence>(COVERAGE_CONFIDENCE_VALUES);

const ITEM_CATALOG_STATUS_SET = new Set<ItemCatalogStatus>(ITEM_CATALOG_STATUS_VALUES);

const ITEM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const INSTALL_TOKEN_PATTERN = /^@[a-z0-9][a-z0-9-]*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateRegistryMirror(mirror: RawJsonInput, raw?: RawJsonInput): MirrorValidationResult {
  const result = createResult();

  if (!isObject(mirror)) {
    addIssue(result, {
      code: 'mirror-invalid-shape',
      message: 'Mirror data must be an object.',
      severity: 'error',
    });

    return result;
  }

  // SAFETY: The mirror and record fields have been validated by the preceding fail-closed structure and enum checks.
  const mirrorData = mirror as MirrorData;

  if (!Array.isArray(mirrorData.registries)) {
    addIssue(result, {
      code: 'mirror-invalid-shape',
      message: 'Mirror data must include a registries array.',
      severity: 'error',
      field: 'registries',
    });

    return result;
  }

  if (raw !== undefined) {
    validateRawRegistries(raw, mirrorData.registries.length, result);
  }

  validateCount('meta.upstream_count', mirrorData.meta?.upstream_count, mirrorData.registries.length, result);
  validateCount('meta.registry_count', mirrorData.meta?.registry_count, mirrorData.registries.length, result);
  validateCount('meta.local_count', mirrorData.meta?.local_count, mirrorData.registries.length, result);

  const seenNamespaces = new Set<string>();

  mirrorData.registries.forEach((record, index) => {
    if (!isObject(record)) {
      addIssue(result, {
        code: 'mirror-invalid-shape',
        message: `Registry record ${index} must be an object.`,
        severity: 'error',
      });

      return;
    }

    // SAFETY: The mirror and record fields have been validated by the preceding fail-closed structure and enum checks.
    validateMirrorRecord(record as MirrorRecord, index, seenNamespaces, result);
  });

  return result;
}

export function validateNamespace(
  namespace: RawJsonInput,
  seenNamespaces = new Set<string>(),
): MirrorValidationResult {
  const result = createResult();
  validateNamespaceIntoResult(namespace, seenNamespaces, result);

  return result;
}

export function validateUrlField(
  value: RawJsonInput,
  field: string,
  namespace?: string,
): MirrorValidationResult {
  const result = createResult();
  validateUrlIntoResult(value, field, namespace, result);

  return result;
}

export function validateRegistryUrlTemplate(
  value: RawJsonInput,
  namespace?: string,
): MirrorValidationResult {
  const result = createResult();
  validateRegistryUrlTemplateIntoResult(value, namespace, result);

  return result;
}

function validateRawRegistries(raw: RawJsonInput, mirrorCount: number, result: MirrorValidationResult): void {
  if (!Array.isArray(raw)) {
    addIssue(result, {
      code: 'raw-invalid-shape',
      message: 'Raw upstream data must be an array.',
      severity: 'error',
    });

    return;
  }

  if (raw.length !== mirrorCount) {
    addIssue(result, {
      code: 'count-mismatch',
      message: `Raw upstream count (${raw.length}) must equal registries.length (${mirrorCount}).`,
      severity: 'error',
      field: 'raw.length',
      value: String(raw.length),
    });
  }

  const seenNamespaces = new Set<string>();

  raw.forEach((record, index) => {
    if (!isObject(record)) {
      addIssue(result, {
        code: 'raw-invalid-shape',
        message: `Raw registry record ${index} must be an object.`,
        severity: 'error',
      });

      return;
    }

    // SAFETY: The mirror and record fields have been validated by the preceding fail-closed structure and enum checks.
    const rawRecord = record as RawRegistry;
    const namespace = validateNamespaceIntoResult(rawRecord.name, seenNamespaces, result);
    validateUrlIntoResult(rawRecord.homepage, 'raw.homepage', namespace, result);
    validateRegistryUrlTemplateIntoResult(rawRecord.url, namespace, 'raw.url', result);
  });
}

function validateMirrorRecord(
  record: MirrorRecord,
  index: number,
  seenNamespaces: Set<string>,
  result: MirrorValidationResult,
): void {
  const namespace = validateNamespaceIntoResult(record.official?.name, seenNamespaces, result);
  const label = namespace ?? `record ${index}`;

  validateUrlIntoResult(record.official?.homepage, 'official.homepage', namespace, result);
  validateRegistryUrlTemplateIntoResult(record.official?.registry_url_template, namespace, 'official.registry_url_template', result);
  validateAtlasScalar(record.atlas?.coverage_status, COVERAGE_STATUS_SET, 'atlas.coverage_status', 'atlas-invalid-coverage-status', label, result);
  validateAtlasScalar(record.atlas?.confidence, COVERAGE_CONFIDENCE_SET, 'atlas.confidence', 'atlas-invalid-confidence', label, result);
  validateAtlasScalar(record.atlas?.catalog_status, ITEM_CATALOG_STATUS_SET, 'atlas.catalog_status', 'atlas-invalid-catalog-status', label, result);
  validateItemSummaries(record.atlas?.item_summaries, label, record.official?.registry_url_template, result);
}

function validateNamespaceIntoResult(
  namespace: RawJsonInput,
  seenNamespaces: Set<string>,
  result: MirrorValidationResult,
): string | undefined {
  if (!isInputString(namespace) || namespace.trim().length === 0) {
    addIssue(result, {
      code: 'namespace-missing',
      message: 'Registry namespace is required.',
      severity: 'error',
      field: 'official.name',
    });

    return undefined;
  }

  const trimmed = namespace.trim();

  if (!trimmed.startsWith('@')) {
    addIssue(result, {
      code: 'namespace-missing-prefix',
      message: `Registry namespace "${trimmed}" must start with @.`,
      severity: 'error',
      namespace: trimmed,
      field: 'official.name',
      value: trimmed,
    });
  }

  const lookupKey = trimmed.toLowerCase();

  if (seenNamespaces.has(lookupKey)) {
    addIssue(result, {
      code: 'namespace-duplicate',
      message: `Registry namespace "${trimmed}" is duplicated.`,
      severity: 'error',
      namespace: trimmed,
      field: 'official.name',
      value: trimmed,
    });
  }

  seenNamespaces.add(lookupKey);

  return trimmed;
}

function validateUrlIntoResult(
  value: RawJsonInput,
  field: string,
  namespace: string | undefined,
  result: MirrorValidationResult,
): void {
  if (!isInputString(value) || value.trim().length === 0) {
    addIssue(result, {
      code: 'url-missing',
      message: `${field} is required.`,
      severity: 'error',
      namespace,
      field,
    });

    return;
  }

  const trimmed = value.trim();

  if (trimmed.startsWith('//')) {
    addIssue(result, {
      code: 'url-protocol-relative',
      message: `${field} must include an explicit protocol.`,
      severity: 'error',
      namespace,
      field,
      value: trimmed,
    });

    return;
  }

  let url: URL;

  try {
    url = new URL(trimmed);
  } catch {
    addIssue(result, {
      code: 'url-malformed',
      message: `${field} must be a valid absolute URL.`,
      severity: 'error',
      namespace,
      field,
      value: trimmed,
    });

    return;
  }

  if (!OFFICIAL_URL_POLICY.allowedProtocols.includes(url.protocol)) {
    addIssue(result, {
      code: 'url-protocol-disallowed',
      message: `${field} uses unsupported protocol "${url.protocol}".`,
      severity: 'error',
      namespace,
      field,
      value: trimmed,
    });

    return;
  }

  if (OFFICIAL_URL_POLICY.warningProtocols.includes(url.protocol)) {
    addIssue(result, {
      code: 'url-http',
      message: `${field} uses HTTP from the official directory.`,
      severity: 'warning',
      namespace,
      field,
      value: trimmed,
    });
  }
}

function validateRegistryUrlTemplateIntoResult(
  value: RawJsonInput,
  namespace: string | undefined,
  resultOrField: MirrorValidationResult | string,
  maybeResult?: MirrorValidationResult,
): void {
  const field = isInputString(resultOrField) ? resultOrField : 'official.registry_url_template';
  const result = isInputString(resultOrField) ? maybeResult : resultOrField;

  if (!result) {
    return;
  }

  validateUrlIntoResult(value, field, namespace, result);

  if (!isInputString(value) || !value.includes('{name}')) {
    addIssue(result, {
      code: 'template-missing-token',
      message: `${field} must include the {name} token.`,
      severity: 'error',
      namespace,
      field,
      value: isInputString(value) ? value : undefined,
    });
  }
}

function validateAtlasScalar(
  value: RawJsonInput,
  allowedValues: ReadonlySet<string>,
  field: string,
  code: MirrorValidationCode,
  namespace: string,
  result: MirrorValidationResult,
): void {
  if (value === undefined) {
    return;
  }

  if (isInputString(value) && allowedValues.has(value)) {
    return;
  }

  addIssue(result, {
    code,
    message: `${field} contains an unknown value.`,
    severity: 'error',
    namespace,
    field,
    value: isInputString(value) ? value : String(value),
  });
}

function validateItemSummaries(
  value: RawJsonInput,
  namespace: string,
  registryUrlTemplate: RawJsonInput,
  result: MirrorValidationResult,
): void {
  if (value === undefined) {
    return;
  }

  if (!Array.isArray(value)) {
    addIssue(result, {
      code: 'atlas-invalid-item-summary',
      message: 'atlas.item_summaries must be an array.',
      severity: 'error',
      namespace,
      field: 'atlas.item_summaries',
    });

    return;
  }


  value.forEach((item, index) => validateItemSummary(item, index, namespace, registryUrlTemplate, result));
}

function validateItemSummaryIdentity(
  record: Record<string, RawJsonInput>,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
): void {
    const slug = record.slug;

    if (!isInputString(record.name) || record.name.trim() === '') {
      addIssue(result, {
        code: 'atlas-invalid-item-summary',
        message: `${field}.name is required.`,
        severity: 'error',
        namespace,
        field: `${field}.name`,
      });
    }

    if (!isInputString(record.source) || record.source.trim() === '' || !isInputString(record.provenance) || record.provenance.trim() === '') {
      addIssue(result, {
        code: 'atlas-invalid-item-summary',
        message: `${field} requires source and provenance.`,
        severity: 'error',
        namespace,
        field,
      });
    }

    if (!isInputString(slug) || !ITEM_SLUG_PATTERN.test(slug)) {
      addIssue(result, {
        code: 'atlas-invalid-item-slug',
        message: `${field}.slug must be a lowercase kebab-case slug.`,
        severity: 'error',
        namespace,
        field: `${field}.slug`,
        value: isInputString(slug) ? slug : String(slug),
      });
    }
}

function isKnownCatalogStatus(value: string): value is ItemCatalogStatus {
  return [...ITEM_CATALOG_STATUS_SET].some(kind => kind === value);
}

function isKnownConfidence(value: string): value is CoverageConfidence {
  return [...COVERAGE_CONFIDENCE_SET].some(kind => kind === value);
}

function validateItemSummaryStatus(
  record: Record<string, RawJsonInput>,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
): void {
  const catalogStatus = record.catalog_status ?? record.catalogStatus;
  const routeEligible = record.route_eligible ?? record.routeEligible;

    if (!isInputString(catalogStatus) || !isKnownCatalogStatus(catalogStatus)) {
      addIssue(result, {
        code: 'atlas-invalid-catalog-status',
        message: `${field}.catalog_status contains an unknown value.`,
        severity: 'error',
        namespace,
        field: `${field}.catalog_status`,
        value: isInputString(catalogStatus) ? catalogStatus : String(catalogStatus),
      });
    }

    if (routeEligible !== undefined && !isInputBoolean(routeEligible)) {
      addIssue(result, {
        code: 'atlas-invalid-item-summary',
        message: `${field}.route_eligible must be a boolean.`,
        severity: 'error',
        namespace,
        field: `${field}.route_eligible`,
        value: String(routeEligible),
      });
    }
}

function validateItemSummaryRoute(
  record: Record<string, RawJsonInput>,
  field: string,
  namespace: string,
  registryUrlTemplate: RawJsonInput,
  result: MirrorValidationResult,
): void {
  const slug = record.slug;
  const routeEligible = record.route_eligible ?? record.routeEligible;
    const rawItemUrl = record.raw_item_url ?? record.rawItemUrl;

    if (routeEligible === true && (!isInputString(slug) || !ITEM_SLUG_PATTERN.test(slug) || !hasRouteSource(registryUrlTemplate, rawItemUrl))) {
      addIssue(result, {
        code: 'atlas-invalid-item-summary',
        message: `${field}.route_eligible requires a valid slug and registry URL template or raw item URL.`,
        severity: 'error',
        namespace,
        field: `${field}.route_eligible`,
      });
    }
}

function validateItemSummaryOptionalFields(
  record: Record<string, RawJsonInput>,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
): void {
  const rawItemUrl = record.raw_item_url ?? record.rawItemUrl;
    validateOptionalUrlField(rawItemUrl, `${field}.raw_item_url`, namespace, result);
    validateOptionalUrlField(record.docs_url ?? record.docsUrl, `${field}.docs_url`, namespace, result);
    validateOptionalUrlField(record.preview_url ?? record.previewUrl, `${field}.preview_url`, namespace, result);
    validateOptionalUrlField(record.evidence_url ?? record.evidenceUrl, `${field}.evidence_url`, namespace, result);
    validateOptionalConfidence(record.confidence, `${field}.confidence`, namespace, result);
    validateOptionalInstallToken(record.install_token ?? record.installToken, `${field}.install_token`, namespace, result);
    validateOptionalCommand(record.view_command ?? record.viewCommand, `${field}.view_command`, namespace, result, 'view');
    validateOptionalCommand(record.install_command ?? record.installCommand, `${field}.install_command`, namespace, result, 'add');
    validateOptionalStringArray(record.dependencies, `${field}.dependencies`, namespace, result);
    validateOptionalStringArray(record.devDependencies, `${field}.devDependencies`, namespace, result);
    validateOptionalStringArray(record.registryDependencies, `${field}.registryDependencies`, namespace, result);
    validateOptionalStringArray(record.warnings, `${field}.warnings`, namespace, result);
    validateOptionalFiles(record.files, `${field}.files`, namespace, result);
}

function validateItemSummary(
  item: RawJsonInput,
  index: number,
  namespace: string,
  registryUrlTemplate: RawJsonInput,
  result: MirrorValidationResult,
): void {
  const field = 'atlas.item_summaries[' + index + ']';

  if (!isObject(item)) {
    addIssue(result, {
      code: 'atlas-invalid-item-summary',
      message: field + ' must be an object.',
      severity: 'error',
      namespace,
      field,
    });

    return;
  }

  validateItemSummaryIdentity(item, field, namespace, result);
  validateItemSummaryStatus(item, field, namespace, result);
  validateItemSummaryRoute(item, field, namespace, registryUrlTemplate, result);
  validateItemSummaryOptionalFields(item, field, namespace, result);
}

function hasRouteSource(registryUrlTemplate: RawJsonInput, rawItemUrl: RawJsonInput): boolean {
  return (isInputString(registryUrlTemplate) && registryUrlTemplate.includes('{name}'))
    || (isInputString(rawItemUrl) && rawItemUrl.trim().length > 0);
}

function validateOptionalUrlField(
  value: RawJsonInput,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
): void {
  if (value === undefined || value === null || value === '') return;

  if (!isInputString(value)) {
    addIssue(result, {
      code: 'atlas-invalid-item-url',
      message: `${field} must be a URL string when present.`,
      severity: 'error',
      namespace,
      field,
      value: String(value),
    });

    return;
  }

  const beforeErrors = result.errors.length;
  validateUrlIntoResult(value, field, namespace, result);

  if (result.errors.length > beforeErrors) {
    const issue = result.errors[result.errors.length - 1];

    if (issue) issue.code = 'atlas-invalid-item-url';
  }
}

function validateOptionalConfidence(
  value: RawJsonInput,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
): void {
  if (value === undefined || value === null || value === '') return;

  if (!isInputString(value) || !isKnownConfidence(value)) {
    addIssue(result, {
      code: 'atlas-invalid-confidence',
      message: `${field} contains an unknown value.`,
      severity: 'error',
      namespace,
      field,
      value: isInputString(value) ? value : String(value),
    });
  }
}

function validateOptionalInstallToken(
  value: RawJsonInput,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
): void {
  if (value === undefined || value === null || value === '') return;

  if (!isInputString(value) || !INSTALL_TOKEN_PATTERN.test(value.trim())) {
    addIssue(result, {
      code: 'atlas-invalid-item-token',
      message: `${field} must be a valid @registry/item token.`,
      severity: 'error',
      namespace,
      field,
      value: isInputString(value) ? value : String(value),
    });
  }
}

function validateOptionalCommand(
  value: RawJsonInput,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
  verb: 'add' | 'view',
): void {
  if (value === undefined || value === null || value === '') return;
  const expectedPrefix = `npx shadcn@latest ${verb} `;

  if (!isInputString(value) || !value.startsWith(expectedPrefix) || !INSTALL_TOKEN_PATTERN.test(value.slice(expectedPrefix.length).trim())) {
    addIssue(result, {
      code: 'atlas-invalid-item-command',
      message: `${field} must be a copy-only shadcn ${verb} command with a valid @registry/item token.`,
      severity: 'error',
      namespace,
      field,
      value: isInputString(value) ? value : String(value),
    });
  }
}

function validateOptionalStringArray(
  value: RawJsonInput,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
): void {
  if (value === undefined || value === null) return;

  if (!Array.isArray(value) || value.some(item => !isInputString(item))) {
    addIssue(result, {
      code: 'atlas-invalid-item-array',
      message: `${field} must be an array of strings when present.`,
      severity: 'error',
      namespace,
      field,
      value: Array.isArray(value) ? undefined : String(value),
    });
  }
}

function validateOptionalFiles(
  value: RawJsonInput,
  field: string,
  namespace: string,
  result: MirrorValidationResult,
): void {
  if (value === undefined || value === null) return;

  if (!Array.isArray(value)) {
    addIssue(result, {
      code: 'atlas-invalid-item-file',
      message: `${field} must be an array when present.`,
      severity: 'error',
      namespace,
      field,
      value: String(value),
    });

    return;
  }

  value.forEach((file, index) => {
    if (!isObject(file) || !isInputString(file.path) || file.path.trim() === '' || !isInputString(file.type) || file.type.trim() === '') {
      addIssue(result, {
        code: 'atlas-invalid-item-file',
        message: `${field}[${index}] requires path and type strings.`,
        severity: 'error',
        namespace,
        field: `${field}[${index}]`,
      });

      return;
    }

    if (file.target !== undefined && !isInputString(file.target)) {
      addIssue(result, {
        code: 'atlas-invalid-item-file',
        message: `${field}[${index}].target must be a string when present.`,
        severity: 'error',
        namespace,
        field: `${field}[${index}].target`,
        value: String(file.target),
      });
    }
  });
}

function validateCount(
  field: string,
  value: RawJsonInput,
  expected: number,
  result: MirrorValidationResult,
): void {
  if (value === undefined) {
    return;
  }

  if (value !== expected) {
    addIssue(result, {
      code: 'count-mismatch',
      message: `${field} must equal registries.length (${expected}).`,
      severity: 'error',
      field,
      value: String(value),
    });
  }
}

function createResult(): MirrorValidationResult {
  return {
    errors: [],
    warnings: [],
  };
}

function addIssue(result: MirrorValidationResult, issue: MirrorValidationIssue): void {
  if (issue.severity === 'error') {
    result.errors.push(issue);

    return;
  }

  result.warnings.push(issue);
}

function isObject(value: RawJsonInput): value is Record<string, RawJsonInput> {
  return isInputObject(value) && value !== null && !Array.isArray(value);
}
