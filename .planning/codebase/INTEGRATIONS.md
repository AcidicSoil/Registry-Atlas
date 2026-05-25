# External Integrations

**Analysis Date:** 2026-05-25

## APIs & External Services

**Runtime APIs:**
- Not detected - Application code in `src/registry-explorer/` does not call `fetch`, `XMLHttpRequest`, `WebSocket`, `EventSource`, SDK clients, analytics clients, or beacon APIs.
- Browser DOM - `src/registry-explorer/entry.ts` reads DOM roots and `src/registry-explorer/ui/shell.ts` registers tab, search, and aside click listeners.

**Outbound Catalog Links:**
- Community registry websites - Rendered as user-clicked external links from static data.
  - SDK/Client: Not applicable; URLs live in `src/registry-explorer/data/registries.data.ts`.
  - Auth: Not applicable.
  - Rendering: `src/registry-explorer/ui/focusView.ts` and `src/registry-explorer/ui/componentView.ts` create `<a href="...">Visit</a>` links with `target="_blank"` and `rel="noreferrer"`.
- shadcn/ui directory - Source/reference link in `README.md` and registry research docs under `docs/`.
  - SDK/Client: Not applicable.
  - Auth: Not applicable.

**Development/Documentation Services:**
- GitHub-hosted screenshots - `README.md` embeds screenshots from `https://github.com/acidicsoil/registry-atlas/raw/HEAD/public/screenshots/...`.
  - SDK/Client: Markdown image URLs only.
  - Auth: Not applicable.
- Optional Google Fonts reference - `index.html` and `public/index.legacy.html` contain a commented-out Google Fonts stylesheet link.
  - SDK/Client: Not active because the link is commented out.
  - Auth: Not applicable.

## Data Storage

**Databases:**
- Not detected.
  - Connection: Not applicable.
  - Client: Not applicable.

**File Storage:**
- Local repository files only.
- Primary data store: static TypeScript array exported from `src/registry-explorer/data/registries.data.ts`.
- Public assets: `public/registry-atlas/`, `public/screenshots/`, `public/styles/registry-explorer.css`, and `public/index.legacy.html`.
- Generated production files are emitted to `dist` by Vite during `pnpm build`; `dist` is uploaded by `.github/workflows/deploy.yml`.

**Caching:**
- No application-level cache detected.
- GitHub Actions dependency cache is enabled for pnpm through `actions/setup-node@v4` with `cache: 'pnpm'` in `.github/workflows/deploy.yml`.

## Authentication & Identity

**Auth Provider:**
- Application auth: Not detected.
  - Implementation: The SPA has no login, session, cookie, OAuth, JWT, or auth SDK code in `src/`.
- Deployment identity: GitHub Pages OIDC.
  - Implementation: `.github/workflows/deploy.yml` grants `id-token: write`, `pages: write`, and `contents: read` so `actions/deploy-pages@v4` can publish to the `github-pages` environment.

## Monitoring & Observability

**Error Tracking:**
- None detected.
- No Sentry, PostHog, analytics, OpenTelemetry, or logging SDK dependencies are declared in `package.json`.

**Logs:**
- Browser console only.
- Initialization failures log with `console.error` in `src/registry-explorer/entry.ts`.
- Render failures log with `console.error` and show an inline error state in `src/registry-explorer/ui/shell.ts`.
- CI logs are standard GitHub Actions step logs from `.github/workflows/deploy.yml`.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages.
- Vite base path for repository hosting is configured in `vite.config.ts` as `/Registry-Atlas/`.
- Deployment target environment is `github-pages` in `.github/workflows/deploy.yml`.

**CI Pipeline:**
- GitHub Actions workflow: `.github/workflows/deploy.yml`.
- Triggers: push to `main` and manual `workflow_dispatch`.
- Build steps: checkout, pnpm setup, Node 20 setup, `pnpm install --frozen-lockfile`, `pnpm build`, configure Pages, upload `./dist`, deploy Pages.
- Test steps: Not detected in CI; workflow builds only.

## Environment Configuration

**Required env vars:**
- None detected for application runtime.
- None detected for local build commands in `package.json`.
- GitHub-provided workflow identity and Pages deployment context are used by `.github/workflows/deploy.yml`; no user-defined secrets are referenced.

**Secrets location:**
- Not applicable for application runtime.
- `.env.example` file present - contents intentionally not read.
- No `.env`, `.env.local`, credential files, secret files, or package manager auth files were read during this audit.

## Webhooks & Callbacks

**Incoming:**
- None detected.
- The deployed app is static; there are no server routes, API endpoints, serverless functions, or webhook handlers.

**Outgoing:**
- None detected as programmatic callbacks.
- User-initiated outbound navigation to registry URLs is rendered from `src/registry-explorer/data/registries.data.ts` by `src/registry-explorer/ui/focusView.ts` and `src/registry-explorer/ui/componentView.ts`.
- GitHub Pages deployment publishes build artifacts through official GitHub Actions in `.github/workflows/deploy.yml`.

---

*Integration audit: 2026-05-25*
