import { describe, expect, it } from 'vitest';

import { clampSummaryWidth, resizeSummaryWidth } from '../../src/registry-explorer/ui/registryProfilePanel';
import { readFileSync } from 'node:fs';

const view = readFileSync(new URL('../../src/registry-explorer/ui/registryCollectionView.ts', import.meta.url), 'utf8');

describe('registry summary panel', () => {
  it('offers boundary-aligned controls for the actual summary rail', () => {
    expect(view).toContain('data-profile-rail-toggle');
    expect(view).toContain('data-profile-rail-resize');
    expect(view).toContain('aria-controls="registryProfileSummary"');
  });

  it('clamps horizontal drag and supports keyboard steps', () => {
    expect(clampSummaryWidth(100)).toBe(200);
    expect(clampSummaryWidth(600)).toBe(400);
    expect(resizeSummaryWidth(280, 'ArrowRight')).toBe(296);
    expect(resizeSummaryWidth(280, 'ArrowLeft')).toBe(264);
    expect(resizeSummaryWidth(280, 'Home')).toBe(200);
    expect(resizeSummaryWidth(280, 'End')).toBe(400);
  });
});
