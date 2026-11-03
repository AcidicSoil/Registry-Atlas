import * as stylex from "@stylexjs/stylex";
import type { CatalogAssetKind } from "../core/catalogCollections";
import { gridStyles } from "./catalogGrid.stylex";
import { renderStyleXAttributes } from "./renderSafety";

export function renderCatalogGridAttributes({
  layout = "grid",
  kind,
}: {
  layout?: "grid" | "list";
  kind?: CatalogAssetKind;
} = {}): string {
  const attributes = stylex.attrs(
    gridStyles.grid,
    kind === "component" && gridStyles.componentCollection,
    (kind === "theme" || kind === "template") && gridStyles.editorialCollection,
    layout === "list" && gridStyles.list,
  );

  const variant = kind ? ` data-catalog-grid-kind="${kind}"` : "";

  return `${renderStyleXAttributes(attributes)} data-catalog-grid data-catalog-layout="${layout}"${variant}`;
}
