import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const read = (file: string) => readFileSync(new URL('../../' + file, import.meta.url), 'utf8');

describe('quality-tooling integration contract', () => {
  it('runs all mandatory quality gates during normal verification', () => {
    const pkg = JSON.parse(read('package.json'));
    expect(pkg.devDependencies['dependency-cruiser']).toBe('18.6.0');
    expect(pkg.devDependencies['react-doctor']).toBe('0.9.18');
    expect(pkg.scripts['lint:deps']).toBe('depcruise src tests --config .dependency-cruiser.cjs');
    expect(pkg.scripts['lint:react-doctor']).toContain('--blocking warning --no-telemetry');
    expect(pkg.scripts['lint:complexity']).toBe('cccc src/registry-explorer');
    expect(pkg.scripts['lint:anti-slop']).toBe('oxlint .');
    expect(pkg.scripts['test:anti-slop-gate']).toBe('node scripts/verify-anti-slop-gate.mjs');
    expect(pkg.devDependencies.oxlint).toBe('1.87.0');
    expect(pkg.devDependencies['@oxlint/plugins']).toBe('1.87.0');
    expect(pkg.scripts['test:complexity-gate']).toBe('node scripts/verify-complexity-gate.mjs');

    for (const gate of ['pnpm lint:anti-slop', 'pnpm lint:deps', 'pnpm lint:react-doctor', 'pnpm lint:complexity']) {
      expect(pkg.scripts.verify).toContain(gate);
    }
  });

  it('pins cccc to a prebuilt version and retains strict limits', () => {
    const mise = read('mise.toml');
    expect(mise).toContain('"github:moznion/cccc" = "1.8.0"');
    const config = read('cccc.toml');
    expect(config).toContain('max-cognitive = 15');
    expect(config).toContain('max-cyclomatic = 10');
  });

  it('enforces recorded architecture boundaries', () => {
    const config = read('.dependency-cruiser.cjs');
    expect(config).toContain('no-circular');
    expect(config).toContain('no-core-to-adapters');
    expect(config).toContain('no-data-to-ui');
    expect(config).toContain('no-production-to-tests');
    expect(config).toContain('entrypoint-boundary-from-app');
    expect(config).toContain('entrypoint-boundary-across-packages');
    expect(config).toContain('tests-through-entrypoints');
    expect(config).toContain('tests-folder-is-private');
  });
});
