// Enforce the established Registry Atlas core -> data -> UI dependency direction.
module.exports = {
  forbidden: [
    { name: 'no-circular', severity: 'error', from: {}, to: { circular: true } },
    { name: 'no-core-to-adapters', severity: 'error',
      from: { path: '^src/registry-explorer/core/' },
      to: { path: '^src/registry-explorer/(data|ui)/' } },
    { name: 'no-data-to-ui', severity: 'error',
      from: { path: '^src/registry-explorer/data/' },
      to: { path: '^src/registry-explorer/ui/' } },
    { name: 'no-production-to-tests', severity: 'error',
      from: { path: '^src/' },
      to: { path: '(^|/)(tests|__tests__)/|\\.(test|spec)\\.' } },
  ],
  options: {
    tsConfig: { fileName: 'tsconfig.json' },
    doNotFollow: { path: '^node_modules/' },
    exclude: { path: '(^|/)(node_modules|dist)/' },
  },
};
