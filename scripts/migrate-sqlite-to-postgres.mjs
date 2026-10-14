#!/usr/bin/env node
// One-time migration: read SQLite as an import source, write PostgreSQL.
import { DatabaseSync } from 'node:sqlite';
import { localPostgresUrl } from './lib/local-postgres-url.mjs';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { resolve } from 'node:path';
import postgres from 'postgres';

const quote = name => '"' + name.replaceAll('"', '""') + '"';

const url = localPostgresUrl();

const source = new DatabaseSync(resolve(process.env.ATLAS_IMPORT_SOURCE || '.instance/legacy-recovery/registry-atlas.sqlite'), { readOnly: true });

source.prepare('ATTACH DATABASE ? AS atlas_details').run(resolve(process.env.ATLAS_DETAILS_SOURCE || '.instance/legacy-recovery/registry-details.sqlite'));

const db = postgres(url, { max: 1, connect_timeout: 20, idle_timeout: 60 });

const types = { INTEGER: 'BIGINT', INT: 'BIGINT', REAL: 'DOUBLE PRECISION', BLOB: 'BYTEA' };

function schemaFor(table) {
  const fields = source.prepare('PRAGMA table_info(' + quote(table) + ')').all();
  const columns = fields.map(c => quote(c.name) + ' ' + (types[String(c.type).toUpperCase()] || 'TEXT') + (c.notnull || c.pk ? ' NOT NULL' : ''));
  const pk = fields.filter(c => c.pk > 0).sort((a,b) => a.pk-b.pk);

  if (pk.length) columns.push('PRIMARY KEY (' + pk.map(c => quote(c.name)).join(', ') + ')');

  return {fields,ddl: columns.join(', ')};
}

function csvCell(value) {
  if (value === null || value === undefined) return '\\N';
  const s = Buffer.isBuffer(value) ? '\\x' + value.toString('hex') : String(value);

  return '"' + s.replaceAll('"', '""') + '"';
}

function* rows(table,fields) {
  const columns = fields.map(c => c.name);

  for (const row of source.prepare('SELECT * FROM ' + quote(table)).iterate()) {
    yield columns.map(name => csvCell(row[name])).join(',') + '\n';
  }
}

try {
  if (source.prepare('PRAGMA integrity_check').get().integrity_check !== 'ok') throw new Error('Invalid source');
  const coreTables = source.prepare("SELECT name FROM main.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
  const detailTables = source.prepare("SELECT name FROM atlas_details.sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name").all().map(r => r.name);
  const tableNames = [...coreTables, ...detailTables].sort();

  if (new Set(tableNames).size !== tableNames.length) throw Error('Duplicate names across legacy databases');

  if (source.prepare('PRAGMA atlas_details.quick_check').get().quick_check !== 'ok') throw Error('Invalid detail source');

  if (!tableNames.includes('atlas_catalog_items') || !tableNames.includes('atlas_item_details')) throw new Error('Not an Atlas SQLite source');

  const report = await db.begin(async tx => {
    await tx.unsafe('CREATE SCHEMA IF NOT EXISTS atlas');
    const existing = await tx.unsafe("SELECT count(*)::integer AS n FROM information_schema.tables WHERE table_schema='atlas'");

    if (existing[0].n) throw new Error('Target atlas schema already contains tables; refusing to overwrite');
    let total = 0;
    const counts = {};

    for (const table of tableNames) {
      const { fields, ddl } = schemaFor(table);
      await tx.unsafe('CREATE TABLE atlas.' + quote(table) + '(' + ddl + ')');

      const statement = 'COPY atlas.' + quote(table)
        + ' (' + fields.map(c => quote(c.name)).join(',') + ") FROM STDIN WITH (FORMAT csv, NULL '\\N')";

      const sink = await tx.unsafe(statement).writable();
      await pipeline(Readable.from(rows(table,fields)), sink);
      const count = Number((await tx.unsafe('SELECT count(*)::bigint AS n FROM atlas.' + quote(table)))[0].n);
      const expected = source.prepare('SELECT COUNT(*) AS n FROM ' + quote(table)).get().n;

      if (count !== expected) throw new Error(table + ' count mismatch ' + count + ' != ' + expected);
      counts[table] = count;
      total += count;
      console.log('COPIED',table,count);
    }

    const mismatch = await tx.unsafe('SELECT (SELECT COUNT(*) FROM atlas.atlas_catalog_items c LEFT JOIN atlas.atlas_item_details d USING(namespace,name) WHERE d.name IS NULL)::int AS missing, (SELECT COUNT(*) FROM atlas.atlas_item_details d LEFT JOIN atlas.atlas_catalog_items c USING(namespace,name) WHERE c.name IS NULL)::int AS extra');

    if (mismatch[0].missing || mismatch[0].extra) throw new Error('Catalog/detail identity mismatch');

    for (const [table,columns] of Object.entries({
      atlas_catalog_items:['namespace'],atlas_item_details:['namespace'],item_routes:['namespace','slug'],
      atlas_source_pages:['namespace','slug'],atlas_classifications:['namespace','name']
    })) {
      await tx.unsafe('CREATE INDEX IF NOT EXISTS ' + quote('idx_pg_'+table+'_lookup')
        + ' ON atlas.' + quote(table) + ' (' + columns.map(quote).join(',') + ')');
    }

    return { tables: tableNames.length, rows: total, catalogItems: counts.atlas_catalog_items, itemDetails: counts.atlas_item_details };
  });

  console.log('POSTGRES_MIGRATION_OK', JSON.stringify(report));
} catch (error) {
  console.error('POSTGRES_MIGRATION_FAILED',error.code || 'error',error.message);
  process.exitCode = 1;
} finally {
  source.close();
  await db.end({timeout: 10});
}
