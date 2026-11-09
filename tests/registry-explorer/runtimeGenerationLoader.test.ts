import { afterEach, describe, expect, it } from "vitest";
import {
  loadDetailRuntimeData,
  loadRuntimeJson,
  resetRuntimeDataCachesForTests,
} from "../../src/registry-explorer/data/runtimeJson";

afterEach(() => resetRuntimeDataCachesForTests());

const first = "a".repeat(64);

const second = "b".repeat(64);

describe("version-pinned runtime client", () => {
  it("resolves both snapshot paths using one cached generation manifest", async () => {
    let current = first;
    const requests: string[] = [];

    const fetchImpl = async (input: RequestInfo | URL) => {
      const path = String(input);
      requests.push(path);

      if (path.endsWith("/runtime-manifest.json")) {
        return Response.json({ version: 1, generation: current });
      }

      if (path.endsWith("/registry-atlas.json.gz")) return Response.json({ name: "core" });

      if (path.endsWith("/registry-details.json.gz")) return Response.json({ item: "details" });

      return new Response("", { status: 404 });
    };

    const core = await loadRuntimeJson("data/registry-atlas.json.gz", (value) => value, fetchImpl);
    current = second;
    const details = await loadDetailRuntimeData(fetchImpl);
    expect(core).toEqual({ name: "core" });
    expect(details).toEqual({ item: "details" });
    expect(requests).toEqual([
      "/data/runtime-manifest.json",
      "/data/generations/" + first + "/registry-atlas.json.gz",
      "/data/generations/" + first + "/registry-details.json.gz",
    ]);
  });

  it("keeps legacy files available when the manifest does not exist", async () => {
    const requests: string[] = [];

    const fetchImpl = async (input: RequestInfo | URL) => {
      requests.push(String(input));

      if (String(input).endsWith("runtime-manifest.json")) {
        return new Response("", { status: 404 });
      }

      return Response.json({ legacy: true });
    };

    const data = await loadRuntimeJson("data/registry-atlas.json.gz", (value) => value, fetchImpl);
    expect(data).toEqual({ legacy: true });
    expect(requests).toEqual(["/data/runtime-manifest.json", "/data/registry-atlas.json.gz"]);
  });

  it("fails closed for malformed pointers and missing generation files", async () => {
    const requests: string[] = [];

    const fetchImpl = async (input: RequestInfo | URL) => {
      requests.push(String(input));

      if (String(input).endsWith("runtime-manifest.json")) {
        return Response.json({ version: 1, generation: "../bad" });
      }

      return Response.json({ shouldNotLoad: true });
    };

    await expect(
      loadRuntimeJson("data/registry-atlas.json.gz", (value) => value, fetchImpl),
    ).rejects.toThrow(/manifest/i);
    expect(requests).toEqual(["/data/runtime-manifest.json"]);
  });

  it("fails closed when a selected generation asset is absent", async () => {
    const requests: string[] = [];

    const fetchImpl = async (input: RequestInfo | URL) => {
      requests.push(String(input));

      if (String(input).endsWith("runtime-manifest.json")) {
        return Response.json({ version: 1, generation: first });
      }

      return new Response(null, { status: 404 });
    };

    await expect(
      loadRuntimeJson("data/registry-atlas.json.gz", (value) => value, fetchImpl),
    ).rejects.toThrow(/Runtime data fetch failed/);

    expect(requests).toEqual([
      "/data/runtime-manifest.json",
      "/data/generations/" + first + "/registry-atlas.json.gz",
    ]);
  });

  it("retries a failed manifest fetch instead of poisoning the session", async () => {
    let attempts = 0;

    const fetchImpl = async (input: RequestInfo | URL) => {
      if (String(input).endsWith("runtime-manifest.json")) {
        attempts += 1;

        return attempts === 1
          ? new Response(null, { status: 503 })
          : Response.json({ version: 1, generation: first });
      }

      return Response.json({ recovered: true });
    };

    await expect(
      loadRuntimeJson("data/registry-atlas.json.gz", (value) => value, fetchImpl),
    ).rejects.toThrow(/manifest/i);

    await expect(
      loadRuntimeJson("data/registry-atlas.json.gz", (value) => value, fetchImpl),
    ).resolves.toEqual({ recovered: true });

    expect(attempts).toBe(2);
  });

  it("does not silently fall back after a manifest server error", async () => {
    const fetchImpl = async () => new Response("error", { status: 503 });
    await expect(
      loadRuntimeJson("data/registry-atlas.json.gz", (value) => value, fetchImpl),
    ).rejects.toThrow(/manifest/i);
  });
});
