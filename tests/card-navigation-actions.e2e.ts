import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("catalog copy-name control reports feedback without navigating", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/Registry-Atlas/components/s/.NET%20logo");

  await browser.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });

    return true;
  });

  const copy = screen.getByRole("button", "Copy .NET logo name");
  await expect(copy).toBeVisible();
  await app.screenshot("catalog-copy-name");
  await copy.tap();

  await expect(browser).toHaveURL("/Registry-Atlas/components/s/.NET%20logo");
  await expect(browser.locator(".copy-feedback-success")).toBeVisible();
  await expect
    .poll(() => browser.evaluate(() => document.querySelector(".copy-feedback") === null), {
      timeout: 7_000,
    })
    .toBe(true);
  await expect(screen.getByRole("link", "Open .NET logo from @logoforge")).toBeVisible();
});

test("catalog card uses one footer homepage link and retains internal card navigation", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/Registry-Atlas/components/s/.NET%20logo");

  const homepage = screen.getByRole("link", "Open registry homepage for @logoforge");
  const cardLink = screen.getByRole("link", "Open .NET logo from @logoforge");

  await expect(homepage).toBeVisible();
  await expect(homepage).toHaveAttribute("target", "_blank");
  await expect(homepage).toHaveAttribute("rel", "noreferrer noopener");
  await expect(cardLink).toHaveAttribute("href", "/Registry-Atlas/@logoforge/components/dotnet");

  const layout = await browser.evaluate(() => {
    const card = document.querySelector("[data-catalog-card]");
    const footer = card?.querySelector("[data-catalog-actions]");
    const homepageLink = footer?.querySelector<HTMLAnchorElement>("[data-registry-homepage]");
    const sourceLink = footer?.querySelector<HTMLAnchorElement>("[data-catalog-source]");
    const copyButton = footer?.querySelector<HTMLButtonElement>("[data-catalog-copy-name]");

    const description = card?.querySelector("[data-catalog-description]");

    if (!card || !footer || !homepageLink || !copyButton || !description) return null;

    const homepageRect = homepageLink.getBoundingClientRect();
    const copyRect = copyButton.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();

    return {
      descriptionClamp: getComputedStyle(description).getPropertyValue("-webkit-line-clamp"),
      footerHomepageCount: footer.querySelectorAll("[data-registry-homepage]").length,
      homepageInFooter: homepageLink.parentElement === footer,
      copyImmediatelyAfterHomepage: homepageLink.nextElementSibling === copyButton,
      sourceAfterCopy: !sourceLink || copyButton.nextElementSibling === sourceLink,
      copyDoesNotOverlapHomepage: copyRect.left >= homepageRect.right,
      copyTargetMinSize: Math.min(copyRect.width, copyRect.height) >= 24,
      homepageTargetMinHeight: homepageRect.height >= 24,
      homepageInsideFooterBounds:
        homepageRect.top >= footerRect.top - 2 && homepageRect.bottom <= footerRect.bottom + 2,
      sourceSafe:
        !sourceLink || (sourceLink.target === "_blank" && sourceLink.rel === "noreferrer noopener"),
    };
  });

  expect(layout).toEqual({
    descriptionClamp: "2",
    footerHomepageCount: 1,
    homepageInFooter: true,
    copyImmediatelyAfterHomepage: true,
    sourceAfterCopy: true,
    copyDoesNotOverlapHomepage: true,
    copyTargetMinSize: true,
    homepageTargetMinHeight: true,
    homepageInsideFooterBounds: true,
    sourceSafe: true,
  });
  await app.screenshot("card-footer-homepage");

  await screen.getByRole("button", "List").tap();
  await expect(homepage).toBeVisible();
  await app.screenshot("card-footer-homepage-list");

  await cardLink.tap();
  await expect(browser).toHaveURL("/Registry-Atlas/@logoforge/components/dotnet");
  await expect(screen.getByRole("heading", ".NET logo")).toBeVisible();
});

test("nested theme cards show distinct names and expose canonical copy paths", async ({
  app,
  browser,
  screen,
}) => {
  await browser.addInitScript(() => {
    document.addEventListener(
      "DOMContentLoaded",
      () => {
        const input = document.querySelector<HTMLInputElement>("#searchInput");

        document.documentElement.dataset.initialSearchDisabled = String(input?.disabled);
      },
      { once: true },
    );
  });
  await app.open("/Registry-Atlas/themes");

  const search = screen.getByRole("searchbox", "Search catalog");
  const apple = screen.getByRole("link", "Open Apple from @registrydirectory");
  const copy = screen.getByRole("button", "Copy Apple item path");

  await expect
    .poll(() =>
      browser.evaluate(() => document.documentElement.dataset.initialSearchDisabled ?? null),
    )
    .toBe("true");
  await expect(search).toBeEnabled();
  await search.fill("marvkr/apple/all");
  await expect(apple).toBeVisible();
  await expect(copy).toHaveAttribute("data-copy-text", "@registrydirectory/marvkr/apple/all");
  await expect(apple).toHaveAttribute(
    "href",
    "/Registry-Atlas/@registrydirectory/themes/marvkr/apple/all",
  );

  await browser.evaluate(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: async () => undefined },
    });

    return true;
  });

  await copy.tap();
  await expect(browser.locator(".copy-feedback-success")).toBeVisible();

  await search.fill("marvkr/beam-lib/all");
  await expect(screen.getByRole("link", "Open Beam Lib from @registrydirectory")).toBeVisible();
});
