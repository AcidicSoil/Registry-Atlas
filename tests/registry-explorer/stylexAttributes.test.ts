import { describe, expect, it } from "vitest";
import { renderStyleXAttributes } from "../../src/registry-explorer/ui/renderSafety";

describe("StyleX DOM attribute serializer", () => {
  it("escapes class, dynamic style, and provenance attributes", () => {
    const html = renderStyleXAttributes({
      class: 'x123" onclick="alert(1)',
      style: 'color:red;" onmouseover="alert(2)',
      "data-style-src": '" data-unsafe="yes',
    });

    expect(html).toContain('class="x123&quot; onclick=&quot;alert(1)"');
    expect(html).toContain('style="color:red;&quot; onmouseover=&quot;alert(2)"');
    expect(html).toContain('data-style-src="&quot; data-unsafe=&quot;yes"');
    expect(html).not.toMatch(/\sonclick="/);
    expect(html).not.toMatch(/\sonmouseover="/);
    expect(html).not.toMatch(/\sdata-unsafe="/);
  });

  it("omits absent attributes", () => {
    expect(renderStyleXAttributes({})).toBe("");
  });
});
