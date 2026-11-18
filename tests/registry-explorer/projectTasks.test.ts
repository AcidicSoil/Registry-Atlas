import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";
import { resolveTask, resolveWorkflow } from "../../scripts/project-tasks.mjs";

describe("project command surface", () => {
  it("exposes only the primary task groups in pnpm and mise", () => {
    const groups = ["build", "db", "dev", "lint", "sync", "test", "typecheck", "verify"] as const;
    expect(Object.keys(packageJson.scripts).sort()).toEqual(groups);

    for (const group of groups) {
      expect(packageJson.scripts[group]).toBe(`node scripts/project-tasks.mjs ${group}`);
    }

    const mise = readFileSync(new URL("../../mise.toml", import.meta.url), "utf8");

    const taskNames = [...mise.matchAll(/^\[tasks\.(?:"([^"]+)"|([^\]]+))\]/gm)]
      .map((match) => match[1] ?? match[2])
      .sort();

    expect(taskNames).toEqual([...groups, "install"].sort());
  });

  it("runs each mandatory lint gate once through the canonical group", () => {
    expect(resolveWorkflow("lint")).toEqual([
      "lint:anti-slop",
      "lint:deps",
      "lint:react-doctor",
      "lint:complexity",
      "lint:styles",
      "lint:stylex",
      "lint:unused",
      "lint:format",
    ]);
    expect(resolveWorkflow("verify")).toContain("lint");
    expect(resolveTask("lint", "deps")).toEqual({
      executable: "pnpm",
      args: ["exec", "depcruise", "src", "tests", "--config", ".dependency-cruiser.cjs"],
    });
  });

  it("preserves explicit data preparation and offline verification", () => {
    expect(resolveWorkflow("dev")).toEqual(["build:check-runtime-data", "dev:serve"]);
    expect(resolveWorkflow("test")).toEqual(["build:check-runtime-data", "test:unit"]);
    expect(resolveWorkflow("build")).toEqual(["build:check-runtime-data", "build:production"]);
    expect(resolveWorkflow("build:production")).toEqual([
      "build:compile",
      "build:bundle",
      "build:spa-fallback",
      "build:sbom",
    ]);
    expect(resolveWorkflow("verify")?.slice(0, 2)).toEqual([
      "build:prepare-runtime-data",
      "build:check-runtime-data",
    ]);
    expect(resolveWorkflow("verify")).toContain("build:production");
    expect(resolveWorkflow("verify")).not.toContain("build");
    expect(resolveWorkflow("verify")).not.toContain("test");
    expect(resolveWorkflow("verify:local")).toContain("test:local");
    expect(resolveWorkflow("verify:local")).not.toContain("build:prepare-runtime-data");
    expect(resolveWorkflow("verify:local")).not.toContain("db:check");
    expect(resolveWorkflow("typecheck")).toEqual(["typecheck:app", "typecheck:tests"]);
    expect(resolveWorkflow("test:e2e")).toEqual(["build", "test:e2e-run"]);
  });

  it("preserves database and sync operations", () => {
    const cases: Array<[string, string, string, string[]]> = [
      ["db", "setup", "node", ["scripts/manage-local-postgres.mjs", "setup"]],
      ["db", "up", "node", ["scripts/manage-local-postgres.mjs", "up"]],
      ["db", "down", "node", ["scripts/manage-local-postgres.mjs", "down"]],
      ["db", "status", "node", ["scripts/manage-local-postgres.mjs", "status"]],
      ["db", "backup", "bash", ["scripts/backup-local-postgres.sh"]],
      ["db", "restore-check", "bash", ["scripts/check-local-postgres-backup.sh", "/tmp/a.dump"]],
      [
        "db",
        "reconcile-source-evidence",
        "node",
        ["scripts/reconcile-runtime-source-evidence.mjs", "--apply"],
      ],
      ["db", "check", "node", ["scripts/check-postgres.mjs"]],
      ["db", "migrate", "node", ["scripts/migrate-postgres-schema.mjs"]],
      ["sync", "registries", "node", ["scripts/sync-shadcn-registries.mjs"]],
      ["sync", "catalog-evidence", "node", ["scripts/sync-registry-catalog-evidence.mjs"]],
      ["sync", "registry-icons", "node", ["scripts/discover-registry-icons.mjs"]],
      ["sync", "import", "node", ["scripts/import-registry-catalog.mjs"]],
    ];

    for (const [group, operation, executable, args] of cases) {
      const extra = operation === "restore-check" ? ["/tmp/a.dump"] : [];
      expect(resolveTask(group, operation, extra)).toEqual({ executable, args });
    }
  });

  it("rejects unknown operations and unapproved arguments", () => {
    expect(() => resolveTask("db", "drop")).toThrow(/Unknown/);
    expect(() => resolveTask("sync", "bad")).toThrow(/Unknown/);
    expect(() => resolveTask("db", "up", ["--force"])).toThrow(/arguments/);
    expect(() => resolveTask("sync", "registries", ["--apply"])).toThrow(/arguments/);
    expect(() => resolveTask("db", "restore-check")).toThrow(/exactly one/);
    expect(() => resolveTask("db", "restore-check", ["a", "b"])).toThrow(/exactly one/);
  });
});
