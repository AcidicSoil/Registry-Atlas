import { DatabaseSync } from 'node:sqlite';

function openRepositoryDatabase(): DatabaseSync {
  return new DatabaseSync('data/registry-atlas.sqlite', { readOnly: true });
}

export function readRepositoryDocument<T = unknown>(name: string): T {
  const database = openRepositoryDatabase();
  try {
    const row = database.prepare(
      'SELECT payload_json FROM atlas_documents WHERE name=? LIMIT 1',
    ).get(name) as { payload_json?: string } | undefined;
    if (!row?.payload_json) throw new Error(`Missing repository database document: ${name}`);
    return JSON.parse(row.payload_json) as T;
  } finally {
    database.close();
  }
}

export function readRepositoryCatalog<T = unknown>(): T {
  const database = openRepositoryDatabase();
  try {
    const metaRow = database.prepare(
      "SELECT value FROM atlas_meta WHERE key='catalog_snapshot_meta'",
    ).get() as { value?: string } | undefined;
    if (!metaRow?.value) throw new Error('Missing catalog snapshot metadata');
    const registries: Record<string, unknown[]> = {};
    for (const row of database.prepare(
      'SELECT namespace FROM atlas_catalog_namespaces ORDER BY namespace',
    ).all() as Array<{ namespace: string }>) {
      registries[row.namespace] = [];
    }
    for (const row of database.prepare(
      'SELECT namespace,payload_json FROM atlas_catalog_items ORDER BY namespace,name',
    ).all() as Array<{ namespace: string; payload_json: string }>) {
      (registries[row.namespace] ??= []).push(JSON.parse(row.payload_json));
    }
    return { meta: JSON.parse(metaRow.value), registries } as T;
  } finally {
    database.close();
  }
}

export function readRepositoryRegistrySnapshot<T = unknown>(): T {
  const database = openRepositoryDatabase();
  try {
    const metaRow = database.prepare(
      "SELECT value FROM atlas_meta WHERE key='registry_snapshot_meta'",
    ).get() as { value?: string } | undefined;
    if (!metaRow?.value) throw new Error('Missing registry snapshot metadata');
    const registries = database.prepare(
      'SELECT payload_json FROM atlas_registries ORDER BY namespace',
    ).all().map((row: any) => JSON.parse(row.payload_json));
    return { meta: JSON.parse(metaRow.value), registries } as T;
  } finally {
    database.close();
  }
}
