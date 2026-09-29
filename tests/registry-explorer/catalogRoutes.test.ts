import { describe, expect, it } from "vitest";
import {
  catalogRoutePath,
  parseCatalogBrowseQuery,
  parseCatalogRoute,
  serializeCatalogBrowseQuery,
  type CatalogRoute,
} from "../../src/registry-explorer/core/catalogRoutes";

const BASE = "/Registry-Atlas/";

describe("catalogRoutes", () => {
  it("treats the project root and /components as the real component catalogue", () => {
    expect(parseCatalogRoute("/Registry-Atlas/", BASE)).toEqual({ kind: "components" });
    expect(parseCatalogRoute("/Registry-Atlas/components", BASE)).toEqual({ kind: "components" });
  });

  it("parses registry, compare, and shareable component-search routes", () => {
    expect(parseCatalogRoute("/Registry-Atlas/registries", BASE)).toEqual({ kind: "registries" });
    expect(parseCatalogRoute("/Registry-Atlas/compare", BASE)).toEqual({ kind: "compare" });
    expect(parseCatalogRoute("/Registry-Atlas/components/s/button", BASE)).toEqual({
      kind: "components",
      pathSearchTerm: "button",
    });
  });

  it("round-trips a registry profile route without encoding the @ namespace marker", () => {
    const route: CatalogRoute = { kind: "registry", namespace: "@registrydirectory" };
    const path = catalogRoutePath(route, BASE);

    expect(path).toBe("/Registry-Atlas/@registrydirectory");
    expect(parseCatalogRoute(path, BASE)).toEqual(route);
  });

  it("round-trips nested component slugs segment-by-segment", () => {
    const route: CatalogRoute = {
      kind: "component",
      namespace: "@agentcn",
      slug: "eve/browser-agent",
    };
    const path = catalogRoutePath(route, BASE);

    expect(path).toBe("/Registry-Atlas/@agentcn/components/eve/browser-agent");
    expect(parseCatalogRoute(path, BASE)).toEqual(route);
  });

  it("preserves encoded characters inside component path segments", () => {
    const route: CatalogRoute = {
      kind: "component",
      namespace: "@demo",
      slug: "menus/context menu",
    };
    const path = catalogRoutePath(route, BASE);

    expect(path).toBe("/Registry-Atlas/@demo/components/menus/context%20menu");
    expect(parseCatalogRoute(path, BASE)).toEqual(route);
  });

  it("round-trips shareable real-catalog page, filter, and sort state", () => {
    const parsed = parseCatalogBrowseQuery(new URLSearchParams(
      "page=3&sort=type&type=registry%3Aui&type=registry%3Ablock&category=forms&reviewed=reviewed&registry=%40alpha",
    ));

    expect(parsed).toEqual({
      page: 3,
      sort: "type",
      itemTypes: ["registry:ui", "registry:block"],
      categories: ["forms"],
      reviewed: "reviewed",
      registryNames: ["@alpha"],
    });

    expect(serializeCatalogBrowseQuery(parsed).toString()).toBe(
      "page=3&sort=type&registry=%40alpha&type=registry%3Aui&type=registry%3Ablock&category=forms&reviewed=reviewed",
    );
  });

  it("rejects routes outside the configured base and unsafe traversal segments", () => {
    expect(parseCatalogRoute("/other/components", BASE)).toBeNull();
    expect(parseCatalogRoute("/Registry-Atlas/@demo/components/%2E%2E/secret", BASE)).toBeNull();
    expect(parseCatalogRoute("/Registry-Atlas/not-a-route", BASE)).toBeNull();
  });
});
