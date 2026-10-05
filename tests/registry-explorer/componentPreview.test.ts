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
    expect(manifest.items.length).toBe(26);
    expect(new Set(manifest.items.map((item:{namespace:string;slug:string})=>item.namespace+'/'+item.slug)).size)
      .toBe(manifest.items.length);
    for (const slug of ['button','input','checkbox','switch','slider','textarea','toggle','tabs','accordion','collapsible','dialog','dropdown-menu','radio-group','select','tooltip','scroll-area','faq1','faq3','difficulty-select','audio-settings','game-faq1']) {
      const original=manifest.items.find((entry: {slug:string}) => entry.slug === slug);
      const originalSource=readFileSync('tools/component-preview-host/sources/8bitcn/'+slug+'.json');
      expect(original).toMatchObject({namespace:'@8bitcn',slug,kind:'upstream-built',
        status:'interaction-verified',sourceSha256:createHash('sha256').update(originalSource).digest('hex')});
      expect(original.path).toMatch(/^\/Registry-Atlas\/component-demos\/generated\/[a-f0-9]{64}\/index\.html$/);
    }
    for(const slug of ['accordion','checkbox','collapsible','select','switch']){
      const original=manifest.items.find((entry: {namespace:string;slug:string})=>
        entry.namespace==='@watermelon'&&entry.slug===slug);
      const official=readFileSync('tools/component-preview-host/sources/watermelon/'+slug+'.json');
      expect(original).toMatchObject({namespace:'@watermelon',slug,kind:'upstream-built',
        status:'interaction-verified',sourceSha256:createHash('sha256').update(official).digest('hex')});
      expect(renderComponentPreview('@watermelon',slug,'card')).toContain('sandbox="allow-scripts"');
    }
    expect(manifest.items.some((entry: {kind:string}) => entry.kind === 'source-informed-fixture')).toBe(false);
  });

  it.each(['button','input','checkbox','switch','slider','textarea','toggle','tabs','accordion','collapsible','dialog','dropdown-menu','radio-group','select','tooltip','scroll-area','faq1','faq3','difficulty-select','audio-settings','game-faq1'])('uses a sandboxed local interactive page for 8bitcn %s', slug => {
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
      registry: {name:'@8bitcn',url:'https://www.8bitcn.com/',description:'8bitcn'},
    } as CatalogComponent;
    const html = renderCatalogComponentCard(component);
    expect(html).toContain('<iframe');
    expect(html).toContain('<a class="catalog-component-open catalog-component-open-live"');
    expect(html).toContain('href="/Registry-Atlas/@8bitcn/components/input"');
    expect(html.indexOf('</iframe>')).toBeLessThan(html.indexOf('<a class='));
    expect(html).not.toContain('<img');
    const primaryLinkStart=html.indexOf('<a class="catalog-component-open');
    const primaryLinkEnd=html.indexOf('</a>',primaryLinkStart);
    expect(html.slice(primaryLinkStart,primaryLinkEnd)).not.toContain('href="https:');
    expect(html).toContain('href="https://www.8bitcn.com/docs/components/input"');
    expect(html.indexOf('View original')).toBeGreaterThan(primaryLinkEnd);
    expect(html).not.toContain('href="https://www.8bitcn.com/r/input.json"');
  });

  it('renders a reviewed functional demo before an independently accessible visual reference', () => {
    const component = {
      namespace: '@8bitcn', slug: 'button', displayName: '8-bit Button',
      routePath: '/Registry-Atlas/@8bitcn/components/button',
      registry: {name:'@8bitcn',url:'https://www.8bitcn.com/',description:'8bitcn'},
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

  it('never offers the removed handwritten card as a functional preview',()=>{
    expect(renderComponentPreview('@8bitcn','card','card')).toBeNull();
    expect(readFileSync('src/registry-explorer/data/component-demo-manifest.json','utf8'))
      .not.toContain('source-informed-fixture');
  });
});
