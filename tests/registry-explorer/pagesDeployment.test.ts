import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import YAML from "yaml";

const workflow = YAML.parse(
  readFileSync(new URL("../../.github/workflows/deploy-pages.yml", import.meta.url), "utf8"),
);

describe("manual Pages release", () => {
  it("deploys only on explicit main-branch releases", () => {
    expect(Object.keys(workflow.on)).toEqual(["workflow_dispatch"]);
    expect(workflow.jobs.build.if).toBe("github.ref == 'refs/heads/main'");
    expect(workflow.jobs.deploy.needs).toBe("build");
    expect(workflow.jobs.deploy.if).toBe("github.ref == 'refs/heads/main'");
    expect(workflow.jobs.deploy.environment.name).toBe("github-pages");
  });

  it("verifies the pinned public runtime and uploads the finished static site", () => {
    const steps = workflow.jobs.build.steps;

    expect(steps.map((step: { uses?: string; run?: string }) => step.uses ?? step.run)).toEqual([
      "actions/checkout@v5",
      "jdx/mise-action@v5",
      "pnpm install --frozen-lockfile",
      "tar -xf tests/fixtures/ci-runtime.tar",
      "mise run verify:local",
      "actions/upload-pages-artifact@v5",
    ]);
    expect(steps.at(-1).with.path).toBe("dist");
    expect(workflow.jobs.deploy.steps).toEqual([
      { id: "deployment", uses: "actions/deploy-pages@v5" },
    ]);
  });

  it("limits release credentials to the deployment job", () => {
    expect(workflow.permissions).toEqual({ contents: "read" });
    expect(workflow.jobs.deploy.permissions).toEqual({ pages: "write", "id-token": "write" });
    expect(workflow.jobs.build.permissions).toBeUndefined();
  });
});
