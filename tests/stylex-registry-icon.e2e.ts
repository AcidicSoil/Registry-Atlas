import { test } from "@e2e-dev/web";
import { expect } from "e2e";

test("native StyleX registry icon variants preserve sizing across catalog routes", async ({
  app,
  browser,
}) => {
  for (const { route, variant, pixels } of [
    { route: "/Registry-Atlas/components/s/.NET%20logo", variant: "default", pixels: 36 },
    { route: "/Registry-Atlas/registries", variant: "directory", pixels: 40 },
    { route: "/Registry-Atlas/@logoforge/components/dotnet", variant: "detail", pixels: 44 },
  ]) {
    await app.open(route);
    await expect
      .poll(
        () =>
          browser.evaluate(
            (kind) => document.querySelector(`[data-registry-icon-kind="${kind}"]`) !== null,
            variant,
          ),
        { timeout: 30_000 },
      )
      .toBe(true);

    const details = await browser.evaluate((kind) => {
      const icon = document.querySelector(`[data-registry-icon-kind="${kind}"]`);

      if (!(icon instanceof HTMLElement)) return null;

      const style = getComputedStyle(icon);

      return {
        width: style.width,
        height: style.height,
        display: style.display,
        backgroundColor: style.backgroundColor,
        borderWidth: style.borderWidth,
        borderStyle: style.borderStyle,
        fallback: Boolean(icon.querySelector("[data-registry-icon-fallback]")),
        legacy: icon.classList.contains("registry-icon"),
        atomic: [...icon.classList].some((name) => name.startsWith("x")),
      };
    }, variant);

    expect(details).toEqual({
      width: `${pixels}px`,
      height: `${pixels}px`,
      display: "grid",
      backgroundColor: "rgba(0, 0, 0, 0)",
      borderWidth: "0px",
      borderStyle: "none",
      fallback: true,
      legacy: false,
      atomic: true,
    });
  }
});
