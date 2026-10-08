import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM modules.
import { validateCatalogTaxonomy } from '../../scripts/lib/catalog-taxonomy.mjs';
// @ts-ignore Standalone Node ESM modules.
import { buildCatalogClassificationState } from '../../scripts/lib/catalog-classification-state.mjs';
// @ts-ignore Standalone Node ESM modules.
import { classifyCatalogItem, findDeterministicAliasClassification } from '../../scripts/lib/catalog-classifier.mjs';
import { readRepositoryDocument } from './testAtlasDatabase';

const taxonomy = validateCatalogTaxonomy(readRepositoryDocument('catalog-taxonomy'));

describe('catalog classification state', () => {
  it('builds a compact browser-independent state from local item metadata', () => {
    const state = buildCatalogClassificationState({
      namespace: '@flat',
      item: {
        name: 'app-shell',
        title: '  App   Shell  ',
        description: `  ${'workspace '.repeat(100)}  `,
        kind: 'block',
      },
    });

    expect(state.item.name).toBe('app-shell');
    expect(state.item.title).toBe('App Shell');
    expect(state.item.description?.length).toBeLessThanOrEqual(600);
    expect(state.item.description).not.toMatch(/\s{2,}/);
    expect(state.item.kind).toBe('block');
    expect(state).not.toHaveProperty('sourceHints');
    expect(JSON.stringify(state)).not.toContain('@flat');
  });

  it('does not treat legacy survey groups as canonical evidence without explicit reviewed conversion', () => {
    const legacySurveyRecord = buildCatalogClassificationState({
      namespace: '@legacy',
      item: { name: 'mystery-shell', title: 'Mystery Surface', kind: 'block' },
      groups: ['App Shell'],
    } as any);
    expect(legacySurveyRecord).not.toHaveProperty('sourceHints');
    expect(findDeterministicAliasClassification(legacySurveyRecord, taxonomy)).toBeNull();

    const reviewedConversion = buildCatalogClassificationState({
      namespace: '@legacy',
      item: { name: 'mystery-shell', title: 'Mystery Surface', kind: 'block' },
      sourceHints: { verifiedGroups: ['App Shell'] },
    });
    expect(findDeterministicAliasClassification(reviewedConversion, taxonomy)?.primary)
      .toBe('application/app-shell');
  });

  it('classifies from local semantic metadata even when no browser/source evidence is available', () => {
    const state = buildCatalogClassificationState({
      namespace: '@offline',
      item: { name: 'button', title: 'Button', kind: 'component' },
    });
    expect(findDeterministicAliasClassification(state, taxonomy)).toMatchObject({
      primary: 'controls/button',
      method: 'deterministic-alias',
    });
  });

  it('keeps only non-empty trusted source hints and rejects arbitrary page/navigation evidence', () => {
    const state = buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'button', title: 'Button', kind: 'component' },
      sourceHints: {
        categories: ['  Controls  ', ''],
        verifiedGroups: [' Form controls '],
        breadcrumbs: [],
        pathHints: ['/components/button'],
      },
    });
    expect(state.sourceHints).toEqual({
      categories: ['Controls'],
      verifiedGroups: ['Form controls'],
      pathHints: ['/components/button'],
    });

    expect(() => buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'button', title: 'Button', kind: 'component' },
      sourceHints: { categories: ['Controls'], navigation: ['Docs', 'Privacy'] },
    })).toThrow(/unsupported source hint/i);
    expect(() => buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'button', title: 'Button', kind: 'component' },
      sourceHints: { pageDump: '<html>...</html>' },
    })).toThrow(/unsupported source hint/i);
  });
});

describe('deterministic canonical alias classification', () => {
  it.each([
    ['App Shell', 'application/app-shell', ['application', 'application/app-shell']],
    ['AI Chat', 'ai/chat', ['ai', 'ai/chat']],
    ['Button', 'controls/button', ['controls', 'controls/button']],
  ])('classifies exact %s evidence without System One', (title, primary, path) => {
    const state = buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: title.toLowerCase().replace(/\s+/g, '-'), title, kind: 'block' },
    });
    const result = findDeterministicAliasClassification(state, taxonomy);

    expect(result).toMatchObject({
      taxonomyVersion: 'v1',
      primary,
      path,
      method: 'deterministic-alias',
    });
    expect(result?.inputFingerprint).toMatch(/^sha256:[a-f0-9]{64}$/);
  });

  it('uses trusted source category/group aliases but not description similarity', () => {
    const sourceMatch = buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'shell-01', title: 'Workspace Layout 01', kind: 'block' },
      sourceHints: { categories: ['App Shell'] },
    });
    expect(findDeterministicAliasClassification(sourceMatch, taxonomy)?.primary)
      .toBe('application/app-shell');

    const descriptionOnly = buildCatalogClassificationState({
      namespace: '@demo',
      item: {
        name: 'workspace-layout',
        title: 'Workspace Layout',
        description: 'An app shell with navigation and content.',
        kind: 'block',
      },
    });
    expect(findDeterministicAliasClassification(descriptionOnly, taxonomy)).toBeNull();
  });

  it('falls through when exact evidence points to more than one canonical node', () => {
    const state = buildCatalogClassificationState({
      namespace: '@demo',
      item: { name: 'button-shell', title: 'Button', kind: 'block' },
      sourceHints: { verifiedGroups: ['App Shell'] },
    });
    expect(findDeterministicAliasClassification(state, taxonomy)).toBeNull();
  });

  it('produces a stable fingerprint for identical semantic state and changes it when state changes', () => {
    const first = buildCatalogClassificationState({
      namespace: '@one',
      item: { name: 'button', title: 'Button', kind: 'component' },
    });
    const second = buildCatalogClassificationState({
      namespace: '@two',
      item: { name: 'button', title: 'Button', kind: 'component' },
    });
    const changed = buildCatalogClassificationState({
      namespace: '@two',
      item: { name: 'button', title: 'Primary Button', kind: 'component' },
    });
    const a = findDeterministicAliasClassification(first, taxonomy);
    const b = findDeterministicAliasClassification(second, taxonomy);
    expect(a?.inputFingerprint).toBe(b?.inputFingerprint);
    expect(findDeterministicAliasClassification(changed, taxonomy)).toBeNull();
  });
});

const beamTaxonomy = validateCatalogTaxonomy({
  version: 'beam-v1',
  roots: [
    {
      id: 'application', label: 'Application', aliases: [], what: 'Application surfaces.',
      notFor: [], examples: [],
      children: [{
        id: 'application/app-shell', label: 'App Shell', aliases: ['app shell'],
        what: 'Application frame.', notFor: [], examples: [], children: [],
      }],
    },
    {
      id: 'ai', label: 'AI', aliases: [], what: 'AI interfaces.',
      notFor: [], examples: [],
      children: [{
        id: 'ai/chat', label: 'AI Chat', aliases: ['ai chat'], what: 'AI conversation.',
        notFor: [], examples: [], children: [],
      }],
    },
  ],
});

function ambiguousState() {
  return buildCatalogClassificationState({
    namespace: '@demo',
    item: { name: 'workspace-assistant', title: 'Workspace Assistant', kind: 'block' },
  });
}

describe('hierarchical canonical classification', () => {
  it('bypasses choose entirely for deterministic aliases', async () => {
    let calls = 0;
    const result = await classifyCatalogItem({
      state: buildCatalogClassificationState({
        namespace: '@demo', item: { name: 'app-shell', title: 'App Shell', kind: 'block' },
      }),
      taxonomy: beamTaxonomy,
      choose: async () => { calls += 1; throw new Error('must not run'); },
    });
    expect(calls).toBe(0);
    expect(result).toMatchObject({ primary: 'application/app-shell', method: 'deterministic-alias' });
  });

  it('classifies normalized icon kind as foundation/iconography without System One', async () => {
    let calls = 0;
    const result = await classifyCatalogItem({
      state: buildCatalogClassificationState({
        namespace: '@icons',
        item: { name: 'accessibility', title: 'Accessibility', kind: 'icon' },
      }),
      taxonomy,
      choose: async () => { calls += 1; throw new Error('must not run'); },
    });

    expect(calls).toBe(0);
    expect(result).toMatchObject({
      primary: 'foundation/iconography',
      path: ['foundation', 'foundation/iconography'],
      method: 'deterministic-kind',
    });
  });

  it('returns explicit unclassified when UNCLASSIFIED wins the root decision', async () => {
    const result = await classifyCatalogItem({
      state: ambiguousState(), taxonomy: beamTaxonomy, beamWidth: 1,
      choose: async ({ node }: any) => {
        expect(node).toBeNull();
        return {
          choice: 'UNCLASSIFIED',
          probabilities: { application: 0.1, ai: 0.2, UNCLASSIFIED: 0.7 },
          confidence: 0.6, model: 'fixture',
        };
      },
    });
    expect(result).toMatchObject({
      taxonomyVersion: 'beam-v1', primary: null, path: [], method: 'unclassified',
    });
    expect(result.systemOne.decisions).toHaveLength(1);
    expect(result.systemOne.decisions[0].probabilities.UNCLASSIFIED).toBe(0.7);
  });

  it('lets THIS_CATEGORY terminate at the current parent', async () => {
    const result = await classifyCatalogItem({
      state: ambiguousState(), taxonomy: beamTaxonomy, beamWidth: 1,
      choose: async ({ node }: any) => node === null ? {
        choice: 'application',
        probabilities: { application: 0.8, ai: 0.1, UNCLASSIFIED: 0.1 },
        confidence: 0.7, model: 'fixture',
      } : {
        choice: 'THIS_CATEGORY',
        probabilities: { 'application/app-shell': 0.3, THIS_CATEGORY: 0.7 },
        confidence: 0.5, model: 'fixture',
      },
    });
    expect(result).toMatchObject({ primary: 'application', path: ['application'], method: 'system-one' });
  });

  it('uses beam width 2 so a runner-up root can overtake after deeper evidence', async () => {
    const expanded: string[] = [];
    const result = await classifyCatalogItem({
      state: ambiguousState(), taxonomy: beamTaxonomy,
      choose: async ({ node }: any) => {
        expanded.push(node?.id ?? 'ROOT');
        if (node === null) return {
          choice: 'application',
          probabilities: { application: 0.55, ai: 0.45, UNCLASSIFIED: 0 },
          confidence: 0.1, model: 'fixture',
        };
        if (node.id === 'application') return {
          choice: 'application/app-shell',
          probabilities: { 'application/app-shell': 0.51, THIS_CATEGORY: 0.49 },
          confidence: 0.05, model: 'fixture',
        };
        return {
          choice: 'ai/chat',
          probabilities: { 'ai/chat': 0.99, THIS_CATEGORY: 0.01 },
          confidence: 0.05, model: 'fixture',
        };
      },
    });

    expect(expanded).toEqual(['ROOT', 'application', 'ai']);
    expect(result).toMatchObject({
      primary: 'ai/chat', path: ['ai', 'ai/chat'], method: 'system-one',
      systemOne: { beamWidth: 2 },
    });
    expect(result.systemOne.finalPathScore).toBeCloseTo(Math.sqrt(0.45 * 0.99), 8);
    expect(result.systemOne.runnerUpPathScore).toBeCloseTo(Math.sqrt(0.55 * 0.51), 8);
    expect(result.systemOne.separation).toBeGreaterThan(1);
    expect(result.systemOne.decisions).toHaveLength(3);
    expect(result.systemOne.decisions[0]).toMatchObject({
      nodeId: null,
      probabilities: { application: 0.55, ai: 0.45, UNCLASSIFIED: 0 },
    });
  });

  it('uses geometric-mean path scoring and does not apply a probability threshold', async () => {
    const result = await classifyCatalogItem({
      state: ambiguousState(), taxonomy: beamTaxonomy, beamWidth: 1,
      choose: async ({ node }: any) => node === null ? {
        choice: 'ai', probabilities: { application: 0.29, ai: 0.4, UNCLASSIFIED: 0.31 },
        confidence: 0.01, model: 'fixture',
      } : {
        choice: 'ai/chat', probabilities: { 'ai/chat': 0.51, THIS_CATEGORY: 0.49 },
        confidence: 0.01, model: 'fixture',
      },
    });
    expect(result.primary).toBe('ai/chat');
    expect(result.systemOne.finalPathScore).toBeCloseTo(Math.sqrt(0.4 * 0.51), 8);
    expect(result.systemOne.decisions[0].confidence).toBe(0.01);
  });
});
