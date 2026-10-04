import {readFile,readdir,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareRegistryItem} from './publish.mjs';
import {verifyReceipts,supportedBehavior} from './verify-batch.mjs';

const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const HOST=dirname(fileURLToPath(import.meta.url));
const HASH=/^[0-9a-f]{64}$/;
const NAME=/^[a-z0-9][a-z0-9-]*$/;
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const SOURCE_HOST='http://127.0.0.1:5198';
const MANIFEST=join(ROOT,'src/registry-explorer/data/component-demo-manifest.json');
const DEST=join(ROOT,'public/component-demos/generated');

export function selectReviewedProofCandidates(cached,manifest,{registry='8bitcn',limit=12}={}){
 if(!NAME.test(registry)||!Number.isInteger(limit)||limit<1||limit>200
   ||!Array.isArray(cached)||!Array.isArray(manifest?.items))throw Error('invalid-reviewed-proof-batch');
 const published=new Set(manifest.items.filter(entry=>entry.status==='interaction-verified')
  .map(entry=>entry.namespace+'/'+entry.slug));
 return [...new Set(cached)].filter(slug=>NAME.test(slug)
   &&!published.has('@'+registry+'/'+slug)).sort().slice(0,limit);
}

export async function runReviewedStages(selected,{registry,stage,verify}){
 if(!Array.isArray(selected)||selected.length>200||!NAME.test(registry)
   ||typeof stage!=='function'||typeof verify!=='function')
  throw Error('invalid-reviewed-stages');
 const receipts=[],blocked=[];
 // Complete the entire isolated build pass before invoking any browser API.
 for(const slug of selected){
  try{receipts.push(await stage(slug,registry));}
  catch(error){blocked.push({namespace:'@'+registry,slug,status:'blocked',
    reason:['isolated-build-blocked','unsafe-isolated-build-artifact'].includes(error?.message)
      ?error.message:'reviewed-build-unavailable'});}
 }
 process.stderr.write('Isolated build stage finished: '+receipts.length+' built; '+
  blocked.length+' blocked. Starting browser verification.\n');
 const proof=await verify(receipts);
 return {receipts,blocked,proof};
}

export function approvedPromotionCandidates(proof,receipts){
 if(proof?.schema!=='registry-atlas-preview-browser-proof/v1'
   ||!Array.isArray(proof.rows)||!Array.isArray(receipts))throw Error('invalid-browser-proof');
 const indexed=new Map(receipts.map(receipt=>[receipt.namespace+'/'+receipt.slug,receipt]));
 const admitted=[];
 const seen=new Set();
 for(const row of proof.rows){
  const id=row.namespace+'/'+row.slug;
  if(seen.has(id))throw Error('duplicate-browser-proof');
  seen.add(id);
  const receipt=indexed.get(id);
  if(row.status==='interaction-verified'
    &&receipt&&row.sourceSha256===receipt.sourceSha256
    &&row.bundleSha256===receipt.bundleSha256
    &&HASH.test(row.sourceSha256)&&HASH.test(row.bundleSha256)
    &&typeof row.before==='string'&&typeof row.after==='string'
    &&row.before!==row.after&&supportedBehavior(row.slug))admitted.push(receipt);
 }
 return admitted;
}
async function stageArtifact(slug,registry){
 const reply=await fetch(SOURCE_HOST+'/preview/@'+registry+'/'+slug,{signal:AbortSignal.timeout(35_000)});
 if(!reply.ok || reply.headers.get('x-preview-verification')!=='build-only'
   ||!reply.headers.get('content-type')?.startsWith('text/html'))
  throw Error('isolated-build-blocked');
 const bytes=Buffer.from(await reply.arrayBuffer());
 if(!bytes.length||bytes.length>1024*1024||!bytes.toString().includes("connect-src 'none'"))
  throw Error('unsafe-isolated-build-artifact');
 const {review}=await prepareRegistryItem(registry,slug);
 if(!HASH.test(review.sourceSha256))throw Error('invalid-reviewed-source-hash');
 const bundleSha256=sha(bytes);
 const output=join(DEST,bundleSha256,'index.html');
 if(existsSync(output)){
  if(sha(await readFile(output))!==bundleSha256)throw Error('artifact-collision');
 }else{
  await mkdir(dirname(output),{recursive:true});
  const tmp=output+'.tmp-'+process.pid;
  try{await writeFile(tmp,bytes,{flag:'wx'});await rename(tmp,output);}
  catch(error){await rm(tmp,{force:true});throw error;}
 }
 return {namespace:'@'+registry,slug,sourceSha256:review.sourceSha256,bundleSha256};
}
async function saveManifest(admitted,registry){
 const path=join(HOST,'reviews',registry+'-policy.json');
 const policy=JSON.parse(await readFile(path,'utf8'));
 if(policy.schema!=='registry-atlas-shared-preview-policy/v1'
   ||policy.namespace!=='@'+registry||policy.license?.decision!=='approved'
   ||policy.sourceDir!=='sources/'+registry)throw Error('registry-not-reviewed');
 const manifest=JSON.parse(await readFile(MANIFEST,'utf8'));
 if(manifest.schema!=='registry-atlas-component-demos/v1')throw Error('manifest-schema-mismatch');
 const existing=new Set(manifest.items.map(x=>x.namespace+'/'+x.slug));
 const reviewedAt=new Date().toISOString();
 for(const receipt of admitted){
  if(existing.has(receipt.namespace+'/'+receipt.slug))continue;
  const file=join(DEST,receipt.bundleSha256,'index.html');
  if(sha(await readFile(file))!==receipt.bundleSha256)throw Error('artifact-checksum-mismatch');
  const origin=JSON.parse(await readFile(join(HOST,'sources',registry,receipt.slug+'.json')));
  if(origin.name!==receipt.slug)throw Error('source-identity-mismatch');
  manifest.items.push({namespace:receipt.namespace,slug:receipt.slug,kind:'upstream-built',
   status:'interaction-verified',
   path:'/Registry-Atlas/component-demos/generated/'+receipt.bundleSha256+'/index.html',
   source:{docsUrl:policy.docsUrlPattern.replace('{slug}',receipt.slug),
    registryItemUrl:policy.sourceUrlPattern.replace('{slug}',receipt.slug)},
   reviewedAt,verifiedAt:reviewedAt,sourceSha256:receipt.sourceSha256});
 }
 manifest.items.sort((a,b)=>(a.namespace+'/'+a.slug).localeCompare(b.namespace+'/'+b.slug));
 await writeFile(MANIFEST,JSON.stringify(manifest,null,2)+'\n');
}
export async function buildAndVerifyBatch({registry='8bitcn',limit=12,server,tab,base,publish=false}={}){
 if(!NAME.test(registry)||!/^http:\/\/127\.0\.0\.1:\d{2,5}$/.test(server??'')
   ||!/^http:\/\/127\.0\.0\.1:\d{2,5}(?:\/Registry-Atlas)?$/.test(base??'')
   ||!/^[a-f0-9]{32}$/i.test(tab??''))throw Error('invalid-managed-browser');
 const policy=JSON.parse(await readFile(join(HOST,'reviews',registry+'-policy.json'),'utf8'));
 if(policy.schema!=='registry-atlas-shared-preview-policy/v1'
   ||policy.namespace!=='@'+registry||policy.license?.decision!=='approved')
   throw Error('unreviewed-registry-policy');
 const manifest=JSON.parse(await readFile(MANIFEST,'utf8'));
 const slugs=(await readdir(join(HOST,'sources',registry)))
  .filter(file=>file.endsWith('.json')).map(file=>file.slice(0,-5));
 const selected=selectReviewedProofCandidates(slugs,manifest,{registry,limit});
 const {receipts,blocked,proof}=await runReviewedStages(selected,{
  registry,stage:stageArtifact,
  verify:async staged=>verifyReceipts({receipts:staged,server,tab,base}),
 });
 const admitted=approvedPromotionCandidates(proof,receipts);
 if(publish&&admitted.length)await saveManifest(admitted,registry);
 return {schema:'registry-atlas-reviewed-build-browser-batch/v1',
  registry:'@'+registry,selected,summary:{selected:selected.length,
    built:receipts.length,buildBlocked:blocked.length,
    interactionVerified:admitted.length,unverified:proof.summary.failed,
    published:publish?admitted.length:0},blocked,proof:proof.rows};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const args=process.argv.slice(2),options={registry:'8bitcn',limit:200,publish:false};
 for(let i=0;i<args.length;i++){
  if(args[i]==='--publish'){options.publish=true;continue;}
  if(!['--registry','--limit','--server','--tab','--base'].includes(args[i]))
   throw Error('unknown-browser-batch-flag');
  const value=args[++i];
  if(!value)throw Error('missing-browser-batch-flag');
  if(args[i-1]==='--registry')options.registry=value;
  else if(args[i-1]==='--limit')options.limit=value==='all'?200:Number(value);
  else if(args[i-1]==='--server')options.server=value;
  else if(args[i-1]==='--tab')options.tab=value;
  else if(args[i-1]==='--base')options.base=value;
 }
 buildAndVerifyBatch(options).then(async report=>{
  const path=join(homedir(),'.local/state/registry-atlas/previews',
   'reviewed-browser-batch-'+Date.now()+'.json');
  await mkdir(dirname(path),{recursive:true,mode:0o700});
  await writeFile(path,JSON.stringify(report,null,2)+'\n',{flag:'wx',mode:0o600});
  console.log(JSON.stringify({report:path,summary:report.summary,selected:report.selected,
   proof:report.proof.map(({namespace,slug,status,reason})=>({namespace,slug,status,reason}))},null,2));
 }).catch(error=>{console.error('Reviewed browser batch blocked: '+error.message);process.exitCode=1;});
}
