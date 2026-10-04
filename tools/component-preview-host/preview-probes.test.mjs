import {test} from 'node:test';
import assert from 'node:assert/strict';
import {probeSourcePreviews} from './preview-probes.mjs';

test('reports source resolution as unverified and records safe structural blocks',async()=>{
 const samples=['@8bitcn/button','@aceternity/text-generate-effect','@baselayer/button','@corecn/button'];
 const result=await probeSourcePreviews(samples,{
  now:'2026-10-04T06:15:00.000Z',
  load:async (registry,slug)=>{
   if(registry==='aceternity')throw Error('unreviewed-package: motion');
   if(registry==='baselayer')throw Error('source-file-too-large');
   return {mode:'upstream-demo',files:{'/App.tsx':{},'/index.tsx':{}},
    dependencies:{react:'18.3.1'}};
  }
 });
 assert.equal(result.schema,'registry-atlas-source-preview-probes/v1');
 assert.deepEqual(result.summary,{total:4,sourceResolved:2,blocked:2,unavailable:0});
 assert.deepEqual(result.items.map(item=>item.status),
  ['source-resolved','blocked','blocked','source-resolved']);
 assert.deepEqual(result.items[1].reason,'unreviewed-package');
 assert.equal(result.items[1].package,'motion');
 assert.equal(result.items[2].reason,'source-file-too-large');
 assert.equal(result.items[0].verification,'not-interaction-verified');
 assert.ok(!JSON.stringify(result).includes('App.tsx'));
});
test('treats manufactured smoke source as blocked, never resolved',async()=>{
 const report=await probeSourcePreviews(['@demo/button'],{
  load:async()=>({mode:'generated-smoke-example',files:{},dependencies:{}}),
 });
 assert.deepEqual(report.summary,{total:1,sourceResolved:0,blocked:1,unavailable:0});
 assert.equal(report.items[0].reason,'author-demo-required');
});
test('never records private errors as evidence or marks transient failures blocked',async()=>{
 const result=await probeSourcePreviews(['@corecn/button'],{
  now:'2026-10-04T06:15:00.000Z',
  load:async()=>{throw Error('ENOTFOUND PRIVATE /home/user/key');}
 });
 assert.deepEqual(result.summary,{total:1,sourceResolved:0,blocked:0,unavailable:1});
 assert.equal(result.items[0].reason,'source-retrieval-failed');
 assert.doesNotMatch(JSON.stringify(result),/PRIVATE|\/home\/user/);
});
test('validates exact identities and bounded deduplicated input',async()=>{
 await assert.rejects(()=>probeSourcePreviews(['@demo/../other']),/identity/i);
 await assert.rejects(()=>probeSourcePreviews(['@demo/button','@demo/button']),/duplicate/i);
 await assert.rejects(()=>probeSourcePreviews(Array(17).fill(0).map((_,i)=>'@demo/button'+i)),/limit/i);
});
