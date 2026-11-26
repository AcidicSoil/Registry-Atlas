import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("Resend tokens reach actual rendered catalog controls and cards", async ({ app, browser }) => {
  await app.open("/Registry-Atlas/components");
  await expect(browser.locator("[data-catalog-card]").first()).toBeVisible();

  const styles = await browser.evaluate(async () => {
    await document.fonts.ready;
    const root = getComputedStyle(document.documentElement);
    const card = document.querySelector("[data-catalog-card]")!;
    const code = document.querySelector("[data-catalog-registry]")!;
    const search = document.querySelector(".search-bar")!;
    const panel = document.querySelector("#toggleSidebarPanel")!;

    return {
      scheme: root.colorScheme,
      bodyBackground: getComputedStyle(document.body).backgroundColor,
      cardBackground: getComputedStyle(card).backgroundColor,
      cardRadius: getComputedStyle(card).borderRadius,
      cardBorder: getComputedStyle(card).borderTopColor,
      searchRadius: getComputedStyle(search).borderRadius,
      codeColor: getComputedStyle(code).color,
      codeSize: getComputedStyle(code).fontSize,
      fonts: [...document.fonts].flatMap((font) => (font.status === "loaded" ? [font.family] : [])),
      panelSize: [panel.getBoundingClientRect().width, panel.getBoundingClientRect().height],
      scale: [
        "caption",
        "body-sm",
        "body",
        "subheading",
        "heading-sm",
        "heading",
        "heading-lg",
        "display",
      ].map((role) => root.getPropertyValue("--text-" + role).trim()),
    };
  });

  expect(styles.scheme).toBe("dark");
  expect(styles.bodyBackground).toBe("rgb(0, 0, 0)");
  expect(styles.cardBackground).not.toBe(styles.bodyBackground);
  expect(styles.cardRadius).toBe("16px");
  expect(styles.cardBorder).toBe("rgb(41, 45, 48)");
  expect(styles.searchRadius).toBe("6px");
  expect(styles.codeColor).toBe("rgb(146, 129, 247)");
  expect(styles.codeSize).toBe("12px");
  expect(styles.fonts).toContain("Inter Variable");
  expect(styles.fonts).toContain("Commit Mono");
  expect(styles.panelSize).toEqual([24, 24]);
  expect(styles.scale).toEqual(["12px", "14px", "16px", "20px", "24px", "56px", "77px", "96px"]);

  await browser.locator("#componentTypeFilterMount input").fill("split");
  await expect(browser.locator("#componentTypeFilterMount ui-combobox-content")).toBeVisible();

  const popover = await browser.evaluate(() => {
    const content = document.querySelector("#componentTypeFilterMount ui-combobox-content")!;

    return {
      background: getComputedStyle(content).backgroundColor,
      radius: getComputedStyle(content).borderRadius,
    };
  });

  expect(popover.background).not.toBe(styles.cardBackground);
  expect(popover.radius).toBe("16px");
});

test("detail search aligns with content, primary actions remain outlined", async ({
  app,
  browser,
}) => {
  await app.open("/Registry-Atlas/@logoforge/components/dotnet");
  await expect(browser.locator(".item-detail-page")).toBeVisible();

  const styles = await browser.evaluate(() => {
    const detail = document.querySelector(".item-detail-page")!;
    const search = document.querySelector(".catalog-search-toolbar")!;
    const action = document.querySelector(".install-button-primary")!;

    return {
      detailLeft: detail.getBoundingClientRect().left,
      searchLeft: search.getBoundingClientRect().left,
      buttonBackground: getComputedStyle(action).backgroundColor,
      buttonRadius: getComputedStyle(action).borderRadius,
      buttonBorder: getComputedStyle(action).borderTopStyle,
    };
  });

  expect(Math.abs(styles.searchLeft - styles.detailLeft)).toBeLessThanOrEqual(1);
  expect(styles.buttonBackground).toBe("rgba(0, 0, 0, 0)");
  expect(styles.buttonRadius).toBe("6px");
  expect(styles.buttonBorder).toBe("solid");
});
