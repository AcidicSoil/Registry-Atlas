import { describe, expect, it } from 'vitest';
// @ts-ignore Standalone Node script.
import { verifyOfficialItem, recoverOfficialItem } from '../../scripts/recover-item-evidence.mjs';

describe('official item recovery', () => {
  const registry = { name: '@8bitcn', homepage: 'https://www.8bitcn.com', url: 'https://www.8bitcn.com/r/{name}.json' };
  const source = 'https://www.8bitcn.com/r/button.json';
  const item = { name: 'button', type: 'registry:ui', title: 'Button', dependencies: ['clsx'], files: [{ path: 'button.tsx', type: 'registry:ui', content: 'private source' }] };
  it('rejects wrong identity, URL or schema', () => {
    expect(verifyOfficialItem(registry, 'button', source, item).status).toBe('verified');
    expect(verifyOfficialItem(registry, 'input', source, item).status).toBe('unresolved');
    expect(verifyOfficialItem(registry, 'button', source, { ...item, name: 'input' }).status).toBe('unresolved');
    expect(verifyOfficialItem(registry, 'button', source, { ...item, dependencies: 'unknown' }).status).toBe('unresolved');
  });
  it('accepts only the official item route, no executable content or fabricated docs', () => {
    const result = verifyOfficialItem(registry, 'button', source, item);
    expect(verifyOfficialItem(registry, 'button', 'https://other.example/r/button.json', item).status).toBe('unresolved');
    expect(result.status).toBe('verified');
    if (result.status !== 'verified') return;
    expect(result.summary.files).toEqual([{ path: 'button.tsx', type: 'registry:ui' }]);
    expect(JSON.stringify(result.summary)).not.toContain('private source');
    expect(result.unresolved).toContain('docsUrl');
    expect(result.summary.installCommand).toBe('npx shadcn@latest add @8bitcn/button');
  });
  it('fails closed on an upstream redirect without following it', async () => {
    const requests: Array<{ url: string; redirect: RequestRedirect | undefined }> = [];
    const redirected = async (url: string, init: RequestInit) => {
      requests.push({ url, redirect: init.redirect });
      return new Response(null, { status: 308, headers: { location: 'https://www.shadcnblocks.com/' } });
    };
    const result = await recoverOfficialItem(registry, 'button', redirected);
    expect(result).toEqual({ status: 'unresolved', reason: 'http-or-redirect-308' });
    expect(requests).toEqual([{ url: source, redirect: 'manual' }]);
  });
});
