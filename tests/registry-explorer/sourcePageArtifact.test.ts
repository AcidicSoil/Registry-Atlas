import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

describe('PostgreSQL source-page projection', () => {
  it('publishes verified exact source page identities from the generated static data', () => {
    const data = JSON.parse(gunzipSync(readFileSync('public/data/registry-atlas.json.gz')).toString('utf8'));
    const manifest = data.sourcePageManifest;
    expect(manifest.schema).toBe('registry-atlas-source-page-index/v1');
    expect(Object.keys(manifest.pages).length).toBeGreaterThan(1000);
    const coverage = manifest.coverage;
    expect(coverage.published).toBe(coverage.reviewed + coverage.sitemap + coverage.pattern);
    expect(coverage.distinctIndexed).toBe(coverage.published + coverage.missing);
    expect(manifest.pages['@8bitcn/input-otp']).toMatchObject({
      url: 'https://www.8bitcn.com/docs/components/input-otp',
      level: 'reviewed',
    });
    for (const page of Object.values(manifest.pages) as Array<{url:string;level:string}>) {
      expect(page.url).toMatch(/^https:\/\//);
      expect(page.level).toMatch(/^(reviewed|sitemap|pattern)$/);
    }
  });
});
