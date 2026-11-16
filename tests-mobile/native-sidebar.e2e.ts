import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("mobile menu is native modal, dismissible, and preserves routes", async ({
  app,
  screen,
  browser,
}) => {
  await app.open();

  const opener = screen.getByRole("button", "Open navigation");

  await expect(opener).toBeVisible();
  await opener.tap();

  const modal = screen.getByRole("dialog", "Registry Atlas navigation");

  await expect(modal).toBeVisible();
  await expect(opener).toHaveAttribute("aria-expanded", "true");
  await expect
    .poll(() =>
      browser.evaluate(() => {
        const dialog = document.getElementById("mobileSidebarDialog");

        return dialog instanceof HTMLDialogElement && dialog.open && dialog.matches(":modal");
      }),
    )
    .toBe(true);

  await app.screenshot("mobile-navigation-modal");
  await screen.getByRole("button", "Close navigation").tap();
  await expect(modal).not.toBeVisible();
  await expect(opener).toHaveAttribute("aria-expanded", "false");

  await opener.tap();
  await screen.getByRole("link", "Libraries").tap();
  await expect(browser).toHaveURL("/Registry-Atlas/registries");
  await expect(modal).not.toBeVisible();
});

test("mobile backdrop dismisses navigation without dismissing inside clicks", async ({
  app,
  screen,
  browser,
}) => {
  await app.open();

  const opener = screen.getByRole("button", "Open navigation");
  const modal = screen.getByRole("dialog", "Registry Atlas navigation");

  await opener.tap();
  await expect(modal).toBeVisible();

  const points = await browser.evaluate(() => {
    const dialog = document.getElementById("mobileSidebarDialog");

    if (!(dialog instanceof HTMLDialogElement)) throw new Error("Missing mobile dialog");

    const bounds = dialog.getBoundingClientRect();

    return {
      inside: {
        x: Math.round(bounds.left + 4),
        y: Math.round(bounds.top + bounds.height / 2),
      },
      backdrop: {
        x: Math.round((bounds.right + window.innerWidth) / 2),
        y: Math.round(bounds.top + bounds.height / 2),
      },
    };
  });

  await screen.tapAt(points.inside);
  await expect(modal).toBeVisible();

  await screen.tapAt(points.backdrop);
  await expect(modal).not.toBeVisible();
  await expect(opener).toHaveAttribute("aria-expanded", "false");
  await expect
    .poll(() =>
      browser.evaluate(
        () => document.activeElement === document.querySelector('[aria-label="Open navigation"]'),
      ),
    )
    .toBe(true);
});
