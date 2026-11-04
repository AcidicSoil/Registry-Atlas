/** Provider-neutral extraction of item-specific images from upstream HTML metadata. */
export function publicMediaUrl(input) {
  if (input.trim().startsWith("//")) return null;

  try {
    const url = new URL(input);
    const host = url.hostname.toLowerCase();

    if (
      url.protocol !== "https:" ||
      url.username ||
      url.password ||
      url.port ||
      !host.includes(".") ||
      host.includes(":") ||
      host === "localhost" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^\d+(?:\.\d+){3}$/.test(host)
    )
      return null;

    return url;
  } catch {
    return null;
  }
}

export function extractItemImageCandidate(pageUrl, html) {
  const page = publicMediaUrl(pageUrl);

  if (!page) return null;

  const slug = decodeURIComponent(page.pathname.split("/").filter(Boolean).at(-1) ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-");

  if (slug.length < 3) return null;

  const tags = html.match(/<meta\b[^>]*>/gi) ?? [];

  for (const tag of tags) {
    const attributes = Object.fromEntries(
      [...tag.matchAll(/([\w:-]+)\s*=\s*(?:"([^"]*)"|'([^']*)')/g)].map((match) => [
        match[1].toLowerCase(),
        match[2] ?? match[3],
      ]),
    );

    if (!["og:image", "twitter:image"].includes(attributes.property ?? attributes.name)) continue;

    const candidate = attributes.content?.replaceAll("&amp;", "&");

    if (!candidate) continue;

    let url;

    try {
      url = new URL(candidate, page).href;
    } catch {
      continue;
    }

    const media = publicMediaUrl(url);

    if (!media || !/\.(?:png|webp|jpe?g|avif|gif|svg)$/i.test(media.pathname)) continue;

    const path = decodeURIComponent(media.pathname)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-");

    if (!`-${path}-`.includes(`-${slug}-`)) continue;

    return media.href;
  }

  return null;
}

export function validMediaResponse(response) {
  if (!response.ok || response.redirected) return false;

  const type = response.headers.get("content-type")?.split(";")[0]?.trim().toLowerCase();
  const size = response.headers.get("content-length");
  const bytes = size === null ? NaN : Number(size);

  return (
    ["image/png", "image/jpeg", "image/webp", "image/avif", "image/gif", "image/svg+xml"].includes(
      type,
    ) &&
    Number.isFinite(bytes) &&
    bytes > 0 &&
    bytes <= 5 * 1024 * 1024
  );
}
