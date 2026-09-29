import { describe, expect, it } from 'vitest';
import mirrorData from '../../public/data/registries.json';
import catalogIndexData from '../../public/data/registry-catalog-items.json';
import { parseRegistryCatalogIndex } from '../../src/registry-explorer/core/registryCatalogIndex';

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

  it('does not persist the retired inferred taxonomy in the active runtime artifact', () => {
    const serialized = JSON.stringify(mirrorData);
    expect(serialized).not.toContain('"primary_focus"');
    expect(serialized).not.toContain('"component_tags"');
    expect(serialized).not.toContain('"component_tags_existing"');
    expect(serialized).not.toContain('"component_tags_proposed"');
  });

  it('includes imported catalog-backed item summaries for the reviewed sample registries', () => {
    const byName = new Map(mirrorData.registries.map(registry => [registry.official.name, registry]));

    expect(byName.get('@delego')?.atlas.item_summaries.map(item => item.slug)).toEqual(
      expect.arrayContaining(['delego-theme', 'button', 'status-badge']),
    );
    expect(byName.get('@delta')?.atlas.item_summaries.map(item => item.slug)).toEqual(
      expect.arrayContaining(['input-otp', 'code-block', 'chat']),
    );
    expect(byName.get('@diceui')?.atlas.item_summaries.map(item => item.slug)).toEqual(
      expect.arrayContaining(['action-bar', 'angle-slider', 'color-picker']),
    );

    expect(byName.get('@delta')?.atlas.item_summaries.find(item => item.slug === 'input-otp')).toEqual(
      expect.objectContaining({
        route_eligible: true,
        install_token: '@delta/input-otp',
        raw_item_url: 'https://deltacomponents.dev/r/input-otp.json',
        evidence_url: 'https://deltacomponents.dev/r/registry.json',
      }),
    );
  });

  it('validates the committed compact catalog index and its declared counts', () => {
    const index = parseRegistryCatalogIndex(catalogIndexData);
    const items = Object.values(index.registries).flat();

    expect(index.meta.registry_count).toBe(Object.keys(index.registries).length);
    expect(index.meta.item_count).toBe(items.length);
    const reviewedItemCount = mirrorData.registries.reduce(
      (count, registry) => count + registry.atlas.item_summaries.length,
      0,
    );
    expect(items.length).toBeGreaterThan(reviewedItemCount);
  });

  it('retains existing reviewed item summaries after later catalog imports', () => {
    const assistant = mirrorData.registries.find(registry => registry.official.name === '@assistant-ui');
    expect(assistant?.atlas.item_summaries.map(item => item.slug)).toEqual(
      expect.arrayContaining(['thread', 'composer']),
    );
  });
});
