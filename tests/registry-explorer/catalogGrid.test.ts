import { describe, expect, it } from "vitest";
import { renderCatalogGridAttributes } from "../../src/registry-explorer/ui/catalogGrid";

describe("catalog grid StyleX attributes", () => {
  it("uses semantic grid attributes without layout CSS classes", () => {
    const grid = renderCatalogGridAttributes();
    const list = renderCatalogGridAttributes({ layout: "list" });
    const component = renderCatalogGridAttributes({ kind: "component" });
    const theme = renderCatalogGridAttributes({ kind: "theme" });

    expect(grid).toContain("data-catalog-grid");
    expect(grid).toContain('data-catalog-layout="grid"');
    expect(list).toContain('data-catalog-layout="list"');
    expect(component).toContain('data-catalog-grid-kind="component"');
    expect(theme).toContain('data-catalog-grid-kind="theme"');
    expect(grid).toMatch(/class="x/);
    expect(list).not.toContain("catalog-component-grid-list");
    expect(component).not.toContain("catalog-collection-grid-component");
  });
});
