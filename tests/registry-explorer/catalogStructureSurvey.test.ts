import { describe, expect, it } from 'vitest';
// @ts-ignore Node ESM runtime test.
import { mkdtemp, readFile, rm } from 'node:fs/promises';
// @ts-ignore Node ESM runtime test.
import { tmpdir } from 'node:os';
// @ts-ignore Node ESM runtime test.
import { join } from 'node:path';
// @ts-ignore Standalone Node ESM script.
import { planCatalogStructureSurvey, surveyRegistryCatalogStructure, writeRegistrySurveyArtifact } from '../../scripts/lib/catalog-structure-survey.mjs';

const registry = (name: string, homepage = `https://${name.slice(1)}.example/`) => ({
  name, homepage,
});
const item = (name: string, type = 'registry:component') => ({ name, type });

function page(url: string, values: Record<string, unknown> = {}) {
  return {
    title: 'Fixture',
    url,
    pathname: new URL(url).pathname,
    ranges: [],
    links: [],
    containers: [],
    ...values,
  };
}

describe('catalog structure survey planning', () => {
  it('addresses the full authoritative registry inventory and applies an exclusive cursor', () => {
    const raw = [registry('@a'), registry('@b'), registry('@c')];
    const catalog = { registries: {
      '@a': [item('button')],
      '@b': [item('hero', 'registry:block')],
      '@c': [],
    } };
    const evidence = {
      '@a': { routePatterns: [{ template: 'https://a.example/docs/{slug}', source: 'browser-observed', status: 'verified' }] },
      '@b': { routePatterns: [] },
      '@c': { routePatterns: [] },
    };

    const plan = planCatalogStructureSurvey(raw, catalog, {}, evidence, {
      cursor: '@a',
      maxRegistries: 2,
    });

    expect(plan.totalRegistries).toBe(3);
    expect(plan.registries.map((row: any) => row.namespace)).toEqual(['@a', '@b', '@c']);
    expect(plan.batch.map((row: any) => row.namespace)).toEqual(['@b', '@c']);
    expect(plan.registries[0].surfaces[0].url).toBe('https://a.example/docs/');
  });

  it('does not hard-code the current registry count as the batch ceiling', () => {
    const raw = [registry('@a')];
    const catalog = { registries: { '@a': [item('button')] } };
    expect(planCatalogStructureSurvey(raw, catalog, {}, {}, {
      maxRegistries: 500,
    }).batch).toHaveLength(1);
  });
});

describe('per-registry catalog structure survey', () => {
  it('follows an observed catalog link from the homepage within the surface budget', async () => {
    const visited: string[] = [];
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@sample'),
      items: [item('hero-01', 'registry:block'), item('hero-02', 'registry:block')],
      surfaces: [{ url: 'https://sample.example/', source: 'homepage' }],
      maxSurfaces: 2,
      observePage: async (url: string) => {
        visited.push(url);
        if (url === 'https://sample.example/') {
          return page(url, {
            links: [
              { text: 'Blocks', href: '/blocks' },
              { text: 'About', href: '/about' },
            ],
          });
        }
        return page('https://sample.example/blocks', {
          ranges: [{
            text: 'Hero',
            ownerTag: 'NAV',
            links: [
              { text: 'Hero 01', href: '/blocks/hero-01' },
              { text: 'Hero 02', href: '/blocks/hero-02' },
            ],
          }],
          links: [
            { text: 'Hero 01', href: '/blocks/hero-01' },
            { text: 'Hero 02', href: '/blocks/hero-02' },
          ],
        });
      },
    });

    expect(visited).toEqual(['https://sample.example/', 'https://sample.example/blocks']);
    expect(result.groups.map((group: any) => group.label)).toEqual(['Hero']);
    expect(result.items.every((row: any) => row.assignment === 'deterministic')).toBe(true);
  });

  it('assigns directly observed group membership without calling Clef', async () => {
    let decisions = 0;
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@kobra', 'https://kobra.example/'),
      items: [item('input-otp'), item('navigation-menu'), item('reasoning-steps'), item('file-diff')],
      surfaces: [{ url: 'https://kobra.example/components/input-otp', source: 'fixture' }],
      observePage: async () => page('https://kobra.example/components/input-otp', {
        ranges: [
          { text: 'Free', ownerTag: 'NAV', links: [
            { text: 'Input OTP', href: '/components/input-otp' },
            { text: 'Navigation Menu', href: '/components/navigation-menu' },
          ] },
          { text: 'Agents', ownerTag: 'NAV', links: [
            { text: 'Reasoning Steps', href: '/components/reasoning-steps' },
            { text: 'File Diff', href: '/components/file-diff' },
          ] },
        ],
        links: [
          { text: 'Input OTP', href: '/components/input-otp' },
          { text: 'Navigation Menu', href: '/components/navigation-menu' },
          { text: 'Reasoning Steps', href: '/components/reasoning-steps' },
          { text: 'File Diff', href: '/components/file-diff' },
        ],
      }),
      chooseGroup: async () => { decisions++; throw new Error('must not be called'); },
    });

    expect(decisions).toBe(0);
    expect(result.items.find((row: any) => row.id === 'input-otp')).toMatchObject({
      groups: ['Free'], access: 'free', assignment: 'deterministic',
    });
    expect(result.items.find((row: any) => row.id === 'reasoning-steps')).toMatchObject({
      groups: ['Agents'], access: 'unknown', assignment: 'deterministic',
    });
    expect(result.summary.access).toEqual({ free: 2, paid: 0, unknown: 2 });
  });

  it('never offers Clef groups discovered on unrelated surfaces', async () => {
    let decisions = 0;
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@sample'),
      items: [item('button-01'), item('card-01'), item('card-02')],
      surfaces: [
        { url: 'https://sample.example/components/button', source: 'fixture' },
        { url: 'https://sample.example/blocks/card', source: 'fixture' },
      ],
      observePage: async (url: string) => {
        if (url.endsWith('/components/button')) {
          return page(url, {
            links: [{ text: 'Button 01', href: '/components/button/button-01' }],
          });
        }
        return page(url, {
          ranges: [{
            text: 'All Card Blocks',
            ownerTag: 'NAV',
            links: [
              { text: 'Card 01', href: '/blocks/card/card-01' },
              { text: 'Card 02', href: '/blocks/card/card-02' },
            ],
          }],
          links: [{ text: 'Card 01', href: '/blocks/card/card-01' }],
        });
      },
      chooseGroup: async () => {
        decisions++;
        return { choice: 'All Card Blocks', probability: 0.99, confidence: 0.99 };
      },
    });

    expect(decisions).toBe(0);
    expect(result.items.find((row: any) => row.id === 'button-01')).toMatchObject({
      groups: [], assignment: 'flat',
    });
    expect(result.items.find((row: any) => row.id === 'card-01')).toMatchObject({
      groups: ['All Card Blocks'], assignment: 'deterministic',
    });
  });

  it('uses Clef only for an observed item whose membership is ambiguous', async () => {
    const calls: any[] = [];
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@sample'),
      items: [item('select')],
      surfaces: [{ url: 'https://sample.example/components', source: 'fixture' }],
      observePage: async () => page('https://sample.example/components', {
        links: [
          { text: 'Forms', href: '/components/forms' },
          { text: 'Navigation', href: '/components/navigation' },
          { text: 'Select', href: '/components/select' },
        ],
      }),
      chooseGroup: async (request: any) => {
        calls.push(request);
        return {
          choice: 'Forms', probability: 0.8,
          probabilities: { Forms: 0.8, Navigation: 0.1, NONE: 0.1 },
          confidence: 0.7,
        };
      },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].groups).toEqual(['Forms', 'Navigation']);
    expect(result.items[0]).toMatchObject({
      id: 'select', groups: ['Forms'], assignment: 'clef', access: 'unknown',
      decision: { probability: 0.8, confidence: 0.7 },
    });
  });

  it('narrows a large same-surface group set before calling Clef', async () => {
    const calls: any[] = [];
    const categoryLinks = [
      ...Array.from({ length: 20 }, (_, index) => ({
        text: `Category ${index}`, href: `/components/category-${index}`,
      })),
      { text: 'Button', href: '/components/button' },
      { text: 'Button Group', href: '/components/button-group' },
      { text: 'Border Button', href: '/components/border-button' },
    ];
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@sample'),
      items: [item('border-button')],
      surfaces: [{ url: 'https://sample.example/components', source: 'fixture' }],
      observePage: async () => page('https://sample.example/components', {
        links: categoryLinks,
      }),
      chooseGroup: async (request: any) => {
        calls.push(request);
        return {
          choice: 'Button', probability: 0.7,
          probabilities: { Button: 0.7, 'Button Group': 0.2, NONE: 0.1 },
          confidence: 0.6,
        };
      },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].groups).toEqual(['Button', 'Button Group']);
    expect(result.items[0]).toMatchObject({
      id: 'border-button', groups: ['Button'], assignment: 'clef',
    });
  });

  it('rejects a decision label that was not in the narrowed candidate shortlist', async () => {
    const links = [
      ...Array.from({ length: 20 }, (_, index) => ({
        text: `Category ${index}`, href: `/components/category-${index}`,
      })),
      { text: 'Button', href: '/components/button' },
      { text: 'Button Group', href: '/components/button-group' },
      { text: 'Avatar', href: '/components/avatar' },
      { text: 'Border Button', href: '/components/border-button' },
    ];
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@sample'),
      items: [item('border-button')],
      surfaces: [{ url: 'https://sample.example/components', source: 'fixture' }],
      observePage: async () => page('https://sample.example/components', { links }),
      chooseGroup: async () => ({
        choice: 'Avatar', probability: 0.9,
        probabilities: { Avatar: 0.9, NONE: 0.1 }, confidence: 0.8,
      }),
    });

    expect(result.items[0]).toMatchObject({
      id: 'border-button', groups: [], assignment: 'unresolved', reason: 'decision-failed',
    });
    expect(result.errors).toEqual([
      expect.objectContaining({ type: 'decision', item: 'border-button' }),
    ]);
  });

  it('keeps merged group evidence scoped to every source surface where it was observed', async () => {
    const calls: any[] = [];
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@sample'),
      items: [item('select')],
      surfaces: [
        { url: 'https://sample.example/components', source: 'fixture' },
        { url: 'https://sample.example/components/featured', source: 'fixture' },
      ],
      maxSurfaces: 2,
      observePage: async (url: string) => url.endsWith('/featured')
        ? page(url, { links: [
          { text: 'Forms', href: '/components/featured/forms' },
          { text: 'Navigation', href: '/components/featured/navigation' },
          { text: 'Select', href: '/components/featured/select' },
        ] })
        : page(url, { links: [
          { text: 'Forms', href: '/components/forms' },
          { text: 'Navigation', href: '/components/navigation' },
        ] }),
      chooseGroup: async (request: any) => {
        calls.push(request);
        return {
          choice: 'Forms', probability: 0.8,
          probabilities: { Forms: 0.8, Navigation: 0.1, NONE: 0.1 }, confidence: 0.7,
        };
      },
    });

    expect(calls).toHaveLength(1);
    expect(calls[0].groups).toEqual(['Forms', 'Navigation']);
    expect(result.items[0]).toMatchObject({ groups: ['Forms'], assignment: 'clef' });
  });

  it('leaves a large ambiguous group set unresolved when no evidence-based shortlist exists', async () => {
    let decisions = 0;
    const links = [
      ...Array.from({ length: 20 }, (_, index) => ({
        text: `Category ${index}`, href: `/components/category-${index}`,
      })),
      { text: 'Sparkline', href: '/components/sparkline' },
    ];
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@sample'),
      items: [item('sparkline')],
      surfaces: [{ url: 'https://sample.example/components', source: 'fixture' }],
      observePage: async () => page('https://sample.example/components', { links }),
      chooseGroup: async () => { decisions++; return { choice: 'NONE' }; },
    });

    expect(decisions).toBe(0);
    expect(result.items[0]).toMatchObject({
      id: 'sparkline', groups: [], assignment: 'unresolved',
      reason: 'decision-candidates-too-broad',
    });
  });

  it('treats an observed flat catalog as group-less without calling Clef', async () => {
    let decisions = 0;
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@flat'),
      items: [item('magic-card'), item('globe')],
      surfaces: [{ url: 'https://flat.example/components', source: 'fixture' }],
      observePage: async () => page('https://flat.example/components', {
        links: [
          { text: 'Magic Card', href: '/components/magic-card' },
          { text: 'Globe', href: '/components/globe' },
        ],
      }),
      chooseGroup: async () => { decisions++; return { choice: 'NONE' }; },
    });

    expect(decisions).toBe(0);
    expect(result.groups).toEqual([]);
    expect(result.items.map((row: any) => [row.id, row.groups, row.assignment])).toEqual([
      ['magic-card', [], 'flat'],
      ['globe', [], 'flat'],
    ]);
  });

  it('accepts a canonical bare-domain to www redirect but not unrelated subdomains', async () => {
    const accepted = await surveyRegistryCatalogStructure({
      registry: registry('@sample', 'https://example.test/'),
      items: [item('button')],
      surfaces: [{ url: 'https://example.test/components', source: 'fixture' }],
      observePage: async () => page('https://www.example.test/components', {
        links: [{ text: 'Button', href: '/components/button' }],
      }),
    });
    expect(accepted.status).toBe('surveyed');
    expect(accepted.items[0]).toMatchObject({ id: 'button', assignment: 'flat' });

    const rejected = await surveyRegistryCatalogStructure({
      registry: registry('@sample', 'https://example.test/'),
      items: [item('button')],
      surfaces: [{ url: 'https://example.test/components', source: 'fixture' }],
      observePage: async () => page('https://docs.example.test/components', {
        links: [{ text: 'Button', href: '/components/button' }],
      }),
    });
    expect(rejected.status).toBe('navigation-failed');
    expect(rejected.errors[0].message).toMatch(/official registry origin/i);
  });

  it('leaves an ambiguous item unresolved when Clef fails', async () => {
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@sample'),
      items: [item('select')],
      surfaces: [{ url: 'https://sample.example/components', source: 'fixture' }],
      observePage: async () => page('https://sample.example/components', {
        links: [
          { text: 'Forms', href: '/components/forms' },
          { text: 'Navigation', href: '/components/navigation' },
          { text: 'Select', href: '/components/select' },
        ],
      }),
      chooseGroup: async () => { throw new Error('model offline'); },
    });

    expect(result.items[0]).toMatchObject({
      id: 'select', groups: [], assignment: 'unresolved',
      reason: 'decision-failed',
    });
    expect(result.errors).toEqual([
      expect.objectContaining({ type: 'decision', item: 'select', message: 'model offline' }),
    ]);
  });

  it('keeps unobserved catalog items unresolved and preserves block/page kinds', async () => {
    const result = await surveyRegistryCatalogStructure({
      registry: registry('@mixed'),
      items: [item('hero-01', 'registry:block'), item('landing', 'registry:page')],
      surfaces: [{ url: 'https://mixed.example/blocks', source: 'fixture' }],
      observePage: async () => page('https://mixed.example/blocks', {
        links: [{ text: 'Hero 01', href: '/blocks/hero-01' }],
      }),
      chooseGroup: undefined,
    });

    expect(result.items).toEqual([
      expect.objectContaining({ id: 'hero-01', kind: 'block', assignment: 'flat' }),
      expect.objectContaining({
        id: 'landing', kind: 'page', assignment: 'unresolved',
        reason: 'not-observed-on-surveyed-surface',
      }),
    ]);
    expect(result.summary.kinds).toEqual({ block: 1, page: 1 });
  });
});

describe('survey artifact writer', () => {
  it('writes one versioned registry artifact atomically', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'atlas-catalog-structure-'));
    try {
      const artifact = {
        schema: 'registry-atlas-catalog-structure-survey/v1',
        namespace: '@sample',
        summary: { items: 1 },
      };
      const path = await writeRegistrySurveyArtifact(dir, artifact);
      expect(path).toBe(join(dir, 'sample.json'));
      expect(JSON.parse(await readFile(path, 'utf8'))).toEqual(artifact);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
