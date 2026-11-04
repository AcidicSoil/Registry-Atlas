#!/usr/bin/env node
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { gunzipSync } from "node:zlib";
import { dirname } from "node:path";
import {
  extractItemImageCandidate,
  publicMediaUrl,
  validMediaResponse,
} from "./lib/source-media.mjs";

const SNAPSHOT = "public/data/registry-atlas.json.gz";

const OUTPUT = "public/data/source-media.json";

const REPORT = ".instance/source-media-audit.json";

const CONCURRENCY = 6;

const MAX_HTML_BYTES = 2 * 1024 * 1024;

function maxPagesArg(argv) {
  const raw = argv.find((arg) => arg.startsWith("--max-pages="))?.split("=")[1] ?? "50";
  const count = Number(raw);

  if (!Number.isSafeInteger(count) || count < 0)
    throw new Error("--max-pages must be a non-negative integer");

  return count;
}

async function boundedHtml(response) {
  if (
    !response.ok ||
    response.redirected ||
    !response.headers.get("content-type")?.includes("text/html")
  )
    return null;

  if (Number(response.headers.get("content-length")) > MAX_HTML_BYTES) return null;

  const reader = response.body?.getReader();

  if (!reader) return null;

  const chunks = [];
  let size = 0;

  try {
    while (true) {
      const { value, done } = await reader.read();

      if (done) break;
      size += value.byteLength;

      if (size > MAX_HTML_BYTES) return null;

      chunks.push(value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }

  const output = new Uint8Array(size);
  let cursor = 0;

  for (const chunk of chunks) {
    output.set(chunk, cursor);
    cursor += chunk.byteLength;
  }

  return new TextDecoder().decode(output);
}

export async function collectSourceMedia(pageUrl, fetchImpl = fetch) {
  if (!publicMediaUrl(pageUrl)) return { reason: "unsafe-source" };

  try {
    const response = await fetchImpl(pageUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(10000),
      headers: { accept: "text/html" },
    });

    const html = await boundedHtml(response);

    if (!html) return { reason: "unreadable-page" };

    const mediaUrl = extractItemImageCandidate(pageUrl, html);

    if (!mediaUrl) return { reason: "no-item-image" };

    const image = await fetchImpl(mediaUrl, {
      method: "HEAD",
      redirect: "manual",
      signal: AbortSignal.timeout(8000),
    });

    if (!validMediaResponse(image)) {
      const contentType = image.headers.get("content-type")?.split(";")[0];

      if (
        !image.ok ||
        image.redirected ||
        image.headers.get("content-length") !== null ||
        ![
          "image/png",
          "image/jpeg",
          "image/webp",
          "image/avif",
          "image/gif",
          "image/svg+xml",
        ].includes(contentType)
      )
        return { reason: "unverified-image" };

      const file = await fetchImpl(mediaUrl, {
        method: "GET",
        redirect: "manual",
        signal: AbortSignal.timeout(8000),
      });

      if (
        !file.ok ||
        file.redirected ||
        file.headers.get("content-type")?.split(";")[0] !== contentType ||
        Number(file.headers.get("content-length")) > 5 * 1024 * 1024 ||
        !file.body
      )
        return { reason: "unverified-image" };

      const reader = file.body.getReader();
      let bytes = 0;

      try {
        while (true) {
          const { value, done } = await reader.read();

          if (done) break;
          bytes += value.byteLength;

          if (bytes > 5 * 1024 * 1024) return { reason: "oversized-image" };
        }
      } finally {
        await reader.cancel().catch(() => {});
      }

      if (!bytes) return { reason: "empty-image" };
    }

    return {
      mediaUrl,
      method: "page-metadata",
      checkedAt: new Date().toISOString(),
    };
  } catch {
    return { reason: "network-error" };
  }
}

async function main(argv = process.argv.slice(2)) {
  const refresh = argv.includes("--refresh");
  const maxPages = maxPagesArg(argv);
  const snapshot = JSON.parse(gunzipSync(await readFile(SNAPSHOT)).toString("utf8"));

  const sourceUrls = [
    ...new Set([
      ...Object.values(snapshot.sourcePageManifest.pages).map((page) => page.url),
      ...Object.values(snapshot.itemRoutes ?? {}).map((route) => route.url),
    ]),
  ]
    .filter((url) => publicMediaUrl(url))
    .sort();

  const eligible = new Set(sourceUrls);

  const previous = await readFile(OUTPUT, "utf8")
    .then(JSON.parse)
    .catch(() => null);

  if (
    previous &&
    (previous.schemaVersion !== 1 || !previous.previews || Array.isArray(previous.previews))
  )
    throw new Error("Invalid existing source-media manifest; refusing to overwrite");

  const retained = Object.fromEntries(
    Object.entries(previous?.previews ?? {}).filter(
      ([page, record]) =>
        eligible.has(page) &&
        record &&
        publicMediaUrl(String(record.mediaUrl ?? "")) &&
        ["page-metadata", "verified-legacy"].includes(record.method) &&
        Number.isFinite(Date.parse(record.checkedAt)),
    ),
  );

  const candidates = sourceUrls.filter((url) => refresh || !retained[url]).slice(0, maxPages);
  const rejectionCounts = Object.create(null);
  let accepted = 0;

  for (let start = 0; start < candidates.length; start += CONCURRENCY) {
    const batch = candidates.slice(start, start + CONCURRENCY);
    const results = await Promise.all(batch.map((url) => collectSourceMedia(url)));

    batch.forEach((url, index) => {
      const result = results[index];

      if ("mediaUrl" in result) {
        retained[url] = result;
        accepted += 1;
      } else {
        rejectionCounts[result.reason] = (rejectionCounts[result.reason] ?? 0) + 1;
      }
    });
  }

  const counts = new Map();

  for (const record of Object.values(retained))
    counts.set(record.mediaUrl, (counts.get(record.mediaUrl) ?? 0) + 1);

  const previews = Object.fromEntries(
    Object.entries(retained)
      .filter(([, record]) => counts.get(record.mediaUrl) === 1)
      .sort(([a], [b]) => a.localeCompare(b)),
  );

  const duplicates = Object.keys(retained).length - Object.keys(previews).length;

  await mkdir(dirname(OUTPUT), { recursive: true });
  await mkdir(dirname(REPORT), { recursive: true });
  await writeFile(OUTPUT, JSON.stringify({ schemaVersion: 1, previews }, null, 2) + "\n");

  const report = {
    eligibleSourcePages: sourceUrls.length,
    examined: candidates.length,
    accepted,
    rejected: rejectionCounts,
    duplicateMediaRejected: duplicates,
    verifiedPreviews: Object.keys(previews).length,
    remainingUnexamined: sourceUrls.filter((url) => !previews[url]).length,
    output: OUTPUT,
  };

  await writeFile(REPORT, JSON.stringify(report, null, 2) + "\n");
  console.log(JSON.stringify(report));
}

if (process.argv[1]?.endsWith("/collect-source-media.mjs"))
  main().catch((error) => {
    console.error("SOURCE_MEDIA_COLLECTION_FAILED", error.message);
    process.exitCode = 1;
  });
