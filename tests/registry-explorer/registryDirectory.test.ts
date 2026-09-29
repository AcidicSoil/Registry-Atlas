import { describe, expect, it } from "vitest";
import {
  buildRegistryDirectory,
  registryCatalogCoverage,
} from "../../src/registry-explorer/core/registryDirectory";
import type { Registry, RegistryCatalogIndex } from "../../src/registry-explorer/core/registry.schema";

function registry(name: string, comparisonEvidence: "catalog" | "stale-catalog" | "none" = "catalog"): Registry {
  return {
    name,
    url: `https://example.test/${name.slice(1)}`,
    description: `Description for ${name}`,
    primary_focus: [],
    component_tags: [],
    atlas: {
      aliases: [],
      coverageStatus: "verified",
      confidence: "high",
      notes: "",
      catalogStatus: "available",
      comparisonEvidence,
    },
    mirror: {
      officialName: name,
      registryUrlTemplate: "https://example.test/r/{name}.json",
      sourceUrl: "https://example.test/registries.json",
      syncedAt: "2026-09-28T00:00:00.000Z",
      upstreamCount: 4,
      localCount: 4,
      warnings: [],
    },
    itemSummaries: [],
  };
}

function index(registries: RegistryCatalogIndex["registries"]): RegistryCatalogIndex {
  return {
    meta: {
      registry_count: Object.keys(registries).length,
      item_count: Object.values(registries).reduce((sum, items) => sum + items.length, 0),
    },
    registries,
  };
}

describe("registryDirectory", () => {
  it("uses compact-index bucket counts instead of reviewed item summaries", () => {
    const catalog = index({
      "@large": Array.from({ length: 125 }, (_, i) => ({ name: `item-${i}`, type: "registry:component" })),
    });
    const result = buildRegistryDirectory([registry("@large")], catalog);

    expect(result.entries[0]).toMatchObject({
      itemCount: 125,
      coverage: "current",
    });
  });

  it("distinguishes current, stale, empty, and failed catalog coverage", () => {
    const catalog = index({
      "@current": [{ name: "button", type: "registry:ui" }],
      "@stale": [{ name: "card", type: "registry:ui" }],
      "@empty": [],
    });

    expect(registryCatalogCoverage(registry("@current"), catalog)).toBe("current");
    expect(registryCatalogCoverage(registry("@stale", "stale-catalog"), catalog)).toBe("stale");
    expect(registryCatalogCoverage(registry("@empty"), catalog)).toBe("empty");
    expect(registryCatalogCoverage(registry("@failed", "none"), catalog)).toBe("failed");
  });

  it("searches registry identity/description and paginates the directory", () => {
    const registries = Array.from({ length: 65 }, (_, i) => registry(`@registry-${String(i).padStart(2, "0")}`));
    const catalog = index(Object.fromEntries(
      registries.map(item => [item.name, [{ name: "button", type: "registry:ui" }]]),
    ));

    const page = buildRegistryDirectory(registries, catalog, { page: 3, pageSize: 20 });
    expect(page.total).toBe(65);
    expect(page.pageCount).toBe(4);
    expect(page.entries[0]?.registry.name).toBe("@registry-40");

    const searched = buildRegistryDirectory(registries, catalog, { search: "registry-12" });
    expect(searched.entries.map(entry => entry.registry.name)).toEqual(["@registry-12"]);
  });
});
