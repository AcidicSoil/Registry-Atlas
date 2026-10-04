import {describe,expect,it} from 'vitest';
// @ts-expect-error Node-only generic managed-browser proof module.
import {assessBehavior,assessStaticRender,verifyReceipts,approvedReceiptRegistry,supportedBehavior} from '../../tools/component-preview-host/verify-batch.mjs';

describe('generic browser proof admission',()=>{
 it.each(['button','input','textarea','checkbox','switch','toggle','slider','tabs','accordion','collapsible','dialog','dropdown-menu','radio-group','select','tooltip','scroll-area','faq1','faq3'])(
 'recognizes actual changing %s behavior',slug=>{
   expect(assessBehavior(slug,'before','after','No errors')).toMatchObject({
     status:'interaction-verified',before:'before',after:'after',
   });
   expect(assessBehavior(slug,'same','same','No errors')).toMatchObject({
     status:'unverified',reason:'interaction-unchanged',
   });
 });
 it.each([
   {slug:'difficulty-select',before:'NORMAL',after:'HARD'},
   {slug:'audio-settings',before:'false',after:'true'},
   {slug:'game-faq1',before:'false',after:'true'},
 ])('admits only the source-observed $slug state transition',({slug,before,after})=>{
   expect(assessBehavior(slug,before,after,'No errors')).toMatchObject({
     status:'interaction-verified',before,after,
   });
   expect(assessBehavior(slug,'unexpected',after,'No errors')).toMatchObject({
     status:'unverified',reason:'unexpected-original-state',
   });
   expect(assessBehavior(slug,before,'unexpected','No errors')).toMatchObject({
     status:'unverified',reason:'unexpected-action-result',
   });
 });
 it('never inherits another registry naive component interaction contracts',()=>{
   expect(assessBehavior('button','0','1','No errors','@watermelon'))
     .toMatchObject({status:'unverified',reason:'unrecognized-behavior'});
   expect(assessBehavior('button','0','1','No errors','@8bitcn').status)
     .toBe('interaction-verified');
 });
 it('requires provider-specific original accordion, collapsible, and select transitions',()=>{
   for(const {slug,before,after} of [
     {slug:'accordion',before:'true',after:'false'},
     {slug:'collapsible',before:'false',after:'true'},
   ]){
     expect(supportedBehavior(slug,'@watermelon')).toBe(true);
     expect(assessBehavior(slug,before,after,'No errors','@watermelon').status)
       .toBe('interaction-verified');
     expect(assessBehavior(slug,before,'unrelated output','No errors','@watermelon'))
       .toMatchObject({status:'unverified',reason:'unexpected-action-result'});
   }
   expect(supportedBehavior('select','@watermelon')).toBe(true);
   expect(assessBehavior('select','FIRST CHOICE','SECOND CHOICE','No errors','@watermelon').status)
     .toBe('interaction-verified');
   expect(assessBehavior('select','FIRST CHOICE','harness count','No errors','@watermelon'))
     .toMatchObject({status:'unverified',reason:'unexpected-action-result'});
 });
 it('requires actual upstream checked state for a second registry instead of harness count',()=>{
   expect(assessBehavior('checkbox','false','true','No errors','@watermelon').status)
     .toBe('interaction-verified');
   expect(assessBehavior('checkbox','false','harness changed','No errors','@watermelon'))
     .toMatchObject({status:'unverified',reason:'unexpected-action-result'});
   expect(assessBehavior('switch','false','true','No errors','@watermelon').status)
     .toBe('interaction-verified');
   expect(assessBehavior('switch','invalid','true','No errors','@watermelon'))
     .toMatchObject({status:'unverified',reason:'unexpected-original-state'});
 });
 it('does not accept a browser error, an unsupported type or a missing action response',()=>{
   expect(assessBehavior('badge','old','new','No errors').status).toBe('unverified');
   expect(assessBehavior('checkbox','old','new','ReferenceError: React').status).toBe('unverified');
   expect(assessBehavior('checkbox',null,'new','No errors').status).toBe('unverified');
 });
 it('recognizes actual original FAQ accordion state changes and rejects unchanged states',()=>{
   for(const slug of ['faq1','faq3']){
     expect(assessBehavior(slug,'false','true','No errors').status).toBe('interaction-verified');
     expect(assessBehavior(slug,'false','false','No errors').status).toBe('unverified');
   }
 });
 it('requires a real state transition when keyboard scrolling the upstream viewport',()=>{
   expect(assessBehavior('scroll-area','0','3','No errors').status)
     .toBe('interaction-verified');
   expect(assessBehavior('scroll-area','0','0','No errors').status)
     .toBe('unverified');
 });
 it('records a visible original static component without falsely certifying interaction',()=>{
   expect(assessStaticRender(true,'No errors')).toMatchObject({
     status:'render-verified',reason:'no-approved-interaction-contract'});
   expect(assessStaticRender(false,'No errors').status).toBe('unverified');
   expect(assessStaticRender(true,'ReferenceError').status).toBe('unverified');
 });
 it('accepts the actual policy-reviewed second registry and rejects unknown namespaces',async()=>{
   expect(await approvedReceiptRegistry('@8bitcn')).toBe('8bitcn');
   expect(await approvedReceiptRegistry('@watermelon')).toBe('watermelon');
   expect(await approvedReceiptRegistry('@not-reviewed')).toBeNull();
   expect(await approvedReceiptRegistry('@../watermelon')).toBeNull();
 });
 it('rejects malformed receipt slugs before reading cached paths or launching a browser',async()=>{
   const proof=await verifyReceipts({
     receipts:[{namespace:'@watermelon',slug:'../private',
       bundleSha256:'a'.repeat(64),sourceSha256:'b'.repeat(64)}],
     server:'http://127.0.0.1:9877',base:'http://127.0.0.1:5189/Registry-Atlas',
     tab:'9D5306E0FC7760E9DE1D431D042D4C35',
   });
   expect(proof.rows[0]).toMatchObject({status:'unverified',reason:'unrecognized-identity'});
 });
 it('blocks nonlocal endpoints and unbounded receipts before opening a browser',async()=>{
   await expect(verifyReceipts({receipts:[],server:'https://x.invalid',base:'http://127.0.0.1:5192',tab:'a'.repeat(32)})).rejects.toThrow();
   await expect(verifyReceipts({receipts:Array.from({length:201},()=>({})),server:'http://127.0.0.1:9887',base:'http://127.0.0.1:5192',tab:'a'.repeat(32)})).rejects.toThrow();
 });
});
