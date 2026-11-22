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
