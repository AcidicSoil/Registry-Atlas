import {describe,expect,it} from 'vitest';
// @ts-expect-error Node-only shared preview batch command has no declaration.
import {compileCachedRegistryBatch} from '../../tools/component-preview-host/batch-preview.mjs';
// @ts-expect-error Standalone Node source intake command has no browser TS declaration.
import {planRegistryIntake} from '../../tools/component-preview-host/ingest-batch.mjs';

describe('bounded shared-preview batch compilation',()=>{
 it('plans deterministic bounded official intake without blocks/pages or duplicates',()=>{
   const catalog={registries:{'@alpha':[
     {name:'b',type:'registry:component'},{name:'a',type:'registry:component'},
     {name:'b',type:'registry:component'},{name:'page',type:'registry:block'},
     {name:'c',type:'registry:component'}]}};
   expect(planRegistryIntake(catalog,'alpha',{limit:2})).toMatchObject({
     slugs:['a','b'],nextCursor:'b',eligible:3,
   });
   expect(planRegistryIntake(catalog,'alpha',{limit:2,after:'b'}).slugs).toEqual(['c']);
   expect(()=>planRegistryIntake(catalog,'alpha',{limit:100})).toThrow();
   expect(()=>planRegistryIntake(catalog,'missing',{limit:2})).toThrow();
 });
 it('compiles multiple cached items without editing the verified manifest',async ()=>{
   const r=await compileCachedRegistryBatch({registry:'8bitcn',only:['button','input'],limit:2});
   expect(r.summary).toMatchObject({attempted:2,compiledUnverified:2,blocked:0});
   expect(r.rows).toHaveLength(2);
   for(const item of r.rows)expect(item).toMatchObject({status:'built-unverified',namespace:'@8bitcn'});
   expect(r.rows.every((row:{path?:string})=>!('path' in row))).toBe(true);
 },20000);
 it('rejects unknown registries and invalid limits rather than fetching or scanning unlimited sources',async ()=>{
   await expect(compileCachedRegistryBatch({registry:'other',limit:2})).rejects.toThrow();
   await expect(compileCachedRegistryBatch({registry:'8bitcn',limit:1000})).rejects.toThrow();
   await expect(compileCachedRegistryBatch({registry:'8bitcn',limit:1,only:['../evil']})).rejects.toThrow();
 });
});
