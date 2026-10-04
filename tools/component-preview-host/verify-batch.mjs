import {readFile,writeFile,rename,rm,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {homedir} from 'node:os';
import {dirname,join,resolve,isAbsolute} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
const ROOT=resolve(dirname(fileURLToPath(import.meta.url)),'../..');
const hash=value=>createHash('sha256').update(value).digest('hex');
const TYPES={
  button:{role:'button',name:'PRESS ME',action:'click',probe:"document.querySelector('[data-preview-interaction-count]')?.textContent"},
  input:{role:'textbox',action:'type',value:'real upstream works',probe:"document.querySelector('[data-preview-input-value]')?.textContent"},
  textarea:{role:'textbox',action:'type',value:'real upstream works',probe:"document.querySelector('[data-preview-input-value]')?.textContent"},
  checkbox:{role:'checkbox',action:'click',probe:"document.querySelector('[data-preview-checked]')?.textContent"},
  switch:{role:'switch',action:'click',probe:"document.querySelector('[data-preview-checked]')?.textContent"},
  toggle:{role:'button',name:'TOGGLE ME',action:'click',probe:"document.querySelector('[data-preview-checked]')?.textContent"},
  slider:{role:'slider',action:'press',value:'ArrowRight',probe:"document.querySelector('[data-preview-slider-value]')?.textContent"},
  tabs:{role:'tab',name:'SECOND TAB',action:'click',probe:"[...document.querySelectorAll('[role=tabpanel]')].filter(e=>e.getClientRects().length>0).map(e=>e.textContent).join('|')"},
  accordion:{role:'button',name:'FIRST QUESTION',action:'click',probe:"document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')"},
  collapsible:{role:'button',name:'EXPAND CONTENT',action:'click',probe:"document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')"},
  dialog:{role:'button',name:'OPEN DIALOG',action:'click',
    probe:"String(Boolean(document.querySelector('[role=dialog]')))" },
  'dropdown-menu':{role:'button',name:'OPEN MENU',action:'click',
    probe:"String(Boolean(document.querySelector('[role=menu]')))" },
  'radio-group':{role:'radio',name:'SECOND CHOICE',action:'click',
    probe:"document.querySelector('[data-preview-selection]')?.textContent"},
  select:{role:'combobox',name:'CHOOSE ITEM',action:'select-option',
    optionName:'SECOND CHOICE',probe:"document.querySelector('[data-preview-selection]')?.textContent"},

};
export const supportedBehavior=slug=>Object.hasOwn(TYPES,slug);
export const assessStaticRender=(rendered,errors)=>rendered===true&&errors==='No errors'
  ? {status:'render-verified',reason:'no-approved-interaction-contract'}
  : {status:'unverified',reason:errors==='No errors'?'original-component-not-visible':'browser-error'};
function tool(command,args,{server,tab}){
 const result=execFileSync('pinchtab',['--server',server,command,...args,'--tab',tab,...(command==='errors'?[]:['--json'])],
  {encoding:'utf8',timeout:16000,maxBuffer:3_000_000});
 if(command==='errors')return result.trim();
 try{return JSON.parse(result);}catch{throw Error('PinchTab returned malformed JSON for '+command);}
}
export function assessBehavior(slug,before,after,errorText){
 if(!TYPES[slug])return {status:'unverified',reason:'unrecognized-behavior'};
 if(errorText!=='No errors')return {status:'unverified',reason:'browser-error'};
 if(typeof before!=='string'||typeof after!=='string'||!before||before===after)
   return {status:'unverified',reason:'interaction-unchanged'};
 return {status:'interaction-verified',before,after};
}
export async function verifyReceipts({receipts,server,tab,base}){
 if(!/^http:\/\/127\.0\.0\.1:\d{2,5}$/.test(server)
   ||!/^http:\/\/127\.0\.0\.1:\d{2,5}(?:\/Registry-Atlas)?$/.test(base)
   ||!/^[a-f0-9]{32}$/i.test(tab)||!Array.isArray(receipts)||receipts.length>200)
   throw Error('Browser verification requires bounded local PinchTab/preview endpoints');
 const rows=[];
 for(const receipt of receipts){
   const {slug,namespace,bundleSha256,sourceSha256}=receipt;
   if(namespace!=='@8bitcn'||!/^[a-f0-9]{64}$/.test(bundleSha256)
      ||!/^[a-f0-9]{64}$/.test(sourceSha256)){
     rows.push({slug,status:'unverified',reason:'unrecognized-identity'});continue;
   }
   const local=join(ROOT,'public/component-demos/generated',bundleSha256,'index.html');
   const html=await readFile(local,'utf8');
   if(hash(html)!==bundleSha256)throw Error('Cached artifact checksum mismatch: '+slug);
   const source=await readFile(join(ROOT,'tools/component-preview-host/sources/8bitcn',slug+'.json'),'utf8');
   if(hash(source)!==sourceSha256)throw Error('Official source revision mismatch: '+slug);
   const url=base+'/component-demos/generated/'+bundleSha256+'/index.html';
   const config=TYPES[slug];
   let row={slug,namespace,sourceSha256,bundleSha256,status:'unverified'};
   try{
     tool('nav',[url],{server,tab});
     const inspect=tool('eval',["JSON.stringify({label:document.querySelector('.caption')?.textContent,source:location.pathname})"],{server,tab});
     const present=JSON.parse(inspect.result);
     if(!present.label?.startsWith(namespace+'/'+slug+' • compiled original source')
        ||!present.source.endsWith('/'+bundleSha256+'/index.html'))
       throw Error('Browser source identity mismatch');
     if(!config){
       const visible=tool('eval',[
         "Boolean([...document.querySelectorAll('[data-preview-original]')].some(node=>node.getClientRects().length>0))"
       ],{server,tab}).result;
       const errs=tool('errors',[],{server,tab});
       row={...row,...assessStaticRender(visible===true||visible==='true',errs),
         observedAt:new Date().toISOString()};
       rows.push(row);continue;
     }
     const snap=tool('snap',[],{server,tab});
     const options=snap.nodes.filter(node=>node.role===config.role
       &&(!config.name||node.name===config.name));
     if(options.length!==1)throw Error('Expected exactly one original component control');
     const ref=options[0].ref;
     const before=tool('eval',[config.probe],{server,tab}).result;
     if(config.action==='select-option'){
       tool('click',[ref],{server,tab});
       const optionsAfter=tool('snap',[],{server,tab}).nodes
         .filter(node=>node.role==='option'&&node.name===config.optionName);
       if(optionsAfter.length!==1)throw Error('Expected exactly one reviewed select option');
       tool('click',[optionsAfter[0].ref],{server,tab});
     }else{
       const args=config.action==='type'?[ref,config.value]
         :config.action==='press'?[ref,config.value]:[ref];
       tool(config.action,args,{server,tab});
     }
     const after=tool('eval',[config.probe],{server,tab}).result;
     const errs=tool('errors',[],{server,tab});
     row={...row,...assessBehavior(slug,before,after,errs),
       observedAt:new Date().toISOString(),action:config.action,role:config.role};
   }catch(e){row={...row,status:'unverified',reason:String(e.message).slice(0,150)};}
   rows.push(row);
 }
 return {schema:'registry-atlas-preview-browser-proof/v1',
   summary:{attempted:rows.length,verified:rows.filter(x=>x.status==='interaction-verified').length,
     failed:rows.filter(x=>x.status!=='interaction-verified').length},
   rows};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2);const slots={};
 for(let i=0;i<args.length;i+=2){
  if(!['--receipts','--server','--tab','--base','--out'].includes(args[i])
    ||!args[i+1]||slots[args[i]])throw Error('Invalid browser verification arguments');
  slots[args[i]]=args[i+1];
 }
 if(Object.keys(slots).length!==5||!isAbsolute(slots['--out'])
   ||!slots['--out'].startsWith(join(homedir(),'.local/state/registry-atlas')+'/'))
   throw Error('Output must be private absolute local state');
 const out=slots['--out'];
 readFile(slots['--receipts'],'utf8').then(JSON.parse)
  .then(receipts=>verifyReceipts({receipts,server:slots['--server'],tab:slots['--tab'],
    base:slots['--base']}))
  .then(async proof=>{
    await mkdir(dirname(out),{recursive:true});const tmp=out+'.tmp-'+process.pid;
    try{await writeFile(tmp,JSON.stringify(proof,null,2)+'\n',{mode:0o600,flag:'wx'});
      await rename(tmp,out);}catch(e){await rm(tmp,{force:true});throw e;}
    console.log(JSON.stringify({out,summary:proof.summary,rows:proof.rows},null,2));
  }).catch(error=>{console.error('Browser proof failed: '+error.message);process.exitCode=1;});
}
