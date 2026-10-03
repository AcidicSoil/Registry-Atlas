import {readFile,readdir,writeFile,mkdir,rename,rm} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {homedir} from 'node:os';
import {dirname,join,resolve,isAbsolute,posix} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import ts from 'typescript';

const HOST=dirname(fileURLToPath(import.meta.url));
const PROJECT=resolve(HOST,'../..');
const HASH=value=>createHash('sha256').update(value).digest('hex');
const NAME=/^[a-z0-9][a-z0-9-]*$/;
const FILE=/^[a-zA-Z0-9][a-zA-Z0-9/._-]*\.(?:tsx?|jsx?|mjs|css|vue|svelte|astro)$/;
const fail=(reason,extra={})=>({status:'blocked',blockers:[reason],...extra});
const unique=values=>[...new Set(values)].sort();
function safeFile(name){
 return typeof name==='string'&&FILE.test(name)
   && !name.split('/').some(part=>!part||part==='.'||part==='..');
}
function importedModule(name){
 return name.startsWith('@/')?'alias':name.startsWith('./')||name.startsWith('../')?'relative':
   /^https?:\/\//.test(name)?'remote':'package';
}
function packageName(name){
 return name.startsWith('@')?name.split('/').slice(0,2).join('/'):name.split('/')[0];
}
function pathCandidates(file,specifier){
 const base=posix.resolve('/',posix.dirname(file),specifier).slice(1);
 return [base,base+'.tsx',base+'.ts',base+'.jsx',base+'.js',
   base+'/index.tsx',base+'/index.ts',base+'/index.jsx',base+'/index.js'];
}
function extractStatements(source,path){
 const parsed=ts.createSourceFile(path,source,ts.ScriptTarget.Latest,true,
   path.endsWith('.tsx')?ts.ScriptKind.TSX:path.endsWith('.jsx')?ts.ScriptKind.JSX:ts.ScriptKind.TS);
 const imports=[],exportNames=[],blockers=[];
 if(parsed.parseDiagnostics.length)blockers.push('source-syntax-error');
 function add(specifier){imports.push(specifier);}
 function visit(node){
  if((ts.isImportDeclaration(node)||ts.isExportDeclaration(node))&&node.moduleSpecifier
    &&ts.isStringLiteral(node.moduleSpecifier))add(node.moduleSpecifier.text);
  if(ts.isImportEqualsDeclaration(node)&&ts.isExternalModuleReference(node.moduleReference)
    &&ts.isStringLiteral(node.moduleReference.expression))add(node.moduleReference.expression.text);
  if(ts.isCallExpression(node)
    &&(node.expression.kind===ts.SyntaxKind.ImportKeyword
      ||(ts.isIdentifier(node.expression)&&node.expression.text==='require')))
    blockers.push('dynamic-import-or-require');
  if(ts.isExportAssignment(node)&&!node.isExportEquals)exportNames.push('default');
  if(ts.isExportDeclaration(node)&&node.exportClause&&ts.isNamedExports(node.exportClause))
    for(const element of node.exportClause.elements)exportNames.push(element.name.text);
  if(ts.canHaveModifiers(node)&&ts.getModifiers(node)?.some(m=>m.kind===ts.SyntaxKind.ExportKeyword)){
    if('name' in node&&node.name&&ts.isIdentifier(node.name))exportNames.push(node.name.text);
  }
  ts.forEachChild(node,visit);
 }
 visit(parsed);
 return {imports:unique(imports),exports:unique(exportNames),blockers:unique(blockers)};
}

export function inspectSource(raw,{namespace,slug}={}){
 if(typeof namespace!=='string'||!/^@[a-z0-9][a-z0-9-]*$/.test(namespace)
   ||!NAME.test(slug??''))throw Error('Invalid source identity');
 if(typeof raw!=='string'||Buffer.byteLength(raw)>524288)
   return fail('source-budget-exceeded');
 const sourceSha256=HASH(raw);
 let item;
 try{item=JSON.parse(raw);}catch{return fail('source-not-json',{sourceSha256});}
 if(item?.name!==slug||!Array.isArray(item.files)||item.files.length<1
   ||item.files.length>24)return fail('source-identity-mismatch',{sourceSha256});
 const files=new Map();
 for(const file of item.files){
   if(!safeFile(file?.path)||typeof file.content!=='string'
     ||Buffer.byteLength(file.content)>256000)
     return fail('unsafe-source-file',{sourceSha256});
   if(files.has(file.path))return fail('duplicate-source-path',{sourceSha256});
   files.set(file.path,file.content);
 }
 const entryFiles=[],imports=[],exports=[],blockers=[],frameworkHints=[];
 for(const [path,content] of files){
   if(path.endsWith('.vue'))frameworkHints.push('vue');
   if(path.endsWith('.svelte'))frameworkHints.push('svelte');
   if(path.endsWith('.astro'))frameworkHints.push('astro');
   if(path.endsWith('.tsx')||path.endsWith('.jsx'))frameworkHints.push('tsx-jsx');
   if(path.endsWith('.css')){
     if(/@import\s+(?:url\()?\s*['"]?https?:\/\//.test(content))
       blockers.push('remote-stylesheet-import');
     continue;
   }
   if(!/\.(?:tsx?|jsx?|mjs)$/.test(path))continue;
   entryFiles.push(path);
   const statements=extractStatements(content,path);
   blockers.push(...statements.blockers);
   for(const name of statements.imports){
     const kind=importedModule(name);
     imports.push({file:path,name,kind});
     if(kind==='remote')blockers.push('remote-module-import');
     if(kind==='relative'&&!pathCandidates(path,name).some(candidate=>files.has(candidate)))
       blockers.push('missing-relative-import');
     if(kind==='package'&&packageName(name)==='vue')frameworkHints.push('vue');
     if(kind==='package'&&packageName(name)==='react')frameworkHints.push('react');
     if(kind==='package'&&packageName(name)==='svelte')frameworkHints.push('svelte');
   }
   for(const name of statements.exports)exports.push({file:path,name});
 }
 const orderedImports=imports.sort((a,b)=>(a.file+'\0'+a.name).localeCompare(b.file+'\0'+b.name));
 const packages=unique(imports.filter(v=>v.kind==='package').map(v=>packageName(v.name)));
 const aliases=unique(imports.filter(v=>v.kind==='alias').map(v=>v.name));
 const registryDependencies=Array.isArray(item.registryDependencies)
   ? unique(item.registryDependencies.filter(v=>typeof v==='string')):[];
 const reasons=unique(blockers);
 return {schema:'registry-atlas-source-inspection/v1',
   status:reasons.length?'blocked':'needs-review',
   namespace,slug,sourceSha256,
   frameworkHints:unique(frameworkHints),entryFiles:entryFiles.sort(),
   files:[...files.keys()].sort(),imports:orderedImports,
   packages,aliases,registryDependencies,
   exports:exports.sort((a,b)=>(a.file+a.name).localeCompare(b.file+b.name)),
   blockers:reasons,approval:'not-granted'};
}

export function discoverCandidates(catalog,registryDirectory,{limit=25,after='',reviewedNamespaces=[]}={}){
 if(!Number.isInteger(limit)||limit<1||limit>100
    ||after&&!/^@[a-z0-9][a-z0-9-]*$/.test(after))
   throw Error('Invalid bounded onboarding request');
 if(!catalog?.registries||typeof catalog.registries!=='object'
    ||!Array.isArray(registryDirectory))throw Error('Missing directory evidence');
 const directory=new Map(registryDirectory.filter(r=>r&&typeof r.name==='string')
   .map(r=>[r.name,r]));
 const all=Object.entries(catalog.registries)
  .filter(([namespace,entries])=>/^@[a-z0-9][a-z0-9-]*$/.test(namespace)
    &&Array.isArray(entries))
  .map(([namespace,entries])=>{
   const components=unique(entries.filter(e=>e?.type==='registry:component')
     .map(e=>e.name).filter(name=>typeof name==='string'&&NAME.test(name)));
   const official=directory.get(namespace);
   const template=official?.url;
   let officialUrlValid=false;
   try{
     if(typeof template==='string'){
       const url=new URL(template.replace('{name}','example').replace('{slug}','example'));
       officialUrlValid=url.protocol==='https:'&&!url.port&&!url.username
         &&!url.password&&!url.search&&!url.hash
         &&(/\{name\}|\{slug\}/).test(template)
         &&url.pathname.endsWith('.json')&&url.hostname!=='localhost';
     }
   }catch{/* A malformed URL is not an eligible endpoint. */}
   const reviewed=reviewedNamespaces.includes(namespace);
   return {namespace,componentCount:components.length,
     officialSourceUrlTemplate:officialUrlValid?template:null,
     status:!officialUrlValid?'source-route-unresolved':reviewed?'policy-reviewed':'needs-policy-review',
     framework:'not-inspected',license:reviewed?'reviewed':'not-reviewed'};
  })
  .filter(row=>row.componentCount>0)
  .sort((a,b)=>a.namespace.localeCompare(b.namespace));
 const rows=all.filter(row=>!after||row.namespace>after).slice(0,limit);
 return {schema:'registry-atlas-onboarding-discovery/v1',
   summary:{registriesWithComponents:all.length,listed:rows.length,
     withOfficialSourceTemplate:rows.filter(r=>r.officialSourceUrlTemplate!==null).length,
     reviewedPolicies:all.filter(r=>r.license==='reviewed').length},
   cursor:rows.at(-1)?.namespace??after,
   rows,warning:'Discovery does not approve license, build policy, or preview behavior.'};
}


async function findReviewedPolicies(){
 const names=[];
 for(const file of await readdir(join(HOST,'reviews'))){
   const found=/^([a-z0-9][a-z0-9-]*)-policy\.json$/.exec(file);
   if(!found)continue;
   try{
     const policy=JSON.parse(await readFile(join(HOST,'reviews',file),'utf8'));
     if(policy.schema==='registry-atlas-shared-preview-policy/v1'
       &&policy.license?.decision==='approved'
       &&policy.namespace==='@'+found[1]
       &&policy.sourceDir==='sources/'+found[1]
       &&/^[a-f0-9]{64}$/.test(policy.licenseSha256))
       names.push(policy.namespace);
   }catch{/* Malformed policies do not qualify as reviewed. */}
 }
 return unique(names);
}
export async function createDiscoveryReport({limit=25,after=''}={}){
 const [catalogRaw,registryRaw]=await Promise.all([
   readFile(join(PROJECT,'public/data/registry-catalog-items.json'),'utf8'),
   readFile(join(PROJECT,'data/shadcn/registries.raw.json'),'utf8')]);
 const reviewedNamespaces=await findReviewedPolicies();
 return discoverCandidates(JSON.parse(catalogRaw),JSON.parse(registryRaw),{limit,after,reviewedNamespaces});
}
export async function inspectCachedSource({registry,slug}={}){
 if(!NAME.test(registry??'')||!NAME.test(slug??''))throw Error('Invalid cached identity');
 const raw=await readFile(join(HOST,'sources',registry,slug+'.json'),'utf8');
 return inspectSource(raw,{namespace:'@'+registry,slug});
}

async function writePrivateReport(out,report){
 const base=join(homedir(),'.local','state','registry-atlas');
 if(typeof out!=='string'||!isAbsolute(out)||!out.startsWith(base+'/')
   ||resolve(out)!==out)throw Error('Report destination must be private local state');
 await mkdir(dirname(out),{recursive:true,mode:0o700});
 const temp=out+'.tmp-'+process.pid;
 try{await writeFile(temp,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
   await rename(temp,out);}
 catch(error){await rm(temp,{force:true});throw error;}
}

if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
 const args=process.argv.slice(2),opts={};
 for(let i=0;i<args.length;i+=2){
   if(!['--mode','--limit','--after','--registry','--slug','--out'].includes(args[i])
      ||!args[i+1]||opts[args[i]])throw Error('Invalid onboarding CLI arguments');
   opts[args[i]]=args[i+1];
 }
 const task=opts['--mode']==='discover'
   ?createDiscoveryReport({limit:Number(opts['--limit']??25),after:opts['--after']??''})
   :opts['--mode']==='inspect'
      ?inspectCachedSource({registry:opts['--registry'],slug:opts['--slug']})
      :Promise.reject(Error('Choose discover or inspect'));
 task.then(async report=>{
   await writePrivateReport(opts['--out'],report);
   console.log(JSON.stringify({path:opts['--out'],schema:report.schema,
      summary:report.summary??{status:report.status,blockers:report.blockers}}));
 }).catch(error=>{console.error('Onboarding blocked: '+error.message);process.exitCode=1;});
}
