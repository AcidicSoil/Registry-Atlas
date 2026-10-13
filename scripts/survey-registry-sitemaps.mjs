import {execFileSync} from 'node:child_process';
import {writeFile,mkdir,rename} from 'node:fs/promises';
import {join,isAbsolute} from 'node:path';
import {isIP} from 'node:net';
import {pathToFileURL} from 'node:url';
import {catalogFingerprint} from './lib/registry-discovery.mjs';
import {openAtlasCoreDatabase,readAtlasState} from './lib/atlas-storage.mjs';

const SCHEMA='registry-atlas-sitemap-survey/v1';

const normalize=s=>String(s).toLowerCase().replace(/[^a-z0-9]/g,'');

const decodeXml=s=>s.replace(/&(amp|lt|gt|quot|apos);|&#(x[0-9a-f]+|[0-9]+);/gi,
  (m,n,k)=>n?({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'"}[n.toLowerCase()]??m):
    String.fromCodePoint(parseInt(k.startsWith('x')?k.slice(1):k,k.startsWith('x')?16:10)));

function isPublicOfficialHome(raw) {
  try {
    const u=new URL(raw);

    return u.protocol==='https:'&&!u.port&&!u.username&&!u.password
      &&u.hostname.includes('.')&&isIP(u.hostname)===0
      &&!/(?:^localhost$|\.local$|\.internal$|\.localhost$)/.test(u.hostname);
  } catch{return false;}
}

export function canonicalWwwRedirect(sourceUrl,status,location){
  if(status!==308||!location)return null;

  try{
    const source=new URL(sourceUrl),target=new URL(location,source);

    if(source.protocol!=='https:'||target.protocol!=='https:'||target.username||target.password
      ||target.port||target.hash||target.search||source.search||target.hostname!=='www.'+source.hostname
      ||target.pathname!==source.pathname)return null;

    return target.href;
  }catch{return null;}
}

function safeOfficialUrl(raw,home) {
  try {
    const u=new URL(raw),source=new URL(home);

    return u.protocol==='https:' && u.origin===source.origin
      &&!u.port&&!u.username&&!u.password&&!u.hash
      &&!/\.(?:json|js|map|png|jpe?g|webp|svg|css|woff2?|pdf)$/i.test(u.pathname)
      ?u.href:null;
  } catch{return null;}
}

export function parseRobotsSitemaps(text) {
  return [...new Set(String(text).split(/\r?\n/).map(line=>
    /^\s*sitemap\s*:\s*(https:\/\/\S+)\s*$/i.exec(line)?.[1])
    .filter(Boolean))];
}

export function sitemapXmlLinks(xml) {
  const source=String(xml);

  const kind=/<\s*sitemapindex(?:\s|>)/i.test(source)?'index'
    :/<\s*urlset(?:\s|>)/i.test(source)?'urls':'unknown';

  const urls=[...source.matchAll(/<\s*loc(?:\s+[^>]*)?\s*>\s*([^<]{1,2048})\s*<\s*\/loc\s*>/gi)]
    .slice(0,50000).map(m=>decodeXml(m[1].trim()));

  return {kind,urls};
}

// Some registries publish canonical sitemap paths with a documented icon-family
// segment while catalog item IDs carry a short prefix. Match only listed URLs.
export function sourceDeclaredIconAliases(registry,slugs,urls){
  if(registry?.name!=='@animateicons'||registry.homepage!=='https://animateicons.in')return [];
  const set=new Set(urls),matches=[];

  for(const slug of slugs){
    const family=slug.startsWith('hu-')?'huge':slug.startsWith('lu-')?'lucide':null;

    if(!family)continue;
    const leaf=slug.slice(3);

    if(!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(leaf))continue;
    const url='https://animateicons.in/icons/'+family+'/'+leaf;

    if(set.has(url))matches.push({slug,url});
  }

  return matches;
}

export function sitemapUrlCandidates(home,slugs,urls) {
  const identities=new Map();

  for(const slug of slugs) {
    const key=normalize(slug);

    if(!identities.has(key))identities.set(key,[]);
    identities.get(key).push(slug);
  }

  const result=new Map();

  for(const raw of urls) {
    const url=safeOfficialUrl(raw,home);

    if(!url)continue;
    const u=new URL(url);

    if(u.search)continue;
    let segments;

    try {segments=u.pathname.split('/').filter(Boolean).map(decodeURIComponent);} catch{continue;}

    const choices=new Set();

    for(let length=1;length<=Math.min(5,segments.length);length++){
      const suffix=normalize(segments.slice(-length).join('/'));

      for(const slug of identities.get(suffix)??[])choices.add(slug);
    }

    if(choices.size!==1)continue;
    const slug=[...choices][0];

    if(!result.has(slug))result.set(slug,{slug,url});
    else if(result.get(slug) && result.get(slug).url!==url)result.set(slug,null);
  }

  return [...result.values()].filter(Boolean);
}

async function readLimited(url,home,timeoutMs=6000,maxBytes=3*1024*1024){
  if(!safeOfficialUrl(url,home)) return {error:'unsafe-url'};

  try {
    const res=await fetch(url,{
      redirect:'manual',cache:'no-store',signal:AbortSignal.timeout(timeoutMs),
      headers:{'User-Agent':'RegistryAtlas/1.0 (public sitemap inventory; no code execution)'}
    });

    if(res.status!==200) return {error:'http-'+res.status};

    if(res.url!==url) return {error:'redirected'};
    const reader=res.body?.getReader();

    if(!reader) return {error:'empty'};
    let size=0;const bytes=[];

    while(true){
      const {done,value}=await reader.read();

      if(done)break;
      size+=value.byteLength;

      if(size>maxBytes){await reader.cancel();

return{error:'oversized'};}

      bytes.push(value);
    }

    return {text:new TextDecoder().decode(Buffer.concat(bytes)),status:200};
  }catch(error){return{error:String(error.message).slice(0,100)};}
}

export async function surveyRegistry(registry,slugs,{timeoutMs=6000,maxSitemaps=4,
  maxSitemapBytes=8*1024*1024}={}){
  const at=new Date().toISOString();

  const base={schema:SCHEMA,namespace:registry.name,officialHomepage:registry.homepage,
    surveyedAt:at,itemCount:slugs.length,catalogFingerprint:catalogFingerprint(registry,slugs),
    status:'not-surveyed',sitemaps:[],
    sitemapUrlCount:0,matchedPages:[],errors:[]};

  if(!isPublicOfficialHome(registry.homepage))return {...base,status:'unsafe-or-http-homepage'};
  const home=new URL(registry.homepage);
  const origin=home.origin;
  const robots=await readLimited(origin+'/robots.txt',registry.homepage,timeoutMs,250*1024);
  const robotsText=robots.text??'';
  // Respect a site-wide robots exclusion for public crawlers.
  const star=robotsText.match(/(?:^|\n)User-agent:\s*\*\s*\n([\s\S]*?)(?=\nUser-agent:|$)/i)?.[1]??'';

  if(/(?:^|\n)\s*Disallow:\s*\/\s*(?:\n|$)/i.test(star))
    return {...base,status:'robots-disallowed'};
  const discovered=parseRobotsSitemaps(robotsText);

  if(!discovered.length)discovered.push(origin+'/sitemap.xml');
  const queue=[...discovered].slice(0,maxSitemaps*2);
  const scanned=new Set(),sitemapUrls=[];

  while(queue.length&&scanned.size<maxSitemaps){
    const proposed=queue.shift();
    const url=safeOfficialUrl(proposed,registry.homepage);

    if(!url || scanned.has(url))continue;

    if(!/\.xml(?:\.gz)?(?:\?|$)/i.test(new URL(url).pathname))continue;
    scanned.add(url);
    let response=await readLimited(url,registry.homepage,timeoutMs,maxSitemapBytes);
    let canonicalUrl=null;

    if(response.error==='http-308'){
      try{
        const redirect=await fetch(url,{redirect:'manual',
          signal:AbortSignal.timeout(timeoutMs)});

        const candidate=canonicalWwwRedirect(url,redirect.status,redirect.headers.get('location'));

        if(candidate){
          response=await readLimited(candidate,new URL(candidate).origin,timeoutMs,maxSitemapBytes);

          if(response.text)canonicalUrl=candidate;
        }
      }catch{}
    }

    if(!response.text){base.errors.push({url,error:response.error});continue;}

    const parsed=sitemapXmlLinks(response.text);
    base.sitemaps.push({url,kind:parsed.kind,locCount:parsed.urls.length,
      ...(canonicalUrl?{canonicalRedirect:canonicalUrl}: {})});

    const urls=canonicalUrl?parsed.urls.map(raw=>{
      try{const candidate=new URL(raw);

        if(candidate.origin!==new URL(canonicalUrl).origin)return raw;
        candidate.host=home.host;

return candidate.href;
      }catch{return raw;}
    }):parsed.urls;

    if(parsed.kind==='index')for(const child of urls.slice(0,100)){
      const next=safeOfficialUrl(child,registry.homepage);

      if(next&&!scanned.has(next))queue.push(next);
    }
    else if(parsed.kind==='urls')sitemapUrls.push(...urls);
  }

  const candidates=[...sitemapUrlCandidates(registry.homepage,slugs,sitemapUrls),
    ...sourceDeclaredIconAliases(registry,slugs,sitemapUrls)];

  const bySlug=new Map();

  for(const row of candidates){
    const previous=bySlug.get(row.slug);

    if(!previous)bySlug.set(row.slug,[row.url]);
    else if(!previous.includes(row.url))previous.push(row.url);
  }

  const links=[...bySlug].filter(([,urls])=>urls.length===1)
    .map(([slug,urls])=>({slug,url:urls[0]}));

  return {...base,status:links.length?'sitemap-observed':base.sitemaps.length?'no-matching-sitemap-pages':'no-readable-sitemap',
    sitemapUrlCount:sitemapUrls.length,matchedPages:links};
}

function args(argv){
  const opts={};

  const fields=new Set(['--profile','--server','--output-dir','--max-registries',
    '--cursor','--registry','--concurrency','--timeout-ms']);

  for(let i=0;i<argv.length;i+=2){
    if(!fields.has(argv[i])||!argv[i+1]||argv[i+1].startsWith('--')
      ||Object.hasOwn(opts,argv[i]))throw Error('Unexpected/missing CLI flag '+argv[i]);
    opts[argv[i]]=argv[i+1];
  }

  for(const k of ['--profile','--server','--output-dir'])if(!opts[k])throw Error('Missing '+k);

  if(!isAbsolute(opts['--output-dir']))throw Error('Output directory must be absolute');

  const num=(key,fallback,maximum)=>{
    const v=opts[key]===undefined?fallback:Number(opts[key]);

    if(!Number.isSafeInteger(v)||v<1||v>maximum)throw Error('Invalid '+key);

    return v;
  };

  return {...opts,limit:num('--max-registries',50,408),
    concurrency:num('--concurrency',8,12),timeoutMs:num('--timeout-ms',6000,15000)};
}

export async function main(argv,cwd=process.cwd()){
  const options=args(argv);

  const status=JSON.parse(execFileSync('pinchtab-profile-manager',
    [options['--profile'],'status','--json'],{encoding:'utf8',timeout:15000}));

  if(!status.ok||!status.data?.instances?.some(x=>
    x.status==='running'&&x.url===options['--server']))
    throw Error('Managed source profile is not running on the provided server');
  const allowed=status.data.settings?.allowedDomains??[];
  const database=openAtlasCoreDatabase(cwd,{readOnly:true});
  const state=await readAtlasState(database);
  await database.close();
  const raw=state.rawRegistries,catalog=state.catalog,curated=state.curated;

  const registries=raw.filter(reg=>{
    const host=new URL(reg.homepage).hostname;

    return allowed.some(p=>p==='*'||p===host)
      && (!options['--registry']||options['--registry']===reg.name);
  }).sort((a,b)=>a.name.localeCompare(b.name));

  if(options['--cursor']&&!registries.some(x=>x.name===options['--cursor']))
    throw Error('Unknown registry cursor');

  const selected=registries.filter(r=>!options['--cursor']
    ||r.name.localeCompare(options['--cursor'])>0).slice(0,options.limit);

  await mkdir(options['--output-dir'],{recursive:true});
  let next=0;const results=Array.from({ length: selected.length });

  async function worker(){
    while(next<selected.length){
      const i=next++,registry=selected[i];

      const slugs=[...new Set([
        ...(catalog.registries?.[registry.name]??[]).map(x=>x.name),
        ...(curated[registry.name]??[]).map(x=>x.slug),
      ])].filter(x=>typeof x==='string');

      const result=await surveyRegistry(registry,slugs,{timeoutMs:options.timeoutMs});
      const path=join(options['--output-dir'],registry.name.slice(1)+'.json');
      await writeFile(path+'.partial',JSON.stringify(result,null,2)+'\n');
      await rename(path+'.partial',path);
      results[i]={namespace:result.namespace,status:result.status,
        matched:result.matchedPages.length,sitemaps:result.sitemaps.length};
    }
  }

  await Promise.all(Array.from({length:Math.min(selected.length,options.concurrency)},worker));

  return {schema:SCHEMA,completed:results.length,results,
    nextCursor:selected.at(-1)?.name??null,
    matched:results.reduce((n,x)=>n+x.matched,0),
    nonzero:results.filter(x=>x.matched>0).length};
}

if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)
  main(process.argv.slice(2)).then(r=>console.log(JSON.stringify(r,null,2)))
    .catch(e=>{console.error(e.message);process.exitCode=1});
