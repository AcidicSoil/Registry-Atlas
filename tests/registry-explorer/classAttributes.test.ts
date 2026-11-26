import { describe, expect, it } from "vitest";
import { renderClassAttribute } from "../../src/registry-explorer/ui/renderSafety";

describe("utility class serializer", () => {
  it("escapes attribute injection", () => {
    const html = renderClassAttribute('grid" onclick="alert(1)');
    expect(html).toBe(' class="grid&quot; onclick=&quot;alert(1)"');
    expect(html).not.toMatch(/\sonclick="/);
  });

  it("omits empty attributes", () => {
    expect(renderClassAttribute("")).toBe("");
  });
});
