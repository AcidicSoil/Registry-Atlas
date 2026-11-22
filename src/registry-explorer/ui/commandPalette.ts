import type { CommandData, CommandDataItem, CommandDataGroup } from "@ui-sdk/core/command";
import type { UiCommandElement } from "@ui-sdk/web/command";
import type { UiDialogElement } from "@ui-sdk/web/dialog";
import type { CatalogTaxonomyNode } from "../core/catalogTaxonomy";
import { fuzzyScore } from "@ui-sdk/core/text-match";
import type { CatalogPolicy } from "../core/catalogPolicy";
import { assetKindForCatalogItem } from "../core/catalogCollections";
import { buildCatalogFacetSummary, displayLabel } from "../core/catalogQuery";
import type { CatalogRoute } from "../core/catalogRoutes";
import { registryCatalogItemIdentity } from "../core/registryCatalogIndex";
import type { Registry, RegistryCatalogIndex } from "../core/registry.schema";
import { renderStyleXAttributes } from "./renderSafety";
import * as stylex from "@stylexjs/stylex";
import { paletteStyles } from "./commandPalette.stylex";

export type PaletteAction =
  | { kind: "route"; route: CatalogRoute }
  | { kind: "category"; canonicalId: string }
  | { kind: "search" };

const NAVIGATION: readonly { label: string; route: CatalogRoute }[] = [
  { label: "Featured", route: { kind: "home" } },
  { label: "Components", route: { kind: "components" } },
  { label: "Blocks", route: { kind: "blocks" } },
  { label: "Pages", route: { kind: "pages" } },
  { label: "Templates", route: { kind: "templates" } },
  { label: "Themes", route: { kind: "themes" } },
  { label: "Icons", route: { kind: "icons" } },
  { label: "Libraries", route: { kind: "registries" } },
  { label: "Authors", route: { kind: "authors" } },
  { label: "Compare", route: { kind: "compare" } },
];

export function buildPaletteCommands(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  policy: CatalogPolicy,
) {
  const actions = new Map<string, PaletteAction>();

  const nav = NAVIGATION.map(({ label, route }) => {
    const value = "nav:" + route.kind;
    actions.set(value, { kind: "route", route });

    return { value, label };
  });

  const libraries = registries.map((registry) => {
    const value = "registry:" + registry.name;
    actions.set(value, { kind: "route", route: { kind: "registry", namespace: registry.name } });

    return { value, label: registry.name, keywords: [registry.description] };
  });

  const { groups, browsableGroups } = createCategoryCommands(registries, index, policy, actions);
  const items = createItemCommands(registries, index, policy, actions);

  actions.set("search:catalog", { kind: "search" });

  function results(query: string): CommandData {
    const text = query.trim();

    const search: CommandDataItem = {
      value: "search:catalog",
      label: text ? `Search catalog for "${text}"` : "Search catalog",
      keywords: text ? [text] : [],
    };

    const searchAll = (input: CommandDataItem[], limit: number): CommandDataItem[] => {
      if (!text) return input.slice(0, limit);

      return input
        .flatMap((entry) => {
          const score = Math.max(
            fuzzyScore(entry.label, text),
            ...(entry.keywords ?? []).map((keyword) => fuzzyScore(keyword, text)),
          );

          return score > 0 ? [{ entry, score }] : [];
        })
        .sort((a, b) => b.score - a.score || a.entry.label.localeCompare(b.entry.label))
        .slice(0, limit)
        .map(({ entry }) => entry);
    };

    const commandGroups: CommandDataGroup[] = [
      { type: "group", label: "Navigation", items: searchAll(nav, 10) },
      {
        type: "group",
        label: "Component groups",
        items: text ? searchAll(groups, 20) : browsableGroups,
      },
      { type: "group", label: "Libraries", items: searchAll(libraries, 25) },
      { type: "group", label: "Components", items: text ? searchAll(items, 60) : [] },
      { type: "group", label: "Search", items: [search] },
    ];

    return commandGroups.filter((group) => group.items.length);
  }

  return { actions, results };
}

function createCategoryCommands(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  policy: CatalogPolicy,
  actions: Map<string, PaletteAction>,
) {
  const facets = buildCatalogFacetSummary(registries, index, { policy });
  const counts = new Map(facets.canonical.map((entry) => [entry.value, entry.count]));
  const groups: CommandDataItem[] = [];

  const visit = (nodes: typeof policy.taxonomy.roots) => {
    for (const node of nodes) {
      if ((counts.get(node.id) ?? 0) > 0) {
        const value = "category:" + node.id;
        actions.set(value, { kind: "category", canonicalId: node.id });
        groups.push({ value, label: node.label, keywords: [node.id, ...node.aliases] });
      }

      visit(node.children);
    }
  };

  visit(policy.taxonomy.roots);

  const categoryEntries = new Map(groups.map((entry) => [entry.value, entry]));

  const browseNode = (node: CatalogTaxonomyNode): CommandDataItem | null => {
    const entry = categoryEntries.get("category:" + node.id);

    if (!entry) return null;

    const children = node.children
      .map(browseNode)
      .filter((child): child is CommandDataItem => child !== null);

    if (!children.length) return entry;

    return {
      value: "page:" + node.id,
      label: entry.label,
      keywords: entry.keywords,
      items: [{ ...entry, label: "All " + entry.label }, ...children],
    };
  };

  const browsableGroups = policy.taxonomy.roots
    .map(browseNode)
    .filter((entry): entry is CommandDataItem => entry !== null);

  return { groups, browsableGroups };
}

function createItemCommands(
  registries: readonly Registry[],
  index: RegistryCatalogIndex,
  policy: CatalogPolicy,
  actions: Map<string, PaletteAction>,
): CommandDataItem[] {
  return registries.flatMap((registry) =>
    createRegistryItemCommands(registry, index, policy, actions),
  );
}

function createRegistryItemCommands(
  registry: Registry,
  index: RegistryCatalogIndex,
  policy: CatalogPolicy,
  actions: Map<string, PaletteAction>,
): CommandDataItem[] {
  const seen = new Set<string>();
  const entries: CommandDataItem[] = [];

  for (const item of index.registries[registry.name] ?? []) {
    const normalized = registryCatalogItemIdentity(item.name);

    if (seen.has(normalized)) continue;
    seen.add(normalized);

    const value = "item:" + registry.name + ":" + item.name;
    const displayName = displayLabel(item);
    const assetKind = assetKindForCatalogItem(item, policy, registry.name);
    const kind = assetKind === "icon" || assetKind === "other" ? "component" : assetKind;

    actions.set(value, {
      kind: "route",
      route: { kind, namespace: registry.name, slug: item.name },
    });
    entries.push({
      value,
      label: displayName,
      keywords: [registry.name, item.name, item.description ?? ""],
    });
  }

  return entries;
}

export function createCommandPalette(options: {
  mount: HTMLElement;
  registries: readonly Registry[];
  index: RegistryCatalogIndex;
  policy: CatalogPolicy;
  onActivate: (action: PaletteAction, query: string) => void;
}) {
  const { actions, results } = buildPaletteCommands(
    options.registries,
    options.index,
    options.policy,
  );

  const host = options.mount;
  host.innerHTML = `
    <ui-dialog id="atlasCommandPalette">
      <ui-dialog-trigger shortcut="mod+k">
        <button type="button" aria-label="Open command palette"${renderStyleXAttributes(stylex.attrs(paletteStyles.trigger))}>
          <span aria-hidden="true">Ctrl K</span>
        </button>
      </ui-dialog-trigger>
      <ui-dialog-backdrop hidden${renderStyleXAttributes(stylex.attrs(paletteStyles.backdrop))}></ui-dialog-backdrop>
      <ui-dialog-content hidden${renderStyleXAttributes(stylex.attrs(paletteStyles.content))}>
        <ui-dialog-title${renderStyleXAttributes(stylex.attrs(paletteStyles.title))}>Search Registry Atlas</ui-dialog-title>
        <ui-command filter="false"${renderStyleXAttributes(stylex.attrs(paletteStyles.command))}>
          <ui-command-input${renderStyleXAttributes(stylex.attrs(paletteStyles.search))}>
            <input aria-label="Search commands" placeholder="Search components, libraries, and actions…"${renderStyleXAttributes(stylex.attrs(paletteStyles.input))} />
          </ui-command-input>
          <ui-command-empty>No matching components or commands.</ui-command-empty>
          <ui-command-list${renderStyleXAttributes(stylex.attrs(paletteStyles.list))}></ui-command-list>
          <template>
            <ui-command-list>
              <ui-command-group>
                <ui-command-group-label${renderStyleXAttributes(stylex.attrs(paletteStyles.group))}></ui-command-group-label>
                <ui-command-item${renderStyleXAttributes(stylex.attrs(paletteStyles.item))}>
                  <ui-command-item-text></ui-command-item-text>
                </ui-command-item>
              </ui-command-group>
            </ui-command-list>
          </template>
        </ui-command>
        <p${renderStyleXAttributes(stylex.attrs(paletteStyles.footer))}>↑ ↓ Navigate · Enter Open · Esc Close</p>
      </ui-dialog-content>
    </ui-dialog>`;

  const dialog = host.querySelector<UiDialogElement>("ui-dialog");
  const command = host.querySelector<UiCommandElement>("ui-command");

  if (!dialog || !command) throw new Error("UI SDK command palette mount is incomplete");

  command.items = results("");

  const handleQuery = (event: CustomEvent<{ value: string }>) => {
    command.items = results(event.detail.value);
  };

  const handleAction = (event: CustomEvent<{ value: string }>) => {
    const value = event.detail.value;
    const action = actions.get(value);

    if (!action) return;
    const query = command.query;
    dialog.open = false;
    options.onActivate(action, query);
  };

  command.addEventListener("querychange", handleQuery);
  command.addEventListener("action", handleAction);

  const reset = (event: CustomEvent<{ value: boolean }>) => {
    if (event.detail.value) {
      command.query = "";
      command.items = results("");
    }
  };

  dialog.addEventListener("openchange", reset);

  return {
    dispose() {
      command.removeEventListener("querychange", handleQuery);
      command.removeEventListener("action", handleAction);
      dialog.removeEventListener("openchange", reset);
      host.replaceChildren();
    },
  };
}
