import { z } from "zod";

export interface BrowseSnapshot {
  pages: number;
  scrollY: number;
}

const snapshotSchema = z.strictObject({
  pages: z.number().int().min(1).max(5000),
  scrollY: z.number().min(0).max(20_000_000),
});

export function browseSnapshotKey(route: string): string {
  return "registry-atlas.browse.v1:" + route;
}

/** Only restore bounded, non-executable values from session storage. */
export function parseBrowseSnapshot(raw: string | null): BrowseSnapshot | null {
  if (!raw) return null;

  try {
    const value = snapshotSchema.safeParse(JSON.parse(raw));

    return value.success ? value.data : null;
  } catch {
    return null;
  }
}

type BrowseStorage = Pick<Storage, "getItem" | "setItem">;

/** Persistence is best-effort; failures never interrupt in-memory navigation. */
export function saveBrowseSnapshot(
  route: string,
  snapshot: BrowseSnapshot,
  storage: () => BrowseStorage | undefined,
): void {
  try {
    storage()?.setItem(browseSnapshotKey(route), JSON.stringify(snapshot));
  } catch {
    // Browsing still works with the in-memory route snapshot.
  }
}

export function readBrowseSnapshot(
  route: string,
  storage: () => BrowseStorage | undefined,
): BrowseSnapshot | null {
  try {
    return parseBrowseSnapshot(storage()?.getItem(browseSnapshotKey(route)) ?? null);
  } catch {
    return null;
  }
}
