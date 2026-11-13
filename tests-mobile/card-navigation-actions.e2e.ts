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
    const copyButton = footer?.querySelector<HTMLButtonElement>("[data-catalog-copy-name]");

    const open = card?.querySelector("[data-catalog-open]");

    if (!card || !footer || !link || !copyButton || !open) return null;

    const box = link.getBoundingClientRect();
    const copyBox = copyButton.getBoundingClientRect();
    const footerBox = footer.getBoundingClientRect();
    const minimumTarget = matchMedia("(pointer: coarse)").matches ? 44 : 24;

    return {
      cardDisplay: getComputedStyle(card).display,
      openDisplay: getComputedStyle(open).display,
      footerDisplay: getComputedStyle(footer).display,
      homepageCount: card.querySelectorAll("[data-registry-homepage]").length,
      homepageInFooter: link.parentElement === footer,
      copyImmediatelyAfterHomepage: link.nextElementSibling === copyButton,
      copyMeetsPointerTarget: Math.min(copyBox.width, copyBox.height) >= minimumTarget,
      homepageMeetsPointerTarget: box.height >= minimumTarget,
      copyWithinViewport: copyBox.right <= window.innerWidth,
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
    copyImmediatelyAfterHomepage: true,
    copyMeetsPointerTarget: true,
    homepageMeetsPointerTarget: true,
    copyWithinViewport: true,
    homepageWithinViewport: true,
    homepageBelowContent: true,
    noViewAction: true,
    noHorizontalOverflow: true,
  });

  await app.screenshot("mobile-card-single-homepage");
  await cardLink.tap();
  await expect(browser).toHaveURL("/Registry-Atlas/@logoforge/components/dotnet");
});
