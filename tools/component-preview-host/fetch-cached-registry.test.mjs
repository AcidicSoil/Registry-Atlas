import {test} from 'node:test';
import assert from 'node:assert/strict';
import {validateOfficialItem} from './fetch-cached-registry.mjs';
test('admits only exact official identity with finite source, file and path bounds',()=>{
 const entry={name:'button',files:[{path:'components/ui/button.tsx',content:'export function Button(){}'}]};
 assert.equal(validateOfficialItem(JSON.stringify(entry),'button').slug,'button');
 for(const bad of [
  {...entry,name:'different'},
  {...entry,files:[{path:'../secret.tsx',content:'hi'}]},
  {...entry,files:[{path:'components/ui/button.tsx',content:'x'.repeat(256001)}]},
  {...entry,files:[]}
 ])assert.throws(()=>validateOfficialItem(JSON.stringify(bad),'button'),/source/);
 assert.throws(()=>validateOfficialItem('not-json','button'),/non-json/);
 assert.throws(()=>validateOfficialItem(JSON.stringify(entry),'../button'),/unsafe/);
});
