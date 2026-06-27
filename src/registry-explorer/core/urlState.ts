import type { ComponentTag, PrimaryFocus } from './registry.schema';

export type RegistryExplorerView = 'discover' | 'focus' | 'component' | 'matrix' | 'item';

export interface ParsedRegistryExplorerUrlState {
  view: RegistryExplorerView;
  searchTerm: string;
  selectedProfileRegistryName: string | null;
  selectedCandidateId: string | null;
  selectedFocus: PrimaryFocus | null;
  selectedComponent: ComponentTag | null;
  selectedItemSlug: string | null;
}

export interface SerializableRegistryExplorerUrlState extends ParsedRegistryExplorerUrlState {
  installQueue?: unknown;
  queue?: unknown;
  token?: unknown;
  install?: unknown;
}

const VALID_VIEWS: readonly RegistryExplorerView[] = ['discover', 'focus', 'component', 'matrix', 'item'];

export function parseRegistryExplorerUrlState(
  params: URLSearchParams,
): ParsedRegistryExplorerUrlState {
  const view = parseView(params.get('view'));
  return {
    view,
    searchTerm: params.get('q')?.trim() ?? '',
    selectedProfileRegistryName: nullableParam(params.get('registry')),
    selectedCandidateId: nullableParam(params.get('candidate')),
    selectedFocus: nullableParam(params.get('focus')) as PrimaryFocus | null,
    selectedComponent: nullableParam(params.get('component')) as ComponentTag | null,
    selectedItemSlug: nullableParam(params.get('item')),
  };
}

export function serializeRegistryExplorerUrlState(
  state: SerializableRegistryExplorerUrlState,
): URLSearchParams {
  const params = new URLSearchParams();
  params.set('view', parseView(state.view));

  setNonEmpty(params, 'q', state.searchTerm);
  setNonEmpty(params, 'registry', state.selectedProfileRegistryName);
  setNonEmpty(params, 'candidate', state.selectedCandidateId);
  setNonEmpty(params, 'focus', state.selectedFocus);
  setNonEmpty(params, 'component', state.selectedComponent);
  setNonEmpty(params, 'item', state.selectedItemSlug);

  return params;
}

function parseView(value: string | null): RegistryExplorerView {
  return value && VALID_VIEWS.includes(value as RegistryExplorerView)
    ? value as RegistryExplorerView
    : 'discover';
}

function nullableParam(value: string | null): string | null {
  const normalized = value?.trim() ?? '';
  return normalized.length > 0 ? normalized : null;
}

function setNonEmpty(params: URLSearchParams, key: string, value: string | null): void {
  const normalized = value?.trim() ?? '';
  if (normalized.length > 0) params.set(key, normalized);
}
