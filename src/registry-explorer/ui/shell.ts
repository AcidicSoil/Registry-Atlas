import type { Registry, PrimaryFocus, ComponentTag } from '../core/registry.schema';
import {
  buildFocusGroups,
  buildComponentGroups,
  buildMatrixRows,
  computeMetrics
} from '../core/grouping';
import { MATRIX_COLUMNS } from '../core/matrixColumns';
import { renderFocusAside, renderFocusContent } from './focusView';
import { renderComponentAside, renderComponentContent } from './componentView';
import { renderMatrixAside, renderMatrixContent } from './matrixView';

export interface ShellOptions {
  registries: readonly Registry[];
  roots: {
    aside: HTMLElement;
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>; // More generic for flexibility
    searchInput: HTMLInputElement;
  };
}

interface AppState {
  currentView: 'focus' | 'component' | 'matrix';
  selectedFocus: PrimaryFocus | null;
  selectedComponent: ComponentTag | null;
  searchTerm: string;
}

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, roots } = options;

  // Initial State
  let state: AppState = {
    currentView: 'focus',
    selectedFocus: null,
    selectedComponent: null,
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
      if (state.currentView === 'focus') {
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
    } catch (error) {
      console.error('Registry Explorer: Render failed', error);
      // Optional: Render error state to UI
      roots.contentBody.innerHTML = `
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div>Something went wrong while rendering the view.</div>
          <div style="font-size: 10px; color: var(--text-muted); margin-top: 8px;">
            ${error instanceof Error ? error.message : 'Unknown error'}
          </div>
        </div>
      `;
    }
  }

  // Event Listeners

  // Tabs
  roots.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view') as AppState['currentView'];
      if (view && view !== state.currentView) {
        setState({ currentView: view });
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

  // Initial Render
  render();
}
