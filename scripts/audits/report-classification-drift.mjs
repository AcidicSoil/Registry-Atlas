import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { openAtlasCoreDatabase, readAtlasState } from "../lib/atlas-storage.mjs";
import { catalogClassificationDriftReport } from "../lib/catalog-classification-overlay.mjs";

export { catalogClassificationDriftReport };

export async function main(cwd = process.cwd()) {
  const database = openAtlasCoreDatabase(cwd, { readOnly: true });
  let report;

  try {
    const state = await readAtlasState(database);

    if (!state.classificationOverlay) throw new Error("Reviewed classifications are missing");
    report = catalogClassificationDriftReport(
      state.catalog.registries,
      state.classificationOverlay.items,
    );
  } finally {
    await database.close();
  }

  const file = resolve(cwd, ".instance/reviews/catalog-classification-drift.json");
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(report, null, 2) + "\n");

  return { file, ...report.summary };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .then((summary) => console.log(JSON.stringify(summary)))
    .catch((error) => {
      console.error(String(error?.message ?? error));
      process.exitCode = 1;
    });
}
