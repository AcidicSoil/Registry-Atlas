import { describe, expect, it } from 'vitest';
// @ts-expect-error The browser-only test tsconfig omits Node builtin declarations; Vitest runs in Node.
import { existsSync, readFileSync } from 'node:fs';
// @ts-expect-error The browser-only test tsconfig omits Node builtin declarations.
import { createHash } from 'node:crypto';
import { renderComponentPreview } from '../../src/registry-explorer/ui/componentPreview';
import { renderCatalogComponentCard } from '../../src/registry-explorer/ui/catalogComponentsView';
import type { CatalogComponent } from '../../src/registry-explorer/core/catalogQuery';

describe('reviewed sandboxed component examples', () => {
  it('distinguishes the browser-verified original source build from handwritten fixtures', () => {
    const path = 'src/registry-explorer/data/component-demo-manifest.json';
    expect(existsSync(path)).toBe(true);
    const manifest = JSON.parse(readFileSync(path, 'utf8'));
    expect(manifest.schema).toBe('registry-atlas-component-demos/v1');
    expect(manifest.items).toHaveLength(11);
    for (const slug of ['button','input','checkbox','switch','slider','textarea','toggle','tabs','accordion','collapsible']) {
      const original=manifest.items.find((entry: {slug:string}) => entry.slug === slug);
      const originalSource=readFileSync('tools/component-preview-host/sources/8bitcn/'+slug+'.json');
      expect(original).toMatchObject({namespace:'@8bitcn',slug,kind:'upstream-built',
        status:'interaction-verified',sourceSha256:createHash('sha256').update(originalSource).digest('hex')});
      expect(original.path).toMatch(/^\/Registry-Atlas\/component-demos\/generated\/[a-f0-9]{64}\/index\.html$/);
    }
    expect(manifest.items.find((entry: {slug:string}) => entry.slug === 'card')).toMatchObject({
      namespace:'@8bitcn',slug:'card',kind:'source-informed-fixture',status:'interaction-verified',
      path:'/Registry-Atlas/component-demos/8bitcn/index.html',
    });
  });

  it.each(['button','card','input','checkbox','switch','slider','textarea','toggle','tabs','accordion','collapsible'])('uses a sandboxed local interactive page for 8bitcn %s', slug => {
    const rendered = renderComponentPreview('@8bitcn', slug, 'card') ?? '';
    expect(rendered).toContain('<iframe');
    expect(rendered).toContain('sandbox="allow-scripts"');
    expect(rendered).toContain('data-component-demo="@8bitcn/' + slug + '"');
    const entries=JSON.parse(readFileSync('src/registry-explorer/data/component-demo-manifest.json','utf8')).items;
    const expected=entries.find((item:{namespace:string;slug:string})=>
      item.namespace==='@8bitcn'&&item.slug===slug)?.path;
    expect(rendered).toContain(expected+'?item='+slug+'&amp;mode=card');
    expect(rendered).not.toContain('allow-same-origin');
    expect(rendered).not.toContain('<img');
    expect(renderComponentPreview('@8bitcn', slug, 'detail')).toContain('&amp;mode=detail');
  });

  it('checks each verified upstream bundle against its content-addressed path and no-network CSP', () => {
    const entries=JSON.parse(readFileSync('src/registry-explorer/data/component-demo-manifest.json','utf8')).items;
    for(const item of entries.filter((entry:{kind:string})=>entry.kind==='upstream-built')){
      const file='public/'+item.path.slice('/Registry-Atlas/'.length);
      const html=readFileSync(file,'utf8');
      const hash=createHash('sha256').update(html).digest('hex');
      expect(item.path).toContain('/generated/'+hash+'/index.html');
      expect(html).toContain("connect-src 'none'");
      expect(html).toContain("form-action 'none'");
      expect(html).not.toContain('unsafe-eval');
      expect(item.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
    }
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

  it('renders a reviewed functional demo before an independently accessible visual reference', () => {
    const component = {
      namespace: '@8bitcn', slug: 'button', displayName: '8-bit Button',
      routePath: '/Registry-Atlas/@8bitcn/components/button',
      visualReference: {
        imageUrl: '/Registry-Atlas/data/previews/8bitcn/button.jpg',
        officialPage: 'https://www.8bitcn.com/docs/components/button',
      },
    } as CatalogComponent;
    const html = renderCatalogComponentCard(component);
    expect(html).toContain('data-component-demo="@8bitcn/button"');
    expect(html).toContain('src="/Registry-Atlas/data/previews/8bitcn/button.jpg"');
    expect(html).toContain('View original');
    expect(html.indexOf('<iframe')).toBeLessThan(html.indexOf('catalog-component-preview-image'));
    expect(html.indexOf('</iframe>')).toBeLessThan(html.indexOf('catalog-component-open-live'));
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
    expect(html).not.toContain('registry-atlas:component-state');
    expect(html).toContain('registry-atlas:component-open');
  });
});
