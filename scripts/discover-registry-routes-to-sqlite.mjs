import { DatabaseSync } from 'node:sqlite';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import { PinchTabBrowser } from './collect-browser-link-evidence.mjs';
import { discoverRegistry } from './lib/registry-discovery.mjs';
import { deriveTraversalInventory } from './derive-registry-traversal-patterns.mjs';
import { configureManagedSourceBrowser, checkedSourceProfile } from './discover-registry-components.mjs';
import {
  mergeDiscoveredPatterns, verifyRegistryPatterns, managedBrowserPatternProof,
  reconcileRegistryCatalog,
} from './verify-registry-patterns.mjs';
import { seedComponentCandidates, verifyComponentCandidates } from './verify-component-pages.mjs';
import { openAtlasCoreDatabase, readAtlasState } from './lib/atlas-storage.mjs';

function memoryLedger(namespace) {
  const rows=new Map();
  rows.history=[];
  return {
    rows,
    get: token=>rows.get(token),
    append: async row=>{
      rows.set(row.token,row);
      if(row.token==='registry:'+namespace)rows.history.push(row);
    },
  };
}

export async function discoverRegistryIntoSqlite({
  db,registry,indexedItems,catalog,curated={},browser,
  checkedAt=new Date().toISOString(),limit=20,maxPages=40,maxDepth=4,maxLinks=1500,
  delayMs=1000,samples=2,componentChecks=5,fetchPage=fetch,browserPage=null,
}={}) {
  if(!db||!registry||!Array.isArray(indexedItems)||!catalog?.registries||!browser)
    throw Error('Missing discovery inputs');
  const ledger=memoryLedger(registry.name);
  const discovery=await discoverRegistry({
    registry,indexedItems,browser,ledger,checkedAt,limit,maxPages,maxDepth,maxLinks,delayMs,
  });
  const traversal=deriveTraversalInventory(
    [registry],catalog,curated,{[registry.name]:ledger.rows},checkedAt,{},
  );
  const observed=traversal.registries[0];
  const merged=mergeDiscoveredPatterns(db,{
    namespace:registry.name,homepage:registry.homepage,patterns:observed.patterns,
  });
  const patternVerification=await verifyRegistryPatterns(db,{
    registry:registry.name,samples,fetchPage,checkedAt,browserPage,
  });
  const candidates=seedComponentCandidates(db,{catalog});
  const componentVerification=componentChecks>0
    ?await verifyComponentCandidates(db,{
      registry:registry.name,maxPages:componentChecks,maxPerRegistry:componentChecks,
      delayMs,fetchPage,browserPage,now:checkedAt,
    }):null;
  return {
    namespace:registry.name,
    discovery:{
      processed:discovery.processed,pending:discovery.pending,
      observedPages:discovery.records.filter(row=>row?.status==='page-observed').length,
      listingPages:discovery.listings.length,
    },
    derived:{
      patterns:observed.patterns.length,
      matchedItems:observed.matchedAnchorCount,
      verifiedObservedPages:observed.verifiedPageCount,
    },
    merged,patternVerification,
    candidateTotals:candidates,
    componentVerification,
  };
}

function parseArgs(argv) {
  const valued=new Set(['--db','--registry','--profile','--server','--tab','--limit',
    '--max-pages','--max-depth','--max-links','--delay-ms','--samples','--component-checks']);
  const opts={};
  for(let i=0;i<argv.length;i++){
    const key=argv[i];
    if(!valued.has(key)||Object.hasOwn(opts,key))throw Error('Unknown or repeated argument: '+key);
    const value=argv[++i];
    if(!value||value.startsWith('--'))throw Error('Missing value for '+key);
    opts[key]=value;
  }
  for(const key of ['--registry','--profile','--server','--tab'])
    if(!opts[key])throw Error('Missing required '+key);
  const number=(key,fallback,min,max)=>{
    const value=opts[key]===undefined?fallback:Number(opts[key]);
    if(!Number.isSafeInteger(value)||value<min||value>max)throw Error('Invalid '+key);
    return value;
  };
  return {
    db:opts['--db']??'data/registry-atlas.sqlite',
    registry:opts['--registry'],profile:opts['--profile'],server:opts['--server'],tab:opts['--tab'],
    limit:number('--limit',20,1,200),maxPages:number('--max-pages',40,1,250),
    maxDepth:number('--max-depth',4,0,10),maxLinks:number('--max-links',1500,1,10000),
    delayMs:number('--delay-ms',1000,0,60000),samples:number('--samples',2,1,12),
    componentChecks:number('--component-checks',5,0,200),
  };
}

export async function main(argv,cwd=process.cwd()) {
  const options=parseArgs(argv);
  const core=openAtlasCoreDatabase(cwd,{readOnly:true});
  const state=readAtlasState(core);
  core.close();
  const raw=state.rawRegistries,catalog=state.catalog,curated=state.curated;
  const registry=raw.find(row=>row.name===options.registry);
  if(!registry)throw Error('Unknown exact registry namespace');
  const indexedItems=[...new Set([
    ...(catalog.registries[registry.name]??[]).map(item=>item.name),
    ...(curated[registry.name]??[]).map(item=>item.slug),
  ])].filter(value=>typeof value==='string').sort();
  const db=new DatabaseSync(options.db);
  db.exec('PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;');
  try{
    reconcileRegistryCatalog(db,{raw,catalog,curated});
    checkedSourceProfile(options,registry);
    const browser=configureManagedSourceBrowser(new PinchTabBrowser(options.server,options.tab));
    const browserPage=managedBrowserPatternProof({
      profile:options.profile,server:options.server,tab:options.tab,
    });
    return await discoverRegistryIntoSqlite({
      db,registry,indexedItems,catalog,curated,browser,browserPage,
      limit:options.limit,maxPages:options.maxPages,maxDepth:options.maxDepth,
      maxLinks:options.maxLinks,delayMs:options.delayMs,samples:options.samples,
      componentChecks:options.componentChecks,
    });
  } finally {db.close();}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).then(result=>console.log(JSON.stringify(result,null,2)))
    .catch(error=>{console.error('SQLite route discovery failed: '+error.message);process.exitCode=1;});
