import {readFile,readdir,writeFile,rename,mkdir,rm} from 'node:fs/promises';
import {homedir} from 'node:os';
import {dirname,join,isAbsolute,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {prepareRegistryItem} from './publish.mjs';
import {buildSharedPreview} from './shared-compiler.mjs';
const HOST=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(HOST,'../..');
const NAME=/^[a-z0-9][a-z0-9-]*$/;
const clamp=limit=>Number.isInteger(limit)&&limit>0&&limit<=50;
export async function compileCachedRegistryBatch({registry,limit=20,after='',only=null}={}){
 if(!NAME.test(registry??'')||!clamp(limit)||after&&!NAME.test(after)
     ||only!==null&&(!Array.isArray(only)||only.some(v=>!NAME.test(v))))
   throw Error('Invalid bounded preview request');
 const policy=JSON.parse(await readFile(join(HOST,'reviews',registry+'-policy.json'),'utf8'));
 if(policy.schema!=='registry-atlas-shared-preview-policy/v1'||policy.namespace!=='@'+registry)
   throw Error('Unknown or unapproved preview registry');
 const catalog=JSON.parse(await readFile(join(ROOT,'public/data/registry-catalog-items.json'),'utf8'));
 const registered=new Set((catalog.registries[policy.namespace]??[]).map(item=>item.name));
 const list=only ?? (await readdir(join(HOST,policy.sourceDir)))
   .filter(name=>name.endsWith('.json'))
   .map(name=>name.slice(0,-5)).filter(slug=>registered.has(slug));
 const ordered=[...new Set(list)].sort().filter(slug=>!after||slug>after).slice(0,limit);
 const rows=[];
 for(const slug of ordered){
  try{
   if(!registered.has(slug))throw Error('source-not-in-directory');
   const {source,review}=await prepareRegistryItem(registry,slug);
   const bundle=await buildSharedPreview(source,review);
   if(bundle.status!=='built-unverified')rows.push({namespace:policy.namespace,slug,
     status:'blocked',reason:bundle.reason});
   else rows.push({namespace:policy.namespace,slug,status:'built-unverified',
     sourceSha256:bundle.sourceSha256,bundleSha256:bundle.bundleSha256,bytes:bundle.html.length});
  }catch(err){rows.push({namespace:policy.namespace,slug,status:'blocked',
      reason:String(err.message).slice(0,140)});}
 }
 return {
  schema:'registry-atlas-shared-preview-batch/v1',
  registry:policy.namespace,
  cursor:ordered.at(-1)??after,
  summary:{directoryItems:registered.size,cachedCount:list.length,attempted:rows.length,
    compiledUnverified:rows.filter(row=>row.status==='built-unverified').length,
    blocked:rows.filter(row=>row.status==='blocked').length,
    interactionVerified:0},
  rows,
  warning:'Compilation does not verify runtime behavior or promote a manifest entry.',
 };
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),options={};
 for(let i=0;i<args.length;i+=2){
  if(!['--registry','--limit','--after','--out'].includes(args[i])
     ||!args[i+1]||options[args[i]])throw Error('Invalid batch command arguments');
  options[args[i]]=args[i+1];
 }
 const out=options['--out'];
 if(!out||!isAbsolute(out)||!out.startsWith(join(homedir(),'.local/state/registry-atlas')+'/'))
   throw Error('Batch reports must use a private absolute Registry Atlas state path');
 compileCachedRegistryBatch({registry:options['--registry'],limit:Number(options['--limit']),after:options['--after']??''})
   .then(async report=>{
      await mkdir(dirname(out),{recursive:true});
      const temp=out+'.tmp-'+process.pid;
      try{await writeFile(temp,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
        await rename(temp,out);}
      catch(error){await rm(temp,{force:true});throw error;}
      console.log(JSON.stringify({path:out,summary:report.summary,cursor:report.cursor},null,2));
   }).catch(err=>{console.error('Batch blocked: '+err.message);process.exitCode=1;});
}
