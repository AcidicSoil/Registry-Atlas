import { describe, expect, it } from 'vitest';

import { buildCycloneDxSbom, parsePackageKey } from '../../scripts/generate-sbom.mjs';

describe('release supply-chain bill of materials', () => {
  it('decodes scoped and unscoped pnpm dependency identities', () => {
    expect(parsePackageKey('@types/node@26.6.4')).toEqual({ name: '@types/node', version: '26.6.4' });
    expect(parsePackageKey('vite@7.3.7')).toEqual({ name: 'vite', version: '7.3.7' });
  });

  it('includes pinned dependency versions and normalized integrity hashes', () => {
    const result = buildCycloneDxSbom({
      packages: {
        'vite@7.3.7': { resolution: { integrity: 'sha512-AAAAAAAAAAAAAAAAAAAAAA==' } },
      },
    }, { name: 'registry-atlas', version: '1.0.0' });

    expect(result.bomFormat).toBe('CycloneDX');
    expect(result.specVersion).toBe('1.6');
    expect(result.components).toContainEqual(expect.objectContaining({
      name: 'vite',
      version: '7.3.7',
      purl: 'pkg:npm/vite@7.3.7',
      hashes: [expect.objectContaining({ alg: 'SHA-512' })],
    }));
  });
});
