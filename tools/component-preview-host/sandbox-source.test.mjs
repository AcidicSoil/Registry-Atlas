import './fetch-cached-registry.test.mjs';
import './probe-batch.test.mjs';
import './preview-probes.test.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSandboxProject, loadSandboxProject} from './sandbox-source.mjs';

const original={name:'button',type:'registry:ui',files:[
 {path:'components/ui/button.tsx',type:'registry:ui',content:''},
],dependencies:['@radix-ui/react-slot@1.3.0']};
const tree={files:[{path:'components/ui/button.tsx',type:'registry:ui',
 content:'import {cn} from "@/lib/utils"; import {cva} from "class-variance-authority"; export function Button({children}){return <button>{children}</button>}'}],
 dependencies:[],cssVars:{light:{primary:'oklch(0.5 0.2 10)'}}};
test('refuses to fabricate a visual preview for a registry item without an author demo',()=>{
 assert.throws(()=>createSandboxProject(original,tree),/author-demo-required/);
});
const authorDemo={path:'demos/button.tsx',type:'registry:component',
 content:'import {Button} from "../components/ui/button"; export default function Demo(){return <Button>Author sample</Button>}'};
const withDemo=(item=original,result=tree)=>[
 {...item,files:[...item.files,authorDemo]},
 {...result,files:[...result.files,authorDemo]},
];
test('prefers an author-provided demo over a guessed composition',()=>{
 const demo={path:'demos/default.tsx',type:'registry:component',content:'import {Button} from "../components/ui/button"; export default function Demo(){return <Button>Author sample</Button>}'};
 const result=createSandboxProject({...original,files:[...original.files,demo]},
  {...tree,files:[...tree.files,demo]});
 assert.equal(result.mode,'upstream-demo');
 assert.equal(result.entryFile,'demos/default.tsx');
 assert.match(result.files['/App.tsx'].code,/AuthorDemo.default/);
});
test('rejects an upstream demo file with no runnable export instead of rendering undefined',()=>{
 const demo={path:'demos/default.tsx',type:'registry:component',content:'export const settings={size:3};'};
 assert.throws(()=>createSandboxProject({...original,files:[...original.files,demo]},
  {...tree,files:[...tree.files,demo]}),/author-demo-required/);
});
test('uses upstream registry target for shadcn dependencies',()=>{
 const demoBadge={path:'demos/badge.tsx',type:'registry:component',content:'export default function BadgeDemo(){return <div>Author example</div>}'};
 const result=createSandboxProject({...original,files:[{path:'components/ui/8bit/badge.tsx',type:'registry:component'},demoBadge]},
 {files:[demoBadge,{path:'registry/new-york-v4/ui/badge.tsx',type:'registry:ui',
    content:'export function Badge(){return <span>Badge</span>}'},
   {path:'components/ui/8bit/badge.tsx',type:'registry:component',
    content:'import {Badge} from "@/components/ui/badge"; export function RetroBadge(){return <Badge/>}'}]});
 assert.match(result.files['/components/ui/8bit/badge.tsx'].code,/from "\.\.\/badge.tsx"/);
});
test('does not invent required props for sources without an authored example',()=>{
 const sample={name:'text-generate-effect',type:'registry:ui',files:[
  {path:'components/ui/text-generate-effect.tsx',type:'registry:ui'}]};
 const code='export const TextGenerateEffect = ({words,duration=1}: {words: string;duration?:number}) => <div>{words}</div>';
 assert.throws(()=>createSandboxProject(sample,{files:[{path:sample.files[0].path,content:code}]}),/author-demo-required/);
});
test('prefers the export matching the exact component name over a preceding provider',()=>{
 const sample={name:'button',type:'registry:ui',files:[{path:'components/ui/button.tsx',type:'registry:ui'}]};
 const code='export function ButtonProvider(){return <div>Provider</div>} export function Button(){return <button>Actual button</button>}';
 assert.throws(()=>createSandboxProject(sample,{files:[{path:sample.files[0].path,content:code}]}),/author-demo-required/);
});
test('never resolves undeclared or unpinned package versions to latest',()=>{
 const sample={...original,dependencies:['@radix-ui/react-slot@1.3.0','not-reviewed-package']};
 assert.throws(()=>createSandboxProject(...withDemo(sample,tree)),/unreviewed-package|unpinned-package/);
});
test('pins known dependency imports to reviewed versions',()=>{
 const project=createSandboxProject(...withDemo());
 assert.equal(project.dependencies['class-variance-authority'],'0.7.1');
 assert.ok(Object.values(project.dependencies).every(v=>v!=='latest'));
});
test('ignores fake export declarations in comments when choosing a smoke component',()=>{
 const sample={name:'button',type:'registry:ui',files:[{path:'components/ui/button.tsx',type:'registry:ui'}]};
 const code=`// export function Button() { return null; }\nexport function Unrelated(){return <div />;}\nexport function AlsoUnrelated(){return <div />;}`;
 assert.throws(()=>createSandboxProject(sample,{files:[{path:sample.files[0].path,content:code}]}),/component-export-unresolved/);
});
test('ignores dependency-looking strings and comments while collecting imports',()=>{
 const sample={name:'button',type:'registry:ui',files:[{path:'components/ui/button.tsx',type:'registry:ui'}]};
 const code=`// import x from "unreviewed-package"\nconst text='require("also-unreviewed")'; export function Button(){return <button>{text}</button>}`;
 const project=createSandboxProject(...withDemo(sample,{files:[{path:sample.files[0].path,content:code}]}));
 assert.ok(!('unreviewed-package' in project.dependencies));
 assert.ok(!('also-unreviewed' in project.dependencies));
});
test('rejects source components with required complex props rather than fabricating an author demo',()=>{
 const sample={name:'chart',type:'registry:ui',files:[{path:'components/ui/chart.tsx',type:'registry:ui'}]};
 const code='export const Chart=({data}: {data: {x:number}[]}) => <div>{data.length}</div>';
 assert.throws(()=>createSandboxProject(sample,{files:[{path:sample.files[0].path,content:code}]}),/author-demo-required/);
});
test('rejects conflicting paths, traversal, and non-component items',()=>{
 assert.throws(()=>createSandboxProject(original,{files:[{path:'../secret.tsx',content:'export const Secret=1'}]}),/unsupported-source-file/);
 assert.throws(()=>createSandboxProject({...original,type:'registry:theme'},tree),/unsupported-registry-item/);
 assert.throws(()=>createSandboxProject(original,{files:[...tree.files,
   {path:'components/ui/button.tsx',content:'different'}]}),/conflicting-source-paths/);
});
test('only fetches items that exist in the official local directory and catalog',async()=>{
 let called=0;
 const provider={getItems:async()=>{called++;return [original]},resolveItems:async()=>tree};
 await assert.rejects(()=>loadSandboxProject('not-a-real-registry','button',provider),/item-not-in-catalog/);
 assert.equal(called,0);
 await assert.rejects(()=>loadSandboxProject('8bitcn','button',provider),/author-demo-required/);
 assert.equal(called,1);
});
