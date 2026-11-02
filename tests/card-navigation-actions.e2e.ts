import { test } from "@e2e-dev/web";
import { expect } from "e2e";

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
    const card = document.querySelector(".catalog-component-card");
    const footer = card?.querySelector(".catalog-component-source-actions");
    const homepageLink = footer?.querySelector<HTMLAnchorElement>(".catalog-component-homepage");
    const sourceLink = footer?.querySelector<HTMLAnchorElement>(".catalog-component-original");

    if (!card || !footer || !homepageLink) return null;

    const homepageRect = homepageLink.getBoundingClientRect();
    const footerRect = footer.getBoundingClientRect();

    return {
      footerHomepageCount: footer.querySelectorAll(".catalog-component-homepage").length,
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
