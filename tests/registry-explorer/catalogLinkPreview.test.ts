import { describe, expect, it } from 'vitest';
import { renderSourceLinkPreview, sourceLinkPreview } from '../../src/registry-explorer/ui/catalogLinkPreview';

describe('upstream source previews', () => {
  it('shows the published SVG component, not a Registry Atlas page screenshot', () => {
    const preview = sourceLinkPreview('https://logoforge.terravidhal.me/logos/dotnet');

    expect(preview).toEqual({
      src: 'https://logoforge.terravidhal.me/logos/dotnet/icon.svg',
      hostname: 'logoforge.terravidhal.me',
    });

    if (!preview) return;

    const html = renderSourceLinkPreview(preview, '.NET logo');

    expect(html).toContain('logos/dotnet/icon.svg');
    expect(html).toContain('Component preview');
    expect(html).not.toContain('Registry Atlas');
    expect(html).not.toContain('api.microlink.io');
    expect(html).not.toContain('<iframe');
  });

  it('does not mistake an upstream documentation page for a component visual', () => {
    expect(sourceLinkPreview('https://example.com/components/clock')).toBeNull();
    expect(sourceLinkPreview(
      'https://www.spaceui.one/primitives/aspect-ratio#example-11-square-aspect-ratio',
    )).toBeNull();
  });

  it('uses only item-specific upstream visuals for tested source families', () => {
    expect(sourceLinkPreview('https://keylineicons.com/icons/a-arrow-down')).toEqual({
      src: 'https://keylineicons.com/icons/a-arrow-down/opengraph-image/card',
      hostname: 'keylineicons.com',
    });

    expect(sourceLinkPreview('https://animateicons.in/icons/huge/activity')).toEqual({
      src: 'https://animateicons.in/icons/huge/activity/opengraph-image',
      hostname: 'animateicons.in',
    });

    expect(sourceLinkPreview('https://animateicons.in/icons/lucide/a-arrow-down')?.src)
      .toBe('https://animateicons.in/icons/lucide/a-arrow-down/opengraph-image');

    expect(sourceLinkPreview('https://shadcnblocks.com/block/about1')).toEqual({
      src: 'https://cdn.shadcnblocks.com/shadcnblocks/screenshots/block/about1-4x3.webp',
      hostname: 'shadcnblocks.com',
    });
  });

  it('rejects generic marketing cards and unverified route families', () => {
    expect(sourceLinkPreview('https://keylineicons.com/icons/sharp/accessibility')).toBeNull();
    expect(sourceLinkPreview('https://shadcnblocks.com/component/button/button1')).toBeNull();
    expect(sourceLinkPreview('https://uiable.com/components/button')).toBeNull();
    expect(sourceLinkPreview('https://reui.io/docs/components/button')).toBeNull();
    expect(sourceLinkPreview('https://animateicons.in/icons/unknown/activity')).toBeNull();
  });

  it('renders a verified direct image link without routing through Atlas', () => {
    expect(sourceLinkPreview('https://assets.example.com/components/button.webp')).toEqual({
      src: 'https://assets.example.com/components/button.webp',
      hostname: 'assets.example.com',
    });
  });

  it('rejects insecure and non-public source URLs', () => {
    expect(sourceLinkPreview('javascript:alert(1)')).toBeNull();
    expect(sourceLinkPreview('http://example.com/components/button')).toBeNull();
    expect(sourceLinkPreview('https://localhost/secret')).toBeNull();
    expect(sourceLinkPreview('https://127.0.0.1/private')).toBeNull();
    expect(sourceLinkPreview('https://[::1]/private.svg')).toBeNull();
    expect(sourceLinkPreview('//evil.example.com')).toBeNull();
  });

  it('escapes untrusted labels and does not insert executable markup', () => {
    const preview = sourceLinkPreview('https://logoforge.terravidhal.me/logos/dotnet');

    if (!preview) return;

    const html = renderSourceLinkPreview(preview, '<script>alert(1)</script>');

    expect(html).toContain('&lt;script&gt;alert(1)&lt;/script&gt; visual');
    expect(html).not.toContain('<script>');
  });
});
