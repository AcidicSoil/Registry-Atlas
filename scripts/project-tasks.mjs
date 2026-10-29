#!/usr/bin/env node
/** Group infrequent maintenance commands without adding package.json aliases. */
import { spawnSync } from 'node:child_process';
import { pathToFileURL } from 'node:url';

const tasks = {
  db: {
    setup: ['node', 'scripts/manage-local-postgres.mjs', 'setup'],
    up: ['node', 'scripts/manage-local-postgres.mjs', 'up'],
    down: ['node', 'scripts/manage-local-postgres.mjs', 'down'],
    status: ['node', 'scripts/manage-local-postgres.mjs', 'status'],
    backup: ['bash', 'scripts/backup-local-postgres.sh'],
    'restore-check': ['bash', 'scripts/check-local-postgres-backup.sh'],
    'reconcile-source-evidence': ['node', 'scripts/reconcile-runtime-source-evidence.mjs', '--apply'],
  },
  sync: {
    registries: ['node', 'scripts/sync-shadcn-registries.mjs'],
    'catalog-evidence': ['node', 'scripts/sync-registry-catalog-evidence.mjs'],
    'registry-icons': ['node', 'scripts/discover-registry-icons.mjs'],
  },
};

export function resolveTask(group, operation, extraArgs = []) {
  const entries = Object.hasOwn(tasks, group) ? tasks[group] : null;
  const command = entries && Object.hasOwn(entries, operation) ? entries[operation] : null;

  if (!command) throw new Error(`Unknown task: ${group} ${operation}\n${usage()}`);

  if (group === 'db' && operation === 'restore-check') {
    if (extraArgs.length !== 1 || !extraArgs[0]) {
      throw new Error('db restore-check requires exactly one backup file path');
    }
  } else if (extraArgs.length) {
    throw new Error(`${group} ${operation} does not accept extra arguments`);
  }

  return { executable: command[0], args: [...command.slice(1), ...extraArgs] };
}

function usage() {
  return Object.entries(tasks)
    .map(([group, entries]) => `pnpm ${group} <${Object.keys(entries).join('|')}>`)
    .join('\n');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [group, operation, ...extraArgs] = process.argv.slice(2);

  if (!group || !operation || group === '--help' || operation === '--help') {
    console.log(usage());
    process.exitCode = group === '--help' || operation === '--help' ? 0 : 2;
  } else {
    try {
      const { executable, args } = resolveTask(group, operation, extraArgs);
      const result = spawnSync(executable, args, { stdio: 'inherit' });

      if (result.error) throw result.error;
      process.exitCode = result.status ?? 1;
    } catch (error) {
      console.error(error.message);
      process.exitCode = 2;
    }
  }
}
