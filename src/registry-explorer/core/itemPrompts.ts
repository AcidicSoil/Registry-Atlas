import { buildInstallQueueBatchState } from './installQueue.ts';
import type { InstallQueueEntry } from './registry.schema.ts';

/** One installation brief for the user's selected components. No inspection prompt or agent execution. */
export function buildSetupPrompt(
  items: readonly InstallQueueEntry[],
  instructions = '',
): string | null {
  const batch = buildInstallQueueBatchState(items);

  if (!batch.command) return null;

  const acceptedTokens = new Set(batch.tokens);
  const selected = items.filter(item => acceptedTokens.has(item.token));

  const lines = [
    'Set up these registry components in my current project.',
    '',
    'Components:',
    ...selected.map(item => `- ${item.label} (${item.token}), from ${item.registry}`),
    '',
    'Install command:',
    batch.command,
    '',
    'Check the project framework, package manager, component paths, and existing dependencies.',
    'Explain any compatibility issue or file replacement before changing the project.',
    'Show the proposed installation changes and wait for my approval.',
    'After approval, install the selected components and integrate them with existing code.',
    'Keep unrelated files unchanged. Run the relevant project checks.',
    'Report the actual file changes, dependency changes, and test results.',
  ];

  const notes = instructions.trim();

  if (notes) lines.push('', 'My requirements:', notes);

  return lines.join('\n');
}
