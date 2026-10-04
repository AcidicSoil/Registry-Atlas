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
  tooltip:{role:'button',name:'SHOW TOOLTIP',action:'hover',
    probe:"String(Boolean([...document.querySelectorAll('[role=tooltip]')].some(e=>e.getClientRects().length>0)))"},
  'scroll-area':{action:'scroll-keyboard',targetCss:'[data-slot=scroll-area-viewport]',
    probe:"String(document.querySelector('[data-slot=scroll-area-viewport]')?.scrollTop ?? -1)"},
  faq1:{role:'button',name:'What platforms do you support?',action:'click',
    probe:"document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')"},
  faq3:{role:'button',name:'What is 8bitcn?',action:'click',
    probe:"document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')"},
  'difficulty-select':{role:'button',name:'HARD',action:'click',
    probe:"document.querySelector('button[data-variant=default]')?.textContent?.trim()",
    expectedBefore:'NORMAL',expectedAfter:'HARD'},
  'audio-settings':{role:'switch',name:'Mute Audio',action:'click',
    probe:"document.querySelector('#mute[role=switch]')?.getAttribute('aria-checked')",
    expectedBefore:'false',expectedAfter:'true'},
  'game-faq1':{role:'button',name:'+What is 8bitcn? CLEARED',action:'click',
    probe:"document.querySelector('button[aria-expanded]')?.getAttribute('aria-expanded')",
    expectedBefore:'false',expectedAfter:'true'},

};
const REGISTRY_BEHAVIOR={
 '@watermelon':{
   checkbox:{role:'checkbox',action:'click',
     probe:"document.querySelector('[role=checkbox]')?.getAttribute('aria-checked')",
     expectedBefore:'false',expectedAfter:'true'},
   switch:{role:'switch',action:'click',
     probe:"document.querySelector('[role=switch]')?.getAttribute('aria-checked')",
     expectedBefore:'false',expectedAfter:'true'},
 },
};
const behaviorFor=(slug,namespace='@8bitcn')=>namespace==='@8bitcn'
  ?TYPES[slug]:REGISTRY_BEHAVIOR[namespace]?.[slug];
export const supportedBehavior=(slug,namespace)=>Boolean(behaviorFor(slug,namespace));
export async function approvedReceiptRegistry(namespace){
 if(typeof namespace!=='string'||!/^@[a-z0-9][a-z0-9-]*$/.test(namespace))return null;
 const registry=namespace.slice(1);
 try{
   const policy=JSON.parse(await readFile(join(ROOT,'tools/component-preview-host/reviews',registry+'-policy.json'),'utf8'));
   return policy.schema==='registry-atlas-shared-preview-policy/v1'
     &&policy.namespace===namespace&&policy.license?.decision==='approved'
     &&policy.sourceDir==='sources/'+registry ? registry : null;
 }catch{return null;}
}
export const assessStaticRender=(rendered,errors)=>rendered===true&&errors==='No errors'
  ? {status:'render-verified',reason:'no-approved-interaction-contract'}
  : {status:'unverified',reason:errors==='No errors'?'original-component-not-visible':'browser-error'};
function tool(command,args,{server,tab}){
 const result=execFileSync('pinchtab',['--server',server,command,...args,'--tab',tab,...(command==='errors'?[]:['--json'])],
  {encoding:'utf8',timeout:16000,maxBuffer:3_000_000});
 if(command==='errors')return result.trim();
 try{return JSON.parse(result);}catch{throw Error('PinchTab returned malformed JSON for '+command);}
}
export function assessBehavior(slug,before,after,errorText,namespace='@8bitcn'){
 if(!behaviorFor(slug,namespace))return {status:'unverified',reason:'unrecognized-behavior'};
 if(errorText!=='No errors')return {status:'unverified',reason:'browser-error'};
 if(typeof before!=='string'||typeof after!=='string'||!before||before===after)
   return {status:'unverified',reason:'interaction-unchanged'};
 const behavior=behaviorFor(slug,namespace);
 if(behavior.expectedBefore!==undefined && before!==behavior.expectedBefore)
   return {status:'unverified',reason:'unexpected-original-state'};
 if(behavior.expectedAfter!==undefined && after!==behavior.expectedAfter)
   return {status:'unverified',reason:'unexpected-action-result'};
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
   const registry=await approvedReceiptRegistry(namespace);
   if(!registry||typeof slug!=='string'||!/^[a-z0-9][a-z0-9-]*$/.test(slug)
      ||!/^[a-f0-9]{64}$/.test(bundleSha256)
      ||!/^[a-f0-9]{64}$/.test(sourceSha256)){
     rows.push({slug,namespace,status:'unverified',reason:'unrecognized-identity'});continue;
   }
   const local=join(ROOT,'public/component-demos/generated',bundleSha256,'index.html');
   const html=await readFile(local,'utf8');
   if(hash(html)!==bundleSha256)throw Error('Cached artifact checksum mismatch: '+slug);
   const source=await readFile(join(ROOT,'tools/component-preview-host/sources',registry,slug+'.json'),'utf8');
   if(hash(source)!==sourceSha256)throw Error('Official source revision mismatch: '+slug);
   const url=base+'/component-demos/generated/'+bundleSha256+'/index.html';
   const config=behaviorFor(slug,namespace);
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
     let ref=null;
     if(!config.targetCss){
       const snap=tool('snap',[],{server,tab});
       const options=snap.nodes.filter(node=>node.role===config.role
         &&(!config.name||node.name===config.name));
       if(options.length!==1)throw Error('Expected exactly one original component control');
       ref=options[0].ref;
     }
     const before=tool('eval',[config.probe],{server,tab}).result;
     if(config.action==='scroll-keyboard'){
       tool('focus',['--css',config.targetCss],{server,tab});
       tool('press',['PageDown'],{server,tab});
       tool('wait',['--fn',"document.querySelector('[data-slot=scroll-area-viewport]')?.scrollTop > 0",
         '--timeout','3000'],{server,tab});
     }else if(config.action==='select-option'){
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
     if(config.action==='hover')
       tool('wait',['[role=tooltip]','--timeout','3000'],{server,tab});
     const after=tool('eval',[config.probe],{server,tab}).result;
     const errs=tool('errors',[],{server,tab});
     row={...row,...assessBehavior(slug,before,after,errs,namespace),
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
