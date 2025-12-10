import { describe, it, expect } from 'vitest';
import { MATRIX_COLUMNS } from '../../src/registry-explorer/core/matrixColumns';
import { COMPONENT_TAG_VALUES } from '../../src/registry-explorer/core/registry.schema';

describe('matrixColumns', () => {
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
