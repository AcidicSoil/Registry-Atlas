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
  it('keeps the full card link and honest empty visual without a repeated text block',()=>{
    const html=renderCatalogComponentCard(item);
    expect(html).toContain('catalog-component-open');
    expect(html).toContain('href="/Registry-Atlas/@alpha/components/button"');
    expect(html).toContain('aria-label="Visual reference not yet available"');
    expect(html).toContain('catalog-component-unavailable');
    expect(html).not.toContain('>Visual reference not yet available</div>');
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
