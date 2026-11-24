// Maintainer-published, generated registry files. Exact directory identities
// prevent an override from masking a future upstream endpoint correction.
const sources = {
  "@shadcn-map": {
    homepage: "https://shadcn-map.vercel.app",
    url: "http://shadcn-map.vercel.app/r/{name}.json",
    repository: "https://github.com/tonghohin/shadcn-map",
    template: "https://raw.githubusercontent.com/tonghohin/shadcn-map/main/public/r/{name}.json",
  },
  "@wandry-ui": {
    homepage: "http://ui.wandry.com.ua/",
    url: "https://ui.wandry.com.ua/r/{name}.json",
    repository: "https://github.com/WandryDev/wandry-ui",
    template: "https://raw.githubusercontent.com/WandryDev/wandry-ui/main/public/r/{name}.json",
  },
};

function sourceOverride(raw) {
  const source = raw && Object.hasOwn(sources, raw.name) ? sources[raw.name] : undefined;

  return source && source.homepage === raw.homepage && source.url === raw.url ? source : undefined;
}

export function effectiveRegistrySource(raw) {
  const source = sourceOverride(raw);

  return source ? { ...raw, homepage: source.repository, url: source.template } : raw;
}

function verifiedOverride(raw, evidence) {
  const source = sourceOverride(raw);

  return source &&
    evidence?.status === "available" &&
    evidence.catalog_url === source.template.replace("{name}", "registry")
    ? source
    : undefined;
}

export function projectRegistrySource(record, raw, evidence) {
  const source = verifiedOverride(raw, evidence);

  if (!source) return record;

  return {
    ...record,
    official: {
      ...record.official,
      homepage: source.repository,
      registry_url_template: source.template,
    },
    status: {
      ...record.status,
      source_override: {
        original_homepage: raw.homepage,
        original_url: raw.url,
        repository: source.repository,
        catalog_url: evidence.catalog_url,
        verified_at: evidence.synced_at,
      },
    },
  };
}

export function resolvedUpstreamHttpIssue(issue, record, raw, evidence) {
  if (!raw || !record || issue.code !== "url-http" || issue.namespace !== raw.name) return false;
  const source = verifiedOverride(raw, evidence);

  if (!source) return false;

  if (
    record.official?.homepage !== source.repository ||
    record.official?.registry_url_template !== source.template
  )
    return false;

  const original =
    issue.field === "raw.url" ? raw.url : issue.field === "raw.homepage" ? raw.homepage : null;

  return original !== null && issue.value === original;
}
