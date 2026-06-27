import {
  buildBaseDetail,
  fetchErrorResult,
  invalidJsonResult,
  normalizeRegistryItemDetailJson,
  resolveRegistryItemDetailFromSummary,
  type RegistryItemDetailResult,
} from '../core/registryItemDetail.ts';
import type { Registry } from '../core/registry.schema.ts';

export async function loadRegistryItemDetail(
  registries: readonly Registry[],
  namespace: string | null | undefined,
  itemSlug: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<RegistryItemDetailResult> {
  const summaryResult = resolveRegistryItemDetailFromSummary(registries, namespace, itemSlug);
  if (summaryResult.status !== 'summary-only' || summaryResult.detail.route.status !== 'available') {
    return summaryResult;
  }

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

    return resolveRegistryItemDetailFromSummary(registries, namespace, itemSlug, payload);
  } catch (error) {
    return fetchErrorResult(summaryResult.detail, error instanceof Error ? error.name : 'network-error');
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
