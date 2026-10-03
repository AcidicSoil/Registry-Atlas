import { afterEach, describe, expect, it } from 'vitest';
// @ts-expect-error Node preview server has no declaration in frontend tsconfig.
import { createPreviewServer, requestKey } from '../../tools/component-preview-host/preview-server.mjs';

const active: Array<() => Promise<void>> = [];
async function host(options:Record<string,unknown> = {}) {
 const instance = createPreviewServer(options);
 await new Promise<void>(resolve=>instance.listen(0,'127.0.0.1',resolve));
 active.push(()=>new Promise<void>(resolve=>instance.close(()=>resolve())));
 const info=instance.address();
 if(!info||typeof info==='string')throw Error('missing address');
 return 'http://127.0.0.1:'+info.port;
}
afterEach(async()=>{while(active.length)await active.pop()?.()});
const IDENT='@8bitcn/button';
const HTML='<!doctype html><html><body>ORIGINAL COMPONENT</body></html>';

describe('on-demand preview service',()=>{
 it('builds once when several requests share a source revision, then returns cached HTML',async()=>{
  let builds=0;
  const base=await host({ getSource:async()=>({sourceSha256:'a'.repeat(64),policySha256:'b'.repeat(64)}),
    build:async()=>{builds++;await new Promise(resolve=>setTimeout(resolve,35));return {html:HTML,sourceSha256:'a'.repeat(64)};} });
  const urls=Array.from({length:3},()=>fetch(base+'/preview/'+IDENT));
  const responses=await Promise.all(urls);
  expect(responses.map(r=>r.status)).toEqual([200,200,200]);
  expect(await responses[0].text()).toBe(HTML);
  expect(builds).toBe(1);
  const repeat=await fetch(base+'/preview/'+IDENT);
  expect(repeat.headers.get('x-preview-cache')).toBe('HIT');
  expect(builds).toBe(1);
  expect(repeat.headers.get('content-security-policy')).toContain("connect-src 'none'");
 });
 it('rejects unknown identities, method misuse and encoded traversal before any build',async()=>{
  let count=0;
  const base=await host({getSource:async()=>{count++;return {sourceSha256:'a'.repeat(64),policySha256:'b'.repeat(64)}},
    build:async()=>({html:HTML})});
  for(const path of ['/preview/@unknown/button','/preview/@8bitcn/..%2fetc',
    '/preview/@8bitcn/%2e%2e','/preview/@8bitcn/button%2fother',
    '/preview/@8bitcn/button/extra','/preview/@8bitcn/%62utton']){
    const response=await fetch(base+path,{redirect:'manual'});
    expect(response.status).toBeGreaterThanOrEqual(400);
  }
  expect((await fetch(base+'/preview/'+IDENT,{method:'POST'})).status).toBe(405);
  expect(count).toBe(0);
 });
 it('does not reuse a stale artifact after source or policy changes',async()=>{
  let revision='a'.repeat(64),builds=0;
  const base=await host({getSource:async()=>({sourceSha256:revision,policySha256:'b'.repeat(64)}),
    build:async()=>{builds++;return {html:HTML+builds};}});
  expect(await (await fetch(base+'/preview/'+IDENT)).text()).toBe(HTML+'1');
  revision='c'.repeat(64);
  expect(await (await fetch(base+'/preview/'+IDENT)).text()).toBe(HTML+'2');
  expect(builds).toBe(2);
 });
 it('does not leak build exceptions or serve successful HTML when compiler rejects input',async()=>{
  const base=await host({getSource:async()=>({sourceSha256:'a'.repeat(64),policySha256:'b'.repeat(64)}),
    build:async()=>{throw Error('PRIVATE DISK PATH /etc/secrets');}});
  const response=await fetch(base+'/preview/'+IDENT);
  expect(response.status).toBe(422);
  expect(await response.text()).not.toContain('/etc/secrets');
 });
 it('admits a second registry through a reviewed policy list without route changes',async()=>{
  const base=await host({approvedRegistries:['8bitcn','demo'],
    getSource:async(registry:string)=>({sourceSha256:registry==='demo'?'c'.repeat(64):'a'.repeat(64),
      policySha256:'b'.repeat(64)}),
    build:async(registry:string)=>({html:'<!doctype html><p>'+registry+'</p>'})});
  const result=await fetch(base+'/preview/@demo/button');
  expect(result.status).toBe(200);
  expect(await result.text()).toContain('demo');
  expect((await (await fetch(base+'/health')).json()).approvedRegistries).toEqual(['@8bitcn','@demo']);
 });
 it('has stable revision keys and rejects unexpected hash values',()=>{
  expect(requestKey('8bitcn','button','a'.repeat(64),'b'.repeat(64))).toMatch(/^[a-f0-9]{64}$/);
  expect(()=>requestKey('8bitcn','button','bad','b'.repeat(64))).toThrow();
 });
});
