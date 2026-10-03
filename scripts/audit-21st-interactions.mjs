import { execFileSync } from 'node:child_process';
import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { normalized21stUrl } from './audit-21st-reference.mjs';

const schema = 'registry-atlas-reference-interactions/v1';
const scenarios = {
  'filter-open': {label:'Filter',role:'button'},
  'sort-newest': {label:'Newest',role:'tab'},
};

export function selectReferenceAction(url, scenario, snapshot) {
  const path = normalized21stUrl(url);
  if (!path || !/^https:\/\/21st\.dev\/community\/components\/s\/[a-z0-9-]+$/.test(path)) return null;
  const approved = scenarios[scenario];
  if (!approved || !Array.isArray(snapshot?.nodes)) return null;
  const exact = snapshot.nodes.filter(node => node?.name === approved.label
    && node?.role === approved.role && /^e\d+$/.test(String(node.ref)));
  if (exact.length !== 1) return null;
  return {ref:exact[0].ref, label:approved.label,role:approved.role};
}

export function assessReferenceTransition(scenario, before, after) {
  if (!before || !after || normalized21stUrl(before.url) !== normalized21stUrl(after.url)
    || !normalized21stUrl(before.url)) return {status:'unverified'};
  if (scenario === 'filter-open') {
    const old = new Set(before.filterGroups ?? []);
    const added = (after.filterGroups ?? []).filter(group => !old.has(group));
    return {status:added.includes('Category') && added.includes('Time')
      ? 'interaction-verified' : 'unverified', evidence:{newVisibleGroups:added}};
  }
  if (scenario === 'sort-newest') {
    const selected = page => (page?.tabs ?? []).find(tab => tab.label === 'Newest')?.selected;
    return {status:selected(before) === false && selected(after) === true
      ? 'interaction-verified' : 'unverified',evidence:{before:selected(before),after:selected(after)}};
  }
  return {status:'unverified'};
}

const STATE_READ = String.raw`JSON.stringify((()=>{
  const visible=e=>{const r=e.getBoundingClientRect();return r.width>0&&r.height>0};
  const name=e=>(e.getAttribute('aria-label')||e.innerText||'').trim().replace(/\s+/g,' ').slice(0,100);
  const known=/^(Category|Time|Primitive library|Tailwind version|License|Library|Built with|Author|Tags(?: \(\d+\))?)$/;
  return {url:location.href,at:new Date().toISOString(),
    filterGroups:[...document.querySelectorAll('button')].filter(visible).map(name).filter(t=>known.test(t)),
    tabs:[...document.querySelectorAll('[role=tab]')].filter(visible).map(e=>({label:name(e),selected:e.getAttribute('aria-selected')==='true'})),
    headings:[...document.querySelectorAll('h1')].filter(visible).map(name)};
})())`;

function tool(command,args,timeout=30000){
  const out=execFileSync(command,args,{encoding:'utf8',timeout,maxBuffer:8*1024*1024});
  const start=out.indexOf('{');if(start<0)throw Error('No JSON tool response');
  return JSON.parse(out.slice(start));
}
function argumentsOf(argv){
  const flags=['--server','--tab','--scenario','--url','--output','--census'];
  const options={};
  for(let i=0;i<argv.length;i++){
    if(!flags.includes(argv[i])||!argv[i+1]||argv[i+1].startsWith('--'))throw Error('Unknown or missing argument '+argv[i]);
    options[argv[i].slice(2)]=argv[++i];
  }
  const root=join(homedir(),'.local','state','registry-atlas','research');
  options.output??=join(root,'21st-interactions.json');
  options.census??=join(root,'21st-reference-census.json');
  if(!options.server||!options.tab||!scenarios[options.scenario]||
    !isAbsolute(options.output)||!isAbsolute(options.census))throw Error('Missing managed profile or output arguments');
  if(!selectReferenceAction(options.url,options.scenario,{nodes:[
    {ref:'e1',role:scenarios[options.scenario].role,name:scenarios[options.scenario].label},
  ]}))throw Error('Route or action is not allowlisted');
  return options;
}
async function main(argv){
  const options=argumentsOf(argv);
  const census=JSON.parse(await readFile(options.census,'utf8'));
  if(!Object.hasOwn(census.observations??{}, normalized21stUrl(options.url)))
    throw Error('Reference route must be page-observed in census before action');
  const status=tool('pinchtab-profile-manager',['design-ui-ux','status','--json']);
  if(!status.ok||!status.data?.instances?.some(i=>i.status==='running'&&i.url===options.server))
    throw Error('Managed design profile is not running at this server');
  const tabs=tool('pinchtab',['--server',options.server,'tab','--json']);
  if(!tabs.tabs?.some(tab=>tab.id===options.tab))throw Error('Tab is not in design profile');
  const browser=(command,...args)=>tool('pinchtab',['--server',options.server,command,...args,'--tab',options.tab,'--json']);
  const navigate=browser('nav',options.url);
  if(normalized21stUrl(navigate.url)!==normalized21stUrl(options.url))throw Error('Reference route changed unexpectedly');
  const before=JSON.parse(browser('eval',STATE_READ).result);
  const action=selectReferenceAction(before.url,options.scenario,browser('snap'));
  if(!action)throw Error('Allowed control is missing or ambiguous');
  let clickToolError=null;
  try{browser('click',action.ref);}catch(error){clickToolError=String(error.message).slice(0,250);}
  const after=JSON.parse(browser('eval',STATE_READ).result);
  const result=assessReferenceTransition(options.scenario,before,after);
  const item={scenario:options.scenario,url:normalized21stUrl(options.url),
    action:{label:action.label,role:action.role}, before,after,
    status:result.status,evidence:result.evidence,
    ...(clickToolError?{clickToolError}:{}), recordedAt:new Date().toISOString()};
  let output={schema,events:[]};
  try{output=JSON.parse(await readFile(options.output,'utf8'));if(output.schema!==schema)throw Error('Invalid interaction file schema');}
  catch(error){if(error.code!=='ENOENT')throw error;}
  output.events.push(item);
  await mkdir(dirname(options.output),{recursive:true});
  const temp=options.output+'.tmp-'+process.pid;
  await writeFile(temp,JSON.stringify(output,null,2)+'\n',{mode:0o600});
  await rename(temp,options.output);
  return {output:options.output,scenario:options.scenario,status:item.status,evidence:item.evidence};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main(process.argv.slice(2)).then(value=>console.log(JSON.stringify(value,null,2)))
    .catch(error=>{console.error('Reference interaction failed: '+error.message);process.exitCode=1});
}
