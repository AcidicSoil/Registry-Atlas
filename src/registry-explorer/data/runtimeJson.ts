import type { JsonInput, RawJsonInput } from "../core/jsonInput";
import { isInputObject } from "../core/inputChecks";

// Read-only static snapshots generated from PostgreSQL during the build.
let detailsPromise: Promise<Record<string, JsonInput>> | null = null;

export async function loadRuntimeJson<T>(
  relativePath: string,
  parse: (value: RawJsonInput) => T,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(import.meta.env.BASE_URL + relativePath.replace(/^\//, ""));

  if (!response.ok)
    throw new Error("Runtime data fetch failed: " + response.status + " " + response.statusText);
  let bytes = new Uint8Array(await response.arrayBuffer());

  if (bytes[0] === 0x1f && bytes[1] === 0x8b) {
    if (typeof DecompressionStream === "undefined")
      throw new Error("Gzip decompression unavailable");
    const stream = new Response(bytes).body;

    if (!stream) throw new Error("Missing runtime data body");
    bytes = new Uint8Array(
      await new Response(stream.pipeThrough(new DecompressionStream("gzip"))).arrayBuffer(),
    );
  }

  return parse(JSON.parse(new TextDecoder().decode(bytes)));
}

export function loadDetailRuntimeData(
  fetchImpl: typeof fetch = fetch,
): Promise<Record<string, JsonInput>> {
  if (!detailsPromise) {
    detailsPromise = loadRuntimeJson(
      "data/registry-details.json.gz",
      parseRuntimeDetails,
      fetchImpl,
    ).catch((error) => {
      detailsPromise = null;
      throw error;
    });
  }

  return detailsPromise;
}

function parseRuntimeDetails(value: RawJsonInput): Record<string, JsonInput> {
  if (!isInputObject(value) || value === null || Array.isArray(value)) {
    throw new Error("Runtime detail validation failed: expected an object");
  }

  // SAFETY: JSON.parse creates JSON-compatible values; each requested detail is validated before rendering.
  return value as Record<string, JsonInput>;
}

export function resetRuntimeDataCachesForTests() {
  detailsPromise = null;
}
