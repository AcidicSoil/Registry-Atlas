#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { gunzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { readRuntimeAssets } from "./lib/runtime-publication.mjs";

export async function checkRuntimeData(projectRoot = process.cwd()) {
  const root = resolve(projectRoot);
  const dataDir = join(root, "public/data");
  const assets = await readRuntimeAssets(dataDir);
  const catalog = JSON.parse(gunzipSync(assets.core).toString("utf8"));

  const catalogItems = Object.values(catalog.catalog.registries).reduce(
    (count, items) => count + items.length,
    0,
  );

  const details = JSON.parse(gunzipSync(assets.details).toString("utf8"));
  const itemDetails = Object.keys(details).length;

  const documents = JSON.parse(
    await readFile(join(root, ".instance/atlas-test-documents.json"), "utf8"),
  );

  if (!catalogItems || catalogItems !== itemDetails) {
    throw new Error(
      `Catalog and detail snapshots do not match (${catalogItems} catalog; ${itemDetails} details)`,
    );
  }

  const documentCount = Object.keys(documents).length;

  if (!documentCount) throw new Error("Local runtime document snapshot is empty");

  return { catalogItems, itemDetails, documents: documentCount, source: "local" };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  checkRuntimeData()
    .then((result) => {
      console.log(JSON.stringify(result));
    })
    .catch((error) => {
      console.error("LOCAL_RUNTIME_DATA_INVALID", error.message);
      console.error(
        "Restore a known-good runtime snapshot or run pnpm prepare:runtime-data when PostgreSQL is available.",
      );
      process.exitCode = 1;
    });
}
