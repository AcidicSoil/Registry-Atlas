import { describe, expect, it } from "vitest";

import {
  parseBrowseSnapshot,
  browseSnapshotKey,
  readBrowseSnapshot,
  saveBrowseSnapshot,
} from "../../src/registry-explorer/ui/browseHistory";

describe("catalog back-navigation state", () => {
  it("restores a valid stored count and scroll offset", () => {
    expect(parseBrowseSnapshot('{"pages":3,"scrollY":420}')).toEqual({ pages: 3, scrollY: 420 });
    expect(browseSnapshotKey("/Registry-Atlas/components")).toBe(
      "registry-atlas.browse.v1:/Registry-Atlas/components",
    );
  });

  it("persists and restores route-specific snapshots without involving the shell", () => {
    const storage = new Map<string, string>();

    const adapter = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
    };

    const route = "/Registry-Atlas/blocks?page=2";

    saveBrowseSnapshot(route, { pages: 4, scrollY: 320 }, () => adapter);
    expect(readBrowseSnapshot(route, () => adapter)).toEqual({ pages: 4, scrollY: 320 });
    expect(readBrowseSnapshot("/Registry-Atlas/components", () => adapter)).toBeNull();
  });

  it("falls back to memory when session storage is disabled", () => {
    const denied = {
      getItem: (): string | null => {
        throw new Error("access denied");
      },
      setItem: (): void => {
        throw new Error("access denied");
      },
    };

    expect(() =>
      saveBrowseSnapshot("route", { pages: 2, scrollY: 100 }, () => denied),
    ).not.toThrow();
    expect(readBrowseSnapshot("route", () => denied)).toBeNull();
  });

  it("rejects malformed or unbounded state", () => {
    expect(parseBrowseSnapshot("{bad")).toBeNull();
    expect(parseBrowseSnapshot('{"pages":-1,"scrollY":20}')).toBeNull();
    expect(parseBrowseSnapshot('{"pages":1000000,"scrollY":0}')).toBeNull();
    expect(parseBrowseSnapshot('{"pages":2,"scrollY":"a"}')).toBeNull();
  });
});
