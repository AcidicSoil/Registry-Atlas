import { describe, expect, it } from "vitest";
import type { RegistryDirectoryResult } from "../../src/registry-explorer/core/registryDirectory";
import type { Registry } from "../../src/registry-explorer/core/registry.schema";
import {
  renderRegistryDirectory,
  renderRegistryDirectorySidebar,
} from "../../src/registry-explorer/ui/registryDirectoryView";

describe("renderRegistryDirectory", () => {
  it("renders library-style registry cards with source-backed icons and direct homepage links", () => {
    const body = root();
    renderRegistryDirectory(root(), body, result(), {
      layout: "grid",
    });

    expect(body.innerHTML).toContain("@registrydirectory");
    expect(body.innerHTML).toContain("13,544 items");
    expect(body.innerHTML).toContain("Current");
    expect(body.innerHTML).toContain('data-registry-icon-image');
    expect(body.innerHTML).toContain('href="/Registry-Atlas/@registrydirectory"');
    expect(body.innerHTML).toContain('class="registry-directory-copy registry-directory-open"');
    expect(body.innerHTML).toContain('href="https://registry.directory/"');
    expect(body.innerHTML).toContain('>Homepage ↗</a>');
    expect(body.innerHTML).toContain("registry-directory-grid-grid");
    expect(body.innerHTML).not.toContain("View registry");
    expect(body.innerHTML).not.toContain("registry-directory-controls");
  });

  it("renders the exemplar-style registry source, sort, and category rows", () => {
    const html = renderRegistryDirectorySidebar({
      layout: "list",
      sort: "item-count-desc",
      registryCount: 430,
      assetCounts: {
        component: 420,
        block: 280,
        page: 90,
        template: 45,
        theme: 12,
        icon: 16,
        other: 4,
      },
      selectedAssetKinds: ["block"],
    });

    expect(html).toContain("shadcn directory");
    expect(html).toContain('data-registry-sort-value="item-count-desc"');
    expect(html).toMatch(/data-registry-sort-value="item-count-desc"[^>]*aria-pressed="true"/);
    expect(html).toContain('data-registry-asset-value="block"');
    expect(html).toMatch(/data-registry-asset-value="block"[^>]*aria-pressed="true"/);
    expect(html).toContain(">Blocks<");
    expect(html).toContain("280");
    expect(html).not.toContain('type="checkbox"');
    expect(html).not.toContain('type="radio"');
    expect(html).not.toContain("Canonical category");
    expect(html).not.toContain("data-registry-layout");
  });

  it.each(["javascript:alert(1)", "https://user:pass@registry.directory", "//untrusted.example"])(
    "does not expose an unsafe registry homepage: %s",
    (url) => {
      const view = result();
      view.entries[0]!.registry.url = url;
      const body = root();
      renderRegistryDirectory(root(), body, view);
      expect(body.innerHTML).not.toContain(">Homepage ↗</a>");
      expect(body.innerHTML).not.toContain('href="javascript:');
      expect(body.innerHTML).not.toContain("user:pass@");
    },
  );

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
