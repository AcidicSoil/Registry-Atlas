import { describe, expect, it } from "vitest";
import { Linter } from "eslint";
import stylexPlugin from "../../tools/eslint/anti-slop-stylex/index.mjs";

const config = [
  {
    files: ["**/*.stylex.ts"],
    plugins: { "anti-slop-stylex": stylexPlugin },
    rules: {
      "anti-slop-stylex/prefer-design-tokens": [
        "error",
        { tokenModules: ["./tokens.stylex"], cssVariablePrefix: "--atlas-" },
      ],
    },
  },
];

const lint = (expression) => {
  const code = `
import * as stylex from "@stylexjs/stylex";
import { tokens } from "./tokens.stylex";
export const styles = stylex.create({ card: { color: ${expression} } });
`;

  return new Linter().verify(code, config, {
    filename: "src/registry-explorer/ui/check.stylex.ts",
  });
};

describe("generated StyleX token lint", () => {
  it("accepts imported canonical tokens with literal bracket names", () => {
    expect(lint('tokens["--primary"]')).toEqual([]);
  });

  it("rejects raw colors and dynamically computed token keys", () => {
    expect(
      lint('"#00ff00"').some(
        (diagnostic) => diagnostic.ruleId === "anti-slop-stylex/prefer-design-tokens",
      ),
    ).toBe(true);
    expect(
      lint("tokens[unsafeKey]").some(
        (diagnostic) => diagnostic.ruleId === "anti-slop-stylex/prefer-design-tokens",
      ),
    ).toBe(true);
  });
});
