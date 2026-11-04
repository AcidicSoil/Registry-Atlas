import { verifiedSourcePageUrl } from "../core/sourcePageValidation";

export { verifiedSourcePageUrl, verifiedRegistryHomepage } from "../core/sourcePageValidation";

import type { RegistrySourcePage } from "../core/registry.schema";

/** Navigation is derived solely from reviewed or observed upstream source evidence. */
export function sourcePageNavigation(
  homepage: string,
  candidates: {
    docsUrl?: string | null;
    sourcePage?: RegistrySourcePage;
  },
): { url: string; label: string; level: "reviewed" | "sitemap" | "pattern" | "observed" } | null {
  const reviewed = verifiedSourcePageUrl(candidates.docsUrl, homepage);

  if (reviewed) return { url: reviewed, label: "View original", level: "reviewed" };
  const page = candidates.sourcePage;

  if (!page) return null;
  const url = verifiedSourcePageUrl(page.url, homepage);

  if (!url) return null;

  switch (page.level) {
    case "reviewed":
      return { url, label: "View original", level: "reviewed" };
    case "sitemap":
      return { url, label: "View sitemap-listed page", level: "sitemap" };
    case "pattern":
      return { url, label: "View pattern-matched page", level: "pattern" };
    case "observed":
      return { url, label: "View documented example", level: "observed" };
  }
}
