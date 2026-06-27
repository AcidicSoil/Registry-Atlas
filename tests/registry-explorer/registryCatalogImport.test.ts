import { describe, expect, it } from 'vitest';
import catalog from '../../registry-altas-improvement-phase/gpt-agent-outputs/registry-catalog.normalized.json';
// @ts-expect-error The importer is an executable Node .mjs script with runtime exports tested here.
import { buildImportReport, buildRegistryItemsByNamespace, normalizeImportedItem, normalizeNamespace } from '../../scripts/import-registry-catalog.mjs';

type ImportedItem = {
  slug: string;
  files?: Array<{ path: string; type: string; target?: string }>;
  registryDependencies?: string[];
};

describe('registry catalog import', () => {
  it('normalizes namespaces with one leading @', () => {
    expect(normalizeNamespace('delego')).toBe('@delego');
    expect(normalizeNamespace('@Delta')).toBe('@delta');
  });

  it('imports the researched sample registries by namespace', () => {
    const result = buildRegistryItemsByNamespace(catalog);

    expect(Object.keys(result.itemsByNamespace)).toEqual(['@delego', '@delta', '@diceui']);
    expect(result.itemsByNamespace['@delego']?.map((item: ImportedItem) => item.slug)).toContain('delego-theme');
    expect(result.itemsByNamespace['@delta']?.map((item: ImportedItem) => item.slug)).toContain('input-otp');
    expect(result.itemsByNamespace['@diceui']?.map((item: ImportedItem) => item.slug)).toContain('action-bar');
  });

  it('preserves richer item metadata needed by Atlas discovery', () => {
    const result = buildRegistryItemsByNamespace(catalog);
    const inputOtp = result.itemsByNamespace['@delta']?.find((item: ImportedItem) => item.slug === 'input-otp');
    const actionBar = result.itemsByNamespace['@diceui']?.find((item: ImportedItem) => item.slug === 'action-bar');

    expect(inputOtp).toEqual(expect.objectContaining({
      install_token: '@delta/input-otp',
      view_command: 'npx shadcn@latest view @delta/input-otp',
      install_command: 'npx shadcn@latest add @delta/input-otp',
      raw_item_url: 'https://deltacomponents.dev/r/input-otp.json',
      evidence_url: 'https://deltacomponents.dev/r/registry.json',
      dependencies: ['lucide-react'],
    }));
    expect(inputOtp?.files).toEqual([
      expect.objectContaining({
        path: 'registry/delta-ui/delta/input-otp.tsx',
        type: 'registry:ui',
        target: 'components/input-otp.tsx',
      }),
    ]);
    expect(actionBar?.registryDependencies).toEqual(expect.arrayContaining(['button', '@diceui/use-as-ref']));
  });

  it('merges imported registries with existing seeded item summaries', () => {
    const existing = {
      '@assistant-ui': [
        {
          name: 'Thread',
          slug: 'thread',
          source: 'known-catalog',
          provenance: 'fixture',
          catalog_status: 'available',
          route_eligible: true,
        },
      ],
    };

    const result = buildRegistryItemsByNamespace(catalog, existing);

    expect(result.itemsByNamespace['@assistant-ui']).toEqual(existing['@assistant-ui']);
    expect(result.itemsByNamespace['@delta']?.length).toBeGreaterThan(0);
  });

  it('builds a reviewable import report', () => {
    const result = buildRegistryItemsByNamespace(catalog);
    const report = buildImportReport(catalog, result);

    expect(report.registry_count).toBe(3);
    expect(report.item_count).toBe(28);
    expect(report.namespaces).toEqual(['@delego', '@delta', '@diceui']);
    expect(report.item_counts).toEqual(expect.objectContaining({
      '@delego': 6,
      '@delta': 10,
      '@diceui': 12,
    }));
    expect(report.warnings).toEqual([]);
    expect(report.skipped).toEqual([]);
  });

  it('skips invalid imported item slugs', () => {
    const warnings: string[] = [];

    expect(normalizeImportedItem('@example', { name: 'Bad/Slug' }, warnings)).toBeNull();
    expect(warnings[0]).toContain('@example');
  });
});
