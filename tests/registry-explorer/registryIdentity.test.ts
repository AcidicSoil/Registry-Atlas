import { describe, expect, it } from 'vitest';
import {
  nextRegistryIconCandidate,
  registryIconCandidates,
  renderRegistryIcon,
} from '../../src/registry-explorer/ui/registryIdentity';

describe('registry identity', () => {
  it('builds a bounded same-origin icon candidate chain from a verified homepage', () => {
    expect(registryIconCandidates('https://ui.example.com/docs')).toEqual([
      'https://ui.example.com/favicon.ico',
      'https://ui.example.com/favicon.svg',
      'https://ui.example.com/icon.svg',
      'https://ui.example.com/icon.png',
      'https://ui.example.com/apple-touch-icon.png',
    ]);
  });

  it.each([
    'javascript:alert(1)',
    'https://user:pass@example.com',
    '//example.com',
    'http://example.com',
  ])('does not build icon candidates from an unsafe homepage: %s', homepage => {
    expect(registryIconCandidates(homepage)).toEqual([]);
  });

  it('prefers a discovered source icon before conventional origin favicon paths', () => {
    expect(registryIconCandidates(
      'https://ui.example.com/docs',
      'https://cdn.example.com/brand/icon.svg',
    )).toEqual([
      'https://cdn.example.com/brand/icon.svg',
      'https://ui.example.com/favicon.ico',
      'https://ui.example.com/favicon.svg',
      'https://ui.example.com/icon.svg',
      'https://ui.example.com/icon.png',
      'https://ui.example.com/apple-touch-icon.png',
    ]);
  });

  it.each([
    'javascript:alert(1)',
    '//cdn.example.com/icon.svg',
    'https://user:pass@cdn.example.com/icon.svg',
    'http://cdn.example.com/icon.svg',
  ])('ignores an unsafe discovered icon candidate: %s', iconUrl => {
    expect(registryIconCandidates('https://ui.example.com', iconUrl)[0])
      .toBe('https://ui.example.com/favicon.ico');
  });

  it('advances through icon candidates and stops after the final candidate', () => {
    const candidates = registryIconCandidates('https://example.com');
    expect(nextRegistryIconCandidate(candidates, 0)).toEqual({
      index: 1,
      src: 'https://example.com/favicon.svg',
    });
    expect(nextRegistryIconCandidate(candidates, candidates.length - 1)).toBeNull();
  });

  it('renders a stable icon shell with a deterministic fallback and candidate metadata', () => {
    const html = renderRegistryIcon({
      name: '@animate-ui',
      url: 'https://animate-ui.com',
    }, 'registry-icon registry-icon-directory');

    expect(html).toContain('class="registry-icon registry-icon-directory"');
    expect(html).toContain('class="registry-icon-fallback">A</span>');
    expect(html).toContain('src="https://animate-ui.com/favicon.ico"');
    expect(html).toContain('data-registry-icon-image');
    expect(html).toContain('data-registry-icon-index="0"');
    expect(html).toContain('https://animate-ui.com/apple-touch-icon.png');
  });

  it('renders a discovered source icon as the first image candidate', () => {
    const html = renderRegistryIcon({
      name: '@auth0',
      url: 'https://components.auth0.com',
      iconUrl: 'https://cdn.auth0.com/website/favicon.svg',
    }, 'registry-icon registry-icon-directory');

    expect(html).toContain('src="https://cdn.auth0.com/website/favicon.svg"');
    expect(html).toContain('&quot;https://components.auth0.com/favicon.ico&quot;');
  });
});
