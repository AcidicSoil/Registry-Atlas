import {describe,expect,it} from 'vitest';
// @ts-expect-error Node-only generic managed-browser proof module.
import {assessBehavior,assessStaticRender,verifyReceipts} from '../../tools/component-preview-host/verify-batch.mjs';

describe('generic browser proof admission',()=>{
 it.each(['button','input','textarea','checkbox','switch','toggle','slider','tabs','accordion','collapsible','dialog','dropdown-menu','radio-group','select'])(
 'recognizes actual changing %s behavior',slug=>{
   expect(assessBehavior(slug,'before','after','No errors')).toMatchObject({
     status:'interaction-verified',before:'before',after:'after',
   });
   expect(assessBehavior(slug,'same','same','No errors')).toMatchObject({
     status:'unverified',reason:'interaction-unchanged',
   });
 });
 it('does not accept a browser error, an unsupported type or a missing action response',()=>{
   expect(assessBehavior('badge','old','new','No errors').status).toBe('unverified');
   expect(assessBehavior('checkbox','old','new','ReferenceError: React').status).toBe('unverified');
   expect(assessBehavior('checkbox',null,'new','No errors').status).toBe('unverified');
 });
 it('records a visible original static component without falsely certifying interaction',()=>{
   expect(assessStaticRender(true,'No errors')).toMatchObject({
     status:'render-verified',reason:'no-approved-interaction-contract'});
   expect(assessStaticRender(false,'No errors').status).toBe('unverified');
   expect(assessStaticRender(true,'ReferenceError').status).toBe('unverified');
 });
 it('blocks nonlocal endpoints and unbounded receipts before opening a browser',async()=>{
   await expect(verifyReceipts({receipts:[],server:'https://x.invalid',base:'http://127.0.0.1:5192',tab:'a'.repeat(32)})).rejects.toThrow();
   await expect(verifyReceipts({receipts:Array.from({length:201},()=>({})),server:'http://127.0.0.1:9887',base:'http://127.0.0.1:5192',tab:'a'.repeat(32)})).rejects.toThrow();
 });
});
