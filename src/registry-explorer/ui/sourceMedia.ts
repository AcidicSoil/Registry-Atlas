import { z } from "zod";
import type { RawJsonInput } from "../core/jsonInput";
import { verifiedRegistryHomepage } from "../core/sourcePageValidation";

/** Verifiable media metadata is generated offline; browser lookups never crawl providers. */
const evidenceSchema = z.object({
  mediaUrl: z.string(),
  method: z.enum(["page-metadata", "verified-legacy"]),
  checkedAt: z.string(),
});

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  previews: z.record(z.string(), z.unknown()),
});

export type SourceMedia = ReadonlyMap<string, string>;

export function publicMediaUrl(input: string): URL | null {
  if (input.trim().startsWith("//")) return null;

  const verified = verifiedRegistryHomepage(input);

  if (!verified) return null;

  const page = new URL(verified);

  return page.hostname.includes(":") ? null : page;
}

export function parseSourceMediaManifest(value: RawJsonInput): SourceMedia {
  const { previews } = manifestSchema.parse(value);
  const candidates = new Map<string, string>();
  const uses = new Map<string, number>();

  for (const [page, raw] of Object.entries(previews)) {
    const result = evidenceSchema.safeParse(raw);

    if (!result.success || !Number.isFinite(Date.parse(result.data.checkedAt))) continue;

    const source = publicMediaUrl(page);
    const media = publicMediaUrl(result.data.mediaUrl);

    if (!source || !media || source.href !== page) continue;

    candidates.set(page, media.href);
    uses.set(media.href, (uses.get(media.href) ?? 0) + 1);
  }

  return new Map([...candidates].filter(([, media]) => uses.get(media) === 1));
}

export async function loadSourceMedia(fetchImpl: typeof fetch = fetch): Promise<SourceMedia> {
  try {
    const response = await fetchImpl(import.meta.env.BASE_URL + "data/source-media.json");

    if (!response.ok) return new Map();

    return parseSourceMediaManifest(await response.json());
  } catch {
    // Optional evidence must never prevent the catalog from rendering.
    return new Map();
  }
}
