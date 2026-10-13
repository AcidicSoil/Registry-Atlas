#!/usr/bin/env node
/** Verify the strict root Oxlint policy rejects a genuine regression. */
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const probe = resolve(root, 'src/registry-explorer/core/__anti_slop_gate_probe.ts');

function scan() {
  const result = spawnSync('pnpm', ['lint:anti-slop'], {
    cwd: root,
    encoding: 'utf8',
    timeout: 120_000,
    maxBuffer: 8 * 1024 * 1024,
  });

  if (result.error) throw result.error;

  return { exitCode: result.status, output: result.stdout + result.stderr };
}

function expectClean(phase) {
  const result = scan();

  if (result.exitCode !== 0) {
    throw new Error(phase + ': anti-slop did not pass: ' + result.output.slice(-1800));
  }
}

expectClean('before injected failure');

try {
  writeFileSync(probe,
    'export function deliberatelyInvalid(value: unknown) { return typeof value === "string"; }\n',
    { flag: 'wx' });

  const failing = scan();

  if (failing.exitCode === 0
    || !failing.output.includes('__anti_slop_gate_probe.ts')) {
    throw new Error('Root lint failed to detect injected violation: ' + failing.output.slice(-1800));
  }

  process.stdout.write('PASS: clean lint rejects injected TypeScript violation.\n');
} finally {
  rmSync(probe, { force: true });
}

expectClean('after cleanup');

process.stdout.write('PASS: clean → fail → clean, original rule set preserved.\n');
