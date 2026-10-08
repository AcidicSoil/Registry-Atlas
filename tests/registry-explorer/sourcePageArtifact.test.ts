import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM scripts are tested through Vitest in Node.
import { buildSourcePageIndex } from '../../scripts/build-source-page-index.mjs';
// @ts-ignore Standalone Node ESM scripts are tested through Vitest in Node.
import { exportPatternLinkSnapshot } from '../../scripts/verify-registry-patterns.mjs';
// @ts-ignore Standalone Node ESM module intentionally has no TypeScript declaration.
import * as atlasStorage from '../../scripts/lib/atlas-storage.mjs';
const {
  openAtlasCoreDatabase,
  readAtlasState,
  readDocument,
} = atlasStorage;

describe('database source-page index', () => {
  it('is reproducible from current SQLite evidence without guessed URLs or preview artifacts', () => {
    const database = openAtlasCoreDatabase(process.cwd(), { readOnly: true });
    try {
      const state = readAtlasState(database);
      const patternLinks = exportPatternLinkSnapshot(database);
      const latest = patternLinks.links.reduce(
        (max: number, row: { checkedAt: string }) =>
          Math.max(max, Date.parse(row.checkedAt) || 0),
        Date.parse(patternLinks.sourceSnapshotAt),
      );
      const generated = buildSourcePageIndex({
        raw: state.rawRegistries,
        catalog: state.catalog,
        curated: state.curated,
        traversal: null,
        patternLinks,
        now: new Date(latest + 24 * 60 * 60 * 1000).toISOString(),
      });
      const persistedMeta = readDocument(database, 'source-page-index-meta');

      expect(state.sourcePages).toEqual(generated.pages);
      expect(persistedMeta).toMatchObject({
        schema: generated.schema,
        sourceSnapshotAt: generated.sourceSnapshotAt,
        coverage: generated.coverage,
      });
      expect(generated.coverage.published).toBe(
        generated.coverage.reviewed
          + generated.coverage.sitemap
          + generated.coverage.pattern,
      );
      expect(generated.coverage.distinctIndexed).toBe(
        generated.coverage.published + generated.coverage.missing,
      );
      expect(generated.pages['@8bitcn/input-otp']).toMatchObject({
        url: 'https://www.8bitcn.com/docs/components/input-otp',
        level: 'reviewed',
      });
    } finally {
      database.close();
    }
  }, 30_000);
});
