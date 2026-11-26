import { describe, expect, it } from "vitest";
import { renderCatalogGridAttributes } from "../../src/registry-explorer/ui/catalogGrid";

describe("catalog grid utility attributes", () => {
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
    expect(grid).toContain("grid-cols-3");
    expect(list).toContain("grid-cols-1");
    expect(list).not.toContain("max-[1080px]:grid-cols-2");
    expect(component).toContain("gap-3");
    expect(component).not.toContain("border-l");
    expect(list).not.toContain("catalog-component-grid-list");
    expect(component).not.toContain("catalog-collection-grid-component");
  });
});
