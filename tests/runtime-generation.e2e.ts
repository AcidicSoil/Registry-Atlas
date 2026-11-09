import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("catalog and lazy details load the published generation assets", async ({
  app,
  browser,
  screen,
}) => {
  await app.open("/Registry-Atlas/registries");

  await expect(screen.getByRole("searchbox", "Search catalog")).toBeVisible();

  const generation = await browser.evaluate(async () => {
    const response = await fetch("/Registry-Atlas/data/runtime-manifest.json", {
      cache: "no-store",
    });

    if (!response.ok) return null;

    const manifest = await response.json();

    return String(manifest.generation ?? "");
  });

  expect(generation).toMatch(/^[a-f0-9]{64}$/);

  await expect
    .poll(() =>
      browser.evaluate(
        (id) =>
          performance
            .getEntriesByType("resource")
            .some((entry) =>
              entry.name.includes("/data/generations/" + id + "/registry-atlas.json.gz"),
            ),
        generation,
      ),
    )
    .toBe(true);

  await app.open("/Registry-Atlas/@logoforge/components/dotnet");

  await expect(screen.getByRole("heading", ".NET logo")).toBeVisible();

  await expect
    .poll(() =>
      browser.evaluate(
        (id) =>
          performance
            .getEntriesByType("resource")
            .some((entry) =>
              entry.name.includes("/data/generations/" + id + "/registry-details.json.gz"),
            ),
        generation,
      ),
    )
    .toBe(true);
});
