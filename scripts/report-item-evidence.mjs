import {readFile,writeFile,mkdir,rename,unlink} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {homedir} from 'node:os';
import {isAbsolute,dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {DiscoveryLedger} from './lib/registry-discovery.mjs';
import {compileItemEvidence} from './lib/item-evidence.mjs';

const root=fileURLToPath(new URL('../',import.meta.url));
const readJson=async relative=>JSON.parse(await readFile(join(root,relative),'utf8'));

export function parseItemEvidenceArgs(argv) {
  const options={};
  const keys={'--out':'out','--journal-dir':'journalDir','--as-of':'asOf'};
  for(let i=0;i<argv.length;i++){
    const key=keys[argv[i]];
    if(!key||!argv[i+1]||argv[i+1].startsWith('--')||Object.hasOwn(options,key))
      throw Error('Unknown, duplicate or incomplete report argument '+argv[i]);
    options[key]=argv[++i];
  }
  if(!options.out || !isAbsolute(options.out))throw Error('--out must be absolute');
  options.journalDir??=join(homedir(),'.local','state','registry-atlas','discovery');
  if(!isAbsolute(options.journalDir))throw Error('Journal directory must be absolute');
  if(options.asOf&&!Number.isFinite(Date.parse(options.asOf)))
    throw Error('Invalid --as-of time');
  return options;
}

export async function main(argv) {
  const options=parseItemEvidenceArgs(argv);
  const [raw,catalog,curated,visual,manifest]=await Promise.all([
    readJson('data/shadcn/registries.raw.json'),
    readJson('public/data/registry-catalog-items.json'),
    readJson('data/shadcn/registry-items.json'),
    readJson('public/data/component-previews.json'),
    readJson('src/registry-explorer/data/component-demo-manifest.json'),
  ]);
  const ledgers={};
  for(const registry of raw){
    if(!/^@[a-z0-9][a-z0-9-]*$/.test(registry?.name)) throw Error('Invalid registry name');
    ledgers[registry.name]=await DiscoveryLedger.open(
      join(options.journalDir,registry.name.slice(1)+'.jsonl'));
  }
  const report=compileItemEvidence({raw,catalog,curated,visual,manifest,ledgers,
    asOf:options.asOf??new Date().toISOString(),
    assetExists:asset=>asset.startsWith('/Registry-Atlas/')
      && existsSync(join(root,'public',asset.slice('/Registry-Atlas/'.length)))});
  const dest=resolve(options.out);
  if(existsSync(dest))throw Error('Report already exists: '+dest);
  await mkdir(dirname(dest),{recursive:true});
  const temporary=dest+'.tmp-'+process.pid;
  try{
    await writeFile(temporary,JSON.stringify(report,null,2)+'\n',{mode:0o600,flag:'wx'});
    await rename(temporary,dest);
  }catch(error){await unlink(temporary).catch(()=>{});throw error;}
  return {output:dest,schema:report.schema,summary:report.summary,errors:report.errors.length};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href)
  main(process.argv.slice(2)).then(result=>console.log(JSON.stringify(result,null,2)))
    .catch(error=>{console.error('Identity report failed: '+error.message);process.exitCode=1});
