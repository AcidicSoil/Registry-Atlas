import { pathToFileURL } from "node:url";
import { openAtlasCoreDatabase, transaction } from "../lib/atlas-storage.mjs";
import { exec, parseJson } from "../lib/atlas-postgres.mjs";
import { syncCatalogEvidenceForRegistries } from "../sync-registry-catalog-evidence.mjs";
import { retireMissingCatalogApprovals } from "../lib/catalog-classification-overlay.mjs";
import { persistRetiredCatalogApprovals } from "../lib/catalog-approval-storage.mjs";

export function assertCurrentCatalogMatches(namespace, stored, fetched) {
  if (!Array.isArray(fetched) || fetched.length === 0)
    throw new Error("Current source index is empty");

  const current = new Set(stored.map((item) => item.name));
  const incoming = new Set(fetched.map((item) => item.name));

  if (incoming.size !== fetched.length) throw new Error("Duplicate source catalog identities");

  if (
    current.size !== stored.length ||
    current.size !== incoming.size ||
    [...current].some((name) => !incoming.has(name))
  ) {
    throw new Error(
      `Stored catalog differs from the current source index for ${namespace}; sync the source first`,
    );
  }

  return current.size;
}

function parseOptions(args) {
  const options = { namespace: "", apply: false };

  for (let i = 0; i < args.length; i += 1) {
    if (args[i] === "--namespace") options.namespace = args[++i] ?? "";
    else if (args[i] === "--apply") options.apply = true;
    else throw new Error(`Unknown argument: ${args[i]}`);
  }

  if (!/^@[a-z0-9][a-z0-9_-]*$/.test(options.namespace))
    throw new Error("Supply a valid --namespace @registry");

  return options;
}

async function readNamespaceState(db, namespace) {
  const [registries, catalog, approvals] = await Promise.all([
    exec(db, "SELECT payload_json FROM atlas.atlas_raw_registries WHERE namespace=$1", [namespace]),
    exec(db, "SELECT payload_json FROM atlas.atlas_catalog_items WHERE namespace=$1", [namespace]),
    exec(db, "SELECT payload_json FROM atlas.atlas_classifications WHERE namespace=$1", [
      namespace,
    ]),
  ]);

  if (registries.length !== 1) throw new Error(`Official registry missing: ${namespace}`);

  return {
    registry: parseJson(registries[0].payload_json),
    catalog: catalog.map((row) => parseJson(row.payload_json)),
    reviews: approvals.map((row) => parseJson(row.payload_json)),
  };
}

export async function main(args = process.argv.slice(2)) {
  const { namespace, apply } = parseOptions(args);
  const db = openAtlasCoreDatabase(process.cwd(), { readOnly: !apply });

  try {
    const initial = await readNamespaceState(db, namespace);

    const fetched = await syncCatalogEvidenceForRegistries([initial.registry], {
      concurrency: 1,
      timeoutMs: 10000,
    });

    const current = fetched.itemsByNamespace[namespace];

    if (fetched.report.failure_count || !fetched.freshDetailsByNamespace[namespace])
      throw new Error(`Could not verify current source index for ${namespace}`);

    assertCurrentCatalogMatches(namespace, initial.catalog, current);

    const preview = retireMissingCatalogApprovals({ [namespace]: current }, initial.reviews, [
      namespace,
    ]);

    if (apply && preview.retired.length) {
      await transaction(db, async (tx) => {
        const latest = await readNamespaceState(tx, namespace);

        assertCurrentCatalogMatches(namespace, latest.catalog, current);

        const reconciliation = retireMissingCatalogApprovals(
          { [namespace]: current },
          latest.reviews,
          [namespace],
        );

        await persistRetiredCatalogApprovals(tx, reconciliation.retired, fetched.evidence);
      });
    }

    return {
      namespace,
      source: fetched.evidence[namespace].catalog_url,
      catalogItems: current.length,
      retired: preview.retired.map(({ name }) => name),
      applied: apply,
    };
  } finally {
    await db.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((result) => console.log(JSON.stringify(result, null, 2)))
    .catch((error) => {
      console.error(String(error?.message ?? error));
      process.exitCode = 1;
    });
}
