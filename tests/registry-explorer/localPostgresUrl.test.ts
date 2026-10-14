import { describe, expect, it } from 'vitest';
// @ts-ignore Server-side JavaScript database connection policy.
import { localPostgresUrl } from '../../scripts/lib/local-postgres-url.mjs';

describe('self-hosted PostgreSQL connection policy', () => {
  it('allows a local PostgreSQL database connection', () => {
    const url = localPostgresUrl('postgresql://atlas:secret@127.0.0.1:55432/atlas');

    expect(new URL(url).hostname).toBe('127.0.0.1');
    expect(new URL(url).pathname).toBe('/atlas');
  });

  it('rejects remotely hosted providers and non-PostgreSQL URLs', () => {
    expect(() => localPostgresUrl('postgresql://atlas:secret@database.neon.tech/atlas'))
      .toThrow(/locally hosted PostgreSQL/);
    expect(() => localPostgresUrl('postgresql://atlas:secret@db.example.com/atlas'))
      .toThrow(/locally hosted PostgreSQL/);
    expect(() => localPostgresUrl('sqlite:///tmp/atlas.db'))
      .toThrow(/PostgreSQL connection/);
  });

  it('never accepts a public IP database URL', () => {
    expect(() => localPostgresUrl('postgresql://atlas:secret@203.0.113.1:5432/atlas'))
      .toThrow(/locally hosted PostgreSQL/);
  });
});
