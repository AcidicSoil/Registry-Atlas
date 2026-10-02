import { describe, expect, it } from "vitest";
import { readVisualPreviewManifest } from "../../src/registry-explorer/data/loadRegistries";
import type { RegistryCatalogIndex } from "../../src/registry-explorer/core/registry.schema";

const index: RegistryCatalogIndex = {
  meta: { generated_at: "", registry_count: 2, item_count: 2 },
  registries: { "@alpha": [{ name: "button", type: "registry:ui" }],
    "@svgl": [{ name: "mastra", type: "registry:component" }] },
};
describe("verified visual catalog overlay", () => {
  it("loads only precisely matching official visuals", () => {
    const mapped = readVisualPreviewManifest({ schemaVersion: 1, previews: {
      "@alpha/button": { imageUrl: "/Registry-Atlas/data/previews/alpha/button.jpg",
        officialPage: "https://alpha.example/button" },
      "@alpha/no-such-slug": { imageUrl: "https://alpha.example/no.png",
        officialPage: "https://alpha.example/" },
      "@svgl/mastra": { imageUrl: "https://svgl.app/library/mastra-icon-light.svg",
        officialPage: "https://svgl.app/" },
    } }, index);
    expect(mapped).toEqual({
      "@alpha/button": "/Registry-Atlas/data/previews/alpha/button.jpg",
      "@svgl/mastra": "https://svgl.app/library/mastra-icon-light.svg",
    });
  });
  it("rejects raw endpoints, scripts, ambiguous image paths and malformed manifests", () => {
    const invalid = {
      "@alpha/button": { imageUrl: "https://alpha.example/r/button.json", officialPage: "https://alpha.example/" },
      "@svgl/mastra": { imageUrl: "javascript:alert(1)", officialPage: "https://svgl.app/" },
    };
    expect(readVisualPreviewManifest({ schemaVersion: 1, previews: invalid }, index)).toEqual({});
    expect(readVisualPreviewManifest({ schemaVersion: 2, previews: invalid }, index)).toEqual({});
    expect(readVisualPreviewManifest(null, index)).toEqual({});
  });
});
