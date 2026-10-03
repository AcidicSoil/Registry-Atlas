export interface ItemEvidenceArgs {
  raw: Array<{name: string;homepage: string}>;
  catalog: {registries: Record<string, Array<{name:string;type?:string}>>};
  curated?: Record<string, Array<{slug?:string;name?:string;type?:string}>>;
  visual: {schemaVersion:number;previews:Record<string,{
    imageUrl:string;officialPage:string;verification?:string;
  }>};
  manifest: {schema:string;items: Array<Record<string,unknown>>};
  ledgers?: Record<string,{get(token:string):Record<string,unknown>|undefined}>;
  asOf?:string;
  maxAgeMs?:number;
  assetExists?: (path:string)=>boolean;
}
export interface ItemEvidenceRecord {
  token:string;
  namespace:string;
  slug:string;
  itemType:string|null;
  source:{status:'observed'|'pending'|'stale'|'blocked'|'unresolved';url?:string};
  visual:{status:'verified'|'pending'|'blocked';reason?:string;url?:string;officialPage?:string};
  functional:{status:'fixture'|'upstream-built'|'pending'|'blocked';reason?:string};
}
export interface ItemEvidenceSummary {
  registryCount:number;
  identityCount:number;
  indexedRows:number;
  indexedDistinct:number;
  curatedOnly:number;
  indexedDuplicates:number;
  source:{observed:number;pending:number;stale:number;blocked:number;unresolved:number};
  visual:{verified:number;pending:number;blocked:number};
  functional:{fixture:number;upstreamBuilt:number;pending:number;blocked:number};
  errors:number;
  complete:boolean;
}
export function compileItemEvidence(input:ItemEvidenceArgs): {
  schema:string;asOf:string;summary:ItemEvidenceSummary;items:ItemEvidenceRecord[];
  errors:Array<{token:string;reason:string;count?:number}>;
  registries:Array<Record<string,unknown>>;note:string;
};
