import { describe, expect, it } from "vitest";
import {
  renderSourceLinkPreview,
  sourceLinkPreview,
} from "../../src/registry-explorer/ui/catalogLinkPreview";
import { parseComponentPreviewManifest } from "../../src/registry-explorer/ui/componentPreviews";

const source = "https://reui.io/blocks/application/sheet/sheet-16";

const previews = parseComponentPreviewManifest(
  {
    schemaVersion: 1,
    previews: [
      {
        namespace: "@reui",
        slug: "sheet-16",
        sourceUrl: source,
        captureSourceUrl: "https://reui.io/thumbnails/blocks/sheet-16-light.webp",
        imagePath: "data/component-previews/reui-sheet-16.webp",
        sha256: "a".repeat(64),
        verifiedAt: "2026-11-04T00:00:00Z",
        method: "reviewed-publisher-screenshot",
      },
    ],
  },
  "/Registry-Atlas/",
);

describe("component hover previews", () => {
  it("renders a reviewed local component specimen", () => {
    const preview = sourceLinkPreview(source, previews);
    expect(preview).toEqual({
      src: "/Registry-Atlas/data/component-previews/reui-sheet-16.webp",
      hostname: "reui.io",
    });

    if (!preview) return;
    const html = renderSourceLinkPreview(preview, "Sheet 16");
    expect(html).toContain("/Registry-Atlas/data/component-previews/reui-sheet-16.webp");
    expect(html).toContain('alt="Sheet 16 preview"');
    expect(html).not.toContain("<iframe");
  });

  it("does not show icons or unspecified remote imagery", () => {
    expect(sourceLinkPreview("https://assets.example.org/button.svg", previews)).toBeNull();
    expect(sourceLinkPreview("https://reui.io/components/button/c-button-22", previews)).toBeNull();
    expect(sourceLinkPreview("https://reui.io/", previews)).toBeNull();
  });

  it("rejects unsafe source URLs", () => {
    for (const url of [
      "javascript:alert(1)",
      "http://example.com",
      "https://localhost/",
      "//evil.example.com",
    ])
      expect(sourceLinkPreview(url, previews)).toBeNull();
  });

  it("escapes untrusted preview titles", () => {
    const preview = sourceLinkPreview(source, previews);

    if (!preview) return;
    const html = renderSourceLinkPreview(preview, "<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
