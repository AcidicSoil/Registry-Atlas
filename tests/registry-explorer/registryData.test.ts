import { describe, expect, it } from 'vitest';
import mirrorData from '../../public/data/registries.json';
import {
  COMPONENT_TAG_VALUES,
  PRIMARY_FOCUS_VALUES,
} from '../../src/registry-explorer/core/registry.schema';

describe('registryData mirror artifact', () => {
  it('tracks the official shadcn registry source metadata', () => {
    expect(mirrorData.meta.source_url).toBe('https://ui.shadcn.com/r/registries.json');
    expect(mirrorData.meta.upstream_count).toBe(mirrorData.registries.length);
    expect(mirrorData.meta.registry_count).toBe(mirrorData.registries.length);
    expect(mirrorData.meta.local_count).toBe(mirrorData.registries.length);
  });

  it('has unique non-empty prefixed registry namespaces', () => {
    const names = mirrorData.registries.map(registry => registry.official.name.trim());

    expect(names.every(name => name.length > 0)).toBe(true);
    expect(names.every(name => name.startsWith('@'))).toBe(true);
    expect(new Set(names.map(name => name.toLowerCase())).size).toBe(names.length);
  });

  it('uses only allowed Atlas primary focus values', () => {
    mirrorData.registries.forEach(registry => {
      registry.atlas.primary_focus.forEach(focus => {
        expect(PRIMARY_FOCUS_VALUES).toContain(focus);
      });
    });
  });

  it('uses only allowed Atlas component tag values', () => {
    mirrorData.registries.forEach(registry => {
      registry.atlas.component_tags.forEach(tag => {
        expect(COMPONENT_TAG_VALUES).toContain(tag);
      });
    });
  });
});
