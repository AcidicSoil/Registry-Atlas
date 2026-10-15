#!/usr/bin/env node
/** Generate a CycloneDX component inventory from the frozen pnpm lockfile. */
import { createHash } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { parse } from 'yaml';

export function parsePackageKey(key) {
  const separator = key.lastIndexOf('@');

  if (separator < 1) throw new Error('Invalid pnpm package identity: ' + key);

  return { name: key.slice(0, separator), version: key.slice(separator + 1).split('(')[0] };
}

function hashForIntegrity(integrity) {
  if (!integrity?.startsWith('sha512-')) return [];

  return [{ alg: 'SHA-512', content: Buffer.from(integrity.slice(7).split(' ')[0], 'base64').toString('hex') }];
}

function asPurl({ name, version }) {
  const path = name.startsWith('@') ? '%40' + name.slice(1) : name;

  return `pkg:npm/${path}@${version}`;
}

export function buildCycloneDxSbom(lock, project) {
  const packages = Object.entries(lock.packages ?? {});

  const components = packages.map(([key, info]) => {
    const identity = parsePackageKey(key);
    const purl = asPurl(identity);

    return {
      type: 'library',
      'bom-ref': purl,
      ...identity,
      purl,
      hashes: hashForIntegrity(info.resolution?.integrity),
    };
  }).sort((a, b) => a.purl.localeCompare(b.purl));

  const contentHash = createHash('sha256').update(JSON.stringify(packages)).digest('hex');

  const id = contentHash.slice(0, 8) + '-' + contentHash.slice(8, 12) + '-4' + contentHash.slice(13, 16)
    + '-a' + contentHash.slice(17, 20) + '-' + contentHash.slice(20, 32);

  return {
    bomFormat: 'CycloneDX',
    specVersion: '1.6',
    serialNumber: 'urn:uuid:' + id,
    version: 1,
    metadata: {
      component: { type: 'application', name: project.name, version: project.version ?? '0.0.0' },
    },
    components,
  };
}

async function main() {
  const lock = parse(await readFile('pnpm-lock.yaml', 'utf8'));
  const project = JSON.parse(await readFile('package.json', 'utf8'));
  const output = buildCycloneDxSbom(lock, project);

  await writeFile('dist/sbom.cdx.json', JSON.stringify(output, null, 2) + '\n');
  console.log('SBOM_OK', output.components.length, 'pinned dependencies');
}

if (process.argv[1] && process.argv[1].endsWith('/generate-sbom.mjs')) {
  main().catch(error => {
    console.error('SBOM_FAILED', error.message);
    process.exitCode = 1;
  });
}
