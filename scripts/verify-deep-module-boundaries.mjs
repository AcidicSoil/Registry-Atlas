#!/usr/bin/env node
// Repeatable deep-module architecture proof. All intentionally invalid files
// are removed before returning, including on failure or interruption.
import { spawnSync } from 'node:child_process';
import { writeFileSync, rmSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const command = ['exec', 'depcruise', 'src', 'tests', '--config', '.dependency-cruiser.cjs'];

function cruise() {
  const result = spawnSync('pnpm', command, {
    cwd: root, encoding: 'utf8', timeout: 120_000,
  });
  if (result.error) throw result.error;
  return { exit: result.status, output: result.stdout + result.stderr };
}

const proofs = [
  {
    name: 'application must use public core entry points',
    files: {
      'src/registry-explorer/__deep_module_probe.ts':
        "import { isPublicHostname } from './core/lib/sourcePageOrigin'; export const probe = isPublicHostname;\n",
    },
    rule: 'entrypoint-boundary-from-app',
  },
  {
    name: 'cross-package import must use entry points',
    files: {
      'src/registry-explorer/data/__deep_module_probe.ts':
        "import { isPublicHostname } from '../core/lib/sourcePageOrigin'; export const probe = isPublicHostname;\n",
    },
    rule: 'entrypoint-boundary-across-packages',
  },
  {
    name: 'tests must use public entry points',
    files: {
      'tests/registry-explorer/__deep_module_probe.ts':
        "import { isPublicHostname } from '../../src/registry-explorer/core/lib/sourcePageOrigin'; export const probe = isPublicHostname;\n",
    },
    rule: 'tests-through-entrypoints',
  },
  {
    name: 'test fixtures are private',
    files: {
      'src/registry-explorer/core/tests/__deep_module_fixture.ts': 'export const probe = true;\n',
      'src/registry-explorer/core/__deep_module_probe.ts':
        "import { probe } from './tests/__deep_module_fixture'; export { probe };\n",
    },
    rule: 'tests-folder-is-private',
  },
  {
    name: 'cycles are forbidden',
    files: {
      'src/registry-explorer/core/__deep_module_probe_one.ts':
        "import { two } from './__deep_module_probe_two'; export const one = () => two;\n",
      'src/registry-explorer/core/__deep_module_probe_two.ts':
        "import { one } from './__deep_module_probe_one'; export const two = () => one;\n",
    },
    rule: 'no-circular',
  },
];

function assertClean(label) {
  const result = cruise();
  if (result.exit !== 0) throw Error(label + ': expected clean dependency graph.\n' + result.output);
}

assertClean('initial');
for (const proof of proofs) {
  const paths = Object.keys(proof.files).map(name => resolve(root, name));
  try {
    for (const [name, content] of Object.entries(proof.files)) {
      const path = resolve(root, name);
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, content, { flag: 'wx' }); // never replace owned files
    }
    const result = cruise();
    if (result.exit === 0 || !result.output.includes(proof.rule)) {
      throw Error(proof.name + ': rule did not fire.\n' + result.output);
    }
    console.log('PASS: ' + proof.name + ' -> ' + proof.rule);
  } finally {
    for (const path of paths) rmSync(path, { force: true });
  }
  assertClean(proof.name + ' cleanup');
}
console.log('All five dependency boundaries passed clean -> violation -> clean.');
