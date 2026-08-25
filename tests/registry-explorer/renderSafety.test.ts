import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  renderExternalLink,
  renderSafeExternalImage,
  toSafeExternalUrl,
} from '../../src/registry-explorer/ui/renderSafety';

describe('renderSafety', () => {
  it('escapes HTML text and attribute characters', () => {
    expect(escapeHtml(`A&B <tag attr="value"> it's`)).toBe(
      'A&amp;B &lt;tag attr=&quot;value&quot;&gt; it&#39;s',
    );
  });

  it('accepts only HTTP and HTTPS URLs', () => {
    expect(toSafeExternalUrl('https://example.com/path?q=1')?.href).toBe('https://example.com/path?q=1');
    expect(toSafeExternalUrl('http://example.com/raw/button.json')?.href).toBe('http://example.com/raw/button.json');
    expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeExternalUrl('data:text/html,<h1>x</h1>')).toBeNull();
    expect(toSafeExternalUrl('//example.com/path')).toBeNull();
    expect(toSafeExternalUrl('ftp://example.com/path')).toBeNull();
    expect(toSafeExternalUrl('not a url')).toBeNull();
  });

  it('renders safe external anchors with escaped hrefs and labels', () => {
    const html = renderExternalLink('https://example.com/?a=1&b=2', 'Visit "site"');
    expect(html).toContain('href="https://example.com/?a=1&amp;b=2"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain('Visit &quot;site&quot;');
  });

  it('renders unavailable copy for invalid external links', () => {
    expect(renderExternalLink('javascript:alert(1)', 'Visit')).toBe(
      'Link unavailable: unsupported URL protocol.',
    );
  });

  it('renders safe preview images and rejects unsafe image URLs', () => {
    expect(renderSafeExternalImage('javascript:alert(1)', 'Button', 'specimen')).not.toContain('<img');
    const html = renderSafeExternalImage('https://example.com/button.png', '<Button>', 'specimen');
    expect(html).toContain('<img');
    expect(html).toContain('alt="&lt;Button&gt;"');
    expect(html).toContain('loading="lazy"');
    expect(html).toContain('decoding="async"');
    expect(html).toContain('referrerpolicy="no-referrer"');
  });
});
