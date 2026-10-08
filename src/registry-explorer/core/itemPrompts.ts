import type { RegistryItemDetail } from './registryItemDetail.ts';

export function buildInstallAgentPrompt(detail: RegistryItemDetail): string | null {
  if (detail.installAction.status !== 'enabled') return null;
  return [
    `Install ${detail.title} from ${detail.namespace} into this repository.`,
    '',
    `Inspect: ${detail.installAction.inspectCommand}`,
    `Install: ${detail.installAction.installCommand}`,
    ...groundedMetadata(detail),
    '',
    'Do the work:',
    '1. Inspect the item and the local files it will touch.',
    '2. Run the install command.',
    '3. Resolve only direct integration conflicts and keep unrelated code unchanged.',
    '4. Run the relevant repository verification commands.',
    '',
    'Return the files changed, dependency changes, and verification results.',
  ].join('\n');
}

export function buildInspectionPrompt(detail: RegistryItemDetail): string | null {
  const metadata = groundedMetadata(detail);
  const inspectCommand = detail.installAction.status === 'enabled'
    ? `Inspect: ${detail.installAction.inspectCommand}`
    : null;
  if (!metadata.length && !inspectCommand) return null;

  return [
    `Inspect ${detail.title} from ${detail.namespace}.`,
    'Do not modify the repository.',
    inspectCommand,
    ...metadata,
    '',
    'Return what the item provides, the files and dependencies it would add or change,',
    'the direct integration points in this repository, and any unresolved source facts.',
  ].filter((line): line is string => line !== null).join('\n');
}

function groundedMetadata(detail: RegistryItemDetail): string[] {
  const lines: string[] = [];
  if (detail.dependencies.length) lines.push(`Dependencies: ${detail.dependencies.join(', ')}`);
  if (detail.devDependencies.length) lines.push(`Dev dependencies: ${detail.devDependencies.join(', ')}`);
  if (detail.registryDependencies.length) {
    lines.push(`Registry dependencies: ${detail.registryDependencies.join(', ')}`);
  }
  if (detail.files.length) lines.push(`Files: ${detail.files.map(file => file.path).join(', ')}`);
  if (detail.warnings.length) lines.push(`Warnings: ${detail.warnings.join(', ')}`);
  if (detail.evidenceUrl) lines.push(`Evidence: ${detail.evidenceUrl}`);
  return lines;
}
