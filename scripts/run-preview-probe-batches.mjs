import {readFile,mkdir,open,lstat} from 'node:fs/promises';
import {constants} from 'node:fs';
import {homedir} from 'node:os';
import {join,dirname} from 'node:path';
import {pathToFileURL, fileURLToPath} from 'node:url';
import {planPreviewCoverage} from './plan-component-previews.mjs';
import {planProbeBatch,runProbeSweep,parseProbeJournal} from '../tools/component-preview-host/probe-batch.mjs';

const ROOT=fileURLToPath(new URL('../',import.meta.url));
export const JOURNAL=join(homedir(),'.local','state','registry-atlas','previews','probe-journal.jsonl');
const json=async path=>JSON.parse(await readFile(join(ROOT,path),'utf8'));

export function parseFlags(argv){
 const opts={limit:32,batchSize:16,concurrency:2,execute:false};
 for(let i=0;i<argv.length;i++){
  const flag=argv[i];
  if(flag==='--execute'){if(opts.execute)throw Error('duplicate-flag');opts.execute=true;continue;}
  if(!['--limit','--batch-size','--concurrency','--registry'].includes(flag))
   throw Error('unknown-flag: '+flag);
  const value=argv[++i];
  if(!value)throw Error('missing-flag-value: '+flag);
  if(flag==='--registry'){if(!/^@[a-z0-9][a-z0-9-]*$/.test(value))throw Error('invalid-registry');opts.registry=value;}
  else{
   if(flag==='--limit'&&value==='all'){opts.limit=100000;continue;}
   if(!/^[0-9]+$/.test(value))throw Error('invalid-number: '+flag);
   opts[{'--limit':'limit','--batch-size':'batchSize','--concurrency':'concurrency'}[flag]]=Number(value);
  }
 }
 if(opts.limit<1||opts.limit>100000||opts.batchSize<1||opts.batchSize>200
   ||opts.concurrency<1||opts.concurrency>4)throw Error('probe-budget-exceeded');
 return opts;
}
async function openJournal(){
 await mkdir(dirname(JOURNAL),{recursive:true,mode:0o700});
 let info;
 try{info=await lstat(JOURNAL)}catch(e){if(e.code!=='ENOENT')throw e;}
 if(info&&(!info.isFile()||info.isSymbolicLink()))throw Error('unsafe-probe-journal');
 return open(JOURNAL,constants.O_APPEND|constants.O_CREAT|constants.O_WRONLY|constants.O_NOFOLLOW,0o600);
}
async function readJournal(){
 try{return parseProbeJournal(await readFile(JOURNAL,'utf8'))}
 catch(error){if(error.code==='ENOENT')return new Map();throw error;}
}
export async function runCli(argv){
 const opts=parseFlags(argv);
 const [raw,catalog,manifest,curated,previous]=await Promise.all([
  json('data/shadcn/registries.raw.json'),
  json('public/data/registry-catalog-items.json'),
  json('src/registry-explorer/data/component-demo-manifest.json'),
  json('data/shadcn/registry-items.json'),
  readJournal(),
 ]);
 const base=planPreviewCoverage(raw,catalog,manifest,{limit:1,includeItems:true},curated);
 const planned=planProbeBatch(base.items,previous,{limit:Math.min(200,opts.limit),registry:opts.registry,strategy:'breadth'});
 if(!opts.execute){
  return {mode:'dry-run',totalCatalog:base.summary.distinctItems,
   registry:opts.registry??null,settings:opts,
   planned:Math.min(opts.limit,planned.summary.remaining+planned.batch.length),first:planned.batch[0]?.token??null,
   last:planned.batch.at(-1)?.token??null,summary:planned.summary,
   journal:JOURNAL,notice:'Use --execute to fetch actual upstream source. No build or code execution occurs.'};
 }
 const fd=await openJournal();
 try{
  const outcome=await runProbeSweep(base.items,previous,{limit:opts.limit,batchSize:opts.batchSize,
   registry:opts.registry,concurrency:opts.concurrency,
   append:async entries=>{
    await fd.writeFile(entries.map(entry=>JSON.stringify(entry)).join('\n')+'\n');
    await fd.sync();
    process.stderr.write('Probe batch persisted: '+entries.length+' items\n');
   }});
  return {mode:'executed',registry:opts.registry??null,totalCatalog:base.summary.distinctItems,
   ...outcome,journal:JOURNAL,notice:'Source probes only; no component was built or interaction-certified.'};
 }finally{await fd.close();}
}
if(process.argv[1]&&pathToFileURL(process.argv[1]).href===import.meta.url){
 runCli(process.argv.slice(2)).then(data=>process.stdout.write(JSON.stringify(data,null,2)+'\n'))
  .catch(error=>{console.error('Batch source probes failed: '+error.message);process.exitCode=1;});
}
