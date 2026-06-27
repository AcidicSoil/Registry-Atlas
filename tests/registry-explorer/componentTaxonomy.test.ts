import { describe, expect, it } from 'vitest';
import {
  COMPONENT_TAXONOMY,
  COMPONENT_TAXONOMY_CATEGORIES,
  componentTaxonomyCategory,
  componentTaxonomyCategoryLabel,
  componentTaxonomyEntry,
  componentTaxonomyLabel,
  componentTaxonomySearchValues,
  expandComponentSearchTerms,
} from '../../src/registry-explorer/core/componentTaxonomy';
import { COMPONENT_TAG_VALUES, type ComponentTag } from '../../src/registry-explorer/core/registry.schema';
import { componentLabel } from '../../src/registry-explorer/core/labels';

describe('component taxonomy', () => {
  it('keeps researched taxonomy tags aligned with the controlled component tag vocabulary', () => {
    COMPONENT_TAXONOMY.forEach(entry => {
      expect(COMPONENT_TAG_VALUES).toContain(entry.tag);
      expect(entry.label).not.toBe('');
      expect(entry.categoryLabel).not.toBe('');
      expect(entry.exampleItems.length).toBeGreaterThan(0);
    });
  });

  it('includes the imported researched tags needed for v1.1 discovery', () => {
    expect(COMPONENT_TAXONOMY.map(entry => entry.tag)).toEqual(expect.arrayContaining([
      'theme',
      'status-pill',
      'decision-pill',
      'otp-input',
      'code-block',
      'ai-chat',
      'map-pointer',
      'angle-slider',
      'color-picker',
      'compare-slider',
      'cropper',
    ]));
  });

  it('provides explicit labels and categories for awkward tag labels', () => {
    expect(componentTaxonomyLabel('qr-code')).toBe('QR code');
    expect(componentLabel('qr-code')).toBe('QR code');
    expect(componentTaxonomyLabel('pill')).toBe('Pill/Chip');
    expect(componentTaxonomyCategory('code-block')).toBe('code-and-markdown');
    expect(componentTaxonomyCategoryLabel('ai-and-chat')).toBe('AI & Chat');
  });

  it('falls back for old component tags that are not in the researched taxonomy table', () => {
    expect(componentTaxonomyEntry('button')).toBeUndefined();
    expect(componentTaxonomyLabel('loading-button' as ComponentTag)).toBe('loading button');
  });

  it('expands simple aliases for common taxonomy searches', () => {
    expect(expandComponentSearchTerms('qrcode')).toEqual(expect.arrayContaining(['qr-code']));
    expect(expandComponentSearchTerms('otp')).toEqual(expect.arrayContaining(['otp-input']));
    expect(expandComponentSearchTerms('code')).toEqual(expect.arrayContaining(['code-block']));
    expect(expandComponentSearchTerms('chat')).toEqual(expect.arrayContaining(['ai-chat', 'chat-interface']));
    expect(expandComponentSearchTerms('map')).toEqual(expect.arrayContaining(['map-pointer']));
    expect(expandComponentSearchTerms('receipt')).toEqual(expect.arrayContaining(['receipt']));
    expect(expandComponentSearchTerms('audit')).toEqual(expect.arrayContaining(['audit']));
    expect(expandComponentSearchTerms('color')).toEqual(expect.arrayContaining(['color-picker', 'color-swatch']));
    expect(expandComponentSearchTerms('crop')).toEqual(expect.arrayContaining(['cropper']));
  });

  it('exposes deterministic taxonomy search values', () => {
    expect(componentTaxonomySearchValues('qr-code')).toEqual(expect.arrayContaining(['qr-code', 'qrcode']));
    expect(componentTaxonomySearchValues('ai-chat')).toEqual(expect.arrayContaining(['ai-chat', 'ai-and-chat']));
  });

  it('keeps category labels reviewable and non-empty', () => {
    Object.entries(COMPONENT_TAXONOMY_CATEGORIES).forEach(([category, label]) => {
      expect(category).not.toBe('');
      expect(label).not.toBe('');
    });
  });
});
