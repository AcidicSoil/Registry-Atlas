/**
 * Keeps the keyboard focus inside an open modal navigation drawer.
 * A null target means normal Tab order should continue inside the drawer.
 */
export function drawerWrapTarget<T>(
  focusable: readonly T[],
  active: T | null,
  backwards: boolean,
): T | null {
  const first = focusable[0] ?? null;
  const last = focusable[focusable.length - 1] ?? null;
  if (!first || !last) return null;
  if (!active || !focusable.includes(active)) return backwards ? last : first;
  if (backwards && active === first) return last;
  if (!backwards && active === last) return first;
  return null;
}
