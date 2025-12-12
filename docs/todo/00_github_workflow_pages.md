# Task for CLI agent

## Objective

Implement GitHub Pages deployment configuration for a static Vite project by setting the correct base URL and adding a GitHub Actions workflow.

## Implementation details

- Update the Vite configuration file (e.g., `vite.config.ts`) to set the `base` option:
  - For repository-based sites (`https://<user>.github.io/<repo>/`), configure `base: '/<repo>/'`
  - For user/organization sites (`https://<user>.github.io/`), configure `base: '/'`
- Create a `.github/workflows/deploy.yml` file with the following content:

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

  concurrency:
    group: 'pages'
    cancel-in-progress: true

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
