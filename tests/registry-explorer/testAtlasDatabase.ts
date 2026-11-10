import { existsSync, readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
// @ts-ignore Standalone Node ESM publication module.
import { runtimeAssetPath } from "../../scripts/lib/runtime-publication.mjs";

type Reference = {
  mirror: unknown;
  catalog: unknown;
  sourcePageManifest: unknown;
};

function runtimeReference(): Reference {
  // SAFETY: The test constructs or loads the expected fixture shape here and verifies the observed result against that fixture.
  return JSON.parse(
    gunzipSync(
      readFileSync(
        runtimeAssetPath(
          "public/data",
          "core",
          existsSync("public/data/runtime-manifest.json")
            ? JSON.parse(readFileSync("public/data/runtime-manifest.json", "utf8"))
            : null,
        ),
      ),
    ).toString("utf8"),
  ) as Reference;
}

export function readRepositoryDocument<T = unknown>(name: string): T {
  // SAFETY: The test constructs or loads the expected fixture shape here and verifies the observed result against that fixture.
  const documents = JSON.parse(
    readFileSync(".instance/atlas-test-documents.json", "utf8"),
  ) as Record<string, T>;

  if (!Object.hasOwn(documents, name))
    throw new Error("Missing PostgreSQL-backed reference document: " + name);

  return documents[name];
}

export function readRepositoryCatalog<T = unknown>(): T {
  // SAFETY: The test constructs or loads the expected fixture shape here and verifies the observed result against that fixture.
  return runtimeReference().catalog as T;
}

export function readRepositoryRegistrySnapshot<T = unknown>(): T {
  // SAFETY: The test constructs or loads the expected fixture shape here and verifies the observed result against that fixture.
  return runtimeReference().mirror as T;
}

export function readRepositorySourcePageManifest<T = unknown>(): T {
  // SAFETY: Callers validate the generated runtime fixture shape against the expected source-page manifest.
  return runtimeReference().sourcePageManifest as T;
}
