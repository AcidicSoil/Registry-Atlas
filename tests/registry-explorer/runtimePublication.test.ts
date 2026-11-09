import { mkdtemp, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { gunzipSync } from "node:zlib";
import { afterEach, describe, expect, it } from "vitest";
// @ts-ignore Standalone Node ESM script.
import { publishRuntimeSnapshots } from "../../scripts/lib/runtime-publication.mjs";
// @ts-ignore Standalone Node ESM script.
import { readRuntimeManifest, runtimeAssetPath } from "../../scripts/lib/runtime-publication.mjs";

const roots: string[] = [];

async function temporaryDataDir() {
  const root = await mkdtemp(join(tmpdir(), "registry-publication-"));
  roots.push(root);

  return root;
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map((root) => rm(root, { recursive: true, force: true })));
});

const payloads = (name: string) => ({
  core: { catalog: { registries: { "@sample": [{ name }] } } },
  details: { ["@sample/" + name]: { name } },
});

async function loadPair(root: string) {
  const manifest = await readRuntimeManifest(root);

  if (!manifest) throw new Error("Missing test manifest");

  const core = JSON.parse(
    gunzipSync(await readFile(runtimeAssetPath(root, "core", manifest))).toString("utf8"),
  );

  const details = JSON.parse(
    gunzipSync(await readFile(runtimeAssetPath(root, "details", manifest))).toString("utf8"),
  );

  return { core, details, manifest };
}

describe("atomic runtime publication", () => {
  it("publishes a complete immutable generation before switching one manifest", async () => {
    const root = await temporaryDataDir();
    const previous = await publishRuntimeSnapshots(root, payloads("previous"));
    const previousPair = await loadPair(root);
    const next = await publishRuntimeSnapshots(root, payloads("next"));
    const currentPair = await loadPair(root);

    expect(previous.manifest.generation).toMatch(/^[a-f0-9]{64}$/);
    expect(next.manifest.generation).not.toBe(previous.manifest.generation);
    expect(previousPair.core.catalog.registries["@sample"][0].name).toBe("previous");
    expect(currentPair.core.catalog.registries["@sample"][0].name).toBe("next");
    expect(currentPair.details["@sample/next"].name).toBe("next");
    expect(await readFile(runtimeAssetPath(root, "core", previous.manifest))).toEqual(
      await readFile(runtimeAssetPath(root, "core", previousPair.manifest)),
    );
    expect(await readFile(join(root, "runtime-manifest.json"), "utf8")).toContain(
      next.manifest.generation,
    );
  });

  it("retains the old pointer when the next generation cannot be serialized", async () => {
    const root = await temporaryDataDir();
    const initial = await publishRuntimeSnapshots(root, payloads("stable"));
    await expect(
      publishRuntimeSnapshots(root, { core: payloads("new").core, details: { invalid: 1n } }),
    ).rejects.toThrow();
    expect(await readRuntimeManifest(root)).toEqual(initial.manifest);
    expect((await loadPair(root)).details["@sample/stable"].name).toBe("stable");
  });

  it("ignores abandoned staging directories and recovers on a later publish", async () => {
    const root = await temporaryDataDir();
    await mkdir(join(root, "generations", ".staging-abandoned"), { recursive: true });
    await writeFile(
      join(root, "generations", ".staging-abandoned", "registry-atlas.json.gz"),
      "partial",
    );
    const result = await publishRuntimeSnapshots(root, payloads("recovered"));
    expect((await loadPair(root)).manifest).toEqual(result.manifest);
  });

  it("concurrent publishers can only select complete generations", async () => {
    const root = await temporaryDataDir();
    await Promise.all([
      publishRuntimeSnapshots(root, payloads("first")),
      publishRuntimeSnapshots(root, payloads("second")),
    ]);
    const current = await loadPair(root);
    const name = current.core.catalog.registries["@sample"][0].name;
    expect(["first", "second"]).toContain(name);
    expect(current.details["@sample/" + name].name).toBe(name);
  });

  it("rejects malformed generation identifiers", async () => {
    const root = await temporaryDataDir();
    await writeFile(
      join(root, "runtime-manifest.json"),
      JSON.stringify({
        version: 1,
        generation: "../../secrets",
      }),
    );
    await expect(readRuntimeManifest(root)).rejects.toThrow(/manifest/i);
  });
});
