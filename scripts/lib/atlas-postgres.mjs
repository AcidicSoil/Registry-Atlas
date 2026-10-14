import { isInputCallable, isInputString } from './input-guards.mjs';
import postgres from 'postgres';
import { localPostgresUrl } from './local-postgres-url.mjs';
import { attachLegacyQueries } from './atlas-pg-queries.mjs';

export function openAtlasCoreDatabase(_cwd=process.cwd(),{readOnly=false,databaseUrl}={}) {
  if (_cwd !== process.cwd() && !databaseUrl) {
    throw new Error('A separate test workspace needs an explicit PostgreSQL test database URL');
  }

  const url = localPostgresUrl(databaseUrl);

  const sql=postgres(url,{max:1,connect_timeout:20});
  sql.close=()=>sql.end({timeout:10});

  if(readOnly)sql.__atlasReadOnly=true;

  return attachLegacyQueries(sql);
}

export async function transaction(db,fn){
  if(db.__atlasReadOnly)throw Error('Read-only PostgreSQL connection');

  const run=async tx=>{if(db.__atlasSchema)tx.__atlasSchema=db.__atlasSchema;

return fn(tx);};

  if(isInputCallable(db.savepoint))return db.savepoint(run);

  return db.begin(run);
}

export const json=value=>JSON.stringify(value);

export const parseJson=value=>isInputString(value)?JSON.parse(value):value;

export const exec=(db,sql,params=[])=>db.unsafe(db.__atlasSchema?sql.replace(/\batlas\./g,db.__atlasSchema+'.'):sql,params);

export async function one(db,sql,params=[]){return (await exec(db,sql,params))[0]??null;}

export async function bulkInsert(db,table,columns,rows,{conflict=''}={}){
  if(!rows.length)return;

  const ident=v=>{if(!/^[a-z_][a-z0-9_]*$/i.test(v))throw Error('Invalid identifier');

return '"'+v+'"';};

  const chunk=Math.max(1,Math.floor(4000/columns.length));

  for(let pos=0;pos<rows.length;pos+=chunk){
    const batch=rows.slice(pos,pos+chunk),args=[];

    const values=batch.map(row=>'('+row.map(v=>{args.push(v);

return '$'+args.length}).join(',')+')').join(',');

    await exec(db,'INSERT INTO atlas.'+ident(table)+'('+columns.map(ident).join(',')+') VALUES '+values+' '+conflict,args);
  }
}

export async function getMeta(db,key){return (await one(db,'SELECT value FROM atlas.atlas_meta WHERE key=$1',[String(key)]))?.value??null;}

export async function setMeta(db,key,value){await exec(db,'INSERT INTO atlas.atlas_meta(key,value) VALUES($1,$2) ON CONFLICT(key) DO UPDATE SET value=excluded.value',[String(key),String(value)]);}

async function replaceRows(db,table,cols,rows,opts={}){
  await transaction(db,async tx=>{await exec(tx,'DELETE FROM atlas.'+table);await bulkInsert(tx,table,cols,rows,opts)});
}

export async function replaceRawRegistries(db,regs){
  const rows=(regs??[]).flatMap((r,i)=>r?.name?[[r.name.startsWith('@')?r.name:'@'+r.name,i,json(r)]]:[]);
  await replaceRows(db,'atlas_raw_registries',['namespace','ordinal','payload_json'],rows);
}

export async function readRawRegistries(db){
  return (await exec(db,'SELECT payload_json FROM atlas.atlas_raw_registries ORDER BY ordinal,namespace')).map(r=>parseJson(r.payload_json));
}

export async function replaceRegistrySnapshot(db,snapshot){
  if(!Array.isArray(snapshot?.registries))throw Error('Registry snapshot requires registries');
  await transaction(db,async tx=>{
    const regs=[],summaries=[];

    for(const r of snapshot.registries){
      const ns=r?.official?.name;

if(!ns)throw Error('Missing registry namespace');
      regs.push([ns,json(r)]);

      for(const s of r?.atlas?.item_summaries??[])if(s?.slug)summaries.push([ns,s.slug,json(s)]);
    }

    await exec(tx,'DELETE FROM atlas.atlas_registries');
    await exec(tx,'DELETE FROM atlas.atlas_item_summaries');
    await bulkInsert(tx,'atlas_registries',['namespace','payload_json'],regs);
    await bulkInsert(tx,'atlas_item_summaries',['namespace','slug','payload_json'],summaries);
    await setMeta(tx,'registry_snapshot_meta',json(snapshot.meta??{}));
  });
}

export async function readRegistrySnapshot(db){
  const m=await getMeta(db,'registry_snapshot_meta');

  return {meta:m?parseJson(m):{},registries:(await exec(db,'SELECT payload_json FROM atlas.atlas_registries ORDER BY namespace')).map(r=>parseJson(r.payload_json))};
}

export async function replaceCuratedItemSummaries(db,items){
  const rows=[];

for(const ns of Object.keys(items??{}).sort())for(const s of items[ns]??[])if(s?.slug)rows.push([ns,s.slug,json(s)]);
  await replaceRows(db,'atlas_item_summaries',['namespace','slug','payload_json'],rows);
}

export async function replaceCuratedAndRegistrySnapshot(db,items,snapshot){
  await transaction(db,async tx=>{await replaceRegistrySnapshot(tx,snapshot);await replaceCuratedItemSummaries(tx,items)});
}

export async function readCuratedItemSummaries(db){
  const out={};

for(const r of await exec(db,'SELECT namespace,payload_json FROM atlas.atlas_item_summaries ORDER BY namespace,slug'))(out[r.namespace]??=[]).push(parseJson(r.payload_json));

return out;
}

export async function replaceCatalogSnapshot(db,snapshot){
  if(!snapshot?.registries||Array.isArray(snapshot.registries))throw Error('Catalog buckets required');
  await transaction(db,async tx=>{
    const names=Object.keys(snapshot.registries).sort(),rows=[];

    for(const ns of names){
      const seen=new Set();

      for(const item of snapshot.registries[ns]??[]){
        const name=item?.name?.trim?.();

        if(!name||seen.has(name))continue;seen.add(name);rows.push([ns,name,json(item)]);
      }
    }

    await exec(tx,'DELETE FROM atlas.atlas_catalog_items');
    await exec(tx,'DELETE FROM atlas.atlas_catalog_namespaces');
    await bulkInsert(tx,'atlas_catalog_namespaces',['namespace'],names.map(n=>[n]));
    await bulkInsert(tx,'atlas_catalog_items',['namespace','name','payload_json'],rows,{conflict:'ON CONFLICT DO NOTHING'});
    await setMeta(tx,'catalog_snapshot_meta',json({...snapshot.meta,registry_count:names.length,item_count:rows.length}));
  });
}

export async function readCatalogSnapshot(db){
  const names=await exec(db,'SELECT namespace FROM atlas.atlas_catalog_namespaces ORDER BY namespace'),out=Object.fromEntries(names.map(r=>[r.namespace,[]]));

  for(const r of await exec(db,'SELECT namespace,payload_json FROM atlas.atlas_catalog_items ORDER BY namespace,name'))(out[r.namespace]??=[]).push(parseJson(r.payload_json));
  const m=await getMeta(db,'catalog_snapshot_meta');

return {meta:m?parseJson(m):{},registries:out};
}

async function replaceMap(db,table,key,values){await replaceRows(db,table,[key,'payload_json'],Object.keys(values??{}).sort().map(k=>[k,json(values[k])]));}

async function readMap(db,table,key){const out={};

for(const r of await exec(db,'SELECT '+key+',payload_json FROM atlas.'+table+' ORDER BY '+key))out[r[key]]=parseJson(r.payload_json);

return out;}

export const replaceCatalogEvidence=(db,v)=>replaceMap(db,'atlas_catalog_evidence','namespace',v);

export const readCatalogEvidence=db=>readMap(db,'atlas_catalog_evidence','namespace');

export async function replaceSourcePages(db,pages){
  const rows=[];

for(const [key,v] of Object.entries(pages??{})){const i=key.indexOf('/');

if(i>0&&i<key.length-1)rows.push([key.slice(0,i),key.slice(i+1),json(v)]);}

  await replaceRows(db,'atlas_source_pages',['namespace','slug','payload_json'],rows);
}

export async function readSourcePages(db){
  const out={};

for(const r of await exec(db,'SELECT namespace,slug,payload_json FROM atlas.atlas_source_pages ORDER BY namespace,slug'))out[r.namespace+'/'+r.slug]=parseJson(r.payload_json);

return out;
}

export async function putDocument(db,name,kind,value,at=new Date().toISOString()){
  await exec(db,'INSERT INTO atlas.atlas_documents(name,kind,payload_json,updated_at) VALUES($1,$2,$3,$4) ON CONFLICT(name) DO UPDATE SET kind=excluded.kind,payload_json=excluded.payload_json,updated_at=excluded.updated_at',[name,kind,json(value),at]);
}

export async function readDocument(db,name){const r=await one(db,'SELECT payload_json FROM atlas.atlas_documents WHERE name=$1',[name]);

return r?parseJson(r.payload_json):null;}

export async function listDocuments(db,kind=null){
  const rs=await exec(db,kind?'SELECT * FROM atlas.atlas_documents WHERE kind=$1 ORDER BY name':'SELECT * FROM atlas.atlas_documents ORDER BY name',kind?[kind]:[]);

  return rs.map(r=>({name:r.name,kind:r.kind,value:parseJson(r.payload_json),updatedAt:r.updated_at}));
}

export async function replaceClassifications(db,items){
  await replaceRows(db,'atlas_classifications',['namespace','name','payload_json'],(items??[]).filter(i=>i?.namespace&&i?.name).map(i=>[i.namespace,i.name,json(i)]));
}

export async function readClassifications(db){return (await exec(db,'SELECT payload_json FROM atlas.atlas_classifications ORDER BY namespace,name')).map(r=>parseJson(r.payload_json));}

export async function resetClassificationRun(db,id){await transaction(db,async tx=>{for(const t of ['atlas_classification_run_items','atlas_classification_batches','atlas_classification_runs'])await exec(tx,'DELETE FROM atlas.'+t+' WHERE run_id=$1',[id]);});}

export async function putClassificationRun(db,id,v,at=new Date().toISOString()){await exec(db,'INSERT INTO atlas.atlas_classification_runs(run_id,payload_json,updated_at) VALUES($1,$2,$3) ON CONFLICT(run_id) DO UPDATE SET payload_json=excluded.payload_json,updated_at=excluded.updated_at',[id,json(v),at]);}

export async function readClassificationRun(db,id){const r=await one(db,'SELECT payload_json FROM atlas.atlas_classification_runs WHERE run_id=$1',[id]);

return r?parseJson(r.payload_json):null;}

export async function putClassificationBatch(db,id,no,v){await exec(db,'INSERT INTO atlas.atlas_classification_batches(run_id,batch_no,payload_json) VALUES($1,$2,$3) ON CONFLICT(run_id,batch_no) DO UPDATE SET payload_json=excluded.payload_json',[id,no,json(v)]);}

export async function readClassificationBatches(db,id){return (await exec(db,'SELECT payload_json FROM atlas.atlas_classification_batches WHERE run_id=$1 ORDER BY batch_no',[id])).map(r=>parseJson(r.payload_json));}

export async function upsertClassificationRunItems(db,id,items){await bulkInsert(db,'atlas_classification_run_items',['run_id','namespace','name','payload_json'],(items??[]).filter(i=>i?.namespace&&i?.name).map(i=>[id,i.namespace,i.name,json(i)]),{conflict:'ON CONFLICT(run_id,namespace,name) DO UPDATE SET payload_json=excluded.payload_json'});}

export async function readClassificationRunItems(db,id){return (await exec(db,'SELECT payload_json FROM atlas.atlas_classification_run_items WHERE run_id=$1 ORDER BY namespace,name',[id])).map(r=>parseJson(r.payload_json));}

export async function replaceItemDetails(db,ns,items){await transaction(db,async tx=>{await exec(tx,'DELETE FROM atlas.atlas_item_details WHERE namespace=$1',[ns]);await bulkInsert(tx,'atlas_item_details',['namespace','name','payload_json'],(items??[]).filter(i=>i?.name).map(i=>[ns,i.name.trim(),json(i)]),{conflict:'ON CONFLICT DO NOTHING'});});}

export async function readItemDetail(db,ns,name){const r=await one(db,'SELECT payload_json FROM atlas.atlas_item_details WHERE namespace=$1 AND name=$2',[ns,name]);

return r?parseJson(r.payload_json):null;}

export async function readItemDetailsForRegistry(db,ns){return (await exec(db,'SELECT payload_json FROM atlas.atlas_item_details WHERE namespace=$1 ORDER BY name',[ns])).map(r=>parseJson(r.payload_json));}
