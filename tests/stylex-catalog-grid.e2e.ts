import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("StyleX catalog grid and list keep distinct layouts", async ({ app, browser }) => {
  await app.open("/Registry-Atlas/components");

  await expect
    .poll(() => browser.evaluate(() => Boolean(document.querySelector("[data-catalog-grid]"))), {
      timeout: 55_000,
    })
    .toBe(true);

  const inspect = () =>
    browser.evaluate(() => {
      const grid = document.querySelector<HTMLElement>("[data-catalog-grid]");

      if (!grid) return null;

      const computed = getComputedStyle(grid);

      return {
        layout: grid.dataset.catalogLayout ?? null,
        display: computed.display,
        columns: computed.gridTemplateColumns.split(" ").length,
        gap: computed.rowGap,
        cards: grid.querySelectorAll("[data-catalog-card]").length,
        atomic: [...grid.classList].some((name) => name.startsWith("x")),
      };
    });

  const grid = await inspect();
  expect(grid?.layout).toBe("grid");
  expect(grid?.display).toBe("grid");
  expect(grid?.columns).toBe(3);
  expect(grid?.cards).toBeGreaterThan(0);
  expect(grid?.atomic).toBe(true);

  await browser.locator('[data-browse-layout="list"]').tap();
  await expect
    .poll(() => browser.evaluate(() => location.search.includes("layout=list")))
    .toBe(true);

  const list = await inspect();
  expect(list?.layout).toBe("list");
  expect(list?.columns).toBe(1);
  expect(list?.gap).toBe("0px");
});
