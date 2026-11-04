import { describe, expect, it } from "vitest";
import { TEST_CATALOG_POLICY } from "./testCatalogPolicy";
import type { Registry } from "../../src/registry-explorer/core/registry.schema";
import {
  formatBrowseRouteUrl,
  hydrateBrowseRouteState,
} from "../../src/registry-explorer/ui/browseRouteState";

const base = "/Registry-Atlas/";

// SAFETY: Route-state tests only read registry.name; these stubs satisfy that narrowed input.
const registries = [{ name: "@alpha" }, { name: "@beta" }] as Registry[];

describe("browseRouteState", () => {
  it("hydrates the same canonical browse, search, filters and layout from a URL", () => {
    const state = hydrateBrowseRouteState(
      "/Registry-Atlas/components",
      "?q=button&page=3&registry=%40alpha&registry=%40missing&sort=registry&layout=list",
      base,
      registries,
      TEST_CATALOG_POLICY,
    );

    expect(state).toMatchObject({
      route: { kind: "components" },
      searchTerm: "button",
      discoveryPage: 3,
      catalogRegistryNames: ["@alpha"],
      catalogSort: "registry",
      catalogLayout: "list",
    });
    expect(formatBrowseRouteUrl(state, base, "#details", TEST_CATALOG_POLICY)).toBe(
      "/Registry-Atlas/components/s/button?page=3&sort=registry&registry=%40alpha&layout=list#details",
    );
  });

  it("keeps legacy item deep links and rejects unsupported routes", () => {
    expect(
      hydrateBrowseRouteState(
        base,
        "?view=item&registry=%40alpha&item=button",
        base,
        registries,
        TEST_CATALOG_POLICY,
      ).route,
    ).toEqual({ kind: "component", namespace: "@alpha", slug: "button" });

    const unsupported = hydrateBrowseRouteState(
      "/Registry-Atlas/unknown/bad",
      "",
      base,
      registries,
      TEST_CATALOG_POLICY,
    );

    expect(unsupported.route).toEqual({ kind: "not-found", path: "/Registry-Atlas/unknown/bad" });
    expect(formatBrowseRouteUrl(unsupported, base, "", TEST_CATALOG_POLICY)).toBeNull();
  });

  it("keeps compare selections and directory layout in shareable URLs", () => {
    const compare = hydrateBrowseRouteState(
      "/Registry-Atlas/compare",
      "?compareRegistry=%40alpha&compareRegistry=%40beta&compareRegistry=%40missing",
      base,
      registries,
      TEST_CATALOG_POLICY,
    );

    expect(compare.compareRegistryNames).toEqual(["@alpha", "@beta"]);
    expect(formatBrowseRouteUrl(compare, base, "", TEST_CATALOG_POLICY)).toBe(
      "/Registry-Atlas/compare?compareRegistry=%40alpha&compareRegistry=%40beta",
    );

    const directory = hydrateBrowseRouteState(
      "/Registry-Atlas/registries",
      "?registrySort=item-count-desc&layout=list&page=2",
      base,
      registries,
      TEST_CATALOG_POLICY,
    );

    expect(formatBrowseRouteUrl(directory, base, "", TEST_CATALOG_POLICY)).toBe(
      "/Registry-Atlas/registries?page=2&registrySort=item-count-desc&layout=list",
    );
  });
});
