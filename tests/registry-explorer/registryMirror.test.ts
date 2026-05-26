import { describe, expect, it } from 'vitest';
import {
  validateNamespace,
  validateRegistryMirror,
  validateRegistryUrlTemplate,
  validateUrlField,
} from '../../src/registry-explorer/core/registryMirror';

describe('registryMirror validation', () => {
  it('accepts a valid normalized mirror', () => {
    const result = validateRegistryMirror(createMirror());

    expect(result.errors).toEqual([]);
    expect(result.warnings).toEqual([]);
  });

  it('fails duplicate namespaces case-insensitively', () => {
    const result = validateRegistryMirror(createMirror([
      createRecord({ name: '@example' }),
      createRecord({ name: '@Example' }),
    ]));

    expect(result.errors.map(error => error.code)).toContain('namespace-duplicate');
  });

  it('fails de-prefixed namespaces', () => {
    const result = validateNamespace('example');

    expect(result.errors.map(error => error.code)).toContain('namespace-missing-prefix');
  });

  it('fails missing homepage and registry URL fields', () => {
    const result = validateRegistryMirror(createMirror([
      createRecord({ homepage: '', registryUrlTemplate: '' }),
    ]));

    expect(result.errors.map(error => error.code)).toContain('url-missing');
  });

  it('fails javascript URL protocols', () => {
    const result = validateUrlField('javascript:alert(1)', 'official.homepage', '@example');

    expect(result.errors.map(error => error.code)).toContain('url-protocol-disallowed');
  });

  it('fails data URL protocols', () => {
    const result = validateRegistryUrlTemplate('data:text/plain,{name}', '@example');

    expect(result.errors.map(error => error.code)).toContain('url-protocol-disallowed');
  });

  it('warns on HTTP official fields without failing validation', () => {
    const result = validateRegistryMirror(createMirror([
      createRecord({
        homepage: 'http://example.com',
        registryUrlTemplate: 'http://example.com/r/{name}.json',
      }),
    ]));

    expect(result.errors).toEqual([]);
    expect(result.warnings.map(warning => warning.code)).toEqual(['url-http', 'url-http']);
  });

  it('fails registry URL templates without the name token', () => {
    const result = validateRegistryUrlTemplate('https://example.com/r/button.json', '@example');

    expect(result.errors.map(error => error.code)).toContain('template-missing-token');
  });

  it('fails invalid Atlas enrichment values', () => {
    const result = validateRegistryMirror(createMirror([
      createRecord({
        primaryFocus: ['support', 'unknown-focus'],
        componentTags: ['button', 'unknown-tag'],
      }),
    ]));

    expect(result.errors.map(error => error.code)).toContain('atlas-invalid-primary-focus');
    expect(result.errors.map(error => error.code)).toContain('atlas-invalid-component-tag');
  });

  it('fails invalid coverage, confidence, catalog status, and item summaries', () => {
    const result = validateRegistryMirror(createMirror([
      createRecord({
        coverageStatus: 'approved',
        confidence: 'certain',
        catalogStatus: 'audited',
        itemSummaries: [
          {
            name: '',
            slug: 'Bad/Slug',
            source: '',
            provenance: '',
            catalog_status: 'unknown',
            route_eligible: true,
          },
        ],
      }),
    ]));

    const codes = result.errors.map(error => error.code);
    expect(codes).toContain('atlas-invalid-coverage-status');
    expect(codes).toContain('atlas-invalid-confidence');
    expect(codes).toContain('atlas-invalid-catalog-status');
    expect(codes).toContain('atlas-invalid-item-summary');
    expect(codes).toContain('atlas-invalid-item-slug');
  });

  it('accepts valid item summaries and route eligibility', () => {
    const result = validateRegistryMirror(createMirror([
      createRecord({
        itemSummaries: [
          {
            name: 'Data Grid',
            slug: 'data-grid',
            source: 'known-catalog',
            provenance: 'fixture',
            catalog_status: 'available',
            route_eligible: true,
          },
        ],
      }),
    ]));

    expect(result.errors).toEqual([]);
  });
});

function createMirror(records = [createRecord()]) {
  return {
    meta: {
      upstream_count: records.length,
      registry_count: records.length,
      local_count: records.length,
    },
    registries: records,
  };
}

function createRecord(options: {
  name?: string;
  homepage?: string;
  registryUrlTemplate?: string;
  primaryFocus?: string[];
  componentTags?: string[];
  coverageStatus?: string;
  confidence?: string;
  catalogStatus?: string;
  itemSummaries?: unknown[];
} = {}) {
  return {
    official: {
      name: options.name ?? '@example',
      homepage: options.homepage ?? 'https://example.com',
      registry_url_template: options.registryUrlTemplate ?? 'https://example.com/r/{name}.json',
      description: 'Example registry.',
    },
    atlas: {
      primary_focus: options.primaryFocus ?? ['support'],
      component_tags: options.componentTags ?? ['button'],
      coverage_status: options.coverageStatus ?? 'inferred',
      confidence: options.confidence ?? 'medium',
      catalog_status: options.catalogStatus ?? 'unverified',
      item_summaries: options.itemSummaries ?? [],
    },
    status: {
      warnings: [],
    },
  };
}
