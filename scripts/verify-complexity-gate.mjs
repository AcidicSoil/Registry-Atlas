#!/usr/bin/env node
// cccc official TOML pass-fail-pass proof. A throwaway function intentionally
// exceeds the strict project threshold. Cleanup runs in finally.
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');

const probe = resolve(root, 'src/registry-explorer/core/__complexity_gate_probe.ts');

function scan() {
  const result = spawnSync('cccc', ['src/registry-explorer'], {
    cwd: root, encoding: 'utf8', maxBuffer: 8 * 1024 * 1024, timeout: 120_000,
  });

  if (result.error) throw result.error;

  return { code: result.status, output: result.stdout + result.stderr };
}

function expectClean(context) {
  const result = scan();

  if (result.code !== 0) throw Error(context + ': normal cccc source scan failed. ' +
    result.output.slice(-2000));
}

expectClean('before proof');

try {
  const tests = Array.from({ length: 20 }, (_, n) =>
    '  if (input === ' + n + ') return ' + n + ';');

  writeFileSync(probe,
    ['export function deliberateComplexityViolation(input: number): number {',
      ...tests, '  return -1;', '}', ''].join('\n'), { flag: 'wx' });
  const result = scan();

  if (result.code === 0 || !result.output.includes('__complexity_gate_probe.ts')) {
    throw Error('cccc did not reject deliberately complex authored function: ' +
      result.output.slice(-2000));
  }

  console.log('PASS: cccc rejects an added function that exceeds 15/10.');
} finally {
  rmSync(probe, { force: true });
}

expectClean('after proof cleanup');

console.log('PASS: cccc clean -> violation -> clean, official cccc.toml unchanged.');
