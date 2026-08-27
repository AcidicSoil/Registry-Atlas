import { describe, expect, it } from 'vitest';
import { buildCompareModel } from '../../src/registry-explorer/core/compare';
import type { ComponentTag, Registry } from '../../src/registry-explorer/core/registry.schema';
import { renderCompareContent } from '../../src/registry-explorer/ui/compareView';

describe('compare', () => {
  it('keeps Compare empty until at least two registries are selected', () => {
    const selection = { registryNames: [], componentKeys: [] };
    const model = buildCompareModel(registries(), '', selection);
    const header = root();
    const body = root();

    renderCompareContent(header, body, model, selection);

    expect(body.innerHTML).toContain('Choose 2–4 registries');
    expect(body.innerHTML).not.toContain('<table');
    expect(body.innerHTML).not.toContain('>No known tag match<');
  });

  it('renders selected registries as columns and capabilities as rows', () => {
    const selection = {
      registryNames: ['@alpha', '@delta'],
      componentKeys: ['button', 'table'] as ComponentTag[],
    };
    const model = buildCompareModel(registries(), '', selection);
    const body = root();

    renderCompareContent(root(), body, model, selection);

    expect(body.innerHTML).toMatch(/<th scope="col"[^>]*>@alpha<\/th>/);
    expect(body.innerHTML).toMatch(/<th scope="col"[^>]*>@delta<\/th>/);
    expect(body.innerHTML).toMatch(/<th scope="row"[^>]*>Button<\/th>/i);
    expect(body.innerHTML).toMatch(/<th scope="row"[^>]*>Table<\/th>/i);
    expect(body.innerHTML).not.toContain('Registry · Verification');
    expect(body.innerHTML).not.toContain('>No known tag match<');
  });

  it('uses a compact unknown state instead of repeating prose', () => {
    const selection = {
      registryNames: ['@alpha', '@zeta'],
      componentKeys: ['button'] as ComponentTag[],
    };
    const body = root();
    renderCompareContent(root(), body, buildCompareModel(registries(), '', selection), selection);

    expect(body.innerHTML).toContain('aria-label="No known tag match"');
    expect(body.innerHTML).toContain('>—<');
    expect(body.innerHTML).not.toContain('>No known tag match<');
  });

  it('keeps the picker compact and disables additional registries at four selections', () => {
    const many = Array.from({ length: 30 }, (_, index) => registry(`@registry-${index}`, ['button'], 'verified'));
    const selection = {
      registryNames: many.slice(0, 4).map(item => item.name),
      componentKeys: [] as ComponentTag[],
    };
    const body = root();
    renderCompareContent(root(), body, buildCompareModel(many, '', selection), selection, { registry: 'registry' });

    expect(body.innerHTML).toContain('4 of 4 selected');
    expect(body.innerHTML).toContain('data-compare-search="registry"');
    expect((body.innerHTML.match(/class="compare-picker-result"[^>]*data-compare-registry=/g) ?? []).length).toBeLessThanOrEqual(8);
    expect(body.innerHTML).toMatch(/data-compare-registry="@registry-[^"]+"[^>]*disabled/);
  });

  it('keeps capability refinement behind a disclosure instead of a chip wall', () => {
    const selection = { registryNames: ['@alpha', '@delta'], componentKeys: [] };
    const body = root();
    renderCompareContent(root(), body, buildCompareModel(registries(), '', selection), selection);

    expect(body.innerHTML).toContain('<details class="compare-capability-filter"');
    expect(body.innerHTML).toContain('Refine capabilities');
    expect(body.innerHTML).toContain('Default capabilities');
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
