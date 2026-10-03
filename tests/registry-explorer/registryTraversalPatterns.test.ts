import { describe, expect, it } from 'vitest';
// @ts-expect-error Node ESM source script has no TS declarations.
import { deriveTraversalInventory } from '../../scripts/derive-registry-traversal-patterns.mjs';
// @ts-expect-error Node ESM source script has no TS declarations.
import { catalogFingerprint, DISCOVERY_REVISION } from '../../scripts/lib/registry-discovery.mjs';

const alpha = { name: '@alpha', homepage: 'https://alpha.example/' };
const beta = { name: '@beta', homepage: 'https://beta.example/' };
const gamma = { name: '@gamma', homepage: 'https://gamma.example/' };
const http = { name: '@http', homepage: 'http://http.example/' };
const index = { registries: {
  '@alpha': [{name:'button'}, {name:'card'}, {name:'missing'}],
  '@beta': [{name:'components-animate-avatar-group'}, {name:'components-animate-code'}],
  '@gamma': [{name:'other'}], '@http': [{name:'card'}],
}};
const now = '2026-10-03T01:00:00.000Z';
function observed(registry: typeof alpha, slug: string, url: string) {
  return { schema:'registry-atlas-discovery/v1', discoveryRevision:DISCOVERY_REVISION,
    namespace:registry.name, token:registry.name+'/'+slug, slug,
    status:'page-observed', checkedAt:now,
    catalogFingerprint:catalogFingerprint(registry,index.registries[registry.name as keyof typeof index.registries].map(x=>x.name)),
    docsUrl:url,evidence:{observedUrl:url,renderedHeading:slug} };
}
function snapshot(registry: typeof alpha, links: Array<{slug:string; url:string; listingUrl:string}>) {
  return {schema:'registry-atlas-discovery/v1',discoveryRevision:DISCOVERY_REVISION,
    namespace:registry.name, token:'registry:'+registry.name,
    checkedAt:now,catalogFingerprint:catalogFingerprint(registry,index.registries[registry.name as keyof typeof index.registries].map(x=>x.name)),
    status:'discovered',error:null,exhausted:false,
    listings:[{url:registry.homepage,depth:0,observedLinks:11},
      {url:links[0].listingUrl,depth:1,observedLinks:40}],
    candidates:links.map(x=>({...x,name:x.slug,matching:'full-name-path',navigationSource:'observed-dom-anchor'}))};
}
const alphaListing='https://alpha.example/docs/components';
const betaListing='https://beta.example/docs';
const ledgers: Record<string, Map<string, any>> = {
  '@alpha': new Map<string, any>([
    ['registry:@alpha', snapshot(alpha,[
      {slug:'button',url:'https://alpha.example/docs/components/button',listingUrl:alphaListing},
      {slug:'card',url:'https://alpha.example/docs/components/card',listingUrl:alphaListing},
      {slug:'missing',url:'https://bad.example/docs/components/missing',listingUrl:alphaListing},
    ])],
    ['@alpha/button',observed(alpha,'button','https://alpha.example/docs/components/button')],
    ['@alpha/card',observed(alpha,'card','https://alpha.example/docs/components/card')],
  ]),
  '@beta': new Map<string, any>([
    ['registry:@beta', snapshot(beta,[
      {slug:'components-animate-avatar-group',url:'https://beta.example/docs/components/animate/avatar-group',listingUrl:betaListing},
      {slug:'components-animate-code',url:'https://beta.example/docs/components/animate/code',listingUrl:betaListing},
    ])],
    ['@beta/components-animate-code',observed(beta,'components-animate-code','https://beta.example/docs/components/animate/code')],
  ]),
  '@gamma':new Map<string, any>(), '@http':new Map<string, any>(),
};
describe('actual registry traversal route inventory', () => {
  it('retains the correct official listing and per-registry path shape from observed anchors', () => {
    const report=deriveTraversalInventory([alpha,beta,gamma,http],index,{},ledgers,now);
    expect(report.summary).toMatchObject({registryCount:4,registriesWithNavigation:2,registriesWithVerifiedPages:2});
    expect(report.registries[0]).toMatchObject({namespace:'@alpha',status:'verified-sample',
      itemCount:3,verifiedPageCount:2,matchedAnchorCount:2});
    expect(report.registries[0].listings[0]).toMatchObject({url:alphaListing,matchedItems:2});
    expect(report.registries[0].patterns[0]).toMatchObject({
      urlTemplate:'https://alpha.example/docs/components/{slug}',slugPrefix:'',
      matchedItems:2,verifiedPages:2,
    });
    expect(report.registries[1].patterns[0]).toMatchObject({
      urlTemplate:'https://beta.example/docs/components/animate/{leaf}',
      slugPrefix:'components-animate-',matchedItems:2,verifiedPages:1,
    });
  });
  it('retains a trailing slash in the observed page route', () => {
    const withSlash=snapshot(alpha,[
      {slug:'button',url:'https://alpha.example/docs/components/button/',listingUrl:alphaListing},
      {slug:'card',url:'https://alpha.example/docs/components/card/',listingUrl:alphaListing},
    ]);
    const result=deriveTraversalInventory([alpha],index,{}, {
      '@alpha':new Map<string, any>([['registry:@alpha',withSlash]]),
    },now);
    expect(result.registries[0].patterns).toContainEqual(expect.objectContaining({
      urlTemplate:'https://alpha.example/docs/components/{slug}/',matchedItems:2,
    }));
  });
  it('preserves larger previous browser observations when a later crawl has a smaller budget', () => {
    const former=snapshot(alpha,[
      {slug:'button',url:'https://alpha.example/docs/components/button',listingUrl:alphaListing},
      {slug:'card',url:'https://alpha.example/docs/components/card',listingUrl:alphaListing},
    ]);
    const last=snapshot(alpha,[{slug:'missing',
      url:'https://alpha.example/docs/components/missing',listingUrl:alphaListing}]);
    const journal=new Map<string, any>([['registry:@alpha',last]]);
    (journal as any).history=[former,last];
    const report=deriveTraversalInventory([alpha],index,{}, {'@alpha':journal},now);
    expect(report.registries[0].matchedAnchorCount).toBe(3);
    expect(report.registries[0].patterns).toContainEqual(expect.objectContaining({
      urlTemplate:'https://alpha.example/docs/components/{slug}',matchedItems:3,
    }));
  });
  it('keeps source-published sitemap patterns distinct from visited component pages', () => {
    const survey={
      schema:'registry-atlas-sitemap-survey/v1',namespace:'@gamma',
      officialHomepage:gamma.homepage, surveyedAt:now, sitemapUrlCount:99,
      catalogFingerprint:catalogFingerprint(gamma,['other']),
      matchedPages:[{slug:'other',url:'https://gamma.example/docs/other'}],
      sitemaps:[{url:'https://gamma.example/sitemap.xml',kind:'urls',locCount:99}],
    };
    const row=deriveTraversalInventory([gamma],index,{},ledgers,now,{'@gamma':survey}).registries[0];
    expect(row.status).toBe('sitemap-observed');
    expect(row.sitemapMatchedCount).toBe(1);
    expect(row.verifiedPageCount).toBe(0);
    expect(row.patterns).toEqual([]);
    expect(row.sitemapPatterns[0]).toMatchObject({
      urlTemplate:'https://gamma.example/docs/{slug}',
      evidenceLevel:'official-xml-sitemap',
      matchedItems:1,browserVerifiedPages:0,
    });
    expect(row.sitemapPages).toEqual([{slug:'other',url:'https://gamma.example/docs/other'}]);
    const stale={...survey,catalogFingerprint:'stale'};
    expect(deriveTraversalInventory([gamma],index,{},ledgers,now,{'@gamma':stale})
      .registries[0].sitemapMatchedCount).toBe(0);
  });
  it('explicitly distinguishes unobserved and HTTP-only registries', () => {
    const rows=deriveTraversalInventory([gamma,http],index,{},ledgers,now).registries;
    expect(rows.map((x:any)=>x.status)).toEqual(['not-inspected','http-only-homepage']);
    expect(rows.flatMap((x:any)=>x.patterns)).toEqual([]);
  });
  it('never promotes stale evidence or a JSON endpoint into navigation', () => {
    const stale=new Map<string, any>(ledgers['@alpha']);
    stale.set('registry:@alpha',{...stale.get('registry:@alpha'), catalogFingerprint:'old'});
    const result=deriveTraversalInventory([alpha],index,{}, {'@alpha':stale},now);
    expect(result.registries[0].status).toBe('not-inspected');
    expect(result.registries[0].patterns).toEqual([]);
    const source=ledgers['@alpha'].get('registry:@alpha');
    const invalid=new Map<string, any>([['registry:@alpha',{...source,candidates:[{
      slug:'button',url:'https://alpha.example/r/button.json',
      listingUrl:alphaListing,name:'button',matching:'full-name-path',
    }]}]]);
    expect(deriveTraversalInventory([alpha],index,{}, {'@alpha':invalid},now)
      .registries[0].patterns).toEqual([]);
  });
});
