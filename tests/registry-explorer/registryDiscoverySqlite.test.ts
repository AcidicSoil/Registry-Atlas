import {describe,expect,it} from 'vitest';
// @ts-expect-error Node builtin is used by the standalone scripts.
import {DatabaseSync} from 'node:sqlite';
// @ts-expect-error Standalone Node ESM helper.
import {discoverRegistryIntoSqlite} from '../../scripts/discover-registry-routes-to-sqlite.mjs';
// @ts-expect-error Standalone Node ESM helper.
import {reconcileRegistryCatalog} from '../../scripts/verify-registry-patterns.mjs';

type Page={heading?:string;links?:Array<[string,string]>};
function fakeBrowser(pages:Record<string,Page>,initial:string){
  let current=initial;
  const page=()=>pages[current]??{heading:'Unknown',links:[]};
  return {
    async url(){return current;},
    async snap(){return {url:current,nodes:[
      ...(page().heading?[{role:'heading',name:page().heading}]:[]),
      ...(page().links??[]).map(([name],i)=>({role:'link',name,ref:'e'+i})),
    ]};},
    async attr(ref:string){return page().links?.[Number(ref.slice(1))]?.[1];},
    async domLinks(){return (page().links??[]).map(([name,href])=>({name,href}));},
    async nav(url:string){current=url;},
  };
}
const registry={name:'@discover',homepage:'https://discover.example'};
const catalog={registries:{'@discover':[
  {name:'button',title:'Button'},{name:'card',title:'Card'},{name:'dialog',title:'Dialog'},
]}};
const pages:Record<string,Page>={
  'https://discover.example/':{links:[['Docs','/docs']]},
  'https://discover.example/docs':{heading:'Docs',links:[['Components','/docs/components']]},
  'https://discover.example/docs/components':{heading:'Components',links:[
    ['Button','/docs/components/button'],['Card','/docs/components/card'],
  ]},
  'https://discover.example/docs/components/button':{heading:'Button'},
  'https://discover.example/docs/components/card':{heading:'Card'},
};
const fetchPage=async(url:string)=>{
  const slug=new URL(url).pathname.split('/').filter(Boolean).at(-1)??'';
  const heading=slug.split('-').map(part=>part[0]?.toUpperCase()+part.slice(1)).join(' ');
  return new Response('<!doctype html><html><title>'+heading+'</title><h1>'+heading+'</h1></html>',{
    status:200,headers:{'content-type':'text/html'},
  });
};

describe('browser discovery -> SQLite route verification',()=>{
  it('discovers one route family, verifies it, infers the remaining slug, and verifies generated pages',async()=>{
    const db=new DatabaseSync(':memory:');
    reconcileRegistryCatalog(db,{raw:[registry],catalog,curated:{}});
    const result=await discoverRegistryIntoSqlite({
      db,registry,indexedItems:['button','card','dialog'],catalog,curated:{},
      browser:fakeBrowser(pages,'https://discover.example/'),
      checkedAt:'2026-10-05T03:00:00.000Z',limit:2,maxPages:4,maxDepth:3,maxLinks:50,
      delayMs:0,samples:2,componentChecks:3,fetchPage,
    });
    expect(result.derived).toMatchObject({patterns:1,matchedItems:2,verifiedObservedPages:2});
    expect(result.merged).toMatchObject({newPatterns:1,newExamples:2});
    expect(result.patternVerification).toMatchObject({verifiedPatterns:1});
    expect(db.prepare("SELECT template,status FROM route_patterns WHERE namespace='@discover'").get())
      .toEqual({template:'https://discover.example/docs/components/{slug}',status:'verified'});
    expect(db.prepare("SELECT source_url,status FROM item_routes WHERE namespace='@discover' AND slug='dialog'").get())
      .toEqual({source_url:'https://discover.example/docs/components/dialog',status:'pattern-inferred'});
    expect(db.prepare("SELECT status FROM component_url_checks WHERE namespace='@discover' AND slug='dialog'").get())
      .toEqual({status:'verified'});
    db.close();
  });

  it('follows an observed generic entry link when its URL enters a docs/components section',async()=>{
    const db=new DatabaseSync(':memory:');
    reconcileRegistryCatalog(db,{raw:[registry],catalog,curated:{}});
    const result=await discoverRegistryIntoSqlite({
      db,registry,indexedItems:['button','card','dialog'],catalog,curated:{},
      browser:fakeBrowser({
        'https://discover.example/':{links:[['Get Started','/docs/components/dialog']]},
        'https://discover.example/docs/components/dialog':{heading:'Dialog',links:[
          ['Button','/docs/components/button'],['Card','/docs/components/card'],
        ]},
        'https://discover.example/docs/components/button':{heading:'Button'},
        'https://discover.example/docs/components/card':{heading:'Card'},
      },'https://discover.example/'),
      checkedAt:'2026-10-05T03:00:00.000Z',limit:2,maxPages:4,maxDepth:3,maxLinks:50,
      delayMs:0,samples:2,componentChecks:0,fetchPage,
    });
    expect(result.derived.patterns).toBe(1);
    expect(result.merged.newPatterns).toBe(1);
    expect(db.prepare("SELECT template,status FROM route_patterns WHERE namespace='@discover'").get())
      .toEqual({template:'https://discover.example/docs/components/{slug}',status:'verified'});
    db.close();
  });

  it('does not add a route family from only unrelated navigation',async()=>{
    const db=new DatabaseSync(':memory:');
    reconcileRegistryCatalog(db,{raw:[registry],catalog,curated:{}});
    const result=await discoverRegistryIntoSqlite({
      db,registry,indexedItems:['button','card','dialog'],catalog,curated:{},
      browser:fakeBrowser({
        'https://discover.example/':{links:[['About','/about']]},
        'https://discover.example/about':{heading:'About'},
      },'https://discover.example/'),
      checkedAt:'2026-10-05T03:00:00.000Z',limit:2,maxPages:3,maxDepth:2,maxLinks:20,
      delayMs:0,samples:2,componentChecks:0,fetchPage,
    });
    expect(result.derived.patterns).toBe(0);
    expect(result.merged.newPatterns).toBe(0);
    expect(db.prepare("SELECT COUNT(*) n FROM route_patterns WHERE namespace='@discover'").get())
      .toEqual({n:0});
    db.close();
  });
});
