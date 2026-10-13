/**
 * Keeps the keyboard focus inside an open modal navigation drawer.
 * A null target means normal Tab order should continue inside the drawer.
 */
export function drawerWrapTarget<T>(
  focusable: readonly T[],
  active: T | null,
  backwards: boolean,
): T | null {
  const first = focusable[0];
  const last = focusable[focusable.length - 1];
  if (first === undefined || last === undefined) return null;
  if (active === null || !focusable.includes(active)) {
    return backwards ? last : first;
  }
  if (backwards) return active === first ? last : null;
  return active === last ? first : null;
}
