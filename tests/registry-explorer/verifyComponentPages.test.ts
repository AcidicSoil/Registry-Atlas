import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
// @ts-expect-error Node ESM file exercised under Vitest.
import { importRegistryPatterns, verifyRegistryPatterns } from '../../scripts/verify-registry-patterns.mjs';
// @ts-expect-error Node ESM file exercised under Vitest.
import { initializeComponentChecks, seedComponentCandidates, verifyComponentCandidates, exportComponentQueue } from '../../scripts/verify-component-pages.mjs';

const catalog = {registries: {
  '@one': [
    {name:'button',title:'Button'}, {name:'forms/input',title:'Form Input'},
    {name:'card-grid',title:'Elegant Card Grid'}, {name:'absent',title:'Not Found'},
  ],
  '@two':[{name:'button',title:'Distinct Button'}],
}};
const raw=[{name:'@one',homepage:'https://one.example'}, {name:'@two',homepage:'https://two.example'}];
const inventory={schema:'registry-atlas-traversal-inventory/v1',registries:[
  {namespace:'@one',homepage:'https://one.example',patterns:[{
    urlTemplate:'https://one.example/components/{slug}',slugPrefix:'',examples:[
      {slug:'button',url:'https://one.example/components/button'},
      {slug:'forms/input',url:'https://one.example/components/forms/input'},
    ]}],sitemapPatterns:[],sitemapPages:[]},
  {namespace:'@two',homepage:'https://two.example',patterns:[{
    urlTemplate:'https://two.example/docs/{slug}',slugPrefix:'',examples:[
      {slug:'button',url:'https://two.example/docs/button'},
    ]}],sitemapPatterns:[],sitemapPages:[]},
]};
async function fixture(){
  const db=new DatabaseSync(':memory:');
  importRegistryPatterns(db,{catalog,raw,inventory});
  await verifyRegistryPatterns(db,{registry:'@one',samples:2,fetchPage:async (url:string)=>
    new Response('<h1>'+new URL(url).pathname.split('/').at(-1)+'</h1>',{status:200,
      headers:{'content-type':'text/html'}})});
  initializeComponentChecks(db);
  return db;
}
const html=(body:string,status=200)=>
  new Response('<!doctype html><html><title>Registry</title><body>'+body+'</body></html>',
    {status,headers:{'content-type':'text/html'}});
describe('individual component URL verification',()=>{
  it('seeds exact nested component candidates without inventing an unverified-registry URL',async()=>{
    const db=await fixture();
    const coverage=seedComponentCandidates(db,{catalog});
    expect(coverage).toMatchObject({indexed:5,candidates:5,missing:0});
    expect(db.prepare("SELECT slug,url,status FROM component_url_checks WHERE namespace='@one' AND slug='forms/input'").get())
      .toEqual({slug:'forms/input',url:'https://one.example/components/forms/input',status:'pending'});
    expect(db.prepare("SELECT url,source,status FROM component_url_checks WHERE namespace='@two' AND slug='button'").get())
      .toEqual({url:'https://two.example/docs/button',source:'hypothesis',status:'pending'});
    db.close();
  });
  it('accepts title-verified pages and records missing pages without a false positive',async()=>{
    const db=await fixture();seedComponentCandidates(db,{catalog});
    const fetched:string[]=[];
    const result=await verifyComponentCandidates(db,{registry:'@one',maxPages:4,delayMs:0,
      fetchPage:async (url:string)=>{
        fetched.push(url);
        if(url.endsWith('/absent'))return html('<h1>Not Found</h1>',404);
        if(url.endsWith('/card-grid'))return html('<h1>Elegant Card Grid</h1>');
        return html('<h1>'+(new URL(url).pathname.split('/').at(-1)??'').replace(/-/g,' ')+'</h1>');
      }});
    expect(result).toMatchObject({checked:4,verified:3,missing:1});
    expect(fetched).toHaveLength(4);
    expect(db.prepare("SELECT status FROM component_url_checks WHERE namespace='@one' AND slug='card-grid'").get()).toEqual({status:'verified'});
    expect(db.prepare("SELECT status,reason FROM component_url_checks WHERE namespace='@one' AND slug='absent'").get()).toEqual({status:'missing',reason:'http-404'});
    db.close();
  });
  it('keeps soft-404 pages, redirects, generic shells and off-origin pages unverified',async()=>{
    const db=await fixture();seedComponentCandidates(db,{catalog});
    await verifyComponentCandidates(db,{registry:'@one',maxPages:4,delayMs:0,fetchPage:async (url:string)=>{
      if(url.endsWith('/button'))return html('<h1>Page not found</h1>');
      if(url.endsWith('/card-grid'))return new Response('<h1>Elegant Card Grid</h1>',{
        status:200,headers:{'content-type':'text/html','location':'https://evil.example/'},});
      if(url.endsWith('/absent'))return html('<h1>Missing</h1>',200);
      return new Response('<h1>Form Input</h1>',{status:301,headers:{location:'https://evil.example'}});
    }});
    expect(db.prepare("SELECT status FROM component_url_checks WHERE namespace='@one' AND slug='button'").get()).toEqual({status:'unresolved'});
    expect(db.prepare("SELECT status FROM component_url_checks WHERE namespace='@one' AND slug='forms/input'").get()).toEqual({status:'unresolved'});
    expect(db.prepare("SELECT status FROM component_url_checks WHERE namespace='@one' AND slug='card-grid'").get()).toEqual({status:'verified'});
    db.close();
  });
  it('resumes without refetching verified/missing records; changes reset stale evidence',async()=>{
    const db=await fixture();seedComponentCandidates(db,{catalog});
    let count=0;
    const fetchPage=async(url:string)=>{count++;return html('<h1>'+url.split('/').at(-1)+'</h1>')};
    await verifyComponentCandidates(db,{registry:'@one',maxPages:2,delayMs:0,fetchPage});
    expect(count).toBe(2);
    await verifyComponentCandidates(db,{registry:'@one',maxPages:2,delayMs:0,fetchPage});
    expect(count).toBe(4);
    await verifyComponentCandidates(db,{registry:'@one',maxPages:2,delayMs:0,fetchPage});
    expect(count).toBe(4);
    db.prepare("UPDATE item_routes SET source_url=? WHERE namespace='@one' AND slug='button'")
      .run('https://one.example/components/button-new');
    seedComponentCandidates(db,{catalog});
    expect(db.prepare("SELECT status,attempts FROM component_url_checks WHERE namespace='@one' AND slug='button'").get())
      .toEqual({status:'pending',attempts:0});
    db.close();
  });
  it('keeps a slug unresolved when multiple distinct unverified route families compete',()=>{
    const db=new DatabaseSync(':memory:');
    const source={name:'@ambiguous',homepage:'https://ambiguous.example'};
    importRegistryPatterns(db,{
      raw:[source],catalog:{registries:{'@ambiguous':[{name:'button',title:'Button'}]}},
      inventory:{schema:'registry-atlas-traversal-inventory/v1',registries:[{
        namespace:'@ambiguous',homepage:source.homepage,
        patterns:[
          {urlTemplate:'https://ambiguous.example/docs/{slug}',slugPrefix:'',
            examples:[{slug:'button',url:'https://ambiguous.example/docs/button'}]},
          {urlTemplate:'https://ambiguous.example/blocks/{slug}',slugPrefix:'',
            examples:[{slug:'button',url:'https://ambiguous.example/blocks/button'}]},
        ],sitemapPatterns:[],sitemapPages:[],
      }]},
    });
    seedComponentCandidates(db,{catalog:{registries:{'@ambiguous':[
      {name:'button',title:'Button'}]}}});
    expect(db.prepare("SELECT url,status,reason FROM component_url_checks WHERE namespace='@ambiguous' AND slug='button'").get())
      .toEqual({url:null,status:'unresolved',reason:'multiple-possible-route-patterns'});
    db.close();
  });
  it('promotes a JavaScript-hydrated component only with a matching browser URL and identity',async()=>{
    const db=await fixture();seedComponentCandidates(db,{catalog});
    db.prepare("UPDATE component_url_checks SET status='missing' WHERE namespace='@one' AND slug='absent'").run();
    const results=await verifyComponentCandidates(db,{registry:'@one',maxPages:1,delayMs:0,
      fetchPage:async()=>html('<div id="app"></div>'),
      browserPage:async(url:string,slug:string,home:string,title:string)=>{
        expect(new URL(url).origin).toBe(new URL(home).origin);
        expect(title).toBe('Button');
        return {status:'verified',observedUrl:url,observedHeading:'Button',observedIdentity:slug};
      },
    });
    expect(results.checked).toBe(1);
    expect(results.verified).toBe(1);
    db.close();
  });

  it('does not let a browser or model claim success without the observed component heading',async()=>{
    const db=await fixture();seedComponentCandidates(db,{catalog});
    db.prepare("UPDATE component_url_checks SET status='missing' WHERE namespace='@one' AND slug='absent'").run();
    const result=await verifyComponentCandidates(db,{registry:'@one',maxPages:1,delayMs:0,
      fetchPage:async()=>html('<div id="app"></div>'),
      browserPage:async(url:string,slug:string)=>({
        status:'verified',observedUrl:url,observedHeading:'Unrelated Component',
        observedIdentity:slug,
      }),
    });
    expect(result.verified).toBe(0);
    expect(db.prepare("SELECT status FROM component_url_checks WHERE namespace='@one' AND slug='button'").get())
      .toEqual({status:'unresolved'});
    db.close();
  });

  it('exports ONE registry-grouped queue with all unresolved slugs and pattern failures',async()=>{
    const db=await fixture();seedComponentCandidates(db,{catalog});
    const queue=exportComponentQueue(db);
    expect(queue.registries.find((r:any)=>r.namespace==='@one')).toMatchObject({
      namespace:'@one',unverifiedItems:4,
    });
    const group=queue.registries.find((r:any)=>r.namespace==='@one');
    expect(group.slugs.map((s:any)=>s.slug)).toEqual(['absent','button','card-grid','forms/input']);
    expect(group.patterns).toEqual(expect.arrayContaining([
      expect.objectContaining({template:'https://one.example/components/{slug}'})
    ]));
    expect(queue.registries.find((r:any)=>r.namespace==='@two').slugs)
      .toEqual(expect.arrayContaining([expect.objectContaining({slug:'button',source:'hypothesis',status:'pending'})]));
    db.close();
  });
});
