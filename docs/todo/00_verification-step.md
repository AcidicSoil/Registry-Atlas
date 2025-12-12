# Task for CLI agent

## Objective

Implement GitHub Pages deployment configuration for a Vite + TypeScript project by updating build configuration and adding CI workflow files.

## Implementation details

- Update `vite.config.ts` to set the correct `base` path for GitHub Pages:
  - Add `base: '/<repo-name>/'` where `<repo-name>` is the repository name from `package.json.name`
  - If file already contains `base`, replace existing value with this pattern
  - Format as:

    ```ts
    export default defineConfig({
      base: `/${pkg.name}/`,
    });
    ```

- Create `.github/workflows/deploy.yml` with exact content:

  ```yaml
  name: Deploy static content to Pages
  on:
    push:
      branches: ['main']
    workflow_dispatch:
  permissions:
    contents: read
    pages: write
    id-token: write
  jobs:
    deploy:
      environment:
        name: github-pages
        url: ${{ steps.deployment.outputs.page_url }}
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v5
        - uses: pnpm/action-setup@v4
          with:
            version: 9
        - uses: actions/setup-node@v6
          with:
            node-version: lts/*
            cache: 'pnpm'
        - run: pnpm install --frozen-lockfile
        - run: pnpm build
        - uses: actions/configure-pages@v5
        - uses: actions/upload-pages-artifact@v4
          with:
            path: './dist'
        - id: deployment
          uses: actions/deploy-pages@v4
  ```

- Ensure both files are created/updated in the current repository root

## Constraints

- `base` path must match GitHub Pages URL structure (project site requires `/<repo-name>/`, user site requires `/`)
- Workflow file must use exact YAML structure without modifications
- Do not modify existing CI configuration or other unrelated files
- Repository name placeholder `<repo-name>` must be replaced with actual value from `package.json`
- Preserve existing build commands (`pnpm install` + `pnpm build`)

## Acceptance criteria

- `vite.config.ts` contains valid `base` path with repository name from package.json
- `.github/workflows/deploy.yml` exists and matches provided YAML content
- GitHub Actions workflow triggers on main branch pushes
- After pushing changes to main:
  - Workflow completes successfully in GitHub Actions
  - Deployment artifacts uploaded to GitHub Pages
  - Site loads at expected URL (e.g., `https://<user>.github.io/<repo>/`)
  - No 404 errors for static assets in deployed build output
