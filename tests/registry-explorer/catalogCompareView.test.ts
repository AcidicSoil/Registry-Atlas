import { describe, expect, it } from "vitest";
import type { CatalogCompareResult } from "../../src/registry-explorer/core/catalogCompare";
import { renderCatalogCompare } from "../../src/registry-explorer/ui/catalogCompareView";

describe("renderCatalogCompare", () => {
  it('renders original and provisional links in source-specific comparison cells',()=>{
    const body=root();
    const cell=result();
    cell.rows[0].cells[0]={namespace:'@a',present:true,routePath:'/Registry-Atlas/@a/components/button',
      registryHomepage:'https://example.test',
      sourcePage:{url:'https://example.test/docs/button',level:'sitemap',source:'official-sitemap'}};
    renderCatalogCompare(root(),body,cell,['@a','@b']);
    expect(body.innerHTML).toContain('href="https://example.test/docs/button"');
    expect(body.innerHTML).toContain('View sitemap-listed page');
    expect(body.innerHTML).toContain('data-view-item-slug="button"');
  });
  it("renders exact catalog presence with links to real component routes", () => {
    const body = root();
    renderCatalogCompare(root(), body, result(), ["@a", "@b", "@c"], "");

    expect(body.innerHTML).toContain("1 shared component");
    expect(body.innerHTML).toContain("3 unique components");
    expect(body.innerHTML).toContain('data-view-item-registry="@a"');
    expect(body.innerHTML).toContain('data-view-item-slug="button"');
    expect(body.innerHTML).toContain("Not listed");
    expect(body.innerHTML).not.toContain("Inferred");
    expect(body.innerHTML).not.toContain("Default capabilities");
  });

  it("keeps registry selection searchable and bounded", () => {
    const body = root();
    renderCatalogCompare(root(), body, {
      ...result(),
      selectedRegistryNames: [],
      rows: [],
      unionCount: 0,
      intersectionCount: 0,
      total: 0,
      pageCount: 0,
    }, Array.from({ length: 20 }, (_, index) => `@registry-${index}`), "registry-1");

    expect(body.innerHTML).toContain('data-compare-search="registry"');
    expect((body.innerHTML.match(/data-compare-registry=/g) ?? []).length).toBeLessThanOrEqual(10);
  });
});

function root(): HTMLElement {
  return { innerHTML: "" } as HTMLElement;
}

function result(): CatalogCompareResult {
  return {
    selectedRegistryNames: ["@a", "@b"],
    unionCount: 3,
    intersectionCount: 1,
    total: 3,
    page: 1,
    pageSize: 40,
    pageCount: 1,
    rows: [{
      identity: "button",
      slug: "button",
      displayName: "Button",
      presentIn: ["@a"],
      cells: [
        { namespace: "@a", present: true, routePath: "/Registry-Atlas/@a/components/button" },
        { namespace: "@b", present: false },
      ],
    }],
  };
}
