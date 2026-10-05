import {describe,expect,it} from 'vitest';
// @ts-expect-error Node builtin types are unavailable in the browser-only test config.
import {readFileSync} from 'node:fs';
// @ts-expect-error Node ESM scripts are tested through Vitest in Node.
import {buildSourcePageIndex} from '../../scripts/build-source-page-index.mjs';

const load = (file: string) => JSON.parse(readFileSync(file,'utf8'));

describe('committed source-page artifact',()=>{
  it('is reproducible from the current source evidence without guessed URLs',()=>{
    const patternLinks=load('data/shadcn/verified-registry-pattern-links.json');
    const latest=patternLinks.links.reduce((max: number,row: {checkedAt:string})=>
      Math.max(max,Date.parse(row.checkedAt) || 0),Date.parse(patternLinks.sourceSnapshotAt));
    const generated=buildSourcePageIndex({
      raw:load('data/shadcn/registries.raw.json'),
      catalog:load('public/data/registry-catalog-items.json'),
      curated:load('data/shadcn/registry-items.json'),
      previews:load('public/data/component-previews.json'),
      demos:load('src/registry-explorer/data/component-demo-manifest.json'),
      traversal:null,patternLinks,
      now:new Date(latest+24*60*60*1000).toISOString(),
    });
    const published=load('public/data/component-page-links.json');
    expect(published).toEqual(generated);
    expect(generated.coverage.published).toBe(
      generated.coverage.reviewed+generated.coverage.sitemap+generated.coverage.pattern);
    expect(generated.coverage.distinctIndexed).toBe(
      generated.coverage.published+generated.coverage.missing);
    expect(published.pages['@8bitcn/input-otp']).toMatchObject({
      url:'https://www.8bitcn.com/docs/components/input-otp',
      level:'reviewed',
    });
  });
});
