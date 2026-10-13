import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import { chooseRegistryIdentity } from '../../scripts/lib/systemone-identity.mjs';

const endpoint = (globalThis as any).process?.env?.REGISTRY_ATLAS_SYSTEMONE_URL;
const live = endpoint ? describe : describe.skip;

live('Clef registry identity evaluation', () => {
  const cases = [
    {
      name: 'longer component name',
      link: { text: 'Alert Dialog', url: 'https://sample.example/docs/components/alert-dialog' },
      candidates: [{id:'alert',title:'Alert'}, {id:'alert-dialog',title:'Alert Dialog'}],
      expected: 'alert-dialog',
    },
    {
      name: 'nested identity from observed path',
      link: { text: 'Select', url: 'https://sample.example/docs/forms/select' },
      candidates: [{id:'forms/select',title:'Select'}, {id:'lists/select',title:'Select'}],
      expected: 'forms/select',
    },
    {
      name: 'flattened catalog path',
      link: { text: 'Avatar Group', url: 'https://sample.example/docs/components/animate/avatar-group' },
      candidates: [
        {id:'components-animate-avatar-group',title:'Avatar Group'},
        {id:'components-base-avatar-group',title:'Avatar Group'},
      ],
      expected: 'components-animate-avatar-group',
    },
    {
      name: 'description-bearing link',
      link: { text: 'Button — Clickable pixel buttons', url: 'https://sample.example/docs/components/button' },
      candidates: [{id:'button',title:'Button'}, {id:'button-group',title:'Button Group'}],
      expected: 'button',
    },
    {
      name: 'unrelated observed link',
      link: { text: 'Pricing', url: 'https://sample.example/docs/pricing' },
      candidates: [{id:'button',title:'Button'}, {id:'card',title:'Card'}],
      expected: 'NONE',
    },
    {
      name: 'ambiguous leaf without path evidence',
      link: { text: 'Select', url: 'https://sample.example/docs/not-revealing-family' },
      candidates: [{id:'forms/select',title:'Select'}, {id:'lists/select',title:'Select'}],
      expected: 'NONE',
    },
    {
      name: 'listing context selects forms identity',
      link: {
        text: 'Select',
        url: 'https://sample.example/docs/select',
        listingUrl: 'https://sample.example/docs/forms',
      },
      candidates: [{id:'forms/select',title:'Select'}, {id:'lists/select',title:'Select'}],
      expected: 'forms/select',
    },
    {
      name: 'listing context selects lists identity',
      link: {
        text: 'Select',
        url: 'https://sample.example/docs/select',
        listingUrl: 'https://sample.example/docs/lists',
      },
      candidates: [{id:'forms/select',title:'Select'}, {id:'lists/select',title:'Select'}],
      expected: 'lists/select',
    },
  ] as const;

  for (const sample of cases) {
    it(sample.name, async () => {
      const result = await chooseRegistryIdentity({
        endpoint,
        registry: '@sample',
        observedLink: {
          ...sample.link,
          listingUrl: 'listingUrl' in sample.link
            ? sample.link.listingUrl
            : 'https://sample.example/components',
        },
        candidates: [...sample.candidates],
        timeoutMs: 30000,
      });
      expect(result.choice, JSON.stringify(result)).toBe(sample.expected);
    }, 35000);
  }
});
