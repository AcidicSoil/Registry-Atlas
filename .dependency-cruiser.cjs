// TypeScript deep-module public surfaces and existing Registry Atlas layering.
// Each core/data/ui directory is a module. Root files are public entry points;
// files in lib/, internal/, tests/, or any other subdirectory are private.
const PACKAGES_ROOT = 'src/registry-explorer';
const MODULES = '(core|data|ui)';
const INTERNALS = `^${PACKAGES_ROOT}/${MODULES}/[^/]+/`;
const PUBLIC_MODULES = `^${PACKAGES_ROOT}/${MODULES}/`;

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: 'entrypoint-boundary-from-app',
      comment: 'Application code and external tests must enter modules through root files.',
      severity: 'error',
      from: { pathNot: PUBLIC_MODULES },
      to: { path: INTERNALS },
    },
    {
      name: 'entrypoint-boundary-across-packages',
      comment: 'Within-module imports are unrestricted; cross-module imports use root files.',
      severity: 'error',
      from: { path: `^${PACKAGES_ROOT}/${MODULES}/` },
      to: { path: INTERNALS, pathNot: `^${PACKAGES_ROOT}/$1/` },
    },
    {
      name: 'tests-through-entrypoints',
      comment: 'Standalone and colocated tests exercise module entry points, not internals.',
      severity: 'error',
      from: { path: `^tests/|^${PACKAGES_ROOT}/[^/]+/tests/` },
      to: { path: INTERNALS, pathNot: `^${PACKAGES_ROOT}/[^/]+/tests/` },
    },
    {
      name: 'tests-folder-is-private',
      comment: 'Production code must not import test fixtures.',
      severity: 'error',
      from: { pathNot: '(^|/)tests/' },
      to: { path: '(^|/)tests/' },
    },
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    {
      name: 'no-core-to-adapters', severity: 'error',
      from: { path: `^${PACKAGES_ROOT}/core/` },
      to: { path: `^${PACKAGES_ROOT}/(data|ui)/` },
    },
    {
      name: 'no-data-to-ui', severity: 'error',
      from: { path: `^${PACKAGES_ROOT}/data/` },
      to: { path: `^${PACKAGES_ROOT}/ui/` },
    },
    {
      name: 'no-production-to-tests', severity: 'error',
      from: { path: '^src/' },
      to: { path: '(^|/)(tests|__tests__)/|\.(test|spec)\.' },
    },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: '^node_modules/' },
    exclude: { path: '(^|/)(node_modules|dist)/' },
    enhancedResolveOptions: { extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'] },
  },
};
