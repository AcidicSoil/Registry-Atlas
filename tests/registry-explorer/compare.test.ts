import { describe, expect, it } from 'vitest';
import { buildCompareModel } from '../../src/registry-explorer/core/compare';
import { MATRIX_COLUMNS } from '../../src/registry-explorer/core/matrixColumns';
import { COMPONENT_TAG_VALUES } from '../../src/registry-explorer/core/registry.schema';
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

    const defaults = { registryNames: [], componentKeys: [] };
    renderCompareContent(header, body, buildCompareModel(registries(), '', defaults), defaults);
    expect(body.innerHTML).toContain(`All matching registries (${registries().length})`);
    expect(body.innerHTML).toContain(`Default capabilities (${MATRIX_COLUMNS.length})`);
    expect(body.innerHTML).not.toContain('All capabilities');
    expect(body.innerHTML).toContain('tabindex="0"');
    expect(body.innerHTML).toContain('aria-label="Comparison results"');

    const manyRegistries = Array.from({ length: 30 }, (_, index) =>
      registry(`@registry-${index}`, ['button'], 'verified'),
    );
    renderCompareContent(
      header,
      body,
      buildCompareModel(manyRegistries, '', defaults),
      defaults,
      { registry: 'registry-2' },
    );
    expect(body.innerHTML).toContain('data-compare-search="registry"');
    expect((body.innerHTML.match(/data-compare-registry=/g) ?? []).length).toBeLessThanOrEqual(24);
  });

  it('distinguishes stale registry selections from all matching registries', () => {
    const selection = { registryNames: ['@missing'], componentKeys: [] };
    const header = root();
    const body = root();
    renderCompareContent(header, body, buildCompareModel(registries(), '', selection), selection);

    expect(body.innerHTML).toContain('No selected registries match');
    expect(body.innerHTML).not.toContain('All matching registries');
  });

  it('renders every selected component while capping only unselected matches', () => {
    const available = [...COMPONENT_TAG_VALUES.slice(0, 50)];
    const selection = {
      registryNames: [],
      componentKeys: available.slice(0, 25),
    };
    const header = root();
    const body = root();

    renderCompareContent(
      header,
      body,
      buildCompareModel([registry('@many', available, 'verified')], '', selection),
      selection,
    );

    expect((body.innerHTML.match(/data-compare-component=/g) ?? []).length).toBe(25);
    expect(body.innerHTML).toContain('25 capabilities selected');
    expect(body.innerHTML).not.toContain('All capabilities');
    available.slice(0, 25).forEach(key => {
      expect(body.innerHTML).toContain(`data-compare-component="${key}"`);
    });
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
