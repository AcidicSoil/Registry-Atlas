import { describe, it, expect } from 'vitest';
// @ts-ignore Node ESM utility tested in Vitest.
import { DatabaseSync } from 'node:sqlite';
// @ts-ignore standalone Node script
import { importRegistryPatterns, verifyRegistryPatterns, exportPatternCoverage, exportPatternLinkSnapshot, pendingRegistryNames, exportPatternRepairQueue, managedBrowserPatternProof, reconcileRegistryCatalog } from '../../scripts/verify-registry-patterns.mjs';

const inventory = {
  schema: 'registry-atlas-traversal-inventory/v1',
  registries: [{
    namespace: '@one', homepage: 'https://one.example', itemCount: 4,
    patterns: [{urlTemplate:'https://one.example/docs/{slug}', slugPrefix:'',
      matchedItems:2,examples:[{slug:'button',url:'https://one.example/docs/button'},
      {slug:'card',url:'https://one.example/docs/card'}]}],
    sitemapPatterns:[],sitemapPages:[],
  }, {
    namespace:'@multi',homepage:'https://multi.example',itemCount:3,
    patterns:[{urlTemplate:'https://multi.example/docs/{slug}',slugPrefix:'',
      matchedItems:1,examples:[{slug:'button',url:'https://multi.example/docs/button'}]},
      {urlTemplate:'https://multi.example/blocks/{slug}',slugPrefix:'',
      matchedItems:1,examples:[{slug:'hero',url:'https://multi.example/blocks/hero'}]}],
    sitemapPatterns:[],sitemapPages:[],
  }],
};
const catalog={registries:{
  '@one':[{name:'button'},{name:'card'},{name:'forms/input'},{name:'button-group'}],
  '@multi':[{name:'button'},{name:'hero'},{name:'unknown'}],
}};
const raw=[{name:'@one',homepage:'https://one.example'}, {name:'@multi',homepage:'https://multi.example'}];
function getHtml(url:string) {
 const slug=new URL(url).pathname.split('/').at(-1);
 const title=slug==='forms'?'Forms':slug==='input'?'Input':slug==='button-group'?'Button Group':
   slug==='hero'?'Hero':slug==='card'?'Card':slug==='code'?'Code':slug==='tabs'?'Tabs':'Button';
 return new Response('<!doctype html><html><head><title>'+title+' | Library</title></head><body><h1>'+title+'</h1></body></html>',
   {status:200,headers:{'content-type':'text/html'}});
}
describe('bounded SQLite registry route-pattern verification', () => {
  it('imports matching patterns once, checks representative real pages, and infers missing only when unambiguous',async()=>{
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw,now:'2026-10-04T20:00:00.000Z'});
    const hits:string[]=[];
    const result=await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:async(url:string)=>{hits.push(url);return getHtml(url);}});
    expect(result).toMatchObject({checkedPatterns:1,verifiedPatterns:1});
    expect(hits).toEqual(['https://one.example/docs/button','https://one.example/docs/card']);
    const entries=db.prepare("SELECT slug, source_url, status FROM item_routes WHERE namespace='@one' ORDER BY slug").all();
    expect(entries).toEqual(expect.arrayContaining([
      expect.objectContaining({slug:'forms/input',source_url:'https://one.example/docs/forms/input',status:'pattern-inferred'}),
      expect.objectContaining({slug:'button',status:'pattern-observed'}),
    ]));
    expect(exportPatternCoverage(db).unverifiedRegistries).toContainEqual(expect.objectContaining({namespace:'@multi'}));
    db.close();
  });
  it('moves past patterns with too few examples instead of retrying them forever',async()=> {
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw,now:'2026-10-04T20:00:00.000Z'});
    expect(pendingRegistryNames(db,2,10)).toEqual(['@one']);
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:async (url:string)=>getHtml(url)});
    expect(pendingRegistryNames(db,2,10)).toEqual([]);
    db.close();
  });

  it('does not fabricate route assignments for multi-pattern registries',async()=>{
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw,now:'2026-10-04T20:00:00.000Z'});
    await verifyRegistryPatterns(db,{registry:'@multi',samples:1,fetchPage:async (url:string)=>getHtml(url)});
    expect(db.prepare("SELECT status FROM item_routes WHERE namespace='@multi' AND slug='unknown'").get())
      .toEqual({status:'unverified'});
    expect(db.prepare("SELECT status FROM item_routes WHERE namespace='@multi' AND slug='button'").get())
      .toEqual({status:'pattern-observed'});
    db.close();
  });
  it('refuses HTML identity mismatches, redirects, and off-origin candidate evidence',async()=>{
    const db=new DatabaseSync(':memory:');
    const modified=structuredClone(inventory);
    modified.registries[0].patterns[0].examples.push({slug:'evil',url:'https://evil.example/evil'});
    importRegistryPatterns(db,{inventory:modified,catalog,raw,now:'2026-10-04T20:00:00.000Z'});
    const result=await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:async()=>new Response('<h1>Not Found</h1>',{status:200,headers:{'content-type':'text/html'}})});
    expect(result.verifiedPatterns).toBe(0);
    expect(db.prepare("SELECT status FROM item_routes WHERE namespace='@one' AND slug='forms/input'").get())
      .toEqual({status:'unverified'});
    expect(db.prepare("SELECT COUNT(*) AS n FROM pattern_checks").get().n).toBeGreaterThan(0);
    db.close();
  });
  it('resolves a prefixed catalog identity from a verified leaf route pattern', async()=>{
    const db=new DatabaseSync(':memory:');
    const source={name:'@leaf',homepage:'https://leaf.example'};
    const input={raw:[source],catalog:{registries:{'@leaf':[
      {name:'components-animate-code'},{name:'components-animate-tabs'},
      {name:'components-animate-dialog'}]}},inventory:{
      schema:'registry-atlas-traversal-inventory/v1',registries:[{
        namespace:'@leaf',homepage:source.homepage,
        patterns:[{urlTemplate:'https://leaf.example/docs/animate/{leaf}',
          slugPrefix:'components-animate-',examples:[
            {slug:'components-animate-code',url:'https://leaf.example/docs/animate/code'},
            {slug:'components-animate-tabs',url:'https://leaf.example/docs/animate/tabs'},
          ]}],sitemapPatterns:[],sitemapPages:[],
      }]
    },now:'2026-10-04T20:00:00.000Z'};
    expect(importRegistryPatterns(db,input).patterns).toBe(1);
    const output=await verifyRegistryPatterns(db,{registry:'@leaf',samples:2,
      fetchPage:async (url:string)=>getHtml(url)});
    expect(output.verifiedPatterns).toBe(1);
    expect(db.prepare("SELECT source_url,status FROM item_routes WHERE namespace='@leaf' AND slug='components-animate-dialog'").get())
      .toEqual({source_url:'https://leaf.example/docs/animate/dialog',status:'pattern-inferred'});
    db.close();
  });

  it('invalidates a formerly verified route when its source example changes', async()=>{
    const db=new DatabaseSync(':memory:');
    const opts={inventory,catalog,raw,now:'2026-10-04T20:00:00.000Z'};
    importRegistryPatterns(db,opts);
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:async (url:string)=>getHtml(url)});
    const changed=structuredClone(inventory);
    changed.registries[0].patterns[0].examples[0].url='https://one.example/docs/button-v2';
    importRegistryPatterns(db,{...opts,inventory:changed});
    expect(db.prepare("SELECT status FROM route_patterns WHERE namespace='@one'").get())
      .toEqual({status:'unverified'});
    expect(db.prepare("SELECT status,source_url FROM item_routes WHERE namespace='@one' AND slug='forms/input'").get())
      .toEqual({status:'unverified',source_url:null});
    db.close();
  });

  it('rechecks old verified patterns instead of letting their links expire forever',async()=> {
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw,now:'2026-10-04T20:00:00.000Z'});
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,
      checkedAt:'2025-01-01T00:00:00Z',fetchPage:async (url:string)=>getHtml(url)});
    expect(pendingRegistryNames(db,2,10,'2026-10-04T20:00:00Z')).toContain('@one');
    const refreshed=await verifyRegistryPatterns(db,{registry:'@one',samples:2,
      checkedAt:'2026-10-04T20:00:00Z',fetchPage:async (url:string)=>getHtml(url)});
    expect(refreshed.verifiedPatterns).toBe(1);
    expect(pendingRegistryNames(db,2,10,'2026-10-04T20:00:00Z')).toEqual([]);
    db.close();
  });

  it('keeps unsupported HTTP-only registries visible in the unresolved report',()=> {
    const db=new DatabaseSync(':memory:');
    const withHttp=[...raw,{name:'@http-only',homepage:'http://insecure.example/'}];
    importRegistryPatterns(db,{inventory,catalog,raw:withHttp});
    const coverage=exportPatternCoverage(db);
    expect(coverage.registries).toBe(3);
    expect(db.prepare("SELECT homepage FROM sources WHERE namespace='@http-only'").get())
      .toEqual({homepage:'http://insecure.example/'});
    expect(coverage.unverifiedRegistries).toContainEqual(
      expect.objectContaining({namespace:'@http-only',reason:'non-public-https-homepage'}));
    db.close();
  });

  it('persists original sitemap candidates in SQLite and exports them without another traversal',async()=>{
    const db=new DatabaseSync(':memory:');
    const sitemap={
      ...structuredClone(inventory),
      generatedAt:'2026-10-03T20:00:00.000Z',
      registries:inventory.registries.map((row,index)=>({
        ...structuredClone(row),
        sitemapSurveyedAt:'2026-10-03T20:00:00.000Z',
        sitemapPages:index===0 ? [
          {slug:'button',url:'https://one.example/docs/button'},
          {slug:'forms/input',url:'https://one.example/docs/forms/input'},
          {slug:'outside',url:'https://one.example/docs/outside'},
        ] : [],
      })),
    };
    importRegistryPatterns(db,{inventory:sitemap,catalog,raw});
    const published=exportPatternLinkSnapshot(db);
    expect(published.sourceSnapshotAt).toBe(sitemap.generatedAt);
    expect(published.sitemapLinks).toEqual(expect.arrayContaining([
      {namespace:'@one',slug:'forms/input',url:'https://one.example/docs/forms/input',
        observedAt:sitemap.registries[0].sitemapSurveyedAt},
    ]));
    expect(published.sitemapLinks.some((row:{slug:string})=>row.slug==='outside')).toBe(false);
    expect(published.fingerprints['@one']).toBeTruthy();
    db.close();
  });


  it('requeues failed identities by repair strategy with a persistent retry cap',async()=>{
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw});
    const fails=async()=>new Response('<h1>Unavailable</h1>',{status:200,
      headers:{'content-type':'text/html'}});
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:fails});
    expect(pendingRegistryNames(db,2,10,new Date().toISOString(),{retryFailed:true,maxAttempts:2}))
      .toEqual(['@one']);
    let queue=exportPatternRepairQueue(db,{maxAttempts:2});
    expect(queue.patterns).toEqual(expect.arrayContaining([
      expect.objectContaining({namespace:'@one',strategy:'browser-rendered-identity',attempts:1}),
    ]));
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:fails});
    expect(pendingRegistryNames(db,2,10,new Date().toISOString(),{retryFailed:true,maxAttempts:2}))
      .toEqual([]);
    queue=exportPatternRepairQueue(db,{maxAttempts:2});
    expect(queue.patterns.find((p:any)=>p.namespace==='@one')).toMatchObject({
      strategy:'browser-rendered-identity',attempts:2,exhausted:true,
    });
    db.close();
  });

  it('promotes a failed static HTML check only after a matching rendered-browser proof',async()=>{
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw});
    const visits:string[]=[];
    const result=await verifyRegistryPatterns(db,{registry:'@one',samples:2,
      fetchPage:async()=>new Response('<html><div id="root"></div></html>',{status:200,
        headers:{'content-type':'text/html'}}),
      browserPage:async (url:string,slug:string,home:string)=>{
        visits.push(url);
        expect(new URL(url).origin).toBe(new URL(home).origin);
        return {status:'verified',reason:null,observedUrl:url,observedIdentity:slug};
      },
    });
    expect(result.verifiedPatterns).toBe(1);
    expect(visits).toHaveLength(2);
    expect(db.prepare("SELECT COUNT(*) AS n FROM pattern_checks WHERE status='verified'").get().n).toBe(2);
    db.close();
  });

  it('checks actual managed browser page URL and heading, without treating a matching URL alone as proof',async()=>{
    const calls:string[]=[];
    const execute=(_command:string,args:string[])=>{
      calls.push(args.join(' '));
      if(_command==='pinchtab-profile-manager')return JSON.stringify({
        ok:true,data:{settings:{allowedDomains:['example.org']},
          instances:[{status:'running',url:'http://127.0.0.1:9877'}]}});
      if(args.includes('nav'))return JSON.stringify({url:'https://example.org/docs/button'});
      if(args.includes('url'))return JSON.stringify({url:'https://example.org/docs/button'});
      if(args.includes('snap'))return JSON.stringify({
        url:'https://example.org/docs/button',nodes:[{role:'heading',name:'Button'}]});
      return JSON.stringify({});
    };
    const browser=managedBrowserPatternProof({profile:'source-audit',server:'http://127.0.0.1:9877',
      tab:'a'.repeat(32),exec:execute});
    expect(await browser('https://example.org/docs/button','button','https://example.org/'))
      .toMatchObject({status:'verified',observedUrl:'https://example.org/docs/button'});
    expect(await browser('https://evil.example/docs/button','button','https://example.org/'))
      .toMatchObject({status:'failed',reason:'unsafe-browser-url'});
    expect(calls.some(call=>call.includes('nav'))).toBe(true);
  });


  it('does not repeatedly retry an unchanged browser-identity mismatch',async()=>{
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw});
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,
      fetchPage:async()=>new Response('<html><main>Loading</main></html>',{
        status:200,headers:{'content-type':'text/html'}}),
      browserPage:async()=>({status:'failed',reason:'browser-identity-mismatch'}),
    });
    expect(pendingRegistryNames(db,2,10,new Date().toISOString(),
      {retryFailed:true,maxAttempts:5})).toEqual([]);
    expect(exportPatternRepairQueue(db).patterns.find((x:any)=>x.namespace==='@one'))
      .toMatchObject({strategy:'rediscover-route-family'});
    db.close();
  });

  it('never treats a browser redirect to a different page as verification',async()=>{
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw});
    const result=await verifyRegistryPatterns(db,{registry:'@one',samples:2,
      fetchPage:async()=>new Response('<html><div id="root"></div></html>',{status:200,
        headers:{'content-type':'text/html'}}),
      browserPage:async()=>({status:'failed',reason:'browser-url-mismatch'}),
    });
    expect(result.verifiedPatterns).toBe(0);
    expect(db.prepare("SELECT failure FROM route_patterns WHERE namespace='@one'").get()).toEqual({
      failure:'browser-url-mismatch',
    });
    db.close();
  });

  it('reconciles newly synced slugs without requiring or reviving the removed traversal JSON',async()=>{
    const db=new DatabaseSync(':memory:');
    const initial={inventory,catalog,raw};
    importRegistryPatterns(db,initial);
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,
      fetchPage:async(url:string)=>getHtml(url)});
    const updated=structuredClone(catalog);
    updated.registries['@one'].push({name:'new-component'});
    const result=reconcileRegistryCatalog(db,{raw,catalog:updated});
    expect(result).toMatchObject({added:1,removed:0,changedHomepages:0});
    expect(db.prepare("SELECT status FROM route_patterns WHERE namespace='@one'").get())
      .toEqual({status:'verified'});
    expect(db.prepare("SELECT source_url,status FROM item_routes WHERE namespace='@one' AND slug='new-component'").get())
      .toEqual({source_url:'https://one.example/docs/new-component',status:'pattern-inferred'});
    expect(reconcileRegistryCatalog(db,{raw,catalog:updated}).added).toBe(0);
    const removed=structuredClone(updated);
    removed.registries['@one']=removed.registries['@one'].filter((item:any)=>item.name!=='new-component');
    expect(reconcileRegistryCatalog(db,{raw,catalog:removed}).removed).toBe(1);
    expect(db.prepare("SELECT slug FROM item_routes WHERE namespace='@one' AND slug='new-component'").get()).toBeUndefined();
    db.close();
  });
  it('invalidates previously verified paths when an official registry changes its homepage',async()=>{
    const db=new DatabaseSync(':memory:');
    importRegistryPatterns(db,{inventory,catalog,raw});
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:async(url:string)=>getHtml(url)});
    const replaced=raw.map(row=>row.name==='@one'
      ?{...row,homepage:'https://updated-one.example'}:row);
    expect(reconcileRegistryCatalog(db,{raw:replaced,catalog}).changedHomepages).toBe(1);
    expect(db.prepare("SELECT COUNT(*) AS n FROM route_patterns WHERE namespace='@one'").get()).toEqual({n:0});
    expect(db.prepare("SELECT source_url,status FROM item_routes WHERE namespace='@one' AND slug='button'").get())
      .toEqual({source_url:null,status:'unverified'});
    db.close();
  });

  it('preserves persisted status across a second import without duplicating patterns',async()=>{
    const db=new DatabaseSync(':memory:');
    const opts={inventory,catalog,raw,now:'2026-10-04T20:00:00.000Z'};
    importRegistryPatterns(db,opts);
    await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:async (url:string)=>getHtml(url)});
    const n=db.prepare('SELECT COUNT(*) AS n FROM route_patterns').get().n;
    importRegistryPatterns(db,opts);
    expect(db.prepare('SELECT COUNT(*) AS n FROM route_patterns').get().n).toBe(n);
    expect(db.prepare("SELECT status FROM route_patterns WHERE namespace='@one'").get())
      .toEqual({status:'verified'});
    db.close();
  });
});
