/** Values received from JSON I/O, before an owner schema validates them.
 * Undefined models absent optional members in in-memory boundary fixtures.
 * Domain functions must consume their parsed owner types instead.
 */
export type JsonInput = string | number | boolean | null | undefined
  | JsonInput[] | { [key: string]: JsonInput };

/** Unvalidated external payload at the parser boundary. The called validator
 * must decode it before a business value is returned.
 */
export type RawJsonInput = import('zod').z.input<import('zod').z.ZodUnknown>;
