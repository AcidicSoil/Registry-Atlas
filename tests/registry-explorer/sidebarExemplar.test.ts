import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

describe("Hairline-inspired grouped sidebar", () => {
  it("separates Explore from Library with source-backed count slots", () => {
    expect(html).toContain('aria-label="Explore"');
    expect(html).toContain('aria-label="Library"');
    expect(html).toContain('data-sidebar-asset-count="component"');
    expect(html).toContain('data-view="compare"');
  });
});

describe("21st.dev-inspired sidebar shell", () => {
  it("keeps browse routes as real links in the single desktop sidebar, not a top toolbar", () => {
    for (const [view, href] of [
      ["home", "/Registry-Atlas/"],
      ["discover", "/Registry-Atlas/components"],
      ["registries", "/Registry-Atlas/registries"],
      ["authors", "/Registry-Atlas/authors"],
      ["blocks", "/Registry-Atlas/blocks"],
    ]) {
      expect(html.replace(/\s+/g, " ")).toContain(`data-view="${view}" href="${href}"`);
    }

    const search = html.indexOf('id="searchInput"');
    const layout = html.indexOf('id="browseToolbar"');
    const navigation = html.indexOf('class="primary-nav ');
    const filters = html.indexOf('id="aside"');

    expect(search).toBeGreaterThan(filters);
    expect(html.indexOf('class="catalog-search-toolbar ')).toBeLessThan(search);
    expect(layout).toBeGreaterThan(search);
    expect(navigation).toBeLessThan(filters);
    expect(html).toContain('class="sidebar-body-scroll ');
    expect(html).toMatch(/class="sidebar-body-scroll[^"]*overflow-x-hidden[^"]*overflow-y-auto/);
    expect(html).not.toContain("shadcn directory");
    expect(html).toContain('aria-label="Library"');
    expect(html).toContain('id="sidebarCollectionCurrent"');
    const nav = html.slice(navigation, filters);
    expect(nav).toContain('data-view="home"');
    expect(nav).toContain('data-view="authors"');
    expect(nav).toContain('data-view="registries"');
    expect(html).toContain('data-view="icons"');
    expect(nav).toContain('data-view="compare"');
  });
});
