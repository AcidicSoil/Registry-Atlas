import {loadSandboxProject} from './sandbox-source.mjs';
import {classifyPreviewFailure} from './preview-probes.mjs';

// This module inventories and inspects source; it never executes upstream components.
const TOKEN=/^@([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9._/-]*)$/;
const PACKAGE=/^(?:@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+)$/;
const RENDERABLE=new Set(['registry:ui','registry:component','registry:block','registry:page','registry:item']);
const SCHEMA='registry-atlas-source-probe-journal/v1';
const BLOCKS=new Set([
 'unsupported-registry-item','unsupported-registry-url','unsafe-registry-url',
 'no-renderable-source','entry-file-not-resolved','component-export-unresolved',
 'conflicting-source-paths','source-file-too-large','too-many-source-files',
 'invalid-package','unsupported-package-specifier','preview-budget-exceeded',
 'upstream-identity-mismatch','unsupported-source-file','author-demo-required',
 'unreviewed-package','unpinned-package','dependency-version-mismatch',
]);
function checkRecord(record) {
 const token=record?.namespace+'/'+record?.slug;
 const match=TOKEN.exec(token);
 if(record?.schema!==SCHEMA||!match||token.length>160
  ||match[2].split('/').some(s=>!s||s==='.'||s==='..')
  ||!Number.isFinite(Date.parse(record.observedAt))
  ||!['blocked','source-resolved','unavailable'].includes(record.status)
  ||record.status==='blocked'&&!BLOCKS.has(record.reason)
  ||record.status==='unavailable'&&record.reason!=='source-retrieval-failed'
  ||record.status==='source-resolved'
    &&(record.verification!=='not-interaction-verified'
     ||!['upstream-demo','generated-smoke-example'].includes(record.mode))
  ||record.package!==undefined
    &&(!['unreviewed-package','unpinned-package','dependency-version-mismatch'].includes(record.reason)
      ||!PACKAGE.test(record.package)))
  throw Error('invalid-probe-journal');
 return token;
}
export function parseProbeJournal(text) {
 const seen=new Map();
 for(const line of text.split('\n')){
  if(!line.trim())continue;
  let record;
  try {record=JSON.parse(line)}catch{throw Error('invalid-probe-journal');}
  const token=checkRecord(record);
  const prev=seen.get(token);
  if(!prev||Date.parse(prev.observedAt)<=Date.parse(record.observedAt))seen.set(token,record);
 }
 return seen;
}
function selectProbeWork(rows,previous,{registry,now,after,strategy}){
 if(!Array.isArray(rows)||!(previous instanceof Map)
   ||registry&&!/^@[a-z0-9][a-z0-9-]*$/.test(registry)
   ||after&&!TOKEN.test(after)||!['sequential','breadth'].includes(strategy)
   ||!Number.isFinite(Date.parse(now)))throw Error('invalid-probe-batch');
 const summary={total:rows.length,verified:0,nonRenderable:0,invalidIdentity:0,alreadyProbed:0,remaining:0};
 const eligible=[];
 const seen=new Set();
 for(const row of rows){
  const token=row?.token;
  if(seen.has(token))throw Error('duplicate-probe-identity');
  seen.add(token);
  const match=TOKEN.exec(token??'');
  if(!match || match[2].split('/').some(part=>!part||part==='.'||part==='..')){
   summary.invalidIdentity++;continue;
  }
  if(row.status==='upstream-built'||row.status==='fixture'){summary.verified++;continue;}
  if(!RENDERABLE.has(row.itemType)){summary.nonRenderable++;continue;}
  const earlier=previous.get(token);
  const age=earlier?Date.parse(now)-Date.parse(earlier.observedAt):Infinity;
  if(earlier && earlier.mode!=='generated-smoke-example'
   && age>=0 && age<(earlier.status==='unavailable'?15*60*1000:72*60*60*1000)){
   summary.alreadyProbed++;continue;
  }
  if(row.status==='blocked'&&!earlier){summary.alreadyProbed++;continue;}
  if(registry&&row.namespace!==registry)continue;
  if(after&&token<=after)continue;
  eligible.push(row);
 }
 eligible.sort((a,b)=>a.token.localeCompare(b.token));
 if(strategy!=='breadth'||registry)return {ordered:eligible,summary};
 const groups=new Map();
 for(const item of eligible){
  if(!groups.has(item.namespace))groups.set(item.namespace,[]);
  groups.get(item.namespace).push(item);
 }
 const ordered=[];
 let pass=0;
 while(ordered.length<eligible.length){
  for(const bucket of groups.values())if(bucket[pass])ordered.push(bucket[pass]);
  pass++;
 }
 return {ordered,summary};
}
export function planProbeBatch(rows,previous,{limit=32,registry,now=new Date().toISOString(),after,strategy='sequential'}={}){
 if(!Number.isInteger(limit)||limit<1||limit>200)throw Error('invalid-probe-batch');
 const {ordered,summary}=selectProbeWork(rows,previous,{registry,now,after,strategy});
 summary.remaining=Math.max(0,ordered.length-limit);
 return {batch:ordered.slice(0,limit),next:ordered[limit]?.token??null,summary};
}
export async function runProbeBatch(rows,{load=loadSandboxProject,concurrency=2,retries=1,
 now=new Date().toISOString(),wait=ms=>new Promise(done=>setTimeout(done,ms))}={}){
 if(!Array.isArray(rows)||rows.length<1||rows.length>200
  ||!Number.isInteger(concurrency)||concurrency<1||concurrency>4
  ||!Number.isInteger(retries)||retries<0||retries>2
  ||!Number.isFinite(Date.parse(now)))throw Error('invalid-probe-execution');
 const unique=new Set();
 for(const row of rows){
  const token=row?.token??row?.namespace+'/'+row?.slug;
  const match=TOKEN.exec(token);
  if(!match||!RENDERABLE.has(row.itemType)||unique.has(token)
   ||match[2].split('/').some(s=>!s||s==='.'||s==='..'))throw Error('invalid-probe-identity');
  unique.add(token);
 }
 const result=new Array(rows.length);
 let next=0;
 async function worker(){
  while(next<rows.length){
   const index=next++;
   const row=rows[index];
   const token=row.token??row.namespace+'/'+row.slug;
   const [,registry,slug]=TOKEN.exec(token);
   let finding;
   for(let attempt=0;attempt<=retries;attempt++){
    try{
     const source=await load(registry,slug);
     if(source.mode!=='upstream-demo')throw Error('author-demo-required');
     finding={status:'source-resolved',mode:source.mode,
      verification:'not-interaction-verified',
      fileCount:Object.keys(source.files).length,
      dependencyCount:Object.keys(source.dependencies).length};
     break;
    }catch(error){
     finding=classifyPreviewFailure(error);
     if(finding.status==='blocked'||attempt===retries)break;
     await wait(250*(attempt+1));
    }
   }
   const entry={schema:SCHEMA,namespace:'@'+registry,slug,observedAt:now,...finding};
   checkRecord(entry);
   result[index]=entry;
  }
 }
 await Promise.all(Array.from({length:Math.min(concurrency,rows.length)},()=>worker()));
 return result;
}
export function groupProbeEvidence(records) {
 const buckets=new Map();
 for(const record of records){
  if(record.status!=='blocked')continue;
  const key=record.reason+'\0'+(record.package??'');
  const item=buckets.get(key)??{reason:record.reason,...(record.package?{package:record.package}:{}),count:0};
  item.count++;
  buckets.set(key,item);
 }
 return {blockers:[...buckets.values()].sort((a,b)=>b.count-a.count||a.reason.localeCompare(b.reason)),
  sourceResolved:records.filter(r=>r.status==='source-resolved').length,
  blocked:records.filter(r=>r.status==='blocked').length,
  unavailable:records.filter(r=>r.status==='unavailable').length};
}

/** Progress only advances after the caller durably appends the completed batch. */
export async function runProbeSweep(rows,previous,{limit=32,batchSize=16,registry,
  strategy='breadth',concurrency=2,retries=1,now,load=loadSandboxProject,
  wait,append}={}){
 if(!Number.isInteger(limit)||limit<1||limit>100000
  ||!Number.isInteger(batchSize)||batchSize<1||batchSize>200
  ||typeof append!=='function')throw Error('invalid-probe-sweep');
 const {ordered}=selectProbeWork(rows,previous,
  {registry,now:now??new Date().toISOString(),strategy});
 const chosen=ordered.slice(0,limit);
 const results=[];
 for(let offset=0;offset<chosen.length;offset+=batchSize){
  const currentTime=now??new Date().toISOString();
  const entries=await runProbeBatch(chosen.slice(offset,offset+batchSize),
   {load,concurrency,retries,now:currentTime,wait});
  await append(entries);
  for(const entry of entries)previous.set(entry.namespace+'/'+entry.slug,entry);
  results.push(...entries);
 }
 return {processed:results.length,groups:groupProbeEvidence(results),
  remaining:ordered.length-results.length};
}
