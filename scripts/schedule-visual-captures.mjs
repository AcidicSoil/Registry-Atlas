import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { join, isAbsolute } from 'node:path';
import { pathToFileURL } from 'node:url';
import { DiscoveryLedger } from './lib/registry-discovery.mjs';
import { planVisualCaptures, main as captureRegistryVisuals } from './capture-component-visuals.mjs';

export function planVisualCaptureSchedule(
  raw, catalog, curated, ledgers, previews,
  {cursor = null, maxRegistries = 2, perRegistryLimit = 5} = {},
) {
  if (!Number.isSafeInteger(maxRegistries) || maxRegistries < 1
    || maxRegistries > 20) throw Error('Invalid registry batch size');
  if (!Number.isSafeInteger(perRegistryLimit) || perRegistryLimit < 1
    || perRegistryLimit > 25) throw Error('Invalid per-registry capture limit');
  const registries = [...raw].sort((a,b)=>a.name.localeCompare(b.name));
  if (cursor !== null && !registries.some(row => row.name === cursor))
    throw Error('Unknown registry cursor');
  const batch = [];
  for (const registry of registries) {
    if (cursor !== null && registry.name.localeCompare(cursor) <= 0) continue;
    const slugs = [...new Set([
      ...(catalog.registries?.[registry.name] ?? []).map(x=>x.name),
      ...(curated[registry.name] ?? []).map(x=>x.slug),
    ])];
    const plan = planVisualCaptures(registry,slugs,
      ledgers[registry.name] ?? new Map(),previews,perRegistryLimit);
    if (plan.ready.length) batch.push({
      namespace:registry.name,ready:plan.ready.length,
      candidates:plan.ready.map(item=>({slug:item.slug,officialPage:item.officialPage})),
    });
    if (batch.length === maxRegistries) break;
  }
  return {batch,nextCursor:batch.at(-1)?.namespace ?? null};
}

function parseArgs(argv) {
  const allowed = new Set(['--profile','--server','--tab','--journal-dir',
    '--cursor','--max-registries','--per-registry-limit','--delay-ms']);
  const opts = {dryRun:false};
  for (let i=0;i<argv.length;i++) {
    const flag=argv[i];
    if (flag==='--dry-run' && !opts.dryRun) {opts.dryRun=true;continue;}
    if (!allowed.has(flag) || Object.hasOwn(opts,flag)
      || !argv[i+1] || argv[i+1].startsWith('--'))
      throw Error('Unknown or missing argument: '+flag);
    opts[flag]=argv[++i];
  }
  for (const flag of ['--profile','--server','--journal-dir']) {
    if (!opts[flag]) throw Error('Missing '+flag);
  }
  if (!opts.dryRun && !opts['--tab']) throw Error('Live schedule requires --tab');
  if (!isAbsolute(opts['--journal-dir'])) throw Error('--journal-dir must be absolute');
  const int=(name,fallback,min,max)=>{
    const value=opts[name]===undefined?fallback:Number(opts[name]);
    if (!Number.isSafeInteger(value)||value<min||value>max)
      throw Error('Invalid '+name);
    return value;
  };
  return {...opts,maxRegistries:int('--max-registries',2,1,20),
    perRegistryLimit:int('--per-registry-limit',5,1,25),
    delayMs:int('--delay-ms',1000,1000,60000)};
}

export async function main(argv,cwd=process.cwd()) {
  const args=parseArgs(argv);
  const status=JSON.parse(execFileSync('pinchtab-profile-manager',
    [args['--profile'],'status','--json'],{encoding:'utf8',timeout:15000}));
  if (!status.ok || !status.data?.instances?.some(i =>
    i.url===args['--server'] && i.status==='running'))
    throw Error('Source server is not a running instance of the named profile');
  const [raw,catalog,curated,manifest] = await Promise.all([
    readFile(join(cwd,'data/shadcn/registries.raw.json'),'utf8').then(JSON.parse),
    readFile(join(cwd,'public/data/registry-catalog-items.json'),'utf8').then(JSON.parse),
    readFile(join(cwd,'data/shadcn/registry-items.json'),'utf8').then(JSON.parse),
    readFile(join(cwd,'public/data/component-previews.json'),'utf8').then(JSON.parse),
  ]);
  if (manifest.schemaVersion!==1||!manifest.previews||Array.isArray(manifest.previews))
    throw Error('Invalid visual-reference manifest');
  const ledgers={};
  for (const reg of raw) {
    if (!/^@[a-z0-9][a-z0-9-]*$/.test(reg.name))
      throw Error('Unsafe registry namespace');
    ledgers[reg.name]=await DiscoveryLedger.open(
      join(args['--journal-dir'],reg.name.slice(1)+'.jsonl'));
  }
  const schedule=planVisualCaptureSchedule(raw,catalog,curated,ledgers,manifest.previews,{
    cursor:args['--cursor']??null,maxRegistries:args.maxRegistries,
    perRegistryLimit:args.perRegistryLimit,
  });
  const result={schema:'registry-atlas-visual-capture-schedule/v1',
    dryRun:args.dryRun,batch:schedule.batch,nextCursor:schedule.nextCursor,
    execution:[],errors:0};
  if (!args.dryRun) {
    for (const row of schedule.batch) {
      try {
        const capture = await captureRegistryVisuals([
          '--profile',args['--profile'],'--server',args['--server'],
          '--tab',args['--tab'],'--registry',row.namespace,
          '--journal',join(args['--journal-dir'],row.namespace.slice(1)+'.jsonl'),
          '--limit',String(args.perRegistryLimit),
          '--delay-ms',String(args.delayMs),
        ],cwd);
        result.execution.push({namespace:row.namespace,...capture});
        result.errors+=capture.unresolved.length;
      } catch(error) {
        result.execution.push({namespace:row.namespace,error:String(error.message)});
        result.errors++;
      }
    }
  }
  return result;
}

if (process.argv[1] && import.meta.url===pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2)).then(report=>{
    console.log(JSON.stringify(report,null,2));
    if (report.errors) process.exitCode=2;
  }).catch(error=>{console.error('Visual scheduler failed: '+error.message);process.exitCode=1});
}
