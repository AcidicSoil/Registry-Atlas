import type { InstallQueueEntry, Registry, PrimaryFocus, ComponentTag } from '../core/registry.schema';
import { COMPONENT_TAG_VALUES, PRIMARY_FOCUS_VALUES } from '../core/registry.schema';
import type { MirrorValidationIssue } from '../core/registryMirror';
import type { RegistryMirrorMeta } from '../data/loadRegistries';
import {
  buildFocusGroups,
  buildComponentGroups,
  buildMatrixRows,
  computeMetrics
} from '../core/grouping';
import { searchComponentCandidates, buildDiscoveryOverview } from '../core/discovery';
import { buildRegistryProfile } from '../core/registryProfile';
import {
  applyComponentFiltersToCandidates,
  applyComponentFiltersToProfileRows,
  buildComponentFilterGroups,
  createSelectedComponentFilter,
  type SelectedComponentFilter,
} from '../core/componentFilters';
import {
  addToInstallQueue,
  buildInstallQueueBatchState,
  clearInstallQueue,
  removeFromInstallQueue,
} from '../core/installQueue';
import {
  parseRegistryExplorerUrlState,
  serializeRegistryExplorerUrlState,
  type ParsedRegistryExplorerUrlState,
} from '../core/urlState';
import { MATRIX_COLUMNS } from '../core/matrixColumns';
import { renderFocusAside, renderFocusContent } from './focusView';
import { renderComponentAside, renderComponentContent } from './componentView';
import { renderMatrixAside, renderMatrixContent } from './matrixView';
import { type CopyFeedback, renderDiscoveryAside, renderDiscoveryContent } from './discoveryView';
import { resolveRegistryItemDetailFromSummary } from '../core/registryItemDetail';
import { renderItemDetailView } from './itemDetailView';
import { renderRegistryProfile } from './registryProfileView';
import { escapeHtml, renderExternalLink } from './renderSafety';

export interface ShellOptions {
  registries: readonly Registry[];
  mirrorMeta: RegistryMirrorMeta;
  mirrorWarnings: readonly MirrorValidationIssue[];
  roots: {
    aside: HTMLElement;
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>; // More generic for flexibility
    searchInput: HTMLInputElement;
  };
}

interface AppState {
  currentView: 'discover' | 'focus' | 'component' | 'matrix' | 'item';
  selectedFocus: PrimaryFocus | null;
  selectedComponent: ComponentTag | null;
  selectedCandidateId: string | null;
  selectedProfileRegistryName: string | null;
  selectedItemSlug: string | null;
  searchTerm: string;
  installQueue: InstallQueueEntry[];
  copyFeedback: CopyFeedback | null;
  selectedComponentFilters: SelectedComponentFilter[];
  activePeekId: string | null;
}

function isView(value: string | null): value is AppState['currentView'] {
  return value === 'discover' || value === 'focus' || value === 'component' || value === 'matrix' || value === 'item';
}

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, mirrorMeta, mirrorWarnings, roots } = options;

  const hydratedState = hydrateStateFromUrl(registries);

  // Initial State
  let state: AppState = {
    currentView: hydratedState.view,
    selectedFocus: hydratedState.selectedFocus,
    selectedComponent: hydratedState.selectedComponent,
    selectedCandidateId: hydratedState.selectedCandidateId,
    selectedProfileRegistryName: hydratedState.selectedProfileRegistryName,
    selectedItemSlug: hydratedState.selectedItemSlug,
    searchTerm: hydratedState.searchTerm,
    installQueue: [],
    copyFeedback: null,
    selectedComponentFilters: [],
    activePeekId: null,
  };
  roots.searchInput.value = state.searchTerm;

  // State Update Logic
  function setState(partial: Partial<AppState>) {
    state = { ...state, ...partial };
    syncUrlState(state);
    render();
  }

  // Render Loop
  function render() {
    try {
      // 1. Update Tabs
      roots.tabs.forEach(tab => {
        const view = tab.getAttribute('data-view');
        if (view === state.currentView) {
          tab.classList.add('tab-active');
        } else {
          tab.classList.remove('tab-active');
        }
      });

      // 2. Compute Data
      const metrics = computeMetrics(registries, state.searchTerm);
      const queuedTokens = new Set(state.installQueue.map(entry => entry.token));
      const queueBatch = buildInstallQueueBatchState(state.installQueue);
      const filterGroups = buildComponentFilterGroups(registries);

      // 3. Delegate to Views
      if (state.currentView === 'item') {
        const result = resolveRegistryItemDetailFromSummary(registries, state.selectedProfileRegistryName, state.selectedItemSlug);
        renderItemDetailView(roots.contentHeader, roots.contentBody, result, queuedTokens, registries);
        roots.aside.innerHTML = `
          <div class="aside-section-title">Component item</div>
          <div class="aside-hint">Component-first detail route. JSON powers the page but stays out of the normal UI.</div>
        `;
      } else if (state.selectedProfileRegistryName) {
        const candidates = searchComponentCandidates(registries, state.searchTerm);
        const candidate = candidates.find(item => item.id === state.selectedCandidateId);
        const registry = registries.find(item => item.name === state.selectedProfileRegistryName);
        if (registry) {
          const profile = buildRegistryProfile(registry, { candidate });
          const filteredProfile = {
            ...profile,
            sections: profile.sections.map(section => section.items
              ? { ...section, items: applyComponentFiltersToProfileRows(section.items, state.selectedComponentFilters) }
              : section),
          };
          renderRegistryProfile(roots.contentHeader, roots.contentBody, filteredProfile, queuedTokens, filterGroups, state.selectedComponentFilters, state.activePeekId);
          roots.aside.innerHTML = `
            <div class="aside-section-title">Registry profile</div>
            <div class="aside-hint">Official facts and Atlas enrichment are separated. Install queue state stays local to this page session.</div>
          `;
        }
      } else if (state.currentView === 'discover') {
        const overview = buildDiscoveryOverview(registries);
        const candidates = applyComponentFiltersToCandidates(
          searchComponentCandidates(registries, state.searchTerm),
          state.selectedComponentFilters,
        );
        renderDiscoveryAside(roots.aside, overview, state.selectedCandidateId, {
          entries: state.installQueue,
          batch: queueBatch,
          feedback: state.copyFeedback,
        });
        renderDiscoveryContent(
          roots.contentHeader,
          roots.contentBody,
          candidates,
          overview,
          state.searchTerm,
          state.selectedCandidateId,
          queuedTokens,
          filterGroups,
          state.selectedComponentFilters,
          state.activePeekId,
        );

      } else if (state.currentView === 'focus') {
        const groups = buildFocusGroups(registries, state.searchTerm);
        
        let effectiveFocus = state.selectedFocus;
        if (!effectiveFocus && groups.length > 0) {
          effectiveFocus = groups[0].focusKey;
        }

        renderFocusAside(roots.aside, groups, effectiveFocus);
        
        const selectedGroup = groups.find(g => g.focusKey === effectiveFocus);
        const itemsToShow = selectedGroup ? selectedGroup.registries : [];
        
        renderFocusContent(roots.contentHeader, roots.contentBody, itemsToShow, metrics);

      } else if (state.currentView === 'component') {
        const groups = buildComponentGroups(registries, state.searchTerm);
        
        let effectiveComponent = state.selectedComponent;
        if (!effectiveComponent && groups.length > 0) {
          effectiveComponent = groups[0].componentKey;
        }

        renderComponentAside(roots.aside, groups, effectiveComponent);
        
        const selectedGroup = groups.find(g => g.componentKey === effectiveComponent);
        
        renderComponentContent(roots.contentHeader, roots.contentBody, selectedGroup || null, metrics);

      } else if (state.currentView === 'matrix') {
        const rows = buildMatrixRows(registries, state.searchTerm, MATRIX_COLUMNS);
        
        renderMatrixAside(roots.aside, MATRIX_COLUMNS, metrics);
        renderMatrixContent(roots.contentHeader, roots.contentBody, rows, MATRIX_COLUMNS, metrics);
      }

      renderMirrorStatus(roots.contentHeader, mirrorMeta, mirrorWarnings);
    } catch (error) {
      console.error('Registry Explorer: Render failed', error);
      roots.contentBody.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">!</div>
          <div>Something went wrong while rendering this view. Try clearing the search or reloading the page.</div>
        </div>
      `;
    }
  }

  // Event Listeners

  // Tabs
  roots.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      if (isView(view) && view !== state.currentView) {
        setState({ currentView: view, selectedProfileRegistryName: null, selectedCandidateId: null, selectedItemSlug: null });
      }
    });
  });

  // Search
  roots.searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    setState({ searchTerm: target.value || '', copyFeedback: null });
  });

  roots.aside.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (handleInstallActionClick(target)) return;

    const focusButton = target.closest('[data-focus]');
    if (focusButton) {
      const focusKey = focusButton.getAttribute('data-focus') as PrimaryFocus;
      if (focusKey && focusKey !== state.selectedFocus) {
        setState({ selectedFocus: focusKey, currentView: 'focus' });
      }
      return;
    }

    const componentButton = target.closest('[data-component]');
    if (componentButton) {
      const tagKey = componentButton.getAttribute('data-component') as ComponentTag;
      if (tagKey && tagKey !== state.selectedComponent) {
        setState({ selectedComponent: tagKey, currentView: 'component' });
      }
    }
  });

  roots.contentBody.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
    if (handleInstallActionClick(target)) return;
    if (handleFilterClick(target)) return;

    const itemButton = target.closest('[data-view-item-registry]');
    if (itemButton) {
      setState({
        currentView: 'item',
        selectedProfileRegistryName: itemButton.getAttribute('data-view-item-registry'),
        selectedItemSlug: itemButton.getAttribute('data-view-item-slug'),
        selectedCandidateId: itemButton.getAttribute('data-candidate-id'),
      });
      return;
    }

    const profileButton = target.closest('[data-profile-registry]');
    if (profileButton) {
      setState({
        currentView: 'discover',
        selectedProfileRegistryName: profileButton.getAttribute('data-profile-registry'),
        selectedCandidateId: profileButton.getAttribute('data-candidate-id'),
      });
      return;
    }

    const backFromItem = target.closest('[data-back-from-item]');
    if (backFromItem) {
      setState({ currentView: 'discover', selectedItemSlug: null, selectedProfileRegistryName: null });
      return;
    }

    const backButton = target.closest('[data-back-to-results]');
    if (backButton) {
      setState({ selectedProfileRegistryName: null, selectedItemSlug: null });
      return;
    }

    const discoverComponent = target.closest('[data-discover-component]');
    if (discoverComponent) {
      const component = discoverComponent.getAttribute('data-discover-component') ?? '';
      roots.searchInput.value = component;
      setState({
        currentView: 'discover',
        searchTerm: component,
        selectedProfileRegistryName: null,
        selectedCandidateId: null,
      });
    }
  });

  roots.contentBody.addEventListener('mouseover', (e) => {
    const trigger = (e.target as HTMLElement).closest('[data-component-peek-id]');
    const peekId = trigger?.getAttribute('data-component-peek-id') ?? null;
    if (peekId && peekId !== state.activePeekId) setState({ activePeekId: peekId });
  });

  roots.contentBody.addEventListener('focusin', (e) => {
    const trigger = (e.target as HTMLElement).closest('[data-component-peek-id]');
    const peekId = trigger?.getAttribute('data-component-peek-id') ?? null;
    if (peekId && peekId !== state.activePeekId) setState({ activePeekId: peekId });
  });

  roots.contentBody.addEventListener('mouseout', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-component-peek-id]') && !target.closest('[data-component-peek-popover]')) return;
    const related = e.relatedTarget as HTMLElement | null;
    if (related?.closest?.('[data-component-peek-id], [data-component-peek-popover]')) return;
    if (state.activePeekId) setState({ activePeekId: null });
  });

  roots.contentBody.addEventListener('focusout', (e) => {
    const target = e.target as HTMLElement;
    if (!target.closest('[data-component-peek-id]') && !target.closest('[data-component-peek-popover]')) return;
    window.setTimeout(() => {
      if (!roots.contentBody.querySelector('[data-component-peek-id]:focus, [data-component-peek-popover]:focus')) {
        setState({ activePeekId: null });
      }
    }, 0);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && state.activePeekId) setState({ activePeekId: null });
  });

  document.addEventListener('pointerdown', (e) => {
    const target = e.target as HTMLElement;
    if (target.closest('[data-component-peek-id], [data-component-peek-popover]')) return;
    if (state.activePeekId) setState({ activePeekId: null });
  });

  function handleFilterClick(target: HTMLElement): boolean {
    const resetButton = target.closest('[data-filter-reset]');
    if (resetButton) {
      setState({ selectedComponentFilters: [], activePeekId: null });
      return true;
    }

    const removeButton = target.closest('[data-filter-remove-dimension]');
    if (removeButton) {
      const dimension = removeButton.getAttribute('data-filter-remove-dimension');
      const value = removeButton.getAttribute('data-filter-remove-value');
      setState({
        selectedComponentFilters: state.selectedComponentFilters.filter(filter =>
          filter.dimension !== dimension || filter.value !== value
        ),
        activePeekId: null,
      });
      return true;
    }

    const addButton = target.closest('[data-filter-add-dimension]');
    if (addButton) {
      const next = createSelectedComponentFilter(
        buildComponentFilterGroups(registries),
        addButton.getAttribute('data-filter-add-dimension'),
        addButton.getAttribute('data-filter-add-value'),
      );
      if (next && !state.selectedComponentFilters.some(filter => filter.dimension === next.dimension && filter.value === next.value)) {
        setState({ selectedComponentFilters: [...state.selectedComponentFilters, next], activePeekId: null });
      }
      return true;
    }

    return false;
  }

  function handleInstallActionClick(target: HTMLElement): boolean {
    const copyButton = target.closest('[data-copy-command]');
    if (copyButton) {
      const command = copyButton.getAttribute('data-copy-command') ?? '';
      if (command) void copyCommand(command);
      return true;
    }

    const addButton = target.closest('[data-queue-add]');
    if (addButton) {
      const token = addButton.getAttribute('data-queue-add') ?? '';
      const installCommand = addButton.getAttribute('data-queue-install') ?? '';
      const inspectCommand = addButton.getAttribute('data-queue-inspect') ?? '';
      const route = addButton.getAttribute('data-queue-route') ?? '';
      const nextQueue = addToInstallQueue(state.installQueue, {
        action: {
          status: 'enabled',
          token,
          installCommand,
          inspectCommand,
          route,
          disabledReason: null,
        },
        label: addButton.getAttribute('data-queue-label') ?? token,
        registry: addButton.getAttribute('data-queue-registry') ?? '',
        item: addButton.getAttribute('data-queue-item') ?? token,
      });
      setState({ installQueue: nextQueue, copyFeedback: null });
      return true;
    }

    const removeButton = target.closest('[data-queue-remove]');
    if (removeButton) {
      setState({
        installQueue: removeFromInstallQueue(state.installQueue, removeButton.getAttribute('data-queue-remove') ?? ''),
        copyFeedback: null,
      });
      return true;
    }

    const clearButton = target.closest('[data-queue-clear]');
    if (clearButton) {
      setState({ installQueue: clearInstallQueue(), copyFeedback: null });
      return true;
    }

    return false;
  }

  async function copyCommand(command: string): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) {
        throw new Error('Clipboard API unavailable');
      }
      await navigator.clipboard.writeText(command);
      setState({ copyFeedback: { status: 'success', message: 'Command copied.', command } });
    } catch {
      setState({
        copyFeedback: {
          status: 'error',
          message: 'Clipboard unavailable. Select and copy the command manually.',
          command,
        },
      });
    }
  }

  // Initial Render
  syncUrlState(state);
  render();
}

function hydrateStateFromUrl(registries: readonly Registry[]): ParsedRegistryExplorerUrlState {
  const parsed = parseRegistryExplorerUrlState(new URLSearchParams(window.location.search));
  const registryExists = parsed.selectedProfileRegistryName
    ? registries.some(registry => registry.name === parsed.selectedProfileRegistryName)
    : false;
  const selectedFocus = parsed.selectedFocus && PRIMARY_FOCUS_VALUES.includes(parsed.selectedFocus)
    ? parsed.selectedFocus
    : null;
  const selectedComponent = parsed.selectedComponent && COMPONENT_TAG_VALUES.includes(parsed.selectedComponent)
    ? parsed.selectedComponent
    : null;

  return {
    ...parsed,
    selectedProfileRegistryName: registryExists ? parsed.selectedProfileRegistryName : null,
    selectedCandidateId: registryExists ? parsed.selectedCandidateId : null,
    selectedFocus,
    selectedComponent,
    selectedItemSlug: registryExists ? parsed.selectedItemSlug : null,
  };
}

function syncUrlState(state: AppState): void {
  const params = serializeRegistryExplorerUrlState({
    view: state.currentView,
    searchTerm: state.searchTerm,
    selectedProfileRegistryName: state.selectedProfileRegistryName,
    selectedCandidateId: state.selectedProfileRegistryName ? state.selectedCandidateId : null,
    selectedFocus: state.currentView === 'focus' ? state.selectedFocus : null,
    selectedComponent: state.currentView === 'component' ? state.selectedComponent : null,
    selectedItemSlug: state.currentView === 'item' ? state.selectedItemSlug : null,
  });
  const query = params.toString();
  const nextUrl = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;

  if (nextUrl !== `${window.location.pathname}${window.location.search}${window.location.hash}`) {
    window.history.replaceState(null, '', nextUrl);
  }
}

function renderMirrorStatus(
  root: HTMLElement,
  meta: RegistryMirrorMeta,
  warnings: readonly MirrorValidationIssue[]
): void {
  const countMatches = meta.upstream_count === meta.local_count;
  const countText = `${meta.local_count} / ${meta.upstream_count} registries mirrored`;
  const synced = formatSyncTime(meta.synced_at);
  const statusText = countMatches ? countText : `${countText}; counts need review`;
  const warningText = warnings.length > 0
    ? `${warnings.length} official fields need review`
    : 'No mirror warnings';

  root.insertAdjacentHTML('beforeend', `
    <div class="mirror-status" aria-label="Registry mirror status">
      <div class="mirror-source">
        <span class="mirror-source-label">Official shadcn directory</span>
        ${renderExternalLink(meta.source_url, 'Source', 'mirror-source-link')}
      </div>
      <div class="mirror-facts">
        <span>Synced <strong>${escapeHtml(synced)}</strong></span>
        <span>Upstream <strong>${meta.upstream_count}</strong></span>
        <span>Local <strong>${meta.local_count}</strong></span>
        <span class="${countMatches ? 'mirror-ok' : 'mirror-review'}">${escapeHtml(statusText)}</span>
        <span class="${warnings.length > 0 ? 'mirror-review' : 'mirror-ok'}">${escapeHtml(warningText)}</span>
      </div>
    </div>
  `);
}

function formatSyncTime(value: string): string {
  const timestamp = Date.parse(value);

  if (Number.isNaN(timestamp)) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp);
}
