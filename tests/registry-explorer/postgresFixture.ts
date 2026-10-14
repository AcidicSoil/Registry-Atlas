import { randomBytes } from 'node:crypto';
import { readFileSync } from 'node:fs';
// @ts-ignore Server-side JavaScript PostgreSQL connection policy.
import { localPostgresUrl } from '../../scripts/lib/local-postgres-url.mjs';
// @ts-ignore Standalone PostgreSQL adapter module.
import {openAtlasCoreDatabase} from '../../scripts/lib/atlas-storage.mjs';

function testUrl(): string {
  const raw = process.env.ATLAS_TEST_DATABASE_URL
    || readFileSync('.instance/local-postgres-test-url', 'utf8').trim();

  const parsed = new URL(localPostgresUrl(raw));
  const production = new URL(readFileSync('.instance/local-postgres-url', 'utf8').trim());

  if (parsed.origin !== production.origin || parsed.pathname === production.pathname) {
    throw new Error('Isolated local PostgreSQL test database required; refusing production database');
  }

  return parsed.toString();
}

export async function testRouteDatabase():Promise<any> {
  const db=openAtlasCoreDatabase(process.cwd(),{databaseUrl:testUrl()});
  const name='atlas_fixture_'+randomBytes(8).toString('hex');
  const close=db.close.bind(db);

  try{
    await db.exec('CREATE SCHEMA '+name);

    const tables=['sources','route_patterns','examples','sitemap_links','metadata','pattern_checks','item_routes','component_url_checks',
      'atlas_meta','atlas_detail_meta','atlas_raw_registries','atlas_registries','atlas_catalog_namespaces','atlas_catalog_items',
      'atlas_item_summaries','atlas_catalog_evidence','atlas_source_pages','atlas_documents','atlas_classifications',
      'atlas_classification_runs','atlas_classification_batches','atlas_classification_run_items','atlas_item_details'];

    for(const table of tables){
      await db.exec('CREATE TABLE '+name+'.'+table+' (LIKE atlas.'+table+' INCLUDING ALL)');
    }

    await db.exec('SET search_path TO '+name+',atlas,public');
    db.__atlasSchema=name;
    db.close=async()=>{
      try {
        await db.exec('SET search_path TO atlas,public');
        await db.exec('SET client_min_messages TO warning');
        await db.exec('DROP SCHEMA IF EXISTS '+name+' CASCADE');
      }finally{await close()}
    };

    return db;
  }catch(e){
    try{await db.exec('DROP SCHEMA IF EXISTS '+name+' CASCADE');}
    finally{await close()}

    throw e;
  }
}
