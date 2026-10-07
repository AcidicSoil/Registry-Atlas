// @ts-ignore Node typings are intentionally not a project test dependency.
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
// @ts-ignore Node typings are intentionally not a project test dependency.
import { tmpdir } from 'node:os';
// @ts-ignore Node typings are intentionally not a project test dependency.
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import { classifyRegistryCatalog, main, parseCatalogClassificationArgs, runCatalogClassificationBatches } from '../../scripts/classify-registry-catalog.mjs';
// @ts-ignore Standalone Node ESM module.
import { validateCatalogTaxonomy } from '../../scripts/lib/catalog-taxonomy.mjs';

const fixtureTaxonomy = validateCatalogTaxonomy({
  version: 'fixture-v1',
  roots: [
    {
      id: 'application', label: 'Application', aliases: [], what: 'Application surfaces.', notFor: [], examples: [],
      children: [{ id: 'application/app-shell', label: 'App Shell', aliases: ['app shell'], what: 'App frame.', notFor: [], examples: [], children: [] }],
    },
    {
      id: 'controls', label: 'Controls', aliases: [], what: 'Controls.', notFor: [], examples: [],
      children: [{ id: 'controls/button', label: 'Button', aliases: ['button'], what: 'Button control.', notFor: [], examples: [], children: [] }],
    },
  ],
});

async function fixtureFiles() {
  const dir = await mkdtemp(join(tmpdir(), 'catalog-classification-'));
  const taxonomyPath = join(dir, 'taxonomy.json');
  const catalogPath = join(dir, 'catalog.json');
  const outputDir = join(dir, 'out');
  await writeFile(taxonomyPath, JSON.stringify(fixtureTaxonomy));
  await writeFile(catalogPath, JSON.stringify({
    meta: { registry_count: 2, item_count: 3 },
    registries: {
      '@alpha': [
        { name: 'app-shell', title: 'App Shell', type: 'registry:block' },
        { name: 'mystery', title: 'Mystery Workspace', type: 'registry:block' },
      ],
      '@beta': [{ name: 'button', title: 'Button', type: 'registry:ui' }],
    },
  }));
  return { dir, taxonomyPath, catalogPath, outputDir };
}

describe('catalog classification CLI arguments', () => {
  it('parses local-only classification controls and bounded defaults', () => {
    expect(parseCatalogClassificationArgs([
      '--taxonomy', '/tmp/taxonomy.json', '--catalog', '/tmp/catalog.json',
      '--output-dir', '/tmp/out', '--deterministic-only', '--all-batches', '--resume',
    ])).toMatchObject({
      taxonomyPath: '/tmp/taxonomy.json', catalogPath: '/tmp/catalog.json', outputDir: '/tmp/out',
      maxRegistries: 20, deterministicOnly: true, allBatches: true, resume: true,
    });
  });

  it('rejects browser/profile flags and invalid resume use', () => {
    expect(() => parseCatalogClassificationArgs(['--profile', 'anything'])).toThrow(/unknown/i);
    expect(() => parseCatalogClassificationArgs([
      '--taxonomy', '/tmp/taxonomy.json', '--catalog', '/tmp/catalog.json',
      '--output-dir', '/tmp/out', '--resume',
    ])).toThrow(/all-batches/i);
  });

  it('dry-plans the local catalog inventory without browser arguments', async () => {
    const fixture = await fixtureFiles();
    const result = await main([
      '--taxonomy', fixture.taxonomyPath, '--catalog', fixture.catalogPath,
      '--dry-run', '--max-registries', '1',
    ]);
    expect(result).toMatchObject({ dryRun: true, totalRegistries: 2, batchSize: 1, nextCursor: '@alpha' });
    expect(result.registries).toEqual([{ namespace: '@alpha', itemCount: 2 }]);
  });
});

describe('catalog classification batching', () => {
  it('follows all cursors and resumes from the last completed batch with matching fingerprints', async () => {
    const fixture = await fixtureFiles();
    const seen: Array<string | undefined> = [];
    await runCatalogClassificationBatches({
      outputDir: fixture.outputDir,
      initialCursor: undefined,
      resume: false,
      taxonomyFingerprint: 'sha256:tax',
      catalogFingerprint: 'sha256:catalog',
      stopAfterBatches: 1,
      executeBatch: async (cursor: string | undefined) => {
        seen.push(cursor);
        return { completed: 1, failed: 0, totalRegistries: 2, nextCursor: '@alpha', results: [] };
      },
    });
    const resumed: Array<string | undefined> = [];
    const result = await runCatalogClassificationBatches({
      outputDir: fixture.outputDir,
      initialCursor: undefined,
      resume: true,
      taxonomyFingerprint: 'sha256:tax',
      catalogFingerprint: 'sha256:catalog',
      executeBatch: async (cursor: string | undefined) => {
        resumed.push(cursor);
        return { completed: 1, failed: 0, totalRegistries: 2, nextCursor: null, results: [] };
      },
    });
    expect(seen).toEqual([undefined]);
    expect(resumed).toEqual(['@alpha']);
    expect(result).toMatchObject({ status: 'completed', batches: 2, completed: 2, failed: 0, nextCursor: null });

    await expect(runCatalogClassificationBatches({
      outputDir: fixture.outputDir,
      resume: true,
      taxonomyFingerprint: 'sha256:changed',
      catalogFingerprint: 'sha256:catalog',
      executeBatch: async () => ({ completed: 0, failed: 0, nextCursor: null, results: [] }),
    })).rejects.toThrow(/fingerprint/i);
  });
});

describe('catalog classification artifacts', () => {
  it('runs every local registry deterministically and leaves model-required items explicitly pending', async () => {
    const fixture = await fixtureFiles();
    const result = await main([
      '--taxonomy', fixture.taxonomyPath, '--catalog', fixture.catalogPath,
      '--output-dir', fixture.outputDir, '--max-registries', '1',
      '--all-batches', '--deterministic-only',
    ]);
    expect(result).toMatchObject({ status: 'completed', completed: 2, failed: 0, batches: 2 });

    const alpha = JSON.parse(await readFile(join(fixture.outputDir, 'alpha.json'), 'utf8'));
    expect(alpha).toMatchObject({ namespace: '@alpha', taxonomyVersion: 'fixture-v1' });
    expect(alpha.taxonomyFingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(alpha.catalogFingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(alpha.items).toHaveLength(2);
    expect(alpha.items[0]).toMatchObject({
      namespace: '@alpha', name: 'app-shell', kind: 'block', taxonomyVersion: 'fixture-v1',
      canonical: { primary: 'application/app-shell', path: ['application', 'application/app-shell'] },
      method: 'deterministic-alias',
    });
    expect(alpha.items[0].inputFingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
    expect(alpha.items[0].generatedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    expect(alpha.items[1]).toMatchObject({
      namespace: '@alpha', name: 'mystery', kind: 'block', taxonomyVersion: 'fixture-v1',
      canonical: { primary: null, path: [] }, method: 'unclassified', pendingDecision: true,
    });
    expect(alpha.items[1]).not.toHaveProperty('systemOne');

    const state = JSON.parse(await readFile(join(fixture.outputDir, '_state.json'), 'utf8'));
    expect(state).toMatchObject({ status: 'completed', completed: 2, failed: 0, taxonomyVersion: 'fixture-v1' });
    expect(state.taxonomyFingerprint).toBe(alpha.taxonomyFingerprint);
    expect(state.catalogFingerprint).toBe(alpha.catalogFingerprint);
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
          confidence: 0.3, model: 'fixture-model',
        };
        if (node.id === 'application') return {
          choice: 'application/app-shell',
          probabilities: { 'application/app-shell': 0.8, THIS_CATEGORY: 0.2 },
          confidence: 0.4, model: 'fixture-model',
        };
        return {
          choice: 'THIS_CATEGORY',
          probabilities: { 'controls/button': 0.4, THIS_CATEGORY: 0.6 },
          confidence: 0.1, model: 'fixture-model',
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
