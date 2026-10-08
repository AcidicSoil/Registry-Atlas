import { mkdir, mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script intentionally has no TypeScript declaration.
import * as catalogClassificationCli from '../../scripts/classify-registry-catalog.mjs';
const {
  classifyRegistryCatalog,
  main,
  parseCatalogClassificationArgs,
  runCatalogClassificationBatches,
} = catalogClassificationCli;
// @ts-ignore Standalone Node ESM module.
import { validateCatalogTaxonomy } from '../../scripts/lib/catalog-taxonomy.mjs';
// @ts-ignore Standalone Node ESM module.
import * as atlasDatabase from '../../scripts/lib/atlas-database.mjs';

const {
  ensureAtlasCoreSchema,
  putDocument,
  readClassificationRun,
  readClassificationRunItems,
  replaceCatalogSnapshot,
} = atlasDatabase;

const fixtureTaxonomy = validateCatalogTaxonomy({
  version: 'fixture-v1',
  roots: [
    {
      id: 'application', label: 'Application', aliases: [], what: 'Application surfaces.',
      notFor: [], examples: [],
      children: [{
        id: 'application/app-shell', label: 'App Shell', aliases: ['app shell'],
        what: 'App frame.', notFor: [], examples: [], children: [],
      }],
    },
    {
      id: 'controls', label: 'Controls', aliases: [], what: 'Controls.',
      notFor: [], examples: [],
      children: [{
        id: 'controls/button', label: 'Button', aliases: ['button'],
        what: 'Button control.', notFor: [], examples: [], children: [],
      }],
    },
  ],
});

async function fixtureDatabase() {
  const dir = await mkdtemp(join(tmpdir(), 'catalog-classification-'));
  await mkdir(join(dir, 'data'), { recursive: true });
  const dbPath = join(dir, 'data', 'registry-atlas.sqlite');
  const db = new DatabaseSync(dbPath);
  ensureAtlasCoreSchema(db);
  replaceCatalogSnapshot(db, {
    meta: { registry_count: 2, item_count: 3 },
    registries: {
      '@alpha': [
        { name: 'app-shell', title: 'App Shell', type: 'registry:block' },
        { name: 'mystery', title: 'Mystery Workspace', type: 'registry:block' },
      ],
      '@beta': [{ name: 'button', title: 'Button', type: 'registry:ui' }],
    },
  });
  putDocument(db, 'catalog-taxonomy', 'taxonomy', fixtureTaxonomy);
  putDocument(db, 'catalog-kind-overrides', 'taxonomy-support', { registryDefaults: {} });
  db.close();
  return { dir, dbPath };
}

describe('catalog classification CLI arguments', () => {
  it('parses database-backed local classification controls and bounded defaults', () => {
    expect(parseCatalogClassificationArgs([
      '--run-id', 'fixture-run', '--deterministic-only', '--all-batches', '--resume',
    ])).toMatchObject({
      runId: 'fixture-run',
      maxRegistries: 20,
      deterministicOnly: true,
      allBatches: true,
      resume: true,
    });
  });

  it('rejects browser/profile flags, missing run ids, and invalid resume use', () => {
    expect(() => parseCatalogClassificationArgs(['--profile', 'anything'])).toThrow(/unknown/i);
    expect(() => parseCatalogClassificationArgs(['--run-id', 'fixture', '--resume']))
      .toThrow(/all-batches/i);
    expect(() => parseCatalogClassificationArgs(['--deterministic-only']))
      .toThrow(/run-id/i);
  });

  it('dry-plans the database catalog without browser arguments or a run id', async () => {
    const fixture = await fixtureDatabase();
    const result = await main(['--dry-run', '--max-registries', '1'], fixture.dir);
    expect(result).toMatchObject({
      dryRun: true,
      totalRegistries: 2,
      batchSize: 1,
      nextCursor: '@alpha',
    });
    expect(result.registries).toEqual([{ namespace: '@alpha', itemCount: 2 }]);
  }, 30_000);
});

describe('catalog classification batching', () => {
  it('persists resumable state and fingerprints in SQLite', async () => {
    const database = new DatabaseSync(':memory:');
    ensureAtlasCoreSchema(database);
    const seen: Array<string | undefined> = [];

    await runCatalogClassificationBatches({
      database,
      runId: 'fixture-run',
      initialCursor: undefined,
      resume: false,
      taxonomyVersion: 'fixture-v1',
      taxonomyFingerprint: 'sha256:tax',
      catalogFingerprint: 'sha256:catalog',
      stopAfterBatches: 1,
      executeBatch: async (cursor: string | undefined) => {
        seen.push(cursor);
        return {
          completed: 1, failed: 0, totalRegistries: 2,
          nextCursor: '@alpha', results: [],
        };
      },
    });

    const resumed: Array<string | undefined> = [];
    const result = await runCatalogClassificationBatches({
      database,
      runId: 'fixture-run',
      initialCursor: undefined,
      resume: true,
      taxonomyVersion: 'fixture-v1',
      taxonomyFingerprint: 'sha256:tax',
      catalogFingerprint: 'sha256:catalog',
      executeBatch: async (cursor: string | undefined) => {
        resumed.push(cursor);
        return {
          completed: 1, failed: 0, totalRegistries: 2,
          nextCursor: null, results: [],
        };
      },
    });

    expect(seen).toEqual([undefined]);
    expect(resumed).toEqual(['@alpha']);
    expect(result).toMatchObject({
      status: 'completed', batches: 2, completed: 2, failed: 0, nextCursor: null,
    });
    expect(readClassificationRun(database, 'fixture-run')).toMatchObject({
      taxonomyFingerprint: 'sha256:tax',
      catalogFingerprint: 'sha256:catalog',
    });

    await expect(runCatalogClassificationBatches({
      database,
      runId: 'fixture-run',
      resume: true,
      taxonomyFingerprint: 'sha256:changed',
      catalogFingerprint: 'sha256:catalog',
      executeBatch: async () => ({ completed: 0, failed: 0, nextCursor: null, results: [] }),
    })).rejects.toThrow(/fingerprint/i);
    database.close();
  });
});

describe('catalog classification artifacts', () => {
  it('stores every deterministic registry result in SQLite and marks model-required items pending', async () => {
    const fixture = await fixtureDatabase();
    const result = await main([
      '--run-id', 'deterministic-run', '--max-registries', '1',
      '--all-batches', '--deterministic-only',
    ], fixture.dir);
    expect(result).toMatchObject({ status: 'completed', completed: 2, failed: 0, batches: 2 });

    const db = new DatabaseSync(fixture.dbPath, { readOnly: true });
    const items = readClassificationRunItems(db, 'deterministic-run');
    const state = readClassificationRun(db, 'deterministic-run');
    db.close();

    expect(items).toHaveLength(3);
    expect(items.find((item: any) => item.namespace === '@alpha' && item.name === 'app-shell'))
      .toMatchObject({
        kind: 'block',
        taxonomyVersion: 'fixture-v1',
        canonical: {
          primary: 'application/app-shell',
          path: ['application', 'application/app-shell'],
        },
        method: 'deterministic-alias',
      });
    expect(items.find((item: any) => item.namespace === '@alpha' && item.name === 'mystery'))
      .toMatchObject({
        kind: 'block',
        canonical: { primary: null, path: [] },
        method: 'unclassified',
        pendingDecision: true,
      });
    expect(state).toMatchObject({
      status: 'completed',
      completed: 2,
      failed: 0,
      taxonomyVersion: 'fixture-v1',
    });
  }, 30_000);

  it('applies reviewed registry kind overrides before deterministic canonical classification', async () => {
    const iconTaxonomy = validateCatalogTaxonomy({
      version: 'icon-v1',
      roots: [{
        id: 'foundation',
        label: 'Foundation',
        aliases: [],
        what: 'Foundational design assets.',
        notFor: [],
        examples: [],
        children: [{
          id: 'foundation/iconography',
          label: 'Iconography',
          aliases: ['icons'],
          what: 'Icon systems and icon assets.',
          notFor: [],
          examples: [],
          children: [],
        }],
      }],
    });

    const artifact = await classifyRegistryCatalog({
      namespace: '@keyline',
      items: [{
        name: 'accessibility',
        title: 'Accessibility',
        type: 'registry:component',
        description: 'An icon drawing on a 24×24 grid.',
      }],
      taxonomy: iconTaxonomy,
      taxonomyFingerprint: 'sha256:tax',
      catalogFingerprint: 'sha256:catalog',
      deterministicOnly: true,
      kindOverrides: { registryDefaults: { '@keyline': 'icon' } },
    });

    expect(artifact.items[0]).toMatchObject({
      namespace: '@keyline',
      name: 'accessibility',
      kind: 'icon',
      method: 'deterministic-kind',
      canonical: {
        primary: 'foundation/iconography',
        path: ['foundation', 'foundation/iconography'],
      },
    });
    expect(artifact.items[0]).not.toHaveProperty('pendingDecision');
  });

  it('records System One model and decision traces when classification requires a choice', async () => {
    const artifact = await classifyRegistryCatalog({
      namespace: '@demo',
      items: [{ name: 'assistant-workspace', title: 'Assistant Workspace', type: 'registry:block' }],
      taxonomy: fixtureTaxonomy,
      taxonomyFingerprint: 'sha256:tax',
      catalogFingerprint: 'sha256:catalog',
      deterministicOnly: false,
      choose: async ({ node }: any) => {
        if (node === null) return {
          choice: 'application',
          probabilities: { application: 0.7, controls: 0.2, UNCLASSIFIED: 0.1 },
          confidence: 0.3,
          model: 'fixture-model',
        };
        if (node.id === 'application') return {
          choice: 'application/app-shell',
          probabilities: { 'application/app-shell': 0.8, THIS_CATEGORY: 0.2 },
          confidence: 0.4,
          model: 'fixture-model',
        };
        return {
          choice: 'THIS_CATEGORY',
          probabilities: { 'controls/button': 0.4, THIS_CATEGORY: 0.6 },
          confidence: 0.1,
          model: 'fixture-model',
        };
      },
    });
    expect(artifact.items[0]).toMatchObject({
      method: 'system-one',
      canonical: { primary: 'application/app-shell' },
      systemOne: { model: 'fixture-model', beamWidth: 2 },
    });
    expect(artifact.items[0].systemOne.decisions.length).toBeGreaterThan(0);
  });
});
