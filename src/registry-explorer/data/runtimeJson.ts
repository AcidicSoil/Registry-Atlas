// Read-only static snapshots generated from PostgreSQL during the build.
let detailsPromise: Promise<Record<string,unknown>> | null = null;

export async function loadRuntimeJson<T>(
  relativePath: string, fetchImpl: typeof fetch = fetch,
): Promise<T> {
  const response = await fetchImpl(import.meta.env.BASE_URL + relativePath.replace(/^\//,''));
  if (!response.ok) throw new Error('Runtime data fetch failed: ' + response.status + ' ' + response.statusText);
  let bytes = new Uint8Array(await response.arrayBuffer());
  if (bytes[0]===0x1f && bytes[1]===0x8b) {
    if (typeof DecompressionStream==='undefined') throw new Error('Gzip decompression unavailable');
    const stream = new Response(bytes).body;
    if (!stream) throw new Error('Missing runtime data body');
    bytes = new Uint8Array(await new Response(stream.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer());
  }
  return JSON.parse(new TextDecoder().decode(bytes)) as T;
}
export function loadDetailRuntimeData(fetchImpl:typeof fetch=fetch):Promise<Record<string,unknown>> {
  if (!detailsPromise) {
    detailsPromise=loadRuntimeJson<Record<string,unknown>>('data/registry-details.json.gz',fetchImpl)
      .catch(error=>{detailsPromise=null;throw error});
  }
  return detailsPromise;
}
export function resetRuntimeDataCachesForTests() {
  detailsPromise=null;
}
