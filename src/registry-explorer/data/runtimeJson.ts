import type { JsonInput, RawJsonInput } from "../core/jsonInput";
import { isInputObject } from "../core/inputChecks";
import { z } from "zod";

const runtimeManifestSchema = z.object({
  version: z.literal(1),
  generation: z.string().regex(/^[a-f0-9]{64}$/),
});

// Pin one immutable generation across the catalog fetch and lazy detail fetch.
let manifests = new WeakMap<typeof fetch, Promise<string | null>>();

let detailsPromise: Promise<Record<string, JsonInput>> | null = null;

async function readRuntimeGeneration(fetchImpl: typeof fetch): Promise<string | null> {
  const response = await fetchImpl(import.meta.env.BASE_URL + "data/runtime-manifest.json", {
    cache: "no-store",
  });

  if (response.status === 404) return null; // Legacy static deployments.

  if (!response.ok) throw new Error("Runtime manifest fetch failed: " + response.status);

  let manifest: RawJsonInput;

  try {
    manifest = await response.json();
  } catch {
    throw new Error("Runtime manifest invalid: not JSON");
  }

  const parsed = runtimeManifestSchema.safeParse(manifest);

  if (!parsed.success) throw new Error("Runtime manifest invalid: unsupported generation");

  return parsed.data.generation;
}

async function runtimeAssetUrl(relativePath: string, fetchImpl: typeof fetch): Promise<string> {
  const path = relativePath.replace(/^\//, "");

  if (path !== "data/registry-atlas.json.gz" && path !== "data/registry-details.json.gz") {
    return import.meta.env.BASE_URL + path;
  }

  let generation = manifests.get(fetchImpl);

  if (!generation) {
    generation = readRuntimeGeneration(fetchImpl).catch((error) => {
      manifests.delete(fetchImpl);
      throw error;
    });
    manifests.set(fetchImpl, generation);
  }

  const id = await generation;

  return (
    import.meta.env.BASE_URL +
    (id ? "data/generations/" + id + "/" + path.slice("data/".length) : path)
  );
}

export async function loadRuntimeJson<T>(
  relativePath: string,
  parse: (value: RawJsonInput) => T,
  fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(await runtimeAssetUrl(relativePath, fetchImpl));

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
  manifests = new WeakMap();
  detailsPromise = null;
}
