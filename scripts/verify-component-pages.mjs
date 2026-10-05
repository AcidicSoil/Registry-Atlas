import { DatabaseSync } from 'node:sqlite';
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { initializePatternDatabase, safePage, resolvePattern, managedBrowserPatternProof, reconcileRegistryCatalog } from './verify-registry-patterns.mjs';

const REFRESH_MS = 30 * 86400000;
const normalize = text => String(text ?? '').replace(/<[^>]*>/g,' ').replace(/&(?:amp|nbsp);/g,' ')
  .normalize('NFKC').toLowerCase().replace(/[-_/]+/g,' ')
  .replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
const key=(namespace,slug)=>namespace+'/'+slug;

export function initializeComponentChecks(db) {
  initializePatternDatabase(db);
  const existing=db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='component_url_checks'").get()?.sql;
  if(existing && !existing.includes("'hypothesis'")) {
    db.exec('BEGIN IMMEDIATE');
    try {
      db.exec('ALTER TABLE component_url_checks RENAME TO component_url_checks_previous');
      db.exec(`CREATE TABLE component_url_checks(
        namespace TEXT NOT NULL REFERENCES sources(namespace),slug TEXT NOT NULL,url TEXT,
        source TEXT NOT NULL CHECK(source IN('pattern','sitemap','hypothesis','none','conflict')),
        title TEXT NOT NULL,status TEXT NOT NULL CHECK(status IN('pending','verified','missing','unresolved','transient')),
        reason TEXT,http_status INTEGER,checked_at TEXT,attempts INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY(namespace,slug),
        FOREIGN KEY(namespace,slug) REFERENCES item_routes(namespace,slug) ON DELETE CASCADE
      );
      INSERT INTO component_url_checks SELECT * FROM component_url_checks_previous;
      DROP TABLE component_url_checks_previous;`);
      db.exec('COMMIT');
    } catch(error) {db.exec('ROLLBACK');throw error;}
  }
  db.exec(`
    CREATE TABLE IF NOT EXISTS component_url_checks(
      namespace TEXT NOT NULL REFERENCES sources(namespace),
      slug TEXT NOT NULL,
      url TEXT,
      source TEXT NOT NULL CHECK(source IN('pattern','sitemap','hypothesis','none','conflict')),
      title TEXT NOT NULL,
      status TEXT NOT NULL CHECK(status IN('pending','verified','missing','unresolved','transient')),
      reason TEXT,
      http_status INTEGER,
      checked_at TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(namespace,slug),
      FOREIGN KEY(namespace,slug) REFERENCES item_routes(namespace,slug) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_component_url_status ON component_url_checks(status,namespace);
  `);
}

export function seedComponentCandidates(db,{catalog}){
  if(!catalog?.registries || typeof catalog.registries !== 'object')throw Error('Catalog required');
  initializeComponentChecks(db);
  const titles=new Map();
  for(const [namespace,items] of Object.entries(catalog.registries)){
    for(const item of items){
      const k=key(namespace,item.name);
      if(!titles.has(k))titles.set(k,typeof item.title==='string'?item.title:item.name);
    }
  }
  const sitemap=new Map();
  for(const r of db.prepare('SELECT namespace,slug,url FROM sitemap_links ORDER BY namespace,slug,url').all()){
    const k=key(r.namespace,r.slug);
    const arr=sitemap.get(k)??new Set();
    arr.add(r.url);
    sitemap.set(k,arr);
  }
  const patterns=new Map();
  for(const p of db.prepare('SELECT namespace,template,prefix FROM route_patterns ORDER BY namespace,template').all()) {
    const list=patterns.get(p.namespace)??[];
    list.push(p);patterns.set(p.namespace,list);
  }
  const rows=db.prepare(`
    SELECT i.namespace,i.slug,i.source_url AS patternUrl,i.status AS patternStatus,
      s.homepage
    FROM item_routes i JOIN sources s USING(namespace)
    ORDER BY i.namespace,i.slug
  `).all();
  const upsert=db.prepare(`
    INSERT INTO component_url_checks(namespace,slug,url,source,title,status,reason)
      VALUES(?,?,?,?,?,?,?)
    ON CONFLICT(namespace,slug) DO UPDATE SET
      url=excluded.url,source=excluded.source,title=excluded.title,
      status=excluded.status,reason=excluded.reason,
      checked_at=NULL,attempts=0,http_status=NULL
    WHERE component_url_checks.url IS NOT excluded.url
      OR component_url_checks.source IS NOT excluded.source
      OR component_url_checks.title IS NOT excluded.title
  `);
  let candidates=0,missing=0,conflicts=0;
  db.exec('BEGIN IMMEDIATE');
  try{
    for(const row of rows){
      const matches=sitemap.get(key(row.namespace,row.slug))??new Set();
      const match=matches.size===1?[...matches][0]:null;
      const pattern=row.patternStatus==='unverified'?null:row.patternUrl;
      const hypotheses=(!pattern && !match)
        ?[...new Set((patterns.get(row.namespace)??[]).map(p=>resolvePattern({
          urlTemplate:p.template,slugPrefix:p.prefix},row.slug,row.homepage)).filter(Boolean))]
        :[];
      const uniqueHypothesis=hypotheses.length===1?hypotheses[0]:null;
      const hasConflict=matches.size>1||(pattern && match && pattern!==match);
      let url=null,source='none',status='unresolved',reason='no-unambiguous-verified-route';
      if(hasConflict){source='conflict';reason='conflicting-official-route-evidence';conflicts++;}
      else{
        const candidate=match??pattern??uniqueHypothesis;
        const confirmed=candidate?safePage(candidate,row.homepage):null;
        if(confirmed){url=confirmed;source=match?'sitemap':pattern?'pattern':'hypothesis';status='pending';reason=null;candidates++;}
        else {if(hypotheses.length>1)reason='multiple-possible-route-patterns';missing++;}
      }
      upsert.run(row.namespace,row.slug,url,source,titles.get(key(row.namespace,row.slug))??row.slug,status,reason);
    }
    db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  return {indexed:rows.length,candidates,missing,conflicts};
}
const timeout = (milliseconds) => AbortSignal.timeout(milliseconds);
async function boundedRead(response,limit=1024*1024){
  if(Number(response.headers.get('content-length')??0)>limit)throw Error('response-too-large');
  const reader=response.body?.getReader();
  if(!reader)return '';
  const chunks=[];let size=0;
  try{
    while(true){
      const {done,value}=await reader.read();if(done)break;
      size+=value.byteLength;
      if(size>limit)throw Error('response-too-large');
      chunks.push(value);
    }
  }finally{await reader.cancel().catch(()=>{});}
  const buffer=new Uint8Array(size);let pos=0;
  for(const b of chunks){buffer.set(b,pos);pos+=b.length;}
  return new TextDecoder().decode(buffer);
}
export async function inspectComponentPage({url,slug,title,homepage,fetchPage=fetch,timeoutMs=9000}){
  if(!url || safePage(url,homepage)!==url)return {status:'unresolved',reason:'unsafe-or-off-origin-url'};
  let response;
  try{
    response=await fetchPage(url,{redirect:'manual',signal:timeout(timeoutMs),
      headers:{'user-agent':'RegistryAtlas-page-verifier/1.0','accept':'text/html'}});
    if(response.redirected || (response.url && response.url!==url))
      return {status:'unresolved',reason:'redirect-or-origin-change'};
    if([404,410].includes(response.status))
      return {status:'missing',reason:'http-'+response.status,httpStatus:response.status};
    if([408,429].includes(response.status)||response.status>=500)
      return {status:'transient',reason:'http-'+response.status,httpStatus:response.status};
    if(response.status!==200)
      return {status:'unresolved',reason:'http-'+response.status,httpStatus:response.status};
    if(!/text\/html/i.test(response.headers.get('content-type')??''))
      return {status:'unresolved',reason:'non-html',httpStatus:response.status};
    const html=await boundedRead(response);
    const content=html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'')
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi,'');
    const h1=normalize(/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(content)?.[1]);
    const pageTitle=normalize(/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(content)?.[1]);
    const names=[slug.split('/').at(-1),title].map(normalize).filter(Boolean);
    const match=names.some(name=>h1===name || pageTitle===name
      || pageTitle.startsWith(name+' '));
    if(match && !/^(404|not found|page not found|error)$/i.test(h1))
      return {status:'verified',reason:null,httpStatus:200};
    return {status:'unresolved',reason:'component-identity-mismatch',httpStatus:200};
  }catch(error){
    if(String(error?.message)==='response-too-large')
      return {status:'unresolved',reason:'response-too-large',httpStatus:null};
    return {status:'transient',reason:'network-or-timeout',httpStatus:null};
  }
}
export async function verifyComponentCandidates(db,{registry=null,maxPages=20,delayMs=1200,
  maxPerRegistry=5,attemptLimit=3,fetchPage=fetch,browserPage=null,
  retryFailed=false,now=new Date().toISOString(),refreshMs=REFRESH_MS,onProgress=null}={}){
  if(!Number.isSafeInteger(maxPages)||maxPages<1||maxPages>100000
    ||!Number.isSafeInteger(maxPerRegistry)||maxPerRegistry<1||maxPerRegistry>100000
    ||!Number.isSafeInteger(attemptLimit)||attemptLimit<1||attemptLimit>20
    ||!Number.isSafeInteger(delayMs)||delayMs<0||delayMs>60000)
    throw Error('Invalid verification batch limits');
  initializeComponentChecks(db);
  const rows=db.prepare(`
    SELECT c.namespace,c.slug,c.url,c.source,c.title,c.status,c.reason,c.attempts,
      c.checked_at,s.homepage
    FROM component_url_checks c JOIN sources s USING(namespace)
    WHERE c.url IS NOT NULL
    ORDER BY CASE WHEN c.status='pending' THEN 0 ELSE 1 END,c.namespace,c.slug
  `).all();
  const set=db.prepare(`
    UPDATE component_url_checks SET status=?,reason=?,http_status=?,checked_at=?,attempts=attempts+1
    WHERE namespace=? AND slug=? AND url=?
  `);
  const refreshed=Date.parse(now)-refreshMs;
  const perSource=new Map();
  let checked=0,verified=0,missing=0,unresolved=0,transient=0,skipped=0;
  for(const row of rows){
    if(checked>=maxPages)break;
    if(registry && registry!==row.namespace)continue;
    const staleVerified=row.status==='verified' && Date.parse(row.checked_at)<refreshed;
    const eligible = row.status==='pending' || staleVerified || (
      row.attempts<attemptLimit && (row.status==='transient'
        || (retryFailed && ['unresolved','missing'].includes(row.status)))
    );
    if(!eligible){skipped++;continue;}
    if((perSource.get(row.namespace)??0)>=maxPerRegistry)continue;
    perSource.set(row.namespace,(perSource.get(row.namespace)??0)+1);
    let result=await inspectComponentPage({url:row.url,slug:row.slug,
      title:row.title,homepage:row.homepage,fetchPage});
    if(result.reason==='component-identity-mismatch' && typeof browserPage==='function'){
      const observed=await browserPage(row.url,row.slug,row.homepage,row.title)
        .catch(()=>({status:'failed',reason:'browser-error'}));
      const heading=normalize(observed.observedHeading);
      const validHeading=heading && !['404','not found','page not found','error'].includes(heading)
        && [row.slug.split('/').at(-1),row.title].map(normalize).includes(heading);
      if(observed.status==='verified' && observed.observedUrl===row.url && validHeading)
        result={status:'verified',reason:null,httpStatus:200};
      else result={status:'unresolved',reason:observed.reason??'browser-identity-mismatch',httpStatus:200};
    }
    set.run(result.status,result.reason,result.httpStatus??null,now,row.namespace,row.slug,row.url);
    checked++;
    if(result.status==='verified')verified++;
    else if(result.status==='missing')missing++;
    else if(result.status==='transient')transient++;
    else unresolved++;
    if(typeof onProgress==='function')onProgress({checked,verified,missing,unresolved,transient,
      namespace:row.namespace,slug:row.slug,status:result.status});
    if(delayMs && checked<maxPages)
      await new Promise(done=>setTimeout(done,delayMs));
  }
  return {checked,verified,missing,unresolved,transient,skipped};
}

export function exportComponentQueue(db){
  initializeComponentChecks(db);
  const groups=new Map();
  const raw=db.prepare('SELECT namespace,homepage FROM sources ORDER BY namespace').all();
  for(const row of raw)groups.set(row.namespace,{namespace:row.namespace,homepage:row.homepage,
    unverifiedItems:0,verifiedItems:0,patterns:[],slugs:[]});
  const patternSlugs=new Map();
  for(const ex of db.prepare('SELECT pattern_id,slug FROM examples ORDER BY pattern_id,slug').all()){
    const arr=patternSlugs.get(ex.pattern_id)??[];
    arr.push(ex.slug);patternSlugs.set(ex.pattern_id,arr);
  }
  for(const p of db.prepare('SELECT * FROM route_patterns ORDER BY namespace,template').all()){
    const group=groups.get(p.namespace);
    group.patterns.push({id:p.id,template:p.template,prefix:p.prefix,status:p.status,
      reason:p.failure,checkedAt:p.checked_at,observedSlugs:patternSlugs.get(p.id)??[]});
  }
  let pending=0,verified=0,missing=0;
  for(const row of db.prepare(`SELECT c.namespace,c.slug,c.url,c.source,c.status,c.reason,
    c.attempts,c.checked_at,i.pattern_id
    FROM component_url_checks c JOIN item_routes i USING(namespace,slug)
    ORDER BY c.namespace,c.slug`).all()){
    const group=groups.get(row.namespace);
    if(row.status==='verified'){verified++;group.verifiedItems++;continue;}
    pending++;group.unverifiedItems++;
    if(!row.url)missing++;
    group.slugs.push({slug:row.slug,url:row.url,status:row.status,
      reason:row.reason,source:row.source,patternId:row.pattern_id,attempts:row.attempts});
  }
  const registries=[...groups.values()].filter(row=>row.unverifiedItems>0
    ||row.patterns.some(p=>p.status!=='verified'));
  return {schema:'registry-atlas-component-verification-queue/v1',
    totals:{registries:groups.size,unresolvedRegistries:registries.length,
      indexed:pending+verified,verified,unresolved:pending,missingCandidates:missing},
    registries};
}
async function main(argv){
  if(argv.includes('--help')){
    console.log('Usage: --db FILE [--catalog FILE] [--report FILE] [--report-only] [--registry @namespace] [--all] [--max-pages 20] [--max-per-registry 5] [--delay-ms 1200] [--attempt-limit 3] [--retry-failed] [--profile NAME --browser-server URL --browser-tab ID]');
    return;
  }
  const get=flag=>argv.includes(flag)?argv[argv.indexOf(flag)+1]:null;
  const dbFile=get('--db')??'data/shadcn/registry-patterns.sqlite';
  const catalogFile=get('--catalog')??'public/data/registry-catalog-items.json';
  await mkdir(dirname(resolve(dbFile)),{recursive:true});
  const db=new DatabaseSync(resolve(dbFile));
  db.exec('PRAGMA journal_mode=WAL;PRAGMA foreign_keys=ON;PRAGMA busy_timeout=5000;');
  try{
    const [catalog,raw,curated]=await Promise.all([
      readFile(catalogFile,'utf8').then(JSON.parse),
      readFile('data/shadcn/registries.raw.json','utf8').then(JSON.parse),
      readFile('data/shadcn/registry-items.json','utf8').then(JSON.parse),
    ]);
    const reconciled=reconcileRegistryCatalog(db,{raw,catalog,curated});
    const seeded=seedComponentCandidates(db,{catalog});
    const browserPage=get('--profile')&&get('--browser-server')&&get('--browser-tab')
      ?managedBrowserPatternProof({profile:get('--profile'),
        server:get('--browser-server'),tab:get('--browser-tab')}) : null;
    const checked=argv.includes('--report-only')?null:await verifyComponentCandidates(db,{
      registry:get('--registry'),maxPages:Number(get('--max-pages')??(argv.includes('--all')?100000:20)),
      delayMs:Number(get('--delay-ms')??1200),
      maxPerRegistry:Number(get('--max-per-registry')??(argv.includes('--all')?100000:5)),
      attemptLimit:Number(get('--attempt-limit')??3),
      retryFailed:argv.includes('--retry-failed'),browserPage,
      onProgress:row=>{if(row.checked%25===0)console.error(JSON.stringify(row));},
    });
    const queue=exportComponentQueue(db);
    if(get('--report'))await writeFile(get('--report'),JSON.stringify(queue,null,2)+'\n');
    console.log(JSON.stringify({reconciled,seeded,checked,coverage:queue.totals}));
  }finally{db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).catch(error=>{console.error(error);process.exitCode=1;});
