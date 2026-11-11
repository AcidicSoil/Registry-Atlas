import { describe, expect, it, vi } from "vitest";
import type { AppState } from "../../src/registry-explorer/ui/shellState";
import { createCatalogInteractions } from "../../src/registry-explorer/ui/shellInteractions";

type Attribute = "data-catalog-registry-value" | "data-catalog-canonical-value";

function control(attribute: Attribute, value: string): HTMLElement {
  const element = {
    getAttribute: (name: string) => (name === attribute ? value : null),
    closest: (selector: string) => (selector === `[${attribute}]` ? element : null),
  };

  // SAFETY: The fake supplies the DOM methods consumed by the delegated handler.
  return element as HTMLElement;
}

function harness() {
  const state: AppState = {
    route: { kind: "components" },
    authorIdentity: null,
    compareRegistryNames: [],
    searchTerm: "",
    discoveryPage: 3,
    catalogSort: "name",
    catalogRegistryNames: [],
    catalogItemTypes: [],
    catalogCategories: [],
    catalogAssetKinds: [],
    catalogCanonicalIds: [],
    catalogAccess: [],
    catalogReviewed: "all",
    registryCoverage: [],
    registrySort: "name",
    registryLayout: "grid",
    catalogLayout: "grid",
    returnRoute: null,
    installQueue: [],
    setupInstructions: "",
    copyFeedback: null,
    facetSearchTerms: {},
  };

  const navigate = vi.fn();
  const install = vi.fn(() => false);
  const setState = vi.fn((partial: Partial<AppState>) => Object.assign(state, partial));

  const handlers = createCatalogInteractions({
    getState: () => state,
    setState,
    navigate,
    handleInstall: install,
    basePath: () => "/Registry-Atlas/",
    taxonomyIds: new Set(["controls/button"]),
    authorRows: [],
    // SAFETY: Only the searchInput.value field is used by tested handlers.
    roots: { searchInput: { value: "prior search" } as HTMLInputElement },
  });

  return { handlers, state, navigate, install, setState };
}

describe("delegated shell catalog interactions", () => {
  it("keeps catalog filtering in the central state transaction", () => {
    const { handlers, state, setState } = harness();

    handlers.handleClick(control("data-catalog-registry-value", "@animate-ui"));

    expect(state.catalogRegistryNames).toEqual(["@animate-ui"]);
    expect(state.discoveryPage).toBe(1);
    expect(setState).toHaveBeenCalledWith(
      expect.objectContaining({ catalogRegistryNames: ["@animate-ui"] }),
      "push",
      expect.objectContaining({ selector: "[data-catalog-registry-value]" }),
    );
  });

  it("ignores untrusted taxonomy identifiers", () => {
    const { handlers, state, setState } = harness();

    handlers.handleClick(control("data-catalog-canonical-value", "unknown/category"));

    expect(state.catalogCanonicalIds).toEqual([]);
    expect(setState).not.toHaveBeenCalled();
  });
});
