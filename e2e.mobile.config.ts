import { web } from '@e2e-dev/web';
import type { E2EConfig } from 'e2e';

export default {
  tests: 'tests-mobile/**/*.e2e.ts',
  targets: [
    {
      name: 'registry-atlas-mobile',
      engine: web({ viewport: { width: 390, height: 844 } }),
      app: {
        url: 'http://127.0.0.1:0/Registry-Atlas/',
        command: {
          executable: 'pnpm',
          args: ['exec', 'vite', 'preview', '--host', '127.0.0.1', '--port', '{port}', '--strictPort'],
          startupTimeout: 90_000,
          log: '.e2e/logs/vite-mobile.log',
        },
      },
    },
  ],
  assertionTimeout: 20_000,
  actionTimeout: 90_000,
  timeout: 180_000,
  workers: 1,
  retries: 0,
  trace: 'on',
  reporters: ['list'],
} satisfies E2EConfig;
