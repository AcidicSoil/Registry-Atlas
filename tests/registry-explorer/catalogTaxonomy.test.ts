// @ts-ignore Node typings are intentionally not a project test dependency.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM module.
import { flattenCatalogTaxonomy, taxonomyDescendantIds, taxonomyNodeMap, validateCatalogTaxonomy } from '../../scripts/lib/catalog-taxonomy.mjs';

function leaf(id: string, aliases: string[] = []) {
  return {
    id,
    label: id.split('/').at(-1) ?? id,
    aliases,
    what: `Defines ${id}`,
    notFor: [],
    examples: [],
    children: [],
  };
}

function taxonomyWithRoots(roots: any[]) {
  return { version: 'v-test', roots };
}

describe('canonical catalog taxonomy', () => {
  it('validates and indexes the approved v1 taxonomy', () => {
    const raw = JSON.parse(readFileSync('data/catalog-taxonomy/v1.json', 'utf8'));
    const taxonomy = validateCatalogTaxonomy(raw);
    const flat = flattenCatalogTaxonomy(taxonomy);
    const byId = taxonomyNodeMap(taxonomy);

    expect(taxonomy.version).toBe('v1');
    expect(new Set(flat.map((record: any) => record.id)).size).toBe(flat.length);
    expect(byId.get('application/app-shell')).toMatchObject({
      id: 'application/app-shell',
      parentId: 'application',
    });
    expect(byId.has('ai/chat')).toBe(true);
    expect(byId.has('controls/button')).toBe(true);
    expect(byId.has('foundation/color')).toBe(true);
    expect(byId.has('foundation/typography')).toBe(true);
  });

  it('returns recursive descendants without unrelated branches', () => {
    const taxonomy = validateCatalogTaxonomy(taxonomyWithRoots([
      {
        ...leaf('application'),
        children: [
          { ...leaf('application/app-shell'), children: [leaf('application/app-shell/sidebar')] },
          leaf('application/dashboard'),
        ],
      },
      { ...leaf('ai'), children: [leaf('ai/chat')] },
    ]));

    expect(taxonomyDescendantIds(taxonomy, 'application')).toEqual([
      'application/app-shell',
      'application/app-shell/sidebar',
      'application/dashboard',
    ]);
    expect(taxonomyDescendantIds(taxonomy, 'application/app-shell')).toEqual([
      'application/app-shell/sidebar',
    ]);
    expect(taxonomyDescendantIds(taxonomy, 'application/dashboard')).toEqual([]);
    expect(() => taxonomyDescendantIds(taxonomy, 'missing')).toThrow(/unknown taxonomy node/i);
  });

  it('rejects malformed IDs and invalid parent-child hierarchy', () => {
    expect(() => validateCatalogTaxonomy(taxonomyWithRoots([
      leaf('Application Shell'),
    ]))).toThrow(/id/i);

    expect(() => validateCatalogTaxonomy(taxonomyWithRoots([
      { ...leaf('application'), children: [leaf('ai/chat')] },
    ]))).toThrow(/child.*application/i);
  });

  it('rejects duplicate nodes and cycles', () => {
    expect(() => validateCatalogTaxonomy(taxonomyWithRoots([
      leaf('application'),
      leaf('application'),
    ]))).toThrow(/duplicate.*application/i);

    const cycle: any = leaf('application');
    cycle.children = [cycle];
    expect(() => validateCatalogTaxonomy(taxonomyWithRoots([cycle]))).toThrow(/cycle|duplicate/i);
  });

  it('rejects normalized alias collisions across different nodes', () => {
    expect(() => validateCatalogTaxonomy(taxonomyWithRoots([
      { ...leaf('application'), children: [leaf('application/app-shell', ['App Shell'])] },
      { ...leaf('layout'), children: [leaf('layout/container', [' app-shell '])] },
    ]))).toThrow(/alias.*app shell/i);
  });

  it('requires complete node metadata arrays and non-empty definitions', () => {
    const missing = leaf('application') as any;
    delete missing.notFor;
    expect(() => validateCatalogTaxonomy(taxonomyWithRoots([missing]))).toThrow(/notFor/i);

    expect(() => validateCatalogTaxonomy(taxonomyWithRoots([
      { ...leaf('application'), what: '' },
    ]))).toThrow(/what/i);
  });
});
