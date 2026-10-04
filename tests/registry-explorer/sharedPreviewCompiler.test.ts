import { describe, expect, it } from 'vitest';
// @ts-expect-error The Node compiler starts without an ESM declaration (red phase).
import { planSharedPreview, buildSharedPreview } from '../../tools/component-preview-host/shared-compiler.mjs';
// @ts-expect-error The Node publishing adapter is tested before publishing a declaration.
import { prepareRegistryItem } from '../../tools/component-preview-host/publish.mjs';

const raw = JSON.stringify({
  name:'counter', type:'registry:ui',
  files:[{path:'ui/counter.tsx',content:
    'import React from "react"; export function Counter({onClick}) {return <button onClick={onClick}>PRESS ME</button>}' }],
  dependencies:[],
});
const review = {namespace:'@demo',slug:'counter',license:{decision:'approved',identifier:'MIT',reviewer:'test-author'},
  sourceSha256:'',dependencyLock:{react:'18.3.1','react-dom':'18.3.1',esbuild:'0.27.7'},
  entryFile:'ui/counter.tsx'};
const hash = async (input: string) => {
  // @ts-expect-error The browser-oriented test tsconfig does not include Node builtins.
  const { createHash } = await import('node:crypto');
  return createHash('sha256').update(input).digest('hex');
};
const sourceHash = () => hash(raw);
describe('shared compiled preview pipeline', () => {
  it('does not require a handwritten preview application for each component', async () => {
    const checked = { ...review, sourceSha256:await sourceHash() };
    const planned=planSharedPreview(raw, checked);
    expect(planned).toMatchObject({status:'eligible',entryFile:'ui/counter.tsx',exportName:'Counter'});
    expect(planned.files).toHaveLength(1);
    const built=await buildSharedPreview(raw,checked);
    expect(built).toMatchObject({status:'built-unverified',namespace:'@demo',slug:'counter'});
    expect(built.html).toContain('data-preview-interaction-count');
    expect(built.html).toContain("connect-src 'none'");
    expect(built.html).not.toContain('unsafe-eval');
    expect(built.html).toContain('sha256-');
  });
  it('renders the input behavior family with generic controlled value updates, not a separate app', async () => {
    const fixture=JSON.stringify({name:'input',files:[{
      path:'ui/input.tsx',
      content:'import React from "react"; export function Input(props) {return <input {...props} />;}',
    }],dependencies:[]});
    const cfg={...review,slug:'input',entryFile:'ui/input.tsx',sourceSha256:await hash(fixture)};
    const result=await buildSharedPreview(fixture,cfg);
    expect(result.status).toBe('built-unverified');
    expect(result.html).toContain('data-preview-input-value');
    expect(result.html).toContain('Type to test');
  });

  it('uses one registry policy to compile multiple different upstream source identities', async () => {
    const first=await prepareRegistryItem('8bitcn','button');
    const second=await prepareRegistryItem('8bitcn','input');
    expect(first.review.namespace).toBe('@8bitcn');
    expect(first.review.entryFile).toBe('components/ui/8bit/button.tsx');
    expect(second.review.entryFile).toBe('components/ui/8bit/input.tsx');
    expect(first.review.license).toEqual(second.review.license);
    expect(planSharedPreview(first.source,first.review)).toMatchObject({
      status:'eligible',slug:'button',exportName:'Button',
    });
    const input=await buildSharedPreview(second.source,second.review);
    expect(input).toMatchObject({status:'built-unverified',slug:'input',exportName:'Input'});
    expect(input.html).toContain('data-preview-input-value');
    await expect(prepareRegistryItem('other','button')).rejects.toThrow();
    await expect(prepareRegistryItem('8bitcn','../button')).rejects.toThrow();
  }, 20_000);

  it.each([
    {slug:'checkbox',exportName:'Checkbox',marker:'data-preview-checked'},
    {slug:'switch',exportName:'Switch',marker:'data-preview-checked'},
    {slug:'toggle',exportName:'Toggle',marker:'data-preview-checked'},
    {slug:'slider',exportName:'Slider',marker:'data-preview-slider-value'},
    {slug:'badge',exportName:'Badge',marker:'data-preview-original'},
  ])('generates semantic $slug behavior from one shared harness',async ({slug,exportName,marker}) => {
    const code='import React from "react";export function '+exportName+'(props){return React.createElement("button",props,props.children);}';
    const source=JSON.stringify({name:slug,files:[{path:'ui/'+slug+'.tsx',content:code}],dependencies:[]});
    const cfg={...review,slug,entryFile:'ui/'+slug+'.tsx',sourceSha256:await hash(source)};
    const result=await buildSharedPreview(source,cfg);
    expect(result.status).toBe('built-unverified');
    expect(result.html).toContain(marker);
  },20_000);

  it.each([
    {slug:'tabs',names:['Tabs','TabsList','TabsTrigger','TabsContent'],text:'SECOND PANEL'},
    {slug:'accordion',names:['Accordion','AccordionItem','AccordionTrigger','AccordionContent'],text:'FIRST ANSWER'},
    {slug:'collapsible',names:['Collapsible','CollapsibleTrigger','CollapsibleContent'],text:'EXPANDED CONTENT'},
  ])('composes a generic $slug interaction using upstream primitive exports',async ({slug,names,text}) => {
    const code='import React from "react";'+names.map(name=>
      'export function '+name+'(props){return React.createElement("div",props,props.children);}').join('');
    const source=JSON.stringify({name:slug,files:[{path:'ui/'+slug+'.tsx',content:code}],dependencies:[]});
    const cfg={...review,slug,entryFile:'ui/'+slug+'.tsx',sourceSha256:await hash(source)};
    const result=await buildSharedPreview(source,cfg);
    expect(result.status).toBe('built-unverified');
    expect(result.html).toContain(text);
  },20_000);

  it.each([
    {slug:'dialog',names:['Dialog','DialogTrigger','DialogContent','DialogTitle'],control:'OPEN DIALOG',content:'DIALOG CONTENT'},
    {slug:'dropdown-menu',names:['DropdownMenu','DropdownMenuTrigger','DropdownMenuContent','DropdownMenuItem'],control:'OPEN MENU',content:'MENU ACTION'},
    {slug:'radio-group',names:['RadioGroup','RadioGroupItem'],control:'SECOND CHOICE',content:'data-preview-selection'},
  ])('composes the upstream $slug family rather than a generic fake click counter',async ({slug,names,control,content})=>{
    const file='ui/'+slug+'.tsx';
    const code='import React from "react";'+names.map(name=>
      'export function '+name+'(props){return React.createElement("div",props,props.children);}').join('');
    const source=JSON.stringify({name:slug,files:[{path:file,content:code}],dependencies:[]});
    const cfg={...review,slug,entryFile:file,sourceSha256:await hash(source)};
    const result=await buildSharedPreview(source,cfg);
    expect(result.status).toBe('built-unverified');
    expect(result.html).toContain(control);
    expect(result.html).toContain(content);
    expect(result.html).not.toContain('PRESS ME');
  },20_000);
  it('composes a real select trigger and selectable options, not a fake button',async()=>{
    const slug='select';
    const names=['Select','SelectTrigger','SelectValue','SelectContent','SelectItem'];
    const source=JSON.stringify({name:slug,files:[{path:'ui/select.tsx',
      content:'import React from "react";'+names.map(name=>
       'export function '+name+'(props){return React.createElement("div",props,props.children)}').join('')}],dependencies:[]});
    const cfg={...review,slug,entryFile:'ui/select.tsx',sourceSha256:await hash(source)};
    const result=await buildSharedPreview(source,cfg);
    expect(result.status).toBe('built-unverified');
    expect(result.html).toContain('CHOOSE ITEM');
    expect(result.html).toContain('SECOND CHOICE');
    expect(result.html).toContain('data-preview-selection');
    expect(result.html).not.toContain('PRESS ME');
  });
  it('does not fabricate an upstream visual, output, or token content for unsupported components',async()=>{
    const slug='button-group';
    const source=JSON.stringify({name:slug,files:[{path:'ui/button-group.tsx',
      content:'import React from "react";export function ButtonGroup(props){return React.createElement("div",props,props.children)}'}],dependencies:[]});
    const cfg={...review,slug,entryFile:'ui/button-group.tsx',sourceSha256:await hash(source)};
    const result=await buildSharedPreview(source,cfg);
    expect(result.status).toBe('built-unverified');
    expect(result.html).not.toContain('UPSTREAM PREVIEW');
    expect(result.html).not.toContain('Source-based render; interaction unverified');
    expect(result.html).not.toContain('data-preview-generic');
    expect(result.html).not.toContain('PRESS ME');
  });
  it('does not fabricate a click counter for an unknown original component', async () => {
    const slug='button-group';
    const sample=JSON.stringify({name:slug,files:[{path:'ui/button-group.tsx',
      content:'import React from "react";export function ButtonGroup(props){return <div {...props}>{props.children}</div>}'}],dependencies:[]});
    const cfg={...review,slug,entryFile:'ui/button-group.tsx',sourceSha256:await hash(sample)};
    const result=await buildSharedPreview(sample,cfg);
    expect(result.status).toBe('built-unverified');
    expect(result.html).toContain('data-preview-original');
    expect(result.html).not.toContain('PRESS ME');
    expect(result.html).not.toContain('data-preview-interaction-count');
  });
  it('blocks stale source, unauthorized dependencies and unsafe remote imports', async () => {
    const checked={...review,sourceSha256:await sourceHash()};
    expect(planSharedPreview(raw,{...checked,sourceSha256:'0'.repeat(64)}).reason).toBe('source-hash-mismatch');
    expect(planSharedPreview(raw,{...checked,license:{...checked.license,decision:'unknown'}}).reason).toBe('license-not-approved');
    const withImport=JSON.stringify({name:'counter',files:[
      {path:'ui/counter.tsx',content:'import "https://evil.invalid/script.js"; export function Counter(){}'},
    ],dependencies:[]});
    expect(planSharedPreview(withImport,{...checked,sourceSha256:await hash(withImport)}).reason).toBe('unreviewed-import');
  });
  it('rejects arbitrary npm modules and malformed paths rather than compiling unknown code', async () => {
    const checked={...review,sourceSha256:await sourceHash()};
    const unknown=JSON.stringify({name:'counter',files:[{path:'ui/counter.tsx',
      content:'import x from "unreviewed-lib";export function Counter(){return null;}'}],dependencies:[]});
    expect(planSharedPreview(unknown,{...checked,sourceSha256:await hash(unknown)}).reason).toBe('unreviewed-import');
    const traversal=JSON.stringify({name:'counter',files:[
      {path:'../escape.tsx',content:'export function Counter(){}'}],dependencies:[]});
    expect(planSharedPreview(traversal,{...checked,sourceSha256:await hash(traversal)}).reason).toBe('unsafe-source-path');
  });
});
