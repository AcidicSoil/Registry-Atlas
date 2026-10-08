import { readFile, writeFile } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DiscoveryLedger, catalogFingerprint, DISCOVERY_REVISION } from './lib/registry-discovery.mjs';
import { openAtlasCoreDatabase, readAtlasState } from './lib/atlas-storage.mjs';

const SCHEMA = 'registry-atlas-traversal-inventory/v1';
const DISCOVERY_SCHEMA = 'registry-atlas-discovery/v1';
const validNamespace = /^@[a-z0-9][a-z0-9-]*$/;
const slugNames = (registry, catalog, curated) => [...new Set([
  ...(catalog.registries?.[registry.name] ?? []).map(item => item.name),
  ...(curated[registry.name] ?? []).map(item => item.slug),
].filter(slug => typeof slug === 'string' && slug.trim()))].sort();

function safeUrl(raw, homepage, {allowSourceJson = false} = {}) {
  try {
    const source = new URL(homepage);
    const target = new URL(raw);
    if (target.protocol !== 'https:' || source.protocol !== 'https:'
      || source.origin !== target.origin || target.port || target.username
      || target.password || target.hash || target.pathname === '/'
      || !target.pathname || (!allowSourceJson && target.pathname.toLowerCase().endsWith('.json')))
      return null;
    return target.href;
  } catch {return null;}
}
function pathPattern(slug, url) {
  const page = new URL(url);
  const encodedLeaf = page.pathname.split('/').filter(Boolean).at(-1) ?? '';
  const leaf = decodeURIComponent(encodedLeaf);
  if (!leaf || page.search || leaf.includes('/')) return null;
  const parent = page.origin + page.pathname.slice(
    0, page.pathname.lastIndexOf('/' + encodedLeaf) + 1);
  const suffix = page.pathname.endsWith('/') ? '/' : '';
  if (leaf === slug) return {urlTemplate:parent + '{slug}' + suffix,slugPrefix:''};
  const prefixes = [slug.slice(0,slug.length-leaf.length)];
  const slugPrefix=prefixes[0];
  if (slugPrefix && (slugPrefix.endsWith('-') || slugPrefix.endsWith('/'))
    && slug.endsWith(leaf)) return {urlTemplate:parent+'{leaf}'+suffix,slugPrefix};
  return null;
}
function validSnapshot(row, registry, fingerprint) {
  return row?.schema === DISCOVERY_SCHEMA && row.discoveryRevision === DISCOVERY_REVISION
    && row.status === 'discovered' && row.namespace === registry.name
    && row.catalogFingerprint === fingerprint;
}
function pageVerified(row, registry, slug, fingerprint, observedLink) {
  return row?.schema === DISCOVERY_SCHEMA && row.discoveryRevision === DISCOVERY_REVISION
    && row.namespace === registry.name && row.slug === slug
    && row.catalogFingerprint === fingerprint && row.status === 'page-observed'
    && row.docsUrl === observedLink && row.evidence?.observedUrl === observedLink
    && typeof row.evidence.renderedHeading === 'string'
    && row.evidence.renderedHeading.trim() !== '';
}

export function deriveTraversalInventory(
  raw, catalog, curated, ledgers, generatedAt = new Date().toISOString(), surveys = {},
) {
  if (!Array.isArray(raw) || !raw.length || !Number.isFinite(Date.parse(generatedAt)))
    throw Error('Expected official raw registry directory and timestamp');
  const registries = [];
  for (const registry of raw) {
    if (!validNamespace.test(registry.name)) throw Error('Invalid registry namespace');
    const slugs=slugNames(registry,catalog,curated);
    const fingerprint=catalogFingerprint(registry,slugs);
    const journal=ledgers[registry.name] ?? new Map();
    const snapshot=journal.get('registry:'+registry.name);
    // Preserve fingerprint-compatible observations from larger earlier crawls.
    // A subsequent small-budget crawl must not erase witnessed listing paths.
    const evidenceSnapshots=(journal.history??[snapshot]).filter(row=>
      row?.token==='registry:'+registry.name &&
      validSnapshot(row,registry,fingerprint) &&
      Date.parse(row.checkedAt)>=Date.parse(generatedAt)-30*24*60*60*1000);
    const safeHomepage=(() => {
      try {
        const home=new URL(registry.homepage);
        return home.protocol==='https:'&&!home.port&&!home.username&&!home.password;
      } catch {return false;}
    })();
    const fresh=safeHomepage && evidenceSnapshots.length>0;
    const candidates=new Map();
    const navigationPages=new Map();
    if (fresh) for (const observation of evidenceSnapshots) {
      for (const listing of observation.listings??[]) {
        const safeListing=safeUrl(listing.url,registry.homepage);
        if (safeListing || new URL(listing.url).href===new URL(registry.homepage).href)
          navigationPages.set(listing.url,listing.depth);
      }
      for (const link of observation.candidates??[]) {
        if (!slugs.includes(link.slug)) continue;
        const url=safeUrl(link.url,registry.homepage);
        const listing=safeUrl(link.listingUrl,registry.homepage);
        if (!url || !listing || link.matching==='ambiguous-leaf') continue;
        candidates.set(link.slug+'\x00'+url+'\x00'+listing,{
          slug:link.slug,url,listingUrl:listing,
          matching:link.matching,navigationSource:link.navigationSource,
        });
      }
    }
    // Official XML sitemap routes are a separate evidence level. No site-declared
    // URL is treated as a browser-confirmed component page.
    const survey=surveys[registry.name];
    const officialSurvey=safeHomepage
      && survey?.schema==='registry-atlas-sitemap-survey/v1'
      && survey.namespace===registry.name
      && survey.officialHomepage===registry.homepage
      && survey.catalogFingerprint===fingerprint
      && Date.parse(survey.surveyedAt)>=Date.parse(generatedAt)-30*24*60*60*1000;
    const sitemapPages=new Map();
    if(officialSurvey)for(const record of survey.matchedPages??[]) {
      if(!slugs.includes(record.slug)||!safeUrl(record.url,registry.homepage))continue;
      sitemapPages.set(record.slug,record.url);
    }
    const sitemapGroups=new Map();
    for (const [slug,url] of sitemapPages) {
      const route=pathPattern(slug,url);
      if(!route)continue;
      const key=route.urlTemplate+'\x00'+route.slugPrefix;
      if(!sitemapGroups.has(key))sitemapGroups.set(key,{
        ...route,slugs:new Set(),verified:new Set(),examples:[],
      });
      const info=sitemapGroups.get(key);
      info.slugs.add(slug);
      if(pageVerified(journal.get(registry.name+'/'+slug),registry,slug,fingerprint,url))
        info.verified.add(slug);
      if(info.examples.length<6)info.examples.push({slug,url});
    }
    const sitemapPatterns=[...sitemapGroups.values()].map(info=>({
      urlTemplate:info.urlTemplate,slugPrefix:info.slugPrefix,
      matchedItems:info.slugs.size,browserVerifiedPages:info.verified.size,
      evidenceLevel:'official-xml-sitemap',
      examples:info.examples,
      note:'Published in the official sitemap, not independently loaded as a component page',
    })).sort((a,b)=>b.matchedItems-a.matchedItems||
      a.urlTemplate.localeCompare(b.urlTemplate));
    const group=new Map(), listingGroups=new Map(), verifiedTokens=new Set();
    for (const candidate of candidates.values()) {
      const groupKey=candidate.listingUrl;
      if (!listingGroups.has(groupKey)) listingGroups.set(groupKey,new Set());
      listingGroups.get(groupKey).add(candidate.slug);
      const verified=pageVerified(journal.get(registry.name+'/'+candidate.slug),
        registry,candidate.slug,fingerprint,candidate.url);
      if (verified) verifiedTokens.add(candidate.slug);
      const pattern=pathPattern(candidate.slug,candidate.url);
      if (!pattern) continue;
      const key=pattern.urlTemplate+'\x00'+pattern.slugPrefix;
      if (!group.has(key)) group.set(key,{...pattern,slugs:new Set(),verified:new Set(),examples:[]});
      const record=group.get(key);
      record.slugs.add(candidate.slug);
      if (verified) record.verified.add(candidate.slug);
      if (record.examples.length<6 && !record.examples.some(x=>x.slug===candidate.slug))
        record.examples.push({slug:candidate.slug,url:candidate.url,
          verifiedPage:verified,listingUrl:candidate.listingUrl});
    }
    const patterns=[...group.values()].map(row=>({
      urlTemplate:row.urlTemplate,slugPrefix:row.slugPrefix,
      matchedItems:row.slugs.size,verifiedPages:row.verified.size,
      evidenceLevel:row.verified.size>0 ? 'page-verified-sample' : 'observed-links-only',
      examples:row.examples,
      note:'Template describes observed links; individual unvisited destination pages are not yet verified',
    })).sort((a,b)=>b.verifiedPages-a.verifiedPages
      || b.matchedItems-a.matchedItems || a.urlTemplate.localeCompare(b.urlTemplate));
    const listings=[...listingGroups.entries()].map(([url,items])=>({
      url,matchedItems:items.size,
      traversalDepth:navigationPages.get(url)??null,
    })).sort((a,b)=>b.matchedItems-a.matchedItems || a.url.localeCompare(b.url));
    const verifiedPages=verifiedTokens.size;
    const matchedItems=new Set([...candidates.values()].map(row=>row.slug)).size;
    const observedNavigationPages=fresh ? navigationPages.size : 0;
    const status=!safeHomepage?'http-only-homepage'
      :!slugs.length?'no-indexed-items'
      :verifiedPages>0?'verified-sample'
      :matchedItems>0?'observed-navigation'
      :sitemapPages.size>0?'sitemap-observed'
      :!fresh?'not-inspected'
      :snapshot.error?'navigation-error':'no-matching-links';
    registries.push({
      namespace:registry.name,homepage:registry.homepage,
      // Source item JSON is not a documentation route.
      sourceItemJsonTemplate:registry.url??null,
      status,itemCount:slugs.length,matchedAnchorCount:matchedItems,
      verifiedPageCount:verifiedPages,unverifiedItemCount:slugs.length-verifiedPages,
      observedNavigationPages,observationError:fresh?snapshot.error??null:null,
      crawlExhausted:fresh?Boolean(snapshot.exhausted):false,
      inspectedAt:fresh?evidenceSnapshots.at(-1).checkedAt:null,
      sitemapSurveyedAt:officialSurvey?survey.surveyedAt:null,
      sitemapUrlCount:officialSurvey?survey.sitemapUrlCount:0,
      sitemapMatchedCount:sitemapPages.size,
      sitemapSources:officialSurvey?survey.sitemaps:[],
      sitemapPages:[...sitemapPages].map(([slug,url])=>({slug,url})),
      ...(fresh||officialSurvey ? {catalogFingerprint:fingerprint} : {}),
      listings,patterns,sitemapPatterns,
    });
  }
  return {schema:SCHEMA,generatedAt,source:'official browser-observed discovery journals',
    summary:{
      registryCount:registries.length,
      distinctIndexedIdentities:registries.reduce((n,r)=>n+r.itemCount,0),
      registriesWithNavigation:registries.filter(r=>r.observedNavigationPages>0).length,
      registriesWithObservedLinks:registries.filter(r=>r.matchedAnchorCount>0).length,
      registriesWithVerifiedPages:registries.filter(r=>r.verifiedPageCount>0).length,
      registriesNotInspected:registries.filter(r=>r.status==='not-inspected').length,
      registriesWithoutBrowserObservation:registries.filter(r=>r.observedNavigationPages===0).length,
      registriesWithSitemapMatches:registries.filter(r=>r.sitemapMatchedCount>0).length,
      registriesHttpOnly:registries.filter(r=>r.status==='http-only-homepage').length,
      verifiedPages:registries.reduce((n,r)=>n+r.verifiedPageCount,0),
      matchedOfficialLinks:registries.reduce((n,r)=>n+r.matchedAnchorCount,0),
      sitemapMatchedPages:registries.reduce((n,r)=>n+r.sitemapMatchedCount,0),
    },
    registries};
}
function parseArgs(args) {
  const out={};
  for(let i=0;i<args.length;i+=2) {
    if (!['--journal-dir','--output','--sitemap-dir'].includes(args[i]) || !args[i+1]
      || Object.hasOwn(out,args[i]) || args[i+1].startsWith('--'))
      throw Error('Expected --journal-dir DIR [--output FILE]');
    out[args[i]]=args[i+1];
  }
  if (!out['--journal-dir'] || !isAbsolute(out['--journal-dir'])
    || (out['--output']&&!isAbsolute(out['--output']))
    || (out['--sitemap-dir']&&!isAbsolute(out['--sitemap-dir'])))
    throw Error('Journal directory and optional output must be absolute');
  return out;
}
export async function main(argv,cwd=process.cwd()) {
  const options=parseArgs(argv);
  const database=openAtlasCoreDatabase(cwd,{readOnly:true});
  const state=readAtlasState(database);
  database.close();
  const raw=state.rawRegistries,catalog=state.catalog,curated=state.curated;
  const ledgers={};
  for (const registry of raw) {
    const path=join(options['--journal-dir'],registry.name.replace(/^@/,'')+'.jsonl');
    const ledger=await DiscoveryLedger.open(path);
    let lines='';
    try {lines=await readFile(path,'utf8');} catch(error) {
      if (error.code!=='ENOENT') throw error;
    }
    ledger.rows.history=lines.split('\n').filter(Boolean).map(JSON.parse)
      .filter(row=>row.token==='registry:'+registry.name);
    ledgers[registry.name]=ledger.rows;
  }
  const surveys={};
  if(options['--sitemap-dir'])for(const registry of raw) {
    const path=join(options['--sitemap-dir'],registry.name.slice(1)+'.json');
    try {surveys[registry.name]=JSON.parse(await readFile(path,'utf8'));}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  const report=deriveTraversalInventory(raw,catalog,curated,ledgers,
    new Date().toISOString(),surveys);
  if(options['--output']) await writeFile(options['--output'],JSON.stringify(report,null,2)+'\n',
    {flag:'w'});
  return report;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main(process.argv.slice(2)).then(x=>console.log(JSON.stringify(x.summary,null,2)))
    .catch(e=>{console.error(e.message);process.exitCode=1;});
}
