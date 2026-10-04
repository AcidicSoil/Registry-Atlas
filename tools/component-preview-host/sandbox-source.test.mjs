import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createSandboxProject, loadSandboxProject} from './sandbox-source.mjs';

const original={name:'button',type:'registry:ui',files:[
 {path:'components/ui/button.tsx',type:'registry:ui',content:''},
],dependencies:['@radix-ui/react-slot@1.3.0']};
const tree={files:[{path:'components/ui/button.tsx',type:'registry:ui',
 content:'import {cn} from "@/lib/utils"; import {cva} from "class-variance-authority"; export function Button({children}){return <button>{children}</button>}'}],
 dependencies:[],cssVars:{light:{primary:'oklch(0.5 0.2 10)'}}};
test('resolves original files, aliases, package imports, and a clearly labeled smoke example',()=>{
 const result=createSandboxProject(original,tree);
 assert.equal(result.mode,'generated-smoke-example');
 assert.equal(result.entryFile,'components/ui/button.tsx');
 assert.match(result.files['/components/ui/button.tsx'].code,/from "\.\.\/\.\.\/lib\/utils.ts"/);
 assert.equal(result.dependencies['class-variance-authority'],'latest');
 assert.equal(result.dependencies['@radix-ui/react-slot'],'1.3.0');
 assert.match(result.files['/styles.css'].code,/--primary: oklch/);
 assert.match(result.warning,/not the author's demo/);
 assert.doesNotMatch(result.files['/App.tsx'].code,/onClick=/);
});
test('prefers an author-provided demo over a guessed composition',()=>{
 const demo={path:'demos/default.tsx',type:'registry:component',content:'import {Button} from "../components/ui/button"; export default function Demo(){return <Button>Author sample</Button>}'};
 const result=createSandboxProject({...original,files:[...original.files,demo]},
  {...tree,files:[...tree.files,demo]});
 assert.equal(result.mode,'upstream-demo');
 assert.equal(result.entryFile,'demos/default.tsx');
 assert.match(result.files['/App.tsx'].code,/AuthorDemo.default/);
});
test('uses upstream registry target for shadcn dependencies',()=>{
 const result=createSandboxProject({...original,files:[{path:'components/ui/8bit/badge.tsx',type:'registry:component'}]},
 {files:[{path:'registry/new-york-v4/ui/badge.tsx',type:'registry:ui',
    content:'export function Badge(){return <span>Badge</span>}'},
   {path:'components/ui/8bit/badge.tsx',type:'registry:component',
    content:'import {Badge} from "@/components/ui/badge"; export function RetroBadge(){return <Badge/>}'}]});
 assert.match(result.files['/components/ui/8bit/badge.tsx'].code,/from "\.\.\/badge.tsx"/);
});
test('fills simple required string props from the upstream TypeScript signature',()=>{
 const sample={name:'text-generate-effect',type:'registry:ui',files:[
  {path:'components/ui/text-generate-effect.tsx',type:'registry:ui'}]};
 const code='export const TextGenerateEffect = ({words,duration=1}: {words: string;duration?:number}) => <div>{words}</div>';
 const project=createSandboxProject(sample,{files:[{path:sample.files[0].path,content:code}]});
 assert.match(project.files['/App.tsx'].code,/words=\{\"Preview component\"\}/);
 assert.equal(project.mode,'generated-smoke-example');
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
 const p=await loadSandboxProject('8bitcn','button',provider);
 assert.equal(p.namespace,'@8bitcn');
 assert.equal(p.slug,'button');
 assert.equal(called,1);
});
