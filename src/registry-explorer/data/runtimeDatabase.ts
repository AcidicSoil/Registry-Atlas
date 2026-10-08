import initSqlJs from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';

export type RuntimeDatabase = InstanceType<Awaited<ReturnType<typeof initSqlJs>>['Database']>;

let sqlPromise: ReturnType<typeof initSqlJs> | null = null;
let detailDatabasePromise: Promise<RuntimeDatabase> | null = null;
let testWasmBinary: Uint8Array | null = null;

function sqlModule() {
  if (!sqlPromise) {
    if (testWasmBinary) {
      const wasmBinary = new ArrayBuffer(testWasmBinary.byteLength);
      new Uint8Array(wasmBinary).set(testWasmBinary);
      sqlPromise = initSqlJs({ wasmBinary });
    } else {
      sqlPromise = initSqlJs({ locateFile: () => sqlWasmUrl });
    }
  }
  return sqlPromise;
}

export function configureSqlJsWasmBinaryForTests(bytes: Uint8Array | null): void {
  sqlPromise = null;
  testWasmBinary = bytes;
}

export async function loadRuntimeDatabase(
  relativePath: string,
  fetchImpl: typeof fetch = fetch,
): Promise<RuntimeDatabase> {
  const response = await fetchImpl(`${import.meta.env.BASE_URL}${relativePath.replace(/^\//, '')}`);
  if (!response.ok) {
    throw new Error(`Runtime database fetch failed: ${response.status} ${response.statusText}`);
  }
  const bytes = relativePath.endsWith('.gz')
    ? await decompressGzip(response)
    : new Uint8Array(await response.arrayBuffer());
  const SQL = await sqlModule();
  return new SQL.Database(bytes);
}

export function loadDetailRuntimeDatabase(
  fetchImpl: typeof fetch = fetch,
): Promise<RuntimeDatabase> {
  if (!detailDatabasePromise) {
    detailDatabasePromise = loadRuntimeDatabase('data/registry-details.sqlite.gz', fetchImpl)
      .catch(error => {
        detailDatabasePromise = null;
        throw error;
      });
  }
  return detailDatabasePromise;
}

export function resetRuntimeDatabaseCachesForTests(): void {
  detailDatabasePromise?.then(database => database.close()).catch(() => {});
  detailDatabasePromise = null;
  sqlPromise = null;
}

export function queryJsonRows<T>(
  database: RuntimeDatabase,
  sql: string,
  params: Array<string | number | null> = [],
): T[] {
  const result = database.exec(sql, params);
  const first = result[0];
  if (!first) return [];
  const payloadIndex = first.columns.indexOf('payload_json');
  if (payloadIndex < 0) throw new Error('SQLite query did not return payload_json');
  return first.values.map(row => {
    const payload = row[payloadIndex];
    if (typeof payload !== 'string') throw new Error('SQLite payload_json must be text');
    return JSON.parse(payload) as T;
  });
}

export function queryOneJson<T>(
  database: RuntimeDatabase,
  sql: string,
  params: Array<string | number | null> = [],
): T | null {
  return queryJsonRows<T>(database, sql, params)[0] ?? null;
}

export function queryKeyedJson<T>(
  database: RuntimeDatabase,
  sql: string,
  keyColumns: readonly string[],
): Record<string, T> {
  const result = database.exec(sql);
  const first = result[0];
  if (!first) return {};
  const payloadIndex = first.columns.indexOf('payload_json');
  const keyIndexes = keyColumns.map(column => first.columns.indexOf(column));
  if (payloadIndex < 0 || keyIndexes.some(index => index < 0)) {
    throw new Error('SQLite keyed query did not return required columns');
  }
  const output: Record<string, T> = {};
  for (const row of first.values) {
    const key = keyIndexes.map(index => String(row[index] ?? '')).join('/');
    const payload = row[payloadIndex];
    if (!key || typeof payload !== 'string') continue;
    output[key] = JSON.parse(payload) as T;
  }
  return output;
}

export function queryMetaJson<T>(
  database: RuntimeDatabase,
  key: string,
): T {
  const result = database.exec(
    'SELECT value FROM atlas_meta WHERE key=? LIMIT 1',
    [key],
  );
  const value = result[0]?.values[0]?.[0];
  if (typeof value !== 'string') throw new Error(`Missing runtime database metadata: ${key}`);
  return JSON.parse(value) as T;
}

export function queryDocument<T>(
  database: RuntimeDatabase,
  name: string,
): T {
  const value = queryOptionalDocument<T>(database, name);
  if (value === null) throw new Error(`Missing runtime database document: ${name}`);
  return value;
}

export function queryOptionalDocument<T>(
  database: RuntimeDatabase,
  name: string,
): T | null {
  const result = database.exec(
    'SELECT payload_json FROM atlas_documents WHERE name=? LIMIT 1',
    [name],
  );
  const value = result[0]?.values[0]?.[0];
  return typeof value === 'string' ? JSON.parse(value) as T : null;
}

async function decompressGzip(response: Response): Promise<Uint8Array> {
  const bytes = new Uint8Array(await response.arrayBuffer());
  const isGzipPayload = bytes[0] === 0x1f && bytes[1] === 0x8b;
  if (!isGzipPayload) return bytes;

  if (typeof DecompressionStream === 'undefined') {
    throw new Error('This browser does not support gzip database decompression');
  }
  const body = new Response(bytes).body;
  if (!body) throw new Error('Runtime database response body is unavailable');
  const stream = body.pipeThrough(new DecompressionStream('gzip'));
  return new Uint8Array(await new Response(stream).arrayBuffer());
}
