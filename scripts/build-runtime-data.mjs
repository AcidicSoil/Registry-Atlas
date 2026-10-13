#!/usr/bin/env node
// Static GitHub Pages assets built from PostgreSQL. Neither output is a database.
import { mkdir, writeFile, rm, readFile } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import { join, resolve } from 'node:path';
import postgres from 'postgres';

export function projectRuntimePayloads({
  registryMeta, registryRows, catalogMeta, namespaceRows, catalogRows,
  documents, sourcePages, routes, patterns, details
}) {
  const catalog = {meta: JSON.parse(catalogMeta), registries: Object.create(null)};

  for (const {namespace} of namespaceRows) catalog.registries[namespace] = [];

  for (const {namespace,payload_json} of catalogRows) {
    (catalog.registries[namespace] ??= []).push(JSON.parse(payload_json));
  }

  const docs = Object.fromEntries(documents.map(({name,payload_json})=>[name,JSON.parse(payload_json)]));

  const pages = Object.fromEntries(sourcePages.map(({namespace,slug,payload_json})=>[
    namespace+'/'+slug, JSON.parse(payload_json)
  ]));

  const itemRoutes = Object.fromEntries(routes.filter(r=>r.source_url).map(r=>[
    r.namespace+'/'+r.slug, {url:r.source_url,status:r.status}
  ]));

  const routePatterns = Object.create(null);

  for (const r of patterns) {
    (routePatterns[r.namespace] ??= []).push({
      urlTemplate:r.template,slugPrefix:r.prefix,source:r.source,
      ...(r.checked_at?{checkedAt:r.checked_at}:{})
    });
  }

  const detailItems = Object.fromEntries(details.map(({namespace,name,payload_json})=>[
    namespace+'/'+name,JSON.parse(payload_json)
  ]));

  return {
    core:{
      mirror:{meta:JSON.parse(registryMeta),registries:registryRows.map(r=>JSON.parse(r.payload_json))},
      catalog,taxonomy:docs['catalog-taxonomy'],kindOverrides:docs['catalog-kind-overrides'],
      registryIcons:docs['registry-icons']??null,
      sourcePageManifest:{...docs['source-page-index-meta'],pages},itemRoutes,routePatterns
    },
    details:detailItems
  };
}

export async function buildRuntimeData({databaseUrl=process.env.DATABASE_URL,outputDir='public/data'}={}) {
  if (!databaseUrl) {
    try { databaseUrl=(await readFile('.instance/neon-database-url','utf8')).trim(); }
    catch { throw new Error('Set DATABASE_URL for PostgreSQL runtime asset generation'); }
  }

  const sql=postgres(databaseUrl,{max:1,connect_timeout:20});

  try {
    const [counts] = await sql.unsafe('SELECT (SELECT COUNT(*) FROM atlas.atlas_catalog_items)::int AS catalog, (SELECT COUNT(*) FROM atlas.atlas_item_details)::int AS details');

    if (!counts.catalog || counts.catalog!==counts.details) throw new Error('PostgreSQL catalog/detail counts differ');
    const meta = await sql.unsafe("SELECT key,value FROM atlas.atlas_meta WHERE key IN ('registry_snapshot_meta','catalog_snapshot_meta')");
    const metadata = Object.fromEntries(meta.map(r=>[r.key,r.value]));

    if (!metadata.registry_snapshot_meta||!metadata.catalog_snapshot_meta) throw new Error('Missing PostgreSQL catalog metadata');
    const registryRows=await sql.unsafe('SELECT payload_json FROM atlas.atlas_registries ORDER BY namespace');
    const namespaceRows=await sql.unsafe('SELECT namespace FROM atlas.atlas_catalog_namespaces ORDER BY namespace');
    const catalogRows=await sql.unsafe('SELECT namespace,payload_json FROM atlas.atlas_catalog_items ORDER BY namespace,name');
    const documents=await sql.unsafe('SELECT name,payload_json FROM atlas.atlas_documents');
    const sourcePages=await sql.unsafe('SELECT namespace,slug,payload_json FROM atlas.atlas_source_pages ORDER BY namespace,slug');
    const routes=await sql.unsafe('SELECT namespace,slug,source_url,status FROM atlas.item_routes WHERE source_url IS NOT NULL ORDER BY namespace,slug');
    const patterns=await sql.unsafe("SELECT namespace,template,prefix,source,checked_at FROM atlas.route_patterns WHERE status='verified' ORDER BY namespace,template,prefix");
    const details=await sql.unsafe('SELECT namespace,name,payload_json FROM atlas.atlas_item_details ORDER BY namespace,name');

    if (catalogRows.length!==counts.catalog || details.length!==counts.details) throw new Error('Incomplete PostgreSQL runtime query');

    const payloads=projectRuntimePayloads({registryMeta:metadata.registry_snapshot_meta,catalogMeta:metadata.catalog_snapshot_meta,
      registryRows,namespaceRows,catalogRows,documents,sourcePages,routes,patterns,details});

    const output=resolve(outputDir);
    await mkdir(output,{recursive:true});
    await mkdir('.instance',{recursive:true});
    await writeFile('.instance/atlas-test-documents.json',JSON.stringify(Object.fromEntries(documents.map(({name,payload_json})=>[name,JSON.parse(payload_json)]))));
    const result={};

    for(const [name,data] of Object.entries(payloads)){
      const file=join(output,name==='core'?'registry-atlas.json.gz':'registry-details.json.gz');
      const zipped=gzipSync(JSON.stringify(data),{level:9});
      await writeFile(file,zipped);
      result[name]={file,bytes:zipped.byteLength};
    }

    // Remove legacy cache from the output directory, not from historical recovery files.
    for(const stale of ['registry-atlas.sqlite','registry-details.sqlite','registry-atlas.sqlite.gz','registry-details.sqlite.gz']){
      await rm(join(output,stale),{force:true});
    }

    return {...result,catalogItems:counts.catalog,detailCount:counts.details};
  }finally {await sql.end({timeout:10});}
}

if (process.argv[1] && import.meta.url === new URL('file://' + resolve(process.argv[1])).href) {
  buildRuntimeData().then(r=>console.log(JSON.stringify(r))).catch(e=>{
    console.error(e.code||'BUILD_RUNTIME_DATA_FAILED',e.message);
    process.exitCode=1;
  });
}
