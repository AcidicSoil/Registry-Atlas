import type { Registry, PrimaryFocus, ComponentTag } from '../core/registry.schema';
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
import { MATRIX_COLUMNS } from '../core/matrixColumns';
import { renderFocusAside, renderFocusContent } from './focusView';
import { renderComponentAside, renderComponentContent } from './componentView';
import { renderMatrixAside, renderMatrixContent } from './matrixView';
import { renderDiscoveryAside, renderDiscoveryContent } from './discoveryView';
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
  currentView: 'discover' | 'focus' | 'component' | 'matrix';
  selectedFocus: PrimaryFocus | null;
  selectedComponent: ComponentTag | null;
  selectedCandidateId: string | null;
  selectedProfileRegistryName: string | null;
  searchTerm: string;
}

function isView(value: string | null): value is AppState['currentView'] {
  return value === 'discover' || value === 'focus' || value === 'component' || value === 'matrix';
}

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, mirrorMeta, mirrorWarnings, roots } = options;

  // Initial State
  let state: AppState = {
    currentView: 'discover',
    selectedFocus: null,
    selectedComponent: null,
    selectedCandidateId: null,
    selectedProfileRegistryName: null,
    searchTerm: '',
  };

  // State Update Logic
  function setState(partial: Partial<AppState>) {
    state = { ...state, ...partial };
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

      // 3. Delegate to Views
      if (state.selectedProfileRegistryName) {
        const candidates = searchComponentCandidates(registries, state.searchTerm);
        const candidate = candidates.find(item => item.id === state.selectedCandidateId);
        const registry = registries.find(item => item.name === state.selectedProfileRegistryName);
        if (registry) {
          renderRegistryProfile(roots.contentHeader, roots.contentBody, buildRegistryProfile(registry, { candidate }));
          roots.aside.innerHTML = '<div class="aside-section-title">Registry profile</div><div class="aside-hint">Official facts and Atlas enrichment are separated.</div>';
        }
      } else if (state.currentView === 'discover') {
        const overview = buildDiscoveryOverview(registries);
        const candidates = searchComponentCandidates(registries, state.searchTerm);
        renderDiscoveryAside(roots.aside, overview, state.selectedCandidateId);
        renderDiscoveryContent(roots.contentHeader, roots.contentBody, candidates, overview, state.searchTerm, state.selectedCandidateId);

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
        setState({ currentView: view, selectedProfileRegistryName: null, selectedCandidateId: null });
      }
    });
  });

  // Search
  roots.searchInput.addEventListener('input', (e) => {
    const target = e.target as HTMLInputElement;
    setState({ searchTerm: target.value || '' });
  });

  // Aside Delegation (Focus and Component pills)
  // We attach to document body or roots.aside? index.html attached to document.
  // Using roots.aside is better for encapsulation if the events bubble up there.
  // But wait, pills are inside roots.aside.
  roots.aside.addEventListener('click', (e) => {
    const target = e.target as HTMLElement;
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
    const profileButton = target.closest('[data-profile-registry]');
    if (profileButton) {
      setState({
        currentView: 'discover',
        selectedProfileRegistryName: profileButton.getAttribute('data-profile-registry'),
        selectedCandidateId: profileButton.getAttribute('data-candidate-id'),
      });
      return;
    }

    const backButton = target.closest('[data-back-to-results]');
    if (backButton) {
      setState({ selectedProfileRegistryName: null });
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

  // Initial Render
  render();
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
