import { describe, expect, it } from 'vitest';
// @ts-expect-error This browser-focused tsconfig omits Node ESM type declarations.
import { buildSourcePageIndex } from '../../scripts/build-source-page-index.mjs';
// @ts-expect-error Node ESM helper lives outside the browser-oriented tsconfig.
import {catalogFingerprint} from '../../scripts/lib/registry-discovery.mjs';
const raw = [
  { name: '@alpha', homepage: 'https://alpha.example/', url: 'https://alpha.example/r/{name}.json' },
  { name: '@beta', homepage: 'https://beta.example/', url: 'https://beta.example/r/{name}.json' },
];
const catalog = { registries: {
  '@alpha': [{ name: 'forms/button' }, { name: 'button' }, {name:'card'}],
  '@beta': [{name: 'button'}],
} };
const now = '2026-10-04T20:00:00Z';
const surveyedAt = '2026-10-03T20:00:00Z';
const traversal = {
  schema: 'registry-atlas-traversal-inventory/v1',
  registries: [
    {namespace:'@alpha',homepage:raw[0].homepage,sitemapSurveyedAt:surveyedAt,
      catalogFingerprint:catalogFingerprint(raw[0],['forms/button','button','card']),sitemapPages: [
      {slug:'button',url:'https://alpha.example/docs/button'},
      {slug:'forms/button',url:'https://alpha.example/docs/forms/button'},
      {slug:'card',url:'https://alpha.example/r/card.json'},
    ]},
    {namespace:'@beta',homepage:raw[1].homepage,sitemapSurveyedAt:surveyedAt,
      catalogFingerprint:catalogFingerprint(raw[1],['button']),sitemapPages:[
      {slug:'button',url:'https://beta.example/docs/button'},
    ]},
  ],
};
const input = (opts: Record<string,unknown> = {}) => ({
  raw, catalog, curated:{'@alpha':[{
    slug:'button',docs_url:'https://alpha.example/components/button',
  }]}, traversal, previews:{ previews:{} }, now,...opts,
});

describe('published original-page source index', () => {
  it('keeps exact nested identities and distinct same-slug registry pages', () => {
    const output=buildSourcePageIndex(input());
    expect(output.pages['@alpha/forms/button']).toMatchObject({
      url:'https://alpha.example/docs/forms/button',level:'sitemap',
    });
    expect(output.pages['@beta/button']).toMatchObject({
      url:'https://beta.example/docs/button',level:'sitemap',
    });
    expect(output.pages['@alpha/button']).toMatchObject({
      url:'https://alpha.example/components/button',level:'reviewed',
    });
    expect(output.pages['@alpha/card']).toBeUndefined();
    expect(output.coverage.sitemap).toBe(2);
    expect(output.coverage.reviewed).toBe(1);
  });
  it('publishes current unambiguous pattern-backed routes only when individually absent',()=> {
    const result=buildSourcePageIndex(input({curated:{},patternLinks:{
      schema:'registry-atlas-pattern-links/v1',links:[
        {namespace:'@alpha',slug:'card',source_url:'https://alpha.example/docs/card',status:'pattern-inferred',checkedAt:surveyedAt},
        {namespace:'@beta',slug:'button',source_url:'https://beta.example/docs/button',status:'pattern-observed',checkedAt:surveyedAt},
        {namespace:'@alpha',slug:'not-indexed',source_url:'https://alpha.example/docs/wrong',status:'pattern-inferred',checkedAt:surveyedAt},
        {namespace:'@alpha',slug:'button',source_url:'https://foreign.example/docs/button',status:'pattern-inferred',checkedAt:surveyedAt},
      ],
    }}));
    expect(result.pages['@alpha/card']).toMatchObject({
      url:'https://alpha.example/docs/card',level:'pattern',source:'verified-route-pattern',
    });
    expect(result.pages['@beta/button']?.level).toBe('sitemap');
    expect(result.coverage.pattern).toBe(1);
    expect(result.coverage.rejections['unknown-item']).toBeGreaterThan(0);
    expect(result.coverage.rejections['invalid-url']).toBeGreaterThan(0);
  });

  it('promotes only current, exact individually checked pages from SQLite',()=>{
    const link={namespace:'@alpha',slug:'forms/button',
      url:'https://alpha.example/docs/forms/button',checkedAt:surveyedAt};
    const output=buildSourcePageIndex(input({
      curated:{},traversal:null,patternLinks:{
        schema:'registry-atlas-pattern-links/v1',
        sourceSnapshotAt:surveyedAt,
        sitemapLinks:[],
        fingerprints:Object.fromEntries(raw.map(source=>[source.name,
          catalogFingerprint(source,source.name==='@alpha'
            ? ['button','card','forms/button']:['button'])])),
        links:[],verifiedPages:[
          link,
          {namespace:'@alpha',slug:'card',url:'https://alpha.example/docs/card',
            checkedAt:'2020-01-01T00:00:00Z'},
          {namespace:'@beta',slug:'button',url:'https://alpha.example/docs/button',checkedAt:surveyedAt},
        ],
      },
    }));
    expect(output.pages['@alpha/forms/button']).toMatchObject({
      level:'reviewed',source:'component-page-verified',url:link.url,
    });
    expect(output.pages['@alpha/card']).toBeUndefined();
    expect(output.pages['@beta/button']).toBeUndefined();
    expect(output.coverage.rejections.stale).toBeGreaterThan(0);
  });

  it('does not publish a confirmed 404 even when an older official sitemap listed it',()=>{
    const result=buildSourcePageIndex(input({
      curated:{},traversal:null,patternLinks:{
        schema:'registry-atlas-pattern-links/v1',
        sourceSnapshotAt:surveyedAt,
        fingerprints:Object.fromEntries(raw.map(source=>[source.name,
          catalogFingerprint(source,source.name==='@alpha'
            ? ['button','card','forms/button']:['button'])])),
        sitemapLinks:[{namespace:'@alpha',slug:'button',
          url:'https://alpha.example/docs/button',observedAt:surveyedAt}],
        links:[],verifiedPages:[],
        missingPages:[{namespace:'@alpha',slug:'button',
          url:'https://alpha.example/docs/button'}],
      },
    }));
    expect(result.pages['@alpha/button']).toBeUndefined();
    expect(result.coverage.rejections['confirmed-missing']).toBe(1);
  });

  it('reads independently published sitemap evidence from SQLite export without legacy traversal JSON',()=> {
    const snapshot={
      schema:'registry-atlas-pattern-links/v1',
      sourceSnapshotAt:'2026-10-03T20:00:00.000Z',
      fingerprints:Object.fromEntries(raw.map(source => [source.name,
        catalogFingerprint(source,source.name==='@alpha'
          ? ['button','card','forms/button']:['button'])])),
      sitemapLinks:[
        {namespace:'@alpha',slug:'forms/button',url:'https://alpha.example/docs/forms/button',observedAt:surveyedAt},
        {namespace:'@beta',slug:'button',url:'https://beta.example/docs/button',observedAt:surveyedAt},
      ],links:[],
    };
    const result=buildSourcePageIndex(input({traversal:null,curated:{},patternLinks:snapshot}));
    expect(result.coverage.sitemap).toBe(2);
    expect(result.pages['@alpha/forms/button']).toMatchObject({
      level:'sitemap',url:'https://alpha.example/docs/forms/button',
    });
    expect(result.sourceSnapshotAt).toBe(snapshot.sourceSnapshotAt);
  });

  it('rejects stale, foreign, generic, ambiguous, and unknown sitemap routes', () => {
    const modified=structuredClone(traversal);
    modified.registries[0].sitemapPages.push(
      {slug:'button',url:'https://alpha.example/docs/other-button'},
      {slug:'outside',url:'https://alpha.example/docs/outside'},
      {slug:'card',url:'https://beta.example/docs/card'},
    );
    modified.registries[1].sitemapSurveyedAt='2024-01-01T00:00:00Z';
    const result=buildSourcePageIndex(input({traversal:modified,curated:{}}));
    expect(result.pages['@alpha/button']).toBeUndefined();
    expect(result.pages['@beta/button']).toBeUndefined();
    expect(result.coverage.rejections.ambiguous).toBeGreaterThan(0);
    expect(result.coverage.rejections.stale).toBeGreaterThan(0);
    expect(result.coverage.rejections['unknown-item']).toBeGreaterThan(0);
    expect(result.coverage.rejections['invalid-url']).toBeGreaterThan(0);
  });
  it('rejects sitemap URLs when a registry catalog fingerprint drifts',()=>{
    const modified=structuredClone(traversal);
    modified.registries[0].catalogFingerprint='different-source';
    const result=buildSourcePageIndex(input({traversal:modified,curated:{}}));
    expect(result.pages['@alpha/forms/button']).toBeUndefined();
    expect(result.pages['@beta/button']?.level).toBe('sitemap');
    expect(result.coverage.rejections['fingerprint-mismatch']).toBeGreaterThan(0);
  });
  it('retains reviewed evidence but reports a disagreeing provisional sitemap',()=>{
    const modified=structuredClone(traversal);
    modified.registries[0].sitemapPages[0].url='https://alpha.example/docs/another-page';
    const result=buildSourcePageIndex(input({traversal:modified}));
    expect(result.pages['@alpha/button']).toMatchObject({
      url:'https://alpha.example/components/button',level:'reviewed',
    });
    expect(result.coverage.rejections['sitemap-review-disagreement']).toBe(1);
  });
  it('does not replace conflicting reviewed pages with sitemap candidates', () => {
    const result=buildSourcePageIndex(input({previews:{previews:{
      '@alpha/button':{officialPage:'https://alpha.example/docs/button',imageUrl:'/Registry-Atlas/data/previews/alpha/button.jpg'},
    }}}));
    expect(result.pages['@alpha/button']).toBeUndefined();
    expect(result.coverage.rejections['reviewed-conflict']).toBe(1);
  });
  it('includes independently interaction-verified source demos but not unverified fixtures',()=>{
    const demo={items:[{
      namespace:'@alpha',slug:'card',kind:'upstream-built',status:'interaction-verified',
      sourceSha256:'a'.repeat(64),source:{docsUrl:'https://alpha.example/docs/card'},
    },{
      namespace:'@alpha',slug:'forms/button',kind:'source-informed-fixture',status:'interaction-verified',
      sourceSha256:'b'.repeat(64),source:{docsUrl:'https://alpha.example/docs/other'},
    }]};
    const output=buildSourcePageIndex(input({demos:demo}));
    expect(output.pages['@alpha/card']).toMatchObject({
      url:'https://alpha.example/docs/card', level:'reviewed',
      source:'interaction-verified-demo',
    });
    expect(output.pages['@alpha/forms/button'].url).toBe('https://alpha.example/docs/forms/button');
  });
  it('uses independently captured source pages ahead of matching sitemap entries', () => {
    const result=buildSourcePageIndex(input({curated:{},previews:{previews:{
      '@alpha/button':{officialPage:'https://alpha.example/docs/button',imageUrl:'/Registry-Atlas/data/previews/alpha/button.jpg'},
    }}}));
    expect(result.pages['@alpha/button']).toMatchObject({
      url:'https://alpha.example/docs/button',level:'reviewed',
    });
  });
});
