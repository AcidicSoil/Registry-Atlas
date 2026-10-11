import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

type Reference = {
  mirror: unknown;
  catalog: unknown;
};
function runtimeReference(): Reference {
  return JSON.parse(gunzipSync(readFileSync('public/data/registry-atlas.json.gz')).toString('utf8')) as Reference;
}
export function readRepositoryDocument<T=unknown>(name:string):T {
  const documents=JSON.parse(readFileSync('.instance/atlas-test-documents.json','utf8')) as Record<string,T>;
  if (!Object.hasOwn(documents,name)) throw new Error('Missing PostgreSQL-backed reference document: '+name);
  return documents[name];
}
export function readRepositoryCatalog<T=unknown>():T {
  return runtimeReference().catalog as T;
}
export function readRepositoryRegistrySnapshot<T=unknown>():T {
  return runtimeReference().mirror as T;
}
