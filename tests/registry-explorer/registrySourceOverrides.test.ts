import { describe, expect, it } from "vitest";
import {
  effectiveRegistrySource,
  projectRegistrySource,
  resolvedUpstreamHttpIssue,
  // @ts-ignore Standalone Node ESM module.
} from "../../scripts/lib/registry-source-overrides.mjs";

const raw = {
  name: "@shadcn-map",
  homepage: "https://shadcn-map.vercel.app",
  url: "http://shadcn-map.vercel.app/r/{name}.json",
};

const repository = "https://github.com/tonghohin/shadcn-map";

const template = "https://raw.githubusercontent.com/tonghohin/shadcn-map/main/public/r/{name}.json";

const evidence = { status: "available", catalog_url: template.replace("{name}", "registry") };

const record = {
  official: { name: raw.name, homepage: raw.homepage, registry_url_template: raw.url },
};

const issue = { code: "url-http", namespace: raw.name, field: "raw.url", value: raw.url };

describe("maintainer repository source recovery", () => {
  it("uses the maintained repository without rewriting raw directory evidence", () => {
    expect(effectiveRegistrySource(raw)).toMatchObject({ homepage: repository, url: template });
    expect(raw.url).toBe("http://shadcn-map.vercel.app/r/{name}.json");
    expect(effectiveRegistrySource({ ...raw, url: "https://new.example/r/{name}.json" }).url).toBe(
      "https://new.example/r/{name}.json",
    );
  });

  it("projects and acknowledges only a successfully fetched replacement", () => {
    const projected = projectRegistrySource(record, raw, evidence);

    expect(projected.official).toMatchObject({
      homepage: repository,
      registry_url_template: template,
    });
    expect(resolvedUpstreamHttpIssue(issue, projected, raw, evidence)).toBe(true);
    expect(resolvedUpstreamHttpIssue(issue, projected, raw, { ...evidence, status: "stale" })).toBe(
      false,
    );
    expect(resolvedUpstreamHttpIssue(issue, record, raw, evidence)).toBe(false);
    expect(projectRegistrySource(record, raw, { ...evidence, status: "stale" })).toEqual(record);
  });
});
