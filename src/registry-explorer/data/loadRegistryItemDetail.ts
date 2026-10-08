import {
  buildBaseDetail,
  fetchErrorResult,
  invalidJsonResult,
  normalizeRegistryItemDetailJson,
  resolveRegistryItemDetailFromCatalogIndex,
  resolveRegistryItemDetailFromSummary,
  type RegistryItemDetailResult,
} from '../core/registryItemDetail.ts';
import type { Registry, RegistryCatalogIndex } from '../core/registry.schema.ts';
import { loadDetailRuntimeDatabase, queryOneJson } from './runtimeDatabase.ts';

export async function loadRegistryItemDetail(
  registries: readonly Registry[],
  namespace: string | null | undefined,
  itemSlug: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<RegistryItemDetailResult> {
  const summaryResult = resolveRegistryItemDetailFromSummary(registries, namespace, itemSlug);
  return loadResolvedRegistryItemDetail(
    summaryResult,
    payload => resolveRegistryItemDetailFromSummary(registries, namespace, itemSlug, payload),
    namespace,
    fetchImpl,
  );
}

export async function loadRegistryItemDetailFromCatalogIndex(
  registries: readonly Registry[],
  catalogIndex: RegistryCatalogIndex,
  namespace: string | null | undefined,
  itemSlug: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<RegistryItemDetailResult> {
  const summaryResult = resolveRegistryItemDetailFromCatalogIndex(
    registries,
    catalogIndex,
    namespace,
    itemSlug,
  );
  return loadResolvedRegistryItemDetail(
    summaryResult,
    payload => resolveRegistryItemDetailFromCatalogIndex(
      registries,
      catalogIndex,
      namespace,
      itemSlug,
      payload,
    ),
    namespace,
    fetchImpl,
  );
}

async function loadResolvedRegistryItemDetail(
  summaryResult: RegistryItemDetailResult,
  resolveWithPayload: (payload: unknown) => RegistryItemDetailResult,
  namespace: string | null | undefined,
  fetchImpl: typeof fetch,
): Promise<RegistryItemDetailResult> {
  if (summaryResult.status !== 'summary-only' || summaryResult.detail.route.status !== 'available') {
    return summaryResult;
  }

  const localResult = await loadDatabaseDetail(
    summaryResult,
    resolveWithPayload,
    namespace,
    fetchImpl,
  );
  if (localResult) return localResult;

  try {
    const response = await fetchImpl(summaryResult.detail.route.url);
    if (!response.ok) {
      return fetchErrorResult(summaryResult.detail, `http-${response.status}`);
    }

    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      return invalidJsonResult(summaryResult.detail);
    }

    const normalized = normalizeRegistryItemDetailJson(payload);
    if (!normalized.valid) {
      return {
        status: 'invalid-schema',
        detail: summaryResult.detail,
        message: 'Registry item data did not match the expected safe shape.',
        reason: normalized.reason,
      };
    }

    return resolveWithPayload(payload);
  } catch (error) {
    return fetchErrorResult(summaryResult.detail, error instanceof Error ? error.name : 'network-error');
  }
}

async function loadDatabaseDetail(
  summaryResult: Extract<RegistryItemDetailResult, { status: 'summary-only' }>,
  resolveWithPayload: (payload: unknown) => RegistryItemDetailResult,
  namespace: string | null | undefined,
  fetchImpl: typeof fetch,
): Promise<RegistryItemDetailResult | null> {
  const registryName = namespace?.trim();
  if (!registryName) return null;

  try {
    const database = await loadDetailRuntimeDatabase(fetchImpl);
    const item = queryOneJson<unknown>(
      database,
      'SELECT payload_json FROM atlas_item_details WHERE namespace=? AND name=? LIMIT 1',
      [registryName, summaryResult.detail.slug],
    );
    if (!item) return null;

    const normalized = normalizeRegistryItemDetailJson(item);
    if (!normalized.valid) {
      return {
        status: 'invalid-schema',
        detail: summaryResult.detail,
        message: 'Registry item data did not match the expected safe shape.',
        reason: normalized.reason,
      };
    }
    return resolveWithPayload(item);
  } catch {
    return null;
  }
}

export function buildSummaryOnlyRegistryItemDetail(
  registry: Registry,
  itemSlug: string,
): RegistryItemDetailResult {
  const summary = registry.itemSummaries?.find(item => item.slug === itemSlug);
  if (!summary) {
    return {
      status: 'not-found',
      detail: null,
      message: 'Item not found in registry catalog.',
      reason: 'missing-item',
    };
  }

  return {
    status: 'summary-only',
    detail: buildBaseDetail(registry, summary),
    message: 'Full item JSON was not loaded; showing catalog summary details.',
  };
}
