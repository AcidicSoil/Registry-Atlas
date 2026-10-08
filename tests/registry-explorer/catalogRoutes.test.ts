import { describe, expect, it } from "vitest";
import {
  catalogRoutePath,
  parseCatalogBrowseQuery,
  parseCatalogRoute,
  serializeCatalogBrowseQuery,
  type CatalogRoute,
} from "../../src/registry-explorer/core/catalogRoutes";
import {
  configureDefaultCatalogTaxonomy,
  parseCatalogTaxonomy,
} from "../../src/registry-explorer/core/catalogTaxonomy";
import { readRepositoryDocument } from "./testAtlasDatabase";

configureDefaultCatalogTaxonomy(parseCatalogTaxonomy(readRepositoryDocument("catalog-taxonomy")));

const BASE = "/Registry-Atlas/";

describe("catalogRoutes", () => {
  it("keeps the project root distinct from /components", () => {
    expect(parseCatalogRoute("/Registry-Atlas/", BASE)).toEqual({ kind: "home" });
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

  it("keeps only the user-facing registry filter and supported sort in shareable browse state", () => {
    const parsed = parseCatalogBrowseQuery(new URLSearchParams(
      "page=3&sort=type&type=registry%3Aui&category=forms&reviewed=reviewed&registry=%40alpha",
    ));

    expect(parsed).toEqual({
      page: 3,
      sort: "name",
      itemTypes: [],
      categories: ["forms"],
      assetKinds: [],
      canonicalIds: [],
      access: [],
      reviewed: "all",
      registryNames: ["@alpha"],
    });

    expect(serializeCatalogBrowseQuery(parsed).toString()).toBe("page=3&registry=%40alpha&category=forms");
    expect(parseCatalogBrowseQuery(new URLSearchParams("sort=registry"))).toMatchObject({
      sort: "registry",
      reviewed: "all",
    });
  });

  it("rejects routes outside the configured base and unsafe traversal segments", () => {
    expect(parseCatalogRoute("/other/components", BASE)).toBeNull();
    expect(parseCatalogRoute("/Registry-Atlas/@demo/components/%2E%2E/secret", BASE)).toBeNull();
    expect(parseCatalogRoute("/Registry-Atlas/not-a-route", BASE)).toBeNull();
  });
});

describe("corrective route parity", () => {
  it('round-trips an author attribution directory without inventing author profiles',()=>{
    expect(parseCatalogRoute('/Registry-Atlas/authors',BASE)).toEqual({kind:'authors'});
    expect(catalogRoutePath({kind:'authors'},BASE)).toBe('/Registry-Atlas/authors');
  });
  it("keeps home distinct and parses audited route families", () => {
    expect(parseCatalogRoute("/Registry-Atlas/", BASE)).toEqual({ kind: "home" });
    expect(parseCatalogRoute("/Registry-Atlas/components/explore/ai", BASE)).toEqual({ kind: "explore", collection: "ai" });
    expect(parseCatalogRoute("/Registry-Atlas/templates", BASE)).toEqual({ kind: "templates" });
    expect(parseCatalogRoute("/Registry-Atlas/themes", BASE)).toEqual({ kind: "themes" });
    expect(parseCatalogRoute("/Registry-Atlas/themes/editor", BASE)).toEqual({ kind: "theme-editor" });
    expect(parseCatalogRoute("/Registry-Atlas/icons", BASE)).toEqual({ kind: "icons" });
    expect(parseCatalogRoute("/Registry-Atlas/icons/lucide", BASE)).toEqual({ kind: "icon-family", family: "lucide" });
    expect(parseCatalogRoute("/Registry-Atlas/icons/c/layout", BASE)).toEqual({ kind: "icon-category", category: "layout" });
  });

  it("retires unsupported featured/reviewed and newest routes", () => {
    for (const path of ["/components/featured", "/components/reviewed", "/components/newest", "/components/newest/2026-W40", "/authored"]) {
      expect(parseCatalogRoute(BASE.slice(0, -1) + path, BASE)).toBeNull();
    }
  });

  it("preserves legacy multi-value browse URLs while using only approved sorts", () => {
    const state = parseCatalogBrowseQuery(new URLSearchParams("registry=%40alpha&registry=%40beta&category=forms&category=ai&sort=registry"));
    expect(state).toMatchObject({ registryNames: ["@alpha", "@beta"], categories: ["forms", "ai"], sort: "registry" });
    expect(serializeCatalogBrowseQuery(state).toString()).toBe("sort=registry&registry=%40alpha&registry=%40beta&category=forms&category=ai");
  });

  it("round-trips typed asset detail routes", () => {
    const templateRoute: CatalogRoute = { kind: "template", namespace: "@demo", slug: "landing/agency" };
    const themeRoute: CatalogRoute = { kind: "theme", namespace: "@demo", slug: "vercel" };
    expect(parseCatalogRoute(catalogRoutePath(templateRoute, BASE), BASE)).toEqual(templateRoute);
    expect(parseCatalogRoute(catalogRoutePath(themeRoute, BASE), BASE)).toEqual(themeRoute);
  });
});


describe('canonical catalog browse URL state', () => {
  it('round-trips canonical ids, accurate asset kinds, and explicit access values', () => {
    const state = parseCatalogBrowseQuery(new URLSearchParams(
      'registry=%40alpha&asset=block&asset=component&canonical=application%2Fapp-shell&canonical=ai%2Fchat&access=free&access=paid',
    ));
    expect(state).toMatchObject({
      registryNames: ['@alpha'],
      assetKinds: ['block', 'component'],
      canonicalIds: ['application/app-shell', 'ai/chat'],
      access: ['free', 'paid'],
    });
    expect(serializeCatalogBrowseQuery(state).toString()).toBe(
      'registry=%40alpha&asset=block&asset=component&canonical=application%2Fapp-shell&canonical=ai%2Fchat&access=free&access=paid',
    );
  });

  it('ignores unknown canonical ids, invalid kinds, invalid access values, and unsafe facet input', () => {
    const state = parseCatalogBrowseQuery(new URLSearchParams(
      'asset=widget&asset=block&canonical=application%2Fnot-real&canonical=application&access=unknown&access=free&canonical=%00bad',
    ));
    expect(state.assetKinds).toEqual(['block']);
    expect(state.canonicalIds).toEqual(['application']);
    expect(state.access).toEqual(['free']);
  });
});
