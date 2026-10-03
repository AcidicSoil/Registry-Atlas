import {describe,expect,it} from 'vitest';
// @ts-expect-error Standalone Node source intake starts without a declaration.
import {fetchRegistrySource} from '../../tools/component-preview-host/ingest.mjs';

const source=JSON.stringify({name:'button',files:[
 {path:'components/ui/8bit/button.tsx',content:'export function Button() {}'},
]});
const mock=(body:string, status=200)=>async (_url:string,options:any)=>{
 expect(options.redirect).toBe('error');
 expect(options.credentials).toBe('omit');
 return new Response(body,{status,headers:{'content-type':'application/json'}});
};
describe('bounded official registry source intake',()=>{
 it('retrieves by a policy-pinned official URL, without publishing a preview', async ()=>{
  const result=await fetchRegistrySource('8bitcn','button',{fetchImpl:mock(source),persist:false});
  expect(result).toMatchObject({status:'source-observed',namespace:'@8bitcn',slug:'button'});
  expect(result.source).toBe(source);
  expect(result.url).toBe('https://www.8bitcn.com/r/button.json');
  expect(result.sourceSha256).toMatch(/^[a-f0-9]{64}$/);
 });
 it('rejects unknown registries, path traversal, redirects and oversized payloads',async ()=>{
  await expect(fetchRegistrySource('unknown','button',{fetchImpl:mock(source),persist:false})).rejects.toThrow();
  await expect(fetchRegistrySource('8bitcn','../button',{fetchImpl:mock(source),persist:false})).rejects.toThrow();
  await expect(fetchRegistrySource('8bitcn','button',{fetchImpl:mock('oops',301),persist:false})).rejects.toThrow();
  await expect(fetchRegistrySource('8bitcn','button',{fetchImpl:mock('x'.repeat(600000)),persist:false})).rejects.toThrow();
 });
 it('rejects wrong identity and refuses to overwrite a differently versioned source',async ()=>{
  await expect(fetchRegistrySource('8bitcn','button',{fetchImpl:mock(source.replace('"button"','"wrong"')),persist:false})).rejects.toThrow();
  await expect(fetchRegistrySource('8bitcn','button',{fetchImpl:mock(source),persist:true})).rejects.toThrow(/existing|revision/i);
 });
});
