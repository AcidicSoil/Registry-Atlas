import { createHash, randomUUID } from "node:crypto";
import { mkdir, mkdtemp, open, readFile, rename, rm } from "node:fs/promises";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";
import { z } from "zod";

const manifestName = "runtime-manifest.json";

const fileNames = { core: "registry-atlas.json.gz", details: "registry-details.json.gz" };

const manifestSchema = z.object({
  version: z.literal(1),
  generation: z.string().regex(/^[a-f0-9]{64}$/),
});

function validateRuntimeManifest(value) {
  const parsed = manifestSchema.safeParse(value);

  if (!parsed.success)
    throw new Error("Runtime manifest invalid: unsupported version or generation");

  return parsed.data;
}

export async function readRuntimeManifest(dataDir) {
  let content;

  try {
    content = await readFile(join(resolve(dataDir), manifestName), "utf8");
  } catch (error) {
    if (error.code === "ENOENT") return null;
    throw error;
  }

  try {
    return validateRuntimeManifest(JSON.parse(content));
  } catch (error) {
    throw new Error("Runtime manifest invalid", { cause: error });
  }
}

export function runtimeAssetPath(dataDir, kind, manifest) {
  const file = fileNames[kind];

  if (!file) throw new Error("Unknown runtime asset kind: " + kind);

  if (!manifest) return join(resolve(dataDir), file);
  const { generation } = validateRuntimeManifest(manifest);

  return join(resolve(dataDir), "generations", generation, file);
}

export async function readRuntimeAssets(dataDir) {
  const manifest = await readRuntimeManifest(dataDir);

  const [core, details] = await Promise.all([
    readFile(runtimeAssetPath(dataDir, "core", manifest)),
    readFile(runtimeAssetPath(dataDir, "details", manifest)),
  ]);

  if (manifest && generationId(core, details) !== manifest.generation) {
    throw new Error("Published runtime generation integrity check failed");
  }

  return { core, details, manifest };
}

function generationId(core, details) {
  return createHash("sha256")
    .update(String(core.length) + ":")
    .update(core)
    .update(String(details.length) + ":")
    .update(details)
    .digest("hex");
}

async function durableWrite(file, data) {
  const handle = await open(file, "wx");

  try {
    await handle.writeFile(data);
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function syncDirectory(directory) {
  const handle = await open(directory, "r");

  try {
    await handle.sync();
  } finally {
    await handle.close();
  }
}

async function verifyGeneration(directory, generation) {
  const core = await readFile(join(directory, fileNames.core));
  const details = await readFile(join(directory, fileNames.details));

  if (generationId(core, details) !== generation) {
    throw new Error("Published runtime generation integrity check failed");
  }
}

async function installGeneration(generations, manifest, compressed) {
  const published = join(generations, manifest.generation);
  const staging = await mkdtemp(join(generations, ".staging-"));

  try {
    await durableWrite(join(staging, fileNames.core), compressed.core);
    await durableWrite(join(staging, fileNames.details), compressed.details);
    await syncDirectory(staging);

    try {
      await rename(staging, published);
    } catch (error) {
      if (error.code !== "EEXIST" && error.code !== "ENOTEMPTY") throw error;
    }

    await verifyGeneration(published, manifest.generation);
    await syncDirectory(generations);
  } finally {
    await rm(staging, { recursive: true, force: true });
  }
}

/** Publish both immutable files before atomically swapping the sole live pointer. */
export async function publishRuntimeSnapshots(dataDir, payloads) {
  const compressed = {
    core: gzipSync(JSON.stringify(payloads.core), { level: 9 }),
    details: gzipSync(JSON.stringify(payloads.details), { level: 9 }),
  };

  const manifest = {
    version: 1,
    generation: generationId(compressed.core, compressed.details),
  };

  const root = resolve(dataDir);
  const generations = join(root, "generations");
  await mkdir(generations, { recursive: true });
  await installGeneration(generations, manifest, compressed);

  const stagedManifest = join(root, "." + manifestName + "." + randomUUID() + ".tmp");

  try {
    await durableWrite(stagedManifest, JSON.stringify(manifest) + "\n");
    await rename(stagedManifest, join(root, manifestName));
    await syncDirectory(root);
  } finally {
    await rm(stagedManifest, { force: true });
  }

  return {
    manifest,
    core: {
      file: runtimeAssetPath(root, "core", manifest),
      bytes: compressed.core.length,
    },
    details: {
      file: runtimeAssetPath(root, "details", manifest),
      bytes: compressed.details.length,
    },
  };
}
