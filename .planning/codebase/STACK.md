# Technology Stack

**Analysis Date:** 2026-05-25

## Languages

**Primary:**
- TypeScript 5.9.3 - Application source, domain types, DOM rendering, and tests in `src/registry-explorer/` and `tests/registry-explorer/`.
- HTML - Static shell and Vite entry mounting in `index.html`.
- CSS - Global explorer styling in `public/styles/registry-explorer.css` and starter Vite styling in `src/style.css`.

**Secondary:**
- YAML - GitHub Pages deployment workflow in `.github/workflows/deploy.yml`.
- Markdown - Product, maintenance, and data documentation in `README.md` and `docs/`.

## Runtime

**Environment:**
- Browser DOM runtime - The app is a client-side single page application bootstrapped by `index.html` and `src/registry-explorer/entry.ts`.
- Node.js 20 - CI build runtime configured in `.github/workflows/deploy.yml`.
- Node.js latest LTS - Development prerequisite documented in `README.md`.

**Package Manager:**
- pnpm 9 - CI uses `pnpm/action-setup@v2` with `version: 9` in `.github/workflows/deploy.yml`.
- pnpm 10.23.0 - Current local tool version detected during analysis.
- Lockfile: present at `pnpm-lock.yaml` with lockfile version `9.0`.

## Frameworks

**Core:**
- Vite 7.2.7 - Development server and production bundler configured by `vite.config.ts`; declared as `^7.2.4` in `package.json` and resolved in `pnpm-lock.yaml`.
- Vanilla TypeScript DOM modules - No React, Vue, Svelte, Next.js, or other frontend framework dependency is declared in `package.json`.
- Static SPA architecture - `index.html` loads `/src/registry-explorer/entry.ts`, which initializes the explorer with local registry data from `src/registry-explorer/data/registries.data.ts`.

**Testing:**
- Vitest - Test files import `describe`, `it`, and `expect` from `vitest` in `tests/registry-explorer/grouping.test.ts` and `tests/registry-explorer/matrixColumns.test.ts`.
- Test runner dependency/config: Not detected in `package.json`, `pnpm-lock.yaml`, or `vite.config.ts`; no `test` script is defined in `package.json`.

**Build/Dev:**
- TypeScript compiler 5.9.3 - `pnpm build` runs `tsc && vite build` from `package.json`.
- Vite dev server - `pnpm dev` runs `vite` from `package.json`; README points local users to `http://localhost:5173`.
- Vite preview server - `pnpm preview` runs `vite preview` from `package.json`.
- codefetch 2.2.0 - Developer utility exposed by `pnpm code` in `package.json` to generate `src.md` from `src/`.

## Key Dependencies

**Critical:**
- `vite` 7.2.7 - Bundles and serves the static SPA; configured with `base: '/Registry-Atlas/'` in `vite.config.ts` for repository-scoped GitHub Pages hosting.
- `typescript` 5.9.3 - Enforces strict type checks and no-emission builds through `tsconfig.json`.

**Infrastructure:**
- `@vitejs` internal ecosystem through Vite dependencies - Build pipeline only; no direct application imports.
- `codefetch` 2.2.0 - Source export utility for development workflows; not used by runtime code.
- GitHub Actions - CI/CD workflow in `.github/workflows/deploy.yml` installs pnpm, builds the project, uploads `dist`, and deploys to GitHub Pages.

## Configuration

**Environment:**
- Runtime configuration is static and code-driven; no runtime environment variables are referenced in `src/`, `index.html`, `vite.config.ts`, or `package.json`.
- `.env.example` file present - contains environment configuration examples; contents intentionally not read during this audit.
- Vite client env access (`import.meta.env` / `VITE_`) is not detected in application code.

**Build:**
- `package.json` defines `dev`, `build`, `preview`, and `code` scripts.
- `tsconfig.json` targets `ES2022`, uses `moduleResolution: "bundler"`, includes DOM libs, enables strict mode, and includes only `src`.
- `vite.config.ts` sets `base: '/Registry-Atlas/'` for GitHub Pages repository deployment.
- `.github/workflows/deploy.yml` builds on `ubuntu-latest` using Node 20 and pnpm 9, then deploys `./dist` to GitHub Pages.
- `index.html` links `public/styles/registry-explorer.css` through `/styles/registry-explorer.css` and loads `/src/registry-explorer/entry.ts`.

## Platform Requirements

**Development:**
- Install dependencies with `pnpm install` as documented in `README.md`.
- Run locally with `pnpm dev`; the Vite dev server serves the app at `http://localhost:5173`.
- Build with `pnpm build`, which type-checks `src/` before Vite emits `dist`.
- Keep new browser code compatible with the DOM APIs used in `src/registry-explorer/entry.ts` and `src/registry-explorer/ui/`.

**Production:**
- Static hosting target: GitHub Pages via `.github/workflows/deploy.yml`.
- Build artifact: `dist` uploaded through `actions/upload-pages-artifact@v3`.
- Production base path: `/Registry-Atlas/` from `vite.config.ts`.
- No server runtime, serverless functions, database, queue, or background worker is part of the deployed application.

---

*Stack analysis: 2026-05-25*
