export type SourceItemKind = 'component' | 'block' | 'page' | 'template' | 'theme' | 'icon';

export interface RegistryRoutePattern {
  urlTemplate: string;
  slugPrefix: string;
  source: string;
  checkedAt?: string;
}

export interface RegistryItemRoute {
  url: string;
  status: string;
}

export interface SourceItemRouteInput {
  homepage: string;
  slug: string;
  kind: SourceItemKind;
  categories?: readonly string[];
  directRoute?: RegistryItemRoute;
  patterns?: readonly RegistryRoutePattern[];
}

const KIND_SEGMENTS: Readonly<Record<SourceItemKind, readonly string[]>> = {
  component: ['component', 'components', 'primitive', 'primitives', 'ui'],
  block: ['block', 'blocks'],
  page: ['page', 'pages'],
  template: ['template', 'templates'],
  theme: ['theme', 'themes', 'style', 'styles'],
  icon: ['icon', 'icons'],
};

export function resolveSourceItemRoute(input: SourceItemRouteInput): string | null {
  const direct = safeSourcePage(input.directRoute?.url, input.homepage);
  if (direct) return direct;

  const candidates = (input.patterns ?? [])
    .map(pattern => {
      const url = resolveSourcePattern(pattern, input.slug, input.homepage);
      if (!url) return null;
      return {
        url,
        score: patternScore(pattern, input.kind, input.slug, input.categories ?? []),
      };
    })
    .filter((candidate): candidate is { url: string; score: number } => Boolean(candidate));

  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0]!.url;

  candidates.sort((a, b) => b.score - a.score || a.url.localeCompare(b.url));
  if (candidates[0]!.score <= 0 || candidates[0]!.score === candidates[1]!.score) return null;
  return candidates[0]!.url;
}

export function resolveSourcePattern(
  pattern: RegistryRoutePattern,
  slug: string,
  homepage: string,
): string | null {
  if (!validSlug(slug)
    || typeof pattern.slugPrefix !== 'string'
    || !slug.startsWith(pattern.slugPrefix)
    || typeof pattern.urlTemplate !== 'string'
    || !/^(?:[^{}])*(?:\{slug\}|\{leaf\})(?:[^{}])*$/.test(pattern.urlTemplate)) {
    return null;
  }
  const remainder = slug.slice(pattern.slugPrefix.length);
  if (!validSlug(remainder)) return null;
  const encoded = remainder.split('/').map(encodeURIComponent).join('/');
  return safeSourcePage(
    pattern.urlTemplate.replace(/\{slug\}|\{leaf\}/, encoded),
    homepage,
  );
}

export function safeSourcePage(raw: string | undefined, root: string): string | null {
  if (!raw || !root || raw.startsWith('//')) return null;
  try {
    const home = new URL(root);
    const page = new URL(raw);
    if (!publicHttps(home) || !publicHttps(page)
      || page.origin !== home.origin
      || page.hash
      || /%2f|%5c|%00/i.test(page.pathname)
      || /\.(?:json|js|css|svg|png|jpe?g|webp|pdf|woff2?|map)\/?$/i.test(page.pathname)
      || page.pathname.replace(/\/+$/, '') === home.pathname.replace(/\/+$/, '')) {
      return null;
    }
    return page.href;
  } catch {
    return null;
  }
}

function publicHttps(url: URL): boolean {
  const host = url.hostname.toLowerCase().replace(/\.$/, '');
  return url.protocol === 'https:'
    && !url.username
    && !url.password
    && !url.port
    && Boolean(host)
    && host.includes('.')
    && host !== 'localhost'
    && !host.endsWith('.localhost')
    && !host.endsWith('.local')
    && !host.endsWith('.internal')
    && !/^\d+(?:\.\d+){3}$/.test(host)
    && !host.includes(':');
}

function validSlug(value: string): boolean {
  return Boolean(value)
    && value.split('/').every(part => /^[a-z0-9][a-z0-9._-]*$/i.test(part));
}

function patternScore(
  pattern: RegistryRoutePattern,
  kind: SourceItemKind,
  slug: string,
  categories: readonly string[],
): number {
  let score = pattern.slugPrefix ? 500 : 0;
  const pathTokens = tokenize(pattern.urlTemplate.replace(/\{slug\}|\{leaf\}/g, ''));
  const kindTokens = new Set(KIND_SEGMENTS[kind]);

  if (pathTokens.some(token => kindTokens.has(token))) score += 200;

  const itemTokens = new Set([
    ...tokenize(slug),
    ...categories.flatMap(tokenize),
  ]);
  for (const token of pathTokens) {
    if (itemTokens.has(token)) score += 20;
    if (token.endsWith('s') && itemTokens.has(token.slice(0, -1))) score += 12;
    if (!token.endsWith('s') && itemTokens.has(token + 's')) score += 12;
  }

  return score;
}

function tokenize(value: string): string[] {
  return value.toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(token => token.length > 1
      && !['https', 'www', 'com', 'docs', 'doc'].includes(token));
}
