import {describe,expect,it} from 'vitest';
import {renderCatalogComponentCard} from '../../src/registry-explorer/ui/catalogComponentsView';
import type {CatalogComponent} from '../../src/registry-explorer/core/catalogQuery';

const item={
  namespace:'@alpha',slug:'button',displayName:'Button',type:'registry:component',
  routePath:'/Registry-Atlas/@alpha/components/button',reviewed:false,
  registry:{name:'@alpha',url:'https://alpha.example',description:'Component library'},item:{name:'button',type:'registry:component'},categories:[],
  id:'@alpha:button',
} as CatalogComponent;

describe('reference-gallery cards',()=>{
  it('keeps the full card link without a fabricated visual placeholder',()=>{
    const html=renderCatalogComponentCard(item);
    expect(html).toContain('catalog-component-open');
    expect(html).toContain('href="/Registry-Atlas/@alpha/components/button"');
    expect(html).not.toContain('aria-label="Visual reference not yet available"');
    expect(html).not.toContain('catalog-component-unavailable');
    expect(html).not.toContain('View official source');
    expect(html).not.toContain('>Visual reference not yet available</div>');
  });
  it('exposes the exact reviewed upstream source of a working demo when no page image was observed',()=>{
    const html=renderCatalogComponentCard({...item,namespace:'@8bitcn',slug:'audio-settings',
      displayName:'Audio Settings',
      registry:{...item.registry,name:'@8bitcn',url:'https://www.8bitcn.com/'},
      routePath:'/Registry-Atlas/@8bitcn/components/audio-settings'});
    expect(html).toContain('data-component-demo="@8bitcn/audio-settings"');
    expect(html).toContain('href="https://www.8bitcn.com/docs/components/audio-settings"');
    expect(html).toContain('View original');
    expect(html).not.toContain('href="https://www.8bitcn.com/r/audio-settings.json"');
    expect(html).toContain('rel="noreferrer noopener"');
  });
  it('renders the verified image and its exact independent official link',()=>{
    const html=renderCatalogComponentCard({...item,visualReference:{
      imageUrl:'/Registry-Atlas/data/previews/alpha/button.jpg',
      officialPage:'https://alpha.example/docs/button',
    }});
    expect(html).toContain('class="catalog-component-preview-image"');
    expect(html).toContain('href="https://alpha.example/docs/button"');
    expect(html).toContain('View original');
  });
});
