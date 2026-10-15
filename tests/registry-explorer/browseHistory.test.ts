import { describe, expect, it } from 'vitest';

import { parseBrowseSnapshot, browseSnapshotKey } from '../../src/registry-explorer/ui/browseHistory';

describe('catalog back-navigation state', () => {
  it('restores a valid stored count and scroll offset', () => {
    expect(parseBrowseSnapshot('{"pages":3,"scrollY":420}')).toEqual({ pages: 3, scrollY: 420 });
    expect(browseSnapshotKey('/Registry-Atlas/components')).toBe('registry-atlas.browse.v1:/Registry-Atlas/components');
  });

  it('rejects malformed or unbounded state', () => {
    expect(parseBrowseSnapshot('{bad')).toBeNull();
    expect(parseBrowseSnapshot('{"pages":-1,"scrollY":20}')).toBeNull();
    expect(parseBrowseSnapshot('{"pages":1000000,"scrollY":0}')).toBeNull();
    expect(parseBrowseSnapshot('{"pages":2,"scrollY":"a"}')).toBeNull();
  });
});
