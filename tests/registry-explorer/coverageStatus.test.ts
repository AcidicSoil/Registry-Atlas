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

  it('sorts stronger coverage ahead of unverified coverage', () => {
    expect(compareCoverageStatus('verified', 'unverified')).toBeLessThan(0);
    expect(coverageStatusRank('verified')).toBeLessThan(coverageStatusRank('unverified'));
  });
});
