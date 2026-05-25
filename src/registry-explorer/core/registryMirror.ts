import {
  COMPONENT_TAG_VALUES,
  PRIMARY_FOCUS_VALUES,
  type ComponentTag,
  type PrimaryFocus,
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
  | 'atlas-invalid-component-tag';

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
    primary_focus?: unknown;
    component_tags?: unknown;
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

const PRIMARY_FOCUS_SET = new Set<PrimaryFocus>(PRIMARY_FOCUS_VALUES);
const COMPONENT_TAG_SET = new Set<ComponentTag>(COMPONENT_TAG_VALUES);

export function validateRegistryMirror(mirror: unknown, raw?: unknown): MirrorValidationResult {
  const result = createResult();

  if (!isObject(mirror)) {
    addIssue(result, {
      code: 'mirror-invalid-shape',
      message: 'Mirror data must be an object.',
      severity: 'error',
    });
    return result;
  }

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

    validateMirrorRecord(record as MirrorRecord, index, seenNamespaces, result);
  });

  return result;
}

export function validateNamespace(
  namespace: unknown,
  seenNamespaces = new Set<string>(),
): MirrorValidationResult {
  const result = createResult();
  validateNamespaceIntoResult(namespace, seenNamespaces, result);
  return result;
}

export function validateUrlField(
  value: unknown,
  field: string,
  namespace?: string,
): MirrorValidationResult {
  const result = createResult();
  validateUrlIntoResult(value, field, namespace, result);
  return result;
}

export function validateRegistryUrlTemplate(
  value: unknown,
  namespace?: string,
): MirrorValidationResult {
  const result = createResult();
  validateRegistryUrlTemplateIntoResult(value, namespace, result);
  return result;
}

function validateRawRegistries(raw: unknown, mirrorCount: number, result: MirrorValidationResult): void {
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
  validateAtlasValues(record.atlas?.primary_focus, PRIMARY_FOCUS_SET, 'atlas.primary_focus', 'atlas-invalid-primary-focus', label, result);
  validateAtlasValues(record.atlas?.component_tags, COMPONENT_TAG_SET, 'atlas.component_tags', 'atlas-invalid-component-tag', label, result);
}

function validateNamespaceIntoResult(
  namespace: unknown,
  seenNamespaces: Set<string>,
  result: MirrorValidationResult,
): string | undefined {
  if (typeof namespace !== 'string' || namespace.trim().length === 0) {
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
  value: unknown,
  field: string,
  namespace: string | undefined,
  result: MirrorValidationResult,
): void {
  if (typeof value !== 'string' || value.trim().length === 0) {
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
  value: unknown,
  namespace: string | undefined,
  resultOrField: MirrorValidationResult | string,
  maybeResult?: MirrorValidationResult,
): void {
  const field = typeof resultOrField === 'string' ? resultOrField : 'official.registry_url_template';
  const result = typeof resultOrField === 'string' ? maybeResult : resultOrField;

  if (!result) {
    return;
  }

  validateUrlIntoResult(value, field, namespace, result);

  if (typeof value !== 'string' || !value.includes('{name}')) {
    addIssue(result, {
      code: 'template-missing-token',
      message: `${field} must include the {name} token.`,
      severity: 'error',
      namespace,
      field,
      value: typeof value === 'string' ? value : undefined,
    });
  }
}

function validateAtlasValues(
  values: unknown,
  allowedValues: ReadonlySet<string>,
  field: string,
  code: MirrorValidationCode,
  namespace: string,
  result: MirrorValidationResult,
): void {
  if (values === undefined) {
    return;
  }

  if (!Array.isArray(values)) {
    addIssue(result, {
      code,
      message: `${field} must be an array.`,
      severity: 'error',
      namespace,
      field,
    });
    return;
  }

  values.forEach(value => {
    if (typeof value === 'string' && allowedValues.has(value)) {
      return;
    }

    addIssue(result, {
      code,
      message: `${field} contains an unknown value.`,
      severity: 'error',
      namespace,
      field,
      value: typeof value === 'string' ? value : String(value),
    });
  });
}

function validateCount(
  field: string,
  value: unknown,
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

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
