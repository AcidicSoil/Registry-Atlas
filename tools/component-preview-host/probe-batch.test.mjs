import {test} from 'node:test';
import {parseFlags} from '../../scripts/run-preview-probe-batches.mjs';
import assert from 'node:assert/strict';
import {planProbeBatch, runProbeBatch, parseProbeJournal, groupProbeEvidence,runProbeSweep} from './probe-batch.mjs';

const rows=[
 {namespace:'@a',slug:'a',token:'@a/a',itemType:'registry:ui',status:'pending'},
 {namespace:'@a',slug:'b',token:'@a/b',itemType:'registry:component',status:'pending'},
 {namespace:'@a',slug:'theme',token:'@a/theme',itemType:'registry:theme',status:'pending'},
 {namespace:'@b',slug:'c',token:'@b/c',itemType:'registry:block',status:'pending'},
 {namespace:'@b',slug:'d',token:'@b/d',itemType:'registry:ui',status:'upstream-built'},
 {namespace:'@b',slug:'e',token:'@b/e',itemType:'registry:ui',status:'pending'},
];
const known='2026-10-04T06:00:00.000Z';
test('plans a deterministic, bounded, nonduplicating queue over catalog items',()=>{
 const done=new Map([['@a/a',{namespace:'@a',slug:'a',observedAt:known,status:'blocked',reason:'author-demo-required'}]]);
 const plan=planProbeBatch(rows,done,{limit:2,now:known});
 assert.deepEqual(plan.batch.map(v=>v.token),['@a/b','@b/c']);
 assert.equal(plan.summary.total,6);
 assert.equal(plan.summary.alreadyProbed,1);
 assert.equal(plan.summary.nonRenderable,1);
 assert.equal(plan.summary.verified,1);
 assert.equal(plan.summary.remaining,1);
 assert.equal(plan.next,'@b/e');
 assert.deepEqual(planProbeBatch(rows,done,{limit:9,registry:'@b',now:known}).batch.map(v=>v.token),['@b/c','@b/e']);
});
test('replays append-only journal, last observation wins and malformed data fails closed',()=>{
 const line=(value)=>JSON.stringify({schema:'registry-atlas-source-probe-journal/v1',...value});
 const valid=line({namespace:'@a',slug:'b',observedAt:known,status:'blocked',reason:'unreviewed-package',package:'motion'});
 const updated=line({namespace:'@a',slug:'b',observedAt:'2026-10-04T06:01:00.000Z',status:'source-resolved',mode:'upstream-demo',verification:'not-interaction-verified'});
 const parsed=parseProbeJournal(valid+'\n'+updated+'\n');
 assert.equal(parsed.size,1);
 assert.equal(parsed.get('@a/b').status,'source-resolved');
 assert.throws(()=>parseProbeJournal(valid+'\n'+line({namespace:'@a',slug:'x',observedAt:known,status:'interaction-verified'})+'\n'),/journal/i);
 assert.throws(()=>parseProbeJournal('{private stuff'),/journal/i);
});
test('processes independent source probes concurrently, records blocks and retries transient failures once',async()=>{
 let active=0,maxActive=0,attempts=0;
 const out=await runProbeBatch(rows.slice(0,4).filter(v=>v.slug!=='theme'),{
  concurrency:2,retries:1,now:known,
  load:async (_reg,slug)=>{
   active++;maxActive=Math.max(active,maxActive);
   await new Promise(r=>setTimeout(r,7));active--;
   if(slug==='a')throw Error('unreviewed-package: motion');
   if(slug==='b'&&++attempts===1)throw Error('ENOTFOUND /private');
   return {mode:'upstream-demo',files:{'/App.tsx':{}},dependencies:{react:'18.3.1'}};
  },wait:async()=>{},
 });
 assert.equal(maxActive,2);
 assert.equal(attempts,2);
 assert.deepEqual(out.map(v=>v.status),['blocked','source-resolved','source-resolved']);
 assert.ok(!JSON.stringify(out).includes('/private'));
 assert.deepEqual(groupProbeEvidence(out).blockers,[{reason:'unreviewed-package',package:'motion',count:1}]);
});
test('legacy generated-smoke probe evidence is immediately re-eligible',()=>{
 const previous=new Map([['@a/a',{namespace:'@a',slug:'a',
  observedAt:known,status:'source-resolved',mode:'generated-smoke-example'}]]);
 assert.equal(planProbeBatch(rows,previous,{limit:1,now:known}).batch[0].token,'@a/a');
});
test('never promotes a generated sample returned by an injected provider',async()=>{
 const result=await runProbeBatch(rows.slice(0,1),{
  now:known,retries:0,load:async()=>({mode:'generated-smoke-example',files:{},dependencies:{}}),
 });
 assert.deepEqual(result[0].status,'blocked');
 assert.equal(result[0].reason,'author-demo-required');
});
test('stale journal evidence automatically becomes retry-eligible',()=>{
 const done=new Map([['@a/a',{namespace:'@a',slug:'a',observedAt:'2026-09-01T00:00:00.000Z',status:'blocked',reason:'author-demo-required'}]]);
 assert.equal(planProbeBatch(rows,done,{limit:2,now:known}).batch[0].slug,'a');
});

test('resumes after a completed batch without re-fetching or skipping pending components',async()=>{
 const previous=new Map();
 const calls=[];
 const load=async (registry,slug)=>{calls.push('@'+registry+'/'+slug);return {
  mode:'upstream-demo',files:{'/App.tsx':{}},dependencies:{react:'18.3.1'}}};
 const first=planProbeBatch(rows,previous,{limit:2,now:known});
 const output=await runProbeBatch(first.batch,{load,now:known,concurrency:2,retries:0});
 for(const entry of output)previous.set(entry.namespace+'/'+entry.slug,entry);
 const second=planProbeBatch(rows,previous,{limit:2,now:known});
 assert.deepEqual(first.batch.map(v=>v.token),['@a/a','@a/b']);
 assert.deepEqual(second.batch.map(v=>v.token),['@b/c','@b/e']);
 assert.deepEqual(calls,['@a/a','@a/b']);
});

test('records each completed batch before moving the resume cursor, including empty tail',async()=>{
 const records=new Map(),persisted=[];
 const result=await runProbeSweep(rows,records,{
  limit:3,batchSize:2,concurrency:2,retries:0,now:known,
  load:async()=>({mode:'upstream-demo',files:{'/App.tsx':{}},dependencies:{react:'18.3.1'}}),
  append:async batch=>{persisted.push([...batch]);},
 });
 assert.equal(result.processed,3);
 assert.deepEqual(persisted.map(group=>group.length),[2,1]);
 assert.equal(records.size,3);
 const remaining=planProbeBatch(rows,records,{limit:8,now:known});
 assert.equal(remaining.batch.length,1);
});
test('stops on journal write failures without marking results completed',async()=>{
 const records=new Map();
 await assert.rejects(()=>runProbeSweep(rows,records,{limit:2,batchSize:2,now:known,
  load:async()=>({mode:'upstream-demo',files:{'/App.tsx':{}},dependencies:{}}),
  append:async()=>{throw Error('disk-full');}}),/disk-full/);
 assert.equal(records.size,0);
});

test('skips catalog identities unsafe for source endpoints while retaining them in total coverage',()=>{
 const sample=[...rows,{namespace:'@b',slug:'strange?item',token:'@b/strange?item',itemType:'registry:ui',status:'pending'}];
 const planned=planProbeBatch(sample,new Map(),{limit:200,now:known});
 assert.equal(planned.summary.invalidIdentity,1);
 assert.equal(planned.summary.total,7);
 assert.ok(!planned.batch.some(item=>item.slug==='strange?item'));
});

test('surveys registries breadth-first instead of exhausting one source first',()=>{
 const mixed=[
  {namespace:'@a',slug:'a',token:'@a/a',itemType:'registry:ui',status:'pending'},
  {namespace:'@a',slug:'b',token:'@a/b',itemType:'registry:ui',status:'pending'},
  {namespace:'@a',slug:'c',token:'@a/c',itemType:'registry:ui',status:'pending'},
  {namespace:'@b',slug:'a',token:'@b/a',itemType:'registry:ui',status:'pending'},
  {namespace:'@b',slug:'b',token:'@b/b',itemType:'registry:ui',status:'pending'},
  {namespace:'@c',slug:'a',token:'@c/a',itemType:'registry:ui',status:'pending'},
 ];
 const work=planProbeBatch(mixed,new Map(),{limit:4,strategy:'breadth',now:known});
 assert.deepEqual(work.batch.map(v=>v.token),['@a/a','@b/a','@c/a','@a/b']);
 const resumed=new Map(work.batch.map(item=>[item.token,{
  namespace:item.namespace,slug:item.slug,observedAt:known,status:'blocked',reason:'author-demo-required'}]));
 assert.deepEqual(planProbeBatch(mixed,resumed,{limit:3,strategy:'breadth',now:known})
  .batch.map(v=>v.token),['@a/c','@b/b']);
});

test('batch CLI defaults to read-only dry run and requires explicit execution with bounded concurrency',()=>{
 assert.deepEqual(parseFlags([]),{limit:32,batchSize:16,concurrency:2,execute:false});
 assert.equal(parseFlags(['--limit','all','--execute']).limit,100000);
 assert.equal(parseFlags(['--limit','all','--execute']).execute,true);
 for(const bad of [
  ['--concurrency','5'],['--batch-size','201'],['--limit','100001'],['--limit','-1'],
  ['--registry','@x/unsafe'],['--execute','--execute']]){
  assert.throws(()=>parseFlags(bad),/invalid|budget|duplicate/);
 }
});

test('a long sweep enumerates the catalog once instead of rescanning it for every batch',async()=>{
 let reads=0;
 const tracked=Array.from({length:48},(_,i)=>{
  const value='@demo/button'+String(i).padStart(3,'0');
  return {namespace:'@demo',slug:value.split('/')[1],itemType:'registry:ui',status:'pending',
   get token(){reads++;return value;}};
 });
 const progress=await runProbeSweep(tracked,new Map(),{
  limit:48,batchSize:1,concurrency:1,retries:0,now:known,
  load:async()=>({mode:'upstream-demo',files:{'/App.tsx':{}},dependencies:{}}),
  append:async()=>{},
 });
 assert.equal(progress.processed,48);
 assert.ok(reads<48*20,'catalog was rescanned '+reads+' times');
});
