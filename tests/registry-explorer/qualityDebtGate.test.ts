import { describe, expect, it } from 'vitest';
import { newIssueCounts } from '../../scripts/check-quality-debt.mjs';

describe('incremental quality debt gate', () => {
  it('rejects a newly introduced issue even while historical debt remains', () => {
    expect(newIssueCounts(
      { 'old|rule': 2, 'new|rule': 1 },
      { 'old|rule': 2 },
    )).toEqual([{ issue: 'new|rule', added: 1 }]);
  });

  it('rejects increases in existing issues and accepts reductions', () => {
    expect(newIssueCounts({ 'old|rule': 3 }, { 'old|rule': 2 }))
      .toEqual([{ issue: 'old|rule', added: 1 }]);
    expect(newIssueCounts({ 'old|rule': 1 }, { 'old|rule': 2 })).toEqual([]);
  });
});
