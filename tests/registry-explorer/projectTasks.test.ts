import { describe, expect, it } from 'vitest';
import packageJson from '../../package.json';
import { resolveTask } from '../../scripts/project-tasks.mjs';

describe('package script surface', () => {
  it('exposes a compact set of primary entrypoints without redundant aliases', () => {
    const scripts = packageJson.scripts;
    expect(Object.keys(scripts).length).toBeLessThanOrEqual(34);

    for (const name of ['dev', 'build', 'test', 'verify', 'verify:local', 'lint:deps',
      'lint:react-doctor', 'db', 'sync', 'test:e2e', 'prepare:runtime-data',
      'check:runtime-data', 'predev', 'pretest', 'prebuild']) {
      expect(scripts).toHaveProperty(name);
    }

    for (const redundant of ['all', 'doctor', 'lint:boundaries',
      'db:setup', 'db:up', 'db:down', 'db:status', 'db:backup', 'db:restore-check',
      'db:reconcile-source-evidence', 'sync:registries', 'sync:catalog-evidence',
      'sync:registry-icons', 'test:e2e:smoke', 'test:e2e:mobile']) {
      expect(scripts).not.toHaveProperty(redundant);
    }

    expect(scripts['lint:deps']).toBe('depcruise src tests --config .dependency-cruiser.cjs');
  });

  it('maps existing database operations without changing their underlying commands', () => {
    const cases: Array<[string, string, string[]]> = [
      ['setup', 'node', ['scripts/manage-local-postgres.mjs', 'setup']],
      ['up', 'node', ['scripts/manage-local-postgres.mjs', 'up']],
      ['down', 'node', ['scripts/manage-local-postgres.mjs', 'down']],
      ['status', 'node', ['scripts/manage-local-postgres.mjs', 'status']],
      ['backup', 'bash', ['scripts/backup-local-postgres.sh']],
      ['restore-check', 'bash', ['scripts/check-local-postgres-backup.sh', '/tmp/a.dump']],
      ['reconcile-source-evidence', 'node', ['scripts/reconcile-runtime-source-evidence.mjs', '--apply']],
    ];

    for (const [operation, executable, args] of cases) {
      const extra = operation === 'restore-check' ? ['/tmp/a.dump'] : [];
      expect(resolveTask('db', operation, extra)).toEqual({ executable, args });
    }
  });

  it('maps registry sync operations without changing data flow', () => {
    expect(resolveTask('sync', 'registries')).toEqual({
      executable: 'node', args: ['scripts/sync-shadcn-registries.mjs'],
    });
    expect(resolveTask('sync', 'catalog-evidence')).toEqual({
      executable: 'node', args: ['scripts/sync-registry-catalog-evidence.mjs'],
    });
    expect(resolveTask('sync', 'registry-icons')).toEqual({
      executable: 'node', args: ['scripts/discover-registry-icons.mjs'],
    });
  });

  it('rejects unknown operations and unexpected arguments before launching anything', () => {
    expect(() => resolveTask('db', 'drop')).toThrow(/Unknown/);
    expect(() => resolveTask('sync', 'bad')).toThrow(/Unknown/);
    expect(() => resolveTask('db', 'up', ['--force'])).toThrow(/arguments/);
    expect(() => resolveTask('sync', 'registries', ['--apply'])).toThrow(/arguments/);
    expect(() => resolveTask('db', 'restore-check')).toThrow(/exactly one/);
    expect(() => resolveTask('db', 'restore-check', ['a', 'b'])).toThrow(/exactly one/);
  });
});
