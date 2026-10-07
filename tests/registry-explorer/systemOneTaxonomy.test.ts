import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM module.
import { chooseTaxonomyOption } from '../../scripts/lib/systemone-taxonomy.mjs';

const state = {
  item: { name: 'workspace', title: 'Workspace', kind: 'block' },
};
const options = [
  {
    id: 'application',
    label: 'Application',
    what: 'Product application surfaces.',
    notFor: ['Marketing pages.'],
    examples: ['Dashboard'],
    aliases: ['app'],
  },
  {
    id: 'ai',
    label: 'AI',
    what: 'AI-native interfaces.',
    notFor: ['Human-only messaging.'],
    examples: ['AI chat'],
    aliases: ['artificial intelligence'],
  },
];

function response(answer: any, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() { return answer; },
  } as any;
}

describe('System One taxonomy adapter', () => {
  it('sends compact state once and taxonomy-owned criteria only', async () => {
    let sent: any;
    const result = await chooseTaxonomyOption({
      state,
      node: null,
      options,
      fetchImpl: async (_url: string, init: any) => {
        sent = JSON.parse(init.body);
        return response({
          answers: {
            taxonomy: {
              type: 'choice',
              choice: 'application',
              probabilities: { application: 0.6, ai: 0.3, UNCLASSIFIED: 0.1 },
              confidence: 0.55,
            },
          },
          model: 'clef-test',
        });
      },
    });

    expect(sent.state).toEqual(state);
    expect(JSON.stringify(sent).match(/Workspace/g)?.length).toBe(1);
    expect(sent.questions.taxonomy).toMatchObject({ type: 'choice' });
    expect(Object.keys(sent.questions.taxonomy.criteria)).toEqual([
      'application', 'ai', 'UNCLASSIFIED',
    ]);
    expect(sent.questions.taxonomy.criteria.application).toContain('Product application surfaces.');
    expect(sent.questions.taxonomy.criteria.application).toContain('Not for: Marketing pages.');
    expect(sent.questions.taxonomy.criteria.application).toContain('Examples: Dashboard');
    expect(sent.questions.taxonomy.criteria.application).toContain('Aliases: app');
    expect(JSON.stringify(sent.questions.taxonomy)).not.toMatch(/generate|invent a category/i);
    expect(result).toMatchObject({
      choice: 'application',
      confidence: 0.55,
      model: 'clef-test',
    });
  });

  it('uses child options plus THIS_CATEGORY below a taxonomy node', async () => {
    let criteria: Record<string, unknown> = {};
    await chooseTaxonomyOption({
      state,
      node: options[0],
      options: [{
        id: 'application/app-shell', label: 'App Shell', what: 'Application frame.',
        notFor: [], examples: ['Workspace shell'], aliases: ['app shell'],
      }],
      fetchImpl: async (_url: string, init: any) => {
        criteria = JSON.parse(init.body).questions.taxonomy.criteria;
        return response({ answers: { taxonomy: {
          type: 'choice', choice: 'THIS_CATEGORY',
          probabilities: { 'application/app-shell': 0.4, THIS_CATEGORY: 0.6 },
          confidence: 0.2,
        } } });
      },
    });
    expect(Object.keys(criteria)).toEqual(['application/app-shell', 'THIS_CATEGORY']);
  });

  it('rejects invented choices and incomplete or extra probabilities', async () => {
    const base = { state, node: null, options };
    await expect(chooseTaxonomyOption({
      ...base,
      fetchImpl: async () => response({ answers: { taxonomy: {
        type: 'choice', choice: 'invented',
        probabilities: { application: 0.5, ai: 0.4, UNCLASSIFIED: 0.1 }, confidence: 0.5,
      } } }),
    })).rejects.toThrow(/outside/i);
    await expect(chooseTaxonomyOption({
      ...base,
      fetchImpl: async () => response({ answers: { taxonomy: {
        type: 'choice', choice: 'application',
        probabilities: { application: 0.6, ai: 0.4 }, confidence: 0.5,
      } } }),
    })).rejects.toThrow(/probabilit/i);
    await expect(chooseTaxonomyOption({
      ...base,
      fetchImpl: async () => response({ answers: { taxonomy: {
        type: 'choice', choice: 'application',
        probabilities: { application: 0.5, ai: 0.3, UNCLASSIFIED: 0.1, extra: 0.1 }, confidence: 0.5,
      } } }),
    })).rejects.toThrow(/outside/i);
  });

  it('rejects invalid confidence, duplicate options, bad endpoints, and timeouts', async () => {
    await expect(chooseTaxonomyOption({
      state, node: null, options,
      fetchImpl: async () => response({ answers: { taxonomy: {
        type: 'choice', choice: 'application',
        probabilities: { application: 0.6, ai: 0.3, UNCLASSIFIED: 0.1 }, confidence: 2,
      } } }),
    })).rejects.toThrow(/confidence/i);
    await expect(chooseTaxonomyOption({ state, node: null, options: [options[0], options[0]] }))
      .rejects.toThrow(/unique/i);
    await expect(chooseTaxonomyOption({
      state, node: null, options, endpoint: 'https://example.com/v1/systemone',
    })).rejects.toThrow(/local/i);
    await expect(chooseTaxonomyOption({
      state, node: null, options, timeoutMs: 100,
      fetchImpl: async (_url: string, init: any) => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(Object.assign(new Error('aborted'), { name: 'AbortError' })));
      }),
    })).rejects.toThrow(/timed out/i);
  });
});
