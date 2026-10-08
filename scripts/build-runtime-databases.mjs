#!/usr/bin/env node
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { gzipSync } from 'node:zlib';
import { DatabaseSync } from 'node:sqlite';
import { pathToFileURL } from 'node:url';

const DEFAULT_CORE = 'data/registry-atlas.sqlite';
const DEFAULT_DETAILS = 'data/registry-details.sqlite';
const DEFAULT_OUTPUT = '.instance/runtime-db';

function quoteSqliteString(value) {
  return String(value).replaceAll("'", "''");
}

function compactCoreDatabase(sourcePath, outputPath) {
  const db = new DatabaseSync(outputPath);
  try {
    const source = quoteSqliteString(resolve(sourcePath));
    db.exec(`
      ATTACH DATABASE '${source}' AS source;
      CREATE TABLE atlas_meta AS
        SELECT key,value FROM source.atlas_meta
        WHERE key IN ('atlas_core_schema','registry_snapshot_meta','catalog_snapshot_meta');
      CREATE UNIQUE INDEX idx_runtime_meta_key ON atlas_meta(key);

      CREATE TABLE atlas_registries AS
        SELECT namespace,payload_json FROM source.atlas_registries;
      CREATE UNIQUE INDEX idx_runtime_registries_namespace ON atlas_registries(namespace);

      CREATE TABLE atlas_catalog_namespaces AS
        SELECT namespace FROM source.atlas_catalog_namespaces;
      CREATE UNIQUE INDEX idx_runtime_catalog_namespaces
        ON atlas_catalog_namespaces(namespace);

      CREATE TABLE atlas_catalog_items AS
        SELECT namespace,name,payload_json FROM source.atlas_catalog_items;
      CREATE UNIQUE INDEX idx_runtime_catalog_identity ON atlas_catalog_items(namespace,name);
      CREATE INDEX idx_runtime_catalog_namespace ON atlas_catalog_items(namespace);

      CREATE TABLE atlas_item_summaries AS
        SELECT namespace,slug,payload_json FROM source.atlas_item_summaries;
      CREATE UNIQUE INDEX idx_runtime_summary_identity ON atlas_item_summaries(namespace,slug);
      CREATE INDEX idx_runtime_summary_namespace ON atlas_item_summaries(namespace);

      CREATE TABLE atlas_source_pages AS
        SELECT namespace,slug,payload_json FROM source.atlas_source_pages;
      CREATE UNIQUE INDEX idx_runtime_source_page_identity ON atlas_source_pages(namespace,slug);

      CREATE TABLE atlas_item_routes AS
        SELECT namespace,slug,source_url,status FROM source.item_routes
        WHERE source_url IS NOT NULL;
      CREATE UNIQUE INDEX idx_runtime_item_route_identity ON atlas_item_routes(namespace,slug);

      CREATE TABLE atlas_route_patterns AS
        SELECT namespace,template,prefix,source,checked_at FROM source.route_patterns
        WHERE status='verified';
      CREATE INDEX idx_runtime_route_pattern_namespace ON atlas_route_patterns(namespace);

      CREATE TABLE atlas_documents AS
        SELECT name,kind,payload_json,updated_at FROM source.atlas_documents
        WHERE name IN ('catalog-taxonomy','catalog-kind-overrides','source-page-index-meta','registry-icons');
      CREATE UNIQUE INDEX idx_runtime_documents_name ON atlas_documents(name);

      DETACH DATABASE source;
      VACUUM;
      PRAGMA optimize;
    `);
  } finally {
    db.close();
  }
}

function compactDetailDatabase(sourcePath, outputPath) {
  const db = new DatabaseSync(outputPath);
  try {
    const source = quoteSqliteString(resolve(sourcePath));
    db.exec(`
      ATTACH DATABASE '${source}' AS source;
      CREATE TABLE atlas_detail_meta AS
        SELECT key,value FROM source.atlas_detail_meta;
      CREATE UNIQUE INDEX idx_runtime_detail_meta_key ON atlas_detail_meta(key);

      CREATE TABLE atlas_item_details AS
        SELECT namespace,name,payload_json FROM source.atlas_item_details;
      CREATE UNIQUE INDEX idx_runtime_detail_identity ON atlas_item_details(namespace,name);
      CREATE INDEX idx_runtime_detail_namespace ON atlas_item_details(namespace);

      DETACH DATABASE source;
      VACUUM;
      PRAGMA optimize;
    `);
  } finally {
    db.close();
  }
}

async function gzipDatabase(inputPath, outputPath) {
  const bytes = await readFile(inputPath);
  const compressed = gzipSync(bytes, { level: 9, mtime: 0 });
  await writeFile(outputPath, compressed);
  return { rawBytes: bytes.byteLength, gzipBytes: compressed.byteLength };
}

export async function buildRuntimeDatabases({
  corePath = DEFAULT_CORE,
  detailPath = DEFAULT_DETAILS,
  outputDir = DEFAULT_OUTPUT,
} = {}) {
  const absoluteOutput = resolve(outputDir);
  await mkdir(absoluteOutput, { recursive: true });
  const coreSqlitePath = join(absoluteOutput, 'registry-atlas.sqlite');
  const detailSqlitePath = join(absoluteOutput, 'registry-details.sqlite');
  const coreGzipPath = coreSqlitePath + '.gz';
  const detailGzipPath = detailSqlitePath + '.gz';

  await Promise.all([
    rm(coreSqlitePath, { force: true }),
    rm(detailSqlitePath, { force: true }),
    rm(coreGzipPath, { force: true }),
    rm(detailGzipPath, { force: true }),
  ]);

  compactCoreDatabase(resolve(corePath), coreSqlitePath);
  compactDetailDatabase(resolve(detailPath), detailSqlitePath);

  const [coreSize, detailSize] = await Promise.all([
    gzipDatabase(coreSqlitePath, coreGzipPath),
    gzipDatabase(detailSqlitePath, detailGzipPath),
  ]);
  await Promise.all([
    rm(coreSqlitePath, { force: true }),
    rm(detailSqlitePath, { force: true }),
  ]);

  return {
    outputDir: absoluteOutput,
    coreSqlitePath,
    detailSqlitePath,
    coreGzipPath,
    detailGzipPath,
    coreSize,
    detailSize,
  };
}

function parseArgs(argv) {
  const options = { corePath: DEFAULT_CORE, detailPath: DEFAULT_DETAILS, outputDir: DEFAULT_OUTPUT };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!['--core', '--details', '--output-dir'].includes(flag)) throw new Error(`Unknown argument: ${flag}`);
    const value = argv[++index];
    if (!value || value.startsWith('--')) throw new Error(`Missing value for ${flag}`);
    if (flag === '--core') options.corePath = value;
    else if (flag === '--details') options.detailPath = value;
    else options.outputDir = value;
  }
  return options;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = parseArgs(process.argv.slice(2));
  buildRuntimeDatabases(options).then(result => {
    console.log(JSON.stringify(result, null, 2));
  }).catch(error => {
    console.error(error instanceof Error ? error.stack ?? error.message : error);
    process.exitCode = 1;
  });
}
