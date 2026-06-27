import { resolveRegistryItemRoute } from './itemRoutes.ts';
import type { BatchInstallCommandState, InstallActionState } from './registry.schema.ts';

const NAMESPACE_PATTERN = /^@?[a-z0-9][a-z0-9-]*$/;
const ITEM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const INSTALL_TOKEN_PATTERN = /^@[a-z0-9][a-z0-9-]*\/[a-z0-9]+(?:-[a-z0-9]+)*$/;

export interface InstallActionInput {
  namespace: string | undefined | null;
  itemSlug: string | undefined | null;
  routeEligible: boolean;
  registryUrlTemplate?: string | undefined | null;
  rawItemUrl?: string | undefined | null;
  isFallbackCandidate?: boolean;
  fallbackReason?: string;
}

export function buildInstallToken(namespace: string, itemSlug: string): string | null {
  const normalizedNamespace = normalizeNamespace(namespace);
  const slug = itemSlug.trim();

  if (!normalizedNamespace || !ITEM_SLUG_PATTERN.test(slug)) {
    return null;
  }

  return `${normalizedNamespace}/${slug}`;
}

export function buildSingleInstallCommand(token: string): string | null {
  if (!isValidInstallToken(token)) return null;
  return `npx shadcn@latest add ${token}`;
}

export function buildInspectCommand(token: string): string | null {
  if (!isValidInstallToken(token)) return null;
  return `npx shadcn@latest view ${token}`;
}

export function getInstallActionState(input: InstallActionInput): InstallActionState {
  if (input.isFallbackCandidate) {
    return disabled(input.fallbackReason ?? 'Inferred/fallback candidate; install command unavailable.');
  }

  const namespace = input.namespace?.trim() ?? '';
  if (!namespace) return disabled('Missing registry namespace.');
  if (!normalizeNamespace(namespace)) return disabled('Invalid registry namespace.');

  const slug = input.itemSlug?.trim() ?? '';
  if (!slug) return disabled('Missing item slug.');
  if (!ITEM_SLUG_PATTERN.test(slug)) return disabled('Invalid item slug.');

  if (!input.routeEligible) {
    return disabled('Item is not route eligible in the validated registry catalog.');
  }

  const template = input.registryUrlTemplate?.trim() ?? '';
  const rawItemUrl = input.rawItemUrl?.trim() ?? '';
  if (!template && !rawItemUrl) {
    return disabled('Registry mirror/template is unavailable.');
  }

  const token = buildInstallToken(namespace, slug);
  if (!token) return disabled('Invalid install token.');

  const route = resolveRegistryItemRoute(normalizeNamespace(namespace) ?? '', template, slug, input.rawItemUrl);
  if (route.status !== 'available') {
    return disabled(disabledReasonForRoute(route.status));
  }

  const installCommand = buildSingleInstallCommand(token);
  const inspectCommand = buildInspectCommand(token);
  if (!installCommand || !inspectCommand) {
    return disabled('Invalid install token.');
  }

  return {
    status: 'enabled',
    token,
    installCommand,
    inspectCommand,
    route: route.url,
    disabledReason: null,
  };
}

export function buildBatchInstallCommand(tokens: readonly string[]): string | null {
  const deduped = dedupeInstallTokens(tokens);
  if (deduped.length === 0) return null;
  return `npx shadcn@latest add ${deduped.join(' ')}`;
}

export function buildBatchInstallCommandState(tokens: readonly string[]): BatchInstallCommandState {
  const deduped = dedupeInstallTokens(tokens);
  const command = buildBatchInstallCommand(deduped);

  return {
    status: command ? 'enabled' : 'disabled',
    command,
    disabledReason: command ? null : 'Queue is empty or contains no eligible install tokens.',
    tokens: deduped,
  };
}

function dedupeInstallTokens(tokens: readonly string[]): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  tokens.forEach(token => {
    const normalized = normalizeInstallToken(token);
    if (!normalized || seen.has(normalized)) return;
    seen.add(normalized);
    result.push(normalized);
  });

  return result;
}

export function isValidInstallToken(token: string): boolean {
  return INSTALL_TOKEN_PATTERN.test(token.trim());
}

function normalizeInstallToken(token: string): string | null {
  const trimmed = token.trim();
  if (!isValidInstallToken(trimmed)) return null;
  return trimmed;
}

function normalizeNamespace(namespace: string): string | null {
  const trimmed = namespace.trim();
  if (!NAMESPACE_PATTERN.test(trimmed)) return null;

  const withoutAt = trimmed.replace(/^@+/, '');
  if (!withoutAt || !/^[a-z0-9][a-z0-9-]*$/.test(withoutAt)) return null;
  return `@${withoutAt}`;
}

function disabled(disabledReason: string): InstallActionState {
  return {
    status: 'disabled',
    token: null,
    installCommand: null,
    inspectCommand: null,
    route: null,
    disabledReason,
  };
}

function disabledReasonForRoute(status: string): string {
  if (status === 'invalid-template') return 'Registry route template is invalid.';
  if (status === 'invalid-url') return 'Resolved item route URL is invalid.';
  if (status === 'catalog-not-verified') return 'Catalog is not verified.';
  if (status === 'unresolved-template') return 'Registry route template has unresolved placeholders.';
  if (status === 'missing-item-slug') return 'Missing item slug.';
  if (status === 'invalid-item-slug') return 'Invalid item slug.';
  return 'Item route unavailable.';
}
