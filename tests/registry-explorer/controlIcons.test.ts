import { describe, expect, it } from "vitest";
import { renderBrowseFacetPopover } from "../../src/registry-explorer/ui/browseFacetPopover";

describe("control icons", () => {
  it("renders an accessible, size-stable dropdown indicator instead of text", () => {
    const markup = renderBrowseFacetPopover("Sort", "<button>Choice</button>", "Name A–Z");

    expect(markup).toContain('data-ui-icon="chevron-down"');
    expect(markup).toContain('viewBox="0 0 24 24"');
    expect(markup).toContain('aria-hidden="true"');
    expect(markup).not.toContain("⌄");
  });
});
