import { existsSync, readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import packageJson from "../../package.json";

const scripts: Record<string, string> = packageJson.scripts;

const mise = readFileSync(new URL("../../mise.toml", import.meta.url), "utf8");

describe("PAB-style project commands", () => {
  it("exposes direct package scripts and flat, named Mise tasks", () => {
    expect(mise).toContain("[tasks]");
    expect(mise).not.toContain("[tasks.");
    expect(mise).toContain('"install" = "pnpm install --frozen-lockfile"');

    for (const [name, command] of Object.entries(scripts)) {
      expect(command).not.toContain("project-tasks.mjs");
      expect(command.trim()).not.toBe("");
      expect(mise).toContain(`"${name}" = "pnpm run ${name}"`);
    }
  });

  it("resolves every named dependency and executable script", () => {
    for (const [name, command] of Object.entries(scripts)) {
      const dependencies = [...command.matchAll(/\bpnpm run ([\w:-]+)/g)].map((match) => match[1]);

      expect(dependencies).not.toContain(name);
      expect(new Set(dependencies).size).toBe(dependencies.length);

      for (const dependency of dependencies) expect(scripts).toHaveProperty(dependency);

      for (const [, scriptPath] of command.matchAll(
        /\b(?:node|bash) (scripts\/[\w/.-]+\.(?:mjs|sh))/g,
      )) {
        expect(existsSync(new URL(`../../${scriptPath}`, import.meta.url))).toBe(true);
      }
    }
  });

  it("provides working defaults without subcommand dispatch", () => {
    expect(scripts.sync).toBe("node scripts/sync-shadcn-registries.mjs");
    expect(scripts.db).toBe("pnpm run db:status");
    expect(scripts.dev).toContain("pnpm run dev:serve");
    expect(scripts.test).toContain("pnpm run test:unit");
    expect(scripts.build).toContain("pnpm run build:production");
    expect(scripts.typecheck).toContain("pnpm run typecheck:tests");
    expect(scripts.lint).toContain("pnpm run lint:stylex");
    expect(scripts.verify).toContain("pnpm run build:prepare-runtime-data");
  });

  it("requires explicit task names for mutating operations", () => {
    expect(scripts["sync:import"]).toBe("node scripts/import-registry-catalog.mjs");
    expect(scripts["db:up"]).toBe("node scripts/manage-local-postgres.mjs up");
    expect(scripts["db:down"]).toBe("node scripts/manage-local-postgres.mjs down");
    expect(scripts["db:restore-check"]).toBe("bash scripts/check-local-postgres-backup.sh");
  });

  it("keeps offline verification separate from production database mutation", () => {
    expect(scripts["verify:local"]).toContain("pnpm run test:local");
    expect(scripts["verify:local"]).not.toContain("build:prepare-runtime-data");
    expect(scripts["verify:local"]).not.toContain("db:check");
    expect(scripts.verify).toContain("pnpm run db:check");
    expect(scripts.verify).toContain("pnpm run test:contract");
  });
});
