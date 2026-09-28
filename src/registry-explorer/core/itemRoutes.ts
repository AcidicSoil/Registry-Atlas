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

const MAX_ITEM_NAME_LENGTH = 128;
const ITEM_NAME_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._/-]*$/;

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
  if (!isSafeRegistryItemName(slug)) {
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

  const encodedName = slug.split('/').map(segment => encodeURIComponent(segment)).join('/');
  const resolved = registryUrlTemplate.replace('{name}', encodedName);
  if (/\{[^}]+\}/.test(resolved)) {
    return unavailable('unresolved-template');
  }

  return resolveAbsoluteRoute(resolved);
}

export function isSafeRegistryItemName(value: string): boolean {
  if (
    !value
    || value.length > MAX_ITEM_NAME_LENGTH
    || !ITEM_NAME_PATTERN.test(value)
  ) {
    return false;
  }

  return value.split('/').every(segment => segment && segment !== '.' && segment !== '..');
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
