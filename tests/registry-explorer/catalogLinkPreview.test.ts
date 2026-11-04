import { describe, expect, it } from "vitest";
import {
  renderSourceLinkPreview,
  sourceLinkPreview,
} from "../../src/registry-explorer/ui/catalogLinkPreview";
import { parseSourceMediaManifest } from "../../src/registry-explorer/ui/sourceMedia";

const source = "https://components.example.org/blocks/alpha-card";

const asset = "https://images.example.org/alpha-card.webp";

const media = parseSourceMediaManifest({
  schemaVersion: 1,
  previews: {
    [source]: { mediaUrl: asset, method: "page-metadata", checkedAt: "2026-11-04T00:00:00Z" },
  },
});

describe("upstream source previews", () => {
  it("renders the exact observed component image without substituting site screenshots", () => {
    const preview = sourceLinkPreview(source, media);
    expect(preview).toEqual({ src: asset, hostname: "components.example.org" });

    if (!preview) return;
    const html = renderSourceLinkPreview(preview, "Alpha card");
    expect(html).toContain(asset);
    expect(html).toContain("data-preview-visual");
    expect(html).toContain("data-preview-attribution");
    expect(html).not.toContain("<iframe");
  });

  it("does not fabricate images for unmatched or unrelated pages", () => {
    expect(sourceLinkPreview("https://components.example.org/blocks/another", media)).toBeNull();
    expect(sourceLinkPreview("https://unknown.example.org/components/button", media)).toBeNull();
    expect(sourceLinkPreview("https://components.example.org/", media)).toBeNull();
  });

  it("retains verified direct image URLs", () => {
    expect(sourceLinkPreview("https://assets.example.org/button.svg")?.src).toBe(
      "https://assets.example.org/button.svg",
    );
  });

  it.each([
    "javascript:alert(1)",
    "http://example.com/components/button",
    "https://localhost/secret",
    "https://127.0.0.1/private",
    "https://[::1]/private.svg",
    "//evil.example.com",
  ])("rejects non-public or unsafe links: %s", (url) => {
    expect(sourceLinkPreview(url, media)).toBeNull();
  });

  it("escapes untrusted labels", () => {
    const preview = sourceLinkPreview(source, media);

    if (!preview) return;
    const html = renderSourceLinkPreview(preview, "<script>alert(1)</script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).not.toContain("<script>");
  });
});
