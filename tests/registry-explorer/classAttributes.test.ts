import { describe, expect, it } from "vitest";
import { renderClassAttribute } from "../../src/registry-explorer/ui/renderSafety";
import { cn } from "../../src/registry-explorer/ui/primitives/cn";

describe("utility class serializer", () => {
  it("escapes attribute injection", () => {
    const html = renderClassAttribute('grid" onclick="alert(1)');
    expect(html).toBe(' class="grid&quot; onclick=&quot;alert(1)"');
    expect(html).not.toMatch(/\sonclick="/);
  });

  it("omits empty attributes", () => {
    expect(renderClassAttribute("")).toBe("");
  });

  it("merges conflicting variant utilities without losing unrelated states", () => {
    expect(
      cn(
        "flex min-h-[150px] rounded-[var(--atlas-radius-card)] hover:border-atlas-input",
        "grid min-h-24 rounded-none",
      ),
    ).toBe("hover:border-atlas-input grid min-h-24 rounded-none");
  });
});
