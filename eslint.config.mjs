import stylexPlugin from "@stylexjs/eslint-plugin";
import antiSlopStyleX from "./tools/eslint/anti-slop-stylex/index.mjs";

// StyleX's official compiler and lint rules own authored component styles.
// Oxlint remains responsible for general application TypeScript.
export default [
  {
    files: ["src/**/*.stylex.{js,ts,jsx,tsx}"],
    plugins: {
      "@stylexjs": stylexPlugin,
      "anti-slop-stylex": antiSlopStyleX,
    },
    rules: {
      "@stylexjs/valid-styles": "error",
      "@stylexjs/valid-shorthands": "error",
      "@stylexjs/no-unused": "error",
      "@stylexjs/no-nonstandard-styles": "error",
      "anti-slop-stylex/prefer-design-tokens": [
        "error",
        { tokenModules: ["./tokens.stylex"], cssVariablePrefix: "--atlas-" },
      ],
    },
  },
];
