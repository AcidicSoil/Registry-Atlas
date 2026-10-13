import { describe, it, expect } from 'vitest';
import { drawerWrapTarget } from '../../src/registry-explorer/ui/mobileSidebarFocus';

describe('modal navigation focus wrapping', () => {
  const first = { name: 'library' };
  const middle = { name: 'search' };
  const last = { name: 'comparison' };
  const items = [first, middle, last];

  it('wraps backwards from the first control and forwards from the last', () => {
    expect(drawerWrapTarget(items, first, true)).toBe(last);
    expect(drawerWrapTarget(items, last, false)).toBe(first);
  });

  it('leaves interior keyboard movement to native Tab behavior', () => {
    expect(drawerWrapTarget(items, middle, true)).toBeNull();
    expect(drawerWrapTarget(items, middle, false)).toBeNull();
  });

  it('reclaims focus if it somehow escapes the drawer', () => {
    expect(drawerWrapTarget(items, { name: 'backdrop' }, true)).toBe(last);
    expect(drawerWrapTarget(items, { name: 'outside' }, false)).toBe(first);
    expect(drawerWrapTarget(items, null, false)).toBe(first);
  });

  it('does not trap when the drawer has no focusable controls', () => {
    expect(drawerWrapTarget([], first, false)).toBeNull();
  });
});
