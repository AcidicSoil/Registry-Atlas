#!/usr/bin/env node
// Reconcile fresh official sitemap evidence without touching route patterns or old crawls.
import { readdir, readFile } from 'node:fs/promises';
import { isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { catalogFingerprint } from './lib/registry-discovery.mjs';
import { exactOfficialPage } from './build-source-page-index.mjs';
import { openAtlasCoreDatabase, readRawRegistries, readCatalogSnapshot,
  readCuratedItemSummaries, readDocument, putDocument } from './lib/atlas-storage.mjs';
import { bulkInsert } from './lib/atlas-postgres.mjs';

const FRESH_MS=30*86400000;
export function prepareSitemapSurveys({raw,catalog,curated={},surveys,existing=[],now=new Date().toISOString()}) {
  if (!Array.isArray(raw)||!catalog?.registries) throw Error('Missing registry catalog');
  const at=Date.parse(now);
  if(!Number.isFinite(at))throw Error('Invalid current date');
  const old=new Map();
  for(const row of existing){
    const k=row.namespace+'\0'+row.slug;
    const set=old.get(k)??new Set();set.add(row.url);old.set(k,set);
  }
  const accepted=[],rejected={},registries=[];
  const reject=reason=>{rejected[reason]=(rejected[reason]??0)+1;};
  for(const registry of raw){
    const survey=surveys[registry.name];
    if(!survey){reject('missing-survey');continue;}
    const slugs=new Set([...(catalog.registries[registry.name]??[]).map(x=>x.name),
      ...(curated[registry.name]??[]).map(x=>x.slug)]);
    const fingerprint=catalogFingerprint(registry,[...slugs].sort());
    const observed=Date.parse(survey.surveyedAt??'');
    if(survey.schema!=='registry-atlas-sitemap-survey/v1'
      || survey.namespace!==registry.name
      || survey.officialHomepage!==registry.homepage
      || survey.catalogFingerprint!==fingerprint){reject('mismatched-survey');continue;}
    if(!Number.isFinite(observed)||observed>at||at-observed>FRESH_MS){
      reject('stale-survey');continue;
    }
    if(survey.status!=='sitemap-observed') {
      reject(survey.status??'no-sitemap-evidence');continue;
    }
    const perSlug=new Map();
    for(const row of survey.matchedPages??[]){
      if(!slugs.has(row.slug)){reject('unknown-item');continue;}
      const url=exactOfficialPage(row.url,registry.homepage);
      if(!url){reject('invalid-or-off-origin');continue;}
      const set=perSlug.get(row.slug)??new Set();set.add(url);perSlug.set(row.slug,set);
    }
    let added=0;
    for(const [slug,urls] of perSlug){
      if(urls.size!==1){reject('ambiguous-sitemap');continue;}
      const url=[...urls][0],prior=old.get(registry.name+'\0'+slug);
      if(prior?.size && !prior.has(url)){
        reject('conflicting-prior-evidence');continue;
      }
      accepted.push([registry.name,slug,url,survey.surveyedAt]);added++;
    }
    registries.push({namespace:registry.name,eligible:added});
  }
  return {accepted,registries,rejected};
}
export async function main(argv, cwd=process.cwd()) {
  const dir=argv[0];
  if(argv.length>2||!isAbsolute(dir??''))throw Error('Usage: import-official-sitemap-surveys.mjs ABSOLUTE_SURVEY_DIR [--dry-run]');
  const dryRun=argv.includes('--dry-run');
  if(argv.length===2&&!dryRun)throw Error('Unknown flag');
  const db=openAtlasCoreDatabase(cwd);
  try{
    const [rawRegistries,catalog,curated]=await Promise.all([
      readRawRegistries(db),readCatalogSnapshot(db),readCuratedItemSummaries(db),
    ]);
    const state={rawRegistries,catalog,curated};
    const files=new Set(await readdir(dir));
    const surveys={};
    for(const reg of state.rawRegistries){
      const name=reg.name.slice(1)+'.json';
      if(files.has(name))surveys[reg.name]=JSON.parse(await readFile(join(dir,name),'utf8'));
    }
    const [existing,sources]=await Promise.all([
      db.prepare('SELECT namespace,slug,url FROM sitemap_links').all(),
      db.prepare('SELECT namespace,homepage,fingerprint FROM sources').all(),
    ]);
    const plan=prepareSitemapSurveys({
      raw:state.rawRegistries,catalog:state.catalog,curated:state.curated,
      surveys,existing,
    });
    const current=new Map(sources.map(row=>[row.namespace,row]));
    const registries=new Map(state.rawRegistries.map(row=>[row.name,row]));
    const fresh=new Map(),eligible=[],fingerprints=new Map();
    let inconsistentSources=0,homepageConflicts=0;
    for(const row of plan.accepted){
      const registry=registries.get(row[0]),known=current.get(row[0]);
      if(!fingerprints.has(row[0])){
        const slugs=new Set([...(state.catalog.registries[row[0]]??[]).map(i=>i.name),
          ...(state.curated[row[0]]??[]).map(i=>i.slug)]);
        fingerprints.set(row[0],catalogFingerprint(registry,[...slugs].sort()));
      }
      const fingerprint=fingerprints.get(row[0]);
      if(known&&known.homepage!==registry.homepage){homepageConflicts++;continue;}
      if(known&&known.fingerprint!==fingerprint)inconsistentSources++;
      if(!known)fresh.set(row[0],[row[0],registry.homepage,fingerprint]);
      eligible.push(row);
    }
    if(!dryRun){
      // Exact sitemap provenance has its own fingerprint. A changed catalog must
      // not silently promote previously verified route patterns.
      const prior=await readDocument(db,'official-sitemap-fingerprints')??{};
      const next={...prior,...Object.fromEntries([...new Set(eligible.map(x=>x[0]))]
        .map(ns=>[ns,fingerprints.get(ns)]))};
      // Atomic, additive publication: no pattern updates, deletes or SQLite migration.
      await db.begin(async tx=>{
        await bulkInsert(tx,'sources',['namespace','homepage','fingerprint'],
          [...fresh.values()],{conflict:'ON CONFLICT(namespace) DO NOTHING'});
        await bulkInsert(tx,'sitemap_links',['namespace','slug','url','observed_at'],
          eligible,{conflict:'ON CONFLICT(namespace,slug,url) DO UPDATE SET observed_at=excluded.observed_at'});
        await putDocument(tx,'official-sitemap-fingerprints','source-evidence',next);
      });
    }
    const oldKeys=new Set(existing.map(x=>x.namespace+'\0'+x.slug+'\0'+x.url));
    console.log(JSON.stringify({dryRun,surveyed:Object.keys(surveys).length,
      eligibleRegistries:plan.registries.length,matched:eligible.length,
      newlyDiscovered:eligible.filter(x=>!oldKeys.has(x.slice(0,3).join('\0'))).length,
      addedSourceRegistries:fresh.size,inconsistentSources,homepageConflicts,
      rejected:plan.rejected,
      note:'Sitemap candidates are provisional; no identity-verification claim.'}));
  }finally{await db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).catch(e=>{console.error(e);process.exitCode=1;});
