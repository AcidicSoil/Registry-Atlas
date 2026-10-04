import {pathToFileURL} from 'node:url';
import {resolve} from 'node:path';
import {loadSandboxProject} from './sandbox-source.mjs';

const ID=/^@([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9._/-]*)$/;
const PACKAGE=/^(?:@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+)$/;
const STRUCTURAL=new Set([
 'unsupported-registry-item','unsupported-registry-url','unsafe-registry-url',
 'no-renderable-source','entry-file-not-resolved','component-export-unresolved',
 'conflicting-source-paths','source-file-too-large','too-many-source-files',
 'invalid-package','unsupported-package-specifier','preview-budget-exceeded',
 'upstream-identity-mismatch','unsupported-source-file','author-demo-required',
 'unreviewed-package','unpinned-package','dependency-version-mismatch',
]);
export function classifyPreviewFailure(error){
 const message=String(error?.message??'');
 const [reason,...details]=message.split(':');
 if(!STRUCTURAL.has(reason))return {status:'unavailable',reason:'source-retrieval-failed'};
 if(['unreviewed-package','unpinned-package','dependency-version-mismatch'].includes(reason)){
  const pkg=details.join(':').trim();
  return PACKAGE.test(pkg)
   ? {status:'blocked',reason,package:pkg}
   : {status:'unavailable',reason:'source-retrieval-failed'};
 }
 return {status:'blocked',reason};
}
export async function probeSourcePreviews(ids,{load=loadSandboxProject,now=new Date().toISOString()}={}){
 if(!Array.isArray(ids)||ids.length<1||ids.length>16)throw Error('probe-limit-exceeded');
 if(!Number.isFinite(Date.parse(now)))throw Error('invalid-probe-timestamp');
 const unique=new Set();
 for(const id of ids){
  const match=ID.exec(id);
  if(!match||id.length>160||match[2].split('/').some(v=>!v||v==='.'||v==='..'))
   throw Error('invalid-probe-identity');
  if(unique.has(id))throw Error('duplicate-probe-identity');
  unique.add(id);
 }
 const items=[];
 for(const id of ids){
  const [,registry,slug]=ID.exec(id);
  try{
   const result=await load(registry,slug);
   items.push({namespace:'@'+registry,slug,status:'source-resolved',
    mode:result.mode,verification:'not-interaction-verified',
    fileCount:Object.keys(result.files).length,
    dependencyCount:Object.keys(result.dependencies).length});
  }catch(error){
   items.push({namespace:'@'+registry,slug,...classifyPreviewFailure(error)});
  }
 }
 return {schema:'registry-atlas-source-preview-probes/v1',observedAt:now,
  summary:{total:items.length,sourceResolved:items.filter(v=>v.status==='source-resolved').length,
   blocked:items.filter(v=>v.status==='blocked').length,
   unavailable:items.filter(v=>v.status==='unavailable').length},
  items};
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 probeSourcePreviews(process.argv.slice(2)).then(report=>{
  process.stdout.write(JSON.stringify(report,null,2)+'\n');
 }).catch(error=>{
  console.error('Source preview probe refused: '+error.message);
  process.exitCode=1;
 });
}
