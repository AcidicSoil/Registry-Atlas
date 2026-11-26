import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

const entry = readFileSync(
  new URL("../../src/registry-explorer/entry.ts", import.meta.url),
  "utf8",
);

describe("native mobile navigation dialog", () => {
  it("uses a real modal element, not an aside claiming aria-modal", () => {
    expect(html).toMatch(/<dialog\s+id="mobileSidebarDialog"/);
    expect(entry).toContain("showModal()");
    expect(entry).toContain(".close()");
    expect(entry).not.toMatch(/setAttribute\(\s*["']aria-modal/);
    expect(entry).not.toMatch(/event\.key\s*===\s*["']Tab["']/);
    expect(html).toContain("backdrop:bg-black/64");
  });

  it("uses native backdrop dismissal with a feature-detected fallback", () => {
    expect(html).toMatch(/<dialog\s[^>]*\bclosedby="any"/);
    expect(entry).toContain('"closedBy" in HTMLDialogElement.prototype');
    expect(entry).not.toContain('mobileDialog.addEventListener("click"');
    expect(html).toContain("backdrop:overscroll-contain");
  });
});
