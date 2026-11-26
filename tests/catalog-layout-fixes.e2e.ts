import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("selected category remains removable after scrolling results", async ({ app, browser }) => {
  await app.open("/Registry-Atlas/components?canonical=controls%2Fbutton-group");

  const chip = browser.locator('[aria-label="Remove Category: Button Group filter"]');
  await expect(chip).toBeVisible();

  const geometry = await browser.evaluate(() => {
    const pane = document.querySelector<HTMLElement>(".content-body");

    const chip = document.querySelector<HTMLElement>(
      '[aria-label="Remove Category: Button Group filter"]',
    );

    if (!pane || !chip) return null;

    pane.scrollTop = 750;

    return {
      scrollTop: pane.scrollTop,
      paneTop: pane.getBoundingClientRect().top,
      chipTop: chip.getBoundingClientRect().top,
      paneBottom: pane.getBoundingClientRect().bottom,
      chipBottom: chip.getBoundingClientRect().bottom,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry!.scrollTop).toBeGreaterThan(0);
  expect(geometry!.chipTop).toBeGreaterThanOrEqual(geometry!.paneTop - 1);
  expect(geometry!.chipBottom).toBeLessThanOrEqual(geometry!.paneBottom + 1);

  await chip.tap();
  await expect
    .poll(() => browser.evaluate(() => location.search.includes("canonical=")))
    .toBe(false);
});

test("palette trigger stays inside the content search row", async ({ app, browser }) => {
  await app.open("/Registry-Atlas/components");
  await expect(browser.locator("#atlasCommandPalette-trigger")).toBeVisible();

  const geometry = await browser.evaluate(() => {
    document
      .querySelector<HTMLElement>("#app-main")
      ?.style.setProperty("--sidebar-panel-width", "190px");
    const bar = document.querySelector<HTMLElement>(".catalog-search-toolbar .search-bar");
    const trigger = document.querySelector<HTMLElement>("#atlasCommandPalette-trigger");
    const input = document.querySelector<HTMLElement>("#searchInput");

    if (!bar || !trigger || !input) return null;
    const bounds = bar.getBoundingClientRect();
    const button = trigger.getBoundingClientRect();

    return {
      barRight: bounds.right,
      barTop: bounds.top,
      barBottom: bounds.bottom,
      buttonRight: button.right,
      buttonTop: button.top,
      buttonBottom: button.bottom,
      inputWidth: input.getBoundingClientRect().width,
      barScrollWidth: bar.scrollWidth,
      barClientWidth: bar.clientWidth,
    };
  });

  expect(geometry).not.toBeNull();
  expect(geometry!.buttonRight).toBeLessThanOrEqual(geometry!.barRight + 1);
  expect(geometry!.buttonTop).toBeGreaterThanOrEqual(geometry!.barTop - 1);
  expect(geometry!.buttonBottom).toBeLessThanOrEqual(geometry!.barBottom + 1);
  expect(geometry!.barScrollWidth).toBeLessThanOrEqual(geometry!.barClientWidth + 1);
  expect(geometry!.inputWidth).toBeGreaterThan(0);
});

test("selects multiple component types from the content toolbar", async ({ app, browser }) => {
  await app.open("/Registry-Atlas/components");
  const query = browser.locator("#componentTypeFilterMount input");
  await expect(query).toBeVisible();
  await query.fill("split");
  await expect(browser.locator("#componentTypeFilterMount ui-combobox-content")).toBeVisible();
  await expect(
    browser.locator('#componentTypeFilterMount ui-combobox-item[value="button-group"]'),
  ).not.toBeVisible();
  await query.press("ArrowDown");
  await query.press("Enter");
  await query.fill("button group");
  await browser.locator('#componentTypeFilterMount ui-combobox-item[value="button-group"]').tap();
  await query.fill("toolbar");
  await browser.locator('#componentTypeFilterMount ui-combobox-item[value="toolbar"]').tap();
  await query.press("Escape");
  await expect
    .poll(() =>
      browser.evaluate(() => new URLSearchParams(location.search).getAll("componentType").sort()),
    )
    .toEqual(["button-group", "split-button", "toolbar"]);
  await expect(browser.locator('[aria-label="Remove Type: Toolbar filter"]')).toBeVisible();
  await app.screenshot("horizontal-filter-toolbar");
  const url = await browser.evaluate(() => location.pathname + location.search);
  await app.open(url);
  await expect(browser.locator('[aria-label="Remove Type: Toolbar filter"]')).toBeVisible();
  await browser.locator('[aria-label="Remove Type: Toolbar filter"]').tap();
  await expect
    .poll(() =>
      browser.evaluate(() => new URLSearchParams(location.search).getAll("componentType").sort()),
    )
    .toEqual(["button-group", "split-button"]);
  await expect(browser.locator("#browseToolbar [data-catalog-clear]")).toBeVisible();
  await browser.locator("#browseToolbar [data-catalog-clear]").tap();
  await expect
    .poll(() =>
      browser.evaluate(() => new URLSearchParams(location.search).getAll("componentType")),
    )
    .toEqual([]);
});
