import { describe, expect, it } from 'vitest';
// @ts-expect-error Node ESM discovery module has no TypeScript declaration.
import { catalogFingerprint, DISCOVERY_REVISION } from '../../scripts/lib/registry-discovery.mjs';
// @ts-expect-error Node ESM scheduler has no TypeScript declaration.
import { planVisualCaptureSchedule } from '../../scripts/schedule-visual-captures.mjs';

const raw = [
  {name:'@a',homepage:'https://a.example/'},
  {name:'@b',homepage:'https://b.example/'},
  {name:'@empty',homepage:'https://empty.example/'},
];
const items = {registries: {
  '@a':[{name:'button'}], '@b':[{name:'nested/icon'}], '@empty':[],
}};
const obs = (reg:any,slug:string,url:string) => ({
  schema:'registry-atlas-discovery/v1', discoveryRevision:DISCOVERY_REVISION,
  status:'page-observed', token:reg.name+'/'+slug, namespace:reg.name,
  slug, catalogFingerprint:catalogFingerprint(reg,[slug]),
  docsUrl:url, checkedAt:'2026-10-02T00:00:00Z',
  evidence:{observedUrl:url,renderedHeading:'Button'},
});
const ledgers = {
  '@a':new Map([['@a/button',obs(raw[0],'button','https://a.example/components/button')]]),
  '@b':new Map([['@b/nested/icon',obs(raw[1],'nested/icon','https://b.example/icon')]]),
  '@empty':new Map(),
};
describe('visual capture scheduling',() => {
  it('selects only observed uncaptured entries and supports a registry cursor',() => {
    const first=planVisualCaptureSchedule(raw,items,{},ledgers,{},{
      maxRegistries:1,perRegistryLimit:2,
    });
    expect(first.batch.map((x:any)=>x.namespace)).toEqual(['@a']);
    expect(first.nextCursor).toBe('@a');
    const second=planVisualCaptureSchedule(raw,items,{},ledgers,{},{
      maxRegistries:2,perRegistryLimit:2,cursor:first.nextCursor,
    });
    expect(second.batch.map((x:any)=>x.namespace)).toEqual(['@b']);
    expect(second.nextCursor).toBe('@b');
    expect(planVisualCaptureSchedule(raw,items,{},ledgers,{
      '@a/button': {officialPage:'https://a.example/components/button',imageUrl:'/Registry-Atlas/data/previews/a/button.jpg'},
    },{maxRegistries:2,perRegistryLimit:2}).batch.map((x:any)=>x.namespace)).toEqual(['@b']);
  });
  it('rejects unsafe/unknown registry cursors and caps batch size',() => {
    expect(()=>planVisualCaptureSchedule(raw,items,{},ledgers,{},{
      cursor:'@missing',maxRegistries:2,perRegistryLimit:2,
    })).toThrow('Unknown registry cursor');
    expect(()=>planVisualCaptureSchedule(raw,items,{},ledgers,{},{
      maxRegistries:25,perRegistryLimit:2,
    })).toThrow('Invalid registry batch size');
  });
});
