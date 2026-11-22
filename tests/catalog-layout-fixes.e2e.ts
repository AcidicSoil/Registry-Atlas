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

test("palette trigger stays inside the narrow sidebar search row", async ({ app, browser }) => {
  await app.open("/Registry-Atlas/components");
  await expect(browser.locator("#atlasCommandPalette-trigger")).toBeVisible();

  const geometry = await browser.evaluate(() => {
    document
      .querySelector<HTMLElement>("#app-main")
      ?.style.setProperty("--sidebar-panel-width", "190px");
    const bar = document.querySelector<HTMLElement>(".app-sidebar .search-bar");
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
