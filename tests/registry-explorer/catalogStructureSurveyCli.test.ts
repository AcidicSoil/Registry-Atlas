import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import {
  parseCatalogStructureSurveyArgs,
  runCatalogStructureSurveyBatches,
} from '../../scripts/survey-registry-catalog-structure.mjs';

describe('catalog structure survey CLI arguments', () => {
  it('allows a full-inventory dry plan without browser arguments', () => {
    expect(parseCatalogStructureSurveyArgs(['--dry-run', '--max-registries', '408'])).toMatchObject({
      dryRun: true,
      maxRegistries: 408,
      maxSurfaces: 4,
      maxLinks: 1500,
      delayMs: 1000,
      useClef: true,
    });
  });

  it('requires the managed browser identity and absolute output directory in live mode', () => {
    expect(() => parseCatalogStructureSurveyArgs([])).toThrow(/--profile/);
    expect(() => parseCatalogStructureSurveyArgs([
      '--profile', 'registry-atlas-source-audit',
      '--server', 'http://127.0.0.1:9877',
      '--tab', 'abc',
      '--output-dir', 'relative/path',
    ])).toThrow(/absolute/i);
  });

  it('parses bounded live options and no-clef mode', () => {
    expect(parseCatalogStructureSurveyArgs([
      '--profile', 'registry-atlas-source-audit',
      '--server', 'http://127.0.0.1:9877',
      '--tab', 'abc',
      '--output-dir', '/tmp/catalog-structure',
      '--cursor', '@kobra',
      '--max-registries', '12',
      '--max-surfaces', '6',
      '--max-links', '2000',
      '--delay-ms', '1500',
      '--decision-url', 'http://127.0.0.1:18080/v1/systemone',
      '--no-clef',
    ])).toEqual({
      profile: 'registry-atlas-source-audit',
      server: 'http://127.0.0.1:9877',
      tab: 'abc',
      outputDir: '/tmp/catalog-structure',
      cursor: '@kobra',
      maxRegistries: 12,
      maxSurfaces: 6,
      maxLinks: 2000,
      delayMs: 1500,
      decisionUrl: 'http://127.0.0.1:18080/v1/systemone',
      dryRun: false,
      useClef: false,
    });
  });

  it('parses automatic batching and resume flags', () => {
    expect(parseCatalogStructureSurveyArgs([
      '--profile', 'registry-atlas-source-audit',
      '--server', 'http://127.0.0.1:9877',
      '--tab', 'abc',
      '--output-dir', '/tmp/catalog-structure',
      '--max-registries', '20',
      '--all-batches',
      '--resume',
    ])).toMatchObject({
      maxRegistries: 20,
      allBatches: true,
      resume: true,
    });
  });

  it('runs every batch and persists resumable state after each batch', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'catalog-structure-batches-'));
    const seen: Array<string | undefined> = [];
    const result = await runCatalogStructureSurveyBatches({
      outputDir,
      initialCursor: undefined,
      resume: false,
      executeBatch: async cursor => {
        seen.push(cursor);
        if (!cursor) return { completed: 2, failed: 0, nextCursor: '@b', results: [] };
        if (cursor === '@b') return { completed: 2, failed: 1, nextCursor: '@d', results: [] };
        return { completed: 1, failed: 0, nextCursor: null, results: [] };
      },
    });

    expect(seen).toEqual([undefined, '@b', '@d']);
    expect(result).toMatchObject({ batches: 3, completed: 5, failed: 1, nextCursor: null });
    const state = JSON.parse(await readFile(join(outputDir, '_state.json'), 'utf8'));
    expect(state).toMatchObject({ status: 'completed', batches: 3, completed: 5, failed: 1, nextCursor: null });
    const batch2 = JSON.parse(await readFile(join(outputDir, '_batches', 'batch-0002.json'), 'utf8'));
    expect(batch2).toMatchObject({ completed: 2, failed: 1, nextCursor: '@d' });
  });

  it('resumes from the last persisted cursor without rerunning completed batches', async () => {
    const outputDir = await mkdtemp(join(tmpdir(), 'catalog-structure-resume-'));
    await runCatalogStructureSurveyBatches({
      outputDir,
      initialCursor: undefined,
      resume: false,
      stopAfterBatches: 1,
      executeBatch: async () => ({ completed: 2, failed: 0, nextCursor: '@b', results: [] }),
    });
    const seen: Array<string | undefined> = [];
    const result = await runCatalogStructureSurveyBatches({
      outputDir,
      initialCursor: undefined,
      resume: true,
      executeBatch: async cursor => {
        seen.push(cursor);
        return { completed: 1, failed: 0, nextCursor: null, results: [] };
      },
    });

    expect(seen).toEqual(['@b']);
    expect(result).toMatchObject({ batches: 2, completed: 3, failed: 0, nextCursor: null });
  });

  it('rejects unknown, repeated, or out-of-range arguments', () => {
    expect(() => parseCatalogStructureSurveyArgs(['--wat'])).toThrow(/Unknown/);
    expect(() => parseCatalogStructureSurveyArgs([
      '--dry-run', '--max-registries', '1', '--max-registries', '2',
    ])).toThrow(/repeated/i);
    expect(() => parseCatalogStructureSurveyArgs([
      '--dry-run', '--max-surfaces', '0',
    ])).toThrow(/max-surfaces/);
  });
});
