import { mkdir, writeFile } from "node:fs/promises";
import { test } from "@e2e-dev/web";
import { expect } from "e2e";
import { captureRefactorBaseline } from "./support/browserRefactorBaseline";

test("capture hydrated desktop catalog baseline", async ({ app, browser }) => {
  const start = Date.now();

  await app.open("/Registry-Atlas/components");
  await expect
    .poll(
      () =>
        browser.evaluate(
          () => document.querySelectorAll("[data-catalog-grid] [data-catalog-card]").length > 0,
        ),
      { timeout: 100_000 },
    )
    .toBe(true);

  const snapshot = await browser.evaluate(captureRefactorBaseline);

  expect(snapshot.viewport.width).toBe(1440);
  expect(snapshot.viewport.height).toBe(900);
  expect(snapshot.catalogGridColumns).toBe(3);
  expect(snapshot.catalogCardCount).toBeGreaterThan(0);

  if (process.env.ATLAS_CAPTURE_REFACTOR_BASELINE === "1") {
    const screenshot = await app.screenshot("phase4-desktop-catalog");
    const output = ".design/evidence/refactor-phase4/desktop.json";

    await mkdir(".design/evidence/refactor-phase4", { recursive: true });
    await writeFile(
      output,
      JSON.stringify(
        {
          baseline: "phase4-before-refactor",
          viewport: "desktop-1440x900",
          measuredAt: new Date().toISOString(),
          runnerOpenToObservedCatalogMs: Date.now() - start,
          screenshotArtifact: screenshot,
          snapshot,
        },
        null,
        2,
      ) + "\n",
    );
  }
});
