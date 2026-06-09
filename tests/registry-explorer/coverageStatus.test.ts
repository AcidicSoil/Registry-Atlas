import { describe, expect, it } from 'vitest';
import {
  compareCoverageStatus,
  coverageStatusLabel,
  coverageStatusRank,
} from '../../src/registry-explorer/core/coverageStatus';

describe('coverageStatus', () => {
  it('returns neutral labels for every coverage status', () => {
    expect(coverageStatusLabel('verified')).toBe('Verified item');
    expect(coverageStatusLabel('inferred')).toBe('Inferred from Atlas tags');
    expect(coverageStatusLabel('partial')).toBe('Partial catalog');
    expect(coverageStatusLabel('unavailable')).toBe('Catalog unavailable');
    expect(coverageStatusLabel('unverified')).toBe('Unverified coverage');
  });

  it('sorts coverage by the Phase 3 confidence contract', () => {
    const ordered = ['verified', 'inferred', 'partial', 'unavailable', 'unverified'] as const;

    ordered.forEach((status, index) => {
      expect(coverageStatusRank(status)).toBe(index);
    });
    expect(compareCoverageStatus('verified', 'inferred')).toBeLessThan(0);
    expect(compareCoverageStatus('inferred', 'partial')).toBeLessThan(0);
    expect(compareCoverageStatus('partial', 'unavailable')).toBeLessThan(0);
    expect(compareCoverageStatus('unavailable', 'unverified')).toBeLessThan(0);
  });
});
