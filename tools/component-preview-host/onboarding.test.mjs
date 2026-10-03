import test from 'node:test';
import assert from 'node:assert/strict';
import {inspectSource,discoverCandidates,createDiscoveryReport,
  inspectCachedSource} from './registry-onboarding.mjs';

const item=(files,extra={})=>JSON.stringify({name:'badge',files,...extra});
const file=(path,content)=>({path,content});
test('discovers independent registries without silently approving them',()=>{
 const catalog={registries:{
  '@alpha':[{name:'button',type:'registry:component'},
    {name:'button',type:'registry:component'},{name:'page',type:'registry:page'}],
  '@beta':[{name:'card',type:'registry:component'}],
  '@empty':[{name:'style',type:'registry:style'}]}};
 const directory=[{name:'@alpha',url:'https://alpha.example/r/{name}.json'},
   {name:'@beta',url:'http://insecure.example/r/{name}.json'}];
 const first=discoverCandidates(catalog,directory,{limit:1});
 assert.equal(first.summary.registriesWithComponents,2);
 assert.equal(first.rows[0].componentCount,1);
 assert.equal(first.rows[0].status,'needs-policy-review');
 assert.equal(first.rows[0].license,'not-reviewed');
 const second=discoverCandidates(catalog,directory,{limit:1,after:first.cursor});
 assert.equal(second.rows[0].namespace,'@beta');
 assert.equal(second.rows[0].status,'source-route-unresolved');
 assert.deepEqual(discoverCandidates(catalog,directory,{limit:1}),first);
 assert.throws(()=>discoverCandidates(catalog,directory,{limit:101}),/Invalid bounded/);
 assert.throws(()=>discoverCandidates(catalog,directory,{limit:2,after:'../bad'}),/Invalid bounded/);
});
test('parses imports from syntax rather than comments or strings',()=>{
 const raw=item([file('components/badge.tsx',`
  // import Ghost from 'fake-dependency'
  const example="import Ghost from 'another-fake'";
  import React from 'react';
  import type { Props } from 'types-only';
  import { cn } from '@/lib/utils';
  import { Widget } from './widget';
  export { Widget as Badge } from './widget';
  export function Helper(){return null}
 `),file('components/widget.tsx','export function Widget(){return null}')],
 {registryDependencies:['button','button']});
 const report=inspectSource(raw,{namespace:'@alpha',slug:'badge'});
 assert.equal(report.status,'needs-review');
 assert.deepEqual(report.packages,['react','types-only']);
 assert.deepEqual(report.aliases,['@/lib/utils']);
 assert.equal(report.imports.length,4);
 assert(!report.packages.includes('fake-dependency'));
 assert.deepEqual(report.registryDependencies,['button']);
 assert(report.exports.some(value=>value.name==='Badge'));
 assert.deepEqual(report.blockers,[]);
});

test('blocks dynamic imports, missing local files, remote CSS and malformed paths',()=>{
 const raw=item([
  file('components/badge.tsx',`import './missing';import('dynamic-module');export const Badge=1;`),
  file('components/retro.css',`@import url("https://example.org/css");`)
 ]);
 const report=inspectSource(raw,{namespace:'@alpha',slug:'badge'});
 assert.equal(report.status,'blocked');
 assert(report.blockers.includes('dynamic-import-or-require'));
 assert(report.blockers.includes('missing-relative-import'));
 assert(report.blockers.includes('remote-stylesheet-import'));
 const broken=inspectSource(item([file('../unsafe.tsx','export const Badge=1')]),
   {namespace:'@alpha',slug:'badge'});
 assert.deepEqual(broken.blockers,['unsafe-source-file']);
 assert.equal(inspectSource('oops',{namespace:'@alpha',slug:'badge'}).status,'blocked');
});

test('identifies separate framework families without executing them',()=>{
 const report=inspectSource(item([
  file('components/badge.vue','<template><h1>Preview</h1></template>'),
  file('components/badge.svelte','<h1>Preview</h1>'),
  file('components/badge.astro','<h1>Preview</h1>')
 ]),{namespace:'@alpha',slug:'badge'});
 assert.deepEqual(report.frameworkHints,['astro','svelte','vue']);
 assert.equal(report.approval,'not-granted');
});
test('inspects real cached source and catalog without approvals',async()=>{
 const discovered=await createDiscoveryReport({limit:35});
 assert(discovered.rows.length>1);
 assert(discovered.summary.registriesWithComponents>1);
 const source=await inspectCachedSource({registry:'8bitcn',slug:'badge'});
 assert.equal(source.namespace,'@8bitcn');
 assert(source.packages.includes('class-variance-authority'));
 assert(source.aliases.includes('@/components/ui/badge'));
 assert.equal(source.sourceSha256.length,64);
 assert.equal(source.approval,'not-granted');
});
