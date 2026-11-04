import { describe, expect, it } from "vitest";
// @ts-ignore Standalone ESM CLI exposes offline collector for isolated tests.
import { collectSourceMedia } from "../../scripts/collect-source-media.mjs";
// @ts-ignore ESM collector publishes pure validation utilities.
import { extractItemImageCandidate, validMediaResponse } from "../../scripts/lib/source-media.mjs";

describe("generic upstream media extraction", () => {
  it("reads original page Open Graph metadata regardless of attribute order", () => {
    expect(
      extractItemImageCandidate(
        "https://elements.example.org/items/focus-ring",
        '<meta content="https://cdn.example.org/focus-ring.webp?size=large&amp;v=1" property="og:image">',
      ),
    ).toBe("https://cdn.example.org/focus-ring.webp?size=large&v=1");
  });
  it("rejects shared marketing banners, unrelated slugs, and private targets", () => {
    const page = "https://elements.example.org/items/focus-ring";
    expect(
      extractItemImageCandidate(
        page,
        '<meta property="og:image" content="https://cdn.example.org/banner.webp">',
      ),
    ).toBeNull();
    expect(
      extractItemImageCandidate(
        page,
        '<meta property="og:image" content="https://localhost/focus-ring.webp">',
      ),
    ).toBeNull();
    expect(
      extractItemImageCandidate(
        page,
        '<meta property="og:image" content="http://cdn.example.org/focus-ring.webp">',
      ),
    ).toBeNull();
  });
  it("verifies a complete media response without network dependencies", async () => {
    const page = "https://widgets.example.org/blocks/bento-light";
    const image = "https://cdn.example.org/bento-light.webp";
    const calls: string[] = [];

    const fetchImpl = async (url: string, options: { method?: string }) => {
      calls.push(options.method ?? "GET");

      if (url === page)
        return new Response('<meta property="og:image" content="' + image + '">', {
          headers: { "content-type": "text/html" },
        });

      return new Response(null, {
        status: 200,
        headers: { "content-type": "image/webp", "content-length": "200" },
      });
    };

    const result = await collectSourceMedia(page, fetchImpl);
    expect(result).toMatchObject({ mediaUrl: image, method: "page-metadata" });
    expect(calls).toEqual(["GET", "HEAD"]);
  });

  it("bounds image downloads when upstream omits content-length", async () => {
    const page = "https://widgets.example.org/blocks/bento-light";
    const image = "https://cdn.example.org/bento-light.webp";

    const fetchImpl = async (url: string, options: { method?: string }) => {
      if (url === page)
        return new Response('<meta name="twitter:image" content="' + image + '">', {
          headers: { "content-type": "text/html" },
        });

      if (options.method === "HEAD")
        return new Response(null, {
          status: 200,
          headers: { "content-type": "image/webp" },
        });

      return new Response(new Uint8Array([1, 2, 3]), {
        status: 200,
        headers: { "content-type": "image/webp" },
      });
    };

    expect(await collectSourceMedia(page, fetchImpl)).toMatchObject({ mediaUrl: image });
  });

  it("requires image MIME and bounded asset size", () => {
    expect(
      validMediaResponse({
        ok: true,
        headers: { get: (key: string) => (key === "content-type" ? "image/webp" : "1024") },
      }),
    ).toBe(true);
    expect(
      validMediaResponse({
        ok: true,
        headers: { get: (key: string) => (key === "content-type" ? "text/html" : "1024") },
      }),
    ).toBe(false);
    expect(
      validMediaResponse({
        ok: true,
        headers: { get: (key: string) => (key === "content-type" ? "image/webp" : "999999999") },
      }),
    ).toBe(false);
  });
});
