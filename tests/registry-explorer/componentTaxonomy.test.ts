import { describe, expect, it } from 'vitest';
import {
  COMPONENT_TAXONOMY,
  COMPONENT_TAXONOMY_CATEGORIES,
  componentTaxonomyCategory,
  componentTaxonomyCategoryLabel,
  componentTaxonomyEntry,
  componentTaxonomyLabel,
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

  it('keeps category labels reviewable and non-empty', () => {
    Object.entries(COMPONENT_TAXONOMY_CATEGORIES).forEach(([category, label]) => {
      expect(category).not.toBe('');
      expect(label).not.toBe('');
    });
  });
});
