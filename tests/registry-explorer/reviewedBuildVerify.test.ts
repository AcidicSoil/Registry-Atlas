import {describe,expect,it} from 'vitest';
// @ts-expect-error Node-only preview batch orchestration has no browser-oriented declaration.
import {selectReviewedProofCandidates,approvedPromotionCandidates,runReviewedStages} from '../../tools/component-preview-host/reviewed-build-verify.mjs';

describe('one complete reviewed build stage followed by one browser stage',()=>{
 it('selects every cached unpublished item, not only previously known interaction families',()=>{
  const manifest={items:[{namespace:'@8bitcn',slug:'button',status:'interaction-verified'}]};
  const selected=selectReviewedProofCandidates(['dialog','badge','input','button','badge'],manifest,{limit:200});
  expect(selected).toEqual(['badge','dialog','input']);
 });
 it('attempts every reviewed candidate before any browser action and never promotes unverified output',async()=>{
  const actions:string[]=[];
  const staged=await runReviewedStages(['badge','dialog','radio-group'],{
   registry:'8bitcn',
   stage:async(slug:string)=>{actions.push('build:'+slug);
    if(slug==='dialog')throw Error('source-revision-mismatch');
    return {namespace:'@8bitcn',slug,sourceSha256:'a'.repeat(64),bundleSha256:'b'.repeat(64)};
   },
   verify:async(receipts:any[])=>{
    actions.push('browser:'+receipts.length);
    return {schema:'registry-atlas-preview-browser-proof/v1',
     rows:receipts.map(x=>({...x,status:x.slug==='badge'?'render-verified':'interaction-verified',
      before:'before',after:'after'})),summary:{attempted:2,verified:1,failed:1}};
   },
  });
  expect(actions).toEqual(['build:badge','build:dialog','build:radio-group','browser:2']);
  expect(staged.blocked).toMatchObject([{slug:'dialog',reason:'reviewed-build-unavailable'}]);
  expect(approvedPromotionCandidates(staged.proof,staged.receipts).map((x:any)=>x.slug))
   .toEqual(['radio-group']);
 });
});
