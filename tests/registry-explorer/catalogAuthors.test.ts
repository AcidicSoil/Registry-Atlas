import {describe,it,expect} from 'vitest';
import {buildAuthorDirectory} from '../../src/registry-explorer/core/catalogAuthors';
import {renderCatalogAuthors} from '../../src/registry-explorer/ui/catalogAuthorsView';
import type {RegistryCatalogIndex} from '../../src/registry-explorer/core/registry.schema';

const index={
 meta:{registry_count:2,item_count:7},
 registries:{
  '@alpha':[
   {name:'button',type:'registry:ui',author:'Alice'},
   {name:'button',type:'registry:ui',author:'Alice'},
   {name:'theme',type:'registry:theme',author:'Alice'},
   {name:'card',type:'registry:component',author:'Bob'},
   {name:'safe',type:'registry:component',author:'<script>alert(1)</script>'},
  ],
  '@beta':[
   {name:'button',type:'registry:block',author:'Alice'},
   {name:'anonymous',type:'registry:ui'},
  ],
 },
} satisfies RegistryCatalogIndex;
describe('catalog author attribution',()=>{
 it('deduplicates exact catalog identities without inventing author popularity',()=>{
  expect(buildAuthorDirectory(index)).toEqual([
   {name:'Alice',componentCount:2},
   {name:'<script>alert(1)</script>',componentCount:1},
   {name:'Bob',componentCount:1},
  ]);
 });
 it('filters real author metadata, escapes names and paginates without inferred profiles',()=>{
  const body={innerHTML:''} as HTMLElement,header={innerHTML:''} as HTMLElement;
  renderCatalogAuthors(header,body,buildAuthorDirectory(index),{search:'script',page:99});
  expect(header.innerHTML).toContain('Not 21st.dev account profiles or popularity rankings');
  expect(body.innerHTML).toContain('class="catalog-component-grid catalog-author-grid"');
  expect(body.innerHTML).toContain('class="catalog-component-card"');
  expect(body.innerHTML).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
  expect(body.innerHTML).not.toContain('<script>');
  expect(body.innerHTML).not.toContain('Bob');
  renderCatalogAuthors(header,body,[],{search:''});
  expect(body.innerHTML).toContain('No attributed components');
 });
});
