import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { gunzipSync } from "node:zlib";

describe("PostgreSQL source-page projection", () => {
  // SAFETY: The test constructs or loads the expected fixture shape here and verifies the observed result against that fixture.
  it("publishes verified exact source page identities from the generated static data", () => {
    const data = JSON.parse(
      gunzipSync(readFileSync("public/data/registry-atlas.json.gz")).toString("utf8"),
    );

    const manifest = data.sourcePageManifest;
    expect(manifest.schema).toBe("registry-atlas-source-page-index/v1");
    expect(Object.keys(manifest.pages).length).toBeGreaterThan(1000);
    const coverage = manifest.coverage;
    expect(coverage.published).toBe(
      coverage.reviewed + coverage.sitemap + coverage.pattern + coverage.observed,
    );
    expect(coverage.distinctIndexed).toBe(coverage.published + coverage.missing);
    expect(coverage.observed).toBe(7);
    expect(manifest.pages["@spaceui/demo-p-aspect-ratio-03"]).toMatchObject({
      level: "observed",
      source: "documented-anchor",
      url: "https://www.spaceui.one/primitives/aspect-ratio#example-11-square-aspect-ratio",
    });
    expect(manifest.pages["@8bitcn/input-otp"]).toMatchObject({
      url: "https://www.8bitcn.com/docs/components/input-otp",
      level: "reviewed",
    });

    for (const page of Object.values(manifest.pages) as Array<{ url: string; level: string }>) {
      expect(page.url).toMatch(/^https:\/\//);
      expect(page.level).toMatch(/^(reviewed|sitemap|pattern|observed)$/);
    }
  });
});
