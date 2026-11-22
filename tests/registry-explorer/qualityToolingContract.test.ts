import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import packageJson from "../../package.json";

const read = (file: string) => readFileSync(new URL("../../" + file, import.meta.url), "utf8");

describe("quality-tooling integration contract", () => {
  it("runs all mandatory quality gates through a single pipeline", () => {
    const pkg = JSON.parse(read("package.json"));
    expect(pkg.devDependencies["dependency-cruiser"]).toBe("18.6.0");
    expect(pkg.devDependencies["react-doctor"]).toBe("0.9.18");
    expect(pkg.devDependencies.oxlint).toBe("1.87.0");
    expect(pkg.devDependencies["@oxlint/plugins"]).toBe("1.87.0");

    const lintSteps = packageJson.scripts.lint
      .split(" && ")
      .map((step) => step.replace("pnpm run ", ""));

    for (const gate of [
      "anti-slop",
      "deps",
      "react-doctor",
      "complexity",
      "styles",
      "stylex",
      "unused",
      "format",
    ]) {
      expect(lintSteps).toContain(`lint:${gate}`);
    }

    expect(new Set(lintSteps).size).toBe(lintSteps.length);
    expect(packageJson.scripts.verify).toContain("pnpm run lint");
    expect(packageJson.scripts["verify:local"]).toContain("pnpm run lint");

    expect(packageJson.scripts["lint:boundaries"]).toContain("depcruise");
    expect(packageJson.scripts["lint:anti-slop"]).toBe("pnpm exec oxlint .");
    expect(packageJson.scripts["lint:react-doctor"]).toContain("--blocking");
    expect(packageJson.scripts["lint:complexity"]).toBe("cccc --table src/registry-explorer");
    expect(packageJson.scripts["test:anti-slop-gate"]).toContain(
      "scripts/verify-anti-slop-gate.mjs",
    );
    expect(packageJson.scripts["test:complexity-gate"]).toContain(
      "scripts/verify-complexity-gate.mjs",
    );
  });

  it("keeps Repowise-generated agent guidance outside source formatting", () => {
    const config = JSON.parse(read(".oxfmtrc.json"));

    expect(config.ignorePatterns).toContain(".design/backups/standards-catalog-*.json");
    expect(config.ignorePatterns).toContain("AGENTS.md");
    expect(config.ignorePatterns).toContain(".github/copilot-instructions.md");
  });

  it("pins cccc to a prebuilt version and retains strict limits", () => {
    const mise = read("mise.toml");
    expect(mise).toContain('"github:moznion/cccc" = "1.8.0"');
    const config = read("cccc.toml");
    expect(config).toContain("max-cognitive = 10");
    expect(config).toContain("max-cyclomatic = 8");
  });

  it("enforces recorded architecture boundaries", () => {
    const config = read(".dependency-cruiser.cjs");
    expect(config).toContain("no-circular");
    expect(config).toContain("no-core-to-adapters");
    expect(config).toContain("no-data-to-ui");
    expect(config).toContain("no-production-to-tests");
    expect(config).toContain("entrypoint-boundary-from-app");
    expect(config).toContain("entrypoint-boundary-across-packages");
    expect(config).toContain("tests-through-entrypoints");
    expect(config).toContain("tests-folder-is-private");
  });
});
