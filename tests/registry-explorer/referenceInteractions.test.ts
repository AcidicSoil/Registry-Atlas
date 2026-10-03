import { describe, expect, it } from 'vitest';
import { selectReferenceAction, assessReferenceTransition } from '../../scripts/audit-21st-interactions.mjs';

const category='https://21st.dev/community/components/s/button';
const snap={nodes:[
  {ref:'e1',role:'button',name:'Filter'},
  {ref:'e2',role:'tab',name:'Newest'},
  {ref:'e3',role:'button',name:'Save'},
]};

describe('bounded, read-only reference interaction audit',()=>{
  it('allows only exact nonaccount controls on an observed category route',()=>{
    expect(selectReferenceAction(category,'filter-open',snap)).toMatchObject({ref:'e1',label:'Filter'});
    expect(selectReferenceAction(category,'sort-newest',snap)).toMatchObject({ref:'e2',label:'Newest'});
    expect(selectReferenceAction('https://other.example/components/s/button','filter-open',snap)).toBeNull();
    expect(selectReferenceAction('https://21st.dev/account','filter-open',snap)).toBeNull();
    expect(selectReferenceAction(category,'save',snap)).toBeNull();
    expect(selectReferenceAction(category,'filter-open',{nodes:[...snap.nodes,snap.nodes[0]]})).toBeNull();
  });
  it('verifies filter outcome from visible UI state, not the success code from a click',()=>{
    const before={url:category,filterGroups:[],tabs:[{label:'Newest',selected:false}]};
    const after={url:category,filterGroups:['Category','Time','Primitive library'],tabs:[{label:'Newest',selected:false}]};
    expect(assessReferenceTransition('filter-open',before,after).status).toBe('interaction-verified');
    expect(assessReferenceTransition('filter-open',before,before).status).toBe('unverified');
    expect(assessReferenceTransition('filter-open',before,{...after,url:'https://wrong.example'}).status).toBe('unverified');
  });
  it('requires a real selected-tab transition for sort evidence',()=>{
    const before={url:category,tabs:[{label:'Newest',selected:false},{label:'Recommended',selected:true}]};
    const after={url:category,tabs:[{label:'Newest',selected:true},{label:'Recommended',selected:false}]};
    expect(assessReferenceTransition('sort-newest',before,after).status).toBe('interaction-verified');
    expect(assessReferenceTransition('sort-newest',after,after).status).toBe('unverified');
  });
});
