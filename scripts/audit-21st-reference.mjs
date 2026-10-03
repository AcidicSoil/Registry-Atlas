import { execFileSync } from 'node:child_process';
import { homedir } from 'node:os';
import { open, readFile, mkdir, rename, writeFile, unlink } from 'node:fs/promises';
import { dirname, isAbsolute, join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const SITE = 'https://21st.dev/';
const SCHEMA = 'registry-atlas-reference-census/v1';
const SEEDS = [SITE, ...['community/components','community/templates','community/themes',
  'community/icons','community/libraries','community/authors',
  'community/components/newest','community/components/featured'].map(p => SITE+p)];
const PRIVATE = /^\/(?:admin|api|_next|account|settings|billing|checkout|signin|signup|sign-in|sign-up)(?:\/|$)/i;
const compact = value => String(value ?? '').replace(/\s+/g,' ').trim().slice(0,160);

export function normalized21stUrl(raw, from = SITE) {
  try {
    if (typeof raw !== 'string' || !raw.trim() || raw.includes('\\')) return null;
    const base = new URL(from);
    if (base.origin !== 'https://21st.dev') return null;
    const url = new URL(raw,base);
    if (url.origin !== 'https://21st.dev' || url.username || url.password ||
      PRIVATE.test(url.pathname)) return null;
    url.hash=''; url.search='';
    if (url.pathname.length>1) url.pathname=url.pathname.replace(/\/+$/,'');
    return url.href;
  } catch { return null; }
}

export function planReferenceRoutes({queue=[], observations={}, maxRoutes=5, cursor=null}) {
  if (!Number.isInteger(maxRoutes) || maxRoutes<1 || maxRoutes>25)
    throw Error('maxRoutes must be an integer from 1 to 25');
  const known=new Set(), ordered=[];
  const append=(value,from=SITE)=>{
    const url=normalized21stUrl(value,from);
    if(url && !known.has(url)){known.add(url);ordered.push(url);}
  };
  for(const item of queue)append(item);
  for(const [page,record] of Object.entries(observations)){
    if(!normalized21stUrl(page))continue;
    for(const link of record?.links??[])append(link.url??link.href,page);
    for(const group of record?.sidebarGroups??[])
      for(const link of group.links??[])append(link.url??link.href,page);
  }
  const normalizedCursor=cursor===null?null:normalized21stUrl(cursor);
  if(cursor!==null && (!normalizedCursor || !known.has(normalizedCursor)))
    throw Error('Unknown census cursor');
  const start=normalizedCursor?ordered.indexOf(normalizedCursor)+1:0;
  const pending=ordered.slice(start).filter(url=>!Object.hasOwn(observations,url));
  const selected=pending.slice(0,maxRoutes);
  return {queue:ordered,selected,pending,
    nextCursor:selected.at(-1)??normalizedCursor,complete:pending.length===0};
}

export function summarizeReferencePage(raw,expectedUrl,observedAt=new Date().toISOString()){
  const url=normalized21stUrl(raw?.url);
  if(!url || url!==normalized21stUrl(expectedUrl))
    throw Error('Reference browser left the expected public 21st.dev page');
  const uniqueLinks=(entries=[])=>{
    const seen=new Set(),result=[];
    for(const link of entries){
      const target=normalized21stUrl(link?.url??link?.href,url);
      if(!target || seen.has(target))continue;
      seen.add(target);
      result.push({label:compact(link?.label??link?.text),url:target,
        ...(Number.isSafeInteger(link?.count)&&link.count>=0?{count:link.count}:{}),
        ...(typeof link?.active==='boolean'?{active:link.active}:{})});
    }
    return result;
  };
  return {url,title:compact(raw?.title),observedAt,
    viewport:{width:Number(raw?.viewport?.width)||0,height:Number(raw?.viewport?.height)||0},
    headings:(raw?.headings??[]).slice(0,100).map(compact).filter(Boolean),
    sidebarGroups:(raw?.sidebarGroups??[]).slice(0,60).map(group=>({
      heading:compact(group?.heading),links:uniqueLinks((group?.links??[]).slice(0,1500))})),
    controls:(raw?.controls??[]).slice(0,800).map(control=>({
      kind:compact(control?.kind),label:compact(control?.label),
      ...(typeof control?.expanded==='boolean'?{expanded:control.expanded}:{}),
      ...(typeof control?.selected==='boolean'?{selected:control.selected}:{}),
      ...(typeof control?.disabled==='boolean'?{disabled:control.disabled}:{})}))
      .filter(control=>control.kind&&control.label),
    links:uniqueLinks((raw?.links??[]).slice(0,3000))};
}

// Read-only DOM census. Never click forms, bookmark, save, purchase or login.
const DOM_READ=String.raw`JSON.stringify((()=>{
 const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
 const label=e=>String(e.getAttribute('aria-label')||e.innerText||
   e.getAttribute('title')||'').replace(/\s+/g,' ').trim().slice(0,160);
 const count=s=>{const m=s.match(/(?:^|\s)([0-9][0-9,.]*)(k)?\s*$/i);
   return m?Math.round(Number(m[1].replace(/,/g,''))*(m[2]?1000:1)):null};
 const anchor=a=>{const text=label(a),n=count(text);return {
   text,href:a.getAttribute('href'),...(n===null?{}:{count:n}),
   active:a.getAttribute('aria-current')==='page'||a.dataset.active==='true'}};
 // 21st.dev renders its sidebar in a div, not a semantic <aside>.
 // Use observed Marketing Blocks / UI Components section boundaries first.
 const sidebar=document.querySelector('[class~="group/sidebar"]');
 const navBlocks=sidebar?[...sidebar.querySelectorAll('div.pb-4')]:[];
 const grouped=navBlocks.find(block=>[...block.children].filter(child=>
   child.querySelectorAll('a[href]').length>0).length>=2);
 const regions=grouped?[...grouped.children].filter(child=>
   child.querySelectorAll('a[href]').length>0):[];
 if(!regions.length&&sidebar&&visible(sidebar))regions.push(sidebar);
 if(!regions.length)regions.push(...[...document.querySelectorAll('aside,[role=complementary]')]
   .filter(visible).slice(0,12));
 if(!regions.length)regions.push(...[...document.querySelectorAll('nav,[role=navigation]')]
   .filter(visible).slice(0,12));
 return {url:location.href,title:document.title,
   viewport:{width:innerWidth,height:innerHeight},
   headings:[...document.querySelectorAll('h1,h2,h3')].filter(visible)
     .slice(0,100).map(label).filter(Boolean),
   sidebarGroups:regions.map(region=>({
     heading:region.querySelector('h2,h3,summary')?
       label(region.querySelector('h2,h3,summary')).slice(0,80):'',
     links:[...region.querySelectorAll('a[href]')].filter(visible).slice(0,1500).map(anchor)})),
   controls:[...document.querySelectorAll('button,input,select,textarea,[role=combobox],[role=tab]')]
     .filter(visible).slice(0,800).map(el=>({
       kind:el.tagName==='INPUT'?'search':(el.getAttribute('role')||el.tagName.toLowerCase()),
       label:label(el)||el.getAttribute('placeholder')||'',
       expanded:el.getAttribute('aria-expanded')==='true',
       selected:el.getAttribute('aria-selected')==='true',
       disabled:Boolean(el.disabled||el.getAttribute('aria-disabled')==='true')})),
   links:[...document.querySelectorAll('a[href]')].filter(visible).slice(0,3000).map(anchor)};
})())`;

function toolJson(command,args,timeout=30000){
  const stdout=execFileSync(command,args,{encoding:'utf8',timeout,maxBuffer:8*1024*1024});
  const start=stdout.indexOf('{');
  if(start<0)throw Error('Tool did not return JSON');
  return JSON.parse(stdout.slice(start));
}
function optionsFrom(argv){
  const stateHome=process.env.XDG_STATE_HOME||join(homedir(),'.local','state');
  const output=join(stateHome,'registry-atlas','research','21st-reference-census.json');
  const opts={profile:null,server:null,tab:null,output,maxRoutes:5,cursor:null,dryRun:false};
  const flags={'--profile':'profile','--server':'server','--tab':'tab',
    '--output':'output','--max-routes':'maxRoutes','--cursor':'cursor'};
  for(let i=0;i<argv.length;i++){
    if(argv[i]==='--dry-run'){opts.dryRun=true;continue;}
    const key=flags[argv[i]];
    if(!key || !argv[i+1] || argv[i+1].startsWith('--'))
      throw Error('Unknown or incomplete argument '+argv[i]);
    opts[key]=argv[++i];
  }
  opts.maxRoutes=Number(opts.maxRoutes);
  if(!isAbsolute(opts.output))throw Error('Output must be an absolute path');
  if(!Number.isInteger(opts.maxRoutes)||opts.maxRoutes<1||opts.maxRoutes>25)
    throw Error('Expected --max-routes in 1..25');
  if(opts.cursor&&!normalized21stUrl(opts.cursor))throw Error('Unsafe census cursor');
  if(!opts.dryRun&&(!opts.server||!opts.tab||opts.profile!=='design-ui-ux'))
    throw Error('Live census requires --profile design-ui-ux --server --tab');
  return opts;
}
async function loadCensus(file){
  try {
    const state=JSON.parse(await readFile(file,'utf8'));
    if(state.schema!==SCHEMA||!Array.isArray(state.queue)||!state.observations||
      !state.errors)throw Error('Unrecognized census file');
    return state;
  }catch(error){
    if(error.code!=='ENOENT')throw error;
    return {schema:SCHEMA,source:SITE,queue:[...SEEDS],observations:{},errors:{}};
  }
}
async function persist(file,state){
  await mkdir(dirname(file),{recursive:true});
  const temp=file+'.tmp-'+process.pid;
  await writeFile(temp,JSON.stringify(state,null,2)+'\n',{mode:0o600});
  await rename(temp,file);
}
export async function main(argv){
  const opts=optionsFrom(argv),file=resolve(opts.output);
  const state=await loadCensus(file);
  const batch=planReferenceRoutes({...state,maxRoutes:opts.maxRoutes,cursor:opts.cursor});
  if(opts.dryRun)return {schema:SCHEMA,dryRun:true,
    observed:Object.keys(state.observations).length,
    selected:batch.selected,pending:batch.pending.length,nextCursor:batch.nextCursor};
  const manager=toolJson('pinchtab-profile-manager',[opts.profile,'status','--json']);
  if(!manager.ok || !manager.data?.instances?.some(i=>
    i.url===opts.server&&i.status==='running'))throw Error('Unverified managed design profile');
  const tabs=toolJson('pinchtab',['--server',opts.server,'tab','--json']);
  if(!tabs.tabs?.some(tab=>tab.id===opts.tab))throw Error('Tab does not belong to design profile');
  await mkdir(dirname(file),{recursive:true});
  const lock=await open(file+'.lock','wx',0o600),processed=[];
  try{
    state.queue=batch.queue;
    for(const url of batch.selected){
      try{
        const nav=toolJson('pinchtab',['--server',opts.server,'nav',url,
          '--tab',opts.tab,'--json'],45000);
        if(normalized21stUrl(nav.url)!==url)throw Error('Unexpected final route');
        const snapshot=toolJson('pinchtab',['--server',opts.server,'eval',
          DOM_READ,'--tab',opts.tab,'--json'],30000);
        const record=summarizeReferencePage(JSON.parse(snapshot.result),url);
        state.observations[url]=record;delete state.errors[url];
        processed.push({url,status:'page-observed',links:record.links.length,
          sidebarGroups:record.sidebarGroups.length,controls:record.controls.length});
      }catch(error){
        state.errors[url]={message:String(error.message).slice(0,240),
          checkedAt:new Date().toISOString()};
        processed.push({url,status:'unresolved',reason:state.errors[url].message});
      }
      state.queue=planReferenceRoutes({...state,maxRoutes:25}).queue;
      await persist(file,state);
    }
    const next=planReferenceRoutes({...state,maxRoutes:opts.maxRoutes});
    return {schema:SCHEMA,output:file,processed,
      observed:Object.keys(state.observations).length,pending:next.pending.length,
      errors:Object.keys(state.errors).length,nextCursor:batch.selected.at(-1)??opts.cursor??null};
  }finally{await lock.close();await unlink(file+'.lock');}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main(process.argv.slice(2)).then(result=>console.log(JSON.stringify(result,null,2)))
    .catch(error=>{console.error('Reference census failed: '+error.message);process.exitCode=1});
}
