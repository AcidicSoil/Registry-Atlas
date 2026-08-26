import { describe, expect, it } from 'vitest';
import { buildCompareModel } from '../../src/registry-explorer/core/compare';
import { MATRIX_COLUMNS } from '../../src/registry-explorer/core/matrixColumns';
import type { ComponentTag, Registry } from '../../src/registry-explorer/core/registry.schema';
import { renderCompareContent } from '../../src/registry-explorer/ui/compareView';

describe('compare', () => {
  it('selects requested registries and component columns', () => {
    const model = buildCompareModel(registries(), '', {
      registryNames: ['@alpha', '@delta'],
      componentKeys: ['button', 'table'],
    });

    expect(model.rows.map(row => row.registry.name)).toEqual(['@alpha', '@delta']);
    expect(model.columns).toEqual(['button', 'table']);
  });

  it('ignores unknown selections and falls back to representative columns', () => {
    const model = buildCompareModel(registries(), '', {
      registryNames: ['@missing'],
      componentKeys: ['not-real' as ComponentTag],
    });

    expect(model.rows.map(row => row.registry.name)).toEqual([]);
    expect(model.columns).toEqual(MATRIX_COLUMNS);
  });
  it('renders deliberate comparison controls and verification context', () => {
    const model = buildCompareModel(registries(), '', {
      registryNames: ['@alpha', '@delta'],
      componentKeys: ['button', 'table'],
    });
    const header = root();
    const body = root();

    renderCompareContent(header, body, model, {
      registryNames: ['@alpha', '@delta'],
      componentKeys: ['button', 'table'],
    });

    expect(body.innerHTML).toContain('Compare registries');
    expect(body.innerHTML).toContain('Verification');
    expect(body.innerHTML).toContain('@alpha');
    expect(body.innerHTML).toContain('data-compare-registry');
    expect(body.innerHTML).toContain('data-compare-component');
    expect(body.innerHTML).toContain('<th scope="col">Registry · Verification</th>');
    expect(body.innerHTML).toMatch(/<th scope="col">[^<]*button[^<]*<\/th>/i);
    expect(header.innerHTML).toContain('data-copy-current-url');
    expect(body.innerHTML).not.toContain('Matrix axes');
  });
});

function root(): HTMLElement {
  return { innerHTML: '' } as HTMLElement;
}
function registries(): Registry[] {
  return [
    registry('@alpha', ['button'], 'verified'),
    registry('@delta', ['button', 'table'], 'inferred'),
    registry('@zeta', ['table'], 'unverified'),
  ];
}

function registry(
  name: string,
  componentTags: Registry['component_tags'],
  coverageStatus: 'verified' | 'inferred' | 'unverified',
): Registry {
  return {
    name,
    url: `https://${name.slice(1)}.example`,
    description: `${name} registry`,
    primary_focus: ['data-display-and-tables'],
    component_tags: componentTags,
    atlas: {
      aliases: [],
      coverageStatus,
      confidence: 'medium',
      notes: '',
      catalogStatus: coverageStatus === 'verified' ? 'available' : 'partial',
    },
  };
}
