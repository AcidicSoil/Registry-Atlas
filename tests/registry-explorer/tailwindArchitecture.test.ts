import { existsSync, readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);

const read = (path: string) => readFileSync(new URL(path, root), "utf8");

describe("Tailwind component ownership", () => {
  it("uses Tailwind without the StyleX runtime, compiler or component sheets", () => {
    expect(read("vite.config.ts")).not.toContain("stylex");
    expect(read("package.json")).not.toContain("@stylexjs/");
    expect(
      readdirSync(new URL("src/registry-explorer/ui/", root)).filter((name) =>
        name.endsWith(".stylex.ts"),
      ),
    ).toEqual([]);
    expect(existsSync(new URL("src/registry-explorer/ui/stylex.css", root))).toBe(false);
  });

  it("retains centralized tokens and utility-owned card states", () => {
    expect(read("src/styles/tokens.css")).toContain("--atlas-background: var(--color-void-black)");
    expect(read("src/registry-explorer/ui/catalogCard.classes.ts")).toContain("group-hover/card");
    expect(read("src/registry-explorer/ui/sidebarTaxonomy.classes.ts")).toContain(
      "group-open/taxonomy",
    );
  });
  it("renders catalog labels without legacy presentation selectors", () => {
    const view = read("src/registry-explorer/ui/catalogComponentsView.ts");
    const styles = read("src/styles/globals.css");
    expect(view).toContain("data-catalog-card");
    expect(view).toContain("data-catalog-open");
    expect(view).toContain("data-catalog-description");
    expect(view).toContain("data-catalog-source");
    expect(view).toContain("data-catalog-metadata");
    expect(view).not.toContain('class="catalog-component-metadata-specimen"');
    expect(view).toContain("data-catalog-kind");
    expect(view).not.toContain('class="catalog-component-kind"');
    expect(styles).not.toMatch(/\.catalog-component-kind\s*\{/);
  });

  it("keeps the design ownership check in the lint workflow", () => {
    expect(read("mise.toml")).toContain('task = "lint:design"');
    expect(read("mise.toml")).not.toContain("lint:stylex");
  });
});
