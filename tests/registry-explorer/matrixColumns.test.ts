import { describe, it, expect } from 'vitest';
import { MATRIX_COLUMNS } from '../../src/registry-explorer/core/matrixColumns';
import {
  COMPONENT_TAG_VALUES,
  PRIMARY_FOCUS_VALUES,
} from '../../src/registry-explorer/core/registry.schema';

function expectNoDuplicates(values: readonly string[]): void {
  expect(new Set(values).size).toBe(values.length);
}

describe('matrixColumns', () => {
  it('should not contain duplicate vocabulary values', () => {
    expectNoDuplicates(PRIMARY_FOCUS_VALUES);
    expectNoDuplicates(COMPONENT_TAG_VALUES);
  });

  it('should have valid component tags', () => {
    MATRIX_COLUMNS.forEach(col => {
      expect(COMPONENT_TAG_VALUES).toContain(col);
    });
  });

  it('should not be empty', () => {
    expect(MATRIX_COLUMNS.length).toBeGreaterThan(0);
  });

  it('should contain key components defined in PRD', () => {
    expect(MATRIX_COLUMNS).toContain('chatbot');
    expect(MATRIX_COLUMNS).toContain('button');
    expect(MATRIX_COLUMNS).toContain('table');
    expect(MATRIX_COLUMNS).toContain('auth-form');
  });
});
