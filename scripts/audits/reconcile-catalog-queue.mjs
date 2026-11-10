import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openAtlasCoreDatabase, readAtlasState, transaction } from "../lib/atlas-storage.mjs";
import {
  putDocument,
  replaceCatalogEvidence,
  replaceCatalogSnapshot,
  replaceItemDetails,
} from "../lib/atlas-postgres.mjs";
import {
  catalogClassificationDriftReport,
  projectReviewedCatalogClassifications,
} from "../lib/classification/overlay.mjs";
import {
  mergeRefreshedCatalog,
  planCatalogApprovalReconciliation,
} from "../lib/classification/reconciliation.mjs";
import {
  persistRetiredCatalogApprovals,
  persistRevalidatedCatalogApprovals,
} from "../lib/classification/approval-storage.mjs";
import { syncCatalogEvidenceForRegistries } from "../sync-registry-catalog-evidence.mjs";

function optionsFromArgs(args) {
  const options = { apply: false, concurrency: 6, timeoutMs: 15000 };

  for (let index = 0; index < args.length; index += 1) {
    const flag = args[index];

    if (flag === "--apply") options.apply = true;
    else if (flag === "--concurrency" || flag === "--timeout-ms") {
      const value = Number(args[++index]);

      if (!Number.isInteger(value) || value < 1) throw new Error(`Invalid value for ${flag}`);

      if (flag === "--concurrency") options.concurrency = value;
      else options.timeoutMs = value;
    } else throw new Error(`Unknown argument: ${flag}`);
  }

  return options;
}

function affectedSources(state, report) {
  const namespaces = new Set([...report.stale, ...report.missing].map((item) => item.namespace));
  const directory = new Map(state.rawRegistries.map((registry) => [registry.name, registry]));

  const registries = [...namespaces].flatMap((namespace) =>
    directory.has(namespace) ? [directory.get(namespace)] : [],
  );

  const absentNamespaces = [...namespaces].filter((namespace) => !directory.has(namespace));

  for (const namespace of absentNamespaces) {
    if (state.catalog.registries[namespace]?.length)
      throw new Error(
        `Registry absent from official directory but has catalog items: ${namespace}`,
      );
  }

  return { registries, absentNamespaces };
}

function summaryOf(plan, fetched, projected, absentNamespaces, currentItems) {
  return {
    fetched: fetched.report.fetched_catalog_count,
    sourceFailures: fetched.report.failure_count,
    absentRegistries: absentNamespaces,
    currentItems,
    ...plan.summary,
    projection: projected.report,
    retirementBreakdown: Object.fromEntries(
      [...new Set(plan.retired.map((item) => item.retirementReason))].map((reason) => [
        reason,
        plan.retired.filter((item) => item.retirementReason === reason).length,
      ]),
    ),
    retirementCandidates: plan.retired.map(({ namespace, name, retirementReason }) => ({
      namespace,
      name,
      reason: retirementReason,
    })),
    unverified: plan.retired
      .filter((item) => item.retirementReason === "changed-input-unverified")
      .map(({ namespace, name, canonical }) => ({
        namespace,
        name,
        priorCategory: canonical.primary,
      })),
  };
}

async function fetchAffectedSources(state, drift, options) {
  const { registries, absentNamespaces } = affectedSources(state, drift);

  const fetched = await syncCatalogEvidenceForRegistries(registries, {
    previous: state.catalogEvidence,
    previousItems: state.catalog.registries,
    concurrency: options.concurrency,
    timeoutMs: options.timeoutMs,
  });

  if (
    fetched.report.failure_count > 0 ||
    Object.keys(fetched.freshDetailsByNamespace).length !== registries.length
  ) {
    throw new Error(`Source refresh incomplete: ${JSON.stringify(fetched.report.failures)}`);
  }

  return { fetched, absentNamespaces };
}

function buildReconciledProjection(state, fetched, absentNamespaces) {
  const currentCatalog = mergeRefreshedCatalog(state.catalog.registries, fetched.itemsByNamespace);

  const plan = planCatalogApprovalReconciliation({
    catalog: currentCatalog,
    reviews: state.classificationOverlay.items,
    taxonomy: state.taxonomy,
    verifiedNamespaces: Object.keys(fetched.freshDetailsByNamespace),
    absentNamespaces,
  });

  const projected = projectReviewedCatalogClassifications(currentCatalog, {
    taxonomy: state.taxonomy,
    overlay: { ...state.classificationOverlay, items: plan.active },
    accessRules: state.accessRules,
  });

  if (projected.report.stale || projected.report.missing) {
    throw new Error(
      `Incomplete current-source reconciliation: ${JSON.stringify(projected.report)}`,
    );
  }

  const currentItems = Object.values(currentCatalog).reduce((sum, items) => sum + items.length, 0);
  const summary = summaryOf(plan, fetched, projected, absentNamespaces, currentItems);

  return { plan, projected, summary };
}

async function publishReconciliation(database, state, fetched, plan, projected, summary) {
  await transaction(database, async (tx) => {
    await replaceCatalogEvidence(tx, fetched.evidence);
    await replaceCatalogSnapshot(tx, {
      meta: {
        source_url: state.runtime?.meta?.source_url ?? "database:raw-registries",
        generated_at: fetched.report.generated_at,
        registry_count: Object.keys(projected.itemsByNamespace).length,
        item_count: summary.currentItems,
      },
      registries: projected.itemsByNamespace,
    });

    for (const [namespace, items] of Object.entries(fetched.freshDetailsByNamespace)) {
      await replaceItemDetails(tx, namespace, items);
    }

    await persistRetiredCatalogApprovals(tx, plan.retired, fetched.evidence);
    await persistRevalidatedCatalogApprovals(tx, plan.revalidated);
    await putDocument(tx, "catalog-evidence-report", "sync-report", fetched.report);
    await putDocument(
      tx,
      "catalog-classification-projection-report",
      "sync-report",
      projected.report,
    );
  });
}

/** Reconcile the whole current drift queue; no source or approval is trusted implicitly. */
export async function main(args = process.argv.slice(2), cwd = process.cwd()) {
  const options = optionsFromArgs(args);
  const database = openAtlasCoreDatabase(cwd, { readOnly: !options.apply });

  try {
    const state = await readAtlasState(database);

    const drift = catalogClassificationDriftReport(
      state.catalog.registries,
      state.classificationOverlay.items,
    );

    if (!drift.summary.stale && !drift.summary.missing)
      return { applied: false, alreadyCurrent: true, ...drift.summary };

    const { fetched, absentNamespaces } = await fetchAffectedSources(state, drift, options);

    const { plan, projected, summary } = buildReconciledProjection(
      state,
      fetched,
      absentNamespaces,
    );

    const file = resolve(cwd, ".instance/reviews/catalog-queue-reconciliation.json");

    await mkdir(dirname(file), { recursive: true });
    await writeFile(file, JSON.stringify(summary, null, 2) + "\n");

    if (options.apply)
      await publishReconciliation(database, state, fetched, plan, projected, summary);

    return { file, applied: options.apply, ...summary };
  } finally {
    await database.close();
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
