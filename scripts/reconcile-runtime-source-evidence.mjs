#!/usr/bin/env node
/** Recover missing public source-page evidence without overwriting PostgreSQL. */
import { readFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import { z } from "zod";
import { exec } from "./lib/atlas-postgres.mjs";
import { openAtlasCoreDatabase, transaction } from "./lib/atlas-storage.mjs";
import { isInputString } from "./lib/input-guards.mjs";

const parsePayload = (value) => (isInputString(value) ? JSON.parse(value) : value);

/** Dry runs report conflicts; applies reject conflicting evidence transactionally. */
export async function reconcileSourceEvidence(database, pages, documents, apply = false) {
  const evaluate = async (db) => {
    const existing = await exec(
      db,
      "SELECT namespace,slug,payload_json FROM atlas.atlas_source_pages",
    );

    const prior = new Map(
      existing.map((row) => [row.namespace + "/" + row.slug, row.payload_json]),
    );

    const missing = [];
    const conflictingSourcePages = [];

    for (const [key, value] of Object.entries(pages)) {
      const slash = key.indexOf("/");

      if (slash < 1 || slash === key.length - 1)
        throw new Error("Invalid source-page identity: " + key);

      if (!prior.has(key))
        missing.push([key.slice(0, slash), key.slice(slash + 1), JSON.stringify(value)]);
      else if (!isDeepStrictEqual(parsePayload(prior.get(key)), value))
        conflictingSourcePages.push(key);
    }

    const existingDocs = await exec(db, "SELECT name,payload_json FROM atlas.atlas_documents");

    const docsByName = new Map(existingDocs.map((row) => [row.name, row]));

    const missingDocs = [];
    const conflictingDocuments = [];

    for (const [name, payload] of Object.entries(documents)) {
      if (!docsByName.has(name)) missingDocs.push([name, JSON.stringify(payload)]);
      else if (!isDeepStrictEqual(parsePayload(docsByName.get(name).payload_json), payload))
        conflictingDocuments.push(name);
    }

    const report = {
      snapshotSourcePages: Object.keys(pages).length,
      recoveredSourcePages: prior.size,
      missingSourcePages: missing.length,
      missingDocuments: missingDocs.map(([name]) => name),
      conflictingSourcePages,
      conflictingDocuments,
      changedSourcePages: missing.length,
      changedDocuments: missingDocs.map(([name]) => name),
      mode: apply ? "apply" : "dry-run",
    };

    if (!apply) return report;

    if (conflictingSourcePages.length || conflictingDocuments.length)
      throw new Error(
        "Conflicting PostgreSQL evidence: " +
          [...conflictingSourcePages, ...conflictingDocuments].slice(0, 5).join(", "),
      );

    for (let i = 0; i < missing.length; i += 500) {
      const batch = missing.slice(i, i + 500);
      const values = batch.map((_, j) => `($${j * 3 + 1},$${j * 3 + 2},$${j * 3 + 3})`).join(",");

      await exec(
        db,
        "INSERT INTO atlas.atlas_source_pages(namespace,slug,payload_json) VALUES " +
          values +
          " ON CONFLICT(namespace,slug) DO NOTHING",
        batch.flat(),
      );
    }

    for (const [name, payload] of missingDocs)
      await exec(
        db,
        "INSERT INTO atlas.atlas_documents(name,kind,payload_json,updated_at) VALUES($1,$2,$3,$4)" +
          " ON CONFLICT(name) DO NOTHING",
        [name, "source-evidence", payload, new Date().toISOString()],
      );

    return report;
  };

  return apply ? transaction(database, evaluate) : evaluate(database);
}

async function main() {
  const source = JSON.parse(
    gunzipSync(await readFile("public/data/registry-atlas.json.gz")).toString("utf8"),
  );

  const documents = z
    .record(z.string(), z.unknown())
    .parse(JSON.parse(await readFile(".instance/atlas-test-documents.json", "utf8")));

  const pages = z.record(z.string(), z.unknown()).parse(source?.sourcePageManifest?.pages);

  const database = openAtlasCoreDatabase();

  try {
    return await reconcileSourceEvidence(
      database,
      pages,
      documents,
      process.argv.includes("--apply"),
    );
  } finally {
    await database.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href)
  main()
    .then((report) => console.log(JSON.stringify(report)))
    .catch((error) => {
      console.error("SOURCE_EVIDENCE_RECONCILIATION_FAILED", error.message);
      process.exitCode = 1;
    });
