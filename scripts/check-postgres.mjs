#!/usr/bin/env node
import postgres from 'postgres';
import {readFileSync} from 'node:fs';
const url=process.env.DATABASE_URL || readFileSync('.instance/neon-database-url','utf8').trim();
const sql=postgres(url,{max:1,connect_timeout:20});
try {
  const tables=await sql.unsafe("SELECT table_name FROM information_schema.tables WHERE table_schema='atlas'");
  const required=['atlas_meta','atlas_catalog_items','atlas_item_details','atlas_registries','atlas_documents'];
  const names=new Set(tables.map(t=>t.table_name));
  for(const name of required) if(!names.has(name)) throw new Error('Missing table '+name);
  const [count]=await sql.unsafe('SELECT (SELECT COUNT(*) FROM atlas.atlas_catalog_items)::int AS catalog, (SELECT COUNT(*) FROM atlas.atlas_item_details)::int AS details, (SELECT COUNT(*) FROM atlas.atlas_catalog_namespaces)::int AS namespaces');
  if (!count.catalog||count.catalog!==count.details) throw new Error('Catalog/detail counts differ');
  const [mismatch]=await sql.unsafe('SELECT (SELECT COUNT(*) FROM atlas.atlas_catalog_items c LEFT JOIN atlas.atlas_item_details d USING(namespace,name) WHERE d.name IS NULL)::int AS missing, (SELECT COUNT(*) FROM atlas.atlas_item_details d LEFT JOIN atlas.atlas_catalog_items c USING(namespace,name) WHERE c.name IS NULL)::int AS extra');
  if(mismatch.missing||mismatch.extra) throw new Error('Catalog and item detail keys differ');
  const rows=await sql.unsafe("SELECT key,value FROM atlas.atlas_meta WHERE key IN ('catalog_snapshot_meta','registry_snapshot_meta')");
  const meta=Object.fromEntries(rows.map(r=>[r.key,JSON.parse(r.value)]));
  if(meta.catalog_snapshot_meta?.item_count!==count.catalog || meta.catalog_snapshot_meta?.registry_count!==count.namespaces) throw new Error('Catalog metadata differs from tables');
  if(!meta.registry_snapshot_meta) throw new Error('Registry snapshot metadata is missing');
  const docs=await sql.unsafe("SELECT name FROM atlas.atlas_documents WHERE name IN ('catalog-taxonomy','catalog-kind-overrides','catalog-access-rules','catalog-gold-set','source-page-index-meta')");
  if(docs.length!==5) throw new Error('Missing required Atlas documents');
  console.log(JSON.stringify({tables:tables.length,...count,...mismatch}));
}catch(error){
  console.error('POSTGRES_CHECK_FAILED',error.code||'error',error.message);
  process.exitCode=1;
}finally{await sql.end({timeout:10});}
