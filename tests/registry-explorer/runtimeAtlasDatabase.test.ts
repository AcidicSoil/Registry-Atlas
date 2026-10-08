import { describe, expect, it } from 'vitest';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
// @ts-ignore Standalone Node ESM module intentionally has no TS declarations.
import * as atlasDatabase from '../../scripts/lib/atlas-database.mjs';
// @ts-ignore Standalone Node ESM module intentionally has no TS declarations.
import * as runtimeBuilder from '../../scripts/build-runtime-databases.mjs';

const {
  ensureAtlasCoreSchema,
  ensureAtlasDetailSchema,
  putDocument,
  replaceCatalogSnapshot,
  replaceItemDetails,
  replaceRegistrySnapshot,
  replaceSourcePages,
} = atlasDatabase;
const { buildRuntimeDatabases } = runtimeBuilder;

describe('runtime SQLite projection', () => {
  it('publishes compact database payloads instead of JSON artifacts', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'registry-atlas-db-'));
    const corePath = join(dir, 'core.sqlite');
    const detailPath = join(dir, 'details.sqlite');
    const out = join(dir, 'runtime');

    const core = new DatabaseSync(corePath);
    ensureAtlasCoreSchema(core);
    replaceRegistrySnapshot(core, {
      meta: { source_url: 'https://example.test/registries.json' },
      registries: [{
        official: { name: '@demo', homepage: 'https://demo.test', registry_url_template: 'https://demo.test/r/{name}.json', description: 'Demo' },
        atlas: { aliases: [], item_summaries: [] },
        status: { warnings: [] },
      }],
    });
    replaceCatalogSnapshot(core, {
      meta: { registry_count: 1, item_count: 1 },
      registries: { '@demo': [{ name: 'button', type: 'registry:component' }] },
    });
    replaceSourcePages(core, {
      '@demo/button': { url: 'https://demo.test/button', level: 'reviewed', source: 'component-page-verified' },
    });
    putDocument(core, 'catalog-taxonomy', 'taxonomy', { version: 'v1', roots: [] });
    core.close();

    const details = new DatabaseSync(detailPath);
    ensureAtlasDetailSchema(details);
    replaceItemDetails(details, '@demo', [{ name: 'button', type: 'registry:component' }]);
    details.close();

    const result = await buildRuntimeDatabases({ corePath, detailPath, outputDir: out });
    expect(result.coreGzipPath.endsWith('registry-atlas.sqlite.gz')).toBe(true);
    expect(result.detailGzipPath.endsWith('registry-details.sqlite.gz')).toBe(true);

    const runtimeCorePath = join(dir, 'runtime-core.sqlite');
    const runtimeDetailPath = join(dir, 'runtime-details.sqlite');
    await writeFile(runtimeCorePath, gunzipSync(await readFile(result.coreGzipPath)));
    await writeFile(runtimeDetailPath, gunzipSync(await readFile(result.detailGzipPath)));

    const runtimeCore = new DatabaseSync(runtimeCorePath, { readOnly: true });
    expect((runtimeCore.prepare('SELECT count(*) AS n FROM atlas_catalog_items').get() as { n: number }).n).toBe(1);
    expect((runtimeCore.prepare("SELECT count(*) AS n FROM atlas_documents WHERE name='catalog-taxonomy'").get() as { n: number }).n).toBe(1);
    expect((runtimeCore.prepare('SELECT count(*) AS n FROM atlas_item_routes').get() as { n: number }).n).toBe(0);
    expect((runtimeCore.prepare('SELECT count(*) AS n FROM atlas_route_patterns').get() as { n: number }).n).toBe(0);
    expect(() => runtimeCore.prepare('SELECT count(*) FROM route_patterns').get()).toThrow();
    expect(() => runtimeCore.prepare('SELECT count(*) FROM pattern_checks').get()).toThrow();
    runtimeCore.close();

    const runtimeDetails = new DatabaseSync(runtimeDetailPath, { readOnly: true });
    expect((runtimeDetails.prepare('SELECT count(*) AS n FROM atlas_item_details').get() as { n: number }).n).toBe(1);
    runtimeDetails.close();
  }, 30_000);
});
