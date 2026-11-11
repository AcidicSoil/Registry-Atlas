import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("native StyleX directory grid and list preserve layout, links, and responsive cards", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/Registry-Atlas/components/s/.NET%20logo");
  await screen.getByRole("link", "Libraries").tap();

  await expect
    .poll(() => browser.evaluate(() => Boolean(document.querySelector("[data-directory-card]"))), {
      timeout: 40_000,
    })
    .toBe(true);

  const sidebarStyle = await browser.evaluate(() => {
    const sidebar = document.querySelector<HTMLElement>(
      'nav[aria-label="Registry directory controls"]',
    );

    if (!sidebar) return null;
    const style = getComputedStyle(sidebar);

    return {
      display: style.display,
      gap: style.gap,
      paddingBottom: style.paddingBottom,
      hasStylex: [...sidebar.classList].some((name) => name.startsWith("x")),
      hasLegacy: sidebar.classList.contains("registry-library-sidebar"),
    };
  });

  expect(sidebarStyle).toEqual({
    display: "grid",
    gap: "0px",
    paddingBottom: "18px",
    hasStylex: true,
    hasLegacy: false,
  });

  const inspect = () =>
    browser.evaluate(() => {
      const grid = document.querySelector<HTMLElement>("[data-directory-grid]");
      const card = grid?.querySelector<HTMLElement>("[data-directory-card]");
      const link = card?.querySelector<HTMLAnchorElement>("[data-directory-open]");
      const icon = link?.querySelector<HTMLElement>('[data-registry-icon-kind="directory"]');

      if (!grid || !card || !link || !icon) return null;

      return {
        layout: grid.dataset.directoryLayout ?? null,
        grid: getComputedStyle(grid).display,
        columns: getComputedStyle(grid).gridTemplateColumns,
        card: getComputedStyle(card).display,
        iconWidth: getComputedStyle(icon).width,
        sourceNavigation: link.hasAttribute("data-profile-registry"),
        hasStylex: [...card.classList].some((name) => name.startsWith("x")),
        hasLegacy: card.classList.contains("registry-directory-card"),
      };
    });

  const initial = await inspect();

  expect(initial?.layout).toBe("grid");
  expect(initial?.grid).toBe("grid");
  expect(initial?.card).toBe("flex");
  expect(initial?.iconWidth).toBe("40px");
  expect(initial?.sourceNavigation).toBe(true);
  expect(initial?.hasStylex).toBe(true);
  expect(initial?.hasLegacy).toBe(false);

  await browser.locator('[data-browse-layout="list"]').tap();

  await expect
    .poll(() => browser.evaluate(() => location.search.includes("layout=list")))
    .toBe(true);

  const list = await inspect();

  expect(list?.layout).toBe("list");
  expect(list?.grid).toBe("grid");
  expect(list?.card).toBe("grid");
  expect(list?.iconWidth).toBe("40px");
  expect(list?.hasLegacy).toBe(false);
});
