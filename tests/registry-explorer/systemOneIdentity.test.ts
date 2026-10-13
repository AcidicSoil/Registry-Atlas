import { describe, expect, it, vi } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import { chooseRegistryIdentity } from '../../scripts/lib/systemone-identity.mjs';

describe('System One registry identity decisions', () => {
  it('sends a bounded choice question and returns the selected catalog identity', async () => {
    const fetchImpl = vi.fn(async (_url: string, init: RequestInit) => {
      const body = JSON.parse(String(init.body));
      expect(body.state).toMatchObject({
        registry: '@sample',
        observedLink: {
          text: 'Select',
          url: 'https://sample.example/docs/forms/select',
        },
      });
      expect(body.questions.identity).toMatchObject({
        type: 'choice',
        criteria: {
          'forms/select': expect.any(String),
          'lists/select': expect.any(String),
          NONE: expect.any(String),
        },
      });

      return new Response(JSON.stringify({
        model: 'clef',
        answers: {
          identity: {
            type: 'choice',
            choice: 'forms/select',
            probabilities: {
              'forms/select': 0.91,
              'lists/select': 0.06,
              NONE: 0.03,
            },
            confidence: 0.88,
          },
        },
        usage: { input_tokens: 120, output_tokens: 0 },
      }), { status: 200, headers: { 'content-type': 'application/json' } });
    });

    const result = await chooseRegistryIdentity({
      endpoint: 'http://127.0.0.1:18080/v1/systemone',
      registry: '@sample',
      observedLink: {
        text: 'Select',
        url: 'https://sample.example/docs/forms/select',
        listingUrl: 'https://sample.example/components',
      },
      candidates: [
        { id: 'forms/select', title: 'Select form control' },
        { id: 'lists/select', title: 'Select list control' },
      ],
      fetchImpl,
    });

    expect(result).toMatchObject({
      choice: 'forms/select',
      probability: 0.91,
      confidence: 0.88,
    });
    expect(fetchImpl).toHaveBeenCalledOnce();
  });

  it('rejects a choice that was not in the candidate set', async () => {
    const fetchImpl = vi.fn(async () => new Response(JSON.stringify({
      answers: {
        identity: {
          type: 'choice',
          choice: 'invented/component',
          probabilities: {
            'forms/select': 0.4,
            'lists/select': 0.3,
            NONE: 0.3,
          },
          confidence: 0.1,
        },
      },
      usage: { input_tokens: 80, output_tokens: 0 },
    }), { status: 200, headers: { 'content-type': 'application/json' } }));

    await expect(chooseRegistryIdentity({
      endpoint: 'http://127.0.0.1:18080/v1/systemone',
      registry: '@sample',
      observedLink: {
        text: 'Select',
        url: 'https://sample.example/docs/not-revealing-family',
      },
      candidates: [
        { id: 'forms/select' },
        { id: 'lists/select' },
      ],
      fetchImpl,
    })).rejects.toThrow(/outside candidate set/i);
  });
});
