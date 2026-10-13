import { describe, expect, it, vi } from 'vitest';
import { testRouteDatabase } from './postgresFixture';
// @ts-ignore Standalone JavaScript PostgreSQL module.
import * as atlasPostgres from '../../scripts/lib/atlas-postgres.mjs';

const {
  transaction, replaceRawRegistries, readRawRegistries, replaceCatalogSnapshot,
  readCatalogSnapshot, replaceRegistrySnapshot, readRegistrySnapshot,
  replaceSourcePages, readSourcePages, putDocument, readDocument,
  replaceItemDetails, readItemDetail, putClassificationRun,
  putClassificationBatch, readClassificationRun, readClassificationBatches,
  upsertClassificationRunItems, readClassificationRunItems, resetClassificationRun,
} = atlasPostgres;

vi.setConfig({testTimeout: 30000});

describe('authoritative PostgreSQL storage', () => {
  it('persists related catalog, registry, source-page and detail records atomically', async () => {
    const db = await testRouteDatabase();

    try {
      await transaction(db, async (tx: any) => {
        await replaceRawRegistries(tx, [{name:'@demo',homepage:'https://demo.test'}]);
        await replaceRegistrySnapshot(tx, {meta:{registry_count:1},registries:[{official:{name:'@demo'},atlas:{item_summaries:[]}}]});
        await replaceCatalogSnapshot(tx, {meta:{registry_count:1,item_count:1},registries:{'@demo':[{name:'button',type:'registry:ui'}]}});
        await replaceItemDetails(tx, '@demo', [{name:'button',dependencies:['react']}]);
        await replaceSourcePages(tx, {'@demo/button':{url:'https://demo.test/components/button',level:'reviewed'}});
        await putDocument(tx,'catalog-taxonomy','taxonomy',{version:'v1',roots:[]});
      });
      expect(await readRawRegistries(db)).toHaveLength(1);
      expect((await readCatalogSnapshot(db)).registries['@demo']).toHaveLength(1);
      expect((await readRegistrySnapshot(db)).registries[0].official.name).toBe('@demo');
      expect(await readItemDetail(db,'@demo','button')).toEqual({name:'button',dependencies:['react']});
      expect((await readSourcePages(db))['@demo/button'].level).toBe('reviewed');
      expect(await readDocument(db,'catalog-taxonomy')).toEqual({version:'v1',roots:[]});
    } finally { await db.close(); }
  });

  it('rolls back all nested writes when the outer transaction fails', async () => {
    const db = await testRouteDatabase();

    try {
      await expect(transaction(db, async (tx: any) => {
        await replaceCatalogSnapshot(tx,{meta:{},registries:{'@demo':[{name:'button'}]}});
        await replaceItemDetails(tx,'@demo',[{name:'button'}]);
        await putDocument(tx,'rollback-check','test',{ok:true});
        throw Error('intentional rollback');
      })).rejects.toThrow('intentional rollback');
      expect((await readCatalogSnapshot(db)).registries['@demo']).toBeUndefined();
      expect(await readItemDetail(db,'@demo','button')).toBeNull();
      expect(await readDocument(db,'rollback-check')).toBeNull();
    } finally { await db.close(); }
  });

  it('upserts and resets resumable classification batches without duplicate records', async () => {
    const db = await testRouteDatabase();

    try {
      await putClassificationRun(db,'fixture',{status:'running'});
      await putClassificationRun(db,'fixture',{status:'paused'});
      await putClassificationBatch(db,'fixture',1,{completed:1});
      await putClassificationBatch(db,'fixture',1,{completed:2});
      await upsertClassificationRunItems(db,'fixture',[{namespace:'@demo',name:'button',method:'pending'}]);
      await upsertClassificationRunItems(db,'fixture',[{namespace:'@demo',name:'button',method:'deterministic'}]);
      expect(await readClassificationRun(db,'fixture')).toEqual({status:'paused'});
      expect(await readClassificationBatches(db,'fixture')).toEqual([{completed:2}]);
      expect(await readClassificationRunItems(db,'fixture')).toEqual([{namespace:'@demo',name:'button',method:'deterministic'}]);
      await resetClassificationRun(db,'fixture');
      expect(await readClassificationRun(db,'fixture')).toBeNull();
      expect(await readClassificationBatches(db,'fixture')).toEqual([]);
      expect(await readClassificationRunItems(db,'fixture')).toEqual([]);
    } finally {await db.close();}
  });
});
