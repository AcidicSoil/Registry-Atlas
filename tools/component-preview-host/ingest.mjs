import {readFile,writeFile,rename,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {dirname,join} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=dirname(fileURLToPath(import.meta.url));
const hash=value=>createHash('sha256').update(value).digest('hex');
const key=/^[a-z0-9][a-z0-9-]*$/;
async function readBounded(response,limit) {
 const stream=response.body?.getReader?.();
 if(!stream) {
  const text=await response.text();
  if(Buffer.byteLength(text)>limit)throw Error('Registry source byte budget exceeded');
  return text;
 }
 const chunks=[];let size=0;
 while(true){
  const {value,done}=await stream.read();
  if(done)break;
  size+=value.byteLength;
  if(size>limit){await stream.cancel().catch(()=>{});throw Error('Registry source byte budget exceeded');}
  chunks.push(value);
 }
 return Buffer.concat(chunks).toString('utf8');
}
export async function fetchRegistrySource(registry,slug,
 {fetchImpl=fetch,persist=false,maxSourceBytes=524288}={}) {
 if(!key.test(registry)||!key.test(slug))throw Error('Invalid registry or component identity');
 const policy=JSON.parse(await readFile(join(ROOT,'reviews',registry+'-policy.json'),'utf8'));
 if(policy.schema!=='registry-atlas-shared-preview-policy/v1'
   ||policy.namespace!=='@'+registry ||policy.sourceDir!=='sources/'+registry)
   throw Error('Unapproved registry source policy');
 const template=policy.sourceUrlPattern;
 if(typeof template!=='string'||!template.endsWith('/{slug}.json'))
   throw Error('Invalid official registry route template');
 const url=template.replace('{slug}',slug);
 const endpoint=new URL(url);
 if(endpoint.protocol!=='https:'||endpoint.port||endpoint.username||endpoint.password
    ||endpoint.hash||endpoint.search||endpoint.hostname==='localhost'
    ||/^(?:127|10|192)\./.test(endpoint.hostname))
   throw Error('Unsafe official registry URL');
 const response=await fetchImpl(url,{redirect:'error',credentials:'omit',signal:AbortSignal.timeout(12_000)});
 if(response.status!==200||!/^application\/json\b/.test(response.headers.get('content-type')??''))
   throw Error('Official registry source response is not approved JSON');
 const source=await readBounded(response,maxSourceBytes);
 let item;
 try{item=JSON.parse(source);}catch{throw Error('Invalid source JSON');}
 if(item?.name!==slug||!Array.isArray(item.files)||item.files.length>24
    ||item.files.length===0)throw Error('Official source identity mismatch');
 const sourceSha256=hash(source);
 const output={status:'source-observed',namespace:policy.namespace,slug,url,sourceSha256,source};
 if(!persist)return output;
 const dest=join(ROOT,policy.sourceDir,slug+'.json');
 let existing=null;
 try{existing=await readFile(dest,'utf8');}catch(err){if(err.code!=='ENOENT')throw err;}
 if(existing!==null) {
  if(hash(existing)!==sourceSha256)throw Error('An existing source revision cannot be overwritten');
  return {...output,status:'source-unchanged',path:dest};
 }
 const tmp=dest+'.tmp-'+process.pid;
 try{await writeFile(tmp,source,{mode:0o644,flag:'wx'});await rename(tmp,dest);}
 catch(error){await rm(tmp,{force:true});throw error;}
 return {...output,status:'source-cached',path:dest};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const argv=process.argv.slice(2);
 if(argv.length!==3||argv[0]!=='--registry')throw Error('Usage: node ingest.mjs --registry <name> <slug>');
 fetchRegistrySource(argv[1],argv[2],{persist:true})
  .then(({source,...record})=>console.log(JSON.stringify(record,null,2)))
  .catch(err=>{console.error('Intake blocked: '+err.message);process.exitCode=1;});
}
