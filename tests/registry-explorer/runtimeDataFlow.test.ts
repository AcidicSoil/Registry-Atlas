import { mkdtemp, rm, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { gzipSync } from 'node:zlib';
import { afterEach, describe, expect, it } from 'vitest';
import { checkRuntimeData } from '../../scripts/check-runtime-data.mjs';

const temporaryDirs: string[] = [];

afterEach(async () => {
  await Promise.all(temporaryDirs.splice(0).map(dir => rm(dir, { recursive: true, force: true })));
});

async function createSnapshot(details: { '@test/button'?: { files?: readonly string[] } } = { '@test/button': {} }) {
  const root = await mkdtemp(join(tmpdir(), 'atlas-runtime-check-'));

  temporaryDirs.push(root);
  await mkdir(join(root, 'public/data'), { recursive: true });

  await mkdir(join(root, '.instance'), { recursive: true });
  await writeFile(join(root, 'public/data/registry-atlas.json.gz'), gzipSync(JSON.stringify({
    catalog: { registries: { '@test': [{ name: 'button' }] } },
  })));
  await writeFile(join(root, 'public/data/registry-details.json.gz'), gzipSync(JSON.stringify(details)));
  await writeFile(join(root, '.instance/atlas-test-documents.json'), JSON.stringify({ taxonomy: {} }));

  return root;
}

describe('local-first runtime data', () => {
  it('validates local artifacts without accessing PostgreSQL', async () => {
    const root = await createSnapshot();
    await expect(checkRuntimeData(root)).resolves.toMatchObject({ catalogItems: 1, itemDetails: 1 });
  });

  it('fails visibly if a local snapshot is missing', async () => {
    const root = await createSnapshot();
    await rm(join(root, 'public/data/registry-details.json.gz'));
    await expect(checkRuntimeData(root)).rejects.toThrow();
  });

  it('rejects mismatched catalog and detail snapshots', async () => {
    const root = await createSnapshot({});
    await expect(checkRuntimeData(root)).rejects.toThrow(/do not match/);
  });

  it('keeps remote export explicit in package scripts', async () => {
    const { default: packageJson } = await import('../../package.json');
    const scripts = packageJson.scripts;

    expect(scripts.predev).toBe('pnpm check:runtime-data');
    expect(scripts.pretest).toBe('pnpm check:runtime-data');
    expect(scripts.prebuild).toBe('pnpm check:runtime-data');
    expect(scripts['prepare:runtime-data']).toContain('build-runtime-data.mjs');
    expect(scripts.verify).toContain('pnpm prepare:runtime-data');
    expect(scripts['verify:local']).toContain('pnpm test:local');
    expect(scripts['verify:local']).not.toContain('pnpm check:product-contract');
    expect(scripts['test:local']).toContain('--exclude tests/registry-explorer/postgresStorage.test.ts');
    expect(scripts.verify).toContain('pnpm test && pnpm check:postgres');
  });
});
