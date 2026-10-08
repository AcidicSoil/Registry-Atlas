import { describe, expect, it } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
// @ts-ignore Standalone Node ESM module intentionally has no TS declarations.
import * as atlasDatabase from '../../scripts/lib/atlas-database.mjs';

const {
  ensureAtlasCoreSchema,
  ensureAtlasDetailSchema,
  replaceCatalogSnapshot,
  readCatalogSnapshot,
  replaceRegistrySnapshot,
  readRegistrySnapshot,
  replaceItemDetails,
  readItemDetail,
  putDocument,
  readDocument,
  replaceSourcePages,
  readSourcePages,
} = atlasDatabase;

describe('Atlas SQLite storage', () => {
  it('stores canonical registry, catalog, taxonomy and source-page records without JSON files', () => {
    const db = new DatabaseSync(':memory:');
    ensureAtlasCoreSchema(db);

    replaceRegistrySnapshot(db, {
      meta: { source_url: 'https://example.test/registries.json', synced_at: '2026-10-07T00:00:00Z' },
      registries: [{
        official: {
          name: '@demo',
          homepage: 'https://demo.test',
          registry_url_template: 'https://demo.test/r/{name}.json',
          description: 'Demo registry',
        },
        atlas: { aliases: [], item_summaries: [] },
        status: { warnings: [] },
      }],
    });
    replaceCatalogSnapshot(db, {
      meta: { source_url: 'https://example.test/registries.json', synced_at: '2026-10-07T00:00:00Z', registry_count: 1, item_count: 1 },
      registries: { '@demo': [{ name: 'button', type: 'registry:component', kind: 'component' }] },
    });
    putDocument(db, 'catalog-taxonomy', 'taxonomy', { version: 'v1', roots: [] });
    replaceSourcePages(db, {
      '@demo/button': {
        url: 'https://demo.test/components/button',
        level: 'reviewed',
        source: 'component-page-verified',
      },
    });

    expect(readRegistrySnapshot(db).registries[0].official.name).toBe('@demo');
    expect(readCatalogSnapshot(db).registries['@demo'][0]).toMatchObject({ name: 'button', kind: 'component' });
    expect(readDocument(db, 'catalog-taxonomy')).toEqual({ version: 'v1', roots: [] });
    expect(readSourcePages(db)['@demo/button']?.url).toBe('https://demo.test/components/button');
    db.close();
  });

  it('stores detail records by exact registry identity for lazy lookup', () => {
    const db = new DatabaseSync(':memory:');
    ensureAtlasDetailSchema(db);
    replaceItemDetails(db, '@demo', [
      { name: 'button', type: 'registry:component', dependencies: ['react'] },
      { name: 'card', type: 'registry:component' },
    ]);

    expect(readItemDetail(db, '@demo', 'button')).toEqual({
      name: 'button',
      type: 'registry:component',
      dependencies: ['react'],
    });
    expect(readItemDetail(db, '@demo', 'missing')).toBeNull();
    db.close();
  });
});
