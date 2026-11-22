import { describe, expect, it } from "vitest";
import { buildPaletteCommands } from "../../src/registry-explorer/ui/commandPalette";
import { TEST_CATALOG_POLICY } from "./testCatalogPolicy";
import type {
  Registry,
  RegistryCatalogIndex,
} from "../../src/registry-explorer/core/registry.schema";

const registries = [
  { name: "@alpha", url: "https://alpha.example", description: "Alpha" },
  { name: "@beta", url: "https://beta.example", description: "Beta" },
] satisfies Registry[];

const index: RegistryCatalogIndex = {
  meta: { generated_at: "2026-01-01", registry_count: 2, item_count: 2 },
  registries: {
    "@alpha": [
      {
        name: "button",
        type: "registry:ui",
        canonical: {
          taxonomyVersion: TEST_CATALOG_POLICY.taxonomy.version,
          primary: "controls/button",
          path: ["controls", "controls/button"],
        },
      },
    ],
    "@beta": [
      { name: "button", type: "registry:ui" },
      { name: "dashboard", type: "registry:block", kind: "block" },
    ],
  },
};

describe("UI SDK command candidates", () => {
  it("exposes hierarchy pages while retaining direct fuzzy category actions", () => {
    const { results } = buildPaletteCommands(registries, index, TEST_CATALOG_POLICY);
    expect(JSON.stringify(results(""))).toContain('"value":"page:controls"');
    expect(JSON.stringify(results(""))).toContain('"value":"category:controls/button"');
    expect(JSON.stringify(results("button"))).toContain('"value":"category:controls/button"');
  });
  it("preserves unique source identities and canonical navigation routes", () => {
    const { actions } = buildPaletteCommands(registries, index, TEST_CATALOG_POLICY);

    const components = [...actions.values()].filter(
      (action) => action.kind === "route" && action.route.kind === "component",
    );

    expect(components).toHaveLength(2);
    expect(
      components
        .map((action) =>
          action.kind === "route" && action.route.kind === "component"
            ? action.route.namespace
            : "",
        )
        .sort(),
    ).toEqual(["@alpha", "@beta"]);
    expect([...actions.values()].some((action) => action.kind === "search")).toBe(true);
    expect([...actions.values()]).toContainEqual({
      kind: "route",
      route: { kind: "block", namespace: "@beta", slug: "dashboard" },
    });
  });
});
