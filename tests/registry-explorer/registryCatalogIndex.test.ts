import { describe, expect, it } from 'vitest';
import { parseRegistryCatalogIndex } from '../../src/registry-explorer/core/registryCatalogIndex';
import {
  configureDefaultCatalogTaxonomy,
  parseCatalogTaxonomy,
} from '../../src/registry-explorer/core/catalogTaxonomy';
import { readRepositoryDocument } from './testAtlasDatabase';

configureDefaultCatalogTaxonomy(parseCatalogTaxonomy(readRepositoryDocument('catalog-taxonomy')));

function rawIndex(item: Record<string, unknown>) {
  return {
    meta: { registry_count: 1, item_count: 1 },
    registries: { '@demo': [item] },
  };
}

describe('registry catalog canonical fields', () => {
  it('parses promoted kind, canonical, source groups, and explicit access metadata', () => {
    const parsed = parseRegistryCatalogIndex(rawIndex({
      name: 'button',
      type: 'registry:ui',
      categories: ['source-controls'],
      kind: 'component',
      canonical: {
        taxonomyVersion: 'v1',
        primary: 'controls/button',
        path: ['controls', 'controls/button'],
      },
      sourceGroups: ['Controls'],
      access: { normalized: 'free', sourceLabel: 'Free' },
    }));

    expect(parsed.registries['@demo']?.[0]).toEqual({
      name: 'button',
      type: 'registry:ui',
      categories: ['source-controls'],
      kind: 'component',
      canonical: {
        taxonomyVersion: 'v1',
        primary: 'controls/button',
        path: ['controls', 'controls/button'],
      },
      sourceGroups: ['Controls'],
      access: { normalized: 'free', sourceLabel: 'Free' },
    });
  });

  it('keeps legacy catalog items backward-compatible when canonical fields are absent', () => {
    const parsed = parseRegistryCatalogIndex(rawIndex({ name: 'card', type: 'registry:block' }));
    expect(parsed.registries['@demo']?.[0]).toEqual({ name: 'card', type: 'registry:block' });
  });

  it('rejects unsupported promoted kinds', () => {
    expect(() => parseRegistryCatalogIndex(rawIndex({
      name: 'card', type: 'registry:block', kind: 'widget',
    }))).toThrow(/kind/i);
  });

  it('rejects canonical nodes that are not present in the approved runtime taxonomy', () => {
    expect(() => parseRegistryCatalogIndex(rawIndex({
      name: 'card', type: 'registry:block',
      canonical: { taxonomyVersion: 'v1', primary: 'application/not-real', path: ['application', 'application/not-real'] },
    }))).toThrow(/canonical.*taxonomy|unknown canonical/i);
  });

  it('rejects malformed canonical paths and primary/path disagreement', () => {
    expect(() => parseRegistryCatalogIndex(rawIndex({
      name: 'card', type: 'registry:block',
      canonical: { taxonomyVersion: 'v1', primary: 'content-media/card', path: ['marketing', 'content-media/card'] },
    }))).toThrow(/canonical.*path/i);

    expect(() => parseRegistryCatalogIndex(rawIndex({
      name: 'card', type: 'registry:block',
      canonical: { taxonomyVersion: 'v1', primary: null, path: ['content-media'] },
    }))).toThrow(/canonical.*path/i);
  });

  it('rejects malformed access and source-group fields', () => {
    expect(() => parseRegistryCatalogIndex(rawIndex({
      name: 'card', type: 'registry:block', access: { normalized: 'unknown', sourceLabel: 'Unknown' },
    }))).toThrow(/access/i);
    expect(() => parseRegistryCatalogIndex(rawIndex({
      name: 'card', type: 'registry:block', sourceGroups: ['Blocks', 3],
    }))).toThrow(/sourceGroups/i);
  });
});
