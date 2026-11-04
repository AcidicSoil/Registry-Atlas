import { describe, expect, it } from "vitest";
import { assetKindForCatalogItem } from "../../src/registry-explorer/core/catalogCollections";
import { parseCatalogPolicy } from "../../src/registry-explorer/core/catalogPolicy";
import {
  parseCatalogBrowseQuery,
  serializeCatalogBrowseQuery,
} from "../../src/registry-explorer/core/catalogRoutes";
import { parseRegistryCatalogIndex } from "../../src/registry-explorer/core/registryCatalogIndex";
import {
  buildCatalogFacetSummary,
  queryCatalogComponents,
} from "../../src/registry-explorer/core/catalogQuery";
import { buildRegistryDirectory } from "../../src/registry-explorer/core/registryDirectory";
import { buildCatalogComparison } from "../../src/registry-explorer/core/catalogCompare";

function testTaxonomy(id: string) {
  return {
    version: "v1",
    roots: [
      {
        id,
        label: id,
        aliases: [],
        what: id,
        notFor: [],
        examples: [],
        children: [],
      },
    ],
  };
}

describe("explicit catalog policy", () => {
  it("parses policy overrides without shared state or unsupported kinds", () => {
    const first = parseCatalogPolicy(testTaxonomy("alpha"), {
      registryDefaults: { "@example": "icon", "@ignored": "arbitrary" },
    });

    const second = parseCatalogPolicy(testTaxonomy("beta"), {
      registryDefaults: { "@example": "page" },
    });

    expect(first.kindOverrides.get("@example")).toBe("icon");
    expect(first.kindOverrides.has("@ignored")).toBe(false);
    expect(second.kindOverrides.get("@example")).toBe("page");
    expect(first.taxonomy.roots[0]?.id).toBe("alpha");
    expect(second.taxonomy.roots[0]?.id).toBe("beta");
  });

  it("validates canonical metadata only against the supplied policy", () => {
    const index = {
      meta: { registry_count: 1, item_count: 1 },
      registries: {
        "@example": [
          {
            name: "sample",
            type: "registry:component",
            canonical: { taxonomyVersion: "v1", primary: "alpha", path: ["alpha"] },
          },
        ],
      },
    };

    const alpha = parseCatalogPolicy(testTaxonomy("alpha"), null);
    const beta = parseCatalogPolicy(testTaxonomy("beta"), null);

    expect(parseRegistryCatalogIndex(index, alpha).registries["@example"]?.[0]?.name).toBe(
      "sample",
    );
    expect(() => parseRegistryCatalogIndex(index, beta)).toThrow(/unknown canonical taxonomy node/);
  });

  it("filters catalog results and facets using only the selected policy", () => {
    const registries = [
      {
        name: "@example",
        url: "https://example.com",
        description: "Example registry",
      },
    ];

    const catalog = parseRegistryCatalogIndex(
      {
        meta: { registry_count: 1, item_count: 1 },
        registries: { "@example": [{ name: "sample", type: "registry:component" }] },
      },
      parseCatalogPolicy(testTaxonomy("alpha"), null),
    );

    const icon = parseCatalogPolicy(testTaxonomy("alpha"), {
      registryDefaults: { "@example": "icon" },
    });

    const page = parseCatalogPolicy(testTaxonomy("alpha"), {
      registryDefaults: { "@example": "page" },
    });

    expect(
      queryCatalogComponents(registries, catalog, {
        assetKinds: ["icon"],
        policy: icon,
      }).total,
    ).toBe(1);
    expect(
      queryCatalogComponents(registries, catalog, {
        assetKinds: ["icon"],
        policy: page,
      }).total,
    ).toBe(0);
    expect(
      buildCatalogFacetSummary(registries, catalog, {
        assetKinds: ["icon"],
        policy: icon,
      }).registries.map(({ value }) => value),
    ).toEqual(["@example"]);
    expect(
      buildCatalogFacetSummary(registries, catalog, {
        assetKinds: ["icon"],
        policy: page,
      }).registries,
    ).toEqual([]);
  });

  it("isolates directory filters and comparison route kinds between policies", () => {
    const registries = [
      {
        name: "@example",
        url: "https://example.com",
        description: "Example registry",
      },
    ];

    const catalog = parseRegistryCatalogIndex(
      {
        meta: { registry_count: 1, item_count: 1 },
        registries: { "@example": [{ name: "sample", type: "registry:component" }] },
      },
      parseCatalogPolicy(testTaxonomy("alpha"), null),
    );

    const icon = parseCatalogPolicy(testTaxonomy("alpha"), {
      registryDefaults: { "@example": "icon" },
    });

    const page = parseCatalogPolicy(testTaxonomy("alpha"), {
      registryDefaults: { "@example": "page" },
    });

    expect(
      buildRegistryDirectory(registries, catalog, {
        assetKinds: ["icon"],
        policy: icon,
      }).total,
    ).toBe(1);
    expect(
      buildRegistryDirectory(registries, catalog, {
        assetKinds: ["icon"],
        policy: page,
      }).total,
    ).toBe(0);
    expect(
      buildCatalogComparison(registries, catalog, ["@example"], {
        policy: page,
      }).rows[0]?.cells[0]?.routeKind,
    ).toBe("page");
  });

  it("round-trips only canonical facets approved by the selected policy", () => {
    const alpha = parseCatalogPolicy(testTaxonomy("alpha"), null);
    const beta = parseCatalogPolicy(testTaxonomy("beta"), null);
    const search = new URLSearchParams("canonical=alpha");

    const accepted = parseCatalogBrowseQuery(search, alpha);
    const rejected = parseCatalogBrowseQuery(search, beta);

    expect(accepted.canonicalIds).toEqual(["alpha"]);
    expect(rejected.canonicalIds).toEqual([]);
    expect(serializeCatalogBrowseQuery(accepted, beta).has("canonical")).toBe(false);
    expect(serializeCatalogBrowseQuery(accepted, alpha).get("canonical")).toBe("alpha");
  });

  it("classifies the same item differently for independent policy instances", () => {
    const item = { name: "sample", type: "registry:component" };

    const iconPolicy = parseCatalogPolicy(testTaxonomy("alpha"), {
      registryDefaults: { "@example": "icon" },
    });

    const pagePolicy = parseCatalogPolicy(testTaxonomy("alpha"), {
      registryDefaults: { "@example": "page" },
    });

    expect(assetKindForCatalogItem(item, iconPolicy, "@example")).toBe("icon");
    expect(assetKindForCatalogItem(item, pagePolicy, "@example")).toBe("page");
    expect(assetKindForCatalogItem(item, iconPolicy, "@unconfigured")).toBe("component");
  });
});
