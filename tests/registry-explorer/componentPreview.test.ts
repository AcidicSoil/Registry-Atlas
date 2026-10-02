import { describe, expect, it } from 'vitest';
// @ts-expect-error The browser-only test tsconfig omits Node builtin declarations; Vitest runs in Node.
import { readFileSync } from 'node:fs';
import { renderComponentPreview } from '../../src/registry-explorer/ui/componentPreview';
import { renderCatalogComponentCard } from '../../src/registry-explorer/ui/catalogComponentsView';
import type { CatalogComponent } from '../../src/registry-explorer/core/catalogQuery';

describe('reviewed sandboxed component examples', () => {
  it.each(['button', 'card', 'input'])('uses a sandboxed local interactive page for 8bitcn %s', slug => {
    const rendered = renderComponentPreview('@8bitcn', slug, 'card') ?? '';
    expect(rendered).toContain('<iframe');
    expect(rendered).toContain('sandbox="allow-scripts"');
    expect(rendered).toContain('data-component-demo="@8bitcn/' + slug + '"');
    expect(rendered).toContain('component-demos/8bitcn/index.html?item=' + slug + '&amp;mode=card');
    expect(rendered).not.toContain('allow-same-origin');
    expect(rendered).not.toContain('<img');
    expect(renderComponentPreview('@8bitcn', slug, 'detail')).toContain('&amp;mode=detail');
  });

  it('never treats an arbitrary URL or unreviewed registry as runnable', () => {
    expect(renderComponentPreview('@unknown', 'button', 'card')).toBeNull();
    expect(renderComponentPreview('@8bitcn', '../button', 'card')).toBeNull();
    expect(renderComponentPreview('@8bitcn', 'unknown', 'detail')).toBeNull();
  });

  it('keeps a live card clickable without nesting interaction controls inside the anchor', () => {
    const component = {
      namespace: '@8bitcn', slug: 'input',
      displayName: '8-bit Input',
      routePath: '/Registry-Atlas/@8bitcn/components/input',
    } as CatalogComponent;
    const html = renderCatalogComponentCard(component);
    expect(html).toContain('<iframe');
    expect(html).toContain('<a class="catalog-component-open catalog-component-open-live"');
    expect(html).toContain('href="/Registry-Atlas/@8bitcn/components/input"');
    expect(html.indexOf('</iframe>')).toBeLessThan(html.indexOf('<a class='));
    expect(html).not.toContain('<img');
    expect(html).not.toContain('href="https:');
  });

  it('only serves reviewed interaction fixtures with no network or form submissions', () => {
    const html = readFileSync('public/component-demos/8bitcn/index.html', 'utf8');
    expect(html).toContain('manually reviewed, isolated native interaction fixtures');
    expect(html).toContain("default-src 'none'");
    expect(html).toContain("form-action 'none'");
    expect(html).toContain('id="field"');
    expect(html).toContain('id="action"');
    expect(html).toContain('addEventListener("click"');
    expect(html).toContain('addEventListener("input"');
    expect(html).not.toContain('<img');
    expect(html).not.toContain('fetch(');
    expect(html).not.toContain('src="https:');
  });
});
