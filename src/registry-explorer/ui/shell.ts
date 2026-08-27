import type {
  ComponentTag,
  InstallQueueEntry,
  Registry,
} from '../core/registry.schema';
import type { MirrorValidationIssue } from '../core/registryMirror';
import type { RegistryMirrorMeta } from '../data/loadRegistries';
import {
  searchComponentCandidates,
  buildDiscoveryOverview,
} from '../core/discovery';
import {
  buildCatalogFacetGroups,
  buildRegistryFacetGroups,
  applyCatalogFacetsToCandidates,
  applyCatalogFacetsToProfileRows,
  createSelectedCatalogFacet,
  type SelectedCatalogFacet,
} from '../core/catalogFacets';
import type { CatalogSort } from '../core/catalogSort';
import { sortCatalogCandidates } from '../core/catalogSort';
import { buildRegistryBrowseEntries } from '../core/registryBrowse';
import { buildCompareModel } from '../core/compare';
import {
  parseRegistryExplorerUrlState,
  serializeRegistryExplorerUrlState,
} from '../core/urlState';
import { buildRegistryProfile } from '../core/registryProfile';
import { resolveRegistryItemDetailFromSummary } from '../core/registryItemDetail';
import {
  addToInstallQueue,
  buildInstallQueueBatchState,
  clearInstallQueue,
  removeFromInstallQueue,
} from '../core/installQueue';
import {
  renderDiscoveryAside,
  renderDiscoveryContent,
  type CopyFeedback,
} from './discoveryView';
import { renderRegistriesContent } from './registriesView';
import { renderCompareContent } from './compareView';
import { renderRegistryProfile } from './registryProfileView';
import { renderItemDetailView } from './itemDetailView';
import { escapeHtml, renderExternalLink } from './renderSafety';

export interface ShellOptions {
  registries: readonly Registry[];
  mirrorMeta: RegistryMirrorMeta;
  mirrorWarnings: readonly MirrorValidationIssue[];
  roots: {
    aside: HTMLElement;
    contentHeader: HTMLElement;
    contentBody: HTMLElement;
    tabs: NodeListOf<Element>;
    searchInput: HTMLInputElement;
  };
}
interface AppState {
  currentView: 'discover' | 'registries' | 'compare' | 'item';
  returnView: 'discover' | 'registries';
  selectedFacets: SelectedCatalogFacet[];
  sort: CatalogSort;
  compareRegistryNames: string[];
  compareComponentKeys: ComponentTag[];
  selectedCandidateId: string | null;
  selectedProfileRegistryName: string | null;
  selectedItemSlug: string | null;
  searchTerm: string;
  installQueue: InstallQueueEntry[];
  copyFeedback: CopyFeedback | null;
  activePeekId: string | null;
  facetSearchTerms: Record<string, string>;
}
interface FocusIdentity {
  selector: string;
  attributes: ReadonlyArray<readonly [string, string]>;
}
function isView(value: string | null): value is AppState['currentView'] {
  return (
    value === 'discover' ||
    value === 'registries' ||
    value === 'compare' ||
    value === 'item'
  );
}

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, roots } = options;
  const parsed = hydrateStateFromUrl(registries);
  let state: AppState = {
    ...parsed,
    returnView: parsed.currentView === 'registries' ? 'registries' : 'discover',
    installQueue: [],
    copyFeedback: null,
    activePeekId: null,
    facetSearchTerms: {},
  };
  let pinnedPeekId: string | null = null;
  const openFacetGroups = new Set<string>();
  roots.searchInput.value = state.searchTerm;
  const setState = (
    partial: Partial<AppState>,
    historyMode: 'push' | 'replace' = 'replace',
    focusIdentity: FocusIdentity | null = null,
  ) => {
    rememberFacetDisclosureState();
    state = { ...state, ...partial };
    syncUrlState(state, historyMode);
    render();
    if (focusIdentity) restoreControlFocus(focusIdentity);
  };

  function rememberFacetDisclosureState(): void {
    roots.contentBody
      .querySelectorAll<HTMLDetailsElement>('[data-facet-group]')
      .forEach((group) => {
        const key = group.getAttribute('data-facet-group');
        if (!key) return;
        if (group.open) openFacetGroups.add(key);
        else openFacetGroups.delete(key);
      });
  }

  function trackFacetDisclosureState(): void {
    roots.contentBody
      .querySelectorAll<HTMLDetailsElement>('[data-facet-group]')
      .forEach((group) => {
        const key = group.getAttribute('data-facet-group');
        if (!key) return;
        group.addEventListener('toggle', () => {
          if (group.open) openFacetGroups.add(key);
          else openFacetGroups.delete(key);
        });
      });
  }

  function restoreFacetDisclosureState(): void {
    roots.contentBody
      .querySelectorAll<HTMLDetailsElement>('[data-facet-group]')
      .forEach((group) => {
        const key = group.getAttribute('data-facet-group');
        if (key) group.open = openFacetGroups.has(key);
      });
  }

  function searchTermsFor(scope: 'registries' | 'compare'): Record<string, string> {
    const prefix = `${scope}:`;
    return Object.fromEntries(
      Object.entries(state.facetSearchTerms)
        .filter(([key]) => key.startsWith(prefix))
        .map(([key, value]) => [key.slice(prefix.length), value]),
    );
  }

  function restoreControlFocus(identity: FocusIdentity): void {
    const candidates = Array.from(
      roots.contentBody.querySelectorAll<HTMLElement>(identity.selector),
    );
    const equivalent = candidates.find(candidate =>
      identity.attributes.every(([name, value]) => candidate.getAttribute(name) === value),
    );
    const fallback = equivalent ?? candidates[0];
    fallback?.focus();
  }

  function render(): void {
    try {
      roots.tabs.forEach((tab) => {
        tab.classList.toggle(
          'nav-item-active',
          tab.getAttribute('data-view') === state.currentView,
        );
        if (tab.getAttribute('data-view') === state.currentView) {
          tab.setAttribute('aria-current', 'page');
        } else {
          tab.removeAttribute('aria-current');
        }
      });
      const queued = new Set(state.installQueue.map((entry) => entry.token));
      const batch = buildInstallQueueBatchState(state.installQueue);
      if (state.currentView === 'item') {
        renderItemDetailView(
          roots.contentHeader,
          roots.contentBody,
          resolveRegistryItemDetailFromSummary(
            registries,
            state.selectedProfileRegistryName,
            state.selectedItemSlug,
          ),
          queued,
          registries,
        );
        roots.aside.innerHTML =
          '<div class="aside-section-title">Component item</div>';
      } else if (state.currentView !== 'compare' && state.selectedProfileRegistryName) {
        const registry = registries.find(
          (item) => item.name === state.selectedProfileRegistryName,
        );
        if (!registry) return;
        const candidates = searchComponentCandidates(
          registries,
          state.searchTerm,
        );
        const profile = buildRegistryProfile(registry, {
          candidate: candidates.find(
            (item) => item.id === state.selectedCandidateId,
          ),
        });
        const groups = buildCatalogFacetGroups(registries, candidates);
        const filteredProfile = {
          ...profile,
          sections: profile.sections.map((section) =>
            section.items
              ? {
                  ...section,
                  items: applyCatalogFacetsToProfileRows(
                    section.items,
                    state.selectedFacets,
                  ),
                }
              : section,
          ),
        };
        renderRegistryProfile(
          roots.contentHeader,
          roots.contentBody,
          filteredProfile,
          queued,
          groups,
          state.selectedFacets,
          state.activePeekId,
        );
        roots.aside.innerHTML =
          '<div class="aside-section-title">Registry profile</div>';
      } else if (state.currentView === 'discover') {
        const candidates = searchComponentCandidates(
          registries,
          state.searchTerm,
        );
        const groups = buildCatalogFacetGroups(registries, candidates);
        renderDiscoveryAside(
          roots.aside,
          buildDiscoveryOverview(registries),
          state.selectedCandidateId,
          { entries: state.installQueue, batch, feedback: null },
        );
        renderDiscoveryContent(
          roots.contentHeader,
          roots.contentBody,
          sortCatalogCandidates(
            applyCatalogFacetsToCandidates(candidates, state.selectedFacets),
            state.sort,
          ),
          buildDiscoveryOverview(registries),
          {
            searchTerm: state.searchTerm,
            facetGroups: groups,
            selectedFacets: state.selectedFacets,
            sort: state.sort,
            queuedTokens: queued,
            activePeekId: state.activePeekId,
            selectedCandidateId: state.selectedCandidateId,
          },
        );
      } else if (state.currentView === 'registries') {
        const groups = buildRegistryFacetGroups(
          registries,
          state.searchTerm,
          state.selectedFacets,
        );
        renderRegistriesContent(
          roots.contentHeader,
          roots.contentBody,
          buildRegistryBrowseEntries(
            registries,
            state.searchTerm,
            state.selectedFacets,
          ),
          groups,
          state.selectedFacets,
          searchTermsFor('registries'),
        );
      } else {
        const selection = {
          registryNames: state.compareRegistryNames,
          componentKeys: state.compareComponentKeys,
        };
        renderCompareContent(
          roots.contentHeader,
          roots.contentBody,
          buildCompareModel(registries, state.searchTerm, selection),
          selection,
          searchTermsFor('compare'),
        );
      }
      trackFacetDisclosureState();
      restoreFacetDisclosureState();
      syncPeekTriggerSemantics();
      roots.contentHeader.insertAdjacentHTML('beforeend', renderCopyFeedback(state.copyFeedback));
      const source = renderExternalLink(options.mirrorMeta.source_url, 'Official shadcn directory', 'secondary-link');
      const syncedAt = escapeHtml(options.mirrorMeta.synced_at);
      roots.contentHeader.insertAdjacentHTML(
        'beforeend',
        `<div class="mirror-status"><span>Source: ${source}</span><span>Synced ${syncedAt}</span><span>${options.mirrorMeta.local_count} / ${options.mirrorMeta.upstream_count} registries mirrored</span><span>Review: ${escapeHtml(options.mirrorMeta.validation_status)}</span><span>${options.mirrorWarnings.length} warning(s)</span></div>`,
      );
    } catch (error) {
      console.error('Registry Explorer: Render failed', error);
      roots.contentBody.innerHTML =
        '<div class="empty-state">Something went wrong while rendering this view.</div>';
    }
  }
  roots.tabs.forEach((tab) =>
    tab.addEventListener('click', () => {
      const view = tab.getAttribute('data-view');
      if (isView(view)) {
        pinnedPeekId = null;
        setState({
          currentView: view,
          selectedFacets: state.selectedFacets,
          selectedProfileRegistryName: null,
          selectedCandidateId: null,
          selectedItemSlug: null,
          returnView: view === 'discover' || view === 'registries' ? view : state.returnView,
          activePeekId: null,
        }, 'push');
      }
    }),
  );
  roots.searchInput.addEventListener('input', () =>
    setState({ searchTerm: roots.searchInput.value, copyFeedback: null }),
  );
  roots.contentBody.addEventListener('input', (event) => {
    const target = event.target as HTMLInputElement;
    const facet = target.closest('[data-facet-search], [data-compare-search]');
    if (!facet) return;
    const compareSearch = facet.getAttribute('data-compare-search');
    const dimension = facet.getAttribute('data-facet-search') ?? compareSearch;
    if (!dimension) return;
    const scope = compareSearch ? 'compare' : 'registries';
    const key = `${scope}:${dimension}`;
    const value = target.value;
    const focusIdentity = createFocusIdentity(
      facet,
      compareSearch ? '[data-compare-search]' : '[data-facet-search]',
      [compareSearch ? 'data-compare-search' : 'data-facet-search'],
    );
    setState(
      { facetSearchTerms: { ...state.facetSearchTerms, [key]: value } },
      'replace',
      focusIdentity,
    );
    const nextInput = Array.from(
      roots.contentBody.querySelectorAll<HTMLInputElement>('[data-facet-search], [data-compare-search]'),
    ).find(item =>
      item.getAttribute('data-facet-search') === dimension || item.getAttribute('data-compare-search') === dimension,
    );
    nextInput?.focus();
    nextInput?.setSelectionRange(value.length, value.length);
  });
  roots.aside.addEventListener('click', (event) =>
    handleClick(event.target as HTMLElement),
  );
  roots.contentHeader.addEventListener('click', (event) =>
    handleClick(event.target as HTMLElement),
  );
  roots.contentBody.addEventListener('click', (event) =>
    handleClick(event.target as HTMLElement),
  );
  roots.contentBody.addEventListener('mouseover', (event) => {
    const id = peekIdFromTarget(event.target);
    if (id && pinnedPeekId === null) setState({ activePeekId: id });
  });
  roots.contentBody.addEventListener('mouseout', (event) => {
    if (pinnedPeekId !== null) return;
    const id = peekIdFromTarget(event.target) ?? popoverIdFromTarget(event.target);
    if (!id || state.activePeekId !== id) return;
    const relatedId = peekIdFromTarget(event.relatedTarget) ?? popoverIdFromTarget(event.relatedTarget);
    if (relatedId !== id) setState({ activePeekId: null });
  });
  roots.contentBody.addEventListener('keydown', (event) => {
    const keyboardEvent = event as KeyboardEvent;
    if (keyboardEvent.key !== 'Escape' || !state.activePeekId) return;
    const id = state.activePeekId;
    pinnedPeekId = null;
    keyboardEvent.preventDefault();
    setState({ activePeekId: null });
    focusPeekTrigger(id);
  });
  function handleClick(target: HTMLElement): void {
    const peekTrigger = target.closest('[data-component-peek-id]');
    if (peekTrigger?.classList.contains('component-peek-trigger')) {
      const id = peekTrigger.getAttribute('data-component-peek-id');
      if (!id) return;
      if (state.activePeekId === id && pinnedPeekId === id) {
        pinnedPeekId = null;
        setState({ activePeekId: null });
        focusPeekTrigger(id);
      } else {
        pinnedPeekId = id;
        setState({ activePeekId: id });
        focusPeekTrigger(id);
      }
      return;
    }
    if (handleInstall(target)) return;
    const add = target.closest('[data-facet-add-dimension]');
    const remove = target.closest('[data-facet-remove-dimension]');
    if (add) {
      const next = createSelectedCatalogFacet(
        buildCatalogFacetGroups(
          registries,
          searchComponentCandidates(registries, state.searchTerm),
        ),
        add.getAttribute('data-facet-add-dimension'),
        add.getAttribute('data-facet-add-value'),
      );
      if (next) {
        const selected = state.selectedFacets.some(
          (f) => f.dimension === next.dimension && f.value === next.value,
        );
        const focusIdentity = createFocusIdentity(
          add,
          '[data-facet-add-dimension]',
          ['data-facet-add-dimension', 'data-facet-add-value'],
        );
        setState({
          selectedFacets: selected
            ? state.selectedFacets.filter(
                (f) => f.dimension !== next.dimension || f.value !== next.value,
              )
            : [...state.selectedFacets, next],
        }, 'push', focusIdentity);
      }
      return;
    }
    if (remove) {
      const focusIdentity = createFocusIdentity(
        remove,
        '[data-facet-remove-dimension]',
        ['data-facet-remove-dimension', 'data-facet-remove-value'],
      );
      setState({
        selectedFacets: state.selectedFacets.filter(
          (f) =>
            f.dimension !==
              remove.getAttribute('data-facet-remove-dimension') ||
            f.value !== remove.getAttribute('data-facet-remove-value'),
        ),
      }, 'push', focusIdentity);
      return;
    }
    const clear = target.closest('[data-facet-clear]');
    if (clear) {
      setState(
        { selectedFacets: [] },
        'push',
        createFocusIdentity(clear, '[data-facet-clear]', ['data-facet-clear']),
      );
      return;
    }
    const sort = target.closest('[data-sort]')?.getAttribute('data-sort');
    if (sort === 'name' || sort === 'relevance') {
      setState({ sort }, 'push');
      return;
    }
    const registry = target
      .closest('[data-compare-registry]')
      ?.getAttribute('data-compare-registry');
    if (registry) {
      setState({
        compareRegistryNames: toggle(state.compareRegistryNames, registry),
      }, 'push', createFocusIdentity(
        target.closest('[data-compare-registry]'),
        '[data-compare-registry]',
        ['data-compare-registry'],
      ));
      return;
    }
    const component = target
      .closest('[data-compare-component]')
      ?.getAttribute('data-compare-component') as ComponentTag | null;
    if (component) {
      setState({
        compareComponentKeys: toggle(state.compareComponentKeys, component),
      }, 'push', createFocusIdentity(
        target.closest('[data-compare-component]'),
        '[data-compare-component]',
        ['data-compare-component'],
      ));
      return;
    }
    const profile = target
      .closest('[data-profile-registry]')
      ?.getAttribute('data-profile-registry');
    if (profile) {
      const surface = state.currentView === 'registries'
        ? 'registries'
        : state.currentView === 'discover'
          ? 'discover'
          : state.returnView;
      setState({
        currentView: surface,
        returnView: surface,
        selectedProfileRegistryName: profile,
        selectedFacets: state.selectedFacets.filter(
          (f) => f.dimension !== 'registry',
        ),
        activePeekId: null,
      }, 'push');
      pinnedPeekId = null;
      return;
    }
    const item = target.closest('[data-view-item-registry]');
    if (item) {
      const surface = state.currentView === 'registries'
        ? 'registries'
        : state.currentView === 'discover'
          ? 'discover'
          : state.returnView;
      setState({
        currentView: 'item',
        returnView: surface,
        selectedProfileRegistryName: item.getAttribute(
          'data-view-item-registry',
        ),
        selectedItemSlug: item.getAttribute('data-view-item-slug'),
        selectedCandidateId: item.getAttribute('data-candidate-id'),
        activePeekId: null,
      }, 'push');
      pinnedPeekId = null;
      return;
    }
    if (target.closest('[data-back-from-item]'))
      setState({
        currentView: state.returnView,
        selectedProfileRegistryName: null,
        selectedCandidateId: null,
        selectedItemSlug: null,
        activePeekId: null,
      });
    else if (target.closest('[data-back-to-results]'))
      setState({
        selectedProfileRegistryName: null,
        selectedCandidateId: null,
        selectedItemSlug: null,
        activePeekId: null,
      });
  }
  function handleInstall(target: HTMLElement): boolean {
    const copy = target.closest(
      '[data-copy-text], [data-copy-current-url], [data-copy-command]',
    );
    if (copy) {
      const text = copy.hasAttribute('data-copy-current-url')
        ? window.location.href
        : (copy.getAttribute('data-copy-text') ??
          copy.getAttribute('data-copy-command') ??
          '');
      if (text)
        void copyText(text, copy.getAttribute('data-copy-label') ?? 'Copied.');
      return true;
    }
    const add = target.closest('[data-queue-add]');
    if (add) {
      setState({
        installQueue: addToInstallQueue(state.installQueue, {
          action: {
            status: 'enabled',
            token: add.getAttribute('data-queue-add') ?? '',
            installCommand: add.getAttribute('data-queue-install') ?? '',
            inspectCommand: add.getAttribute('data-queue-inspect') ?? '',
            route: add.getAttribute('data-queue-route') ?? '',
            disabledReason: null,
          },
          label: add.getAttribute('data-queue-label') ?? '',
          registry: add.getAttribute('data-queue-registry') ?? '',
          item: add.getAttribute('data-queue-item') ?? '',
        }),
      });
      return true;
    }
    const remove = target.closest('[data-queue-remove]');
    if (remove) {
      setState({
        installQueue: removeFromInstallQueue(
          state.installQueue,
          remove.getAttribute('data-queue-remove') ?? '',
        ),
      });
      return true;
    }
    if (target.closest('[data-queue-clear]')) {
      setState({ installQueue: clearInstallQueue() });
      return true;
    }
    return false;
  }
  function syncPeekTriggerSemantics(): void {
    const popovers = Array.from(
      roots.contentBody.querySelectorAll<HTMLElement>('[data-component-peek-popover]'),
    );
    roots.contentBody
      .querySelectorAll<HTMLElement>('[data-component-peek-id]')
      .forEach((trigger) => {
        const id = trigger.getAttribute('data-component-peek-id');
        const popover = popovers.find(
          (item) => item.getAttribute('data-component-peek-popover') === id,
        );
        trigger.setAttribute('aria-expanded', String(state.activePeekId === id));
        if (popover?.id) trigger.setAttribute('aria-controls', popover.id);
      });
  }

  function focusPeekTrigger(id: string): void {
    const trigger = Array.from(
      roots.contentBody.querySelectorAll<HTMLElement>('[data-component-peek-id]'),
    ).find((item) => item.getAttribute('data-component-peek-id') === id);
    trigger?.focus();
  }

  async function copyText(text: string, message: string): Promise<void> {
    try {
      if (!navigator.clipboard?.writeText) throw new Error();
      await navigator.clipboard.writeText(text);
      setState({ copyFeedback: { status: 'success', message, command: text } });
    } catch {
      setState({
        copyFeedback: {
          status: 'error',
          message: 'Clipboard unavailable. Select and copy the text manually.',
          command: text,
        },
      });
    }
  }
  window.addEventListener('popstate', (event) => {
    rememberFacetDisclosureState();
    const parsed = hydrateStateFromUrl(registries);
    state = {
      ...state,
      ...parsed,
      returnView: historyReturnView(event.state, parsed.currentView),
      copyFeedback: null,
      activePeekId: null,
    };
    pinnedPeekId = null;
    roots.searchInput.value = state.searchTerm;
    render();
  });
  syncUrlState(state);
  render();
}
function renderCopyFeedback(feedback: CopyFeedback | null): string {
  if (!feedback) return '';
  return `
    <div class="copy-feedback copy-feedback-${escapeHtml(feedback.status)}" role="status" aria-live="polite" aria-atomic="true">
      <span>${escapeHtml(feedback.message)}</span>
      ${feedback.command ? `<code>${escapeHtml(feedback.command)}</code>` : ''}
    </div>
  `;
}

function createFocusIdentity(
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

function peekIdFromTarget(target: EventTarget | null): string | null {
  return attributeFromTarget(target, '[data-component-peek-id]', 'data-component-peek-id');
}

function popoverIdFromTarget(target: EventTarget | null): string | null {
  return attributeFromTarget(target, '[data-component-peek-popover]', 'data-component-peek-popover');
}

function attributeFromTarget(
  target: EventTarget | null,
  selector: string,
  attribute: string,
): string | null {
  const closest = (target as { closest?: (value: string) => Element | null } | null)?.closest;
  return typeof closest === 'function'
    ? closest.call(target, selector)?.getAttribute(attribute) ?? null
    : null;
}

function historyReturnView(
  historyState: unknown,
  currentView: AppState['currentView'],
): 'discover' | 'registries' {
  if (typeof historyState === 'object' && historyState !== null) {
    const returnView = (historyState as { returnView?: unknown }).returnView;
    if (returnView === 'discover' || returnView === 'registries') return returnView;
  }
  return currentView === 'registries' ? 'registries' : 'discover';
}

function toggle<T>(values: readonly T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}
function hydrateStateFromUrl(
  registries: readonly Registry[],
): Omit<AppState, 'installQueue' | 'copyFeedback' | 'activePeekId' | 'returnView' | 'facetSearchTerms'> {
  const parsed = parseRegistryExplorerUrlState(
    new URLSearchParams(window.location.search),
  );
  const profileStateAllowed = parsed.view !== 'compare';
  const registry =
    profileStateAllowed &&
    parsed.selectedProfileRegistryName &&
    registries.some((item) => item.name === parsed.selectedProfileRegistryName)
      ? parsed.selectedProfileRegistryName
      : null;
  const names = parsed.compareRegistryNames.filter((name) =>
    registries.some((item) => item.name === name),
  );
  const components = new Set(registries.flatMap((item) => item.component_tags));
  return {
    ...parsed,
    currentView: parsed.view,
    selectedProfileRegistryName: registry,
    selectedCandidateId: parsed.view === 'discover' && registry ? parsed.selectedCandidateId : null,
    selectedItemSlug: parsed.view === 'item' && registry ? parsed.selectedItemSlug : null,
    compareRegistryNames: names,
    compareComponentKeys: parsed.compareComponentKeys.filter((key) =>
      components.has(key),
    ),
  };
}
function syncUrlState(state: AppState, historyMode: 'push' | 'replace' = 'replace'): void {
  const profileStateAllowed = state.currentView !== 'compare';
  const params = serializeRegistryExplorerUrlState({
    view: state.currentView,
    searchTerm: state.searchTerm,
    selectedFacets: state.selectedFacets,
    sort: state.sort,
    selectedProfileRegistryName: profileStateAllowed
      ? state.selectedProfileRegistryName
      : null,
    selectedCandidateId:
      state.currentView === 'discover' && state.selectedProfileRegistryName
        ? state.selectedCandidateId
        : null,
    selectedItemSlug:
      state.currentView === 'item' && state.selectedProfileRegistryName
        ? state.selectedItemSlug
        : null,
    compareRegistryNames: state.compareRegistryNames,
    compareComponentKeys: state.compareComponentKeys,
  });
  const query = params.toString();
  const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`;
  if (
    next ===
    `${window.location.pathname}${window.location.search}${window.location.hash}`
  ) return;
  const history = historyMode === 'push' ? window.history.pushState : window.history.replaceState;
  history.call(window.history, { returnView: state.returnView }, '', next);
}
