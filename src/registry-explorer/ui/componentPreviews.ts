import { z } from "zod";
import type { RawJsonInput } from "../core/jsonInput";
import { verifiedRegistryHomepage } from "../core/sourcePageValidation";

const captureSchema = z.object({
  namespace: z.string().regex(/^@[a-z0-9][a-z0-9-]*$/),
  slug: z.string().regex(/^[a-z0-9][a-z0-9-]*$/),
  sourceUrl: z.string(),
  captureSourceUrl: z.string(),
  imagePath: z.string().regex(/^data\/component-previews\/[a-z0-9-]+\.webp$/),
  sha256: z.string().regex(/^[a-f0-9]{64}$/),
  verifiedAt: z.string(),
  method: z.literal("reviewed-publisher-screenshot"),
});

const manifestSchema = z.object({
  schemaVersion: z.literal(1),
  previews: z.array(z.unknown()),
});

type ComponentPreview = Readonly<{ src: string; hostname: string }>;

export type ComponentPreviews = ReadonlyMap<string, ComponentPreview>;

/** Only exact, reviewed, locally stored component captures qualify. */
export function parseComponentPreviewManifest(
  input: RawJsonInput,
  baseUrl: string,
): ComponentPreviews {
  const { previews } = manifestSchema.parse(input);
  const candidates = new Map<string, ComponentPreview>();
  const sourceUses = new Map<string, number>();
  const imageUses = new Map<string, number>();

  for (const raw of previews) {
    const parsed = captureSchema.safeParse(raw);

    if (!parsed.success) continue;

    const capture = parsed.data;
    const source = verifiedRegistryHomepage(capture.sourceUrl);
    const origin = verifiedRegistryHomepage(capture.captureSourceUrl);

    if (!source || source !== capture.sourceUrl || !origin) continue;

    if (!Number.isFinite(Date.parse(capture.verifiedAt))) continue;

    sourceUses.set(source, (sourceUses.get(source) ?? 0) + 1);
    imageUses.set(capture.imagePath, (imageUses.get(capture.imagePath) ?? 0) + 1);
    candidates.set(source, {
      src: `${baseUrl}${capture.imagePath}`,
      hostname: new URL(source).hostname,
    });
  }

  return new Map(
    [...candidates].filter(([source, capture]) => {
      const imagePath = capture.src.slice(baseUrl.length);

      return sourceUses.get(source) === 1 && imageUses.get(imagePath) === 1;
    }),
  );
}

export async function loadComponentPreviews(
  fetchImpl: typeof fetch = fetch,
): Promise<ComponentPreviews> {
  try {
    const response = await fetchImpl(import.meta.env.BASE_URL + "data/component-previews.json");

    if (!response.ok) return new Map();

    return parseComponentPreviewManifest(await response.json(), import.meta.env.BASE_URL);
  } catch {
    return new Map();
  }
}
