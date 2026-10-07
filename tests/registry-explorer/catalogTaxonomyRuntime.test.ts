import { describe, expect, it } from 'vitest';
import {
  DEFAULT_CATALOG_TAXONOMY,
  catalogTaxonomyDescendantIds,
  catalogTaxonomyNodeMap,
  catalogTaxonomySearchValues,
  parseCatalogTaxonomy,
} from '../../src/registry-explorer/core/catalogTaxonomy';

describe('runtime catalog taxonomy', () => {
  it('loads the validated repository taxonomy with stable lookups', () => {
    expect(DEFAULT_CATALOG_TAXONOMY.version).toBe('v1');
    const byId = catalogTaxonomyNodeMap(DEFAULT_CATALOG_TAXONOMY);
    expect(byId.get('application/app-shell')).toMatchObject({
      id: 'application/app-shell',
      parentId: 'application',
      label: 'App Shell',
    });
    expect(catalogTaxonomyDescendantIds(DEFAULT_CATALOG_TAXONOMY, 'application')).toEqual(expect.arrayContaining([
      'application/app-shell', 'application/dashboard', 'application/settings',
    ]));
    expect(catalogTaxonomySearchValues(DEFAULT_CATALOG_TAXONOMY, ['application', 'application/app-shell']))
      .toEqual(expect.arrayContaining(['application', 'Application', 'app', 'application/app-shell', 'App Shell', 'workspace shell']));
  });

  it('rejects malformed runtime taxonomy data instead of tolerating unknown shapes', () => {
    expect(() => parseCatalogTaxonomy({ version: 'v1', roots: [{ id: 'Application', children: [] }] }))
      .toThrow(/taxonomy/i);
    expect(() => parseCatalogTaxonomy({ version: 'v1', roots: [{
      id: 'application', label: 'Application', aliases: [], what: 'Apps', notFor: [], examples: [],
      children: [{ id: 'ai/chat', label: 'Chat', aliases: [], what: 'Chat', notFor: [], examples: [], children: [] }],
    }] })).toThrow(/child|path/i);
  });

  it('rejects unknown lookup ids', () => {
    expect(() => catalogTaxonomyDescendantIds(DEFAULT_CATALOG_TAXONOMY, 'missing')).toThrow(/unknown/i);
    expect(() => catalogTaxonomySearchValues(DEFAULT_CATALOG_TAXONOMY, ['missing'])).toThrow(/unknown/i);
  });
});
