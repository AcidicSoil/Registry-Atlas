import { readFileSync, existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(new URL("../../" + path, import.meta.url), "utf8");

describe("Resend design foundations", () => {
  it("records the selected public design system and semantic tokens", () => {
    expect(read("DESIGN.md")).toContain("0d914ef0-fa84-4c60-a9aa-cef0b5eb6e5d");
    const css = read("src/styles/tokens.css");

    expect(css).toContain("--color-void-black: #000000");
    expect(css).toContain("--color-graphite-hairline: #292d30");
    expect(css).toContain("--color-iris-violet: #9281f7");
    expect(css).toContain("--atlas-background: var(--color-void-black)");
    expect(read("src/styles/globals.css")).toContain('@import "./tokens.css"');
  });

  it("owns the filter controls through component utilities", () => {
    expect(
      existsSync(
        new URL("../../src/registry-explorer/ui/component-type-filter.css", import.meta.url),
      ),
    ).toBe(false);
    expect(
      existsSync(
        new URL("../../src/registry-explorer/ui/componentTypeFilter.stylex.ts", import.meta.url),
      ),
    ).toBe(false);
    expect(read("src/registry-explorer/ui/componentTypeFilter.ts")).toContain("ui-combobox");
    expect(read("src/registry-explorer/ui/primitives/filterControlClasses.ts")).toContain(
      "bg-atlas-card",
    );
    expect(read("index.html")).toContain('href="/src/styles/globals.css"');
  });
  it("connects typography, surface roles, and native theme to the design", () => {
    const tokens = read("src/styles/tokens.css");
    const globals = read("src/styles/globals.css");

    for (const role of [
      "caption",
      "body-sm",
      "body",
      "subheading",
      "heading-sm",
      "heading",
      "heading-lg",
      "display",
    ]) {
      expect(tokens).toContain(`--text-${role}:`);
    }

    expect(globals).toContain("color-scheme: dark");
    expect(globals).toContain("@layer ui-sdk;");
    expect(globals).toContain("@fontsource-variable/inter");
    expect(globals).toContain("@fontsource/commit-mono");
    expect(tokens).not.toContain("--atlas-card: var(--color-void-black)");
    expect(tokens).not.toContain("--atlas-popover: var(--color-void-black)");
    expect(read("src/registry-explorer/ui/primitives/actionClasses.ts")).not.toContain(
      "bg-atlas-primary",
    );
  });
});
