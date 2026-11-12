import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("category expansion and filtering are distinct actions", async ({ app, browser }) => {
  await app.open("/Registry-Atlas/components");

  const group = browser.locator('[data-sidebar-taxonomy-group="navigation"]');
  const heading = browser.locator('[data-sidebar-taxonomy-group="navigation"] > summary');

  await expect
    .poll(
      () =>
        browser.evaluate(() =>
          Boolean(document.querySelector('[data-sidebar-taxonomy-group="navigation"]')),
        ),
      { timeout: 30_000 },
    )
    .toBe(true);
  await expect(group).toBeVisible();

  const navStyle = await browser.evaluate(() => {
    const nav = document.querySelector<HTMLElement>('nav[aria-label="Browse catalog"]');

    if (!nav) return null;
    const style = getComputedStyle(nav);

    return {
      display: style.display,
      gap: style.gap,
      paddingBottom: style.paddingBottom,
      hasStylex: [...nav.classList].some((name) => name.startsWith("x")),
    };
  });

  expect(navStyle).toEqual({
    display: "grid",
    gap: "0px",
    paddingBottom: "18px",
    hasStylex: true,
  });

  const taxonomyStyle = await browser.evaluate(() => {
    const group = document.querySelector<HTMLElement>('[data-sidebar-taxonomy-group="navigation"]');
    const summary = group?.querySelector<HTMLElement>("summary");
    const chevron = group?.querySelector<HTMLElement>(".sidebar-taxonomy-chevron");

    if (!group || !summary || !chevron) return null;

    return {
      groupHasStylex: [...group.classList].some((name) => name.startsWith("x")),
      summaryHasStylex: [...summary.classList].some((name) => name.startsWith("x")),
      listStyle: getComputedStyle(summary).listStyleType,
      closedChevron: getComputedStyle(chevron).transform,
    };
  });

  expect(taxonomyStyle).not.toBeNull();
  expect(taxonomyStyle?.groupHasStylex).toBe(true);
  expect(taxonomyStyle?.summaryHasStylex).toBe(true);
  expect(taxonomyStyle?.listStyle).toBe("none");

  const before = await browser.evaluate(() => location.search);

  await heading.tap();
  await expect(group).toHaveAttribute("open", "");
  await expect
    .poll(() =>
      browser.evaluate(() => {
        const chevron = document.querySelector<HTMLElement>(
          '[data-sidebar-taxonomy-group="navigation"] .sidebar-taxonomy-chevron',
        );

        return chevron ? getComputedStyle(chevron).transform : null;
      }),
    )
    .not.toBe(taxonomyStyle?.closedChevron ?? null);
  expect(await browser.evaluate(() => location.search)).toBe(before);

  await browser.locator('[data-catalog-sort-value="registry"]').tap();
  await expect(group).toHaveAttribute("open", "");

  const child = browser.locator('[data-catalog-canonical-value="navigation/navbar"]');
  await expect(child).toBeVisible();
  await child.tap();
  await expect
    .poll(() => browser.evaluate(() => location.search.includes("navigation")))
    .toBe(true);
  await expect(group).toHaveAttribute("open", "");

  await app.screenshot("grouped-sidebar-navigation");

  await heading.press("Enter");
  await expect(group).not.toHaveAttribute("open", "");
  await heading.press("Enter");
  await expect(group).toHaveAttribute("open", "");
});

test("selected taxonomy branch can be collapsed across sorting and reopened", async ({
  app,
  browser,
}) => {
  await app.open("/Registry-Atlas/components?canonical=navigation%2Fnavbar");

  const group = browser.locator('[data-sidebar-taxonomy-group="navigation"]');
  const summary = browser.locator('[data-sidebar-taxonomy-group="navigation"] > summary');

  const selection = browser.locator(
    '[data-sidebar-taxonomy-group="navigation"] [data-catalog-canonical-value="navigation/navbar"]',
  );

  await expect
    .poll(
      () =>
        browser.evaluate(
          () =>
            document
              .querySelector('[data-sidebar-taxonomy-group="navigation"]')
              ?.hasAttribute("open") ?? false,
        ),
      { timeout: 30_000 },
    )
    .toBe(true);
  await expect(group).toHaveAttribute("open", "");
  await expect(selection).toHaveAttribute("aria-pressed", "true");

  const initial = await browser.evaluate(
    () => document.querySelector(".catalog-result-meta")?.textContent?.trim() ?? "",
  );

  await summary.press("Enter");
  await expect(group).not.toHaveAttribute("open", "");

  await browser.locator('[data-catalog-sort-value="registry"]').tap();
  await expect(group).not.toHaveAttribute("open", "");
  await expect
    .poll(() =>
      browser.evaluate(
        () => document.querySelector(".catalog-result-meta")?.textContent?.trim() ?? "",
      ),
    )
    .toBe(initial);

  await summary.press("Enter");
  await expect(group).toHaveAttribute("open", "");
  await expect(selection).toHaveAttribute("aria-pressed", "true");
});
