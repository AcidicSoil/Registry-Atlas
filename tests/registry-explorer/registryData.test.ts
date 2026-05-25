import { describe, it, expect } from 'vitest';
import { registries } from '../../src/registry-explorer/data/registries.data';
import {
  COMPONENT_TAG_VALUES,
  PRIMARY_FOCUS_VALUES,
} from '../../src/registry-explorer/core/registry.schema';

describe('registryData', () => {
  it('has unique non-empty registry names and descriptions', () => {
    const names = registries.map(registry => registry.name.trim());

    expect(names.every(name => name.length > 0)).toBe(true);
    expect(new Set(names.map(name => name.toLowerCase())).size).toBe(names.length);
    expect(registries.every(registry => registry.description.trim().length > 0)).toBe(true);
  });

  it('uses HTTPS URLs for production registries', () => {
    registries.forEach(registry => {
      const url = new URL(registry.url);

      expect(url.protocol).toBe('https:');
    });
  });

  it('uses only allowed primary focus values', () => {
    registries.forEach(registry => {
      expect(registry.primary_focus.length).toBeGreaterThan(0);

      registry.primary_focus.forEach(focus => {
        expect(PRIMARY_FOCUS_VALUES).toContain(focus);
      });
    });
  });

  it('uses only allowed component tag values', () => {
    registries.forEach(registry => {
      expect(registry.component_tags.length).toBeGreaterThan(0);

      registry.component_tags.forEach(tag => {
        expect(COMPONENT_TAG_VALUES).toContain(tag);
      });
    });
  });
});
