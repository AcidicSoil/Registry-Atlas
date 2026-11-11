import type { InstallQueueEntry } from "../core/registry.schema";
import type { CatalogRoute } from "../core/catalogRoutes";
import type { BrowseRouteState } from "./browseRouteState";

export interface CopyFeedback {
  status: "success" | "error";
  message: string;
  command?: string;
}

export interface AppState extends BrowseRouteState {
  returnRoute: CatalogRoute | null;
  installQueue: InstallQueueEntry[];
  setupInstructions: string;
  copyFeedback: CopyFeedback | null;
  facetSearchTerms: Record<string, string>;
}

export interface FocusIdentity {
  selector: string;
  attributes: ReadonlyArray<readonly [string, string]>;
}

type HistoryMode = "push" | "replace";

export type SetShellState = (
  partial: Partial<AppState>,
  historyMode?: HistoryMode,
  focusIdentity?: FocusIdentity | null,
) => void;

export type NavigateShell = (
  route: CatalogRoute,
  historyMode?: HistoryMode,
  extra?: Partial<AppState>,
) => void;

export function createFocusIdentity(
  control: Element | null,
  selector: string,
  attributes: readonly string[],
): FocusIdentity | null {
  if (!control) return null;
  const values: Array<readonly [string, string]> = [];

  for (const name of attributes) {
    const value = control.getAttribute(name);

    if (value === null) return null;
    values.push([name, value] as const);
  }

  return { selector, attributes: values };
}
