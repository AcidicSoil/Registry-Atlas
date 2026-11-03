import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("StyleX catalog grid has one column without mobile overflow", async ({ app, browser }) => {
  await app.open("/Registry-Atlas/components");
  await expect
    .poll(() => browser.evaluate(() => Boolean(document.querySelector("[data-catalog-grid]"))), {
      timeout: 55_000,
    })
    .toBe(true);

  const layout = await browser.evaluate(() => {
    const grid = document.querySelector<HTMLElement>("[data-catalog-grid]");

    if (!grid) return null;
    const columns = getComputedStyle(grid).gridTemplateColumns.split(" ").length;

    return {
      columns,
      viewportWidth: document.documentElement.clientWidth,
      contentWidth: document.documentElement.scrollWidth,
      atomic: [...grid.classList].some((name) => name.startsWith("x")),
    };
  });

  expect(layout?.columns).toBe(1);
  expect(layout?.atomic).toBe(true);
  expect(layout?.contentWidth).toBeLessThanOrEqual(layout?.viewportWidth ?? 0);
});
