# Registry Explorer deep modules

The TypeScript packages under this directory are `core`, `data`, and `ui`.
Each root-level TypeScript file in a package is an intentional public entry point.
Keep implementation details in a nested `lib/` or `internal/` directory,
and import those private files only from within the same package.

- `core/`: validated models, parsing, routing, and business logic. No imports from `data/` or `ui/`.
- `data/`: external I/O and data loaders; may consume public `core/` entry points, never `ui/`.
- `ui/`: DOM rendering, navigation, and browser-facing adapters; may consume public `core/` and `data/` entry points.
- `entry.ts` and the tests under `tests/`: consumers, so import only root public entry points.

Do not add a broad export-all barrel. Expose focused files with narrow interfaces.
The `ui/index.ts` barrel remains the current application bootstrap entry; do not add broad new barrels.
The `core/lib/sourcePageOrigin.ts` module demonstrates private implementation.

`pnpm lint:deps` scans both `src` and `tests`. It enforces entry-point
boundaries, test imports through entry points, no cross-module private imports,
no cycles, and the existing core/data/UI dependency direction.
Use `node scripts/verify-deep-module-boundaries.mjs` for repeatable
pass–fail–pass adversarial checks. No TypeScript path aliases are needed.
