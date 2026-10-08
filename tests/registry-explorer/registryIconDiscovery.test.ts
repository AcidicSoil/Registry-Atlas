import { describe, expect, it, vi } from 'vitest';
// @ts-ignore Standalone Node ESM script intentionally has no TypeScript declaration.
import * as registryIconDiscovery from '../../scripts/discover-registry-icons.mjs';

const {
  discoverRegistryIcon,
  extractHtmlIconCandidates,
  extractManifestIconCandidates,
} = registryIconDiscovery;

describe('registry icon discovery', () => {
  it('extracts and ranks explicit homepage icon links without inventing paths', () => {
    const candidates = extractHtmlIconCandidates(
      '<link rel="icon" href="/favicon-32.png" sizes="32x32">'
        + '<link rel="icon" href="/brand.svg" type="image/svg+xml">'
        + '<link rel="apple-touch-icon" href="/apple.png" sizes="180x180">',
      'https://example.com/docs',
    );

    expect(candidates.map((candidate: any) => candidate.url)).toEqual([
      'https://example.com/brand.svg',
      'https://example.com/apple.png',
      'https://example.com/favicon-32.png',
    ]);
    expect(candidates.every((candidate: any) => candidate.source === 'html-link')).toBe(true);
  });

  it('extracts manifest icons and prefers scalable or larger source assets', () => {
    const candidates = extractManifestIconCandidates({
      icons: [
        { src: '/icon-64.png', sizes: '64x64', type: 'image/png' },
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml' },
        { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      ],
    }, 'https://example.com/manifest.webmanifest');

    expect(candidates.map((candidate: any) => candidate.url)).toEqual([
      'https://example.com/icon.svg',
      'https://example.com/icon-192.png',
      'https://example.com/icon-64.png',
    ]);
    expect(candidates.every((candidate: any) => candidate.source === 'manifest')).toBe(true);
  });

  it('uses homepage links first, then a linked manifest, with no screenshot/browser requirement', async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === 'https://example.com/') {
        return new Response(
          '<html><head><link rel="manifest" href="/site.webmanifest"></head></html>',
          { status: 200, headers: { 'content-type': 'text/html' } },
        );
      }
      if (url === 'https://example.com/site.webmanifest') {
        return new Response(JSON.stringify({
          icons: [{ src: '/brand-512.png', sizes: '512x512', type: 'image/png' }],
        }), { status: 200, headers: { 'content-type': 'application/manifest+json' } });
      }
      throw new Error(`unexpected fetch: ${url}`);
    });

    await expect(discoverRegistryIcon({
      namespace: '@example',
      homepage: 'https://example.com',
      fetchImpl,
      timeoutMs: 1000,
      observedAt: '2026-10-07T00:00:00.000Z',
    })).resolves.toMatchObject({
      namespace: '@example',
      homepage: 'https://example.com/',
      url: 'https://example.com/brand-512.png',
      source: 'manifest',
      observedAt: '2026-10-07T00:00:00.000Z',
    });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('returns a source-backed missing result when the homepage publishes no icon metadata', async () => {
    const result = await discoverRegistryIcon({
      namespace: '@plain',
      homepage: 'https://plain.example',
      fetchImpl: async () => new Response('<html><head></head></html>', { status: 200 }),
      timeoutMs: 1000,
      observedAt: '2026-10-07T00:00:00.000Z',
    });

    expect(result).toMatchObject({
      namespace: '@plain',
      homepage: 'https://plain.example/',
      url: null,
      source: 'none',
    });
  });
});
