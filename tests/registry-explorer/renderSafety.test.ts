import { describe, expect, it } from 'vitest';
import {
  escapeHtml,
  renderExternalLink,
  toSafeExternalUrl,
} from '../../src/registry-explorer/ui/renderSafety';

describe('renderSafety', () => {
  it('escapes HTML text and attribute characters', () => {
    expect(escapeHtml(`A&B <tag attr="value"> it's`)).toBe(
      'A&amp;B &lt;tag attr=&quot;value&quot;&gt; it&#39;s'
    );
  });

  it('accepts HTTP and HTTPS URLs', () => {
    expect(toSafeExternalUrl('https://example.com/path?q=1')?.href).toBe(
      'https://example.com/path?q=1'
    );
    expect(toSafeExternalUrl('http://example.com/raw/button.json')?.href).toBe(
      'http://example.com/raw/button.json'
    );
  });

  it('rejects unsafe and malformed URLs', () => {
    expect(toSafeExternalUrl('javascript:alert(1)')).toBeNull();
    expect(toSafeExternalUrl('data:text/html,<h1>x</h1>')).toBeNull();
    expect(toSafeExternalUrl('//example.com/path')).toBeNull();
    expect(toSafeExternalUrl('ftp://example.com/path')).toBeNull();
    expect(toSafeExternalUrl('not a url')).toBeNull();
  });

  it('renders safe external anchors with escaped hrefs and labels', () => {
    const html = renderExternalLink('https://example.com/?a=1&b=2', 'Visit "site"');

    expect(html).toContain('<a ');
    expect(html).toContain('href="https://example.com/?a=1&amp;b=2"');
    expect(html).toContain('target="_blank"');
    expect(html).toContain('rel="noreferrer"');
    expect(html).toContain('Visit &quot;site&quot;');
  });

  it('renders unavailable copy for invalid external links', () => {
    expect(renderExternalLink('javascript:alert(1)', 'Visit')).toBe(
      'Link unavailable: unsupported URL protocol.'
    );
  });
});
