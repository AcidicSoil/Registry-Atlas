#!/usr/bin/env node
/** Local-only PostgreSQL lifecycle. Credentials stay in ignored, owner-only files. */
import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const ENV_FILE = '.instance/local-postgres.env';

const URL_FILE = '.instance/local-postgres-url';

const TEST_FILE = '.instance/local-postgres-test-url';

const COMPOSE_FILE = 'infrastructure/postgres/compose.yml';

async function setup() {
  await mkdir('.instance', { recursive: true, mode: 0o700 });

  let password;

  try {
    const [env, url] = await Promise.all([readFile(ENV_FILE, 'utf8'), readFile(URL_FILE, 'utf8')]);
    const matched = /^ATLAS_LOCAL_POSTGRES_PASSWORD=([a-f0-9]{64})\n?$/.exec(env);

    if (!matched || !url.includes(matched[1])) throw Error('Local database credential files disagree');

    password = matched[1];
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;

    password = randomBytes(32).toString('hex');
    await writeFile(ENV_FILE, `ATLAS_LOCAL_POSTGRES_PASSWORD=${password}\n`, { mode: 0o600, flag: 'wx' });
    await writeFile(URL_FILE, `postgresql://atlas:${password}@127.0.0.1:55432/atlas\n`, { mode: 0o600, flag: 'wx' });
  }

  await writeFile(TEST_FILE, `postgresql://atlas:${password}@127.0.0.1:55432/atlas_test\n`, { mode: 0o600 });
}

function compose(command) {
  const result = spawnSync('docker', [
    'compose', '--env-file', ENV_FILE, '-f', COMPOSE_FILE, ...command,
  ], { stdio: 'inherit' });

  if (result.error) throw result.error;

  if (result.status !== 0) process.exitCode = result.status || 1;
}

const command = process.argv[2] ?? 'status';

try {
  if (!['setup', 'up', 'down', 'status'].includes(command)) {
    throw Error('Usage: node scripts/manage-local-postgres.mjs setup|up|down|status');
  }

  await setup();

  if (command === 'up') compose(['up', '-d', '--wait']);

  if (command === 'down') compose(['down']);

  if (command === 'status') compose(['ps']);

  if (command === 'setup') console.log('Local PostgreSQL credentials are ready.');
} catch (error) {
  console.error('LOCAL_POSTGRES_SETUP_FAILED', error.message);
  process.exitCode = 1;
}
