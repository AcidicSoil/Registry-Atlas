import { describe, expect, it } from "vitest";
import type { RegistryDirectoryResult } from "../../src/registry-explorer/core/registryDirectory";
import type { Registry } from "../../src/registry-explorer/core/registry.schema";
import { renderRegistryDirectory } from "../../src/registry-explorer/ui/registryDirectoryView";

describe("renderRegistryDirectory", () => {
  it("renders real indexed counts, explicit catalog coverage, and directory controls", () => {
    const body = root();
    renderRegistryDirectory(root(), body, result(), {
      searchTerm: "registry",
      coverage: ["current"],
      sort: "item-count-desc",
    });

    expect(body.innerHTML).toContain("@registrydirectory");
    expect(body.innerHTML).toContain("13,544 indexed assets");
    expect(body.innerHTML).toContain("Current catalog");
    expect(body.innerHTML).toContain("<strong>1</strong> current");
    expect(body.innerHTML).toContain('data-registry-search');
    expect(body.innerHTML).toContain('<option value="current" selected>');
    expect(body.innerHTML).toContain('<option value="item-count-desc" selected>');
    expect(body.innerHTML).toContain('data-profile-registry="@registrydirectory"');
    expect(body.innerHTML).not.toContain("known items");
  });

  it("renders registry pagination instead of an unbounded card wall", () => {
    const body = root();
    renderRegistryDirectory(root(), body, {
      ...result(),
      total: 392,
      page: 2,
      pageSize: 32,
      pageCount: 13,
      hasPreviousPage: true,
      hasNextPage: true,
    });

    expect(body.innerHTML).toContain("33–64 of 392 registries");
    expect(body.innerHTML).toContain("Page 2 of 13");
    expect(body.innerHTML).toContain('data-discovery-page="1"');
    expect(body.innerHTML).toContain('data-discovery-page="3"');
  });
});

function root(): HTMLElement {
  return { innerHTML: "" } as HTMLElement;
}

function result(): RegistryDirectoryResult {
  return {
    entries: [{ registry: registry(), itemCount: 13544, coverage: "current" }],
    total: 1,
    page: 1,
    pageSize: 32,
    pageCount: 1,
    hasPreviousPage: false,
    hasNextPage: false,
    coverageCounts: {
      current: 1,
      stale: 0,
      empty: 0,
      failed: 0,
    },
  };
}

function registry(): Registry {
  return {
    name: "@registrydirectory",
    url: "https://registry.directory",
    description: "The explorer for the shadcn registry ecosystem.",
    atlas: {
      aliases: [],
      coverageStatus: "verified",
      confidence: "high",
      notes: "",
      catalogStatus: "available",
    },
    itemSummaries: [],
  };
}
