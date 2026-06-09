import type { CoverageStatus } from './registry.schema.ts';

export const COVERAGE_STATUS_VALUES = [
  'verified',
  'inferred',
  'partial',
  'unavailable',
  'unverified',
] as const;

export const COVERAGE_CONFIDENCE_VALUES = ['high', 'medium', 'low', 'unknown'] as const;

export const ITEM_CATALOG_STATUS_VALUES = [
  'available',
  'partial',
  'unavailable',
  'unverified',
] as const;

export const COVERAGE_STATUS_LABELS: Record<CoverageStatus, string> = {
  verified: 'Verified item',
  inferred: 'Inferred from Atlas tags',
  partial: 'Partial catalog',
  unavailable: 'Catalog unavailable',
  unverified: 'Unverified coverage',
};

export const COVERAGE_STATUS_ORDER: Record<CoverageStatus, number> = {
  verified: 0,
  inferred: 1,
  partial: 2,
  unavailable: 3,
  unverified: 4,
};

export function coverageStatusLabel(status: CoverageStatus): string {
  return COVERAGE_STATUS_LABELS[status];
}

export function coverageStatusRank(status: CoverageStatus): number {
  return COVERAGE_STATUS_ORDER[status];
}

export function compareCoverageStatus(a: CoverageStatus, b: CoverageStatus): number {
  return coverageStatusRank(a) - coverageStatusRank(b);
}
