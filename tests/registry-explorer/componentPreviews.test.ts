import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";
import { describe, expect, it } from "vitest";
import {
  parseComponentPreviewManifest,
  loadComponentPreviews,
} from "../../src/registry-explorer/ui/componentPreviews";

const image = {
  namespace: "@reui",
  slug: "sheet-16",
  sourceUrl: "https://reui.io/blocks/application/sheet/sheet-16",
  captureSourceUrl: "https://reui.io/thumbnails/blocks/sheet-16-light.webp",
  imagePath: "data/component-previews/reui-sheet-16.webp",
  sha256: "a".repeat(64),
  verifiedAt: "2026-11-04T00:00:00Z",
  method: "reviewed-publisher-screenshot",
};

describe("component preview manifest", () => {
  it("ships three distinct, catalog-matched, intact component screenshots", () => {
    const manifest = JSON.parse(readFileSync("public/data/component-previews.json", "utf8"));

    const catalog = JSON.parse(
      gunzipSync(readFileSync("public/data/registry-atlas.json.gz")).toString("utf8"),
    );

    const previews = parseComponentPreviewManifest(manifest, "/Registry-Atlas/");

    expect(previews.size).toBe(3);
    expect(
      new Set(manifest.previews.map((item: { namespace: string }) => item.namespace)).size,
    ).toBe(3);

    for (const item of manifest.previews) {
      const id = `${item.namespace}/${item.slug}`;
      expect(catalog.sourcePageManifest.pages[id]?.url).toBe(item.sourceUrl);
      const file = readFileSync(`public/${item.imagePath}`);
      expect(file.byteLength).toBeGreaterThan(8_000);
      expect(file.toString("ascii", 0, 4)).toBe("RIFF");
      expect(file.toString("ascii", 8, 12)).toBe("WEBP");
      expect(createHash("sha256").update(file).digest("hex")).toBe(item.sha256);
    }
  });
  it("loads only local verified component captures", () => {
    const previews = parseComponentPreviewManifest(
      { schemaVersion: 1, previews: [image] },
      "/Registry-Atlas/",
    );

    expect(previews.get(image.sourceUrl)).toEqual({
      src: "/Registry-Atlas/data/component-previews/reui-sheet-16.webp",
      hostname: "reui.io",
    });
  });

  it("rejects remote, unsafe, and duplicate screenshot paths", () => {
    const previews = parseComponentPreviewManifest(
      {
        schemaVersion: 1,
        previews: [
          { ...image, imagePath: "https://evil.example/screen.webp" },
          { ...image, imagePath: "../../secret.webp" },
          { ...image, imagePath: "data/component-previews/reui-sheet-16.webp" },
          { ...image, sourceUrl: "https://reui.io/blocks/another", slug: "another" },
        ],
      },
      "/Registry-Atlas/",
    );

    expect(previews.size).toBe(0);
  });

  it("fails closed when loading optional preview data fails", async () => {
    const previews = await loadComponentPreviews(async () => {
      throw new Error("offline");
    });

    expect(previews.size).toBe(0);
  });
});
