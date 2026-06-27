export type ResolvedItemRoute =
  | {
      status: 'available';
      label: 'Open item route';
      url: string;
    }
  | {
      status: 'missing-item-slug' | 'invalid-item-slug' | 'invalid-template' | 'invalid-url' | 'unresolved-template' | 'catalog-not-verified';
      label: 'Item route unavailable' | 'Catalog not verified';
      url: null;
    };

const ITEM_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function resolveRegistryItemRoute(
  namespace: string,
  registryUrlTemplate: string,
  itemSlug: string | undefined | null,
  rawItemUrl?: string | undefined | null,
): ResolvedItemRoute {
  if (!itemSlug || itemSlug.trim().length === 0) {
    return unavailable('missing-item-slug');
  }

  const slug = itemSlug.trim();
  if (!ITEM_SLUG_PATTERN.test(slug)) {
    return unavailable('invalid-item-slug');
  }

  if (!namespace.startsWith('@')) {
    return unavailable('invalid-template');
  }

  if (rawItemUrl && rawItemUrl.trim().length > 0) {
    return resolveAbsoluteRoute(rawItemUrl.trim());
  }

  if (!registryUrlTemplate.includes('{name}')) {
    return unavailable('invalid-template');
  }

  const resolved = registryUrlTemplate.replace('{name}', encodeURIComponent(slug));
  if (/\{[^}]+\}/.test(resolved)) {
    return unavailable('unresolved-template');
  }

  return resolveAbsoluteRoute(resolved);
}

function resolveAbsoluteRoute(value: string): ResolvedItemRoute {
  if (value.startsWith('//')) {
    return unavailable('invalid-url');
  }

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return unavailable('invalid-url');
  }

  if (url.protocol !== 'https:' && url.protocol !== 'http:') {
    return unavailable('invalid-url');
  }

  return {
    status: 'available',
    label: 'Open item route',
    url: url.toString(),
  };
}

function unavailable(status: Exclude<ResolvedItemRoute['status'], 'available'>): ResolvedItemRoute {
  return {
    status,
    label: status === 'catalog-not-verified' ? 'Catalog not verified' : 'Item route unavailable',
    url: null,
  };
}
