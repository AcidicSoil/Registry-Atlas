import { z } from 'zod';
import { isValidInstallToken } from './installActions.ts';
import type { InstallQueueEntry } from './registry.schema.ts';

export interface SetupDraft {
  items: InstallQueueEntry[];
  instructions: string;
}

export const SETUP_DRAFT_STORAGE_KEY = 'registry-atlas.setup.v1';

const setupDraftSchema = z.object({
  version: z.literal(1),
  items: z.array(z.unknown()),
  instructions: z.string().optional(),
});

const setupEntrySchema = z.object({
  token: z.string(),
  label: z.string().min(1).max(160),
  registry: z.string(),
  item: z.string(),
  path: z.string().optional(),
});

function parseEntry(parsed: z.output<typeof setupEntrySchema>): InstallQueueEntry | null {
  const { token, label, registry, item, path } = parsed;

  if (!isValidInstallToken(token)) return null;

  if (registry !== token.split('/')[0] || item !== token.split('/').slice(1).join('/')) return null;

  const entry: InstallQueueEntry = { token, label, registry, item };

  if (path && /^\/Registry-Atlas\/(?!\/)[^?#\\]*$/.test(path)) entry.path = path;

  return entry;
}

export function parseSetupDraft(raw: string | null): SetupDraft {
  const empty: SetupDraft = { items: [], instructions: '' };

  if (!raw || raw.length > 32768) return empty;

  try {
    const result = setupDraftSchema.safeParse(JSON.parse(raw));

    if (!result.success) return empty;

    const items = parseSavedItems(result.data.items);

    return { items, instructions: result.data.instructions?.slice(0, 2000) ?? '' };
  } catch {
    return empty;
  }
}

export function serializeSetupDraft(draft: SetupDraft): string {
  return JSON.stringify({
    version: 1,
    items: draft.items,
    instructions: draft.instructions.slice(0, 2000),
  });
}

function parseSavedItems(rawItems: z.output<typeof setupDraftSchema>['items']): InstallQueueEntry[] {
  const items: InstallQueueEntry[] = [];

  for (const rawItem of rawItems.slice(0, 64)) {
    const parsed = setupEntrySchema.safeParse(rawItem);

    if (!parsed.success) continue;

    const item = parseEntry(parsed.data);

    if (item && !items.some(existing => existing.token === item.token)) items.push(item);
  }

  return items;
}
