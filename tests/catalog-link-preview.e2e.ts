import { test } from "@e2e-dev/web";
import { expect } from "e2e";

const sourceUrl = "https://ui.aceternity.com/components/animated-testimonials";

const sourceRoute = "/Registry-Atlas/components/s/animated-testimonials";

const imagePath = "data/component-previews/test-pattern.webp";

const imageUrl = "/Registry-Atlas/" + imagePath;

// Synthetic transport fixture, not a published or reviewed component screenshot.
// The real loader, URL matching, image decoding and popup handlers run unchanged.
const manifest = {
  schemaVersion: 1,
  previews: [
    {
      namespace: "@aceternity",
      slug: "animated-testimonials",
      sourceUrl,
      captureSourceUrl: "https://example.org/test-pattern.webp",
      imagePath,
      sha256: "6d91294b11accba88e7759a5d95017d296fea1a7b191f23671514d6edd98acb4",
      verifiedAt: "2026-11-04T00:00:00Z",
      method: "reviewed-publisher-screenshot",
    },
  ],
};

test("verified source preview displays on hover and focus, and Escape dismisses it", async ({
  app,
  browser,
  screen,
}) => {
  await browser.route("**/data/component-previews.json", (route) =>
    route.fulfill({ json: manifest }),
  );
  await browser.route("**/" + imagePath, (route) =>
    route.fulfill({ path: "tests/fixtures/preview-test-pattern.webp", contentType: "image/webp" }),
  );
  await app.open(sourceRoute);

  const link = screen.getByRole("link", "Open source page on @aceternity");
  const popup = browser.locator("#catalog-link-preview[role='tooltip']");
  const image = browser.locator("#catalog-link-preview img");

  await expect(link).toBeVisible();
  await expect(link).toHaveAttribute("href", sourceUrl);
  await link.hover();
  await expect(image).toBeVisible();
  await expect(image).toHaveAttribute("src", imageUrl);
  await expect
    .poll(() =>
      browser.evaluate(async () => {
        const preview = document.querySelector<HTMLImageElement>("#catalog-link-preview img");

        if (!preview) return false;
        await preview.decode();

        return preview.naturalWidth > 0 && preview.getBoundingClientRect().width > 0;
      }),
    )
    .toBe(true);
  await link.press("Escape");
  await expect(popup).toHaveCount(0);
  await screen.getByRole("searchbox", "Search catalog").focus();
  await link.focus();
  await expect(popup).toBeVisible();
  await expect
    .poll(() =>
      browser.evaluate(() =>
        Boolean(
          document.activeElement
            ?.getAttribute("aria-describedby")
            ?.includes("catalog-link-preview"),
        ),
      ),
    )
    .toBe(true);
  await link.press("Escape");
  await expect(popup).toHaveCount(0);
  await expect
    .poll(() =>
      browser.evaluate(() =>
        Boolean(
          document.activeElement
            ?.getAttribute("aria-describedby")
            ?.includes("catalog-link-preview"),
        ),
      ),
    )
    .toBe(false);
  await expect(link).toHaveAttribute("href", sourceUrl);
});

test("unavailable optional preview data leaves source navigation usable without a popup", async ({
  app,
  browser,
  screen,
}) => {
  await browser.route("**/data/component-previews.json", (route) => route.fulfill({ status: 404 }));
  await app.open(sourceRoute);

  const link = screen.getByRole("link", "Open source page on @aceternity");
  await expect(link).toBeVisible();
  await link.focus();
  await expect(browser.locator("#catalog-link-preview")).toHaveCount(0);
  await expect(link).toHaveAttribute("href", sourceUrl);
});
