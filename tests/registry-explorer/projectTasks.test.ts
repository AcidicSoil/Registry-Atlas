import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import { taskNames, taskSteps } from "./miseTaskContract";

const scripts = packageJson.scripts;

const primary = ["build", "check", "db", "dev", "lint", "sync", "test", "typecheck", "verify"];

const groups = {
  lint: [
    "lint:anti-slop",
    "lint:deps",
    "lint:react-doctor",
    "lint:complexity",
    "lint:styles",
    "lint:stylex",
    "lint:unused",
    "lint:format",
    "lint:audit",
  ],
  test: [
    "build:check-runtime-data",
    "test:unit",
    "test:contract",
    "test:anti-slop-gate",
    "test:boundaries",
    "test:complexity-gate",
    "test:e2e",
  ],
  build: ["build:check-runtime-data", "build:validate-data", "build:production"],
  dev: ["build:check-runtime-data", "dev:serve"],
  sync: ["sync:registries", "sync:registry-icons"],
  typecheck: ["typecheck:app", "typecheck:tests"],
  db: ["db:status", "db:check"],
} satisfies Record<string, string[]>;

describe("Mise-owned project tasks", () => {
  it("keeps only primary package aliases", () => {
    expect(Object.keys(scripts).sort()).toEqual([...primary].sort());

    for (const [name, script] of Object.entries(scripts)) {
      expect(script).toBe(`mise run ${name}`);
    }
  });

  it("runs every applicable group task in declared order", () => {
    for (const [group, steps] of Object.entries(groups)) {
      expect(taskSteps(group)).toEqual(steps);
    }

    expect(taskSteps("check")).toEqual(["lint", "typecheck"]);
    expect(taskSteps("sync:registries")).toEqual(["node scripts/sync-shadcn-registries.mjs"]);
  });

  it("preserves meaningful composite build and verification workflows", () => {
    expect(taskSteps("build:production")).toEqual([
      "build:compile",
      "build:bundle",
      "build:spa-fallback",
      "build:sbom",
    ]);
    expect(taskSteps("test:e2e")).toEqual(["build", "test:e2e-run"]);
    expect(taskSteps("verify")).toContain("build:prepare-runtime-data");
    expect(taskSteps("verify")).toContain("db:check");
    expect(taskSteps("verify")).toContain("test:contract");
    expect(taskSteps("verify:local")).toContain("test:local");
    expect(taskSteps("verify:local")).not.toContain("build:prepare-runtime-data");
    expect(taskSteps("verify:local")).not.toContain("db:check");
    expect(taskSteps("verify")).not.toContain("lint:audit");
  });

  it("preserves explicit mutation and interactive commands", () => {
    expect(taskSteps("db:up")).toEqual(["node scripts/manage-local-postgres.mjs up"]);
    expect(taskSteps("db:down")).toEqual(["node scripts/manage-local-postgres.mjs down"]);
    expect(taskSteps("db:restore-check")).toEqual(["bash scripts/check-local-postgres-backup.sh"]);
    expect(taskSteps("sync:import")).toEqual(["node scripts/import-registry-catalog.mjs"]);
    expect(taskSteps("test:watch")).toEqual(["pnpm exec vitest"]);
  });

  it("restores a pinned CI runtime fixture without a live PostgreSQL export", () => {
    const workflow = readFileSync(
      new URL("../../.github/workflows/ci.yml", import.meta.url),
      "utf8",
    );

    expect(workflow).toContain("tar -xf tests/fixtures/ci-runtime.tar");
    expect(workflow).not.toContain("mise run build:prepare-runtime-data");
    const fixture = new URL("../fixtures/ci-runtime.tar", import.meta.url).pathname;
    expect(existsSync(fixture)).toBe(true);

    const archived = execFileSync("tar", ["-tf", fixture], { encoding: "utf8" }).trim().split("\n");
    expect(archived.filter((path) => path.startsWith(".instance/") && !path.endsWith("/"))).toEqual(
      [".instance/atlas-test-documents.json"],
    );

    const documents = JSON.parse(
      execFileSync("tar", ["-xOf", fixture, ".instance/atlas-test-documents.json"], {
        encoding: "utf8",
      }),
    );
    expect(Object.keys(documents).sort()).toEqual([
      "catalog-access-rules",
      "catalog-gold-set",
      "catalog-kind-overrides",
      "catalog-taxonomy",
    ]);
    expect(taskSteps("ci:fixture")).toEqual(["node scripts/package-ci-runtime-fixture.mjs"]);

    const offline = taskSteps("test:local")[0];

    for (const file of [
      "catalogApprovalRetirement.test.ts",
      "registryCatalogImport.test.ts",
      "sourceEvidenceRecovery.test.ts",
    ]) {
      expect(offline).toContain(`--exclude tests/registry-explorer/${file}`);
    }
  });

  it("references existing scripts and resolvable task dependencies", () => {
    const allNames = new Set(taskNames());

    for (const name of allNames) {
      for (const step of taskSteps(name)) {
        if (allNames.has(step)) {
          expect(step).not.toBe(name);
          continue;
        }

        for (const [, path] of step.matchAll(/\b(?:node|bash) (scripts\/[\w/.-]+\.(?:mjs|sh))/g)) {
          expect(existsSync(new URL(`../../${path}`, import.meta.url))).toBe(true);
        }
      }
    }

    const result = JSON.parse(
      execFileSync("mise", ["tasks", "validate", "--json"], { encoding: "utf8" }),
    );

    expect(result).toMatchObject({ errors: 0, warnings: 0 });
    expect(result.tasks_validated).toBe(allNames.size);
  });
});
