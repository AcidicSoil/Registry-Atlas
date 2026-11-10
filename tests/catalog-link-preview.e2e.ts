import { test } from "@e2e-dev/web";
import { expect } from "e2e";

const examples = [
  {
    path: "/Registry-Atlas/components",
    query: "animated-testimonials",
    registry: "@aceternity",
    sourceUrl: "https://ui.aceternity.com/components/animated-testimonials",
    screenshot: "aceternity-animated-testimonials.webp",
  },
  {
    path: "/Registry-Atlas/blocks",
    query: "sheet-16",
    registry: "@reui",
    sourceUrl: "https://reui.io/blocks/application/sheet/sheet-16",
    screenshot: "reui-sheet-16.webp",
  },
  {
    path: "/Registry-Atlas/@shadcnblocks/blocks/about1",
    query: null,
    registry: "@shadcnblocks",
    sourceUrl: "https://shadcnblocks.com/block/about1",
    screenshot: "shadcnblocks-about1.webp",
  },
];

for (const example of examples) {
  test(`${example.registry} displays its local component screenshot on source hover`, async ({
    app,
    screen,
    browser,
  }) => {
    await app.open(example.path);

    if (example.query) await screen.getByRole("searchbox", "Search catalog").fill(example.query);

    const link = screen.getByRole(
      "link",
      example.query
        ? `Open source page on ${example.registry}`
        : "Open upstream component page for about1",
    );

    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", example.sourceUrl);
    await link.hover();

    const preview = browser.locator("#catalog-link-preview img");
    await expect(preview).toBeVisible();
    await expect(preview).toHaveAttribute(
      "src",
      `/Registry-Atlas/data/component-previews/${example.screenshot}`,
    );
    await expect
      .poll(() =>
        browser.evaluate(async () => {
          const root = document.querySelector<HTMLElement>("#catalog-link-preview");
          const image = root?.querySelector("img");

          if (!root || !image) return false;

          await image.decode().catch(() => {});

          return (
            image.complete &&
            image.naturalWidth > 0 &&
            image.getBoundingClientRect().width > 0 &&
            Number(getComputedStyle(root).opacity) > 0.99
          );
        }),
      )
      .toBe(true);

    await app.screenshot(`${example.registry.slice(1)}-component-preview`);
    await link.press("Escape");
    await expect(browser.locator("#catalog-link-preview")).toHaveCount(0);
  });
}

test("a logo source does not produce an icon-only component popup", async ({
  app,
  screen,
  browser,
}) => {
  await app.open("/Registry-Atlas/components");
  await screen.getByRole("searchbox", "Search catalog").fill(".NET logo");
  const link = screen.getByRole("link", "Open source page on @logoforge");
  await expect(link).toBeVisible();
  await link.hover();
  await expect(browser.locator("#catalog-link-preview")).toHaveCount(0);
});
