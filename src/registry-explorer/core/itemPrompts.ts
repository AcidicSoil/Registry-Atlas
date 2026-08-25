import type { RegistryItemDetail } from './registryItemDetail.ts';

export function buildInstallAgentPrompt(detail: RegistryItemDetail): string | null {
  if (detail.installAction.status !== 'enabled') return null;
  return [
    `Use ${detail.title} from ${detail.namespace}.`,
    `Inspect first: ${detail.installAction.inspectCommand}`,
    `Install if appropriate: ${detail.installAction.installCommand}`,
    'Review third-party registry code before applying changes.',
  ].join('\n');
}

export function buildInspectionPrompt(detail: RegistryItemDetail): string | null {
  const lines: string[] = [];
  if (detail.dependencies.length > 0) {
    lines.push(`Dependencies: ${detail.dependencies.join(', ')}`);
  }
  if (detail.devDependencies.length > 0) {
    lines.push(`Dev dependencies: ${detail.devDependencies.join(', ')}`);
  }
  if (detail.registryDependencies.length > 0) {
    lines.push(`Registry dependencies: ${detail.registryDependencies.join(', ')}`);
  }
  if (detail.files.length > 0) {
    lines.push(`Files: ${detail.files.map(file => file.path).join(', ')}`);
  }
  if (detail.warnings.length > 0) {
    lines.push(`Warnings: ${detail.warnings.join(', ')}`);
  }
  if (detail.evidenceUrl) {
    lines.push(`Evidence: ${detail.evidenceUrl}`);
  }

  if (lines.length === 0) return null;
  return [
    `Inspect ${detail.title} from ${detail.namespace}.`,
    ...lines,
    'Use only the grounded metadata above when reviewing this registry item.',
  ].join('\n');
}
