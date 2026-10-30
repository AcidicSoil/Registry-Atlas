import antiSlopCss from './tools/stylelint/anti-slop-css/index.mjs';

export default {
  extends: ['stylelint-config-standard'],
  plugins: antiSlopCss,
  ignoreFiles: ['dist/**', 'node_modules/**'],
  rules: {
    'anti-slop-css/max-stylesheet-size': 4545,
    'anti-slop-css/require-style-ownership': [{
      sourceRoots: ['public/styles', 'src'],
      ownerDirectories: ['ui', 'components'],
      scopedSuffixes: ['.css'],
      allowedGlobalDirectories: [],
      allowedGlobalFiles: ['public/styles/registry-explorer.css'],
    }],
    'anti-slop-css/no-cross-feature-styling': [{ featureRoot: 'src/registry-explorer' }],
  },
  overrides: [{
    files: ['src/**/*.css'],
    rules: { 'anti-slop-css/max-stylesheet-size': 400 },
  }],
};
