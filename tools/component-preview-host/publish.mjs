import { readFile, mkdir, writeFile, rename, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, join, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { homedir } from 'node:os';
import { buildSharedPreview } from './shared-compiler.mjs';
const HOST=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(HOST,'../..');
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const safeRelative=value=>typeof value==='string'
  && /^[a-zA-Z0-9][a-zA-Z0-9/_-]*\.(?:json|tsx?|md)$/.test(value)
  && !value.split('/').some(part=>part==='.'||part==='..');
const within=(base,path)=>path.startsWith(base+sep);
export async function publishOne(reviewName,{outRoot=join(ROOT,'public','component-demos','generated')}={}){
 if(!/^[a-z0-9-]+\.json$/.test(reviewName))throw Error('Invalid review name');
 const review=JSON.parse(await readFile(join(HOST,'reviews',reviewName),'utf8'));
 return publishReviewed(review,outRoot);
}

// One approved registry policy applies to all its discovered source items.
// No per-item preview application or separate composition file is required.
export async function prepareRegistryItem(registry,slug){
 if(!/^[a-z0-9][a-z0-9-]*$/.test(registry)
    || !/^[a-z0-9][a-z0-9-]*$/.test(slug))throw Error('Invalid registry identity');
 const policy=JSON.parse(await readFile(join(HOST,'reviews',registry+'-policy.json'),'utf8'));
 if(policy.schema!=='registry-atlas-shared-preview-policy/v1'
    ||policy.namespace!=='@'+registry||policy.sourceDir!=='sources/'+registry)
    throw Error('Registry review policy mismatch');
 const sourcePath=policy.sourceDir+'/'+slug+'.json';
 const source=await readFile(join(HOST,sourcePath),'utf8');
 const upstream=JSON.parse(source);
 if(upstream.name!==slug||!Array.isArray(upstream.files))throw Error('Source identity mismatch');
 const matches=upstream.files.filter(file=>file.path.endsWith('/'+slug+'.tsx'));
 if(matches.length!==1)throw Error('Ambiguous or missing component export entry');
 const review={...policy,slug,sourcePath,entryFile:matches[0].path,sourceSha256:sha(source)};
 return {source,review};
}
export async function publishRegistryItem(registry,slug,
  {outRoot=join(ROOT,'public','component-demos','generated')}={}){
 const {review}=await prepareRegistryItem(registry,slug);
 return publishReviewed(review,outRoot);
}
async function publishReviewed(review,outRoot){
 if(!safeRelative(review.sourcePath))throw Error('Unsafe source file');
 const sourcePath=resolve(HOST,review.sourcePath);
 if(!within(join(HOST,'sources'),sourcePath))throw Error('Source must be a reviewed cached registry JSON');
 const privateRoot=join(homedir(),'.local','state','registry-atlas','previews');
 if(resolve(outRoot)!==outRoot)throw Error('Output root must be canonical');
 if(!within(join(ROOT,'public'),outRoot)&&!within(privateRoot,outRoot))
   throw Error('Output must stay inside reviewed public or private preview storage');
 const source=await readFile(sourcePath,'utf8');
 if(!/^[a-f0-9]{64}$/i.test(review.licenseSha256??''))throw Error('Missing reviewed license hash');
 const licenseFile=join(dirname(sourcePath),'license.md');
 const licenseBytes=await readFile(licenseFile);
 if(sha(licenseBytes)!==review.licenseSha256
    ||!licenseBytes.toString().startsWith('MIT License'))
   throw Error('License review mismatch');
 for(const [name,version] of Object.entries(review.dependencyLock??{})){
   const path=join(HOST,'node_modules',name,'package.json');
   const installed=JSON.parse(await readFile(path,'utf8'));
   if(installed.version!==version)throw Error('Installed dependency differs from pinned lock: '+name);
 }
 const built=await buildSharedPreview(source,review);
 if(built.status!=='built-unverified')throw Error('Build ineligible: '+built.reason);
 const destination=join(outRoot,built.bundleSha256,'index.html');
 if(existsSync(destination))return {status:'cache-hit-unverified',path:destination,...metadata(built)};
 const dir=dirname(destination);
 await mkdir(dir,{recursive:true});
 const tmp=destination+'.tmp-'+process.pid;
 try{
   await writeFile(tmp,built.html,{mode:0o644,flag:'wx'});
   await rename(tmp,destination);
 }catch(error){await rm(tmp,{force:true});throw error;}
 return {status:'built-unverified',path:destination,...metadata(built)};
}
function metadata(built){return {namespace:built.namespace,slug:built.slug,
 sourceSha256:built.sourceSha256,bundleSha256:built.bundleSha256,
 relativePath:'/Registry-Atlas/component-demos/generated/'+built.bundleSha256+'/index.html'};}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const argv=process.argv.slice(2);
 const task=argv[0]==='--registry' && argv.length===5 && argv[3]==='--out-root'
   ? publishRegistryItem(argv[1],argv[2],{outRoot:argv[4]})
   : argv[0]==='--registry' && argv.length===3
   ? publishRegistryItem(argv[1],argv[2])
   : argv.length===1 ? publishOne(argv[0])
     : Promise.reject(Error('Usage: node publish.mjs --registry <name> <slug>'));
 task.then(result=>console.log(JSON.stringify(result,null,2)))
 .catch(error=>{console.error('Preview publish blocked: '+error.message);process.exitCode=1;});
}
