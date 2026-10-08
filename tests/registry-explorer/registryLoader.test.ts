import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { gunzipSync } from 'node:zlib';
import { loadRegistries } from '../../src/registry-explorer/data/loadRegistries';
import {
  configureSqlJsWasmBinaryForTests,
  resetRuntimeDatabaseCachesForTests,
} from '../../src/registry-explorer/data/runtimeDatabase';
// @ts-ignore Standalone Node ESM module intentionally has no TS declarations.
import * as atlasDatabase from '../../scripts/lib/atlas-database.mjs';
// @ts-ignore Standalone Node ESM module intentionally has no TS declarations.
import * as runtimeBuilder from '../../scripts/build-runtime-databases.mjs';

const {
  ensureAtlasCoreSchema,
  ensureAtlasDetailSchema,
  putDocument,
  replaceCatalogSnapshot,
  replaceRegistrySnapshot,
  replaceSourcePages,
} = atlasDatabase;
const { buildRuntimeDatabases } = runtimeBuilder;

beforeAll(async () => {
  configureSqlJsWasmBinaryForTests(
    new Uint8Array(await readFile('node_modules/sql.js/dist/sql-wasm.wasm')),
  );
});
afterEach(() => resetRuntimeDatabaseCachesForTests());

describe('loadRegistries SQLite runtime', () => {
  it('fetches one runtime database from the Vite base path and maps registry state', async () => {
    const fixture = await runtimeFixture();
    const calls: string[] = [];
    const data = await loadRegistries(async input => {
      calls.push(String(input));
      return gzipResponse(fixture.coreGzipPath);
    });

    expect(calls).toEqual(['/data/registry-atlas.sqlite.gz']);
    expect(data.meta.source_url).toBe('https://ui.shadcn.com/r/registries.json');
    expect(data.taxonomy.version).toBe('v1');
    expect(data.taxonomy.roots[0]?.id).toBe('application');
    expect(data.registries).toEqual([
      expect.objectContaining({
        name: '@example',
        url: 'https://example.com',
        description: 'Example registry.',
        atlas: expect.objectContaining({
          aliases: ['example-ui'],
          coverageStatus: 'inferred',
          confidence: 'medium',
          catalogStatus: 'partial',
          catalogItemCount: 1,
        }),
        itemSummaries: [
          expect.objectContaining({
            slug: 'button',
            rawItemUrl: 'https://example.com/r/button.json',
            docsUrl: 'https://example.com/components/button',
          }),
        ],
      }),
    ]);
    expect(data.catalogIndex.registries['@example']?.[0]).toMatchObject({
      name: 'button',
      type: 'registry:ui',
    });
    expect(data.catalogIndex.sourcePages?.['@example/button']).toMatchObject({
      url: 'https://example.com/components/button',
      level: 'reviewed',
      source: 'component-page-verified',
    });
  }, 30_000);

  it('accepts a gzip transport response whose body was already decoded by fetch', async () => {
    const fixture = await runtimeFixture();
    const compressed = await readFile(fixture.coreGzipPath);
    const data = await loadRegistries(async () => new Response(gunzipSync(compressed), {
      status: 200,
      headers: {
        'content-encoding': 'gzip',
        'content-type': 'application/octet-stream',
      },
    }));

    expect(data.registries[0]?.name).toBe('@example');
    expect(data.catalogIndex.registries['@example']?.[0]?.name).toBe('button');
  }, 30_000);

  it('preserves valid empty catalog namespaces from the database', async () => {
    const fixture = await runtimeFixture({ includeEmptyNamespace: true });
    const data = await loadRegistries(async () => gzipResponse(fixture.coreGzipPath));

    expect(data.catalogIndex.meta.registry_count).toBe(2);
    expect(data.catalogIndex.registries['@empty']).toEqual([]);
  }, 30_000);

  it('surfaces mirror validation warnings from database-backed records', async () => {
    const fixture = await runtimeFixture({ homepage: 'http://example.com' });
    const data = await loadRegistries(async () => gzipResponse(fixture.coreGzipPath));

    expect(data.warnings.map(warning => warning.code)).toContain('url-http');
  }, 30_000);

  it('fails when the runtime database cannot be fetched', async () => {
    await expect(loadRegistries(async () => new Response('', {
      status: 404,
      statusText: 'Not Found',
    }))).rejects.toThrow('Runtime database fetch failed');
  });
});

async function runtimeFixture(options: {
  homepage?: string;
  includeEmptyNamespace?: boolean;
} = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'registry-atlas-loader-'));
  const corePath = join(dir, 'core.sqlite');
  const detailPath = join(dir, 'details.sqlite');
  const outputDir = join(dir, 'runtime');

  const core = new DatabaseSync(corePath);
  ensureAtlasCoreSchema(core);
  replaceRegistrySnapshot(core, {
    meta: {
      source_url: 'https://ui.shadcn.com/r/registries.json',
      synced_at: '2026-10-07T00:00:00.000Z',
      upstream_count: 1,
      registry_count: 1,
      local_count: 1,
      validation_status: 'not_run',
      report_path: 'database:registry-sync-report',
    },
    registries: [{
      official: {
        name: '@example',
        homepage: options.homepage ?? 'https://example.com',
        registry_url_template: 'https://example.com/r/{name}.json',
        description: 'Example registry.',
      },
      atlas: {
        aliases: ['example-ui'],
        coverage_status: 'inferred',
        confidence: 'medium',
        notes: 'Fixture notes',
        catalog_status: 'partial',
        comparison_evidence: 'catalog',
        catalog_item_count: 1,
        catalog_evidence_url: 'https://example.com/r/registry.json',
        item_summaries: [{
          name: 'Button',
          slug: 'button',
          source: 'known-catalog',
          provenance: 'fixture',
          catalog_status: 'available',
          route_eligible: true,
          raw_item_url: 'https://example.com/r/button.json',
          docs_url: 'https://example.com/components/button',
          evidence_url: 'https://example.com/r/registry.json',
        }],
      },
      status: { warnings: [] },
    }],
  });
  replaceCatalogSnapshot(core, {
    meta: {
      source_url: 'https://ui.shadcn.com/r/registries.json',
      registry_count: options.includeEmptyNamespace ? 2 : 1,
      item_count: 1,
    },
    registries: {
      '@example': [{ name: 'button', type: 'registry:ui', categories: ['controls'] }],
      ...(options.includeEmptyNamespace ? { '@empty': [] } : {}),
    },
  });
  putDocument(core, 'catalog-taxonomy', 'taxonomy', taxonomyFixture());
  putDocument(core, 'catalog-kind-overrides', 'taxonomy-support', { registryDefaults: {} });
  putDocument(core, 'source-page-index-meta', 'runtime-meta', {
    schema: 'registry-atlas-source-page-index/v1',
    sourceSnapshotAt: '2026-10-07T00:00:00.000Z',
    coverage: {},
  });
  replaceSourcePages(core, {
    '@example/button': {
      url: 'https://example.com/components/button',
      level: 'reviewed',
      source: 'component-page-verified',
      observedAt: new Date().toISOString(),
    },
  });
  core.close();

  const details = new DatabaseSync(detailPath);
  ensureAtlasDetailSchema(details);
  details.close();

  const built = await buildRuntimeDatabases({ corePath, detailPath, outputDir });
  return built;
}

function taxonomyFixture() {
  return {
    version: 'v1',
    roots: [{
      id: 'application',
      label: 'Application',
      aliases: ['app'],
      what: 'Application surfaces',
      notFor: [],
      examples: [],
      children: [],
    }],
  };
}

async function gzipResponse(path: string): Promise<Response> {
  return new Response(await readFile(path), {
    status: 200,
    headers: { 'content-type': 'application/gzip' },
  });
}
