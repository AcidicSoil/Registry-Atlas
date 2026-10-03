import {readFile,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {homedir} from 'node:os';
import {dirname,join,resolve,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {fetchRegistrySource} from './ingest.mjs';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const NAME=/^[a-z0-9][a-z0-9-]*$/;
export function planRegistryIntake(catalog,registry,{limit=20,after=''}={}){
 if(!NAME.test(registry??'')||!Number.isInteger(limit)||limit<1||limit>50
   ||(after&&!NAME.test(after)))throw Error('Unsafe source intake request');
 const entries=catalog?.registries?.['@'+registry];
 if(!Array.isArray(entries))throw Error('Unknown registry directory');
 const names=[...new Set(entries.filter(e=>e.type==='registry:component')
   .map(e=>e.name).filter(name=>NAME.test(name)))].sort();
 const slugs=names.filter(name=>!after||name>after).slice(0,limit);
 return {registry,slugs,nextCursor:slugs.at(-1)??after,eligible: names.length};
}
export async function ingestRegistryBatch({registry,limit=20,after='',fetchImpl=fetch}={}){
 const catalog=JSON.parse(await readFile(join(ROOT,'public/data/registry-catalog-items.json'),'utf8'));
 const plan=planRegistryIntake(catalog,registry,{limit,after});
 const rows=[];let index=0;
 async function worker(){
  while(index<plan.slugs.length){
   const slug=plan.slugs[index++];
   try{
    const {source,...evidence}=await fetchRegistrySource(registry,slug,{fetchImpl,persist:true});
    rows.push({slug,status:evidence.status,sourceSha256:evidence.sourceSha256,url:evidence.url});
   }catch(err){rows.push({slug,status:'blocked',reason:String(err.message).slice(0,120)});}
  }
 }
 await Promise.all(Array.from({length:Math.min(3,plan.slugs.length)},worker));
 rows.sort((a,b)=>a.slug.localeCompare(b.slug));
 return {schema:'registry-atlas-preview-source-intake/v1',
   registry:'@'+registry,cursor:plan.nextCursor,
   summary:{eligible:plan.eligible,attempted:rows.length,
     cached:rows.filter(r=>['source-cached','source-unchanged'].includes(r.status)).length,
     blocked:rows.filter(r=>r.status==='blocked').length},rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),opts={};
 for(let i=0;i<args.length;i+=2){
  if(!['--registry','--limit','--after','--out'].includes(args[i])
    ||!args[i+1]||opts[args[i]])throw Error('Invalid intake arguments');
  opts[args[i]]=args[i+1];
 }
 const out=opts['--out'];
 if(!out||!isAbsolute(out)||!out.startsWith(join(homedir(),'.local/state/registry-atlas')+'/')
   ||!opts['--registry']||!opts['--limit'])
   throw Error('Provide bounded registry/limit and private output');
 ingestRegistryBatch({registry:opts['--registry'],limit:Number(opts['--limit']),after:opts['--after']??''})
   .then(async report=>{
    await mkdir(dirname(out),{recursive:true});const tmp=out+'.tmp-'+process.pid;
    try{await writeFile(tmp,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
      await rename(tmp,out);}catch(e){await rm(tmp,{force:true});throw e;}
    console.log(JSON.stringify({out,summary:report.summary,cursor:report.cursor},null,2));
   }).catch(err=>{console.error('Source intake blocked: '+err.message);process.exitCode=1;});
}
