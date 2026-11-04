import { describe, expect, it } from "vitest";
import {
  verifiedRegistryHomepage,
  verifiedSourcePageUrl,
  sourcePageNavigation,
} from "../../src/registry-explorer/ui/sourcePageLink";

describe("original registry page link policy", () => {
  const home = "https://example.org/";

  it("keeps observed exact item anchors without registry-specific code", () => {
    expect(
      sourcePageNavigation(home, {
        sourcePage: {
          url: "https://example.org/primitives/aspect-ratio#documented-example",
          level: "observed",
          source: "documented-anchor",
          observedAt: "2026-11-04T00:00:00Z",
        },
      }),
    ).toEqual({
      url: "https://example.org/primitives/aspect-ratio#documented-example",
      label: "View documented example",
      level: "observed",
    });
  });

  it("distinguishes pattern-matched links from individually reviewed pages", () => {
    const navigation = sourcePageNavigation(home, {
      sourcePage: {
        url: "https://example.org/docs/button",
        level: "pattern",
        source: "verified-route-pattern",
        observedAt: new Date().toISOString(),
      },
    });

    expect(navigation).toMatchObject({
      url: "https://example.org/docs/button",
      level: "pattern",
      label: "View pattern-matched page",
    });
  });

  it("keeps exact observed nested documentation routes and query-based component pages", () => {
    expect(verifiedSourcePageUrl("https://example.org/docs/forms/button", home)).toBe(
      "https://example.org/docs/forms/button",
    );
    expect(verifiedSourcePageUrl("https://example.org/?component=button", home)).toBe(
      "https://example.org/?component=button",
    );
  });

  it.each([
    "https://example.org/",
    "https://example.org/r/button.json",
    "https://example.org/r/button.JSON/",
    "https://another.example.org/docs/button",
    "http://example.org/docs/button",
    "https://user:pass@example.org/docs/button",
    "https://example.org:8443/docs/button",
    "javascript:alert(1)",
    "//example.org/docs/button",
  ])("does not claim unsafe or generic documentation: %s", (url) => {
    expect(verifiedSourcePageUrl(url, home)).toBeNull();
  });

  it("rejects private, malformed, and non-HTTPS registries", () => {
    for (const url of [
      "http://example.org/",
      "http://localhost:5190",
      "https://127.0.0.1/",
      "https://internal.local/",
      "javascript:alert(1)",
      "https://example.org:8443/",
    ])
      expect(verifiedRegistryHomepage(url)).toBeNull();
  });

  it("keeps safe registry homepages separate from item source pages", () => {
    expect(verifiedRegistryHomepage(home)).toBe(home);
    expect(verifiedSourcePageUrl(home, home)).toBeNull();
  });
});
