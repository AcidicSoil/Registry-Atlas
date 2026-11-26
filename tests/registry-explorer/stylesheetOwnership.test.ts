import { readdirSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const root = new URL("../../", import.meta.url);

describe("stylesheet ownership", () => {
  it("permits exactly the two design-system stylesheets in application source", () => {
    const styles = ["src", "public"].flatMap((directory) =>
      readdirSync(new URL(directory + "/", root), { recursive: true, encoding: "utf8" })
        .filter((name) => name.endsWith(".css"))
        .map((name) => directory + "/" + name),
    );

    expect(styles.sort()).toEqual(["src/styles/globals.css", "src/styles/tokens.css"]);
  });

  it("initializes Tailwind once and imports centralized tokens", () => {
    const html = readFileSync(new URL("index.html", root), "utf8");
    const globals = readFileSync(new URL("src/styles/globals.css", root), "utf8");

    expect(html.match(/<link[^>]*rel="stylesheet"[^>]*>/g)).toEqual([
      '<link rel="stylesheet" href="/src/styles/globals.css" />',
    ]);
    expect(globals).toContain('@import "tailwindcss";');
    expect(globals).toContain('@import "./tokens.css";');
  });

  it("does not let component selectors accumulate in global foundations", () => {
    const globals = readFileSync(new URL("src/styles/globals.css", root), "utf8");

    expect(globals).not.toMatch(/\.[a-z][\w-]*\s*[{,:]/);
  });
});
