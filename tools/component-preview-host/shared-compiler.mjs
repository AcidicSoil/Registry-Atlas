import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { dirname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const ROOT=dirname(fileURLToPath(import.meta.url));
const HASH=/^[a-f0-9]{64}$/i;
const SAFE_PATH=/^[a-zA-Z0-9][a-zA-Z0-9/._-]*\.(?:tsx?|jsx?|css)$/;
const sha=value=>createHash('sha256').update(value).digest('hex');
const blocked=reason=>({status:'blocked',reason});
const safePath=path=>typeof path==='string' && SAFE_PATH.test(path)
  && !path.split('/').some(part=>!part||part==='.'||part==='..');
const imports=source=>{
  const found=[];
  for(const match of source.matchAll(/\bimport\s+(?:type\s+)?(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g))
    found.push(match[1]);
  return found;
};
const packageName=name=>name.startsWith('@')?name.split('/').slice(0,2).join('/'):name.split('/')[0];
const exportsOf=source=>{
 const found=new Set();
 for(const m of source.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|const|class)\s+([A-Z][a-zA-Z0-9]*)/g))found.add(m[1]);
 for(const m of source.matchAll(/\bexport\s*\{\s*([^}]+)\}/g))
  for(const p of m[1].split(',')){const name=p.trim().split(/\s+as\s+/).at(-1);if(/^[A-Z][a-zA-Z0-9]*$/.test(name))found.add(name);}
 return [...found];
};

export function planSharedPreview(raw,review) {
  if(typeof raw!=='string'||Buffer.byteLength(raw)>524288)return blocked('source-budget-exceeded');
  if(review?.license?.decision!=='approved'||!review.license.identifier||!review.license.reviewer)
    return blocked('license-not-approved');
  if(!HASH.test(review.sourceSha256??'')||sha(raw)!==review.sourceSha256)
    return blocked('source-hash-mismatch');
  if(!/^@[a-z0-9][a-z0-9-]*$/.test(review.namespace??'')
    || !/^[a-z0-9][a-z0-9._/-]*$/.test(review.slug??''))return blocked('invalid-identity');
  let source;
  try{source=JSON.parse(raw);}catch{return blocked('source-not-json');}
  if(source.name!==review.slug||!Array.isArray(source.files)
     ||!source.files.length||source.files.length>24)return blocked('source-identity-mismatch');
  if(source.files.some(f=>!safePath(f.path)||typeof f.content!=='string'
    ||Buffer.byteLength(f.content)>256000))return blocked('unsafe-source-path');
  const fileMap=new Map(source.files.map(f=>[f.path,f]));
  if(fileMap.size!==source.files.length)return blocked('duplicate-source-path');
  if(!fileMap.has(review.entryFile)||!/\.tsx?$/.test(review.entryFile))
    return blocked('missing-reviewed-entry');
  if(!Array.isArray(source.dependencies??[])||!Array.isArray(source.registryDependencies??[]))
    return blocked('invalid-dependency-graph');
  if(!review.dependencyLock||typeof review.dependencyLock!=='object'
    ||Object.entries(review.dependencyLock).some(([name,version])=>
       !/^(@[a-z0-9._-]+\/)?[a-z0-9._-]+$/.test(name)
       ||!/^\d+\.\d+\.\d+$/.test(version)))return blocked('dependency-not-pinned');
  const aliasMap=review.aliases??{};
  for(const f of source.files){
    if(/(?:\bimport\s*\(|\brequire\s*\(|\bfetch\s*\()/.test(f.content))
      return blocked('dynamic-import-or-network');
    if(f.path.endsWith('.css'))continue;
    for(const name of imports(f.content)){
      if(name.startsWith('@/')){
        if(!fileMap.has(name.slice(2))&&!aliasMap[name])return blocked('unreviewed-import');
      }else if(name.startsWith('./')||name.startsWith('../')){
        if(!fileMap.has(resolve('/',dirname(f.path),name).slice(1)))return blocked('unreviewed-import');
      }else if(!review.dependencyLock[packageName(name)])return blocked('unreviewed-import');
    }
  }
  for(const item of Object.values(aliasMap))
    if(!safePath(item?.path)||!HASH.test(item.sha256??''))return blocked('unreviewed-alias');
  const names=exportsOf(fileMap.get(review.entryFile).content);
  const expected=review.slug.split(/[^a-zA-Z0-9]/)
    .map(segment=>segment[0]?.toUpperCase()+segment.slice(1)).join('');
  const exportName=review.exportName??(names.includes(expected)?expected:names[0]);
  if(!exportName||!names.includes(exportName))return blocked('component-export-unresolved');
  return {status:'eligible',namespace:review.namespace,slug:review.slug,
    entryFile:review.entryFile,exportName,sourceSha256:review.sourceSha256,
    files:[...fileMap.values()],aliasMap,dependencyLock:review.dependencyLock};
}

const harness=(exportName,identity)=> {
 const text=/^(?:Input|TextArea|Textarea|SearchInput)$/i.test(exportName);
 const checkbox=/^(?:Checkbox|Switch)$/i.test(exportName);
 const toggle=/^Toggle$/i.test(exportName);
 const slider=/^Slider$/i.test(exportName);
 const staticComponent=/^(?:Badge|Kbd|Spinner|Card|Alert|Skeleton|Separator|Label|Avatar|Progress|Table)$/i.test(exportName);
 const button= /^(?:Button|Counter)$/i.test(exportName);
 const composition={
  Tabs:"React.createElement(Component,{'data-preview-original':'',defaultValue:'first'},React.createElement(Upstream.TabsList,null,React.createElement(Upstream.TabsTrigger,{value:'first'},'FIRST TAB'),React.createElement(Upstream.TabsTrigger,{value:'second'},'SECOND TAB')),React.createElement(Upstream.TabsContent,{value:'first'},'FIRST PANEL'),React.createElement(Upstream.TabsContent,{value:'second'},'SECOND PANEL')),",
  Accordion:"React.createElement(Component,{'data-preview-original':'',type:'single',collapsible:true,defaultValue:'first'},React.createElement(Upstream.AccordionItem,{value:'first'},React.createElement(Upstream.AccordionTrigger,null,'FIRST QUESTION'),React.createElement(Upstream.AccordionContent,null,'FIRST ANSWER'))),",
  Collapsible:"React.createElement(Component,{'data-preview-original':'',defaultOpen:false},React.createElement(Upstream.CollapsibleTrigger,null,'EXPAND CONTENT'),React.createElement(Upstream.CollapsibleContent,null,'EXPANDED CONTENT')),",
  Dialog:"React.createElement(Component,{'data-preview-original':''},React.createElement(Upstream.DialogTrigger,{asChild:true},React.createElement('button',{type:'button'},'OPEN DIALOG')),React.createElement(Upstream.DialogContent,null,React.createElement(Upstream.DialogTitle,null,'DIALOG CONTENT'),React.createElement('p',null,'CONTENT OPENED'))),",
  DropdownMenu:"React.createElement(Component,{'data-preview-original':''},React.createElement(Upstream.DropdownMenuTrigger,{asChild:true},React.createElement('button',{type:'button'},'OPEN MENU')),React.createElement(Upstream.DropdownMenuContent,null,React.createElement(Upstream.DropdownMenuItem,null,'MENU ACTION'))),",
  RadioGroup:"React.createElement(Component,{'data-preview-original':'',value:selection,onValueChange:setSelection},React.createElement(Upstream.RadioGroupItem,{value:'first','aria-label':'FIRST CHOICE'}),React.createElement(Upstream.RadioGroupItem,{value:'second','aria-label':'SECOND CHOICE'})),",
  Select:"React.createElement(Component,{'data-preview-original':'',value:selection,onValueChange:setSelection},React.createElement(Upstream.SelectTrigger,{'aria-label':'CHOOSE ITEM'},React.createElement(Upstream.SelectValue,{placeholder:'Choose an item'})),React.createElement(Upstream.SelectContent,null,React.createElement(Upstream.SelectItem,{value:'first'},'FIRST CHOICE'),React.createElement(Upstream.SelectItem,{value:'second'},'SECOND CHOICE'))),",
 };
 const composed=Object.hasOwn(composition,exportName);
 const primitive=composed?composition[exportName]:checkbox
   ? "React.createElement(Component,{'data-preview-original':'',checked,onCheckedChange:value=>setChecked(value===true)}),"
   : toggle
     ? "React.createElement(Component,{'data-preview-original':'',pressed:checked,onPressedChange:value=>setChecked(value===true)},'TOGGLE ME'),"
     : slider
       ? "React.createElement(Component,{'data-preview-original':'',value:[value],min:0,max:100,step:1,onValueChange:values=>setValue(values[0])}),"
       : text
         ? "React.createElement(Component,{'data-preview-original':'',type:'text',value:words,disabled,onChange:e=>setWords(e.target.value),placeholder:'Type to test'}),"
         : staticComponent
           ? "React.createElement(Component,{'data-preview-original':''}),"
           : button
             ? "React.createElement(Component,{'data-preview-original':'',type:'button',onClick:()=>setCount(n=>n+1),disabled},'PRESS ME'),"
             : "React.createElement(Component,{'data-preview-original':''}),";
 const output=['RadioGroup','Select'].includes(exportName)
   ? "React.createElement('output',{'data-preview-selection':'','aria-live':'polite'},'Selected '+selection),"
   : composed
   ? "React.createElement('output',{'data-preview-composed':''},'Interact with the original controls'),"
   : checkbox||toggle
   ? "React.createElement('output',{'data-preview-checked':'','aria-live':'polite'},checked?'Checked':'Unchecked'),"
   : slider
     ? "React.createElement('output',{'data-preview-slider-value':'','aria-live':'polite'},'Value '+value),"
     : text
       ? "React.createElement('output',{'data-preview-input-value':'','aria-live':'polite'},'Typed '+words.length+' characters'),"
       : staticComponent || !button
         ? "null,"
         : "React.createElement('output',{'data-preview-interaction-count':'','aria-live':'polite'},'Activated '+count+' times'),";
 const toggleDisabled=composed||checkbox||toggle||slider||staticComponent||!button
   ? "" : "React.createElement('button',{type:'button',className:'toggle',onClick:()=>setDisabled(n=>!n)},disabled?'Enable component':'Disable component')";
 return [
 "import React from 'react';",
 "import {createRoot} from 'react-dom/client';",
 "import * as Upstream from 'virtual:target';",
 "const Component=Upstream["+JSON.stringify(exportName)+"];",
 "function Demo(){const [count,setCount]=React.useState(0);const [disabled,setDisabled]=React.useState(false);const [words,setWords]=React.useState('');const [checked,setChecked]=React.useState(false);const [value,setValue]=React.useState(50);const [selection,setSelection]=React.useState('first');",
 "return React.createElement('main',{className:'demo'},",
 "React.createElement('p',{className:'caption'},"+JSON.stringify(identity+" • compiled original source")+"),",
 primitive,
 output,
 toggleDisabled+");}",
 "createRoot(document.getElementById('demo')).render(React.createElement(Demo));"
 ].join('\n');
};

export async function buildSharedPreview(raw,review){
 const plan=planSharedPreview(raw,review);
 if(plan.status!=='eligible')return plan;
 const files=new Map(plan.files.map(f=>[f.path,f]));
 const aliases=new Map();
 // Resolve only aliases reachable from this item. Other reviewed aliases can
 // require different pinned modules and must not block unrelated components.
 const pending=plan.files.flatMap(file=>imports(file.content))
   .filter(name=>name.startsWith('@/')&&!files.has(name.slice(2)));
 for(let index=0;index<pending.length;index++){
   const specifier=pending[index];
   if(aliases.has(specifier))continue;
   const item=plan.aliasMap[specifier];
   if(!item)return blocked('unreviewed-alias-import');
   const absolute=resolve(ROOT,item.path);
   if(!absolute.startsWith(ROOT+sep))return blocked('unsafe-alias-path');
   const bytes=await readFile(absolute);
   if(sha(bytes)!==item.sha256)return blocked('alias-source-hash-mismatch');
   const content=bytes.toString('utf8');
   if(/(?:\bimport\s*\(|\brequire\s*\(|\bfetch\s*\()/.test(content))
      return blocked('unreviewed-alias-import');
   for(const name of imports(content)){
     if(name.startsWith('@/'))pending.push(name);
     else if(!plan.dependencyLock[packageName(name)])
       return blocked('unreviewed-alias-import');
   }
   aliases.set(specifier,{content});
 }
 const plugin={name:'bounded-registry-sources',setup(b){
   b.onResolve({filter:/^virtual:entry$/},()=>({path:'entry',namespace:'ra-virtual'}));
   b.onResolve({filter:/^virtual:target$/},()=>({path:plan.entryFile,namespace:'ra-source'}));
   b.onResolve({filter:/^@\//},args=>{
     if(aliases.has(args.path))return {path:args.path,namespace:'ra-alias'};
     if(files.has(args.path.slice(2)))return {path:args.path.slice(2),namespace:'ra-source'};
     throw Error('Unapproved alias '+args.path);
   });
   b.onResolve({filter:/^\.\.?\//},args=>{
     if(args.namespace!=='ra-source')return;
     const path=resolve('/',dirname(args.importer),args.path).slice(1);
     if(!files.has(path))throw Error('Unapproved source import '+path);
     return {path,namespace:'ra-source'};
   });
   b.onLoad({filter:/.*/,namespace:'ra-virtual'},()=>({
     contents:harness(plan.exportName,plan.namespace+'/'+plan.slug),loader:'js',resolveDir:ROOT}));
   b.onLoad({filter:/.*/,namespace:'ra-source'},args=>{
     const file=files.get(args.path);
     if(!file)throw Error('Missing reviewed file');
     return {contents:file.content,
       loader:file.path.endsWith('.css')?'css':file.path.endsWith('.tsx')?'tsx':
         file.path.endsWith('.jsx')?'jsx':'ts',resolveDir:ROOT};
   });
   b.onLoad({filter:/.*/,namespace:'ra-alias'},args=>({
     contents:aliases.get(args.path).content,
     loader:args.path.endsWith('.tsx')?'tsx':'tsx',resolveDir:ROOT}));
 }};
 const result=await build({entryPoints:['virtual:entry'],bundle:true,write:false,
   outdir:'/registry-atlas-preview-output',
   platform:'browser',format:'iife',target:'es2020',jsx:'automatic',minify:true,
   plugins:[plugin],absWorkingDir:ROOT,logLevel:'silent'});
 const script=result.outputFiles.find(f=>!f.path.endsWith('.css'))?.text;
 if(!script)throw Error('Compiler did not emit JS');
 let css=result.outputFiles.find(f=>f.path.endsWith('.css'))?.text??'';
 css=css.replace(/@import\s+(?:url\()?["']?https?:[^;]+;/gi,'')
   .replace(/url\(\s*["']?https?:[^)]+\)/gi,'none');
 const boot=script.replace(/<\/script/gi,'<\\/script');
 const inlineHash=createHash('sha256').update(boot).digest('base64');
 const csp="default-src 'none'; script-src 'sha256-"+inlineHash+
   "'; style-src 'unsafe-inline'; connect-src 'none'; img-src data: blob:; "+
   "font-src 'none'; form-action 'none'; base-uri 'none'; object-src 'none'";
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8">'+
   '<meta http-equiv="Content-Security-Policy" content="'+csp+'">'+
   '<meta name="viewport" content="width=device-width,initial-scale=1">'+
   '<style>*{box-sizing:border-box}body{margin:0;background:#17191e;color:#eaf0fb;font-family:ui-monospace,monospace}.demo{display:flex;min-height:215px;flex-direction:column;justify-content:center;align-items:center;gap:17px;padding:18px}.caption{font-size:11px;color:#afb6ca;margin:0}button[data-preview-original]{cursor:pointer;padding:13px 25px;border:3px solid #e0e8fc;background:#343f5a;color:white;box-shadow:4px 4px 0 #090a0d;font-weight:700}button[data-preview-original]:disabled{opacity:.4;cursor:not-allowed}.toggle{background:none;border:0;color:#bdd5fc;text-decoration:underline;cursor:pointer}output{font-size:12px}</style><style>'+
   css.replace(/<\/style/gi,'<\\/style')+'</style></head><body><div id="demo"></div>'+
   '<script>'+boot+'</script></body></html>';
 return {status:'built-unverified',namespace:plan.namespace,slug:plan.slug,
   sourceSha256:plan.sourceSha256,exportName:plan.exportName,
   bundleSha256:sha(html),html,bundle:script,css};
}
