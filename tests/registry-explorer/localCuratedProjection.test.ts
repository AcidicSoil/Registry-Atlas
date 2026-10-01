import { describe, expect, it } from 'vitest';
// @ts-ignore ESM source script.
import { projectCuratedSummaries } from '../../scripts/sync-shadcn-registries.mjs';

const runtime = {
  meta: { source_url: 'https://ui.shadcn.com/r/registries.json', synced_at: '2026-09-30T00:00:00Z' },
  registries: [
    { official: { name: '@eight', homepage: 'https://eight.example' },
      atlas: { catalog_status: 'available', catalog_item_count: 34, item_summaries: [{ slug: 'button' }], notes: 'preserve' },
      status: { warnings: [] } },
    { official: { name: '@other' },
      atlas: { catalog_status: 'available', item_summaries: [] },
      status: { warnings: [] } },
  ],
};
const curated = { '@eight': [
  { name: 'Button', slug: 'button', type: 'registry:component', source: 'registry-json',
    provenance: 'Official JSON', catalog_status: 'available', route_eligible: true,
    raw_item_url: 'https://eight.example/r/button.json' },
  { name: 'Alert', slug: 'alert', type: 'registry:component', source: 'registry-json',
    provenance: 'Official JSON', catalog_status: 'available', route_eligible: true,
    install_command: 'npx shadcn@latest add @eight/alert' },
] };

describe('local curated projection', () => {
  it('updates only curated item summaries without fetching or rewriting unrelated registry facts', () => {
    const projected = projectCuratedSummaries(runtime, curated);
    expect(projected.meta).toEqual(runtime.meta);
    expect(projected.registries[0].atlas.item_summaries).toHaveLength(2);
    expect(projected.registries[0].atlas.item_summaries[1]).toMatchObject({
      slug: 'alert', install_command: 'npx shadcn@latest add @eight/alert',
    });
    expect(projected.registries[0].atlas.catalog_item_count).toBe(34);
    expect(projected.registries[0].atlas.notes).toBe('preserve');
    expect(projected.registries[1]).toEqual(runtime.registries[1]);
    expect(runtime.registries[0].atlas.item_summaries).toHaveLength(1);
  });
  it('refuses curated namespaces missing from the official runtime mirror', () => {
    expect(() => projectCuratedSummaries(runtime, { '@missing': curated['@eight'] }))
      .toThrow(/not in official runtime/);
  });
  it('refuses duplicate summaries for the same registry slug', () => {
    expect(() => projectCuratedSummaries(runtime, {
      '@eight': [...curated['@eight'], curated['@eight'][0]],
    })).toThrow(/duplicate curated slug/);
  });
});