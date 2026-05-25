import type { ComponentTag, PrimaryFocus, Registry } from '../core/registry.schema';
import {
  type MirrorValidationIssue,
  validateRegistryMirror,
} from '../core/registryMirror';

export interface RegistryMirrorMeta {
  source_url: string;
  synced_at: string;
  upstream_count: number;
  registry_count: number;
  local_count: number;
  validation_status: string;
  report_path: string;
}

export interface LoadedRegistryData {
  registries: Registry[];
  meta: RegistryMirrorMeta;
  warnings: MirrorValidationIssue[];
}

interface RegistryMirrorRecord {
  official: {
    name: string;
    homepage: string;
    registry_url_template: string;
    description: string;
  };
  atlas?: {
    primary_focus?: PrimaryFocus[];
    component_tags?: ComponentTag[];
  };
  status?: {
    warnings?: string[];
  };
}

interface RegistryMirrorData {
  meta: RegistryMirrorMeta;
  registries: RegistryMirrorRecord[];
}

type FetchLike = (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;

export async function loadRegistries(fetchImpl: FetchLike = fetch): Promise<LoadedRegistryData> {
  const url = `${import.meta.env.BASE_URL}data/registries.json`;
  const response = await fetchImpl(url);

  if (!response.ok) {
    throw new Error(`Registry mirror fetch failed: ${response.status} ${response.statusText}`);
  }

  const mirrorData = await response.json() as unknown;
  const validation = validateRegistryMirror(mirrorData);

  if (validation.errors.length > 0) {
    throw new Error(`Registry mirror validation failed: ${validation.errors.length} error(s)`);
  }

  const typedMirror = mirrorData as RegistryMirrorData;
  const warningsByNamespace = groupWarningsByNamespace(validation.warnings);

  return {
    meta: typedMirror.meta,
    warnings: validation.warnings,
    registries: typedMirror.registries.map(record => ({
      name: record.official.name,
      url: record.official.homepage,
      description: record.official.description,
      primary_focus: record.atlas?.primary_focus ?? [],
      component_tags: record.atlas?.component_tags ?? [],
      framework: 'React',
      license: 'Community',
      mirror: {
        officialName: record.official.name,
        registryUrlTemplate: record.official.registry_url_template,
        warnings: [
          ...(record.status?.warnings ?? []),
          ...(warningsByNamespace.get(record.official.name) ?? []),
        ],
      },
    })),
  };
}

function groupWarningsByNamespace(warnings: readonly MirrorValidationIssue[]): Map<string, string[]> {
  const grouped = new Map<string, string[]>();

  warnings.forEach(warning => {
    if (!warning.namespace) {
      return;
    }

    const existing = grouped.get(warning.namespace) ?? [];
    existing.push(warning.message);
    grouped.set(warning.namespace, existing);
  });

  return grouped;
}
