import antiSlopCss from "./tools/stylelint/anti-slop-css/index.mjs";

export default {
  extends: ["stylelint-config-standard"],
  plugins: antiSlopCss,
  ignoreFiles: ["dist/**", "node_modules/**"],
  rules: {
    "anti-slop-css/max-stylesheet-size": 1700,
    "anti-slop-css/require-style-ownership": [
      {
        sourceRoots: ["public/styles", "src"],
        ownerDirectories: ["ui", "components"],
        scopedSuffixes: [".css"],
        allowedGlobalDirectories: [],
        allowedGlobalFiles: ["src/styles/globals.css", "src/styles/tokens.css"],
      },
    ],
    "anti-slop-css/no-cross-feature-styling": [{ featureRoot: "src/registry-explorer" }],
  },
  overrides: [
    { files: ["src/styles/globals.css"], rules: { "import-notation": "string" } },
    {
      files: ["src/styles/tokens.css"],
      rules: {
        "color-hex-length": "long",
        "custom-property-pattern": "^[a-z0-9]+(?:-[a-z0-9]+)*(?:--line-height)?$",
        "at-rule-no-unknown": [true, { ignoreAtRules: ["theme"] }],
      },
    },
    {
      files: ["src/**/*.css"],
      rules: { "anti-slop-css/max-stylesheet-size": 400 },
    },
  ],
};
