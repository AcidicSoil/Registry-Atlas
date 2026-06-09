import { describe, expect, it } from 'vitest';
import {
  addToInstallQueue,
  buildInstallQueueBatchState,
  clearInstallQueue,
  dedupeInstallTokens,
  removeFromInstallQueue,
} from '../../src/registry-explorer/core/installQueue';
import type { InstallActionState, InstallQueueEntry } from '../../src/registry-explorer/core/registry.schema';

describe('install queue', () => {
  it('dedupes entries by full install token', () => {
    const queue = addToInstallQueue([], queueInput('@foo/button'));
    const duplicate = addToInstallQueue(queue, queueInput('@foo/button'));
    const sameSlugDifferentRegistry = addToInstallQueue(duplicate, queueInput('@bar/button'));

    expect(duplicate).toHaveLength(1);
    expect(sameSlugDifferentRegistry.map(entry => entry.token)).toEqual(['@foo/button', '@bar/button']);
  });

  it('ignores disabled action states', () => {
    expect(addToInstallQueue([], {
      action: disabledAction(),
      label: 'Button',
      registry: '@foo',
      item: 'button',
    })).toEqual([]);
  });

  it('removes by token and clears without mutating the original queue', () => {
    const queue: InstallQueueEntry[] = [
      { token: '@foo/button', label: 'Button', registry: '@foo', item: 'button' },
      { token: '@bar/card', label: 'Card', registry: '@bar', item: 'card' },
    ];

    expect(removeFromInstallQueue(queue, '@foo/button')).toEqual([
      { token: '@bar/card', label: 'Card', registry: '@bar', item: 'card' },
    ]);
    expect(clearInstallQueue()).toEqual([]);
    expect(queue).toHaveLength(2);
  });

  it('builds disabled and enabled batch command states from queue entries', () => {
    expect(buildInstallQueueBatchState([])).toEqual({
      status: 'disabled',
      command: null,
      disabledReason: 'Queue is empty or contains no eligible install tokens.',
      tokens: [],
    });

    expect(buildInstallQueueBatchState([
      { token: '@foo/button', label: 'Button', registry: '@foo', item: 'button' },
      { token: '@bar/card', label: 'Card', registry: '@bar', item: 'card' },
      { token: '@foo/button', label: 'Button', registry: '@foo', item: 'button' },
    ])).toEqual({
      status: 'enabled',
      command: 'npx shadcn@latest add @foo/button @bar/card',
      disabledReason: null,
      tokens: ['@foo/button', '@bar/card'],
    });
  });

  it('dedupes valid tokens and drops invalid tokens', () => {
    expect(dedupeInstallTokens(['@foo/button', '@foo/button', '@bar/button', 'bad token'])).toEqual([
      '@foo/button',
      '@bar/button',
    ]);
  });
});

function queueInput(token: string) {
  const [, registry, item] = token.match(/^(@[^/]+)\/(.+)$/) ?? [];
  return {
    action: enabledAction(token),
    label: item ?? token,
    registry: registry ?? '@unknown',
    item: item ?? token,
  };
}

function enabledAction(token: string): InstallActionState {
  return {
    status: 'enabled',
    token,
    installCommand: `npx shadcn@latest add ${token}`,
    inspectCommand: `npx shadcn@latest view ${token}`,
    route: 'https://example.com/r/item.json',
    disabledReason: null,
  };
}

function disabledAction(): InstallActionState {
  return {
    status: 'disabled',
    token: null,
    installCommand: null,
    inspectCommand: null,
    route: null,
    disabledReason: 'Fallback candidate.',
  };
}
