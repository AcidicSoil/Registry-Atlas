#!/usr/bin/env node
/** Recover newer public source-page evidence onto the restored local PostgreSQL database. */
import { readFile } from 'node:fs/promises';
import { gunzipSync } from 'node:zlib';
import postgres from 'postgres';
import { localPostgresUrl } from './lib/local-postgres-url.mjs';

const APPLY = process.argv.includes('--apply');

async function main() {
  const source = JSON.parse(gunzipSync(await readFile('public/data/registry-atlas.json.gz')).toString('utf8'));
  const documents = JSON.parse(await readFile('.instance/atlas-test-documents.json', 'utf8'));
  const sql = postgres(localPostgresUrl(), { max: 1 });

  try {
    const existing = await sql.unsafe('SELECT namespace,slug,payload_json FROM atlas.atlas_source_pages');
    const prior = new Map(existing.map(row => [row.namespace + '/' + row.slug, row.payload_json]));
    const changed = [];

    for (const [key, value] of Object.entries(source.sourcePageManifest.pages)) {
      const slash = key.indexOf('/');

      if (slash < 1) throw new Error('Invalid source-page identity: ' + key);

      const payload = JSON.stringify(value);

      if (prior.get(key) !== payload) {
        changed.push([key.slice(0, slash), key.slice(slash + 1), payload]);
      }
    }

    const existingDocs = await sql.unsafe('SELECT name,kind,payload_json FROM atlas.atlas_documents');
    const docsByName = new Map(existingDocs.map(row => [row.name, row]));

    const updates = Object.entries(documents)
      .filter(([name, payload]) => docsByName.get(name)?.payload_json !== JSON.stringify(payload));

    const report = {
      snapshotSourcePages: Object.keys(source.sourcePageManifest.pages).length,
      recoveredSourcePages: prior.size,
      changedSourcePages: changed.length,
      changedDocuments: updates.map(([name]) => name),
      mode: APPLY ? 'apply' : 'dry-run',
    };

    if (!APPLY) return report;

    await sql.begin(async tx => {
      for (let i = 0; i < changed.length; i += 500) {
        const batch = changed.slice(i, i + 500);
        const values = batch.map((_, j) => `($${j * 3 + 1},$${j * 3 + 2},$${j * 3 + 3})`).join(',');

        await tx.unsafe('INSERT INTO atlas.atlas_source_pages(namespace,slug,payload_json) VALUES ' + values
          + ' ON CONFLICT(namespace,slug) DO UPDATE SET payload_json=EXCLUDED.payload_json', batch.flat());
      }

      for (const [name, payload] of updates) {
        const kind = docsByName.get(name)?.kind ?? 'source-evidence';

        await tx.unsafe('INSERT INTO atlas.atlas_documents(name,kind,payload_json,updated_at) VALUES($1,$2,$3,$4)'
          + ' ON CONFLICT(name) DO UPDATE SET payload_json=EXCLUDED.payload_json,updated_at=EXCLUDED.updated_at',
        [name, kind, JSON.stringify(payload), new Date().toISOString()]);
      }
    });

    return report;
  } finally {
    await sql.end({ timeout: 10 });
  }
}

main().then(report => console.log(JSON.stringify(report))).catch(error => {
  console.error('SOURCE_EVIDENCE_RECONCILIATION_FAILED', error.message);
  process.exitCode = 1;
});
