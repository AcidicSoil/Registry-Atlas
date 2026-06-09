import {
  buildBatchInstallCommandState,
  isValidInstallToken,
} from './installActions.ts';
import type {
  BatchInstallCommandState,
  InstallActionState,
  InstallQueueEntry,
} from './registry.schema.ts';

export type { InstallQueueEntry } from './registry.schema.ts';

export interface InstallQueueItemInput {
  action: InstallActionState;
  label: string;
  registry: string;
  item: string;
}

export function addToInstallQueue(
  queue: readonly InstallQueueEntry[],
  item: InstallQueueItemInput,
): InstallQueueEntry[] {
  if (item.action.status !== 'enabled') return [...queue];

  const entry: InstallQueueEntry = {
    token: item.action.token,
    label: item.label,
    registry: item.registry,
    item: item.item,
  };

  if (!isValidInstallToken(entry.token) || queue.some(existing => existing.token === entry.token)) {
    return [...queue];
  }

  return [...queue, entry];
}

export function removeFromInstallQueue(
  queue: readonly InstallQueueEntry[],
  token: string,
): InstallQueueEntry[] {
  return queue.filter(entry => entry.token !== token);
}

export function clearInstallQueue(): InstallQueueEntry[] {
  return [];
}

export function dedupeInstallTokens(tokens: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  tokens.forEach(token => {
    const normalized = token.trim();
    if (!isValidInstallToken(normalized) || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function buildInstallQueueBatchState(
  queue: readonly InstallQueueEntry[],
): BatchInstallCommandState {
  return buildBatchInstallCommandState(queue.map(entry => entry.token));
}
