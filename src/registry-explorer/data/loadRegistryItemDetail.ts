import type { RawJsonInput } from "../core/jsonInput";
import {
  fetchErrorResult,
  invalidJsonResult,
  normalizeRegistryItemDetailJson,
  resolveRegistryItemDetailFromCatalogIndex,
  resolveRegistryItemDetailFromSummary,
  type RegistryItemDetailResult,
} from "../core/registryItemDetail.ts";
import type { Registry, RegistryCatalogIndex } from "../core/registry.schema.ts";
import type { CatalogPolicy } from "../core/catalogPolicy";
import { loadDetailRuntimeData } from "./runtimeJson.ts";

export async function loadRegistryItemDetail(
  registries: readonly Registry[],
  namespace: string | null | undefined,
  itemSlug: string | null | undefined,
  fetchImpl: typeof fetch = fetch,
): Promise<RegistryItemDetailResult> {
  const summaryResult = resolveRegistryItemDetailFromSummary(registries, namespace, itemSlug);

  return loadResolvedRegistryItemDetail(
    summaryResult,
    (payload) => resolveRegistryItemDetailFromSummary(registries, namespace, itemSlug, payload),
    namespace,
    fetchImpl,
  );
}

export async function loadRegistryItemDetailFromCatalogIndex(
  registries: readonly Registry[],
  catalogIndex: RegistryCatalogIndex,
  namespace: string | null | undefined,
  itemSlug: string | null | undefined,
  policy: CatalogPolicy,
  fetchImpl: typeof fetch = fetch,
): Promise<RegistryItemDetailResult> {
  const summaryResult = resolveRegistryItemDetailFromCatalogIndex(
    registries,
    catalogIndex,
    namespace,
    itemSlug,
    policy,
  );

  return loadResolvedRegistryItemDetail(
    summaryResult,
    (payload) =>
      resolveRegistryItemDetailFromCatalogIndex(
        registries,
        catalogIndex,
        namespace,
        itemSlug,
        policy,
        payload,
      ),
    namespace,
    fetchImpl,
  );
}

async function loadResolvedRegistryItemDetail(
  summaryResult: RegistryItemDetailResult,
  resolveWithPayload: (payload: RawJsonInput) => RegistryItemDetailResult,
  namespace: string | null | undefined,
  fetchImpl: typeof fetch,
): Promise<RegistryItemDetailResult> {
  if (
    summaryResult.status !== "summary-only" ||
    summaryResult.detail.route.status !== "available"
  ) {
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

    return parseFetchedRegistryDetail(response, summaryResult.detail, resolveWithPayload);
  } catch (error) {
    return fetchErrorResult(
      summaryResult.detail,
      error instanceof Error ? error.name : "network-error",
    );
  }
}

async function parseFetchedRegistryDetail(
  response: Response,
  detail: Extract<RegistryItemDetailResult, { status: "summary-only" }>["detail"],
  resolveWithPayload: (payload: RawJsonInput) => RegistryItemDetailResult,
): Promise<RegistryItemDetailResult> {
  if (!response.ok) return fetchErrorResult(detail, `http-${response.status}`);

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    return invalidJsonResult(detail);
  }

  const normalized = normalizeRegistryItemDetailJson(payload);

  if (!normalized.valid)
    return {
      status: "invalid-schema",
      detail,
      message: "Registry item data did not match the expected safe shape.",
      reason: normalized.reason,
    };

  return resolveWithPayload(payload);
}

async function loadDatabaseDetail(
  summaryResult: Extract<RegistryItemDetailResult, { status: "summary-only" }>,
  resolveWithPayload: (payload: RawJsonInput) => RegistryItemDetailResult,
  namespace: string | null | undefined,
  fetchImpl: typeof fetch,
): Promise<RegistryItemDetailResult | null> {
  const registryName = namespace?.trim();

  if (!registryName) return null;

  try {
    const details = await loadDetailRuntimeData(fetchImpl);
    const item = details[registryName + "/" + summaryResult.detail.slug] ?? null;

    if (!item) return null;

    const normalized = normalizeRegistryItemDetailJson(item);

    if (!normalized.valid) {
      return {
        status: "invalid-schema",
        detail: summaryResult.detail,
        message: "Registry item data did not match the expected safe shape.",
        reason: normalized.reason,
      };
    }

    return resolveWithPayload(item);
  } catch {
    return null;
  }
}
