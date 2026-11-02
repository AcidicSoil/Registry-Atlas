import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const html = readFileSync(new URL("../../index.html", import.meta.url), "utf8");

const entry = readFileSync(
  new URL("../../src/registry-explorer/entry.ts", import.meta.url),
  "utf8",
);

const css = readFileSync(
  new URL("../../src/registry-explorer/ui/mobile-sidebar-dialog.css", import.meta.url),
  "utf8",
);

describe("native mobile navigation dialog", () => {
  it("uses a real modal element, not an aside claiming aria-modal", () => {
    expect(html).toMatch(/<dialog\s+id="mobileSidebarDialog"/);
    expect(entry).toContain("showModal()");
    expect(entry).toContain(".close()");
    expect(entry).not.toMatch(/setAttribute\(\s*["']aria-modal/);
    expect(entry).not.toMatch(/event\.key\s*===\s*["']Tab["']/);
    expect(css).toContain(".mobile-sidebar-dialog::backdrop");
  });
});
