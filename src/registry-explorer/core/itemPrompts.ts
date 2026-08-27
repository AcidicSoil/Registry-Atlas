import type { RegistryItemDetail } from './registryItemDetail.ts';

export function buildInstallAgentPrompt(detail: RegistryItemDetail): string | null {
  if (detail.installAction.status !== 'enabled') return null;
  const metadata = groundedMetadata(detail);
  return [
    `Task: Evaluate and install ${detail.title} from ${detail.namespace} into this repository.`,
    '',
    `Inspect command: ${detail.installAction.inspectCommand}`,
    `Install command: ${detail.installAction.installCommand}`,
    ...metadata,
    '',
    'Workflow:',
    '1. Run the inspect command first and review the registry item before changing the repository.',
    '2. Check the proposed files, dependencies, registry dependencies, styling, imports, and any overwrite/conflict risk against the existing codebase.',
    '3. If the item is unsafe, incompatible, redundant, or would overwrite intentional local work, do not install it. Explain why.',
    '4. If it is appropriate, run the install command and make only the smallest follow-up changes required for compatibility.',
    '5. Run the relevant tests, typecheck, lint, or build commands available in the repository.',
    '',
    'Constraints:',
    '- Do not modify unrelated code.',
    '- Preserve existing architecture, conventions, and design tokens unless the item requires a narrowly justified compatibility change.',
    '- Do not claim success without fresh verification evidence.',
    '',
    'Report:',
    '- Decision: installed or skipped',
    '- Files changed',
    '- Dependency changes',
    '- Verification run and results',
    '- Any remaining risks or follow-up work',
  ].join('\n');
}

export function buildInspectionPrompt(detail: RegistryItemDetail): string | null {
  const metadata = groundedMetadata(detail);
  const inspectCommand = detail.installAction.status === 'enabled'
    ? `Inspect command: ${detail.installAction.inspectCommand}`
    : null;
  if (metadata.length === 0 && !inspectCommand) return null;

  return [
    `Task: Review ${detail.title} from ${detail.namespace} for possible adoption.`,
    'Do not install the item.',
    inspectCommand,
    ...metadata,
    '',
    'Evaluate:',
    '- What the item adds and whether it fits the existing product/codebase',
    '- Expected files and dependency changes',
    '- Conflicts or overwrite risk with existing code',
    '- Security, provenance, maintenance, and styling risks visible from the grounded evidence',
    '- Whether an existing local component already solves the same problem',
    '',
    'Return:',
    '- Recommendation: use or skip',
    '- Reasons for the recommendation',
    '- Expected changes if adopted',
    '- Risks or questions that still need verification',
  ].filter((line): line is string => line !== null).join('\n');
}

function groundedMetadata(detail: RegistryItemDetail): string[] {
  const lines: string[] = [];
  if (detail.dependencies.length > 0) lines.push(`Dependencies: ${detail.dependencies.join(', ')}`);
  if (detail.devDependencies.length > 0) lines.push(`Dev dependencies: ${detail.devDependencies.join(', ')}`);
  if (detail.registryDependencies.length > 0) lines.push(`Registry dependencies: ${detail.registryDependencies.join(', ')}`);
  if (detail.files.length > 0) {
    const files = detail.files.map(file => file.path).join(', ');
    lines.push(`Files: ${files}`);
    lines.push(`Expected files: ${files}`);
  }
  if (detail.warnings.length > 0) lines.push(`Warnings: ${detail.warnings.join(', ')}`);
  if (detail.evidenceUrl) lines.push(`Evidence: ${detail.evidenceUrl}`);
  return lines;
}
