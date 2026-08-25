import type { ComponentTag, InstallQueueEntry, Registry } from '../core/registry.schema';
import type { MirrorValidationIssue } from '../core/registryMirror';
import type { RegistryMirrorMeta } from '../data/loadRegistries';
import { searchComponentCandidates, buildDiscoveryOverview } from '../core/discovery';
import { buildCatalogFacetGroups, applyCatalogFacetsToCandidates, createSelectedCatalogFacet, type SelectedCatalogFacet } from '../core/catalogFacets';
import type { CatalogSort } from '../core/catalogSort';
import { sortCatalogCandidates } from '../core/catalogSort';
import { buildRegistryBrowseEntries } from '../core/registryBrowse';
import { buildCompareModel } from '../core/compare';
import { parseRegistryExplorerUrlState, serializeRegistryExplorerUrlState } from '../core/urlState';
import { buildRegistryProfile } from '../core/registryProfile';
import { resolveRegistryItemDetailFromSummary } from '../core/registryItemDetail';
import { buildComponentFilterGroups, applyComponentFiltersToProfileRows, type SelectedComponentFilter } from '../core/componentFilters';
import { addToInstallQueue, buildInstallQueueBatchState, clearInstallQueue, removeFromInstallQueue } from '../core/installQueue';
import { renderDiscoveryAside, renderDiscoveryContent, type CopyFeedback } from './discoveryView';
import { renderRegistriesContent } from './registriesView';
import { renderCompareContent } from './compareView';
import { renderRegistryProfile } from './registryProfileView';
import { renderItemDetailView } from './itemDetailView';

export interface ShellOptions { registries: readonly Registry[]; mirrorMeta: RegistryMirrorMeta; mirrorWarnings: readonly MirrorValidationIssue[]; roots: { aside: HTMLElement; contentHeader: HTMLElement; contentBody: HTMLElement; tabs: NodeListOf<Element>; searchInput: HTMLInputElement } }
interface AppState { currentView: 'discover' | 'registries' | 'compare' | 'item'; selectedFacets: SelectedCatalogFacet[]; sort: CatalogSort; compareRegistryNames: string[]; compareComponentKeys: ComponentTag[]; selectedCandidateId: string | null; selectedProfileRegistryName: string | null; selectedItemSlug: string | null; searchTerm: string; installQueue: InstallQueueEntry[]; copyFeedback: CopyFeedback | null; selectedComponentFilters: SelectedComponentFilter[]; activePeekId: string | null }
function isView(value: string | null): value is AppState['currentView'] { return value === 'discover' || value === 'registries' || value === 'compare' || value === 'item'; }

export function initRegistryExplorer(options: ShellOptions): void {
  const { registries, roots } = options; const parsed = hydrateStateFromUrl(registries);
  let state: AppState = { ...parsed, installQueue: [], copyFeedback: null, selectedComponentFilters: [], activePeekId: null }; roots.searchInput.value = state.searchTerm;
  const setState = (partial: Partial<AppState>) => { state = { ...state, ...partial }; syncUrlState(state); render(); };
  function render(): void {
    try {
      roots.tabs.forEach(tab => tab.classList.toggle('nav-item-active', tab.getAttribute('data-view') === state.currentView));
      const queued = new Set(state.installQueue.map(entry => entry.token)); const batch = buildInstallQueueBatchState(state.installQueue);
      if (state.currentView === 'item') {
        renderItemDetailView(roots.contentHeader, roots.contentBody, resolveRegistryItemDetailFromSummary(registries, state.selectedProfileRegistryName, state.selectedItemSlug), queued, registries);
        roots.aside.innerHTML = '<div class="aside-section-title">Component item</div>';
      } else if (state.selectedProfileRegistryName) {
        const registry = registries.find(item => item.name === state.selectedProfileRegistryName); if (!registry) return;
        const profile = buildRegistryProfile(registry, { candidate: searchComponentCandidates(registries, state.searchTerm).find(item => item.id === state.selectedCandidateId) });
        const groups = buildComponentFilterGroups(registries);
        renderRegistryProfile(roots.contentHeader, roots.contentBody, { ...profile, sections: profile.sections.map(section => section.items ? { ...section, items: applyComponentFiltersToProfileRows(section.items, state.selectedComponentFilters) } : section) }, queued, groups, state.selectedComponentFilters, state.activePeekId);
        roots.aside.innerHTML = '<div class="aside-section-title">Registry profile</div>';
      } else if (state.currentView === 'discover') {
        const candidates = searchComponentCandidates(registries, state.searchTerm); const groups = buildCatalogFacetGroups(registries, candidates);
        renderDiscoveryAside(roots.aside, buildDiscoveryOverview(registries), state.selectedCandidateId, { entries: state.installQueue, batch, feedback: state.copyFeedback });
        renderDiscoveryContent(roots.contentHeader, roots.contentBody, sortCatalogCandidates(applyCatalogFacetsToCandidates(candidates, state.selectedFacets), state.sort), buildDiscoveryOverview(registries), { searchTerm: state.searchTerm, facetGroups: groups, selectedFacets: state.selectedFacets, sort: state.sort, queuedTokens: queued, activePeekId: state.activePeekId, selectedCandidateId: state.selectedCandidateId });
      } else if (state.currentView === 'registries') {
        const groups = buildCatalogFacetGroups(registries, searchComponentCandidates(registries, state.searchTerm)); renderRegistriesContent(roots.contentHeader, roots.contentBody, buildRegistryBrowseEntries(registries, state.searchTerm, state.selectedFacets), groups, state.selectedFacets);
      } else {
        const selection = { registryNames: state.compareRegistryNames, componentKeys: state.compareComponentKeys }; renderCompareContent(roots.contentHeader, roots.contentBody, buildCompareModel(registries, state.searchTerm, selection), selection);
      }
      roots.contentHeader.insertAdjacentHTML('beforeend', `<div class="mirror-status"><span>${options.mirrorMeta.local_count} / ${options.mirrorMeta.upstream_count} registries mirrored</span><span>${options.mirrorWarnings.length} warning(s)</span></div>`);
    } catch (error) { console.error('Registry Explorer: Render failed', error); roots.contentBody.innerHTML = '<div class="empty-state">Something went wrong while rendering this view.</div>'; }
  }
  roots.tabs.forEach(tab => tab.addEventListener('click', () => { const view = tab.getAttribute('data-view'); if (isView(view)) setState({ currentView: view, selectedFacets: view === 'registries' ? state.selectedFacets.filter(f => f.dimension !== 'registry') : state.selectedFacets, selectedProfileRegistryName: null, selectedCandidateId: null, selectedItemSlug: null }); }));
  roots.searchInput.addEventListener('input', () => setState({ searchTerm: roots.searchInput.value, copyFeedback: null }));
  roots.aside.addEventListener('click', event => handleClick(event.target as HTMLElement)); roots.contentBody.addEventListener('click', event => handleClick(event.target as HTMLElement));
  roots.contentBody.addEventListener('mouseover', event => { const id = (event.target as HTMLElement).closest('[data-component-peek-id]')?.getAttribute('data-component-peek-id'); if (id) setState({ activePeekId: id }); });
  function handleClick(target: HTMLElement): void {
    if (handleInstall(target)) return;
    const add = target.closest('[data-facet-add-dimension]'); const remove = target.closest('[data-facet-remove-dimension]');
    if (add) { const next = createSelectedCatalogFacet(buildCatalogFacetGroups(registries, searchComponentCandidates(registries, state.searchTerm)), add.getAttribute('data-facet-add-dimension'), add.getAttribute('data-facet-add-value')); if (next && !state.selectedFacets.some(f => f.dimension === next.dimension && f.value === next.value)) setState({ selectedFacets: [...state.selectedFacets, next] }); return; }
    if (remove) { setState({ selectedFacets: state.selectedFacets.filter(f => f.dimension !== remove.getAttribute('data-facet-remove-dimension') || f.value !== remove.getAttribute('data-facet-remove-value')) }); return; }
    if (target.closest('[data-facet-clear]')) { setState({ selectedFacets: [] }); return; }
    const sort = target.closest('[data-sort]')?.getAttribute('data-sort'); if (sort === 'name' || sort === 'relevance') { setState({ sort }); return; }
    const registry = target.closest('[data-compare-registry]')?.getAttribute('data-compare-registry'); if (registry) { setState({ compareRegistryNames: toggle(state.compareRegistryNames, registry) }); return; }
    const component = target.closest('[data-compare-component]')?.getAttribute('data-compare-component') as ComponentTag | null; if (component) { setState({ compareComponentKeys: toggle(state.compareComponentKeys, component) }); return; }
    const profile = target.closest('[data-profile-registry]')?.getAttribute('data-profile-registry'); if (profile) { setState({ currentView: 'discover', selectedProfileRegistryName: profile, selectedFacets: state.selectedFacets.filter(f => f.dimension !== 'registry') }); return; }
    const item = target.closest('[data-view-item-registry]'); if (item) { setState({ currentView: 'item', selectedProfileRegistryName: item.getAttribute('data-view-item-registry'), selectedItemSlug: item.getAttribute('data-view-item-slug'), selectedCandidateId: item.getAttribute('data-candidate-id') }); return; }
    if (target.closest('[data-back-from-item]')) setState({ currentView: 'discover', selectedProfileRegistryName: null, selectedItemSlug: null }); else if (target.closest('[data-back-to-results]')) setState({ selectedProfileRegistryName: null, selectedItemSlug: null });
  }
  function handleInstall(target: HTMLElement): boolean {
    const copy = target.closest('[data-copy-text], [data-copy-current-url], [data-copy-command]'); if (copy) { const text = copy.hasAttribute('data-copy-current-url') ? window.location.href : copy.getAttribute('data-copy-text') ?? copy.getAttribute('data-copy-command') ?? ''; if (text) void copyText(text, copy.getAttribute('data-copy-label') ?? 'Copied.'); return true; }
    const add = target.closest('[data-queue-add]'); if (add) { setState({ installQueue: addToInstallQueue(state.installQueue, { action: { status: 'enabled', token: add.getAttribute('data-queue-add') ?? '', installCommand: add.getAttribute('data-queue-install') ?? '', inspectCommand: add.getAttribute('data-queue-inspect') ?? '', route: add.getAttribute('data-queue-route') ?? '', disabledReason: null }, label: add.getAttribute('data-queue-label') ?? '', registry: add.getAttribute('data-queue-registry') ?? '', item: add.getAttribute('data-queue-item') ?? '' }) }); return true; }
    const remove = target.closest('[data-queue-remove]'); if (remove) { setState({ installQueue: removeFromInstallQueue(state.installQueue, remove.getAttribute('data-queue-remove') ?? '') }); return true; } if (target.closest('[data-queue-clear]')) { setState({ installQueue: clearInstallQueue() }); return true; } return false;
  }
  async function copyText(text: string, message: string): Promise<void> { try { if (!navigator.clipboard?.writeText) throw new Error(); await navigator.clipboard.writeText(text); setState({ copyFeedback: { status: 'success', message, command: text } }); } catch { setState({ copyFeedback: { status: 'error', message: 'Clipboard unavailable. Select and copy the text manually.', command: text } }); } }
  syncUrlState(state); render();
}
function toggle<T>(values: readonly T[], value: T): T[] { return values.includes(value) ? values.filter(item => item !== value) : [...values, value]; }
function hydrateStateFromUrl(registries: readonly Registry[]): Omit<AppState, 'installQueue' | 'copyFeedback' | 'selectedComponentFilters' | 'activePeekId'> { const parsed = parseRegistryExplorerUrlState(new URLSearchParams(window.location.search)); const registry = parsed.selectedProfileRegistryName && registries.some(item => item.name === parsed.selectedProfileRegistryName) ? parsed.selectedProfileRegistryName : null; const names = parsed.compareRegistryNames.filter(name => registries.some(item => item.name === name)); const components = new Set(registries.flatMap(item => item.component_tags)); return { ...parsed, currentView: parsed.view, selectedProfileRegistryName: registry, selectedCandidateId: registry ? parsed.selectedCandidateId : null, selectedItemSlug: registry ? parsed.selectedItemSlug : null, compareRegistryNames: names, compareComponentKeys: parsed.compareComponentKeys.filter(key => components.has(key)) }; }
function syncUrlState(state: AppState): void { const params = serializeRegistryExplorerUrlState({ view: state.currentView, searchTerm: state.searchTerm, selectedFacets: state.selectedFacets, sort: state.sort, selectedProfileRegistryName: state.selectedProfileRegistryName, selectedCandidateId: state.selectedProfileRegistryName ? state.selectedCandidateId : null, selectedItemSlug: state.currentView === 'item' ? state.selectedItemSlug : null, compareRegistryNames: state.compareRegistryNames, compareComponentKeys: state.compareComponentKeys }); const query = params.toString(); const next = `${window.location.pathname}${query ? `?${query}` : ''}${window.location.hash}`; if (next !== `${window.location.pathname}${window.location.search}${window.location.hash}`) window.history.replaceState(null, '', next); }
