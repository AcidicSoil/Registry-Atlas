import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { tokens } from "../../src/registry-explorer/ui/tokens.stylex";

const root = (path: string): string =>
  readFileSync(new URL("../../" + path, import.meta.url), "utf8");

const TOKEN_NAMES = [
  "--background",
  "--foreground",
  "--primary",
  "--card",
  "--popover",
  "--secondary",
  "--muted-foreground",
  "--border",
  "--input",
  "--radius-button",
  "--radius-card",
  "--space-1",
  "--space-2",
  "--space-3",
  "--space-4",
  "--space-5",
  "--space-6",
  "--font-sans",
  "--font-mono",
] as const;

describe("native StyleX architecture", () => {
  it("owns canonical theme tokens without duplicate CSS definitions", () => {
    const base = root("public/styles/registry-explorer.css");

    for (const key of TOKEN_NAMES) {
      expect(tokens[key]).toContain(key);
      expect(base).not.toMatch(new RegExp(`^\\s*${key}\\s*:`, "m"));
    }
  });

  it("removes migrated component selectors from legacy CSS", () => {
    const styles = [
      "public/styles/registry-explorer.css",
      "src/registry-explorer/ui/catalog-reference.css",
      "src/registry-explorer/ui/catalog-library-cards.css",
      "src/registry-explorer/ui/catalog-browse.css",
      "src/registry-explorer/ui/catalog-hierarchy.css",
      "src/registry-explorer/ui/sidebar-browse-rail.css",
    ]
      .map(root)
      .join("\n");

    for (const selector of [
      ".registry-icon",
      ".catalog-discovery-row",
      ".catalog-component-grid",
      ".catalog-collection-grid-",
      ".item-related-link",
      ".registry-directory-open",
      ".catalog-component-homepage",
    ]) {
      expect(styles).not.toContain(selector);
    }
  });

  it("validates authored StyleX with official lint rules", () => {
    const pkg = JSON.parse(root("package.json"));
    const eslint = root("eslint.config.mjs");
    expect(pkg.scripts["lint:stylex"]).toContain("eslint");
    expect(pkg.scripts.check).toContain("pnpm run lint:stylex");
    expect(pkg.scripts.verify).toContain("lint:stylex");
    expect(root(".github/workflows/deploy.yml")).toContain("pnpm lint:stylex");
    expect(eslint).toContain("@stylexjs/valid-styles");
    expect(eslint).toContain("@stylexjs/no-unused");
  });

  it("renders catalog labels without legacy presentation selectors", () => {
    const view = root("src/registry-explorer/ui/catalogComponentsView.ts");
    const styles = root("src/registry-explorer/ui/catalog-library-cards.css");
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
});
