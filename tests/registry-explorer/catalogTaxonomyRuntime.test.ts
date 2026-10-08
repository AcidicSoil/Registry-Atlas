import { describe, expect, it } from 'vitest';
import {
  catalogTaxonomyDescendantIds,
  catalogTaxonomyNodeMap,
  catalogTaxonomySearchValues,
  parseCatalogTaxonomy,
} from '../../src/registry-explorer/core/catalogTaxonomy';
import type { CatalogTaxonomy } from '../../src/registry-explorer/core/catalogTaxonomy';
import { readRepositoryDocument } from './testAtlasDatabase';

const repositoryTaxonomy = parseCatalogTaxonomy(
  readRepositoryDocument<CatalogTaxonomy>('catalog-taxonomy'),
);

describe('runtime catalog taxonomy', () => {
  it('loads the validated repository taxonomy from SQLite with stable lookups', () => {
    expect(repositoryTaxonomy.version).toBe('v1');
    const byId = catalogTaxonomyNodeMap(repositoryTaxonomy);
    expect(byId.get('application/app-shell')).toMatchObject({
      id: 'application/app-shell',
      parentId: 'application',
      label: 'App Shell',
    });
    expect(catalogTaxonomyDescendantIds(repositoryTaxonomy, 'application')).toEqual(
      expect.arrayContaining([
        'application/app-shell',
        'application/dashboard',
        'application/settings',
      ]),
    );
    expect(catalogTaxonomySearchValues(
      repositoryTaxonomy,
      ['application', 'application/app-shell'],
    )).toEqual(expect.arrayContaining([
      'application',
      'Application',
      'app',
      'application/app-shell',
      'App Shell',
      'workspace shell',
    ]));
  });

  it('rejects malformed runtime taxonomy data instead of tolerating unknown shapes', () => {
    expect(() => parseCatalogTaxonomy({
      version: 'v1',
      roots: [{ id: 'Application', children: [] }],
    })).toThrow(/taxonomy/i);
    expect(() => parseCatalogTaxonomy({
      version: 'v1',
      roots: [{
        id: 'application',
        label: 'Application',
        aliases: [],
        what: 'Apps',
        notFor: [],
        examples: [],
        children: [{
          id: 'ai/chat',
          label: 'Chat',
          aliases: [],
          what: 'Chat',
          notFor: [],
          examples: [],
          children: [],
        }],
      }],
    })).toThrow(/child|path/i);
  });

  it('rejects unknown lookup ids', () => {
    expect(() => catalogTaxonomyDescendantIds(repositoryTaxonomy, 'missing'))
      .toThrow(/unknown/i);
    expect(() => catalogTaxonomySearchValues(repositoryTaxonomy, ['missing']))
      .toThrow(/unknown/i);
  });
});
