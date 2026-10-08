export const ATLAS_CORE_SCHEMA_VERSION = 'registry-atlas.sqlite/v2';
export const ATLAS_DETAIL_SCHEMA_VERSION = 'registry-atlas-details.sqlite/v1';

export function ensureAtlasCoreSchema(db) {
  db.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS atlas_meta(
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS atlas_raw_registries(
      namespace TEXT PRIMARY KEY,
      ordinal INTEGER NOT NULL,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS atlas_registries(
      namespace TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS atlas_catalog_namespaces(
      namespace TEXT PRIMARY KEY
    );
    CREATE TABLE IF NOT EXISTS atlas_catalog_items(
      namespace TEXT NOT NULL,
      name TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      PRIMARY KEY(namespace, name),
      FOREIGN KEY(namespace) REFERENCES atlas_catalog_namespaces(namespace)
        ON UPDATE CASCADE ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_atlas_catalog_items_namespace
      ON atlas_catalog_items(namespace);
    CREATE TABLE IF NOT EXISTS atlas_item_summaries(
      namespace TEXT NOT NULL,
      slug TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      PRIMARY KEY(namespace, slug)
    );
    CREATE INDEX IF NOT EXISTS idx_atlas_item_summaries_namespace
      ON atlas_item_summaries(namespace);
    CREATE TABLE IF NOT EXISTS atlas_catalog_evidence(
      namespace TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS atlas_source_pages(
      namespace TEXT NOT NULL,
      slug TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      PRIMARY KEY(namespace, slug)
    );

    CREATE TABLE IF NOT EXISTS sources(
      namespace TEXT PRIMARY KEY,
      homepage TEXT NOT NULL,
      fingerprint TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS route_patterns(
      id INTEGER PRIMARY KEY,
      namespace TEXT NOT NULL REFERENCES sources(namespace),
      template TEXT NOT NULL,
      prefix TEXT NOT NULL,
      source TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'unverified',
      checked_at TEXT,
      failure TEXT,
      UNIQUE(namespace, template, prefix)
    );
    CREATE TABLE IF NOT EXISTS examples(
      pattern_id INTEGER NOT NULL REFERENCES route_patterns(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      url TEXT NOT NULL,
      PRIMARY KEY(pattern_id, slug, url)
    );
    CREATE TABLE IF NOT EXISTS sitemap_links(
      namespace TEXT NOT NULL REFERENCES sources(namespace),
      slug TEXT NOT NULL,
      url TEXT NOT NULL,
      observed_at TEXT NOT NULL,
      PRIMARY KEY(namespace, slug, url)
    );
    CREATE TABLE IF NOT EXISTS metadata(
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS pattern_checks(
      id INTEGER PRIMARY KEY,
      pattern_id INTEGER NOT NULL REFERENCES route_patterns(id) ON DELETE CASCADE,
      slug TEXT NOT NULL,
      url TEXT NOT NULL,
      status TEXT NOT NULL,
      reason TEXT,
      checked_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS item_routes(
      namespace TEXT NOT NULL REFERENCES sources(namespace),
      slug TEXT NOT NULL,
      source_url TEXT,
      status TEXT NOT NULL DEFAULT 'unverified',
      pattern_id INTEGER REFERENCES route_patterns(id) ON DELETE SET NULL,
      PRIMARY KEY(namespace, slug)
    );
    CREATE INDEX IF NOT EXISTS ix_patterns ON route_patterns(namespace, status);
    CREATE INDEX IF NOT EXISTS ix_items ON item_routes(status);

    CREATE TABLE IF NOT EXISTS atlas_documents(
      name TEXT PRIMARY KEY,
      kind TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS atlas_classifications(
      namespace TEXT NOT NULL,
      name TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      PRIMARY KEY(namespace, name)
    );
    CREATE TABLE IF NOT EXISTS atlas_classification_runs(
      run_id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS atlas_classification_batches(
      run_id TEXT NOT NULL,
      batch_no INTEGER NOT NULL,
      payload_json TEXT NOT NULL,
      PRIMARY KEY(run_id, batch_no)
    );
    CREATE TABLE IF NOT EXISTS atlas_classification_run_items(
      run_id TEXT NOT NULL,
      namespace TEXT NOT NULL,
      name TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      PRIMARY KEY(run_id, namespace, name)
    );
    CREATE INDEX IF NOT EXISTS idx_atlas_classification_run_items_run
      ON atlas_classification_run_items(run_id, namespace, name);
  `);
  setMeta(db, 'atlas_core_schema', ATLAS_CORE_SCHEMA_VERSION);
}

export function ensureAtlasDetailSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS atlas_detail_meta(
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS atlas_item_details(
      namespace TEXT NOT NULL,
      name TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      PRIMARY KEY(namespace, name)
    );
    CREATE INDEX IF NOT EXISTS idx_atlas_item_details_namespace
      ON atlas_item_details(namespace);
  `);
  db.prepare(`
    INSERT INTO atlas_detail_meta(key,value) VALUES('schema',?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(ATLAS_DETAIL_SCHEMA_VERSION);
}

export function transaction(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    try { db.exec('ROLLBACK'); } catch {}
    throw error;
  }
}

export function setMeta(db, key, value) {
  db.prepare(`
    INSERT INTO atlas_meta(key,value) VALUES(?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `).run(String(key), String(value));
}

export function getMeta(db, key) {
  return db.prepare('SELECT value FROM atlas_meta WHERE key=?').get(String(key))?.value ?? null;
}

export function replaceRawRegistries(db, registries) {
  transaction(db, () => {
    db.exec('DELETE FROM atlas_raw_registries');
    const insert = db.prepare(
      'INSERT INTO atlas_raw_registries(namespace,ordinal,payload_json) VALUES(?,?,?)',
    );
    registries.forEach((registry, ordinal) => {
      const namespace = normalizeNamespace(registry?.name);
      if (!namespace) return;
      insert.run(namespace, ordinal, JSON.stringify(registry));
    });
  });
}

export function readRawRegistries(db) {
  return db.prepare(
    'SELECT payload_json FROM atlas_raw_registries ORDER BY ordinal, namespace',
  ).all().map(row => JSON.parse(row.payload_json));
}

export function replaceRegistrySnapshot(db, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.registries)) {
    throw new Error('Registry snapshot requires a registries array');
  }
  transaction(db, () => {
    db.exec('DELETE FROM atlas_registries');
    db.exec('DELETE FROM atlas_item_summaries');
    const insertRegistry = db.prepare(
      'INSERT INTO atlas_registries(namespace,payload_json) VALUES(?,?)',
    );
    const insertSummary = db.prepare(
      'INSERT INTO atlas_item_summaries(namespace,slug,payload_json) VALUES(?,?,?)',
    );
    for (const registry of snapshot.registries) {
      const namespace = normalizeNamespace(registry?.official?.name);
      if (!namespace) throw new Error('Registry snapshot contains an invalid namespace');
      insertRegistry.run(namespace, JSON.stringify(registry));
      for (const summary of registry?.atlas?.item_summaries ?? []) {
        const slug = typeof summary?.slug === 'string' ? summary.slug.trim() : '';
        if (!slug) continue;
        insertSummary.run(namespace, slug, JSON.stringify(summary));
      }
    }
    writeMetaObject(db, 'registry_snapshot_meta', snapshot.meta ?? {});
  });
}

export function readRegistrySnapshot(db) {
  return {
    meta: readMetaObject(db, 'registry_snapshot_meta'),
    registries: db.prepare(
      'SELECT payload_json FROM atlas_registries ORDER BY namespace',
    ).all().map(row => JSON.parse(row.payload_json)),
  };
}

export function replaceCuratedAndRegistrySnapshot(db, itemsByNamespace, snapshot) {
  if (!snapshot || !Array.isArray(snapshot.registries)) {
    throw new Error('Registry snapshot requires a registries array');
  }
  transaction(db, () => {
    db.exec('DELETE FROM atlas_registries');
    db.exec('DELETE FROM atlas_item_summaries');

    const insertRegistry = db.prepare(
      'INSERT INTO atlas_registries(namespace,payload_json) VALUES(?,?)',
    );
    for (const registry of snapshot.registries) {
      const namespace = normalizeNamespace(registry?.official?.name);
      if (!namespace) throw new Error('Registry snapshot contains an invalid namespace');
      insertRegistry.run(namespace, JSON.stringify(registry));
    }

    const insertSummary = db.prepare(
      'INSERT INTO atlas_item_summaries(namespace,slug,payload_json) VALUES(?,?,?)',
    );
    for (const namespace of Object.keys(itemsByNamespace ?? {}).sort()) {
      for (const item of itemsByNamespace[namespace] ?? []) {
        const slug = typeof item?.slug === 'string' ? item.slug.trim() : '';
        if (!slug) continue;
        insertSummary.run(namespace, slug, JSON.stringify(item));
      }
    }
    writeMetaObject(db, 'registry_snapshot_meta', snapshot.meta ?? {});
  });
}

export function replaceCatalogSnapshot(db, snapshot) {
  if (!snapshot?.registries || typeof snapshot.registries !== 'object'
    || Array.isArray(snapshot.registries)) {
    throw new Error('Catalog snapshot requires registry buckets');
  }
  transaction(db, () => {
    db.exec('DELETE FROM atlas_catalog_items');
    db.exec('DELETE FROM atlas_catalog_namespaces');
    const insertNamespace = db.prepare(
      'INSERT INTO atlas_catalog_namespaces(namespace) VALUES(?)',
    );
    const insert = db.prepare(
      'INSERT OR IGNORE INTO atlas_catalog_items(namespace,name,payload_json) VALUES(?,?,?)',
    );
    let itemCount = 0;
    const namespaces = Object.keys(snapshot.registries).sort();
    for (const namespace of namespaces) {
      insertNamespace.run(namespace);
      const seen = new Set();
      for (const item of snapshot.registries[namespace] ?? []) {
        const name = typeof item?.name === 'string' ? item.name.trim() : '';
        if (!name || seen.has(name)) continue;
        seen.add(name);
        insert.run(namespace, name, JSON.stringify(item));
        itemCount += 1;
      }
    }
    writeMetaObject(db, 'catalog_snapshot_meta', {
      ...(snapshot.meta ?? {}),
      registry_count: namespaces.length,
      item_count: itemCount,
    });
  });
}

export function readCatalogSnapshot(db) {
  const registries = Object.fromEntries(
    db.prepare('SELECT namespace FROM atlas_catalog_namespaces ORDER BY namespace')
      .all().map(row => [row.namespace, []]),
  );
  for (const row of db.prepare(`
    SELECT namespace,payload_json
    FROM atlas_catalog_items
    ORDER BY namespace,name
  `).all()) {
    (registries[row.namespace] ??= []).push(JSON.parse(row.payload_json));
  }
  return { meta: readMetaObject(db, 'catalog_snapshot_meta'), registries };
}

export function replaceCuratedItemSummaries(db, itemsByNamespace) {
  transaction(db, () => {
    db.exec('DELETE FROM atlas_item_summaries');
    const insert = db.prepare(
      'INSERT INTO atlas_item_summaries(namespace,slug,payload_json) VALUES(?,?,?)',
    );
    for (const namespace of Object.keys(itemsByNamespace ?? {}).sort()) {
      for (const item of itemsByNamespace[namespace] ?? []) {
        const slug = typeof item?.slug === 'string' ? item.slug.trim() : '';
        if (!slug) continue;
        insert.run(namespace, slug, JSON.stringify(item));
      }
    }
  });
}

export function readCuratedItemSummaries(db) {
  const output = {};
  for (const row of db.prepare(`
    SELECT namespace,payload_json
    FROM atlas_item_summaries
    ORDER BY namespace,slug
  `).all()) {
    (output[row.namespace] ??= []).push(JSON.parse(row.payload_json));
  }
  return output;
}

export function replaceCatalogEvidence(db, evidence) {
  replaceKeyedJsonTable(db, 'atlas_catalog_evidence', 'namespace', evidence);
}

export function readCatalogEvidence(db) {
  return readKeyedJsonTable(db, 'atlas_catalog_evidence', 'namespace');
}

export function replaceSourcePages(db, pages) {
  transaction(db, () => {
    db.exec('DELETE FROM atlas_source_pages');
    const insert = db.prepare(
      'INSERT INTO atlas_source_pages(namespace,slug,payload_json) VALUES(?,?,?)',
    );
    for (const [token, value] of Object.entries(pages ?? {})) {
      const split = token.indexOf('/');
      if (split < 1) continue;
      const namespace = token.slice(0, split);
      const slug = token.slice(split + 1);
      if (!namespace || !slug) continue;
      insert.run(namespace, slug, JSON.stringify(value));
    }
  });
}

export function readSourcePages(db) {
  const output = {};
  for (const row of db.prepare(`
    SELECT namespace,slug,payload_json
    FROM atlas_source_pages
    ORDER BY namespace,slug
  `).all()) {
    output[`${row.namespace}/${row.slug}`] = JSON.parse(row.payload_json);
  }
  return output;
}

export function putDocument(db, name, kind, value, updatedAt = new Date().toISOString()) {
  db.prepare(`
    INSERT INTO atlas_documents(name,kind,payload_json,updated_at) VALUES(?,?,?,?)
    ON CONFLICT(name) DO UPDATE SET
      kind=excluded.kind,
      payload_json=excluded.payload_json,
      updated_at=excluded.updated_at
  `).run(name, kind, JSON.stringify(value), updatedAt);
}

export function readDocument(db, name) {
  const row = db.prepare(
    'SELECT payload_json FROM atlas_documents WHERE name=?',
  ).get(name);
  return row ? JSON.parse(row.payload_json) : null;
}

export function listDocuments(db, kind = null) {
  const rows = kind
    ? db.prepare(
        'SELECT name,kind,payload_json,updated_at FROM atlas_documents WHERE kind=? ORDER BY name',
      ).all(kind)
    : db.prepare(
        'SELECT name,kind,payload_json,updated_at FROM atlas_documents ORDER BY name',
      ).all();
  return rows.map(row => ({
    name: row.name,
    kind: row.kind,
    value: JSON.parse(row.payload_json),
    updatedAt: row.updated_at,
  }));
}

export function replaceClassifications(db, items) {
  transaction(db, () => {
    db.exec('DELETE FROM atlas_classifications');
    const insert = db.prepare(
      'INSERT INTO atlas_classifications(namespace,name,payload_json) VALUES(?,?,?)',
    );
    for (const item of items ?? []) {
      if (!item?.namespace || !item?.name) continue;
      insert.run(item.namespace, item.name, JSON.stringify(item));
    }
  });
}

export function readClassifications(db) {
  return db.prepare(`
    SELECT payload_json FROM atlas_classifications ORDER BY namespace,name
  `).all().map(row => JSON.parse(row.payload_json));
}

export function resetClassificationRun(db, runId) {
  transaction(db, () => {
    db.prepare('DELETE FROM atlas_classification_run_items WHERE run_id=?').run(runId);
    db.prepare('DELETE FROM atlas_classification_batches WHERE run_id=?').run(runId);
    db.prepare('DELETE FROM atlas_classification_runs WHERE run_id=?').run(runId);
  });
}

export function putClassificationRun(db, runId, value, updatedAt = new Date().toISOString()) {
  db.prepare(`
    INSERT INTO atlas_classification_runs(run_id,payload_json,updated_at) VALUES(?,?,?)
    ON CONFLICT(run_id) DO UPDATE SET
      payload_json=excluded.payload_json,
      updated_at=excluded.updated_at
  `).run(runId, JSON.stringify(value), updatedAt);
}

export function readClassificationRun(db, runId) {
  const row = db.prepare(
    'SELECT payload_json FROM atlas_classification_runs WHERE run_id=?',
  ).get(runId);
  return row ? JSON.parse(row.payload_json) : null;
}

export function putClassificationBatch(db, runId, batchNo, value) {
  db.prepare(`
    INSERT INTO atlas_classification_batches(run_id,batch_no,payload_json) VALUES(?,?,?)
    ON CONFLICT(run_id,batch_no) DO UPDATE SET payload_json=excluded.payload_json
  `).run(runId, batchNo, JSON.stringify(value));
}

export function readClassificationBatches(db, runId) {
  return db.prepare(`
    SELECT payload_json FROM atlas_classification_batches
    WHERE run_id=? ORDER BY batch_no
  `).all(runId).map(row => JSON.parse(row.payload_json));
}

export function upsertClassificationRunItems(db, runId, items) {
  transaction(db, () => {
    const insert = db.prepare(`
      INSERT INTO atlas_classification_run_items(run_id,namespace,name,payload_json)
      VALUES(?,?,?,?)
      ON CONFLICT(run_id,namespace,name) DO UPDATE SET payload_json=excluded.payload_json
    `);
    for (const item of items ?? []) {
      if (!item?.namespace || !item?.name) continue;
      insert.run(runId, item.namespace, item.name, JSON.stringify(item));
    }
  });
}

export function readClassificationRunItems(db, runId) {
  return db.prepare(`
    SELECT payload_json FROM atlas_classification_run_items
    WHERE run_id=? ORDER BY namespace,name
  `).all(runId).map(row => JSON.parse(row.payload_json));
}

export function replaceItemDetails(db, namespace, items) {
  transaction(db, () => {
    db.prepare('DELETE FROM atlas_item_details WHERE namespace=?').run(namespace);
    const insert = db.prepare(
      'INSERT OR IGNORE INTO atlas_item_details(namespace,name,payload_json) VALUES(?,?,?)',
    );
    for (const item of items ?? []) {
      const name = typeof item?.name === 'string' ? item.name.trim() : '';
      if (!name) continue;
      insert.run(namespace, name, JSON.stringify(item));
    }
  });
}

export function readItemDetail(db, namespace, name) {
  const row = db.prepare(`
    SELECT payload_json FROM atlas_item_details WHERE namespace=? AND name=?
  `).get(namespace, name);
  return row ? JSON.parse(row.payload_json) : null;
}

export function readItemDetailsForRegistry(db, namespace) {
  return db.prepare(`
    SELECT payload_json FROM atlas_item_details
    WHERE namespace=? ORDER BY name
  `).all(namespace).map(row => JSON.parse(row.payload_json));
}

function replaceKeyedJsonTable(db, table, keyColumn, values) {
  transaction(db, () => {
    db.exec(`DELETE FROM ${table}`);
    const insert = db.prepare(
      `INSERT INTO ${table}(${keyColumn},payload_json) VALUES(?,?)`,
    );
    for (const key of Object.keys(values ?? {}).sort()) {
      insert.run(key, JSON.stringify(values[key]));
    }
  });
}

function readKeyedJsonTable(db, table, keyColumn) {
  const output = {};
  for (const row of db.prepare(
    `SELECT ${keyColumn} AS key,payload_json FROM ${table} ORDER BY ${keyColumn}`,
  ).all()) {
    output[row.key] = JSON.parse(row.payload_json);
  }
  return output;
}

function writeMetaObject(db, key, value) {
  setMeta(db, key, JSON.stringify(value ?? {}));
}

function readMetaObject(db, key) {
  const value = getMeta(db, key);
  return value ? JSON.parse(value) : {};
}

function normalizeNamespace(value) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
}
