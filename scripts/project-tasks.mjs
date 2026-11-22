#!/usr/bin/env node
/** Primary project commands and their purpose-specific operations. */
import { spawnSync } from "node:child_process";
import { pathToFileURL } from "node:url";

const node = (file, ...args) => ["node", `scripts/${file}.mjs`, ...args];

const tool = (name, ...args) => ["pnpm", "exec", name, ...args];

const tasks = {
  dev: {
    serve: tool("vite"),
    preview: tool("vite", "preview"),
  },
  lint: {
    "anti-slop": tool("oxlint", "."),
    deps: tool("depcruise", "src", "tests", "--config", ".dependency-cruiser.cjs"),
    boundaries: tool("depcruise", "src"),
    "react-doctor": tool("react-doctor", ".", "--blocking", "warning", "--no-telemetry"),
    complexity: ["cccc", "--table", "src/registry-explorer"],
    styles: tool("stylelint", "public/styles/**/*.css", "src/**/*.css"),
    stylex: tool("eslint", "src/**/*.stylex.ts", "--max-warnings", "0"),
    unused: tool("knip"),
    format: tool("oxfmt", "--check", "."),
    "format-write": tool("oxfmt", "--write", "."),
    commit: node("check-commit-message", "--range", "HEAD^..HEAD"),
    audit: ["pnpm", "audit", "--audit-level", "low"],
  },
  typecheck: {
    app: tool("tsc", "--noEmit"),
    tests: tool("tsc", "--noEmit", "-p", "tsconfig.test.json"),
  },
  test: {
    unit: tool("vitest", "run", "--testTimeout", "30000"),
    local: tool(
      "vitest",
      "run",
      "--testTimeout",
      "30000",
      "--exclude",
      "tests/registry-explorer/catalogClassificationCli.test.ts",
      "--exclude",
      "tests/registry-explorer/postgresStorage.test.ts",
      "--exclude",
      "tests/registry-explorer/registryDiscoveryPostgres.test.ts",
      "--exclude",
      "tests/registry-explorer/verifyComponentPages.test.ts",
      "--exclude",
      "tests/registry-explorer/verifyRegistryPatterns.test.ts",
    ),
    watch: tool("vitest"),
    "e2e-run": tool("e2e", "run"),
    browser: node("check-browser-acceptance"),
    contract: node("check-product-contract"),
    "anti-slop-gate": node("verify-anti-slop-gate"),
    boundaries: node("verify-deep-module-boundaries"),
    "complexity-gate": node("verify-complexity-gate"),
    "registry-patterns-run": node(
      "verify-registry-patterns",
      "--verify-only",
      "--max-registries",
      "20",
      "--samples",
      "2",
    ),
    "component-pages-run": node(
      "verify-component-pages",
      "--max-pages",
      "20",
      "--max-per-registry",
      "3",
      "--delay-ms",
      "1200",
      "--report",
      ".instance/component-verification-queue.json",
    ),
  },
  build: {
    "prepare-runtime-data": node("build-runtime-data"),
    "check-runtime-data": node("check-runtime-data"),
    "validate-data": node("validate-registry-data"),
    compile: tool("tsc"),
    bundle: tool("vite", "build"),
    "spa-fallback": node("create-pages-spa-fallback"),
    sbom: node("generate-sbom"),
    "source-pages-report": node(
      "verify-component-pages",
      "--report-only",
      "--report",
      ".instance/component-verification-queue.json",
    ),
    "source-pages-index": node("build-source-page-index"),
  },
  db: {
    setup: node("manage-local-postgres", "setup"),
    up: node("manage-local-postgres", "up"),
    down: node("manage-local-postgres", "down"),
    status: node("manage-local-postgres", "status"),
    backup: ["bash", "scripts/backup-local-postgres.sh"],
    "restore-check": ["bash", "scripts/check-local-postgres-backup.sh"],
    "reconcile-source-evidence": node("reconcile-runtime-source-evidence", "--apply"),
    check: node("check-postgres"),
    migrate: node("migrate-postgres-schema"),
  },
  sync: {
    registries: node("sync-shadcn-registries"),
    "catalog-evidence": node("sync-registry-catalog-evidence"),
    "registry-icons": node("discover-registry-icons"),
    import: node("import-registry-catalog"),
  },
};

const workflows = {
  dev: ["build:check-runtime-data", "dev:serve"],
  lint: [
    "lint:anti-slop",
    "lint:deps",
    "lint:react-doctor",
    "lint:complexity",
    "lint:styles",
    "lint:stylex",
    "lint:unused",
    "lint:format",
  ],
  typecheck: ["typecheck:app", "typecheck:tests"],
  test: ["build:check-runtime-data", "test:unit"],
  build: ["build:check-runtime-data", "build:production"],
  "build:production": ["build:compile", "build:bundle", "build:spa-fallback", "build:sbom"],
  "build:source-pages": ["build:source-pages-report", "build:source-pages-index"],
  "test:e2e": ["build", "test:e2e-run"],
  "test:registry-patterns": ["test:registry-patterns-run", "build:source-pages"],
  "test:component-pages": ["test:component-pages-run", "build:source-pages"],
  verify: [
    "build:prepare-runtime-data",
    "build:check-runtime-data",
    "lint:audit",
    "lint",
    "typecheck:tests",
    "test:unit",
    "db:check",
    "test:contract",
    "build:validate-data",
    "build:production",
  ],
  "verify:local": [
    "build:check-runtime-data",
    "lint:audit",
    "lint",
    "typecheck:tests",
    "test:local",
    "build:production",
  ],
};

const acceptsArgs = new Set([
  "dev:serve",
  "dev:preview",
  "test:unit",
  "test:watch",
  "test:e2e-run",
]);

const forwardsArgs = new Set(["dev", "test", "test:e2e"]);

function taskKey(group, operation) {
  return operation ? `${group}:${operation}` : group;
}

export function resolveWorkflow(group, operation) {
  const steps = workflows[taskKey(group, operation)];

  return steps ? [...steps] : null;
}

export function resolveTask(group, operation, extraArgs = []) {
  const entries = Object.hasOwn(tasks, group) ? tasks[group] : null;
  const command = entries && Object.hasOwn(entries, operation) ? entries[operation] : null;

  if (!command) throw new Error(`Unknown task: ${group} ${operation ?? ""}\n${usage()}`);

  const key = taskKey(group, operation);

  if (key === "db:restore-check" && (extraArgs.length !== 1 || !extraArgs[0])) {
    throw new Error("db restore-check requires exactly one backup file path");
  }

  if (extraArgs.length && key !== "db:restore-check" && !acceptsArgs.has(key)) {
    throw new Error(`${group} ${operation} does not accept extra arguments`);
  }

  return { executable: command[0], args: [...command.slice(1), ...extraArgs] };
}

function usage() {
  return Object.entries(tasks)
    .map(([group, entries]) => `pnpm ${group} [${Object.keys(entries).join("|")}]`)
    .concat(["pnpm verify [local]"])
    .join("\n");
}

function run(key, extraArgs = []) {
  const steps = workflows[key];

  if (steps) {
    if (extraArgs.length && !forwardsArgs.has(key)) {
      throw new Error(`${key} does not accept extra arguments`);
    }

    for (const [index, step] of steps.entries()) {
      const args = index === steps.length - 1 ? extraArgs : [];
      const status = run(step, args);

      if (status !== 0) return status;
    }

    return 0;
  }

  const [group, operation] = key.split(":");
  const { executable, args } = resolveTask(group, operation, extraArgs);

  const result = spawnSync(executable, args, {
    stdio: "inherit",
    env: { ...process.env, TMPDIR: process.env.TMPDIR || "/tmp" },
  });

  if (result.error) throw result.error;

  return result.status ?? 1;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [group, operation, ...extraArgs] = process.argv.slice(2);

  if (!group || group === "--help" || operation === "--help") {
    console.log(usage());
    process.exitCode = group === "--help" || operation === "--help" ? 0 : 2;
  } else {
    try {
      const selectedOperation =
        operation &&
        (group === "dev" || group === "test") &&
        !Object.hasOwn(tasks[group], operation) &&
        !resolveWorkflow(group, operation);

      process.exitCode = run(
        selectedOperation ? group : taskKey(group, operation),
        selectedOperation ? [operation, ...extraArgs] : extraArgs,
      );
    } catch (error) {
      console.error(error.message);
      process.exitCode = 2;
    }
  }
}
