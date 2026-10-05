import {describe,expect,it} from 'vitest';
import { readSourcePageManifest } from '../../src/registry-explorer/data/loadRegistries';
import type {RegistryCatalogIndex} from '../../src/registry-explorer/core/registry.schema';

const index={meta:{registry_count:2,item_count:3},registries:{
  '@alpha':[{name:'forms/button',type:'registry:ui'},{name:'button',type:'registry:ui'}],
  '@beta':[{name:'button',type:'registry:ui'}],
}} satisfies RegistryCatalogIndex;
const observedAt = new Date().toISOString();
const registries=[
  {name:'@alpha',url:'https://alpha.example/'},
  {name:'@beta',url:'https://beta.example/'},
];
describe('optional original source-page manifest',()=>{
  it('accepts separate exact identities and distinguishes sitemap from reviewed evidence',()=>{
    const pages=readSourcePageManifest({schema:'registry-atlas-source-page-index/v1',pages:{
      '@alpha/forms/button':{url:'https://alpha.example/docs/forms/button',level:'sitemap',source:'official-sitemap',observedAt},
      '@alpha/button':{url:'https://alpha.example/docs/button',level:'reviewed',source:'visual-reference'},
      '@beta/button':{url:'https://beta.example/docs/button',level:'sitemap',source:'official-sitemap',observedAt},
    }},index,registries);
    expect(pages['@alpha/forms/button']).toMatchObject({level:'sitemap'});
    expect(pages['@alpha/button']).toMatchObject({level:'reviewed'});
    expect(pages['@beta/button'].url).toBe('https://beta.example/docs/button');
  });
  it('expires sitemap entries without discarding enduring reviewed evidence',()=>{
    const pages=readSourcePageManifest({schema:'registry-atlas-source-page-index/v1',pages:{
      '@alpha/forms/button':{url:'https://alpha.example/docs/forms/button',level:'sitemap',
        source:'official-sitemap',observedAt:'2020-01-01T00:00:00Z'},
      '@alpha/button':{url:'https://alpha.example/docs/button',level:'reviewed',source:'reviewed-summary'},
    }},index,registries);
    expect(pages['@alpha/forms/button']).toBeUndefined();
    expect(pages['@alpha/button']?.level).toBe('reviewed');
  });
  it('fails closed on unknown, foreign, raw JSON, private host and invalid tiers',()=>{
    const pages=readSourcePageManifest({schema:'registry-atlas-source-page-index/v1',pages:{
      '@alpha/forms/button':{url:'https://beta.example/docs/forms/button',level:'sitemap',source:'official-sitemap'},
      '@alpha/button':{url:'https://alpha.example/r/button.json',level:'sitemap',source:'official-sitemap'},
      '@beta/button':{url:'http://beta.example/docs/button',level:'reviewed',source:'visual-reference'},
      '@alpha/not-indexed':{url:'https://alpha.example/docs/nonexistent',level:'reviewed',source:'visual-reference'},
    }},index,registries);
    expect(pages).toEqual({});
    expect(readSourcePageManifest({schema:'bad',pages:{}},index,registries)).toEqual({});
    expect(readSourcePageManifest(null,index,registries)).toEqual({});
  });
});
