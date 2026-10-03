import { describe, expect, it } from 'vitest';
// @ts-expect-error Node ESM discovery module has no TypeScript declaration.
import { catalogFingerprint, DISCOVERY_REVISION } from '../../scripts/lib/registry-discovery.mjs';
// @ts-expect-error Node ESM capture module has no TypeScript declaration.
import { planVisualCaptures, captureObservedVisual, captureOutputFilename } from '../../scripts/capture-component-visuals.mjs';

const registry = { name: '@alpha', homepage: 'https://alpha.example/' };
const docsUrl = 'https://alpha.example/docs/components/accordion';
const fp = catalogFingerprint(registry, ['accordion', 'card']);
const observed = {
  schema: 'registry-atlas-discovery/v1',
  discoveryRevision: DISCOVERY_REVISION,
  token: '@alpha/accordion',
  namespace: '@alpha',
  slug: 'accordion',
  status: 'page-observed',
  catalogFingerprint: fp,
  checkedAt: '2026-10-02T12:00:00.000Z',
  docsUrl,
  evidence: {observedUrl: docsUrl, renderedHeading: 'Accordion'},
};
const records = new Map<string, any>([
  ['@alpha/accordion', observed],
  ['@alpha/card', {...observed, token: '@alpha/card', slug: 'card',
    docsUrl: 'https://other.example/docs/card',
    evidence: {observedUrl: 'https://other.example/docs/card', renderedHeading: 'Card'}}],
]);

describe('official page to captured visual reference', () => {
  it('plans only current, same-origin, page-observed, uncaptured identities', () => {
    const result = planVisualCaptures(registry, ['accordion', 'card'], records, {}, 5);
    expect(result.ready).toEqual([{
      namespace: '@alpha', slug: 'accordion', officialPage: docsUrl,
      observedHeading: 'Accordion', checkedAt: observed.checkedAt,
    }]);
    expect(result.skipped).toEqual([{slug: 'card', reason: 'unsafe-observed-page'}]);
    expect(planVisualCaptures(registry, ['accordion', 'card'], records, {
      '@alpha/accordion': {imageUrl: '/Registry-Atlas/data/previews/alpha/accordion.jpg', officialPage: docsUrl},
    }, 5).ready).toEqual([]);
    expect(planVisualCaptures(registry, ['accordion'], new Map([[
      '@alpha/accordion', {...observed, catalogFingerprint: 'stale'},
    ]]), {}, 5).skipped[0].reason).toBe('unverified-or-stale-page');
  });

  it('keeps slash-containing item identities in safe, distinct filenames', () => {
    expect(captureOutputFilename('@alpha', 'components/animate/card'))
      .toMatch(/^alpha\/components-animate-card-[a-f0-9]{12}\.jpg$/);
    expect(captureOutputFilename('@alpha', '../card'))
      .toMatch(/^alpha\/card-[a-f0-9]{12}\.jpg$/);
    expect(captureOutputFilename('@alpha', '../card'))
      .not.toBe(captureOutputFilename('@alpha', 'card'));
  });

  it('captures only after observed heading, exact final URL and selected demo match', async () => {
    const steps: string[] = [];
    let url = docsUrl;
    const browser = {
      nav: async (dest: string) => { steps.push('nav'); url = dest; },
      snap: async () => { steps.push('snap'); return {url,
        nodes: [{role: 'heading', name: 'Accordion'}]}; },
      url: async () => url,
      selectPreview: async (title: string) => {
        steps.push('select:' + title);
        return '[data-registry-atlas-visual="1"]';
      },
      captureElement: async (_path: string, selector: string) => {
        steps.push('capture:' + selector);
        return {url};
      },
    };
    const candidate = {namespace: '@alpha', slug: 'accordion',
      officialPage: docsUrl, observedHeading: 'Accordion', checkedAt: observed.checkedAt};
    const result = await captureObservedVisual(browser, candidate, '/tmp/out.jpg');
    expect(result).toEqual({status: 'captured', officialPage: docsUrl,
      selector: '[data-registry-atlas-visual="1"]'});
    expect(steps).toEqual(['nav', 'snap', 'select:Accordion',
      'capture:[data-registry-atlas-visual="1"]']);

    await expect(captureObservedVisual({ ...browser,
      selectPreview: async () => null }, candidate, '/tmp/out.jpg'))
      .rejects.toThrow('No isolated component visual');
    await expect(captureObservedVisual({ ...browser,
      nav: async () => { url = 'https://other.example/'; } }, candidate, '/tmp/out.jpg'))
      .rejects.toThrow('changed origin or URL');
  });
});
