import { describe, expect, it } from 'vitest';
import {
  buildBatchInstallCommand,
  buildBatchInstallCommandState,
  buildInspectCommand,
  buildInstallToken,
  buildSingleInstallCommand,
  getInstallActionState,
} from '../../src/registry-explorer/core/installActions';

describe('install actions', () => {
  it('builds exact shadcn install and inspect commands', () => {
    expect(buildSingleInstallCommand('@8bitcn/button')).toBe('npx shadcn@latest add @8bitcn/button');
    expect(buildInspectCommand('@8bitcn/button')).toBe('npx shadcn@latest view @8bitcn/button');
  });

  it('normalizes namespaces to exactly one leading at sign', () => {
    expect(buildInstallToken('@8bitcn', 'button')).toBe('@8bitcn/button');
    expect(buildInstallToken('8bitcn', 'button')).toBe('@8bitcn/button');
    expect(buildInstallToken('@@8bitcn', 'button')).toBeNull();
  });

  it('enables actions only for validated route-eligible items with available routes', () => {
    const action = getInstallActionState({
      namespace: '@8bitcn',
      itemSlug: 'button',
      routeEligible: true,
      registryUrlTemplate: 'https://registry.example/r/{name}.json',
    });

    expect(action).toEqual({
      status: 'enabled',
      token: '@8bitcn/button',
      installCommand: 'npx shadcn@latest add @8bitcn/button',
      inspectCommand: 'npx shadcn@latest view @8bitcn/button',
      route: 'https://registry.example/r/button.json',
      disabledReason: null,
    });
  });

  it('disables invalid and incomplete action inputs with reasons and no commands', () => {
    const cases = [
      getInstallActionState({ namespace: '', itemSlug: 'button', routeEligible: true, registryUrlTemplate: 'https://x.example/{name}.json' }),
      getInstallActionState({ namespace: '@bad name', itemSlug: 'button', routeEligible: true, registryUrlTemplate: 'https://x.example/{name}.json' }),
      getInstallActionState({ namespace: '@valid', itemSlug: '', routeEligible: true, registryUrlTemplate: 'https://x.example/{name}.json' }),
      getInstallActionState({ namespace: '@valid', itemSlug: '../button', routeEligible: true, registryUrlTemplate: 'https://x.example/{name}.json' }),
      getInstallActionState({ namespace: '@valid', itemSlug: 'button', routeEligible: true }),
      getInstallActionState({ namespace: '@valid', itemSlug: 'button', routeEligible: true, registryUrlTemplate: 'https://x.example/button.json' }),
      getInstallActionState({ namespace: '@valid', itemSlug: 'button', routeEligible: true, registryUrlTemplate: 'javascript:alert({name})' }),
      getInstallActionState({ namespace: '@valid', itemSlug: 'button', routeEligible: false, registryUrlTemplate: 'https://x.example/{name}.json' }),
      getInstallActionState({ namespace: '@valid', itemSlug: 'button', routeEligible: false, registryUrlTemplate: 'https://x.example/{name}.json', isFallbackCandidate: true }),
    ];

    cases.forEach(action => {
      expect(action.status).toBe('disabled');
      expect(action.disabledReason).toEqual(expect.any(String));
      expect(action.disabledReason?.length).toBeGreaterThan(0);
      expect(action.token).toBeNull();
      expect(action.installCommand).toBeNull();
      expect(action.inspectCommand).toBeNull();
    });
  });

  it('builds exact deduped batch commands in first-seen order', () => {
    expect(buildBatchInstallCommand(['@foo/button', '@bar/card', '@foo/button'])).toBe(
      'npx shadcn@latest add @foo/button @bar/card',
    );
    expect(buildBatchInstallCommand(['@foo/button', 'bad token', '@bar/button'])).toBe(
      'npx shadcn@latest add @foo/button @bar/button',
    );
    expect(buildBatchInstallCommandState([])).toEqual({
      status: 'disabled',
      command: null,
      disabledReason: 'Queue is empty or contains no eligible install tokens.',
      tokens: [],
    });
  });
});
