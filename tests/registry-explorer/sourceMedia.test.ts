import { describe, expect, it } from "vitest";
import {
  loadSourceMedia,
  parseSourceMediaManifest,
} from "../../src/registry-explorer/ui/sourceMedia";
import { sourceLinkPreview } from "../../src/registry-explorer/ui/catalogLinkPreview";

describe("provider-neutral source media", () => {
  const evidence = {
    schemaVersion: 1,
    previews: {
      "https://elements.example.org/library/alpha-card": {
        mediaUrl: "https://images.example.org/components/alpha-card.webp",
        method: "page-metadata",
        checkedAt: "2026-11-04T00:00:00.000Z",
      },
      "https://elements.example.org/library/beta-card": {
        mediaUrl: "http://localhost/beta-card.webp",
        method: "page-metadata",
        checkedAt: "2026-11-04T00:00:00.000Z",
      },
    },
  };

  it("resolves verified imagery without a provider allowlist", () => {
    const previews = parseSourceMediaManifest(evidence);
    expect(sourceLinkPreview("https://elements.example.org/library/alpha-card", previews)).toEqual({
      src: "https://images.example.org/components/alpha-card.webp",
      hostname: "elements.example.org",
    });
    expect(
      sourceLinkPreview("https://elements.example.org/library/beta-card", previews),
    ).toBeNull();
    expect(sourceLinkPreview("https://elements.example.org/library/unknown", previews)).toBeNull();
  });

  it("rejects invalid evidence envelopes and duplicate media", () => {
    expect(() => parseSourceMediaManifest({ schemaVersion: 2, previews: {} })).toThrow();
    expect(() => parseSourceMediaManifest(null)).toThrow();
    expect(
      parseSourceMediaManifest({
        schemaVersion: 1,
        previews: {
          "https://one.example/first": {
            mediaUrl: "https://assets.example/first.webp",
            method: "page-metadata",
            checkedAt: "2026-11-04",
          },
          "https://two.example/second": {
            mediaUrl: "https://assets.example/first.webp",
            method: "page-metadata",
            checkedAt: "2026-11-04",
          },
        },
      }).size,
    ).toBe(0);
  });

  it("degrades to no previews when optional manifest fetch fails", async () => {
    const fail = async () => new Response("unavailable", { status: 404 });
    expect((await loadSourceMedia(fail)).size).toBe(0);
  });

  it("keeps direct image links independent of provider data", () => {
    expect(sourceLinkPreview("https://assets.example.org/icon.svg")?.src).toBe(
      "https://assets.example.org/icon.svg",
    );
  });
});
