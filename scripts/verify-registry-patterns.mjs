import { DatabaseSync } from 'node:sqlite';
import { readFile, mkdir, writeFile } from 'node:fs/promises';
import { resolve, dirname } from 'node:path';
import { isIP } from 'node:net';
import { pathToFileURL } from 'node:url';
import { catalogFingerprint } from './lib/registry-discovery.mjs';

const PATTERN_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const identity = text => String(text).toLowerCase().replace(/[-_/]+/g,' ')
  .replace(/[^a-z0-9 ]/g,'').replace(/\s+/g,' ').trim();
const validSlug = value => typeof value==='string' && value.split('/')
  .every(part=>/^[a-z0-9][a-z0-9._-]*$/i.test(part));
function publicHome(raw) {
  try {
    const u=new URL(raw);
    if(u.protocol!=='https:' || u.username || u.password || u.port ||
      isIP(u.hostname) || !u.hostname.includes('.') ||
      /(^localhost$|\.local$|\.internal$|\.localhost$)/.test(u.hostname))return null;
    return u;
  } catch { return null; }
}
function safePage(raw,root) {
  const home=publicHome(root),page=publicHome(raw);
  if(!home || !page || page.origin!==home.origin || page.hash ||
    /%2f|%5c|%00/i.test(page.pathname) ||
    /\.(?:json|js|css|svg|png|jpe?g|webp|pdf|woff2?|map)\/?$/i.test(page.pathname) ||
    page.pathname.replace(/\/+$/,'')===home.pathname.replace(/\/+$/,''))return null;
  return page.href;
}
function resolvePattern(pattern,slug,homepage) {
  if(!validSlug(slug)||typeof pattern.slugPrefix!=='string'||
    !slug.startsWith(pattern.slugPrefix) ||
    typeof pattern.urlTemplate!=='string'||
    !/^(?:[^{}])*(?:\{slug\}|\{leaf\})(?:[^{}])*$/.test(pattern.urlTemplate))return null;
  const remainder=slug.slice(pattern.slugPrefix.length);
  if(!validSlug(remainder))return null;
  const encoded=remainder.split('/').map(encodeURIComponent).join('/');
  return safePage(pattern.urlTemplate.replace(/\{slug\}|\{leaf\}/,encoded),homepage);
}
export function initializePatternDatabase(db) {
  db.exec(`
    PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS sources(
      namespace TEXT PRIMARY KEY, homepage TEXT NOT NULL, fingerprint TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS route_patterns(
      id INTEGER PRIMARY KEY,namespace TEXT NOT NULL REFERENCES sources(namespace),
      template TEXT NOT NULL,prefix TEXT NOT NULL,source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unverified', checked_at TEXT, failure TEXT,
      UNIQUE(namespace,template,prefix));
    CREATE TABLE IF NOT EXISTS examples(
      pattern_id INTEGER NOT NULL REFERENCES route_patterns(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,url TEXT NOT NULL,PRIMARY KEY(pattern_id,slug,url));
    CREATE TABLE IF NOT EXISTS sitemap_links(
      namespace TEXT NOT NULL REFERENCES sources(namespace),
      slug TEXT NOT NULL, url TEXT NOT NULL, observed_at TEXT NOT NULL,
      PRIMARY KEY(namespace,slug,url));
    CREATE TABLE IF NOT EXISTS metadata(key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS pattern_checks(
      id INTEGER PRIMARY KEY,pattern_id INTEGER NOT NULL REFERENCES route_patterns(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,url TEXT NOT NULL,status TEXT NOT NULL,reason TEXT,checked_at TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS item_routes(
      namespace TEXT NOT NULL REFERENCES sources(namespace),slug TEXT NOT NULL,
      source_url TEXT, status TEXT NOT NULL DEFAULT 'unverified',
      pattern_id INTEGER REFERENCES route_patterns(id) ON DELETE SET NULL,
      PRIMARY KEY(namespace,slug));
    CREATE INDEX IF NOT EXISTS ix_patterns ON route_patterns(namespace,status);
    CREATE INDEX IF NOT EXISTS ix_items ON item_routes(status);
  `);
}
export function importRegistryPatterns(db,{inventory,catalog,curated={},raw,now=new Date().toISOString()}) {
  if(inventory?.schema!=='registry-atlas-traversal-inventory/v1' ||
    !Array.isArray(raw) || !catalog?.registries)throw Error('Invalid traversal inventory');
  initializePatternDatabase(db);
  const getSource=db.prepare('SELECT homepage,fingerprint FROM sources WHERE namespace=?');
  const sourceSql=db.prepare(`INSERT INTO sources(namespace,homepage,fingerprint) VALUES(?,?,?)
    ON CONFLICT(namespace) DO UPDATE SET homepage=excluded.homepage,fingerprint=excluded.fingerprint`);
  const patternSql=db.prepare(`INSERT INTO route_patterns(namespace,template,prefix,source)
    VALUES(?,?,?,?) ON CONFLICT(namespace,template,prefix) DO UPDATE SET source=excluded.source`);
  const patternId=db.prepare('SELECT id FROM route_patterns WHERE namespace=? AND template=? AND prefix=?');
  const exampleSql=db.prepare('INSERT OR IGNORE INTO examples(pattern_id,slug,url) VALUES(?,?,?)');
  const rowSql=db.prepare("INSERT OR IGNORE INTO item_routes(namespace,slug) VALUES(?,?)");
  const sitemapInsert=db.prepare('INSERT OR IGNORE INTO sitemap_links(namespace,slug,url,observed_at) VALUES(?,?,?,?)');
  const sitemapClear=db.prepare('DELETE FROM sitemap_links WHERE namespace=?');
  db.exec('BEGIN IMMEDIATE');
  let count=0;
  const changed=new Set();
  if(typeof inventory.generatedAt==='string') db.prepare("INSERT INTO metadata(key,value) VALUES('sourceSnapshotAt',?) ON CONFLICT(key) DO UPDATE SET value=excluded.value").run(inventory.generatedAt);
  try {
    for(const reg of raw) {
      const names=[...new Set([...(catalog.registries[reg.name]??[]).map(x=>x.name),
        ...(curated[reg.name]??[]).map(x=>x.slug)].filter(validSlug))].sort();
      const fingerprint=catalogFingerprint(reg,names);
      const prior=getSource.get(reg.name);
      if(!prior || prior.homepage!==reg.homepage || prior.fingerprint!==fingerprint)changed.add(reg.name);
      if(prior&&(prior.homepage!==reg.homepage || prior.fingerprint!==fingerprint)) {
        db.prepare('DELETE FROM item_routes WHERE namespace=?').run(reg.name);
        db.prepare('DELETE FROM route_patterns WHERE namespace=?').run(reg.name);
      }
      sourceSql.run(reg.name,reg.homepage,fingerprint);
      for(const slug of names)rowSql.run(reg.name,slug);
      if(!publicHome(reg.homepage)) { count++; continue; }
      const observed=inventory.registries.find(r=>r.namespace===reg.name && r.homepage===reg.homepage
        && (!r.catalogFingerprint || r.catalogFingerprint===fingerprint));
      sitemapClear.run(reg.name);
      const recordedAt=Date.parse(observed?.sitemapSurveyedAt??'');
      if(Number.isFinite(recordedAt)) for(const item of observed?.sitemapPages??[]) {
        if(!names.includes(item.slug)) continue;
        const url=safePage(item.url,reg.homepage);
        if(url) sitemapInsert.run(reg.name,item.slug,url,observed.sitemapSurveyedAt);
      }
      const seen=new Set();
      for(const [source,patterns] of [
        ['browser-observed',observed?.patterns??[]],['official-sitemap',observed?.sitemapPatterns??[]]
      ]) for(const pattern of patterns) {
        const key=JSON.stringify([pattern.urlTemplate,pattern.slugPrefix]);
        if(seen.has(key)||!resolvePattern(pattern,pattern.slugPrefix+'pattern-test',reg.homepage))continue;
        seen.add(key);
        patternSql.run(reg.name,pattern.urlTemplate,pattern.slugPrefix,source);
        const id=patternId.get(reg.name,pattern.urlTemplate,pattern.slugPrefix).id;
        const next=new Map();
        for(const item of [...(pattern.examples??[]),...(observed?.sitemapPages??[])]) {
          if(!names.includes(item.slug))continue;
          const url=resolvePattern(pattern,item.slug,reg.homepage);
          if(url && url===safePage(item.url,reg.homepage))next.set(item.slug+'\\0'+url,{slug:item.slug,url});
        }
        const previous=db.prepare('SELECT slug,url FROM examples WHERE pattern_id=?').all(id);
        const before=previous.map(item=>item.slug+'\\0'+item.url).sort();
        const after=[...next.keys()].sort();
        if(JSON.stringify(before)!==JSON.stringify(after)) {
          changed.add(reg.name);
          db.prepare("UPDATE route_patterns SET status='unverified',checked_at=NULL,failure=NULL WHERE id=?").run(id);
          db.prepare('DELETE FROM examples WHERE pattern_id=?').run(id);
        }
        for(const item of next.values())exampleSql.run(id,item.slug,item.url);
      }
      // Old patterns are removed when the inventory no longer describes them.
      for(const previous of db.prepare('SELECT id,template,prefix FROM route_patterns WHERE namespace=?').all(reg.name))
        if(!seen.has(JSON.stringify([previous.template,previous.prefix]))) {
          changed.add(reg.name);
          db.prepare('DELETE FROM route_patterns WHERE id=?').run(previous.id);
        }
      count++;
    }
    db.exec('COMMIT');
  }catch(error){db.exec('ROLLBACK');throw error;}
  for(const namespace of changed)resolveInferredRoutes(db,namespace);
  return {registries:count,patterns:db.prepare('SELECT COUNT(*) AS n FROM route_patterns').get().n,
    examples:db.prepare('SELECT COUNT(*) AS n FROM examples').get().n};
}
export async function checkPatternExample(fetchPage,url,slug) {
  try {
    const response=await fetchPage(url,{redirect:'manual',signal:AbortSignal.timeout(9000),
      headers:{'user-agent':'RegistryAtlas-pattern-verifier/1.0'}});
    if(response.status!==200)return {status:'failed',reason:'http-'+response.status};
    if(response.redirected||(response.url && response.url!==url))
      return {status:'failed',reason:'redirected'};
    if(!response.headers.get('content-type')?.toLowerCase().includes('text/html'))
      return {status:'failed',reason:'not-html'};
    if(Number(response.headers.get('content-length')??0)>1024*1024)
      return {status:'failed',reason:'too-large'};
    const html=(await response.text()).slice(0,1024*1024)
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi,'');
    const h1=identity((/<h1\b[^>]*>([\s\S]*?)<\/h1>/i.exec(html)?.[1]??'')
      .replace(/<[^>]+>/g,' '));
    const title=identity((/<title\b[^>]*>([\s\S]*?)<\/title>/i.exec(html)?.[1]??'')
      .replace(/<[^>]+>/g,' '));
    const wanted=identity(slug.split('/').at(-1));
    if(h1!==wanted && title!==wanted && !title.startsWith(wanted+' '))
      return {status:'failed',reason:'identity-mismatch'};
    return {status:'verified',reason:null};
  } catch(error) {return {status:'failed',reason:'network-'+String(error.message).slice(0,75)};}
}
export function resolveInferredRoutes(db,namespace) {
  const patterns=db.prepare("SELECT id,template,prefix FROM route_patterns WHERE namespace=? AND status='verified'").all(namespace);
  const examples=db.prepare(`SELECT e.pattern_id,e.slug,e.url FROM examples e
    JOIN route_patterns p ON p.id=e.pattern_id WHERE p.namespace=? AND p.status='verified'`).all(namespace);
  const root=db.prepare('SELECT homepage FROM sources WHERE namespace=?').get(namespace).homepage;
  const update=db.prepare('UPDATE item_routes SET source_url=?,status=?,pattern_id=? WHERE namespace=? AND slug=?');
  db.exec('BEGIN IMMEDIATE');
  try {
  for(const {slug} of db.prepare('SELECT slug FROM item_routes WHERE namespace=?').all(namespace)) {
    const direct=examples.filter(e=>e.slug===slug);
    if(direct.length && new Set(direct.map(e=>e.url)).size===1) {
      update.run(direct[0].url,'pattern-observed',direct[0].pattern_id,namespace,slug);
      continue;
    }
    const possible=patterns.map(p=>({...p,url:resolvePattern({
      urlTemplate:p.template,slugPrefix:p.prefix},slug,root)})).filter(p=>p.url);
    if(possible.length===1)update.run(possible[0].url,'pattern-inferred',possible[0].id,namespace,slug);
    else update.run(null,'unverified',null,namespace,slug);
  }
  db.exec('COMMIT');
  } catch(error) { db.exec('ROLLBACK'); throw error; }
}
export async function verifyRegistryPatterns(db,{
  registry,samples=2,fetchPage=fetch,checkedAt=new Date().toISOString()
}={}) {
  if(!Number.isSafeInteger(samples)||samples<1||samples>12)throw Error('Invalid sample count');
  const registries=registry
    ? db.prepare('SELECT namespace FROM sources WHERE namespace=?').all(registry)
    : db.prepare('SELECT namespace FROM sources ORDER BY namespace').all();
  if(registry && !registries.length)throw Error('Unknown registry '+registry);
  const list=db.prepare('SELECT * FROM route_patterns WHERE namespace=? ORDER BY id');
  const examples=db.prepare('SELECT slug,url FROM examples WHERE pattern_id=? ORDER BY slug');
  const log=db.prepare('INSERT INTO pattern_checks(pattern_id,slug,url,status,reason,checked_at) VALUES(?,?,?,?,?,?)');
  const save=db.prepare('UPDATE route_patterns SET status=?,checked_at=?,failure=? WHERE id=?');
  let checkedPatterns=0,verifiedPatterns=0,failedPatterns=0,missingSamples=0;
  for(const {namespace} of registries) {
    for(const p of list.all(namespace)) {
      if(p.status==='verified' && p.checked_at &&
        Date.parse(checkedAt) >= Date.parse(p.checked_at) &&
        Date.parse(checkedAt)-Date.parse(p.checked_at)<PATTERN_MAX_AGE_MS)continue;
      const all=examples.all(p.id);
      if(all.length<samples) {missingSamples++;save.run('unverified',checkedAt,'insufficient-examples',p.id);continue;}
      // Spread representative tests across the known route family instead of crawling every item.
      const chosen=samples===1?[all[0]]:Array.from({length:samples},(_,i)=>
        all[Math.floor(i*(all.length-1)/(samples-1))]);
      checkedPatterns++;let reason=null;
      for(const item of chosen) {
        const response=await checkPatternExample(fetchPage,item.url,item.slug.slice(p.prefix.length));
        log.run(p.id,item.slug,item.url,response.status,response.reason,checkedAt);
        if(response.status!=='verified') {reason=response.reason;break;}
      }
      save.run(reason?'failed':'verified',checkedAt,reason,p.id);
      if(reason)failedPatterns++;else verifiedPatterns++;
    }
    resolveInferredRoutes(db,namespace);
  }
  return {checkedPatterns,verifiedPatterns,failedPatterns,missingSamples};
}
export function exportPatternCoverage(db,raw=[]) {
  const sources=db.prepare(`SELECT s.namespace,s.homepage,
    (SELECT COUNT(*) FROM route_patterns p WHERE p.namespace=s.namespace AND p.status='verified') AS verifiedPatterns,
    (SELECT COUNT(*) FROM route_patterns p WHERE p.namespace=s.namespace) AS patternCount,
    (SELECT COUNT(*) FROM item_routes i WHERE i.namespace=s.namespace AND i.status='unverified') AS unverifiedItems,
    (SELECT COUNT(*) FROM item_routes i WHERE i.namespace=s.namespace) AS itemCount
    FROM sources s ORDER BY s.namespace`).all();
  const withReasons=sources.map(source=>!publicHome(source.homepage)
    ? {...source,reason:'non-public-https-homepage'} : source);
  const covered=new Set(sources.map(source=>source.namespace));
  const excluded=raw.filter(source=>!covered.has(source.name)).map(source=>({
    namespace:source.name,homepage:source.homepage,verifiedPatterns:0,patternCount:0,
    unverifiedItems:null,itemCount:null,reason:'non-public-https-homepage',
  }));
  return {schema:'registry-atlas-pattern-coverage/v1',registries:sources.length+excluded.length,
    totals:Object.fromEntries(db.prepare('SELECT status,COUNT(*) AS n FROM item_routes GROUP BY status')
      .all().map(r=>[r.status,r.n])),
    unverifiedRegistries:[...withReasons.filter(r=>r.unverifiedItems>0 || r.reason),...excluded]};
}
export function exportPatternLinkSnapshot(db) {
  const fingerprints=Object.fromEntries(db.prepare('SELECT namespace,fingerprint FROM sources ORDER BY namespace')
    .all().map(row=>[row.namespace,row.fingerprint]));
  return {
    schema:'registry-atlas-pattern-links/v1',
    sourceSnapshotAt:db.prepare("SELECT value FROM metadata WHERE key='sourceSnapshotAt'").get()?.value??null,
    fingerprints,
    sitemapLinks:db.prepare('SELECT namespace,slug,url,observed_at AS observedAt FROM sitemap_links ORDER BY namespace,slug,url').all(),
    links:db.prepare(`SELECT i.namespace,i.slug,i.source_url,i.status,p.checked_at AS checkedAt
      FROM item_routes i JOIN route_patterns p ON p.id=i.pattern_id AND p.status='verified'
      WHERE i.source_url IS NOT NULL AND p.checked_at IS NOT NULL
      ORDER BY i.namespace,i.slug`).all(),
  };
}

export function pendingRegistryNames(db,minExamples=2,max=5,now=new Date().toISOString()) {
  if(!Number.isSafeInteger(minExamples)||minExamples<1||minExamples>12 ||
    !Number.isSafeInteger(max)||max<1||max>408)throw Error('Invalid batch limits');
  const at=Date.parse(now);
  if(!Number.isFinite(at))throw Error('Invalid verification time');
  const olderThan=new Date(at-PATTERN_MAX_AGE_MS).toISOString();
  return db.prepare(`SELECT p.namespace FROM route_patterns p
    WHERE (p.status='unverified'
      OR (p.status='verified' AND (p.checked_at IS NULL OR p.checked_at<=?)))
      AND (SELECT COUNT(*) FROM examples e WHERE e.pattern_id=p.id)>=?
    GROUP BY p.namespace ORDER BY p.namespace LIMIT ?`).all(olderThan,minExamples,max).map(x=>x.namespace);
}

async function main(args) {
  if(args.includes('--help')){console.log('Usage: --db FILE [--verify-only | --import-only --inventory FILE --catalog FILE --raw FILE] [--curated FILE] [--registry NAME] [--samples 2] [--max-registries 5] [--report FILE] [--links FILE]');return;}
  const get=flag=>args.includes(flag)?args[args.indexOf(flag)+1]:null;
  const verifyOnly=args.includes('--verify-only');
  if(!get('--db') || (!verifyOnly && ['--inventory','--catalog','--raw'].some(flag=>!get(flag))) ||
    (verifyOnly && args.includes('--import-only')))throw Error('Missing or conflicting arguments');
  const max=Number(get('--max-registries')??5),samples=Number(get('--samples')??2);
  if(!Number.isSafeInteger(max)||max<1||max>408)throw Error('Invalid --max-registries');
  await mkdir(dirname(resolve(get('--db'))),{recursive:true});
  const inputs=verifyOnly?null:await Promise.all([
    ...['--inventory','--catalog','--raw'].map(flag=>readFile(get(flag),'utf8').then(JSON.parse)),
    readFile(get('--curated')??'data/shadcn/registry-items.json','utf8').then(JSON.parse)]);
  const db=new DatabaseSync(resolve(get('--db')));
  db.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;');
  try {
    if(verifyOnly && !db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='sources'").get())
      throw Error('Pattern database not initialized; first run --import-only with the source inventory');
    initializePatternDatabase(db);
    const imported=inputs
      ? importRegistryPatterns(db,{inventory:inputs[0],catalog:inputs[1],raw:inputs[2],curated:inputs[3]})
      : {registries:db.prepare('SELECT COUNT(*) AS n FROM sources').get().n,
         patterns:db.prepare('SELECT COUNT(*) AS n FROM route_patterns').get().n,
         examples:db.prepare('SELECT COUNT(*) AS n FROM examples').get().n};
    const chosen=args.includes('--import-only')?[]:get('--registry')?[get('--registry')]:
      pendingRegistryNames(db,samples,max);
    const checked=[];
    for(const registry of chosen)
      checked.push({namespace:registry,...await verifyRegistryPatterns(db,{registry,samples})});
    const coverage=exportPatternCoverage(db,inputs?.[2]??[]);
    if(get('--report'))await writeFile(get('--report'),JSON.stringify(coverage,null,2)+'\n');
    if(get('--links'))await writeFile(get('--links'),JSON.stringify(exportPatternLinkSnapshot(db))+'\n');
    console.log(JSON.stringify({imported,checked,coverage:{
      registries:coverage.registries,unverifiedRegistries:coverage.unverifiedRegistries.length,
      totals:coverage.totals}},null,2));
  }finally{db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1;});
