import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("catalog copy-name control reports feedback without navigating", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/Registry-Atlas/components/s/.NET%20logo");

  const copy = screen.getByRole("button", "Copy .NET logo name");
  await expect(copy).toBeVisible();
  await app.screenshot("catalog-copy-name");
  await copy.tap();

  await expect(browser).toHaveURL("/Registry-Atlas/components/s/.NET%20logo");
  await expect(browser.locator(".copy-feedback")).toBeVisible();
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

    const open = card?.querySelector("[data-catalog-open]");
    const description = card?.querySelector("[data-catalog-description]");

    if (!card || !footer || !homepageLink || !open || !description) return null;

    const homepageRect = homepageLink.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();

    return {
      cardDisplay: getComputedStyle(card).display,
      cardRadius: getComputedStyle(card).borderRadius,
      openDisplay: getComputedStyle(open).display,
      footerDisplay: getComputedStyle(footer).display,
      descriptionClamp: getComputedStyle(description).getPropertyValue("-webkit-line-clamp"),
      homepageFontSize: getComputedStyle(homepageLink).fontSize,
      footerHomepageCount: footer.querySelectorAll("[data-registry-homepage]").length,
      homepageInFooter: homepageLink.parentElement === footer,
      homepageInsideFooterBounds:
        homepageRect.top >= footerRect.top - 2 && homepageRect.bottom <= footerRect.bottom + 2,
      hasNoViewAction: !card.querySelector(".catalog-component-deeplink"),
      hasNoInspect: !card.querySelector(".catalog-component-inspect"),
      sourceSafe:
        !sourceLink || (sourceLink.target === "_blank" && sourceLink.rel === "noreferrer noopener"),
    };
  });

  expect(layout).toEqual({
    cardDisplay: "flex",
    cardRadius: "0px",
    openDisplay: "grid",
    footerDisplay: "flex",
    descriptionClamp: "2",
    homepageFontSize: "11px",
    footerHomepageCount: 1,
    homepageInFooter: true,
    homepageInsideFooterBounds: true,
    hasNoViewAction: true,
    hasNoInspect: true,
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
