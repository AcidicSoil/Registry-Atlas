import {readFile,readdir,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const HOST=dirname(fileURLToPath(import.meta.url));
const ROOT=resolve(HOST,'../..');
const TOKEN=/^[a-z0-9][a-z0-9-]*$/;
const FILE=/^[a-zA-Z0-9][a-zA-Z0-9/._-]*\.(?:tsx?|jsx?|css|json)$/;
export function validateOfficialItem(raw,slug){
 if(!TOKEN.test(slug)||typeof raw!=='string'||Buffer.byteLength(raw)>524288)
  throw Error('unsafe-source-budget-or-identity');
 let item;
 try{item=JSON.parse(raw);}catch{throw Error('non-json-official-source');}
 if(item?.name!==slug||!Array.isArray(item.files)||item.files.length<1
  ||item.files.length>24)throw Error('official-source-identity-mismatch');
 for(const file of item.files){
  if(!FILE.test(file?.path??'')||file.path.split('/').some(x=>!x||x==='.'||x==='..')
    ||typeof file.content!=='string'||Buffer.byteLength(file.content)>256000)
   throw Error('unsafe-official-source-file');
 }
 return {slug,sha256:createHash('sha256').update(raw).digest('hex'),
  fileCount:item.files.length};
}
export async function fetchMissingRegistrySource({registry='8bitcn',concurrency=3,
 fetcher=fetch}={}){
 if(!TOKEN.test(registry)||!Number.isInteger(concurrency)||concurrency<1||concurrency>4)
  throw Error('invalid-source-fetch-options');
 const policy=JSON.parse(await readFile(join(HOST,'reviews',registry+'-policy.json'),'utf8'));
 if(policy.namespace!=='@'+registry||policy.license?.decision!=='approved'
  ||policy.sourceDir!=='sources/'+registry)throw Error('unreviewed-source-registry');
 const template=policy.sourceUrlPattern;
 const sample=new URL(template.replace('{slug}','example'));
 if(sample.protocol!=='https:'||sample.port||sample.username||sample.password
  ||sample.search||sample.hash||!sample.pathname.endsWith('/example.json'))
  throw Error('invalid-official-source-endpoint');
 const catalog=JSON.parse(await readFile(join(ROOT,'public/data/registry-catalog-items.json'),'utf8'));
 const slugs=[...new Set((catalog.registries[policy.namespace]??[])
   .map(item=>item.name).filter(name=>TOKEN.test(name)))].sort();
 const cache=join(HOST,'sources',registry);
 await mkdir(cache,{recursive:true});
 const all=new Set((await readdir(cache)).filter(name=>name.endsWith('.json'))
  .map(name=>name.slice(0,-5)));
 const missing=slugs.filter(name=>!all.has(name));
 const records=[],errors=[];
 let cursor=0;
 async function worker(){
  while(cursor<missing.length){
   const slug=missing[cursor++];
   const url=new URL(template.replace('{slug}',slug));
   if(url.origin!==sample.origin||!url.pathname.endsWith('/'+slug+'.json')){
    errors.push({slug,reason:'untrusted-source-url'});continue;
   }
   try{
    const response=await fetcher(url.href,{redirect:'error',signal:AbortSignal.timeout(18000)});
    if(!response.ok)throw Error('upstream-http-'+response.status);
    const announced=Number(response.headers.get('content-length')??0);
    if(announced>524288)throw Error('unsafe-source-budget-or-identity');
    const raw=await response.text();
    const inspection=validateOfficialItem(raw,slug);
    const file=join(cache,slug+'.json');
    if(existsSync(file))continue;
    const temp=file+'.tmp-'+process.pid;
    try{await writeFile(temp,raw,{flag:'wx'});await rename(temp,file);}
    catch(e){await rm(temp,{force:true});throw e;}
    records.push(inspection);
   }catch(e){
    errors.push({slug,reason:/^upstream-http-[0-9]+$/.test(e.message)?e.message:
      ['official-source-identity-mismatch','unsafe-official-source-file',
       'unsafe-source-budget-or-identity','non-json-official-source'].includes(e.message)
       ?e.message:'official-source-fetch-failed'});
   }
  }
 }
 await Promise.all(Array.from({length:Math.min(concurrency,missing.length)},worker));
 records.sort((a,b)=>a.slug.localeCompare(b.slug));
 errors.sort((a,b)=>a.slug.localeCompare(b.slug));
 return {schema:'registry-atlas-official-source-bulk-cache/v1',namespace:policy.namespace,
  totalCatalogItems:slugs.length,initiallyCached:slugs.length-missing.length,
  attempted:missing.length,ingested:records.length,unavailable:errors.length,
  errors,records};
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 const registry=process.argv[2]??'8bitcn';
 fetchMissingRegistrySource({registry}).then(x=>console.log(JSON.stringify(x,null,2)))
 .catch(e=>{console.error('Bulk source fetch failed: '+e.message);process.exitCode=1;});
}
