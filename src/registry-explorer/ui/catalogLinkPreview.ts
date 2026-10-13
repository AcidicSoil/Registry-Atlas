import { findRegistryCatalogItem } from '../core/registryCatalogIndex';
import type { Registry, RegistryCatalogIndex, RegistryCatalogItem, RegistryItemSummary, RegistryThemePreview } from '../core/registry.schema';
import { parseCatalogRoute } from '../core/catalogRoutes';
import { escapeHtml } from './renderSafety';
import { renderRegistryIcon } from './registryIdentity';

type PreviewRouteKind = 'component' | 'block' | 'page' | 'template' | 'theme';

export interface CatalogLinkPreviewData {
  namespace: string;
  title: string;
  kind: PreviewRouteKind;
  description?: string;
  author?: string;
  fileCount?: number;
  categories: readonly string[];
  themePreview?: RegistryThemePreview;
  registry: Registry;
}

const PREVIEW_ID = 'catalog-link-preview';

const POINTER_DELAY_MS = 240;

export function resolveCatalogLinkPreview(
  href: string,
  basePath: string,
  index: RegistryCatalogIndex,
  registries: readonly Registry[],
  pageOrigin: string,
): CatalogLinkPreviewData | null {
  const route = itemRouteFromHref(href, basePath, pageOrigin);

  if (!route) return null;

  const registry = registries.find(entry => entry.name === route.namespace);
  const item = findRegistryCatalogItem(index, route.namespace, route.slug);

  if (!registry || !item) return null;

  const summary = registry.itemSummaries?.find(entry => entry.slug === route.slug);

  return previewData(route, registry, item, summary);
}

function itemRouteFromHref(href: string, basePath: string, pageOrigin: string) {
  const url = new URL(href, pageOrigin);

  if (url.origin !== pageOrigin) return null;

  const route = parseCatalogRoute(url.pathname, basePath);

  return isItemRoute(route) ? route : null;
}

function previewData(
  route: { kind: PreviewRouteKind; namespace: string; slug: string },
  registry: Registry,
  item: RegistryCatalogItem,
  summary?: RegistryItemSummary,
): CatalogLinkPreviewData {
  return {
    namespace: route.namespace,
    title: item.title || summary?.title || route.slug,
    kind: route.kind,
    description: item.description || summary?.description,
    registry,
    ...previewFacts(item, summary),
  };
}

function previewFacts(item: RegistryCatalogItem, summary?: RegistryItemSummary) {
  return {
    author: item.author || summary?.author,
    fileCount: item.fileCount ?? summary?.files?.length,
    categories: item.categories ?? [],
    themePreview: item.themePreview,
  };
}

function isItemRoute(route: ReturnType<typeof parseCatalogRoute>): route is
  { kind: PreviewRouteKind; namespace: string; slug: string } {
  return route !== null && ['component', 'block', 'page', 'template', 'theme'].includes(route.kind);
}

export function renderCatalogLinkPreview(data: CatalogLinkPreviewData): string {
  const label = data.kind.charAt(0).toUpperCase() + data.kind.slice(1);

  const facts = [
    data.author ? `By ${data.author}` : '',
    data.fileCount !== undefined ? `${data.fileCount} ${data.fileCount === 1 ? 'file' : 'files'}` : '',
    ...data.categories.slice(0, 2),
  ].filter(Boolean);

  return `<div class="catalog-link-preview-content">
    <div class="catalog-link-preview-heading">
      <span class="catalog-link-preview-kind">${escapeHtml(label)}</span>
      <span class="catalog-link-preview-namespace">${escapeHtml(data.namespace)}</span>
    </div>
    <div class="catalog-link-preview-identity">
      ${renderRegistryIcon(data.registry, 'registry-icon catalog-link-preview-icon')}
      <strong>${escapeHtml(data.title)}</strong>
    </div>
    ${data.description ? `<p class="catalog-link-preview-description">${escapeHtml(data.description)}</p>` : ''}
    ${data.kind === 'theme' && data.themePreview ? renderThemePreview(data.themePreview) : ''}
    ${facts.length ? `<div class="catalog-link-preview-facts">${facts.map(fact =>
      `<span>${escapeHtml(fact)}</span>`).join('')}</div>` : ''}
    <span class="catalog-link-preview-footer">Open item details <span aria-hidden="true">↗</span></span>
  </div>`;
}

function renderThemePreview(theme: RegistryThemePreview): string {
  const colors = Object.entries(theme.light ?? {})
    .slice(0, 5)
    .map(([, value]) => value)
    .filter(color => color && /^#[0-9a-f]{3,8}$/i.test(color));

  if (!colors.length) return '';

  return `<div class="catalog-link-preview-swatches" aria-label="Published theme colors">
    ${colors.map(color => `<span style="background-color:${escapeHtml(color)}"></span>`).join('')}
  </div>`;
}

/** The preview is supplementary: all links remain normal, independently useful anchors. */
export function attachCatalogLinkPreviews(
  roots: readonly HTMLElement[],
  resolve: (href: string) => CatalogLinkPreviewData | null,
) {
  let active: HTMLAnchorElement | null = null;
  let previousDescription: string | null = null;
  let pending: number | undefined;
  let preview: HTMLElement | null = null;

  function close(): void {
    window.clearTimeout(pending);
    pending = undefined;

    if (active) {
      if (previousDescription) active.setAttribute('aria-describedby', previousDescription);
      else active.removeAttribute('aria-describedby');
    }

    active = null;
    previousDescription = null;
    preview?.remove();
    preview = null;
  }

  function canPreview(): boolean {
    return window.innerWidth >= 640 && !window.matchMedia?.('(hover: none)').matches;
  }

  function show(anchor: HTMLAnchorElement, immediate = false): void {
    if (!anchor.isConnected) return;
    const details = resolve(anchor.href);

    if (!details) return;

    close();
    active = anchor;
    previousDescription = anchor.getAttribute('aria-describedby');

    const element = document.createElement('div');
    element.id = PREVIEW_ID;
    element.className = immediate ? 'catalog-link-preview catalog-link-preview-instant' : 'catalog-link-preview';
    element.setAttribute('role', 'tooltip');
    element.innerHTML = renderCatalogLinkPreview(details);
    document.body.append(element);
    preview = element;
    anchor.setAttribute('aria-describedby', [previousDescription, PREVIEW_ID].filter(Boolean).join(' '));
    position(anchor, element);
  }

  function triggerFrom(event: Event): HTMLAnchorElement | null {
    const target = event.target;

    if (!(target instanceof Element)) return null;

    return target.closest<HTMLAnchorElement>('a[href]');
  }

  function onPointerOver(event: PointerEvent): void {
    if (event.pointerType === 'touch' || !canPreview()) return;

    const anchor = triggerFrom(event);

    if (!anchor || anchor === active) return;

    close();
    pending = window.setTimeout(() => show(anchor), POINTER_DELAY_MS);
  }

  function onPointerOut(event: PointerEvent): void {
    const anchor = triggerFrom(event);

    if (!anchor) return;

    const next = event.relatedTarget;

    if (next instanceof Node && anchor.contains(next)) return;

    close();
  }

  function onFocusIn(event: FocusEvent): void {
    if (!canPreview()) return;

    const anchor = triggerFrom(event);

    if (anchor) show(anchor, true);
  }

  function onFocusOut(event: FocusEvent): void {
    if (triggerFrom(event)) close();
  }

  for (const root of roots) {
    root.addEventListener('pointerover', onPointerOver);
    root.addEventListener('pointerout', onPointerOut);
    root.addEventListener('focusin', onFocusIn);
    root.addEventListener('focusout', onFocusOut);
  }

  const observer = new MutationObserver(close);

  for (const root of roots) observer.observe(root, { childList: true });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') close();
  });

  document.addEventListener('scroll', close, true);
  window.addEventListener('resize', close);

}

function position(anchor: HTMLAnchorElement, preview: HTMLElement): void {
  const rect = anchor.getBoundingClientRect();
  const margin = 12;
  const width = preview.getBoundingClientRect().width;
  const height = preview.getBoundingClientRect().height;

  const left = Math.max(margin, Math.min(
    rect.left + Math.min(rect.width / 2, 80) - width / 2,
    window.innerWidth - width - margin,
  ));

  const below = window.innerHeight - rect.bottom;
  const above = rect.top;

  const top = below >= height + margin || below >= above
    ? Math.min(window.innerHeight - height - margin, rect.bottom + margin)
    : Math.max(margin, rect.top - height - margin);

  preview.style.left = `${left}px`;
  preview.style.top = `${Math.max(margin, top)}px`;
}
