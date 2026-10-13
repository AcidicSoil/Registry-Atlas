import { describe, expect, it } from 'vitest';
// @ts-expect-error Node script outside browser TS project
import { prepareSitemapSurveys } from '../../scripts/import-official-sitemap-surveys.mjs';
// @ts-expect-error Node helper outside browser TS project
import { catalogFingerprint } from '../../scripts/lib/registry-discovery.mjs';

const raw = [{name:'@alpha',homepage:'https://alpha.example/',url:'https://alpha.example/r/{name}.json'}];

const catalog = {registries:{'@alpha':[{name:'nested/button'},{name:'card'}]}};

const surveyedAt='2026-10-12T08:00:00.000Z';

const survey=(options: Record<string,unknown>={})=>({
  schema:'registry-atlas-sitemap-survey/v1',namespace:'@alpha',
  officialHomepage:'https://alpha.example/',surveyedAt,
  catalogFingerprint:catalogFingerprint(raw[0],['card','nested/button']),
  status:'sitemap-observed',matchedPages:[
    {slug:'nested/button',url:'https://alpha.example/docs/nested/button'},
    {slug:'card',url:'https://alpha.example/docs/card'},
  ],...options,
});

const prepare=(s=survey(),existing: unknown[]=[])=>
  prepareSitemapSurveys({raw,catalog,surveys:{'@alpha':s},
    existing,now:'2026-10-12T09:00:00.000Z'});

describe('incremental official sitemap publication',()=>{
  it('retains namespace and full nested slug, independent of prior records',()=>{
    const out=prepare();
    expect(out.accepted).toContainEqual([
      '@alpha','nested/button','https://alpha.example/docs/nested/button',surveyedAt,
    ]);
    expect(out.accepted).toHaveLength(2);
  });
  it('rejects conflicting prior evidence without overwriting it',()=>{
    const out=prepare(survey(),[{namespace:'@alpha',slug:'card',
      url:'https://alpha.example/docs/old-card'}]);

    expect(out.accepted).toHaveLength(1);
    expect(out.rejected['conflicting-prior-evidence']).toBe(1);
  });
  it('rejects stale and mismatched surveys',()=>{
    expect(prepare(survey({surveyedAt:'2025-01-01T00:00:00Z'})).accepted).toHaveLength(0);
    expect(prepare(survey({catalogFingerprint:'outdated'})).accepted).toHaveLength(0);
    expect(prepare(survey({officialHomepage:'https://attacker.example'})).accepted).toHaveLength(0);
  });
  it('rejects ambiguous, unsafe and unknown item URLs',()=>{
    const result=prepare(survey({matchedPages:[
      {slug:'card',url:'https://alpha.example/docs/card'},
      {slug:'card',url:'https://alpha.example/components/card'},
      {slug:'nested/button',url:'https://foreign.example/docs/button'},
      {slug:'nonexistent',url:'https://alpha.example/docs/nonexistent'},
    ]}));

    expect(result.accepted).toHaveLength(0);
    expect(result.rejected['ambiguous-sitemap']).toBe(1);
    expect(result.rejected['invalid-or-off-origin']).toBe(1);
    expect(result.rejected['unknown-item']).toBe(1);
  });
  it('does not clear prior records when a source has no readable sitemap',()=>{
    const result=prepare(survey({status:'no-readable-sitemap',matchedPages:[]}));
    expect(result.accepted).toHaveLength(0);
    expect(result.rejected['no-readable-sitemap']).toBe(1);
  });
});
