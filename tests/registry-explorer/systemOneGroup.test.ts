import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node ESM script.
import { chooseObservedGroup } from '../../scripts/lib/systemone-group.mjs';

function response(body: unknown, ok = true, status = 200) {
  return {
    ok,
    status,
    async json() { return body; },
    async text() { return JSON.stringify(body); },
  };
}

describe('bounded SystemOne group choice', () => {
  it('sends only exact observed labels plus NONE and returns the selected probability', async () => {
    let sent: any;
    const result = await chooseObservedGroup({
      state: { asset: { id: 'button' } },
      groups: ['Free', 'Actions'],
      fetchImpl: async (_url: string, init: any) => {
        sent = JSON.parse(init.body);
        return response({
          answers: {
            group: {
              type: 'choice',
              choice: 'Actions',
              probabilities: { Free: 0.02, Actions: 0.96, NONE: 0.02 },
              confidence: 0.94,
            },
          },
          usage: { input_tokens: 42 },
          model: 'clef-flash',
        });
      },
    });

    expect(Object.keys(sent.questions.group.criteria)).toEqual(['Free', 'Actions', 'NONE']);
    expect(sent.questions.group.instructions).toContain('Never invent or rename');
    expect(result).toEqual({
      choice: 'Actions',
      probability: 0.96,
      probabilities: { Free: 0.02, Actions: 0.96, NONE: 0.02 },
      confidence: 0.94,
      usage: { input_tokens: 42 },
      model: 'clef-flash',
    });
  });

  it('rejects duplicate or reserved observed labels', async () => {
    await expect(chooseObservedGroup({
      state: {}, groups: ['Free', 'Free'], fetchImpl: async () => response({}),
    })).rejects.toThrow(/unique/i);
    await expect(chooseObservedGroup({
      state: {}, groups: ['NONE'], fetchImpl: async () => response({}),
    })).rejects.toThrow(/NONE/);
  });

  it('rejects non-local or wrong-path endpoints', async () => {
    await expect(chooseObservedGroup({
      state: {}, groups: ['Free'], endpoint: 'https://example.com/v1/systemone',
      fetchImpl: async () => response({}),
    })).rejects.toThrow(/local/i);
    await expect(chooseObservedGroup({
      state: {}, groups: ['Free'], endpoint: 'http://127.0.0.1:18080/v1/chat/completions',
      fetchImpl: async () => response({}),
    })).rejects.toThrow(/systemone/i);
  });

  it('rejects choices and probabilities outside the supplied options', async () => {
    await expect(chooseObservedGroup({
      state: {}, groups: ['Free'],
      fetchImpl: async () => response({
        answers: { group: {
          type: 'choice', choice: 'Paid',
          probabilities: { Free: 0.1, NONE: 0.1, Paid: 0.8 }, confidence: 0.7,
        } },
      }),
    })).rejects.toThrow(/allowed/i);

    await expect(chooseObservedGroup({
      state: {}, groups: ['Free'],
      fetchImpl: async () => response({
        answers: { group: {
          type: 'choice', choice: 'Free',
          probabilities: { Free: 1.2, NONE: -0.2 }, confidence: 0.7,
        } },
      }),
    })).rejects.toThrow(/probabilit/i);
  });

  it('rejects invalid confidence and malformed responses', async () => {
    await expect(chooseObservedGroup({
      state: {}, groups: ['Free'],
      fetchImpl: async () => response({
        answers: { group: {
          type: 'choice', choice: 'Free',
          probabilities: { Free: 0.9, NONE: 0.1 }, confidence: Number.NaN,
        } },
      }),
    })).rejects.toThrow(/confidence/i);

    await expect(chooseObservedGroup({
      state: {}, groups: ['Free'],
      fetchImpl: async () => response({ answers: {} }),
    })).rejects.toThrow(/response/i);
  });

  it('surfaces HTTP failure and timeout as errors for the survey to fail closed', async () => {
    await expect(chooseObservedGroup({
      state: {}, groups: ['Free'],
      fetchImpl: async () => response({ error: 'busy' }, false, 503),
    })).rejects.toThrow(/503/);

    await expect(chooseObservedGroup({
      state: {}, groups: ['Free'], timeoutMs: 100,
      fetchImpl: async (_url: string, init: any) => new Promise((_resolve, reject) => {
        init.signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError')));
      }),
    })).rejects.toThrow(/timed out/i);
  });
});
