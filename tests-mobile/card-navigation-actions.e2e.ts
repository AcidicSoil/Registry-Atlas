import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("mobile card keeps one footer homepage link and clickable internal card", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/Registry-Atlas/components/s/.NET%20logo");

  const homepage = screen.getByRole("link", "Open registry homepage for @logoforge");
  const cardLink = screen.getByRole("link", "Open .NET logo from @logoforge");

  await expect(homepage).toBeVisible();
  await expect(homepage).toHaveAttribute("target", "_blank");

  const geometry = await browser.evaluate(() => {
    const card = document.querySelector("[data-catalog-card]");
    const footer = card?.querySelector("[data-catalog-actions]");
    const link = footer?.querySelector("[data-registry-homepage]");

    const open = card?.querySelector("[data-catalog-open]");

    if (!card || !footer || !link || !open) return null;

    const box = link.getBoundingClientRect();
    const footerBox = footer.getBoundingClientRect();

    return {
      cardDisplay: getComputedStyle(card).display,
      openDisplay: getComputedStyle(open).display,
      footerDisplay: getComputedStyle(footer).display,
      homepageCount: card.querySelectorAll("[data-registry-homepage]").length,
      homepageInFooter: link.parentElement === footer,
      homepageWithinViewport: box.right <= window.innerWidth,
      homepageBelowContent: box.top >= footerBox.top,
      noViewAction: !card.querySelector(".catalog-component-deeplink"),
      noHorizontalOverflow: document.documentElement.scrollWidth <= window.innerWidth,
    };
  });

  expect(geometry).toEqual({
    cardDisplay: "flex",
    openDisplay: "grid",
    footerDisplay: "flex",
    homepageCount: 1,
    homepageInFooter: true,
    homepageWithinViewport: true,
    homepageBelowContent: true,
    noViewAction: true,
    noHorizontalOverflow: true,
  });

  await app.screenshot("mobile-card-single-homepage");
  await cardLink.tap();
  await expect(browser).toHaveURL("/Registry-Atlas/@logoforge/components/dotnet");
});
