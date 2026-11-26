import { cn } from "./primitives/cn";
import type { CatalogAssetKind } from "../core/catalogCollections";
import { gridStyles } from "./catalogGrid.classes";
import { renderClassAttribute } from "./renderSafety";

export function renderCatalogGridAttributes({
  layout = "grid",
  kind,
}: {
  layout?: "grid" | "list";
  kind?: CatalogAssetKind;
} = {}): string {
  const attributes = cn(
    gridStyles.grid,
    layout === "list" ? gridStyles.list : gridStyles.columns,
    kind === "component"
      ? gridStyles.componentCollection
      : kind === "theme" || kind === "template"
        ? gridStyles.editorialCollection
        : layout !== "list" && gridStyles.spacing,
    layout === "list" && gridStyles.list,
  );

  const variant = kind ? ` data-catalog-grid-kind="${kind}"` : "";

  return `${renderClassAttribute(attributes)} data-catalog-grid data-catalog-layout="${layout}"${variant}`;
}
