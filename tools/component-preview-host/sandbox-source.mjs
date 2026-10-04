import {readFile} from 'node:fs/promises';
import {readFileSync} from 'node:fs';
import {dirname, posix, resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {getRegistryItems, resolveRegistryItems} from 'shadcn/registry';
import ts from 'typescript';

const HOST=dirname(fileURLToPath(import.meta.url));
const PROJECT=resolve(HOST,'../..');
// Browser compilation may request packages; only use versions from the reviewed host manifest.
const REVIEWED_DEPS=JSON.parse(readFileSync(resolve(HOST,'package.json'),'utf8')).dependencies;
const VALID_NAME=/^[a-z0-9][a-z0-9-]*$/;
const VALID_ITEM=/^[a-z0-9][a-z0-9._/-]*$/;
const SAFE_FILE=/^[a-zA-Z0-9][a-zA-Z0-9/._-]*\.(?:tsx?|jsx?|css)$/;
const RENDERABLE=new Set(['registry:ui','registry:component','registry:block','registry:page','registry:item']);
const MAX_BYTES=768*1024;
const canUseFile=path=>typeof path==='string'&&SAFE_FILE.test(path)
  &&!path.split('/').some(part=>!part||part==='.'||part==='..');
const unique=values=>[...new Set(values)];
const relative=(from,to)=>{
 const path=posix.relative(posix.dirname(from),to);
 return path.startsWith('.')?path:'./'+path;
};
const utility='import {clsx} from "clsx"; import {twMerge} from "tailwind-merge"; export const cn=(...inputs)=>twMerge(clsx(inputs));';

function canonicalFile(file){
 const path=file.target||file.path;
 if(!canUseFile(path))throw Error('unsupported-source-file');
 if(path.startsWith('registry/')){
  const parts=path.split('/');
  const pivot=parts.findIndex(part=>['ui','components','lib','hooks'].includes(part));
  return pivot>=0?(parts[pivot]==='ui'?'components/':'')+parts.slice(pivot).join('/'):path;
 }
 return path;
}
function componentExport(source,itemName){
 const ast=ts.createSourceFile('component.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 const names=[];
 for(const statement of ast.statements){
  if(ts.isExportDeclaration(statement)&&statement.exportClause
     &&ts.isNamedExports(statement.exportClause)){
   for(const exported of statement.exportClause.elements)names.push(exported.name.text);
   continue;
  }
  if(!statement.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword))continue;
  if(ts.isFunctionDeclaration(statement)||ts.isClassDeclaration(statement)){
   if(statement.name)names.push(statement.name.text);
  }else if(ts.isVariableStatement(statement)){
   for(const declaration of statement.declarationList.declarations)
    if(ts.isIdentifier(declaration.name))names.push(declaration.name.text);
  }
 }
 const exports=unique(names.filter(name=>/^[A-Z][A-Za-z0-9]*$/.test(name)));
 const preferred=itemName.split(/[./_-]/).filter(Boolean)
  .map(part=>part[0].toUpperCase()+part.slice(1)).join('');
 return exports.includes(preferred)?preferred:exports.length===1?exports[0]:null;
}
function hasDefaultExport(source){
 const ast=ts.createSourceFile('demo.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 return ast.statements.some(statement=>
  (ts.isExportAssignment(statement)&&!statement.isExportEquals)
  ||(statement.modifiers?.some(modifier=>modifier.kind===ts.SyntaxKind.DefaultKeyword)
   &&statement.modifiers.some(modifier=>modifier.kind===ts.SyntaxKind.ExportKeyword)));
}
function packageVersions(declared){
 const dependencies={'react':'18.3.1','react-dom':'18.3.1'};
 for(const original of declared){
  if(typeof original!=='string'||original.length>130)throw Error('invalid-package');
  const match=/^(@[a-z0-9._-]+\/[a-z0-9._-]+|[a-z0-9._-]+)(?:@([\^~<>*=.\d\w-]+))?$/.exec(original);
  if(!match)throw Error('unsupported-package-specifier');
  const name=match[1];
  if(name==='cn')continue;
  const pinned=REVIEWED_DEPS[name];
  if(typeof pinned!=='string'||!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[\w.-]+)?$/.test(pinned))
   throw Error('unreviewed-package: '+name);
  if(match[2]&&!/^[0-9]+\.[0-9]+\.[0-9]+(?:-[\w.-]+)?$/.test(match[2]))
   throw Error('unpinned-package: '+name);
  if(match[2]&&match[2]!==pinned)throw Error('dependency-version-mismatch: '+name);
  dependencies[name]=pinned;
 }
 return dependencies;
}
function packageImports(files) {
 const packages=[];
 for(const [filename,source] of files){
  if(!/\.(?:tsx?|jsx?)$/.test(filename))continue;
  const ast=ts.createSourceFile(filename,source,ts.ScriptTarget.Latest,true,
   /\.tsx?$/.test(filename)?ts.ScriptKind.TSX:ts.ScriptKind.JSX);
  function add(specifier){
   if(specifier.startsWith('.')||specifier.startsWith('/')||specifier.startsWith('@/'))return;
   packages.push(specifier.startsWith('@')?specifier.split('/').slice(0,2).join('/'):specifier.split('/')[0]);
  }
  function visit(node){
   if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))
     &&node.moduleSpecifier&&ts.isStringLiteral(node.moduleSpecifier))add(node.moduleSpecifier.text);
   if(ts.isCallExpression(node)&&node.arguments.length===1&&ts.isStringLiteral(node.arguments[0])
     &&(node.expression.kind===ts.SyntaxKind.ImportKeyword
       ||(ts.isIdentifier(node.expression)&&node.expression.text==='require')))
    add(node.arguments[0].text);
   ts.forEachChild(node,visit);
  }
  visit(ast);
 }
 return unique(packages);
}
function cssVariables(cssVars){
 const blocks=[];
 for(const mode of ['light','dark']){
  const values=cssVars?.[mode]??{};
  const lines=Object.entries(values).filter(([k,v])=>/^[a-zA-Z0-9-]+$/.test(k)&&typeof v==='string')
    .map(([k,v])=>'--'+k+': '+v.replace(/[;{}]/g,'')+';');
  if(lines.length)blocks.push((mode==='dark'?'.dark':':root')+' {'+lines.join(' ')+'}');
 }
 return blocks.join('\n');
}
function rewriteAliases(source,file,known){
 return source.replace(/((?:from\s*|import\s*|require\s*\()\s*["'])(@\/[^"'\s]+|cn)(["'])/g,(full,head,alias,tail)=>{
  const target=alias==='cn'?'lib/utils.ts':alias.slice(2);
  const alternatives=[target,target+'.tsx',target+'.ts',target+'.jsx',target+'.js',target+'/index.tsx',target+'/index.ts'];
  const hit=alternatives.find(name=>known.has(name));
  if(!hit)return full;
  return head+relative(file,hit)+tail;
 });
}

export function createSandboxProject(item,tree){
 if(!RENDERABLE.has(item?.type)||!Array.isArray(item.files)||!Array.isArray(tree?.files))
  throw Error('unsupported-registry-item');
 if(tree.files.length>70)throw Error('too-many-source-files');
 const sourceFiles=new Map();
 for(const file of tree.files){
  if(typeof file.content!=='string'||Buffer.byteLength(file.content)>MAX_BYTES)
   throw Error('source-file-too-large');
  const name=canonicalFile(file);
  if(sourceFiles.has(name)&&sourceFiles.get(name)!==file.content)
   throw Error('conflicting-source-paths');
  sourceFiles.set(name,file.content);
 }
 const entryFiles=item.files.filter(f=>/\.(?:tsx|jsx)$/.test(f.path||''));
 const namedDemo=entryFiles.find(f=>/(?:^|[\/-])(demos?|examples?|previews?)(?:[\/-]|\.)/i.test(f.path));
 const original=namedDemo??entryFiles.find(f=>/^(?:registry:ui|registry:component|registry:block|registry:page)$/.test(f.type??''))
   ??entryFiles[0];
 if(!original)throw Error('no-renderable-source');
 const entry=canonicalFile(original);
 const source=sourceFiles.get(entry);
 if(!source)throw Error('entry-file-not-resolved');
 const named=componentExport(source,item.name);
 if(!named&&!namedDemo)throw Error('component-export-unresolved');
 if(namedDemo&&!named&&!hasDefaultExport(source))throw Error('author-demo-required');
 if(!namedDemo)throw Error('author-demo-required');
 const files={};
 const known=new Set(sourceFiles.keys());
 if(!known.has('lib/utils.ts')){
  known.add('lib/utils.ts');sourceFiles.set('lib/utils.ts',utility);
 }
 for(const [name,value] of sourceFiles){
  files['/'+name]={code:rewriteAliases(value,name,known),hidden:name!=='lib/utils.ts'};
 }
 const modulePath='./'+entry;
 const App='import * as React from "react";\nimport * as AuthorDemo from '+JSON.stringify(modulePath)+';\nconst Demo=AuthorDemo.default ?? AuthorDemo['+JSON.stringify(named)+'];\nexport default function App(){return <div className="preview-stage"><Demo /></div>;}';
 files['/App.tsx']={code:App,active:true};
 files['/index.tsx']={code:'import React from "react"; import {createRoot} from "react-dom/client"; import App from "./App"; import "./styles.css"; createRoot(document.getElementById("root")!).render(<App />);',hidden:true};
 const styles=['body{margin:0;background:#fff;color:#111;font-family:system-ui,sans-serif;}',
  '.preview-stage{min-height:220px;padding:24px;display:flex;align-items:center;justify-content:center;}',
  cssVariables(tree.cssVars)];
 files['/styles.css']={code:styles.join('\n'),hidden:true};
 files['/public/index.html']={code:'<!doctype html><html><head><meta charset="utf-8"/><script src="https://cdn.tailwindcss.com"></script></head><body><div id="root"></div></body></html>',hidden:true};
 for(const name of [...sourceFiles.keys()].filter(x=>x.endsWith('.css')))
  files['/App.tsx'].code='import '+JSON.stringify('./'+name)+';\n'+files['/App.tsx'].code;
 const declared=unique([...(item.dependencies??[]),...(tree.dependencies??[]),...packageImports(sourceFiles)]).filter(x=>x!=='cn');
 const bytes=Buffer.byteLength(JSON.stringify(files));
 if(bytes>MAX_BYTES*2)throw Error('preview-budget-exceeded');
 return {schema:'registry-atlas-sandpack/v1',mode:'upstream-demo',
  entryFile:entry,files,dependencies:packageVersions(declared),
  warning:'Upstream demo source; browser behavior has not been certified.'};
}

// Reuse the 16 MB local catalog across source probes, refreshing periodically
// so the long-lived preview server notices a subsequent catalog sync.
let sourceIndex;
let sourceIndexLoadedAt=0;
async function localSourceIndex(){
 // Refresh periodically in the long-lived preview server after catalog sync.
 if(!sourceIndex||Date.now()-sourceIndexLoadedAt>60_000){
  sourceIndexLoadedAt=Date.now();
  sourceIndex=Promise.all([
   readFile(resolve(PROJECT,'data/shadcn/registries.raw.json'),'utf8').then(JSON.parse),
   readFile(resolve(PROJECT,'public/data/registry-catalog-items.json'),'utf8').then(JSON.parse),
  ]).catch(error=>{sourceIndex=null;throw error;});
 }
 return sourceIndex;
}

function registryEndpoint(template,name){
 if(typeof template!=='string'||!template.includes('{name}'))throw Error('registry-source-unavailable');
 const source=template.replace('{name}',name);
 const url=new URL(source);
 if(url.protocol!=='https:'||url.username||url.password||url.port||url.search||url.hash
    ||/\{[^}]+\}/.test(source)||url.hostname==='localhost'
    ||url.hostname.endsWith('.local')||url.hostname.endsWith('.internal')
    ||/^(?:\d+\.|\[)/.test(url.hostname))throw Error('unsafe-registry-url');
 return source;
}
export async function loadSandboxProject(registry,slug,{getItems=getRegistryItems,resolveItems=resolveRegistryItems}={}){
 if(!VALID_NAME.test(registry)||!VALID_ITEM.test(slug)||slug.length>128
   ||slug.split('/').some(s=>!s||s==='.'||s==='..'))throw Error('invalid-item-identity');
 const [directory,catalog]=await localSourceIndex();
 const namespace='@'+registry;
 const listed=catalog.registries?.[namespace]?.find(v=>v.name===slug&&RENDERABLE.has(v.type));
 const definition=directory.find(v=>v.name===namespace);
 if(!listed||!definition)throw Error('item-not-in-catalog');
 registryEndpoint(definition.url,slug);
 const config={registries:{[namespace]:definition.url}};
 const id=namespace+'/'+slug;
 const [items,tree]=await Promise.all([
  getItems([id],{config,useCache:false}),
  resolveItems([id],{config,useCache:false})
 ]);
 if(items.length!==1||items[0]?.name!==slug)throw Error('upstream-identity-mismatch');
 return {namespace,slug,...createSandboxProject(items[0],tree)};
}
