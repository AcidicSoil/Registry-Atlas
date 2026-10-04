import { createServer } from 'node:http';
import { readFile, mkdir, stat } from 'node:fs/promises';
import { readFileSync, readdirSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createHash } from 'node:crypto';
import { loadSandboxProject } from './sandbox-source.mjs';

const HOST=dirname(fileURLToPath(import.meta.url));
const CACHE=join(homedir(),'.local','state','registry-atlas','previews','cache');
const HASH=/^[a-f0-9]{64}$/;
const NAME=/^[a-z0-9][a-z0-9-]*$/;
const exec=promisify(execFile);
const sha=v=>createHash('sha256').update(v).digest('hex');
const MAX_HTML=1024*1024;
const SAFE_CSP="default-src 'none'; connect-src 'none'; form-action 'none'; object-src 'none'; base-uri 'none'";
const literalPath=/^\/preview\/@([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9-]*)$/;
const sandboxPath=/^\/sandbox\/@([a-z0-9][a-z0-9-]*)\/([a-z0-9][a-z0-9._/-]*)$/;
const approvedBrowserOrigin=/^http:\/\/(?:127\.0\.0\.1|localhost):(?:5189|5196)$/;

export function requestKey(registry,slug,sourceHash,policyHash){
 if(!NAME.test(registry)||!NAME.test(slug)||!HASH.test(sourceHash)
   ||!HASH.test(policyHash))throw Error('Invalid reviewed preview revision');
 return sha('registry-atlas-v1:'+registry+'/'+slug+':'+sourceHash+':'+policyHash);
}

async function sourceRevision(registry,slug){
 if(!NAME.test(registry)||!NAME.test(slug))throw Error('Registry not approved');
 const policy=await readFile(join(HOST,'reviews',registry+'-policy.json'));
 const json=JSON.parse(policy);
 if(json.schema!=='registry-atlas-shared-preview-policy/v1'
   ||json.namespace!=='@'+registry||json.license?.decision!=='approved'
   ||json.sourceDir!=='sources/'+registry)throw Error('Invalid registry review policy');
 const source=await readFile(join(HOST,'sources',registry,slug+'.json'));
 if(source.length>524288||!source.length)throw Error('Invalid source size');
 const item=JSON.parse(source);
 if(item.name!==slug)throw Error('Cached source identity mismatch');
 const lockfile=await readFile(join(HOST,'pnpm-lock.yaml'));
 return {sourceSha256:sha(source),policySha256:sha(Buffer.concat([policy,lockfile]))};
}

async function isolatedBuild(registry,slug,revision){
 await mkdir(CACHE,{recursive:true,mode:0o700});
 const args=['--unshare-net','--ro-bind','/','/','--bind',CACHE,CACHE,
   '--dev-bind','/dev','/dev','--proc','/proc','--tmpfs','/tmp',
   '--chdir',HOST,'--','node','publish.mjs','--registry',registry,slug,
   '--out-root',CACHE];
 const {stdout}=await exec('bwrap',args,{timeout:30000,maxBuffer:32768});
 const meta=JSON.parse(stdout.trim());
 if(!['built-unverified','cache-hit-unverified'].includes(meta.status)
    ||meta.namespace!=='@'+registry||meta.slug!==slug
    ||meta.sourceSha256!==revision.sourceSha256
    ||!HASH.test(meta.bundleSha256))throw Error('Isolated build evidence mismatch');
 const expected=join(CACHE,meta.bundleSha256,'index.html');
 if(meta.path!==expected)throw Error('Unexpected build output path');
 const info=await stat(expected);
 if(info.size>MAX_HTML||!info.size)throw Error('Preview artifact exceeds byte limit');
 const html=await readFile(expected,'utf8');
 if(sha(html)!==meta.bundleSha256)throw Error('Preview artifact hash mismatch');
 if(!html.includes("connect-src 'none'"))throw Error('Missing preview CSP');
 return {html,sourceSha256:revision.sourceSha256,bundleSha256:meta.bundleSha256};
}

const safeJson=value=>JSON.stringify(value);
function send(res,status,body,headers={}){
 res.writeHead(status,{'Content-Type':'application/json; charset=utf-8',
   'Cache-Control':'no-store','X-Content-Type-Options':'nosniff',
   ...headers});
 res.end(safeJson(body));
}
function sendHtml(res,status,html,{cache='MISS'}={}){
 const csp=html.match(/<meta http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1]??SAFE_CSP;
 res.writeHead(status,{'Content-Type':'text/html; charset=utf-8',
   'Cache-Control':'private, no-store','Content-Security-Policy':csp,
   'X-Content-Type-Options':'nosniff','X-Preview-Cache':cache,
   'X-Preview-Verification':'build-only'});
 res.end(html);
}

export function reviewedRegistries(){
 const found=[];
 for(const file of readdirSync(join(HOST,'reviews'))){
  const match=/^([a-z0-9][a-z0-9-]*)-policy\.json$/.exec(file);
  if(!match)continue;
  try{
   const policy=JSON.parse(readFileSync(join(HOST,'reviews',file),'utf8'));
   if(policy.schema==='registry-atlas-shared-preview-policy/v1'
      &&policy.namespace==='@'+match[1]&&policy.license?.decision==='approved'
      &&policy.sourceDir==='sources/'+match[1])found.push(match[1]);
  }catch{/* Invalid policy cannot admit a registry. */}
 }
 return found.sort();
}

export function createPreviewServer({getSource=sourceRevision,build=isolatedBuild,maxActive=2,
  approvedRegistries=reviewedRegistries(),getSandboxProject=loadSandboxProject}={}){
 const pending=new Map(),cached=new Map(),sandboxes=new Map();
 let active=0;
 const server=createServer(async(req,res)=>{
  if(req.socket.remoteAddress!=='127.0.0.1'&&req.socket.remoteAddress!=='::ffff:127.0.0.1')
    return send(res,403,{status:'blocked'});
  const host='127.0.0.1:'+server.address()?.port;
  if(req.headers.host!==host)return send(res,403,{status:'blocked'});
  if(req.method!=='GET'&&req.method!=='HEAD'){
    res.setHeader('Allow','GET, HEAD');return send(res,405,{status:'method-not-allowed'});
  }
  if(req.url==='/health')return send(res,200,{status:'ready',runtime:'local-build-plus-source-sandbox',active,
    cached:cached.size,approvedRegistries:approvedRegistries.map(name=>'@'+name)});
  if(typeof req.url!=='string'||req.url.length>160)return send(res,404,{status:'not-found'});
  const sandbox=sandboxPath.exec(req.url);
  if(sandbox){
   if(req.headers.origin&&!approvedBrowserOrigin.test(req.headers.origin)
      ||req.headers['sec-fetch-site']==='cross-site')
     return send(res,403,{status:'blocked-origin'});
   const headers=req.headers.origin
     ?{'Access-Control-Allow-Origin':req.headers.origin,'Vary':'Origin'}:{};
   const key=sandbox[1]+'/'+sandbox[2];
   let record=sandboxes.get(key);
   if(!record||record.expiresAt<Date.now()){
     if(sandboxes.size>=16)sandboxes.delete(sandboxes.keys().next().value);
     const task=Promise.resolve().then(()=>getSandboxProject(sandbox[1],sandbox[2]));
     record={task,expiresAt:Date.now()+120_000};
     sandboxes.set(key,record);
     task.catch(()=>{if(sandboxes.get(key)===record)sandboxes.delete(key);});
   }
   try{
     const project=await record.task;
     return send(res,200,project,headers);
   }catch(error){
     const reason=/^(?:invalid-item-identity|item-not-in-catalog|registry-source-unavailable|unsafe-registry-url|unsupported-registry-item|no-renderable-source|entry-file-not-resolved|component-export-unresolved|conflicting-source-paths|source-file-too-large|too-many-source-files|invalid-package|unsupported-package-specifier|preview-budget-exceeded|upstream-identity-mismatch|unsupported-source-file|author-demo-required)$/.test(error?.message)
       ?error.message:'registry-preview-unavailable';
     return send(res,422,{status:'unavailable',reason},headers);
   }
  }
  const match=literalPath.exec(req.url);
  if(!match)return send(res,404,{status:'not-found'});
  const registry=match[1],slug=match[2];
  if(!approvedRegistries.includes(registry))return send(res,404,{status:'unapproved-registry'});
  try{
   const revision=await getSource(registry,slug);
   const key=requestKey(registry,slug,revision.sourceSha256,revision.policySha256);
   const previous=cached.get(key);
   if(previous)return sendHtml(res,200,previous.html,{cache:'HIT'});
   let inflight=pending.get(key);
   if(!inflight){
     if(active>=maxActive)return send(res,429,{status:'busy'},{'Retry-After':'2'});
     active++;
     inflight=Promise.resolve().then(()=>build(registry,slug,revision))
       .then(result=>{
         if(typeof result?.html!=='string'||Buffer.byteLength(result.html)>MAX_HTML
           ||!result.html.length||result.sourceSha256&&result.sourceSha256!==revision.sourceSha256)
           throw Error('Invalid compiled artifact');
         cached.set(key,result);
         if(cached.size>64)cached.delete(cached.keys().next().value);
         return result;
       }).finally(()=>{pending.delete(key);active--;});
     pending.set(key,inflight);
   }
   const compiled=await inflight;
   return sendHtml(res,200,compiled.html,{cache:'MISS'});
  }catch(error){
    const absent=error?.code==='ENOENT';
    return send(res,absent?404:422,{status:'unavailable',
      reason:absent?'reviewed-source-not-cached':'reviewed-build-unavailable'});
  }
 });
 return server;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
 const args=process.argv.slice(2);
 const portArg=args.length===2&&args[0]==='--port'?Number(args[1]):5198;
 if(!Number.isInteger(portArg)||portArg<1024||portArg>65535)throw Error('Invalid local preview port');
 const server=createPreviewServer();
 server.listen(portArg,'127.0.0.1',()=>{
   console.log(JSON.stringify({status:'ready',url:'http://127.0.0.1:'+portArg,
     mode:'local-only, source-revision-checked, network-isolated builds'}));
 });
}
